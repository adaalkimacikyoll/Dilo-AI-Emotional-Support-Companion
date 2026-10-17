import { describe, expect, it, vi } from "vitest";

// The WebLLM runtime needs a browser with WebGPU; these tests cover everything around it.
vi.mock("@mlc-ai/web-llm", () => ({
  CreateWebWorkerMLCEngine: vi.fn(),
  deleteModelAllInfoInCache: vi.fn(),
  hasModelInCache: vi.fn(),
}));

import { buildMessages, cleanReply, MODEL, trimHistory } from "../src/lib/api";
import { LIMITS, type ChatRequest } from "../src/lib/chat-types";
import { detectCrisis } from "../src/lib/crisisDetect";
import { hasPlaceholders, LEGAL } from "../src/lib/legal";
import { extractCrisis, getSystemInstruction } from "../src/lib/prompt";

const request: ChatRequest = {
  history: [
    { role: "model", text: "Hi, I'm Dilo." },
    { role: "user", text: "I feel stressed about exams" },
  ],
  language: "tr",
  mode: "psychologist",
  support: "listen",
  mood: "stressed",
};

describe("getSystemInstruction", () => {
  it("names the reply language, mood and safety marker", () => {
    const prompt = getSystemInstruction("tr", "psychologist", "stressed", "tips");
    expect(prompt).toContain("always reply in Turkish");
    expect(prompt).toContain("current mood as: stressed");
    expect(prompt).toContain("Mode: Psychological support");
    expect(prompt).toContain("[CRISIS]");
    expect(prompt).toContain("Do not use emojis");
  });

  it("never lets the AI present itself as a psychologist", () => {
    const prompt = getSystemInstruction("en", "psychologist", null, "listen");
    expect(prompt).toContain("not a psychologist or psychotherapist");
    expect(prompt).toContain("Never claim to be a psychologist");
    expect(prompt).toContain("never diagnose");
    expect(prompt).not.toMatch(/you are a psychologist/i);
  });

  it("listen mode always replies, invites the user to continue, and gives no advice", () => {
    const listen = getSystemInstruction("en", "friendly", null, "listen");
    expect(listen).toContain("Always reply");
    expect(listen).toContain("End every reply by inviting them to keep talking");
    expect(listen).toContain("Do not give suggestions");
    expect(listen).not.toContain("Listen and suggest");
  });

  it("tips mode asks for suggestions, with techniques in psychological support mode", () => {
    const tips = getSystemInstruction("en", "psychologist", null, "tips");
    expect(tips).toContain("Response type: Listen and suggest");
    expect(tips).toContain("grounding");
  });

  it("omits the mood line when no mood is set", () => {
    expect(getSystemInstruction("en", "friendly", null, "tips")).not.toContain("current mood");
  });
});

describe("extractCrisis", () => {
  it.each([
    ["[CRISIS]\nI'm really glad you told me.", true],
    ["**[CRISIS]**\nI'm really glad you told me.", true],
    ["I'm really glad you told me. [CRISIS]", true],
    ["I'm really glad you told me.", false],
  ])("handles %j", (raw, crisis) => {
    const result = extractCrisis(raw);
    expect(result.crisis).toBe(crisis);
    expect(result.text).toBe("I'm really glad you told me.");
  });
});

describe("detectCrisis (keyword safety net)", () => {
  it.each([
    "I want to kill myself",
    "sometimes I think about suicide",
    "I don't want to live anymore",
    "Bazen intihar etmeyi düşünüyorum",
    "ölmek istiyorum",
    "kendime zarar veriyorum",
    "Ich will nicht mehr leben",
    "Ich denke an Suizid",
    "j'ai envie de mourir",
    "quiero morir",
    "أريد أن أموت",
    "به خودکشی فکر می‌کنم",
  ])("flags %j", (text) => {
    expect(detectCrisis(text)).toBe(true);
  });

  it.each(["I'm tired after exams", "Sınavlar yüzünden stresliyim", "Ich bin müde", "This movie killed it", "Bugün çok yoruldum"])(
    "does not flag %j",
    (text) => {
      expect(detectCrisis(text)).toBe(false);
    },
  );
});

