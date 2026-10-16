import { beforeEach, describe, expect, it } from "vitest";

// Minimal in-memory localStorage for Node.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

import { createAccount, deleteAccount, listAccounts, NameTakenError, saveVault, signIn, WrongPasswordError } from "../src/lib/accounts";

beforeEach(() => store.clear());

const conversation = {
  id: "c1",
  title: "Exams",
  createdAt: 1,
  updatedAt: 2,
  messages: [{ id: "m1", role: "user" as const, text: "I feel overwhelmed by exams", timestamp: 1 }],
};

describe("device accounts", () => {
  it("creates an account, saves an encrypted vault and signs back in", async () => {
    const session = await createAccount("Ada", "secret1");
    await saveVault(session, { ...session.vault, conversations: [conversation], activeId: "c1", mood: "stressed" });

    const raw = [...store.values()].join("\n");
    expect(raw).not.toContain("overwhelmed");
    expect(raw).not.toContain("secret1");

    const again = await signIn("ada", "secret1");
    expect(again.vault.conversations[0].messages[0].text).toBe("I feel overwhelmed by exams");
    expect(again.vault.mood).toBe("stressed");
  });

  it("rejects wrong passwords and unknown names with the same error", async () => {
    await createAccount("Ada", "secret1");
    await expect(signIn("Ada", "wrong")).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(signIn("Nobody", "secret1")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("does not allow two accounts with the same name (case-insensitive)", async () => {
    await createAccount("Ada", "secret1");
    await expect(createAccount(" ada ", "other1")).rejects.toBeInstanceOf(NameTakenError);
  });

  it("keeps accounts separate from each other", async () => {
    const a = await createAccount("Ada", "secret1");
    await saveVault(a, { ...a.vault, conversations: [conversation] });
    await createAccount("Deniz", "secret2");
    const deniz = await signIn("Deniz", "secret2");
    expect(deniz.vault.conversations).toEqual([]);
  });

  it("moves pre-account data into the first account and removes the plain copies", async () => {
    store.set("dilo.conversations", JSON.stringify([conversation]));
    store.set("dilo.notes", JSON.stringify([{ id: "n1", text: "call mum", createdAt: 1, updatedAt: 1 }]));
    const first = await createAccount("Ada", "secret1");
    expect(first.vault.conversations).toHaveLength(1);
    expect(first.vault.notes).toHaveLength(1);
    expect(store.has("dilo.conversations")).toBe(false);
    expect(store.has("dilo.notes")).toBe(false);
    const second = await createAccount("Deniz", "secret2");
    expect(second.vault.conversations).toEqual([]);
  });

  it("deletes an account and its vault", async () => {
    const session = await createAccount("Ada", "secret1");
    deleteAccount(session.account.id);
    expect(listAccounts()).toEqual([]);
    expect([...store.keys()].some((k) => k.startsWith("dilo.vault."))).toBe(false);
    await expect(signIn("Ada", "secret1")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("never writes a vault back after its account was deleted", async () => {
    const session = await createAccount("Ada", "secret1");
    deleteAccount(session.account.id);
    await saveVault(session, { ...session.vault, conversations: [conversation] });
    expect([...store.keys()].some((k) => k.startsWith("dilo.vault."))).toBe(false);
    store.clear();
    await saveVault(session, session.vault);
    expect(store.size).toBe(0);
  });

  it("survives a corrupted vault by opening an empty one instead of crashing", async () => {
    const session = await createAccount("Ada", "secret1");
    await saveVault(session, { conversations: "nonsense", activeId: 5, entries: null, notes: [{}], mood: "angry" } as never);
    const again = await signIn("Ada", "secret1");
    expect(again.vault).toEqual({ conversations: [], activeId: null, entries: [], notes: [], mood: null });
  });
});
