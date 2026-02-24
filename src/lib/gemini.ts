import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAmvPIGWDu1KRy3djvY8ooNHKHzXS2EF2k";
const genAI = new GoogleGenAI({ apiKey });

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" },
  { code: "fa", name: "فارسی" },
];

export const getSystemInstruction = (language: string, mode: "friendly" | "psychologist" = "friendly") => {
  const modeInstruction = mode === "friendly" 
    ? "You are Dilo, a casual, warm, and supportive conversational assistant. Your tone is friendly, relaxed, and approachable, like a close friend who is always there to listen."
    : "You are Dilo, providing empathetic, reflective, and professionally-toned mental wellness support. Your tone is professional yet caring, focusing on active listening, reflection, and therapeutic support.";

  return `${modeInstruction}

Your goal is to provide mental health support, follow the user's emotional state, and offer personalized recommendations for activities, food, and self-care.

Current Language: ${language}
Always respond in the selected language.

Guidelines:
1. Listen actively and validate feelings.
2. If the user seems to be in a crisis, gently suggest professional help while remaining supportive.
3. Provide actionable recommendations (e.g., "Maybe a warm chamomile tea would help?" or "How about a 5-minute walk in the park?").
4. Keep track of the conversation context to follow their mental health progress.
5. Use formatting (bullet points, bold text) to make recommendations clear.`;
};

export const MODELS = [
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash" },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro" },
  { id: "gemini-2.5-flash-latest", name: "Gemini 2.5 Flash" },
];

export async function chatWithDilo(
  messages: { role: "user" | "model"; parts: { text: string }[] }[], 
  language: string,
  modelId: string = "gemini-3-flash-preview",
  mode: "friendly" | "psychologist" = "friendly"
) {
  const genAI = new GoogleGenAI({ apiKey });
  const model = modelId;
  
  try {
    const response = await genAI.models.generateContent({
      model,
      contents: messages,
      config: {
        systemInstruction: getSystemInstruction(language, mode),
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Error chatting with Dilo:", error);
    if (error?.message?.includes("credit balance")) {
      return "⚠️ Your credit balance is too low to access this model. Please switch to a free model or check your billing.";
    }
    return "I'm sorry, I'm having a bit of trouble connecting right now. Can we try again in a moment, friend?";
  }
}
