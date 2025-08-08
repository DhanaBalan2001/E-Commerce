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
      rollupOptions: { output: { manualChunks: undefined } },
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
            },
          }
        : undefined,
    },
  };
});
