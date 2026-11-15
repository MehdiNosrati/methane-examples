import { defineConfig } from 'vite';

const SHARED_LIT_RUNTIME = [
  'lit',
  '@methane-ui/core',
  '@methane-ui/primitives',
  '@methane-ui/tokens',
  '@methane-ui/sanitize',
];

export default defineConfig({
  appType: 'custom',
  resolve: {
    dedupe: SHARED_LIT_RUNTIME,
  },
  optimizeDeps: {
    include: ['lit', '@lit/context', '@methane-ui/core', '@methane-ui/ssr/client'],
  },
  build: {
    target: 'es2023',
    sourcemap: false,
  },
  ssr: {
    target: 'node',
  },
});
