import { LANGUAGE_CODES, LIMITS, MODES, MOOD_IDS, SUPPORT_STYLES, type ChatErrorKind, type ChatRequest, type ChatTurn } from "../src/lib/chat-types.js";
import { getSystemInstruction } from "../src/lib/prompt.js";
import { detectHarmToOthers } from "../src/lib/crisisDetect.js";

/**
 * Dilo's chat endpoint. It forwards the conversation to an OpenAI-compatible model API hosted in the EU
 * (Scaleway Generative APIs, Paris, by default) and streams the reply back as plain text.
 * Nothing is stored here: no database, no logging of message content.
 */

export interface ChatEnv {
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  /** Total tokens Dilo may ever use (default 900,000, under Scaleway's 1,000,000 free tokens). "off" removes the limit. */
  AI_TOKEN_BUDGET?: string;
  /** Shared counter (Upstash Redis via the Vercel Marketplace sets the KV_* names). */
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
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

// ---------- token budget ----------
// Keeps Dilo inside the provider's free tokens: once the budget is used up, the server stops calling the model
// and the app says Dilo is taking a break. The counter holds a single number and no personal data.

export const DEFAULT_TOKEN_BUDGET = 900_000;
export const BUDGET_KEY = "dilo:ai-tokens-used";

/** null means no limit ("off"); anything unreadable falls back to the safe default. */
export function tokenBudget(env: ChatEnv): number | null {
  const raw = env.AI_TOKEN_BUDGET?.trim().toLowerCase();
  if (raw === "off") return null;
  const n = Number(raw);
  return raw && Number.isFinite(n) && n >= 0 ? n : DEFAULT_TOKEN_BUDGET;
}

export interface TokenCounter {
  /** Adds n (may be negative) and returns the new total. */
  add(n: number): Promise<number>;
}

/** Upstash Redis REST counter, or null when no counter is configured. */
export function createCounter(env: ChatEnv, fetchImpl: typeof fetch = fetch): TokenCounter | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return {
    async add(n) {
      const res = await fetchImpl(url.replace(/\/$/, ""), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(["INCRBY", BUDGET_KEY, String(Math.round(n))]),
      });
      const data = (await res.json()) as { result?: number; error?: string };
      if (!res.ok || typeof data.result !== "number") throw new Error(data.error || `counter ${res.status}`);
      return data.result;
    },
  };
}

/** Cautious token estimate (rounds up generously) used to reserve budget before a request. */
export const estimateTokens = (chars: number) => Math.ceil(chars / 2.5);

// ---------- streaming ----------

/** Turns an OpenAI-style server-sent-events stream into a stream of plain text deltas. */
export function sseToText(
  body: ReadableStream<Uint8Array>,
  onDone?: (result: { usageTokens: number | null; outputChars: number }) => Promise<void> | void,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let usageTokens: number | null = null;
  let outputChars = 0;
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
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) {
              outputChars += delta.length;
              controller.enqueue(encoder.encode(delta));
            }
            const total = parsed?.usage?.total_tokens;
            if (typeof total === "number") usageTokens = total;
          } catch {
            // Ignore keep-alive or malformed lines.
          }
        }
      },
      async flush() {
        try {
          await onDone?.({ usageTokens, outputChars });
        } catch {
          // Never break a finished reply over bookkeeping.
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
  quota_reached: 503,
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

  const messages = buildMessages(chat);
  const inputTokens = estimateTokens(messages.reduce((n, m) => n + m.content.length, 0));

  // Reserve the worst case before calling the model, so even many requests at once can't go over the budget.
  const budget = tokenBudget(env);
  let counter: TokenCounter | null = null;
  let reserved = 0;
  if (budget !== null) {
    counter = createCounter(env, fetchImpl);
    if (!counter) {
      console.error("Token budget is on but no counter is configured (KV_REST_API_URL / KV_REST_API_TOKEN)");
      return fail("not_configured"); // fail closed: never risk paid usage
    }
    reserved = inputTokens + LIMITS.maxReplyTokens;
    let used: number;
    try {
      used = await counter.add(reserved);
    } catch (e) {
      console.error("Token counter error", e);
      return fail("busy");
    }
    if (used > budget) {
      await counter.add(-reserved).catch(() => {});
      return fail("quota_reached");
    }
  }
  const refund = async () => {
    if (counter && reserved) await counter.add(-reserved).catch(() => {});
  };

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${(env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.AI_API_KEY}` },
      body: JSON.stringify({
        model: env.AI_MODEL || DEFAULT_MODEL,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        // Friend replies are looser and more playful; psychological support stays focused.
        temperature: chat.mode === "psychologist" ? 0.6 : 0.85,
        top_p: 0.95,
        max_tokens: LIMITS.maxReplyTokens,
      }),
    });
  } catch {
    await refund();
    return fail("network");
  }
  if (!upstream.ok || !upstream.body) {
    console.error("AI provider error", upstream.status);
    await refund();
    return fail(classifyStatus(upstream.status));
  }

  // Replace the reservation with the real usage (or a cautious estimate if the provider didn't report it).
  const settle = async ({ usageTokens, outputChars }: { usageTokens: number | null; outputChars: number }) => {
    if (!counter) return;
    const actual = usageTokens ?? inputTokens + estimateTokens(outputChars);
    await counter.add(actual - reserved);
  };

  return new Response(sseToText(upstream.body, settle), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
