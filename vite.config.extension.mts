import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(import.meta.dirname, 'extension/src/popup'),
  base: './',
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/extension'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: path.resolve(import.meta.dirname, 'extension/src/popup/popup.html'),
        background: path.resolve(import.meta.dirname, 'extension/src/background/service-worker.ts'),
        content: path.resolve(import.meta.dirname, 'extension/src/content/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'popup.js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'popup.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
