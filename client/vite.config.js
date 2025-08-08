import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    headers: {
      'Cache-Control': 'no-cache'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Clear large headers
            if (proxyReq.getHeader('cookie') && proxyReq.getHeader('cookie').length > 4096) {
              proxyReq.removeHeader('cookie');
            }
          });
        }
      }
    }
  },

})
