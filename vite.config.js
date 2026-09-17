import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    watch: {
      usePolling: true,
    },
    // The app addresses the API with relative URLs, because in every deployed
    // environment nginx serves the bundle and the API from one origin. Dev is
    // the exception -- Vite here, FastAPI on another port -- so forward the
    // same paths nginx does and relative URLs work identically in both.
    //
    // Point VITE_DEV_API_PROXY at a deployed environment to develop the UI
    // against it instead of a local API.
    proxy: Object.fromEntries(
      ['/api', '/docs', '/redoc', '/openapi.json'].map((path) => [
        path,
        {
          target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      ]),
    ),
  },
  build: {
    sourcemap: true
  },
})
