import { validateIbanMod97, validateLuhn } from '@methane-ui/primitives';
import { html } from 'lit';
import { withBasePath } from '../base-path.js';
import { getTagsForSlice } from '../coverage-manifest.js';
import {
  ACTIVE_OPERATOR_SESSIONS,
  AUTH_SSO_PROVIDERS,
  COMMERCE_CHECKOUT_STEPS,
  COMMERCE_FACET_GROUPS,
  HARDWARE_AND_CARBON_PRODUCTS,
  HARDWARE_REVIEW_BREAKDOWN,
  INITIAL_CART_ITEMS,
  OPERATOR_PROFILE_MENU_ITEMS,
  RBAC_INITIAL_GRANTS,
  RBAC_PERMISSIONS,
  RBAC_ROLES,
  SAMPLE_SETTLEMENT_INVOICE,
  TELEMETRY_BILLING_PLANS,
} from '../data/commerce-auth-data.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

interface MutableCartItem {
  readonly id: string;
  readonly title: string;
  readonly variant?: string;
  readonly price: number;
  readonly quantity: number;
  readonly min?: number;
  readonly max?: number;
  readonly image?: string;
}

interface SessionItem {
  readonly id: string;
  readonly device: string;
  readonly browser?: string;
  readonly location?: string;
  readonly ip?: string;
  readonly lastActive?: string;
  readonly current?: boolean;
}

interface SelectOptionItem {
  readonly value: string;
  readonly label: string;
  readonly group?: string;
}

const UPLINK_CARRIER_OPTIONS: ReadonlyArray<SelectOptionItem> = [
  { value: 'starlink-maritime', label: 'Starlink Aviation / Field High-Throughput', group: 'LEO SatCom' },
  { value: 'iridium-certus', label: 'Iridium Certus L-Band Safety Backup', group: 'LEO SatCom' },
  { value: 'private-lorawan', label: 'AtmosMesh 915 MHz Class I Div 1 LoRaWAN', group: 'Terrestrial' },
  { value: 'private-lte', label: 'CBRS Band 48 Private 5G Industrial', group: 'Terrestrial' },
];

const COMPLIANCE_FRAMEWORK_OPTIONS: ReadonlyArray<SelectOptionItem> = [
  { value: 'epa-subpart-w', label: 'US EPA GHGRP Subpart W (2026)' },
  { value: 'ogmp-2', label: 'UNEP OGMP 2.0 Gold Standard Level 5' },
  { value: 'eu-methane-reg', label: 'EU Methane Regulation (2024/1787)' },
  { value: 'iso-14064', label: 'ISO 14064-1 Greenhouse Gas Verification' },
];

const INITIAL_COST_CENTER_OPTIONS: ReadonlyArray<SelectOptionItem> = [
  { value: 'CC-LDAR-2026', label: 'CC-LDAR-2026 · Permian Leak Remediation' },
  { value: 'CC-SAT-OPS', label: 'CC-SAT-OPS · Orbital Tasking & Telemetry' },
  { value: 'CC-ESG-RETIRE', label: 'CC-ESG-RETIRE · Scope 1 Carbon Abatement' },
];

const DEFAULT_FORM_SNAPSHOT: Readonly<Record<string, string>> = {
  facility_name: 'Permian Compressor Station B-4',
  epa_facility_id: 'EPA-8842-TX',
  basin_jurisdiction: 'us-permian',
  primary_carrier: 'starlink-maritime',
  compliance_frameworks: 'epa-subpart-w,ogmp-2',
  cost_center_tag: 'CC-LDAR-2026',
  sensor_node_count: '12',
  abatement_budget_usd: '48500.00',
  shipping_priority: 'air-hazmat',
  auto_retire_credits: 'enabled',
  hardware_spares_pool: 'hot-standby',
  vendor_sla_score: '5',
  hsm_attestation_slot: 'ATMOS-ATTEST-OK-8842',
};

function readUi<T>(state: AtmosState, key: string, fallback: T): T {
  const val = state.ui[key];
  return (val !== undefined ? val : fallback) as T;
}

function serializeFormElement(form: HTMLFormElement): Record<string, string> {
  const fd = new FormData(form);
  const snapshot: Record<string, string> = {};
  for (const [key, raw] of fd.entries()) {
    const str = typeof raw === 'string' ? raw : raw.name;
    // Mask sensitive fields in visual inspector while proving FormData participation
    const displayValue =
      key === 'scada_api_secret'
        ? `•••••••• (${str.length} chars)`
        : key === 'procurement_card'
          ? `•••• ${str.replace(/\D+/g, '').slice(-4)}`
          : str;
    snapshot[key] = snapshot[key] ? `${snapshot[key]}, ${displayValue}` : displayValue;
  }
  return snapshot;
}

