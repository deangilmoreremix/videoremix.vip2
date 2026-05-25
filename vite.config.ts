import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // TEMP DIAGNOSTIC PLUGIN (revert after debugging server connection loss + dynamic import failures)
      // Logs requests for src files and HMR activity to help trace when/why the dev server becomes unreachable
      ...(mode === 'development'
        ? [
            {
              name: 'diagnose-dynamic-imports-and-hmr',
              configureServer(server) {
                const origPrint = server.printUrls;
                server.printUrls = () => {
                  origPrint?.call(server);
                  console.log('\n[ VITE DIAG ] Diagnostic mode active — watching /src requests + HMR');
                };

                server.middlewares.use((req, _res, next) => {
                  const url = req.url || '';
                  if (url.includes('/src/') || url.includes('?import') || url.includes('.tsx') || url.includes('.ts')) {
                    console.log(`[VITE DIAG] ${req.method || 'GET'} ${url}  t=${Date.now()}`);
                  }
                  next();
                });
              },
              handleHotUpdate(ctx) {
                console.log(`[VITE DIAG] HMR: ${ctx.file.split('/').pop()} → ${ctx.modules.length} modules`);
                return ctx.modules;
              },
            },
          ]
        : []),
    ],
    optimizeDeps: {
      include: ['framer-motion'],
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
            // Force premium components into main chunk
            if (id.includes('premium')) {
              return 'premium';
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