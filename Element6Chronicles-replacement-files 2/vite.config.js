import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standard Vite configuration; no hosted-platform plugin or runtime is required.
export default defineConfig({
  // Relative asset paths let the game work both locally and on GitHub Pages.
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1' },
});
