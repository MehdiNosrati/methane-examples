import { defineConfig } from 'vite';

const SHARED_LIT_RUNTIME = [
  'lit',
  '@methane-ui/core',
  '@methane-ui/primitives',
  '@methane-ui/tokens',
  '@methane-ui/sanitize',
];

const rawBasePath = (process.env['ATMOS_BASE_PATH'] ?? '').trim().replace(/\/+$/, '');
const viteBase =
  rawBasePath && rawBasePath !== '/'
    ? `${rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`}/`
    : '/';
const isStaticPagesBuild = process.env['ATMOS_STATIC_PAGES'] === '1';

export default defineConfig({
  base: viteBase,
  appType: 'custom',
  define: {
    __ATMOS_STATIC_PAGES_BUILD__: JSON.stringify(isStaticPagesBuild),
  },
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
