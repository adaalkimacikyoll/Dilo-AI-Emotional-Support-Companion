import type { LanguageCode } from "./chat-types";

/** Client for /api/auth: emailed codes for sign-up and for password reset. See server/auth.ts. */

export type AuthErrorKind = "bad_request" | "rate_limited" | "invalid_code" | "not_configured" | "busy" | "network";

export class AuthError extends Error {
  constructor(public kind: AuthErrorKind) {
    super(kind);
  }
}

async function call<T extends Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new AuthError("network");
  }
  let data: { ok?: boolean; error?: AuthErrorKind } & Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON error page.
  }
  if (!res.ok || !data.ok) throw new AuthError(data.error ?? (res.status === 429 ? "rate_limited" : "busy"));
  return data as T;
}

export const sendCode = (email: string, purpose: "verify" | "reset", language: LanguageCode) =>
  call({ action: "send-code", email, purpose, language });

/** Returns a short-lived token that allows saving the data key for this email. */
export const verifyEmail = async (email: string, code: string) => (await call<{ token: string }>({ action: "verify-email", email, code })).token;

export const saveResetKey = (email: string, token: string, dataKey: string) => call({ action: "save-key", email, token, dataKey });

/** Returns the account's data key after the emailed reset code is confirmed. */
export const resetWithCode = async (email: string, code: string) => (await call<{ dataKey: string }>({ action: "reset", email, code })).dataKey;

export const deleteResetKey = (email: string, dataKey: string) => call({ action: "delete-key", email, dataKey });
