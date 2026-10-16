import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

const commit = (process.env.COMMIT_REF ?? '').slice(0, 7)

// Émet version.json à la racine du build : l'application le lit pour annoncer
// la version d'une mise à jour en attente (il n'est pas dans le précache).
function versionFile() {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: pkg.version, commit }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Version et commit affichés dans la page Compte, pour savoir quelle build
  // est en ligne. COMMIT_REF est fourni par Netlify ; absent en local.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionFile(),
    VitePWA({
      // 'prompt' : la nouvelle build attend que l'utilisateur accepte de
      // recharger (voir UpdatePrompt) au lieu de s'activer en silence.
      registerType: 'prompt',
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
