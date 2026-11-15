import { html } from 'lit';
import {
  type ColumnChooserItem,
  type FilterCombinator,
  type FilterRule,
  type SavedViewItem,
} from '@methane-ui/admin';
import {
  type DatagridColumn,
  type MthDatagrid,
  type PivotAggregator,
} from '@methane-ui/datagrid';
import { createArrayDataSource, type DataSource } from '@methane-ui/primitives';
import { type AddressMode } from '@methane-ui/spreadsheet';
import { getTagsForSlice } from '../coverage-manifest.js';
import {
  ANOMALY_CALENDAR_HEATMAP,
  CH4_FLUX_CATEGORIES,
  CH4_FLUX_SERIES,
  FACILITY_TREE_COLUMNS,
  FACILITY_TREE_ROWS,
  OGMP_SPREADSHEET_CELLS,
  SAMPLE_SENSOR_RAW_CSV,
  SENSOR_CSV_FIELDS,
  SENSOR_TELEMETRY_ROWS,
  TELEMETRY_BULK_ACTIONS,
  TELEMETRY_COLUMN_CHOOSER_ITEMS,
  TELEMETRY_DATAGRID_COLUMNS,
  TELEMETRY_FILTER_FIELDS,
  TELEMETRY_FILTER_RULES,
  TELEMETRY_QUERY_FIELDS,
  TELEMETRY_SAVED_VIEWS,
  TELEMETRY_SUMMARY_TABLE_COLUMNS,
  TELEMETRY_SUMMARY_TABLE_ROWS,
  type SensorTelemetryRow,
} from '../data/telemetry-data.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

interface VirtualPacketEntry {
  readonly seq: number;
  readonly timestamp: string;
  readonly node: string;
  readonly ppm: string;
  readonly rssiDbm: number;
}

const ALL_BASIN_VIEWS: ReadonlyArray<SavedViewItem> = [
  { id: 'all-nodes', label: 'All TDLAS Nodes (120)', pinned: true },
  ...TELEMETRY_SAVED_VIEWS,
];

const EXTRA_DATAGRID_BATTERY_COLUMN: DatagridColumn = {
  id: 'batteryPct',
  header: 'Solar Battery %',
  accessorKey: 'batteryPct',
  sortable: true,
  width: 130,
};

const ALL_AVAILABLE_DATAGRID_COLUMNS: ReadonlyArray<DatagridColumn> = [
  ...TELEMETRY_DATAGRID_COLUMNS,
  EXTRA_DATAGRID_BATTERY_COLUMN,
];

const DEFAULT_QUERY_AST_JSON = JSON.stringify({
  combinator: 'and',
  items: [
    {
      kind: 'rule',
      id: 'q-flux',
      field: 'fluxKgHr',
      operator: 'gt',
      value: '25',
    },
    {
      kind: 'group',
      id: 'q-iso-group',
      combinator: 'or',
      items: [
        {
          kind: 'rule',
          id: 'q-ch4',
          field: 'ch4Ppm',
          operator: 'gt',
          value: '18',
        },
        {
          kind: 'rule',
          id: 'q-d13c',
          field: 'delta13C',
          operator: 'lt',
          value: '-41.0',
        },
      ],
    },
  ],
});

const HEATMAP_DECLARATIVE_DATA = ANOMALY_CALENDAR_HEATMAP.map(
  (entry) => `${entry.date}:${entry.count}`,
).join(',');

const VIRTUAL_LORAWAN_PACKETS: ReadonlyArray<VirtualPacketEntry> = Array.from(
  { length: 240 },
  (_, index) => {
    const baseRow = SENSOR_TELEMETRY_ROWS[index % SENSOR_TELEMETRY_ROWS.length]!;
    const minute = String(index % 60).padStart(2, '0');
    const second = String((index * 7) % 60).padStart(2, '0');
    return {
      seq: 40_100 + index,
      timestamp: `2026-03-31T14:${minute}:${second}Z`,
      node: baseRow.sensorCode,
      ppm: `${baseRow.ch4Ppm.toFixed(2)} ppm`,
      rssiDbm: -72 - (index % 21),
    };
  },
);

const ANOMALY_STREAM_ENTRIES: ReadonlyArray<Record<string, unknown>> =
  SENSOR_TELEMETRY_ROWS.filter((row) => row.fluxKgHr >= 25).map((row) => ({
    id: row.id,
    label: `${row.sensorCode} · ${row.basin} (${row.facilityType}) — ${row.fluxKgHr.toFixed(1)} kg/hr CH4 [${row.status.toUpperCase()}]`,
  }));

/**
 * Primary `DataSource<SensorTelemetryRow>` created with `createArrayDataSource`
 * from `@methane-ui/primitives` for `<mth-datagrid>` async query & sort orchestration.
 */
export const telemetryArrayDataSource: DataSource<Record<string, unknown>> =
  createArrayDataSource(SENSOR_TELEMETRY_ROWS, (row, rawFilter) => {
    if (typeof rawFilter !== 'string' || rawFilter.trim() === '') {
      return true;
    }
    const needle = rawFilter.trim().toLowerCase();
    return (
      row.sensorCode.toLowerCase().includes(needle) ||
      row.basin.toLowerCase().includes(needle) ||
      row.facilityType.toLowerCase().includes(needle) ||
      row.status.toLowerCase().includes(needle)
    );
  });

/**
 * Secondary `DataSource` created with `createArrayDataSource` for `<mth-infinite-scroll>`.
 */
export const anomalyStreamDataSource: DataSource<Record<string, unknown>> =
  createArrayDataSource(ANOMALY_STREAM_ENTRIES);

function readStringUi(state: AtmosState, key: string, fallback: string): string {
  const candidate = state.ui[key];
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : fallback;
}

function readNumberUi(state: AtmosState, key: string, fallback: number): number {
  const candidate = state.ui[key];
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : fallback;
}

function readBooleanUi(state: AtmosState, key: string, fallback: boolean): boolean {
  const candidate = state.ui[key];
  return typeof candidate === 'boolean' ? candidate : fallback;
}

function readStringArrayUi(
  state: AtmosState,
  key: string,
  fallback: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const candidate = state.ui[key];
  if (Array.isArray(candidate) && candidate.every((item) => typeof item === 'string')) {
    return candidate;
  }
  return fallback;
}

function matchesRule(row: SensorTelemetryRow, rule: FilterRule): boolean {
  const rawTarget = rule.value.trim();
  if (!rawTarget) {
    return true;
  }
  const cellVal = row[rule.field];
  if (typeof cellVal === 'number') {
    const numericTarget = Number(rawTarget);
    if (!Number.isFinite(numericTarget)) {
      return true;
    }
    if (rule.operator === 'gt') return cellVal > numericTarget;
    if (rule.operator === 'gte') return cellVal >= numericTarget;
    if (rule.operator === 'lt') return cellVal < numericTarget;
    if (rule.operator === 'equals') return cellVal === numericTarget;
  }
  const strCell = String(cellVal ?? '').toLowerCase();
  const strTarget = rawTarget.toLowerCase();
  if (rule.operator === 'contains') {
    return strCell.includes(strTarget);
  }
  if (rule.operator === 'not_equals' || rule.operator === 'notEquals') {
    return strCell !== strTarget;
  }
  return strCell === strTarget;
}

