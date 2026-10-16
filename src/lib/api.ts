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

/** Sends the conversation to Dilo's server and streams the reply through onText. */
export async function chatWithDilo(request: ChatRequest, onText: (text: string) => void): Promise<{ text: string; crisis: boolean; harm: boolean }> {
  if (useMock()) return mockReply(request, onText);

  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, history: trimHistory(request.history) }),
    });
  } catch {
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
