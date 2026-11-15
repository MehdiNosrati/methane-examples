import type {
  AtmosLocaleCode,
  AtmosPackageEntry,
  AtmosRouteId,
  AtmosSliceId,
  CoverageTagEntry,
} from './types.js';

function entriesFor(
  pkg: string,
  layer: CoverageTagEntry['layer'],
  ownerSlice: AtmosSliceId,
  route: AtmosRouteId,
  slugs: ReadonlyArray<string>,
): ReadonlyArray<CoverageTagEntry> {
  return slugs.map((slug) => ({
    tag: `mth-${slug}` as const,
    slug,
    pkg,
    layer,
    ownerSlice,
    route,
  }));
}

export const CSS_LAYOUT_TAG_SLUGS = [
  'stack',
  'grid',
  'flex',
  'container',
  'spacer',
] as const;

export const PRIMITIVES_UTILITY_SLUGS = [
  'visually-hidden',
  'skip-link',
  'error-boundary',
] as const;

export const SHELL_STUDIO_UI_SLUGS = [
  // Global shell & navigation/chrome (18)
  'navbar',
  'menubar',
  'mega-menu',
  'sidebar-nav',
  'bottom-nav',
  'breadcrumbs',
  'breadcrumb-item',
  'breadcrumb-path',
  'site-search',
  'command-palette',
  'notification-center',
  'toast',
  'network-status',
  'clock',
  'back-to-top',
  'cookie-banner',
  'fab',
  'speed-dial',
  // Overview & Public Climate Network Briefing (12)
  'tour',
  'tour-step',
  'coachmark',
  'newsletter-form',
  'comparison-table',
  'carousel',
  'carousel-item',
  'accordion',
  'accordion-item',
  'share-button',
  'qr-code',
  'barcode',
  // Theme, OKLCH DTCG, Locale/RTL, Prefix & Coverage Studio (5)
  'color-picker',
  'slider',
  'range-slider',
  'segmented-control',
  'code-tabs',
] as const;

export const SPATIAL_MAPS_SLUGS = [
  'map',
  'map-cluster',
  'map-draw',
  'map-route',
  'location-picker',
  'floor-plan',
  'seat-map',
] as const;

export const SPATIAL_3D_SLUGS = ['model-viewer'] as const;

export const SPATIAL_MEDIA_SLUGS = ['image-annotator', 'lottie'] as const;

export const SPATIAL_UI_SLUGS = [
  'split-pane',
  'resizable-group',
  'resizable-panel',
  'resizable-handle',
  'floating-panel',
  'zoom-pan',
  'before-after',
  'gallery',
  'masonry',
  'lightbox',
  'image',
  'image-cropper',
  'drawing-pad',
  'fullscreen-overlay',
  'drawer',
  'bottom-sheet',
  'popover',
  'hover-card',
  'tooltip',
  'context-menu',
  'menu-item',
  'dropdown-menu',
  'address-input',
  'cascader',
] as const;

export const TELEMETRY_CHARTS_SLUGS = ['chart', 'chart-series'] as const;

export const TELEMETRY_DATAGRID_SLUGS = ['datagrid', 'pivot-table', 'tree-table'] as const;

export const TELEMETRY_SPREADSHEET_SLUGS = ['formula-bar', 'spreadsheet'] as const;

export const TELEMETRY_ADMIN_SLUGS = [
  'saved-views',
  'filter-builder',
  'query-builder',
  'column-chooser',
  'bulk-action-bar',
  'csv-importer',
] as const;

export const TELEMETRY_UI_SLUGS = [
  'stat-card',
  'sparkline',
  'calendar-heatmap',
  'table',
  'column',
  'pagination',
  'virtual-scroller',
  'infinite-scroll',
  'load-more',
  'progress-bar',
  'progress-ring',
  'skeleton',
  'loading-overlay',
  'spinner',
  'empty-state',
  'key-value',
  'status-indicator',
  'inline-status',
  'date-range-picker',
  'date-range-calendar',
  'month-picker',
] as const;

export const OPERATIONS_ADMIN_SLUGS = [
  'kanban',
  'event-calendar',
  'availability-picker',
  'booking-widget',
  'file-explorer',
  'audit-log',
  'settings-shell',
] as const;

export const OPERATIONS_DATAGRID_SLUGS = ['scheduler', 'gantt'] as const;

export const OPERATIONS_FLOW_SLUGS = ['flow-editor', 'org-chart'] as const;

export const OPERATIONS_CODE_SLUGS = [
  'code-editor',
  'code-block',
  'diff-viewer',
  'json-editor',
] as const;

