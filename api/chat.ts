import { handleRequest } from "../server/chat";

// Vercel Function: POST /api/chat
// Set AI_API_KEY (and optionally AI_MODEL, AI_BASE_URL) in Vercel > Project > Settings > Environment Variables.
export default {
  fetch(request: Request) {
    return handleRequest(request, {
      AI_API_KEY: process.env.AI_API_KEY,
      AI_BASE_URL: process.env.AI_BASE_URL,
      AI_MODEL: process.env.AI_MODEL,
    });
  },
};
