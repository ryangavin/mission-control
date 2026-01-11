# Integration Phase Plan

> **Prerequisites**: Track A and Track B both show "Ready for Integration" in SHARED_LOG.md
> **Focus**: Wire the UI to the live server, test end-to-end, deploy
> **Output**: Fully functional PWA controlling Ableton Live

---

## Overview

This phase connects the independently-developed UI and server:
1. Replace mock data with real WebSocket connection
2. Wire UI actions to server commands
3. Test full flow with real Ableton session
4. Deploy and document

---

## Phase I1: Wire UI to Live Server

### Goal
Replace mock stores with live data from bridge server

### Tasks

**1.1 Connection Store** (`apps/web/src/lib/stores/connection.ts`)
```typescript
import { writable, derived } from 'svelte/store';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

function createConnectionStore() {
  const { subscribe, set, update } = writable<{
    status: ConnectionStatus;
    ws: WebSocket | null;
    bridgeUrl: string;
  }>({
    status: 'disconnected',
    ws: null,
    bridgeUrl: 'ws://localhost:8080',
  });

  return {
    subscribe,
    connect: (url: string) => {
      // Create WebSocket connection
      // Handle open, close, error events
      // Update status accordingly
    },
    disconnect: () => {
      // Close WebSocket
      // Update status
    },
    send: (message: any) => {
      // Send JSON message over WebSocket
    },
  };
}

export const connection = createConnectionStore();
```

**1.2 Live Session Store** (`apps/web/src/lib/stores/session.ts`)
```typescript
import { writable } from 'svelte/store';
import { connection } from './connection';
import type { SessionState } from '@mission-control/protocol';

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionState | null>(null);

  // Subscribe to connection messages
  connection.subscribe(($conn) => {
    if ($conn.ws) {
      $conn.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'session') {
          set(data.payload);
        } else if (data.type === 'patch') {
          update(state => ({ ...state, ...data.payload }));
        }
      };
    }
  });

  return {
    subscribe,
    // Actions that send commands to server
    fireClip: (trackId: number, clipId: number) => {
      connection.send({ type: 'clip/fire', trackId, clipId });
    },
    stopClip: (trackId: number, clipId: number) => {
      connection.send({ type: 'clip/stop', trackId, clipId });
    },
    play: () => connection.send({ type: 'transport/play' }),
    stop: () => connection.send({ type: 'transport/stop' }),
    setTempo: (bpm: number) => connection.send({ type: 'transport/tempo', bpm }),
    setVolume: (trackId: number, value: number) => {
      connection.send({ type: 'mixer/volume', trackId, value });
    },
    // ... etc
  };
}

export const session = createSessionStore();
```

**1.3 Update Components to Use Live Stores**

Replace mock data imports with live stores in each component.

Example for ClipCell.svelte:
```svelte
<script lang="ts">
  import { session } from '$lib/stores/session';

  export let trackId: number;
  export let clipId: number;

  $: clip = $session?.tracks[trackId]?.clips[clipId];

  function handleClick() {
    if (clip?.isPlaying) {
      session.stopClip(trackId, clipId);
    } else {
      session.fireClip(trackId, clipId);
    }
  }
</script>
```

**1.4 Optimistic Updates**

For low-latency feel, update UI immediately before server confirms:
```typescript
fireClip: (trackId: number, clipId: number) => {
  // Optimistic update
  update(state => {
    const newState = { ...state };
    newState.tracks[trackId].clips[clipId].isTriggered = true;
    return newState;
  });
  // Send to server
  connection.send({ type: 'clip/fire', trackId, clipId });
},
```

**1.5 Settings UI**

Add a settings panel to configure bridge URL:
- Input field for WebSocket URL
- Connect/Disconnect button
- QR code generator (for easy iPad setup)

### Files to Create/Modify
- `apps/web/src/lib/stores/connection.ts` (new)
- `apps/web/src/lib/stores/session.ts` (modify to use live data)
- `apps/web/src/lib/components/Settings/Settings.svelte` (new)
- All module components (update imports)

### Verification
- [ ] Connection store connects to bridge
- [ ] Session state populates from server
- [ ] UI reflects Ableton session data
- [ ] Actions send commands to server

---

## Phase I2: End-to-End Testing

### Goal
Verify complete flow works reliably

### Test Scenarios

**Basic Connectivity**
- [ ] Bridge starts without errors
- [ ] UI connects to bridge
- [ ] Session data loads in UI

