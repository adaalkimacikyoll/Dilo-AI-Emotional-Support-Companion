import { LANGUAGE_CODES, type LanguageCode } from "../src/lib/chat-types.js";
import { EMAIL_TEXTS } from "../src/lib/email-texts.js";

/**
 * Password reset by email.
 *
 * Accounts and their encrypted vaults stay on the user's device. To let a user who forgot their
 * password back in without losing data, the server keeps one thing per account: the vault's data key,
 * encrypted with a server secret, under an HMAC of the email address. The vault itself never reaches
 * the server, so the server alone can't read anything, and the device alone can't open the vault
 * without the password or this key.
 *
 *  - send-code   emails a 6-digit code (purpose "verify" at sign-up, "reset" for a forgotten password)
 *  - verify-email checks a sign-up code and returns a short-lived token that allows saving the key
 *  - save-key    stores the encrypted data key (needs that token)
 *  - reset       checks a reset code and returns the data key so the device can set a new password
 *  - delete-key  removes the stored key when an account is deleted (needs the key itself)
 *
 * Plain email addresses are never stored; they are used only to send the email (via Brevo).
 */

export interface AuthEnv {
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  BREVO_API_KEY?: string;
  /** Verified sender address in Brevo. */
  MAIL_FROM?: string;
  /** Override for tests and local development. */
  BREVO_BASE_URL?: string;
  /** Local development only: keep everything in memory instead of Redis. */
  AUTH_MEMORY_STORE?: string;
}

export type AuthErrorKind = "bad_request" | "rate_limited" | "invalid_code" | "not_configured" | "busy";

const CODE_TTL_S = 10 * 60;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LIMITS = { perEmailPerHour: 5, perIpPerHour: 20, perDay: 250 }; // Brevo's free plan sends 300 a day

// ---------- storage ----------

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

function upstashStore(url: string, token: string, fetchImpl: typeof fetch): Store {
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

export function createStore(env: AuthEnv, fetchImpl: typeof fetch = fetch): Store | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return upstashStore(url, token, fetchImpl);
  return null;
}

// ---------- crypto ----------

const enc = new TextEncoder();
const toB64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");
const fromB64 = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));
const toHex = (buf: ArrayBuffer) => Buffer.from(buf).toString("hex");

/** One random secret per deployment, created on first use and kept in the store. */
async function serverSecret(store: Store): Promise<Uint8Array> {
  const key = "dilo:auth:secret";
  let secret = await store.get(key);
  if (!secret) {
    await store.set(key, toB64(crypto.getRandomValues(new Uint8Array(32))), { nx: true });
    secret = await store.get(key);
  }
  if (!secret) throw new Error("no secret");
  return fromB64(secret);
}

