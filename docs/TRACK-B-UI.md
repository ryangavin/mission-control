# Track B: UI Development Plan

> **Focus**: `apps/web/`
> **Output**: Beautiful, modular Svelte UI with mock data
> **Communication**: Check `SHARED_LOG.md` periodically for questions from Track A
> **Testing**: Use Chrome MCP tools to visually verify your work

---

## Overview

Build a touch-optimized, modular web UI that:
1. Looks beautiful and professional
2. Works with mock data (no server dependency)
3. Is ready to wire up to real data in integration phase
4. Works as a PWA on iPad

---

## Development Workflow

**You have access to Chrome MCP tools. Use them!**

```
1. Start Vite dev server (apps/web)
2. Open http://localhost:5173 in Chrome via MCP
3. Take screenshots to see your work
4. Interact with components via MCP click/type actions
5. Iterate visually
```

This lets you actually see and test the UI as you build it.

---

## Parallel Agent Strategy

Within this track, use parallel agents for:
- **Design system** can run parallel to **component scaffolding**
- **Independent modules** (Grid, Transport, Mixer) can be built in parallel
- **Mock data** can be developed alongside components

Suggested agent breakdown:
```
B1: Two agents - design tokens + mock data in parallel
B2: Multiple agents - each base component independently
B3-B6: Can parallelize module development (after B1-B2 done)
B7: Single agent (X/Y pad is specialized)
```

---

## Phase B1: Design System & Architecture

### Goal
Establish visual language and component architecture

### Tasks (Can Parallelize)

**Agent 1: Design Tokens** (`apps/web/src/lib/styles/`)

Create `tokens.css`:
```css
:root {
  /* Background colors - Ableton dark theme inspired */
  --color-bg-primary: #1e1e1e;
  --color-bg-secondary: #2d2d2d;
  --color-bg-elevated: #3d3d3d;
  --color-bg-hover: #4d4d4d;

  /* Accent colors */
  --color-accent: #ff764d;        /* Ableton orange */
  --color-accent-hover: #ff8f6d;

  /* State colors */
  --color-playing: #00ff00;       /* Green - playing */
  --color-triggered: #ffff00;     /* Yellow - triggered */
  --color-recording: #ff0000;     /* Red - recording */
  --color-stopped: #666666;       /* Gray - stopped */

  /* Text colors */
  --color-text-primary: #ffffff;
  --color-text-secondary: #999999;
  --color-text-muted: #666666;

  /* Touch targets (Apple HIG) */
  --touch-min: 44px;
  --touch-comfortable: 56px;
  --touch-large: 72px;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.5);
}
```

Create Ableton clip color palette (70 colors):
```css
/* apps/web/src/lib/styles/clip-colors.css */
:root {
  --clip-1: #ff94a2;   /* Light pink */
  --clip-2: #ffa529;   /* Orange */
  --clip-3: #cc9927;   /* Amber */
  --clip-4: #f7f47c;   /* Yellow */
  --clip-5: #bffb00;   /* Lime */
  --clip-6: #1ae86b;   /* Green */
  --clip-7: #25e8c3;   /* Teal */
  --clip-8: #5fe0ed;   /* Cyan */
  --clip-9: #96c6f9;   /* Light blue */
  --clip-10: #5e87e8;  /* Blue */
  /* ... continue for all 70 colors */
}
```

**Agent 2: Mock Data** (`apps/web/src/lib/stores/mock.ts`)

```typescript
// Generate realistic session data for UI development
export function createMockSession(): SessionState {
  return {
    tempo: 120,
    isPlaying: false,
    isRecording: false,
    metronome: true,
    tracks: generateMockTracks(8),
    scenes: generateMockScenes(8),
    selectedTrack: 0,
    selectedScene: 0,
  };
}

function generateMockTracks(count: number): Track[] {
  // Generate tracks with random clips, colors, names
}

function generateMockScenes(count: number): Scene[] {
  // Generate scenes
}

// Simulate state changes for UI testing
export function simulatePlaying(state: SessionState, trackId: number, clipId: number): SessionState {
  // Update clip to playing state
}
```

### Files to Create
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/index.html`
- `apps/web/src/main.ts`
- `apps/web/src/App.svelte`
- `apps/web/src/app.css`
- `apps/web/src/lib/styles/tokens.css`
- `apps/web/src/lib/styles/clip-colors.css`
- `apps/web/src/lib/stores/mock.ts`
- `apps/web/src/lib/stores/session.ts` (writable store with mock data)

### Verification (Use Chrome MCP!)
- [ ] `pnpm dev` starts Vite server
- [ ] Open in Chrome, see dark background
- [ ] Design tokens applied correctly
- [ ] Mock data generates realistic session

---

## Phase B2: Core UI Components

### Goal
Build reusable, touch-optimized base components

### Tasks (Can Parallelize - One Agent Per Component)

**Button.svelte**
```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'secondary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
</script>