describe("trimHistory", () => {
  it("keeps recent turns within the context budget and starts with a user turn", () => {
    const long = Array.from({ length: 60 }, (_, i) => ({ role: (i % 2 ? "model" : "user") as "user" | "model", text: `m${i}` }));
    const trimmed = trimHistory(long);
    expect(trimmed.length).toBeLessThanOrEqual(LIMITS.contextTurns);
    expect(trimmed[0].role).toBe("user");
    expect(trimmed.at(-1)?.text).toBe("m59");
  });

  it("stays under the total character budget but always keeps the latest message", () => {
    const big = Array.from({ length: 10 }, () => ({ role: "user" as const, text: "x".repeat(4000) }));
    const trimmed = trimHistory(big);
    expect(trimmed.length).toBe(1);
    expect(trimmed[0].text.length).toBe(LIMITS.maxCharsPerTurn);
  });
});

describe("cleanReply", () => {
  it("removes complete and partial reasoning blocks", () => {
    expect(cleanReply("<think>\n\n</think>\n\nHello")).toBe("Hello");
    expect(cleanReply("<think>secret")).toBe("");
    expect(cleanReply("Hi there")).toBe("Hi there");
  });
});

describe("buildMessages", () => {
  it("adds the system prompt and maps roles for the model", () => {
    const messages = buildMessages(request);
    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "I feel stressed about exams" });
    expect(messages).toHaveLength(2);
  });
});

describe("model", () => {
  it("uses an Apache-2.0 model whose library is served from our own site", () => {
    expect(MODEL.license).toBe("Apache 2.0");
    expect(MODEL.libPath.startsWith("/")).toBe(true);
  });
});

describe("legal texts", () => {
  it("covers every page in German and English and mentions the key facts", () => {
    for (const lang of ["de", "en"] as const) {
      expect(LEGAL[lang].imprint).toContain("5 DDG");
      expect(LEGAL[lang].privacy).toContain("Hugging Face");
      expect(LEGAL[lang].privacy).toContain("Vercel");
      expect(LEGAL[lang].privacy).toMatch(/Art\. 9/);
      expect(LEGAL[lang].terms).toContain("112");
      expect(LEGAL[lang].terms).toContain("18");
    }
  });

  it("reports operator placeholders that must be filled in before publishing", () => {
    expect(typeof hasPlaceholders()).toBe("boolean");
  });
});

describe("parseProgress", () => {
  it("reads megabytes and stage from WebLLM status text", async () => {
    const { parseProgress } = await import("../src/lib/api");
    expect(parseProgress({ progress: 0, text: "Fetching param cache[0/30]: 0MB fetched. 0% completed, 3 secs elapsed." })).toEqual({ progress: 0, stage: "download", mb: 0 });
    expect(parseProgress({ progress: 0.2, text: "Fetching param cache[3/30]: 211MB fetched. 21% completed" })).toEqual({ progress: 0.2, stage: "download", mb: 211 });
    expect(parseProgress({ progress: 0.5, text: "Loading model from cache[15/30]: 480MB loaded. 50% completed" }).stage).toBe("load");
    expect(parseProgress({ progress: 0, text: "Start to fetch params" }).mb).toBeNull();
  });
});

import { isRepeat } from "../src/lib/api";

describe("isRepeat", () => {
  const earlier = ["Aww no, my poor thing. Come here. You've got this."];
  it("catches identical and near-identical replies", () => {
    expect(isRepeat("Aww no, my poor thing. Come here. You've got this.", earlier)).toBe(true);
    expect(isRepeat("Aww no my poor thing, come here! You've totally got this.", earlier)).toBe(true);
  });
  it("lets genuinely different replies through", () => {
    expect(isRepeat("Hey, of course you do. Remember last month when you thought the same and nailed it?", earlier)).toBe(false);
    expect(isRepeat("Anything", [])).toBe(false);
  });
});
