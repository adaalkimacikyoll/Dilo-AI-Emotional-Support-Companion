import { describe, expect, it, vi } from "vitest";
import { handleAuth, memoryStore, type Store } from "../server/auth";

const env = { BREVO_API_KEY: "brevo", MAIL_FROM: "dilo@example.com" };
const dataKey = Buffer.from(new Uint8Array(32).fill(7)).toString("base64");

function setup() {
  const store: Store = memoryStore();
  const sent: { to: string; subject: string; code: string }[] = [];
  const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    sent.push({ to: body.to[0].email, subject: body.subject, code: /(\d{6})/.exec(body.textContent)![1] });
    return new Response("{}", { status: 201 });
  });
  let ip = 1;
  const call = async (body: Record<string, unknown>, sameIp = false) => {
    const req = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": sameIp ? "9.9.9.9" : `10.0.0.${ip++}` },
      body: JSON.stringify(body),
    });
    const res = await handleAuth(req, env, fetchImpl, { store });
    return { status: res.status, body: (await res.json()) as Record<string, string> };
  };
  return { store, sent, fetchImpl, call };
}

async function signUp(t: ReturnType<typeof setup>, email = "Ada@Example.com") {
  await t.call({ action: "send-code", purpose: "verify", email, language: "tr" });
  const code = t.sent.at(-1)!.code;
  const verified = await t.call({ action: "verify-email", email, code });
  return t.call({ action: "save-key", email, token: verified.body.token, dataKey });
}

describe("email codes and password reset", () => {
  it("sends a code in the user's language and verifies the email", async () => {
    const t = setup();
    expect((await t.call({ action: "send-code", purpose: "verify", email: "ada@example.com", language: "tr" })).body.ok).toBe(true);
    expect(t.sent[0].to).toBe("ada@example.com");
    expect(t.sent[0].subject).toContain("Dilo kodun");
    const ok = await t.call({ action: "verify-email", email: "ada@example.com", code: t.sent[0].code });
    expect(ok.body.token).toBeTruthy();
    // A code works only once.
    expect((await t.call({ action: "verify-email", email: "ada@example.com", code: t.sent[0].code })).body.error).toBe("invalid_code");
  });

  it("resets with an emailed code and returns the saved data key", async () => {
    const t = setup();
    expect((await signUp(t)).body.ok).toBe(true);
    await t.call({ action: "send-code", purpose: "reset", email: "ada@example.com", language: "en" });
    expect(t.sent).toHaveLength(2);
    const res = await t.call({ action: "reset", email: "ADA@example.com", code: t.sent[1].code });
    expect(res.body.dataKey).toBe(dataKey);
  });

  it("never stores a plain email address or data key", async () => {
    const t = setup();
    const written: string[] = [];
    const inner = t.store;
    t.store.set = ((orig) => async (key: string, value: string, opts?: Parameters<Store["set"]>[2]) => {
      written.push(key, value);
      return orig.call(inner, key, value, opts);
    })(t.store.set);
    await signUp(t);
    const all = written.join("\n").toLowerCase();
    expect(written.length).toBeGreaterThan(0);
    expect(all).not.toContain("ada@example.com");
    expect(all).not.toContain(dataKey.toLowerCase());
  });

  it("doesn't reveal whether an email has an account", async () => {
    const t = setup();
    const res = await t.call({ action: "send-code", purpose: "reset", email: "nobody@example.com", language: "en" });
    expect(res.body.ok).toBe(true);
    expect(t.sent).toHaveLength(0);
  });

  it("rejects wrong codes and locks a code after 5 tries", async () => {
    const t = setup();
    await signUp(t);
    await t.call({ action: "send-code", purpose: "reset", email: "ada@example.com" });
    const right = t.sent.at(-1)!.code;
    const wrong = right === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) expect((await t.call({ action: "reset", email: "ada@example.com", code: wrong })).body.error).toBe("invalid_code");
    expect((await t.call({ action: "reset", email: "ada@example.com", code: right })).body.error).toBe("invalid_code");
  });

  it("won't save a key without a valid token", async () => {
    const t = setup();
    expect((await t.call({ action: "save-key", email: "ada@example.com", token: "123.abc", dataKey })).body.error).toBe("invalid_code");
    await t.call({ action: "send-code", purpose: "verify", email: "ada@example.com" });
    const { body } = await t.call({ action: "verify-email", email: "ada@example.com", code: t.sent[0].code });
    // A token for one email can't be used for another.
    expect((await t.call({ action: "save-key", email: "eve@example.com", token: body.token, dataKey })).body.error).toBe("invalid_code");
  });

  it("limits how many codes one email can request", async () => {
    const t = setup();
    for (let i = 0; i < 5; i++) expect((await t.call({ action: "send-code", purpose: "verify", email: "ada@example.com" })).status).toBe(200);
    expect((await t.call({ action: "send-code", purpose: "verify", email: "ada@example.com" })).body.error).toBe("rate_limited");
  });

  it("deletes the saved key only for its owner", async () => {
    const t = setup();
    await signUp(t);
    const other = Buffer.from(new Uint8Array(32).fill(9)).toString("base64");
    await t.call({ action: "delete-key", email: "ada@example.com", dataKey: other });
    await t.call({ action: "send-code", purpose: "reset", email: "ada@example.com" });
    expect(t.sent).toHaveLength(2); // still there, so a reset email was sent
    await t.call({ action: "delete-key", email: "ada@example.com", dataKey });
    await t.call({ action: "send-code", purpose: "reset", email: "ada@example.com" });
    expect(t.sent).toHaveLength(2); // gone, so no email
  });

  it("refuses to work without email settings or a store", async () => {
    const t = setup();
    const req = () => new Request("http://localhost/api/auth", { method: "POST", body: JSON.stringify({ action: "send-code", purpose: "verify", email: "a@b.de" }) });
    expect((await handleAuth(req(), {}, t.fetchImpl, { store: t.store })).status).toBe(500);
    expect((await handleAuth(req(), env, t.fetchImpl)).status).toBe(500);
  });
});
