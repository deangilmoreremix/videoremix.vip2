import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const jsxRuntime = "automatic";
  console.log('Vite config loaded - jsxRuntime:', jsxRuntime);

  return {
    plugins: [
      react({
        jsxRuntime: "automatic"
      }),
      // Bundle analyzer (run with: npm run build -- --analyze)
      mode === 'analyze' && visualizer({
        filename: './dist/bundle-stats.html',
        open: true,
        gzipSize: true,
      }),
    ].filter(Boolean),
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
            // Separate React core
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-core';
            }
            if (id.includes('node_modules/react-router-dom')) {
              return 'router';
            }
            // UI libraries
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            // Supabase
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'supabase';
            }
            // AI/API libraries
            if (id.includes('openai') || id.includes('@anthropic-ai')) {
              return 'ai-libs';
            }
            // All other node_modules go to vendor
            if (id.includes('node_modules')) {
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
      strictPort: false, // Allow Vite to try next available port if 5173 is in use
      // Configure HMR for GitHub Codespaces
      hmr: {
        // Use the codespace URL for WebSocket connection
        clientPort: 443,
        protocol: 'wss',
      },
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