**Clip Launching**
- [ ] Tap clip in UI → clip plays in Ableton
- [ ] UI shows "triggered" state immediately
- [ ] UI shows "playing" state when clip starts
- [ ] Stop clip → clip stops in Ableton
- [ ] Scene launch → all clips in scene play

**Transport**
- [ ] Play button → Ableton plays
- [ ] Stop button → Ableton stops
- [ ] Tempo change in UI → Ableton tempo changes
- [ ] Metronome toggle works

**Mixer**
- [ ] Volume fader → track volume changes in Ableton
- [ ] Mute → track mutes in Ableton
- [ ] Solo → track solos in Ableton
- [ ] Changes in Ableton → reflected in UI

**Device Control**
- [ ] Device parameters load
- [ ] Parameter change in UI → Ableton parameter changes
- [ ] Device navigation works

**Multi-Client**
- [ ] Two browser windows connect
- [ ] Both see same state
- [ ] Change in one → reflected in other

**Reconnection**
- [ ] Kill bridge, restart → UI reconnects
- [ ] WiFi drop, recover → UI reconnects
- [ ] State syncs after reconnect

### Latency Testing

Measure and document:
```
Touch → Visual feedback:    Target <16ms (UI framework)
Touch → Ableton response:   Target <50ms (WiFi)
Ableton change → UI update: Target <50ms
```

Use Chrome DevTools to measure:
1. Performance tab for UI rendering
2. Network tab for WebSocket timing

### Test with Different Session Sizes
- Small: 4 tracks, 8 scenes
- Medium: 12 tracks, 16 scenes
- Large: 32 tracks, 32 scenes

### Files to Create
- `apps/web/tests/e2e/` (optional, Playwright tests)

---

## Phase I3: PWA & Deployment

### Goal
Installable, production-ready app

### Tasks

**3.1 PWA Final Configuration**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mission Control',
        short_name: 'MissionCtrl',
        description: 'Touch controller for Ableton Live',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

**3.2 Create Assets**
- App icon (192x192, 512x512)
- Apple touch icon
- Splash screens for iPad
- Favicon

**3.3 Build & Deploy Options**

Option A: Local Development Only
```bash
# On computer with Ableton
pnpm --filter @mission-control/bridge start  # Bridge on :8080
pnpm --filter @mission-control/web dev       # UI on :5173

# On iPad: open http://<computer-ip>:5173
```

Option B: Deploy UI to Hosting
- Deploy built UI to Vercel/Netlify/etc.
- Run bridge locally
- iPad opens hosted URL, connects to local bridge

Option C: Package as Electron/Tauri (Future)
- Desktop app that bundles both bridge and UI

**3.4 Documentation**

Create README.md with:
- Quick start guide
- Installation instructions
- Configuration options
- Troubleshooting

### Files to Create
- `apps/web/public/icon-192.png`
- `apps/web/public/icon-512.png`
- `apps/web/public/apple-touch-icon.png`
- `README.md` (project root)
- `apps/bridge/README.md`
- `apps/web/README.md`

### Verification
- [ ] `pnpm build` succeeds for both packages
- [ ] Built UI loads correctly
- [ ] PWA installs on iPad
- [ ] Works in standalone mode
- [ ] Reconnects after app backgrounded

---

## Final Checklist

Before marking project as "MVP Complete":

**Functionality**
- [ ] Can launch clips from iPad
- [ ] Can control transport
- [ ] Can adjust mixer
- [ ] Can control device parameters
- [ ] Real-time sync with Ableton

**Reliability**
- [ ] Auto-reconnects on connection drop
- [ ] Handles large sessions
- [ ] No memory leaks in extended use

**User Experience**
- [ ] Touch interactions feel responsive
- [ ] Visual feedback is immediate
- [ ] Works as installable PWA
- [ ] Clear error messages

**Documentation**
- [ ] Setup instructions complete
- [ ] API documented
- [ ] Troubleshooting guide

---

## Post-MVP: Future Enhancements

After MVP is stable, consider:

1. **Custom Layouts** - Drag-and-drop module arrangement
2. **Multi-Device Sync** - Multiple iPads controlling same session
3. **MIDI Keyboard Module** - Play instruments from iPad
4. **Clip Editor** - Piano roll view
5. **Browser Module** - Load samples/presets
6. **Cue Points** - Navigate arrangement
7. **Preset System** - Save/load controller configurations
