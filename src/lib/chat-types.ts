/** Types and limits for Dilo's on-device chat. */

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

export type ChatErrorKind = "unsupported" | "not_ready" | "download_failed" | "out_of_memory" | "generation_failed";

export const LIMITS = {
  maxCharsPerTurn: 4000,
  /** The on-device model has a 4k-token context window; keep history well inside it. */
  maxTotalChars: 6000,
  contextTurns: 12,
  maxReplyTokens: 600,
};
