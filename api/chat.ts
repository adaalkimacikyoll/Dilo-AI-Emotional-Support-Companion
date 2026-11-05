import { handleRequest } from "../server/chat.js";

// Vercel Function: POST /api/chat
// Set AI_API_KEY (and optionally AI_MODEL, AI_BASE_URL) in Vercel > Project > Settings > Environment Variables.
export default {
  fetch(request: Request) {
    return handleRequest(request, {
      AI_API_KEY: process.env.AI_API_KEY,
      AI_BASE_URL: process.env.AI_BASE_URL,
      AI_MODEL: process.env.AI_MODEL,
      AI_TOKEN_BUDGET: process.env.AI_TOKEN_BUDGET,
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  },
};
