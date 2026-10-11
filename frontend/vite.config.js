import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      // Shim the UMD-only MediaPipe bundle that TensorFlow's pose-detection
      // package imports at build time. We only use MoveNet, so this is safe.
      '@mediapipe/pose': fileURLToPath(new URL('./src/lib/ar/mediapipe-stub.js', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
      manifest: {
        name: 'MoveX',
        short_name: 'MoveX',
        description: 'Move More. Compete and Grow Together.',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // ... any other existing config
})