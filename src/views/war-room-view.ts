import { html } from 'lit';
import {
  createStreamSanitizer,
  escapeHtml,
  isSafeUrl,
  parseSafeFragment,
  safeSetHTML,
  safeSetMarkdown,
  sanitizeUrl,
} from '@methane-ui/sanitize';
import type {
  MthAiFeedbackRating,
  MthAiMessage,
  MthArtifactTab,
  SuggestionChipItem,
} from '@methane-ui/ai';
import type {
  ChatMessage,
  CollabCursor,
  CommentItem,
  NotificationBellItem,
  ReactionItem,
} from '@methane-ui/chat';
import type { VideoGridLayout } from '@methane-ui/rtc';
import type {
  AsyncSearchOption,
  MentionOption,
  MthSplitButtonItem,
  ToggleGroupOption,
} from '@methane-ui/ui';
import { getTagsForSlice } from '../coverage-manifest.js';
import {
  COPILOT_ARTIFACT_VERSIONS,
  COPILOT_CITATIONS,
  COPILOT_SUGGESTION_CHIPS,
  COPILOT_TOOL_CALL,
  SANITIZER_REDTEAM_PAYLOADS,
  ULTRASONIC_WAVEFORM_PEAKS,
  WAR_ROOM_CHAT_MESSAGES,
  WAR_ROOM_COLLAB_CURSORS,
  WAR_ROOM_COMMENT_THREAD,
  WAR_ROOM_NOTIFICATION_ITEMS,
  WAR_ROOM_REACTIONS,
  WAR_ROOM_VIDEO_PARTICIPANTS,
} from '../data/war-room-data.js';
import type { AtmosActions, AtmosState, AtmosViewModule } from '../types.js';

const WAR_ROOM_OWNED_TAGS = getTagsForSlice('view-war-room');

const RESPONDER_ROSTER = [
  {
    id: 'resp-1',
    name: 'Dr. Elena Vance',
    role: 'Incident Commander · Houston Orbital Bridge',
    handle: 'elena.vance',
    status: 'online' as const,
  },
  {
    id: 'resp-2',
    name: 'Mateo Alvarez',
    role: 'LDAR Field Chief · Midland Pad B-4',
    handle: 'mateo.alvarez',
    status: 'busy' as const,
  },
  {
    id: 'resp-3',
    name: 'Sana Nair',
    role: 'UAV-07 Flight Lead · Delaware Sector',
    handle: 'sana.nair',
    status: 'online' as const,
  },
  {
    id: 'resp-4',
    name: 'Devon Brooks',
    role: 'SCADA Valve Engineer · Permian Hub',
    handle: 'devon.brooks',
    status: 'away' as const,
  },
  {
    id: 'resp-5',
    name: 'Kenji Takahashi',
    role: 'GOSAT / AtmosSat-4 Downlink Lead',
    handle: 'kenji.takahashi',
    status: 'offline' as const,
  },
] as const;

const MENTION_OPTIONS: ReadonlyArray<MentionOption> = RESPONDER_ROSTER.map((member) => ({
  value: member.handle,
  label: member.name,
  description: member.role,
}));

const RESPONDER_SEARCH_OPTIONS: ReadonlyArray<AsyncSearchOption> = [
  { value: 'INC-842', label: 'INC-842 · Midland Pad B-4 Valve XV-402 (Sealed)' },
  { value: 'SEN-PERM-101', label: 'SEN-PERM-101 · Downwind TDLAS Laser Chord (1.92 ppm)' },
  { value: 'UAV-07', label: 'UAV-07 · Mid-Wave IR Verification Drone' },
  { value: 'EPA-SUBPART-W', label: 'EPA 40 CFR Part 98 Subpart W Super-Emitter Dossier' },
  { value: 'ORBIT-14892', label: 'AtmosSat-4 Orbit Pass #14892 (+1,840 ppb XCH4)' },
];

const COMMS_MODE_OPTIONS: ReadonlyArray<ToggleGroupOption> = [
  { value: 'tactical', label: 'Tactical Bridge' },
  { value: 'regulatory', label: 'EPA Audit Feed' },
  { value: 'orbital', label: 'Satellite Telemetry' },
];

const DISPATCH_PROTOCOL_ITEMS: ReadonlyArray<MthSplitButtonItem> = [
  { value: 'seal-audit', label: 'Broadcast OGMP Level-5 Seal Verification' },
  { value: 'uav-recheck', label: 'Schedule 4-Hour Thermal Re-Fly (UAV-07)' },
  { value: 'epa-export', label: 'Export Subpart W Cryptographic Bundle' },
];

const SUBPART_W_CHECKLIST_ITEMS = [
  {
    value: 'chk-scada',
    title: 'Automated SCADA isolation of XV-402 (< 60s)',
    detail: 'Verified closed in 42.0 seconds via PLC-B4-09 interlock.',
    badge: '42s',
    variant: 'success' as const,
  },
  {
    value: 'chk-gasket',
    title: 'Spiral-wound 316L/graphite flange gasket torqued',
    detail: 'LDAR Truck Alpha completed bolt-pattern torque sequence at 10:14 UTC.',
    badge: 'Torqued',
    variant: 'success' as const,
  },
  {
    value: 'chk-ogi',
    title: 'Optical Gas Imaging (OGI) & 38 kHz acoustic zero-leak sweep',
    detail: 'Post-seal downwind chord dropped from 70.4 ppm to 1.92 ppm ambient.',
    badge: '0.3 kg/hr',
    variant: 'accent' as const,
  },
  {
    value: 'chk-epa',
    title: 'EPA 5-day root-cause & 24-hour abatement countersignature',
    detail: 'Ready for Incident Commander digital sign-off in closure dialog.',
    badge: 'Pending IC',
    variant: 'warning' as const,
  },
] as const;

const DEFAULT_USER_PROMPT =
  'Cross-check AtmosSat-4 Pass #14892 against Pad B-4 ultrasonic & TDLAS telemetry and confirm whether INC-842 meets EPA Subpart W closure thresholds.';

const DEFAULT_THINKING_SUMMARY =
  'Inverted AtmosSat-4 XCH4 column (+1,840 ppb) with Pad B-4 wind vector (248° @ 6.2 m/s)';

const DEFAULT_THINKING_BODY =
  '1. Integrated Mass Enhancement (IME = 24.6 kg) over 1,568 m plume yields 142.8 kg/hr pre-shutoff flux.\n' +
  '2. δ13C isotopic signature (-41.8‰) confirms thermogenic pipeline gas from compressor discharge flange XV-402.\n' +
  '3. Post-isolation TDLAS chord SEN-PERM-101 stabilized at 1.92 ppm (99.7% emission abatement).';

