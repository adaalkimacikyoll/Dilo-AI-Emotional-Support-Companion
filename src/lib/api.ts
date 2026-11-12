import { CONSENT_VERSION } from "./operator";
import { LIMITS, type ChatErrorKind, type ChatRequest, type ChatTurn, type LanguageCode } from "./chat-types";
import { cleanReply, extractCrisis } from "./prompt";

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
  { code: "el", name: "Ελληνικά", rtl: false },
  { code: "ar", name: "العربية", rtl: true },
  { code: "fa", name: "فارسی", rtl: true },
];

export const getLanguage = (code: string) => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

/** Shown in settings and the legal pages. */
export const AI_PROVIDER = { name: "Scaleway Generative APIs", location: "Paris (EU)" };

/** Keeps the most recent turns that fit the server's limits, starting with a user turn. */
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

/** Development-only stand-in for the server (open the app with ?mockAI). Removed from production builds. */
const useMock = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has("mockAI");

async function mockReply(request: ChatRequest, onText: (text: string) => void) {
  const last = request.history[request.history.length - 1]?.text ?? "";
  if (last.includes("mock-fail")) throw new ChatError("generation_failed");
  const raw = last.includes("mock-crisis")
    ? "[CRISIS]\nI'm really glad you told me. Are you safe right now?"
    : last.includes("mock-harm")
    ? "[HARM]\nI can't continue this conversation. Please call 112 if anyone is in danger."
    : `(${request.support}/${request.mode}) That sounds like a lot to carry. What feels heaviest right now?`;
  let shown = "";
  for (const word of raw.split(" ")) {
    shown += (shown ? " " : "") + word;
    onText(extractCrisis(cleanReply(shown)).text);
    await new Promise((r) => setTimeout(r, 15));
  }
  return extractCrisis(cleanReply(raw));
}

/** Lower-case words without punctuation, for comparing replies. */
const words = (text: string) => text.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

/** True when a reply is the same as, or barely different from, an earlier one (same opening or mostly the same words). */
export function isRepeat(reply: string, earlier: string[]): boolean {
  const a = words(reply);
  if (a.length === 0) return false;
  const setA = new Set(a);
  return earlier.some((prev) => {
    const b = words(prev);
    if (b.length === 0) return false;
    if (a.slice(0, 5).join(" ") === b.slice(0, 5).join(" ")) return true;
    const setB = new Set(b);
    const shared = [...setA].filter((w) => setB.has(w)).length;
    return shared / new Set([...setA, ...setB]).size >= 0.6;
  });
}

/** Sends the conversation to Dilo's server and streams the reply through onText. Asks once more if the reply repeats an earlier one. */
export async function chatWithDilo(request: ChatRequest, onText: (text: string) => void): Promise<{ text: string; crisis: boolean; harm: boolean }> {
  if (useMock()) return mockReply(request, onText);
  const earlier = request.history.filter((t) => t.role === "model").map((t) => t.text).slice(-6);
  const first = await requestOnce(request, onText);
  if (first.crisis || first.harm || !isRepeat(first.text, earlier)) return first;
  onText("");
  try {
    return await requestOnce(request, onText);
  } catch {
    return first;
  }
}

// Short-lived token from the server, given for the current consent version. Kept in memory only.
let session: { token: string; expires: number } | null = null;

async function getSession(fresh = false): Promise<string> {
  if (!fresh && session && session.expires - Date.now() > 60_000) return session.token;
  session = null;
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "session", consent: { version: CONSENT_VERSION, adult: true } }),
  });
  const data = (await response.json().catch(() => ({}))) as { token?: string; expires?: number; error?: ChatErrorKind };
  if (!response.ok || typeof data.token !== "string" || typeof data.expires !== "number") {
    throw new ChatError(data.error ?? (response.status === 429 ? "rate_limited" : "generation_failed"));
  }
  session = { token: data.token, expires: data.expires };
  return session.token;
}

async function requestOnce(request: ChatRequest, onText: (text: string) => void): Promise<{ text: string; crisis: boolean; harm: boolean }> {
  const send = async (fresh: boolean) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Dilo-Session": await getSession(fresh) },
      body: JSON.stringify({ ...request, history: trimHistory(request.history) }),
    });

  let response: Response;
  try {
    response = await send(false);
    // The token expired or the server's secret changed: get a new one and ask once more.
    if (response.status === 401) response = await send(true);
  } catch (err) {
    if (err instanceof ChatError) throw err;
    throw new ChatError("network");
  }

  if (!response.ok || !response.body) {
    let kind: ChatErrorKind = response.status === 429 ? "rate_limited" : "generation_failed";
    try {
      const data = (await response.json()) as { error?: ChatErrorKind };
      if (data.error) kind = data.error;
    } catch {
      // Non-JSON error page.
    }
    throw new ChatError(kind);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      onText(extractCrisis(cleanReply(raw)).text);
    }
  } catch {
    throw new ChatError("network");
  }

  const result = extractCrisis(cleanReply(raw));
  if (!result.text) throw new ChatError("generation_failed");
  return result;
}
