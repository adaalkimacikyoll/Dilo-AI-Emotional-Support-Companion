import type { MoodId } from "./translations";

// Emojis are intentionally kept here: the mood check-in is the one place they help.
export const MOODS: { id: MoodId; emoji: string }[] = [
  { id: "happy", emoji: "😊" },
  { id: "sad", emoji: "😔" },
  { id: "anxious", emoji: "😰" },
  { id: "tired", emoji: "😴" },
  { id: "stressed", emoji: "😤" },
  { id: "energetic", emoji: "🤩" },
];

export const isMoodId = (value: unknown): value is MoodId => MOODS.some((m) => m.id === value);
