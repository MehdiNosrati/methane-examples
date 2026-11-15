import type { AtmosRouteId, AtmosViewModule } from '../types.js';
import { commerceAuthView } from './commerce-auth-view.js';
import { operationsView } from './operations-view.js';
import { overviewBriefingView } from './overview-briefing.js';
import { spatialView } from './spatial-view.js';
import { studioView } from './studio-view.js';
import { telemetryView } from './telemetry-view.js';
import { warRoomView } from './war-room-view.js';

export const ATMOS_VIEW_MANIFEST: ReadonlyArray<AtmosViewModule> = [
  overviewBriefingView,
  spatialView,
  telemetryView,
  operationsView,
  warRoomView,
  commerceAuthView,
  studioView,
];

export function getViewModule(route: AtmosRouteId): AtmosViewModule {
  return ATMOS_VIEW_MANIFEST.find((view) => view.id === route) ?? overviewBriefingView;
}
