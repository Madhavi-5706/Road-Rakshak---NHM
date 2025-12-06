import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important: Use relative paths for assets so they load in Electron file:// protocol
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  server: {
    port: 5173
  }
});