<button
  class="btn btn-{variant} btn-{size}"
  {disabled}
  on:click
>
  <slot />
</button>

<style>
  .btn {
    min-height: var(--touch-min);
    min-width: var(--touch-min);
    border-radius: var(--radius-md);
    font-weight: 600;
    transition: all var(--transition-fast);
    /* Touch-friendly: no hover states on touch devices */
  }
</style>
```

**Fader.svelte** (Vertical slider)
```svelte
<script lang="ts">
  export let value = 0;  // 0-1
  export let min = 0;
  export let max = 1;
  export let orientation: 'vertical' | 'horizontal' = 'vertical';

  // Touch drag handling
  let dragging = false;
  function handlePointerDown(e: PointerEvent) { ... }
  function handlePointerMove(e: PointerEvent) { ... }
  function handlePointerUp(e: PointerEvent) { ... }
</script>
```

**Knob.svelte** (Rotary control)
- Circular drag gesture
- Value display in center
- Min/max range support

**Toggle.svelte** (On/off switch)
- Touch-friendly size
- Clear visual states

**Meter.svelte** (Level meter)
- Animated segments
- Peak hold indicator

**ConnectionStatus.svelte**
- Shows connected/disconnected/reconnecting
- Subtle position (top-right corner)

### Files to Create
- `apps/web/src/lib/components/ui/Button.svelte`
- `apps/web/src/lib/components/ui/Fader.svelte`
- `apps/web/src/lib/components/ui/Knob.svelte`
- `apps/web/src/lib/components/ui/Toggle.svelte`
- `apps/web/src/lib/components/ui/Meter.svelte`
- `apps/web/src/lib/components/ui/ConnectionStatus.svelte`

### Verification (Use Chrome MCP!)
- [ ] Each component renders correctly
- [ ] Touch interactions work (click, drag)
- [ ] Visual feedback on interaction
- [ ] Components are responsive

---

## Phase B3: Session Grid Module

### Goal
Beautiful, responsive clip launcher grid

### Layout Design
```
┌──────────────────────────────────────────────────┬─────────┐
│  Track 1  │  Track 2  │  Track 3  │  Track 4     │ Scene   │
├───────────┼───────────┼───────────┼──────────────┼─────────┤
│  Clip 1   │  Clip 2   │  Clip 3   │  Clip 4      │ ► Sc 1  │
├───────────┼───────────┼───────────┼──────────────┼─────────┤
│  Clip 5   │  Clip 6   │  Clip 7   │  Clip 8      │ ► Sc 2  │
├───────────┼───────────┼───────────┼──────────────┼─────────┤
│  Clip 9   │  Clip 10  │  Clip 11  │  Clip 12     │ ► Sc 3  │
├───────────┼───────────┼───────────┼──────────────┼─────────┤
│  ■ Stop   │  ■ Stop   │  ■ Stop   │  ■ Stop      │ ■ All   │
└───────────┴───────────┴───────────┴──────────────┴─────────┘
```

### Components

**Grid.svelte** - Main container
- CSS Grid layout
- Responsive columns based on viewport
- Scrollable with momentum

**ClipCell.svelte** - Individual clip slot
- States: empty, stopped, triggered, playing, recording
- Shows clip name, color
- Playing progress indicator
- Touch: tap to launch, long-press to stop

**TrackHeader.svelte** - Track name at top
- Shows track name and color
- Tap to select track

**SceneLauncher.svelte** - Scene launch button (right column)
- Launches all clips in scene
- Shows scene number/name

**TrackStop.svelte** - Stop button (bottom row)
- Stops all clips in track
- Square stop icon

### Clip Cell Visual States
```css
/* Empty slot */
.clip-cell.empty {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-bg-elevated);
}

/* Has clip, stopped */
.clip-cell.stopped {
  background: var(--clip-color);  /* Dynamic based on clip */
  opacity: 0.7;
}

/* Triggered (about to play) */
.clip-cell.triggered {
  background: var(--clip-color);
  animation: blink 0.5s infinite;
}

/* Playing */
.clip-cell.playing {
  background: var(--clip-color);
  box-shadow: 0 0 20px var(--clip-color);
}