export const OPERATIONS_EDITOR_SLUGS = [
  'rich-editor',
  'markdown',
  'markdown-editor',
  'math-editor',
] as const;

export const OPERATIONS_PDF_SLUGS = ['pdf-viewer'] as const;

export const OPERATIONS_UI_SLUGS = [
  'form',
  'form-wizard',
  'form-repeater',
  'schema-form',
  'conditional-field',
  'fieldset',
  'field',
  'error-summary',
  'stepper',
  'step',
  'timeline',
  'timeline-item',
  'activity-feed',
  'tree',
  'tree-item',
  'tree-nav',
  'toc',
  'sortable',
  'transfer-list',
  'cron-builder',
  'rrule-editor',
  'calendar',
  'date-picker',
  'datetime-picker',
  'time-picker',
  'timezone-picker',
  'duration-input',
  'countdown',
  'stopwatch',
  'signature-pad',
  'file-upload',
  'dropzone',
  'upload-progress',
  'inline-edit',
] as const;

export const WAR_ROOM_AI_SLUGS = [
  'prompt-input',
  'ai-message',
  'thinking-indicator',
  'tool-call',
  'citation-list',
  'artifact-pane',
  'suggestion-chips',
  'ai-feedback',
] as const;

export const WAR_ROOM_CHAT_SLUGS = [
  'chat-thread',
  'comment-thread',
  'message-composer',
  'notification-bell',
  'reaction-bar',
  'typing-indicator',
  'presence-badge',
  'collab-cursors',
] as const;

export const WAR_ROOM_RTC_SLUGS = [
  'video-grid',
  'camera-capture',
  'audio-recorder',
  'screen-recorder',
] as const;

export const WAR_ROOM_MEDIA_SLUGS = ['waveform'] as const;

export const WAR_ROOM_UI_SLUGS = [
  'audio-player',
  'video-player',
  'avatar',
  'avatar-group',
  'mention-input',
  'emoji-picker',
  'async-search',
  'search-input',
  'list',
  'list-item',
  'scroll-area',
  'tabs',
  'tab',
  'tab-panel',
  'card',
  'callout',
  'alert',
  'banner',
  'badge',
  'tag',
  'tag-input',
  'copy-button',
  'button',
  'button-group',
  'icon-button',
  'split-button',
  'toggle-button',
  'toggle-group',
  'icon',
  'link',
  'dialog',
] as const;

export const COMMERCE_SLUGS = [
  'product-card',
  'facet-filters',
  'price-display',
  'quantity-selector',
  'review-summary',
  'cart',
  'checkout-steps',
  'payment-form',
  'plan-picker',
  'invoice',
] as const;

export const AUTH_SLUGS = [
  'auth-form',
  'sso-buttons',
  'passkey-prompt',
  'mfa-challenge',
  'session-list',
  'role-matrix',
  'profile-menu',
] as const;

export const COMMERCE_AUTH_UI_SLUGS = [
  'input',
  'password-input',
  'otp-input',
  'credit-card-input',
  'iban-input',
  'currency-input',
  'phone-input',
  'masked-input',
  'number-input',
  'textarea',
  'select',
  'option',
  'option-group',
  'combobox',
  'multi-select',
  'creatable-select',
  'checkbox',
  'switch',
  'radio-group',
  'radio',
  'rating',
  'captcha-slot',
] as const;

/**
 * Canonical 256-tag Methane UI coverage manifest:
 * - 5 `@methane-ui/css` layout tags
 * - 3 `@methane-ui/primitives` utility elements
 * - 167 `@methane-ui/ui` core components
 * - 46 Domain Kit components (`ai` 8, `auth` 7, `admin` 13, `chat` 8, `commerce` 10)
 * - 35 Satellite components (`maps` 7, `3d` 1, `media` 3, `charts` 2, `datagrid` 5, `spreadsheet` 2, `flow` 2, `code` 4, `editor` 4, `pdf` 1, `rtc` 4)
 */
