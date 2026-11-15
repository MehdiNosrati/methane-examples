export const LDAR_KANBAN_LANES = [
  { id: 'detected', label: 'Orbital / TDLAS Detected', wipLimit: 5 },
  { id: 'triaged', label: 'Isotopic & Wind Triaged', wipLimit: 4 },
  { id: 'dispatched', label: 'LDAR Crew On-Site', wipLimit: 3 },
  { id: 'sealed', label: 'OGI Verified Sealed' },
] as const;

export const LDAR_KANBAN_CARDS = [
  { id: 'inc-842', laneId: 'dispatched', title: 'Permian B-4 Valve XV-402 Flange (142.8 kg/hr)', assignee: 'M. Alvarez', priority: 'P0 Critical' },
  { id: 'inc-845', laneId: 'triaged', title: 'Delaware C-9 Thief Hatch Unlatched (68.4 kg/hr)', assignee: 'S. Nair', priority: 'P1 High' },
  { id: 'inc-849', laneId: 'detected', title: 'Midland Tank A-2 Vapor Recovery Bypass (19.2 kg/hr)', assignee: 'K. Okafor', priority: 'P2 Medium' },
  { id: 'inc-851', laneId: 'detected', title: 'Añelo Pad 7 Pneumatic Controller Bleed (9.1 kg/hr)', assignee: 'L. Rojas', priority: 'P2 Medium' },
  { id: 'inc-838', laneId: 'sealed', title: 'Pecos Manifold Gasket Torque & Retest (<0.3 kg/hr)', assignee: 'D. Chen', priority: 'Verified' },
] as const;

export const OPERATIONS_CALENDAR_EVENTS = [
  { id: 'ev-1', title: 'AtmosSat-4 Permian Nadir Overpass', date: '2026-03-14', startTime: '14:15', endTime: '14:45' },
  { id: 'ev-2', title: 'UAV-07 OGI Thermal Verification Sortie', date: '2026-03-15', startTime: '09:00', endTime: '11:30' },
  { id: 'ev-3', title: 'EPA Subpart W Quarterly Attestation Cutoff', date: '2026-03-18', startTime: '17:00', endTime: '18:00' },
  { id: 'ev-4', title: 'Compressor B-4 Wet-Seal Overhaul Window', date: '2026-03-21', startTime: '06:00', endTime: '16:00' },
] as const;

export const AIRCRAFT_BOOKING_SLOTS = [
  { date: '2026-03-16', slots: ['07:30 UTC', '10:00 UTC', '14:30 UTC'] },
  { date: '2026-03-17', slots: ['08:00 UTC', '11:30 UTC', '16:00 UTC'] },
  { date: '2026-03-18', slots: ['09:00 UTC', '13:30 UTC'] },
] as const;

export const COMPLIANCE_FILE_EXPLORER_ITEMS = [
  { id: 'fld-ogmp', name: 'OGMP-2.0-Filings', kind: 'folder' as const, parentId: null, updatedAt: '2026-03-14' },
  { id: 'fld-cal', name: 'TDLAS-Calibration-Certs', kind: 'folder' as const, parentId: null, updatedAt: '2026-03-12' },
  { id: 'fil-cert', name: 'EPA-Subpart-W-2026-0842.pdf', kind: 'file' as const, parentId: null, size: 184320, updatedAt: '2026-03-14' },
  { id: 'fil-sop', name: 'XV-402-Emergency-Isolation-SOP.md', kind: 'file' as const, parentId: null, size: 14820, updatedAt: '2026-03-13' },
  { id: 'fil-fw', name: 'atmosedge-v2.5.0-sha256.json', kind: 'file' as const, parentId: 'fld-cal', size: 4120, updatedAt: '2026-03-11' },
] as const;

