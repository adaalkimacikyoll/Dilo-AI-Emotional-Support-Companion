/** Types and constants shared by the browser app and the server function. */

export const LANGUAGE_CODES = ["en", "tr", "de", "fr", "es", "ar", "fa"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const MOOD_IDS = ["happy", "sad", "anxious", "tired", "stressed", "energetic"] as const;
export type MoodId = (typeof MOOD_IDS)[number];

export const MODES = ["friendly", "reflective"] as const;
export type Mode = (typeof MODES)[number];

/** Whether Dilo only listens or also offers suggestions. */
export const SUPPORT_STYLES = ["listen", "tips"] as const;
export type SupportStyle = (typeof SUPPORT_STYLES)[number];

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface ChatRequest {
  history: ChatTurn[];
  language: LanguageCode;
  mode: Mode;
  support: SupportStyle;
  mood: MoodId | null;
}

export type ChatErrorKind = "missing_key" | "invalid_key" | "quota" | "rate_limited" | "bad_request" | "network" | "unknown";

export type ChatResponse = { ok: true; text: string; crisis: boolean } | { ok: false; error: ChatErrorKind };

export const LIMITS = {
  maxTurns: 40,
  maxCharsPerTurn: 4000,
  maxTotalChars: 40000,
  /** Turns actually sent to the model. */
  contextTurns: 30,
};
