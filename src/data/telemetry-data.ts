export const CH4_FLUX_CATEGORIES = [
  '00:00Z',
  '02:00Z',
  '04:00Z',
  '06:00Z',
  '08:00Z',
  '10:00Z',
  '12:00Z',
  '14:00Z',
  '16:00Z',
  '18:00Z',
  '20:00Z',
  '22:00Z',
] as const;

export const CH4_FLUX_SERIES = [
  {
    name: 'Midland Pad B-4 (kg/hr)',
    type: 'area' as const,
    data: [18.4, 21.0, 24.6, 89.2, 142.8, 138.1, 64.5, 12.2, 4.1, 1.2, 0.4, 0.3],
    smooth: true,
    color: 'oklch(0.63 0.22 28)',
  },
  {
    name: 'Delaware C-9 (kg/hr)',
    type: 'line' as const,
    data: [31.2, 34.8, 36.1, 41.0, 68.4, 62.0, 54.2, 48.9, 39.4, 33.1, 29.8, 27.5],
    smooth: true,
    color: 'oklch(0.64 0.19 175)',
  },
  {
    name: 'EPA Subpart W Threshold (kg/hr)',
    type: 'bar' as const,
    data: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    color: 'oklch(0.72 0.15 85)',
  },
] as const;

export interface SensorTelemetryRow extends Record<string, unknown> {
  readonly id: string;
  readonly sensorCode: string;
  readonly basin: string;
  readonly facilityType: string;
  readonly ch4Ppm: number;
  readonly fluxKgHr: number;
  readonly delta13C: number;
  readonly windMps: number;
  readonly batteryPct: number;
  readonly status: 'nominal' | 'elevated' | 'critical' | 'sealed';
}

const BASINS = ['Permian', 'Appalachia', 'Vaca Muerta', 'Haynesville', 'North Sea'] as const;
const FACILITY_TYPES = ['Compressor', 'Tank Battery', 'Wellhead', 'Pipeline Valve'] as const;

export const SENSOR_TELEMETRY_ROWS: ReadonlyArray<SensorTelemetryRow> = Array.from(
  { length: 120 },
  (_, idx) => {
    const basin = BASINS[idx % BASINS.length]!;
    const facilityType = FACILITY_TYPES[idx % FACILITY_TYPES.length]!;
    const spike = idx === 0 ? 142.8 : idx === 1 ? 68.4 : Number((((idx * 17) % 42) + 1.2).toFixed(1));
    const ch4Ppm = Number((1.92 + spike * 0.48).toFixed(2));
    const status: SensorTelemetryRow['status'] =
      spike >= 100 ? 'critical' : spike >= 35 ? 'elevated' : idx % 9 === 0 ? 'sealed' : 'nominal';
    return {
      id: `sen-${String(idx + 1).padStart(3, '0')}`,
      sensorCode: `SEN-${basin.slice(0, 4).toUpperCase()}-${String(101 + idx)}`,
      basin,
      facilityType,
      ch4Ppm,
      fluxKgHr: spike,
      delta13C: Number((-44.2 + (idx % 7) * 0.9).toFixed(1)),
      windMps: Number((3.1 + (idx % 8) * 0.7).toFixed(1)),
      batteryPct: 74 + (idx % 26),
      status,
    };
  },
);

export const TELEMETRY_DATAGRID_COLUMNS = [
  { id: 'sensorCode', header: 'Sensor ID', accessorKey: 'sensorCode', sortable: true, filterable: true, width: 150, pinned: 'left' as const },
  { id: 'basin', header: 'Basin', accessorKey: 'basin', sortable: true, filterable: true, width: 130 },
  { id: 'facilityType', header: 'Asset Class', accessorKey: 'facilityType', sortable: true, filterable: true, width: 145 },
  { id: 'ch4Ppm', header: 'CH4 (ppm)', accessorKey: 'ch4Ppm', sortable: true, width: 115 },
  { id: 'fluxKgHr', header: 'Flux (kg/hr)', accessorKey: 'fluxKgHr', sortable: true, width: 125 },
  { id: 'delta13C', header: 'δ13C (‰)', accessorKey: 'delta13C', sortable: true, width: 110 },
  { id: 'windMps', header: 'Wind (m/s)', accessorKey: 'windMps', sortable: true, width: 110 },
  { id: 'status', header: 'State', accessorKey: 'status', sortable: true, filterable: true, width: 115 },
] as const;

