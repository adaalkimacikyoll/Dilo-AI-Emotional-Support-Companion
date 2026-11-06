/**
 * Device accounts. Each account's conversations, journal, notes and mood live in one encrypted
 * "vault" in this browser. The vault is sealed with a random data key (AES-GCM). That data key is
 * stored twice, each copy sealed with a key derived (PBKDF2) from a secret only the user has:
 * the password, and a recovery code shown once at sign-up. Either one can open the vault, so a
 * forgotten password can be replaced with the recovery code. Nothing is sent to a server.
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
  /** The vault's data key, sealed once with the password key and once with the recovery-code key. Missing on accounts created before recovery codes. */
  keys?: {
    password: SealedPayload;
    recovery: SealedPayload;
    recoverySalt: string;
  };
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
  /** A newly created recovery code that the user must see and save once. */
  recoveryCode?: string;
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

const findAccount = (name: string) => listAccounts().find((a) => normalize(a.name) === normalize(name));

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

// ---------- data keys and recovery codes ----------

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to avoid mix-ups

/** 25 random characters (125 bits) in five groups, e.g. "K7QPM-2XWRT-...". */
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(25));
  const chars = [...bytes].map((b) => RECOVERY_ALPHABET[b % 32]);
  return [0, 5, 10, 15, 20].map((i) => chars.slice(i, i + 5).join("")).join("-");
}

/** Ignores spaces, dashes and letter case, so the code can be typed however it was written down. */
export const normalizeRecoveryCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const importDataKey = (raw: Uint8Array) =>
  crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);

async function exportDataKey(key: CryptoKey) {
  return toBase64(new Uint8Array(await crypto.subtle.exportKey("raw", key)));
}

/** A new recovery code with the data key sealed under it. */
async function sealForRecovery(dataKeyB64: string) {
  const recoveryCode = generateRecoveryCode();
  const { key, salt } = await deriveKeyFromPassword(normalizeRecoveryCode(recoveryCode));
  return { recoveryCode, recovery: await sealWithKey(key, dataKeyB64), recoverySalt: salt };
}

/** Seals the data key under a (new) password; returns the fields to store on the account. */
async function sealForPassword(dataKeyB64: string, password: string) {
  const { key, salt } = await deriveKeyFromPassword(password);
  return { salt, check: await sealWithKey(key, CHECK_VALUE), password: await sealWithKey(key, dataKeyB64) };
}

const replaceAccount = (account: AccountRecord) => saveAccounts(listAccounts().map((a) => (a.id === account.id ? account : a)));

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
  const dataKeyB64 = await exportDataKey(dataKey);
  const pw = await sealForPassword(dataKeyB64, password);
  const rc = await sealForRecovery(dataKeyB64);
  const account: AccountRecord = {
    id: newId(),
    name: trimmed,
    salt: pw.salt,
    check: pw.check,
    createdAt: Date.now(),
    keys: { password: pw.password, recovery: rc.recovery, recoverySalt: rc.recoverySalt },
  };

  // The first account on a device takes over anything written before accounts existed.
  const legacy = listAccounts().length === 0 ? readLegacyVault() : null;
  const vault = legacy ?? emptyVault();

  saveAccounts([...listAccounts(), account]);
  await saveVault({ account, key: dataKey }, vault);
  if (legacy) LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  return { account, key: dataKey, vault, recoveryCode: rc.recoveryCode };
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

  // Accounts from before recovery codes: the vault was sealed with the password key itself.
  // Move it to a data key and create a recovery code, which the user is shown once.
  const vault = sealed ? sanitizeVault(await openWithKey(passwordKey, sealed)) : emptyVault();
  const dataKey = await importDataKey(crypto.getRandomValues(new Uint8Array(32)));
  const dataKeyB64 = await exportDataKey(dataKey);
  const rc = await sealForRecovery(dataKeyB64);
  const upgraded: AccountRecord = {
    ...account,
    keys: { password: await sealWithKey(passwordKey, dataKeyB64), recovery: rc.recovery, recoverySalt: rc.recoverySalt },
  };
  // Write the re-sealed vault before switching the account over, so a crash in between never locks the user out.
  localStorage.setItem(vaultKey(account.id), JSON.stringify(await sealWithKey(dataKey, vault)));
  replaceAccount(upgraded);
  return { account: upgraded, key: dataKey, vault, recoveryCode: rc.recoveryCode };
}

/**
 * Sets a new password using the recovery code. All data is kept. The used recovery code is replaced
 * by a new one, returned in the session for the user to save. Throws WrongPasswordError for an unknown
 * name or a wrong code.
 */
export async function resetPassword(name: string, recoveryCode: string, newPassword: string): Promise<Session> {
  const account = findAccount(name);
  if (!account?.keys) {
    await deriveKeyFromPassword(normalizeRecoveryCode(recoveryCode));
    throw new WrongPasswordError();
  }
  const { key: recoveryKey } = await deriveKeyFromPassword(normalizeRecoveryCode(recoveryCode), account.keys.recoverySalt);
  const dataKeyB64 = await openWithKey<string>(recoveryKey, account.keys.recovery);
  const dataKey = await importDataKey(fromBase64(dataKeyB64));
  const sealed = readJSON(vaultKey(account.id)) as SealedPayload | null;
  const vault = sealed ? sanitizeVault(await openWithKey(dataKey, sealed)) : emptyVault();

  const pw = await sealForPassword(dataKeyB64, newPassword);
  const rc = await sealForRecovery(dataKeyB64);
  const updated: AccountRecord = {
    ...account,
    salt: pw.salt,
    check: pw.check,
    keys: { password: pw.password, recovery: rc.recovery, recoverySalt: rc.recoverySalt },
  };
  replaceAccount(updated);
  return { account: updated, key: dataKey, vault, recoveryCode: rc.recoveryCode };
}

/** Replaces the recovery code of a signed-in account (the old one stops working). */
export async function newRecoveryCode(session: Pick<Session, "account" | "key">): Promise<{ account: AccountRecord; recoveryCode: string }> {
  const current = listAccounts().find((a) => a.id === session.account.id);
  if (!current?.keys) throw new Error("Account has no data key");
  const rc = await sealForRecovery(await exportDataKey(session.key));
  const updated: AccountRecord = { ...current, keys: { ...current.keys, recovery: rc.recovery, recoverySalt: rc.recoverySalt } };
  replaceAccount(updated);
  return { account: updated, recoveryCode: rc.recoveryCode };
}

/** Removes an account and its vault from this device. */
export function deleteAccount(id: string) {
  saveAccounts(listAccounts().filter((a) => a.id !== id));
  localStorage.removeItem(vaultKey(id));
}
