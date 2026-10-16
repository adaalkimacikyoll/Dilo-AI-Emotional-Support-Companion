import { LANGUAGE_CODES, LIMITS, MODES, MOOD_IDS, SUPPORT_STYLES, type ChatErrorKind, type ChatRequest, type ChatTurn } from "../src/lib/chat-types";
import { getSystemInstruction } from "../src/lib/prompt";
import { detectHarmToOthers } from "../src/lib/crisisDetect";

/**
 * Dilo's chat endpoint. It forwards the conversation to an OpenAI-compatible model API hosted in the EU
 * (Scaleway Generative APIs, Paris, by default) and streams the reply back as plain text.
 * Nothing is stored here: no database, no logging of message content.
 */

export interface ChatEnv {
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
}

export const DEFAULT_BASE_URL = "https://api.scaleway.ai/v1";
/** Google's Gemma 4 (26B MoE, 4B active): fast, strong in all of Dilo's languages. Override with AI_MODEL. */
export const DEFAULT_MODEL = "gemma-4-26b-a4b-it";

// ---------- validation ----------

export function parseChatRequest(body: unknown): ChatRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!LANGUAGE_CODES.includes(b.language as never)) return null;
  if (!MODES.includes(b.mode as never)) return null;
  if (b.support !== undefined && !SUPPORT_STYLES.includes(b.support as never)) return null;
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
    support: (b.support ?? "tips") as ChatRequest["support"],
    mood: (b.mood ?? null) as ChatRequest["mood"],
  };
}

/** System prompt plus the conversation, starting with a user turn. */
export function buildMessages(request: ChatRequest) {
  const recent = request.history.slice(-LIMITS.contextTurns);
  const firstUser = recent.findIndex((m) => m.role === "user");
  return [
    { role: "system" as const, content: getSystemInstruction(request.language, request.mode, request.mood, request.support) },
    ...recent.slice(firstUser).map((t) => ({ role: t.role === "model" ? ("assistant" as const) : ("user" as const), content: t.text })),
  ];
}

// ---------- rate limiting ----------
// Best effort, per server instance. Add a Vercel Firewall rate-limit rule for stronger protection.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export const resetRateLimits = () => hits.clear();

// ---------- streaming ----------

/** Turns an OpenAI-style server-sent-events stream into a stream of plain text deltas. */
export function sseToText(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // Ignore keep-alive or malformed lines.
          }
        }
      },
    }),
  );
}

const STATUS: Record<ChatErrorKind, number> = {
  not_configured: 500,
  rate_limited: 429,
  bad_request: 400,
  network: 502,
  busy: 503,
  generation_failed: 502,
};

const fail = (error: ChatErrorKind) =>
  Response.json({ ok: false, error }, { status: STATUS[error], headers: { "Cache-Control": "no-store" } });

export function classifyStatus(status: number): ChatErrorKind {
  if (status === 401 || status === 403 || status === 404) return "not_configured";
  if (status === 429) return "busy";
  if (status >= 500) return "busy";
  return "generation_failed";
}

/** Web-standard handler, used by the Vercel function and the Vite dev server. */
export async function handleRequest(
  request: Request,
  env: ChatEnv,
  fetchImpl: typeof fetch = fetch,
  options: { rateLimit?: boolean } = {},
): Promise<Response> {
  if (request.method !== "POST") return fail("bad_request");
  if (Number(request.headers.get("content-length") ?? 0) > 200_000) return fail("bad_request");

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (options.rateLimit !== false && isRateLimited(clientKey)) return fail("rate_limited");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request");
  }
  const chat = parseChatRequest(body);
  if (!chat) return fail("bad_request");
  // A conversation in which the user stated an intent to hurt someone is closed for good; the app never sends one,
  // and the server refuses it too.
  if (chat.history.some((t) => t.role === "user" && detectHarmToOthers(t.text))) return fail("bad_request");
  if (!env.AI_API_KEY) return fail("not_configured");

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${(env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.AI_API_KEY}` },
      body: JSON.stringify({
        model: env.AI_MODEL || DEFAULT_MODEL,
        messages: buildMessages(chat),
        stream: true,
        // Friend replies are looser and more playful; psychological support stays focused.
        temperature: chat.mode === "psychologist" ? 0.6 : 0.85,
        top_p: 0.95,
        max_tokens: LIMITS.maxReplyTokens,
      }),
    });
  } catch {
    return fail("network");
  }
  if (!upstream.ok || !upstream.body) {
    console.error("AI provider error", upstream.status);
    return fail(classifyStatus(upstream.status));
  }

  return new Response(sseToText(upstream.body), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