function applySavedViewLens(
  rows: ReadonlyArray<SensorTelemetryRow>,
  viewId: string,
): ReadonlyArray<SensorTelemetryRow> {
  switch (viewId) {
    case 'super-emitters':
      return rows.filter((r) => r.fluxKgHr > 25);
    case 'permian-live':
      return rows.filter((r) => r.basin === 'Permian');
    case 'ogmp-audit':
      return rows.filter((r) => r.status === 'critical' || r.status === 'sealed');
    case 'low-battery':
      return rows.filter((r) => r.batteryPct < 80);
    default:
      return rows;
  }
}

function filterTelemetryRows(
  baseRows: ReadonlyArray<SensorTelemetryRow>,
  activeViewId: string,
  combinator: FilterCombinator,
  rules: ReadonlyArray<FilterRule>,
  quickSearch: string,
): ReadonlyArray<SensorTelemetryRow> {
  const viewRows = applySavedViewLens(baseRows, activeViewId);
  const needle = quickSearch.trim().toLowerCase();

  return viewRows.filter((row) => {
    if (needle) {
      const hit =
        row.sensorCode.toLowerCase().includes(needle) ||
        row.basin.toLowerCase().includes(needle) ||
        row.facilityType.toLowerCase().includes(needle) ||
        row.status.toLowerCase().includes(needle);
      if (!hit) return false;
    }
    if (rules.length === 0) {
      return true;
    }
    return combinator === 'or'
      ? rules.some((rule) => matchesRule(row, rule))
      : rules.every((rule) => matchesRule(row, rule));
  });
}

