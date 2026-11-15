// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';

// Import server entry first so @methane-ui/ssr/dom-shim installs cleanly before Lit evaluates.
import { renderUrlToHtml, type RenderedPagePayload } from '../src/entry-server.js';
import {
  ALL_251_CUSTOM_ELEMENT_TAGS,
  ALL_256_MTH_TAGS,
  ALL_5_CSS_LAYOUT_TAGS,
  ALL_CSS_UTILITY_CLASSES,
  COVERAGE_MANIFEST,
  getTagsForRoute,
  PRIMITIVES_UTILITY_SLUGS,
  CSS_LAYOUT_TAG_SLUGS,
  SUPPORTED_ATMOS_LOCALES,
} from '../src/coverage-manifest.js';
import { DEFAULT_DTCG_TOKENS_JSON, SANITIZER_REDTEAM_PAYLOADS } from '../src/data/index.js';
import { ROUTE_TO_PATH } from '../src/state.js';
import type { AtmosRouteId } from '../src/types.js';
import { compileDtcgTokens, pathToCssVar, type DtcgDocument } from '@methane-ui/tokens/compiler';
import {
  formatMessage,
  getLocaleDirection,
  loadLocalePack,
  SUPPORTED_LOCALES,
} from '@methane-ui/locales';
import { isolateBidiValue } from '@methane-ui/core';
import { validateIbanMod97, validateLuhn } from '@methane-ui/primitives';
import {
  createStreamSanitizer,
  escapeHtml,
  isSafeUrl,
  parseSafeFragment,
  safeSetHTML,
  safeSetMarkdown,
  sanitizeUrl,
} from '@methane-ui/sanitize';

const ROOT_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const INDEX_HTML_TEMPLATE = readFileSync(join(ROOT_DIR, 'index.html'), 'utf8');

const CEM_PACKAGES = [
  'ui',
  'ai',
  'auth',
  'admin',
  'chat',
  'commerce',
  '3d',
  'charts',
  'code',
  'datagrid',
  'editor',
  'flow',
  'maps',
  'media',
  'pdf',
  'rtc',
  'spreadsheet',
] as const;

interface CustomElementsManifestModule {
  readonly declarations?: ReadonlyArray<{ readonly tagName?: string }>;
  readonly exports?: ReadonlyArray<{ readonly kind?: string; readonly name?: string }>;
}

interface CustomElementsManifest {
  readonly modules?: ReadonlyArray<CustomElementsManifestModule>;
}

function readPackageCustomElementTags(pkgShortName: string): ReadonlyArray<string> {
  const cemPath = join(
    ROOT_DIR,
    'node_modules',
    '@methane-ui',
    pkgShortName,
    'custom-elements.json',
  );
  const parsed = JSON.parse(readFileSync(cemPath, 'utf8')) as CustomElementsManifest;
  const discovered = new Set<string>();

  for (const mod of parsed.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (typeof decl.tagName === 'string' && decl.tagName.startsWith('mth-')) {
        discovered.add(decl.tagName);
      }
    }
    for (const exp of mod.exports ?? []) {
      if (
        exp.kind === 'custom-element-definition' &&
        typeof exp.name === 'string' &&
        exp.name.startsWith('mth-')
      ) {
        discovered.add(exp.name);
      }
    }
  }

  return [...discovered].sort();
}

