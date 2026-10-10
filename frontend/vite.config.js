import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ShelfShare - Community Resource Sharing',
        short_name: 'ShelfShare',
        description: 'Rent or buy everyday resources from people near you.',
        theme_color: '#2f6b4f',
        background_color: '#faf7f0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-shell caching only — every page still loads live data via
        // localStorage/mock API, this just lets the shell itself (and the
        // last-viewed pages) open instantly and offline.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: { port: 5173, host: true }
})
