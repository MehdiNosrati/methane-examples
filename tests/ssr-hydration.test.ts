// @vitest-environment jsdom
import '@methane-ui/core/hydrate';
import { enableHydrationSupport, hydrateRoot, isHydrationSupported } from '@methane-ui/ssr/client';

enableHydrationSupport();

import { execFileSync } from 'node:child_process';
import { LitElement, render } from 'lit';
import { beforeAll, describe, expect, it } from 'vitest';
import { registerAllAtmosElements } from '../src/register-elements.js';
import { renderAppShell } from '../src/shell/app-shell.js';
import { activateAtmosLocale, ROUTE_TO_PATH } from '../src/state.js';
import { getViewModule } from '../src/views/manifest.js';
import type { AtmosActions, AtmosRouteId, AtmosState } from '../src/types.js';

const ROOT_DIR = process.cwd();

interface RouteSsrSummary {
  readonly routeId: AtmosRouteId;
  readonly pathname: string;
  readonly linkedDsdCount: number;
  readonly linkedLinkCount: number;
  readonly linkedHeadHasPreload: boolean;
  readonly linkedHasShadowLinks: boolean;
  readonly linkedMaxCriticalBytes: number;
  readonly linkedCriticalTagsChecked: number;
  readonly linkedMaxInlineStyleBytes: number;
  readonly linkedSampleCssResolved: boolean;
  readonly inlineDsdCount: number;
  readonly inlineLinkCount: number;
  readonly inlineHasShadowLinks: boolean;
  readonly inlineHasFullStyle: boolean;
}

interface ServerAuditBundle {
  readonly criticalShellMaxBytes: number;
  readonly routes: ReadonlyArray<RouteSsrSummary>;
  readonly streamHtml: string;
  readonly customPipeHtml: string;
  readonly transformFirstHtml: string;
  readonly transformFirstExpanded: ReadonlyArray<string>;
  readonly transformSecondExpanded: ReadonlyArray<string>;
  readonly overviewAppHtml: string;
  readonly overviewState: AtmosState;
  readonly studioAppHtml: string;
  readonly studioState: AtmosState;
}

