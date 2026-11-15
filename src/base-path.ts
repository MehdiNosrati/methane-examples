declare const __ATMOS_STATIC_PAGES_BUILD__: boolean | undefined;

declare global {
  interface Window {
    __ATMOS_BASE_PATH__?: string;
    __ATMOS_STATIC_PAGES__?: boolean;
  }
}

export function normalizeBasePath(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function getBasePath(): string {
  if (typeof process !== 'undefined' && typeof process.env?.['ATMOS_BASE_PATH'] === 'string') {
    return normalizeBasePath(process.env['ATMOS_BASE_PATH']);
  }
  if (typeof window !== 'undefined' && typeof window.__ATMOS_BASE_PATH__ === 'string') {
    return normalizeBasePath(window.__ATMOS_BASE_PATH__);
  }
  const viteBase = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL;
  return normalizeBasePath(viteBase);
}

export function isStaticPagesMode(): boolean {
  if (typeof process !== 'undefined' && process.env?.['ATMOS_STATIC_PAGES'] === '1') {
    return true;
  }
  if (typeof window !== 'undefined' && window.__ATMOS_STATIC_PAGES__ === true) {
    return true;
  }
  return typeof __ATMOS_STATIC_PAGES_BUILD__ !== 'undefined' && __ATMOS_STATIC_PAGES_BUILD__;
}

export function withBasePath(path: string): string {
  if (!path.startsWith('/')) {
    return path;
  }
  const base = getBasePath();
  if (!base) {
    return path;
  }
  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function withRoutePath(routePath: '/' | `/${string}`): string {
  const base = getBasePath();
  if (!base) {
    return routePath;
  }
  if (routePath === '/') {
    return `${base}/`;
  }
  const clean = routePath.replace(/\/+$/, '');
  return `${base}${clean}/`;
}

export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  let stripped = pathname;
  if (base && (stripped === base || stripped.startsWith(`${base}/`))) {
    stripped = stripped.slice(base.length) || '/';
  }
  if (stripped.endsWith('/index.html')) {
    stripped = stripped.slice(0, -'/index.html'.length) || '/';
  }
  return stripped;
}
