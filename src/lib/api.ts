import {
  CreateWebWorkerMLCEngine,
  deleteModelAllInfoInCache,
  hasModelInCache,
  type AppConfig,
  type ChatCompletionMessageParam,
  type WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";
import { LIMITS, type ChatErrorKind, type ChatRequest, type ChatTurn, type LanguageCode } from "./chat-types";
import { extractCrisis, getSystemInstruction } from "./prompt";

export type { ChatErrorKind, Mode, SupportStyle } from "./chat-types";

export class ChatError extends Error {
  constructor(public kind: ChatErrorKind) {
    super(kind);
  }
}

export const LANGUAGES: { code: LanguageCode; name: string; rtl: boolean }[] = [
  { code: "en", name: "English", rtl: false },
  { code: "tr", name: "Türkçe", rtl: false },
  { code: "de", name: "Deutsch", rtl: false },
  { code: "fr", name: "Français", rtl: false },
  { code: "es", name: "Español", rtl: false },
  { code: "ar", name: "العربية", rtl: true },
  { code: "fa", name: "فارسی", rtl: true },
];

export const getLanguage = (code: string) => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

// ---------- on-device model ----------

/**
 * Qwen3 1.7B (Apache 2.0), quantised for the browser. Weights are downloaded once from Hugging Face
 * after the user agrees, then cached on the device. The model library is served from our own site.
 * Conversations are processed entirely on the device and never sent anywhere.
 */
export const MODEL = {
  id: "Qwen3-1.7B-q4f16_1-MLC",
  name: "Qwen3 1.7B",
  license: "Apache 2.0",
  downloadMB: 1000,
  weightsUrl: "https://huggingface.co/mlc-ai/Qwen3-1.7B-q4f16_1-MLC",
  libPath: "/models/Qwen3-1.7B-q4f16_1_cs1k-webgpu.wasm",
};

const appConfig = (): AppConfig => ({
  model_list: [
    {
      model: MODEL.weightsUrl,
      model_id: MODEL.id,
      model_lib: new URL(MODEL.libPath, window.location.origin).href,
      vram_required_MB: 2036.66,
      low_resource_required: true,
      overrides: { context_window_size: 4096 },
    },
  ],
});

/**
 * Development-only stand-in for the model (open the app with ?mockAI), so the interface can be
 * tested in browsers without WebGPU. `import.meta.env.DEV` is false in production builds, so this
 * code is removed from the published site.
 */
const useMock = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has("mockAI");
const MOCK_CACHE_KEY = "dilo.dev.mockModelCached";

export async function isWebGPUAvailable(): Promise<boolean> {
  if (useMock()) return true;
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    return !!gpu && !!(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

export async function isModelDownloaded(): Promise<boolean> {
  if (useMock()) return localStorage.getItem(MOCK_CACHE_KEY) === "1";
  try {
    return await hasModelInCache(MODEL.id, appConfig());
  } catch {
    return false;
  }
}

let enginePromise: Promise<WebWorkerMLCEngine> | null = null;

/** Downloads (first time) or loads (from the device cache) the model. Progress is 0..1. */
export function loadModel(onProgress: (progress: number) => void): Promise<WebWorkerMLCEngine> {
  if (useMock()) {
    enginePromise ??= (async () => {
      for (let p = 0; p <= 1; p += 0.25) {
        onProgress(p);
        await new Promise((r) => setTimeout(r, 150));
      }
      localStorage.setItem(MOCK_CACHE_KEY, "1");
      return {} as WebWorkerMLCEngine;
    })();
    return enginePromise;
  }
  enginePromise ??= CreateWebWorkerMLCEngine(new Worker(new URL("./llm.worker.ts", import.meta.url), { type: "module" }), MODEL.id, {
    appConfig: appConfig(),
    initProgressCallback: (report) => onProgress(report.progress),
  }).catch((error) => {
    enginePromise = null;
    throw new ChatError(classifyError(error, "download_failed"));
  });
  return enginePromise;
}

/** Removes the downloaded model from this device (used when the user deletes their data). */
export async function deleteModel() {
  try {
    const engine = enginePromise ? await enginePromise.catch(() => null) : null;
    await engine?.unload();
  } catch {
    /* ignore */
  }
  enginePromise = null;
  await deleteModelAllInfoInCache(MODEL.id, appConfig()).catch(() => undefined);
}

function classifyError(error: unknown, fallback: ChatErrorKind): ChatErrorKind {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  if (message.includes("webgpu") && (message.includes("not supported") || message.includes("unavailable"))) return "unsupported";
  if (message.includes("out of memory") || message.includes("device lost") || message.includes("oom")) return "out_of_memory";
  return fallback;
}

// ---------- chat ----------

/** Keeps the most recent turns that fit the model's context window, starting with a user turn. */
export function trimHistory(history: ChatTurn[]): ChatTurn[] {
  const kept: ChatTurn[] = [];
  let total = 0;
  for (let i = history.length - 1; i >= 0 && kept.length < LIMITS.contextTurns; i--) {
    const text = history[i].text.slice(0, LIMITS.maxCharsPerTurn);
    if (kept.length > 0 && total + text.length > LIMITS.maxTotalChars) break;
    total += text.length;
    kept.unshift({ role: history[i].role, text });
  }
  while (kept.length && kept[0].role !== "user") kept.shift();
  return kept;
}

/** Removes any reasoning block the model may emit, including a partial one while streaming. */
export function cleanReply(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*$/, "")
    .trimStart();
}

export function buildMessages(request: ChatRequest): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: getSystemInstruction(request.language, request.mode, request.mood, request.support) },
    ...trimHistory(request.history).map(
      (t): ChatCompletionMessageParam => (t.role === "model" ? { role: "assistant", content: t.text } : { role: "user", content: t.text }),
    ),
  ];
}

/** Generates Dilo's reply on the device, streaming partial text through onText. */
export async function chatWithDilo(request: ChatRequest, onText: (text: string) => void): Promise<{ text: string; crisis: boolean }> {
  if (!enginePromise) throw new ChatError("not_ready");
  if (useMock()) return mockReply(request, onText);
  const engine = await enginePromise;
  let raw = "";
  try {
    const stream = await engine.chat.completions.create({
      messages: buildMessages(request),
      stream: true,
      temperature: request.mode === "psychologist" ? 0.5 : 0.7,
      max_tokens: LIMITS.maxReplyTokens,
      extra_body: { enable_thinking: false },
    });
    for await (const chunk of stream) {
      raw += chunk.choices[0]?.delta?.content ?? "";
      onText(extractCrisis(cleanReply(raw)).text);
    }
  } catch (error) {
    throw new ChatError(classifyError(error, "generation_failed"));
  }
  const { text, crisis } = extractCrisis(cleanReply(raw));
  if (!text) throw new ChatError("generation_failed");
  return { text, crisis };
}

async function mockReply(request: ChatRequest, onText: (text: string) => void) {
  const last = request.history[request.history.length - 1]?.text ?? "";
  if (last.includes("mock-fail")) throw new ChatError("generation_failed");
  const raw = last.includes("mock-crisis")
    ? "[CRISIS]\nI'm really glad you told me. Are you safe right now?"
    : `(${request.support}/${request.mode}) That sounds like a lot to carry. What feels heaviest right now?`;
  let shown = "";
  for (const word of raw.split(" ")) {
    shown += (shown ? " " : "") + word;
    onText(extractCrisis(cleanReply(shown)).text);
    await new Promise((r) => setTimeout(r, 20));
  }
  return extractCrisis(cleanReply(raw));
}