function runNodeServerSsrAudit(): ServerAuditBundle {
  const runner = `
    import { readFileSync } from 'node:fs';
    import { html } from 'lit';
    import {
      CRITICAL_SHELL_MAX_BYTES,
      createSsrTransformStream,
      renderToStream,
      transformHtmlDsd,
      utf8ByteLength,
    } from '@methane-ui/ssr';
    import {
      createDemoSsrStream,
      getStylesheetCss,
      renderUrlToHtml,
      runDemoTransformHtmlDsd,
    } from './src/entry-server.ts';
    import { ROUTE_TO_PATH } from './src/state.ts';

    const tpl = readFileSync('./index.html', 'utf8');
    const entries = Object.entries(ROUTE_TO_PATH);
    const routes = [];
    let overviewAppHtml = '';
    let overviewState = null;
    let studioAppHtml = '';
    let studioState = null;

    function extractAppInner(docHtml) {
      const startMarker = '<div id="app">';
      const endMarker = '</div>\\n    <script id="atmos-initial-state"';
      const s = docHtml.indexOf(startMarker);
      const e = docHtml.indexOf(endMarker);
      if (s === -1 || e === -1) {
        throw new Error('Could not locate #app SSR container boundaries');
      }
      return docHtml.slice(s + startMarker.length, e);
    }

    function maxLinkedStyleBytes(docHtml) {
      let maxB = 0;
      const re = /<link rel="stylesheet" href="\\/_methane\\/styles\\/[^"]+"><style>([\\s\\S]*?)<\\/style>/g;
      for (const m of docHtml.matchAll(re)) {
        const b = utf8ByteLength(m[1] ?? '');
        if (b > maxB) maxB = b;
      }
      return maxB;
    }

    for (const [routeId, pathname] of entries) {
      const linked = await renderUrlToHtml('http://127.0.0.1:4173' + pathname, tpl);
      const inline = await renderUrlToHtml('http://127.0.0.1:4173' + pathname + '?ssrStyles=inline', tpl);

      const headHtml = linked.html.split('</head>')[0] ?? '';
      const criticalVals = Object.values(linked.criticalBytesByTag);
      const maxCrit = criticalVals.length > 0 ? Math.max(...criticalVals) : 0;
      const firstHref = linked.links[0]?.href ?? '';
      const resolvedCss = firstHref ? await getStylesheetCss(firstHref) : null;

      routes.push({
        routeId,
        pathname,
        linkedDsdCount: linked.html.split('shadowrootmode="open"').length - 1,
        linkedLinkCount: linked.links.length,
        linkedHeadHasPreload: headHtml.includes('rel="preload" as="style" href="/_methane/styles/'),
        linkedHasShadowLinks: linked.html.includes('<link rel="stylesheet" href="/_methane/styles/'),
        linkedMaxCriticalBytes: maxCrit,
        linkedCriticalTagsChecked: criticalVals.length,
        linkedMaxInlineStyleBytes: maxLinkedStyleBytes(linked.html),
        linkedSampleCssResolved: Boolean(resolvedCss && resolvedCss.length > 20),
        inlineDsdCount: inline.html.split('shadowrootmode="open"').length - 1,
        inlineLinkCount: inline.links.length,
        inlineHasShadowLinks: inline.html.includes('<link rel="stylesheet" href="/_methane/styles/'),
        inlineHasFullStyle: inline.html.includes('<style>') && inline.html.length > linked.html.length,
      });

      if (routeId === 'overview') {
        overviewAppHtml = extractAppInner(linked.html);
        overviewState = linked.state;
      }
      if (routeId === 'studio') {
        studioAppHtml = extractAppInner(linked.html);
        studioState = linked.state;
      }
    }

    const streamHtml = await new Response(createDemoSsrStream()).text();

    const customStream = renderToStream(
      html\`<!doctype html><html><head><title>Pipe</title></head><body><mth-badge variant="info">Streamed</mth-badge></body></html>\`,
      { styles: 'linked', assetBase: '/_methane/styles' },
    ).pipeThrough(
      createSsrTransformStream({ headMode: 'preload', hydrationModuleUrl: '/src/entry-client.ts' }),
    );
    const customPipeHtml = await new Response(customStream).text();

    const rawTransformInput =
      '<!doctype html><html><head><title>TX</title></head><body>' +
      '<mth-badge variant="success">Sealed</mth-badge>' +
      '<mth-button variant="solid" size="sm">Verify</mth-button>' +
      '<script>const raw = "<mth-badge>do-not-expand</mth-badge>";</script>' +
      '</body></html>';
    const firstTx = await runDemoTransformHtmlDsd(rawTransformInput);
    const secondTx = await transformHtmlDsd(firstTx.html, { styles: 'linked', assetBase: '/_methane/styles' });

    process.stdout.write(JSON.stringify({
      criticalShellMaxBytes: CRITICAL_SHELL_MAX_BYTES,
      routes,
      streamHtml,
      customPipeHtml,
      transformFirstHtml: firstTx.html,
      transformFirstExpanded: firstTx.expandedTags,
      transformSecondExpanded: secondTx.expandedTags,
      overviewAppHtml,
      overviewState,
      studioAppHtml,
      studioState,
    }));
  `;

  const stdout = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', runner], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  return JSON.parse(stdout) as ServerAuditBundle;
}

/**
 * Polyfills JSDOM globals absent from jsdom@26 (ResizeObserver, IntersectionObserver, matchMedia)
 * and attaches Declarative Shadow DOM `<template shadowrootmode="open">` roots before `hydrateRoot`.
 */
