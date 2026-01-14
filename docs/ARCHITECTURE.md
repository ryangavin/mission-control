# Architecture Overview: Mission Control

## What This Project Is

A multi-user web UI for controlling Ableton Live via OSC - aiming to be the best clip launcher possible, eventually matching or exceeding a Novation Launchpad's capabilities.

## Current Architecture

```
┌─────────────────────────────────────────┐
│ Browser (localhost:5173)                │
│ Svelte 5 App                            │
│  - Clip Grid (tracks × scenes)          │
│  - Transport Controls                   │
│  - Mixer (mute/solo/arm)               │
└──────────────────┬──────────────────────┘
                   │ WebSocket /ws
┌──────────────────▼──────────────────────┐
│ Vite Dev Server + Bridge Plugin         │
│  - Bridge (OSC ↔ WebSocket gateway)     │
│  - SessionManager (in-memory state)     │
│  - SyncManager (queries Ableton)        │
└──────────────────┬──────────────────────┘
                   │ OSC UDP (11000/11001)
┌──────────────────▼──────────────────────┐
│ Ableton Live + AbletonOSC script        │
└─────────────────────────────────────────┘
```

## Directory Structure

```
mission-control/
├── apps/web/                    # Main web application
│   ├── src/
│   │   ├── App.svelte          # Main UI (1,384 lines - large!)
│   │   ├── lib/
│   │   │   ├── connection.ts   # WebSocket client
│   │   │   ├── SetupPanel.svelte
│   │   │   ├── HelpModal.svelte
│   │   │   └── Counter.svelte  # UNUSED - delete
│   └── server/
│       ├── bridge.ts           # OSC↔WS bridge (541 lines)
│       ├── vite-plugin.ts      # Vite integration
│       └── state/
│           ├── session.ts      # State management
│           └── sync.ts         # Ableton sync logic
├── packages/protocol/          # Shared types & OSC messages
│   └── src/
│       ├── types.ts            # SessionState, Track, Clip, etc.
│       ├── messages.ts         # OSC message builders (56KB)
│       └── parsers.ts          # Response parsers (25KB)
└── docs/                       # Protocol docs
```

## Technology Stack

- **Runtime**: Bun
- **Frontend**: Svelte 5 (reactive runes: $state, $derived, $effect)
- **Build**: Vite 7
- **OSC**: osc-js
- **WebSocket**: ws

## What's Working Well

- **Clean separation**: Frontend/Backend/Protocol clearly divided
- **Type-safe protocol**: Full TypeScript for all messages
- **Efficient updates**: Patch-based deltas, not full state replacement
- **Multi-client support**: All connected browsers stay in sync
- **Adaptive polling**: Beat time polling adjusts to tempo

---

# Issues Found

## HIGH Priority

### 1. App.svelte is too large (1,384 lines)

- 57% is CSS (~780 lines)
- All UI logic in one file
- Hard to navigate and maintain

### 2. Clip move race condition

**Location**: `apps/web/server/bridge.ts:216-233`

Uses hard-coded 100ms delay between duplicate and delete:

```typescript
this.sendOSC({ address: '/live/clip_slot/duplicate_clip_to', ... });
await new Promise(resolve => setTimeout(resolve, 100)); // brittle!
this.sendOSC({ address: '/live/clip_slot/delete_clip', ... });
```

Will fail silently on slow systems.

### 3. Sync overlap bug

**Location**: `apps/web/server/bridge.ts:245-250`

Logs "waiting" but returns immediately - client gets no response:

```typescript
if (this.syncInProgress) {
  this.log('Sync already in progress, waiting...');
  return; // Lies! Doesn't actually wait.
}
```

## MEDIUM Priority

### 4. Duplicate type definitions

App.svelte defines ClipSlot, Track, Scene, SessionState locally (lines 11-57) - these duplicate what's already in the protocol package.

### 5. Handler duplication

`handleMute()`, `handleSolo()`, `handleArm()` are identical patterns that could be one function:

```typescript
// Before: 3 functions, 18 lines
function handleMute(trackId: number) {
  const track = tracks.find(t => t.id === trackId);
  if (track) send({ type: 'mixer/mute', trackId, muted: !track.mute });
}
// ... same pattern for solo and arm

// After: 1 function, 8 lines
function handleToggle(trackId: number, prop: 'mute' | 'solo' | 'arm') {
  const track = tracks.find(t => t.id === trackId);
  if (track) send({ type: `mixer/${prop}`, trackId, [prop === 'arm' ? 'armed' : `${prop}ed`]: !track[prop] });
}
```

### 6. CSS duplication

Button styles repeated for: `.track-btn`, `.transport-btn`, `.clip-stop`, `.scene-btn` - same hover/active patterns everywhere.

### 7. Monolithic message router

**Location**: `apps/web/server/bridge.ts:181-211`

200+ lines of if/else switching on message type. No handler registry pattern.

### 8. No structure change detection

