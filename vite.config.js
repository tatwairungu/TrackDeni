import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TrackDeni - Debt Tracker',
        short_name: 'TrackDeni',
        description: 'Track customer debts and payments easily. Manage your business finances offline and online.',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
        shortcuts: [
          {
            name: 'Add Customer',
            short_name: 'Add Customer',
            description: 'Quickly add a new customer',
            url: '/add-customer',
            icons: [
              {
                src: 'icons/add-customer-96x96.png',
                sizes: '96x96',
              },
            ],
          },
        ],
      },
    }),
  ],
  
  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2015',
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          vendor: ['react', 'react-dom'],
          // Firebase chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // UI chunk for larger UI libraries
          ui: ['zustand'],
        },
      },
    },
    
    // Compression and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    
    // Source maps for debugging (can be disabled for smaller builds)
    sourcemap: false,
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
  },
  
  // Preview server config
  preview: {
    port: 4173,
    host: true,
  },
  
  // Development server config
  server: {
    port: 5175,
    host: true,
    open: true,
  },
  
  // Environment variables
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  
  // Base path for deployment
  base: '/',
})
