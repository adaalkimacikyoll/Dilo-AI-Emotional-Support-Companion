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

import { isStrongPassword, passwordChecks } from "../src/lib/lock";

describe("password rules", () => {
  it("needs 8+ characters, a number and a special character", () => {
    expect(isStrongPassword("Sunny!2026")).toBe(true);
    expect(isStrongPassword("Gün3ş!ab")).toBe(true);
    expect(isStrongPassword("secret1")).toBe(false);
    expect(isStrongPassword("longpassword!")).toBe(false);
    expect(isStrongPassword("longpassword1")).toBe(false);
    expect(isStrongPassword("ab1!")).toBe(false);
    expect(passwordChecks("ğüşöçıİĞ1")).toEqual({ length: true, number: true, special: false });
  });
});

import { generateRecoveryCode, newRecoveryCode, normalizeRecoveryCode, resetPassword } from "../src/lib/accounts";
import { deriveKeyFromPassword, sealWithKey } from "../src/lib/lock";

describe("recovery codes", () => {
  it("look like five groups of five unambiguous characters", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}(-[A-HJ-NP-Z2-9]{5}){4}$/);
    expect(generateRecoveryCode()).not.toBe(code);
    expect(normalizeRecoveryCode(" k7qpm-2xwrt ")).toBe("K7QPM2XWRT");
  });

  it("are shown once at sign-up and never stored in plain text", async () => {
    const session = await createAccount("Ada", "Sunny!2026");
    expect(session.recoveryCode).toBeTruthy();
    expect(JSON.stringify([...store.values()])).not.toContain(normalizeRecoveryCode(session.recoveryCode!));
    expect((await signIn("Ada", "Sunny!2026")).recoveryCode).toBeUndefined();
  });

  it("reset the password and keep all data", async () => {
    const session = await createAccount("Ada", "Sunny!2026");
    await saveVault(session, { ...session.vault, conversations: [conversation] });

    const reset = await resetPassword("ada", session.recoveryCode!.toLowerCase(), "Ocean#2027");
    expect(reset.vault.conversations[0].title).toBe("Exams");
    expect(reset.recoveryCode).toBeTruthy();
    expect(reset.recoveryCode).not.toBe(session.recoveryCode);

    await expect(signIn("Ada", "Sunny!2026")).rejects.toBeInstanceOf(WrongPasswordError);
    expect((await signIn("Ada", "Ocean#2027")).vault.conversations[0].title).toBe("Exams");
    // The used code no longer works; the new one does.
    await expect(resetPassword("Ada", session.recoveryCode!, "Other#2028")).rejects.toBeInstanceOf(WrongPasswordError);
    expect((await resetPassword("Ada", reset.recoveryCode!, "Other#2028")).vault.conversations).toHaveLength(1);
  });

  it("reject a wrong code or unknown name with the same error", async () => {
    await createAccount("Ada", "Sunny!2026");
    await expect(resetPassword("Ada", generateRecoveryCode(), "Ocean#2027")).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(resetPassword("Nobody", generateRecoveryCode(), "Ocean#2027")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("can be replaced while signed in", async () => {
    const session = await createAccount("Ada", "Sunny!2026");
    const { recoveryCode } = await newRecoveryCode(session);
    await expect(resetPassword("Ada", session.recoveryCode!, "Ocean#2027")).rejects.toBeInstanceOf(WrongPasswordError);
    expect((await resetPassword("Ada", recoveryCode, "Ocean#2027")).account.name).toBe("Ada");
  });

  it("are added to accounts created before recovery codes, keeping their data", async () => {
    // Old format: vault sealed directly with the password key, no data key.
    const { key, salt } = await deriveKeyFromPassword("secret1");
    const old = { id: "old1", name: "Deniz", salt, check: await sealWithKey(key, "dilo-account-ok"), createdAt: 1 };
    store.set("dilo.accounts", JSON.stringify([old]));
    store.set("dilo.vault.old1", JSON.stringify(await sealWithKey(key, { conversations: [conversation], activeId: null, entries: [], notes: [], mood: null })));

    const upgraded = await signIn("Deniz", "secret1");
    expect(upgraded.recoveryCode).toBeTruthy();
    expect(upgraded.vault.conversations[0].title).toBe("Exams");
    expect(listAccounts()[0].keys).toBeTruthy();

    // Password still works, and so does the new recovery code.
    expect((await signIn("Deniz", "secret1")).vault.conversations).toHaveLength(1);
    expect((await resetPassword("Deniz", upgraded.recoveryCode!, "Ocean#2027")).vault.conversations).toHaveLength(1);
  });
});