export const COVERAGE_MANIFEST: ReadonlyArray<CoverageTagEntry> = Object.freeze([
  // Slice 2: shell-ssr-studio (43 tags across overview + studio + app-shell)
  ...entriesFor('@methane-ui/css', 'css-layout', 'shell-ssr-studio', 'overview', CSS_LAYOUT_TAG_SLUGS),
  ...entriesFor('@methane-ui/primitives', 'primitives', 'shell-ssr-studio', 'overview', PRIMITIVES_UTILITY_SLUGS),
  ...entriesFor(
    '@methane-ui/ui',
    'ui',
    'shell-ssr-studio',
    'overview',
    SHELL_STUDIO_UI_SLUGS.slice(0, 30),
  ),
  ...entriesFor(
    '@methane-ui/ui',
    'ui',
    'shell-ssr-studio',
    'studio',
    SHELL_STUDIO_UI_SLUGS.slice(30),
  ),

  // Slice 3: view-spatial (34 tags)
  ...entriesFor('@methane-ui/maps', 'satellite', 'view-spatial', 'spatial', SPATIAL_MAPS_SLUGS),
  ...entriesFor('@methane-ui/3d', 'satellite', 'view-spatial', 'spatial', SPATIAL_3D_SLUGS),
  ...entriesFor('@methane-ui/media', 'satellite', 'view-spatial', 'spatial', SPATIAL_MEDIA_SLUGS),
  ...entriesFor('@methane-ui/ui', 'ui', 'view-spatial', 'spatial', SPATIAL_UI_SLUGS),

  // Slice 4: view-telemetry (34 tags)
  ...entriesFor('@methane-ui/charts', 'satellite', 'view-telemetry', 'telemetry', TELEMETRY_CHARTS_SLUGS),
  ...entriesFor('@methane-ui/datagrid', 'satellite', 'view-telemetry', 'telemetry', TELEMETRY_DATAGRID_SLUGS),
  ...entriesFor('@methane-ui/spreadsheet', 'satellite', 'view-telemetry', 'telemetry', TELEMETRY_SPREADSHEET_SLUGS),
  ...entriesFor('@methane-ui/admin', 'kit', 'view-telemetry', 'telemetry', TELEMETRY_ADMIN_SLUGS),
  ...entriesFor('@methane-ui/ui', 'ui', 'view-telemetry', 'telemetry', TELEMETRY_UI_SLUGS),

  // Slice 5: view-operations (54 tags)
  ...entriesFor('@methane-ui/admin', 'kit', 'view-operations', 'operations', OPERATIONS_ADMIN_SLUGS),
  ...entriesFor('@methane-ui/datagrid', 'satellite', 'view-operations', 'operations', OPERATIONS_DATAGRID_SLUGS),
  ...entriesFor('@methane-ui/flow', 'satellite', 'view-operations', 'operations', OPERATIONS_FLOW_SLUGS),
  ...entriesFor('@methane-ui/code', 'satellite', 'view-operations', 'operations', OPERATIONS_CODE_SLUGS),
  ...entriesFor('@methane-ui/editor', 'satellite', 'view-operations', 'operations', OPERATIONS_EDITOR_SLUGS),
  ...entriesFor('@methane-ui/pdf', 'satellite', 'view-operations', 'operations', OPERATIONS_PDF_SLUGS),
  ...entriesFor('@methane-ui/ui', 'ui', 'view-operations', 'operations', OPERATIONS_UI_SLUGS),

  // Slice 6: view-war-room (52 tags)
  ...entriesFor('@methane-ui/ai', 'kit', 'view-war-room', 'war-room', WAR_ROOM_AI_SLUGS),
  ...entriesFor('@methane-ui/chat', 'kit', 'view-war-room', 'war-room', WAR_ROOM_CHAT_SLUGS),
  ...entriesFor('@methane-ui/rtc', 'satellite', 'view-war-room', 'war-room', WAR_ROOM_RTC_SLUGS),
  ...entriesFor('@methane-ui/media', 'satellite', 'view-war-room', 'war-room', WAR_ROOM_MEDIA_SLUGS),
  ...entriesFor('@methane-ui/ui', 'ui', 'view-war-room', 'war-room', WAR_ROOM_UI_SLUGS),

  // Slice 7: view-commerce-auth (39 tags)
  ...entriesFor('@methane-ui/commerce', 'kit', 'view-commerce-auth', 'commerce-auth', COMMERCE_SLUGS),
  ...entriesFor('@methane-ui/auth', 'kit', 'view-commerce-auth', 'commerce-auth', AUTH_SLUGS),
  ...entriesFor('@methane-ui/ui', 'ui', 'view-commerce-auth', 'commerce-auth', COMMERCE_AUTH_UI_SLUGS),
]);

export const ALL_256_MTH_TAGS: ReadonlyArray<`mth-${string}`> = Object.freeze(
  COVERAGE_MANIFEST.map((entry) => entry.tag),
);

export const ALL_251_CUSTOM_ELEMENT_TAGS: ReadonlyArray<`mth-${string}`> = Object.freeze(
  COVERAGE_MANIFEST.filter((entry) => entry.layer !== 'css-layout').map((entry) => entry.tag),
);