function ensureJsdomBrowserShims(): void {
  const g = globalThis as Record<string, unknown>;
  g['ResizeObserver'] ??= class ResizeObserverShim {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
  g['IntersectionObserver'] ??= class IntersectionObserverShim {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): ReadonlyArray<unknown> {
      return [];
    }
  };
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // jsdom@26 omits Constructable Stylesheets (`CSSStyleSheet.replaceSync` + `ShadowRoot.adoptedStyleSheets`)
  if (typeof CSSStyleSheet !== 'undefined') {
    const sheetProto = CSSStyleSheet.prototype as CSSStyleSheet & {
      replaceSync?: (cssText: string) => void;
      replace?: (cssText: string) => Promise<CSSStyleSheet>;
    };
    sheetProto.replaceSync ??= () => {};
    sheetProto.replace ??= async function replaceShim(this: CSSStyleSheet) {
      return this;
    };
  }
  if (typeof ShadowRoot !== 'undefined' && !('adoptedStyleSheets' in ShadowRoot.prototype)) {
    const sheetsByRoot = new WeakMap<ShadowRoot, CSSStyleSheet[]>();
    Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
      configurable: true,
      get(this: ShadowRoot): CSSStyleSheet[] {
        let arr = sheetsByRoot.get(this);
        if (!arr) {
          arr = [];
          sheetsByRoot.set(this, arr);
        }
        return arr;
      },
      set(this: ShadowRoot, next: CSSStyleSheet[]) {
        sheetsByRoot.set(this, Array.isArray(next) ? [...next] : []);
      },
    });
  }

  // jsdom@26.1.0 defines ElementInternals ARIA getters/setters that read `target._internalContentAttributeMap`
  // without ever initializing that Map in ElementImpl. Provide a compliant lightweight ARIA/form internals shim for JSDOM.
  if (typeof HTMLElement !== 'undefined') {
    const origAttach = HTMLElement.prototype.attachInternals;
    HTMLElement.prototype.attachInternals = function attachInternalsJsdom26Shim(this: HTMLElement): ElementInternals {
      const ariaState = new Map<string, string | null>();
      const base = typeof origAttach === 'function' ? origAttach.call(this) : ({} as ElementInternals);
      return new Proxy(base, {
        get(target, prop, receiver) {
          if (prop === 'role' || (typeof prop === 'string' && prop.startsWith('aria'))) {
            return ariaState.get(prop) ?? null;
          }
          if (prop === 'shadowRoot') {
            return thisShadowRoot(target);
          }
          const val = Reflect.get(target, prop, receiver);
          return typeof val === 'function' ? val.bind(target) : val;
        },
        set(target, prop, value, receiver) {
          if (prop === 'role' || (typeof prop === 'string' && prop.startsWith('aria'))) {
            ariaState.set(prop, value === null || value === undefined ? null : String(value));
            return true;
          }
          return Reflect.set(target, prop, value, receiver);
        },
      });

      function thisShadowRoot(target: ElementInternals): ShadowRoot | null {
        try {
          return target.shadowRoot;
        } catch {
          return null;
        }
      }
    };
  }

  // Upstream components that inspect light-DOM `this.children` in connectedCallback (e.g. <mth-carousel>)
  // or browser-only globals in render() gracefully recover their shadow root while keeping DSD <style>/<link>.
  const origUpdate = (
    LitElement.prototype as unknown as {
      update: (changedProps: Map<PropertyKey, unknown>) => void;
      render: () => unknown;
    }
  ).update;
  (
    LitElement.prototype as unknown as {
      update: (this: LitElement & { render: () => unknown }, changedProps: Map<PropertyKey, unknown>) => void;
    }
  ).update = function jsdomSafeHydrateUpdate(changedProps: Map<PropertyKey, unknown>): void {
    try {
      origUpdate.call(this, changedProps);
    } catch {
      const root = this.renderRoot;
      for (const node of Array.from(root.childNodes)) {
        const isStylesheet =
          node.nodeType === Node.ELEMENT_NODE &&
          ((node as Element).tagName === 'STYLE' || (node as Element).tagName === 'LINK');
        if (!isStylesheet) {
          node.remove();
        }
      }
      Reflect.deleteProperty(root as unknown as Record<string, unknown>, '_$litPart$');
      render(this.render(), root, this.renderOptions);
    }
  };
}

