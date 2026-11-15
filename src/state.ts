import {
  getLocaleDirection,
  loadLocalePack as fetchMethaneLocalePack,
  resolveSupportedLocale,
  type MethaneLocalePack,
} from '@methane-ui/locales';
import { registerLocalePack, type MessageCatalog } from '@methane-ui/core';
import { DEFAULT_DTCG_TOKENS_JSON } from './data/index.js';
import type {
  AtmosDensityMode,
  AtmosLocaleCode,
  AtmosRouteId,
  AtmosSsrStyleMode,
  AtmosState,
  AtmosThemeMode,
} from './types.js';

export const DEFAULT_BRAND_SEED = 'oklch(0.58 0.20 175)';

export const ROUTE_TO_PATH: Readonly<Record<AtmosRouteId, '/' | `/${string}`>> = {
  overview: '/',
  spatial: '/spatial',
  telemetry: '/telemetry',
  operations: '/operations',
  'war-room': '/war-room',
  'commerce-auth': '/commerce-auth',
  studio: '/studio',
};

export function resolveRouteFromPathname(pathname: string): AtmosRouteId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  switch (clean) {
    case '/':
      return 'overview';
    case '/spatial':
      return 'spatial';
    case '/telemetry':
      return 'telemetry';
    case '/operations':
      return 'operations';
    case '/war-room':
      return 'war-room';
    case '/commerce-auth':
      return 'commerce-auth';
    case '/studio':
      return 'studio';
    default:
      return 'overview';
  }
}

export function createInitialAtmosState(urlInput?: string | URL): AtmosState {
  const url =
    typeof urlInput === 'string'
      ? new URL(urlInput, 'http://localhost')
      : urlInput ?? new URL('http://localhost/');

  const route = resolveRouteFromPathname(url.pathname);
  const rawTheme = url.searchParams.get('theme');
  const theme: AtmosThemeMode = rawTheme === 'light' ? 'light' : 'dark';

  const rawDensity = url.searchParams.get('density');
  const density: AtmosDensityMode =
    rawDensity === 'compact' || rawDensity === 'comfortable' ? rawDensity : 'default';

  const rawLocale = url.searchParams.get('locale') ?? 'en';
  const locale = (resolveSupportedLocale(rawLocale) ?? 'en') as AtmosLocaleCode;
  const dir = getLocaleDirection(locale);

  const rawSeed = url.searchParams.get('seed')?.trim();
  const brandSeed =
    rawSeed && /^oklch\([0-9.\s%/+-]+\)$/i.test(rawSeed) ? rawSeed : DEFAULT_BRAND_SEED;

  const ssrStyles: AtmosSsrStyleMode =
    url.searchParams.get('ssrStyles') === 'inline' ? 'inline' : 'linked';

  const briefingParam = url.searchParams.get('briefing');
  const briefingMode = briefingParam === '0' ? false : true;

  return {
    route,
    theme,
    density,
    locale,
    dir,
    brandSeed,
    ssrStyles,
    briefingMode,
    tourOpen: false,
    commandPaletteOpen: false,
    customStyleOverride: false,
    whiteLabelPrefix: 'atmos',
    ui: {
      dtcgJson: DEFAULT_DTCG_TOKENS_JSON,
      dtcgCompiledCount: 3,
      dtcgStatus: 'Ready · 3 custom tokens compiled',
      pluralSampleCount: 1,
      autoLoaderStatus: 'Idle · Ready to scan dynamic tags',
      ssrTransformSample:
        '<mth-badge variant="success">Verified Sealed</mth-badge><mth-button variant="solid" size="sm">Inspect</mth-button>',
      ssrInspectorOutput: 'Click "Run Live DSD Transform" or "Stream SSR Snapshot" to inspect raw <template shadowrootmode="open"> markup.',
      coverageFilter: '',
    },
  };
}

const loadedLocalePacks = new Map<AtmosLocaleCode, MethaneLocalePack>();

export async function activateAtmosLocale(locale: AtmosLocaleCode): Promise<'ltr' | 'rtl'> {
  const pack = await fetchMethaneLocalePack(locale);
  loadedLocalePacks.set(locale, pack);
  registerLocalePack(
    pack.locale,
    pack.messages as unknown as Readonly<Record<string, MessageCatalog>>,
  );
  return pack.dir;
}

export function getLoadedLocalePack(locale: AtmosLocaleCode): MethaneLocalePack | undefined {
  return loadedLocalePacks.get(locale);
}

export function applyDocumentThemeState(state: AtmosState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = state.locale;
  root.dir = state.dir;
  root.dataset.mthTheme = state.theme;
  root.dataset.mthDensity = state.density;
  root.style.setProperty('--mth-color-seed-brand', state.brandSeed);
}
