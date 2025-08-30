import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'app/index.html',
      },
    },
  },
  server: {
    // Ensure /app/ works in dev with MPA
    fs: { allow: ['.'] },
  },
});
