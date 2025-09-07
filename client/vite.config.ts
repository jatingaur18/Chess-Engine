import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['chess-engine-k6nr.onrender.com']
  }
})