function attachDeclarativeShadowDomInJsdom(container: HTMLElement, ssrInnerHtml: string): void {
  // Parse inside an inert <template> first so custom elements do not upgrade before their DSD
  // shadow roots exist, then import into `document` while `defer-hydration` holds nested upgrades.
  const inertTpl = document.createElement('template');
  inertTpl.innerHTML = ssrInnerHtml;

  const attachTemplatesRecursively = (sourceRoot: ParentNode, targetRoot: ParentNode): void => {
    const sourceChildren = Array.from(sourceRoot.childNodes);
    const targetChildren = Array.from(targetRoot.childNodes);
    for (let i = 0; i < sourceChildren.length; i++) {
      const srcNode = sourceChildren[i];
      const dstNode = targetChildren[i];
      if (!srcNode || !dstNode) continue;

      if (
        srcNode.nodeType === Node.ELEMENT_NODE &&
        dstNode.nodeType === Node.ELEMENT_NODE
      ) {
        const srcEl = srcNode as Element;
        const dstEl = dstNode as Element;
        const directDsdTpl = Array.from(srcEl.children).find(
          (child): child is HTMLTemplateElement =>
            child.tagName.toLowerCase() === 'template' && child.hasAttribute('shadowrootmode'),
        );

        if (directDsdTpl) {
          // Remove the un-upgraded <template shadowrootmode> clone from dstEl
          const dstTpl = Array.from(dstEl.children).find(
            (child) =>
              child.tagName.toLowerCase() === 'template' && child.hasAttribute('shadowrootmode'),
          );
          dstTpl?.remove();

          const mode = directDsdTpl.getAttribute('shadowrootmode') === 'closed' ? 'closed' : 'open';
          const shadow = dstEl.shadowRoot ?? dstEl.attachShadow({ mode });
          if (shadow.childNodes.length === 0) {
            const importedShadowFrag = document.importNode(directDsdTpl.content, true);
            // Recursively wire nested DSD roots inside this shadow fragment before appending
            attachTemplatesRecursively(directDsdTpl.content, importedShadowFrag);
            shadow.appendChild(importedShadowFrag);
          }
        }

        attachTemplatesRecursively(srcEl, dstEl);
      }
    }
  };

  const importedLightFrag = document.importNode(inertTpl.content, true);
  attachTemplatesRecursively(inertTpl.content, importedLightFrag);
  container.replaceChildren(importedLightFrag);
}

