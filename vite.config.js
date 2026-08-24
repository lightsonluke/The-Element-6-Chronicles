import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standard Vite configuration; no hosted-platform plugin or runtime is required.
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
});
