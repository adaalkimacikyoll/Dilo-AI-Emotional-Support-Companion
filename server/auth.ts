import { LANGUAGE_CODES, type LanguageCode } from "../src/lib/chat-types.js";
import nodemailer from "nodemailer";
import { EMAIL_TEXTS } from "../src/lib/email-texts.js";
import { createStore, enc, fromB64, hmac, sameText, serverSecret, toB64, type Store } from "./store.js";
export { memoryStore, type Store } from "./store.js";

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
 * Plain email addresses are never stored; they are used only to send the email (via Gmail, or Brevo).
 */

export interface AuthEnv {
  /** Gmail account that sends the codes (like the portfolio site's contact form). */
  GMAIL_USER?: string;
  /** 16-character Google app password for GMAIL_USER (not the normal password). */
  GMAIL_APP_PASSWORD?: string;
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  /** Alternative to Gmail. */
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

// ---------- crypto ----------

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

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const emailConfigured = (env: AuthEnv) => !!(env.GMAIL_USER && env.GMAIL_APP_PASSWORD) || !!(env.BREVO_API_KEY && env.MAIL_FROM);

function buildEmail(to: string, code: string, purpose: "verify" | "reset", language: LanguageCode): OutgoingEmail {
  const t = EMAIL_TEXTS[language] ?? EMAIL_TEXTS.en;
  const lead = purpose === "verify" ? t.verifyLead : t.resetLead;
  return {
    to,
    subject: t.subject.replace("{code}", code),
    text: `${lead}\n\n${code}\n\n${t.validity}\n${t.ignore}\n\nDilo`,
    html: `<div style="font-family:Georgia,serif;color:#292524;max-width:480px">
<p>${lead}</p>
<p style="font-size:32px;letter-spacing:6px;font-weight:bold;margin:24px 0">${code}</p>
<p>${t.validity}</p><p style="color:#78716c">${t.ignore}</p>
<p style="color:#78716c">Dilo</p></div>`,
  };
}

/** Sends through Gmail (app password) when configured, otherwise through Brevo's API. */
async function deliver(env: AuthEnv, fetchImpl: typeof fetch, mail: OutgoingEmail) {
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD } });
    await transporter.sendMail({ from: `"Dilo" <${env.GMAIL_USER}>`, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
    return;
  }
  const res = await fetchImpl(`${(env.BREVO_BASE_URL || "https://api.brevo.com").replace(/\/$/, "")}/v3/smtp/email`, {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { name: "Dilo", email: env.MAIL_FROM }, to: [{ email: mail.to }], subject: mail.subject, textContent: mail.text, htmlContent: mail.html }),
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
  options: { store?: Store; rateLimit?: boolean; send?: (mail: OutgoingEmail) => Promise<void> } = {},
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
        if (!options.send && !emailConfigured(env)) {
          console.error("Email not configured (GMAIL_USER / GMAIL_APP_PASSWORD)");
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
          const mail = buildEmail(email, code, purpose, language);
          await (options.send ? options.send(mail) : deliver(env, fetchImpl, mail));
        } catch (e) {
          console.error("Email sending failed", e instanceof Error ? e.message : e);
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
