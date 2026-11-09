import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Serves POST /api/chat during `npm run dev` with the same handler Vercel runs in production,
 * so the AI key stays on the server in both environments.
 */
function devApi(env: Record<string, string>): Plugin {
  let devStore: unknown = null; // one in-memory auth store for the whole dev session
  return {
    name: 'dilo-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/auth', async (req, res) => {
        const { handleAuth, memoryStore } = await server.ssrLoadModule('/server/auth.ts');
        devStore ??= env.KV_REST_API_URL ? null : memoryStore();
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request('http://localhost/api/auth', {
          method: req.method,
          headers: { 'content-type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await handleAuth(
          request,
          { KV_REST_API_URL: env.KV_REST_API_URL, KV_REST_API_TOKEN: env.KV_REST_API_TOKEN, GMAIL_USER: env.GMAIL_USER, GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD, BREVO_API_KEY: env.BREVO_API_KEY, MAIL_FROM: env.MAIL_FROM, BREVO_BASE_URL: env.BREVO_BASE_URL },
          fetch,
          { ...(devStore ? { store: devStore } : {}), rateLimit: false }, // local development only
        );
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      });

      server.middlewares.use('/api/chat', async (req, res) => {
        const { handleRequest } = await server.ssrLoadModule('/server/chat.ts');
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request('http://localhost/api/chat', {
          method: req.method,
          headers: { 'content-type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await handleRequest(request, {
          AI_API_KEY: env.AI_API_KEY,
          AI_BASE_URL: env.AI_BASE_URL,
          AI_MODEL: env.AI_MODEL,
          // Local development has no shared counter, so the free-token limit is off unless configured.
          AI_TOKEN_BUDGET: env.AI_TOKEN_BUDGET ?? 'off',
          KV_REST_API_URL: env.KV_REST_API_URL,
          KV_REST_API_TOKEN: env.KV_REST_API_TOKEN,
        }, fetch, { rateLimit: false }); // local development only; production always rate limits
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        if (!response.body) return void res.end();
        const reader = response.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Read by the dev server only. Nothing from .env.local is exposed to the browser bundle.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), devApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
