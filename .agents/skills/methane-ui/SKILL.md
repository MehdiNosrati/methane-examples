---
name: methane-ui
description: Guides building UIs with Methane Web Components, pure CSS layout classes, domain kits, satellites, sanitization, localization, and framework wrappers across HTML, React, Vue, Angular, and Svelte. Use when selecting, importing, or wiring @methane-ui/* components or forms.
---

# Methane UI

Build accessible interfaces with **251 Web Components** (`167` Core UI, `46` Domain Kits, `35` Satellites, `3` Primitives utilities) and **23 zero-JS CSS primitives** (`@methane-ui/css`, including `5` Light-DOM `<mth-*>` layout tags).

## 1. Install & Required Peer Dependency

`@methane-ui/core` is a **required `peerDependency`** of `@methane-ui/ui`, `@methane-ui/primitives`, all 5 Domain Kits, and all 11 Satellites. Always install it explicitly:

```bash
pnpm add @methane-ui/core @methane-ui/tokens @methane-ui/css @methane-ui/ui
# Optional foundation / domain / satellite packages:
pnpm add @methane-ui/primitives @methane-ui/sanitize @methane-ui/locales @methane-ui/ai @methane-ui/charts
```

Third-party satellite engines (`echarts`, `pdfjs-dist`, `three`, `maplibre-gl`, `@dagrejs/dagre`, `@lottiefiles/dotlottie-web`, `katex`, `prosemirror-*`, `@codemirror/*`, `@tanstack/*`) are **bundled as direct `dependencies`** of each satellite package (under `pnpm` strict hoisting, add `pdfjs-dist` directly only if resolving `pdf.worker.min.mjs` from top-level `node_modules`).

## 2. Choose the Right Layer

| Need | Use | Example |
| --- | --- | --- |
| Spacing, grid, flex, app shell, prose, marketing | `@methane-ui/css` classes + 5 Light-DOM tags | `.mth-stack` / `<mth-stack>`, `.mth-bento-grid`, `.mth-prose` |
| Native zero-JS form controls | `@methane-ui/css/index.css` form classes | `.mth-btn`, `.mth-input`, `.mth-select` |
| A11y utility elements & headless controllers | `@methane-ui/primitives` | `<mth-skip-link>`, `<mth-visually-hidden>`, `<mth-error-boundary>`, `AutoLoader` |
| Interactive controls, overlays, validation (167) | `@methane-ui/ui/<slug>` | `<mth-button>`, `<mth-dialog>`, `<mth-combobox>`, `<mth-table>` |
| Domain workflows (46 across 5 kits) | `@methane-ui/{ai,auth,admin,chat,commerce}` | `<mth-prompt-input>`, `<mth-auth-form>`, `<mth-kanban>`, `<mth-cart>` |
| Heavy client engines (35 across 11 satellites) | `@methane-ui/{charts,datagrid,editor,code,maps,pdf,3d,rtc,flow,media,spreadsheet}` | `<mth-chart>`, `<mth-datagrid>`, `<mth-map>`, `<mth-spreadsheet>` |

## 3. Imports, Registration & JS-Only Properties

```ts
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css'; // NOTE: Do NOT import '@methane-ui/css/forms.css' (unexported in package.json)
import '@methane-ui/ui/button'; // Subpath imports auto-register <mth-button>
import { registerUtilityElements } from '@methane-ui/primitives';
registerUtilityElements(); // Registers mth-visually-hidden, mth-skip-link, mth-error-boundary
```

- **Subpath vs. barrel**: Subpath imports (`@methane-ui/ui/button`, `@methane-ui/maps/map`) and `/define` entrypoints (`@methane-ui/ui/define`, `@methane-ui/maps/define`) auto-register custom elements. Root barrel imports (`import '@methane-ui/maps'`, `'@methane-ui/ui'`) are side-effect-free — call `registerAllComponents(prefix?)` when using barrels.
- **White-label prefixes**: Import `registerMthButton('acme')` from `@methane-ui/ui/button/element` (or `registerAllComponents('acme')`), and rewrite source tags/tokens with `npx methane-codemod ./src --from-prefix mth- --to-prefix acme- --write`.
- **JS-only `.prop` rule (`attribute: false`)**: All array/object data props (`.rows`, `.columns`, `.items`, `.options`, `.lanes`, `.cards`, `.series`, `.nodes`, `.edges`, `.schema`, `.plans`, `.cells`, `.availableSlots`, `.grants`) MUST be assigned as **JS DOM properties** (`.rows=${data}` in Lit, native props in React 19/Vue/Angular/Svelte), never serialized into HTML attributes.
- **Pure-CSS tags**: Only `<mth-stack>`, `<mth-grid>`, `<mth-flex>`, `<mth-container>`, and `<mth-spacer>` are exempted in `defined-guard.css`. Use CSS classes (`.mth-app-shell`, `.mth-bento-grid`, `.mth-aspect-ratio`) for all other layouts so they are not hidden by `:not(:defined)`.

## 4. Compound Child & Named-Slot Contracts

| Component | Required Child / Slot Structure |
| --- | --- |
| `<mth-tabs>` | Slotted `<mth-tab slot="tab" panel="p1">` (**`slot="tab"` required!**) + `<mth-tab-panel name="p1">` |
| `<mth-split-pane>` | Requires `slot="start"` and `slot="end"` children (optional `slot="divider"`) |
| `<mth-before-after>` | Requires `slot="before"` and `slot="after"` media children |
| `<mth-popover>`, `<mth-hover-card>`, `<mth-dropdown-menu>` | Anchor button goes in **`slot="trigger"`**; default slot is popup content |
| `<mth-tooltip>` | Anchor control goes in **default slot**; tooltip text goes in `content="..."` or `slot="content"` |
| `<mth-navbar>` | Partitions children across `slot="brand"`, default `<slot>` (nav), `slot="actions"`, and `slot="mobile"` |
| `<mth-form-wizard>` | Step panels are Light-DOM children marked with `data-step="<id>"` and `data-title="<label>"` |
| `<mth-chart>` | Uses `chart-title` (not `title`); pass `<table slot="fallback">` when toggling `show-fallback` |

## 5. Forms (`FACE`), Toasts, Sanitization & i18n

- **64 Form-Associated Custom Elements (`ElementInternals`)**: Participate natively in `<form>`, `new FormData(form)`, `form.reset()`, and `<mth-form>` (`mth-submit` `{ values }` / `mth-invalid` `{ errors }`). Includes 46 Core UI controls, 10 Kit controls (`mth-prompt-input`, `mth-auth-form`, `mth-mfa-challenge`, `mth-availability-picker`, `mth-booking-widget`, `mth-query-builder`, `mth-message-composer`, `mth-payment-form`, `mth-plan-picker`, `mth-quantity-selector`), and 8 Satellite controls (`mth-code-editor`, `mth-json-editor`, `mth-rich-editor`, `mth-markdown-editor`, `mth-math-editor`, `mth-location-picker`, `mth-seat-map`, `mth-formula-bar`).
- **Masks & checksums**: `<mth-masked-input mask="...">` uses pattern tokens `0`/`9` (digit), `A` (ASCII letter), `*` (alphanumeric) — **not `#`**. `@methane-ui/primitives` exports `validateLuhn(digitsOnly)` (**strip spaces/hyphens first**: `card.replace(/[\s-]/g, '')`) and `validateIbanMod97(iban)` (strips spaces internally).
- **Toasts**: Mount `<mth-toast></mth-toast>` once and call `MthToast.notify({ title, description, variant, duration })` or `getRuntime().notifications.push(...)` (`<mth-notification-bell>` subscribes to this store by default; set `.useStore=${false}` for standalone `.items`).
- **Sanitization (`@methane-ui/sanitize`)**: `isSafeUrl`, `sanitizeUrl`, and `escapeHtml` run universally (Node SSR + browser); **`isSafeUrl` rejects `blob:` and `data:` URLs** (use `.data = uint8Array` on `mth-pdf-viewer`, `/path.gltf` on `mth-model-viewer`, or `isSafeMediaUrl` from `@methane-ui/media`). `safeSetHTML`, `safeSetMarkdown`, `parseSafeFragment`, and `createStreamSanitizer().flushTo()` require a browser `Document`/`DOMParser` (`environment: 'jsdom'` in Vitest).
- **Localization & RTL (`@methane-ui/locales`)**: 8 lazy packs (`en`, `es`, `fr`, `de`, `ja`, `zh-CN`, `ar`, `he`). Load with `const pack = await loadLocalePack(locale); registerLocalePack(pack);`, apply `dir={getLocaleDirection(locale)}` (`rtl` for `ar`/`he`), and wrap dynamic LTR tokens in RTL strings with `isolateBidiValue()` from `@methane-ui/core`.

## 6. Event Conventions & Subtle Differences

All custom events use lowercase `mth-*` names (`bubbles: true, composed: true`), e.g. `mth-press`, `mth-input`, `mth-change`, `mth-open` / `mth-close`, `mth-select`:

- `<mth-credit-card-input>` emits `{ brand, valid, complete }` (read `e.currentTarget.value` for card digits).
- `<mth-select>` & `<mth-combobox>` take `<mth-option>` children and emit `{ value, selectedValues }`; `<mth-multi-select>` & `<mth-creatable-select>` take `.options=${[...]}` (no default slot) and emit `{ value, values }`.
- `<mth-date-range-picker>` uses `start-date`/`end-date` (`{ value, startDate, endDate }`), whereas `<mth-date-range-calendar>` uses `start`/`end` (`{ start, end }`).
- `<mth-table>` emits `mth-sort`, whereas `<mth-datagrid>` emits `mth-sort-change`.

## References

- Complete 256-tag catalog, 64 `FACE` index, `DataController`, `.prop` shapes & offline satellite setup: [components.md](references/components.md)
- Framework wrappers (React 19/18, Vue 3, Angular 17+, Svelte 5), Vite `resolve.dedupe`, codemod & ESLint: [frameworks.md](references/frameworks.md)
