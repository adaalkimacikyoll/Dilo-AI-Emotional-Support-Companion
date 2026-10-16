import { afterEach, describe, expect, it } from "vitest";
import {
  isConversations,
  isEntries,
  isNotes,
  lockConversation,
  migrateLegacyConversation,
  titleFrom,
  unlockConversation,
  type Conversation,
} from "../src/lib/journal";
import { decryptJSON, encryptJSON, WrongPasswordError } from "../src/lib/lock";

const conversation: Conversation = {
  id: "c1",
  title: "I've been feeling overwhelmed",
  createdAt: 1,
  updatedAt: 2,
  messages: [
    { id: "m1", role: "user", text: "I've been feeling overwhelmed", timestamp: 1 },
    { id: "m2", role: "model", text: "Are you safe right now?", timestamp: 2, crisis: true },
  ],
};

describe("encryption", () => {
  it("round-trips data with the right password", async () => {
    const locked = await encryptJSON({ hello: "dünya", n: 1 }, "s3cret");
    expect(await decryptJSON(locked, "s3cret")).toEqual({ hello: "dünya", n: 1 });
  });

  it("rejects a wrong password", async () => {
    const locked = await encryptJSON({ a: 1 }, "right");
    await expect(decryptJSON(locked, "wrong")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("uses a fresh salt and IV every time", async () => {
    const a = await encryptJSON("same", "pw");
    const b = await encryptJSON("same", "pw");
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });

  it("handles large conversations", async () => {
    const big = "x".repeat(300_000);
    expect(await decryptJSON(await encryptJSON(big, "pw"), "pw")).toBe(big);
  });
});

describe("locking conversations", () => {
  it("hides title and messages, keeps dates, and unlocks back to the original", async () => {
    const locked = await lockConversation(conversation, "1234");
    expect(locked.title).toBe("");
    expect(locked.messages).toEqual([]);
    expect(locked.updatedAt).toBe(2);
    expect(JSON.stringify(locked)).not.toContain("overwhelmed");
    expect(isConversations([locked])).toBe(true);

    const unlocked = await unlockConversation(locked, "1234");
    expect(unlocked).toEqual(conversation);
    expect(unlocked.lock).toBeUndefined();
  });

  it("does not unlock with the wrong password", async () => {
    const locked = await lockConversation(conversation, "1234");
    await expect(unlockConversation(locked, "4321")).rejects.toBeInstanceOf(WrongPasswordError);
  });
});

describe("validators", () => {
  it("accepts valid data and rejects corrupted data", () => {
    expect(isConversations([conversation])).toBe(true);
    expect(isConversations([{ ...conversation, messages: [{ role: "user" }] }])).toBe(false);
    expect(isEntries([{ id: "e", title: "", body: "x", mood: "sad", createdAt: 1, updatedAt: 1 }])).toBe(true);
    expect(isEntries([{ id: "e", title: "", body: "x", mood: "angry", createdAt: 1, updatedAt: 1 }])).toBe(false);
    expect(isNotes([{ id: "n", text: "call mum", createdAt: 1, updatedAt: 1 }])).toBe(true);
    expect(isNotes([{ id: "n", createdAt: 1, updatedAt: 1 }])).toBe(false);
  });
});

describe("titleFrom", () => {
  it("collapses whitespace and shortens long text", () => {
    expect(titleFrom("  hello\n\nthere ")).toBe("hello there");
    const long = titleFrom("a".repeat(100));
    expect(long.length).toBe(60);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("migrateLegacyConversation", () => {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Pick<Storage, "getItem"> }).localStorage = { getItem: (k: string) => store.get(k) ?? null };
  afterEach(() => store.clear());

  it("turns the old single chat into a saved conversation", () => {
    store.set(
      "dilo.messages",
      JSON.stringify([
        { id: "a", role: "model", text: "Hi", timestamp: 10 },
        { id: "b", role: "user", text: "Exams are stressing me out", timestamp: 20 },
      ]),
    );
    const [migrated] = migrateLegacyConversation();
    expect(migrated.title).toBe("Exams are stressing me out");
    expect(migrated.messages).toHaveLength(2);
    expect(isConversations([migrated])).toBe(true);
  });

  it("returns nothing when there is no old chat or it has no user message", () => {
    expect(migrateLegacyConversation()).toEqual([]);
    store.set("dilo.messages", JSON.stringify([{ id: "a", role: "model", text: "Hi", timestamp: 1 }]));
    expect(migrateLegacyConversation()).toEqual([]);
  });
});