export const OPERATIONS_AUDIT_LOG_ENTRIES = [
  { id: 'aud-1', actor: 'scada-autonomy@atmosops.io', action: 'CLOSED_ISOLATION_VALVE', resource: 'Permian-B4/XV-402', timestamp: '2026-03-14T08:42:19Z', severity: 'critical' as const },
  { id: 'aud-2', actor: 'm.alvarez@atmosops.io', action: 'DISPATCHED_LDAR_CREW', resource: 'Ticket/INC-842', timestamp: '2026-03-14T08:44:05Z', severity: 'warning' as const },
  { id: 'aud-3', actor: 'atmossat-4-pipeline', action: 'PUBLISHED_PLUME_INVERSION', resource: 'Orbit/14892-SWIR', timestamp: '2026-03-14T08:41:02Z', severity: 'info' as const },
  { id: 'aud-4', actor: 'elena.vance@epa-auditor.org', action: 'COUNTERSIGNED_ABATEMENT_CERT', resource: 'Cert/OGMP-0842', timestamp: '2026-03-14T13:18:50Z', severity: 'info' as const },
] as const;

export const OPERATIONS_SETTINGS_SECTIONS = [
  { id: 'thresholds', label: 'SCADA Shutoff Thresholds', description: 'Automated valve actuation ppm & flux triggers' },
  { id: 'escalation', label: 'Pager & EPA Escalation', description: 'Regulatory SLA timers and regional on-call trees' },
  { id: 'calibration', label: 'TDLAS Zero-Gas Schedule', description: 'Nightly auto-zero reference cell verification' },
] as const;

export const CREW_SCHEDULER_RESOURCES = [
  { id: 'crew-alpha', label: 'LDAR Truck Alpha (Midland)' },
  { id: 'uav-07', label: 'UAV-07 OGI Hexacopter' },
  { id: 'air-kingair', label: 'Airborne LiDAR KingAir N42CH' },
  { id: 'sat-atmos4', label: 'AtmosSat-4 Tasking Window' },
] as const;

export const CREW_SCHEDULER_EVENTS = [
  { id: 'sc-1', resourceId: 'crew-alpha', title: 'Pad B-4 XV-402 Torque & OGI', startDate: '2026-03-09', endDate: '2026-03-11' },
  { id: 'sc-2', resourceId: 'uav-07', title: 'Delaware C-9 Plume Mapping', startDate: '2026-03-10', endDate: '2026-03-12' },
  { id: 'sc-3', resourceId: 'air-kingair', title: 'Permian Basin Corridor Sweep', startDate: '2026-03-11', endDate: '2026-03-14' },
  { id: 'sc-4', resourceId: 'sat-atmos4', title: 'Post-Repair Verification Overpass', startDate: '2026-03-13', endDate: '2026-03-15' },
] as const;

export const REMEDIATION_GANTT_TASKS = [
  { id: 'gt-1', title: 'SWIR Plume Inversion & Source Localization', startDate: '2026-03-09', endDate: '2026-03-11', progress: 100 },
  { id: 'gt-2', title: 'SCADA Valve XV-402 Automated Isolation', startDate: '2026-03-10', endDate: '2026-03-12', progress: 100, dependencies: ['gt-1'] },
  { id: 'gt-3', title: 'Depressurize Manifold & Replace Spiral Gasket', startDate: '2026-03-12', endDate: '2026-03-16', progress: 80, dependencies: ['gt-2'] },
  { id: 'gt-4', title: 'UAV-07 Thermal OGI Zero-Leak Audit', startDate: '2026-03-16', endDate: '2026-03-19', progress: 45, dependencies: ['gt-3'] },
  { id: 'gt-5', title: 'EPA Subpart W & OGMP Certificate Issuance', startDate: '2026-03-20', endDate: '2026-03-21', progress: 0, milestone: true, dependencies: ['gt-4'] },
] as const;

export const SCADA_FLOW_NODES = [
  { id: 'n-sat', label: 'AtmosSat-4 SWIR (>50 kg/hr)', type: 'input' },
  { id: 'n-tdlas', label: 'Pad B-4 TDLAS (>25 ppm)', type: 'input' },
  { id: 'n-fusion', label: 'Bayesian Plume Fusion Engine', type: 'process' },
  { id: 'n-scada', label: 'Actuate Valve XV-402', type: 'action' },
  { id: 'n-dispatch', label: 'Page Midland LDAR Crew', type: 'action' },
  { id: 'n-ledger', label: 'Mint OGMP Audit Record', type: 'output' },
] as const;

