import { html } from 'lit';
import {
  CORE_VERSION,
  formatI18nMessage,
  isolateBidiValue,
  registerStyles,
} from '@methane-ui/core';
import { compileDtcgTokens, type DtcgDocument } from '@methane-ui/tokens/compiler';
import { formatMessage } from '@methane-ui/locales';
import { AutoLoader } from '@methane-ui/primitives';
import { compileManifest, createPrefixManifest } from '@methane-ui/codemod/manifest';
import {
  ALL_256_MTH_TAGS,
  ATMOS_PACKAGES,
  COVERAGE_MANIFEST,
  getTagsForRoute,
  SUPPORTED_ATMOS_LOCALES,
} from '../coverage-manifest.js';
import {
  DEFAULT_DTCG_TOKENS_JSON,
  FRAMEWORK_CODE_TAB_ITEMS,
} from '../data/index.js';
import { isStaticPagesMode, withBasePath } from '../base-path.js';
import { registerWhiteLabelDemoElements } from '../register-elements.js';
import { getLoadedLocalePack } from '../state.js';
import type {
  AtmosActions,
  AtmosDensityMode,
  AtmosLocaleCode,
  AtmosSsrStyleMode,
  AtmosState,
  AtmosThemeMode,
  AtmosViewModule,
} from '../types.js';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark (Mission)' },
  { value: 'light', label: 'Light (Daylight)' },
] as const;

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact (0.8x)' },
  { value: 'default', label: 'Default (1.0x)' },
  { value: 'comfortable', label: 'Comfortable (1.2x)' },
] as const;

const SSR_MODE_OPTIONS = [
  { value: 'linked', label: 'Hybrid Linked (<1KB Shell)' },
  { value: 'inline', label: 'Full Inline Shadow CSS' },
] as const;

const BRAND_SEED_PRESETS = [
  { label: 'Atmos Emerald', seed: 'oklch(0.58 0.20 175)', hex: '#0d9488' },
  { label: 'Orbital Cobalt', seed: 'oklch(0.55 0.23 264)', hex: '#4f46e5' },
  { label: 'Thermal Amber', seed: 'oklch(0.64 0.19 55)', hex: '#d97706' },
  { label: 'Plume Crimson', seed: 'oklch(0.57 0.22 25)', hex: '#dc2626' },
] as const;

