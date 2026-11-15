import { html } from 'lit';
import { withBasePath } from '../base-path.js';
import { getTagsForRoute } from '../coverage-manifest.js';
import {
  BRIEFING_COMPARISON_PLANS,
  BRIEFING_COMPARISON_ROWS,
} from '../data/index.js';
import { getRouteHref } from '../state.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

export const overviewBriefingView: AtmosViewModule = {
  id: 'overview',
  path: '/',
  title: 'Mission Overview & Open Climate Briefing',
  subtitle:
    'Planetary CH₄ constellation command deck + public OGMP 2.0 transparency briefing showcasing every @methane-ui/css layout, prose, form, and marketing layer.',
  badge: 'Live',
  ownedTags: getTagsForRoute('overview'),
  render(state: AtmosState, actions: AtmosActions) {
    const coachmarkOpen = Boolean(state.ui['overviewCoachmarkOpen']);

    return html`
      <mth-stack data-gap="6">
        <!-- Guided Tour & Coachmark Anchors -->
        <div class="atmos-kpi-strip" id="tour-kpi-deck">
          <div class="atmos-surface-card">
            <div class="atmos-mono-pill">SWIR CONSTELLATION</div>
            <h2 style="margin:0.4rem 0 0.15rem;font-size:1.5rem">6 Satellites · 525 km</h2>
            <p style="margin:0;font-size:0.82rem;color:var(--mth-color-fg-muted)">
              0.3 nm FWHM · 25m ground pixel · 100% uptime
            </p>
          </div>
          <div class="atmos-surface-card">
            <div class="atmos-mono-pill">ACTIVE DISPATCH</div>
            <h2 style="margin:0.4rem 0 0.15rem;font-size:1.5rem">Permian Pad B-4</h2>
            <p style="margin:0;font-size:0.82rem;color:var(--mth-color-fg-muted)">
              142.8 → 0.3 kg/hr CH₄ · Valve XV-402 sealed in 42s
            </p>
          </div>
          <div class="atmos-surface-card">
            <div class="atmos-mono-pill">ABATED THIS QUARTER</div>
            <h2 style="margin:0.4rem 0 0.15rem;font-size:1.5rem">48,920 tCO₂e</h2>
            <p style="margin:0;font-size:0.82rem;color:var(--mth-color-fg-muted)">
              EPA Subpart W &amp; OGMP 2.0 Level 5 Gold attested
            </p>
          </div>
          <div class="atmos-surface-card" id="tour-actions-card">
            <mth-stack data-gap="2">
              <strong style="font-size:0.88rem">Mission Walkthrough &amp; Share</strong>
              <mth-flex data-gap="2" style="flex-wrap:wrap">
                <button
                  type="button"
                  class="mth-btn"
                  @click=${() => actions.updateState({ tourOpen: !state.tourOpen })}
                >
                  ${state.tourOpen ? 'Close Guided Tour' : 'Start Guided Tour'}
                </button>
                <button
                  type="button"
                  class="mth-btn mth-btn-soft"
                  id="coachmark-anchor-btn"
                  @click=${() => actions.updateViewUi('overviewCoachmarkOpen', !coachmarkOpen)}
                >
                  Feature Tip
                </button>
                <mth-share-button
                  share-title="AtmosOps Planetary Methane Report"
                  text="Verified 99.7% CH4 plume abatement at Permian Station B-4"
                  url="https://mahdins.dev/methane/"
                  variant="outline"
                  size="sm"
                >
                  Share Bulletin
                </mth-share-button>
              </mth-flex>
            </mth-stack>
          </div>
        </div>

        <mth-tour
          label="AtmosOps Mission Orientation"
          ?open=${state.tourOpen}
          @mth-close=${() => actions.updateState({ tourOpen: false })}
        >
          <mth-tour-step
            step-id="step-kpi"
            target="#tour-kpi-deck"
            heading="1. Real-Time Orbital & Ground Fusion"
            placement="bottom"
            active
          >
            Inspect live SWIR satellite passes fused with 1,178 ground TDLAS laser chords.
          </mth-tour-step>
          <mth-tour-step
            step-id="step-bento"
            target="#overview-bento-hub"
            heading="2. Seven Specialized Command Surfaces"
            placement="top"
          >
            Jump directly into 3D/Map twins, ECharts/TanStack grids, SCADA DAGs, WebRTC + AI, or the 256-tag Studio.
          </mth-tour-step>
        </mth-tour>

        <mth-coachmark
          target="#coachmark-anchor-btn"
          heading="Zero-JS Pure CSS Controls"
          placement="bottom"
          ?open=${coachmarkOpen}
          @mth-close=${() => actions.updateViewUi('overviewCoachmarkOpen', false)}
        >
          Buttons above use lightweight <code>.mth-btn</code> classes alongside custom elements!
        </mth-coachmark>

        <!-- Pure CSS Marketing Hero + Orbital Pass Carousel -->
        <section class="mth-hero atmos-surface-card" aria-label="Open Climate Network Briefing">
          <div class="mth-hero-content">
            <span class="mth-hero-eyebrow">OGMP 2.0 PUBLIC TRANSPARENCY PORTAL</span>
            <h2 class="mth-hero-title">Detect, isolate, and certify fugitive methane in under 60 seconds.</h2>
            <p class="mth-hero-lead">
              AtmosOps links sun-synchronous SWIR imaging spectrometers, autonomous TDLAS perimeter chords,
              SCADA emergency shutoff valves, and cryptographic EPA Subpart W compliance ledgers.
            </p>
            <div class="mth-hero-actions">
              <button type="button" class="mth-btn" @click=${() => actions.navigate('spatial')}>
                Explore 3D &amp; Plume Maps
              </button>
              <button type="button" class="mth-btn mth-btn-outline" @click=${() => actions.navigate('telemetry')}>
                Open OGMP Telemetry Grid
              </button>
              <button type="button" class="mth-btn mth-btn-ghost" @click=${() => actions.navigate('war-room')}>
                Launch AtmosAI Copilot
              </button>
              <button
                type="button"
                class="mth-btn mth-btn-danger"
                @click=${() =>
                  actions.notify('Simulated P0 Super-Emitter drill broadcast to Houston & Midland!', 'warning')}
              >
                Run P0 Drill
              </button>
            </div>
          </div>

          <div class="mth-hero-media" style="margin-block-start:1rem">
            <mth-carousel label="Recent Orbital SWIR Retrievals" loop>
              <mth-carousel-item label="Orbit #14892 · Permian SWIR Retrieval">
                <div class="mth-aspect-ratio" data-ratio="16/9">
                  <img
                    src=${withBasePath('/media/plume-swir.svg')}
                    alt="SWIR 1650nm methane column retrieval over Permian Station B-4"
                  />
                </div>
              </mth-carousel-item>
              <mth-carousel-item label="Orbit #14892 · Optical Reference">
                <div class="mth-aspect-ratio" data-ratio="16/9">
                  <img
                    src=${withBasePath('/media/plume-optical.svg')}
                    alt="True-color RGB pass over Permian Station B-4"
                  />
                </div>
              </mth-carousel-item>
              <mth-carousel-item label="UAV-07 Thermal OGI Verification">
                <div class="mth-aspect-ratio" data-ratio="16/9">
                  <img
                    src=${withBasePath('/media/drone-pad-thermal.svg')}
                    alt="Mid-wave IR OGI frame of Valve Manifold XV-402"
                  />
                </div>
              </mth-carousel-item>
            </mth-carousel>
          </div>
        </section>

        <!-- Bento Grid + Subgrid Workspace Directory -->
        <section id="overview-bento-hub" class="mth-bento-grid" aria-label="Mission Subsystem Bento">
          <article class="mth-bento-item" data-span="2">
            <h3>Spatial Plume Twin &amp; 3D Hardware</h3>
            <p>
              MapLibre GL basin polygons, clusters, route planning, compressor floor plan, mission-control seat map,
              and Three.js <code>&lt;mth-model-viewer&gt;</code> orbital spectrometer twin.
            </p>
            <mth-grid class="mth-grid mth-grid-subgrid" style="--mth-grid-min:11rem;margin-block-start:0.75rem">
              <button type="button" class="mth-btn mth-btn-soft" @click=${() => actions.navigate('spatial')}>
                Open /spatial →
              </button>
              <button type="button" class="mth-btn mth-btn-soft" @click=${() => actions.navigate('operations')}>
                Open /operations →
              </button>
            </mth-grid>
          </article>

          <article class="mth-bento-item">
            <mth-stack data-gap="2">
              <h3>Cryptographic Chain-of-Custody</h3>
              <p style="font-size:0.82rem;color:var(--mth-color-fg-muted);margin:0">
                Scan QR or Code-128 asset tag for EPA Certificate <code>#OGMP-2026-0842</code>:
              </p>
              <mth-flex data-gap="3" data-align="center" style="flex-wrap:wrap">
                <mth-qr-code
                  value="https://mahdins.dev/methane/#cert-ogmp-2026-0842"
                  label="QR code for OGMP Certificate 0842"
                  size="96"
                ></mth-qr-code>
                <mth-barcode
                  value="OGMP-2026-0842"
                  label="Barcode for OGMP Certificate 0842"
                ></mth-barcode>
              </mth-flex>
            </mth-stack>
          </article>
        </section>

        <!-- Pure CSS Feature Grid + Logo Cloud -->
        <section class="mth-feature-grid" aria-label="Core Methane UI Architectural Pillars">
          <article class="mth-feature-card">
            <span class="mth-feature-icon" aria-hidden="true">🛰️</span>
            <h3>11 Heavy Satellites</h3>
            <p>Lazy browser-only ECharts, MapLibre, Three.js, pdf.js, Dagre, ProseMirror, KaTeX, CodeMirror 6, TanStack &amp; WebRTC.</p>
          </article>
          <article class="mth-feature-card">
            <span class="mth-feature-icon" aria-hidden="true">⚡</span>
            <h3>5 Enterprise Domain Kits</h3>
            <p>Production AI Copilot, Zero-Trust Auth/RBAC, Admin Operations, Real-Time War-Room Chat, and Carbon Commerce.</p>
          </article>
          <article class="mth-feature-card">
            <span class="mth-feature-icon" aria-hidden="true">🎨</span>
            <h3>Perceptual OKLCH + DSD SSR</h3>
            <p>Single-seed perceptual palettes, 8 BCP-47 locales with RTL, and streaming Declarative Shadow DOM hydration.</p>
          </article>
        </section>

        <div class="mth-logo-cloud atmos-surface-card" aria-label="Observing Partner Agencies">
          <span class="atmos-mono-pill">UNEP OGMP 2.0</span>
          <span class="atmos-mono-pill">EPA SUBPART W</span>
          <span class="atmos-mono-pill">COPERNICUS SENTINEL-5P</span>
          <span class="atmos-mono-pill">JAXA GOSAT-GW</span>
          <span class="atmos-mono-pill">ISO-14064 VERIFIED</span>
        </div>

        <!-- Sidebar Layout + Article Layout + Prose + Definition List + Sticky Quick Filter -->
        <div class="mth-sidebar-layout">
          <aside class="mth-sticky atmos-surface-card" style="inset-block-start:4.5rem;align-self:start">
            <div class="mth-container" style="padding-inline:0">
              <form
                @submit=${(ev: Event) => {
                  ev.preventDefault();
                  actions.notify('Applied native CSS quick-filter to Public Briefing!', 'info');
                }}
              >
                <div class="mth-stack" data-gap="3">
                  <div class="mth-flex" data-gap="2" data-align="center">
                    <strong>Native Zero-JS Form Controls</strong>
                    <span class="mth-spacer"></span>
                  </div>
                  <label style="font-size:0.8rem">
                    Basin Registry Filter
                    <input
                      class="mth-input"
                      name="basinQuery"
                      value="Permian Delaware"
                      placeholder="Filter basin..."
                    />
                  </label>
                  <label style="font-size:0.8rem">
                    Reporting Standard
                    <select class="mth-select" name="standard">
                      <option value="ogmp5">OGMP 2.0 Level 5</option>
                      <option value="epa-w">EPA 40 CFR Subpart W</option>
                    </select>
                  </label>
                  <button type="submit" class="mth-btn mth-btn-outline">Filter Registry</button>
                </div>
              </form>
            </div>
          </aside>

          <article class="mth-article-layout atmos-surface-card">
            <header class="mth-article-header">
              <h2>Methodology: Satellite + Ground Bayesian Plume Inversion</h2>
              <p style="color:var(--mth-color-fg-muted);margin:0">
                Published by AtmosOps Atmospheric Physics Group · Verified under ISO-14064-3
              </p>
            </header>
            <div class="mth-article-body mth-prose">
              <p>
                Short-wave infrared (<code>1650 nm</code>) solar backscatter spectroscopy resolves narrow methane
                rotational-vibrational absorption lines at <code>25 m</code> spatial resolution, enabling point-source
                attribution down to individual compressor bays and thief hatches.
              </p>
              <dl class="mth-dl">
                <dt>Integrated Mass Enhancement (IME)</dt>
                <dd>24.6 kg excess CH₄ integrated across the 1.57 km downwind plume mask.</dd>
                <dt>Isotopic Attribution (δ¹³C-CH₄)</dt>
                <dd>-41.8‰ thermogenic pipeline gas signature (rules out biogenic wetland flux).</dd>
                <dt>Closed-Loop SCADA Interlock</dt>
                <dd>Actuated isolation valve XV-402 in 42 seconds, verified by UAV-07 OGI sweep.</dd>
              </dl>
            </div>
            <aside class="mth-article-aside">
              <blockquote class="mth-testimonial">
                <p>
                  “Coupling orbital SWIR alerts directly to SCADA valve interlocks cut our basin fugitive emissions by 94% in one quarter.”
                </p>
                <footer class="mth-testimonial-author">— Chief Sustainability Officer, Permian Midstream Partners</footer>
              </blockquote>
            </aside>
          </article>
        </div>

        <!-- Comparison Table + Pure CSS Pricing Table -->
        <section class="atmos-surface-card">
          <mth-stack data-gap="4">
            <h2 style="margin:0">Detection Modality Comparison</h2>
            <mth-comparison-table
              .plans=${BRIEFING_COMPARISON_PLANS}
              .rows=${BRIEFING_COMPARISON_ROWS}
            ></mth-comparison-table>

            <div class="mth-pricing-table">
              <div class="mth-pricing-tier">
                <h3>Open Research Feed</h3>
                <div class="mth-pricing-price">$0 <small>/ basin</small></div>
                <ul class="mth-pricing-features">
                  <li>Public super-emitter alerts (&gt;100 kg/hr)</li>
                  <li>CC-BY-4.0 GeoJSON &amp; CSV exports</li>
                </ul>
                <div class="mth-pricing-cta">
                  <button type="button" class="mth-btn mth-btn-outline" @click=${() => actions.navigate('telemetry')}>
                    Browse Open Ledger
                  </button>
                </div>
              </div>

              <div class="mth-pricing-tier mth-pricing-featured">
                <h3>Enterprise Basin Command</h3>
                <div class="mth-pricing-price">$4,900 <small>/ mo</small></div>
                <ul class="mth-pricing-features">
                  <li>Daily AtmosSat-4 tasking + 500 TDLAS nodes</li>
                  <li>Automated SCADA shutoff &amp; EPA PDF minting</li>
                </ul>
                <div class="mth-pricing-cta">
                  <button type="button" class="mth-btn" @click=${() => actions.navigate('commerce-auth')}>
                    Provision Sensors &amp; Plan
                  </button>
                </div>
              </div>
            </div>
          </mth-stack>
        </section>

        <!-- FAQ Accordion + Newsletter + CTA + Marketing Footer -->
        <section class="mth-faq atmos-surface-card" aria-label="Regulatory Frequently Asked Questions">
          <h2 style="margin-block-start:0">Regulatory &amp; Telemetry FAQ</h2>
          <mth-accordion collapsible value="faq-1">
            <mth-accordion-item value="faq-1" heading="How does AtmosOps satisfy OGMP 2.0 Level 5 reconciliation?">
              AtmosOps fuses bottom-up component inventories (<code>mth-spreadsheet</code>) with top-down orbital SWIR and aircraft measurements in real time.
            </mth-accordion-item>
            <mth-accordion-item value="faq-2" heading="Can AtmosOps run in air-gapped or strict-CSP SCADA networks?">
              Yes — every component renders via Declarative Shadow DOM without unsafe inline scripts, sanitizes untrusted HTML via <code>@methane-ui/sanitize</code>, and supports offline vector basemaps.
            </mth-accordion-item>
          </mth-accordion>
        </section>

        <section class="mth-cta atmos-surface-card">
          <div>
            <h2 style="margin:0 0 0.35rem">Subscribe to Weekly Orbital Plume Bulletins</h2>
            <p style="margin:0;color:var(--mth-color-fg-muted)">
              Receive basin-level XCH₄ anomalies and EPA Subpart W regulatory digests.
            </p>
          </div>
          <div class="mth-cta-actions" style="min-inline-size:18rem">
            <mth-newsletter-form
              name="bulletinEmail"
              @mth-submit=${() => actions.notify('Subscribed to AtmosOps Weekly Orbital Bulletin!', 'success')}
            ></mth-newsletter-form>
          </div>
        </section>

        <footer class="mth-footer atmos-surface-card">
          <div class="mth-footer-grid">
            <div class="mth-footer-brand">
              <strong>AtmosOps Open Climate Initiative</strong>
              <p style="font-size:0.82rem;color:var(--mth-color-fg-muted)">
                Built with 100% Methane UI Web Components, OKLCH Tokens, and Streaming DSD SSR.
              </p>
            </div>
            <div class="mth-footer-links">
              <strong>Command Views</strong>
              <a href=${getRouteHref('spatial')}>Spatial Plume Twin</a>
              <a href=${getRouteHref('telemetry')}>Telemetry &amp; Grids</a>
              <a href=${getRouteHref('operations')}>Field Dispatch &amp; SOPs</a>
            </div>
            <div class="mth-footer-links">
              <strong>Enterprise &amp; Studio</strong>
              <a href=${getRouteHref('war-room')}>War-Room &amp; AtmosAI</a>
              <a href=${getRouteHref('commerce-auth')}>Hardware &amp; Zero-Trust IAM</a>
              <a href=${getRouteHref('studio')}>Theme, RTL &amp; 256-Tag Audit</a>
            </div>
          </div>
          <div class="mth-footer-bottom">
            <span>© 2026 AtmosOps Planetary Telemetry · MIT Reference Architecture</span>
          </div>
        </footer>
      </mth-stack>
    `;
  },
};
