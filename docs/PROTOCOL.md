# Mission Control WebSocket Protocol

Complete reference for the bridge ↔ UI WebSocket protocol.

## Connection

```
WebSocket URL: ws://localhost:8080
```

## Message Flow

```
┌─────────┐                          ┌─────────┐                          ┌─────────┐
│   UI    │                          │  Bridge │                          │ Ableton │
└────┬────┘                          └────┬────┘                          └────┬────┘
     │                                    │                                    │
     │──── connect ──────────────────────>│                                    │
     │<─── { type: 'connected' } ─────────│                                    │
     │                                    │                                    │
     │──── { type: 'session/request' } ──>│                                    │
     │                                    │──── OSC queries ──────────────────>│
     │                                    │<─── OSC responses ─────────────────│
     │<─── { type: 'session' } ───────────│                                    │
     │                                    │                                    │
     │                                    │<─── OSC listener updates ──────────│
     │<─── { type: 'patch' } ─────────────│                                    │
     │                                    │                                    │
     │──── { type: 'transport/play' } ───>│                                    │
     │                                    │──── OSC command ──────────────────>│
     │                                    │                                    │
```

## Server → Client Messages

### `connected`

Sent immediately on WebSocket connection.

```typescript
{
  type: 'connected';
  abletonConnected: boolean;
}
```

### `session`

Full session state. Sent after `session/request` or on reconnect if already synced.

```typescript
{
  type: 'session';
  payload: SessionState;
}

interface SessionState {
  tempo: number;              // BPM (e.g., 120)
  isPlaying: boolean;
  isRecording: boolean;
  metronome: boolean;
  selectedTrack: number;      // 0-indexed
  selectedScene: number;      // 0-indexed
  tracks: Track[];
  scenes: Scene[];
}

interface Track {
  id: number;                 // 0-indexed track number
  name: string;
  color: number;              // RGB integer (use intToHex helper)
  volume: number;             // 0.0-1.0, 0.85 = 0dB
  pan: number;                // -1.0 to 1.0
  mute: boolean;
  solo: boolean;
  arm: boolean;
  playingSlotIndex: number;   // -1 or -2 if none playing
  firedSlotIndex: number;     // -1 if none triggered
  clips: ClipSlot[];
}

interface Scene {
  id: number;
  name: string;
  color: number;
}

interface ClipSlot {
  trackIndex: number;
  sceneIndex: number;
  hasClip: boolean;
  clip?: Clip;
}

interface Clip {
  name: string;
  color: number;
  isPlaying: boolean;
  isTriggered: boolean;
  isRecording: boolean;
  playingPosition: number;
  length: number;             // In beats
  loopStart: number;
  loopEnd: number;
}
```

### `patch`

Incremental state update. Contains one of several payload kinds.

```typescript
{
  type: 'patch';
  payload: PatchPayload;
}

type PatchPayload =
  | TransportPatch
  | TrackPatch
  | ClipPatch
  | ScenePatch
  | SelectionPatch
  | StructurePatch;
```

#### Transport Patch

```typescript
{
  kind: 'transport';
  tempo?: number;
  isPlaying?: boolean;
  isRecording?: boolean;
  metronome?: boolean;
}
```

Only changed fields are included.

#### Track Patch

```typescript
{
  kind: 'track';
  trackIndex: number;
  track: Track;               // Full track object
}
```

Sent when any track property changes (volume, mute, solo, arm, playing slot).

#### Clip Patch

```typescript
{
  kind: 'clip';
  trackIndex: number;
  sceneIndex: number;
  clipSlot: ClipSlot;         // Full clip slot object
}
```

Sent when clip status changes (playing, triggered, has_clip).

#### Scene Patch

```typescript
{
  kind: 'scene';
  sceneIndex: number;
  scene: Scene;
}
```

#### Selection Patch

```typescript
{
  kind: 'selection';
  selectedTrack?: number;
  selectedScene?: number;
}
```

Sent when user changes selection in Ableton.

#### Structure Patch

```typescript
{
  kind: 'structure';
  numTracks: number;
  numScenes: number;
}
```

Sent when tracks/scenes are added or removed (requires re-sync).

### `error`

```typescript
{
  type: 'error';
  message: string;
}
```

## Client → Server Messages

### `session/request`

Request full session state. Triggers initial sync if not already synced.

```typescript
{ type: 'session/request' }
```

### Transport Controls

```typescript
{ type: 'transport/play' }
{ type: 'transport/stop' }
{ type: 'transport/record' }
{ type: 'transport/tempo', bpm: number }
{ type: 'transport/metronome', enabled: boolean }
```

