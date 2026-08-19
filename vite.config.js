import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the machine's network address too, so the site can be opened from a phone
    // on the same Wi-Fi (http://<your-lan-ip>:3000). API calls still go through the proxy
    // below, which runs on this machine, so the backend port stays private.
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Seller-uploaded product photos are served by the backend, so they need the
      // same proxy - otherwise they 404 for anyone not on this machine.
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
