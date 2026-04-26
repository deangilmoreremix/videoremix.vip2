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
    include: ['lucide-react', 'framer-motion', 'react-intersection-observer'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('@radix-ui') || id.includes('react-router')) {
              return 'ui-vendor';
            }
            if (id.includes('supabase') || id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }

          // Split dashboard components into smaller chunks
          if (id.includes('/components/dashboard/DashboardToolsSection')) {
            return 'dashboard-tools';
          }
          if (id.includes('/components/dashboard/DashboardPersonalizerSection')) {
            return 'dashboard-personalizer';
          }
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-core';
          }

          // Separate pages
          if (id.includes('/pages/DashboardPage')) {
            return 'dashboard-page';
          }
          if (id.includes('/pages/LandingPage')) {
            return 'landing-page';
          }
          if (id.includes('/pages/')) {
            return 'other-pages';
          }

          // Hooks and utilities
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/utils/')) {
            return 'utils';
          }
        }
      }
    },
    sourcemap: true,
    assetsDir: 'assets',
    manifest: true,
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