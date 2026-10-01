import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the port so the app always matches FRONTEND_URL in the backend.
    // Without strictPort, Vite silently moves to 5174/5175 and the Google
    // OAuth redirect lands on the wrong origin.
    port: 5173,
    strictPort: true,
    // The backend enables CORS for the frontend origin. Proxying the API prefix
    // keeps the frontend on same-origin requests either way.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
