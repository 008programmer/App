import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'app',
  base: '/App/',
  build: { outDir: '../dist', emptyOutDir: true },
  plugins: [VitePWA({
    registerType: 'prompt',
    injectRegister: false,
    includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
    workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'], cleanupOutdatedCaches: true },
    manifest: {
      id: '/App/',
      name: 'Magic Colour Garden', short_name: 'Colour Garden',
      start_url: '/App/', scope: '/App/', display: 'standalone',
      background_color: '#f7f0d8', theme_color: '#f7f0d8',
      description: 'A gentle six-colour garden for little artists.',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
      ]
    }
  })]
});

