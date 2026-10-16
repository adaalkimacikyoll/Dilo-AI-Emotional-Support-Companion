import type { MoodId } from "./translations";
import type { Mode } from "./chat-types";
import { isMoodId } from "./moods";
import { decryptJSON, encryptJSON, isLockedPayload, type LockedPayload } from "./lock";

export interface StoredMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  crisis?: boolean;
  /** Conversation style that produced a Dilo reply. */
  mode?: Mode;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
  /** When set, title and messages are encrypted here and the plain fields are empty. */
  lock?: LockedPayload;
}

/** Free writing. Never sent to the AI. */
export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood: MoodId | null;
  createdAt: number;
  updatedAt: number;
}

/** Short personal notes. Never sent to the AI. */
export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export const isMessage = (m: unknown): m is StoredMessage =>
  isObj(m) && isStr(m.id) && isStr(m.text) && (m.role === "user" || m.role === "model") && isNum(m.timestamp);

export const isConversations = (v: unknown): v is Conversation[] =>
  Array.isArray(v) &&
  v.every(
    (c) =>
      isObj(c) &&
      isStr(c.id) &&
      isStr(c.title) &&
      isNum(c.createdAt) &&
      isNum(c.updatedAt) &&
      Array.isArray(c.messages) &&
      c.messages.every(isMessage) &&
      (c.lock === undefined || isLockedPayload(c.lock)),
  );

export const isEntries = (v: unknown): v is JournalEntry[] =>
  Array.isArray(v) &&
  v.every((e) => isObj(e) && isStr(e.id) && isStr(e.title) && isStr(e.body) && (e.mood === null || isMoodId(e.mood)) && isNum(e.createdAt) && isNum(e.updatedAt));

export const isNotes = (v: unknown): v is Note[] =>
  Array.isArray(v) && v.every((n) => isObj(n) && isStr(n.id) && isStr(n.text) && isNum(n.createdAt) && isNum(n.updatedAt));

/** A conversation's title is the start of its first user message. */
export function titleFrom(text: string, max = 60) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

/**
 * Earlier versions stored a single conversation under "dilo.messages".
 * Turn it into the first saved conversation so nobody loses their chat.
 * Pure (no side effects) so it is safe in React initializers; the caller removes the old key.
 */
export function migrateLegacyConversation(): Conversation[] {
  try {
    const raw = localStorage.getItem("dilo.messages");
    if (!raw) return [];
    const messages = JSON.parse(raw);
    if (!Array.isArray(messages)) return [];
    const valid = messages
      .filter((m) => isObj(m) && isStr(m.id) && isStr(m.text) && (m.role === "user" || m.role === "model"))
      .map((m) => ({ ...m, timestamp: isNum(m.timestamp) ? m.timestamp : Date.now() })) as StoredMessage[];
    const firstUser = valid.find((m) => m.role === "user");
    if (!firstUser) return [];
    return [
      {
        id: newId(),
        title: titleFrom(firstUser.text),
        createdAt: valid[0].timestamp,
        updatedAt: valid[valid.length - 1].timestamp,
        messages: valid,
      },
    ];
  } catch {
    return [];
  }
}

// ---------- locking ----------

interface LockedContent {
  title: string;
  messages: StoredMessage[];
}

/** Encrypts the title and messages with the password. Dates stay visible so the list can be sorted. */
export async function lockConversation(conversation: Conversation, password: string): Promise<Conversation> {
  const lock = await encryptJSON({ title: conversation.title, messages: conversation.messages } satisfies LockedContent, password);
  return { ...conversation, title: "", messages: [], lock };
}

/** Throws WrongPasswordError if the password doesn't match. */
export async function unlockConversation(conversation: Conversation, password: string): Promise<Conversation> {
  if (!conversation.lock) return conversation;
  const content = await decryptJSON<LockedContent>(conversation.lock, password);
  const { lock: _lock, ...rest } = conversation;
  return { ...rest, title: content.title, messages: content.messages };
}
