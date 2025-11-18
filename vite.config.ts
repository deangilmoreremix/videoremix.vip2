import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react', 'framer-motion'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'framer-motion', 
            'react-intersection-observer'
          ],
          animations: [
            'react-type-animation'
          ],
          ui: [
            'lucide-react',
            'react-countup'
          ],
        }
      }
    }
  },
  server: {
    hmr: {
      timeout: 120000,
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/supabase/functions/**'],
    },
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  envPrefix: 'VITE_',
  };
});