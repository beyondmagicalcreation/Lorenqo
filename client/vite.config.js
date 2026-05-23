import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv reads from the .env file in the project root (for local dev).
  // process.env picks up vars injected by Railway/CI at build time.
  // process.env takes priority so Railway's dashboard values always win.
  const fileEnv = loadEnv(mode, '../', '');
  const VITE_COMPANY_NAME = process.env.VITE_COMPANY_NAME || fileEnv.VITE_COMPANY_NAME || '';

  return {
    plugins: [react()],
    envDir: '../',
    define: {
      'import.meta.env.VITE_COMPANY_NAME': JSON.stringify(VITE_COMPANY_NAME),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
        '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
      },
    },
  };
});
