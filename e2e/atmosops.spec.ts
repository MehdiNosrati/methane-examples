import { expect, test, type Page } from '@playwright/test';
import {
  ALL_251_CUSTOM_ELEMENT_TAGS,
  ALL_5_CSS_LAYOUT_TAGS,
} from '../src/coverage-manifest.js';

interface StrictBrowserGuards {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
  readonly failedRequests: string[];
  readonly externalRequests: string[];
  assertClean: (contextLabel: string) => void;
}

function attachStrictGuards(page: Page): StrictBrowserGuards {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const externalRequests: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.stack ?? err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    const failureText = req.failure()?.errorText ?? 'unknown-failure';
    failedRequests.push(`${req.method()} ${req.url()} (${failureText})`);
  });

  page.on('request', (req) => {
    const rawUrl = req.url();
    if (!/^https?:\/\//i.test(rawUrl)) {
      return;
    }
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
        externalRequests.push(`${req.method()} ${rawUrl}`);
      }
    } catch {
      externalRequests.push(`${req.method()} ${rawUrl}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    failedRequests,
    externalRequests,
    assertClean(contextLabel: string) {
      expect(pageErrors, `[${contextLabel}] Expected 0 uncaught pageerror events`).toEqual([]);
      expect(consoleErrors, `[${contextLabel}] Expected 0 console.error logs`).toEqual([]);
      expect(failedRequests, `[${contextLabel}] Expected 0 failed HTTP requests`).toEqual([]);
      expect(
        externalRequests,
        `[${contextLabel}] Expected 0 external non-localhost/127.0.0.1 HTTP requests`,
      ).toEqual([]);
    },
  };
}

async function pressMthButton(page: Page, selector: string): Promise<void> {
  const host = page.locator(selector).first();
  await expect(host).toBeVisible();
  const innerBtn = host.locator('button').first();
  if ((await innerBtn.count()) > 0) {
    await innerBtn.click();
  } else {
    await host.click();
  }
}

test.describe('AtmosOps Real-Browser Chromium DSD SSR & Hydration E2E', () => {
  test('renders populated Declarative Shadow DOM across routes with JavaScript completely disabled', async ({
    browser,
    baseURL,
  }) => {
    const noJsContext = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
    });
    const page = await noJsContext.newPage();
    const guards = attachStrictGuards(page);

    try {
      const routeProbes: ReadonlyArray<{
        readonly path: string;
        readonly expectedText: string;
        readonly hostSelector: string;
      }> = [
        {
          path: '/',
          expectedText: 'Detect, isolate, and certify fugitive methane in under 60 seconds.',
          hostSelector: 'mth-navbar',
        },
        {
          path: '/spatial',
          expectedText: 'Permian Basin Spatial Digital Twin',
          hostSelector: 'mth-floor-plan',
        },
        {
          path: '/telemetry',
          expectedText: 'Peak Plume Flux (Midland B-4)',
          hostSelector: 'mth-stat-card',
        },
        {
          path: '/operations',
          expectedText: 'LDAR Leak-Repair Dispatch',
          hostSelector: 'mth-kanban',
        },
        {
          path: '/war-room',
          expectedText: 'AtmosAI Plume Inversion',
          hostSelector: 'mth-chat-thread',
        },
        {
          path: '/commerce-auth',
          expectedText: 'Hardware Procurement, Carbon Retirement',
          hostSelector: 'mth-invoice',
        },
        {
          path: '/studio',
          expectedText: 'Perceptual OKLCH Seed, Mode & Density Studio',
          hostSelector: 'mth-segmented-control',
        },
      ];

      for (const probe of routeProbes) {
        const res = await page.goto(probe.path, { waitUntil: 'domcontentloaded' });
        expect(res?.status(), `No-JS GET ${probe.path} status`).toBe(200);
        await expect(page.locator('#atmos-main')).toContainText(probe.expectedText);

        // Verify Chromium parsed <template shadowrootmode="open"> into real native shadowRoots without JS!
        const dsdStats = await page.evaluate((selector) => {
          const allElements = Array.from(document.querySelectorAll('*'));
          const totalShadowRoots = allElements.filter((el) => el.shadowRoot !== null).length;
          const target = document.querySelector(selector);
          const targetShadowText = target?.shadowRoot?.textContent?.trim() ?? '';
          const targetHasShadowChildren = (target?.shadowRoot?.childElementCount ?? 0) > 0;
          return {
            totalShadowRoots,
            targetFound: Boolean(target),
            targetHasShadowRoot: Boolean(target?.shadowRoot),
            targetHasShadowChildren,
            targetShadowTextLength: targetShadowText.length,
          };
        }, probe.hostSelector);

        expect(dsdStats.totalShadowRoots, `No-JS DSD shadow root count on ${probe.path}`).toBeGreaterThan(20);
        expect(dsdStats.targetFound, `Host ${probe.hostSelector} present on ${probe.path}`).toBe(true);
        expect(dsdStats.targetHasShadowRoot, `Host ${probe.hostSelector} has native DSD shadowRoot`).toBe(true);
        expect(dsdStats.targetHasShadowChildren, `Host ${probe.hostSelector} has populated DSD shadow DOM`).toBe(true);
      }

      guards.assertClean('no-js-dsd-ssr');
    } finally {
      await noJsContext.close();
    }
  });

  test('hydrates all 7 routes cleanly and executes real user workflows across every vertical', async ({
    page,
  }) => {
    const guards = attachStrictGuards(page);

    // 1. Overview & Public Briefing (/)
    const homeRes = await page.goto('/', { waitUntil: 'networkidle' });
    expect(homeRes?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Mission Overview & Open Climate Briefing');

    // Toggle Guided Tour on `/`
    const tourBtn = page.getByRole('button', { name: 'Start Guided Tour' });
    await tourBtn.click();
    await expect(page.locator('mth-tour')).toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Close Guided Tour' }).click();
    await expect(page.locator('mth-tour')).not.toHaveAttribute('open', '');

    // Navigate from `/` to `/spatial` via hero CTA button (client SPA router)
    await page.getByRole('button', { name: 'Explore 3D & Plume Maps' }).click();
    await expect(page).toHaveURL(/\/spatial$/);
    await expect(page.locator('h1')).toContainText('Spatial Plume Twin & Facility Command');

    // 2. Spatial Plume Twin (/spatial)
    await expect(page.locator('mth-map')).toBeVisible();
    await expect(page.locator('mth-model-viewer')).toBeVisible();
    await expect(page.locator('mth-before-after')).toBeVisible();
    await expect(page.getByText('Unit: KM')).toBeVisible();
    await page.getByText('Unit: KM').click();
    await expect(page.getByText('Unit: MI')).toBeVisible();

    // 3. Telemetry Analytics, Grids & OGMP Ledger (/telemetry)
    await page.goto('/telemetry', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Telemetry Analytics, Grids & OGMP Ledger');
    await expect(page.locator('mth-datagrid')).toBeVisible();
    await expect(page.locator('mth-spreadsheet')).toBeVisible();

    // Filter virtualized sensor datagrid rows
    const filterInput = page.locator('input[aria-label="Filter telemetry sensor rows"]');
    await filterInput.fill('Permian');
    await expect(page.locator('#telemetry-datagrid-workspace')).toContainText('matching nodes');
    await filterInput.fill('');

    // Interact with OGMP 2.0 Spreadsheet & Formula Bar
    await page.getByText('Address Mode: A1').click();
    await expect(page.getByText('Address Mode: R1C1')).toBeVisible();
    await page.getByText('Address Mode: R1C1').click();
    await expect(page.locator('mth-formula-bar')).toHaveAttribute('cell-address', 'B7');
    await page.getByText(/Inspect D2/).click();
    await expect(page.locator('mth-formula-bar')).toHaveAttribute('cell-address', 'D2');

    // 4. Field Dispatch, Workflows & Incident Runbooks (/operations)
    await page.goto('/operations', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Field Dispatch, Workflows & Incident Runbooks');
    await expect(page.locator('mth-kanban')).toBeVisible();
    await expect(page.locator('mth-pdf-viewer')).toBeVisible();

    const beforeSealedText = await page.getByText(/Leaks Verified Sealed/).first().textContent();
    await page.getByText('Advance Next LDAR Ticket').click();
    // Advancing multiple times moves a ticket all the way to 'sealed' or updates lane placement
    await page.getByText('Advance Next LDAR Ticket').click();
    await page.getByText('Advance Next LDAR Ticket').click();
    const afterSealedText = await page.getByText(/Leaks Verified Sealed/).first().textContent();
    expect(afterSealedText).not.toBe(beforeSealedText);

    // Toggle SCADA DAG layout direction
    await page.getByText('Layout: LR').click();
    await expect(page.getByText('Layout: TB')).toBeVisible();

    // 5. Incident War-Room, WebRTC & AtmosAI Copilot (/war-room)
    await page.goto('/war-room', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Incident War-Room, WebRTC & AtmosAI Copilot');

    // Switch evidence tabs (`mth-tabs`)
    await page.locator('mth-tab[value="checklist"]').click();
    await expect(page.locator('mth-tab-panel[value="checklist"]')).toBeVisible();

    // Execute @methane-ui/sanitize Red-Team XSS & URL Firewall audit
    await pressMthButton(page, '[data-testid="run-sanitizer-firewall"]');
    await expect(page.getByTestId('sanitizer-audit-output')).toContainText(
      'dangerous executable nodes = 0',
    );
    const unsafeSurvivors = await page.evaluate(() => {
      const box = document.getElementById('atmos-sanitize-html-box');
      if (!box) return -1;
      return box.querySelectorAll('script, iframe, [onerror], [onload]').length;
    });
    expect(unsafeSurvivors).toBe(0);

    // Open & confirm Subpart W closure <mth-dialog>
    await pressMthButton(page, '[data-testid="open-incident-dialog-btn"]');
    await expect(page.locator('mth-dialog')).toHaveAttribute('open', '');
    await page.evaluate(() => {
      const dlg = document.querySelector('mth-dialog');
      dlg?.dispatchEvent(new CustomEvent('mth-confirm', { bubbles: true, composed: true }));
    });
    await expect(page.locator('mth-dialog')).not.toHaveAttribute('open', '');
    await expect(page.getByText('Subpart W Countersigned').first()).toBeVisible();

    // 6. Sensor & Carbon Clearinghouse + Zero-Trust IAM (/commerce-auth)
    await page.goto('/commerce-auth', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Sensor & Carbon Clearinghouse + Zero-Trust IAM');
    await expect(page.getByText('Luhn Check: VALID')).toBeVisible();
    await expect(page.getByText('IBAN Mod-97: VALID')).toBeVisible();

    // Modify FACE <mth-input> inside native <form> and submit new FormData(form)
    await page.evaluate(() => {
      const facInput = document.querySelector(
        '#atmos-procurement-form mth-input[name="facility_name"]',
      ) as (HTMLElement & { value: string }) | null;
      if (facInput) {
        facInput.value = 'Delaware Sector Pad C-9 North';
      }
    });
    await page.getByRole('button', { name: 'Capture Native FormData Snapshot' }).click();
    await expect(page.locator('mth-callout[title="Live Serialized new FormData(form) Output"]')).toContainText(
      'Delaware Sector Pad C-9 North',
    );

    // 7. Theme, DTCG, Locale/RTL, Prefix & Coverage Studio (/studio)
    await page.goto('/studio', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(
      'Theme, OKLCH DTCG, Locale/RTL, Prefix & 256-Tag Studio',
    );

    // Switch locale to Arabic (`ar`) -> assert html[lang="ar"] and html[dir="rtl"]
    await pressMthButton(page, '[data-testid="locale-btn-ar"]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('active-locale-pill')).toContainText('dir="rtl"');

    // Switch theme (dark -> light -> dark) and density -> compact via header controls
    const densitySelect = page.locator('select[aria-label="Spacing density preset"]');
    await densitySelect.selectOption('compact');
    await expect(page.locator('html')).toHaveAttribute('data-mth-density', 'compact');

    await page.getByText('☀️ Light').click();
    await expect(page.locator('html')).toHaveAttribute('data-mth-theme', 'light');
    await page.getByText('🌙 Dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-mth-theme', 'dark');

    // Compile W3C DTCG JSON -> live <style id="atmos-dtcg-live">
    await pressMthButton(page, '[data-testid="compile-dtcg-btn"]');
    await expect(page.getByTestId('dtcg-status')).toContainText('Compiled');
    const injectedDtcgCss = await page.evaluate(
      () => document.getElementById('atmos-dtcg-live')?.textContent ?? '',
    );
    expect(injectedDtcgCss).toContain('--mth-');

    // Interact with white-label <atmos-button>, <atmos-badge>, <atmos-input>
    await pressMthButton(page, '[data-testid="atmos-whitelabel-btn"]');
    const whiteLabelDefined = await page.evaluate(() => ({
      button: customElements.get('atmos-button') !== undefined,
      badge: customElements.get('atmos-badge') !== undefined,
      input: customElements.get('atmos-input') !== undefined,
    }));
    expect(whiteLabelDefined).toEqual({ button: true, badge: true, input: true });

    // Live DSD SSR transform & stream endpoints
    await pressMthButton(page, '[data-testid="ssr-transform-btn"]');
    await expect(page.getByTestId('ssr-inspector-output')).toContainText('shadowrootmode="open"');
    await pressMthButton(page, '[data-testid="ssr-stream-btn"]');
    await expect(page.getByTestId('ssr-inspector-output')).toContainText('WinterCG Streaming DSD Active');

    guards.assertClean('interactive-7-route-hydration');
  });

  test('passes 256 / 256 Browser Definition Gate in Chromium (251 Custom Elements + 5 CSS Layout Tags)', async ({
    page,
  }) => {
    const guards = attachStrictGuards(page);

    await page.goto('/studio', { waitUntil: 'networkidle' });

    const gateReport = await page.evaluate(
      ({ customElementTags, cssLayoutTags }) => {
        const undefinedElements = customElementTags.filter(
          (tag) => customElements.get(tag) === undefined,
        );

        const probeHost = document.createElement('div');
        probeHost.style.position = 'absolute';
        probeHost.style.inlineSize = '320px';
        probeHost.style.visibility = 'hidden';
        document.body.appendChild(probeHost);

        const layoutComputed: Record<string, { display: string; opacity: string }> = {};
        for (const tag of cssLayoutTags) {
          const el = document.createElement(tag);
          probeHost.appendChild(el);
          const cs = window.getComputedStyle(el);
          layoutComputed[tag] = {
            display: cs.display,
            opacity: cs.opacity,
          };
        }

        probeHost.remove();

        return {
          totalCustomElementsChecked: customElementTags.length,
          undefinedElements,
          layoutComputed,
        };
      },
      {
        customElementTags: [...ALL_251_CUSTOM_ELEMENT_TAGS],
        cssLayoutTags: [...ALL_5_CSS_LAYOUT_TAGS],
      },
    );

    expect(gateReport.totalCustomElementsChecked).toBe(251);
    expect(gateReport.undefinedElements).toEqual([]);
    expect(gateReport.layoutComputed).toEqual({
      'mth-stack': { display: 'flex', opacity: '1' },
      'mth-grid': { display: 'grid', opacity: '1' },
      'mth-flex': { display: 'flex', opacity: '1' },
      'mth-container': { display: 'block', opacity: '1' },
      'mth-spacer': { display: 'block', opacity: '1' },
    });

    guards.assertClean('256-browser-definition-gate');
  });
});