/* Recording */
.clip-cell.recording {
  background: var(--color-recording);
  animation: pulse 1s infinite;
}
```

### Files to Create
- `apps/web/src/lib/components/SessionGrid/Grid.svelte`
- `apps/web/src/lib/components/SessionGrid/ClipCell.svelte`
- `apps/web/src/lib/components/SessionGrid/TrackHeader.svelte`
- `apps/web/src/lib/components/SessionGrid/SceneLauncher.svelte`
- `apps/web/src/lib/components/SessionGrid/TrackStop.svelte`

### Verification (Use Chrome MCP!)
- [ ] Grid displays mock session data
- [ ] Clip colors match mock data
- [ ] Click clip → visual state change to "triggered"
- [ ] Playing clips glow
- [ ] Grid scrolls smoothly on iPad viewport
- [ ] Long-press shows stop feedback

---

## Phase B4: Transport Module

### Goal
Clear, accessible transport controls

### Layout Design
```
┌─────────────────────────────────────────────────────────┐
│  ◀◀  │  ▶/■  │  ●  │  120.00 BPM  │  🎵  │  1 Bar  │   │
└─────────────────────────────────────────────────────────┘
```

### Components

**Transport.svelte** - Container bar
- Fixed at bottom or top of screen
- Horizontal layout

**PlayButton.svelte** - Play/Stop toggle
- Large, prominent button
- Shows play or stop icon based on state
- Green glow when playing

**RecordButton.svelte** - Record toggle
- Red when armed
- Pulsing when recording

**TempoDisplay.svelte** - BPM display
- Shows current tempo
- Tap to edit (number input)
- Tap tempo support (multiple taps)

**Metronome.svelte** - Click toggle
- Visual beat indicator
- On/off toggle

**QuantizationSelector.svelte** - Dropdown
- Options: None, 1/4, 1/8, 1/16, 1 Bar, etc.

### Files to Create
- `apps/web/src/lib/components/Transport/Transport.svelte`
- `apps/web/src/lib/components/Transport/PlayButton.svelte`
- `apps/web/src/lib/components/Transport/RecordButton.svelte`
- `apps/web/src/lib/components/Transport/TempoDisplay.svelte`
- `apps/web/src/lib/components/Transport/Metronome.svelte`
- `apps/web/src/lib/components/Transport/QuantizationSelector.svelte`

### Verification (Use Chrome MCP!)
- [ ] Transport bar renders at bottom
- [ ] Play button toggles state
- [ ] Tempo display editable
- [ ] All buttons are touch-sized (44px+)

---

## Phase B5: Mixer Module

### Goal
Full mixing control in compact form

### Layout Design
```
┌─────┬─────┬─────┬─────┬─────┬─────┬───────┐
│ Tr1 │ Tr2 │ Tr3 │ Tr4 │ Tr5 │ ... │Master │
├─────┼─────┼─────┼─────┼─────┼─────┼───────┤
│ [M] │ [M] │ [M] │ [M] │ [M] │     │       │
│ [S] │ [S] │ [S] │ [S] │ [S] │     │       │
│ [●] │ [●] │ [●] │ [●] │ [●] │     │       │
├─────┼─────┼─────┼─────┼─────┼─────┼───────┤
│  │  │  │  │  │  │  │  │  │  │     │   │   │
│  │  │  │  │  │  │  │  │  │  │     │   │   │
│  ■  │  ■  │  ■  │  ■  │  ■  │     │   ■   │
└─────┴─────┴─────┴─────┴─────┴─────┴───────┘
  Vol   Vol   Vol   Vol   Vol         Vol
