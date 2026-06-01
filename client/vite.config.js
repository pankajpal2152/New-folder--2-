import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ==========================================
// VITE CONFIGURATION
// ==========================================
export default defineConfig({
  plugins: [react()],

  // --- 1. LOCAL DEVELOPMENT SERVER ---
  server: {
    port: 3000,       // Standardized local frontend port
    open: true,       // Automatically opens the browser on start
    proxy: {
      // Routes frontend API requests to local Node.js server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // ✅ NEW: Routes frontend Image/PDF requests to local Node.js server
      '/allDocumentsFolder': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // --- 2. PRODUCTION BUILD SETTINGS (For Vercel) ---
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
          if (id.includes('node_modules/react-select') || id.includes('node_modules/react-toastify') || id.includes('node_modules/axios')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
});