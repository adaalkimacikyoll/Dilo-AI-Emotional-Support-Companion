import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Serves POST /api/chat during `npm run dev` with the same handler Vercel runs in production,
 * so the Gemini key stays on the server in both environments.
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
          GEMINI_API_KEY: env.GEMINI_API_KEY,
          GEMINI_MODEL: env.GEMINI_MODEL,
        });
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Loaded for the dev server only. Nothing from .env.local is exposed to the browser bundle.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), devApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
