import { handleRequest } from "../server/chat";

// Vercel Function: POST /api/chat
// Set GEMINI_API_KEY (and optionally GEMINI_MODEL) in Vercel > Project > Settings > Environment Variables.
export default {
  fetch(request: Request) {
    return handleRequest(request, {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    });
  },
};
