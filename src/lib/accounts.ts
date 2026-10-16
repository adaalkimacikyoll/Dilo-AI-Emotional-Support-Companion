/**
 * Device accounts. Each account's conversations, journal, notes and mood live in one encrypted
 * "vault" in this browser, sealed with a key derived from the account password (PBKDF2 + AES-GCM).
 * Nothing is sent to a server. Without the password a vault cannot be opened or recovered.
 */
import { isMoodId } from "./moods";
import { isConversations, isEntries, isNotes, migrateLegacyConversation, newId, type Conversation, type JournalEntry, type Note } from "./journal";
import { deriveKeyFromPassword, openWithKey, sealWithKey, WrongPasswordError, type SealedPayload } from "./lock";
import type { MoodId } from "./translations";

export interface AccountRecord {
  id: string;
  name: string;
  salt: string;
  /** A known value sealed with the account key, used to check the password. */
  check: SealedPayload;
  createdAt: number;
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
  const { key, salt } = await deriveKeyFromPassword(password);
  const account: AccountRecord = { id: newId(), name: trimmed, salt, check: await sealWithKey(key, CHECK_VALUE), createdAt: Date.now() };

  // The first account on a device takes over anything written before accounts existed.
  const legacy = listAccounts().length === 0 ? readLegacyVault() : null;
  const vault = legacy ?? emptyVault();

  saveAccounts([...listAccounts(), account]);
  await saveVault({ account, key }, vault);
  if (legacy) LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  return { account, key, vault };
}

/** Throws WrongPasswordError for an unknown name or a wrong password (deliberately the same error). */
export async function signIn(name: string, password: string): Promise<Session> {
  const account = findAccount(name);
  if (!account) {
    // Spend comparable time so response timing doesn't reveal which names exist.
    await deriveKeyFromPassword(password);
    throw new WrongPasswordError();
  }
  const { key } = await deriveKeyFromPassword(password, account.salt);
  if ((await openWithKey<string>(key, account.check)) !== CHECK_VALUE) throw new WrongPasswordError();
  const sealed = readJSON(vaultKey(account.id)) as SealedPayload | null;
  const vault = sealed ? sanitizeVault(await openWithKey(key, sealed)) : emptyVault();
  return { account, key, vault };
}

/** Removes an account and its vault from this device. */
export function deleteAccount(id: string) {
  saveAccounts(listAccounts().filter((a) => a.id !== id));
  localStorage.removeItem(vaultKey(id));
}
