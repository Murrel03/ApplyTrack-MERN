import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The /api proxy means the browser only ever talks to the Vite origin in dev,
// so CORS is a non-issue locally; in production set VITE_API_URL instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
