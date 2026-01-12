# Track B: UI Development

You are continuing development on **Mission Control**, a touch controller for Ableton Live. You are working on **Track B: UI** - the Svelte web app that runs on iPad/tablet.

## Project Location
`/Users/ryan/The Source/mission-control`

## Required Reading

Read these files first:
1. `CLAUDE.md` - Project conventions
2. `docs/PROTOCOL.md` - **WebSocket protocol reference (NEW from Track A)**
3. `SHARED_LOG.md` - Inter-track communication
4. `apps/web/src/App.svelte` - Current UI
5. `apps/web/src/lib/connection.ts` - Current connection handling

## Current State

**Track A (Server) - A1-A3 Complete:**
- Bridge server on `ws://localhost:8080`
- Full session sync + real-time patches implemented
- Protocol documented in `docs/PROTOCOL.md`

**Track B (UI) - B1-B3 Scaffolded:**
- Svelte 5 + Vite + PWA configured
- Components exist but use OLD protocol
- Need to integrate NEW protocol from Track A

## Immediate Task: Protocol Integration

The connection handling needs to be updated for the new protocol:

### Old Protocol (broken)
```typescript
// UI waited for bridge to send data automatically
// Used { type: 'session', payload } and { type: 'patch', payload: Partial<SessionState> }
```

### New Protocol (implement this)
```typescript
// 1. After connect, request session
ws.send(JSON.stringify({ type: 'session/request' }));

// 2. Handle full session
{ type: 'session', payload: SessionState }

// 3. Handle patches with `kind` discriminator
{ type: 'patch', payload: { kind: 'transport', isPlaying: true } }
{ type: 'patch', payload: { kind: 'track', trackIndex: 0, track: Track } }
{ type: 'patch', payload: { kind: 'clip', trackIndex: 0, sceneIndex: 1, clipSlot: ClipSlot } }
{ type: 'patch', payload: { kind: 'selection', selectedTrack: 2 } }
```

### Patch Application
```typescript
function applyPatch(session: SessionState, patch: PatchPayload) {
  switch (patch.kind) {
    case 'transport':
      if (patch.tempo !== undefined) session.tempo = patch.tempo;
      if (patch.isPlaying !== undefined) session.isPlaying = patch.isPlaying;
      // etc.
      break;
    case 'track':
      session.tracks[patch.trackIndex] = patch.track;
      break;
    case 'clip':
      session.tracks[patch.trackIndex].clips[patch.sceneIndex] = patch.clipSlot;
      break;
    case 'selection':
      if (patch.selectedTrack !== undefined) session.selectedTrack = patch.selectedTrack;
      if (patch.selectedScene !== undefined) session.selectedScene = patch.selectedScene;
      break;
  }
}
```

### Loading States
Initial sync takes ~10s. Show:
- "Connecting to bridge..." - WebSocket disconnected
- "Waiting for Ableton..." - Connected but `abletonConnected: false`
- "Loading session..." - Waiting for session data
- Grid visible - Session received

## Testing

```bash
# Terminal 1: Start bridge
cd apps/bridge && bun src/index.ts start

# Terminal 2: Start web app
cd apps/web && bun run dev
```

Verify:
1. Session loads (track names, scenes, tempo visible)
2. Play/stop buttons work
3. Real-time updates (change tempo in Ableton, see it update)

## After Protocol Integration

### B4: Transport Module
- Live tempo display
- Play/stop/record buttons
- Tap tempo, metronome toggle

### B5: Mixer Module
- Channel strips with faders
- Volume, pan, mute/solo/arm
- Master channel

### B6: Device Control Module
- Parameter knobs
- Device navigation

### B7: Touch & Performance
- 44px minimum touch targets
- iPad Safari optimization

## Type Imports

```typescript
import type {
  SessionState,
  PatchPayload,
  Track,
  ClipSlot,
  ServerMessage
} from '@mission-control/protocol';
```

## Design Guidelines
- Dark theme (Ableton-inspired)
- Accent: `#ff764d` (orange)
- Playing: `#00ff00` (green)
- Triggered: `#ffff00` (yellow, blinking)
- Recording: `#ff0000` (red)

## Commands
- `bun run dev` from `apps/web/` - Start dev server
- Bridge must be running for live data

## Communication
Update `SHARED_LOG.md` with progress.
