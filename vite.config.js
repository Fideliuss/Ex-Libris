import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ex Libris',
        short_name: 'Ex Libris',
        description: 'Suivi personnel de collection de livres et de lecture.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#eae1cb',
        theme_color: '#eae1cb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Chunks lourds et rarement utilisés (SheetJS ~360 ko, scanner
        // de code-barres ~370 ko) : pas dans le précache d'installation,
        // que tout le monde télécharge. Ils sont mis en cache à leur premier
        // usage (voir runtimeCaching), donc disponibles hors ligne ensuite.
        globIgnores: ['**/xlsx-*.js', '**/BarcodeScanner-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              /\/assets\/(xlsx|BarcodeScanner)-[^/]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'heavy-chunks',
              expiration: { maxEntries: 8 },
            },
          },
        ],
      },
    }),
  ],
})
