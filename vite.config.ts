
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the app to use the API key from your .env file locally
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY),
  },
  server: {
    port: 3000,
    host: true, // This allows your tablet to connect via your computer's IP address
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
