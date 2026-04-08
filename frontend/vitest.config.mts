import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: '..',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: path.join(frontendRoot, 'packages/ui/src/') + '/',
      },
      {
        find: /^react$/,
        replacement: path.join(frontendRoot, 'node_modules/react/index.js'),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.join(frontendRoot, 'node_modules/react/jsx-runtime.js'),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.join(frontendRoot, 'node_modules/react/jsx-dev-runtime.js'),
      },
      {
        find: /^react-dom$/,
        replacement: path.join(frontendRoot, 'node_modules/react-dom/index.js'),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.join(frontendRoot, 'node_modules/react-dom/client.js'),
      },
      {
        find: /^react-dom\/test-utils$/,
        replacement: path.join(frontendRoot, 'node_modules/react-dom/test-utils.js'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['frontend/vitest.setup.tsx'],
    include: [
      'frontend/packages/ui/tests/**/*.{test,spec}.{ts,tsx}',
      'frontend/apps/marketing/tests/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/tests/e2e/**'],
  },
})
