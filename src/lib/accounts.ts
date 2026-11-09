/**
 * Device accounts. Each account's conversations, journal, notes and mood live in one encrypted
 * "vault" in this browser. The vault is sealed with a random data key (AES-GCM), and that data key
 * is stored sealed under a key derived (PBKDF2) from the password. For password reset by email, a
 * copy of the data key is also kept, encrypted, on Dilo's server (see server/auth.ts); the vault
 * itself never leaves the device.
 */
import { isMoodId } from "./moods";
import { isConversations, isEntries, isNotes, migrateLegacyConversation, newId, type Conversation, type JournalEntry, type Note } from "./journal";
import { deriveKeyFromPassword, openWithKey, sealWithKey, WrongPasswordError, type SealedPayload } from "./lock";
import type { MoodId } from "./translations";

export interface AccountRecord {
  id: string;
  name: string;
  salt: string;
  /** A known value sealed with the password key, used to check the password. */
  check: SealedPayload;
  createdAt: number;
  /** The vault's data key, sealed with the password key. Missing on accounts from before data keys. */
  keys?: {
    password: SealedPayload;
  };
  /** True once a copy of the data key is saved for password reset by email. */
  emailReset?: boolean;
}

export interface Vault {
  conversations: Conversation[];
  activeId: string | null;
  entries: JournalEntry[];
  notes: Note[];
  mood: MoodId | null;
}

export interface Session {
  account: AccountRecord;
  /** The vault's data key (kept in memory only). */
  key: CryptoKey;
  vault: Vault;
}

export class NameTakenError extends Error {}
export { WrongPasswordError };

const ACCOUNTS_KEY = "dilo.accounts";
const vaultKey = (id: string) => `dilo.vault.${id}`;
const CHECK_VALUE = "dilo-account-ok";
export const MIN_NAME_LENGTH = 1;

/** Plain (pre-account) storage keys that are moved into the first account and then removed. */
const LEGACY_KEYS = ["dilo.conversations", "dilo.activeConversation", "dilo.journal", "dilo.notes", "dilo.mood", "dilo.messages"];

export const emptyVault = (): Vault => ({ conversations: [], activeId: null, entries: [], notes: [], mood: null });

const normalize = (name: string) => name.trim().normalize("NFC").toLocaleLowerCase();

const readJSON = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
};

export function listAccounts(): AccountRecord[] {
  const value = readJSON(ACCOUNTS_KEY);
  return Array.isArray(value) ? (value as AccountRecord[]) : [];
}

const saveAccounts = (accounts: AccountRecord[]) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

export const findAccount = (name: string) => listAccounts().find((a) => normalize(a.name) === normalize(name));

/** Keeps only valid parts of a decrypted or legacy vault, so corrupted data never crashes the app. */
export function sanitizeVault(value: unknown): Vault {
  const v = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof Vault, unknown>>;
  const conversations = isConversations(v.conversations) ? v.conversations : [];
  return {
    conversations,
    activeId: typeof v.activeId === "string" && conversations.some((c) => c.id === v.activeId) ? v.activeId : null,
    entries: isEntries(v.entries) ? v.entries : [],
    notes: isNotes(v.notes) ? v.notes : [],
    mood: isMoodId(v.mood) ? v.mood : null,
  };
}

/** Data written before accounts existed, if any. */
function readLegacyVault(): Vault | null {
  const legacy = sanitizeVault({
    conversations: readJSON("dilo.conversations") ?? migrateLegacyConversation(),
    activeId: readJSON("dilo.activeConversation"),
    entries: readJSON("dilo.journal"),
    notes: readJSON("dilo.notes"),
    mood: readJSON("dilo.mood"),
  });
  const hasData = legacy.conversations.length || legacy.entries.length || legacy.notes.length || legacy.mood;
  return hasData ? legacy : null;
}

export const hasLegacyData = () => readLegacyVault() !== null;

// ---------- data keys ----------

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const importDataKey = (raw: Uint8Array) =>
  crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);

/** The data key as base64, for saving the email-reset copy. */
export async function exportDataKey(key: CryptoKey) {
  return toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", key)));
}

/** Seals the data key under a (new) password; returns the fields to store on the account. */
async function sealForPassword(dataKeyB64: string, password: string) {
  const { key, salt } = await deriveKeyFromPassword(password);
  return { salt, check: await sealWithKey(key, CHECK_VALUE), password: await sealWithKey(key, dataKeyB64) };
}

