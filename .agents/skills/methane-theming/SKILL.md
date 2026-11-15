---
name: methane-theming
description: Customizes Methane UI themes using OKLCH brand seeds, light/dark modes, density presets, high-contrast forced-colors, RTL logical layouts, W3C DTCG tokens.json compilation, and ::part() or :state() styling. Use when theming or styling @methane-ui/* components.
---

# Methane Theming & Tokens

Methane derives perceptual color ramps and 121 `--mth-*` semantic tokens in `oklch()` inside `@layer mth.tokens` (`mth.reset < mth.tokens < mth.primitives < mth.utilities`).

## 1. Package Exports & Load Order

`@methane-ui/tokens` exports `.` (`tokenVars`, `tokenMap`, `cssVar`, `dtcgSource`, `compiledTokens`, `tokensCss`, `compileDtcgTokens`), `./compiler`, `./tokens.css`, and `./tokens.json` (all light/dark, density, reduced-motion, and forced-colors rules live in the single `./tokens.css` bundle — there are no separate `themes/*.css` files).

Import layers, tokens, and CSS in order so your own stylesheets override primitives without `!important`:

```css
@import '@methane-ui/css/layers.css';
@import '@methane-ui/tokens/tokens.css';
@import '@methane-ui/css/index.css'; /* Bundles reset, defined-guard, layout, prose, marketing & forms */
```

> **Note**: Do **not** import `@methane-ui/css/forms.css` directly (unexported in `package.json`); `@methane-ui/css/index.css` already includes `forms.css`.

## 2. Customize Brand & Semantic Seeds in OKLCH

Override `--mth-color-seed-brand` (default `oklch(0.55 0.23 264)`) to regenerate `--mth-color-brand-50..950` and accent tokens via CSS relative color syntax (`oklch(from var(--mth-color-seed-brand) ...)`):

```css
:root {
  --mth-color-seed-brand: oklch(0.58 0.21 195);
  /* Optional semantic seeds: --mth-color-seed-neutral, -danger, -warning, -success, -info */
}
```

- **Scoped subtrees**: When overriding `--mth-color-seed-brand` inside a nested container rather than `:root`, re-declare derived ramp/accent tokens (`--mth-color-brand-50..950`, `--mth-color-accent`, `--mth-color-accent-hover`, `--mth-color-accent-subtle`) on that container so inherited custom properties recompute.
- **No raw hex in strict token props**: Components that accept custom colors (such as `<mth-collab-cursors>` `.cursors`) validate for `oklch(...)` or `var(--mth-color-*)` and reject raw `#hex` / `rgb()` strings.

## 3. Switch Light / Dark, Density & RTL Direction

Apply attributes or helper classes on `<html>` or any nested subtree:

- **Theme mode**: `data-mth-theme="light" | "dark"` (or `.mth-theme-light` / `.mth-theme-dark`). Without an attribute, `:root` uses `color-scheme: light dark` and CSS `light-dark()` automatically. (There is no `"high-contrast"` attribute; OS high contrast uses `@media (forced-colors: active)` automatically.)
- **Spacing density**: `data-mth-density="compact" | "default" | "comfortable"` (or `.mth-density-compact` / `.mth-density-default` / `.mth-density-comfortable`), scaling `--mth-density` across `0.8`, `1`, and `1.2` (`"spacious"` is not a valid preset).
- **RTL direction**: Every component and `@methane-ui/css` layout uses CSS Logical Properties (`inline-size`, `padding-inline`, `inset-inline-start`) and flips automatically when `dir="rtl"` is set on `<html>` or a container (pair with `getLocaleDirection(locale)` from `@methane-ui/locales` for `ar` and `he`).

```html
<html lang="ar" dir="rtl" data-mth-theme="dark" data-mth-density="compact"></html>
```

## 4. High Contrast (`forced-colors`) & Reduced Motion

`@methane-ui/tokens/tokens.css` handles system accessibility queries automatically:

- `@media (forced-colors: active)` maps `--mth-color-bg` / `--mth-color-surface` to `Canvas`, `--mth-color-fg` to `CanvasText`, `--mth-color-fg-muted` to `GrayText`, `--mth-color-border` to `ButtonBorder`, `--mth-color-accent` / `--mth-color-border-focus` to `Highlight`, and clears shadows.
- `@media (prefers-reduced-motion: reduce)` sets all `--mth-motion-duration-*` tokens (`instant`, `fast`, `normal`, `slow`) to `0ms`.

## 5. Compile Custom W3C DTCG `tokens.json`

Use `@methane-ui/tokens/compiler` (and raw `@methane-ui/tokens/tokens.json` / `dtcgSource` as a base) to compile custom DTCG JSON documents into `--mth-*` CSS:

```ts
import { compileDtcgTokens, type DtcgDocument } from '@methane-ui/tokens/compiler';

const dtcg: DtcgDocument = {
  color: {
    $type: 'color',
    seed: { brand: { $value: 'oklch(0.58 0.19 195)' } },
    bg: {
      $value: '#ffffff',
      $extensions: { 'com.methane.theme': { light: '#ffffff', dark: 'oklch(0.16 0.01 260)' } },
    },
  },
};

const { css, tokens, tokenMap } = compileDtcgTokens(dtcg);
```

## 6. Style Shadow DOM with `::part()`, `:state()`, and `registerStyles`

Never pierce Shadow DOM internals. Use the 3 supported customization tiers:

1. **Tokens**: Override `--mth-radius-md`, `--mth-color-surface`, `--mth-font-sans`, or typed `tokenVars.color.accent` from `@methane-ui/tokens`.
2. **Parts & Custom States**: Target documented `::part(base | control | label | popup | ...)` and `ElementInternals` `:state(disabled | invalid | user-invalid | open | checked | loading)`:

```css
mth-button::part(control) {
  letter-spacing: 0.01em;
}

mth-input:state(user-invalid)::part(control) {
  border-color: var(--mth-color-danger);
}
```

3. **Constructable Sheet Escape Hatch**: Inject scoped CSS into a tag's `@layer override` sheet before or after registration:

```ts
import { registerStyles } from '@methane-ui/core';
registerStyles('mth-button', '@layer override { [part="control"] { font-weight: 700; } }');
```
