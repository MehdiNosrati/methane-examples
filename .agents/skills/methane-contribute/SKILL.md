---
name: methane-contribute
description: Contributor runbook for adding or updating Methane UI components, ComponentBehaviorSpec files, CEM parity, SSR-safe Lifecycle authoring, same-root ARIA, Form-Associated Custom Elements, 4-tier logical CSS, wrapper codegen, Vitest conformance suites, and Playwright E2E tests. Use when modifying packages inside the methane monorepo.
---

# Contributing to Methane UI

> **Scope**: This runbook is for modifying the `MehdiNosrati/methane` monorepo itself. When building applications that consume `@methane-ui/*`, use `methane-ui`, `methane-theming`, and `methane-ssr` instead.

Follow the strict package DAG (`tokens / sanitize -> core -> primitives -> ui -> kits -> satellites`) — never import sibling component internals; share behavior through `@methane-ui/primitives` controllers and cores.

## Component File Structure

Every component under `packages/ui/src/components/<slug>/` (or `packages/kits/<kit>/src/components/<slug>/` / `packages/satellites/<sat>/src/components/<slug>/`) contains:

- `<slug>.spec.ts` — `ComponentBehaviorSpec` + `CEM_METADATA` (author first; **include every `@property({ attribute: false })` JS-only prop** such as `.items`, `.schema`, `.fields`, `.when` so `custom-elements.json` and wrapper codegen stay 100% in sync)
- `<slug>.ts` — `UIElement` subclass
- `<slug>.styles.ts` — Lit `css` template using `--mth-*` tokens and logical CSS properties
- `<slug>.messages.ts` — English default i18n message catalog
- `<slug>.test.ts` — Vitest unit + `@methane-ui/test-conformance` suites
- `element.ts` — side-effect-free exports (`Mth<Name>`, spec, styles, messages, `registerMth<Name>(prefix?)`)
- `index.ts` — re-exports `element.ts`, calls `registerMth<Name>()`, augments `HTMLElementTagNameMap`

When adding a new subpath or stylesheet to any package, verify `package.json#exports` exposes it (e.g. CSS subpaths and `./<slug>` + `./<slug>/element`).

## Authoring Rules (Enforced by `@methane-ui/lint-plugin`)

1. **Same-root ARIA**: Never reference IDs across shadow boundaries. Render internal `<label>`, hint, and error nodes in the component's own Shadow DOM, mirror `slot="label" | "hint" | "error"`, and support external `<label for>` via `ElementInternals.labels`.
2. **Form participation (FACE)**: Wire `static formAssociated = true` with `FormControlController` / `ElementInternals`. In `formDisabledCallback(disabled)`, disable internal controls and update `:state(disabled)` without mutating the host `disabled` attribute.
3. **Custom states & parts**: Expose `this.setCustomState(...)` (`disabled`, `invalid`, `user-invalid`, `open`, `checked`, `loading`) and semantic `part="..."` attributes (`base`, `control`, `label`, `popup`).
4. **4-tier logical CSS with zero raw hex**: Use CSS Logical Properties exclusively (`inline-size`, `block-size`, `padding-inline`, `margin-block`, `inset-inline-start`). Wrap tokens as `var(--mth-*, fallback)` using `oklch()` / `light-dark()` / system colors — never raw hex literals. Include `@media (prefers-reduced-motion: reduce)` and `@media (forced-colors: active)`.
5. **Security**: Route all untrusted HTML, Markdown, and URLs through `@methane-ui/sanitize` (`safeSetHTML`, `parseSafeFragment`, `isSafeUrl`). Never use raw `innerHTML` or Lit `unsafeHTML`.
6. **Node DSD SSR safety (`@methane-ui/ssr/dom-shim`)**: `willUpdate()` and `render()` execute in Node without a full browser DOM. Never assume `DOMParser`, `window.matchMedia`, `CSS.supports()`, `PublicKeyCredential`, `EyeDropper`, `this.children`, `this.closest('form')`, `slot.assignedElements()`, `document.createDocumentFragment()`, or `@slotchange` exist during initial `render()` — defer capability-dependent DOM forks to `firstUpdated()`, guard browser-only work behind `typeof window !== 'undefined'`, and provide deterministic SVG/HTML SSR fallbacks.
7. **Vitest + `jsdom@26` test shims**: When running Vitest under `jsdom@26`, polyfill `CSSStyleSheet.prototype.replaceSync` + `ShadowRoot.prototype.adoptedStyleSheets` and guard `ElementInternals` ARIA property setters (`jsdom@26` leaves `_internalContentAttributeMap` uninitialized).
8. **Agent skills hygiene**: Keep every `skills/*/SKILL.md` `<= 150` lines with valid relative links to `references/*.md` (enforced by `apps/docs/src/docs.test.ts`), and update `skills/methane-ui/references/components.md` whenever adding or renaming custom elements.

### Using `@methane-ui/lint-plugin` in TypeScript ESLint Flat Configs

Pair `@methane-ui/lint-plugin/eslint` with `typescript-eslint` so `.ts` files parse cleanly (and relax `@methane-ui/no-raw-html` only in JSDOM test harnesses if needed):

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { methaneEslintPlugin, recommendedEslintRules } from '@methane-ui/lint-plugin/eslint';

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  plugins: { '@methane-ui': methaneEslintPlugin },
  rules: recommendedEslintRules,
});
```

## Required Verification Pipeline

Run these checks before committing:

```bash
# 1. Build packages, run wrapper-codegen + figma-sync, and build apps
pnpm build

# 2. Verify generated React/Vue/Angular/Svelte wrappers & CEM match sources
pnpm run codegen:check

# 3. Typecheck, ESLint + Stylelint invariants, and Vitest conformance + docs skill checks
pnpm typecheck && pnpm lint && pnpm test

# 4. Real-browser Playwright verification (SSR apps & docs)
METHANE_E2E_SERVERS=1 pnpm exec playwright test
pnpm exec playwright test -c apps/docs/playwright.config.ts
```

When adding conformance tests, use `@methane-ui/test-conformance` suites (`FormControlSuite`, `OverlaySuite`, `RovingFocusSuite`, `ListboxSuite`, `DataConsumerSuite`, `SatelliteEngineSuite`, `HydrationPuritySuite`, `scanSameRootAria`) and `runBehaviorSpecAssertions()` from `@methane-ui/spec-compiler`.
