export const COPILOT_CITATIONS = [
  {
    id: 'cit-1',
    index: 1,
    title: 'AtmosSat-4 Level-2B Plume Retrieval #14892',
    url: 'https://mahdins.dev/methane/#orbit-14892',
    domain: 'atmosops.telemetry',
    snippet: 'Column-averaged XCH4 enhancement of +1,840 ppb with 142.8 ± 9.4 kg/hr IME flux.',
  },
  {
    id: 'cit-2',
    index: 2,
    title: 'EPA 40 CFR Part 98 Subpart W Super-Emitter Protocol',
    url: 'https://www.epa.gov/ghgreporting',
    domain: 'epa.gov',
    snippet: 'Events exceeding 100 kg/hr CH4 require root-cause investigation within 5 calendar days.',
  },
  {
    id: 'cit-3',
    index: 3,
    title: 'Pad B-4 Ultrasonic Anemometer & TDLAS Log',
    url: 'https://mahdins.dev/methane/#sen-perm-101',
    domain: 'scada.permian',
    snippet: 'Downwind chord SEN-PERM-101 peaked at 70.4 ppm prior to XV-402 closure.',
  },
] as const;

export const COPILOT_SUGGESTION_CHIPS = [
  { id: 'sug-1', label: 'Simulate 12 m/s wind shift', prompt: 'Project plume dispersion if wind shifts to 285° at 12 m/s.' },
  { id: 'sug-2', label: 'Draft EPA Subpart W notice', prompt: 'Generate the 24-hour regulatory abatement summary for INC-842.' },
  { id: 'sug-3', label: 'Compare δ13C thermogenic ratio', prompt: 'Explain why -41.8‰ confirms pipeline gas vs. surface soil.' },
] as const;

export const COPILOT_ARTIFACT_VERSIONS = [
  {
    id: 'v1',
    label: 'v1 · IME Flux Model',
    kind: 'code' as const,
    language: 'python',
    title: 'ime_plume_inversion.py',
    content: `def compute_ime_flux_kg_hr(ime_kg: float, u10_mps: float, plume_len_m: float) -> float:
    u_eff = 0.34 * u10_mps + 0.42
    return round((u_eff * ime_kg / max(plume_len_m, 1.0)) * 3600.0, 2)

print(compute_ime_flux_kg_hr(ime_kg=24.6, u10_mps=6.2, plume_len_m=1568.0))  # 142.82 kg/hr`,
  },
  {
    id: 'v2',
    label: 'v2 · Regulatory Brief',
    kind: 'markdown' as const,
    title: 'epa_abatement_brief.md',
    content: `### Verified Abatement Summary (INC-842)\n- **Peak Flux**: 142.8 kg/hr CH4\n- **Shutoff Latency**: 42 seconds\n- **Post-Seal Residual**: 0.3 kg/hr (99.7% reduction)`,
  },
] as const;

export const COPILOT_TOOL_CALL = {
  name: 'query_gaussian_plume_inversion',
  status: 'success' as const,
  durationMs: 184,
  args: {
    stationId: 'PERM-MIDLAND-B4',
    orbitPass: 14892,
    windSpeedMps: 6.2,
    windBearingDeg: 248,
  },
  output: {
    sourceValve: 'XV-402',
    fluxKgHr: 142.8,
    confidence: 0.986,
    recommendedAction: 'CLOSE_XV_402_AND_DISPATCH_LDAR_ALPHA',
  },
} as const;

export const SANITIZER_REDTEAM_PAYLOADS = [
  {
    id: 'safe-report',
    label: 'Trusted Field Telemetry Bulletin',
    markdown:
      '**Station B-4 Sealed:** Residual CH4 dropped to `1.92 ppm` after XV-402 isolation. [View OGMP Ledger](https://mahdins.dev/methane/)',
    rawUrl: 'https://mahdins.dev/methane/',
  },
  {
    id: 'xss-onerror',
    label: 'Red-Team XSS (<img onerror> + javascript: URI)',
    markdown:
      'Urgent sensor override! <img src="x" onerror="window.__xssTriggered=true;alert(1)"> <script>evil()</script> [Click Override](javascript:alert(document.cookie))',
    rawUrl: 'javascript:alert(document.cookie)',
  },
  {
    id: 'svg-onload',
    label: 'Red-Team SVG ForeignObject Payload',
    markdown:
      'Plume contour preview: <svg onload="alert(1)"><circle cx="12" cy="12" r="10" fill="teal"/></svg> **Sanitized cleanly!**',
    rawUrl: 'data:text/html,<script>alert(1)</script>',
  },
] as const;

