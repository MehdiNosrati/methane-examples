import { withBasePath } from '../base-path.js';

export const OFFLINE_BASIN_MAP_STYLE = {
  version: 8 as const,
  name: 'AtmosOps Offline SWIR Basin Telemetry',
  sources: {
    'atmos-basins': {
      type: 'geojson' as const,
      data: {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { name: 'Permian Delaware Sector', risk: 'high' },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  [-104.25, 31.35],
                  [-102.85, 31.35],
                  [-102.85, 32.45],
                  [-104.25, 32.45],
                  [-104.25, 31.35],
                ],
              ],
            },
          },
          {
            type: 'Feature' as const,
            properties: { name: 'Midland Central Sector', risk: 'elevated' },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  [-102.65, 31.55],
                  [-101.45, 31.55],
                  [-101.45, 32.35],
                  [-102.65, 32.35],
                  [-102.65, 31.55],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: 'atmos-ocean-bg',
      type: 'background' as const,
      paint: { 'background-color': '#0b1724' },
    },
    {
      id: 'atmos-basin-fill',
      type: 'fill' as const,
      source: 'atmos-basins',
      paint: {
        'fill-color': '#14b8a6',
        'fill-opacity': 0.18,
      },
    },
    {
      id: 'atmos-basin-outline',
      type: 'line' as const,
      source: 'atmos-basins',
      paint: {
        'line-color': '#2dd4bf',
        'line-width': 2,
      },
    },
  ],
};

export const PLUME_MAP_MARKERS = [
  { id: 'plume-perm-b4', lng: -102.18, lat: 31.95, label: 'Pad B-4 · 142.8 kg/hr CH4' },
  { id: 'plume-del-c9', lng: -103.62, lat: 31.88, label: 'Delaware C-9 · 68.4 kg/hr CH4' },
  { id: 'plume-mid-a2', lng: -101.92, lat: 32.11, label: 'Midland Tank A-2 · 19.2 kg/hr CH4' },
  { id: 'plume-sealed-01', lng: -103.14, lat: 31.64, label: 'Pecos Manifold · 0.3 kg/hr (Sealed)' },
] as const;

export const GLOBAL_EMITTER_CLUSTERS = [
  { id: 'cl-perm-1', lng: -102.18, lat: 31.95, label: 'Permian Midland B-4' },
  { id: 'cl-perm-2', lng: -102.34, lat: 31.82, label: 'Permian Odessa South' },
  { id: 'cl-perm-3', lng: -103.58, lat: 31.91, label: 'Permian Loving Hub' },
  { id: 'cl-app-1', lng: -80.19, lat: 39.88, label: 'Marcellus Waynesburg' },
  { id: 'cl-app-2', lng: -79.92, lat: 40.14, label: 'Marcellus Monongahela' },
  { id: 'cl-neu-1', lng: -68.82, lat: -38.36, label: 'Vaca Muerta Añelo' },
  { id: 'cl-turk-1', lng: 54.32, lat: 39.48, label: 'Balkanabat West Field' },
  { id: 'cl-alger-1', lng: 3.16, lat: 31.68, label: 'Hassi R’Mel Gathering' },
] as const;

export const EXCLUSION_GEOJSON_FEATURES = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      id: 'zone-b4-perimeter',
      properties: { name: 'Downwind Plume Safety Perimeter', ppmLimit: 500 },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-102.22, 31.93],
            [-102.13, 31.93],
            [-102.13, 31.98],
            [-102.22, 31.98],
            [-102.22, 31.93],
          ],
        ],
      },
    },
    {
      type: 'Feature' as const,
      id: 'sniffer-transect',
      properties: { name: 'UAV-07 Downwind Transect' },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-102.21, 31.94],
          [-102.18, 31.955],
          [-102.14, 31.97],
        ],
      },
    },
    {
      type: 'Feature' as const,
      id: 'valve-xv402',
      properties: { name: 'Isolation Valve XV-402' },
      geometry: {
        type: 'Point' as const,
        coordinates: [-102.18, 31.95] as const,
      },
    },
  ],
};

export const SNIFFER_ROUTE = {
  origin: { lng: -102.0779, lat: 31.9973, label: 'Midland LDAR Depot' },
  destination: { lng: -102.18, lat: 31.95, label: 'Compressor Station B-4 (XV-402)' },
  waypoints: [
    { lng: -102.118, lat: 31.979, label: 'Gate 3 Meteorological Mast' },
    { lng: -102.154, lat: 31.962, label: 'Downwind TDLAS Checkpoint' },
  ],
} as const;

