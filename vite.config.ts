import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Dilo is a static site: the AI runs in the browser, so there is no server code and no API key.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
