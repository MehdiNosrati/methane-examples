import type { TemplateResult } from 'lit';

export type AtmosRouteId =
  | 'overview'
  | 'spatial'
  | 'telemetry'
  | 'operations'
  | 'war-room'
  | 'commerce-auth'
  | 'studio';

export type AtmosLocaleCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh-CN' | 'ar' | 'he';
export type AtmosThemeMode = 'light' | 'dark';
export type AtmosDensityMode = 'compact' | 'default' | 'comfortable';
export type AtmosSsrStyleMode = 'linked' | 'inline';
export type AtmosSliceId =
  | 'shell-ssr-studio'
  | 'view-spatial'
  | 'view-telemetry'
  | 'view-operations'
  | 'view-war-room'
  | 'view-commerce-auth';

export interface AtmosState {
  route: AtmosRouteId;
  theme: AtmosThemeMode;
  density: AtmosDensityMode;
  locale: AtmosLocaleCode;
  dir: 'ltr' | 'rtl';
  brandSeed: string;
  ssrStyles: AtmosSsrStyleMode;
  briefingMode: boolean;
  tourOpen: boolean;
  commandPaletteOpen: boolean;
  customStyleOverride: boolean;
  whiteLabelPrefix: string;
  ui: Record<string, unknown>;
}

export interface AtmosActions {
  navigate: (route: AtmosRouteId) => void;
  updateState: (patch: Partial<AtmosState>) => void;
  updateViewUi: (key: string, value: unknown) => void;
  notify: (message: string, variant?: 'info' | 'success' | 'warning' | 'danger') => void;
  announce: (message: string) => void;
}

export interface AtmosViewModule {
  readonly id: AtmosRouteId;
  readonly path: '/' | `/${string}`;
  readonly title: string;
  readonly subtitle: string;
  readonly badge?: string;
  readonly ownedTags: ReadonlyArray<string>;
  render(state: AtmosState, actions: AtmosActions): TemplateResult;
}

export interface CoverageTagEntry {
  readonly tag: `mth-${string}`;
  readonly slug: string;
  readonly pkg: string;
  readonly layer: 'css-layout' | 'primitives' | 'ui' | 'kit' | 'satellite';
  readonly ownerSlice: AtmosSliceId;
  readonly route: AtmosRouteId;
}

export interface AtmosPackageEntry {
  readonly name: `@methane-ui/${string}`;
  readonly layer: 'foundation' | 'ui' | 'kit' | 'satellite' | 'ssr' | 'tooling';
  readonly description: string;
  readonly showcasedIn: ReadonlyArray<AtmosRouteId>;
}
