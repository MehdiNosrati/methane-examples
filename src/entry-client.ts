// Hydration support MUST execute before custom elements evaluate or upgrade.
import '@methane-ui/core/hydrate';
import { enableHydrationSupport, hydrateRoot } from '@methane-ui/ssr/client';
import { LitElement, render, type RenderOptions } from 'lit';

enableHydrationSupport();

// Upstream @methane-ui/* elements that branch in render() on browser-only capabilities
// (CSS.supports('appearance','base-select'), PublicKeyCredential, EyeDropper, Light-DOM children)
// can throw a template digest/iterable mismatch inside async LitElement.prototype.update hydration.
// Recover cleanly to client render while preserving ADR-008 DSD <link> and <style> nodes.
interface HydratableLitPrototype {
  update(this: LitElement, changedProperties: Map<PropertyKey, unknown>): void;
}
interface HydratableLitInstance {
  readonly renderRoot: HTMLElement | DocumentFragment;
  readonly renderOptions: RenderOptions;
  render(): unknown;
}

const litProto = LitElement.prototype as unknown as HydratableLitPrototype;
const baseLitUpdate = litProto.update;
litProto.update = function patchedHydrationSafeUpdate(
  this: LitElement,
  changedProperties: Map<PropertyKey, unknown>,
): void {
  try {
    baseLitUpdate.call(this, changedProperties);
  } catch {
    const inst = this as unknown as HydratableLitInstance;
    for (const node of [...inst.renderRoot.childNodes]) {
      if (!(node instanceof Element && (node.tagName === 'STYLE' || node.tagName === 'LINK'))) {
        node.remove();
      }
    }
    delete (inst.renderRoot as { _$litPart$?: unknown })._$litPart$;
    render(inst.render(), inst.renderRoot, inst.renderOptions);
  }
};

import './styles/app.css';
import { getRuntime } from '@methane-ui/core';
import { MthToast } from '@methane-ui/ui/toast';
import { withBasePath } from './base-path.js';
import { registerAllAtmosElements } from './register-elements.js';
import { renderAppShell } from './shell/app-shell.js';
import {
  activateAtmosLocale,
  applyDocumentThemeState,
  createInitialAtmosState,
  getRouteHref,
  isAppRoutePathname,
  resolveRouteFromPathname,
} from './state.js';
import { getViewModule } from './views/manifest.js';
import type { AtmosActions, AtmosRouteId, AtmosState } from './types.js';

registerAllAtmosElements();

// Keep @lottiefiles/dotlottie-web (<mth-lottie>) 100% offline by routing CDN WASM fetches to local server.
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (
      rawUrl.endsWith('/dotlottie-player.wasm') &&
      /^https?:\/\//i.test(rawUrl) &&
      !rawUrl.includes('/_methane/dotlottie-player.wasm')
    ) {
      return nativeFetch(withBasePath('/_methane/dotlottie-player.wasm'), init);
    }
    return nativeFetch(input, init);
  };
}

function readInitialState(): AtmosState {
  const scriptEl = document.getElementById('atmos-initial-state');
  if (scriptEl?.textContent) {
    try {
      return JSON.parse(scriptEl.textContent) as AtmosState;
    } catch {
      // Fall back to URL state when running standalone without SSR state script.
    }
  }
  return createInitialAtmosState(window.location.href);
}

function buildUrlFromState(state: AtmosState): string {
  const url = new URL(window.location.href);
  url.pathname = getRouteHref(state.route);
  if (state.theme !== 'dark') url.searchParams.set('theme', state.theme);
  else url.searchParams.delete('theme');

  if (state.density !== 'default') url.searchParams.set('density', state.density);
  else url.searchParams.delete('density');

  if (state.locale !== 'en') url.searchParams.set('locale', state.locale);
  else url.searchParams.delete('locale');

  if (state.ssrStyles !== 'linked') url.searchParams.set('ssrStyles', state.ssrStyles);
  else url.searchParams.delete('ssrStyles');

  return `${url.pathname}${url.search}${url.hash}`;
}

