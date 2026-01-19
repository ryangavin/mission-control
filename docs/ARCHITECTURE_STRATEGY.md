# Mission Control - Long-Term Architecture Strategy

## Executive Summary

Mission Control is a web-based Ableton Live controller using OSC protocol. After a thorough codebase review, I've identified clear patterns of code duplication and architectural concerns that can be addressed systematically.

**Good news:** The protocol layer (`/protocol`) is excellently designed with discriminated unions and type-safe message builders. This should be preserved and used as the pattern for other refactoring work.

**Primary concerns:**
1. **UI Layer:** Significant code duplication across components (drag handling, scroll sync, grid layouts)
2. **Bridge Layer:** Monolithic 901-line `bridge.ts` mixing too many concerns

---

## Current Architecture Overview

```
Browser (Svelte 5 UI)
    ↓ WebSocket JSON
Bridge Server (Bun)
    ↓ OSC Protocol
Ableton Live (AbletonOSC Remote Script)
```

**Directory Structure:**
- `/client` - Svelte 5 frontend (19 components)
- `/server` - Bridge server (OSC ↔ WebSocket translation)
- `/protocol` - Type-safe message definitions
- `/desktop` - Tauri wrapper

---

## Part 1: UI Layer Code Smells

### 1.1 Drag-and-Drop Logic (HIGH PRIORITY)

**Problem:** Three components implement nearly identical drag handling:

| Component | Purpose | Lines |
|-----------|---------|-------|
| `Header.svelte` | Tempo drag | 76-120 |
| `Knob.svelte` | Knob rotation | 25-95 |
| `MixerFooter.svelte` | Panel resize | 107-163 |

All three implement:
- `dragState` with `startX`, `startY`, `startValue`
- Window-level `mousemove`/`mouseup` listeners
- Touch event handling
- Cleanup on drag end

**Solution:** Create `/client/lib/drag.ts`:
```typescript
interface DragOptions<T> {
  onStart?: (state: T, e: MouseEvent | TouchEvent) => void;
  onMove: (state: T, delta: { x: number; y: number }, e: MouseEvent | TouchEvent) => void;
  onEnd?: (state: T) => void;
  sensitivity?: number;
}

export function createDrag<T>(initialState: T, options: DragOptions<T>);
```

### 1.2 Scroll Synchronization (MEDIUM PRIORITY)

**Problem:** Three components export identical scroll sync methods:

| Component | Methods |
|-----------|---------|
| `ClipGrid.svelte` | `getElement()`, `setScrollTop()` |
| `SceneColumn.svelte` | `getElement()`, `setScrollTop()` |
| `MixerFooter.svelte` | `getElement()`, `setScrollLeft()` |

`App.svelte` (lines 136-166) manually coordinates these with imperative calls.

**Solution:** Create `/client/lib/scrollSync.ts` with a context-based scroll sync system:
```typescript
interface ScrollGroup {
  register(id: string, element: HTMLElement, axes: ('x' | 'y')[]): void;
  unregister(id: string): void;
  sync(sourceId: string): void;
}

export function createScrollSync(): ScrollGroup;
```

### 1.3 Header/Footer Duplication (LOW PRIORITY)

**Problem:** Both render identical `.app-brand` markup:
- `Header.svelte` lines 129-132
- `Footer.svelte` lines 16-19

**Solution:** Extract `/client/components/shared/AppBrand.svelte`

### 1.4 Grid Layout CSS (LOW PRIORITY)

**Problem:** Same grid pattern in multiple files:
```css
grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
```

Found in: `ClipGrid.svelte`, `MixerFooter.svelte` (twice)

**Solution:** Add `.track-grid` utility class to `/client/styles/utilities.css`

### 1.5 Button Styling (LOW PRIORITY)

**Problem:**
- `buttons.css` exists but Header.svelte re-defines `.group-item` styles (lines 226-267)
- Global `.stop-btn` styles in App.svelte (lines 439-463)

**Solution:** Consolidate all button styles in `buttons.css`

---

## Part 2: OSC Integration Layer Code Smells

### 2.1 Monolithic Bridge (HIGH PRIORITY)

**Problem:** `/server/bridge.ts` is 901 lines mixing:
- WebSocket connection handling (lines 70-97, 203-264)
- OSC communication (lines 102-159, 621-631)
- State coordination (lines 291-329)
- Client message translation (lines 334-397)
- OSC listener parsing (lines 402-617)
- Polling mechanisms (lines 657-899)
- Connection checking (lines 759-826)

**Solution:** Split into focused modules:
```
/server/bridge/
  index.ts              # Main Bridge class (coordinator only)
  websocket.ts          # WebSocket server management
  osc.ts                # OSC connection and routing
  polling.ts            # Unified polling system
  messageHandler.ts     # ClientMessage → OSC translation
  listenerUpdate.ts     # OSC → PatchPayload parsing
  config.ts             # Centralized constants
```

### 2.2 Three Separate Polling Mechanisms (MEDIUM PRIORITY)

**Problem:** Hardcoded intervals scattered throughout:
- Beat time polling: dynamic 50-200ms (lines 669-705)
- Structure polling: 1000ms (lines 832-863)
- Send polling: 500ms (lines 869-899)

**Solution:** Create `/server/bridge/polling.ts`:
```typescript
interface PollTask {
  id: string;
  intervalMs: number | (() => number);  // Static or dynamic
  enabled: boolean;
  execute: () => void | Promise<void>;
}

export class PollingManager {
  register(task: PollTask): void;
  start(id: string): void;
  stop(id: string): void;
  stopAll(): void;
}
```