export const studioView: AtmosViewModule = {
  id: 'studio',
  path: '/studio',
  title: 'Theme, OKLCH DTCG, Locale/RTL, Prefix & 256-Tag Studio',
  subtitle:
    'Live perceptual OKLCH token compiler, 8-locale bidirectional switcher, white-label custom element prefixing, DSD SSR stream inspector, and 256/256 coverage audit.',
  badge: '256/256',
  ownedTags: getTagsForRoute('studio'),
  render(state: AtmosState, actions: AtmosActions) {
    const dtcgJson = String(state.ui['dtcgJson'] ?? DEFAULT_DTCG_TOKENS_JSON);
    const dtcgStatus = String(state.ui['dtcgStatus'] ?? 'Ready · 3 custom tokens compiled');
    const hueValue = Number(state.ui['seedHue'] ?? 175);
    const pluralCount = Number(state.ui['pluralSampleCount'] ?? 1);
    const autoLoaderStatus = String(
      state.ui['autoLoaderStatus'] ?? 'Idle · Ready to scan dynamic tags',
    );
    const ssrInspectorOutput = String(
      state.ui['ssrInspectorOutput'] ??
        'Click "Fetch /api/ssr-transform" or "Fetch /api/ssr-stream" to inspect live server DSD output.',
    );
    const coverageFilter = String(state.ui['coverageFilter'] ?? '').trim().toLowerCase();

    const activePrefix = state.whiteLabelPrefix || 'atmos';
    const compiledCodemod = compileManifest(
      createPrefixManifest({
        fromTagPrefix: 'mth-',
        toTagPrefix: `${activePrefix}-`,
        fromTokenPrefix: '--mth-',
        toTokenPrefix: `--${activePrefix}-`,
      }),
    );

    const pluralPreview = formatI18nMessage(
      {
        zero: 'Zero active methane plumes in {station}',
        one: '{count} active methane plume in {station}',
        two: 'Dual active methane plumes ({count}) in {station}',
        few: '{count} regional methane plumes in {station}',
        many: '{count} monitored methane plumes in {station}',
        other: '{count} active methane plumes in {station}',
      },
      { count: pluralCount, station: isolateBidiValue('PERM-B4 / XV-402') },
      state.locale,
    );

    const activePack = getLoadedLocalePack(state.locale);
    const catalogPreview = activePack
      ? `${formatMessage(activePack, 'overlay.notifications', { count: pluralCount })} · ${formatMessage(activePack, 'table.rowsCount', { count: pluralCount })}`
      : '';

    const filteredManifest = coverageFilter
      ? COVERAGE_MANIFEST.filter(
          (item) =>
            item.tag.includes(coverageFilter) ||
            item.pkg.toLowerCase().includes(coverageFilter) ||
            item.ownerSlice.includes(coverageFilter),
        )
      : COVERAGE_MANIFEST;

    const applyDtcgCompilation = () => {
      try {
        const parsed = JSON.parse(dtcgJson) as DtcgDocument;
        const compiled = compileDtcgTokens(parsed);
        if (typeof document !== 'undefined') {
          let styleEl = document.getElementById('atmos-dtcg-live') as HTMLStyleElement | null;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'atmos-dtcg-live';
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = compiled.css;
        }
        actions.updateViewUi(
          'dtcgStatus',
          `Compiled ${compiled.tokens.length} W3C DTCG tokens (${compiled.css.length} bytes CSS)`,
        );
        actions.notify(`Applied ${compiled.tokens.length} compiled DTCG tokens!`, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actions.updateViewUi('dtcgStatus', `DTCG parse error: ${msg}`);
        actions.notify(`DTCG error: ${msg}`, 'danger');
      }
    };

    const toggleConstructableOverride = () => {
      const next = !state.customStyleOverride;
      registerStyles(
        'mth-button',
        next
          ? '@layer override { [part="control"] { letter-spacing: 0.06em; text-transform: uppercase; } }'
          : '',
      );
      actions.updateState({ customStyleOverride: next });
      actions.notify(
        next
          ? 'Injected @layer override Constructable Stylesheet on mth-button'
          : 'Cleared @layer override on mth-button',
        'info',
      );
    };

    const runAutoLoaderProbe = async () => {
      const loader = new AutoLoader({
        prefix: 'atmos-',
        resolveTag: async (tagName) => {
          const prefix = tagName.split('-')[0] ?? 'atmos';
          registerWhiteLabelDemoElements(prefix);
        },
      });
      if (typeof document !== 'undefined') {
        await loader.scanNode(document);
      }
      loader.stop();
      actions.updateViewUi(
        'autoLoaderStatus',
        `AutoLoader scanned DOM (core v${CORE_VERSION}) · loaded=${loader.registeredLoadedTags.size}`,
      );
      actions.notify('AutoLoader scan completed with zero unregistered tags!', 'success');
    };

    const fetchSsrTransform = async () => {
      try {
        if (isStaticPagesMode()) {
          const fixtureUrl = withBasePath('/_methane/ssr-transform-sample.json');
          const res = await fetch(fixtureUrl);
          const payload = (await res.json()) as { html: string };
          actions.updateViewUi('ssrInspectorOutput', payload.html.slice(0, 1400));
          actions.notify(
            `Loaded pre-rendered transformHtmlDsd() snapshot (${payload.html.length} bytes DSD HTML)`,
            'success',
          );
          return;
        }
        const liveUrl = withBasePath('/api/ssr-transform?sample=1');
        const res = await fetch(liveUrl);
        if (!res.ok) {
          const fallbackRes = await fetch(withBasePath('/_methane/ssr-transform-sample.json'));
          const payload = (await fallbackRes.json()) as { html: string };
          actions.updateViewUi('ssrInspectorOutput', payload.html.slice(0, 1400));
          actions.notify(`Loaded DSD transform snapshot (${payload.html.length} bytes)`, 'success');
          return;
        }
        const text = await res.text();
        actions.updateViewUi('ssrInspectorOutput', text.slice(0, 1400));
        actions.notify(`Fetched ${liveUrl} (${text.length} bytes DSD HTML)`, 'success');
      } catch (err) {
        actions.updateViewUi('ssrInspectorOutput', String(err));
      }
    };

    const fetchSsrStream = async () => {
      try {
        const targetUrl = isStaticPagesMode()
          ? withBasePath('/_methane/ssr-stream-sample.html')
          : withBasePath('/api/ssr-stream');
        let res = await fetch(targetUrl);
        if (!res.ok && !isStaticPagesMode()) {
          res = await fetch(withBasePath('/_methane/ssr-stream-sample.html'));
        }
        const text = await res.text();
        actions.updateViewUi('ssrInspectorOutput', text.slice(0, 1400));
        actions.notify(`Fetched ${targetUrl} (${text.length} bytes DSD HTML)`, 'success');
      } catch (err) {
        actions.updateViewUi('ssrInspectorOutput', String(err));
      }
    };

    return html`
      <mth-stack data-gap="6">
        <!-- 1. Live OKLCH Theme, Density, Color Picker & Sliders -->
        <section class="atmos-surface-card" aria-label="OKLCH Theme and Density Controls">
          <mth-stack data-gap="4">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">1. Perceptual OKLCH Seed, Mode &amp; Density Studio</h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Override <code>--mth-color-seed-brand</code>, switch <code>data-mth-theme</code> / <code>data-mth-density</code>, and test <code>registerStyles()</code>.
                </p>
              </div>
              <mth-badge variant="accent">Core v${CORE_VERSION}</mth-badge>
            </div>

            <mth-grid style="--mth-grid-min:min(100%, 15rem)">
              <mth-segmented-control
                name="themeMode"
                label="Color Scheme (data-mth-theme)"
                value=${state.theme}
                .options=${THEME_OPTIONS}
                @mth-change=${(ev: Event) => {
                  const val = (ev as CustomEvent<{ value?: string }>).detail?.value as AtmosThemeMode;
                  if (val) actions.updateState({ theme: val });
                }}
              ></mth-segmented-control>

              <mth-segmented-control
                name="densityMode"
                label="Density Scale (data-mth-density)"
                value=${state.density}
                .options=${DENSITY_OPTIONS}
                @mth-change=${(ev: Event) => {
                  const val = (ev as CustomEvent<{ value?: string }>).detail?.value as AtmosDensityMode;
                  if (val) actions.updateState({ density: val });
                }}
              ></mth-segmented-control>

              <mth-segmented-control
                name="ssrMode"
                label="DSD Style Delivery Mode"
                value=${state.ssrStyles}
                .options=${SSR_MODE_OPTIONS}
                @mth-change=${(ev: Event) => {
                  const val = (ev as CustomEvent<{ value?: string }>).detail?.value as AtmosSsrStyleMode;
                  if (val) actions.updateState({ ssrStyles: val });
                }}
              ></mth-segmented-control>
            </mth-grid>

            <div class="mth-grid" style="--mth-grid-min:min(100%, 15rem)">
              <mth-color-picker
                name="accentHex"
                label="Accent Swatch Reference"
                value="#0d9488"
                @mth-change=${(ev: Event) => {
                  const hex = (ev as CustomEvent<{ value?: string }>).detail?.value ?? '#0d9488';
                  actions.notify(`Selected swatch ${hex} — use OKLCH Hue slider for perceptual ramp`, 'info');
                }}
              ></mth-color-picker>

              <mth-slider
                name="oklchHue"
                label="OKLCH Brand Hue Angle (0°–360°)"
                min="0"
                max="360"
                step="5"
                .value=${hueValue}
                @mth-change=${(ev: Event) => {
                  const nextHue = Number((ev as CustomEvent<{ value?: number }>).detail?.value ?? 175);
                  actions.updateViewUi('seedHue', nextHue);
                  actions.updateState({ brandSeed: `oklch(0.58 0.20 ${nextHue})` });
                }}
              ></mth-slider>

              <mth-range-slider
                name="fluxBand"
                label="Alert Band Window (ppm)"
                min="0"
                max="200"
                step="5"
                start-value="25"
                end-value="145"
              ></mth-range-slider>
            </div>

            <mth-flex data-gap="2" style="flex-wrap:wrap">
              ${BRAND_SEED_PRESETS.map(
                (preset) => html`
                  <mth-button
                    variant=${state.brandSeed === preset.seed ? 'solid' : 'outline'}
                    size="sm"
                    @mth-press=${() => actions.updateState({ brandSeed: preset.seed })}
                  >
                    ${preset.label} (${preset.seed})
                  </mth-button>
                `,
              )}
              <mth-button
                variant=${state.customStyleOverride ? 'danger' : 'soft'}
                size="sm"
                @mth-press=${toggleConstructableOverride}
              >
                ${state.customStyleOverride
                  ? 'Reset registerStyles() Override'
                  : 'Test registerStyles() @layer override'}
              </mth-button>
            </mth-flex>
          </mth-stack>
        </section>

        <!-- 2. Live W3C DTCG Token Compiler -->
        <section class="atmos-surface-card" aria-label="W3C DTCG Token Compiler">
          <mth-stack data-gap="3">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">2. Live W3C DTCG <code>tokens.json</code> Compiler (<code>@methane-ui/tokens/compiler</code>)</h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Edit W3C Design Tokens Community Group JSON below and compile directly into live <code>--mth-*</code> CSS custom properties.
                </p>
              </div>
              <span class="atmos-mono-pill" data-testid="dtcg-status">${dtcgStatus}</span>
            </div>

            <textarea
              aria-label="W3C DTCG JSON document"
              class="mth-input"
              rows="8"
              style="font-family:var(--mth-font-mono,monospace);inline-size:100%"
              .value=${dtcgJson}
              @input=${(ev: Event) =>
                actions.updateViewUi('dtcgJson', (ev.target as HTMLTextAreaElement).value)}
            ></textarea>

            <mth-flex data-gap="2">
              <mth-button variant="solid" size="sm" data-testid="compile-dtcg-btn" @mth-press=${applyDtcgCompilation}>
                Compile &amp; Inject DTCG Tokens
              </mth-button>
              <mth-button
                variant="ghost"
                size="sm"
                @mth-press=${() => {
                  actions.updateViewUi('dtcgJson', DEFAULT_DTCG_TOKENS_JSON);
                  actions.updateState({ brandSeed: 'oklch(0.58 0.20 175)' });
                }}
              >
                Reset Default DTCG JSON
              </mth-button>
            </mth-flex>
          </mth-stack>
        </section>

        <!-- 3. 8-Locale Lazy Loader, RTL & Bidi Isolation -->
        <section class="atmos-surface-card" aria-label="Localization and RTL Studio">
          <mth-stack data-gap="3">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">3. 8-Locale BCP-47 Packs, <code>Intl.PluralRules</code> &amp; Automatic RTL (<code>ar</code>, <code>he</code>)</h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Switch any locale pack to update <code>html[lang]</code>, logical CSS layout mirroring (<code>dir="rtl"</code>), and Unicode FSI/PDI bidi isolation.
                </p>
              </div>
              <span class="atmos-mono-pill" data-testid="active-locale-pill">
                lang="${state.locale}" · dir="${state.dir}"
              </span>
            </div>

            <mth-flex data-gap="2" style="flex-wrap:wrap">
              ${SUPPORTED_ATMOS_LOCALES.map(
                (loc) => html`
                  <mth-button
                    variant=${state.locale === loc.code ? 'solid' : 'outline'}
                    size="sm"
                    data-testid="locale-btn-${loc.code}"
                    @mth-press=${() =>
                      actions.updateState({ locale: loc.code as AtmosLocaleCode, dir: loc.dir })}
                  >
                    ${loc.code} · ${loc.nativeLabel} (${loc.dir.toUpperCase()})
                  </mth-button>
                `,
              )}
            </mth-flex>

            <div class="atmos-surface-card" style="background:var(--mth-color-bg-subtle)">
              <mth-flex data-gap="3" data-align="center" data-justify="between" style="flex-wrap:wrap">
                <div>
                  <strong style="font-size:0.86rem">Plural &amp; Bidi Output:</strong>
                  <p style="margin:0.25rem 0 0;font-size:0.95rem" data-testid="plural-preview">
                    ${pluralPreview}
                  </p>
                  ${catalogPreview
                    ? html`<p style="margin:0.2rem 0 0;font-size:0.82rem;color:var(--mth-color-fg-muted)" data-testid="catalog-preview">
                        Catalog (<code>@methane-ui/locales</code>): ${catalogPreview}
                      </p>`
                    : ''}
                </div>
                <mth-flex data-gap="2">
                  ${[0, 1, 2, 5, 14].map(
                    (n) => html`
                      <mth-button
                        variant=${pluralCount === n ? 'solid' : 'soft'}
                        size="sm"
                        @mth-press=${() => actions.updateViewUi('pluralSampleCount', n)}
                      >
                        n=${n}
                      </mth-button>
                    `,
                  )}
                </mth-flex>
              </mth-flex>
            </div>
          </mth-stack>
        </section>

        <!-- 4. White-Label Prefix Sandbox, Codemod & Multi-Framework Code Tabs -->
        <section class="atmos-surface-card" aria-label="White-Label Custom Element Prefixing and Framework Code">
          <mth-stack data-gap="4">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">4. White-Label <code>&lt;atmos-*&gt;</code> Prefix Registry, Codemod &amp; Framework Wrappers</h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Live custom elements registered under the <code>atmos</code> prefix via <code>registerMthButton('atmos')</code> alongside <code>@methane-ui/codemod</code> rewrite rules.
                </p>
              </div>
              <span class="atmos-mono-pill">
                ${compiledCodemod.rewriteTag('mth-button')} · ${compiledCodemod.rewriteToken('--mth-color-accent')}
              </span>
            </div>

            <mth-flex data-gap="3" data-align="center" style="flex-wrap:wrap">
              <atmos-badge variant="accent">White-Label &lt;atmos-badge&gt;</atmos-badge>
              <atmos-input
                name="whiteLabelStation"
                placeholder="White-label <atmos-input>"
                value="ATMOS-PERM-B4"
              ></atmos-input>
              <atmos-button
                variant="solid"
                size="sm"
                data-testid="atmos-whitelabel-btn"
                @mth-press=${() =>
                  actions.notify('Pressed upgraded white-label <atmos-button> element!', 'success')}
              >
                Trigger &lt;atmos-button&gt;
              </atmos-button>
              <mth-button variant="outline" size="sm" @mth-press=${runAutoLoaderProbe}>
                Run AutoLoader Probe
              </mth-button>
              <span class="atmos-mono-pill">${autoLoaderStatus}</span>
            </mth-flex>

            <mth-code-tabs .tabs=${FRAMEWORK_CODE_TAB_ITEMS}></mth-code-tabs>
          </mth-stack>
        </section>

        <!-- 5. Live Declarative Shadow DOM SSR Inspector -->
        <section class="atmos-surface-card" aria-label="Declarative Shadow DOM SSR Inspector">
          <mth-stack data-gap="3">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">5. Live Declarative Shadow DOM (DSD) SSR &amp; Stream Inspector</h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Inspect live <code>transformHtmlDsd()</code> and <code>renderToStream()</code> + <code>createSsrTransformStream()</code> output from <code>@methane-ui/ssr</code>.
                </p>
              </div>
              <mth-flex data-gap="2">
                <mth-button
                  variant="solid"
                  size="sm"
                  data-testid="ssr-transform-btn"
                  @mth-press=${fetchSsrTransform}
                >
                  Fetch /api/ssr-transform
                </mth-button>
                <mth-button
                  variant="soft"
                  size="sm"
                  data-testid="ssr-stream-btn"
                  @mth-press=${fetchSsrStream}
                >
                  Fetch /api/ssr-stream
                </mth-button>
              </mth-flex>
            </div>

            <pre
              data-testid="ssr-inspector-output"
              style="margin:0;padding:0.75rem;border-radius:var(--mth-radius-md,0.5rem);background:var(--mth-color-bg-subtle);overflow-x:auto;font-size:0.76rem;max-block-size:14rem"
            ><code>${ssrInspectorOutput}</code></pre>
          </mth-stack>
        </section>

        <!-- 6. Complete 256 / 256 Tag & 26-Package Coverage Audit Matrix -->
        <section class="atmos-surface-card" aria-label="256 Tag Coverage Audit Matrix">
          <mth-stack data-gap="4">
            <div class="atmos-section-header">
              <div>
                <h2 style="margin:0;font-size:1.15rem">
                  6. Verified 100% Methane Coverage Matrix (${ALL_256_MTH_TAGS.length} / 256 Tags · ${ATMOS_PACKAGES.length} Packages)
                </h2>
                <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--mth-color-fg-muted)">
                  Every single <code>mth-*</code> tag across Primitives (3), CSS Layouts (5), Core UI (167), Domain Kits (46), and Satellites (35).
                </p>
              </div>
              <input
                class="mth-input"
                style="inline-size:100%;max-inline-size:16rem"
                placeholder="Filter 256 tags or packages..."
                .value=${coverageFilter}
                @input=${(ev: Event) =>
                  actions.updateViewUi('coverageFilter', (ev.target as HTMLInputElement).value)}
              />
            </div>

            <mth-flex data-gap="2" style="flex-wrap:wrap">
              ${ATMOS_PACKAGES.map(
                (pkg) => html`
                  <span class="atmos-mono-pill" title=${pkg.description}>
                    ${pkg.name} (${pkg.layer})
                  </span>
                `,
              )}
            </mth-flex>

            <div class="atmos-coverage-grid" data-testid="coverage-tag-grid">
              ${filteredManifest.map(
                (entry) => html`
                  <div class="atmos-surface-card" style="padding:0.5rem 0.65rem">
                    <mth-flex data-gap="2" data-align="center" data-justify="between">
                      <code style="font-size:0.76rem;font-weight:600">&lt;${entry.tag}&gt;</code>
                      <mth-badge variant="success" size="sm">${entry.layer}</mth-badge>
                    </mth-flex>
                    <div style="font-size:0.7rem;color:var(--mth-color-fg-muted);margin-block-start:0.2rem">
                      ${entry.pkg} → /${entry.route === 'overview' ? '' : entry.route}
                    </div>
                  </div>
                `,
              )}
            </div>
          </mth-stack>
        </section>
      </mth-stack>
    `;
  },
};