export const WAR_ROOM_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    author: 'Kenji Takahashi',
    body: 'AtmosSat-4 Pass #14892 just downlinked — +1,840 ppb SWIR plume locked onto Midland Compressor Bay 2.',
    timestamp: '08:41 UTC',
    badge: 'Orbital Ops',
  },
  {
    id: 'msg-2',
    author: 'Devon Brooks',
    body: 'Confirmed on ground TDLAS chord SEN-PERM-101 (70.4 ppm). SCADA automated shutoff closed XV-402 in 42s.',
    timestamp: '08:42 UTC',
    badge: 'SCADA',
  },
  {
    id: 'msg-3',
    author: 'Mateo Alvarez',
    body: 'LDAR Truck Alpha arrived at Gate 3. Spiral gasket replaced and torqued; OGI camera shows zero residual plume.',
    timestamp: '10:16 UTC',
    self: true,
    badge: 'Field Chief',
  },
] as const;

export const WAR_ROOM_COMMENT_THREAD = [
  {
    id: 'cmt-1',
    author: 'Dr. Elena Vance',
    body: 'Please attach the 60-second UAV-07 mid-wave IR clip before I countersign the Subpart W form.',
    timestamp: '10:22 UTC',
    resolved: false,
    replies: [
      {
        id: 'cmt-1-r1',
        author: 'Sana Nair',
        body: 'Uploaded UAV-07 hover clip and ultrasonic acoustic `.wav` signature to Incident Vault.',
        timestamp: '10:26 UTC',
      },
    ],
  },
] as const;

export const WAR_ROOM_COLLAB_CURSORS = [
  { id: 'cur-1', name: 'Elena Vance (IC)', color: '#14b8a6', x: 64, y: 42 },
  { id: 'cur-2', name: 'Sana Nair (UAV-07)', color: '#f59e0b', x: 228, y: 88 },
] as const;

export const WAR_ROOM_NOTIFICATION_ITEMS = [
  { id: 'nb-1', title: 'Valve XV-402 Sealed', message: 'Residual flux verified at 0.3 kg/hr (-99.7%)', tone: 'success' as const, timestamp: '2m ago', read: false },
  { id: 'nb-2', title: 'Delaware C-9 Scheduled', message: 'UAV-07 sortie cleared for 09:00 UTC window', tone: 'warning' as const, timestamp: '14m ago', read: false },
  { id: 'nb-3', title: 'Locale Packs Cached', message: '8 BCP-47 packs ready for multi-agency briefing', tone: 'info' as const, timestamp: '1h ago', read: true },
] as const;

export const WAR_ROOM_REACTIONS = [
  { emoji: '✅', count: 6, active: true, label: 'Verified Sealed' },
  { emoji: '🛰️', count: 4, active: false, label: 'Satellite Confirmed' },
  { emoji: '🛡️', count: 3, active: false, label: 'Zero Safety Incident' },
] as const;

export const WAR_ROOM_VIDEO_PARTICIPANTS = [
  { id: 'vp-1', name: 'Dr. Elena Vance · Houston IC', speaking: true, pinned: true, muted: false, videoOff: false },
  { id: 'vp-2', name: 'Mateo Alvarez · Pad B-4 Truck', speaking: false, muted: false, videoOff: false },
  { id: 'vp-3', name: 'Sana Nair · UAV-07 Ground Station', speaking: false, muted: true, videoOff: false },
  { id: 'vp-4', name: 'Kenji Takahashi · Tsukuba Downlink', speaking: false, muted: true, videoOff: true },
] as const;

export const ULTRASONIC_WAVEFORM_PEAKS: ReadonlyArray<number> = [
  0.12, 0.18, 0.24, 0.31, 0.52, 0.78, 0.94, 0.88, 0.96, 0.81, 0.67, 0.74,
  0.89, 0.92, 0.76, 0.58, 0.44, 0.36, 0.29, 0.22, 0.19, 0.15, 0.14, 0.12,
  0.11, 0.13, 0.16, 0.14, 0.12, 0.10, 0.09, 0.08, 0.09, 0.07, 0.06, 0.06,
  0.05, 0.06, 0.05, 0.04, 0.05, 0.04, 0.04, 0.03, 0.04, 0.03, 0.03, 0.03,
];
