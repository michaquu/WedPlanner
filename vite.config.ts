import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/pwa-192.png', 'icons/pwa-512.png'],
      manifest: {
        name: 'N&M Wedding Planner',
        short_name: 'N&M Wedding Planner',
        theme_color: '#f6f1ea',
        background_color: '#f6f1ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
