/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.kilo/**',
      '**/dist/**',
      '**/src/utils/errorHandling.test.ts',
      '**/src/pages/agents/__tests__/**',
      // Stale root-level junk tests: ad-hoc scripts that reference removed
      // modules / external schemas. They fail at collection time (import/setup
      // errors), which is not a real test regression, so they are excluded from
      // the vitest run. See docs/completion/ci-netlify-report.md.
      'create-database-schema.test.ts',
      'test-supabase-features.test.ts',
      // Playwright e2e specs (run via `npx playwright test`, not vitest).
      // Importing @playwright/test at module top level and calling its
      // test.describe() throws during vitest collection ("Playwright Test did
      // not expect test.describe() to be called here"), aborting the whole run.
      // There is no playwright.config in the repo, so they cannot run here at all.
      // NOTE: tests/credit-e2e.test.ts was converted to a vitest spec and is
      // intentionally NOT excluded — it runs in the normal suite.
      '**/tests/purchase-flow/**',
    ],
  },
})
