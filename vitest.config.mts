import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    includeSource: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist', 'adapter/**'],
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
