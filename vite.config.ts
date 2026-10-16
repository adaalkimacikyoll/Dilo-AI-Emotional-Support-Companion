import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Serves POST /api/chat during `npm run dev` with the same handler Vercel runs in production,
 * so the AI key stays on the server in both environments.
 */
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'dilo-dev-api',
    configureServer(server) {
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
