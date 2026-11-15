import { installSsrDomShim } from '@methane-ui/ssr/dom-shim';

installSsrDomShim();

// Upstream @methane-ui/ssr/dom-shim & @lit-labs/ssr-dom-shim omit document.createDocumentFragment
// (invoked by @lit/reactive-element's @queryAll) and document.compatMode (checked by KaTeX in <mth-math-editor>).
if (typeof document !== 'undefined') {
  const docRecord = document as unknown as Record<string, unknown>;
  docRecord['compatMode'] ??= 'CSS1Compat';
  if (typeof document.createDocumentFragment !== 'function') {
    docRecord['createDocumentFragment'] = () => ({
      querySelectorAll: () => [],
      querySelector: () => null,
      children: [],
      childNodes: [],
      appendChild: (node: unknown) => node,
    });
  }
}

import { html, type TemplateResult } from 'lit';
import {
  createSsrTransformStream,
  hoistStylesheetLinks,
  renderToStream,
  renderWithMetadata,
  transformHtmlDsd,
  type StylesheetLink,
  type TransformHtmlDsdResult,
} from '@methane-ui/ssr';
import { registerAllAtmosElements } from './register-elements.js';
import { renderAppShell } from './shell/app-shell.js';
import { activateAtmosLocale, createInitialAtmosState } from './state.js';
import { ATMOS_VIEW_MANIFEST, getViewModule } from './views/manifest.js';
import type { AtmosActions, AtmosState } from './types.js';

registerAllAtmosElements();

const stylesheetAssetCache = new Map<string, StylesheetLink>();

const serverNoopActions: AtmosActions = {
  navigate: () => {},
  updateState: () => {},
  updateViewUi: () => {},
  notify: () => {},
  announce: () => {},
};

function recordStylesheetLink(link: StylesheetLink): void {
  stylesheetAssetCache.set(link.href, link);
  const fileName = link.href.split('/').pop();
  if (fileName) {
    stylesheetAssetCache.set(fileName, link);
  }
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeInitialStateScript(state: AtmosState): string {
  const safeJson = JSON.stringify(state).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return `<script id="atmos-initial-state" type="application/json">${safeJson}</script>`;
}

export function renderAppRoot(state: AtmosState, actions: AtmosActions): TemplateResult {
  return renderAppShell(state, actions, getViewModule(state.route));
}

export interface RenderedPagePayload {
  readonly html: string;
  readonly state: AtmosState;
  readonly links: ReadonlyArray<StylesheetLink>;
  readonly criticalBytesByTag: Readonly<Record<string, number>>;
}

export async function renderUrlToHtml(
  url: string | URL,
  htmlTemplate: string,
): Promise<RenderedPagePayload> {
  const state = createInitialAtmosState(url);
  await activateAtmosLocale(state.locale);

  const activeView = getViewModule(state.route);
  const ssrResult = await renderWithMetadata(renderAppRoot(state, serverNoopActions), {
    styles: state.ssrStyles,
    assetBase: '/_methane/styles',
    deferHydration: true,
    onStylesheetLink: recordStylesheetLink,
  });

  for (const link of ssrResult.links) {
    recordStylesheetLink(link);
  }

  const pageTitle = `AtmosOps · ${activeView.title}`;
  let documentHtml = htmlTemplate
    .replace('__ATMOS_LANG__', escapeHtmlText(state.locale))
    .replace('__ATMOS_DIR__', escapeHtmlText(state.dir))
    .replace('__ATMOS_THEME__', escapeHtmlText(state.theme))
    .replace('__ATMOS_DENSITY__', escapeHtmlText(state.density))
    .replace('__ATMOS_BRAND_SEED__', escapeHtmlText(state.brandSeed))
    .replace('__ATMOS_TITLE__', escapeHtmlText(pageTitle))
    .replace('<!--ATMOS_SSR_HEAD-->', '')
    .replace('<!--ATMOS_SSR_APP-->', () => ssrResult.html)
    .replace('<!--ATMOS_SSR_STATE-->', () => serializeInitialStateScript(state));

  if (state.ssrStyles === 'linked') {
    documentHtml = hoistStylesheetLinks(documentHtml, { headMode: 'preload' });
  }

  return {
    html: documentHtml,
    state,
    links: ssrResult.links,
    criticalBytesByTag: ssrResult.criticalBytesByTag,
  };
}

let warmedAllRoutes = false;

export async function getStylesheetCss(hrefOrFileName: string): Promise<string | null> {
  const cleanKey = hrefOrFileName.split('?')[0] ?? hrefOrFileName;
  const baseName = cleanKey.split('/').pop() ?? cleanKey;
  const cached = stylesheetAssetCache.get(cleanKey) ?? stylesheetAssetCache.get(baseName);
  if (cached) {
    return cached.css;
  }

  if (!warmedAllRoutes) {
    warmedAllRoutes = true;
    for (const view of ATMOS_VIEW_MANIFEST) {
      const warmState = createInitialAtmosState(`http://localhost${view.path}`);
      await renderWithMetadata(renderAppRoot(warmState, serverNoopActions), {
        styles: 'linked',
        assetBase: '/_methane/styles',
        deferHydration: true,
        onStylesheetLink: recordStylesheetLink,
      });
    }
    const afterWarm = stylesheetAssetCache.get(cleanKey) ?? stylesheetAssetCache.get(baseName);
    if (afterWarm) {
      return afterWarm.css;
    }
  }

  return null;
}

/**
 * Showcases `@methane-ui/ssr` WinterCG `renderToStream()` piped through
 * `createSsrTransformStream()` for streaming DSD HTML + `<head>` link hoisting.
 */
export function createDemoSsrStream(): ReadableStream<Uint8Array> {
  const sampleTemplate = html`<!doctype html>
    <html lang="en" data-mth-theme="dark">
      <head>
        <meta charset="utf-8" />
        <title>AtmosOps Streaming DSD Probe</title>
      </head>
      <body>
        <mth-callout variant="success" title="WinterCG Streaming DSD Active">
          Orbit #14892 telemetry streamed via <code>renderToStream()</code> +
          <code>createSsrTransformStream()</code>.
        </mth-callout>
        <mth-badge variant="accent" pill>142.8 kg/hr → 0.3 kg/hr</mth-badge>
      </body>
    </html>`;

  return renderToStream(sampleTemplate, {
    styles: 'linked',
    assetBase: '/_methane/styles',
    onStylesheetLink: recordStylesheetLink,
  }).pipeThrough(
    createSsrTransformStream({
      headMode: 'preload',
    }),
  );
}

/**
 * Showcases `@methane-ui/ssr` framework-agnostic `transformHtmlDsd()` HTML post-processor
 * (used by Next.js RSC, Nuxt Nitro, SvelteKit, Astro, and Angular SSR).
 */
export async function runDemoTransformHtmlDsd(rawHtml?: string): Promise<TransformHtmlDsdResult> {
  const input =
    rawHtml && rawHtml.trim().length > 0
      ? rawHtml
      : `<!doctype html><html><head><title>Transform Probe</title></head><body><mth-badge variant="success">OGMP Gold Sealed</mth-badge><mth-button variant="solid" size="sm">Verify Valve XV-402</mth-button></body></html>`;

  const result = await transformHtmlDsd(input, {
    styles: 'linked',
    assetBase: '/_methane/styles',
    hoistLinks: true,
    onStylesheetLink: recordStylesheetLink,
  });

  for (const link of result.links) {
    recordStylesheetLink(link);
  }

  return result;
}
