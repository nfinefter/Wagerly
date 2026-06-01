import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Load .env from repo root locally; on Vercel use Project → Environment Variables.
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