export const ALL_5_CSS_LAYOUT_TAGS: ReadonlyArray<`mth-${string}`> = Object.freeze(
  COVERAGE_MANIFEST.filter((entry) => entry.layer === 'css-layout').map((entry) => entry.tag),
);

export function getTagsForSlice(slice: AtmosSliceId): ReadonlyArray<`mth-${string}`> {
  return COVERAGE_MANIFEST.filter((entry) => entry.ownerSlice === slice).map((entry) => entry.tag);
}

export function getTagsForRoute(route: AtmosRouteId): ReadonlyArray<`mth-${string}`> {
  return COVERAGE_MANIFEST.filter((entry) => entry.route === route).map((entry) => entry.tag);
}

export const ALL_CSS_UTILITY_CLASSES = Object.freeze({
  layout: [
    'mth-app-shell',
    'mth-app-shell-header',
    'mth-app-shell-sidebar',
    'mth-app-shell-main',
    'mth-app-shell-aside',
    'mth-app-shell-footer',
    'mth-sidebar-layout',
    'mth-stack',
    'mth-grid',
    'mth-grid-subgrid',
    'mth-flex',
    'mth-container',
    'mth-bento-grid',
    'mth-bento-item',
    'mth-aspect-ratio',
    'mth-sticky',
    'mth-divider',
    'mth-spacer',
  ],
  prose: ['mth-prose', 'mth-dl'],
  marketing: [
    'mth-announcement-bar',
    'mth-hero',
    'mth-hero-content',
    'mth-hero-eyebrow',
    'mth-hero-title',
    'mth-hero-lead',
    'mth-hero-actions',
    'mth-hero-media',
    'mth-feature-grid',
    'mth-feature-card',
    'mth-feature-icon',
    'mth-logo-cloud',
    'mth-testimonial',
    'mth-testimonial-author',
    'mth-pricing-table',
    'mth-pricing-tier',
    'mth-pricing-featured',
    'mth-pricing-price',
    'mth-pricing-features',
    'mth-pricing-cta',
    'mth-faq',
    'mth-article-layout',
    'mth-article-header',
    'mth-article-body',
    'mth-article-aside',
    'mth-cta',
    'mth-cta-actions',
    'mth-footer',
    'mth-footer-grid',
    'mth-footer-brand',
    'mth-footer-links',
    'mth-footer-bottom',
  ],
  forms: [
    'mth-btn',
    'mth-btn-soft',
    'mth-btn-outline',
    'mth-btn-ghost',
    'mth-btn-danger',
    'mth-input',
    'mth-select',
  ],
} as const);

export const SUPPORTED_ATMOS_LOCALES: ReadonlyArray<{
  readonly code: AtmosLocaleCode;
  readonly label: string;
  readonly nativeLabel: string;
  readonly dir: 'ltr' | 'rtl';
  readonly basinControlCenter: string;
}> = Object.freeze([
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr', basinControlCenter: 'Houston Orbital Command' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr', basinControlCenter: 'Centro Neuquén Vaca Muerta' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr', basinControlCenter: 'Station Toulouse CNES' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr', basinControlCenter: 'Leitstelle Oberpfaffenhofen DLR' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', dir: 'ltr', basinControlCenter: '筑波GOSATテレメトリ局' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', nativeLabel: '简体中文', dir: 'ltr', basinControlCenter: '鄂尔多斯甲烷监测中心' },
  { code: 'ar', label: 'Arabic (RTL)', nativeLabel: 'العربية', dir: 'rtl', basinControlCenter: 'مركز الظهران لرصد الميثان' },
  { code: 'he', label: 'Hebrew (RTL)', nativeLabel: 'עברית', dir: 'rtl', basinControlCenter: 'מרכז בקרת לוויינים תל־אביב' },
]);

