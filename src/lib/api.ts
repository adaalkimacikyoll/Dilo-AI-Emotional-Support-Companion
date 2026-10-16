import { LIMITS, type ChatErrorKind, type ChatRequest, type ChatResponse, type ChatTurn, type LanguageCode } from "../../shared/chat-types";

export type { ChatErrorKind, Mode } from "../../shared/chat-types";

export class ChatError extends Error {
  constructor(public kind: ChatErrorKind) {
    super(kind);
  }
}

export const LANGUAGES: { code: LanguageCode; name: string; speechLocale: string; rtl: boolean }[] = [
  { code: "en", name: "English", speechLocale: "en-US", rtl: false },
  { code: "tr", name: "Türkçe", speechLocale: "tr-TR", rtl: false },
  { code: "de", name: "Deutsch", speechLocale: "de-DE", rtl: false },
  { code: "fr", name: "Français", speechLocale: "fr-FR", rtl: false },
  { code: "es", name: "Español", speechLocale: "es-ES", rtl: false },
  { code: "ar", name: "العربية", speechLocale: "ar-SA", rtl: true },
  { code: "fa", name: "فارسی", speechLocale: "fa-IR", rtl: true },
];

export const getLanguage = (code: string) => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

/** Keeps the most recent turns that fit the server's limits, starting with a user turn. */
export function trimHistory(history: ChatTurn[]): ChatTurn[] {
  const kept: ChatTurn[] = [];
  let total = 0;
  for (let i = history.length - 1; i >= 0 && kept.length < LIMITS.contextTurns; i--) {
    const text = history[i].text.slice(0, LIMITS.maxCharsPerTurn);
    if (total + text.length > LIMITS.maxTotalChars) break;
    total += text.length;
    kept.unshift({ role: history[i].role, text });
  }
  while (kept.length && kept[0].role !== "user") kept.shift();
  return kept;
}

/** Calls Dilo's server endpoint. The Gemini key never reaches the browser. */
export async function chatWithDilo(request: ChatRequest): Promise<{ text: string; crisis: boolean }> {
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

  let data: ChatResponse | null = null;
  try {
    data = (await response.json()) as ChatResponse;
  } catch {
    // Non-JSON response, e.g. a platform error page.
  }
  if (!data) throw new ChatError(response.status === 429 ? "rate_limited" : "unknown");
  if ("error" in data) throw new ChatError(data.error);
  return { text: data.text, crisis: data.crisis };
}