### 2.3 Hardcoded Constants (MEDIUM PRIORITY)

**Problem:** Magic numbers scattered throughout:
- `MAX_SENDS = 8` (sync.ts line 147)
- `queryTimeout = 5000` (sync.ts)
- Various intervals in bridge.ts (lines 39-48)

**Solution:** Create `/server/bridge/config.ts`:
```typescript
export const BRIDGE_CONFIG = {
  PING_TIMEOUT: 2000,
  CONNECTION_CHECK_INTERVAL: 5000,
  STRUCTURE_POLL_INTERVAL: 1000,
  SEND_POLL_INTERVAL: 500,
  QUERY_TIMEOUT: 5000,
  BATCH_SIZE: 32,
  MAX_SENDS: 8,
  MIN_BEAT_POLL_INTERVAL: 50,
  MAX_BEAT_POLL_INTERVAL: 200,
} as const;
```

### 2.4 Disabled Debug Logging (LOW PRIORITY)

**Problem:** Line 409 of bridge.ts:
```typescript
// this.log(`OSC <- ${message.address} ${JSON.stringify(message.args)}`);
```

Makes debugging difficult.

**Solution:** Create `/server/lib/logger.ts` with configurable log levels:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export function createLogger(namespace: string, minLevel: LogLevel): Logger;
```

### 2.5 Query/Response Matching Complexity (MEDIUM PRIORITY)

**Problem:** `/server/state/sync.ts` uses fragile string-based key generation:
- `getQueryKey()` (lines 512-518)
- `getResponseKey()` (lines 523-554) with complex conditionals

**Solution:** Consider a more robust matching system with typed patterns, but this is lower priority since the current system works.

### 2.6 Listener Lifecycle (LOW PRIORITY)

**Problem:** O(tracks × scenes) listeners with no cleanup if structure changes during sync.

**Solution:** Add a `ListenerRegistry` class that tracks active listeners and ensures proper cleanup.

---

## Part 3: Implementation Phases

### Phase 1: Quick Wins (1-2 days)

| Task | Impact | Effort |
|------|--------|--------|
| Centralize bridge constants in `config.ts` | High | 1 hour |
| Add basic logger utility | Medium | 2 hours |
| Extract `AppBrand.svelte` | Low | 30 min |
| Add `.track-grid` utility class | Low | 30 min |
| Move button globals to `buttons.css` | Low | 30 min |

**Files to create:**
- `/server/bridge/config.ts`
- `/server/lib/logger.ts`
- `/client/components/shared/AppBrand.svelte`

### Phase 2: Core Infrastructure (3-5 days)

| Task | Impact | Effort |
|------|--------|--------|
| Create drag utility (`/client/lib/drag.ts`) | High | 4 hours |
| Create scroll sync utility (`/client/lib/scrollSync.ts`) | Medium | 4 hours |
| Create polling manager (`/server/bridge/polling.ts`) | Medium | 4 hours |

### Phase 3: Major Refactors (1-2 weeks)

| Task | Impact | Effort |
|------|--------|--------|
| Refactor Header/Knob/MixerFooter to use drag utility | High | 3 hours |
| Implement scroll sync context in App/ClipGrid/SceneColumn/MixerFooter | Medium | 4 hours |
| Split bridge.ts into modules | High | 8 hours |

### Phase 4: Polish (ongoing)

| Task | Impact | Effort |
|------|--------|--------|
| Add retry logic for OSC queries | Medium | 4 hours |
| Add sync state machine | Medium | 4 hours |
| Add test coverage | High | 8+ hours |

---

## Part 4: Architectural Strengths to Preserve

1. **Protocol Layer Type Safety** - The discriminated unions in `/protocol/types.ts` (PatchPayload, ClientMessage, ServerMessage) are excellent. All new code should follow this pattern.

2. **Patch-Based Updates** - The SessionManager pattern of returning `PatchPayload` from mutations enables efficient incremental updates.

3. **Clean Directory Separation** - The client/server/protocol separation is good. Maintain this.

4. **OSC Message Builders** - The builders in `/protocol/messages.ts` are comprehensive and type-safe.

---

## Part 5: Critical Files Reference

### UI Refactoring
- `/client/components/Header.svelte` - Tempo drag pattern (lines 76-120)
- `/client/components/Knob.svelte` - Knob drag pattern (lines 25-95)
- `/client/components/MixerFooter.svelte` - Resize drag + scroll sync (lines 107-195)
- `/client/components/ClipGrid.svelte` - Scroll sync (lines 37-45)
- `/client/components/SceneColumn.svelte` - Scroll sync (lines 19-29)
- `/client/App.svelte` - Scroll coordination (lines 136-166)

### Bridge Refactoring
- `/server/bridge.ts` - Main file to split (901 lines)
- `/server/state/sync.ts` - Query matching and listeners (683 lines)
- `/server/state/session.ts` - State management (good pattern to preserve)
- `/server/config.ts` - Extend with all constants

---

## Verification Strategy

After each phase:
1. Run `bun run dev:standalone` and verify Ableton connection works
2. Test clip firing, transport controls, mixer controls
3. Test scroll synchronization between ClipGrid, SceneColumn, and MixerFooter
4. Test drag interactions (tempo, knobs, mixer resize)
5. Check browser console for errors
6. Verify no regressions in mobile/responsive behavior
