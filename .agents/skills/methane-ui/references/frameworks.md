# Framework Integration, Bundler, Codemod & Linting Patterns

Always register each custom element you render (`import '@methane-ui/ui/button'`, or `registerAllComponents()` + `registerUtilityElements()`) alongside your framework wrapper or type package. Remember to install `@methane-ui/core` as a peer dependency.

## 1. React 19 (Native Custom Elements — `@methane-ui/react`)

Import `@methane-ui/react` once for `JSX.IntrinsicElements` typing (`MthButtonProps`, etc.), direct JS property assignment on array/object props, and lowercase `onmth-*` custom event props:

```tsx
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import '@methane-ui/react';
import { useState } from 'react';

export function ProfileForm() {
  const [name, setName] = useState('');

  return (
    <mth-stack data-gap="4">
      <mth-input
        label="Display name"
        value={name}
        onmth-input={(e) => setName(e.detail.value)}
      />
      <mth-button variant="solid" onmth-press={() => console.log(name)}>
        Save
      </mth-button>
    </mth-stack>
  );
}
```

### React 18 Legacy (`@methane-ui/react/legacy`)

Use `@lit/react` wrapper components with camelCase event props (`onMthInput`, `onMthPress`, `onMthClose`):

```tsx
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import { MthButton, MthDialog } from '@methane-ui/react/legacy';
```

## 2. Vue 3 (`@methane-ui/vue`)

Configure `METHANE_VUE_COMPILER_OPTIONS` in `vite.config.ts` so Vue treats raw `mth-*` tags (including `<mth-stack>`) as custom elements, and use `Mth*` wrappers for `v-model` / `v-model:open` / `v-model:checked`:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { METHANE_VUE_COMPILER_OPTIONS } from '@methane-ui/vue';

export default {
  plugins: [vue({ template: { compilerOptions: METHANE_VUE_COMPILER_OPTIONS } })],
};
```

```vue
<script setup lang="ts">
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/dialog';
import '@methane-ui/ui/input';
import { ref } from 'vue';
import { MthButton, MthDialog, MthInput } from '@methane-ui/vue';

const query = ref('');
const open = ref(false);
</script>

<template>
  <MthInput v-model="query" placeholder="Search..." />
  <MthButton variant="solid" @mth-press="open = true">Details</MthButton>
  <MthDialog v-model:open="open" label="Details">
    <p>{{ query }}</p>
  </MthDialog>
</template>
```

## 3. Angular 17+ (`@methane-ui/angular`)

Import standalone `Mth*Directive` classes (or `METHANE_ANGULAR_DIRECTIVES`) for typed `@Input()` / `@Output()` bindings and `ControlValueAccessor` support across all **64 Form-Associated (`FACE`) controls**. Keep `CUSTOM_ELEMENTS_SCHEMA` enabled if your template also uses the 3 `@methane-ui/primitives` utility tags (`<mth-skip-link>`, `<mth-visually-hidden>`, `<mth-error-boundary>`) or the 5 Light-DOM CSS layout tags (`<mth-stack>` — or use `<div class="mth-stack">`):

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import '@methane-ui/tokens/tokens.css';
import '@methane-ui/css/index.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import { MthButtonDirective, MthInputDirective } from '@methane-ui/angular';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, MthButtonDirective, MthInputDirective],
  template: `
    <mth-input [formControl]="email" type="email" label="Email"></mth-input>
    <mth-button variant="solid" (mthPress)="submit()">Sign in</mth-button>
  `,
})
export class LoginComponent {
  email = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  submit() {}
}
```

## 4. Svelte 5 (`@methane-ui/svelte`)

Use Svelte 5 Runes (`$bindable()`) wrapper components from `@methane-ui/svelte/Mth*.svelte` (or `@methane-ui/svelte/components/Mth*.svelte`) for two-way `bind:value` / `bind:checked` / `bind:open`, or `import '@methane-ui/svelte'` for global `svelte/elements` `SvelteHTMLElements['mth-*']` typing on raw `<mth-*>` tags:

```svelte
<script lang="ts">
  import '@methane-ui/tokens/tokens.css';
  import '@methane-ui/css/index.css';
  import '@methane-ui/ui/button';
  import '@methane-ui/ui/dialog';
  import '@methane-ui/ui/input';
  import MthButton from '@methane-ui/svelte/MthButton.svelte';
  import MthDialog from '@methane-ui/svelte/MthDialog.svelte';
  import MthInput from '@methane-ui/svelte/MthInput.svelte';

  let name = $state('');
  let open = $state(false);
</script>

<MthInput bind:value={name} placeholder="Your name" />
<MthButton variant="solid" onclick={() => (open = true)}>Open</MthButton>
<MthDialog bind:open label="Greeting">
  <p>Hello, {name}</p>
</MthDialog>
```

## 5. Vite / Vitest Singleton Deduplication (`resolve.dedupe`)

Deduplicate **only direct dependencies** declared in your `package.json` (`lit` and `@methane-ui/*` foundation packages). Under strict `pnpm` hoisting, listing transitive packages (like `@lit-labs/ssr-client`, `@lit/reactive-element`, or `lit-html`) in `resolve.dedupe` causes Rollup `vite build` resolution failures unless installed directly:

```ts
// vite.config.ts / vitest.config.ts
export default {
  resolve: {
    dedupe: [
      'lit',
      '@methane-ui/core',
      '@methane-ui/primitives',
      '@methane-ui/tokens',
      '@methane-ui/sanitize',
    ],
  },
};
```

> **Vitest + `jsdom@26` testing note**: `jsdom@26` omits `ShadowRoot.prototype.adoptedStyleSheets` / `CSSStyleSheet.prototype.replaceSync` and throws on `ElementInternals` ARIA property reflection (`_internalContentAttributeMap` uninitialized). Polyfill Constructable Stylesheets and wrap `HTMLElement.prototype.attachInternals` in your Vitest `setupFiles` when testing Methane components in JSDOM.

## 6. White-Label Prefixing & AST Codemods (`@methane-ui/codemod`)

Rewrite `<mth-*>` custom element tags, `.mth-*` classes, and `--mth-*` CSS custom properties across `.html`, `.ts`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.astro`, and `.css` files:

```bash
# Dry-run first, then pass --write to apply in place:
npx methane-codemod ./src --from-prefix mth- --to-prefix acme- --from-token-prefix --mth- --to-token-prefix --acme- --write
```

Pair with runtime registration using the same prefix: `registerUtilityElements('acme')` and `registerAllComponents('acme')` (or per-element `registerMthButton('acme')` from `@methane-ui/ui/button/element`).

## 7. ESLint 9/10 Flat Config for TypeScript (`@methane-ui/lint-plugin`)

When enabling `@methane-ui/lint-plugin/eslint` in a TypeScript project, pair it with `typescript-eslint` so `.ts`/`.tsx` files parse properly, and scope `@methane-ui/no-raw-html` away from JSDOM test harnesses if tests assign `container.innerHTML`:

```js
// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { methaneEslintPlugin, recommendedEslintRules } from '@methane-ui/lint-plugin/eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@methane-ui': methaneEslintPlugin },
    rules: recommendedEslintRules,
  },
  {
    files: ['tests/**/*.ts', 'e2e/**/*.ts'],
    rules: { '@methane-ui/no-raw-html': 'off' },
  },
);
```
