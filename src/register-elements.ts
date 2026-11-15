import { registerUtilityElements } from '@methane-ui/primitives';
import { registerAllComponents as registerUiComponents } from '@methane-ui/ui';
import { registerMthButton } from '@methane-ui/ui/button/element';
import { registerMthBadge } from '@methane-ui/ui/badge/element';
import { registerMthInput } from '@methane-ui/ui/input/element';
import { registerAllComponents as registerAiComponents } from '@methane-ui/ai';
import { registerAllComponents as registerAuthComponents } from '@methane-ui/auth';
import { registerAllComponents as registerAdminComponents } from '@methane-ui/admin';
import { registerAllComponents as registerChatComponents } from '@methane-ui/chat';
import { registerAllComponents as registerCommerceComponents } from '@methane-ui/commerce';
import { registerAllComponents as register3dComponents } from '@methane-ui/3d';
import { registerAllComponents as registerChartsComponents } from '@methane-ui/charts';
import { registerAllComponents as registerCodeComponents } from '@methane-ui/code';
import { registerAllComponents as registerDatagridComponents } from '@methane-ui/datagrid';
import { registerAllComponents as registerEditorComponents } from '@methane-ui/editor';
import { registerAllComponents as registerFlowComponents } from '@methane-ui/flow';
import { registerAllComponents as registerMapsComponents } from '@methane-ui/maps';
import { registerAllComponents as registerMediaComponents } from '@methane-ui/media';
import { registerAllComponents as registerPdfComponents } from '@methane-ui/pdf';
import { registerAllComponents as registerRtcComponents } from '@methane-ui/rtc';
import { registerAllComponents as registerSpreadsheetComponents } from '@methane-ui/spreadsheet';

let registered = false;
const registeredWhiteLabelPrefixes = new Set<string>();

/**
 * Idempotently registers all 251 Methane custom elements:
 * - 3 `@methane-ui/primitives` utility elements (`mth-visually-hidden`, `mth-skip-link`, `mth-error-boundary`)
 * - 167 `@methane-ui/ui` core UI components
 * - 46 Domain Kit components (`ai`, `auth`, `admin`, `chat`, `commerce`)
 * - 35 Satellite components (`3d`, `charts`, `code`, `datagrid`, `editor`, `flow`, `maps`, `media`, `pdf`, `rtc`, `spreadsheet`)
 * - White-label `<atmos-button>`, `<atmos-badge>`, `<atmos-input>` custom prefix showcase
 */
export function registerAllAtmosElements(): void {
  if (!registered) {
    registerUtilityElements();
    registerUiComponents();
    registerAiComponents();
    registerAuthComponents();
    registerAdminComponents();
    registerChatComponents();
    registerCommerceComponents();
    register3dComponents();
    registerChartsComponents();
    registerCodeComponents();
    registerDatagridComponents();
    registerEditorComponents();
    registerFlowComponents();
    registerMapsComponents();
    registerMediaComponents();
    registerPdfComponents();
    registerRtcComponents();
    registerSpreadsheetComponents();
    registered = true;
  }
  registerWhiteLabelDemoElements('atmos');
}

export function registerWhiteLabelDemoElements(prefix: string): ReadonlyArray<string> {
  const clean = prefix.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean || clean === 'mth') {
    return [];
  }
  if (!registeredWhiteLabelPrefixes.has(clean)) {
    registerMthButton(clean);
    registerMthBadge(clean);
    registerMthInput(clean);
    registeredWhiteLabelPrefixes.add(clean);
  }
  return [`${clean}-button`, `${clean}-badge`, `${clean}-input`];
}