export const TELEMETRY_SUMMARY_TABLE_COLUMNS = [
  { id: 'basin', field: 'basin', header: 'Monitored Basin', sortable: true },
  { id: 'activeSensors', field: 'activeSensors', header: 'TDLAS Nodes', sortable: true, align: 'end' as const },
  { id: 'meanFlux', field: 'meanFlux', header: 'Mean Flux (kg/hr)', sortable: true, align: 'end' as const },
  { id: 'ogmpLevel', field: 'ogmpLevel', header: 'OGMP 2.0 Tier', sortable: true },
] as const;

export const TELEMETRY_SUMMARY_TABLE_ROWS = [
  { id: 'b-perm', basin: 'Permian Basin (TX/NM)', activeSensors: 412, meanFlux: '14.8 kg/hr', ogmpLevel: 'Level 5 Gold' },
  { id: 'b-appa', basin: 'Appalachian Marcellus', activeSensors: 286, meanFlux: '6.2 kg/hr', ogmpLevel: 'Level 5 Gold' },
  { id: 'b-vaca', basin: 'Neuquén Vaca Muerta', activeSensors: 194, meanFlux: '9.1 kg/hr', ogmpLevel: 'Level 4+' },
  { id: 'b-hayn', basin: 'Haynesville Shale', activeSensors: 168, meanFlux: '5.4 kg/hr', ogmpLevel: 'Level 5 Gold' },
  { id: 'b-nsea', basin: 'Norwegian North Sea', activeSensors: 118, meanFlux: '1.9 kg/hr', ogmpLevel: 'Level 5 Gold' },
] as const;

export const FACILITY_TREE_COLUMNS = [
  { id: 'name', header: 'Hierarchy Node', accessorKey: 'name' },
  { id: 'fluxKgHr', header: 'Flux (kg/hr)', accessorKey: 'fluxKgHr' },
  { id: 'sensors', header: 'Active Sensors', accessorKey: 'sensors' },
  { id: 'compliance', header: 'OGMP Status', accessorKey: 'compliance' },
] as const;

export const FACILITY_TREE_ROWS = [
  {
    id: 'americas',
    name: 'Americas Constellation',
    fluxKgHr: 239.5,
    sensors: 892,
    compliance: '99.2% Verified',
    children: [
      {
        id: 'permian-root',
        name: 'Permian Basin Sector',
        fluxKgHr: 230.4,
        sensors: 412,
        compliance: '1 Active Dispatch',
        children: [
          { id: 'pad-b4', name: 'Midland Compressor Station B-4', fluxKgHr: 142.8, sensors: 18, compliance: 'Crew On-Site' },
          { id: 'pad-c9', name: 'Delaware Gathering C-9', fluxKgHr: 68.4, sensors: 14, compliance: 'Scheduled UAV' },
          { id: 'pad-a2', name: 'Midland Tank Battery A-2', fluxKgHr: 19.2, sensors: 12, compliance: 'Nominal' },
        ],
      },
      {
        id: 'vaca-root',
        name: 'Vaca Muerta Añelo Block',
        fluxKgHr: 9.1,
        sensors: 194,
        compliance: '100% Verified',
      },
    ],
  },
  {
    id: 'emea',
    name: 'EMEA Offshore & Pipeline Grid',
    fluxKgHr: 4.3,
    sensors: 286,
    compliance: '100% Verified',
    children: [
      { id: 'troll-a', name: 'North Sea Sleipner / Troll Tie-In', fluxKgHr: 1.9, sensors: 118, compliance: 'Level 5 Gold' },
    ],
  },
] as const;