export const COMPRESSOR_FLOOR_PLAN_ROOMS = [
  { id: 'bay-comp-1', name: 'Centrifugal Compressor Bay 1 (18.4 ppm)', x: 24, y: 24, width: 190, height: 110, level: '1' },
  { id: 'bay-comp-2', name: 'Compressor Bay 2 · XV-402 Alert', x: 230, y: 24, width: 190, height: 110, level: '1' },
  { id: 'glycol-dehy', name: 'Glycol Dehydrator Skid', x: 436, y: 24, width: 140, height: 110, level: '1' },
  { id: 'scada-bunker', name: 'SCADA & Analyzer Shelter', x: 24, y: 152, width: 170, height: 96, level: '1' },
  { id: 'manifold-yard', name: 'High-Pressure Valve Manifold', x: 210, y: 152, width: 210, height: 96, level: '1' },
  { id: 'flare-knockout', name: 'Closed-Flare Knockout Drum (Offline)', x: 436, y: 152, width: 140, height: 96, level: '1', disabled: true },
] as const;

export const MISSION_CONTROL_SEATS = [
  { id: 'MC-A1', label: 'A1 · Flight Director', row: 'A', tier: 'Command', status: 'occupied' as const },
  { id: 'MC-A2', label: 'A2 · Orbital Tasking', row: 'A', tier: 'Command', status: 'available' as const },
  { id: 'MC-A3', label: 'A3 · Plume Inversion', row: 'A', tier: 'Command', status: 'occupied' as const },
  { id: 'MC-A4', label: 'A4 · EPA Liaison', row: 'A', tier: 'Command', status: 'available' as const },
  { id: 'MC-B1', label: 'B1 · Permian Dispatch', row: 'B', tier: 'Basin Ops', status: 'available' as const },
  { id: 'MC-B2', label: 'B2 · SCADA Telemetry', row: 'B', tier: 'Basin Ops', status: 'occupied' as const },
  { id: 'MC-B3', label: 'B3 · UAV Pilot Desk', row: 'B', tier: 'Basin Ops', status: 'available' as const },
  { id: 'MC-B4', label: 'B4 · Calibration Bench', row: 'B', tier: 'Basin Ops', status: 'disabled' as const },
] as const;

export const THERMAL_ANNOTATIONS = [
  { id: 'ann-1', type: 'rect' as const, x: 196, y: 128, width: 84, height: 82, text: 'XV-402 Flange Plume (142.8 kg/hr)' },
  { id: 'ann-2', type: 'arrow' as const, x: 242, y: 148, x2: 348, y2: 68, text: 'Wind Drift 248° (6.2 m/s)' },
  { id: 'ann-3', type: 'text' as const, x: 382, y: 266, text: 'Reference Manifold: Normal (1.9 ppm)' },
];

export const PLUME_GALLERY_ITEMS = [
  {
    src: withBasePath('/media/plume-swir.svg'),
    alt: 'SWIR 1650nm methane column retrieval over Permian Pad B-4',
    caption: 'AtmosSat-4 Orbit #14892 · +1,840 ppb CH4 enhancement',
  },
  {
    src: withBasePath('/media/plume-optical.svg'),
    alt: 'True-color optical pass over Permian Pad B-4',
    caption: 'Simultaneous RGB framing camera · Clear sky 0% cloud fraction',
  },
  {
    src: withBasePath('/media/drone-pad-thermal.svg'),
    alt: 'Mid-wave infrared OGI drone frame of Valve Manifold XV-402',
    caption: 'UAV-07 Hover 18m AGL · Joule-Thomson ΔT -6.4°C signature',
  },
  {
    src: withBasePath('/media/orbital-spectrometer-poster.svg'),
    alt: 'AtmosSat-4 Nadir SWIR imaging spectrometer schematic',
    caption: '0.3 nm spectral FWHM · 25m spatial ground pixel',
  },
] as const;

export const BASIN_CASCADER_OPTIONS = [
  {
    value: 'na',
    label: 'North America',
    children: [
      {
        value: 'permian',
        label: 'Permian Basin (TX/NM)',
        children: [
          { value: 'midland-b4', label: 'Midland Compressor B-4' },
          { value: 'delaware-c9', label: 'Delaware Gathering C-9' },
        ],
      },
      {
        value: 'appalachia',
        label: 'Appalachian Marcellus',
        children: [
          { value: 'waynesburg-01', label: 'Waynesburg Tie-In 01' },
        ],
      },
    ],
  },
  {
    value: 'latam',
    label: 'South America',
    children: [
      {
        value: 'neuquen',
        label: 'Neuquén Basin (Vaca Muerta)',
        children: [
          { value: 'anelo-pad7', label: 'Añelo Central Pad 7' },
        ],
      },
    ],
  },
] as const;

export const ORBIT_PULSE_LOTTIE_DATA = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'AtmosOrbitPulse',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'CoreDot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [36, 36] }, nm: 'Center' },
        { ty: 'fl', c: { a: 0, k: [0.08, 0.72, 0.65, 1] }, o: { a: 0, k: 100 }, r: 1, nm: 'Fill' },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};
