import { html } from 'lit';
import {
  expandRRule,
  formatIsoDate,
  type CalendarDate,
} from '@methane-ui/primitives';
import type {
  AuditLogEntry,
  AuditSeverityFilter,
  CalendarEvent,
  CalendarViewMode,
  KanbanCard,
} from '@methane-ui/admin';
import type {
  ErrorSummaryItem,
  MthSortableItem,
  RepeaterFieldSchema,
  TocItem,
  TreeNavItem,
} from '@methane-ui/ui';
import { getTagsForSlice } from '../coverage-manifest.js';
import {
  AIRCRAFT_BOOKING_SLOTS,
  CALIBRATION_DIFF_MODIFIED,
  CALIBRATION_DIFF_ORIGINAL,
  CHECKLIST_SORTABLE_ITEMS,
  CLI_PROVISION_SNIPPET,
  COMPLIANCE_FILE_EXPLORER_ITEMS,
  CREW_SCHEDULER_EVENTS,
  CREW_SCHEDULER_RESOURCES,
  DISPATCH_SCHEMA_FORM,
  FIRMWARE_CODE_SAMPLE,
  GAUSSIAN_PLUME_LATEX,
  INCIDENT_ORG_CHART_NODES,
  LDAR_KANBAN_CARDS,
  LDAR_KANBAN_LANES,
  OGMP_TELEMETRY_JSON_SAMPLE,
  OPERATIONS_ACTIVITY_FEED,
  OPERATIONS_AUDIT_LOG_ENTRIES,
  OPERATIONS_CALENDAR_EVENTS,
  OPERATIONS_SETTINGS_SECTIONS,
  POSTMORTEM_RICH_HTML,
  REMEDIATION_GANTT_TASKS,
  RUNBOOK_MARKDOWN_SOP,
  SCADA_FLOW_EDGES,
  SCADA_FLOW_NODES,
  SENSOR_TRANSFER_LIST_OPTIONS,
} from '../data/operations-data.js';
import { withBasePath } from '../base-path.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

const OWNED_OPERATIONS_TAGS = getTagsForSlice('view-operations');

const OPS_TOC_ITEMS: ReadonlyArray<TocItem> = [
  { id: 'ops-dispatch', label: '1. LDAR Kanban, Calendar & Aerial Booking', level: 2, href: '#ops-dispatch' },
  { id: 'ops-timelines', label: '2. Crew Scheduler, Gantt & Milestones', level: 2, href: '#ops-timelines' },
  { id: 'ops-scada-flow', label: '3. SCADA Shutoff DAG, Org & Topology', level: 2, href: '#ops-scada-flow' },
  { id: 'ops-firmware-code', label: '4. Edge Firmware, Diff & OGMP JSON', level: 2, href: '#ops-firmware-code' },
  { id: 'ops-runbooks-docs', label: '5. Postmortem, SOP, KaTeX & OGMP PDF', level: 2, href: '#ops-runbooks-docs' },
  { id: 'ops-recurrence-timers', label: '6. RRULE, Cron, Pickers & SLA Timers', level: 2, href: '#ops-recurrence-timers' },
  { id: 'ops-field-forms', label: '7. Dispatch Wizard, Schema & Fieldsets', level: 2, href: '#ops-field-forms' },
  { id: 'ops-compliance-signoff', label: '8. Vault, Audit, Settings & Sign-Off', level: 2, href: '#ops-compliance-signoff' },
];

const OPS_TREE_NAV_ITEMS: ReadonlyArray<TreeNavItem> = [
  {
    value: 'basin-permian',
    label: 'Permian Basin (Midland)',
    badge: 'P0',
    children: [
      { value: 'sop-xv402', label: 'Station B-4 · Valve XV-402', href: '#ops-scada-flow', badge: '142.8 kg/h' },
      { value: 'sop-delaware', label: 'Delaware C-9 · Thief Hatch', href: '#ops-dispatch', badge: '68.4 kg/h' },
    ],
  },
  {
    value: 'basin-neuquen',
    label: 'Vaca Muerta (Añelo)',
    children: [
      { value: 'sop-anelo-7', label: 'Pad 7 · Pneumatic Bleed', href: '#ops-field-forms' },
    ],
  },
  {
    value: 'ogmp-vault',
    label: 'EPA Subpart W & OGMP Vault',
    href: '#ops-compliance-signoff',
    badge: 'Signed',
  },
];

const REPEATER_FIELDS: ReadonlyArray<RepeaterFieldSchema> = [
  { name: 'probePoint', label: 'Flange / Spool Point', type: 'text', placeholder: 'XV-402 North Bolt' },
  { name: 'ppmReading', label: 'CH4 Reading (ppm)', type: 'number', placeholder: '1.9' },
];

const DEFAULT_REPEATER_VALUE = JSON.stringify([
  { probePoint: 'XV-402 Bonnet Seal', ppmReading: '1.9' },
  { probePoint: 'Bypass Spool XV-403', ppmReading: '1.4' },
]);

const DEFAULT_AVAILABILITY_JSON = JSON.stringify({
  mon: ['06:00', '09:00', '12:00'],
  tue: ['09:00', '12:00', '15:00'],
  wed: ['06:00', '09:00'],
  thu: ['12:00', '15:00', '18:00'],
  fri: ['06:00', '09:00', '12:00'],
});

const DEFAULT_RRULE = 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;COUNT=6';
const RRULE_DTSTART: CalendarDate = { year: 2026, month: 3, day: 14 };
const RRULE_RANGE_END: CalendarDate = { year: 2026, month: 5, day: 31 };

const ISOTOPIC_MIXING_LATEX =
  '\\delta^{13}\\mathrm{C}_{\\mathrm{obs}} = f_{\\mathrm{therm}}\\,\\delta^{13}\\mathrm{C}_{\\mathrm{therm}} + (1 - f_{\\mathrm{therm}})\\,\\delta^{13}\\mathrm{C}_{\\mathrm{bio}}';

function readUi<T>(state: AtmosState, key: string, fallback: T): T {
  const raw = state.ui[key];
  return (raw !== undefined ? (raw as T) : fallback);
}

function computeShutoffPreview(codeText: string, samplePpm: number): { actuate: boolean; threshold: number } {
  const match = /shutoffThresholdPpm["']?\s*[:=]\s*(\d+)/.exec(codeText) ?? /maxPpmThreshold\s*[:=]\s*(\d+)/.exec(codeText);
  const threshold = match ? Number(match[1]) : 35;
  return {
    actuate: samplePpm >= threshold,
    threshold,
  };
}

function countAvailabilitySlots(rawJson: string): number {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 0;
    let total = 0;
    for (const slots of Object.values(parsed)) {
      if (Array.isArray(slots)) total += slots.length;
    }
    return total;
  } catch {
    return 0;
  }
}