const replaceAccount = (account: AccountRecord) => saveAccounts(listAccounts().map((a) => (a.id === account.id ? account : a)));

export function setEmailReset(accountId: string, on: boolean): AccountRecord | null {
  const current = listAccounts().find((a) => a.id === accountId);
  if (!current) return null;
  const updated = { ...current, emailReset: on };
  replaceAccount(updated);
  return updated;
}

export async function saveVault(session: Pick<Session, "account" | "key">, vault: Vault) {
  const sealed = await sealWithKey(session.key, vault);
  // Never resurrect data the user deleted: a save that finishes (or fires on page unload) after the
  // account or all data was removed must not write the vault back.
  if (!listAccounts().some((a) => a.id === session.account.id)) return;
  localStorage.setItem(vaultKey(session.account.id), JSON.stringify(sealed));
}

export async function createAccount(name: string, password: string): Promise<Session> {
  const trimmed = name.trim();
  if (findAccount(trimmed)) throw new NameTakenError();
  const dataKey = await importDataKey(crypto.getRandomValues(new Uint8Array(32)));
  const pw = await sealForPassword(await exportDataKey(dataKey), password);
  const account: AccountRecord = { id: newId(), name: trimmed, salt: pw.salt, check: pw.check, createdAt: Date.now(), keys: { password: pw.password } };

  // The first account on a device takes over anything written before accounts existed.
  const legacy = listAccounts().length === 0 ? readLegacyVault() : null;
  const vault = legacy ?? emptyVault();

  saveAccounts([...listAccounts(), account]);
  await saveVault({ account, key: dataKey }, vault);
  if (legacy) LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  return { account, key: dataKey, vault };
}

/** Throws WrongPasswordError for an unknown name or a wrong password (deliberately the same error). */
export async function signIn(name: string, password: string): Promise<Session> {
  const account = findAccount(name);
  if (!account) {
    // Spend comparable time so response timing doesn't reveal which names exist.
    await deriveKeyFromPassword(password);
    throw new WrongPasswordError();
  }
  const { key: passwordKey } = await deriveKeyFromPassword(password, account.salt);
  if ((await openWithKey<string>(passwordKey, account.check)) !== CHECK_VALUE) throw new WrongPasswordError();
  const sealed = readJSON(vaultKey(account.id)) as SealedPayload | null;

  if (account.keys) {
    const dataKey = await importDataKey(fromBase64(await openWithKey<string>(passwordKey, account.keys.password)));
    const vault = sealed ? sanitizeVault(await openWithKey(dataKey, sealed)) : emptyVault();
    return { account, key: dataKey, vault };
  }

  // Accounts from before data keys: the vault was sealed with the password key itself.
  // Move it to a data key, so password reset by email can be turned on for it.
  const vault = sealed ? sanitizeVault(await openWithKey(passwordKey, sealed)) : emptyVault();
  const dataKey = await importDataKey(crypto.getRandomValues(new Uint8Array(32)));
  const upgraded: AccountRecord = { ...account, keys: { password: await sealWithKey(passwordKey, await exportDataKey(dataKey)) } };
  // Write the re-sealed vault before switching the account over, so a crash in between never locks the user out.
  localStorage.setItem(vaultKey(account.id), JSON.stringify(await sealWithKey(dataKey, vault)));
  replaceAccount(upgraded);
  return { account: upgraded, key: dataKey, vault };
}

/**
 * Sets a new password with the data key returned after an emailed code was confirmed. All data is kept.
 * Throws WrongPasswordError if there is no such account on this device or the key doesn't open its vault.
 */
export async function resetPasswordWithKey(name: string, dataKeyB64: string, newPassword: string): Promise<Session> {
  const account = findAccount(name);
  if (!account?.keys) throw new WrongPasswordError();
  const dataKey = await importDataKey(fromBase64(dataKeyB64));
  const sealed = readJSON(vaultKey(account.id)) as SealedPayload | null;
  const vault = sealed ? sanitizeVault(await openWithKey(dataKey, sealed)) : emptyVault();
  const pw = await sealForPassword(dataKeyB64, newPassword);
  const updated: AccountRecord = { ...account, salt: pw.salt, check: pw.check, keys: { password: pw.password }, emailReset: true };
  replaceAccount(updated);
  return { account: updated, key: dataKey, vault };
}

/** Removes an account and its vault from this device. */
export function deleteAccount(id: string) {
  saveAccounts(listAccounts().filter((a) => a.id !== id));
  localStorage.removeItem(vaultKey(id));
}