describe('AtmosOps 100% Methane UI Coverage & Foundation Audit', () => {
  const renderedByRoute = new Map<AtmosRouteId, RenderedPagePayload>();

  beforeAll(async () => {
    const routes = Object.entries(ROUTE_TO_PATH) as ReadonlyArray<[AtmosRouteId, string]>;
    for (const [routeId, pathname] of routes) {
      const rendered = await renderUrlToHtml(`http://127.0.0.1:4173${pathname}`, INDEX_HTML_TEMPLATE);
      renderedByRoute.set(routeId, rendered);
    }
  });

  it('dynamically discovers all 256 tags from custom-elements.json + primitives + css and matches COVERAGE_MANIFEST 1:1', () => {
    const cemTagsByPkg = new Map<string, ReadonlyArray<string>>();
    const allDiscoveredTags = new Set<string>();

    for (const pkg of CEM_PACKAGES) {
      const tags = readPackageCustomElementTags(pkg);
      expect(tags.length, `@methane-ui/${pkg} should export at least 1 custom element`).toBeGreaterThan(0);
      cemTagsByPkg.set(`@methane-ui/${pkg}`, tags);
      for (const tag of tags) {
        allDiscoveredTags.add(tag);
      }
    }

    // 248 custom elements from the 17 CEM-bearing packages
    expect(allDiscoveredTags.size).toBe(248);

    // + 3 @methane-ui/primitives utility custom elements
    const primitiveTags = PRIMITIVES_UTILITY_SLUGS.map((slug) => `mth-${slug}`);
    expect(primitiveTags).toEqual([
      'mth-visually-hidden',
      'mth-skip-link',
      'mth-error-boundary',
    ]);
    for (const tag of primitiveTags) {
      allDiscoveredTags.add(tag);
    }

    // + 5 @methane-ui/css pure-CSS layout tags
    const cssLayoutTags = CSS_LAYOUT_TAG_SLUGS.map((slug) => `mth-${slug}`);
    expect(cssLayoutTags).toEqual([
      'mth-stack',
      'mth-grid',
      'mth-flex',
      'mth-container',
      'mth-spacer',
    ]);
    for (const tag of cssLayoutTags) {
      allDiscoveredTags.add(tag);
    }

    expect(allDiscoveredTags.size).toBe(256);
    expect(ALL_256_MTH_TAGS).toHaveLength(256);
    expect(ALL_251_CUSTOM_ELEMENT_TAGS).toHaveLength(251);
    expect(ALL_5_CSS_LAYOUT_TAGS).toHaveLength(5);

    const manifestSet = new Set<string>(ALL_256_MTH_TAGS);
    const missingFromManifest = [...allDiscoveredTags].filter((tag) => !manifestSet.has(tag));
    const unknownInManifest = [...manifestSet].filter((tag) => !allDiscoveredTags.has(tag));

    expect(missingFromManifest).toEqual([]);
    expect(unknownInManifest).toEqual([]);

    // Verify per-package counts match custom-elements.json exactly
    for (const [fullPkgName, cemTags] of cemTagsByPkg.entries()) {
      const manifestPkgTags = COVERAGE_MANIFEST.filter((entry) => entry.pkg === fullPkgName)
        .map((entry) => entry.tag)
        .sort();
      expect(manifestPkgTags, `Package ${fullPkgName} manifest parity`).toEqual(cemTags);
    }
  });

  it('registers 100% of all 251 custom elements plus white-label <atmos-*> elements and renders all 256 tags in SSR HTML across the 7 routes', () => {
    const unregisteredCustomElements = ALL_251_CUSTOM_ELEMENT_TAGS.filter(
      (tag) => customElements.get(tag) === undefined,
    );
    expect(unregisteredCustomElements).toEqual([]);

    for (const whiteLabelTag of ['atmos-button', 'atmos-badge', 'atmos-input']) {
      expect(customElements.get(whiteLabelTag), `${whiteLabelTag} should be registered`).toBeDefined();
    }

    const combinedHtml = [...renderedByRoute.values()].map((r) => r.html).join('\n');

    const missingInGlobalSsr = ALL_256_MTH_TAGS.filter((tag) => {
      const openPattern = new RegExp(`<${tag}(?:\\s|>)`);
      return !openPattern.test(combinedHtml);
    });
    expect(missingInGlobalSsr).toEqual([]);

    // Verify every route renders 100% of its owned primary tags on first byte
    for (const routeId of Object.keys(ROUTE_TO_PATH) as ReadonlyArray<AtmosRouteId>) {
      const routeHtml = renderedByRoute.get(routeId)?.html ?? '';
      const ownedByRoute = getTagsForRoute(routeId);
      const missingOnRoute = ownedByRoute.filter((tag) => {
        const openPattern = new RegExp(`<${tag}(?:\\s|>)`);
        return !openPattern.test(routeHtml);
      });
      expect(
        missingOnRoute,
        `Route "${routeId}" must render 100% of its ${ownedByRoute.length} owned tags in SSR HTML`,
      ).toEqual([]);
    }
  });

  it('renders 100% of ALL_CSS_UTILITY_CLASSES in the overview (/) SSR HTML', () => {
    const overviewHtml = renderedByRoute.get('overview')?.html ?? '';
    expect(overviewHtml.length).toBeGreaterThan(10_000);

    const allUtilityClasses = [
      ...ALL_CSS_UTILITY_CLASSES.layout,
      ...ALL_CSS_UTILITY_CLASSES.prose,
      ...ALL_CSS_UTILITY_CLASSES.marketing,
      ...ALL_CSS_UTILITY_CLASSES.forms,
    ];
    expect(allUtilityClasses).toHaveLength(59);

    const classAttrMatches = overviewHtml.matchAll(/\bclass="([^"]+)"/g);
    const presentClasses = new Set<string>();
    for (const match of classAttrMatches) {
      const tokens = (match[1] ?? '').split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        presentClasses.add(token);
      }
    }

    const missingCssClasses = allUtilityClasses.filter((cls) => !presentClasses.has(cls));
    expect(missingCssClasses).toEqual([]);
  });

  it('compiles W3C DTCG token documents into --mth-* CSS custom properties including light-dark() extensions', () => {
    const defaultDoc = JSON.parse(DEFAULT_DTCG_TOKENS_JSON) as DtcgDocument;
    const defaultResult = compileDtcgTokens(defaultDoc);
    expect(defaultResult.tokens.length).toBeGreaterThanOrEqual(3);
    expect(defaultResult.css).toContain(':root');
    expect(defaultResult.css).toContain('--mth-');

    const richDoc: DtcgDocument = {
      color: {
        $type: 'color',
        plumeAlert: {
          $value: 'oklch(0.62 0.21 28)',
          $description: 'Critical plume threshold accent',
          $extensions: {
            'com.methane.theme': {
              light: 'oklch(0.52 0.22 28)',
              dark: 'oklch(0.72 0.19 28)',
            },
          },
        },
      },
      spacing: {
        panelGap: {
          $type: 'dimension',
          $value: '1.25rem',
        },
      },
    };

    const compiled = compileDtcgTokens(richDoc);
    expect(pathToCssVar('color.plumeAlert')).toBe('--mth-color-plume-alert');
    expect(compiled.tokenMap['color.plumeAlert']).toBe('--mth-color-plume-alert');
    expect(compiled.tokenMap['spacing.panelGap']).toBe('--mth-spacing-panel-gap');
    expect(compiled.css).toContain('light-dark(oklch(0.52 0.22 28), oklch(0.72 0.19 28))');
    expect(compiled.css).toContain('--mth-spacing-panel-gap: 1.25rem;');
  });

  it('loads all 8 @methane-ui/locales packs, returns rtl for ar & he, and formats plural + bidi strings', async () => {
    const expectedCodes = SUPPORTED_ATMOS_LOCALES.map((loc) => loc.code);
    expect(expectedCodes).toEqual(['en', 'es', 'fr', 'de', 'ja', 'zh-CN', 'ar', 'he']);
    expect([...SUPPORTED_LOCALES].sort()).toEqual([...expectedCodes].sort());

    for (const localeMeta of SUPPORTED_ATMOS_LOCALES) {
      const pack = await loadLocalePack(localeMeta.code);
      expect(pack.locale).toBe(localeMeta.code);

      const expectedDir = localeMeta.code === 'ar' || localeMeta.code === 'he' ? 'rtl' : 'ltr';
      expect(pack.dir).toBe(expectedDir);
      expect(getLocaleDirection(localeMeta.code)).toBe(expectedDir);

      const formatted = formatMessage(pack, 'table.rowsCount', { count: 5 });
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).not.toBe('table.rowsCount');
    }

    const isolated = isolateBidiValue('PERM-B4 / XV-402');
    expect(isolated).toContain('\u2068');
    expect(isolated).toContain('\u2069');
  });

  it('validates payment cards with validateLuhn and IBANs with validateIbanMod97', () => {
    // Valid Luhn test numbers (validateLuhn expects stripped digits; spaces fail non-digit check)
    expect(validateLuhn('4532015112830366')).toBe(true);
    expect(validateLuhn('4532 0151 1283 0366'.replace(/\D+/g, ''))).toBe(true);
    expect(validateLuhn('4532 0151 1283 0366')).toBe(false);
    // Invalid check digit & empty/short strings
    expect(validateLuhn('4532015112830367')).toBe(false);
    expect(validateLuhn('')).toBe(false);

    // Valid ISO 13616 Mod-97 IBANs
    expect(validateIbanMod97('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(validateIbanMod97('GB29NWBK60161331926819')).toBe(true);
    // Corrupted checksum / country code
    expect(validateIbanMod97('DE00 3704 0044 0532 0130 00')).toBe(false);
    expect(validateIbanMod97('INVALID-IBAN')).toBe(false);
  });

  it('blocks XSS vectors across safeSetHTML, safeSetMarkdown, createStreamSanitizer, parseSafeFragment, and isSafeUrl', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="html-sink"></div><div id="md-sink"></div><div id="stream-sink"></div></body></html>',
    );
    const doc = dom.window.document;
    const htmlSink = doc.getElementById('html-sink')!;
    const mdSink = doc.getElementById('md-sink')!;
    const streamSink = doc.getElementById('stream-sink')!;

    // 1. URL firewall allowlist & dangerous scheme blocking
    expect(isSafeUrl('https://www.epa.gov/ghgreporting')).toBe(true);
    expect(isSafeUrl('mailto:compliance@atmosops.io')).toBe(true);
    expect(isSafeUrl('/media/ogmp-compliance-report.pdf')).toBe(true);
    expect(isSafeUrl('#orbit-14892')).toBe(true);

    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('  JaVaScRiPt:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('//evil.attacker.example/steal')).toBe(false);
    expect(sanitizeUrl('javascript:alert(1)', '#blocked')).toBe('#blocked');

    // 2. safeSetHTML strips <script>, inline event handlers, and unsafe href/src attributes
    safeSetHTML(
      htmlSink,
      '<p>Telemetry OK</p><img src="x" onerror="alert(1)"><script>window.__xss = 1</script><a href="javascript:alert(2)">Bad</a><svg onload="alert(3)"></svg>',
      { ownerDocument: doc },
    );
    expect(htmlSink.textContent).toContain('Telemetry OK');
    expect(htmlSink.querySelector('script')).toBeNull();
    expect(htmlSink.querySelector('[onerror], [onload]')).toBeNull();
    const anchorInHtml = htmlSink.querySelector('a');
    if (anchorInHtml) {
      expect(anchorInHtml.getAttribute('href') ?? '').not.toContain('javascript:');
    }

    // 3. safeSetMarkdown escapes raw HTML by default and neutralizes javascript: links
    safeSetMarkdown(
      mdSink,
      '**Verified Seal** [Evil Link](javascript:alert(1)) <img src=x onerror=alert(9)> <script>alert(9)</script>',
      { ownerDocument: doc },
    );
    expect(mdSink.querySelector('strong')?.textContent).toBe('Verified Seal');
    expect(mdSink.querySelector('script')).toBeNull();
    expect(mdSink.querySelector('img[onerror]')).toBeNull();
    for (const a of mdSink.querySelectorAll('a')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/^javascript:/i);
    }

    // 4. createStreamSanitizer handles split XSS tags across chunk boundaries safely
    const stream = createStreamSanitizer({ allowRawHtml: true, ownerDocument: doc });
    stream.push('<p>Orbit #14892</p><scr');
    stream.push('ipt>alert("xss")</script><img src="x" one');
    stream.push('rror="alert(2)"><strong>0.3 kg/hr</strong>');
    stream.flushTo(streamSink, { ownerDocument: doc });

    expect(streamSink.textContent).toContain('Orbit #14892');
    expect(streamSink.textContent).toContain('0.3 kg/hr');
    expect(streamSink.querySelector('script')).toBeNull();
    expect(streamSink.querySelector('[onerror]')).toBeNull();

    const streamFrag = stream.toFragment({ ownerDocument: doc });
    expect(streamFrag.querySelectorAll('script, iframe, [onerror], [onload]').length).toBe(0);

    // 5. Verify all red-team payloads used in /war-room produce 0 executable elements
    for (const payload of SANITIZER_REDTEAM_PAYLOADS) {
      const frag = parseSafeFragment(payload.markdown, { ownerDocument: doc });
      expect(
        frag.querySelectorAll('script, iframe, object, embed, [onerror], [onload], [onclick]').length,
        `Red-team payload ${payload.id} must have 0 executable nodes`,
      ).toBe(0);
      expect(escapeHtml(payload.markdown)).not.toContain('<script');
    }
  });
});
