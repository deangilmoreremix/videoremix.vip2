import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite plugin to handle missing lucide-react modules
function fixLucideReact() {
  return {
    name: 'fix-lucide-react',
    resolveId(id) {
      // Handle missing alarm-clock-minus icon
      if (id.includes('alarm-clock-minus') || id.includes('alarm-clock-minus')) {
        // Return a virtual module ID
        return '\0lucide-react-missing-icon';
      }
    },
    load(id) {
      if (id === '\0lucide-react-missing-icon') {
        return `
import React from 'react';
const AlarmClockMinus = React.forwardRef((props, ref) => 
  React.createElement('svg', { ...props, ref, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 })
);
AlarmClockMinus.displayName = 'AlarmClockMinus';
export { AlarmClockMinus };
`;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      fixLucideReact(),
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
        // Force using CJS build instead of broken ESM build
        'lucide-react': resolve(__dirname, 'node_modules/lucide-react/dist/cjs/lucide-react.js'),
      },
    },
    envPrefix: 'VITE_',
  };
});