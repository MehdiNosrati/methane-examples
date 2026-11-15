---
name: methane-ssr
description: Configures Declarative Shadow DOM server rendering, dom-shim setup, FOUC prevention, lazy client engine boundaries, and hydration across standalone Node/Vite, Next.js, Nuxt, SvelteKit, Astro, and Angular using @methane-ui/ssr* and @methane-ui/core/hydrate. Use when setting up SSR or fixing hydration issues.
---

# Methane Server Rendering (DSD) & Hydration

Methane renders custom elements on the server as Declarative Shadow DOM (`<template shadowrootmode="open">`) via `@methane-ui/ssr` and framework adapters, then hydrates in place without layout shift.

## 1. Two Golden Rules: Server Registration & Client Import Order

1. **Server registration is mandatory**: `@methane-ui/ssr` (`transformHtmlDsd`, `renderToString`, `renderWithMetadata`) checks `customElements.get(tagName)` on the server. Unregistered `<mth-*>` tags are silently left unexpanded! Import `@methane-ui/ssr/dom-shim` **first**, then register every element your server renders (`registerUtilityElements()`, `registerAllComponents()`, or subpath imports).
2. **Client hydration before registration**: On the client, load `@methane-ui/core/hydrate` (or `enableHydrationSupport()` / `init*Hydration()`) **before** registering any custom elements, and deduplicate only **direct** runtime dependencies in Vite/Vitest (`resolve.dedupe: ['lit', '@methane-ui/core', '@methane-ui/primitives', '@methane-ui/tokens', '@methane-ui/sanitize']` — never list unhoisted transitive packages like `@lit-labs/ssr-client` or `lit-html` under strict `pnpm`, which breaks Rollup production builds).

## 2. Standalone Node / Vite SSR (`@methane-ui/ssr`)

Use isomorphic Lit `html` templates (`.prop=${data}`) when components rely on `attribute: false` array/object props so shadow roots render full data on first byte and emit `defer-hydration`:

```ts
// entry-server.ts — 1) install DOM shim + @queryAll / KaTeX shims BEFORE element imports
import '@methane-ui/ssr/dom-shim';

if (typeof document !== 'undefined') {
  const doc = document as unknown as Record<string, unknown>;
  doc.compatMode ??= 'CSS1Compat'; // Silences KaTeX quirks-mode warning in <mth-math-editor>
  doc.createDocumentFragment ??= () => ({
    querySelectorAll: () => [],
    querySelector: () => null,
    children: [],
    childNodes: [],
    appendChild: (n: unknown) => n,
  }); // Required when @queryAll runs inside willUpdate() (e.g. <mth-plan-picker>)
}

import { registerUtilityElements } from '@methane-ui/primitives';
import { renderWithMetadata, renderToStream, transformHtmlDsd } from '@methane-ui/ssr';
import { registerAllComponents } from '@methane-ui/ui';

registerUtilityElements();
registerAllComponents();

// Render Lit TemplateResult with deferHydration: true + inline or linked shadow styles:
const { html: ssrHtml, links } = await renderWithMetadata(appTemplate, {
  styles: 'inline',
  deferHydration: true, // Prevents premature empty upgrade before hydrateRoot sets .prop data!
});
// Or expand raw HTML from any server template engine:
const transformed = await transformHtmlDsd(rawDocumentHtml, { styles: 'inline' });
```

```ts
// entry-client.ts — 1) enable hydration FIRST, 2) optional v0.1.1 DSD mismatch recovery, 3) register, 4) hydrateRoot()
import { LitElement, render } from 'lit';
import { enableHydrationSupport, hydrateRoot } from '@methane-ui/ssr/client';
enableHydrationSupport();

// v0.1.1 recovery for elements that branch on browser capabilities (e.g. mth-select, mth-datagrid, mth-carousel):
const origUpdate = (LitElement.prototype as unknown as { update(p: Map<PropertyKey, unknown>): void }).update;
(LitElement.prototype as unknown as { update(p: Map<PropertyKey, unknown>): void }).update = function (
  this: LitElement,
  changed: Map<PropertyKey, unknown>,
) {
  try {
    origUpdate.call(this, changed);
  } catch {
    for (const node of [...this.renderRoot.childNodes]) {
      if ((node as Element).nodeName !== 'STYLE' && (node as Element).nodeName !== 'LINK') node.remove();
    }
    delete (this.renderRoot as unknown as { _$litPart$?: unknown })._$litPart$;
    render((this as unknown as { render(): unknown }).render(), this.renderRoot, this.renderOptions);
  }
};

import { registerUtilityElements } from '@methane-ui/primitives';
import { registerAllComponents } from '@methane-ui/ui';

registerUtilityElements();
registerAllComponents();
const root = document.getElementById('app')!;
hydrateRoot(appTemplate, root); // Note: 2 args (value, container)!
root.querySelectorAll('[defer-hydration]').forEach((el) => el.removeAttribute('defer-hydration')); // Strip static leftovers
```

