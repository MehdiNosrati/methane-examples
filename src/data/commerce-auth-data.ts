import { withBasePath } from '../base-path.js';

export const HARDWARE_AND_CARBON_PRODUCTS = [
  {
    id: 'prod-tdlas-pro',
    title: 'AtmosSense TDLAS-400 Open-Path Spectrometer',
    subtitle: '0.05 ppm CH4 sensitivity · Solar + LoRaWAN / SatCom Class I Div 1',
    imageSrc: withBasePath('/media/orbital-spectrometer-poster.svg'),
    imageAlt: 'AtmosSense TDLAS-400 open-path laser methane spectrometer',
    price: 4850,
    compareAtPrice: 5400,
    badge: 'OGMP Gold Ready',
    rating: 4.9,
    reviewCount: 84,
    inStock: true,
    category: 'sensors',
  },
  {
    id: 'prod-ogi-pod',
    title: 'UAV-OGI Mid-Wave IR Gimbal Payload',
    subtitle: 'Cooled InSb 3.2–3.4 μm core · Real-time IME flux overlay',
    imageSrc: withBasePath('/media/drone-pad-thermal.svg'),
    imageAlt: 'UAV-OGI Mid-Wave IR methane camera payload',
    price: 12900,
    compareAtPrice: 14200,
    badge: 'Field Favorite',
    rating: 4.8,
    reviewCount: 41,
    inStock: true,
    category: 'aerial',
  },
  {
    id: 'prod-carbon-100t',
    title: 'Verified CH4 Abatement Block (100 tCO2e)',
    subtitle: 'ISO-14064 & EPA Subpart W audited · Permian Pad B-4 retirement serial',
    imageSrc: withBasePath('/media/plume-swir.svg'),
    imageAlt: 'Verified methane abatement carbon credit certificate',
    price: 2900,
    compareAtPrice: 3250,
    badge: 'Instant Retirement',
    rating: 5.0,
    reviewCount: 129,
    inStock: true,
    category: 'credits',
  },
] as const;

export const COMMERCE_FACET_GROUPS = [
  {
    id: 'category',
    label: 'Catalog Segment',
    type: 'checkbox' as const,
    options: [
      { value: 'sensors', label: 'Fixed TDLAS Sensors', count: 14 },
      { value: 'aerial', label: 'UAV & Airborne Payloads', count: 6 },
      { value: 'credits', label: 'Verified Carbon Credits', count: 28 },
    ],
  },
  {
    id: 'enclosure',
    label: 'Enclosure Finish',
    type: 'swatch' as const,
    options: [
      { value: 'solar-white', label: 'Solar White', color: '#f8fafc' },
      { value: 'desert-tan', label: 'Permian Sand', color: '#d6c3a5' },
      { value: 'marine-teal', label: 'Offshore Teal', color: '#14b8a6' },
    ],
  },
  {
    id: 'price',
    label: 'Unit Price (USD)',
    type: 'range' as const,
    min: 500,
    max: 15000,
    step: 250,
  },
] as const;

export const INITIAL_CART_ITEMS = [
  {
    id: 'prod-tdlas-pro',
    title: 'AtmosSense TDLAS-400 Open-Path Spectrometer',
    variant: 'Class I Div 1 · Solar White',
    price: 4850,
    quantity: 2,
    min: 1,
    max: 20,
    image: withBasePath('/media/orbital-spectrometer-poster.svg'),
  },
  {
    id: 'prod-carbon-100t',
    title: 'Verified CH4 Abatement Block (100 tCO2e)',
    variant: 'Permian Vintage 2026 · Serial #OGMP-842',
    price: 2900,
    quantity: 1,
    min: 1,
    max: 50,
    image: withBasePath('/media/plume-swir.svg'),
  },
] as const;

export const COMMERCE_CHECKOUT_STEPS = [
  { id: 'requisition', label: '1. Hardware & Credits', description: 'Verify station SKU & retirement registry', completed: true },
  { id: 'compliance', label: '2. EPA Facility ID', description: 'Bind Subpart W operator attestation', completed: true },
  { id: 'settlement', label: '3. Treasury Settlement', description: 'Corporate card or SEPA/IBAN wire', completed: false },
] as const;

export const TELEMETRY_BILLING_PLANS = [
  {
    id: 'constellation-starter',
    name: 'Basin Watch',
    description: 'Weekly satellite revisit + up to 25 ground TDLAS nodes',
    monthlyPrice: 1490,
    annualPrice: 14900,
    features: ['Weekly SWIR revisit', '25 TDLAS sensor streams', 'CSV Subpart W export'],
  },
  {
    id: 'basin-enterprise',
    name: 'AtmosOps Command',
    description: 'Daily orbital tasking, SCADA auto-shutoff & AI plume analyst',
    monthlyPrice: 4900,
    annualPrice: 49000,
    badge: 'Most Popular',
    features: ['Daily AtmosSat-4 tasking', '500 TDLAS + UAV streams', 'Automated SCADA valve interlock', '24/7 War-Room WebRTC'],
  },
  {
    id: 'sovereign-regulator',
    name: 'Sovereign / Regulator',
    description: 'National basin coverage, dedicated HSM audit ledger & custom SLA',
    monthlyPrice: 11800,
    annualPrice: 118000,
    features: ['Unlimited basin polygons', 'Cryptographic OGMP 2.0 ledger', 'Multi-agency RBAC & Passkey SSO'],
  },
] as const;