export const commerceAuthView: AtmosViewModule = {
  id: 'commerce-auth',
  path: '/commerce-auth',
  title: 'Sensor & Carbon Clearinghouse + Zero-Trust IAM',
  subtitle:
    'Procure Class I Div 1 TDLAS spectrometers, retire ISO-14064 methane abatement credits, manage multi-agency Passkey/MFA/RBAC policies, and inspect native ElementInternals FormData serialization.',
  badge: '39 Owned Tags · Commerce + Auth + FACE',
  ownedTags: getTagsForSlice('view-commerce-auth'),

  render(state: AtmosState, actions: AtmosActions) {
    // ── Storefront, Cart, Plans & Checkout interactive slice state ──
    const cartItems = readUi<ReadonlyArray<MutableCartItem>>(
      state,
      'ca.cart',
      INITIAL_CART_ITEMS,
    );
    const bulkQty = readUi<number>(state, 'ca.bulkQty', 4);
    const selectedFacets = readUi<Record<string, ReadonlyArray<string>>>(
      state,
      'ca.facets',
      { category: ['sensors', 'aerial', 'credits'] },
    );
    const facetRanges = readUi<Record<string, { min?: number; max?: number }>>(
      state,
      'ca.facetRanges',
      {},
    );
    const activeReviewStar = readUi<number | null>(state, 'ca.reviewStar', null);
    const activeCheckoutStep = readUi<string>(state, 'ca.checkoutStep', 'settlement');
    const selectedPlanId = readUi<string>(state, 'ca.planId', 'basin-enterprise');
    const billingCycle = readUi<'monthly' | 'annual'>(state, 'ca.billingCycle', 'annual');

    // ── Zero-Trust IAM & RBAC interactive slice state ──
    const authMode = readUi<'signin' | 'signup' | 'reset' | 'magic-link'>(
      state,
      'ca.authMode',
      'signin',
    );
    const loadingSso = readUi<string>(state, 'ca.loadingSso', '');
    const passkeyStatus = readUi<'idle' | 'pending' | 'success' | 'error' | 'unsupported'>(
      state,
      'ca.passkeyStatus',
      'idle',
    );
    const mfaMode = readUi<'totp' | 'backup'>(state, 'ca.mfaMode', 'totp');
    const mfaCode = readUi<string>(state, 'ca.mfaCode', '482910');
    const sessions = readUi<ReadonlyArray<SessionItem>>(
      state,
      'ca.sessions',
      ACTIVE_OPERATOR_SESSIONS,
    );
    const rbacGrants = readUi<Record<string, ReadonlyArray<string>>>(
      state,
      'ca.rbacGrants',
      RBAC_INITIAL_GRANTS,
    );

    // ── FACE FormData & Mask Validation workbench state ──
    const cardNumber = readUi<string>(state, 'ca.cardNumber', '4532 0151 1283 0366');
    const ibanValue = readUi<string>(state, 'ca.ibanValue', 'DE89 3704 0044 0532 0130 00');
    const costCenterOptions = readUi<ReadonlyArray<SelectOptionItem>>(
      state,
      'ca.costCenterOptions',
      INITIAL_COST_CENTER_OPTIONS,
    );
    const costCenterValue = readUi<string>(state, 'ca.costCenterValue', 'CC-LDAR-2026');
    const attestationToken = readUi<string>(
      state,
      'ca.attestationToken',
      'ATMOS-ATTEST-OK-8842',
    );
    const formSnapshot = readUi<Readonly<Record<string, string>>>(
      state,
      'ca.formSnapshot',
      DEFAULT_FORM_SNAPSHOT,
    );

    const cardDigits = cardNumber.replace(/\D+/g, '');
    const isCardLuhnValid = validateLuhn(cardDigits);
    const isIbanValid = validateIbanMod97(ibanValue);

    const activeCategories = selectedFacets['category'] ?? [];
    const priceRange = facetRanges['price'];
    const filteredProducts = HARDWARE_AND_CARBON_PRODUCTS.filter((product) => {
      const catMatch =
        activeCategories.length === 0 || activeCategories.includes(product.category);
      const minMatch = priceRange?.min === undefined || product.price >= priceRange.min;
      const maxMatch = priceRange?.max === undefined || product.price <= priceRange.max;
      return catMatch && minMatch && maxMatch;
    });
    const visibleProducts =
      filteredProducts.length > 0 ? filteredProducts : HARDWARE_AND_CARBON_PRODUCTS;

    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const netSettlementTotal = Math.max(
      0,
      Math.round((cartSubtotal - 500) * 1.0825 + 120),
    );
    const bulkQuoteAmount = bulkQty * 4850;
    const bulkCompareAmount = bulkQty * 5400;

    return html`
      <mth-stack data-gap="6">
        <!-- Executive Context Banner with Authenticated Operator Profile Menu -->
        <mth-card>
          <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="4">
            <mth-stack data-gap="1">
              <mth-flex data-align="center" data-gap="2" data-wrap="wrap">
                <mth-badge variant="success">ISO-14064 &amp; OGMP 2.0 Clearinghouse</mth-badge>
                <mth-badge variant="info">WebAuthn Passkey + FIPS 140-3 MFA</mth-badge>
                <mth-badge variant="neutral">ElementInternals FACE Workbench</mth-badge>
              </mth-flex>
              <h2>Hardware Procurement, Carbon Retirement &amp; Zero-Trust Access</h2>
              <p>
                Order certified open-path laser sensors, retire verified CH4 abatement blocks,
                govern operator RBAC grants, and inspect native HTML form participation.
              </p>
            </mth-stack>

            <mth-profile-menu
              name="Dr. Elena Vance"
              email="e.vance@atmosops.io"
              avatar-src=${withBasePath('/media/orbital-spectrometer-poster.svg')}
              user-role="Incident Commander · Clearance L4"
              .items=${OPERATOR_PROFILE_MENU_ITEMS}
              @mth-select=${(e: CustomEvent<{ id: string; label: string }>) => {
                actions.notify(`Operator profile action: ${e.detail.label}`, 'info');
              }}
            ></mth-profile-menu>
          </mth-flex>
        </mth-card>

        <!-- SECTION 1: Storefront Catalog, Facet Filters, Bulk Quote & Verified Reviews -->
        <section aria-labelledby="ca-storefront-heading">
          <mth-stack data-gap="4">
            <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="3">
              <div>
                <h3 id="ca-storefront-heading">
                  1. Sensor Hardware &amp; Verified CH4 Abatement Catalog (<code>@methane-ui/commerce</code>)
                </h3>
                <p>
                  Filter certified field instrumentation and carbon-credit blocks with live bulk
                  pricing and verified operator review histograms.
                </p>
              </div>
              <mth-flex data-align="center" data-gap="3" data-wrap="wrap">
                <mth-quantity-selector
                  name="bulk_sensor_qty"
                  label="Bulk TDLAS Lot Qty"
                  .value=${bulkQty}
                  min="1"
                  max="50"
                  step="1"
                  @mth-change=${(e: CustomEvent<{ value: number }>) => {
                    actions.updateViewUi('ca.bulkQty', e.detail.value);
                    actions.announce(`Bulk TDLAS sensor quantity set to ${e.detail.value}`);
                  }}
                ></mth-quantity-selector>
                <mth-price-display
                  .amount=${bulkQuoteAmount}
                  .compareAtAmount=${bulkCompareAmount}
                  currency="USD"
                  locale=${state.locale}
                  period="lot"
                  show-discount-badge
                ></mth-price-display>
              </mth-flex>
            </mth-flex>

            <div class="mth-sidebar-layout">
              <mth-stack data-gap="4">
                <mth-card>
                  <mth-facet-filters
                    label="Equipment &amp; Credit Filters"
                    collapsible
                    .facets=${COMMERCE_FACET_GROUPS}
                    .selected=${selectedFacets}
                    .ranges=${facetRanges}
                    @mth-filter-change=${(
                      e: CustomEvent<{
                        selected: Record<string, ReadonlyArray<string>>;
                        ranges: Record<string, { min?: number; max?: number }>;
                      }>,
                    ) => {
                      actions.updateViewUi('ca.facets', e.detail.selected);
                      actions.updateViewUi('ca.facetRanges', e.detail.ranges);
                    }}
                    @mth-filter-clear=${() => {
                      actions.updateViewUi('ca.facets', {});
                      actions.updateViewUi('ca.facetRanges', {});
                      actions.notify('Cleared catalog facet filters', 'info');
                    }}
                  ></mth-facet-filters>
                </mth-card>

                <mth-card>
                  <mth-review-summary
                    label="Field Operator Reliability Ratings"
                    .average=${4.9}
                    .totalReviews=${254}
                    .breakdown=${{ ...HARDWARE_REVIEW_BREAKDOWN }}
                    .activeStar=${activeReviewStar}
                    @mth-rating-filter=${(e: CustomEvent<{ star: number | null }>) => {
                      actions.updateViewUi('ca.reviewStar', e.detail.star);
                      actions.notify(
                        e.detail.star
                          ? `Filtered operator reviews to ${e.detail.star}★`
                          : 'Cleared star rating filter',
                        'info',
                      );
                    }}
                  ></mth-review-summary>
                </mth-card>
              </mth-stack>

              <mth-grid data-cols="auto" data-gap="4">
                ${visibleProducts.map(
                  (product) => html`
                    <mth-product-card
                      title=${product.title}
                      subtitle=${product.subtitle}
                      image-src=${product.imageSrc}
                      image-alt=${product.imageAlt}
                      .price=${product.price}
                      .compareAtPrice=${product.compareAtPrice}
                      currency="USD"
                      locale=${state.locale}
                      badge=${product.badge}
                      .rating=${product.rating}
                      .reviewCount=${product.reviewCount}
                      ?in-stock=${product.inStock}
                      action-label="Add to Requisition"
                      @mth-add-to-cart=${() => {
                        const existing = cartItems.find((item) => item.id === product.id);
                        const nextCart: ReadonlyArray<MutableCartItem> = existing
                          ? cartItems.map((item) =>
                              item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item,
                            )
                          : [
                              ...cartItems,
                              {
                                id: product.id,
                                title: product.title,
                                variant: product.badge,
                                price: product.price,
                                quantity: 1,
                                min: 1,
                                max: 50,
                                image: product.imageSrc,
                              },
                            ];
                        actions.updateViewUi('ca.cart', nextCart);
                        actions.notify(`Added "${product.title}" to requisition cart`, 'success');
                      }}
                    ></mth-product-card>
                  `,
                )}
              </mth-grid>
            </div>
          </mth-stack>
        </section>

        <!-- SECTION 2: SaaS Telemetry Plans, Shopping Cart, Multi-Step Checkout & Invoice -->
        <section aria-labelledby="ca-checkout-heading">
          <mth-stack data-gap="4">
            <h3 id="ca-checkout-heading">
              2. Constellation Subscriptions, Treasury Checkout &amp; Settlement Invoice
            </h3>

            <mth-card>
              <mth-plan-picker
                name="atmos_subscription_tier"
                label="AtmosOps Constellation &amp; Basin Telemetry Tier"
                currency="USD"
                locale=${state.locale}
                value=${selectedPlanId}
                billing-cycle=${billingCycle}
                .plans=${TELEMETRY_BILLING_PLANS}
                @mth-change=${(
                  e: CustomEvent<{ planId: string; billingCycle: 'monthly' | 'annual' }>,
                ) => {
                  actions.updateViewUi('ca.planId', e.detail.planId);
                  actions.updateViewUi('ca.billingCycle', e.detail.billingCycle);
                  actions.notify(
                    `Selected ${e.detail.planId} (${e.detail.billingCycle} billing)`,
                    'success',
                  );
                }}
                @mth-cycle-change=${(
                  e: CustomEvent<{ billingCycle: 'monthly' | 'annual' }>,
                ) => {
                  actions.updateViewUi('ca.billingCycle', e.detail.billingCycle);
                }}
              ></mth-plan-picker>
            </mth-card>

            <mth-card>
              <mth-checkout-steps
                label="Procurement &amp; EPA Registry Settlement Flow"
                orientation="horizontal"
                active-step=${activeCheckoutStep}
                .steps=${COMMERCE_CHECKOUT_STEPS}
                @mth-step-change=${(e: CustomEvent<{ stepId: string }>) => {
                  actions.updateViewUi('ca.checkoutStep', e.detail.stepId);
                }}
              ></mth-checkout-steps>
            </mth-card>

            <mth-grid data-cols="2" data-gap="4">
              <mth-card>
                <mth-cart
                  currency="USD"
                  locale=${state.locale}
                  .taxRate=${8.25}
                  .shippingAmount=${120}
                  .discountAmount=${500}
                  allow-remove
                  checkout-label="Proceed to Treasury Settlement"
                  .items=${cartItems}
                  @mth-quantity-change=${(e: CustomEvent<{ id: string; quantity: number }>) => {
                    const next = cartItems.map((item) =>
                      item.id === e.detail.id ? { ...item, quantity: e.detail.quantity } : item,
                    );
                    actions.updateViewUi('ca.cart', next);
                  }}
                  @mth-remove-item=${(e: CustomEvent<{ id: string }>) => {
                    const next = cartItems.filter((item) => item.id !== e.detail.id);
                    actions.updateViewUi(
                      'ca.cart',
                      next.length > 0 ? next : INITIAL_CART_ITEMS,
                    );
                    actions.notify(
                      next.length > 0
                        ? 'Removed line item from requisition'
                        : 'Restored default requisition bundle',
                      'info',
                    );
                  }}
                  @mth-checkout=${(e: CustomEvent<{ total: number }>) => {
                    actions.updateViewUi('ca.checkoutStep', 'settlement');
                    actions.notify(
                      `Requisition staged for settlement ($${e.detail.total.toLocaleString()})`,
                      'success',
                    );
                  }}
                ></mth-cart>
              </mth-card>

              <mth-card>
                <mth-stack data-gap="3">
                  <h4>Corporate Treasury Card Authorization</h4>
                  <mth-payment-form
                    name="treasury_payment"
                    .amount=${netSettlementTotal}
                    currency="USD"
                    locale=${state.locale}
                    submit-label="Authorize Settlement &amp; Issue Serial"
                    @mth-submit=${(
                      e: CustomEvent<{ cardholderName: string; last4: string; valid: boolean }>,
                    ) => {
                      actions.notify(
                        e.detail.valid
                          ? `Authorized card •••• ${e.detail.last4} for ${e.detail.cardholderName || 'Operator'}`
                          : 'Please complete cardholder, Luhn card number, expiry, and CVC',
                        e.detail.valid ? 'success' : 'warning',
                      );
                    }}
                  ></mth-payment-form>
                </mth-stack>
              </mth-card>
            </mth-grid>

            <mth-card>
              <mth-invoice
                invoice-number=${SAMPLE_SETTLEMENT_INVOICE.invoiceNumber}
                issue-date=${SAMPLE_SETTLEMENT_INVOICE.issueDate}
                due-date=${SAMPLE_SETTLEMENT_INVOICE.dueDate}
                status=${SAMPLE_SETTLEMENT_INVOICE.status}
                currency=${SAMPLE_SETTLEMENT_INVOICE.currency}
                locale=${state.locale}
                logo-url=${withBasePath('/media/orbital-spectrometer-poster.svg')}
                .seller=${SAMPLE_SETTLEMENT_INVOICE.seller}
                .buyer=${SAMPLE_SETTLEMENT_INVOICE.buyer}
                .items=${SAMPLE_SETTLEMENT_INVOICE.items}
                .taxRate=${SAMPLE_SETTLEMENT_INVOICE.taxRate}
                .discountAmount=${SAMPLE_SETTLEMENT_INVOICE.discountAmount}
                notes=${SAMPLE_SETTLEMENT_INVOICE.notes}
              ></mth-invoice>
            </mth-card>
          </mth-stack>
        </section>

        <!-- SECTION 3: Zero-Trust Operator IAM, Passkeys, MFA, Sessions & RBAC Matrix -->
        <section aria-labelledby="ca-iam-heading">
          <mth-stack data-gap="4">
            <h3 id="ca-iam-heading">
              3. Zero-Trust SCADA &amp; Regulator Identity Suite (<code>@methane-ui/auth</code>)
            </h3>

            <mth-grid data-cols="2" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <h4>Operator Sign-In &amp; Federated SSO</h4>
                    <mth-flex data-gap="2">
                      ${(['signin', 'signup', 'magic-link', 'reset'] as const).map(
                        (mode) => html`
                          <mth-button
                            size="sm"
                            variant=${authMode === mode ? 'solid' : 'ghost'}
                            @mth-press=${() => actions.updateViewUi('ca.authMode', mode)}
                          >
                            ${mode}
                          </mth-button>
                        `,
                      )}
                    </mth-flex>
                  </mth-flex>

                  <mth-sso-buttons
                    label="FedRAMP &amp; Regulator Identity Providers"
                    orientation="vertical"
                    loading-provider=${loadingSso}
                    .providers=${AUTH_SSO_PROVIDERS}
                    @mth-sso-select=${(e: CustomEvent<{ provider: string; label: string }>) => {
                      actions.updateViewUi('ca.loadingSso', e.detail.provider);
                      actions.notify(`Initiated OIDC handshake: ${e.detail.label}`, 'info');
                      setTimeout(() => actions.updateViewUi('ca.loadingSso', ''), 700);
                    }}
                  ></mth-sso-buttons>

                  <mth-auth-form
                    name="operator_auth"
                    mode=${authMode}
                    email="e.vance@atmosops.io"
                    full-name="Dr. Elena Vance"
                    submit-label="Authenticate Operator Session"
                    @mth-submit=${(e: CustomEvent<{ mode: string; email: string }>) => {
                      actions.notify(
                        `Verified ${e.detail.mode} challenge for ${e.detail.email}`,
                        'success',
                      );
                    }}
                  ></mth-auth-form>
                </mth-stack>
              </mth-card>

              <mth-card>
                <mth-stack data-gap="4">
                  <h4>FIDO2 Hardware Passkey &amp; FIPS TOTP Step-Up</h4>

                  <mth-passkey-prompt
                    mode="signin"
                    status=${passkeyStatus}
                    username="e.vance@atmosops.io"
                    allow-fallback
                    @mth-passkey-auth=${() => {
                      actions.updateViewUi('ca.passkeyStatus', 'success');
                      actions.notify('Hardware YubiKey WebAuthn assertion verified', 'success');
                    }}
                    @mth-fallback=${() => {
                      actions.updateViewUi('ca.passkeyStatus', 'idle');
                      actions.notify('Switched to TOTP authenticator code step-up', 'info');
                    }}
                  ></mth-passkey-prompt>

                  <mth-mfa-challenge
                    name="scada_stepup_totp"
                    mode=${mfaMode}
                    .length=${6}
                    value=${mfaCode}
                    allow-resend
                    @mth-change=${(e: CustomEvent<{ value: string }>) => {
                      actions.updateViewUi('ca.mfaCode', e.detail.value);
                    }}
                    @mth-mode-change=${(e: CustomEvent<{ mode: string }>) => {
                      actions.updateViewUi(
                        'ca.mfaMode',
                        e.detail.mode === 'backup' ? 'backup' : 'totp',
                      );
                    }}
                    @mth-submit=${(e: CustomEvent<{ value: string; mode: string }>) => {
                      actions.notify(
                        `Step-up MFA (${e.detail.mode}) verified: ${e.detail.value}`,
                        'success',
                      );
                    }}
                    @mth-resend=${() => {
                      actions.notify('Dispatched backup challenge to secondary device', 'info');
                    }}
                  ></mth-mfa-challenge>
                </mth-stack>
              </mth-card>
            </mth-grid>

            <mth-grid data-cols="2" data-gap="4">
              <mth-card>
                <mth-session-list
                  heading="Active Command Console &amp; Field Sessions"
                  .sessions=${sessions}
                  @mth-revoke=${(e: CustomEvent<{ id: string }>) => {
                    const remaining = sessions.filter((s) => s.id !== e.detail.id);
                    actions.updateViewUi('ca.sessions', remaining);
                    actions.notify(`Revoked session ${e.detail.id}`, 'warning');
                  }}
                  @mth-revoke-others=${(e: CustomEvent<{ count: number }>) => {
                    const currentOnly = sessions.filter((s) => s.current);
                    actions.updateViewUi('ca.sessions', currentOnly);
                    actions.notify(`Revoked ${e.detail.count} remote field sessions`, 'warning');
                  }}
                ></mth-session-list>
              </mth-card>

              <mth-card>
                <mth-stack data-gap="3">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <h4>Safety-Critical RBAC Permission Matrix</h4>
                    <mth-badge variant="info">2D Arrow-Key Grid</mth-badge>
                  </mth-flex>
                  <mth-role-matrix
                    label="AtmosOps Multi-Agency Role Permissions Matrix"
                    .roles=${RBAC_ROLES}
                    .permissions=${RBAC_PERMISSIONS}
                    .grants=${rbacGrants}
                    @mth-change=${(
                      e: CustomEvent<{
                        roleId: string;
                        permissionId: string;
                        granted: boolean;
                        grants: Record<string, ReadonlyArray<string>>;
                      }>,
                    ) => {
                      actions.updateViewUi('ca.rbacGrants', e.detail.grants);
                      actions.notify(
                        `${e.detail.granted ? 'Granted' : 'Revoked'} ${e.detail.permissionId} for ${e.detail.roleId}`,
                        e.detail.granted ? 'success' : 'warning',
                      );
                    }}
                  ></mth-role-matrix>
                </mth-stack>
              </mth-card>
            </mth-grid>
          </mth-stack>
        </section>

        <!-- SECTION 4: Native <form> FormData & ElementInternals FACE Workbench (22 Core UI Controls) -->
        <section aria-labelledby="ca-face-heading">
          <mth-card>
            <mth-stack data-gap="4">
              <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="3">
                <div>
                  <h3 id="ca-face-heading">
                    4. Native <code>&lt;form&gt;</code> &amp; <code>ElementInternals</code> FACE Requisition Workbench
                  </h3>
                  <p>
                    Every control below is a Form-Associated Custom Element participating natively in
                    <code>new FormData(form)</code>, constraint validation, and <code>form.reset()</code>,
                    paired with <code>validateLuhn</code> and <code>validateIbanMod97</code> from
                    <code>@methane-ui/primitives</code>.
                  </p>
                </div>
                <mth-flex data-gap="2" data-wrap="wrap">
                  <mth-badge variant=${isCardLuhnValid ? 'success' : 'danger'}>
                    Luhn Check: ${isCardLuhnValid ? 'VALID' : 'INVALID'}
                  </mth-badge>
                  <mth-badge variant=${isIbanValid ? 'success' : 'danger'}>
                    IBAN Mod-97: ${isIbanValid ? 'VALID' : 'INVALID'}
                  </mth-badge>
                </mth-flex>
              </mth-flex>

              <form
                id="atmos-procurement-form"
                @submit=${(e: SubmitEvent) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const snapshot = serializeFormElement(form);
                  actions.updateViewUi('ca.formSnapshot', snapshot);
                  actions.notify(
                    `Captured ${Object.keys(snapshot).length} FACE fields via native new FormData(form)`,
                    'success',
                  );
                }}
                @reset=${(e: Event) => {
                  const form = e.currentTarget as HTMLFormElement;
                  setTimeout(() => {
                    actions.updateViewUi('ca.cardNumber', '4532 0151 1283 0366');
                    actions.updateViewUi('ca.ibanValue', 'DE89 3704 0044 0532 0130 00');
                    actions.updateViewUi('ca.attestationToken', 'ATMOS-ATTEST-OK-8842');
                    actions.updateViewUi('ca.formSnapshot', serializeFormElement(form));
                    actions.notify('Reset all FACE controls via native form.reset()', 'info');
                  }, 0);
                }}
              >
                <mth-stack data-gap="4">
                  <mth-grid data-cols="3" data-gap="4">
                    <mth-input
                      name="facility_name"
                      value="Permian Compressor Station B-4"
                      label="EPA Regulated Facility Name"
                      placeholder="Station or Pad Identifier"
                      required
                    ></mth-input>

                    <mth-masked-input
                      name="epa_facility_id"
                      value="EPA-8842-TX"
                      mask="AAA-0000-AA"
                      label="EPA Subpart W Facility ID"
                      hint="Pattern mask: AAA-0000-AA"
                      required
                    ></mth-masked-input>

                    <mth-phone-input
                      name="oncall_dispatch_phone"
                      value="7135550194"
                      country="US"
                      dial-code="+1"
                      label="24/7 Duty Officer Phone"
                    ></mth-phone-input>

                    <mth-password-input
                      name="scada_api_secret"
                      value="Atmos!9942-HSM-Key"
                      label="SCADA Telemetry Signing Secret"
                      toggleable
                      show-strength
                    ></mth-password-input>

                    <mth-otp-input
                      name="treasury_approval_pin"
                      value="482910"
                      .length=${6}
                      label="Dual-Control Treasury PIN"
                    ></mth-otp-input>

                    <mth-number-input
                      name="sensor_node_count"
                      value="12"
                      .min=${1}
                      .max=${500}
                      .step=${1}
                      label="TDLAS Sensor Node Count"
                    ></mth-number-input>

                    <mth-credit-card-input
                      name="procurement_card"
                      value=${cardNumber}
                      label="Corporate Procurement Card (Luhn)"
                      hint=${isCardLuhnValid ? 'Luhn checksum verified' : 'Invalid Luhn check digit'}
                      @mth-input=${(e: Event) => {
                        const target = e.currentTarget as HTMLElement & { value?: string };
                        actions.updateViewUi('ca.cardNumber', target.value ?? '');
                      }}
                    ></mth-credit-card-input>

                    <mth-iban-input
                      name="settlement_iban"
                      value=${ibanValue}
                      label="Clearinghouse IBAN (ISO 13616 Mod-97)"
                      hint=${isIbanValid ? 'Mod-97 checksum verified' : 'Invalid IBAN Mod-97'}
                      @mth-input=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ca.ibanValue', e.detail.value);
                      }}
                    ></mth-iban-input>

                    <mth-currency-input
                      name="abatement_budget_usd"
                      value="48500.00"
                      currency="USD"
                      locale=${state.locale}
                      .decimals=${2}
                      label="Authorized Abatement Cap (USD)"
                    ></mth-currency-input>

                    <mth-select
                      name="basin_jurisdiction"
                      value="us-permian"
                      label="Regulatory Basin Jurisdiction"
                      clearable
                    >
                      <mth-option-group label="North America Basins">
                        <mth-option value="us-permian" selected>Permian Basin (TX / NM)</mth-option>
                        <mth-option value="us-dj">DJ / Denver-Julesburg (CO)</mth-option>
                        <mth-option value="ca-montney">Montney Formation (BC / AB)</mth-option>
                      </mth-option-group>
                      <mth-option-group label="International OGMP 2.0 Basins">
                        <mth-option value="no-ncs">Norwegian Continental Shelf</mth-option>
                        <mth-option value="ar-vaca-muerta">Vaca Muerta (Neuquén)</mth-option>
                      </mth-option-group>
                    </mth-select>

                    <mth-combobox
                      name="primary_carrier"
                      value="starlink-maritime"
                      label="Backhaul Uplink Carrier"
                      filterable
                      clearable
                      .options=${UPLINK_CARRIER_OPTIONS}
                    ></mth-combobox>

                    <mth-multi-select
                      name="compliance_frameworks"
                      value="epa-subpart-w,ogmp-2"
                      label="Compliance Reporting Frameworks"
                      placeholder="Select frameworks..."
                      .options=${COMPLIANCE_FRAMEWORK_OPTIONS}
                    ></mth-multi-select>

                    <mth-creatable-select
                      name="cost_center_tag"
                      value=${costCenterValue}
                      label="Treasury Cost-Center Tag (Creatable)"
                      allow-create
                      .options=${costCenterOptions}
                      @mth-create=${(e: CustomEvent<{ value: string; label: string }>) => {
                        const next = [
                          ...costCenterOptions,
                          { value: e.detail.value, label: `${e.detail.label} · Custom` },
                        ];
                        actions.updateViewUi('ca.costCenterOptions', next);
                        actions.updateViewUi('ca.costCenterValue', e.detail.value);
                        actions.notify(`Created custom cost center "${e.detail.label}"`, 'success');
                      }}
                    ></mth-creatable-select>

                    <mth-radio-group
                      name="shipping_priority"
                      value="air-hazmat"
                      orientation="horizontal"
                      label="Calibration Gas &amp; Sensor Freight Tier"
                    >
                      <mth-radio value="ground" label="DOT Ground"></mth-radio>
                      <mth-radio value="air-hazmat" label="Priority Air" checked></mth-radio>
                      <mth-radio value="charter" label="Direct Pad Helo"></mth-radio>
                    </mth-radio-group>

                    <mth-rating
                      name="vendor_sla_score"
                      value="5"
                      .max=${5}
                      clearable
                      label="Supplier Field Readiness Rating"
                    ></mth-rating>
                  </mth-grid>

                  <mth-textarea
                    name="deployment_notes"
                    value="Mount solar LoRaWAN gateways on downwind flare perimeter towers 1–4 with intrinsically safe conduit."
                    .rows=${2}
                    auto-resize
                    label="Site Engineering &amp; HazLoc Deployment Instructions"
                  ></mth-textarea>

                  <mth-grid data-cols="3" data-gap="4">
                    <mth-checkbox
                      name="auto_retire_credits"
                      value="enabled"
                      checked
                      label="Auto-retire verified CH4 credits upon quarterly EPA Subpart W audit"
                    ></mth-checkbox>

                    <mth-switch
                      name="hardware_spares_pool"
                      value="hot-standby"
                      checked
                      label="Include 10% Class I Div 1 hot-standby optical spares"
                    ></mth-switch>

                    <mth-captcha-slot
                      name="hsm_attestation_slot"
                      provider="atmos-hsm-local"
                      value=${attestationToken}
                      label="Local HSM Attestation Slot (FACE Bridge)"
                      hint="Pure local Methane UI FACE slot element — zero external challenge"
                      @mth-change=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ca.attestationToken', e.detail.value);
                      }}
                    >
                      <mth-flex data-align="center" data-justify="between" data-gap="2">
                        <span>Hardware Security Module Seal: <code>#HSM-8842</code></span>
                        <mth-button
                          size="sm"
                          variant="soft"
                          @mth-press=${() => {
                            const next = `ATMOS-ATTEST-OK-${Math.floor(1000 + Math.random() * 9000)}`;
                            actions.updateViewUi('ca.attestationToken', next);
                          }}
                        >
                          Rotate Local Seal
                        </mth-button>
                      </mth-flex>
                    </mth-captcha-slot>
                  </mth-grid>

                  <mth-flex data-gap="3" data-wrap="wrap" data-align="center">
                    <button type="submit" class="mth-btn">
                      Capture Native FormData Snapshot
                    </button>
                    <button type="reset" class="mth-btn mth-btn-outline">
                      Reset Form (form.reset())
                    </button>
                  </mth-flex>
                </mth-stack>
              </form>

              <mth-callout variant="info" title="Live Serialized new FormData(form) Output">
                <div class="mth-prose">
                  <dl class="mth-dl">
                    ${Object.entries(formSnapshot).map(
                      ([key, value]) => html`
                        <div>
                          <dt><code>${key}</code></dt>
                          <dd>${value}</dd>
                        </div>
                      `,
                    )}
                  </dl>
                </div>
              </mth-callout>
            </mth-stack>
          </mth-card>
        </section>
      </mth-stack>
    `;
  },
};
