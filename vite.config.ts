
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process explicitly to ensure correct types for Node.js environment
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', // Important: Use relative paths for assets so they load in Electron file:// protocol
    define: {
      // Prevents 'process is not defined' error in browser/electron renderer
      'process.env': env
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext'
    },
    server: {
      port: 5173
    }
  };
});
