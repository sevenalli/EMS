import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Fix for mqtt package ESM compatibility
  optimizeDeps: {
    include: ['mqtt'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  resolve: {
    alias: {
      // Use absolute path to the pre-built browser version of mqtt
      mqtt: resolve(__dirname, 'node_modules/mqtt/dist/mqtt.esm.js')
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  }
})
