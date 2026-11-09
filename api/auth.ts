import { handleAuth } from "../server/auth.js";

// Vercel Function: POST /api/auth (email codes for sign-up and password reset).
// Needs BREVO_API_KEY and MAIL_FROM, plus the Upstash store (KV_REST_API_URL / KV_REST_API_TOKEN).
export default {
  fetch(request: Request) {
    return handleAuth(request, {
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      BREVO_API_KEY: process.env.BREVO_API_KEY,
      MAIL_FROM: process.env.MAIL_FROM,
    });
  },
};