### Clip Controls

```typescript
{ type: 'clip/fire', trackId: number, sceneId: number }
{ type: 'clip/stop', trackId: number, sceneId: number }
{ type: 'scene/fire', sceneId: number }
{ type: 'track/stop', trackId: number }
```

### Mixer Controls

```typescript
{ type: 'mixer/volume', trackId: number, value: number }   // 0.0-1.0
{ type: 'mixer/pan', trackId: number, value: number }      // -1.0 to 1.0
{ type: 'mixer/mute', trackId: number, muted: boolean }
{ type: 'mixer/solo', trackId: number, soloed: boolean }
{ type: 'mixer/arm', trackId: number, armed: boolean }
```

### Device Controls

```typescript
{
  type: 'device/parameter',
  trackId: number,
  deviceId: number,
  parameterId: number,
  value: number
}
```

### Raw OSC (Advanced)

For testing or unsupported commands:

```typescript
{
  type: 'osc',
  address: string,    // e.g., '/live/song/get/tempo'
  args: any[]
}
```

## Helper Functions

### Color Conversion

Ableton colors are RGB integers. Convert to hex:

```typescript
function intToHex(color: number): string {
  if (!color) return '#666666';
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

### Volume to dB

```typescript
function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity;
  return 20 * Math.log10(volume / 0.85);
}

function dbToVolume(db: number): number {
  return 0.85 * Math.pow(10, db / 20);
}
```

## Example: Svelte Integration

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionState, PatchPayload } from '@mission-control/protocol';

  let ws: WebSocket;
  let connected = $state(false);
  let abletonConnected = $state(false);
  let session = $state<SessionState | null>(null);

  onMount(() => {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      connected = true;
      ws.send(JSON.stringify({ type: 'session/request' }));
    };

    ws.onclose = () => {
      connected = false;
      session = null;
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    };

    return () => ws.close();
  });

  function handleMessage(msg: any) {
    switch (msg.type) {
      case 'connected':
        abletonConnected = msg.abletonConnected;
        break;

      case 'session':
        session = msg.payload;
        break;

      case 'patch':
        if (session) applyPatch(msg.payload);
        break;

      case 'error':
        console.error('Bridge error:', msg.message);
        break;
    }
  }

  function applyPatch(patch: PatchPayload) {
    if (!session) return;

    switch (patch.kind) {
      case 'transport':
        if (patch.tempo !== undefined) session.tempo = patch.tempo;
        if (patch.isPlaying !== undefined) session.isPlaying = patch.isPlaying;
        if (patch.isRecording !== undefined) session.isRecording = patch.isRecording;
        if (patch.metronome !== undefined) session.metronome = patch.metronome;
        break;

      case 'track':
        session.tracks[patch.trackIndex] = patch.track;
        break;

      case 'clip':
        session.tracks[patch.trackIndex].clips[patch.sceneIndex] = patch.clipSlot;
        break;

      case 'scene':
        session.scenes[patch.sceneIndex] = patch.scene;
        break;

      case 'selection':
        if (patch.selectedTrack !== undefined) session.selectedTrack = patch.selectedTrack;
        if (patch.selectedScene !== undefined) session.selectedScene = patch.selectedScene;
        break;
    }
  }

  // Actions
  function play() {
    ws.send(JSON.stringify({ type: 'transport/play' }));
  }

  function stop() {
    ws.send(JSON.stringify({ type: 'transport/stop' }));
  }

  function fireClip(trackId: number, sceneId: number) {
    ws.send(JSON.stringify({ type: 'clip/fire', trackId, sceneId }));
  }

  function fireScene(sceneId: number) {
    ws.send(JSON.stringify({ type: 'scene/fire', sceneId }));
  }

  function setVolume(trackId: number, value: number) {
    ws.send(JSON.stringify({ type: 'mixer/volume', trackId, value }));
  }
</script>
```

## Connection States

| State | Description |
|-------|-------------|
| `connected = false` | WebSocket not connected to bridge |
| `connected = true, abletonConnected = false` | Connected to bridge, waiting for Ableton |
| `connected = true, abletonConnected = true, session = null` | Syncing session data |
| `connected = true, abletonConnected = true, session != null` | Ready, receiving live updates |

## Notes

1. **Initial sync** takes ~10s for large sessions (100+ scenes). Show a loading state.
2. **Track IDs** are 0-indexed and match array indices.
3. **Playing slot index** of -1 or -2 means no clip is playing on that track.
4. **Volume 0.85** equals 0dB in Ableton's mixer.
5. **Patches use full object replacement** - always replace the entire track/clip object, don't merge.
