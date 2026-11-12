/**
 * Small key-value store shared by /api/auth and /api/chat: Upstash Redis in production,
 * memory in tests and local development. Also holds the server secret used to sign and hash.
 */

export interface StoreEnv {
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export interface Store {
  get(key: string): Promise<string | null>;
  /** Returns false when nx is set and the key already exists. */
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean; keepTtl?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Increments and, on the first increment, sets the expiry. */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

export function memoryStore(): Store {
  const data = new Map<string, { value: string; expires: number | null }>();
  const live = (key: string) => {
    const hit = data.get(key);
    if (hit && hit.expires !== null && hit.expires < Date.now()) data.delete(key);
    return data.get(key);
  };
  return {
    async get(key) {
      return live(key)?.value ?? null;
    },
    async set(key, value, opts = {}) {
      const existing = live(key);
      if (opts.nx && existing) return false;
      const expires = opts.keepTtl && existing ? existing.expires : opts.ex ? Date.now() + opts.ex * 1000 : null;
      data.set(key, { value, expires });
      return true;
    },
    async del(key) {
      data.delete(key);
    },
    async incr(key, ttlSeconds) {
      const existing = live(key);
      const next = Number(existing?.value ?? 0) + 1;
      data.set(key, { value: String(next), expires: existing?.expires ?? Date.now() + ttlSeconds * 1000 });
      return next;
    },
  };
}

export function upstashStore(url: string, token: string, fetchImpl: typeof fetch): Store {
  const command = async (args: (string | number)[]) => {
    const res = await fetchImpl(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args.map(String)),
    });
    const data = (await res.json()) as { result?: unknown; error?: string };
    if (!res.ok || data.error) throw new Error(data.error || `store ${res.status}`);
    return data.result;
  };
  return {
    async get(key) {
      const result = await command(["GET", key]);
      return typeof result === "string" ? result : null;
    },
    async set(key, value, opts = {}) {
      const args: (string | number)[] = ["SET", key, value];
      if (opts.ex) args.push("EX", opts.ex);
      if (opts.keepTtl) args.push("KEEPTTL");
      if (opts.nx) args.push("NX");
      return (await command(args)) === "OK";
    },
    async del(key) {
      await command(["DEL", key]);
    },
    async incr(key, ttlSeconds) {
      const n = Number(await command(["INCR", key]));
      if (n === 1) await command(["EXPIRE", key, ttlSeconds]);
      return n;
    },
  };
}

export function createStore(env: StoreEnv, fetchImpl: typeof fetch = fetch): Store | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return upstashStore(url, token, fetchImpl);
  return null;
}

// ---------- crypto ----------

export const enc = new TextEncoder();
export const toB64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");
export const fromB64 = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));
const toHex = (buf: ArrayBuffer) => Buffer.from(buf).toString("hex");

/** One random secret per deployment, created on first use and kept in the store. */
export async function serverSecret(store: Store): Promise<Uint8Array> {
  const key = "dilo:auth:secret";
  let secret = await store.get(key);
  if (!secret) {
    await store.set(key, toB64(crypto.getRandomValues(new Uint8Array(32))), { nx: true });
    secret = await store.get(key);
  }
  if (!secret) throw new Error("no secret");
  return fromB64(secret);
}

export async function hmac(secret: Uint8Array, label: string, value: string) {
  const key = await crypto.subtle.importKey("raw", secret as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${label}:${value}`)));
}

/** Constant-time comparison of two strings. */
export const sameText = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
