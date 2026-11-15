import { html, type TemplateResult } from 'lit';
import type { DrawMode } from '@methane-ui/maps';
import type { AnnotationTool, ImageAnnotation } from '@methane-ui/media';
import type { BottomSheetDetent } from '@methane-ui/ui/bottom-sheet';
import type { CascaderChangeDetail } from '@methane-ui/ui/cascader';
import type { ContextMenuItem } from '@methane-ui/ui/context-menu';
import type { DrawingTool } from '@methane-ui/ui/drawing-pad';
import { withBasePath } from '../base-path.js';
import { getTagsForSlice } from '../coverage-manifest.js';
import {
  BASIN_CASCADER_OPTIONS,
  COMPRESSOR_FLOOR_PLAN_ROOMS,
  EXCLUSION_GEOJSON_FEATURES,
  GLOBAL_EMITTER_CLUSTERS,
  MISSION_CONTROL_SEATS,
  OFFLINE_BASIN_MAP_STYLE,
  ORBIT_PULSE_LOTTIE_DATA,
  PLUME_GALLERY_ITEMS,
  PLUME_MAP_MARKERS,
  SNIFFER_ROUTE,
  THERMAL_ANNOTATIONS,
} from '../data/spatial-data.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

interface SpatialDrawPointFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'Point';
    readonly coordinates: readonly [number, number];
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface SpatialDrawLineFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'LineString';
    readonly coordinates: ReadonlyArray<readonly [number, number]>;
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface SpatialDrawPolygonFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'Polygon';
    readonly coordinates: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

interface SpatialFeatureCollection {
  readonly type: 'FeatureCollection';
  readonly features: ReadonlyArray<
    SpatialDrawPointFeature | SpatialDrawLineFeature | SpatialDrawPolygonFeature
  >;
}

