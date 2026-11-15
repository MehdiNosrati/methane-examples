import { html, type TemplateResult } from 'lit';
import {
  SHELL_COMMAND_PALETTE_ITEMS,
  SHELL_SITE_SEARCH_ITEMS,
} from '../data/index.js';
import { SUPPORTED_ATMOS_LOCALES } from '../coverage-manifest.js';
import { resolveRouteFromPathname, ROUTE_TO_PATH } from '../state.js';
import type {
  AtmosActions,
  AtmosDensityMode,
  AtmosLocaleCode,
  AtmosRouteId,
  AtmosState,
  AtmosViewModule,
} from '../types.js';

const SIDEBAR_ITEMS = [
  { value: 'overview', label: 'Mission Overview', href: '/', group: 'Command Deck', badge: 'Live' },
  { value: 'spatial', label: 'Spatial Plume Twin', href: '/spatial', group: 'Command Deck', badge: '3D+Map' },
  { value: 'telemetry', label: 'Telemetry & Ledger', href: '/telemetry', group: 'Analytics', badge: '120' },
  { value: 'operations', label: 'Dispatch & Runbooks', href: '/operations', group: 'Operations', badge: 'P0' },
  { value: 'war-room', label: 'War-Room & AtmosAI', href: '/war-room', group: 'Operations', badge: 'RTC' },
  { value: 'commerce-auth', label: 'Sensors, Credits & IAM', href: '/commerce-auth', group: 'Enterprise' },
  { value: 'studio', label: 'Theme, RTL & 256 Audit', href: '/studio', group: 'Platform Studio', badge: '256' },
] as const;

const BOTTOM_NAV_ITEMS = [
  { value: 'overview', label: 'Overview', href: '/' },
  { value: 'spatial', label: 'Spatial', href: '/spatial', badge: '3D' },
  { value: 'telemetry', label: 'Telemetry', href: '/telemetry' },
  { value: 'war-room', label: 'AtmosAI', href: '/war-room' },
  { value: 'studio', label: 'Studio', href: '/studio', badge: '256' },
] as const;

const MENUBAR_ITEMS = [
  {
    value: 'constellation',
    label: 'Constellation',
    children: [
      { value: 'overview', label: 'Mission Overview', href: '/', shortcut: 'G O' },
      { value: 'spatial', label: 'Orbital & Basin Maps', href: '/spatial', shortcut: 'G S' },
      { value: 'telemetry', label: 'OGMP 2.0 Workbook', href: '/telemetry', shortcut: 'G T' },
    ],
  },
  {
    value: 'response',
    label: 'Response',
    children: [
      { value: 'operations', label: 'LDAR Dispatch & SOPs', href: '/operations', shortcut: 'G F' },
      { value: 'war-room', label: 'Incident War-Room', href: '/war-room', shortcut: 'G W' },
      { value: 'commerce-auth', label: 'Hardware & RBAC IAM', href: '/commerce-auth', shortcut: 'G C' },
    ],
  },
  {
    value: 'diagnostics',
    label: 'Diagnostics',
    children: [
      { value: 'studio', label: 'OKLCH, DTCG & 256 Coverage', href: '/studio', shortcut: 'G D' },
    ],
  },
] as const;

const MEGA_MENU_SECTIONS = [
  {
    id: 'sectors',
    label: 'Monitored Basins',
    columns: [
      {
        title: 'Americas Orbital Sector',
        links: [
          { label: 'Permian Midland B-4', href: '/spatial', description: '142.8 kg/hr plume · Valve XV-402 sealed' },
          { label: 'Appalachian Marcellus', href: '/telemetry', description: '286 TDLAS nodes · OGMP Level 5 Gold' },
          { label: 'Neuquén Vaca Muerta', href: '/operations', description: 'UAV-07 aerial thermal verification' },
        ],
      },
      {
        title: 'Governance & Clearinghouse',
        links: [
          { label: 'AtmosAI Sanitizer Firewall', href: '/war-room', description: 'Streaming Markdown + XSS defense' },
          { label: 'Carbon Credit Settlement', href: '/commerce-auth', description: 'ISO-14064 verified abatement blocks' },
          { label: 'Theme, RTL & DSD SSR Studio', href: '/studio', description: 'Live DTCG compiler & 256-tag audit' },
        ],
      },
    ],
  },
] as const;

