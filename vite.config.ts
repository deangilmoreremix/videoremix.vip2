import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const devServerPort = 5173;
  const codespacesForwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const codespaceName = process.env.CODESPACE_NAME;
  const isCodespaces = Boolean(codespacesForwardingDomain && codespaceName);

  return {
    plugins: [react({ fastRefresh: false })],
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
      port: devServerPort,
      strictPort: true,
      hmr: isCodespaces
        ? {
            protocol: 'wss',
            clientPort: 443,
          }
        : true,
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
