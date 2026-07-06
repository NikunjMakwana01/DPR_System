import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://dpr-system.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://dpr-system.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
