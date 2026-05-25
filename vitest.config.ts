/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/.kilo/**', '**/dist/**', '**/src/utils/errorHandling.test.ts', '**/src/pages/agents/__tests__/**'],
  },
})
