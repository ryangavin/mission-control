# Refactor App.svelte - Complete Componentization

## Overview
Refactor `client/App.svelte` from 1,522 lines to ~860 lines by:
1. Importing types from protocol instead of duplicating them
2. Extracting utility modules
3. Extracting UI components

## Current File Structure
```
client/App.svelte (1,522 lines)
├── Script (528 lines)
│   ├── Types (lines 10-60) - DUPLICATED from protocol
│   ├── Constants (lines 62-78)
│   ├── State (lines 80-102)
│   ├── Utilities (lines 104-137)
│   ├── Patch application (lines 139-178)
│   ├── Lifecycle (lines 180-243)
│   ├── Derived values (lines 245-257)
│   ├── Data accessors (lines 259-325)
│   └── Event handlers (lines 327-527)
├── Template (218 lines)
└── Styles (776 lines)
```

---

## Phase 1: Fix Type Imports

**Can run in parallel: NO (must complete first)**

### Task 1.1: Update App.svelte imports
1. Add import at top of file:
   ```ts
   import type { SessionState, Track, Scene, ClipSlot, Clip } from '../protocol';
   ```
2. Delete lines 10-60 (duplicate type definitions)
3. Keep `QUANTIZATION_OPTIONS` constant (lines 62-78)

**Note:** The local `SessionState` was missing `punchIn`, `punchOut`, `loop` - the protocol version has them.

---

## Phase 2: Extract Utility Modules

**Can run in parallel: YES (2 agents)**

### Task 2.1: Create `client/lib/colorUtils.ts`
```ts
/**
 * Convert Ableton's integer color to hex string
 */
export function intToHex(color: number): string {
  if (!color) return '#666666';
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

### Task 2.2: Create `client/lib/clipUtils.ts`
```ts
import type { Track, ClipSlot, Clip } from '../../protocol';

export type ClipState = 'empty' | 'stopped' | 'playing' | 'triggered' | 'recording';

export function getClip(tracks: Track[], trackIndex: number, sceneIndex: number): ClipSlot | undefined {
  return tracks[trackIndex]?.clips[sceneIndex];
}

export function getClipState(tracks: Track[], trackIndex: number, sceneIndex: number): ClipState {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.hasClip) return 'empty';

  const track = tracks[trackIndex];
  if (!track) return 'stopped';

  // Check if this slot is the one that's playing or triggered
  const isPlaying = track.playingSlotIndex === sceneIndex;
  const isTriggered = track.firedSlotIndex === sceneIndex && !isPlaying;
  const isRecording = clipSlot.clip?.isRecording ?? false;

  if (isRecording) return 'recording';
  if (isPlaying) return 'playing';
  if (isTriggered) return 'triggered';
  return 'stopped';
}

export function getClipName(tracks: Track[], trackIndex: number, sceneIndex: number): string {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  return clipSlot?.clip?.name || '';
}

export function getClipProgress(tracks: Track[], trackIndex: number, sceneIndex: number, beatTime: number): number {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.clip?.length) return 0;
  const position = beatTime % clipSlot.clip.length;
  return position / clipSlot.clip.length;
}