## 3. Style Delivery Modes (`styles: 'inline'` vs `'linked'`)

- **`styles: 'inline'`** (**recommended zero-config default**): Embeds full component `<style>` inside each `<template shadowrootmode="open">` — no static asset route required.
- **`styles: 'linked'`** (library default): Emits `<link rel="stylesheet" href="${assetBase}/<tag>.<hash>.css">` + `< 1 KB` critical shell inside shadow roots and returns `result.links` (`{ tagName, hash, href, cssText }`). **Warning**: If your server does not serve `result.links` at `assetBase` (default `'/_methane/styles'`), shadow stylesheets will 404!

## 4. Meta-Framework Adapters (`@methane-ui/ssr-*`)

- **SvelteKit (`@methane-ui/ssr-sveltekit`)**:
  - `src/hooks.server.ts`: Call `registerUtilityElements(); registerAllComponents();` at module scope, then `export const handle = createMethaneHandle({ styles: 'inline' });`.
  - `src/hooks.client.ts`: Call `initSvelteKitHydration();` **first**, then `registerUtilityElements(); registerAllComponents();`.
- **Nuxt 3 (`@methane-ui/ssr-nuxt`)**:
  - `nuxt.config.ts`: Merge `vue` and `nitro` from `createMethaneNuxtConfig()`.
  - `server/plugins/methane.ts`: Inside `defineNitroPlugin`, call `registerUtilityElements(); registerAllComponents();` and invoke `createMethaneNitroPlugin({ styles: 'inline' })(nitroApp)`.
  - `plugins/methane.client.ts`: Call `initNuxtHydration();` before `registerUtilityElements(); registerAllComponents();`.
- **Next.js App Router (`@methane-ui/ssr-next`)**:
  - `next.config.mjs`: `withMethaneNextConfig` transpiles `ui`/`core`/`primitives` — add any Kits or Satellites you import to `transpilePackages`.
  - Do **not** import `@methane-ui/ssr` inside RSC `layout.tsx`/`page.tsx` unless `globalThis.window.location` is shimmed (Lit's DOM shim defines `window` without `location`). Instead, import `@methane-ui/react` (JSX types) + `@methane-ui/tokens/tokens.css` + `@methane-ui/css/index.css` in RSC, hydrate via a `'use client'` component calling `initNextHydration()` + element registrations, and use `transformNextResponse(res, { styles: 'inline' })` only in middleware/Route Handlers.
- **Astro (`@methane-ui/ssr-astro`)**:
  - `@methane-ui/ssr-astro` has no `default` export; either wrap `createMethaneAstroRenderer()` in a local default-export module when customizing `serverEntrypoint`, or register server elements + apply `createMethaneAstroMiddleware({ styles: 'inline' })` in `src/middleware.ts` and run `initAstroHydration()` + element imports in a client `<script>`.
- **Angular SSR (`@methane-ui/ssr-angular`)**:
  - Server: Register elements, render via `renderApplication()`, then pass HTML to `serializeAngularSsrHtml(html, { styles: 'inline' })`.
  - Client (`main.ts`): Call `initAngularHydration()` (or `provideMethaneHydration()`), register elements, and call `upgradeMethaneAngularElements(document)` before `bootstrapApplication()`.

## 5. SSR Parity & FOUC Checklist

- **FOUC guard**: `@methane-ui/css/index.css` includes `defined-guard.css` (2s fail-open fade for `:not(:defined)` while keeping `mth-stack`, `mth-grid`, `mth-flex`, `mth-container`, `mth-spacer` at `opacity: 1`).
- **Component SSR parity**:
  - `<mth-card>`: Pre-slotted DSD `header`/`media`/`footer` slots do not fire `@slotchange`; add `mth-card:has(> [slot="header"])::part(header), mth-card:has(> [slot="media"])::part(media), mth-card:has(> [slot="footer"])::part(footer) { display: block; }` in global CSS (`v0.1.1`).
  - `<mth-table>`: Pass `.columns=${cols}` alongside declarative `<mth-column>` children (`slot.assignedElements()` is empty on the server).
  - `<mth-conditional-field>`: Pass `.values=${formValues}` (or `.when=${bool}`) because `this.closest('form')` is `null` during SSR.
  - `<mth-countdown>`: Prefer `duration` (in **seconds**) over wall-clock `target` timestamps to avoid `Date.now()` hydration drift.
  - `<mth-waveform>` / `<mth-artifact-pane>`: Pass `.peaks=${number[]}` on `<mth-waveform>` for deterministic SSR SVG bars; default `<mth-artifact-pane>` to `active-tab="code"` for SSR (`"preview"` hydrates via client DOM sanitizer).
  - `@methane-ui/sanitize`: Guard `safeSetHTML`, `safeSetMarkdown`, `parseSafeFragment`, and `StreamSanitizer.flushTo()` behind `typeof DOMParser !== 'undefined'` (`isSafeUrl`, `sanitizeUrl`, `escapeHtml` are SSR-safe).
