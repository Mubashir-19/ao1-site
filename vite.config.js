import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './', // <--- this fixes missing CSS
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: (id) => /^three(\/.*)?$/.test(id),
    },
  },
  server: {
    port: 3000,
    proxy: mode === 'development' ? {
      '/api': 'http://localhost:3000',
    } : undefined,
  },
}));
