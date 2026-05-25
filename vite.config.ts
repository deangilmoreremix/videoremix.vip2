import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const devServerPort = 5173;
  const codespacesForwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const codespaceName = process.env.CODESPACE_NAME;
  const isCodespaces = Boolean(codespacesForwardingDomain && codespaceName);

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
      // No manual chunking - let Vite handle everything automatically
      // This prevents module loading order issues
      rollupOptions: {
        output: {
          // Only split very large libraries that are lazy-loaded
          manualChunks: (id) => {
            // Keep React and all core libraries in main bundle
            // Only split huge libraries that aren't needed immediately
            if (id.includes('node_modules')) {
              // These are lazy-loaded via React.lazy(), so they can be separate
              if (id.includes('framer-motion')) return 'framer-motion';
              if (id.includes('lucide-react')) return 'lucide';
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
      port: 8080,
      strictPort: true, // Use fixed port for easier Codespaces port forwarding
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
      // Proxy all Supabase cloud calls to local instance
      proxy: {
        // Redirect any calls to the cloud Supabase project to local instance
        '^https://bzxohkrxcwodllketcpz.supabase.co': {
          target: 'http://127.0.0.1:54321',
          changeOrigin: true,
          rewrite: (path) => path.replace('^https://bzxohkrxcwodllketcpz.supabase.co', ''),
        },
        // Also proxy Supabase functions
        '^/functions': {
          target: 'http://127.0.0.1:54321',
          changeOrigin: true,
        },
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