export const ATMOS_PACKAGES: ReadonlyArray<AtmosPackageEntry> = Object.freeze([
  { name: '@methane-ui/tokens', layer: 'foundation', description: 'OKLCH seeds, light-dark(), density, forced-colors & W3C DTCG compiler', showcasedIn: ['overview', 'studio'] },
  { name: '@methane-ui/sanitize', layer: 'foundation', description: 'Native setHTML + DOMPurify HTML/Markdown/stream sanitizer & URL firewall', showcasedIn: ['war-room', 'studio'] },
  { name: '@methane-ui/core', layer: 'foundation', description: 'Lit 3 UIElement, runtime coordinators, i18n, registerStyles & @lit/context', showcasedIn: ['overview', 'studio'] },
  { name: '@methane-ui/primitives', layer: 'foundation', description: 'ReactiveControllers, AutoLoader, DataController, masks & utility elements', showcasedIn: ['overview', 'telemetry', 'commerce-auth', 'studio'] },
  { name: '@methane-ui/css', layer: 'foundation', description: 'Ordered @layer reset, FOUC guard, layout, prose, marketing & form CSS', showcasedIn: ['overview'] },
  { name: '@methane-ui/locales', layer: 'foundation', description: '8 lazy-loaded BCP-47 locale packs with Intl.PluralRules & RTL (ar, he)', showcasedIn: ['studio', 'overview'] },
  { name: '@methane-ui/ui', layer: 'ui', description: '167 accessible, form-associated core Web Components', showcasedIn: ['overview', 'spatial', 'telemetry', 'operations', 'war-room', 'commerce-auth', 'studio'] },
  { name: '@methane-ui/ai', layer: 'kit', description: '8 AI/LLM copilot components (prompts, streaming, thinking, tools, citations, artifacts)', showcasedIn: ['war-room'] },
  { name: '@methane-ui/auth', layer: 'kit', description: '7 Zero-Trust IAM components (auth form, SSO, passkeys, MFA, sessions, RBAC matrix)', showcasedIn: ['commerce-auth'] },
  { name: '@methane-ui/admin', layer: 'kit', description: '13 enterprise ops & data components (kanban, audit, query/filter, CSV, booking, explorer)', showcasedIn: ['telemetry', 'operations'] },
  { name: '@methane-ui/chat', layer: 'kit', description: '8 real-time war-room collaboration components (threads, cursors, presence, reactions)', showcasedIn: ['war-room'] },
  { name: '@methane-ui/commerce', layer: 'kit', description: '10 hardware & carbon-credit storefront, checkout, subscription & invoice components', showcasedIn: ['commerce-auth'] },
  { name: '@methane-ui/charts', layer: 'satellite', description: 'Apache ECharts declarative telemetry series with accessible table fallback', showcasedIn: ['telemetry'] },
  { name: '@methane-ui/pdf', layer: 'satellite', description: 'Mozilla pdf.js accessible OGMP 2.0 compliance viewer with outline & search', showcasedIn: ['operations'] },
  { name: '@methane-ui/3d', layer: 'satellite', description: 'Three.js orbital spectrometer 3D hardware twin with poster & GPU cleanup', showcasedIn: ['spatial'] },
  { name: '@methane-ui/maps', layer: 'satellite', description: '7 MapLibre GL & SVG spatial components (plumes, clusters, routes, floor plan, seat map)', showcasedIn: ['spatial'] },
  { name: '@methane-ui/rtc', layer: 'satellite', description: '4 WebRTC responder video grid, camera, audio & screen capture components', showcasedIn: ['war-room'] },
  { name: '@methane-ui/flow', layer: 'satellite', description: 'Dagre SCADA shutoff DAG editor & Global Incident Command org chart', showcasedIn: ['operations'] },
  { name: '@methane-ui/media', layer: 'satellite', description: 'Thermal drone image annotator, orbital Lottie pulse & ultrasonic leak waveform', showcasedIn: ['spatial', 'war-room'] },
  { name: '@methane-ui/editor', layer: 'satellite', description: 'ProseMirror postmortem editor, Markdown SOP editor & KaTeX plume dispersion math', showcasedIn: ['operations'] },
  { name: '@methane-ui/code', layer: 'satellite', description: 'CodeMirror 6 firmware editor, syntax block, calibration diff & JSON schema editor', showcasedIn: ['operations'] },
  { name: '@methane-ui/datagrid', layer: 'satellite', description: 'TanStack virtual datagrid, basin pivot table, facility tree table, scheduler & Gantt', showcasedIn: ['telemetry', 'operations'] },
  { name: '@methane-ui/spreadsheet', layer: 'satellite', description: 'Virtualized EPA emission-factor workbook & formula bar with MIT AST evaluator', showcasedIn: ['telemetry'] },
  { name: '@methane-ui/ssr', layer: 'ssr', description: 'Streaming Declarative Shadow DOM SSR (linked <1KB shell + inline + transformHtmlDsd + hydrateRoot)', showcasedIn: ['overview', 'studio'] },
  { name: '@methane-ui/codemod', layer: 'tooling', description: 'AST codemod & prefix migration manifest for white-label <atmos-*> tags', showcasedIn: ['studio'] },
  { name: '@methane-ui/lint-plugin', layer: 'tooling', description: 'ESLint & Stylelint architectural & XSS security invariants', showcasedIn: ['studio'] },
]);
