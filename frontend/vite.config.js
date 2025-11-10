import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok.io'],
    cors: {
      origin: ['https://studio.plasmic.app', 'https://host.plasmic.app'],
      credentials: true,
    },
  },
})
