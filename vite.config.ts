import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Removed custom lucide-react fix plugin - using standard lucide-react

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
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('framer-motion')) {
                return 'vendor';
              }
              if (id.includes('lucide-react') || id.includes('react-countup')) {
                return 'ui';
              }
            }
            return undefined;
          }
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
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
        '@': resolve(__dirname, 'src'),
      },
    },
    envPrefix: 'VITE_',
  };
});