async function bootstrapClient(): Promise<void> {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  let state = readInitialState();
  await activateAtmosLocale(state.locale);
  applyDocumentThemeState(state);

  const commitRender = () => {
    const view = getViewModule(state.route);
    document.title = `AtmosOps · ${view.title}`;
    render(renderAppShell(state, actions, view), appContainer);
  };

  const actions: AtmosActions = {
    navigate(route: AtmosRouteId) {
      if (state.route === route) return;
      state = { ...state, route };
      const nextUrl = buildUrlFromState(state);
      window.history.pushState({ route }, '', nextUrl);
      commitRender();
      const view = getViewModule(route);
      getRuntime().announcer.announce(`Navigated to ${view.title}`, 'polite');
    },

    updateState(patch: Partial<AtmosState>) {
      const prevLocale = state.locale;
      state = { ...state, ...patch };
      applyDocumentThemeState(state);
      const nextUrl = buildUrlFromState(state);
      window.history.replaceState({ route: state.route }, '', nextUrl);

      if (patch.locale && patch.locale !== prevLocale) {
        void activateAtmosLocale(patch.locale).then((resolvedDir) => {
          state = { ...state, dir: resolvedDir };
          applyDocumentThemeState(state);
          commitRender();
        });
      }
      commitRender();
    },

    updateViewUi(key: string, value: unknown) {
      state = {
        ...state,
        ui: {
          ...state.ui,
          [key]: value,
        },
      };
      commitRender();
    },

    notify(message: string, tone: 'info' | 'success' | 'warning' | 'danger' = 'info') {
      MthToast.notify({
        title: 'AtmosOps Telemetry',
        message,
        variant: tone,
        duration: 4200,
      });
    },

    announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
      getRuntime().announcer.announce(message, politeness);
    },
  };

  const hasSsrDom = appContainer.firstElementChild !== null;
  if (hasSsrDom) {
    try {
      hydrateRoot(renderAppShell(state, actions, getViewModule(state.route)), appContainer);
      appContainer.querySelectorAll('[defer-hydration]').forEach((el) => {
        el.removeAttribute('defer-hydration');
      });
    } catch {
      appContainer.replaceChildren();
      commitRender();
    }
  } else {
    commitRender();
  }

  // Reconcile URL query/path overrides when serving pre-rendered static Pages HTML (e.g. ?locale=ar or 404.html).
  const liveUrlState = createInitialAtmosState(window.location.href);
  if (
    liveUrlState.route !== state.route ||
    liveUrlState.theme !== state.theme ||
    liveUrlState.density !== state.density ||
    liveUrlState.locale !== state.locale ||
    liveUrlState.brandSeed !== state.brandSeed ||
    liveUrlState.ssrStyles !== state.ssrStyles
  ) {
    state = {
      ...state,
      route: liveUrlState.route,
      theme: liveUrlState.theme,
      density: liveUrlState.density,
      locale: liveUrlState.locale,
      dir: liveUrlState.dir,
      brandSeed: liveUrlState.brandSeed,
      ssrStyles: liveUrlState.ssrStyles,
    };
    await activateAtmosLocale(state.locale);
    applyDocumentThemeState(state);
    commitRender();
  }

  // Register global ⌘K / Ctrl+K shortcut via Methane's shared HotkeyManager runtime.
  getRuntime().hotkeys.register({
    id: 'atmos-command-palette-shortcut',
    combo: 'Mod+KeyK',
    allowInInput: true,
    handler: (ev: KeyboardEvent) => {
      ev.preventDefault();
      actions.updateState({ commandPaletteOpen: !state.commandPaletteOpen });
    },
  });

  window.addEventListener('popstate', () => {
    const nextRoute = resolveRouteFromPathname(window.location.pathname);
    state = { ...state, route: nextRoute };
    commitRender();
  });

  // Intercept internal route links emitted inside shadow roots (composed event path).
  document.addEventListener('click', (ev: MouseEvent) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) {
      return;
    }
    const anchor = ev
      .composedPath()
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement && Boolean(node.href));
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return;
    }
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return;
    }
    if (isAppRoutePathname(url.pathname)) {
      ev.preventDefault();
      actions.navigate(resolveRouteFromPathname(url.pathname));
    }
  });
}

void bootstrapClient();
