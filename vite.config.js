import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Neue Versionen werden erst nach Bestätigung aktiviert (kein Reload mitten in der Arbeit).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Takt – Zeiterfassung',
        short_name: 'Takt',
        description: 'Minimalistische Zeit- und Projekterfassung für Freelancer und kleine Teams.',
        lang: 'de',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        background_color: '#0F1115',
        theme_color: '#0F1115',
        categories: ['productivity', 'business'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Timer starten', short_name: 'Start', url: '/?action=start#/timesheet', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Auswertung', short_name: 'Auswertung', url: '/#/reports', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Nur lateinische Schrift-Subsets offline vorhalten (Umlaute sind enthalten).
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});
