# AtmosOps — Flagship Methane UI v0.1.1 Showcase

**Live Showcase & Coverage Studio:** [https://mahdins.dev/methane-examples/](https://mahdins.dev/methane-examples/)

**AtmosOps** (*Planetary Methane & Climate Telemetry Command Platform*) is a standalone, cohesive full-stack reference application showcasing **100% of [Methane UI](https://github.com/MehdiNosrati/methane) (`v0.1.1`)** across Declarative Shadow DOM (DSD) Server-Side Rendering, in-place client hydration, OKLCH & W3C DTCG theming, 8-locale LTR/RTL internationalization, defense-in-depth sanitizers, all **256 `mth-*` tags** (`251` Custom Elements + `5` pure-CSS layout tags), all **5 Domain Kits**, and all **11 Satellites**.

---

## Coverage Highlights

| Layer | Packages | Coverage |
| --- | --- | --- |
| **Foundation & CSS** | `@methane-ui/tokens`, `core`, `primitives`, `css`, `locales`, `sanitize`, `codemod` | **3** utility elements (`mth-visually-hidden`, `mth-skip-link`, `mth-error-boundary`) + **5** CSS layout tags (`mth-stack`, `mth-grid`, `mth-flex`, `mth-container`, `mth-spacer`) + **59 / 59** `@methane-ui/css` classes + **8** locales (`en`, `es`, `fr`, `de`, `ja`, `zh-CN`, `ar` RTL, `he` RTL) |
| **Core UI** | `@methane-ui/ui` | **167 / 167** components (Form-Associated Custom Elements, overlays, navigation, date/time, marketing, feedback, and data display) |
| **5 Domain Kits** | `@methane-ui/ai` (8), `auth` (7), `admin` (13), `chat` (8), `commerce` (10) | **46 / 46** components |
| **11 Satellites** | `@methane-ui/3d` (1), `charts` (2), `code` (4), `datagrid` (5), `editor` (4), `flow` (2), `maps` (7), `media` (3), `pdf` (1), `rtc` (4), `spreadsheet` (2) | **35 / 35** components |
| **SSR & Hydration** | `@methane-ui/ssr`, `@methane-ui/core/hydrate` | Hybrid linked (`/_methane/styles/:tag.:hash.css` + `< 1 KB` critical shell) & inline DSD SSR, `hoistStylesheetLinks`, WinterCG `renderToStream` + `createSsrTransformStream`, `transformHtmlDsd`, and `hydrateRoot` |
| **Total `mth-*` Tags** | **26 Methane packages** | **256 / 256 tags (`100%`)** |

---

## Mission Workspaces (7 Routes)

1. **`/` — Mission Overview & Public Climate Briefing (`src/views/overview-briefing.ts`)**
   Executive orbital KPI deck + Public Climate Network Briefing showcasing all 59 `@methane-ui/css` layout, bento, `.mth-prose` / `.mth-dl`, marketing, and native `.mth-btn` / `.mth-input` / `.mth-select` classes alongside `<mth-tour>`, `<mth-coachmark>`, `<mth-carousel>`, `<mth-comparison-table>`, `<mth-newsletter-form>`, `<mth-qr-code>`, and `<mth-barcode>`.
2. **`/spatial` — Spatial Plume Twin & Facility Command (`src/views/spatial-view.ts`)**
   Three.js `<mth-model-viewer>` orbital SWIR spectrometer twin (`orbital-spectrometer.gltf`), all 7 `@methane-ui/maps` components (`<mth-map>`, `<mth-map-cluster>`, `<mth-map-draw>`, `<mth-map-route>`, `<mth-location-picker>`, `<mth-floor-plan>`, `<mth-seat-map>`), `<mth-before-after>` optical vs SWIR plume slider, `<mth-image-annotator>`, `<mth-lottie>`, `<mth-drawing-pad>`, and spatial split/resizable/overlay workspaces.
3. **`/telemetry` — Telemetry Analytics, Grids & OGMP Ledger (`src/views/telemetry-view.ts`)**
   Apache ECharts `<mth-chart>` + `<mth-chart-series>`, TanStack `<mth-datagrid>`, `<mth-pivot-table>`, and `<mth-tree-table>`, MIT Formula AST `<mth-spreadsheet>` + `<mth-formula-bar>` (`=SUM`, `=AVERAGE`, `=MAX`), `<mth-query-builder>`, `<mth-filter-builder>`, `<mth-saved-views>`, `<mth-column-chooser>`, `<mth-bulk-action-bar>`, `<mth-csv-importer>`, and `<mth-virtual-scroller>`.
4. **`/operations` — Field Dispatch, Workflows & Incident Runbooks (`src/views/operations-view.ts`)**
   `<mth-kanban>`, `<mth-gantt>`, `<mth-scheduler>`, `<mth-event-calendar>`, `<mth-availability-picker>`, `<mth-booking-widget>`, `<mth-file-explorer>`, `<mth-audit-log>`, `<mth-settings-shell>`, Dagre `<mth-flow-editor>` & `<mth-org-chart>`, CodeMirror 6 `<mth-code-editor>`, `<mth-code-block>`, `<mth-diff-viewer>` & `<mth-json-editor>`, ProseMirror `<mth-rich-editor>`, `<mth-markdown>`, `<mth-markdown-editor>` & KaTeX `<mth-math-editor>`, and `<mth-pdf-viewer>` (`ogmp-compliance-report.pdf`).
5. **`/war-room` — Incident War-Room, WebRTC & AtmosAI Copilot (`src/views/war-room-view.ts`)**
   All 8 `@methane-ui/chat` components, all 4 `@methane-ui/rtc` components + ultrasonic `<mth-waveform>`, all 8 `@methane-ui/ai` components, and an interactive `@methane-ui/sanitize` (`createStreamSanitizer`, `safeSetMarkdown`, `safeSetHTML`, `isSafeUrl`) XSS & prompt-injection firewall lab.
6. **`/commerce-auth` — Sensor & Carbon Clearinghouse + Zero-Trust IAM (`src/views/commerce-auth-view.ts`)**
   All 10 `@methane-ui/commerce` components, all 7 `@methane-ui/auth` components, and 22 Form-Associated Custom Elements inside a native `<form>` with live `new FormData(form)` & `form.reset()` inspection plus `validateLuhn` / `validateIbanMod97`.
7. **`/studio` — Theme, OKLCH DTCG, Locale/RTL, Prefix & 256-Tag Studio (`src/views/studio-view.ts`)**
   Live OKLCH `--mth-color-seed-brand` tuner, `data-mth-theme` & `data-mth-density` toggles, live `@methane-ui/tokens/compiler` W3C DTCG JSON compiler, `registerStyles()` `@layer override`, 8-locale RTL/bidi switcher (`loadLocalePack`, `isolateBidiValue`), `<atmos-*>` white-label custom element prefixing + `@methane-ui/codemod` + 5-framework `<mth-code-tabs>`, `AutoLoader`, live `/api/ssr-transform` & `/api/ssr-stream` DSD inspector, and interactive **256 / 256 tag coverage matrix**.

---

## Quick Start

```bash
# Install dependencies (Node.js >= 22, pnpm >= 10)
pnpm install

# Start Vite + Node Declarative Shadow DOM SSR dev server (http://127.0.0.1:4173)
pnpm dev

# Production client + SSR server build & start
pnpm build && pnpm start

# Pre-render static Declarative Shadow DOM GitHub Pages export (dist/pages)
pnpm run build:pages

# Strict TypeScript check & ESLint (@methane-ui/lint-plugin/eslint)
pnpm typecheck
pnpm lint

# Run Vitest 256/256 tag coverage, CSS class, locale/RTL, sanitizer & DSD SSR/hydration suite
pnpm test

# Run Playwright real-browser Chromium DSD SSR (No-JS + hydrated), RTL, FACE & interaction E2E suite
pnpm test:e2e
```