const SPEED_DIAL_ACTIONS = [
  { label: 'Open Command Palette', value: 'palette' },
  { label: 'Launch Guided Tour', value: 'tour' },
  { label: 'Inspect 256/256 Coverage', value: 'studio' },
] as const;

export function renderAppShell(
  state: AtmosState,
  actions: AtmosActions,
  activeView: AtmosViewModule,
): TemplateResult {
  const activeLocaleMeta =
    SUPPORTED_ATMOS_LOCALES.find((item) => item.code === state.locale) ??
    SUPPORTED_ATMOS_LOCALES[0]!;

  const breadcrumbPathItems = [
    { label: 'AtmosOps Global', href: '/' },
    { label: activeLocaleMeta.basinControlCenter, href: ROUTE_TO_PATH[state.route] },
    { label: activeView.title, current: true },
  ];

  const onNavSelect = (ev: Event) => {
    const detail = (ev as CustomEvent<{ value?: string; href?: string }>).detail;
    if (detail?.href) {
      actions.navigate(resolveRouteFromPathname(detail.href));
    } else if (detail?.value) {
      actions.navigate(detail.value as AtmosRouteId);
    }
  };

  return html`
    <mth-skip-link href="#atmos-main">Skip to AtmosOps mission workspace</mth-skip-link>
    <mth-visually-hidden>
      AtmosOps Planetary Methane Telemetry Command Platform — ${activeView.title} (${state.locale}, ${state.dir})
    </mth-visually-hidden>

    <div class="mth-announcement-bar" role="region" aria-label="Orbital telemetry alert banner">
      <mth-flex data-gap="3" data-align="center" data-justify="between" style="inline-size:100%;flex-wrap:wrap">
        <span>
          <strong>ORBIT #14892 VERIFIED:</strong> Permian Station B-4 Valve XV-402 isolated in 42s · Residual CH₄ flux &lt; 0.3 kg/hr (-99.7%)
        </span>
        <mth-flex data-gap="2" data-align="center">
          <span class="atmos-mono-pill">DSD SSR: ${state.ssrStyles}</span>
          <span class="atmos-mono-pill">${state.locale.toUpperCase()} · ${state.dir.toUpperCase()}</span>
          <a class="mth-btn mth-btn-soft" href="/studio" @click=${(e: MouseEvent) => {
            e.preventDefault();
            actions.navigate('studio');
          }}>256/256 Studio →</a>
        </mth-flex>
      </mth-flex>
    </div>

    <div class="mth-app-shell">
      <header class="mth-app-shell-header">
        <mth-navbar label="AtmosOps Primary Command Bar" sticky>
          <a
            slot="brand"
            href="/"
            style="font-weight:800;font-size:1.05rem;text-decoration:none;color:var(--mth-color-fg)"
            @click=${(e: MouseEvent) => {
              e.preventDefault();
              actions.navigate('overview');
            }}
          >
            🛰️ AtmosOps <mth-badge variant="accent" pill>CH₄ v0.1.1</mth-badge>
          </a>

          <mth-flex data-gap="2" data-align="center" style="flex-wrap:wrap">
            <mth-menubar
              label="Mission Systems Menu"
              .items=${MENUBAR_ITEMS}
              @mth-select=${onNavSelect}
            ></mth-menubar>
            <mth-mega-menu
              label="Basin & Platform Directory"
              .sections=${MEGA_MENU_SECTIONS}
            ></mth-mega-menu>
            <mth-spacer></mth-spacer>
          </mth-flex>

          <mth-flex slot="actions" data-gap="2" data-align="center" style="flex-wrap:wrap">
            <mth-site-search
              label="Search stations, plumes, SOPs"
              placeholder="Search Pad B-4, OGMP, TDLAS... (/)"
              .items=${SHELL_SITE_SEARCH_ITEMS}
              @mth-select=${(ev: Event) => {
                const href = (ev as CustomEvent<{ item?: { href?: string } }>).detail?.item?.href;
                if (href) actions.navigate(resolveRouteFromPathname(href));
              }}
            ></mth-site-search>

            <select
              aria-label="Active locale and writing direction"
              class="mth-select"
              style="inline-size:auto;min-inline-size:8.5rem"
              .value=${state.locale}
              @change=${(ev: Event) => {
                const nextLocale = (ev.target as HTMLSelectElement).value as AtmosLocaleCode;
                const meta = SUPPORTED_ATMOS_LOCALES.find((l) => l.code === nextLocale);
                actions.updateState({ locale: nextLocale, dir: meta?.dir ?? 'ltr' });
                actions.notify(`Switched locale to ${nextLocale} (${meta?.dir.toUpperCase()})`, 'info');
              }}
            >
              ${SUPPORTED_ATMOS_LOCALES.map(
                (loc) => html`
                  <option value=${loc.code} ?selected=${state.locale === loc.code}>
                    ${loc.code} · ${loc.nativeLabel}
                  </option>
                `,
              )}
            </select>

            <select
              aria-label="Spacing density preset"
              class="mth-select"
              style="inline-size:auto"
              .value=${state.density}
              @change=${(ev: Event) => {
                const density = (ev.target as HTMLSelectElement).value as AtmosDensityMode;
                actions.updateState({ density });
              }}
            >
              <option value="compact" ?selected=${state.density === 'compact'}>Compact</option>
              <option value="default" ?selected=${state.density === 'default'}>Default</option>
              <option value="comfortable" ?selected=${state.density === 'comfortable'}>Comfortable</option>
            </select>

            <mth-button
              variant="outline"
              size="sm"
              @mth-press=${() =>
                actions.updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
            >
              ${state.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </mth-button>

            <mth-button
              variant="soft"
              size="sm"
              id="atmos-cmd-trigger"
              @mth-press=${() => actions.updateState({ commandPaletteOpen: true })}
            >
              ⌘K Palette
            </mth-button>

            <mth-clock timezone="UTC" format="24h" show-seconds></mth-clock>
            <mth-network-status></mth-network-status>
          </mth-flex>
        </mth-navbar>
      </header>

      <aside class="mth-app-shell-sidebar" aria-label="Mission workspaces">
        <mth-stack data-gap="4" style="padding-block:1rem;padding-inline:0.75rem">
          <mth-sidebar-nav
            label="AtmosOps Workspaces"
            active-value=${state.route}
            active-href=${ROUTE_TO_PATH[state.route]}
            collapsible
            .items=${SIDEBAR_ITEMS}
            @mth-select=${onNavSelect}
          ></mth-sidebar-nav>

          <hr class="mth-divider" />

          <div class="atmos-surface-card">
            <mth-stack data-gap="2">
              <strong style="font-size:0.8rem">Constellation Telemetry</strong>
              <p style="font-size:0.75rem;color:var(--mth-color-fg-muted);margin:0">
                ${activeLocaleMeta.basinControlCenter}
              </p>
              <mth-flex data-gap="2" style="flex-wrap:wrap">
                <mth-badge variant="success">1,178 Nodes</mth-badge>
                <mth-badge variant="info">256 Tags</mth-badge>
              </mth-flex>
            </mth-stack>
          </div>
        </mth-stack>
      </aside>

      <main id="atmos-main" class="mth-app-shell-main" tabindex="-1">
        <mth-container style="padding-block:1.25rem">
          <mth-stack data-gap="4">
            <mth-flex data-gap="3" data-align="center" data-justify="between" style="flex-wrap:wrap">
              <mth-breadcrumbs label="Workspace trail">
                <mth-breadcrumb-item href="/">AtmosOps</mth-breadcrumb-item>
                <mth-breadcrumb-item href=${ROUTE_TO_PATH[state.route]} current>
                  ${activeView.title}
                </mth-breadcrumb-item>
              </mth-breadcrumbs>

              <mth-breadcrumb-path
                label="Sector telemetry path"
                .items=${breadcrumbPathItems}
                max-items="3"
              ></mth-breadcrumb-path>
            </mth-flex>

            <div class="atmos-section-header">
              <div>
                <h1 style="margin:0;font-size:var(--mth-font-size-2xl,1.5rem)">${activeView.title}</h1>
                <p style="margin:0.25rem 0 0;color:var(--mth-color-fg-muted);font-size:0.9rem">
                  ${activeView.subtitle}
                </p>
              </div>
              <mth-flex data-gap="2" data-align="center">
                <mth-badge variant="accent">${activeView.ownedTags.length} Primary Tags</mth-badge>
                <mth-fab
                  label="Emit Telemetry Test Alert"
                  size="sm"
                  @mth-press=${() =>
                    actions.notify(
                      `Telemetry ping confirmed on ${activeView.title} (${new Date().toISOString().slice(11, 19)}Z)`,
                      'success',
                    )}
                >
                  + Ping
                </mth-fab>
                <mth-speed-dial
                  label="Quick Mission Actions"
                  direction="down"
                  size="sm"
                  .actions=${SPEED_DIAL_ACTIONS}
                  @mth-action=${(ev: Event) => {
                    const val = (ev as CustomEvent<{ value?: string }>).detail?.value;
                    if (val === 'palette') actions.updateState({ commandPaletteOpen: true });
                    else if (val === 'tour') {
                      actions.navigate('overview');
                      actions.updateState({ tourOpen: true });
                    } else if (val === 'studio') actions.navigate('studio');
                  }}
                ></mth-speed-dial>
              </mth-flex>
            </div>

            <mth-error-boundary fallback-message="Mission panel encountered a recoverable telemetry fault.">
              ${activeView.render(state, actions)}
            </mth-error-boundary>
          </mth-stack>
        </mth-container>
      </main>

      <aside class="mth-app-shell-aside" aria-label="Live telemetry alert feed">
        <mth-stack data-gap="3" style="padding-block:1rem;padding-inline:0.75rem">
          <mth-notification-center
            inline
            open
            heading="Runtime Alert Feed"
            max-items="6"
          ></mth-notification-center>

          <mth-cookie-banner
            heading="Telemetry & Audit Storage"
            description="AtmosOps stores theme, OKLCH seed, density, and locale preferences locally with zero third-party trackers."
          ></mth-cookie-banner>
        </mth-stack>
      </aside>

      <footer class="mth-app-shell-footer">
        <mth-container>
          <mth-flex data-gap="3" data-align="center" data-justify="between" style="flex-wrap:wrap;padding-block:0.5rem">
            <span style="font-size:0.8rem;color:var(--mth-color-fg-muted)">
              AtmosOps Planetary CH₄ Command · Powered by 100% Methane UI v0.1.1 (256/256 tags · DSD SSR)
            </span>
            <mth-bottom-nav
              label="Quick workspace jump"
              active-value=${state.route}
              active-href=${ROUTE_TO_PATH[state.route]}
              .items=${BOTTOM_NAV_ITEMS}
              @mth-select=${onNavSelect}
            ></mth-bottom-nav>
          </mth-flex>
        </mth-container>
      </footer>
    </div>

    <mth-command-palette
      label="AtmosOps Command Palette"
      placeholder="Jump to basin view, toggle theme, switch RTL..."
      ?open=${state.commandPaletteOpen}
      .commands=${SHELL_COMMAND_PALETTE_ITEMS}
      @mth-close=${() => actions.updateState({ commandPaletteOpen: false })}
      @mth-select=${(ev: Event) => {
        const item = (ev as CustomEvent<{ item?: { id?: string; href?: string } }>).detail?.item;
        actions.updateState({ commandPaletteOpen: false });
        if (item?.href) {
          actions.navigate(resolveRouteFromPathname(item.href));
        } else if (item?.id === 'act-dark') {
          actions.updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' });
        } else if (item?.id === 'act-rtl') {
          const next = state.locale === 'ar' ? 'en' : 'ar';
          actions.updateState({ locale: next, dir: next === 'ar' ? 'rtl' : 'ltr' });
        }
      }}
    ></mth-command-palette>

    <mth-toast placement="bottom-end"></mth-toast>
    <mth-back-to-top threshold="240"></mth-back-to-top>
  `;
}