export const telemetryView: AtmosViewModule = {
  id: 'telemetry',
  path: '/telemetry',
  title: 'Telemetry Analytics, Grids & OGMP Ledger',
  subtitle:
    'Orbital SWIR & ground TDLAS time-series charts, virtualized sensor datagrid, basin×sector pivot, hierarchical rollup, OGMP 2.0 formula workbook, and batch CSV ingestion.',
  badge: '34 Tags',
  ownedTags: getTagsForSlice('view-telemetry'),
  render(state: AtmosState, actions: AtmosActions) {
    // Chart interactive state
    const showChartFallback = readBooleanUi(state, 'telemetryChartShowFallback', false);
    const chartRenderer =
      state.ui['telemetryChartRenderer'] === 'canvas' ? 'canvas' : ('svg' as const);
    const hiddenSeries = readStringArrayUi(state, 'telemetryHiddenSeries', []);
    const selectedChartPoint = readStringUi(
      state,
      'telemetrySelectedPoint',
      '08:00Z · Midland Pad B-4 = 142.8 kg/hr',
    );

    // Saved views, filter rules, query builder, column chooser & imported CSV rows
    const savedViews =
      (state.ui['telemetrySavedViews'] as ReadonlyArray<SavedViewItem> | undefined) ??
      ALL_BASIN_VIEWS;
    const activeViewId = readStringUi(state, 'telemetryActiveViewId', 'all-nodes');
    const filterCombinator: FilterCombinator =
      state.ui['telemetryFilterCombinator'] === 'or' ? 'or' : 'and';
    const filterRules =
      (state.ui['telemetryFilterRules'] as ReadonlyArray<FilterRule> | undefined) ??
      [];
    const quickFilterText = readStringUi(state, 'telemetryQuickFilter', '');
    const queryAstJson = readStringUi(
      state,
      'telemetryQueryAstJson',
      DEFAULT_QUERY_AST_JSON,
    );
    const columnChooserItems =
      (state.ui['telemetryColumnChooser'] as ReadonlyArray<ColumnChooserItem> | undefined) ??
      TELEMETRY_COLUMN_CHOOSER_ITEMS;
    const importedRows =
      (state.ui['telemetryImportedRows'] as ReadonlyArray<SensorTelemetryRow> | undefined) ??
      [];
    const csvRawText =
      typeof state.ui['telemetryCsvRaw'] === 'string'
        ? state.ui['telemetryCsvRaw']
        : SAMPLE_SENSOR_RAW_CSV;

    // Datagrid + Bulk actions + Pivot + Tree state
    const useAsyncDataSource = readBooleanUi(state, 'telemetryUseDataSource', false);
    const selectedRowIds = readStringArrayUi(state, 'telemetrySelectedRowIds', [
      'sen-001',
      'sen-002',
    ]);
    const datagridSortSummary = readStringUi(
      state,
      'telemetrySortSummary',
      'Default sensor sequence',
    );
    const pivotAggregator = ((): PivotAggregator => {
      const val = state.ui['telemetryPivotAggregator'];
      return val === 'avg' || val === 'max' || val === 'min' || val === 'count'
        ? val
        : 'sum';
    })();
    const expandedTreeIds = readStringArrayUi(state, 'telemetryExpandedTreeIds', [
      'americas',
      'permian-root',
      'emea',
    ]);

    // Spreadsheet & Formula Bar synchronized state
    const spreadsheetCells: Readonly<Record<string, string>> =
      (state.ui['telemetrySpreadsheetCells'] as Readonly<Record<string, string>> | undefined) ??
      OGMP_SPREADSHEET_CELLS;
    const activeCell = readStringUi(state, 'telemetryActiveCell', 'B7');
    const formulaDraft =
      typeof state.ui['telemetryFormulaDraft'] === 'string'
        ? state.ui['telemetryFormulaDraft']
        : (spreadsheetCells[activeCell] ?? '');
    const addressMode: AddressMode =
      state.ui['telemetryAddressMode'] === 'R1C1' ? 'R1C1' : 'A1';
    const formulaDependencies = readStringArrayUi(
      state,
      'telemetryFormulaDeps',
      ['B2', 'B3', 'B4', 'B5', 'B6'],
    );

    // Core UI date range, heatmap, pagination, load-more, overlay & status state
    const rangeStart = readStringUi(state, 'telemetryRangeStart', '2026-03-01');
    const rangeEnd = readStringUi(state, 'telemetryRangeEnd', '2026-03-31');
    const reportingMonth = readStringUi(state, 'telemetryReportingMonth', '2026-03');
    const selectedHeatmapDate = readStringUi(
      state,
      'telemetrySelectedHeatmapDate',
      '2026-03-23',
    );
    const selectedHeatmapCount = readNumberUi(state, 'telemetrySelectedHeatmapCount', 6);
    const currentPage = readNumberUi(state, 'telemetryCurrentPage', 1);
    const loadedBatchCount = readNumberUi(state, 'telemetryLoadedBatchCount', 6);
    const virtualWindowLabel = readStringUi(state, 'telemetryVirtualRange', '0 – 8');
    const loadingOverlayActive = readBooleanUi(
      state,
      'telemetryLoadingOverlayActive',
      false,
    );
    const selectedSummaryBasinIds = readStringArrayUi(
      state,
      'telemetrySelectedBasinIds',
      ['b-perm'],
    );
    const zeroAnomalyThresholdKgHr = readNumberUi(
      state,
      'telemetryZeroThresholdKgHr',
      250,
    );

    const combinedSensorRows: ReadonlyArray<SensorTelemetryRow> =
      importedRows.length > 0
        ? [...importedRows, ...SENSOR_TELEMETRY_ROWS]
        : SENSOR_TELEMETRY_ROWS;

    const filteredSensorRows = filterTelemetryRows(
      combinedSensorRows,
      activeViewId,
      filterCombinator,
      filterRules,
      quickFilterText,
    );

    const pivotSensorRows = filteredSensorRows.map((row) => ({
      ...row,
      fluxKgHr: Math.round(row.fluxKgHr),
    }));

    const visibleDatagridColumns: ReadonlyArray<DatagridColumn> = columnChooserItems
      .filter((item) => item.visible)
      .map((item) => ALL_AVAILABLE_DATAGRID_COLUMNS.find((col) => col.id === item.id))
      .filter((col): col is DatagridColumn => col !== undefined);

    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(filteredSensorRows.length / pageSize));
    const clampedPage = Math.min(Math.max(1, currentPage), totalPages);

    const criticalCount = filteredSensorRows.filter((r) => r.status === 'critical').length;
    const elevatedCount = filteredSensorRows.filter((r) => r.status === 'elevated').length;

    const handleTriggerDataSourceLoad = (
      hostContainer: Element | null,
      filterQuery: string,
    ): void => {
      const grid = hostContainer?.querySelector('mth-datagrid') as MthDatagrid | null;
      if (!grid) return;
      grid.dataSource = telemetryArrayDataSource;
      void grid.load(filterQuery);
    };

    return html`
      <mth-stack data-gap="6">
        <!-- 1. Executive Telemetry KPI Strip (mth-stat-card + mth-sparkline + status indicators) -->
        <section aria-label="Telemetry constellation key performance indicators">
          <div class="atmos-section-header" style="margin-block-end:0.75rem">
            <mth-flex data-gap="3" style="align-items:center;flex-wrap:wrap">
              <span class="atmos-mono-pill">L2B TELEMETRY FUSION</span>
              <mth-status-indicator
                status="online"
                pulse
                size="md"
                label="GOSAT-GW + 1,178 TDLAS Nodes Online"
              ></mth-status-indicator>
              <mth-inline-status
                variant=${criticalCount > 0 ? 'warning' : 'success'}
                live="polite"
                label=${criticalCount > 0
                  ? `${criticalCount} critical plume (>100 kg/hr) · ${elevatedCount} elevated`
                  : 'All monitored pads within nominal flux envelope'}
              ></mth-inline-status>
            </mth-flex>
            <mth-flex data-gap="2" style="align-items:center">
              <mth-spinner size="xs" label="Streaming 1 Hz laser telemetry"></mth-spinner>
              <span style="font-size:0.78rem;color:var(--mth-color-fg-muted)">
                Window: ${rangeStart} → ${rangeEnd} (${reportingMonth})
              </span>
            </mth-flex>
          </div>

          <div class="atmos-kpi-strip">
            <mth-stat-card
              label="Peak Plume Flux (Midland B-4)"
              value="142.8 kg/hr"
              delta="-99.7% post-shutoff"
              trend="down"
              hint="08:00Z spike → 0.3 kg/hr after XV-402 seal"
              variant="elevated"
            >
              <mth-sparkline
                slot="sparkline"
                type="area"
                variant="danger"
                show-points
                label="Midland Pad B-4 24h CH4 flux curve"
                data="18.4,21.0,24.6,89.2,142.8,138.1,64.5,12.2,4.1,1.2,0.4,0.3"
                .values=${CH4_FLUX_SERIES[0].data}
              ></mth-sparkline>
            </mth-stat-card>

            <mth-stat-card
              label="Active TDLAS &amp; LoRaWAN Nodes"
              value=${String(1178 + importedRows.length)}
              format="number"
              delta="+18 this month"
              trend="up"
              hint="5 global basins · 99.84% packet delivery"
              variant="elevated"
            >
              <mth-sparkline
                slot="sparkline"
                type="line"
                variant="accent"
                label="Active ground node count trend"
                data="1092,1108,1124,1139,1152,1160,1178"
              ></mth-sparkline>
            </mth-stat-card>

            <mth-stat-card
              label="Mean Isotopic δ¹³C-CH₄"
              value="-41.6 ‰"
              delta="Thermogenic wet-gas"
              trend="neutral"
              hint="Cavity ring-down attribution (±0.4 ‰)"
              variant="outlined"
            >
              <mth-sparkline
                slot="sparkline"
                type="bar"
                variant="warning"
                label="Isotopic delta-13C basin distribution"
                data="44.2,43.3,42.4,41.5,40.6,39.7,38.8"
              ></mth-sparkline>
            </mth-stat-card>

            <mth-stat-card
              label="OGMP 2.0 Level 5 Reconciliation"
              value="0.992"
              format="percent"
              delta="+1.4% vs Q4"
              trend="up"
              hint="Site-level top-down / bottom-up parity"
              variant="outlined"
            >
              <mth-sparkline
                slot="sparkline"
                type="area"
                variant="success"
                label="OGMP Level 5 verification ratio"
                data="94.1,95.4,96.8,97.5,98.3,98.9,99.2"
              ></mth-sparkline>
            </mth-stat-card>
          </div>
        </section>

        <!-- 2. Apache ECharts Multi-Series Flux & Anomaly Heatmap + Date Range Window -->
        <div
          class="mth-grid"
          style="grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1rem"
        >
          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <div>
                  <strong style="font-size:1rem">
                    24-Hour Plume Flux &amp; EPA Subpart W Threshold
                  </strong>
                  <div style="font-size:0.8rem;color:var(--mth-color-fg-muted)">
                    Selected sample: <code>${selectedChartPoint}</code>
                  </div>
                </div>
                <mth-flex data-gap="2" style="flex-wrap:wrap">
                  ${CH4_FLUX_SERIES.map((series) => {
                    const isHidden = hiddenSeries.includes(series.name);
                    return html`
                      <mth-button
                        size="sm"
                        variant=${isHidden ? 'outline' : 'soft'}
                        @mth-press=${() => {
                          const next = isHidden
                            ? hiddenSeries.filter((n) => n !== series.name)
                            : [...hiddenSeries, series.name];
                          actions.updateViewUi('telemetryHiddenSeries', next);
                          actions.notify(
                            `${isHidden ? 'Restored' : 'Muted'} chart series: ${series.name}`,
                            'info',
                          );
                        }}
                      >
                        ${isHidden ? 'Show' : 'Hide'} ${series.name.split(' (')[0]}
                      </mth-button>
                    `;
                  })}
                  <mth-button
                    size="sm"
                    variant="outline"
                    @mth-press=${() => {
                      const next = !showChartFallback;
                      actions.updateViewUi('telemetryChartShowFallback', next);
                      actions.announce(
                        next
                          ? 'Accessible telemetry data table expanded'
                          : 'Accessible telemetry data table collapsed',
                      );
                    }}
                  >
                    ${showChartFallback ? 'Hide Accessible Table' : 'Accessible Data Table'}
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="ghost"
                    @mth-press=${() => {
                      const nextRenderer = chartRenderer === 'svg' ? 'canvas' : 'svg';
                      actions.updateViewUi('telemetryChartRenderer', nextRenderer);
                      actions.notify(
                        `Switched ECharts renderer to ${nextRenderer.toUpperCase()}`,
                        'info',
                      );
                    }}
                  >
                    Renderer: ${chartRenderer.toUpperCase()}
                  </mth-button>
                </mth-flex>
              </div>

              <mth-chart
                chart-title="CH₄ Mass Flux Rate Across Monitored Pads (kg/hr)"
                subtitle="2-hour UTC orbital + ground TDLAS composite intervals vs 100 kg/hr EPA super-emitter threshold"
                renderer=${chartRenderer}
                size="lg"
                show-legend
                show-tooltip
                ?show-fallback=${showChartFallback}
                categories-json=${JSON.stringify(CH4_FLUX_CATEGORIES)}
                .categories=${CH4_FLUX_CATEGORIES}
                @mth-point-select=${(ev: CustomEvent<{
                  seriesName: string;
                  name: string;
                  value: unknown;
                }>) => {
                  const summary = `${ev.detail.name} · ${ev.detail.seriesName} = ${String(ev.detail.value)} kg/hr`;
                  actions.updateViewUi('telemetrySelectedPoint', summary);
                  actions.notify(`Inspected telemetry point: ${summary}`, 'info');
                }}
              >
                ${CH4_FLUX_SERIES.map(
                  (series) => html`
                    <mth-chart-series
                      name=${series.name}
                      type=${series.type}
                      color=${series.color}
                      ?smooth=${'smooth' in series ? series.smooth : false}
                      ?hidden=${hiddenSeries.includes(series.name)}
                      data-json=${JSON.stringify(series.data)}
                      .data=${series.data}
                    ></mth-chart-series>
                  `,
                )}

                <table slot="fallback">
                  <caption>24-Hour CH₄ Flux Series Accessible Data Table (kg/hr)</caption>
                  <thead>
                    <tr>
                      <th scope="col">UTC Interval</th>
                      <th scope="col">Midland Pad B-4</th>
                      <th scope="col">Delaware C-9</th>
                      <th scope="col">EPA Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${CH4_FLUX_CATEGORIES.map(
                      (slot, idx) => html`
                        <tr>
                          <th scope="row">${slot}</th>
                          <td>${CH4_FLUX_SERIES[0].data[idx]}</td>
                          <td>${CH4_FLUX_SERIES[1].data[idx]}</td>
                          <td>${CH4_FLUX_SERIES[2].data[idx]}</td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </mth-chart>
            </mth-stack>
          </div>

          <!-- Temporal Observation Controls & 90-Day Anomaly Calendar Heatmap -->
          <div class="atmos-surface-card">
            <mth-stack data-gap="4">
              <div class="atmos-section-header">
                <strong>90-Day Orbital Anomaly Matrix &amp; Reporting Window</strong>
                <mth-badge variant="accent" pill>
                  ${selectedHeatmapDate}: ${selectedHeatmapCount} detections
                </mth-badge>
              </div>

              <mth-calendar-heatmap
                label="90-day CH4 plume anomaly detection frequency"
                end-date="2026-03-31"
                weeks="13"
                selected-date=${selectedHeatmapDate}
                data=${HEATMAP_DECLARATIVE_DATA}
                .values=${ANOMALY_CALENDAR_HEATMAP}
                @mth-select=${(ev: CustomEvent<{ date: string; count: number }>) => {
                  actions.updateViewUi('telemetrySelectedHeatmapDate', ev.detail.date);
                  actions.updateViewUi('telemetrySelectedHeatmapCount', ev.detail.count);
                  actions.notify(
                    `${ev.detail.date}: ${ev.detail.count} super-emitter plume passes logged`,
                    ev.detail.count >= 5 ? 'warning' : 'info',
                  );
                }}
              ></mth-calendar-heatmap>

              <div
                class="mth-grid"
                style="grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:0.75rem"
              >
                <mth-date-range-picker
                  name="observationRange"
                  label="Observation Window (ISO UTC)"
                  start-date=${rangeStart}
                  end-date=${rangeEnd}
                  value=${`${rangeStart}/${rangeEnd}`}
                  @mth-change=${(ev: CustomEvent<{
                    value: string;
                    startDate: string;
                    endDate: string;
                  }>) => {
                    if (ev.detail.startDate) {
                      actions.updateViewUi('telemetryRangeStart', ev.detail.startDate);
                    }
                    if (ev.detail.endDate) {
                      actions.updateViewUi('telemetryRangeEnd', ev.detail.endDate);
                    }
                    actions.notify(
                      `Updated telemetry window: ${ev.detail.value}`,
                      'info',
                    );
                  }}
                ></mth-date-range-picker>

                <mth-month-picker
                  name="ogmpLedgerMonth"
                  label="OGMP 2.0 Reconciliation Month"
                  value=${reportingMonth}
                  @mth-change=${(ev: CustomEvent<{ value: string }>) => {
                    actions.updateViewUi('telemetryReportingMonth', ev.detail.value);
                    actions.notify(
                      `Switched OGMP ledger period to ${ev.detail.value}`,
                      'info',
                    );
                  }}
                ></mth-month-picker>
              </div>

              <mth-date-range-calendar
                start=${rangeStart}
                end=${rangeEnd}
                min="2026-01-01"
                max="2026-12-31"
                months="2"
                locale=${state.locale}
                @mth-change=${(ev: CustomEvent<{ start: string; end: string }>) => {
                  if (ev.detail.start) {
                    actions.updateViewUi('telemetryRangeStart', ev.detail.start);
                  }
                  if (ev.detail.end) {
                    actions.updateViewUi('telemetryRangeEnd', ev.detail.end);
                  }
                  if (ev.detail.start && ev.detail.end) {
                    actions.notify(
                      `Calendar window locked: ${ev.detail.start} → ${ev.detail.end}`,
                      'success',
                    );
                  }
                }}
              ></mth-date-range-calendar>
            </mth-stack>
          </div>
        </div>

        <!-- 3. Enterprise Sensor DataGrid + Saved Views + Filter/Query Builders + Column Chooser + Bulk Actions -->
        <section
          class="atmos-surface-card"
          id="telemetry-datagrid-workspace"
          aria-label="Sensor telemetry explorer and admin query controls"
        >
          <mth-stack data-gap="4">
            <div class="atmos-section-header">
              <div>
                <strong style="font-size:1.05rem">
                  Global TDLAS Sensor Telemetry Grid (${filteredSensorRows.length} matching nodes)
                </strong>
                <div style="font-size:0.8rem;color:var(--mth-color-fg-muted)">
                  Sort: ${datagridSortSummary} · Mode:
                  ${useAsyncDataSource
                    ? 'Async DataSource (createArrayDataSource)'
                    : 'Isomorphic SSR Snapshot + Live Filter'}
                </div>
              </div>
              <mth-flex data-gap="2" style="flex-wrap:wrap;align-items:center">
                <input
                  type="search"
                  class="mth-input"
                  style="max-inline-size:14rem"
                  placeholder="Quick filter sensor / basin..."
                  .value=${quickFilterText}
                  aria-label="Filter telemetry sensor rows"
                  @input=${(ev: Event) => {
                    const nextVal = (ev.target as HTMLInputElement).value;
                    actions.updateViewUi('telemetryQuickFilter', nextVal);
                    actions.updateViewUi('telemetryCurrentPage', 1);
                    if (useAsyncDataSource) {
                      const section = (ev.currentTarget as HTMLElement).closest(
                        '#telemetry-datagrid-workspace',
                      );
                      handleTriggerDataSourceLoad(section, nextVal);
                    }
                  }}
                />
                <mth-button
                  size="sm"
                  variant=${useAsyncDataSource ? 'solid' : 'outline'}
                  @mth-press=${(ev: Event) => {
                    const nextMode = !useAsyncDataSource;
                    actions.updateViewUi('telemetryUseDataSource', nextMode);
                    if (nextMode) {
                      const section = (ev.currentTarget as HTMLElement).closest(
                        '#telemetry-datagrid-workspace',
                      );
                      handleTriggerDataSourceLoad(section, quickFilterText);
                      actions.notify(
                        'Bound createArrayDataSource() to <mth-datagrid> and executed async DataQuery',
                        'success',
                      );
                    } else {
                      actions.notify(
                        'Returned <mth-datagrid> to direct filtered row projection',
                        'info',
                      );
                    }
                  }}
                >
                  ${useAsyncDataSource
                    ? 'Streaming via createArrayDataSource'
                    : 'Stream via createArrayDataSource'}
                </mth-button>
                <mth-button
                  size="sm"
                  variant="soft"
                  @mth-press=${() => {
                    actions.updateViewUi(
                      'telemetryFilterRules',
                      filterRules.length > 0 ? [] : [...TELEMETRY_FILTER_RULES],
                    );
                    actions.notify(
                      filterRules.length > 0
                        ? 'Cleared structured filter rules'
                        : 'Applied Permian >25 kg/hr preset filter rules',
                      'info',
                    );
                  }}
                >
                  ${filterRules.length > 0
                    ? 'Clear Preset Rules'
                    : 'Apply Permian >25 kg/hr Rules'}
                </mth-button>
              </mth-flex>
            </div>

            <!-- Saved Views Bar -->
            <mth-saved-views
              active-view-id=${activeViewId}
              allow-create
              allow-manage
              .views=${savedViews}
              @mth-view-select=${(ev: CustomEvent<{ id: string }>) => {
                actions.updateViewUi('telemetryActiveViewId', ev.detail.id);
                actions.updateViewUi('telemetryCurrentPage', 1);
                actions.notify(`Switched telemetry view: ${ev.detail.id}`, 'info');
              }}
              @mth-view-create=${(ev: CustomEvent<{ view: SavedViewItem }>) => {
                actions.updateViewUi('telemetrySavedViews', [
                  ...savedViews,
                  ev.detail.view,
                ]);
                actions.updateViewUi('telemetryActiveViewId', ev.detail.view.id);
                actions.notify(`Saved custom view "${ev.detail.view.label}"`, 'success');
              }}
              @mth-view-duplicate=${(ev: CustomEvent<{
                id: string;
                copy: SavedViewItem;
              }>) => {
                actions.updateViewUi('telemetrySavedViews', [
                  ...savedViews,
                  ev.detail.copy,
                ]);
                actions.updateViewUi('telemetryActiveViewId', ev.detail.copy.id);
                actions.notify(`Duplicated view "${ev.detail.copy.label}"`, 'info');
              }}
              @mth-view-pin=${(ev: CustomEvent<{ id: string; pinned: boolean }>) => {
                const updated = savedViews.map((item) =>
                  item.id === ev.detail.id ? { ...item, pinned: ev.detail.pinned } : item,
                );
                actions.updateViewUi('telemetrySavedViews', updated);
              }}
              @mth-view-delete=${(ev: CustomEvent<{ id: string }>) => {
                const remaining = savedViews.filter((item) => item.id !== ev.detail.id);
                const safeNext = remaining.length > 0 ? remaining : ALL_BASIN_VIEWS;
                actions.updateViewUi('telemetrySavedViews', safeNext);
                if (activeViewId === ev.detail.id) {
                  actions.updateViewUi('telemetryActiveViewId', safeNext[0]!.id);
                }
                actions.notify(`Removed saved view "${ev.detail.id}"`, 'info');
              }}
            ></mth-saved-views>

            <!-- Bulk Action Bar -->
            <mth-bulk-action-bar
              selected-count=${selectedRowIds.length}
              total-count=${filteredSensorRows.length}
              show-when-empty
              .actions=${TELEMETRY_BULK_ACTIONS}
              @mth-select-all=${() => {
                actions.updateViewUi(
                  'telemetrySelectedRowIds',
                  filteredSensorRows.map((row) => row.id),
                );
                actions.notify(
                  `Selected all ${filteredSensorRows.length} visible TDLAS nodes`,
                  'info',
                );
              }}
              @mth-clear-selection=${() => {
                actions.updateViewUi('telemetrySelectedRowIds', []);
                actions.notify('Cleared telemetry row selection', 'info');
              }}
              @mth-action=${(ev: CustomEvent<{ id: string; selectedCount: number }>) => {
                const actionDef = TELEMETRY_BULK_ACTIONS.find(
                  (a) => a.id === ev.detail.id,
                );
                const variant = ev.detail.id === 'isolate-scada' ? 'warning' : 'success';
                actions.notify(
                  `${actionDef?.label ?? ev.detail.id} dispatched for ${ev.detail.selectedCount} sensor(s)`,
                  variant,
                );
              }}
            ></mth-bulk-action-bar>

            <!-- Collapsible Column Chooser + Full-Width Datagrid -->
            <mth-stack data-gap="3">
              <details
                class="atmos-surface-card"
                style="padding:0.65rem 0.9rem"
              >
                <summary
                  style="cursor:pointer;font-weight:600;font-size:0.875rem;user-select:none"
                >
                  Configure Datagrid Columns (${visibleDatagridColumns.length} visible)
                </summary>
                <div style="margin-block-start:0.75rem">
                  <mth-column-chooser
                    allow-reorder
                    allow-reset
                    .columns=${columnChooserItems}
                    @mth-change=${(ev: CustomEvent<{
                      columns: ReadonlyArray<ColumnChooserItem>;
                    }>) => {
                      actions.updateViewUi('telemetryColumnChooser', [...ev.detail.columns]);
                    }}
                    @mth-reset=${() => {
                      actions.updateViewUi(
                        'telemetryColumnChooser',
                        TELEMETRY_COLUMN_CHOOSER_ITEMS,
                      );
                      actions.notify('Restored default telemetry columns', 'info');
                    }}
                  ></mth-column-chooser>
                </div>
              </details>

              <div style="inline-size:100%;max-inline-size:100%;overflow-x:auto">
                <mth-datagrid
                  style="display:block;inline-size:100%;min-inline-size:52rem"
                  label="Global TDLAS and SWIR sensor telemetry datagrid"
                  selectable
                  multi-sort
                  row-height="40"
                  filter=${quickFilterText}
                  .columns=${visibleDatagridColumns}
                  .rows=${filteredSensorRows}
                  .dataSource=${useAsyncDataSource ? telemetryArrayDataSource : null}
                  @mth-selection-change=${(ev: CustomEvent<{
                    selectedIds: ReadonlyArray<string>;
                  }>) => {
                    actions.updateViewUi('telemetrySelectedRowIds', [
                      ...ev.detail.selectedIds,
                    ]);
                  }}
                  @mth-sort-change=${(ev: CustomEvent<{
                    sorting: ReadonlyArray<{ id: string; desc: boolean }>;
                  }>) => {
                    const summary =
                      ev.detail.sorting.length === 0
                        ? 'Default sensor sequence'
                        : ev.detail.sorting
                            .map((s) => `${s.id} (${s.desc ? 'DESC' : 'ASC'})`)
                            .join(', ');
                    actions.updateViewUi('telemetrySortSummary', summary);
                  }}
                  @mth-column-resize=${(ev: CustomEvent<{
                    columnId: string;
                    width: number;
                  }>) => {
                    actions.announce(
                      `Resized ${ev.detail.columnId} column to ${ev.detail.width}px`,
                    );
                  }}
                ></mth-datagrid>
              </div>

              <mth-flex
                data-gap="3"
                style="justify-content:space-between;align-items:center;flex-wrap:wrap"
              >
                <span style="font-size:0.8rem;color:var(--mth-color-fg-muted)">
                  Page ${clampedPage} of ${totalPages} (${filteredSensorRows.length} total sensors)
                </span>
                <mth-pagination
                  page=${clampedPage}
                  total-pages=${totalPages}
                  sibling-count="1"
                  boundary-count="1"
                  label="Sensor grid page navigation"
                  @mth-change=${(ev: CustomEvent<{ page: number }>) => {
                    actions.updateViewUi('telemetryCurrentPage', ev.detail.page);
                    actions.announce(`Navigated to sensor page ${ev.detail.page}`);
                  }}
                ></mth-pagination>
              </mth-flex>
            </mth-stack>

            <!-- Filter Builder + Nested Boolean Query Builder -->
            <div
              class="mth-grid"
              style="grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr));gap:1rem"
            >
              <mth-filter-builder
                combinator=${filterCombinator}
                .fields=${TELEMETRY_FILTER_FIELDS}
                .rules=${filterRules}
                @mth-change=${(ev: CustomEvent<{
                  combinator: FilterCombinator;
                  rules: ReadonlyArray<FilterRule>;
                }>) => {
                  actions.updateViewUi('telemetryFilterCombinator', ev.detail.combinator);
                  actions.updateViewUi('telemetryFilterRules', [...ev.detail.rules]);
                  actions.updateViewUi('telemetryCurrentPage', 1);
                }}
              ></mth-filter-builder>

              <mth-query-builder
                name="ogmpQueryAst"
                show-preview
                value=${queryAstJson}
                .fields=${TELEMETRY_QUERY_FIELDS}
                @mth-change=${(ev: CustomEvent<{ value: string }>) => {
                  actions.updateViewUi('telemetryQueryAstJson', ev.detail.value);
                }}
              ></mth-query-builder>
            </div>
          </mth-stack>
        </section>

        <!-- 4. Multi-Dimensional Pivot Matrix & Constellation Hierarchical Tree Rollup -->
        <mth-stack data-gap="4">
          <div class="atmos-surface-card" style="min-inline-size:0">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Basin × Asset Class CH₄ Flux Pivot (kg/hr)</strong>
                <mth-flex data-gap="1" style="flex-wrap:wrap">
                  ${(['sum', 'avg', 'max', 'count'] as const).map(
                    (agg) => html`
                      <mth-button
                        size="sm"
                        variant=${pivotAggregator === agg ? 'solid' : 'ghost'}
                        @mth-press=${() => {
                          actions.updateViewUi('telemetryPivotAggregator', agg);
                          actions.notify(
                            `Switched pivot aggregation to ${agg.toUpperCase()}`,
                            'info',
                          );
                        }}
                      >
                        ${agg.toUpperCase()}
                      </mth-button>
                    `,
                  )}
                </mth-flex>
              </div>

              <div style="inline-size:100%;max-inline-size:100%;overflow-x:auto">
                <mth-pivot-table
                  style="display:block;inline-size:100%;min-inline-size:44rem"
                  label="Basin by asset class CH4 flux pivot table"
                  aggregator=${pivotAggregator}
                  show-totals
                  .rows=${pivotSensorRows}
                  .rowDimensions=${['basin']}
                  .columnDimensions=${['facilityType']}
                  .valueFields=${['fluxKgHr']}
                  @mth-group-toggle=${(ev: CustomEvent<{
                    groupKey: string;
                    expanded: boolean;
                  }>) => {
                    actions.announce(
                      `${ev.detail.expanded ? 'Expanded' : 'Collapsed'} basin group ${ev.detail.groupKey}`,
                    );
                  }}
                ></mth-pivot-table>
              </div>
            </mth-stack>
          </div>

          <div class="atmos-surface-card" style="min-inline-size:0">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Constellation → Basin → Pad Hierarchy Rollup</strong>
                <span class="atmos-mono-pill">OGMP 2.0 SITE ROLLUP</span>
              </div>

              <div style="inline-size:100%;max-inline-size:100%;overflow-x:auto">
                <mth-tree-table
                  style="display:block;inline-size:100%;min-inline-size:40rem"
                  label="Constellation hierarchy emission rollup"
                  selectable
                  row-height="38"
                  .columns=${FACILITY_TREE_COLUMNS}
                  .rows=${FACILITY_TREE_ROWS}
                  .expandedIds=${expandedTreeIds}
                  @mth-expand-change=${(ev: CustomEvent<{
                    expandedIds: ReadonlyArray<string>;
                  }>) => {
                    actions.updateViewUi('telemetryExpandedTreeIds', [
                      ...ev.detail.expandedIds,
                    ]);
                  }}
                ></mth-tree-table>
              </div>
            </mth-stack>
          </div>
        </mth-stack>

        <!-- 5. EPA Subpart W / OGMP 2.0 Emission-Factor Workbook (mth-formula-bar + mth-spreadsheet) -->
        <section
          class="atmos-surface-card"
          aria-label="EPA Subpart W and OGMP 2.0 emission inventory spreadsheet"
        >
          <mth-stack data-gap="3">
            <div class="atmos-section-header">
              <div>
                <strong style="font-size:1.05rem">
                  EPA Subpart W &amp; OGMP 2.0 Emission-Factor Workbook
                </strong>
                <div style="font-size:0.8rem;color:var(--mth-color-fg-muted)">
                  Active cell <code>${activeCell}</code> · Referenced cells:
                  <code>
                    ${formulaDependencies.length > 0
                      ? formulaDependencies.join(', ')
                      : 'Scalar literal'}
                  </code>
                </div>
              </div>
              <mth-flex data-gap="2" style="flex-wrap:wrap">
                ${(['B7', 'D2', 'B8', 'D8'] as const).map(
                  (presetAddr) => html`
                    <mth-button
                      size="sm"
                      variant=${activeCell === presetAddr ? 'soft' : 'ghost'}
                      @mth-press=${() => {
                        actions.updateViewUi('telemetryActiveCell', presetAddr);
                        actions.updateViewUi(
                          'telemetryFormulaDraft',
                          spreadsheetCells[presetAddr] ?? '',
                        );
                      }}
                    >
                      Inspect ${presetAddr} (${spreadsheetCells[presetAddr] ?? ''})
                    </mth-button>
                  `,
                )}
                <mth-button
                  size="sm"
                  variant="outline"
                  @mth-press=${() => {
                    const nextMode: AddressMode = addressMode === 'A1' ? 'R1C1' : 'A1';
                    actions.updateViewUi('telemetryAddressMode', nextMode);
                    actions.notify(
                      `Switched workbook cell notation to ${nextMode}`,
                      'info',
                    );
                  }}
                >
                  Address Mode: ${addressMode}
                </mth-button>
                <mth-button
                  size="sm"
                  variant="ghost"
                  @mth-press=${() => {
                    actions.updateViewUi(
                      'telemetrySpreadsheetCells',
                      OGMP_SPREADSHEET_CELLS,
                    );
                    actions.updateViewUi('telemetryActiveCell', 'B7');
                    actions.updateViewUi(
                      'telemetryFormulaDraft',
                      OGMP_SPREADSHEET_CELLS['B7'] ?? '',
                    );
                    actions.notify(
                      'Reset OGMP 2.0 workbook to baseline emission factors',
                      'info',
                    );
                  }}
                >
                  Reset Sheet
                </mth-button>
              </mth-flex>
            </div>

            <mth-formula-bar
              name="ogmpActiveFormula"
              label="Active OGMP workbook formula"
              cell-address=${activeCell}
              value=${formulaDraft}
              placeholder="Enter scalar or =SUM(B2:B6)"
              @mth-formula-input=${(ev: CustomEvent<{
                cellAddress: string;
                value: string;
                dependencies: ReadonlyArray<string>;
              }>) => {
                actions.updateViewUi('telemetryFormulaDraft', ev.detail.value);
                actions.updateViewUi('telemetryFormulaDeps', [...ev.detail.dependencies]);
              }}
              @mth-formula-commit=${(ev: CustomEvent<{
                cellAddress: string;
                value: string;
                valid: boolean;
              }>) => {
                if (!ev.detail.valid) {
                  actions.notify(
                    `Invalid formula syntax in ${ev.detail.cellAddress}`,
                    'danger',
                  );
                  return;
                }
                const targetAddr = ev.detail.cellAddress || activeCell;
                const updatedCells = {
                  ...spreadsheetCells,
                  [targetAddr]: ev.detail.value,
                };
                actions.updateViewUi('telemetrySpreadsheetCells', updatedCells);
                actions.updateViewUi('telemetryFormulaDraft', ev.detail.value);
                actions.notify(
                  `Committed ${targetAddr} = ${ev.detail.value}`,
                  'success',
                );
              }}
            ></mth-formula-bar>

            <div style="inline-size:100%;max-inline-size:100%;overflow-x:auto">
              <mth-spreadsheet
                style="display:block;inline-size:100%;min-inline-size:40rem"
                label="EPA Subpart W and OGMP 2.0 emission inventory worksheet"
                rows="10"
                cols="5"
                row-height="34"
                address-mode=${addressMode}
                active-cell=${activeCell}
                .cells=${spreadsheetCells}
                @mth-cell-select=${(ev: CustomEvent<{
                  address: string;
                  raw: string;
                }>) => {
                  actions.updateViewUi('telemetryActiveCell', ev.detail.address);
                  actions.updateViewUi('telemetryFormulaDraft', ev.detail.raw);
                }}
                @mth-cell-change=${(ev: CustomEvent<{
                  address: string;
                  raw: string;
                  value: unknown;
                }>) => {
                  const updatedCells = {
                    ...spreadsheetCells,
                    [ev.detail.address]: ev.detail.raw,
                  };
                  actions.updateViewUi('telemetrySpreadsheetCells', updatedCells);
                  actions.updateViewUi('telemetryActiveCell', ev.detail.address);
                  actions.updateViewUi('telemetryFormulaDraft', ev.detail.raw);
                  actions.notify(
                    `Updated cell ${ev.detail.address} → ${String(ev.detail.value)}`,
                    'success',
                  );
                }}
              ></mth-spreadsheet>
            </div>
          </mth-stack>
        </section>

        <!-- 6. Core UI Declarative Basin Table + CSV Batch Importer -->
        <div
          class="mth-grid"
          style="grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1rem"
        >
          <div class="atmos-surface-card" style="min-inline-size:0">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Basin OGMP 2.0 Verification Summary</strong>
                <mth-badge variant="success" pill>5 Monitored Basins</mth-badge>
              </div>

              <div style="inline-size:100%;max-inline-size:100%;overflow-x:auto">
                <mth-table
                  style="display:block;inline-size:100%;min-inline-size:34rem"
                  caption="Global Monitored Basins & OGMP 2.0 Verification Summary"
                  selectable="multiple"
                  striped
                  sticky-header
                  .columns=${TELEMETRY_SUMMARY_TABLE_COLUMNS}
                  .rows=${TELEMETRY_SUMMARY_TABLE_ROWS}
                  .selectedIds=${selectedSummaryBasinIds}
                  @mth-selection-change=${(ev: CustomEvent<{
                    selectedIds: ReadonlyArray<string>;
                  }>) => {
                    actions.updateViewUi('telemetrySelectedBasinIds', [
                      ...ev.detail.selectedIds,
                    ]);
                  }}
                >
                  <mth-column field="basin" header="Monitored Basin" sortable></mth-column>
                  <mth-column
                    field="activeSensors"
                    header="TDLAS Nodes"
                    sortable
                    align="end"
                  ></mth-column>
                  <mth-column
                    field="meanFlux"
                    header="Mean Flux (kg/hr)"
                    sortable
                    align="end"
                  ></mth-column>
                  <mth-column
                    field="ogmpLevel"
                    header="OGMP 2.0 Tier"
                    sortable
                  ></mth-column>
                </mth-table>
              </div>
            </mth-stack>
          </div>

          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Ground Sensor Batch CSV Ingestion</strong>
                <span class="atmos-mono-pill">
                  +${importedRows.length} ingested nodes
                </span>
              </div>

              <mth-csv-importer
                has-header
                raw-csv=${csvRawText}
                .fields=${SENSOR_CSV_FIELDS}
                @mth-import=${(ev: CustomEvent<{
                  rows: ReadonlyArray<Record<string, string>>;
                  invalidCount: number;
                }>) => {
                  const mapped: SensorTelemetryRow[] = ev.detail.rows.map((item, idx) => {
                    const ch4Ppm = Number.parseFloat(item['ch4_ppm'] ?? '2.1') || 2.1;
                    const fluxKgHr = Number(Math.max(0.4, (ch4Ppm - 1.9) * 1.85).toFixed(1));
                    return {
                      id: `csv-sen-${Date.now()}-${idx}`,
                      sensorCode: item['sensor_id'] || `SEN-CSV-${900 + idx}`,
                      basin: item['basin'] || 'Permian',
                      facilityType: 'Wellhead',
                      ch4Ppm,
                      fluxKgHr,
                      delta13C: -42.5,
                      windMps: 4.2,
                      batteryPct: 98,
                      status:
                        fluxKgHr >= 100
                          ? 'critical'
                          : fluxKgHr >= 35
                            ? 'elevated'
                            : 'nominal',
                    };
                  });
                  actions.updateViewUi('telemetryImportedRows', [
                    ...mapped,
                    ...importedRows,
                  ]);
                  actions.notify(
                    `Ingested ${mapped.length} ground TDLAS sensor row(s) into live grid`,
                    'success',
                  );
                }}
              ></mth-csv-importer>
            </mth-stack>
          </div>
        </div>

        <!-- 7. Virtual Packet Scroller + Infinite Anomaly Stream + Explicit Load-More Batch -->
        <div
          class="mth-grid"
          style="grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1rem"
        >
          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>LoRaWAN Raw Telemetry Window (240 frames)</strong>
                <span class="atmos-mono-pill">Rows ${virtualWindowLabel}</span>
              </div>

              <mth-virtual-scroller
                label="Virtualized 1 Hz LoRaWAN packet telemetry stream"
                estimate-size="44"
                overscan="3"
                viewport-height="220"
                .items=${VIRTUAL_LORAWAN_PACKETS}
                .renderItem=${(item: unknown) => {
                  const pkt = item as VirtualPacketEntry;
                  return html`
                    <div
                      style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;padding:0.45rem 0.65rem;border-block-end:1px solid var(--mth-color-border);font-size:0.8rem"
                    >
                      <code>#${pkt.seq} · ${pkt.node}</code>
                      <strong>${pkt.ppm}</strong>
                      <span style="color:var(--mth-color-fg-muted)">
                        ${pkt.rssiDbm} dBm
                      </span>
                    </div>
                  `;
                }}
                @mth-range-change=${(ev: CustomEvent<{
                  startIndex: number;
                  endIndex: number;
                }>) => {
                  actions.updateViewUi(
                    'telemetryVirtualRange',
                    `${ev.detail.startIndex} – ${ev.detail.endIndex}`,
                  );
                }}
              ></mth-virtual-scroller>
            </mth-stack>
          </div>

          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Super-Emitter Sentinel Stream</strong>
                <span class="atmos-mono-pill">DataController</span>
              </div>

              <mth-infinite-scroll
                ?auto-load=${false}
                .dataSource=${anomalyStreamDataSource}
                @mth-load-more=${() => {
                  actions.notify(
                    'Loaded super-emitter sentinel stream via createArrayDataSource()',
                    'info',
                  );
                }}
              >
                <div
                  style="padding:0.45rem 0;font-size:0.82rem;border-block-end:1px solid var(--mth-color-border)"
                >
                  <strong>SEN-PERM-101</strong> · Midland Pad B-4 — 142.8 kg/hr CH₄ (XV-402 dispatched)
                </div>
                <div
                  style="padding:0.45rem 0;font-size:0.82rem;border-block-end:1px solid var(--mth-color-border)"
                >
                  <strong>SEN-APPA-102</strong> · Delaware C-9 — 68.4 kg/hr CH₄ (UAV-07 en route)
                </div>
              </mth-infinite-scroll>
            </mth-stack>
          </div>

          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Paginated Sensor Archive Loader</strong>
                <span class="atmos-mono-pill">
                  ${loadedBatchCount} / ${SENSOR_TELEMETRY_ROWS.length}
                </span>
              </div>

              <mth-load-more
                loaded-count=${loadedBatchCount}
                total-count=${SENSOR_TELEMETRY_ROWS.length}
                ?complete=${loadedBatchCount >= SENSOR_TELEMETRY_ROWS.length}
                @mth-load-more=${() => {
                  const nextCount = Math.min(
                    SENSOR_TELEMETRY_ROWS.length,
                    loadedBatchCount + 6,
                  );
                  actions.updateViewUi('telemetryLoadedBatchCount', nextCount);
                  actions.notify(
                    `Expanded telemetry archive preview to ${nextCount} sensors`,
                    'info',
                  );
                }}
              >
                <mth-stack data-gap="1">
                  ${SENSOR_TELEMETRY_ROWS.slice(0, loadedBatchCount).map(
                    (row) => html`
                      <div
                        style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.25rem 0;border-block-end:1px solid var(--mth-color-border)"
                      >
                        <code>${row.sensorCode}</code>
                        <span>${row.basin}</span>
                        <strong>${row.fluxKgHr.toFixed(1)} kg/hr</strong>
                      </div>
                    `,
                  )}
                </mth-stack>
              </mth-load-more>
            </mth-stack>
          </div>
        </div>

        <!-- 8. Calibration Diagnostics Overlay Card + Dedicated Zero-Anomaly Filter Preview Card -->
        <div
          class="mth-grid"
          style="grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1rem"
        >
          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>TDLAS Laser Cavity &amp; Reconciliation Diagnostics</strong>
                <mth-button
                  size="sm"
                  variant=${loadingOverlayActive ? 'solid' : 'outline'}
                  @mth-press=${() => {
                    const next = !loadingOverlayActive;
                    actions.updateViewUi('telemetryLoadingOverlayActive', next);
                    actions.notify(
                      next
                        ? 'Activated non-blocking calibration loading overlay'
                        : 'Calibration baseline locked; cleared loading overlay',
                      'info',
                    );
                  }}
                >
                  ${loadingOverlayActive
                    ? 'Finish Recalibration'
                    : 'Simulate Calibration Overlay'}
                </mth-button>
              </div>

              <mth-loading-overlay
                ?active=${loadingOverlayActive}
                ?fullscreen=${false}
                blurred
                label="Recalibrating 1653.7 nm HITRAN CH₄ absorption line..."
              >
                <mth-stack data-gap="4" style="padding:0.5rem 0">
                  <mth-flex data-gap="4" style="align-items:center;flex-wrap:wrap">
                    <mth-progress-ring
                      value="99.2"
                      max="100"
                      size="68"
                      stroke-width="7"
                      show-value
                      label="Orbital L2B downlink integrity"
                    ></mth-progress-ring>

                    <div style="flex:1;min-inline-size:12rem">
                      <div
                        style="display:flex;justify-content:space-between;font-size:0.82rem;margin-block-end:0.35rem"
                      >
                        <span>EPA Subpart W Q1 Ledger Verification</span>
                        <strong>94%</strong>
                      </div>
                      <mth-progress-bar
                        value="94"
                        max="100"
                        label="EPA Subpart W Q1 ledger verification progress"
                      ></mth-progress-bar>
                    </div>
                  </mth-flex>

                  <div
                    class="mth-grid"
                    style="grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:0.75rem"
                  >
                    <mth-key-value
                      label="HITRAN Wavelength"
                      value="1653.72 nm (2ν₃)"
                      monospace
                      copyable
                    ></mth-key-value>
                    <mth-key-value
                      label="Calibration Cert SHA"
                      value="ogmp5-9f41c82e"
                      monospace
                      copyable
                    ></mth-key-value>
                    <mth-key-value
                      label="Zero-Air Drift"
                      value="±0.014 ppm / 30d"
                      monospace
                    ></mth-key-value>
                  </div>

                  <div>
                    <div
                      style="font-size:0.76rem;color:var(--mth-color-fg-muted);margin-block-end:0.35rem"
                    >
                      Next Scheduled GOSAT-GW Spectral Frame Buffer:
                    </div>
                    <mth-skeleton
                      variant="text"
                      lines="2"
                      ?animated=${loadingOverlayActive}
                    ></mth-skeleton>
                  </div>
                </mth-stack>
              </mth-loading-overlay>
            </mth-stack>
          </div>

          <!-- Dedicated Zero-Anomaly Filter Preview Card (mth-empty-state) -->
          <div class="atmos-surface-card">
            <mth-stack data-gap="3">
              <div class="atmos-section-header">
                <strong>Zero-Anomaly Filter Preview</strong>
                <span class="atmos-mono-pill">
                  Flux &gt; ${zeroAnomalyThresholdKgHr} kg/hr
                </span>
              </div>

              <mth-empty-state
                variant="card"
                tone="info"
                role-mode="region"
                heading=${`Zero Super-Emitter Plumes Above ${zeroAnomalyThresholdKgHr} kg/hr`}
                description="No orbital SWIR pixels or ground TDLAS chords exceed the catastrophic blowdown threshold in the selected window. Lower the threshold to inspect active Permian repair dispatches."
              >
                <mth-flex slot="actions" data-gap="2" style="flex-wrap:wrap;justify-content:center">
                  <mth-button
                    size="sm"
                    variant="soft"
                    @mth-press=${() => {
                      actions.updateViewUi('telemetryActiveViewId', 'super-emitters');
                      actions.notify(
                        'Focused telemetry grid on active >25 kg/hr super-emitters',
                        'info',
                      );
                    }}
                  >
                    Inspect &gt;25 kg/hr Dispatches
                  </mth-button>
                  <mth-button
                    size="sm"
                    variant="outline"
                    @mth-press=${() => {
                      const nextThreshold =
                        zeroAnomalyThresholdKgHr === 250 ? 500 : 250;
                      actions.updateViewUi(
                        'telemetryZeroThresholdKgHr',
                        nextThreshold,
                      );
                    }}
                  >
                    Toggle ${zeroAnomalyThresholdKgHr === 250 ? '500' : '250'} kg/hr Guardband
                  </mth-button>
                </mth-flex>
              </mth-empty-state>
            </mth-stack>
          </div>
        </div>
      </mth-stack>
    `;
  },
};