export const OGMP_SPREADSHEET_CELLS: Readonly<Record<string, string>> = {
  A1: 'Facility Asset',
  B1: 'Raw CH4 (kg/hr)',
  C1: 'Abated (kg/hr)',
  D1: 'tCO2e / day (GWP=29.8)',
  A2: 'Midland Comp B-4',
  B2: '142.8',
  C2: '142.4',
  D2: '=B2*24*0.0298',
  A3: 'Delaware Pad C-9',
  B3: '68.4',
  C3: '61.0',
  D3: '=B3*24*0.0298',
  A4: 'Midland Tank A-2',
  B4: '19.2',
  C4: '18.9',
  D4: '=B4*24*0.0298',
  A5: 'Waynesburg Tie-In',
  B5: '8.6',
  C5: '8.6',
  D5: '=B5*24*0.0298',
  A6: 'Añelo Central Pad 7',
  B6: '9.1',
  C6: '9.0',
  D6: '=B6*24*0.0298',
  A7: 'TOTAL / SUMMARY',
  B7: '=SUM(B2:B6)',
  C7: '=SUM(C2:C6)',
  D7: '=SUM(D2:D6)',
  A8: 'MEAN PER ASSET',
  B8: '=AVERAGE(B2:B6)',
  C8: '=AVERAGE(C2:C6)',
  D8: '=MAX(D2:D6)',
};

export const TELEMETRY_SAVED_VIEWS = [
  { id: 'super-emitters', label: 'Super-Emitters (>25 kg/hr)', pinned: true },
  { id: 'permian-live', label: 'Permian TDLAS Live', pinned: true },
  { id: 'ogmp-audit', label: 'OGMP 2.0 Level 5 Audit' },
  { id: 'low-battery', label: 'Solar Nodes <80% SoC' },
] as const;

export const TELEMETRY_FILTER_FIELDS = [
  { id: 'basin', label: 'Basin', operators: ['equals', 'contains'] },
  { id: 'fluxKgHr', label: 'CH4 Flux (kg/hr)', operators: ['gt', 'lt', 'gte'] },
  { id: 'status', label: 'Alert Status', operators: ['equals'] },
] as const;

export const TELEMETRY_FILTER_RULES = [
  { id: 'r-1', field: 'basin', operator: 'equals', value: 'Permian' },
  { id: 'r-2', field: 'fluxKgHr', operator: 'gt', value: '25' },
] as const;

export const TELEMETRY_QUERY_FIELDS = [
  { id: 'ch4Ppm', label: 'CH4 Concentration (ppm)' },
  { id: 'fluxKgHr', label: 'Plume Flux Rate (kg/hr)' },
  { id: 'delta13C', label: 'Isotopic δ13C (‰)' },
  { id: 'windMps', label: 'Anemometer Wind (m/s)' },
] as const;

export const TELEMETRY_COLUMN_CHOOSER_ITEMS = [
  { id: 'sensorCode', label: 'Sensor ID', visible: true, locked: true },
  { id: 'basin', label: 'Basin', visible: true },
  { id: 'facilityType', label: 'Asset Class', visible: true },
  { id: 'ch4Ppm', label: 'CH4 (ppm)', visible: true },
  { id: 'fluxKgHr', label: 'Flux (kg/hr)', visible: true },
  { id: 'delta13C', label: 'Isotopic δ13C', visible: true },
  { id: 'batteryPct', label: 'Solar Battery %', visible: false },
] as const;

export const TELEMETRY_BULK_ACTIONS = [
  { id: 'dispatch-uav', label: 'Task UAV-07 Verification' },
  { id: 'export-ogmp', label: 'Export EPA Subpart W CSV' },
  { id: 'isolate-scada', label: 'Trigger SCADA Shutoff', tone: 'danger' as const },
] as const;

export const SENSOR_CSV_FIELDS = [
  { key: 'sensor_id', label: 'Sensor ID', required: true },
  { key: 'basin', label: 'Basin Name', required: true },
  { key: 'ch4_ppm', label: 'CH4 (ppm)', required: true },
  { key: 'lat_lng', label: 'WGS84 Coordinates', required: false },
] as const;

export const SAMPLE_SENSOR_RAW_CSV = [
  'sensor_id,basin,ch4_ppm,lat_lng',
  'SEN-PERM-901,Permian,48.6,"31.9501,-102.1802"',
  'SEN-PERM-902,Permian,3.4,"31.9524,-102.1765"',
  'SEN-APPA-410,Appalachia,2.1,"39.8812,-80.1904"',
].join('\n');

export const ANOMALY_CALENDAR_HEATMAP: ReadonlyArray<{ readonly date: string; readonly count: number }> =
  Array.from({ length: 90 }, (_, idx) => {
    const day = new Date(Date.UTC(2026, 0, 1 + idx));
    const iso = day.toISOString().slice(0, 10);
    const count = (idx * 7 + 3) % 11 === 0 ? 6 : (idx * 5) % 4;
    return { date: iso, count };
  });