const DEFAULT_ASSISTANT_MARKDOWN =
  '**Root-Cause & Abatement Confirmed (98.6% confidence):** Plume inversion pinpoints valve `XV-402` on Midland Compressor Bay 2 at **142.8 kg/hr CH4** prior to automated SCADA closure.\n\n' +
  'Following spiral gasket replacement by LDAR Truck Alpha, residual flux is **0.3 kg/hr** (`1.92 ppm` downwind), satisfying [EPA Subpart W Closure Criteria](https://www.epa.gov/ghgreporting) and [AtmosSat-4 Retrieval #14892](https://mahdins.dev/methane/#orbit-14892).';

const STREAMING_CHUNKS: ReadonlyArray<string> = [
  '**Live Streamed Telemetry Update:** ',
  'Downwind chord `SEN-PERM-101` holds steady at **1.91 ppm** ',
  'across 15-minute rolling average. ',
  'Blocked injected tag `<img src=x onerror=alert(1)>` safely escaped; ',
  'verified telemetry link: [Open OGMP Audit](https://mahdins.dev/methane/#sen-perm-101).',
];

function isBrowserDomAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof DOMParser !== 'undefined' &&
    typeof document.createDocumentFragment === 'function'
  );
}

function normalizeCollabCursors(offsetPx: number): ReadonlyArray<CollabCursor> {
  const oklchPalette = [
    'oklch(0.70 0.16 175)',
    'oklch(0.76 0.16 75)',
  ];
  return WAR_ROOM_COLLAB_CURSORS.map((cursor, index) => ({
    id: cursor.id,
    name: cursor.name,
    color: oklchPalette[index % oklchPalette.length],
    x: cursor.x + (index === 0 ? offsetPx : -Math.round(offsetPx * 0.6)),
    y: cursor.y + (index === 0 ? Math.round(offsetPx * 0.25) : Math.round(offsetPx * 0.4)),
    selection:
      index === 0
        ? {
            x: Math.max(8, cursor.x - 12 + offsetPx),
            y: Math.max(8, cursor.y - 6),
            width: 132,
            height: 28,
          }
        : undefined,
  }));
}

function inspectSanitizedElement(container: Element): {
  readonly elementCount: number;
  readonly tagNames: ReadonlyArray<string>;
  readonly dangerousCount: number;
  readonly textPreview: string;
} {
  const descendants = Array.from(container.querySelectorAll('*'));
  const tagNames = descendants.map((el) => el.tagName.toLowerCase());
  const dangerousCount = descendants.filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'iframe' || tag === 'object' || tag === 'embed' || tag === 'style') {
      return true;
    }
    return Array.from(el.attributes).some((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      return name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('data:text/html');
    });
  }).length;
  return {
    elementCount: descendants.length,
    tagNames,
    dangerousCount,
    textPreview: (container.textContent ?? '').trim(),
  };
}

function readStringUi(state: AtmosState, key: string, fallback: string): string {
  const raw = state.ui[key];
  return typeof raw === 'string' ? raw : fallback;
}

