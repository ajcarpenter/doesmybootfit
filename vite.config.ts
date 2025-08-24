import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For a custom domain (CNAME present), '/' is correct.
  // If you later deploy under a repo subpath, change this to '/<repo>/'
  base: '/',
})
