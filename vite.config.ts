import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Unterordner, unter dem die App veröffentlicht wird. Auf GitHub Pages ist das "/DayList-App/",
// lokal "/". Der Wert kommt beim Veröffentlichen aus der Umgebungsvariable BASE_PATH.
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    // Macht die App installierbar und offline startbar (Phase 6)
    VitePWA({
      // Neue Versionen werden beim nächsten Öffnen still übernommen
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        // Der Name erscheint auf dem Startbildschirm, den das Handy beim Öffnen zeigt
        name: 'DayList',
        short_name: 'DayList',
        description: 'Meine persönliche Alltags- und Aufgaben-App',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        // Startbildschirm: dunkler App-Hintergrund, auf dem das Verlaufs-Symbol leuchtet
        background_color: '#121019',
        theme_color: '#121019',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-Dateien (Code, Styles, Schrift, Symbole) auf dem Gerät speichern
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