`checkStructureChanges()` exists in sync.ts but is never called. If tracks/scenes added in Ableton, the bridge won't know.

## LOW Priority

### 9. Unused file

`apps/web/src/lib/Counter.svelte` - demo artifact, never imported. Delete it.

### 10. Magic numbers in CSS

`top: 59px`, `minmax(80px, 1fr)` hardcoded. No layout constants.

### 11. No rate limiting

Every UI click immediately sends OSC. Could hammer Ableton with rapid interactions.

### 12. Jello-like animations

Root causes:
- `transition: all 0.1s` used everywhere (line 949, 1039, etc.) - animates unintended properties
- `transform: scale(0.97)` on :active combined with `transition: all` causes bounce
- Progress bar `transition: width 0.15s` stutters during fast beat updates

---

# Cleanup Plan

## Phase 1: UX Polish (User Pain Points)

### 1.1 Add Loading Screen for Initial Connection

**Problem**: Connection/sync flow feels brittle - no feedback on what's happening.

**Files to modify**:
- `apps/web/src/App.svelte` - Add loading state and UI
- `apps/web/src/lib/connection.ts` - Expose sync progress

**Changes**:
- Add a `syncState` that tracks: `idle` → `connecting` → `syncing` → `ready`
- Show a loading screen with steps: "Connecting to bridge..." → "Syncing with Ableton..." → "Loading session..."
- Only render the clip grid once `syncState === 'ready'`

### 1.2 Fix Jello-like Animations

**Files to modify**:
- `apps/web/src/App.svelte` (CSS section)

**Changes**:
- Replace `transition: all 0.1s` with explicit properties: `transition: background 0.1s, border-color 0.1s`
- Remove or reduce scale transforms on :active states
- Use `will-change: width` on progress bars
- Consider using CSS `transform` instead of width for progress (GPU accelerated)

---

## Phase 2: Code Organization

### 2.1 Break Up App.svelte (1,384 lines → ~400 lines)

**New structure**:
```
apps/web/src/
├── App.svelte              # Main layout, connection handling (~200 lines)
├── components/
│   ├── ClipGrid.svelte     # Grid rendering + drag-drop (~300 lines)
│   ├── Transport.svelte    # Play/stop/record/tempo (~80 lines)
│   ├── TrackHeader.svelte  # Track name + mute/solo/arm (~100 lines)
│   └── SceneColumn.svelte  # Scene launch buttons (~80 lines)
├── lib/
│   ├── connection.ts       # (existing)
│   ├── colors.ts           # intToHex() and color utilities
│   └── types.ts            # Re-export from protocol or local UI types
└── styles/
    ├── variables.css       # Layout constants, colors
    ├── buttons.css         # Shared button styles
    └── grid.css            # Grid-specific styles
```

### 2.2 Import Types from Protocol Package

**Files to modify**:
- `apps/web/src/App.svelte` - Remove lines 11-57, import from protocol

```typescript
// Before (App.svelte lines 11-57)
interface ClipSlot { ... }
interface Track { ... }

// After
import type { ClipSlot, Track, Scene, SessionState } from '@mission-control/protocol';
```

### 2.3 Consolidate Handler Functions

See "Handler duplication" above.

### 2.4 Delete Unused Files

- `apps/web/src/lib/Counter.svelte`

---

## Phase 3: Backend Reliability

### 3.1 Fix Clip Move Race Condition

**Solution**: Wait for OSC confirmation that duplicate completed before deleting.

**Files to modify**:
- `apps/web/server/bridge.ts`
- `apps/web/server/state/sync.ts` (use existing query pattern)

### 3.2 Fix Sync Overlap Bug

**Solution**: Queue the request or actually wait:

```typescript
if (this.syncInProgress) {
  // Wait for sync to complete, then send state
  await this.syncPromise;
  this.sendToClient(ws, { type: 'session', payload: this.session.getState() });
  return;
}
```

### 3.3 Enable Structure Change Detection

Call `checkStructureChanges()` periodically or after certain events to detect track/scene additions.

---

## Phase 4: Quick Wins

| Task | File | Effort |
|------|------|--------|
| Delete Counter.svelte | `src/lib/Counter.svelte` | 1 min |
| Import types from protocol | `App.svelte` | 5 min |
| Extract intToHex to colors.ts | `App.svelte` → `lib/colors.ts` | 5 min |
| Add layout constants | New `styles/variables.css` | 10 min |

---

## Recommended Order

1. **Phase 1** (UX) - Directly addresses pain points
2. **Phase 4** (Quick wins) - Low effort, immediate payoff
3. **Phase 2.1** (Break up App.svelte) - Needed before adding volume/pan/sends
4. **Phase 3** (Backend) - Important for reliability but not blocking features

---

## Verification

After cleanup:
1. `bun run dev` starts without errors
2. Connect to Ableton, verify clips load
3. Test clip launching, drag-drop, transport controls
4. Test reconnection (stop/start Ableton)
5. Test with multiple browser tabs (multi-client)