async function hmac(secret: Uint8Array, label: string, value: string) {
  const key = await crypto.subtle.importKey("raw", secret as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${label}:${value}`)));
}

async function escrowKey(secret: Uint8Array) {
  const material = await crypto.subtle.digest("SHA-256", new Uint8Array([...secret, ...enc.encode("dilo-escrow-v1")]));
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function sealKey(secret: Uint8Array, dataKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await escrowKey(secret), enc.encode(dataKey)));
  return JSON.stringify({ iv: toB64(iv), data: toB64(data) });
}

async function openKey(secret: Uint8Array, sealed: string): Promise<string> {
  const { iv, data } = JSON.parse(sealed) as { iv: string; data: string };
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) as BufferSource }, await escrowKey(secret), fromB64(data) as BufferSource);
  return new TextDecoder().decode(plain);
}

const sameText = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

// ---------- helpers ----------

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const isDataKey = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9+/]{43}=$/.test(v); // 32 bytes, base64
const isCode = (v: unknown): v is string => typeof v === "string" && /^\d{6}$/.test(v.trim());

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: AuthErrorKind) =>
  json({ bad_request: 400, rate_limited: 429, invalid_code: 400, not_configured: 500, busy: 503 }[error], { ok: false, error });

const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

async function sendEmail(env: AuthEnv, fetchImpl: typeof fetch, to: string, code: string, purpose: "verify" | "reset", language: LanguageCode) {
  const t = EMAIL_TEXTS[language] ?? EMAIL_TEXTS.en;
  const lead = purpose === "verify" ? t.verifyLead : t.resetLead;
  const subject = t.subject.replace("{code}", code);
  const text = `${lead}\n\n${code}\n\n${t.validity}\n${t.ignore}\n\nDilo`;
  const html = `<div style="font-family:Georgia,serif;color:#292524;max-width:480px">
<p>${lead}</p>
<p style="font-size:32px;letter-spacing:6px;font-weight:bold;margin:24px 0">${code}</p>
<p>${t.validity}</p><p style="color:#78716c">${t.ignore}</p>
<p style="color:#78716c">Dilo</p></div>`;
  const res = await fetchImpl(`${(env.BREVO_BASE_URL || "https://api.brevo.com").replace(/\/$/, "")}/v3/smtp/email`, {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Dilo", email: env.MAIL_FROM }, to: [{ email: to }], subject, textContent: text, htmlContent: html }),
  });
  if (!res.ok) {
    console.error("Email provider error", res.status, (await res.text()).slice(0, 200));
    throw new Error("email failed");
  }
}

/** Checks a code once; wrong guesses count against it and it's gone after success or too many tries. */
async function checkCode(store: Store, secret: Uint8Array, purpose: string, emailHash: string, code: string) {
  const key = `dilo:auth:code:${purpose}:${emailHash}`;
  const raw = await store.get(key);
  if (!raw) return false;
  const saved = JSON.parse(raw) as { hash: string; attempts: number };
  if (sameText(saved.hash, await hmac(secret, "code", `${emailHash}:${code.trim()}`))) {
    await store.del(key);
    return true;
  }
  if (saved.attempts + 1 >= MAX_ATTEMPTS) await store.del(key);
  else await store.set(key, JSON.stringify({ ...saved, attempts: saved.attempts + 1 }), { keepTtl: true });
  return false;
}

// ---------- handler ----------

export async function handleAuth(
  request: Request,
  env: AuthEnv,
  fetchImpl: typeof fetch = fetch,
  options: { store?: Store; rateLimit?: boolean } = {},
): Promise<Response> {
  if (request.method !== "POST") return fail("bad_request");
  if (Number(request.headers.get("content-length") ?? 0) > 10_000) return fail("bad_request");

  const store = options.store ?? createStore(env, fetchImpl);
  if (!store) {
    console.error("Auth store not configured (KV_REST_API_URL / KV_REST_API_TOKEN)");
    return fail("not_configured");
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("bad_request");
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!isEmail(email)) return fail("bad_request");

  let secret: Uint8Array;
  try {
    secret = await serverSecret(store);
  } catch (e) {
    console.error("Auth store error", e);
    return fail("busy");
  }
  const emailHash = await hmac(secret, "email", email);
  const escrowKeyName = `dilo:auth:escrow:${emailHash}`;

  try {
    switch (body.action) {
      case "send-code": {
        const purpose = body.purpose === "reset" ? "reset" : body.purpose === "verify" ? "verify" : null;
        if (!purpose) return fail("bad_request");
        if (!env.BREVO_API_KEY || !env.MAIL_FROM) {
          console.error("Email not configured (BREVO_API_KEY / MAIL_FROM)");
          return fail("not_configured");
        }
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
        const day = new Date().toISOString().slice(0, 10);
        const limit = options.rateLimit !== false; // off only in local development
        if (limit && (await store.incr(`dilo:auth:rl:email:${emailHash}`, 3600)) > LIMITS.perEmailPerHour) return fail("rate_limited");
        if (limit && (await store.incr(`dilo:auth:rl:ip:${await hmac(secret, "ip", ip)}`, 3600)) > LIMITS.perIpPerHour) return fail("rate_limited");
        // For a reset, only email people who actually have a saved key. The answer is the same either way,
        // so nobody can find out which addresses use Dilo.
        if (purpose === "reset" && !(await store.get(escrowKeyName))) return json(200, { ok: true });
        if (limit && (await store.incr(`dilo:auth:daily:${day}`, 2 * 86400)) > LIMITS.perDay) return fail("busy");

        const code = newCode();
        await store.set(`dilo:auth:code:${purpose}:${emailHash}`, JSON.stringify({ hash: await hmac(secret, "code", `${emailHash}:${code}`), attempts: 0 }), { ex: CODE_TTL_S });
        const language = LANGUAGE_CODES.includes(body.language as never) ? (body.language as LanguageCode) : "en";
        try {
          await sendEmail(env, fetchImpl, email, code, purpose, language);
        } catch {
          return fail("busy");
        }
        return json(200, { ok: true });
      }

      case "verify-email": {
        if (!isCode(body.code)) return fail("invalid_code");
        if (!(await checkCode(store, secret, "verify", emailHash, body.code))) return fail("invalid_code");
        const expires = Date.now() + TOKEN_TTL_MS;
        return json(200, { ok: true, token: `${expires}.${await hmac(secret, "token", `${emailHash}:${expires}`)}` });
      }

      case "save-key": {
        const [expires, signature] = typeof body.token === "string" ? body.token.split(".") : [];
        if (!expires || !signature || Number(expires) < Date.now()) return fail("invalid_code");
        if (!sameText(signature, await hmac(secret, "token", `${emailHash}:${expires}`))) return fail("invalid_code");
        if (!isDataKey(body.dataKey)) return fail("bad_request");
        await store.set(escrowKeyName, await sealKey(secret, body.dataKey));
        return json(200, { ok: true });
      }

      case "reset": {
        if (!isCode(body.code)) return fail("invalid_code");
        if (!(await checkCode(store, secret, "reset", emailHash, body.code))) return fail("invalid_code");
        const sealed = await store.get(escrowKeyName);
        if (!sealed) return fail("invalid_code");
        return json(200, { ok: true, dataKey: await openKey(secret, sealed) });
      }

      case "delete-key": {
        if (!isDataKey(body.dataKey)) return fail("bad_request");
        const sealed = await store.get(escrowKeyName);
        // Only someone who already has the key (the signed-in owner) can remove it.
        if (sealed && sameText(await openKey(secret, sealed), body.dataKey)) await store.del(escrowKeyName);
        return json(200, { ok: true });
      }

      default:
        return fail("bad_request");
    }
  } catch (e) {
    console.error("Auth error", e);
    return fail("busy");
  }
}
