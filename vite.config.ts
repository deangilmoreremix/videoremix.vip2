import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'framer-motion',
      'react-intersection-observer',
      'react-helmet-async',
      '@supabase/supabase-js'
    ],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - but let Vite handle React internally to avoid duplicate React instances
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return undefined;
            }
            // Don't manually chunk react or react-dom - let Vite optimize them properly
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('@radix-ui')) {
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
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    allowedHosts: ['.app.github.dev', 'localhost'],
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/supabase/functions/**'],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      '@': '/src',
    },
  },
  envPrefix: 'VITE_',
  };
});
