/** Types and limits shared by the browser app and the chat server function. */

export const LANGUAGE_CODES = ["en", "tr", "de", "fr", "es", "ar", "fa"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const MOOD_IDS = ["happy", "sad", "anxious", "tired", "stressed", "energetic"] as const;
export type MoodId = (typeof MOOD_IDS)[number];

export const MODES = ["friendly", "psychologist"] as const;
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

export type ChatErrorKind = "not_configured" | "rate_limited" | "bad_request" | "network" | "busy" | "generation_failed";

export const LIMITS = {
  /** Requests with more turns than this are rejected by the server. */
  maxTurns: 40,
  maxCharsPerTurn: 4000,
  /** History budget per request, to keep replies fast and cheap. */
  maxTotalChars: 16000,
  contextTurns: 20,
  maxReplyTokens: 700,
};