function toSpatialFeatureCollection(
  source: typeof EXCLUSION_GEOJSON_FEATURES,
): SpatialFeatureCollection {
  const mapped: Array<
    SpatialDrawPointFeature | SpatialDrawLineFeature | SpatialDrawPolygonFeature
  > = [];

  for (const feature of source.features) {
    if (feature.geometry.type === 'Polygon') {
      mapped.push({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: {
          type: 'Polygon',
          coordinates: feature.geometry.coordinates.map((ring) =>
            ring.map((pt): readonly [number, number] => [pt[0] ?? 0, pt[1] ?? 0]),
          ),
        },
      });
    } else if (feature.geometry.type === 'LineString') {
      mapped.push({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: {
          type: 'LineString',
          coordinates: feature.geometry.coordinates.map(
            (pt): readonly [number, number] => [pt[0] ?? 0, pt[1] ?? 0],
          ),
        },
      });
    } else if (feature.geometry.type === 'Point') {
      mapped.push({
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: {
          type: 'Point',
          coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features: mapped,
  };
}

const INITIAL_DRAW_FEATURES: SpatialFeatureCollection = toSpatialFeatureCollection(
  EXCLUSION_GEOJSON_FEATURES,
);

const DEFAULT_FACILITY_ADDRESS = JSON.stringify({
  street: '4820 County Road 1140, Compressor Pad B-4',
  street2: 'SCADA Telemetry Shelter #2',
  city: 'Midland',
  region: 'TX',
  postalCode: '79706',
  country: 'US',
});

const SPATIAL_CONTEXT_MENU_ITEMS: ReadonlyArray<ContextMenuItem> = Object.freeze([
  {
    id: 'ctx-task-sat',
    value: 'task-sat-revisit',
    label: 'Task AtmosSat-4 Rapid Revisit',
    shortcut: 'Shift+R',
  },
  {
    id: 'ctx-dispatch-uav',
    value: 'dispatch-uav-07',
    label: 'Dispatch UAV-07 OGI Sweep',
    shortcut: 'Shift+U',
  },
  {
    id: 'ctx-export',
    value: 'export-bundle',
    label: 'Export Plume Telemetry',
    children: [
      { id: 'ctx-exp-geojson', value: 'export-geojson', label: 'GeoJSON Plume Contours (.geojson)' },
      { id: 'ctx-exp-ogmp', value: 'export-ogmp', label: 'OGMP 2.0 Level 5 Dossier (.json)' },
    ],
  },
  {
    id: 'ctx-sep-1',
    value: 'sep-1',
    label: 'Separator',
    separator: true,
  },
  {
    id: 'ctx-isolate',
    value: 'scada-isolate-xv402',
    label: 'Stage Valve XV-402 Isolation Advisory',
  },
]);

const MASONRY_EVIDENCE_CARDS = Object.freeze([
  {
    id: 'ev-swir',
    index: 0,
    badge: 'SWIR 1650 nm',
    variant: 'danger' as const,
    title: 'Pad B-4 Column Enhancement',
    metric: '+1,840 ppb CH4 · 142.8 kg/hr',
    summary:
      'Matched-filter retrieval confirms concentrated point-source plume originating at Isolation Valve XV-402.',
    src: withBasePath('/media/plume-swir.svg'),
    alt: 'SWIR 1650nm methane column retrieval over Permian Pad B-4',
  },
  {
    id: 'ev-rgb',
    index: 1,
    badge: 'RGB Framing',
    variant: 'success' as const,
    title: 'Cloud-Free Optical Co-Registration',
    metric: '0.0% Cloud · 25 m GSD',
    summary:
      'Simultaneous nadir optical pass verifies zero flare combustion dropout and unobstructed pad access roads.',
    src: withBasePath('/media/plume-optical.svg'),
    alt: 'True-color optical pass over Permian Pad B-4',
  },
  {
    id: 'ev-thermal',
    index: 2,
    badge: 'MWIR OGI Drone',
    variant: 'warning' as const,
    title: 'Joule-Thomson Flange Cooling',
    metric: 'ΔT -6.4 °C @ 18 m AGL',
    summary:
      'UAV-07 mid-wave infrared hover isolates high-velocity gas jetting along west flange gasket of XV-402.',
    src: withBasePath('/media/drone-pad-thermal.svg'),
    alt: 'Mid-wave infrared OGI drone frame of Valve Manifold XV-402',
  },
  {
    id: 'ev-payload',
    index: 3,
    badge: 'Payload Twin',
    variant: 'accent' as const,
    title: 'AtmosSat-4 Grating Calibration',
    metric: '0.30 nm FWHM · SNR 412',
    summary:
      'On-orbit solar diffuser calibration confirms zero spectral smile drift prior to Permian Sector pass #14892.',
    src: withBasePath('/media/orbital-spectrometer-poster.svg'),
    alt: 'AtmosSat-4 Nadir SWIR imaging spectrometer schematic',
  },
]);

function readStringUi(ui: Record<string, unknown>, key: string, fallback: string): string {
  const val = ui[key];
  return typeof val === 'string' && val.length > 0 ? val : fallback;
}

function readNumberUi(ui: Record<string, unknown>, key: string, fallback: number): number {
  const val = ui[key];
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function readBooleanUi(ui: Record<string, unknown>, key: string, fallback = false): boolean {
  const val = ui[key];
  return typeof val === 'boolean' ? val : fallback;
}

function readStringArrayUi(
  ui: Record<string, unknown>,
  key: string,
  fallback: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const val = ui[key];
  if (Array.isArray(val) && val.every((item): item is string => typeof item === 'string')) {
    return val;
  }
  return fallback;
}

export const spatialView: AtmosViewModule = {
  id: 'spatial',
  path: '/spatial',
  title: 'Spatial Plume Twin & Facility Command',
  subtitle:
    'Offline MapLibre basin telemetry, indoor compressor laser-sensor zones, Houston shift consoles, 3D orbital spectrometer twin, and multi-spectral drone annotation.',
  badge: '34 Spatial Tags',
  ownedTags: getTagsForSlice('view-spatial'),

  render(state: AtmosState, actions: AtmosActions): TemplateResult {
    const ui = state.ui;

    const cascaderValue = readStringUi(ui, 'spatial.cascaderValue', 'na/permian/midland-b4');
    const activePlumeId = readStringUi(ui, 'spatial.activePlumeId', PLUME_MAP_MARKERS[0].id);
    const activePlume =
      PLUME_MAP_MARKERS.find((m) => m.id === activePlumeId) ?? PLUME_MAP_MARKERS[0];

    const mapCenterLat = readNumberUi(ui, 'spatial.mapCenterLat', activePlume.lat);
    const mapCenterLng = readNumberUi(ui, 'spatial.mapCenterLng', activePlume.lng);
    const mapZoom = readNumberUi(ui, 'spatial.mapZoom', 8.5);
    const clusterZoom = readNumberUi(ui, 'spatial.clusterZoom', 3);
    const selectedClusterSummary = readStringUi(
      ui,
      'spatial.clusterSummary',
      '8 global super-emitter stations tracked across 4 basins',
    );

    const drawMode = readStringUi(ui, 'spatial.drawMode', 'polygon') as DrawMode;
    const drawFeatures =
      (ui['spatial.drawFeatures'] as SpatialFeatureCollection | undefined) ?? INITIAL_DRAW_FEATURES;
    const splitRatio = readNumberUi(ui, 'spatial.splitRatio', 0.52);
    const routeUnit = (readStringUi(ui, 'spatial.routeUnit', 'km') === 'mi' ? 'mi' : 'km') as
      | 'km'
      | 'mi';
    const activeWaypointLabel = readStringUi(
      ui,
      'spatial.activeWaypoint',
      SNIFFER_ROUTE.origin.label,
    );

    const selectedRooms = readStringArrayUi(ui, 'spatial.selectedRooms', [
      'bay-comp-2',
      'manifold-yard',
    ]);
    const selectedSeatsValue = readStringUi(ui, 'spatial.selectedSeats', 'MC-A2,MC-B1');

    const autoRotate3d = readBooleanUi(ui, 'spatial.autoRotate3d', false);
    const orbitTheta = readNumberUi(ui, 'spatial.orbitTheta', 24);
    const orbitPhi = readNumberUi(ui, 'spatial.orbitPhi', 72);
    const zoomPanScale = readNumberUi(ui, 'spatial.zoomPanScale', 1);

    const comparePosition = readNumberUi(ui, 'spatial.comparePosition', 54);
    const annotatorTool = readStringUi(ui, 'spatial.annotatorTool', 'rect') as AnnotationTool;
    const annotations =
      (ui['spatial.annotations'] as ReadonlyArray<ImageAnnotation> | undefined) ??
      THERMAL_ANNOTATIONS;

    const galleryIndex = readNumberUi(ui, 'spatial.galleryIndex', 0);
    const lightboxIndex = readNumberUi(ui, 'spatial.lightboxIndex', 0);
    const cropZoom = readNumberUi(ui, 'spatial.cropZoom', 1.15);
    const sketchTool = (readStringUi(ui, 'spatial.sketchTool', 'pen') === 'eraser'
      ? 'eraser'
      : 'pen') as DrawingTool;
    const sketchStrokeCount = readNumberUi(ui, 'spatial.sketchStrokes', 0);

    const wellheadCoords = readStringUi(ui, 'spatial.wellheadCoords', '31.9500, -102.1800');
    const facilityAddress = readStringUi(
      ui,
      'spatial.facilityAddress',
      DEFAULT_FACILITY_ADDRESS,
    );

    const layerSwirChecked = readBooleanUi(ui, 'spatial.layerSwir', true);
    const layerConeChecked = readBooleanUi(ui, 'spatial.layerCone', true);
    const layerTfrChecked = readBooleanUi(ui, 'spatial.layerTfr', false);

    // Overlay open states — all false by default so first-byte SSR HTML renders every tag cleanly without obscuring content
    const tooltipOpen = readBooleanUi(ui, 'spatial.tooltipOpen', false);
    const hoverCardOpen = readBooleanUi(ui, 'spatial.hoverCardOpen', false);
    const windPopoverOpen = readBooleanUi(ui, 'spatial.windPopoverOpen', false);
    const layerMenuOpen = readBooleanUi(ui, 'spatial.layerMenuOpen', false);
    const contextMenuOpen = readBooleanUi(ui, 'spatial.contextMenuOpen', false);
    const floatingHudOpen = readBooleanUi(ui, 'spatial.floatingHudOpen', false);
    const stationDrawerOpen = readBooleanUi(ui, 'spatial.stationDrawerOpen', false);
    const fieldSheetOpen = readBooleanUi(ui, 'spatial.fieldSheetOpen', false);
    const sheetDetent = readStringUi(ui, 'spatial.sheetDetent', 'half') as BottomSheetDetent;
    const fullscreenOpen = readBooleanUi(ui, 'spatial.fullscreenOpen', false);
    const lightboxOpen = readBooleanUi(ui, 'spatial.lightboxOpen', false);

    return html`
      <mth-stack data-gap="6">
        <!-- Command Bar: Cascader + Contextual Overlays + Workspace Triggers -->
        <section class="atmos-surface-card" aria-label="Spatial facility selector and overlay controls">
          <mth-stack data-gap="4">
            <div class="atmos-section-header">
              <mth-flex data-gap="3">
                <mth-badge variant="accent" pill>ORBIT #14892</mth-badge>
                <strong>Permian Basin Spatial Digital Twin</strong>
                <span class="atmos-mono-pill">${activePlume.label}</span>
              </mth-flex>

              <mth-flex data-gap="2">
                <mth-tooltip
                  ?open=${tooltipOpen}
                  content="Re-aligns SWIR 1650 nm retrieval grid with live 6.2 m/s 248° mast telemetry"
                  placement="bottom"
                  @mth-open=${() => actions.updateViewUi('spatial.tooltipOpen', true)}
                  @mth-close=${() => actions.updateViewUi('spatial.tooltipOpen', false)}
                >
                  <mth-button
                    variant="soft"
                    size="sm"
                    @mth-press=${() => {
                      actions.updateViewUi('spatial.mapCenterLat', activePlume.lat);
                      actions.updateViewUi('spatial.mapCenterLng', activePlume.lng);
                      actions.updateViewUi('spatial.mapZoom', 9.2);
                      actions.notify(
                        `Synchronized nadir pass onto ${activePlume.label}`,
                        'success',
                      );
                    }}
                  >
                    Sync Orbital Pass
                  </mth-button>
                </mth-tooltip>

                <mth-hover-card
                  ?open=${hoverCardOpen}
                  placement="bottom"
                  label="AtmosSat-4 Orbital Ephemeris"
                  @mth-open=${() => actions.updateViewUi('spatial.hoverCardOpen', true)}
                  @mth-close=${() => actions.updateViewUi('spatial.hoverCardOpen', false)}
                >
                  <mth-button
                    slot="trigger"
                    variant="outline"
                    size="sm"
                    @mth-press=${() =>
                      actions.updateViewUi('spatial.hoverCardOpen', !hoverCardOpen)}
                  >
                    AtmosSat-4 Ephemeris
                  </mth-button>
                  <mth-stack data-gap="2">
                    <strong>AtmosSat-4 Sun-Synchronous Pass</strong>
                    <span class="atmos-mono-pill">Alt 512 km · Inc 97.4° · FWHM 0.30 nm</span>
                    <p>
                      Next Permian Midland nadir window in 14m 20s with 0% cloud fraction and
                      validated solar-diffuser dark current baseline.
                    </p>
                  </mth-stack>
                </mth-hover-card>

                <mth-popover
                  ?open=${windPopoverOpen}
                  placement="bottom"
                  label="Meteorological Wind Vector Calibration"
                  @mth-open=${() => actions.updateViewUi('spatial.windPopoverOpen', true)}
                  @mth-close=${() => actions.updateViewUi('spatial.windPopoverOpen', false)}
                >
                  <mth-button
                    slot="trigger"
                    variant="outline"
                    size="sm"
                    @mth-press=${() =>
                      actions.updateViewUi('spatial.windPopoverOpen', !windPopoverOpen)}
                  >
                    Wind Vector: 248° · 6.2 m/s
                  </mth-button>
                  <mth-stack data-gap="3">
                    <strong>Gaussian Plume Wind Calibration</strong>
                    <p>
                      Ultrasonic anemometer Mast #3 confirms Pasquill-Gifford stability class C
                      across Pad B-4.
                    </p>
                    <mth-flex data-gap="2">
                      <mth-button
                        size="sm"
                        variant="soft"
                        @mth-press=${() => {
                          actions.updateViewUi('spatial.windPopoverOpen', false);
                          actions.notify('Applied 10 m sonic anemometer vector lock', 'info');
                        }}
                      >
                        Lock Sonic Mast #3
                      </mth-button>
                    </mth-flex>
                  </mth-stack>
                </mth-popover>

                <mth-dropdown-menu
                  ?open=${layerMenuOpen}
                  placement="bottom-end"
                  label="Spatial Layer & Export Menu"
                  @mth-open=${() => actions.updateViewUi('spatial.layerMenuOpen', true)}
                  @mth-close=${() => actions.updateViewUi('spatial.layerMenuOpen', false)}
                  @mth-select=${(event: CustomEvent<{ value?: string }>) => {
                    const val = event.detail?.value ?? '';
                    if (val === 'toggle-swir') {
                      actions.updateViewUi('spatial.layerSwir', !layerSwirChecked);
                    } else if (val === 'toggle-cone') {
                      actions.updateViewUi('spatial.layerCone', !layerConeChecked);
                    } else if (val === 'toggle-tfr') {
                      actions.updateViewUi('spatial.layerTfr', !layerTfrChecked);
                    }
                    actions.notify(`Spatial layer action: ${val || 'updated'}`, 'info');
                  }}
                >
                  <mth-button slot="trigger" variant="soft" size="sm">
                    Spatial Layers &amp; Export
                  </mth-button>
                  <mth-menu-item value="toggle-swir" type="checkbox" ?checked=${layerSwirChecked}>
                    SWIR 1650 nm Retrieval Layer
                  </mth-menu-item>
                  <mth-menu-item value="toggle-cone" type="checkbox" ?checked=${layerConeChecked}>
                    Downwind Dispersion Cone
                  </mth-menu-item>
                  <mth-menu-item value="toggle-tfr" type="checkbox" ?checked=${layerTfrChecked}>
                    FAA UAV Flight Perimeter
                  </mth-menu-item>
                  <mth-menu-item value="export-package" shortcut="Shift+E">
                    Export Regulatory GIS Package
                    <mth-menu-item slot="submenu" value="export-geojson">
                      GeoJSON FeatureCollection
                    </mth-menu-item>
                    <mth-menu-item slot="submenu" value="export-ogmp">
                      OGMP 2.0 Level 5 Manifest
                    </mth-menu-item>
                  </mth-menu-item>
                </mth-dropdown-menu>
              </mth-flex>
            </div>

            <mth-grid data-columns="2" data-gap="4">
              <mth-cascader
                name="basinAssetPath"
                separator="/"
                .value=${cascaderValue}
                .options=${BASIN_CASCADER_OPTIONS}
                label="Hierarchical Basin → Facility → Pad Selector"
                placeholder="Select Region / Basin / Pad..."
                hint="Drills across global shale & gathering assets"
                clearable
                change-on-select
                @mth-change=${(event: CustomEvent<CascaderChangeDetail>) => {
                  const nextVal = event.detail?.value ?? '';
                  actions.updateViewUi('spatial.cascaderValue', nextVal);
                  actions.notify(`Focused spatial asset path: ${nextVal || 'All Basins'}`, 'info');
                }}
              ></mth-cascader>

              <mth-stack data-gap="2">
                <span><strong>Workspace &amp; Tactical Overlays</strong></span>
                <mth-flex data-gap="2">
                  <mth-button
                    size="sm"
                    variant=${floatingHudOpen ? 'solid' : 'outline'}
                    @mth-press=${() =>
                      actions.updateViewUi('spatial.floatingHudOpen', !floatingHudOpen)}
                  >
                    ${floatingHudOpen ? 'Hide TDLAS HUD' : 'Open TDLAS Floating HUD'}
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="outline"
                    @mth-press=${() => actions.updateViewUi('spatial.stationDrawerOpen', true)}
                  >
                    Station B-4 Drawer
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="outline"
                    @mth-press=${() => actions.updateViewUi('spatial.fieldSheetOpen', true)}
                  >
                    Intercept Bottom Sheet
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="outline"
                    @mth-press=${() => actions.updateViewUi('spatial.lightboxOpen', true)}
                  >
                    Spectral Lightbox
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="soft"
                    @mth-press=${() => actions.updateViewUi('spatial.fullscreenOpen', true)}
                  >
                    Fullscreen Theater
                  </mth-button>
                </mth-flex>
              </mth-stack>
            </mth-grid>
          </mth-stack>
        </section>

        <!-- Section 1: Resizable Basin Plume Map + Global Super-Emitter Clusters + Split Draw/Route -->
        <section class="atmos-surface-card" aria-label="Basin telemetry maps, perimeter drawing, and intercept routing">
          <mth-stack data-gap="5">
            <div class="atmos-section-header">
              <mth-flex data-gap="3">
                <h3>1. Offline Basin Vector Telemetry &amp; Constellation Clusters</h3>
                <mth-badge variant="danger" dot>142.8 kg/hr Super-Emitter Active</mth-badge>
              </mth-flex>
              <mth-flex data-gap="2">
                <mth-button
                  size="sm"
                  variant="ghost"
                  @mth-press=${() =>
                    actions.updateViewUi('spatial.contextMenuOpen', !contextMenuOpen)}
                >
                  ${contextMenuOpen ? 'Close Pad Actions' : 'Pad Context Menu'}
                </mth-button>
              </mth-flex>
            </div>

            <mth-resizable-group orientation="horizontal">
              <mth-resizable-panel default-size="60" min-size="35">
                <mth-context-menu
                  ?open=${contextMenuOpen}
                  label="Pad B-4 Tactical Spatial Actions"
                  .items=${SPATIAL_CONTEXT_MENU_ITEMS}
                  @mth-open=${() => actions.updateViewUi('spatial.contextMenuOpen', true)}
                  @mth-close=${() => actions.updateViewUi('spatial.contextMenuOpen', false)}
                  @mth-select=${(event: CustomEvent<{ value?: string; item?: ContextMenuItem }>) => {
                    const actionName = event.detail?.item?.label ?? event.detail?.value ?? 'action';
                    actions.updateViewUi('spatial.contextMenuOpen', false);
                    actions.notify(`Executed tactical command: ${actionName}`, 'success');
                  }}
                >
                  <mth-stack data-gap="3">
                    <mth-map
                      .mapStyle=${OFFLINE_BASIN_MAP_STYLE}
                      .markers=${PLUME_MAP_MARKERS}
                      center-lat=${mapCenterLat}
                      center-lng=${mapCenterLng}
                      zoom=${mapZoom}
                      min-zoom="3"
                      max-zoom="16"
                      interactive
                      label="Permian Basin Offline SWIR Methane Plume Map"
                      @mth-marker-select=${(
                        event: CustomEvent<{ id: string; lat: number; lng: number; label: string }>,
                      ) => {
                        actions.updateViewUi('spatial.activePlumeId', event.detail.id);
                        actions.updateViewUi('spatial.mapCenterLat', event.detail.lat);
                        actions.updateViewUi('spatial.mapCenterLng', event.detail.lng);
                        actions.notify(`Selected plume marker: ${event.detail.label}`, 'warning');
                      }}
                      @mth-map-move=${(
                        event: CustomEvent<{ center: readonly [number, number]; zoom: number }>,
                      ) => {
                        actions.updateViewUi('spatial.mapCenterLng', event.detail.center[0]);
                        actions.updateViewUi('spatial.mapCenterLat', event.detail.center[1]);
                        actions.updateViewUi('spatial.mapZoom', event.detail.zoom);
                      }}
                    ></mth-map>

                    <mth-flex data-justify="between" data-gap="2">
                      <mth-flex data-gap="2">
                        ${PLUME_MAP_MARKERS.map(
                          (marker) => html`
                            <mth-button
                              size="sm"
                              variant=${marker.id === activePlume.id ? 'solid' : 'outline'}
                              @mth-press=${() => {
                                actions.updateViewUi('spatial.activePlumeId', marker.id);
                                actions.updateViewUi('spatial.mapCenterLat', marker.lat);
                                actions.updateViewUi('spatial.mapCenterLng', marker.lng);
                                actions.announce(`Centered basin map on ${marker.label}`);
                              }}
                            >
                              ${marker.label.split(' · ')[0]}
                            </mth-button>
                          `,
                        )}
                      </mth-flex>
                      <span class="atmos-mono-pill">
                        Right-click map card or use button for Pad Context Menu
                      </span>
                    </mth-flex>
                  </mth-stack>
                </mth-context-menu>
              </mth-resizable-panel>

              <mth-resizable-handle
                orientation="horizontal"
                label="Resize Permian plume map and global super-emitter cluster panel"
              ></mth-resizable-handle>

              <mth-resizable-panel default-size="40" min-size="25" collapsible>
                <mth-stack data-gap="3">
                  <mth-map-cluster
                    .points=${GLOBAL_EMITTER_CLUSTERS}
                    zoom=${clusterZoom}
                    radius="52"
                    max-zoom="16"
                    label="Global Super-Emitter Constellation Clusters"
                    @mth-cluster-expand=${(
                      event: CustomEvent<{ count: number; zoom: number; clusterId: string }>,
                    ) => {
                      actions.updateViewUi('spatial.clusterZoom', event.detail.zoom);
                      actions.updateViewUi(
                        'spatial.clusterSummary',
                        `Expanded ${event.detail.clusterId} (${event.detail.count} emitters) at zoom ${event.detail.zoom}`,
                      );
                    }}
                    @mth-cluster-select=${(
                      event: CustomEvent<{ point: { id: string; label?: string } }>,
                    ) => {
                      const label = event.detail.point.label ?? event.detail.point.id;
                      actions.updateViewUi('spatial.clusterSummary', `Focused station: ${label}`);
                      actions.notify(`Focused global emitter: ${label}`, 'info');
                    }}
                  ></mth-map-cluster>

                  <span class="atmos-mono-pill">${selectedClusterSummary}</span>

                  <mth-card variant="subtle">
                    <span slot="header"><strong>AtmosSat-4 Nadir Telemetry Pulse</strong></span>
                    <mth-lottie
                      src=${withBasePath('/media/orbit-pulse.json')}
                      .animationData=${ORBIT_PULSE_LOTTIE_DATA}
                      loop
                      controls
                      label="AtmosSat-4 Orbital Pass Telemetry Animation"
                      @mth-play=${() => actions.announce('Orbital telemetry pulse playing')}
                      @mth-pause=${() => actions.announce('Orbital telemetry pulse paused')}
                    ></mth-lottie>
                  </mth-card>
                </mth-stack>
              </mth-resizable-panel>
            </mth-resizable-group>

            <div class="mth-divider">Perimeter Exclusion Zone &amp; Mobile Sniffer Dispatch</div>

            <mth-split-pane
              orientation="horizontal"
              ratio=${splitRatio}
              min-ratio="0.25"
              max-ratio="0.75"
              label="Split exclusion-zone GeoJSON editor and mobile sniffer route planner"
              @mth-resize=${(event: CustomEvent<{ ratio?: number }>) => {
                if (typeof event.detail?.ratio === 'number') {
                  actions.updateViewUi('spatial.splitRatio', event.detail.ratio);
                }
              }}
            >
              <div slot="start">
                <mth-stack data-gap="2">
                  <mth-flex data-justify="between">
                    <strong>Downwind Safety Perimeter &amp; UAV Transect</strong>
                    <mth-badge variant="warning">
                      ${drawFeatures.features.length} GeoJSON Features · Mode: ${drawMode}
                    </mth-badge>
                  </mth-flex>
                  <mth-map-draw
                    mode=${drawMode}
                    .features=${drawFeatures}
                    label="Downwind Plume Safety Perimeter & UAV Transect Editor"
                    @mth-draw-mode=${(event: CustomEvent<{ mode: DrawMode }>) => {
                      actions.updateViewUi('spatial.drawMode', event.detail.mode);
                    }}
                    @mth-draw-change=${(
                      event: CustomEvent<{ features: SpatialFeatureCollection }>,
                    ) => {
                      actions.updateViewUi('spatial.drawFeatures', event.detail.features);
                      actions.notify(
                        `Updated exclusion perimeter (${event.detail.features.features.length} features)`,
                        'info',
                      );
                    }}
                  ></mth-map-draw>
                </mth-stack>
              </div>

              <div slot="end">
                <mth-stack data-gap="2">
                  <mth-flex data-justify="between">
                    <strong>LDAR Sniffer Van #12 Intercept Route</strong>
                    <mth-flex data-gap="2">
                      <span class="atmos-mono-pill">Stop: ${activeWaypointLabel}</span>
                      <mth-button
                        size="sm"
                        variant="outline"
                        @mth-press=${() =>
                          actions.updateViewUi(
                            'spatial.routeUnit',
                            routeUnit === 'km' ? 'mi' : 'km',
                          )}
                      >
                        Unit: ${routeUnit.toUpperCase()}
                      </mth-button>
                    </mth-flex>
                  </mth-flex>
                  <mth-map-route
                    .origin=${SNIFFER_ROUTE.origin}
                    .destination=${SNIFFER_ROUTE.destination}
                    .waypoints=${SNIFFER_ROUTE.waypoints}
                    unit=${routeUnit}
                    label="Mobile TDLAS Sniffer Van Intercept Route"
                    @mth-waypoint-select=${(
                      event: CustomEvent<{ waypoint: { label?: string }; index: number }>,
                    ) => {
                      const stopLabel =
                        event.detail.waypoint.label ?? `Checkpoint #${event.detail.index + 1}`;
                      actions.updateViewUi('spatial.activeWaypoint', stopLabel);
                      actions.notify(`Selected intercept waypoint: ${stopLabel}`, 'info');
                    }}
                    @mth-route-fit=${(event: CustomEvent<{ distanceKm: number }>) => {
                      actions.announce(
                        `Fitted route bounds (${event.detail.distanceKm.toFixed(1)} km)`,
                      );
                    }}
                  ></mth-map-route>
                </mth-stack>
              </div>
            </mth-split-pane>
          </mth-stack>
        </section>

        <!-- Section 2: Indoor Compressor Floor Plan, Shift Console Seat Map & 3D Spectrometer Twin -->
        <section class="atmos-surface-card" aria-label="Indoor facility zones, mission control desks, and 3D spectrometer hardware twin">
          <mth-stack data-gap="5">
            <div class="atmos-section-header">
              <mth-flex data-gap="3">
                <h3>2. Compressor Station B-4 Interior, Shift Consoles &amp; 3D Spectrometer Twin</h3>
                <mth-badge variant="accent">Three.js glTF 2.0 + SVG Spatial</mth-badge>
              </mth-flex>
              <span class="atmos-mono-pill">
                Active Zones: ${selectedRooms.length} · Shift Desks: ${selectedSeatsValue || 'None'}
              </span>
            </div>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Permian Compressor Station B-4 · Indoor TDLAS Laser Zones</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-floor-plan
                    .rooms=${COMPRESSOR_FLOOR_PLAN_ROOMS}
                    .selectedIds=${selectedRooms}
                    level="1"
                    multiple
                    label="Compressor Station B-4 Indoor Laser-Sensor Floor Plan"
                    @mth-room-select=${(
                      event: CustomEvent<{
                        selectedIds: ReadonlyArray<string>;
                        room: { id: string; name: string };
                      }>,
                    ) => {
                      actions.updateViewUi('spatial.selectedRooms', [...event.detail.selectedIds]);
                      actions.notify(`Toggled sensor zone: ${event.detail.room.name}`, 'info');
                    }}
                  ></mth-floor-plan>
                  <span class="atmos-mono-pill">
                    Monitored Bays: ${selectedRooms.join(', ') || 'None selected'}
                  </span>
                </mth-stack>
              </mth-card>

              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Houston Orbital Command · Shift Console Assignments</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-seat-map
                    name="shiftConsoles"
                    .value=${selectedSeatsValue}
                    .seats=${MISSION_CONTROL_SEATS}
                    columns="4"
                    multiple
                    label="Houston Mission Control Shift Desk Assignments"
                    @mth-seat-select=${(
                      event: CustomEvent<{
                        selectedIds: ReadonlyArray<string>;
                        seat: { id: string; label?: string };
                      }>,
                    ) => {
                      const csv = event.detail.selectedIds.join(',');
                      actions.updateViewUi('spatial.selectedSeats', csv);
                      actions.notify(
                        `Shift console assignment updated: ${event.detail.seat.label ?? event.detail.seat.id}`,
                        'success',
                      );
                    }}
                  ></mth-seat-map>
                  <span class="atmos-mono-pill">
                    Assigned Operator Consoles: ${selectedSeatsValue || 'Unassigned'}
                  </span>
                </mth-stack>
              </mth-card>
            </mth-grid>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>AtmosSat-4 Nadir SWIR Spectrometer · 3D Hardware Twin</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-model-viewer
                    src=${withBasePath('/media/orbital-spectrometer.gltf')}
                    poster=${withBasePath('/media/orbital-spectrometer-poster.svg')}
                    alt="AtmosSat-4 Nadir SWIR Imaging Spectrometer 3D Hardware Twin"
                    camera-orbit-theta=${orbitTheta}
                    camera-orbit-phi=${orbitPhi}
                    camera-distance="4.2"
                    exposure="1.05"
                    ?auto-rotate=${autoRotate3d}
                    show-controls
                    @mth-camera-change=${(
                      event: CustomEvent<{ theta: number; phi: number; distance: number }>,
                    ) => {
                      actions.updateViewUi('spatial.orbitTheta', event.detail.theta);
                      actions.updateViewUi('spatial.orbitPhi', event.detail.phi);
                    }}
                  ></mth-model-viewer>
                  <mth-flex data-justify="between" data-gap="2">
                    <mth-flex data-gap="2">
                      <mth-button
                        size="sm"
                        variant="outline"
                        @mth-press=${() => {
                          actions.updateViewUi('spatial.orbitTheta', 0);
                          actions.updateViewUi('spatial.orbitPhi', 65);
                        }}
                      >
                        Nadir Optical Port
                      </mth-button>
                      <mth-button
                        size="sm"
                        variant="outline"
                        @mth-press=${() => {
                          actions.updateViewUi('spatial.orbitTheta', 135);
                          actions.updateViewUi('spatial.orbitPhi', 80);
                        }}
                      >
                        Cryo-Radiator Side
                      </mth-button>
                      <mth-button
                        size="sm"
                        variant=${autoRotate3d ? 'solid' : 'soft'}
                        @mth-press=${() =>
                          actions.updateViewUi('spatial.autoRotate3d', !autoRotate3d)}
                      >
                        ${autoRotate3d ? 'Stop Turntable' : 'Auto-Rotate Twin'}
                      </mth-button>
                    </mth-flex>
                    <span class="atmos-mono-pill">θ ${orbitTheta}° · φ ${orbitPhi}°</span>
                  </mth-flex>
                </mth-stack>
              </mth-card>

              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Cryo-Grating Focal Plane Inspection (Zoom &amp; Pan Viewport)</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-zoom-pan
                    scale=${zoomPanScale}
                    min-scale="0.5"
                    max-scale="3"
                    step="0.25"
                    show-controls
                    label="Zoomable AtmosSat-4 Focal Plane Schematic"
                    @mth-change=${(event: CustomEvent<{ scale: number }>) => {
                      actions.updateViewUi('spatial.zoomPanScale', event.detail.scale);
                    }}
                  >
                    <mth-image
                      src=${withBasePath('/media/orbital-spectrometer-poster.svg')}
                      fallback-src=${withBasePath('/media/plume-swir.svg')}
                      alt="AtmosSat-4 SWIR imaging spectrometer optical bench schematic"
                      aspect-ratio="16/9"
                      fit="contain"
                      rounded
                    ></mth-image>
                  </mth-zoom-pan>
                  <span class="atmos-mono-pill">
                    Magnification: ${(zoomPanScale * 100).toFixed(0)}% · HgCdTe 1650 nm Detector
                    Array
                  </span>
                </mth-stack>
              </mth-card>
            </mth-grid>
          </mth-stack>
        </section>

        <!-- Section 3: Optical vs SWIR Comparison, Thermal Annotator, Gallery, Masonry, Cropper, Sketch & Site Dispatch -->
        <section class="atmos-surface-card" aria-label="Multi-spectral plume comparison, thermal annotation, and field dispatch calibration">
          <mth-stack data-gap="5">
            <div class="atmos-section-header">
              <mth-flex data-gap="3">
                <h3>3. Multi-Spectral Plume Retrieval, Thermal Annotation &amp; Site Calibration</h3>
                <mth-badge variant="success">100% Offline SVG/glTF Media</mth-badge>
              </mth-flex>
              <span class="atmos-mono-pill">
                SWIR Split: ${comparePosition}% · Annotations: ${annotations.length}
              </span>
            </div>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Co-Registered Optical RGB vs. SWIR 1650 nm Plume Scrubber</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-before-after
                    position=${comparePosition}
                    step="5"
                    before-label="Optical RGB Framing"
                    after-label="SWIR 1650 nm CH4 (+1,840 ppb)"
                    label="Compare true-color optical pass and SWIR methane plume enhancement"
                    @mth-change=${(event: CustomEvent<{ position?: number; value?: number }>) => {
                      const nextPos = event.detail?.position ?? event.detail?.value;
                      if (typeof nextPos === 'number') {
                        actions.updateViewUi('spatial.comparePosition', nextPos);
                      }
                    }}
                  >
                    <mth-image
                      slot="before"
                      src=${withBasePath('/media/plume-optical.svg')}
                      alt="True-color RGB pass over Permian Pad B-4"
                      aspect-ratio="16/9"
                      fit="cover"
                    ></mth-image>
                    <mth-image
                      slot="after"
                      src=${withBasePath('/media/plume-swir.svg')}
                      alt="SWIR 1650 nm methane column enhancement over Permian Pad B-4"
                      aspect-ratio="16/9"
                      fit="cover"
                    ></mth-image>
                  </mth-before-after>
                  <span class="atmos-mono-pill">
                    Drag divider or use ArrowLeft/ArrowRight to scrub CH4 column enhancement
                  </span>
                </mth-stack>
              </mth-card>

              <mth-card variant="outlined">
                <span slot="header">
                  <strong>UAV-07 OGI Thermal Plume Vector Annotator</strong>
                </span>
                <mth-image-annotator
                  src=${withBasePath('/media/drone-pad-thermal.svg')}
                  alt="UAV-07 mid-wave infrared frame of Valve Manifold XV-402"
                  tool=${annotatorTool}
                  .annotations=${annotations}
                  label="UAV-07 Thermal Plume Annotation Workspace"
                  @mth-tool-change=${(event: CustomEvent<{ tool: AnnotationTool }>) => {
                    actions.updateViewUi('spatial.annotatorTool', event.detail.tool);
                  }}
                  @mth-annotation-change=${(
                    event: CustomEvent<{ annotations: ReadonlyArray<ImageAnnotation> }>,
                  ) => {
                    actions.updateViewUi('spatial.annotations', [...event.detail.annotations]);
                  }}
                ></mth-image-annotator>
              </mth-card>
            </mth-grid>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Multi-Sensor Pass Carousel &amp; Thumbnail Gallery</strong>
                </span>
                <mth-gallery
                  .items=${PLUME_GALLERY_ITEMS}
                  active-index=${galleryIndex}
                  loop
                  show-thumbnails
                  label="Multi-Sensor Plume Pass Evidence Gallery"
                  @mth-change=${(event: CustomEvent<{ index?: number }>) => {
                    if (typeof event.detail?.index === 'number') {
                      actions.updateViewUi('spatial.galleryIndex', event.detail.index);
                    }
                  }}
                ></mth-gallery>
              </mth-card>

              <mth-stack data-gap="3">
                <strong>Spectral Retrieval Evidence Masonry</strong>
                <mth-masonry columns="2" min-column-width="210" gap="0.75rem">
                  ${MASONRY_EVIDENCE_CARDS.map(
                    (card) => html`
                      <mth-card variant="subtle">
                        <mth-flex slot="header" data-justify="between" data-gap="2">
                          <mth-badge variant=${card.variant} size="sm">${card.badge}</mth-badge>
                          <span class="atmos-mono-pill">${card.metric}</span>
                        </mth-flex>
                        <mth-stack data-gap="2">
                          <strong>${card.title}</strong>
                          <p>${card.summary}</p>
                        </mth-stack>
                        <mth-button
                          slot="footer"
                          size="sm"
                          variant="ghost"
                          @mth-press=${() => {
                            actions.updateViewUi('spatial.lightboxIndex', card.index);
                            actions.updateViewUi('spatial.lightboxOpen', true);
                          }}
                        >
                          Inspect in Lightbox
                        </mth-button>
                      </mth-card>
                    `,
                  )}
                </mth-masonry>
              </mth-stack>
            </mth-grid>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Thermal Plume Region-of-Interest (ROI) Cropper</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-image-cropper
                    src=${withBasePath('/media/drone-pad-thermal.svg')}
                    alt="Crop thermal ROI around Isolation Valve XV-402"
                    aspect-ratio="1.5"
                    zoom=${cropZoom}
                    @mth-change=${(event: CustomEvent<{ zoom?: number }>) => {
                      if (typeof event.detail?.zoom === 'number') {
                        actions.updateViewUi('spatial.cropZoom', event.detail.zoom);
                      }
                    }}
                  ></mth-image-cropper>
                  <mth-flex data-justify="between">
                    <span class="atmos-mono-pill">ROI Aspect 3:2 · Zoom ${cropZoom.toFixed(2)}x</span>
                    <mth-button
                      size="sm"
                      variant="soft"
                      @mth-press=${() =>
                        actions.notify('Attached cropped XV-402 thermal ROI to work order', 'success')}
                    >
                      Attach ROI to Work Order
                    </mth-button>
                  </mth-flex>
                </mth-stack>
              </mth-card>

              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Field Technician Valve-Flange Leak Sketchpad</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-drawing-pad
                    tool=${sketchTool}
                    stroke-width="3"
                    stroke-color="#14b8a6"
                    label="Field Technician Valve-Flange Leak Sketchpad"
                    @mth-change=${(event: CustomEvent<{ strokeCount?: number }>) => {
                      actions.updateViewUi(
                        'spatial.sketchStrokes',
                        event.detail?.strokeCount ?? sketchStrokeCount + 1,
                      );
                    }}
                  ></mth-drawing-pad>
                  <mth-flex data-justify="between" data-gap="2">
                    <mth-flex data-gap="2">
                      <mth-button
                        size="sm"
                        variant=${sketchTool === 'pen' ? 'solid' : 'outline'}
                        @mth-press=${() => actions.updateViewUi('spatial.sketchTool', 'pen')}
                      >
                        Pen Tool
                      </mth-button>
                      <mth-button
                        size="sm"
                        variant=${sketchTool === 'eraser' ? 'solid' : 'outline'}
                        @mth-press=${() => actions.updateViewUi('spatial.sketchTool', 'eraser')}
                      >
                        Eraser
                      </mth-button>
                    </mth-flex>
                    <span class="atmos-mono-pill">Recorded Strokes: ${sketchStrokeCount}</span>
                  </mth-flex>
                </mth-stack>
              </mth-card>
            </mth-grid>

            <div class="mth-divider">Wellhead Geolocation Pin &amp; EPA Subpart W Dispatch Address</div>

            <mth-grid data-columns="2" data-gap="4">
              <mth-card variant="outlined">
                <span slot="header">
                  <strong>Wellhead &amp; Mobile Meteorological Mast Coordinate Selector</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-location-picker
                    name="wellheadLocation"
                    .value=${wellheadCoords}
                    step="0.005"
                    required
                    label="Isolation Valve XV-402 Geodetic Pin"
                    @mth-location-select=${(event: CustomEvent<{ value: string }>) => {
                      actions.updateViewUi('spatial.wellheadCoords', event.detail.value);
                      actions.notify(`Updated wellhead coordinates: ${event.detail.value}`, 'info');
                    }}
                  ></mth-location-picker>
                  <span class="atmos-mono-pill">Pinned WGS84: ${wellheadCoords}</span>
                </mth-stack>
              </mth-card>

              <mth-card variant="outlined">
                <span slot="header">
                  <strong>EPA Subpart W Registered Facility Dispatch Address</strong>
                </span>
                <mth-stack data-gap="3">
                  <mth-address-input
                    name="facilityDispatchAddress"
                    .value=${facilityAddress}
                    include-line2
                    required
                    label="Facility Access & Regulatory Notification Address"
                    hint="Serializes structured JSON into native FormData via ElementInternals"
                    @mth-change=${(event: CustomEvent<{ value?: string }>) => {
                      if (typeof event.detail?.value === 'string') {
                        actions.updateViewUi('spatial.facilityAddress', event.detail.value);
                      }
                    }}
                  ></mth-address-input>
                  <mth-flex data-justify="end">
                    <mth-button
                      variant="solid"
                      size="sm"
                      @mth-press=${() =>
                        actions.notify(
                          `Dispatched LDAR Crew #12 to ${wellheadCoords} (Midland Pad B-4)`,
                          'success',
                        )}
                    >
                      Dispatch LDAR Intercept Packet
                    </mth-button>
                  </mth-flex>
                </mth-stack>
              </mth-card>
            </mth-grid>
          </mth-stack>
        </section>

        <!-- Mounted Spatial Overlays: Present in SSR HTML, Closed on Initial Load, Interactively Toggleable -->
        <mth-floating-panel
          ?open=${floatingHudOpen}
          label="Live Downwind TDLAS Sensor HUD"
          closable
          minimizable
          dockable
          x="36"
          y="108"
          @mth-close=${() => actions.updateViewUi('spatial.floatingHudOpen', false)}
        >
          <span slot="header"><strong>TDLAS Fence-Line Array · Pad B-4</strong></span>
          <mth-stack data-gap="2">
            <span class="atmos-mono-pill">Beam Path B4-West: 48.6 ppm-m CH4</span>
            <span class="atmos-mono-pill">Laser Lock: 1653.72 nm · R² = 0.998</span>
            <p>
              Continuous open-path tunable diode laser confirms downwind flux peaking across Bay 2
              manifold.
            </p>
          </mth-stack>
          <mth-button
            slot="footer"
            size="sm"
            variant="soft"
            @mth-press=${() => actions.updateViewUi('spatial.floatingHudOpen', false)}
          >
            Dismiss HUD
          </mth-button>
        </mth-floating-panel>

        <mth-drawer
          ?open=${stationDrawerOpen}
          placement="end"
          size="md"
          label="Compressor Station B-4 Telemetry Dossier"
          dismissible
          modal
          @mth-close=${() => actions.updateViewUi('spatial.stationDrawerOpen', false)}
        >
          <span slot="header"><strong>Station B-4 · Spatial &amp; Sensor Dossier</strong></span>
          <mth-stack data-gap="3">
            <mth-callout variant="warning" heading="Elevated Fugitive Plume Verified">
              AtmosSat-4 Orbit #14892 and UAV-07 OGI thermal imagery independently localize a
              142.8 kg/hr fugitive release to Isolation Valve XV-402.
            </mth-callout>
            <p>
              Active indoor laser bays: <strong>${selectedRooms.join(', ')}</strong>. Assigned
              Houston shift consoles: <strong>${selectedSeatsValue}</strong>.
            </p>
          </mth-stack>
          <mth-button
            slot="footer"
            variant="solid"
            size="sm"
            @mth-press=${() => {
              actions.updateViewUi('spatial.stationDrawerOpen', false);
              actions.navigate('operations');
            }}
          >
            Open Remediation Runbook
          </mth-button>
        </mth-drawer>

        <mth-bottom-sheet
          ?open=${fieldSheetOpen}
          detent=${sheetDetent}
          closable
          light-dismiss
          label="LDAR Mobile Sniffer Dispatch Checklist"
          @mth-close=${() => actions.updateViewUi('spatial.fieldSheetOpen', false)}
          @mth-detent-change=${(event: CustomEvent<{ detent: BottomSheetDetent }>) => {
            actions.updateViewUi('spatial.sheetDetent', event.detail.detent);
          }}
        >
          <span slot="header"><strong>Mobile Sniffer Van #12 · Pre-Arrival Checklist</strong></span>
          <mth-stack data-gap="3">
            <p>
              Approach Permian Pad B-4 from upwind Gate 3 mast (${SNIFFER_ROUTE.waypoints[0].label})
              with personal H2S/LEL four-gas monitors active.
            </p>
            <mth-flex data-gap="2">
              <mth-button
                size="sm"
                variant="outline"
                @mth-press=${() => actions.updateViewUi('spatial.sheetDetent', 'half')}
              >
                Half Detent
              </mth-button>
              <mth-button
                size="sm"
                variant="outline"
                @mth-press=${() => actions.updateViewUi('spatial.sheetDetent', 'full')}
              >
                Full Detent
              </mth-button>
            </mth-flex>
          </mth-stack>
          <mth-button
            slot="footer"
            size="sm"
            variant="solid"
            @mth-press=${() => {
              actions.updateViewUi('spatial.fieldSheetOpen', false);
              actions.notify('Confirmed upwind approach protocol for Sniffer Van #12', 'success');
            }}
          >
            Acknowledge Checklist
          </mth-button>
        </mth-bottom-sheet>

        <mth-fullscreen-overlay
          ?open=${fullscreenOpen}
          label="AtmosOps Tactical Basin Projection Theater"
          closable
          @mth-close=${() => actions.updateViewUi('spatial.fullscreenOpen', false)}
        >
          <span slot="header"><strong>AtmosOps Fullscreen Tactical Wall Projection</strong></span>
          <mth-stack data-gap="4">
            <p>
              Wall-display projection mode synchronizing Permian Delaware &amp; Midland SWIR plume
              vectors, downwind safety perimeters, and live responder telemetry.
            </p>
            <mth-grid data-columns="3" data-gap="3">
              <div class="atmos-surface-card">
                <strong>Primary Source</strong>
                <p>${activePlume.label}</p>
              </div>
              <div class="atmos-surface-card">
                <strong>Geodetic Lock</strong>
                <p>${wellheadCoords}</p>
              </div>
              <div class="atmos-surface-card">
                <strong>Shift Consoles</strong>
                <p>${selectedSeatsValue}</p>
              </div>
            </mth-grid>
          </mth-stack>
          <mth-button
            slot="footer"
            variant="solid"
            size="sm"
            @mth-press=${() => actions.updateViewUi('spatial.fullscreenOpen', false)}
          >
            Exit Tactical Projection
          </mth-button>
        </mth-fullscreen-overlay>

        <mth-lightbox
          ?open=${lightboxOpen}
          .items=${PLUME_GALLERY_ITEMS}
          index=${lightboxIndex}
          loop
          closable
          zoomable
          label="Full-Resolution Spectral Retrieval Lightbox"
          @mth-close=${() => actions.updateViewUi('spatial.lightboxOpen', false)}
          @mth-change=${(event: CustomEvent<{ index?: number }>) => {
            if (typeof event.detail?.index === 'number') {
              actions.updateViewUi('spatial.lightboxIndex', event.detail.index);
            }
          }}
        ></mth-lightbox>
      </mth-stack>
    `;
  },
};
