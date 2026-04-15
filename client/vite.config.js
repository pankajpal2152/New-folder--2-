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
      // Routes any frontend request starting with '/api' to your local Node.js server
      // This prevents CORS errors during local development.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // --- 2. PRODUCTION BUILD SETTINGS (For cPanel) ---
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clears the dist folder before every new build
    sourcemap: false,  // SECURITY: Set to false so your raw source code isn't exposed in production
    chunkSizeWarningLimit: 1000, // Suppresses warnings for heavy UI libraries
    
    // Rollup handles the actual bundling process
    rollupOptions: {
      output: {
        // Manual Chunking: Splits dependencies into separate files for aggressive browser caching
        manualChunks(id) {
          // Core React Ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // Form and Validation Libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
          // Heavy UI Libraries
          if (id.includes('node_modules/react-select') || id.includes('node_modules/react-toastify') || id.includes('node_modules/axios')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
});