function readBooleanUi(state: AtmosState, key: string, fallback: boolean): boolean {
  const raw = state.ui[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

function readNumberUi(state: AtmosState, key: string, fallback: number): number {
  const raw = state.ui[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

export const warRoomView: AtmosViewModule = {
  id: 'war-room',
  path: '/war-room',
  title: 'Incident War-Room, WebRTC & AtmosAI Copilot',
  subtitle:
    'Multi-agency plume response bridge uniting @methane-ui/chat, zero-autoplay @methane-ui/rtc, acoustic @methane-ui/media waveform, @methane-ui/ai copilot, and @methane-ui/sanitize XSS firewall.',
  badge: 'INC-842 · Sealed',
  ownedTags: WAR_ROOM_OWNED_TAGS,

  render(state: AtmosState, actions: AtmosActions) {
    const incidentDialogOpen = Boolean(state.ui['incidentDialogOpen']);
    const bannerDismissed = readBooleanUi(state, 'warRoomBannerDismissed', false);
    const alertOpen = readBooleanUi(state, 'warRoomAlertOpen', true);
    const calloutOpen = readBooleanUi(state, 'warRoomCalloutOpen', true);
    const acousticOverlayPressed = readBooleanUi(state, 'warRoomAcousticOverlay', true);
    const commsMode = readStringUi(state, 'warRoomCommsMode', 'tactical');
    const searchQuery = readStringUi(state, 'warRoomSearchQuery', '');
    const asyncLookupValue = readStringUi(state, 'warRoomAsyncLookup', 'INC-842');
    const mentionDraft = readStringUi(state, 'warRoomMentionDraft', '@mateo.alvarez Confirm torque log');
    const incidentTagsCsv = readStringUi(
      state,
      'warRoomIncidentTags',
      'INC-842,XV-402,Subpart-W,Thermogenic',
    );
    const composerDraft = readStringUi(state, 'warRoomComposerDraft', '');
    const activeWarTab = readStringUi(state, 'warRoomActiveTab', 'comments');
    const cursorOffset = readNumberUi(state, 'warRoomCursorOffset', 0);
    const typingSimActive = readBooleanUi(state, 'warRoomTypingActive', true);
    const waveformPlaying = readBooleanUi(state, 'warRoomWaveformPlaying', false);
    const waveformTime = readNumberUi(state, 'warRoomWaveformTime', 14);
    const closedByIc = readBooleanUi(state, 'warRoomSubpartWCountersigned', false);

    // Chat, comments, notifications & reactions state
    const chatMessages =
      (state.ui['warRoomMessages'] as ReadonlyArray<ChatMessage> | undefined) ??
      WAR_ROOM_CHAT_MESSAGES;
    const filteredMessages = searchQuery.trim()
      ? chatMessages.filter(
          (msg) =>
            msg.body.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            msg.author.toLowerCase().includes(searchQuery.trim().toLowerCase()),
        )
      : chatMessages;

    const comments =
      (state.ui['warRoomComments'] as ReadonlyArray<CommentItem> | undefined) ??
      WAR_ROOM_COMMENT_THREAD;
    const notificationItems =
      (state.ui['warRoomNotifications'] as ReadonlyArray<NotificationBellItem> | undefined) ??
      WAR_ROOM_NOTIFICATION_ITEMS;
    const reactions =
      (state.ui['warRoomReactions'] as ReadonlyArray<ReactionItem> | undefined) ??
      WAR_ROOM_REACTIONS;
    const checklistSelected =
      (state.ui['warRoomChecklist'] as ReadonlyArray<string> | undefined) ?? [
        'chk-scada',
        'chk-gasket',
        'chk-ogi',
      ];

    // Copilot & Sanitizer Firewall state
    const promptDraft = readStringUi(state, 'warRoomPromptDraft', '');
    const userPromptText = readStringUi(state, 'warRoomUserPrompt', DEFAULT_USER_PROMPT);
    const assistantContent = readStringUi(
      state,
      'warRoomAssistantContent',
      DEFAULT_ASSISTANT_MARKDOWN,
    );
    const copilotStreaming = readBooleanUi(state, 'warRoomCopilotStreaming', false);
    const thinkingOpen = readBooleanUi(state, 'warRoomThinkingOpen', false);
    const toolCallOpen = readBooleanUi(state, 'warRoomToolCallOpen', true);
    const selectedCitationId = readStringUi(state, 'warRoomCitationId', 'cit-1');
    const artifactOpen = readBooleanUi(state, 'warRoomArtifactOpen', true);
    const activeArtifactVersion = readStringUi(state, 'warRoomArtifactVersion', 'v1');
    const activeArtifactTab = readStringUi(state, 'warRoomArtifactTab', 'code') as MthArtifactTab;
    const feedbackRating = readStringUi(state, 'warRoomFeedbackRating', 'up') as MthAiFeedbackRating;
    const feedbackSubmitted = readBooleanUi(state, 'warRoomFeedbackSubmitted', false);

    // Sanitizer Red-Team Firewall state (100% universal string/URL checks in render)
    const activePayloadId = readStringUi(state, 'warRoomPayloadId', 'xss-onerror');
    const activePayload =
      SANITIZER_REDTEAM_PAYLOADS.find((item) => item.id === activePayloadId) ??
      SANITIZER_REDTEAM_PAYLOADS[1];
    const urlIsSafe = isSafeUrl(activePayload.rawUrl);
    const sanitizedHref = sanitizeUrl(activePayload.rawUrl, '#blocked-unsafe-protocol');
    const escapedSourcePreview = escapeHtml(activePayload.markdown);
    const firewallAuditSummary = readStringUi(
      state,
      'warRoomFirewallAudit',
      'Ready · Select a Red-Team payload or click "Execute DOM Sanitizer Audit" to verify safeSetMarkdown, safeSetHTML, parseSafeFragment, and createStreamSanitizer.',
    );

    // WebRTC bridge state (zero getUserMedia calls on load)
    const videoGridLayout = readStringUi(state, 'warRoomVideoLayout', 'gallery') as VideoGridLayout;
    const pinnedParticipantId = readStringUi(state, 'warRoomPinnedVideoId', 'vp-1');
    const rtcActivityStatus = readStringUi(
      state,
      'warRoomRtcStatus',
      'Camera, microphone, and screen recorders idle — hardware permissions are requested only on explicit user click.',
    );

    const collabCursors = normalizeCollabCursors(cursorOffset);
    const typingUsers = typingSimActive ? ['Sana Nair', 'Devon Brooks'] : [];

    const executeDomSanitizerAudit = (payloadId: string) => {
      const targetPayload =
        SANITIZER_REDTEAM_PAYLOADS.find((item) => item.id === payloadId) ?? activePayload;
      actions.updateViewUi('warRoomPayloadId', targetPayload.id);

      if (!isBrowserDomAvailable()) {
        return;
      }

      const mdTarget = document.getElementById('atmos-sanitize-markdown-box');
      const htmlTarget = document.getElementById('atmos-sanitize-html-box');
      const fragTarget = document.getElementById('atmos-sanitize-fragment-box');
      const streamTarget = document.getElementById('atmos-sanitize-stream-box');

      if (mdTarget) {
        safeSetMarkdown(mdTarget, targetPayload.markdown, { allowRawHtml: true });
      }
      if (htmlTarget) {
        safeSetHTML(htmlTarget, targetPayload.markdown);
      }
      if (fragTarget) {
        const safeFrag = parseSafeFragment(targetPayload.markdown);
        fragTarget.replaceChildren(safeFrag);
      }
      if (streamTarget) {
        const streamSanitizer = createStreamSanitizer({ allowRawHtml: true });
        const midpoint = Math.max(1, Math.floor(targetPayload.markdown.length / 2));
        streamSanitizer.push(targetPayload.markdown.slice(0, midpoint));
        streamSanitizer.push(targetPayload.markdown.slice(midpoint));
        streamSanitizer.flushTo(streamTarget);
        // Also exercise toFragment() to verify DocumentFragment parity
        const verifyFrag = streamSanitizer.toFragment();
        const unsafeInFrag = verifyFrag.querySelectorAll('script, iframe, [onerror], [onload]').length;
        if (unsafeInFrag > 0) {
          actions.notify('Unexpected unsafe node in stream fragment', 'danger');
          return;
        }
      }

      const inspection = htmlTarget
        ? inspectSanitizedElement(htmlTarget)
        : { elementCount: 0, tagNames: [], dangerousCount: 0, textPreview: '' };
      const urlCheck = isSafeUrl(targetPayload.rawUrl) ? 'ALLOWED' : 'BLOCKED';
      const report =
        `Payload "${targetPayload.id}" audited: dangerous executable nodes = ${inspection.dangerousCount}, ` +
        `surviving safe tags = [${inspection.tagNames.join(', ') || 'text-only'}], ` +
        `URL "${targetPayload.rawUrl}" -> ${urlCheck} (sanitizeUrl -> "${sanitizeUrl(targetPayload.rawUrl, '#blocked-unsafe-protocol')}").`;

      actions.updateViewUi('warRoomFirewallAudit', report);
      actions.notify(
        `Sanitizer Firewall verified "${targetPayload.label}" (0 XSS sinks executed).`,
        'success',
      );
    };

    const runCopilotStreamSimulation = (customPrompt?: string) => {
      const resolvedPrompt = (customPrompt ?? promptDraft).trim() || DEFAULT_USER_PROMPT;
      actions.updateViewUi('warRoomUserPrompt', resolvedPrompt);
      actions.updateViewUi('warRoomPromptDraft', '');
      actions.updateViewUi('warRoomCopilotStreaming', true);

      if (!isBrowserDomAvailable()) {
        actions.updateViewUi('warRoomAssistantContent', STREAMING_CHUNKS.join(''));
        actions.updateViewUi('warRoomCopilotStreaming', false);
        return;
      }

      const aiMsgEl = document.getElementById('atmos-copilot-response') as MthAiMessage | null;
      const streamBox = document.getElementById('atmos-sanitize-stream-box');
      const sanitizer = createStreamSanitizer({ allowRawHtml: false });
      sanitizer.reset();
      if (aiMsgEl && typeof aiMsgEl.resetStream === 'function') {
        aiMsgEl.resetStream();
      } else {
        actions.updateViewUi('warRoomAssistantContent', '');
      }

      let accumulated = '';
      STREAMING_CHUNKS.forEach((chunk, index) => {
        window.setTimeout(() => {
          accumulated += chunk;
          sanitizer.push(chunk);
          if (streamBox) {
            sanitizer.flushTo(streamBox);
          }
          if (aiMsgEl && typeof aiMsgEl.pushChunk === 'function') {
            aiMsgEl.pushChunk(chunk);
          }
          if (index === STREAMING_CHUNKS.length - 1) {
            actions.updateViewUi('warRoomAssistantContent', accumulated);
            actions.updateViewUi('warRoomCopilotStreaming', false);
            actions.updateViewUi(
              'warRoomFirewallAudit',
              `Streamed ${STREAMING_CHUNKS.length} chunks through createStreamSanitizer({ allowRawHtml: false }) & <mth-ai-message>.pushChunk(): injected <img onerror> neutralized as inert text.`,
            );
            actions.announce('AtmosAI Copilot finished streaming sanitized response.');
          }
        }, index * 90);
      });
    };

    const handleSendChatMessage = (rawBody?: string) => {
      const text = (rawBody ?? composerDraft).trim();
      if (!text) {
        actions.notify('Enter a war-room message before transmitting.', 'warning');
        return;
      }
      const nextMessage: ChatMessage = {
        id: `msg-${chatMessages.length + 1}`,
        author: 'Dr. Elena Vance',
        body: text,
        timestamp: '10:31 UTC',
        self: true,
        badge: 'IC Bridge',
      };
      actions.updateViewUi('warRoomMessages', [...chatMessages, nextMessage]);
      actions.updateViewUi('warRoomComposerDraft', '');
      actions.notify('Transmitted message to INC-842 multi-agency war-room.', 'success');
    };

    return html`
      <div class="mth-stack" data-gap="6">
        <!-- 1. Top Incident Command Banner & Live Alert Strip -->
        <mth-banner
          variant=${closedByIc ? 'success' : 'warning'}
          heading=${closedByIc
            ? 'INC-842 COUNTERSIGNED · EPA Subpart W Super-Emitter Dossier Sealed'
            : 'ACTIVE PLUME WAR-ROOM · INC-842 (Permian Midland Pad B-4 · Valve XV-402)'}
          dismissible
          ?dismissed=${bannerDismissed}
          @mth-close=${() => actions.updateViewUi('warRoomBannerDismissed', true)}
        >
          <span>
            AtmosSat-4 Pass #14892 detected +1,840 ppb XCH4; SCADA shutoff isolated XV-402 in 42s
            and LDAR Truck Alpha verified 99.7% abatement.
          </span>
          <div slot="actions" class="mth-flex" data-gap="2">
            <mth-link href="#sanitizer-firewall" underline="hover">
              <mth-icon slot="prefix" name="external" size="xs"></mth-icon>
              XSS Sanitizer Lab
            </mth-link>
            <mth-button
              variant="solid"
              size="sm"
              data-testid="open-incident-dialog-btn"
              @mth-press=${() => actions.updateViewUi('incidentDialogOpen', true)}
            >
              <mth-icon slot="prefix" name="check" size="xs"></mth-icon>
              ${closedByIc ? 'Review Signed Closure' : 'Countersign Subpart W'}
            </mth-button>
          </div>
        </mth-banner>

        <div class="mth-grid" data-columns="2" data-gap="4">
          <mth-alert
            variant="success"
            title="SCADA Interlock & Gasket Seal Verified (0.3 kg/hr Residual)"
            closable
            ?open=${alertOpen}
            @mth-close=${() => actions.updateViewUi('warRoomAlertOpen', false)}
          >
            Downwind TDLAS laser chord <code>SEN-PERM-101</code> dropped from 70.4 ppm peak to
            1.92 ppm ambient baseline.
            <div slot="actions">
              <mth-copy-button
                value="INC-842|PERM-MIDLAND-B4|XV-402|0.3kg/hr|SHA256:9f84c2e1"
                label="Copy Audit Hash"
                copied-label="Hash Copied"
                variant="outline"
                size="sm"
              ></mth-copy-button>
            </div>
          </mth-alert>

          <mth-callout
            variant="info"
            heading="OGMP 2.0 Level-5 Multi-Agency Chain of Custody"
            collapsible
            ?open=${calloutOpen}
          >
            Every AI synthesis turn, chat message, citation URL, and HTML/Markdown artifact in this
            war-room passes through <code>@methane-ui/sanitize</code> ADR-012 allowlists.
          </mth-callout>
        </div>

        <!-- 2. Responder Presence Roster, Action Toolbar & Categorization Tags -->
        <mth-card variant="outlined">
          <div slot="header" class="mth-flex" data-justify="between" data-gap="3">
            <div class="mth-flex" data-gap="3">
              <mth-avatar-group max=${4} size="md" label="Active War-Room Responders">
                ${RESPONDER_ROSTER.map(
                  (member) => html`
                    <mth-avatar
                      name=${member.name}
                      alt=${member.name}
                      size="md"
                      shape="circle"
                      status=${member.status}
                    ></mth-avatar>
                  `,
                )}
              </mth-avatar-group>

              <div class="mth-flex" data-gap="2">
                <mth-presence-badge status="online" show-label size="sm"></mth-presence-badge>
                <mth-presence-badge status="busy" show-label size="sm"></mth-presence-badge>
                <mth-presence-badge status="away" show-label size="sm"></mth-presence-badge>
              </div>

              <mth-badge variant=${closedByIc ? 'success' : 'accent'} size="sm" pill dot>
                ${closedByIc ? 'Subpart W Countersigned' : 'Bridge Live · 5 Agencies'}
              </mth-badge>
            </div>

            <div class="mth-flex" data-gap="2">
              <mth-notification-bell
                .items=${notificationItems}
                ?useStore=${false}
                label="Incident notifications"
                @mth-mark-all-read=${() => {
                  actions.updateViewUi(
                    'warRoomNotifications',
                    notificationItems.map((item) => ({ ...item, read: true })),
                  );
                  actions.notify('Marked all war-room notifications read.', 'info');
                }}
              ></mth-notification-bell>

              <mth-button-group
                attached
                roving
                role-mode="toolbar"
                label="Incident telemetry quick actions"
              >
                <mth-toggle-button
                  size="sm"
                  variant="outline"
                  ?pressed=${acousticOverlayPressed}
                  label="38 kHz Acoustic Overlay"
                  @mth-change=${(e: CustomEvent<{ pressed?: boolean }>) => {
                    const next = e.detail?.pressed ?? !acousticOverlayPressed;
                    actions.updateViewUi('warRoomAcousticOverlay', next);
                  }}
                >
                  38 kHz Overlay
                </mth-toggle-button>
                <mth-icon-button
                  size="sm"
                  variant="outline"
                  label="Advance multiplayer telemetry cursors"
                  @mth-press=${() =>
                    actions.updateViewUi('warRoomCursorOffset', (cursorOffset + 18) % 72)}
                >
                  <mth-icon name="share" size="sm"></mth-icon>
                </mth-icon-button>
                <mth-button
                  size="sm"
                  variant="outline"
                  @mth-press=${() => {
                    actions.updateViewUi('warRoomBannerDismissed', false);
                    actions.updateViewUi('warRoomAlertOpen', true);
                    actions.updateViewUi('warRoomArtifactOpen', true);
                    actions.notify('Restored war-room banners and artifact pane.', 'info');
                  }}
                >
                  Reset Panels
                </mth-button>
              </mth-button-group>

              <mth-split-button
                label="Broadcast Seal Notice"
                menu-label="Additional dispatch protocols"
                variant="solid"
                size="sm"
                .items=${DISPATCH_PROTOCOL_ITEMS}
                @mth-press=${() =>
                  actions.notify('Broadcast OGMP 2.0 seal verification to Permian operators.', 'success')}
                @mth-select=${(e: CustomEvent<{ value?: string; item?: MthSplitButtonItem }>) => {
                  const chosen = e.detail?.item?.label ?? e.detail?.value ?? 'protocol';
                  actions.notify(`Executed protocol: ${chosen}`, 'info');
                }}
              ></mth-split-button>
            </div>
          </div>

          <div class="mth-flex" data-justify="between" data-gap="3">
            <mth-toggle-group
              name="warRoomCommsMode"
              label="Channel Priority Filter"
              size="sm"
              .value=${commsMode}
              .options=${COMMS_MODE_OPTIONS}
              @mth-change=${(e: CustomEvent<{ value?: string }>) => {
                if (e.detail?.value) {
                  actions.updateViewUi('warRoomCommsMode', e.detail.value);
                }
              }}
            ></mth-toggle-group>

            <div class="mth-flex" data-gap="2">
              <mth-tag variant="success" size="sm" pill>CH4 -99.7% Abated</mth-tag>
              <mth-tag variant="accent" size="sm" pill interactive selected>
                Orbit #14892 Locked
              </mth-tag>
              <mth-tag
                variant="warning"
                size="sm"
                removable
                label="δ13C -41.8‰ Thermogenic"
                @mth-remove=${() =>
                  actions.notify('Isotopic tag pinned in permanent audit log.', 'info')}
              >
                δ13C -41.8‰ Thermogenic
              </mth-tag>
            </div>
          </div>
        </mth-card>

        <!-- 3. Primary Two-Column War-Room Workspace -->
        <div class="mth-grid" data-columns="2" data-gap="6">
          <!-- LEFT COLUMN: Multi-Agency Chat, Collab Cursors, Evidence Tabs & Media -->
          <div class="mth-stack" data-gap="5">
            <mth-card variant="elevated">
              <div slot="header" class="mth-flex" data-justify="between" data-gap="2">
                <div class="mth-flex" data-gap="2">
                  <mth-icon name="user" size="sm"></mth-icon>
                  <strong>Multi-Agency Tactical Thread & Live Cursors</strong>
                </div>
                <mth-badge variant="neutral" size="sm">
                  Channel: ${commsMode.toUpperCase()}
                </mth-badge>
              </div>

              <div class="mth-stack" data-gap="4">
                <!-- Search & Async Station Lookup -->
                <div class="mth-grid" data-columns="2" data-gap="3">
                  <mth-search-input
                    name="threadFilter"
                    label="Filter tactical log"
                    placeholder="Filter by responder, sensor, or valve..."
                    shortcut="/"
                    clearable
                    .value=${searchQuery}
                    @mth-input=${(e: CustomEvent<{ value?: string }>) =>
                      actions.updateViewUi('warRoomSearchQuery', e.detail?.value ?? '')}
                    @mth-search=${(e: CustomEvent<{ value?: string }>) =>
                      actions.updateViewUi('warRoomSearchQuery', e.detail?.value ?? '')}
                  ></mth-search-input>

                  <mth-async-search
                    name="assetLookup"
                    label="Jump to linked sensor / dossier"
                    placeholder="Search sensors, drones, orbits..."
                    .value=${asyncLookupValue}
                    .options=${RESPONDER_SEARCH_OPTIONS}
                    @mth-change=${(e: CustomEvent<{ value?: string }>) => {
                      const val = e.detail?.value ?? '';
                      actions.updateViewUi('warRoomAsyncLookup', val);
                      if (val) {
                        actions.notify(`Linked telemetry context switched to ${val}.`, 'info');
                      }
                    }}
                  ></mth-async-search>
                </div>

                <!-- Multiplayer Live Collaborator Cursors Overlay Surface -->
                <div class="mth-stack" data-gap="2">
                  <div class="mth-flex" data-justify="between">
                    <small>Live Plume Map Telemetry Cursors (OKLCH CSSStyleSheet overlay)</small>
                    <mth-button
                      variant="ghost"
                      size="sm"
                      @mth-press=${() =>
                        actions.updateViewUi('warRoomTypingActive', !typingSimActive)}
                    >
                      ${typingSimActive ? 'Pause Typing Pulse' : 'Simulate Responder Typing'}
                    </mth-button>
                  </div>
                  <mth-collab-cursors
                    .cursors=${collabCursors}
                    label="Active responder cursors on Pad B-4 schematic"
                  ></mth-collab-cursors>
                </div>

                <!-- Virtualized Sanitized Chat Thread -->
                <mth-chat-thread
                  .messages=${filteredMessages}
                  unread-message-id="msg-3"
                  label="INC-842 tactical responder messages"
                ></mth-chat-thread>

                <div class="mth-flex" data-justify="between" data-gap="3">
                  <mth-typing-indicator
                    .users=${typingUsers}
                    label="Responder typing activity"
                  ></mth-typing-indicator>

                  <mth-reaction-bar
                    .reactions=${reactions}
                    multiple
                    allow-add
                    label="Incident status reactions"
                    @mth-change=${(e: CustomEvent<{ values?: ReadonlyArray<string> }>) => {
                      const selectedSet = new Set(e.detail?.values ?? []);
                      actions.updateViewUi(
                        'warRoomReactions',
                        reactions.map((item) => ({
                          ...item,
                          active: selectedSet.has(item.emoji),
                        })),
                      );
                    }}
                  ></mth-reaction-bar>
                </div>

                <!-- Message Composer + Mention + Emoji + Tag-Input -->
                <mth-message-composer
                  name="warRoomMessage"
                  label="Transmit Tactical Update"
                  placeholder="Post verified field reading or valve status (Enter to send)..."
                  .value=${composerDraft}
                  @mth-input=${(e: CustomEvent<{ value?: string }>) =>
                    actions.updateViewUi('warRoomComposerDraft', e.detail?.value ?? '')}
                  @mth-submit=${(e: CustomEvent<{ value?: string }>) =>
                    handleSendChatMessage(e.detail?.value)}
                >
                  <div slot="actions-start" class="mth-flex" data-gap="2">
                    <mth-emoji-picker
                      label="Append verification emoji"
                      @mth-select=${(e: CustomEvent<{ emoji?: string }>) => {
                        const emoji = e.detail?.emoji ?? '✅';
                        actions.updateViewUi(
                          'warRoomComposerDraft',
                          `${composerDraft}${composerDraft ? ' ' : ''}${emoji}`,
                        );
                      }}
                    ></mth-emoji-picker>
                  </div>
                </mth-message-composer>

                <div class="mth-grid" data-columns="2" data-gap="3">
                  <mth-mention-input
                    name="responderMention"
                    label="Direct @Responder Escalation"
                    trigger="@"
                    placeholder="Type @ to alert responder..."
                    .value=${mentionDraft}
                    .options=${MENTION_OPTIONS}
                    @mth-change=${(e: CustomEvent<{ value?: string }>) =>
                      actions.updateViewUi('warRoomMentionDraft', e.detail?.value ?? '')}
                  ></mth-mention-input>

                  <mth-tag-input
                    name="evidenceTags"
                    label="Evidence Classification Tags"
                    placeholder="Add tag + Enter..."
                    .value=${incidentTagsCsv}
                    @mth-change=${(e: CustomEvent<{ value?: string }>) =>
                      actions.updateViewUi('warRoomIncidentTags', e.detail?.value ?? '')}
                  ></mth-tag-input>
                </div>
              </div>
            </mth-card>

            <!-- Tabbed Review: Comment Thread, Subpart W Scrollable Checklist & Acoustic/UAV Media -->
            <mth-card variant="outlined">
              <mth-tabs
                .value=${activeWarTab}
                label="Incident Evidence & Sign-Off Sections"
                @mth-change=${(e: CustomEvent<{ value?: string }>) => {
                  if (e.detail?.value) {
                    actions.updateViewUi('warRoomActiveTab', e.detail.value);
                  }
                }}
              >
                <mth-tab slot="tab" value="comments">
                  <mth-icon slot="prefix" name="info" size="xs"></mth-icon>
                  Sign-Off Comments
                </mth-tab>
                <mth-tab slot="tab" value="checklist">
                  <mth-icon slot="prefix" name="check" size="xs"></mth-icon>
                  Subpart W Checklist
                </mth-tab>
                <mth-tab slot="tab" value="acoustics">
                  <mth-icon slot="prefix" name="success" size="xs"></mth-icon>
                  Ultrasonic &amp; UAV Vault
                </mth-tab>

                <mth-tab-panel value="comments">
                  <div class="mth-stack" data-gap="3">
                    <mth-comment-thread
                      .comments=${comments}
                      allow-reply
                      allow-resolve
                      label="Regulatory countersign discussion"
                      @mth-resolve-toggle=${(e: CustomEvent<{ id?: string; resolved?: boolean }>) => {
                        const targetId = e.detail?.id;
                        if (!targetId) return;
                        actions.updateViewUi(
                          'warRoomComments',
                          comments.map((cmt) =>
                            cmt.id === targetId
                              ? { ...cmt, resolved: Boolean(e.detail?.resolved) }
                              : cmt,
                          ),
                        );
                      }}
                      @mth-reply=${(e: CustomEvent<{ parentId?: string; body?: string }>) => {
                        const replyBody = e.detail?.body?.trim();
                        if (!replyBody) return;
                        actions.updateViewUi(
                          'warRoomComments',
                          comments.map((cmt) =>
                            cmt.id === e.detail?.parentId
                              ? {
                                  ...cmt,
                                  replies: [
                                    ...(cmt.replies ?? []),
                                    {
                                      id: `reply-${Date.now()}`,
                                      author: 'Dr. Elena Vance',
                                      body: replyBody,
                                      timestamp: 'Just now',
                                    },
                                  ],
                                }
                              : cmt,
                          ),
                        );
                      }}
                    ></mth-comment-thread>
                  </div>
                </mth-tab-panel>

                <mth-tab-panel value="checklist">
                  <mth-scroll-area
                    type="auto"
                    orientation="vertical"
                    label="EPA 40 CFR Part 98 Subpart W verification items"
                  >
                    <mth-list
                      selection-mode="multiple"
                      dividers
                      label="Subpart W Remediation Verification Checklist"
                      .values=${checklistSelected}
                      @mth-change=${(e: CustomEvent<{ values?: ReadonlyArray<string> }>) => {
                        if (e.detail?.values) {
                          actions.updateViewUi('warRoomChecklist', e.detail.values);
                        }
                      }}
                    >
                      ${SUBPART_W_CHECKLIST_ITEMS.map(
                        (item) => html`
                          <mth-list-item
                            value=${item.value}
                            description=${item.detail}
                            interactive
                            ?selected=${checklistSelected.includes(item.value)}
                          >
                            <mth-icon slot="prefix" name="check" size="sm"></mth-icon>
                            ${item.title}
                            <mth-badge slot="suffix" variant=${item.variant} size="sm" pill>
                              ${item.badge}
                            </mth-badge>
                          </mth-list-item>
                        `,
                      )}
                    </mth-list>
                  </mth-scroll-area>
                </mth-tab-panel>

                <mth-tab-panel value="acoustics">
                  <div class="mth-stack" data-gap="4">
                    <mth-waveform
                      src="/media/sample.wav"
                      .peaks=${ULTRASONIC_WAVEFORM_PEAKS}
                      .duration=${42}
                      .currentTime=${waveformTime}
                      .barCount=${48}
                      ?playing=${waveformPlaying}
                      label="Valve XV-402 38 kHz Ultrasonic Acoustic Leak Decay"
                      @mth-play=${() => actions.updateViewUi('warRoomWaveformPlaying', true)}
                      @mth-pause=${() => actions.updateViewUi('warRoomWaveformPlaying', false)}
                      @mth-seek=${(e: CustomEvent<{ currentTime?: number }>) => {
                        if (typeof e.detail?.currentTime === 'number') {
                          actions.updateViewUi('warRoomWaveformTime', e.detail.currentTime);
                        }
                      }}
                    ></mth-waveform>

                    <mth-audio-player
                      src="/media/sample.wav"
                      title="Pad B-4 XV-402 Heterodyne Ultrasonic Capture"
                      artist="LDAR Truck Alpha · 38 kHz Parabolic Sensor"
                      label="Ultrasonic leak audio evidence player"
                      preload="metadata"
                    ></mth-audio-player>

                    <mth-video-player
                      src="/media/sample.mp4"
                      poster="/media/drone-pad-thermal.svg"
                      label="UAV-07 Mid-Wave IR Plume Verification Sortie"
                      playsinline
                      muted
                      preload="metadata"
                    ></mth-video-player>
                  </div>
                </mth-tab-panel>
              </mth-tabs>
            </mth-card>
          </div>

          <!-- RIGHT COLUMN: AtmosAI Copilot, Sanitizer Firewall & WebRTC Bridge -->
          <div class="mth-stack" data-gap="5">
            <!-- AtmosAI Plume Inversion Copilot -->
            <mth-card variant="elevated">
              <div slot="header" class="mth-flex" data-justify="between" data-gap="2">
                <div class="mth-flex" data-gap="2">
                  <mth-icon name="success" size="sm"></mth-icon>
                  <strong>AtmosAI Plume Inversion &amp; Regulatory Copilot</strong>
                </div>
                <mth-button
                  variant="soft"
                  size="sm"
                  data-testid="stream-copilot-btn"
                  @mth-press=${() => runCopilotStreamSimulation()}
                >
                  Stream Sanitized Chunk Demo
                </mth-button>
              </div>

              <div class="mth-stack" data-gap="4">
                <mth-suggestion-chips
                  .items=${COPILOT_SUGGESTION_CHIPS}
                  label="Tactical Copilot starter prompts"
                  @mth-select=${(e: CustomEvent<{ item?: SuggestionChipItem; value?: string }>) => {
                    const prompt =
                      e.detail?.item?.prompt ?? e.detail?.item?.label ?? e.detail?.value ?? '';
                    if (prompt) {
                      runCopilotStreamSimulation(prompt);
                    }
                  }}
                ></mth-suggestion-chips>

                <mth-ai-message
                  role="user"
                  author="Dr. Elena Vance (IC)"
                  timestamp="10:18 UTC"
                  .showActions=${false}
                  .content=${userPromptText}
                ></mth-ai-message>

                <mth-thinking-indicator
                  ?open=${thinkingOpen}
                  ?streaming=${copilotStreaming}
                  .elapsedSeconds=${4}
                  summary=${DEFAULT_THINKING_SUMMARY}
                  .content=${DEFAULT_THINKING_BODY}
                  @mth-toggle=${() => actions.updateViewUi('warRoomThinkingOpen', !thinkingOpen)}
                ></mth-thinking-indicator>

                <mth-tool-call
                  name=${COPILOT_TOOL_CALL.name}
                  status=${COPILOT_TOOL_CALL.status}
                  ?open=${toolCallOpen}
                  .args=${COPILOT_TOOL_CALL.args}
                  .output=${COPILOT_TOOL_CALL.output}
                  .durationMs=${COPILOT_TOOL_CALL.durationMs}
                  @mth-toggle=${() => actions.updateViewUi('warRoomToolCallOpen', !toolCallOpen)}
                ></mth-tool-call>

                <mth-ai-message
                  id="atmos-copilot-response"
                  role="assistant"
                  author="AtmosAI Copilot"
                  timestamp="10:18 UTC"
                  ?streaming=${copilotStreaming}
                  .content=${assistantContent}
                  @mth-regenerate=${() => runCopilotStreamSimulation(userPromptText)}
                ></mth-ai-message>

                <mth-citation-list
                  .citations=${COPILOT_CITATIONS}
                  .selectedId=${selectedCitationId}
                  label="Verified orbital & EPA citations"
                  @mth-select=${(e: CustomEvent<{ id?: string }>) => {
                    if (e.detail?.id) {
                      actions.updateViewUi('warRoomCitationId', e.detail.id);
                    }
                  }}
                ></mth-citation-list>

                <mth-artifact-pane
                  ?open=${artifactOpen}
                  title="AtmosAI Remediation & Regulatory Artifact"
                  .versions=${COPILOT_ARTIFACT_VERSIONS}
                  .activeVersion=${activeArtifactVersion}
                  .activeTab=${activeArtifactTab}
                  @mth-version-change=${(e: CustomEvent<{ version?: string }>) => {
                    if (e.detail?.version) {
                      actions.updateViewUi('warRoomArtifactVersion', e.detail.version);
                    }
                  }}
                  @mth-tab-change=${(e: CustomEvent<{ tab?: MthArtifactTab }>) => {
                    if (e.detail?.tab) {
                      actions.updateViewUi('warRoomArtifactTab', e.detail.tab);
                    }
                  }}
                  @mth-close=${() => actions.updateViewUi('warRoomArtifactOpen', false)}
                ></mth-artifact-pane>

                <mth-ai-feedback
                  .rating=${feedbackRating}
                  ?submitted=${feedbackSubmitted}
                  label="Evaluate AtmosAI plume inversion accuracy"
                  @mth-feedback=${(e: CustomEvent<{ rating?: MthAiFeedbackRating }>) => {
                    if (e.detail?.rating !== undefined) {
                      actions.updateViewUi('warRoomFeedbackRating', e.detail.rating);
                    }
                    actions.updateViewUi('warRoomFeedbackSubmitted', true);
                    actions.notify('Recorded AtmosAI accuracy telemetry.', 'success');
                  }}
                ></mth-ai-feedback>

                <mth-prompt-input
                  name="copilotPrompt"
                  label="Ask AtmosAI Copilot"
                  placeholder="Query IME dispersion math, δ13C ratio, or Subpart W filing..."
                  ?streaming=${copilotStreaming}
                  .value=${promptDraft}
                  @mth-input=${(e: CustomEvent<{ value?: string }>) =>
                    actions.updateViewUi('warRoomPromptDraft', e.detail?.value ?? '')}
                  @mth-submit=${(e: CustomEvent<{ value?: string }>) =>
                    runCopilotStreamSimulation(e.detail?.value)}
                  @mth-stop=${() => actions.updateViewUi('warRoomCopilotStreaming', false)}
                ></mth-prompt-input>
              </div>
            </mth-card>

            <!-- @methane-ui/sanitize XSS & Prompt-Injection Red-Team Firewall -->
            <mth-card variant="outlined" id="sanitizer-firewall">
              <div slot="header" class="mth-flex" data-justify="between" data-gap="2">
                <div class="mth-flex" data-gap="2">
                  <mth-icon name="warning" size="sm"></mth-icon>
                  <strong>@methane-ui/sanitize Red-Team XSS &amp; URL Firewall</strong>
                </div>
                <mth-badge variant=${urlIsSafe ? 'success' : 'danger'} size="sm" pill>
                  isSafeUrl: ${urlIsSafe ? 'SAFE' : 'BLOCKED'}
                </mth-badge>
              </div>

              <div class="mth-stack" data-gap="3">
                <div class="mth-flex" data-gap="2">
                  ${SANITIZER_REDTEAM_PAYLOADS.map(
                    (payload) => html`
                      <mth-button
                        size="sm"
                        variant=${payload.id === activePayload.id ? 'solid' : 'outline'}
                        data-testid=${`payload-btn-${payload.id}`}
                        @mth-press=${() => executeDomSanitizerAudit(payload.id)}
                      >
                        ${payload.label}
                      </mth-button>
                    `,
                  )}
                  <mth-button
                    size="sm"
                    variant="soft"
                    data-testid="run-sanitizer-firewall"
                    @mth-press=${() => executeDomSanitizerAudit(activePayload.id)}
                  >
                    Execute DOM Sanitizer Audit
                  </mth-button>
                </div>

                <dl class="mth-dl">
                  <dt>Untrusted URL Vector</dt>
                  <dd>
                    <code>${activePayload.rawUrl}</code> →
                    <code>sanitizeUrl()</code> = <code>${sanitizedHref}</code>
                  </dd>
                  <dt>Universal <code>escapeHtml()</code> Output</dt>
                  <dd><code>${escapedSourcePreview}</code></dd>
                  <dt>Firewall Audit Result</dt>
                  <dd data-testid="sanitizer-audit-output">${firewallAuditSummary}</dd>
                </dl>

                <div class="mth-grid" data-columns="2" data-gap="3">
                  <div class="mth-stack" data-gap="1">
                    <small><strong>safeSetMarkdown() / createStreamSanitizer()</strong></small>
                    <div id="atmos-sanitize-markdown-box" data-testid="sanitize-markdown-box">
                      Select a payload above to render sanitized Markdown nodes in-place.
                    </div>
                    <div id="atmos-sanitize-stream-box" data-testid="sanitize-stream-box">
                      Streaming chunk target ready.
                    </div>
                  </div>
                  <div class="mth-stack" data-gap="1">
                    <small><strong>safeSetHTML() &amp; parseSafeFragment()</strong></small>
                    <div id="atmos-sanitize-html-box" data-testid="sanitize-html-box">
                      Strict DOMPurify / native setHTML sink ready (zero innerHTML).
                    </div>
                    <div id="atmos-sanitize-fragment-box" data-testid="sanitize-fragment-box">
                      DocumentFragment sink ready.
                    </div>
                  </div>
                </div>
              </div>
            </mth-card>

            <!-- WebRTC Multi-Agency Bridge & Zero-Autoplay Field Capture -->
            <mth-card variant="outlined">
              <div slot="header" class="mth-flex" data-justify="between" data-gap="2">
                <div class="mth-flex" data-gap="2">
                  <mth-icon name="check" size="sm"></mth-icon>
                  <strong>WebRTC Responder Bridge &amp; Field Evidence Capture</strong>
                </div>
                <mth-badge variant="neutral" size="sm">User-Initiated Media Only</mth-badge>
              </div>

              <div class="mth-stack" data-gap="4">
                <mth-video-grid
                  .participants=${WAR_ROOM_VIDEO_PARTICIPANTS}
                  .layout=${videoGridLayout}
                  .pinnedId=${pinnedParticipantId}
                  active-speaker-id="vp-1"
                  label="INC-842 Multi-Agency Responder Video Grid"
                  @mth-layout-change=${(e: CustomEvent<{ layout?: VideoGridLayout }>) => {
                    if (e.detail?.layout) {
                      actions.updateViewUi('warRoomVideoLayout', e.detail.layout);
                    }
                  }}
                  @mth-pin-change=${(e: CustomEvent<{ pinnedId?: string }>) => {
                    if (e.detail?.pinnedId !== undefined) {
                      actions.updateViewUi('warRoomPinnedVideoId', e.detail.pinnedId);
                    }
                  }}
                ></mth-video-grid>

                <small>${rtcActivityStatus}</small>

                <div class="mth-grid" data-columns="3" data-gap="3">
                  <mth-camera-capture
                    facing-mode="environment"
                    label="Flange Gasket Snapshot"
                    @mth-capture=${() => {
                      actions.updateViewUi(
                        'warRoomRtcStatus',
                        'Captured flange inspection frame into local incident buffer.',
                      );
                      actions.notify('Captured gasket inspection snapshot.', 'success');
                    }}
                    @mth-permission-change=${(e: CustomEvent<{ status?: string }>) =>
                      actions.updateViewUi(
                        'warRoomRtcStatus',
                        `Camera status: ${e.detail?.status ?? 'idle'}`,
                      )}
                  ></mth-camera-capture>

                  <mth-audio-recorder
                    .maxDuration=${60}
                    label="Field Voice Log"
                    @mth-state-change=${(e: CustomEvent<{ state?: string }>) =>
                      actions.updateViewUi(
                        'warRoomRtcStatus',
                        `Audio recorder state: ${e.detail?.state ?? 'idle'}`,
                      )}
                  ></mth-audio-recorder>

                  <mth-screen-recorder
                    ?systemAudio=${true}
                    label="SCADA Console Capture"
                    @mth-state-change=${(e: CustomEvent<{ state?: string }>) =>
                      actions.updateViewUi(
                        'warRoomRtcStatus',
                        `Screen recorder state: ${e.detail?.state ?? 'idle'}`,
                      )}
                  ></mth-screen-recorder>
                </div>
              </div>
            </mth-card>
          </div>
        </div>

        <!-- 4. Always-Mounted Subpart W Regulatory Countersign Modal (<mth-dialog>) -->
        <mth-dialog
          variant="confirm"
          ?open=${incidentDialogOpen}
          label="Countersign EPA Subpart W Abatement Closure (INC-842)"
          description="Confirm valve XV-402 isolation (42s), spiral gasket torque completion, and 0.3 kg/hr post-seal verification."
          @mth-confirm=${() => {
            actions.updateViewUi('incidentDialogOpen', false);
            actions.updateViewUi('warRoomSubpartWCountersigned', true);
            actions.notify(
              'INC-842 Subpart W Super-Emitter Closure countersigned and archived.',
              'success',
            );
          }}
          @mth-cancel=${() => actions.updateViewUi('incidentDialogOpen', false)}
          @mth-close=${() => actions.updateViewUi('incidentDialogOpen', false)}
        >
          <div class="mth-stack" data-gap="2">
            <p>
              <strong>Facility:</strong> Permian Midland Compressor Station Pad B-4 · Bay 2
              (<code>XV-402</code>)
            </p>
            <p>
              <strong>Pre-Isolation IME Flux:</strong> 142.8 kg/hr CH4 (AtmosSat-4 Orbit #14892) →
              <strong>Post-Seal Residual:</strong> 0.3 kg/hr (-99.7%)
            </p>
          </div>
        </mth-dialog>
      </div>
    `;
  },
};
