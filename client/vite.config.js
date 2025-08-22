import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const API_BASE = process.env.VITE_API_BASE_URL;

  return {
    plugins: [react()],
    define: { global: 'globalThis' },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            bootstrap: ['bootstrap', 'react-bootstrap'],
            icons: ['react-icons'],
            utils: ['axios', 'socket.io-client']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 5173,
      headers: { 'Cache-Control': 'no-cache' },
      proxy: mode === 'development'
        ? {
            '/api': {
              target: API_BASE,
              changeOrigin: true,
              secure: false,
              timeout: 30000
            },
          }
        : undefined,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'axios', 'bootstrap'],
      exclude: ['@vite/client', '@vite/env']
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
  };
});
