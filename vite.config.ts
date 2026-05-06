import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('Vite config loaded - jsxRuntime:', 'classic');

  return {
    plugins: [
      react({
        jsxRuntime: "automatic"
      }),
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
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return undefined;
              }
              if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('@supabase') || id.includes('supabase')) {
                return 'vendor-db';
              }
              return 'vendor';
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
      hmr: false,
      allowedHosts: ['.app.github.dev', 'localhost'],
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/dist/**', '**/supabase/functions/**'],
      },
    },
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-helmet-async',
        'framer-motion',
        'lucide-react'
      ],
      alias: {
        '@': '/src',
      },
    },
    envPrefix: 'VITE_',
  };
});
