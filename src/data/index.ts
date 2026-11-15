export * from './spatial-data.js';
export * from './telemetry-data.js';
export * from './operations-data.js';
export * from './war-room-data.js';
export * from './commerce-auth-data.js';

export const SHELL_COMMAND_PALETTE_ITEMS = [
  { id: 'nav-overview', label: 'Go to Mission Overview & Public Briefing', group: 'Navigation', shortcut: 'G O', href: '/' },
  { id: 'nav-spatial', label: 'Go to Spatial Plume Twin & Floor/Seat Maps', group: 'Navigation', shortcut: 'G S', href: '/spatial' },
  { id: 'nav-telemetry', label: 'Go to Telemetry Charts, Grids & OGMP Workbook', group: 'Navigation', shortcut: 'G T', href: '/telemetry' },
  { id: 'nav-operations', label: 'Go to Field Dispatch, Workflows & Runbooks', group: 'Navigation', shortcut: 'G F', href: '/operations' },
  { id: 'nav-war-room', label: 'Go to Incident War-Room, WebRTC & AtmosAI', group: 'Navigation', shortcut: 'G W', href: '/war-room' },
  { id: 'nav-commerce', label: 'Go to Sensor Storefront, Carbon Credits & IAM', group: 'Navigation', shortcut: 'G C', href: '/commerce-auth' },
  { id: 'nav-studio', label: 'Open Theme, OKLCH DTCG, RTL & 256-Tag Studio', group: 'Studio & Diagnostics', shortcut: 'G D', href: '/studio' },
  { id: 'act-dark', label: 'Toggle Dark / Light Perceptual OKLCH Theme', group: 'Appearance', keywords: ['theme', 'dark', 'light', 'oklch'] },
  { id: 'act-rtl', label: 'Switch Locale to Arabic (RTL) / English (LTR)', group: 'Localization', keywords: ['rtl', 'arabic', 'hebrew', 'i18n'] },
] as const;

export const SHELL_SITE_SEARCH_ITEMS = [
  { id: 'sr-b4', label: 'Permian Compressor Station B-4 (142.8 kg/hr)', category: 'Active Incident', href: '/spatial', snippet: 'SWIR Orbit #14892 · Valve XV-402 isolated in 42s' },
  { id: 'sr-ogmp', label: 'OGMP 2.0 Emission Factor Workbook', category: 'Telemetry Ledger', href: '/telemetry', snippet: 'Live =SUM() and GWP-100 tCO2e spreadsheet formulas' },
  { id: 'sr-sop', label: 'SOP-402 Flange Isolation & KaTeX Plume Model', category: 'Runbooks & PDF', href: '/operations', snippet: 'ProseMirror postmortem, Gaussian equation & EPA PDF' },
  { id: 'sr-ai', label: 'AtmosAI Stream Sanitizer & XSS Firewall', category: 'AI & Security', href: '/war-room', snippet: 'Live @methane-ui/sanitize red-team payload neutralizer' },
  { id: 'sr-tdlas', label: 'AtmosSense TDLAS-400 Open-Path Spectrometer', category: 'Hardware & Credits', href: '/commerce-auth', snippet: '0.05 ppm sensitivity · Class I Div 1 solar node' },
  { id: 'sr-dtcg', label: 'W3C DTCG Token Compiler & 256-Tag Coverage Audit', category: 'Theme Studio', href: '/studio', snippet: 'Live compileDtcgTokens(), <atmos-*> prefix & DSD SSR' },
] as const;

export const BRIEFING_COMPARISON_PLANS = [
  { id: 'manual', name: 'Legacy Quarterly Walkdown', price: '90-day lag', actionLabel: 'Compare Baseline' },
  { id: 'aircraft', name: 'Periodic Aerial Flyover', price: '14-day lag', actionLabel: 'View Specs' },
  { id: 'atmosops', name: 'AtmosOps Orbital + TDLAS', price: '< 60 sec SLA', badge: 'OGMP Level 5', highlighted: true, actionLabel: 'Deploy Network' },
] as const;

