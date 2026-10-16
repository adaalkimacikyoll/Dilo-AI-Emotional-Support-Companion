/**
 * Password-based encryption for locked conversations, using the browser's Web Crypto API.
 * PBKDF2 (SHA-256) derives an AES-GCM key from the user's password; each lock has its own salt and IV.
 * Without the password the content cannot be read, and it cannot be recovered if the password is lost.
 */

export interface LockedPayload {
  v: 1;
  salt: string;
  iv: string;
  data: string;
}

const ITERATIONS = 310_000;
export const MIN_PASSWORD_LENGTH = 4;

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON(value: unknown, password: string): Promise<LockedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  return { v: 1, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(ciphertext) };
}

export class WrongPasswordError extends Error {
  constructor() {
    super("wrong_password");
  }
}

export async function decryptJSON<T>(payload: LockedPayload, password: string): Promise<T> {
  const key = await deriveKey(password, fromBase64(payload.salt));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(payload.iv) as BufferSource }, key, fromBase64(payload.data) as BufferSource);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    // AES-GCM authentication fails when the key (password) is wrong.
    throw new WrongPasswordError();
  }
}

export const isLockedPayload = (v: unknown): v is LockedPayload =>
  !!v &&
  typeof v === "object" &&
  (v as LockedPayload).v === 1 &&
  typeof (v as LockedPayload).salt === "string" &&
  typeof (v as LockedPayload).iv === "string" &&
  typeof (v as LockedPayload).data === "string";