export const SCADA_FLOW_EDGES = [
  { id: 'e-1', source: 'n-sat', target: 'n-fusion', label: '142.8 kg/hr' },
  { id: 'e-2', source: 'n-tdlas', target: 'n-fusion', label: '70.4 ppm' },
  { id: 'e-3', source: 'n-fusion', target: 'n-scada', label: 'P > 0.98' },
  { id: 'e-4', source: 'n-fusion', target: 'n-dispatch', label: 'SLA 15m' },
  { id: 'e-5', source: 'n-scada', target: 'n-ledger', label: 'Sealed' },
] as const;

export const INCIDENT_ORG_CHART_NODES = [
  {
    id: 'org-ic',
    name: 'Dr. Elena Vance',
    title: 'Global Incident Commander',
    department: 'AtmosOps Mission Control',
    parentId: null,
    children: [
      {
        id: 'org-orb',
        name: 'Kenji Takahashi',
        title: 'Lead Orbital Spectroscopy',
        department: 'Space Segment',
        parentId: 'org-ic',
      },
      {
        id: 'org-ldar',
        name: 'Mateo Alvarez',
        title: 'Permian Field Operations Chief',
        department: 'Basin Response',
        parentId: 'org-ic',
        children: [
          { id: 'org-uav', name: 'Sana Nair', title: 'UAV OGI Flight Lead', department: 'Aerial Verification', parentId: 'org-ldar' },
          { id: 'org-scada', name: 'Devon Brooks', title: 'Principal SCADA Engineer', department: 'Pipeline Control', parentId: 'org-ldar' },
        ],
      },
    ],
  },
] as const;

export const FIRMWARE_CODE_SAMPLE = `export interface PlumeTriggerConfig {
  readonly stationId: string;
  readonly maxPpmThreshold: number;
  readonly minWindSpeedMps: number;
  readonly autoCloseValveId: string;
}

export function evaluateShutoff(
  ch4Ppm: number,
  windMps: number,
  cfg: PlumeTriggerConfig,
): { actuate: boolean; reason: string } {
  if (ch4Ppm >= cfg.maxPpmThreshold && windMps >= cfg.minWindSpeedMps) {
    return {
      actuate: true,
      reason: \`[\${cfg.stationId}] CH4=\${ch4Ppm}ppm exceeded \${cfg.maxPpmThreshold}ppm -> closing \${cfg.autoCloseValveId}\`,
    };
  }
  return { actuate: false, reason: 'Within nominal operating envelope' };
}
`;

export const CLI_PROVISION_SNIPPET = `atmosctl sensor calibrate --station PERM-B4 \\
  --zero-gas N2-99.999 \\
  --span-ppm 50.0 \\
  --sign-ogmp-ledger`;

export const CALIBRATION_DIFF_ORIGINAL = `{
  "firmware": "atmosedge-v2.4.1",
  "sampleHz": 2,
  "shutoffThresholdPpm": 100,
  "autoActuate": false,
  "telemetryCompression": "gzip"
}`;

export const CALIBRATION_DIFF_MODIFIED = `{
  "firmware": "atmosedge-v2.5.0",
  "sampleHz": 10,
  "shutoffThresholdPpm": 35,
  "autoActuate": true,
  "telemetryCompression": "zstd-dict"
}`;

export const OGMP_TELEMETRY_JSON_SAMPLE = JSON.stringify(
  {
    schema: 'https://atmosops.io/schemas/ogmp-v2.json',
    stationId: 'PERM-MIDLAND-B4',
    orbitPass: 14892,
    fluxKgPerHour: 142.8,
    uncertaintyKgPerHour: 9.4,
    isotopicDelta13C: -41.8,
    valveIsolated: true,
  },
  null,
  2,
);

export const GAUSSIAN_PLUME_LATEX =
  'C(x,y,z) = \\frac{Q}{2\\pi u \\sigma_y \\sigma_z} \\exp\\left(-\\frac{y^2}{2\\sigma_y^2}\\right) \\left[\\exp\\left(-\\frac{(z-H)^2}{2\\sigma_z^2}\\right) + \\exp\\left(-\\frac{(z+H)^2}{2\\sigma_z^2}\\right)\\right]';