export const SAMPLE_SETTLEMENT_INVOICE = {
  invoiceNumber: 'INV-ATMOS-2026-0419',
  issueDate: '2026-03-14',
  dueDate: '2026-04-13',
  status: 'paid' as const,
  currency: 'USD',
  seller: {
    name: 'AtmosOps Planetary Telemetry, Inc.',
    lines: ['1200 Bagby St, Suite 2400', 'Houston, TX 77002 · United States'],
    email: 'billing@atmosops.io',
  },
  buyer: {
    name: 'Permian Midstream Energy Partners LP',
    lines: ['400 W Illinois Ave', 'Midland, TX 79701 · EPA ID #EPA-8842-TX'],
    email: 'ap@permian-midstream.example',
  },
  items: [
    { description: 'AtmosSense TDLAS-400 Open-Path Spectrometer (×2)', quantity: 2, unitPrice: 4850 },
    { description: 'Verified CH4 Abatement Block — 100 tCO2e (#OGMP-842)', quantity: 1, unitPrice: 2900 },
    { description: 'AtmosOps Command Subscription (March 2026)', quantity: 1, unitPrice: 4900 },
  ],
  taxRate: 8.25,
  discountAmount: 500,
  notes: 'Settled via corporate wire. Carbon abatement serial retired on OGMP 2.0 public registry.',
} as const;

export const HARDWARE_REVIEW_BREAKDOWN: Readonly<Record<number, number>> = {
  5: 198,
  4: 44,
  3: 9,
  2: 2,
  1: 1,
};

export const AUTH_SSO_PROVIDERS = [
  { id: 'okta-fedramp', label: 'Continue with Okta FedRAMP High' },
  { id: 'entra-scada', label: 'Continue with Microsoft Entra ID' },
  { id: 'gov-piv', label: 'EPA / Regulator PIV Smartcard' },
] as const;

export const ACTIVE_OPERATOR_SESSIONS = [
  {
    id: 'sess-hou-1',
    device: 'MacBook Pro 16" · Console A1',
    browser: 'Chrome 134 · WebAuthn Hardware Key',
    location: 'Houston Mission Control, TX',
    ip: '198.51.100.14',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 'sess-mid-2',
    device: 'Panasonic Toughbook G2 · LDAR Truck Alpha',
    browser: 'Edge 134 · Starlink Uplink',
    location: 'Midland Sector B-4, TX',
    ip: '203.0.113.88',
    lastActive: '11 minutes ago',
    current: false,
  },
  {
    id: 'sess-tsu-3',
    device: 'Linux Workstation · Downlink Rack 4',
    browser: 'Firefox ESR 128',
    location: 'Tsukuba Space Center, JP',
    ip: '192.0.2.41',
    lastActive: '2 hours ago',
    current: false,
  },
] as const;

export const RBAC_ROLES = [
  { id: 'incident-cmd', name: 'Incident Commander', description: 'Full orbital tasking & SCADA shutoff authority' },
  { id: 'field-lead', name: 'LDAR Field Lead', description: 'Dispatch, OGI upload & work-order sign-off' },
  { id: 'epa-auditor', name: 'Compliance Auditor', description: 'Read-only telemetry + certificate countersign' },
  { id: 'procurement', name: 'Treasury & Fleet', description: 'Sensor orders, carbon credits & billing plans' },
] as const;

export const RBAC_PERMISSIONS = [
  { id: 'scada.actuate', label: 'Actuate SCADA Isolation Valves', category: 'Safety-Critical Control' },
  { id: 'sat.task', label: 'Task AtmosSat-4 Nadir Overpass', category: 'Safety-Critical Control' },
  { id: 'ldar.dispatch', label: 'Assign Field Crews & UAV Sorties', category: 'Operations' },
  { id: 'ogmp.sign', label: 'Countersign EPA Subpart W Certificates', category: 'Compliance' },
  { id: 'commerce.settle', label: 'Purchase Sensors & Retire Carbon Credits', category: 'Treasury' },
] as const;

export const RBAC_INITIAL_GRANTS: Readonly<Record<string, ReadonlyArray<string>>> = {
  'incident-cmd': ['scada.actuate', 'sat.task', 'ldar.dispatch', 'ogmp.sign'],
  'field-lead': ['ldar.dispatch'],
  'epa-auditor': ['ogmp.sign'],
  procurement: ['commerce.settle'],
};

export const OPERATOR_PROFILE_MENU_ITEMS = [
  { id: 'profile', label: 'Dr. Elena Vance · IC Profile', icon: 'user' as const },
  { id: 'passkeys', label: 'Hardware Passkeys (2 YubiKeys)', icon: 'check' as const },
  { id: 'audit-export', label: 'Download Signed Session Log', icon: 'share' as const },
  { id: 'signout', label: 'Lock Console Session', icon: 'close' as const, danger: true, separatorBefore: true },
] as const;