export const BRIEFING_COMPARISON_ROWS = [
  { id: 'cmp-1', feature: 'Super-Emitter Detection Latency', description: 'Time from seal failure to control-room alert', values: ['Up to 90 days', '14–30 days', '42 seconds'] },
  { id: 'cmp-2', feature: 'Continuous 24/7 Ground Chord Fusion', values: [false, false, true] },
  { id: 'cmp-3', feature: 'Automated SCADA Valve Interlock', values: [false, false, true] },
  { id: 'cmp-4', feature: 'Signed EPA Subpart W & OGMP 2.0 PDF', values: ['Manual Excel', 'Partial CSV', 'Cryptographic Auto-Mint'] },
] as const;

export const DEFAULT_DTCG_TOKENS_JSON = JSON.stringify(
  {
    color: {
      $type: 'color',
      seed: {
        brand: { $value: 'oklch(0.58 0.20 175)' },
        info: { $value: 'oklch(0.60 0.18 235)' },
      },
    },
    radius: {
      $type: 'dimension',
      md: { $value: '0.5rem' },
    },
  },
  null,
  2,
);

export const FRAMEWORK_CODE_TAB_ITEMS = [
  {
    value: 'lit-ssr',
    label: 'HTML / Lit + DSD SSR',
    language: 'typescript',
    code: `import '@methane-ui/ssr/dom-shim';
import '@methane-ui/ui/button';
import '@methane-ui/admin/kanban';
import { html } from 'lit';
import { renderWithMetadata } from '@methane-ui/ssr';

const { html: dsdHtml, links } = await renderWithMetadata(
  html\`<mth-kanban .lanes=\${lanes} .cards=\${cards}></mth-kanban>\`,
  { styles: 'linked', assetBase: '/_methane/styles' },
);`,
  },
  {
    value: 'react-19',
    label: 'React 19',
    language: 'tsx',
    code: `import '@methane-ui/tokens/tokens.css';
import '@methane-ui/ui/button';
import '@methane-ui/ui/input';
import '@methane-ui/react';

export function ValveThresholdCard() {
  return (
    <mth-form onmth-submit={(e) => console.log(e.detail.values)}>
      <mth-input name="station" label="Station ID" value="PERM-B4" required />
      <mth-button type="submit" variant="solid">Arm Interlock</mth-button>
    </mth-form>
  );
}`,
  },
  {
    value: 'vue-3',
    label: 'Vue 3',
    language: 'html',
    code: `<script setup lang="ts">
import { ref } from 'vue';
import '@methane-ui/ui/input';
import '@methane-ui/ui/button';
import { MthInput, MthButton } from '@methane-ui/vue';
const ppm = ref('35');
</script>
<template>
  <MthInput v-model="ppm" label="Shutoff ppm" />
  <MthButton variant="solid">Apply</MthButton>
</template>`,
  },
  {
    value: 'angular-17',
    label: 'Angular 17+',
    language: 'typescript',
    code: `import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MthInputDirective, MthButtonDirective } from '@methane-ui/angular';

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ReactiveFormsModule, MthInputDirective, MthButtonDirective],
  template: \`<mth-input [formControl]="station"></mth-input><mth-button variant="solid">Sync</mth-button>\`,
})
export class StationFormComponent {
  station = new FormControl('PERM-B4', { nonNullable: true });
}`,
  },
  {
    value: 'svelte-5',
    label: 'Svelte 5',
    language: 'html',
    code: `<script lang="ts">
  import MthInput from '@methane-ui/svelte/MthInput.svelte';
  import MthButton from '@methane-ui/svelte/MthButton.svelte';
  let callsign = $state('LDAR-ALPHA-04');
</script>
<MthInput bind:value={callsign} label="Crew Callsign" />
<MthButton variant="solid">Dispatch {callsign}</MthButton>`,
  },
  {
    value: 'codemod',
    label: 'White-Label Codemod',
    language: 'bash',
    code: `# Rebrand <mth-*> tags and --mth-* tokens to <atmos-*> / --atmos-*
npx methane-codemod prefix --from mth --to atmos "src/**/*.{ts,tsx,html,css}"`,
  },
];
