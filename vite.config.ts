import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    // API'et kører i Wrangler under udvikling: pnpm dev:api (port 8787).
    // Uden den virker appen stadig – synk melder bare "Ingen forbindelse".
    proxy: { '/api': 'http://localhost:8787' },
  },
})
