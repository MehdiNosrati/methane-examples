# Methane Component, Layout & Foundation Reference

Complete, source-verified directory of all **256 `mth-*` tags** (**251 Custom Elements** + **5 pure-CSS Light-DOM layout tags**), **23 CSS primitives**, **64 Form-Associated (`FACE`) controls**, JS-only `.prop` contracts, and Foundation helpers (`@methane-ui/{primitives,sanitize,locales}`).

---

## 1. Pure CSS Layouts, Prose, Marketing & Native Forms (`@methane-ui/css`)

Import `@methane-ui/css/index.css` for the complete CSS bundle, or granular stylesheets (`layers.css`, `base.css`, `reset.css`, `defined-guard.css`, `layout.css`, `prose.css`, `marketing.css`).

> **Important**: Do **not** import `@methane-ui/css/forms.css` directly — `./forms.css` is omitted from `packages/css/package.json#exports` (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Import `@methane-ui/css/index.css` instead (which bundles `forms.css`).

### Layout Primitives (`layout.css` — `@layer mth.primitives`)

Only **5 Light-DOM `<mth-*>` tags** are exempted from `defined-guard.css` (`opacity: 0` on `:not(:defined)`): **`<mth-stack>`, `<mth-grid>`, `<mth-flex>`, `<mth-container>`, `<mth-spacer>`**. Use CSS classes for all other layouts.

Shared gap scale on `stack`, `grid`, and `flex`: `data-gap="0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12"`.

| Class & Exempted Tag | Modifiers & Required Child Classes |
| --- | --- |
| `.mth-stack` / `<mth-stack>` | `data-inline`, `data-direction="row\|column"`, `data-wrap`, `data-align="start\|center\|end\|stretch\|baseline"`, `data-justify="start\|center\|end\|between\|around\|evenly"`, `data-gap="0..12"` |
| `.mth-grid` / `<mth-grid>` | `data-columns="1\|2\|3\|4\|6\|12"`, `data-gap="0..12"`; child `.mth-grid-subgrid` |
| `.mth-flex` / `<mth-flex>` | `data-wrap="wrap\|nowrap"`, `data-align="start\|center\|end\|stretch\|baseline"`, `data-justify="start\|center\|end\|between\|around\|evenly"`, `data-gap="0..12"` |
| `.mth-container` / `<mth-container>` | `data-size="sm\|md\|lg\|xl\|prose\|full"` (`container-type: inline-size`) |
| `.mth-spacer` / `<mth-spacer>` | `data-size="1\|2\|4\|6\|8\|12\|16"` (flex-grow when omitted) |
| `.mth-aspect-ratio` (class only) | `data-ratio="1/1 \| 3/2 \| 4/3 \| 16/9 \| 21/9"` (**slash syntax `16/9`, not colon**) |
| `.mth-sticky` (class only) | `data-edge="end"` (top/block-start default; bottom/block-end with `data-edge="end"`) |
| `.mth-divider` (class only) | `data-orientation="vertical"` (optional centered text child) |
| `.mth-app-shell` (class only) | Children: `.mth-app-shell-header` (`[data-region="header"]`), `.mth-app-shell-sidebar` (`[data-region="sidebar"]`), `.mth-app-shell-main` (`[data-region="main"]`), `.mth-app-shell-aside` (`[data-region="aside"]`), `.mth-app-shell-footer` (`[data-region="footer"]`) |
| `.mth-sidebar-layout` (class only) | `data-side="end"` |
| `.mth-bento-grid` (class only) | Child `.mth-bento-item` supports `data-span="2\|3"` and `data-row-span="2"` |

### Typography, Marketing & Native Form Classes

- **Typography (`prose.css`)**: `.mth-prose`, `.mth-dl` (`data-variant="bordered"`, `data-layout="stacked"`).
- **Marketing (`marketing.css`)**:
  - `.mth-hero` (`data-align="center"`, `data-layout="split"`; children `.mth-hero-content`, `.mth-hero-eyebrow`, `.mth-hero-title`, `.mth-hero-lead`, `.mth-hero-actions`, `.mth-hero-media`)
  - `.mth-feature-grid` (children `.mth-feature-card`, `.mth-feature-icon`)
  - `.mth-testimonial` (`data-variant="card"`, child `.mth-testimonial-author`)
  - `.mth-logo-cloud`
  - `.mth-footer` (children `.mth-footer-grid`, `.mth-footer-brand`, `.mth-footer-links`, `.mth-footer-bottom`)
  - `.mth-faq` (0 B JS exclusive accordion using native `<details name="...">`)
  - `.mth-article-layout` (children `.mth-article-header`, `.mth-article-body`, `.mth-article-aside`)
  - `.mth-pricing-table` (children `.mth-pricing-tier`, `.mth-pricing-featured` / `[data-featured]`, `.mth-pricing-price`, `.mth-pricing-features`, `.mth-pricing-cta`)
  - `.mth-cta` (`data-variant="accent"`, child `.mth-cta-actions`)
  - `.mth-announcement-bar` (`data-variant="warning"`)
- **Native Form Controls (`forms.css` via `index.css`)**: `.mth-btn` (`.mth-btn-soft`, `.mth-btn-outline` / `.mth-btn-outlined`, `.mth-btn-ghost`, `.mth-btn-danger`), `.mth-input`, `.mth-select`.

---

## 2. Utility Elements, `AutoLoader` & Headless Controllers (`@methane-ui/primitives`)

### 3 Utility Custom Elements (`registerUtilityElements(prefix = 'mth')`)

- `mth-visually-hidden` (`MthVisuallyHiddenElement`) — screen-reader-only inline clip-rect wrapper.
- `mth-skip-link` (`MthSkipLinkElement`) — offscreen until `:focus-visible`; `href="#main"` focuses & scrolls target landmark.
- `mth-error-boundary` (`MthErrorBoundaryElement`) — catches `error` / `mth-component-error` from descendants, renders `role="alert"` fallback (`fallback-message` attr or `slot="fallback"`), and emits `mth-error` / `mth-recover` (`.reset()`).

### `AutoLoader` & Headless Helpers

- **`AutoLoader`**: Lazy-loads unregistered custom elements via `MutationObserver`. Call **`loader.start(root?)`** and **`loader.stop()`** (there is no `.observe()` method):
  ```ts
  import { AutoLoader } from '@methane-ui/primitives';
  const loader = new AutoLoader({
    prefix: 'mth-',
    resolveTag: (tag) => import(`@methane-ui/ui/${tag.slice(4)}`),
  });
  loader.start(document.documentElement);
  ```
- **`DataController` & `createArrayDataSource(items, filterFn?)` — Auto-Load Asymmetry**:
  - `mth-load-more` and `mth-infinite-scroll` (`auto-load` default `true`) trigger `.load()` automatically when `.dataSource` is assigned.
  - **`mth-datagrid` and `mth-table` do NOT auto-load** (`{ load: false }`) and immediately shadow `.rows` with `[]` whenever `.dataSource` is non-null! If you bind `.dataSource` on `mth-datagrid` or `mth-table`, you must call `grid.load()` / `table.query()` on client mount (or bind `.rows=${rows}` directly for first-byte SSR).
- **Validators & Calendar Math**: `validateLuhn(digits)` (**strip spaces/hyphens first**: `card.replace(/[\s-]/g, '')`), `validateIbanMod97(iban)` (strips spaces internally), `MaskAndFormatEngine` (pattern tokens: `0`/`9` digit, `A` ASCII letter, `*` alphanumeric), `expandRRule(rrule, opts)`, `formatIsoDate(date)`.

---

## 3. Core UI (`@methane-ui/ui/<slug>`) — Complete 167 Custom Elements

Import granular subpaths (`import '@methane-ui/ui/button'`) for tree-shaking, or `registerAllComponents(prefix?)` from `@methane-ui/ui`. Controls marked **`(FACE)`** (46 total in `@methane-ui/ui`) are Form-Associated Custom Elements (`ElementInternals`).

- **Actions (11)**: `mth-back-to-top`, `mth-button` `(FACE)`, `mth-button-group`, `mth-copy-button`, `mth-fab`, `mth-icon-button`, `mth-share-button`, `mth-speed-dial`, `mth-split-button`, `mth-toggle-button`, `mth-toggle-group` `(FACE)`
- **Forms, Selection & Specialized Inputs (54)**: `mth-address-input` `(FACE)`, `mth-async-search` `(FACE)`, `mth-captcha-slot` `(FACE)`, `mth-cascader` `(FACE)`, `mth-checkbox` `(FACE)`, `mth-color-picker` `(FACE)`, `mth-combobox` `(FACE)`, `mth-conditional-field`, `mth-creatable-select` `(FACE)`, `mth-credit-card-input` `(FACE)`, `mth-cron-builder` `(FACE)`, `mth-currency-input` `(FACE)`, `mth-drawing-pad`, `mth-dropzone`, `mth-duration-input` `(FACE)`, `mth-emoji-picker`, `mth-error-summary`, `mth-field`, `mth-fieldset`, `mth-file-upload` `(FACE)`, `mth-form`, `mth-form-repeater` `(FACE)`, `mth-form-wizard`, `mth-iban-input` `(FACE)`, `mth-image-cropper`, `mth-inline-edit` `(FACE)`, `mth-input` `(FACE)`, `mth-masked-input` `(FACE)`, `mth-mention-input` `(FACE)`, `mth-multi-select` `(FACE)`, `mth-newsletter-form` `(FACE)`, `mth-number-input` `(FACE)`, `mth-option`, `mth-option-group`, `mth-otp-input` `(FACE)`, `mth-password-input` `(FACE)`, `mth-phone-input` `(FACE)`, `mth-radio`, `mth-radio-group` `(FACE)`, `mth-range-slider` `(FACE)`, `mth-rating` `(FACE)`, `mth-rrule-editor` `(FACE)`, `mth-schema-form`, `mth-search-input` `(FACE)`, `mth-segmented-control` `(FACE)`, `mth-select` `(FACE)`, `mth-signature-pad` `(FACE)`, `mth-slider` `(FACE)`, `mth-sortable`, `mth-switch` `(FACE)`, `mth-tag-input` `(FACE)`, `mth-textarea` `(FACE)`, `mth-transfer-list` `(FACE)`, `mth-upload-progress`
- **Date, Time & Timers (11)**: `mth-calendar`, `mth-clock`, `mth-countdown`, `mth-date-picker` `(FACE)`, `mth-date-range-calendar`, `mth-date-range-picker` `(FACE)`, `mth-datetime-picker` `(FACE)`, `mth-month-picker` `(FACE)`, `mth-stopwatch`, `mth-time-picker` `(FACE)`, `mth-timezone-picker` `(FACE)`
- **Navigation, Layout & Disclosure (29)**: `mth-accordion`, `mth-accordion-item`, `mth-bottom-nav`, `mth-breadcrumb-item`, `mth-breadcrumb-path`, `mth-breadcrumbs`, `mth-link`, `mth-mega-menu`, `mth-menubar`, `mth-navbar`, `mth-pagination`, `mth-resizable-group`, `mth-resizable-handle`, `mth-resizable-panel`, `mth-scroll-area`, `mth-sidebar-nav`, `mth-site-search`, `mth-split-pane`, `mth-step`, `mth-stepper`, `mth-tab`, `mth-tab-panel`, `mth-tabs`, `mth-toc`, `mth-tree`, `mth-tree-item`, `mth-tree-nav`, `mth-virtual-scroller`, `mth-zoom-pan`
- **Overlays, Menus & Guided Tours (18)**: `mth-bottom-sheet`, `mth-coachmark`, `mth-command-palette`, `mth-context-menu`, `mth-cookie-banner`, `mth-dialog`, `mth-drawer`, `mth-dropdown-menu`, `mth-floating-panel`, `mth-fullscreen-overlay`, `mth-hover-card`, `mth-lightbox`, `mth-loading-overlay`, `mth-menu-item`, `mth-popover`, `mth-tooltip`, `mth-tour`, `mth-tour-step`
- **Data Display, Media & Feedback (44)**: `mth-activity-feed`, `mth-alert`, `mth-audio-player`, `mth-avatar`, `mth-avatar-group`, `mth-badge`, `mth-banner`, `mth-barcode`, `mth-before-after`, `mth-calendar-heatmap`, `mth-callout`, `mth-card`, `mth-carousel`, `mth-carousel-item`, `mth-code-tabs`, `mth-column`, `mth-comparison-table`, `mth-empty-state`, `mth-gallery`, `mth-icon`, `mth-image`, `mth-infinite-scroll`, `mth-inline-status`, `mth-key-value`, `mth-list`, `mth-list-item`, `mth-load-more`, `mth-masonry`, `mth-network-status`, `mth-notification-center`, `mth-progress-bar`, `mth-progress-ring`, `mth-qr-code`, `mth-skeleton`, `mth-sparkline`, `mth-spinner`, `mth-stat-card`, `mth-status-indicator`, `mth-table`, `mth-tag`, `mth-timeline`, `mth-timeline-item`, `mth-toast`, `mth-video-player`

### Core UI Key Contracts & Gotchas

- **Compound parent -> child elements**:
  - `mth-accordion` -> `mth-accordion-item`
  - `mth-tabs` -> `mth-tab` (**must set `slot="tab"`** and `panel="<id>"`) + `mth-tab-panel` (`name="<id>"`)
  - `mth-select` / `mth-combobox` -> `mth-option` + `mth-option-group` (whereas `mth-multi-select` & `mth-creatable-select` take `.options=${[...]}` with no default slot)
  - `mth-radio-group` -> `mth-radio`
  - `mth-dropdown-menu` (`slot="trigger"` + default slot) / `mth-context-menu` -> `mth-menu-item` (supports nested `slot="submenu"`)
  - `mth-table` -> `.columns` + `.rows` (when using declarative `<mth-column>`, also pass `.columns=${cols}` for SSR hydration parity!)
  - `mth-list` -> `mth-list-item`; `mth-carousel` -> `mth-carousel-item`; `mth-stepper` -> `mth-step`; `mth-timeline` -> `mth-timeline-item`; `mth-tour` -> `mth-tour-step`; `mth-breadcrumbs` -> `mth-breadcrumb-item`
  - `mth-resizable-group` -> `mth-resizable-panel` + `mth-resizable-handle`
- **Named slots**: `mth-navbar` uses `slot="brand"`, default `<slot>` (nav), `slot="actions"`, and `slot="mobile"`; `mth-split-pane` requires `slot="start"` & `slot="end"` (`slot="divider"` optional); `mth-before-after` requires `slot="before"` & `slot="after"`; `mth-popover` / `mth-hover-card` / `mth-dropdown-menu` require `slot="trigger"`, whereas `mth-tooltip` places the trigger in the default slot and tooltip body in `content="..."` or `slot="content"`.
- **Collection prop names**: `mth-code-tabs` takes `.tabs=${[...]}` (`CodeTabItem[]`), `mth-command-palette` takes `.commands=${[...]}`, while `mth-menubar`, `mth-sidebar-nav`, `mth-bottom-nav`, `mth-site-search`, and `mth-breadcrumb-path` take `.items=${[...]}`.
- **JS-only props omitted from CEM (`v0.1.1`)**: `mth-sortable` accepts `.items` (`ReadonlyArray<MthSortableItem>`); `mth-schema-form` accepts `.schema` (`JsonSchemaSubset`) & `.value`; `mth-form-repeater` accepts `.fields` & `.items`; `mth-conditional-field` accepts `.values` & `.when` (pass `.values` during SSR since `closest('form')` is `null`); `mth-form-wizard` discovers Light-DOM step children via `data-step` and `data-title`.
- **Timers & addresses**: `mth-countdown` `duration` is in **seconds** (not ms); `mth-address-input` serializes structured JSON `{ street, street2, city, region, postalCode, country }` to `FormData`.

---

## 4. Domain Kits (`@methane-ui/{admin,ai,auth,chat,commerce}`) — All 46 Custom Elements

Subpath imports (`@methane-ui/admin/kanban`) auto-register; root barrels export classes + `registerAllComponents(prefix?)`.

- **`@methane-ui/admin` (13)**:
  - `mth-audit-log` (`.entries`), `mth-availability-picker` `(FACE)` (`.slots` / `.value`), `mth-booking-widget` `(FACE)` (`.availableSlots: BookingDaySlots[]`; encodes `value` as `"${date}T${slot}"`), `mth-bulk-action-bar` (`.actions`, emits `mth-action` / `mth-select-all` / `mth-clear-selection`), `mth-column-chooser` (`.columns`), `mth-csv-importer` (`.fields`, emits `mth-parse` / `mth-import`), `mth-event-calendar` (`.events`), `mth-file-explorer` (`.items`), `mth-filter-builder` (`.fields`, `.rules`), `mth-kanban` (`.lanes`, `.cards`), `mth-query-builder` `(FACE)` (`.fields`, `.query`), `mth-saved-views` (`.views`, emits `mth-view-select` / `mth-view-create`), `mth-settings-shell` (`.sections`)
- **`@methane-ui/ai` (8)**:
  - `mth-ai-feedback` (`rating`), `mth-ai-message` (`role`, `content`, `streaming`; SSR-safe Markdown when `allow-raw-html` is `false`), `mth-artifact-pane` (`kind`, `title`, `content`, `.versions`; `active-tab="code"` renders on first-byte SSR while `"preview"` hydrates via client sanitizer), `mth-citation-list` (`.citations`), `mth-prompt-input` `(FACE)` (`value`, `streaming`, `submit-on-enter`, slots `attachments`/`model`/`actions`, emits `mth-submit`/`mth-stop`), `mth-suggestion-chips` (`.items`, emits `mth-select`), `mth-thinking-indicator` (`open`, `streaming`, `elapsed-seconds`, `summary`, `content`), `mth-tool-call` (`name`, `status`, `duration-ms`, `.args`, `.output`)
- **`@methane-ui/auth` (7)**:
  - `mth-auth-form` `(FACE)` (`mode="signin|signup|reset|magic-link"`, `email`, `loading`, emits `mth-submit`), `mth-mfa-challenge` `(FACE)` (`mode="totp|backup"`, `length`, `allow-resend`, emits `mth-complete`/`mth-submit`), `mth-passkey-prompt` (`mode="signin|register"`, `status`, emits `mth-passkey-auth`/`mth-fallback`), `mth-profile-menu` (`user-name`, `user-email`, **`user-role`** attr, `.items`), `mth-role-matrix` (`.roles`, `.permissions`, `.grants`), `mth-session-list` (`.sessions`), `mth-sso-buttons` (`.providers`, emits `mth-sso-select`)
- **`@methane-ui/chat` (8)**:
  - `mth-chat-thread` (`.messages`), `mth-collab-cursors` (`.cursors` — **each `cursor.color` must be `oklch(...)` or `var(--mth-color-*)`**, hex/RGB is rejected), `mth-comment-thread` (`.comments`), `mth-message-composer` `(FACE)` (`value`, `placeholder`, emits `mth-submit`), `mth-notification-bell` (`.items`; defaults to `useStore = true` — set **`.useStore=${false}`** when driving `.items` explicitly), `mth-presence-badge` (`status`), `mth-reaction-bar` (`.reactions`), `mth-typing-indicator` (`.users`)
- **`@methane-ui/commerce` (10)**:
  - `mth-cart` (`.items: CartItem[]`), `mth-checkout-steps` (`.steps: CheckoutStep[]`, `current-step`), `mth-facet-filters` (`.facets: FacetGroup[]`), `mth-invoice` (`.seller`, `.buyer`, `.items`, `invoice-number`), `mth-payment-form` `(FACE)` (`name`, `disabled`, emits `mth-submit`), `mth-plan-picker` `(FACE)` (`.plans: BillingPlan[]`, `value`, `billing-cycle`), `mth-price-display` (`amount`, `currency`, `compare-at`), `mth-product-card` (`title`, `price`, `currency`, `image-src`, `badge`), `mth-quantity-selector` `(FACE)` (`value`, `min`, `max`, `step`), `mth-review-summary` (`average`, `total`, `.breakdown: Record<number, number>`)

---

## 5. Wrap-First Satellites (`@methane-ui/*`) — All 35 Custom Elements & Offline Config

All third-party engines are direct `dependencies` of each satellite package and lazy-loaded on the client with deterministic SVG/HTML SSR fallbacks:

- **`@methane-ui/charts` (2 — Apache ECharts)**: `mth-chart` (`type` across 19 chart types, **`chart-title`** attr, `.categories` / `categories-json`, `.series` / `data-json`, `show-fallback` + `<table slot="fallback">`), `mth-chart-series`
- **`@methane-ui/datagrid` (5 — TanStack Table & Virtual)**: `mth-datagrid` (`.columns`, `.rows` or `.dataSource` + `.load()`, emits `mth-sort-change`), `mth-pivot-table` (`.data`, `row-field`, `col-field`, `value-field`, `agg-fn`), `mth-tree-table` (`.columns`, `.rows`), `mth-scheduler` (`.resources`, `.events`), `mth-gantt` (`.tasks`)
- **`@methane-ui/editor` (4 — ProseMirror + KaTeX)**: `mth-rich-editor` `(FACE)`, `mth-markdown`, `mth-markdown-editor` `(FACE)`, `mth-math-editor` `(FACE)` (`value` LaTeX, KaTeX `trust: false`)
- **`@methane-ui/code` (4 — CodeMirror 6)**: `mth-code-editor` `(FACE)` (`language`, `value`), `mth-code-block` (`language`, `code`), `mth-diff-viewer` (`original`, `modified`, `view-mode="split|unified"`), `mth-json-editor` `(FACE)` (`value`)
- **`@methane-ui/maps` (7 — MapLibre GL + SVG fallback)**: `mth-map` (`.mapStyle` inline GeoJSON `StyleSpecification` for zero-network offline maps, or `style-url`; `.markers`), `mth-map-route` (`.coordinates`), `mth-map-draw` (`.features` uses `readonly [number, number]` coordinate tuples), `mth-map-cluster` (`.points`), `mth-location-picker` `(FACE)`, `mth-floor-plan` (`.rooms`), `mth-seat-map` `(FACE)` (`.seats`)
- **`@methane-ui/pdf` (1 — `pdfjs-dist`)**: `mth-pdf-viewer` (`src` or `.data = uint8Array`, `document-title`, **`worker-src="/_methane/pdf.worker.mjs"`** — serve `pdfjs-dist/build/pdf.worker.min.mjs` locally for offline/strict-CSP apps; `isSafeUrl` blocks `blob:`/`data:` on `src`)
- **`@methane-ui/3d` (1 — Three.js `GLTFLoader`)**: `mth-model-viewer` (`src` `/path.gltf`|`https://...` — `isSafeUrl` blocks `blob:`/`data:`; `poster` fallback, `auto-rotate`, `camera-controls`)
- **`@methane-ui/flow` (2 — `@dagrejs/dagre`)**: `mth-flow-editor` (`.nodes`, `.edges`, `direction="TB|LR|RL|BT|auto"`), `mth-org-chart` (`.nodes`)
- **`@methane-ui/media` (3 — DotLottie + Web Audio + SVG)**: `mth-lottie` (`src` or inline `.animationData`; **offline note**: `@lottiefiles/dotlottie-web` fetches WASM from jsDelivr unless you call `DotLottie.setWasmUrl('/_methane/dotlottie-player.wasm')` before mounting), `mth-waveform` (pass `.peaks=${number[]}` for deterministic SSR SVG bars; emits `mth-play`/`mth-pause`/`mth-seek` — pair with `<mth-audio-player>` for audio playback), `mth-image-annotator` (`src`, `.annotations`). Package also exports `isSafeMediaUrl`, `clamp`, `formatDuration`.
- **`@methane-ui/rtc` (4 — Native WebRTC / MediaRecorder)**: `mth-video-grid` (`.participants` — renders metadata tiles in `'idle'` without camera permissions), `mth-camera-capture`, `mth-audio-recorder`, `mth-screen-recorder`
- **`@methane-ui/spreadsheet` (2 — Built-in Formula AST Engine)**: `mth-spreadsheet` (`.cells`, `reference-mode="A1|R1C1"`, supports `=SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `IF`, `ROUND`, `ABS`, `CONCAT`, emits `mth-cell-select`/`mth-cell-change`), `mth-formula-bar` `(FACE)` (`cell-ref`, `value`, emits `mth-formula-input`/`mth-formula-commit`)

---

## 6. Sanitization (`@methane-ui/sanitize`) & Localization (`@methane-ui/locales`)

### `@methane-ui/sanitize`

| Function | Environment | Notes |
| --- | --- | --- |
| `isSafeUrl(url)` / `sanitizeUrl(url, fallback?)` | Universal (Node SSR + Browser) | Allows `#`, `/` (not `//`), `./`, `../`, `https:`, `http:`, `mailto:`, `tel:`. **Blocks `javascript:`, `data:`, and `blob:`**. |
| `escapeHtml(str)` | Universal (Node SSR + Browser) | Escapes `&`, `<`, `>`, `"`, `'`. |
| `sanitizeToTrustedHTML(html, opts?)` / `renderMarkdownToSafeHTML(md, opts?)` | Universal (with fallback) | Returns sanitized HTML / `TrustedHTML`. |
| `safeSetHTML(el, html)` / `safeSetMarkdown(el, md)` / `parseSafeFragment(html, opts?)` / `createStreamSanitizer()` | Browser DOM (`DOMParser` / `jsdom`) | Streaming chunk sanitizer (`.push(chunk)`, `.flushTo(el)`, `.toFragment()`) buffers split `<tag` tokens across LLM SSE chunks. In plain Node + JSDOM (`{ ownerDocument }`), set `globalThis.Document ??= window.Document` (`v0.1.1`). |

### `@methane-ui/locales` & `@methane-ui/core` i18n

- **8 Supported BCP-47 Packs (`SUPPORTED_LOCALES`)**: `en`, `es`, `fr`, `de`, `ja`, `zh-CN` (resolves `zh-Hans`), **`ar` (`rtl`)**, **`he` (`rtl`, resolves `iw`)**.
- **Helpers**: `loadLocalePack(locale)` (`@methane-ui/locales` 1-arg lazy pack loader -> pass returned pack to `registerLocalePack(pack)` from `@methane-ui/core`), `getLocaleDirection(locale)` (`'ltr' | 'rtl'`), `resolveSupportedLocale(locale)`, `isolateBidiValue(text)` (`@methane-ui/core`).
- **Formatting split**: `formatMessage(pack, 'table.rowsCount', params)` from `@methane-ui/locales` resolves built-in `ns.key` catalog entries only; for custom app plural/template entries (`PluralMessageForms`), call `formatI18nMessage(entry, params, locale)` from `@methane-ui/core`.