export const operationsView: AtmosViewModule = {
  id: 'operations',
  path: '/operations',
  title: 'Field Dispatch, Workflows & Incident Runbooks',
  subtitle:
    'LDAR leak-remediation dispatch, crew & overhaul timelines, automated SCADA shutoff DAGs, firmware & JSON code review, ProseMirror/Markdown/KaTeX runbooks, and offline EPA OGMP 2.0 PDF certification.',
  badge: '54 Primary Tags',
  ownedTags: OWNED_OPERATIONS_TAGS,

  render(state: AtmosState, actions: AtmosActions) {
    const incidentTitle = readUi<string>(
      state,
      'ops.incidentTitle',
      'INC-842 · Permian Station B-4 Valve XV-402 Rapid Abatement',
    );
    const activeTocId = readUi<string>(state, 'ops.activeTocId', 'ops-dispatch');
    const activeTreeNav = readUi<string>(state, 'ops.activeTreeNav', 'sop-xv402');

    // Section 1: Admin Dispatch, Calendar, Booking & Availability
    const kanbanCards = readUi<ReadonlyArray<KanbanCard>>(state, 'ops.kanbanCards', LDAR_KANBAN_CARDS);
    const kanbanFilter = readUi<string>(state, 'ops.kanbanFilter', '');
    const calendarEvents = readUi<ReadonlyArray<CalendarEvent>>(
      state,
      'ops.calendarEvents',
      OPERATIONS_CALENDAR_EVENTS,
    );
    const calendarView = readUi<CalendarViewMode>(state, 'ops.calendarView', 'month');
    const calendarDate = readUi<string>(state, 'ops.calendarDate', '2026-03-14');
    const bookingSlot = readUi<string>(state, 'ops.bookingSlot', '2026-03-16T10:00 UTC');
    const availabilityJson = readUi<string>(state, 'ops.availabilityJson', DEFAULT_AVAILABILITY_JSON);
    const selectedShiftCount = countAvailabilitySlots(availabilityJson);

    // Section 2: Stepper, Scheduler, Gantt, Timeline & Activity Feed
    const lifecycleStep = readUi<number>(state, 'ops.lifecycleStep', 2);
    const selectedScheduleItem = readUi<string>(
      state,
      'ops.selectedScheduleItem',
      'Pad B-4 XV-402 Torque & OGI (2026-03-09 -> 2026-03-11)',
    );
    const activityFilter = readUi<string>(state, 'ops.activityFilter', '');

    // Section 3: Flow DAG, Org Chart, Topology Tree, Sortable & Transfer List
    const flowDirection = readUi<'LR' | 'TB'>(state, 'ops.flowDirection', 'LR');
    const flowEdgeStyle = readUi<'bezier' | 'orthogonal'>(state, 'ops.flowEdgeStyle', 'bezier');
    const selectedFlowNode = readUi<string>(state, 'ops.selectedFlowNode', 'n-scada');
    const orgQuery = readUi<string>(state, 'ops.orgQuery', '');
    const selectedOrgNode = readUi<string>(state, 'ops.selectedOrgNode', 'org-ic');
    const collapsedOrgIds = readUi<ReadonlyArray<string>>(state, 'ops.collapsedOrgIds', []);
    const selectedTreeItem = readUi<string>(state, 'ops.selectedTreeItem', 'xv-402');
    const sortableChecklist = readUi<ReadonlyArray<MthSortableItem>>(
      state,
      'ops.sortableChecklist',
      CHECKLIST_SORTABLE_ITEMS,
    );
    const highRateSensors = readUi<string>(
      state,
      'ops.highRateSensors',
      'SEN-PERM-101,SEN-PERM-102',
    );

    // Section 4: Firmware Code, CLI Block, Diff & OGMP JSON
    const firmwareCode = readUi<string>(state, 'ops.firmwareCode', FIRMWARE_CODE_SAMPLE);
    const diffView = readUi<'unified' | 'split'>(state, 'ops.diffView', 'split');
    const ogmpJson = readUi<string>(state, 'ops.ogmpJson', OGMP_TELEMETRY_JSON_SAMPLE);
    const ogmpJsonValid = readUi<boolean>(state, 'ops.ogmpJsonValid', true);
    const jsonMode = readUi<'code' | 'tree' | 'split'>(state, 'ops.jsonMode', 'split');
    const shutoffSim = computeShutoffPreview(ogmpJson, 70.4);

    // Section 5: Rich Editor, Markdown SOP, KaTeX Math & Offline PDF Viewer
    const postmortemHtml = readUi<string>(state, 'ops.postmortemHtml', POSTMORTEM_RICH_HTML);
    const sopMarkdown = readUi<string>(state, 'ops.sopMarkdown', RUNBOOK_MARKDOWN_SOP);
    const mdEditorMode = readUi<'write' | 'preview' | 'split'>(state, 'ops.mdEditorMode', 'split');
    const plumeLatex = readUi<string>(state, 'ops.plumeLatex', GAUSSIAN_PLUME_LATEX);
    const pdfStatus = readUi<string>(
      state,
      'ops.pdfStatus',
      `Offline worker ready (${withBasePath('/_methane/pdf.worker.mjs')}) · Page 1`,
    );

    // Section 6: RRULE + expandRRule, Cron, Pickers & Timers
    const rruleValue = readUi<string>(state, 'ops.rruleValue', DEFAULT_RRULE);
    const expandedDates = expandRRule(rruleValue, RRULE_DTSTART, RRULE_RANGE_END).map((d) =>
      formatIsoDate(d),
    );
    const cronExpr = readUi<string>(state, 'ops.cronExpr', '15 2 * * *');
    const selectedCalDate = readUi<string>(state, 'ops.selectedCalDate', '2026-03-16');
    const filingDate = readUi<string>(state, 'ops.filingDate', '2026-03-18');
    const maintenanceDatetime = readUi<string>(state, 'ops.maintenanceDatetime', '2026-03-21T06:00');
    const shiftTime = readUi<string>(state, 'ops.shiftTime', '14:00');
    const basinTimezone = readUi<string>(state, 'ops.basinTimezone', 'America/Chicago');
    const purgeDuration = readUi<string>(state, 'ops.purgeDuration', '00:12:30');
    const countdownRunning = readUi<boolean>(state, 'ops.countdownRunning', false);
    const stopwatchRunning = readUi<boolean>(state, 'ops.stopwatchRunning', false);

    // Section 7: Multi-Step Wizard, JSON Schema Form, Coordinated Form & Conditional Field
    const wizardStep = readUi<number>(state, 'ops.wizardStep', 0);
    const escalationTier = readUi<'P0' | 'P2'>(state, 'ops.escalationTier', 'P0');
    const repeaterValue = readUi<string>(state, 'ops.repeaterValue', DEFAULT_REPEATER_VALUE);
    const formErrors = readUi<ReadonlyArray<ErrorSummaryItem>>(state, 'ops.formErrors', []);
    const lastSchemaReport = readUi<string>(
      state,
      'ops.lastSchemaReport',
      'Ready for Subpart W field attestation (LDAR-ALPHA-04 · 1.9 ppm)',
    );

    // Section 8: Compliance Vault, Audit Log, Settings Shell, Evidence Upload & Inspector Signature
    const explorerFolderId = readUi<string | null>(state, 'ops.explorerFolderId', null);
    const explorerViewMode = readUi<'list' | 'grid'>(state, 'ops.explorerViewMode', 'list');
    const auditEntries = readUi<ReadonlyArray<AuditLogEntry>>(
      state,
      'ops.auditEntries',
      OPERATIONS_AUDIT_LOG_ENTRIES,
    );
    const auditSeverity = readUi<AuditSeverityFilter>(state, 'ops.auditSeverity', 'all');
    const auditSearch = readUi<string>(state, 'ops.auditSearch', '');
    const activeSettingsSection = readUi<string>(state, 'ops.activeSettingsSection', 'thresholds');
    const settingsDirty = readUi<boolean>(state, 'ops.settingsDirty', true);
    const shutoffPpmSetting = readUi<string>(state, 'ops.shutoffPpmSetting', '35');
    const uploadStatus = readUi<'queued' | 'uploading' | 'paused' | 'complete' | 'error'>(
      state,
      'ops.uploadStatus',
      'uploading',
    );
    const uploadProgress = readUi<number>(state, 'ops.uploadProgress', 76);
    const uploadFilename = readUi<string>(
      state,
      'ops.uploadFilename',
      'uav07-pad-b4-ogi-sweep-sha256.mp4',
    );
    const signatureData = readUi<string>(state, 'ops.signatureData', '');
    const certificateCountersigned = readUi<boolean>(state, 'ops.certificateCountersigned', false);

    const sealedCount = kanbanCards.filter((c) => c.laneId === 'sealed').length;

    const jumpToSection = (sectionId: string) => {
      actions.updateViewUi('ops.activeTocId', sectionId);
      if (typeof document !== 'undefined') {
        const targetEl = document.getElementById(sectionId);
        targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const advanceLeadTicket = () => {
      const order = ['detected', 'triaged', 'dispatched', 'sealed'] as const;
      const target = kanbanCards.find((card) => card.laneId !== 'sealed');
      if (!target) {
        actions.notify('All LDAR remediation tickets are already OGI Verified Sealed.', 'info');
        return;
      }
      const currentIdx = order.indexOf(target.laneId as (typeof order)[number]);
      const nextLane = order[Math.min(order.length - 1, currentIdx + 1)] ?? 'sealed';
      const nextCards = kanbanCards.map((card) =>
        card.id === target.id ? { ...card, laneId: nextLane } : card,
      );
      actions.updateViewUi('ops.kanbanCards', nextCards);
      actions.notify(`Moved ${target.id.toUpperCase()} to lane "${nextLane}".`, 'success');
    };

    return html`
      <mth-stack data-gap="6">
        <!-- Mission Runbook Header with Inline-Editable Incident Title -->
        <mth-card>
          <mth-stack data-gap="4">
            <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="3">
              <mth-flex data-align="center" data-gap="2" data-wrap="wrap">
                <mth-badge variant="danger">P0 ACTIVE RUNBOOK</mth-badge>
                <mth-badge variant="accent">OGMP 2.0 Level 5</mth-badge>
                <mth-badge variant="success"
                  >${sealedCount}/${kanbanCards.length} Leaks Verified Sealed</mth-badge
                >
                <mth-badge variant="neutral"
                  >${certificateCountersigned ? 'EPA Countersigned' : 'Awaiting Auditor Sign-Off'}</mth-badge
                >
              </mth-flex>
              <mth-flex data-gap="2" data-wrap="wrap">
                <mth-button variant="soft" size="sm" @mth-press=${advanceLeadTicket}>
                  Advance Next LDAR Ticket
                </mth-button>
                <mth-button
                  variant="outline"
                  size="sm"
                  @mth-press=${() => {
                    actions.updateViewUi('ops.kanbanCards', LDAR_KANBAN_CARDS);
                    actions.notify('Reset LDAR Kanban board to baseline shift state.', 'info');
                  }}
                >
                  Reset Shift Board
                </mth-button>
              </mth-flex>
            </mth-flex>

            <mth-inline-edit
              name="incidentRunbookTitle"
              label="Active Incident Command Runbook Title (click to rename)"
              value=${incidentTitle}
              @mth-change=${(e: CustomEvent<{ value: string }>) => {
                actions.updateViewUi('ops.incidentTitle', e.detail.value);
                actions.notify(`Updated runbook title: ${e.detail.value}`, 'info');
              }}
            ></mth-inline-edit>
          </mth-stack>
        </mth-card>

        <!-- Sidebar Navigation Rail (TOC + Basin Tree Nav) + Main Operations Stack -->
        <div class="mth-sidebar-layout">
          <aside class="mth-stack" data-gap="4">
            <div class="mth-sticky">
              <mth-stack data-gap="4">
                <mth-card>
                  <mth-toc
                    label="Operations workspace sections"
                    heading="Runbook Sections"
                    active-id=${activeTocId}
                    .items=${OPS_TOC_ITEMS}
                    @mth-select=${(e: CustomEvent<{ id: string }>) => jumpToSection(e.detail.id)}
                  ></mth-toc>
                </mth-card>

                <mth-card>
                  <mth-tree-nav
                    label="Basin SOP & Facility Navigation"
                    active-value=${activeTreeNav}
                    .expandedValues=${['basin-permian', 'basin-neuquen']}
                    .items=${OPS_TREE_NAV_ITEMS}
                    @mth-select=${(e: CustomEvent<{ value: string; label: string; href?: string }>) => {
                      actions.updateViewUi('ops.activeTreeNav', e.detail.value);
                      if (e.detail.href?.startsWith('#')) {
                        jumpToSection(e.detail.href.slice(1));
                      }
                      actions.notify(`Selected SOP node: ${e.detail.label}`, 'info');
                    }}
                  ></mth-tree-nav>
                </mth-card>
              </mth-stack>
            </div>
          </aside>

          <div class="mth-stack" data-gap="6">
            <!-- SECTION 1: LDAR Dispatch Kanban, Overpass Calendar, LiDAR Booking & Crew Availability -->
            <section id="ops-dispatch" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="3">
                    <div>
                      <h2>1. LDAR Leak-Repair Dispatch & Aerial LiDAR Tasking</h2>
                      <p>
                        Cross-lane ticket triage from orbital SWIR detection through OGI thermal seal
                        verification, paired with sortie scheduling and KingAir aircraft booking.
                      </p>
                    </div>
                    <mth-input
                      name="kanbanFilter"
                      placeholder="Filter tickets by pad, valve, or crew..."
                      value=${kanbanFilter}
                      @mth-input=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.kanbanFilter', e.detail.value)}
                    ></mth-input>
                  </mth-flex>

                  <mth-kanban
                    .lanes=${LDAR_KANBAN_LANES}
                    .cards=${kanbanCards}
                    filter=${kanbanFilter}
                    @mth-card-move=${(
                      e: CustomEvent<{
                        cardId: string;
                        fromLaneId: string;
                        toLaneId: string;
                        cards: ReadonlyArray<KanbanCard>;
                      }>,
                    ) => {
                      actions.updateViewUi('ops.kanbanCards', e.detail.cards);
                      actions.notify(
                        `Ticket ${e.detail.cardId} moved: ${e.detail.fromLaneId} -> ${e.detail.toLaneId}`,
                        'success',
                      );
                    }}
                    @mth-card-select=${(e: CustomEvent<{ card: KanbanCard }>) => {
                      actions.notify(
                        `Inspecting ${e.detail.card.id}: ${e.detail.card.title}`,
                        'info',
                      );
                    }}
                  ></mth-kanban>
                </mth-stack>
              </mth-card>

              <mth-grid data-columns="2" data-gap="4">
                <mth-card>
                  <mth-stack data-gap="3">
                    <h3>Orbital Overpass & Overhaul Event Calendar</h3>
                    <mth-event-calendar
                      .events=${calendarEvents}
                      view=${calendarView}
                      active-date=${calendarDate}
                      @mth-date-change=${(
                        e: CustomEvent<{ activeDate: string; view: CalendarViewMode }>,
                      ) => {
                        actions.updateViewUi('ops.calendarDate', e.detail.activeDate);
                        actions.updateViewUi('ops.calendarView', e.detail.view);
                      }}
                      @mth-event-select=${(e: CustomEvent<{ event: CalendarEvent }>) => {
                        actions.notify(
                          `Sortie window: ${e.detail.event.title} (${e.detail.event.date})`,
                          'info',
                        );
                      }}
                      @mth-event-create=${(e: CustomEvent<{ date: string; time?: string }>) => {
                        const nextEvent: CalendarEvent = {
                          id: `ev-${calendarEvents.length + 1}`,
                          title: 'Ad-Hoc Sniffer Van Verification Sweep',
                          date: e.detail.date,
                          startTime: e.detail.time ?? '10:00',
                          endTime: '11:30',
                        };
                        actions.updateViewUi('ops.calendarEvents', [...calendarEvents, nextEvent]);
                        actions.notify(`Scheduled verification sweep on ${e.detail.date}`, 'success');
                      }}
                    ></mth-event-calendar>
                  </mth-stack>
                </mth-card>

                <mth-card>
                  <mth-stack data-gap="3">
                    <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                      <h3>Airborne LiDAR KingAir N42CH Booking</h3>
                      <mth-badge variant="accent">${bookingSlot || 'Select Slot'}</mth-badge>
                    </mth-flex>
                    <mth-booking-widget
                      name="lidarSortieSlot"
                      value=${bookingSlot}
                      .availableSlots=${AIRCRAFT_BOOKING_SLOTS}
                      @mth-change=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ops.bookingSlot', e.detail.value);
                      }}
                      @mth-confirm=${(
                        e: CustomEvent<{ value: string; date: string; time: string }>,
                      ) => {
                        actions.updateViewUi('ops.bookingSlot', e.detail.value);
                        actions.notify(
                          `Confirmed KingAir LiDAR flight on ${e.detail.date} at ${e.detail.time}`,
                          'success',
                        );
                      }}
                    ></mth-booking-widget>
                  </mth-stack>
                </mth-card>
              </mth-grid>

              <mth-card>
                <mth-stack data-gap="3">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <h3>On-Call LDAR Crew Weekly Shift Matrix</h3>
                    <mth-badge variant="info">${selectedShiftCount} Active Shift Windows</mth-badge>
                  </mth-flex>
                  <mth-availability-picker
                    name="ldarCrewAvailability"
                    value=${availabilityJson}
                    .slots=${['06:00', '09:00', '12:00', '15:00', '18:00']}
                    @mth-change=${(e: CustomEvent<{ value: string }>) => {
                      actions.updateViewUi('ops.availabilityJson', e.detail.value);
                    }}
                  ></mth-availability-picker>
                </mth-stack>
              </mth-card>
            </section>

            <!-- SECTION 2: Fleet Shift Scheduler, Overhaul Gantt, Stepper, Timeline & Activity Feed -->
            <section id="ops-timelines" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <div>
                      <h2>2. Crew Shift Scheduler, Critical-Path Gantt & Incident Chronology</h2>
                      <p>Selected tasking window: <strong>${selectedScheduleItem}</strong></p>
                    </div>
                    <mth-badge variant="success">Step ${lifecycleStep + 1} of 4</mth-badge>
                  </mth-flex>

                  <mth-stepper
                    label="INC-842 Remediation Lifecycle"
                    active-step=${lifecycleStep}
                    @mth-change=${(e: CustomEvent<{ index: number }>) => {
                      actions.updateViewUi('ops.lifecycleStep', e.detail.index);
                    }}
                  >
                    <mth-step
                      value="detect"
                      label="SWIR Plume Inversion"
                      description="AtmosSat-4 Orbit #14892"
                      status="complete"
                      step-number="1"
                    ></mth-step>
                    <mth-step
                      value="isolate"
                      label="SCADA Valve XV-402 Shutoff"
                      description="Closed in 42 seconds"
                      status="complete"
                      step-number="2"
                    ></mth-step>
                    <mth-step
                      value="repair"
                      label="Spiral Gasket Torque & OGI"
                      description="185 ft-lbs · 1.9 ppm residual"
                      status="current"
                      step-number="3"
                    ></mth-step>
                    <mth-step
                      value="certify"
                      label="EPA Subpart W & OGMP Sign-Off"
                      description="Cryptographic PDF ledger"
                      status=${certificateCountersigned ? 'complete' : 'upcoming'}
                      step-number="4"
                    ></mth-step>
                  </mth-stepper>

                  <mth-scheduler
                    label="Field Crew, UAV & Orbital Tasking Scheduler"
                    start-date="2026-03-09"
                    days="7"
                    .resources=${CREW_SCHEDULER_RESOURCES}
                    .events=${CREW_SCHEDULER_EVENTS}
                    @mth-event-select=${(
                      e: CustomEvent<{
                        event: { title: string; startDate: string; endDate: string };
                      }>,
                    ) => {
                      const summary = `${e.detail.event.title} (${e.detail.event.startDate} -> ${e.detail.event.endDate})`;
                      actions.updateViewUi('ops.selectedScheduleItem', summary);
                      actions.notify(`Selected shift: ${summary}`, 'info');
                    }}
                  ></mth-scheduler>

                  <mth-gantt
                    label="14-Day Compressor B-4 Wet-Seal Overhaul Critical Path"
                    start-date="2026-03-09"
                    days="14"
                    show-dependencies
                    .tasks=${REMEDIATION_GANTT_TASKS}
                    @mth-task-select=${(
                      e: CustomEvent<{ task: { title: string; progress?: number } }>,
                    ) => {
                      const summary = `${e.detail.task.title} (${e.detail.task.progress ?? 0}% complete)`;
                      actions.updateViewUi('ops.selectedScheduleItem', summary);
                      actions.notify(`Gantt milestone: ${summary}`, 'info');
                    }}
                  ></mth-gantt>
                </mth-stack>
              </mth-card>

              <mth-grid data-columns="2" data-gap="4">
                <mth-card>
                  <mth-stack data-gap="3">
                    <h3>INC-842 Chronological Response Timeline</h3>
                    <mth-timeline label="Incident INC-842 milestone log" orientation="vertical">
                      <mth-timeline-item
                        heading="08:41:02 UTC · Orbital SWIR Plume Alert"
                        timestamp="T+00s"
                        variant="danger"
                      >
                        AtmosSat-4 detected 142.8 kg/hr CH4 plume over Midland Compressor Station B-4.
                      </mth-timeline-item>
                      <mth-timeline-item
                        heading="08:41:44 UTC · Autonomous SCADA Valve Isolation"
                        timestamp="T+42s"
                        variant="warning"
                      >
                        Bayesian fusion crossed P &gt; 0.98; emergency actuator sealed Valve XV-402.
                      </mth-timeline-item>
                      <mth-timeline-item
                        heading="10:15:10 UTC · Spiral-Wound PTFE Gasket Replaced"
                        timestamp="T+94m"
                        variant="accent"
                        active
                      >
                        LDAR Alpha crew depressurized spool to vapor recovery and torqued ANSI 600# bolts.
                      </mth-timeline-item>
                      <mth-timeline-item
                        heading="13:18:50 UTC · Zero-Leak Thermal OGI Verified"
                        timestamp="T+4h 37m"
                        variant="success"
                      >
                        UAV-07 mid-wave IR sweep confirmed &lt; 2.0 ppm ambient background across bay.
                      </mth-timeline-item>
                    </mth-timeline>
                  </mth-stack>
                </mth-card>

                <mth-card>
                  <mth-stack data-gap="3">
                    <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                      <h3>Real-Time Telemetry & Crew Activity Feed</h3>
                      <mth-input
                        name="activityFilter"
                        placeholder="Filter feed..."
                        value=${activityFilter}
                        @mth-input=${(e: CustomEvent<{ value: string }>) =>
                          actions.updateViewUi('ops.activityFilter', e.detail.value)}
                      ></mth-input>
                    </mth-flex>
                    <mth-activity-feed
                      label="Station B-4 operational feed"
                      .items=${OPERATIONS_ACTIVITY_FEED}
                      .relativeTime=${false}
                      filter=${activityFilter}
                    ></mth-activity-feed>
                  </mth-stack>
                </mth-card>
              </mth-grid>
            </section>

            <!-- SECTION 3: Automated SCADA Flow DAG, Incident Command Org Chart, Tree, Sortable & Transfer -->
            <section id="ops-scada-flow" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="3">
                    <div>
                      <h2>3. Automated SCADA Valve-Shutoff DAG & Incident Command Tree</h2>
                      <p>
                        Dagre-routed Bayesian sensor fusion pipeline and multi-agency command hierarchy.
                      </p>
                    </div>
                    <mth-flex data-gap="2" data-wrap="wrap">
                      <mth-button
                        variant="outline"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi(
                            'ops.flowDirection',
                            flowDirection === 'LR' ? 'TB' : 'LR',
                          )}
                      >
                        Layout: ${flowDirection}
                      </mth-button>
                      <mth-button
                        variant="outline"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi(
                            'ops.flowEdgeStyle',
                            flowEdgeStyle === 'bezier' ? 'orthogonal' : 'bezier',
                          )}
                      >
                        Edges: ${flowEdgeStyle}
                      </mth-button>
                    </mth-flex>
                  </mth-flex>

                  <mth-flow-editor
                    label="Automated SCADA pressure-drop and emergency shutoff DAG"
                    direction=${flowDirection}
                    edge-style=${flowEdgeStyle}
                    selected-id=${selectedFlowNode}
                    auto-layout
                    .nodes=${SCADA_FLOW_NODES}
                    .edges=${SCADA_FLOW_EDGES}
                    @mth-node-select=${(e: CustomEvent<{ nodeId: string }>) => {
                      actions.updateViewUi('ops.selectedFlowNode', e.detail.nodeId);
                      actions.notify(`Inspecting SCADA DAG stage: ${e.detail.nodeId}`, 'info');
                    }}
                  ></mth-flow-editor>

                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <h3>Global Incident Command Hierarchy</h3>
                    <mth-input
                      name="orgSearch"
                      placeholder="Filter command roster..."
                      value=${orgQuery}
                      @mth-input=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.orgQuery', e.detail.value)}
                    ></mth-input>
                  </mth-flex>

                  <mth-org-chart
                    label="AtmosOps Incident Command Organization Chart"
                    direction="TB"
                    query=${orgQuery}
                    selected-id=${selectedOrgNode}
                    .collapsedIds=${collapsedOrgIds}
                    .nodes=${INCIDENT_ORG_CHART_NODES}
                    @mth-node-select=${(e: CustomEvent<{ nodeId: string }>) => {
                      actions.updateViewUi('ops.selectedOrgNode', e.detail.nodeId);
                    }}
                    @mth-node-toggle=${(
                      e: CustomEvent<{ nodeId: string; collapsed: boolean }>,
                    ) => {
                      const next = e.detail.collapsed
                        ? [...collapsedOrgIds, e.detail.nodeId]
                        : collapsedOrgIds.filter((id) => id !== e.detail.nodeId);
                      actions.updateViewUi('ops.collapsedOrgIds', next);
                    }}
                  ></mth-org-chart>
                </mth-stack>
              </mth-card>

              <mth-grid data-columns="2" data-gap="4">
                <mth-card>
                  <mth-stack data-gap="3">
                    <h3>Station B-4 Isolation Manifold Topology</h3>
                    <mth-tree
                      label="Station B-4 manifold equipment tree"
                      selection-mode="single"
                      value=${selectedTreeItem}
                      @mth-change=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ops.selectedTreeItem', e.detail.value);
                      }}
                    >
                      <mth-tree-item value="bay-2" label="Compressor Bay 2 Manifold" expanded>
                        <mth-tree-item
                          value="xv-402"
                          label="Isolation Valve XV-402 (Closed · Sealed)"
                          selected
                        ></mth-tree-item>
                        <mth-tree-item
                          value="xv-403"
                          label="Bypass Interlock Valve XV-403 (438 psi)"
                        ></mth-tree-item>
                        <mth-tree-item
                          value="vrd-01"
                          label="Closed Vapor-Recovery Drum VRD-01"
                        ></mth-tree-item>
                      </mth-tree-item>
                      <mth-tree-item value="perimeter-chords" label="TDLAS Open-Path Laser Chords" expanded>
                        <mth-tree-item
                          value="chord-north"
                          label="North Fence Retroreflector (10 Hz)"
                        ></mth-tree-item>
                        <mth-tree-item
                          value="chord-flare"
                          label="Flare Stack Acoustic + CH4 Node"
                        ></mth-tree-item>
                      </mth-tree-item>
                    </mth-tree>
                  </mth-stack>
                </mth-card>

                <mth-card>
                  <mth-stack data-gap="3">
                    <h3>Lockout / Tagout (LOTO) Reorderable Checklist</h3>
                    <mth-sortable
                      label="LOTO field execution order"
                      orientation="vertical"
                      .items=${sortableChecklist}
                      @mth-reorder=${(
                        e: CustomEvent<{ fromIndex: number; toIndex: number }>,
                      ) => {
                        const copy = [...sortableChecklist];
                        const [moved] = copy.splice(e.detail.fromIndex, 1);
                        if (moved) {
                          copy.splice(e.detail.toIndex, 0, moved);
                          actions.updateViewUi('ops.sortableChecklist', copy);
                          actions.notify(
                            `Reordered LOTO step ${e.detail.fromIndex + 1} -> ${e.detail.toIndex + 1}`,
                            'info',
                          );
                        }
                      }}
                    ></mth-sortable>
                  </mth-stack>
                </mth-card>
              </mth-grid>

              <mth-card>
                <mth-transfer-list
                  name="highRateTelemetryPool"
                  label="Sensor Polling Rate Escalation (Promote Chords to 10 Hz Plume-Lock)"
                  source-title="Standard 1 Hz Duty Cycle"
                  target-title="10 Hz High-Rate Plume Capture"
                  value=${highRateSensors}
                  .options=${SENSOR_TRANSFER_LIST_OPTIONS}
                  @mth-change=${(e: CustomEvent<{ value: string; targetKeys: ReadonlyArray<string> }>) => {
                    actions.updateViewUi('ops.highRateSensors', e.detail.value);
                    actions.notify(
                      `${e.detail.targetKeys.length} sensors active in 10 Hz plume-lock mode.`,
                      'success',
                    );
                  }}
                ></mth-transfer-list>
              </mth-card>
            </section>

            <!-- SECTION 4: Firmware Code Editor, CLI Code Block, Diff Viewer & OGMP JSON Schema Editor -->
            <section id="ops-firmware-code" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <div>
                      <h2>4. Edge Sensor Firmware, Calibration Diff & OGMP Telemetry JSON</h2>
                      <p>
                        CodeMirror 6 TypeScript shutoff logic, zero-gas calibration CLI snippet,
                        firmware diff, and live JSON payload validation.
                      </p>
                    </div>
                    <mth-flex data-gap="2" data-wrap="wrap">
                      <mth-badge variant=${ogmpJsonValid ? 'success' : 'danger'}>
                        ${ogmpJsonValid ? 'Valid OGMP JSON' : 'JSON Syntax Error'}
                      </mth-badge>
                      <mth-badge variant=${shutoffSim.actuate ? 'danger' : 'neutral'}>
                        Sim @ 70.4 ppm (thr ${shutoffSim.threshold} ppm):
                        ${shutoffSim.actuate ? 'VALVE CLOSES' : 'NOMINAL'}
                      </mth-badge>
                    </mth-flex>
                  </mth-flex>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-code-editor
                      name="edgeFirmwareTs"
                      label="AtmosEdge Shutoff Evaluator (TypeScript)"
                      language="typescript"
                      .value=${firmwareCode}
                      value=${firmwareCode}
                      @mth-change=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ops.firmwareCode', e.detail.value);
                      }}
                    ></mth-code-editor>

                    <mth-json-editor
                      name="ogmpPayloadJson"
                      label="OGMP 2.0 Signed Plume Payload (Code + Tree)"
                      mode=${jsonMode}
                      .value=${ogmpJson}
                      value=${ogmpJson}
                      @mth-input=${(e: CustomEvent<{ value: string; valid: boolean }>) => {
                        actions.updateViewUi('ops.ogmpJson', e.detail.value);
                        actions.updateViewUi('ops.ogmpJsonValid', e.detail.valid);
                      }}
                      @mth-mode-change=${(
                        e: CustomEvent<{ mode: 'code' | 'tree' | 'split' }>,
                      ) => {
                        actions.updateViewUi('ops.jsonMode', e.detail.mode);
                      }}
                    ></mth-json-editor>
                  </mth-grid>

                  <mth-code-block
                    label="Field TDLAS Zero-Gas Calibration & Ledger Signing CLI"
                    language="bash"
                    line-numbers
                    highlight-lines="1,4"
                    code=${CLI_PROVISION_SNIPPET}
                    @mth-copy=${() =>
                      actions.notify('Copied atmosctl calibration command to clipboard.', 'success')}
                  ></mth-code-block>

                  <mth-diff-viewer
                    label="Edge Firmware Configuration Diff (atmosedge v2.4.1 -> v2.5.0)"
                    filename="atmosedge-config.json"
                    view=${diffView}
                    original=${CALIBRATION_DIFF_ORIGINAL}
                    modified=${CALIBRATION_DIFF_MODIFIED}
                    @mth-view-change=${(e: CustomEvent<{ view: 'unified' | 'split' }>) =>
                      actions.updateViewUi('ops.diffView', e.detail.view)}
                  ></mth-diff-viewer>
                </mth-stack>
              </mth-card>
            </section>

            <!-- SECTION 5: ProseMirror Postmortem, Markdown SOP, KaTeX Plume Math & Offline PDF Viewer -->
            <section id="ops-runbooks-docs" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <div>
                      <h2>5. Incident Postmortem, Sanitized SOP, KaTeX Dispersion & OGMP PDF</h2>
                      <p>
                        Author regulatory postmortems and Markdown field SOPs with sanitized preview,
                        Gaussian plume equations, and 100% offline PDF inspection.
                      </p>
                    </div>
                    <mth-flex data-gap="2" data-wrap="wrap">
                      <mth-button
                        variant="soft"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi('ops.plumeLatex', GAUSSIAN_PLUME_LATEX)}
                      >
                        Gaussian Plume Eq
                      </mth-button>
                      <mth-button
                        variant="outline"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi('ops.plumeLatex', ISOTOPIC_MIXING_LATEX)}
                      >
                        δ13C Isotopic Mixing Eq
                      </mth-button>
                    </mth-flex>
                  </mth-flex>

                  <mth-rich-editor
                    name="incidentPostmortem"
                    label="ProseMirror Executive Incident Postmortem (Sanitized HTML)"
                    .value=${postmortemHtml}
                    value=${postmortemHtml}
                    @mth-change=${(e: CustomEvent<{ value: string; html: string }>) => {
                      actions.updateViewUi('ops.postmortemHtml', e.detail.html || e.detail.value);
                    }}
                  ></mth-rich-editor>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-markdown-editor
                      name="sopMarkdownEditor"
                      label="SOP-402 Field Procedure Editor"
                      mode=${mdEditorMode}
                      .value=${sopMarkdown}
                      value=${sopMarkdown}
                      @mth-input=${(e: CustomEvent<{ value: string }>) => {
                        actions.updateViewUi('ops.sopMarkdown', e.detail.value);
                      }}
                      @mth-mode-change=${(
                        e: CustomEvent<{ mode: 'write' | 'preview' | 'split' }>,
                      ) => {
                        actions.updateViewUi('ops.mdEditorMode', e.detail.mode);
                      }}
                    ></mth-markdown-editor>

                    <mth-stack data-gap="2">
                      <strong>Published Operator Read-Only SOP View</strong>
                      <mth-markdown
                        label="Sanitized SOP-402 Field Procedure"
                        .content=${sopMarkdown}
                        content=${sopMarkdown}
                      ></mth-markdown>
                    </mth-stack>
                  </mth-grid>

                  <mth-math-editor
                    name="gaussianPlumeFormula"
                    label="Atmospheric Plume Inversion Formula (KaTeX)"
                    display-mode
                    .value=${plumeLatex}
                    value=${plumeLatex}
                    @mth-input=${(e: CustomEvent<{ value: string }>) => {
                      actions.updateViewUi('ops.plumeLatex', e.detail.value);
                    }}
                  ></mth-math-editor>

                  <mth-stack data-gap="2">
                    <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                      <h3>EPA Subpart W & OGMP 2.0 Signed Compliance Certificate (Offline PDF.js)</h3>
                      <mth-badge variant="info">${pdfStatus}</mth-badge>
                    </mth-flex>
                    <mth-pdf-viewer
                      src=${withBasePath('/media/ogmp-compliance-report.pdf')}
                      worker-src=${withBasePath('/_methane/pdf.worker.mjs')}
                      document-title="EPA & OGMP 2.0 Compliance Certificate"
                      show-toolbar
                      show-outline
                      @mth-pdf-load=${(e: CustomEvent<{ numPages: number; title: string }>) => {
                        actions.updateViewUi(
                          'ops.pdfStatus',
                          `${e.detail.title} · ${e.detail.numPages} pages loaded offline`,
                        );
                      }}
                      @mth-page-change=${(
                        e: CustomEvent<{ page: number; totalPages: number }>,
                      ) => {
                        actions.updateViewUi(
                          'ops.pdfStatus',
                          `Page ${e.detail.page} of ${e.detail.totalPages} · Offline worker active`,
                        );
                      }}
                    ></mth-pdf-viewer>
                  </mth-stack>
                </mth-stack>
              </mth-card>
            </section>

            <!-- SECTION 6: RFC 5545 RRULE + expandRRule, Cron, Date/Time Pickers & SLA Timers -->
            <section id="ops-recurrence-timers" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                    <div>
                      <h2>6. Recurrence Rules (expandRRule), Cron Schedules, Pickers & SLA Timers</h2>
                      <p>
                        Deterministic RFC 5545 satellite revisit expansion, nightly N2 zero-gas cron,
                        timezone-aware scheduling pickers, and P0 regulatory timers.
                      </p>
                    </div>
                    <mth-flex data-gap="2" data-wrap="wrap">
                      <mth-button
                        variant="soft"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi(
                            'ops.rruleValue',
                            'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;COUNT=6',
                          )}
                      >
                        MWF Overpass (x6)
                      </mth-button>
                      <mth-button
                        variant="outline"
                        size="sm"
                        @mth-press=${() =>
                          actions.updateViewUi('ops.rruleValue', 'FREQ=DAILY;INTERVAL=2;COUNT=5')}
                      >
                        Every 2 Days (x5)
                      </mth-button>
                    </mth-flex>
                  </mth-flex>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-stack data-gap="3">
                      <mth-rrule-editor
                        name="overpassRecurrence"
                        label="Satellite Verification Overpass Recurrence (dtstart 2026-03-14)"
                        dtstart="2026-03-14"
                        .value=${rruleValue}
                        value=${rruleValue}
                        @mth-input=${(e: CustomEvent<{ value: string }>) =>
                          actions.updateViewUi('ops.rruleValue', e.detail.value)}
                        @mth-change=${(e: CustomEvent<{ value: string }>) =>
                          actions.updateViewUi('ops.rruleValue', e.detail.value)}
                      ></mth-rrule-editor>

                      <mth-callout variant="info" title="expandRRule() Computed Overpass Dates">
                        <mth-flex data-gap="2" data-wrap="wrap">
                          ${expandedDates.length > 0
                            ? expandedDates.map(
                                (iso) => html`<mth-badge variant="accent">${iso}</mth-badge>`,
                              )
                            : html`<mth-badge variant="neutral">Single non-repeating pass</mth-badge>`}
                        </mth-flex>
                      </mth-callout>
                    </mth-stack>

                    <mth-stack data-gap="3">
                      <mth-cron-builder
                        name="tdlasZeroGasCron"
                        label="Nightly TDLAS Auto-Zero Reference Purge Schedule"
                        .value=${cronExpr}
                        value=${cronExpr}
                        @mth-change=${(e: CustomEvent<{ value: string }>) => {
                          actions.updateViewUi('ops.cronExpr', e.detail.value);
                          actions.notify(`Updated calibration cron: ${e.detail.value}`, 'info');
                        }}
                      ></mth-cron-builder>

                      <mth-calendar
                        value=${selectedCalDate}
                        min="2026-03-01"
                        max="2026-05-31"
                        @mth-change=${(e: CustomEvent<{ value: string }>) =>
                          actions.updateViewUi('ops.selectedCalDate', e.detail.value)}
                      ></mth-calendar>
                    </mth-stack>
                  </mth-grid>

                  <mth-grid data-columns="3" data-gap="4">
                    <mth-date-picker
                      name="epaFilingDate"
                      label="EPA Subpart W Filing Cutoff"
                      value=${filingDate}
                      @mth-change=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.filingDate', e.detail.value)}
                    ></mth-date-picker>

                    <mth-datetime-picker
                      name="overhaulWindow"
                      label="Wet-Seal Blowdown Window"
                      value=${maintenanceDatetime}
                      @mth-change=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.maintenanceDatetime', e.detail.value)}
                    ></mth-datetime-picker>

                    <mth-time-picker
                      name="crewHandoverTime"
                      label="Field Shift Handover (UTC)"
                      step-minutes="15"
                      value=${shiftTime}
                      @mth-change=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.shiftTime', e.detail.value)}
                    ></mth-time-picker>

                    <mth-timezone-picker
                      name="facilityTimezone"
                      label="Basin Control Timezone"
                      value=${basinTimezone}
                      @mth-change=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.basinTimezone', e.detail.value)}
                    ></mth-timezone-picker>

                    <mth-duration-input
                      name="n2PurgeDuration"
                      label="N2 Spool Purge Duration"
                      show-seconds
                      value=${purgeDuration}
                      @mth-change=${(e: CustomEvent<{ value: string }>) =>
                        actions.updateViewUi('ops.purgeDuration', e.detail.value)}
                    ></mth-duration-input>

                    <mth-stack data-gap="2">
                      <strong>15-Min P0 Regulatory SLA & Elapsed Bench</strong>
                      <mth-flex data-gap="3" data-align="center" data-wrap="wrap">
                        <mth-countdown
                          duration="900"
                          .running=${countdownRunning}
                          format="hms"
                          precision="seconds"
                        >
                          <span slot="prefix">EPA SLA: </span>
                        </mth-countdown>
                        <mth-button
                          variant="outline"
                          size="sm"
                          @mth-press=${() =>
                            actions.updateViewUi('ops.countdownRunning', !countdownRunning)}
                        >
                          ${countdownRunning ? 'Pause SLA' : 'Start SLA'}
                        </mth-button>
                      </mth-flex>
                      <mth-stopwatch
                        .running=${stopwatchRunning}
                        show-milliseconds
                        @mth-start=${() => actions.updateViewUi('ops.stopwatchRunning', true)}
                        @mth-pause=${() => actions.updateViewUi('ops.stopwatchRunning', false)}
                        @mth-reset=${() => actions.updateViewUi('ops.stopwatchRunning', false)}
                      ></mth-stopwatch>
                    </mth-stack>
                  </mth-grid>
                </mth-stack>
              </mth-card>
            </section>

            <!-- SECTION 7: Multi-Step Wizard, JSON Schema Form, Coordinated Form, Fieldset & Repeater -->
            <section id="ops-field-forms" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <h2>7. Multi-Step Dispatch Wizard, JSON Schema Attestation & Conditional Forms</h2>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-card>
                      <mth-stack data-gap="3">
                        <h3>Guided LDAR Crew Dispatch Wizard</h3>
                        <mth-form-wizard
                          label="LDAR Crew Mobilization Wizard"
                          active-step=${wizardStep}
                          .linear=${false}
                          back-label="Back"
                          next-label="Next Phase"
                          submit-label="Transmit Dispatch Packet"
                          @mth-step-change=${(e: CustomEvent<{ index: number }>) =>
                            actions.updateViewUi('ops.wizardStep', e.detail.index)}
                          @mth-complete=${() =>
                            actions.notify(
                              'LDAR Crew Alpha mobilization packet transmitted to Midland tablet.',
                              'success',
                            )}
                        >
                          <div data-step="safety" data-title="1. H2S & Wind Check">
                            <p>
                              Upwind approach vector 245° WSW at 6.1 m/s verified; personal H2S/LEL
                              badges armed.
                            </p>
                          </div>
                          <div data-step="isolation" data-title="2. Spool Depressurization">
                            <p>
                              Confirm XV-402 closed and bleed residual gas into VRD-01 vapor recovery
                              drum (&lt; 2 psi).
                            </p>
                          </div>
                          <div data-step="retest" data-title="3. OGI & Method 21 Retest">
                            <p>
                              Record 60-second mid-wave IR clip and multi-point Method 21 sniffer
                              readings below 500 ppm EPA threshold.
                            </p>
                          </div>
                        </mth-form-wizard>
                      </mth-stack>
                    </mth-card>

                    <mth-card>
                      <mth-stack data-gap="3">
                        <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                          <h3>Auto-Generated JSON Schema Subpart W Report</h3>
                          <mth-badge variant="success">${lastSchemaReport}</mth-badge>
                        </mth-flex>
                        <mth-schema-form
                          submit-label="Validate & File Subpart W Report"
                          show-reset
                          .schema=${DISPATCH_SCHEMA_FORM}
                          schema-json=${JSON.stringify(DISPATCH_SCHEMA_FORM)}
                          @mth-submit=${(
                            e: CustomEvent<{ values: Record<string, unknown> }>,
                          ) => {
                            const callsign = String(e.detail.values.inspectorCallsign ?? 'LDAR');
                            const ppm = String(e.detail.values.residualPpm ?? '0');
                            const msg = `Filed by ${callsign} (${ppm} ppm post-repair)`;
                            actions.updateViewUi('ops.lastSchemaReport', msg);
                            actions.notify(`Subpart W Schema Form validated: ${msg}`, 'success');
                          }}
                        ></mth-schema-form>
                      </mth-stack>
                    </mth-card>
                  </mth-grid>

                  <mth-form
                    @mth-submit=${(
                      e: CustomEvent<{ values: Record<string, string | ReadonlyArray<string>> }>,
                    ) => {
                      actions.updateViewUi('ops.formErrors', []);
                      actions.notify(
                        `Escalation protocol saved (${Object.keys(e.detail.values).length} fields serialized).`,
                        'success',
                      );
                    }}
                    @mth-invalid=${(e: CustomEvent<{ errors: ReadonlyArray<ErrorSummaryItem> }>) => {
                      actions.updateViewUi('ops.formErrors', e.detail.errors);
                      actions.notify('Please resolve highlighted escalation form fields.', 'warning');
                    }}
                  >
                    <mth-stack data-gap="4">
                      <mth-error-summary
                        heading="Escalation Validation Summary"
                        .errors=${formErrors}
                      ></mth-error-summary>

                      <mth-fieldset
                        legend="Emergency Flare & Regulatory Telephonic Escalation"
                        hint="Demonstrates FORM_CONTEXT + FIELD_CONTEXT + conditional gating + dynamic repeater rows."
                      >
                        <mth-stack data-gap="4">
                          <mth-field
                            label="Incident Escalation Tier"
                            hint="P0 Critical unlocks mandatory NRC 15-minute notification dock"
                            required
                          >
                            <mth-flex data-gap="2" data-wrap="wrap">
                              <mth-button
                                variant=${escalationTier === 'P0' ? 'danger' : 'outline'}
                                size="sm"
                                @mth-press=${() => actions.updateViewUi('ops.escalationTier', 'P0')}
                              >
                                P0 Critical (&gt;100 kg/hr)
                              </mth-button>
                              <mth-button
                                variant=${escalationTier === 'P2' ? 'solid' : 'outline'}
                                size="sm"
                                @mth-press=${() => actions.updateViewUi('ops.escalationTier', 'P2')}
                              >
                                P2 Routine (&lt;25 kg/hr)
                              </mth-button>
                            </mth-flex>
                          </mth-field>

                          <mth-conditional-field
                            field="escalationTier"
                            equals="P0"
                            operator="eq"
                            mode="disable"
                            .values=${{ escalationTier }}
                          >
                            <mth-input
                              name="nrcDocketCode"
                              label="NRC / RRC Emergency Telephonic Docket ID (Active for P0)"
                              value="NRC-2026-PERM-0842"
                              required
                            ></mth-input>
                          </mth-conditional-field>

                          <mth-form-repeater
                            name="method21Readings"
                            label="Method 21 Multi-Point Flange Probe Readings"
                            add-label="Add Flange Probe Point"
                            min="1"
                            max="6"
                            .fields=${REPEATER_FIELDS}
                            value=${repeaterValue}
                            @mth-change=${(e: CustomEvent<{ value: string }>) =>
                              actions.updateViewUi('ops.repeaterValue', e.detail.value)}
                          ></mth-form-repeater>

                          <mth-flex data-gap="2">
                            <mth-button type="submit" variant="solid">
                              Commit Escalation &amp; Probe Log
                            </mth-button>
                          </mth-flex>
                        </mth-stack>
                      </mth-fieldset>
                    </mth-stack>
                  </mth-form>
                </mth-stack>
              </mth-card>
            </section>

            <!-- SECTION 8: Compliance Vault, Audit Log, Settings Shell, Evidence Upload & Signature Pad -->
            <section id="ops-compliance-signoff" class="mth-stack" data-gap="4">
              <mth-card>
                <mth-stack data-gap="4">
                  <h2>8. Regulatory Evidence Vault, Immutable Audit Log, Settings & Auditor Sign-Off</h2>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-stack data-gap="2">
                      <h3>OGMP 2.0 Filing & Calibration Certificate Explorer</h3>
                      <mth-file-explorer
                        .items=${COMPLIANCE_FILE_EXPLORER_ITEMS}
                        .currentFolderId=${explorerFolderId}
                        view-mode=${explorerViewMode}
                        @mth-navigate=${(e: CustomEvent<{ folderId: string | null }>) =>
                          actions.updateViewUi('ops.explorerFolderId', e.detail.folderId)}
                        @mth-file-open=${(e: CustomEvent<{ item: { name: string } }>) =>
                          actions.notify(`Opened compliance artifact: ${e.detail.item.name}`, 'info')}
                      ></mth-file-explorer>
                    </mth-stack>

                    <mth-stack data-gap="2">
                      <h3>Cryptographic SCADA & Operator Audit Log</h3>
                      <mth-audit-log
                        .entries=${auditEntries}
                        severity=${auditSeverity}
                        search=${auditSearch}
                        @mth-filter-change=${(
                          e: CustomEvent<{ search: string; severity: AuditSeverityFilter }>,
                        ) => {
                          actions.updateViewUi('ops.auditSearch', e.detail.search);
                          actions.updateViewUi('ops.auditSeverity', e.detail.severity);
                        }}
                        @mth-entry-select=${(e: CustomEvent<{ entry: AuditLogEntry }>) =>
                          actions.notify(
                            `Audit ${e.detail.entry.id}: ${e.detail.entry.action} on ${e.detail.entry.resource}`,
                            'info',
                          )}
                      ></mth-audit-log>
                    </mth-stack>
                  </mth-grid>

                  <mth-settings-shell
                    .sections=${OPERATIONS_SETTINGS_SECTIONS}
                    active-section-id=${activeSettingsSection}
                    ?dirty=${settingsDirty}
                    @mth-section-change=${(e: CustomEvent<{ id: string }>) =>
                      actions.updateViewUi('ops.activeSettingsSection', e.detail.id)}
                    @mth-save=${() => {
                      actions.updateViewUi('ops.settingsDirty', false);
                      actions.notify(
                        `Saved ${activeSettingsSection} policy (${shutoffPpmSetting} ppm shutoff trigger).`,
                        'success',
                      );
                    }}
                    @mth-discard=${() => {
                      actions.updateViewUi('ops.shutoffPpmSetting', '35');
                      actions.updateViewUi('ops.settingsDirty', false);
                      actions.notify('Reverted station autonomy policy changes.', 'info');
                    }}
                  >
                    <mth-stack data-gap="3">
                      <h3>Policy Section: ${activeSettingsSection.toUpperCase()}</h3>
                      <mth-input
                        name="shutoffPpmTrigger"
                        label="Autonomous Valve XV-402 Shutoff Trigger (ppm)"
                        value=${shutoffPpmSetting}
                        @mth-input=${(e: CustomEvent<{ value: string }>) => {
                          actions.updateViewUi('ops.shutoffPpmSetting', e.detail.value);
                          actions.updateViewUi('ops.settingsDirty', true);
                        }}
                      ></mth-input>
                    </mth-stack>
                  </mth-settings-shell>

                  <mth-grid data-columns="2" data-gap="4">
                    <mth-card>
                      <mth-stack data-gap="3">
                        <h3>OGI Thermal Evidence Ingestion</h3>
                        <mth-file-upload
                          name="ogiEvidenceFiles"
                          label="Select Signed OGI Clip or Method 21 CSV"
                          accept=".mp4,.csv,.pdf,.json"
                          multiple
                          @mth-change=${(e: CustomEvent<{ files: File[]; value: string }>) => {
                            const firstName = e.detail.files[0]?.name ?? e.detail.value;
                            if (firstName) {
                              actions.updateViewUi('ops.uploadFilename', firstName);
                              actions.updateViewUi('ops.uploadProgress', 100);
                              actions.updateViewUi('ops.uploadStatus', 'complete');
                              actions.notify(`Verified SHA-256 digest for ${firstName}`, 'success');
                            }
                          }}
                        ></mth-file-upload>

                        <mth-dropzone
                          label="Drag & drop UAV thermal telemetry bundles (.mp4, .json, .pdf)"
                          accept=".mp4,.json,.pdf,.csv"
                          @mth-drop=${(e: CustomEvent<{ files: File[] }>) => {
                            const name = e.detail.files[0]?.name ?? 'uav-bundle.json';
                            actions.updateViewUi('ops.uploadFilename', name);
                            actions.updateViewUi('ops.uploadProgress', 100);
                            actions.updateViewUi('ops.uploadStatus', 'complete');
                            actions.notify(`Ingested dropped bundle: ${name}`, 'success');
                          }}
                        >
                          Drop signed drone OGI evidence packages here for automatic OGMP vault indexing
                        </mth-dropzone>

                        <mth-upload-progress
                          filename=${uploadFilename}
                          value=${uploadProgress}
                          size="184320"
                          status=${uploadStatus}
                          @mth-pause=${() => actions.updateViewUi('ops.uploadStatus', 'paused')}
                          @mth-resume=${() => actions.updateViewUi('ops.uploadStatus', 'uploading')}
                          @mth-cancel=${() => {
                            actions.updateViewUi('ops.uploadProgress', 0);
                            actions.updateViewUi('ops.uploadStatus', 'queued');
                          }}
                        ></mth-upload-progress>
                      </mth-stack>
                    </mth-card>

                    <mth-card>
                      <mth-stack data-gap="3">
                        <mth-flex data-justify="between" data-align="center" data-wrap="wrap" data-gap="2">
                          <h3>EPA / OGMP Lead Auditor Counter-Signature</h3>
                          <mth-badge variant=${certificateCountersigned ? 'success' : 'warning'}>
                            ${certificateCountersigned ? 'Certificate Sealed' : 'Pending Sign-Off'}
                          </mth-badge>
                        </mth-flex>

                        <mth-signature-pad
                          name="epaAuditorSignature"
                          label="Draw Lead Inspector Wet Signature (40 CFR Part 98 Subpart W)"
                          value=${signatureData}
                          @mth-change=${(e: CustomEvent<{ value: string; isEmpty: boolean }>) => {
                            actions.updateViewUi('ops.signatureData', e.detail.value);
                          }}
                        ></mth-signature-pad>

                        <mth-flex data-gap="2" data-wrap="wrap">
                          <mth-button
                            variant="solid"
                            @mth-press=${() => {
                              const newEntry: AuditLogEntry = {
                                id: `aud-${auditEntries.length + 1}`,
                                actor: 'elena.vance@epa-auditor.org',
                                action: 'SEALED_SUBPART_W_ATTESTATION',
                                resource: 'Cert/OGMP-2026-0842',
                                timestamp: '2026-03-14T14:05:00Z',
                                severity: 'info',
                              };
                              actions.updateViewUi('ops.certificateCountersigned', true);
                              actions.updateViewUi('ops.lifecycleStep', 3);
                              actions.updateViewUi('ops.auditEntries', [newEntry, ...auditEntries]);
                              actions.notify(
                                'EPA Subpart W & OGMP 2.0 Compliance Certificate countersigned and logged.',
                                'success',
                              );
                            }}
                          >
                            Countersign &amp; Mint Audit Record
                          </mth-button>
                        </mth-flex>
                      </mth-stack>
                    </mth-card>
                  </mth-grid>
                </mth-stack>
              </mth-card>
            </section>
          </div>
        </div>
      </mth-stack>
    `;
  },
};
