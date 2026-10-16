import { GoogleGenAI } from "@google/genai";
import {
  LANGUAGE_CODES,
  LIMITS,
  MODES,
  MOOD_IDS,
  type ChatErrorKind,
  type ChatRequest,
  type ChatResponse,
  type ChatTurn,
} from "../shared/chat-types";
import { extractCrisis, getSystemInstruction } from "./prompt";

const DEFAULT_MODEL = "gemini-3.8-flash";

export interface GenerateParams {
  model: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  systemInstruction: string;
  temperature: number;
}
export type Generate = (params: GenerateParams) => Promise<string>;

export interface ChatEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

// ---------- validation ----------

export function parseChatRequest(body: unknown): ChatRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!LANGUAGE_CODES.includes(b.language as never)) return null;
  if (!MODES.includes(b.mode as never)) return null;
  if (b.mood !== null && b.mood !== undefined && !MOOD_IDS.includes(b.mood as never)) return null;
  if (!Array.isArray(b.history) || b.history.length === 0 || b.history.length > LIMITS.maxTurns) return null;

  let total = 0;
  const history: ChatTurn[] = [];
  for (const turn of b.history) {
    if (!turn || typeof turn !== "object") return null;
    const { role, text } = turn as Record<string, unknown>;
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > LIMITS.maxCharsPerTurn) return null;
    total += trimmed.length;
    history.push({ role, text: trimmed });
  }
  if (total > LIMITS.maxTotalChars) return null;
  if (history[history.length - 1].role !== "user") return null;

  return {
    history,
    language: b.language as ChatRequest["language"],
    mode: b.mode as ChatRequest["mode"],
    mood: (b.mood ?? null) as ChatRequest["mood"],
  };
}

/** Gemini expects the conversation to begin with a user turn. */
export function toContents(history: ChatTurn[]) {
  const recent = history.slice(-LIMITS.contextTurns);
  const firstUser = recent.findIndex((m) => m.role === "user");
  return recent.slice(firstUser === -1 ? recent.length : firstUser).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

export function classifyError(error: unknown): ChatErrorKind {
  const status = (error as { status?: number })?.status;
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  if (status === 401 || status === 403 || message.includes("api key not valid") || message.includes("permission")) return "invalid_key";
  if (status === 429 || message.includes("quota") || message.includes("resource_exhausted")) return "quota";
  if (message.includes("fetch failed") || message.includes("network") || message.includes("econn")) return "network";
  return "unknown";
}

// ---------- rate limiting ----------
// Best effort: limits are per server instance. For stronger protection, add a Vercel Firewall rate-limit rule.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export function resetRateLimits() {
  hits.clear();
}

// ---------- core ----------

const STATUS: Record<ChatErrorKind, number> = {
  missing_key: 500,
  invalid_key: 502,
  quota: 503,
  rate_limited: 429,
  bad_request: 400,
  network: 502,
  unknown: 502,
};

const geminiGenerate =
  (apiKey: string): Generate =>
  async ({ model, contents, systemInstruction, temperature }) => {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({ model, contents, config: { systemInstruction, temperature } });
    return response.text ?? "";
  };

export async function handleChat(
  body: unknown,
  env: ChatEnv,
  clientKey: string,
  generate?: Generate,
): Promise<{ status: number; body: ChatResponse }> {
  const fail = (error: ChatErrorKind) => ({ status: STATUS[error], body: { ok: false as const, error } });

  if (isRateLimited(clientKey)) return fail("rate_limited");
  const request = parseChatRequest(body);
  if (!request) return fail("bad_request");
  if (!env.GEMINI_API_KEY && !generate) return fail("missing_key");

  const run = generate ?? geminiGenerate(env.GEMINI_API_KEY!);
  try {
    const raw = await run({
      model: env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: toContents(request.history),
      systemInstruction: getSystemInstruction(request.language, request.mode, request.mood),
      temperature: request.mode === "reflective" ? 0.5 : 0.7,
    });
    const { text, crisis } = extractCrisis(raw);
    if (!text) return fail("unknown");
    return { status: 200, body: { ok: true, text, crisis } };
  } catch (error) {
    console.error("Gemini request failed:", error);
    return fail(classifyError(error));
  }
}

/** Web-standard handler used by the Vercel function and the Vite dev server. */
export async function handleRequest(request: Request, env: ChatEnv, generate?: Generate): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "bad_request" }, { status: 405, headers: { Allow: "POST" } });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 200_000) return Response.json({ ok: false, error: "bad_request" }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const result = await handleChat(body, env, clientKey, generate);
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