export const RUNBOOK_MARKDOWN_SOP = `## SOP-402: High-Pressure Compressor Flange Isolation

1. **Confirm Isotopic Signature**: Verify $\\delta^{13}\\text{C}$ lies between \`-45‰\` and \`-38‰\` to rule out biogenic marsh background.
2. **SCADA Interlock Check**: Ensure bypass valve \`XV-403\` holds downstream pressure above \`420 psi\` before closing \`XV-402\`.
3. **OGI Thermal Sweep**: Capture 60-second mid-wave IR clip from \`18m AGL\` upwind and upload signed SHA-256 digest.`;

export const POSTMORTEM_RICH_HTML =
  '<p><strong>Incident INC-842 Summary:</strong> At 08:41 UTC, AtmosSat-4 detected a 142.8 kg/hr methane plume at Midland Compressor Station B-4. Automated SCADA shutoff sealed Valve XV-402 within 42 seconds, preventing 3.4 metric tons of fugitive CH4 release.</p>';

export const DISPATCH_SCHEMA_FORM = {
  title: 'EPA Subpart W Rapid Field Report',
  description: 'Auto-generated from JSON Schema for regulatory field sign-off.',
  type: 'object' as const,
  required: ['inspectorCallsign', 'residualPpm', 'sealVerified'],
  properties: {
    inspectorCallsign: {
      type: 'string' as const,
      title: 'Lead Inspector Callsign',
      default: 'LDAR-ALPHA-04',
      minLength: 3,
    },
    equipmentComponent: {
      type: 'string' as const,
      title: 'Leaking Component Class',
      enum: ['Flange Gasket', 'Pneumatic Controller', 'Thief Hatch', 'Compressor Rod Packing'],
      default: 'Flange Gasket',
    },
    residualPpm: {
      type: 'number' as const,
      title: 'Post-Repair OGI / Sniffer Reading (ppm)',
      minimum: 0,
      maximum: 500,
      default: 1.9,
    },
    sealVerified: {
      type: 'boolean' as const,
      title: 'Zero-Leak Verified Under Operating Pressure',
      default: true,
    },
  },
};

export const OPERATIONS_ACTIVITY_FEED = [
  { id: 'af-1', actor: 'AtmosSat-4', title: 'Orbital SWIR Pass #14892 ingested', description: 'Detected +1,840 ppb enhancement at Pad B-4', timestamp: '08:41 UTC' },
  { id: 'af-2', actor: 'SCADA Guard', title: 'Isolation Valve XV-402 closed automatically', description: 'Downstream manifold pressure stabilized at 438 psi', timestamp: '08:42 UTC' },
  { id: 'af-3', actor: 'Mateo Alvarez', title: 'Spiral-wound PTFE gasket torqued to 185 ft-lbs', description: 'Sniffer probe reading dropped to 1.9 ppm ambient', timestamp: '10:15 UTC' },
] as const;

export const CHECKLIST_SORTABLE_ITEMS = [
  { id: 'step-lockout', label: '1. Apply LOTO padlock on Compressor Bay 2 breaker' },
  { id: 'step-depress', label: '2. Vent spool piece to closed vapor-recovery drum' },
  { id: 'step-torque', label: '3. Cross-pattern torque ANSI 600# flange bolts' },
  { id: 'step-ogi', label: '4. Record 60s OGI camera verification sweep' },
] as const;

export const SENSOR_TRANSFER_LIST_OPTIONS = [
  { key: 'SEN-PERM-101', label: 'SEN-PERM-101 · North Fence TDLAS', description: '10 Hz high-rate mode' },
  { key: 'SEN-PERM-102', label: 'SEN-PERM-102 · Compressor Roof', description: '10 Hz high-rate mode' },
  { key: 'SEN-PERM-103', label: 'SEN-PERM-103 · Tank Battery East', description: 'Standard 1 Hz mode' },
  { key: 'SEN-PERM-104', label: 'SEN-PERM-104 · Flare Stack Ultrasonic', description: 'Acoustic + CH4 fusion' },
] as const;
