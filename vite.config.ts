import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Multi-page, not a single-page app: there is no history fallback to invent, because
  // /app is a real document. Without this, a server hands /app to the root index.html
  // and the visitor gets the landing page a second time instead of the app.
  appType: 'mpa',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The registration is written by hand in src/main.tsx, and only there. The
      // landing page at the root must not install a service worker, or every stranger
      // arriving from a shared link would download the 5.8 MB catalogue to read one
      // paragraph. `registerSW` from virtual:pwa-register offers no way to set the
      // scope, so the registration is done directly instead.
      injectRegister: null,
      // The manifest lives at public/manifest.webmanifest and is pinned by
      // tests/pwa-manifest.test.ts — the plugin must not generate a second one.
      manifest: false,
      includeAssets: ['manifest.webmanifest'],
      workbox: {
        // The app's HTML, which is no longer at the root.
        navigateFallback: '/app/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,json}'],
        // The landing page's own assets are never needed by the app, and the landing
        // page installs no worker — so precaching them would charge every app user for
        // a page they do not open. Named `landing-*` because that is the entry name in
        // the rollup input above, so this cannot drift out of date quietly.
        globIgnores: ['**/landing-*.js', '**/landing-*.css'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Two entries, one build: the landing page owns the root, the app owns /app.
      // Two separate projects would double the toolchain to avoid this block.
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app', 'index.html'),
      },
    },
  },
});