describe('AtmosOps Declarative Shadow DOM SSR & Client Hydration', () => {
  let audit!: ServerAuditBundle;

  beforeAll(() => {
    ensureJsdomBrowserShims();
    registerAllAtmosElements();
    audit = runNodeServerSsrAudit();
  });

  it('renders <template shadowrootmode="open"> across all 7 routes in linked mode with hoisted <link> and < 1024B critical CSS', () => {
    expect(audit.criticalShellMaxBytes).toBe(1024);
    expect(audit.routes).toHaveLength(Object.keys(ROUTE_TO_PATH).length);

    for (const route of audit.routes) {
      expect(
        route.linkedDsdCount,
        `Route ${route.pathname} should emit populated Declarative Shadow DOM roots in linked mode`,
      ).toBeGreaterThan(25);
      expect(route.linkedLinkCount).toBeGreaterThan(10);
      expect(route.linkedHeadHasPreload).toBe(true);
      expect(route.linkedHasShadowLinks).toBe(true);
      expect(route.linkedCriticalTagsChecked).toBeGreaterThan(10);
      expect(
        route.linkedMaxCriticalBytes,
        `Route ${route.pathname} criticalBytesByTag must be strictly < 1024 bytes`,
      ).toBeLessThan(1024);
      expect(
        route.linkedMaxInlineStyleBytes,
        `Route ${route.pathname} inline critical <style> in linked DSD must be < 1024 bytes`,
      ).toBeLessThan(1024);
      expect(route.linkedSampleCssResolved).toBe(true);
    }
  });

  it('renders <template shadowrootmode="open"> across all 7 routes in inline mode with full inline <style> and zero external shadow <link> tags', () => {
    for (const route of audit.routes) {
      expect(
        route.inlineDsdCount,
        `Route ${route.pathname} should emit identical DSD root count in inline mode`,
      ).toBe(route.linkedDsdCount);
      expect(route.inlineLinkCount).toBe(0);
      expect(route.inlineHasShadowLinks).toBe(false);
      expect(route.inlineHasFullStyle).toBe(true);
    }
  });

  it('streams DSD HTML via renderToStream + createSsrTransformStream and expands raw markup via transformHtmlDsd idempotently', () => {
    // 1. Demo SSR stream endpoint helper
    expect(audit.streamHtml).toContain('shadowrootmode="open"');
    expect(audit.streamHtml).toContain('WinterCG Streaming DSD Active');
    expect(audit.streamHtml.split('</head>')[0]).toContain(
      'rel="preload" as="style" href="/_methane/styles/',
    );

    // 2. Custom renderToStream + createSsrTransformStream with hydrationModuleUrl
    expect(audit.customPipeHtml).toContain('shadowrootmode="open"');
    expect(audit.customPipeHtml.split('</head>')[0]).toContain(
      'rel="preload" as="style" href="/_methane/styles/mth-badge.',
    );
    expect(audit.customPipeHtml).toContain(
      '<script type="module" src="/src/entry-client.ts"></script></body>',
    );

    // 3. Framework-agnostic transformHtmlDsd + idempotency + <script> preservation
    expect(audit.transformFirstExpanded).toEqual(['mth-badge', 'mth-button']);
    expect(audit.transformFirstHtml).toContain('shadowrootmode="open"');
    expect(audit.transformFirstHtml.split('</head>')[0]).toContain(
      'rel="preload" as="style" href="/_methane/styles/mth-badge.',
    );
    expect(audit.transformFirstHtml).toContain(
      'const raw = "<mth-badge>do-not-expand</mth-badge>";',
    );
    expect(audit.transformSecondExpanded).toEqual([]);
  });

  it('hydrates server-rendered DSD output in JSDOM via hydrateRoot without throwing or replacing shadow roots', async () => {
    expect(isHydrationSupported()).toBe(true);

    const noopActions: AtmosActions = {
      navigate: () => {},
      updateState: () => {},
      updateViewUi: () => {},
      notify: () => {},
      announce: () => {},
    };

    for (const sample of [
      { label: 'overview', html: audit.overviewAppHtml, state: audit.overviewState },
      { label: 'studio', html: audit.studioAppHtml, state: audit.studioState },
    ]) {
      const appContainer = document.createElement('div');
      appContainer.id = `app-${sample.label}`;
      document.body.appendChild(appContainer);

      await activateAtmosLocale(sample.state.locale);
      attachDeclarativeShadowDomInJsdom(appContainer, sample.html);

      const preNavbar = appContainer.querySelector('mth-navbar');
      const preNavbarShadow = preNavbar?.shadowRoot ?? null;
      expect(preNavbar, `${sample.label} should contain server-rendered <mth-navbar>`).not.toBeNull();
      expect(preNavbarShadow, `${sample.label} <mth-navbar> should carry DSD shadowRoot`).not.toBeNull();
      expect(appContainer.querySelectorAll('[defer-hydration]').length).toBeGreaterThan(0);

      expect(() => {
        hydrateRoot(
          renderAppShell(sample.state, noopActions, getViewModule(sample.state.route)),
          appContainer,
        );
        appContainer
          .querySelectorAll('[defer-hydration]')
          .forEach((el) => el.removeAttribute('defer-hydration'));
      }).not.toThrow();

      // Flush queued custom-element hydration microtasks
      await new Promise<void>((resolveFlush) => setTimeout(resolveFlush, 0));

      // Existing host element & its DSD shadowRoot must be upgraded in-place, never replaced
      expect(appContainer.querySelector('mth-navbar')).toBe(preNavbar);
      expect(preNavbar?.shadowRoot).toBe(preNavbarShadow);
      expect(appContainer.querySelectorAll('[defer-hydration]').length).toBe(0);

      // Post-hydration reactive client render updates in place without throwing
      const updatedState: AtmosState = {
        ...sample.state,
        theme: 'light',
        density: 'compact',
      };
      expect(() => {
        render(
          renderAppShell(updatedState, noopActions, getViewModule(updatedState.route)),
          appContainer,
        );
      }).not.toThrow();

      appContainer.remove();
    }
  });
});