```

### Components

**Mixer.svelte** - Container
- Horizontal scroll for many tracks
- Fixed master channel on right

**Channel.svelte** - Single channel strip
- Track name
- Mute/Solo/Arm buttons
- Volume fader
- Pan knob (optional, collapsible)
- Peak meter

**MasterChannel.svelte** - Master output
- Larger fader
- Stereo meters
- No mute/solo/arm

### Files to Create
- `apps/web/src/lib/components/Mixer/Mixer.svelte`
- `apps/web/src/lib/components/Mixer/Channel.svelte`
- `apps/web/src/lib/components/Mixer/MasterChannel.svelte`

### Verification (Use Chrome MCP!)
- [ ] Mixer shows all tracks from mock data
- [ ] Faders drag smoothly
- [ ] Mute/Solo/Arm toggle correctly
- [ ] Horizontal scroll works

---

## Phase B6: Device Control Module

### Goal
Quick access to current device parameters

### Layout Design
```
┌─────────────────────────────────────────────┐
│  ◀  │  Wavetable  │  ▶  │  [ON]            │
├─────────────────────────────────────────────┤
│  ○      ○      ○      ○      ○      ○      │
│ Osc1   Osc2   Filter  Env    LFO   Volume  │
│  Pos    Pos    Freq   Attack Rate   -12dB  │
└─────────────────────────────────────────────┘
```

### Components

**DeviceControl.svelte** - Container
- Device nav header
- Parameter grid

**DeviceNav.svelte** - Navigation
- Prev/Next buttons
- Device name
- On/Off toggle

**ParameterKnob.svelte** - Single parameter
- Knob control
- Parameter name
- Current value display

### Files to Create
- `apps/web/src/lib/components/DeviceControl/DeviceControl.svelte`
- `apps/web/src/lib/components/DeviceControl/DeviceNav.svelte`
- `apps/web/src/lib/components/DeviceControl/ParameterKnob.svelte`

### Verification (Use Chrome MCP!)
- [ ] Device nav shows mock device
- [ ] 8 parameter knobs displayed
- [ ] Knobs respond to drag
- [ ] Values update visually

---

## Phase B7: X/Y Pad & Performance

### Goal
Expressive performance control

### Features
- Full-screen X/Y pad option
- Touch position maps to X/Y values
- Visual trail following finger
- Physics: momentum, friction
- Snapshot positions (save/recall)

### Components

**XYPad.svelte** - Main pad
```svelte
<script lang="ts">
  export let x = 0.5;  // 0-1
  export let y = 0.5;  // 0-1
  export let physics = { momentum: 0.5, friction: 0.1 };

  let trail: Point[] = [];

  function handlePointerMove(e: PointerEvent) {
    // Update x, y from pointer position
    // Add to trail
    // Dispatch change event
  }
</script>

<div class="xy-pad" on:pointermove={handlePointerMove}>
  <svg class="trail">
    <!-- Draw trail path -->
  </svg>
  <div class="cursor" style="left: {x*100}%; top: {y*100}%">
    <!-- Crosshair or dot -->
  </div>
</div>
```

**SnapshotBar.svelte** - Save/recall positions
- 4-8 snapshot slots
- Tap to recall, long-press to save

### Files to Create
- `apps/web/src/lib/components/XYPad/XYPad.svelte`
- `apps/web/src/lib/components/XYPad/SnapshotBar.svelte`

### Verification (Use Chrome MCP!)
- [ ] Pad responds to click/drag
- [ ] Trail follows cursor
- [ ] Physics feels natural
- [ ] Snapshots save/recall

---

## PWA Configuration

### Tasks
- Add `vite-plugin-pwa`
- Create manifest.json
- Create app icons (all sizes)
- Create splash screens
- Configure service worker

### manifest.json
```json
{
  "name": "Mission Control",
  "short_name": "MissionCtrl",
  "description": "Touch controller for Ableton Live",
  "theme_color": "#1e1e1e",
  "background_color": "#1e1e1e",
  "display": "standalone",
  "orientation": "landscape",
  "icons": [...]
}
```

### Verification
- [ ] "Add to Home Screen" works on iPad
- [ ] Opens in standalone mode (no browser chrome)
- [ ] Icons and splash screens display correctly

---

## Communication Checkpoints

Check SHARED_LOG.md at these points:
1. After B1 (design system done)
2. After B2 (base components done)
3. After B3-B6 (modules done)
4. After B7 (ready for integration)

Post questions for Track A about:
- Expected data formats from server
- State update frequency
- Any specific WebSocket message formats

Answer questions from Track A about:
- UI requirements
- Visual feedback timing
- Touch interaction needs

---

## Handoff Checklist

When complete, update SHARED_LOG.md:
```markdown
### [TIMESTAMP] TRACK-B - HANDOFF
UI track complete. Ready for integration.

Verified:
- [ ] All modules render correctly
- [ ] Mock data flows through components
- [ ] Touch interactions work smoothly
- [ ] Animations are performant
- [ ] PWA configuration complete
- [ ] Tested on iPad viewport in Chrome

Components ready for wiring:
- SessionGrid (needs: session state, clip fire/stop actions)
- Transport (needs: transport state, play/stop/record actions)
- Mixer (needs: track state, volume/mute/solo actions)
- DeviceControl (needs: device state, parameter set action)
- XYPad (needs: parameter mapping, value set action)
```
