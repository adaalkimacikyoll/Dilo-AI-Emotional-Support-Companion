import { GoogleGenAI } from "@google/genai";
import type { LanguageCode } from "./translations";

export type Mode = "friendly" | "reflective";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export type ChatErrorKind = "missing_key" | "invalid_key" | "quota" | "network" | "unknown";

export class ChatError extends Error {
  constructor(public kind: ChatErrorKind, message?: string) {
    super(message ?? kind);
  }
}

// The key is injected at build time from .env.local (see vite.config.ts).
// Never hardcode a key here: anything in this file ships to the browser.
const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/** Max number of past turns sent to the model, to keep latency and cost predictable. */
const MAX_HISTORY_TURNS = 30;

/** The model starts its reply with this marker when it detects a risk situation. */
export const CRISIS_MARKER = "[CRISIS]";

export const LANGUAGES: { code: LanguageCode; name: string; englishName: string; speechLocale: string; rtl: boolean }[] = [
  { code: "en", name: "English", englishName: "English", speechLocale: "en-US", rtl: false },
  { code: "tr", name: "Türkçe", englishName: "Turkish", speechLocale: "tr-TR", rtl: false },
  { code: "de", name: "Deutsch", englishName: "German", speechLocale: "de-DE", rtl: false },
  { code: "fr", name: "Français", englishName: "French", speechLocale: "fr-FR", rtl: false },
  { code: "es", name: "Español", englishName: "Spanish", speechLocale: "es-ES", rtl: false },
  { code: "ar", name: "العربية", englishName: "Arabic", speechLocale: "ar-SA", rtl: true },
  { code: "fa", name: "فارسی", englishName: "Persian", speechLocale: "fa-IR", rtl: true },
];

export const getLanguage = (code: string) => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

const MODE_INSTRUCTIONS: Record<Mode, string> = {
  friendly: `Mode: Friendly.
Talk like a warm, grounded friend: casual, plain language, short paragraphs. Listen first, reflect back what you heard, and only then offer an idea or two if it seems welcome.`,
  reflective: `Mode: Reflective.
Use a calm, structured, counselling-informed style. Use open questions, reflective listening and gentle summaries, and help the user notice thoughts, feelings and needs. You may draw on well-established, low-risk self-help techniques (for example paced breathing, grounding, cognitive reframing, behavioural activation, journaling) and name them plainly. You are not a psychologist or therapist and must never claim to be one, diagnose, or suggest medication.`,
};

export function getSystemInstruction(language: LanguageCode, mode: Mode, moodLabel: string | null) {
  const lang = getLanguage(language);
  return `You are Dilo, an AI emotional support companion. You are an AI, not a human and not a licensed mental health professional. If asked, say so honestly.

${MODE_INSTRUCTIONS[mode]}

Language: always reply in ${lang.englishName}, even if the user writes in another language, unless they explicitly ask you to switch.
${moodLabel ? `\nThe user has marked their current mood as: ${moodLabel}. Take this into account, but don't assume it explains everything.\n` : ""}
Style:
- Validate feelings without exaggerating or minimising them. Avoid clichés and toxic positivity.
- Keep replies focused: usually 2 to 5 short paragraphs or a short list. Ask at most one question per reply.
- Offer concrete, realistic suggestions (activities, rest, food and drink, connecting with people) only when they fit what the user said.
- Use Markdown sparingly (short lists, occasional bold). Do not use emojis.
- Don't give medical, legal or medication advice; for persistent or worsening difficulties, encourage talking to a doctor, counsellor or psychotherapist.

Safety (highest priority):
- If the user mentions suicidal thoughts, self-harm, wanting to die, being in danger from someone else, intending to harm someone, or a medical emergency, start your reply with the exact text ${CRISIS_MARKER} on its own line. The app will then show local crisis lines next to your message.
- In that case, respond with care, take it seriously, ask directly whether they are safe right now, and encourage them to contact emergency services or a crisis line, or a trusted person nearby. Do not provide any information about methods of self-harm.
- Never use the marker in any other situation.`;
}

function toContents(history: ChatTurn[]) {
  const recent = history.slice(-MAX_HISTORY_TURNS);
  // Gemini expects the conversation to begin with a user turn.
  const firstUser = recent.findIndex((m) => m.role === "user");
  return recent.slice(firstUser === -1 ? recent.length : firstUser).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

function classifyError(error: unknown): ChatErrorKind {
  const status = (error as { status?: number })?.status;
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  if (status === 401 || status === 403 || message.includes("api key not valid") || message.includes("permission")) return "invalid_key";
  if (status === 429 || message.includes("quota") || message.includes("resource_exhausted") || message.includes("credit")) return "quota";
  if (message.includes("failed to fetch") || message.includes("network")) return "network";
  return "unknown";
}

let client: GoogleGenAI | null = null;

export interface DiloReply {
  text: string;
  crisis: boolean;
}

export async function chatWithDilo(
  history: ChatTurn[],
  language: LanguageCode,
  mode: Mode,
  moodLabel: string | null,
): Promise<DiloReply> {
  if (!API_KEY) throw new ChatError("missing_key");
  client ??= new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: toContents(history),
      config: {
        systemInstruction: getSystemInstruction(language, mode, moodLabel),
        temperature: mode === "reflective" ? 0.5 : 0.7,
      },
    });

    let text = (response.text ?? "").trim();
    const crisis = text.startsWith(CRISIS_MARKER);
    if (crisis) text = text.slice(CRISIS_MARKER.length).trim();
    if (!text) throw new ChatError("unknown", "Empty response");
    return { text, crisis };
  } catch (error) {
    if (error instanceof ChatError) throw error;
    console.error("Dilo request failed:", error);
    throw new ChatError(classifyError(error));
  }
}