export function getClipColor(tracks: Track[], trackIndex: number, sceneIndex: number): number {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  const track = tracks[trackIndex];
  return clipSlot?.clip?.color || track?.color || 0;
}
```

**After Phase 2:** Update App.svelte to import and use these utilities.

---

## Phase 3: Extract Components

**Can run in parallel: YES (up to 3 agents per batch)**

### Batch 3A (run in parallel):

#### Task 3.1: Create `client/lib/Header.svelte`

**Props interface:**
```ts
interface Props {
  connectionState: 'disconnected' | 'connecting' | 'connected';
  abletonConnected: boolean;
  tempo: number;
  isPlaying: boolean;
  isRecording: boolean;
  metronome: boolean;
  punchIn: boolean;
  punchOut: boolean;
  loop: boolean;
  beatTime: number;
  quantization: number;
  showHelpModal: boolean;
  onShowHelp: () => void;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onMetronome: () => void;
  onPunchIn: () => void;
  onPunchOut: () => void;
  onLoop: () => void;
  onTapTempo: () => void;
  onQuantization: (value: number) => void;
  onTempoChange: (tempo: number) => void;
}
```

**Extract from App.svelte:**
- Template: lines 533-593 (header section)
- Handlers: `handlePlay`, `handleStop`, `handleRecord`, `handleMetronome`, `handlePunchIn`, `handlePunchOut`, `handleLoop`, `handleTapTempo`, `handleQuantization`
- Tempo drag logic: `tempoDragState`, `handleTempoMouseDown/Move/Up`
- Styles: `.header`, `.header-box`, `.header-left/center/right`, `.help-btn`, `.group-item`, `.transport-btn`, `.connection-status`, `.status-indicator`, `.tempo-*`, `.playhead-*`, `.metronome-icon`, `.loop-btn`
- Include `QUANTIZATION_OPTIONS` constant
- Include `formatBeatTime` function

#### Task 3.2: Create `client/lib/ClipCell.svelte`

**Props interface:**
```ts
interface Props {
  trackIndex: number;
  sceneIndex: number;
  clipState: ClipState;
  clipName: string;
  clipColor: number;
  clipProgress: number;
  hasClip: boolean;
  isAudioClip: boolean;
  isMidiClip: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  onClick: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
}
```

**Extract from App.svelte:**
- Template: lines 676-703 (clip cell within the grid loop)
- Styles: `.clip`, `.clip.empty`, `.clip.has-clip`, `.clip.playing`, `.clip.triggered`, `.clip.recording`, `.clip.dragging`, `.clip.drag-over`, `.clip-progress`, `.clip-name`, `.clip-type-indicator`
- Import `intToHex` from colorUtils

#### Task 3.3: Create `client/lib/ConnectionStatus.svelte`

**Props interface:**
```ts
interface Props {
  bridgeConnected: boolean;
  abletonConnected: boolean;
}
```

**Extract from App.svelte:**
- Template: lines 584-591
- Styles: `.connection-status`, `.status-indicator`, `.status-indicator .dot`, `.status-indicator.connected`

---

### Batch 3B (run in parallel, after 3A):

#### Task 3.4: Create `client/lib/TrackHeader.svelte`

**Props interface:**
```ts
interface Props {
  track: Track;
  onMute: () => void;
  onSolo: () => void;
  onArm: () => void;
}
```

**Extract from App.svelte:**
- Template: lines 629-654 (track header within the track row)
- Styles: `.track-header`, `.track-info`, `.track-color`, `.track-name`, `.track-controls`, `.track-btn`, `.track-btn.mute`, `.track-btn.solo`, `.track-btn.arm`
- Import `intToHex` from colorUtils

#### Task 3.5: Create `client/lib/SceneColumn.svelte`

**Props interface:**
```ts
interface Props {
  scenes: Scene[];
  onSceneLaunch: (sceneIndex: number) => void;
  onStopAll: () => void;
}
```

**Extract from App.svelte:**
- Template: lines 709-726 (scene column)
- Styles: `.scene-column`, `.scene-header`, `.stop-all-btn`, `.scene-cell`, `.scene-btn`
- Import `intToHex` from colorUtils

#### Task 3.6: Create `client/lib/DeleteZone.svelte`

**Props interface:**
```ts
interface Props {
  isVisible: boolean;
  isOver: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
}
```

**Extract from App.svelte:**
- Template: lines 729-743 (delete overlay)
- Styles: `.delete-overlay`, `.delete-zone`, `.delete-icon`

---

## Phase 4: Update App.svelte Imports

After all components are created, update App.svelte:

```ts
import { onMount } from 'svelte';
import type { SessionState, Track, Scene, ClipSlot } from '../protocol';
import { connect, disconnect, send, onMessage, onStateChange } from './lib/connection';
import { intToHex } from './lib/colorUtils';
import { getClip, getClipState, getClipName, getClipProgress, getClipColor, type ClipState } from './lib/clipUtils';
import SetupPanel from './lib/SetupPanel.svelte';
import HelpModal from './lib/HelpModal.svelte';
import Header from './lib/Header.svelte';
import ClipCell from './lib/ClipCell.svelte';
import TrackHeader from './lib/TrackHeader.svelte';
import SceneColumn from './lib/SceneColumn.svelte';
import DeleteZone from './lib/DeleteZone.svelte';
import ConnectionStatus from './lib/ConnectionStatus.svelte';
```

---

## Parallel Execution Plan

```
Phase 1 (sequential - must complete first)
    │
    ▼
Phase 2 (parallel - 2 agents)
    ├── Agent A: colorUtils.ts
    └── Agent B: clipUtils.ts
    │
    ▼
Phase 3A (parallel - 3 agents)
    ├── Agent A: Header.svelte
    ├── Agent B: ClipCell.svelte
    └── Agent C: ConnectionStatus.svelte
    │
    ▼
Phase 3B (parallel - 3 agents)
    ├── Agent A: TrackHeader.svelte
    ├── Agent B: SceneColumn.svelte
    └── Agent C: DeleteZone.svelte
    │
    ▼
Phase 4 (sequential)
    └── Update App.svelte imports and wire components
```

---

## Files to Create
1. `client/lib/colorUtils.ts`
2. `client/lib/clipUtils.ts`
3. `client/lib/Header.svelte`
4. `client/lib/ClipCell.svelte`
5. `client/lib/ConnectionStatus.svelte`
6. `client/lib/TrackHeader.svelte`
7. `client/lib/SceneColumn.svelte`
8. `client/lib/DeleteZone.svelte`

## Files to Modify
1. `client/App.svelte` - Remove duplicates, import components

---

## Verification
1. `bun run build` - Check for type errors
2. `bun run dev` - Start dev server
3. Test all functionality:
   - Transport controls (play/stop/record)
   - Tempo drag adjustment
   - Metronome, tap tempo, quantization
   - Loop controls (punch in/out, loop)
   - Clip interactions (click to launch/stop)
   - Drag and drop clips
   - Delete clips via drag to delete zone
   - Track controls (mute/solo/arm)
   - Scene launches
   - Connection status indicators
