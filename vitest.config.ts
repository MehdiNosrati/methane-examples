import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    dedupe: [
      'lit',
      '@methane-ui/core',
      '@methane-ui/primitives',
      '@methane-ui/tokens',
      '@methane-ui/sanitize',
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    testTimeout: 30_000,
  },
});
