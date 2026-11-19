import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const stub = (f) => fileURLToPath(new URL(`./src/artifact/${f}`, import.meta.url));

/**
 * Zwei Build-Varianten:
 *  - Standard (`npm run build`): installierbare PWA mit Service Worker → dist/
 *  - `npm run build:artifact`: eine einzelne HTML-Datei für eingebettete Vorschauen
 *    (kein Service Worker, Schriften über Google Fonts) → dist-artifact/
 */
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
  define: { __ARTIFACT__: JSON.stringify(artifact) },
  ...(artifact && {
    resolve: {
      alias: {
        'virtual:pwa-register/react': stub('pwa-register-stub.js'),
        './fonts': stub('fonts-stub.js'),
      },
    },
    build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
  }),
  plugins: [
    react(),
    artifact && viteSingleFile({ removeViteModuleLoader: true }),
    artifact && {
      name: 'artifact-html',
      transformIndexHtml: (html) =>
        html
          .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\s*/g, '')
          .replace(
            '</title>',
            '</title>\n    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500;600&display=swap" />',
          ),
    },
    !artifact && VitePWA({
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
          { name: 'Timer starten', short_name: 'Start', url: '/?action=start#timesheet', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Auswertung', short_name: 'Auswertung', url: '/#reports', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
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
  ].filter(Boolean),
  };
});
