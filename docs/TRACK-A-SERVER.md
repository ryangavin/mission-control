# Track A: Server Development Plan

> **Focus**: `apps/bridge/` and `packages/protocol/`
> **Output**: Headless, rock-solid bridge server with CLI
> **Communication**: Check `SHARED_LOG.md` periodically for questions from Track B

---

## Overview

Build a self-contained bridge server that:
1. Auto-installs the remote script to Ableton
2. Relays WebSocket ↔ UDP for OSC communication
3. Manages session state with real-time sync
4. Handles multiple client connections

---

## Parallel Agent Strategy

Within this track, use parallel agents for:
- **Infra tasks** (project setup, config) can run parallel to **core implementation**
- **Testing** can run parallel to **documentation**

Suggested agent breakdown per phase:
```
A1: Single agent (sequential - foundational)
A2: Two agents - types/messages in parallel
A3: Single agent (state management is interconnected)
A4-A6: Can parallelize these controller modules
A7: Two agents - testing + documentation in parallel
```

---

## Phase A1: Bridge Foundation + Remote Script Installer

### Goal
Single-command setup: `npx @mission-control/bridge install && start`

### Tasks

**1.1 Project Scaffolding**
```bash
# Create monorepo structure
mkdir -p apps/bridge/src apps/bridge/remote-script
mkdir -p packages/protocol/src
# Initialize package.json files
# Set up TypeScript configs
# Configure pnpm workspace
```

**1.2 Bundle AbletonOSC**
- Clone/copy AbletonOSC remote script files
- Place in `apps/bridge/remote-script/MissionControl/`
- Rename to "MissionControl" for cleaner UX

**1.3 Implement Installer** (`apps/bridge/src/installer.ts`)
```typescript
// Detect OS
// Find Ableton Remote Scripts folder
// Copy remote script files
// Verify installation
```

Remote Scripts paths:
- macOS: `~/Music/Ableton/User Library/Remote Scripts/`
- Windows: `%USERPROFILE%\Documents\Ableton\User Library\Remote Scripts\`

**1.4 Implement Bridge** (`apps/bridge/src/bridge.ts`)
```typescript
// WebSocket server on port 8080
// UDP client to localhost:11000 (send) and :11001 (receive)
// Bidirectional message relay
// Connection state tracking
```

**1.5 CLI Entry Point** (`apps/bridge/src/index.ts`)
```typescript
// Commands: install, start, status
// Use commander or yargs for CLI parsing
```

### Files to Create
- `apps/bridge/package.json`
- `apps/bridge/tsconfig.json`
- `apps/bridge/src/index.ts`
- `apps/bridge/src/bridge.ts`
- `apps/bridge/src/installer.ts`
- `apps/bridge/src/config.ts`
- `apps/bridge/remote-script/MissionControl/` (copied from AbletonOSC)

### Verification
- [ ] `pnpm install` works
- [ ] `pnpm --filter @mission-control/bridge run install` copies files to Remote Scripts
- [ ] User can select "MissionControl" in Ableton preferences
- [ ] Bridge starts and logs "Waiting for connections"
- [ ] WebSocket client can connect to ws://localhost:8080

### Questions for User
- Post to SHARED_LOG.md if you need user to verify Ableton setup

---

## Phase A2: OSC Protocol Layer

### Goal
Type-safe, complete AbletonOSC protocol implementation

### Tasks (Can Parallelize)

**Agent 1: Types** (`packages/protocol/src/types.ts`)
```typescript
// Session state types
interface SessionState { ... }
interface Track { ... }
interface ClipSlot { ... }
interface Clip { ... }
interface Device { ... }
interface Parameter { ... }

// OSC message types
type OSCAddress = string;
type OSCValue = number | string | boolean;
interface OSCMessage { address: OSCAddress; args: OSCValue[] }
```

**Agent 2: Messages** (`packages/protocol/src/messages.ts`)
```typescript
// Message builders for all AbletonOSC commands
export const song = {
  getTempo: () => ({ address: '/live/song/get/tempo', args: [] }),
  setTempo: (bpm: number) => ({ address: '/live/song/set/tempo', args: [bpm] }),
  play: () => ({ address: '/live/song/start_playing', args: [] }),
  stop: () => ({ address: '/live/song/stop_playing', args: [] }),
  getTrackData: () => ({ address: '/live/song/get/track_data', args: [] }),
  // ... etc
};

export const track = {
  getVolume: (trackId: number) => ...,
  setVolume: (trackId: number, value: number) => ...,
  // ... etc
};

export const clip = {
  fire: (trackId: number, clipId: number) => ...,
  stop: (trackId: number, clipId: number) => ...,
  // ... etc
};
```

### Message Categories to Implement

**Song Level:**
- `/live/song/get/tempo` / `set/tempo`
- `/live/song/start_playing` / `stop_playing` / `continue_playing`
- `/live/song/get/metronome` / `set/metronome`
- `/live/song/get/track_data` (bulk sync)
- `/live/song/get/num_tracks` / `get/num_scenes`

**Tracks:**
- `/live/track/get/name` / `get/color`
- `/live/track/get/volume` / `set/volume`
- `/live/track/get/pan` / `set/pan`
- `/live/track/get/mute` / `set/mute`
- `/live/track/get/solo` / `set/solo`
- `/live/track/get/arm` / `set/arm`

**Clips:**
- `/live/clip_slot/fire` / `stop`
- `/live/clip/get/name` / `get/color`
- `/live/clip/get/playing_status`
- `/live/clip/start_listen/playing_status`
- `/live/clip/stop_listen/playing_status`

**Devices:**
- `/live/device/get/name`
- `/live/device/get/parameters`
- `/live/device/set/parameter/value`

### Files to Create
- `packages/protocol/package.json`
- `packages/protocol/tsconfig.json`
- `packages/protocol/src/index.ts`
- `packages/protocol/src/types.ts`
- `packages/protocol/src/messages.ts`

### Verification
- [ ] Types compile without errors
- [ ] Message builders produce correct OSC format
- [ ] Can import from both bridge and web packages

---

## Phase A3: Session State Management

### Goal
Server maintains authoritative session state, syncs to clients

### Tasks

**3.1 State Manager** (`apps/bridge/src/state/session.ts`)
```typescript
class SessionStateManager {
  private state: SessionState;
  private subscribers: Set<WebSocket>;

  // Full sync on connect
  async syncFromAbleton(): Promise<void>;

  // Incremental updates
  handleOSCMessage(msg: OSCMessage): void;

  // Broadcast to clients
  broadcastStateUpdate(patch: Partial<SessionState>): void;
}
```

**3.2 Listener Management**
- Subscribe to clip playing status changes
- Subscribe to track volume/mute/solo changes
- Clean up listeners when clients disconnect

**3.3 State Diffing**
- Only send changed values to clients
- Batch rapid updates (throttle to 60fps)

### Files to Create
- `apps/bridge/src/state/session.ts`
- `apps/bridge/src/state/sync.ts`

### Verification
- [ ] Full session loads on connect
- [ ] Clip state changes reflected in real-time
- [ ] Multiple clients see same state
- [ ] Reconnecting client gets full state

---

## Phase A4: Transport & Playback Controller

### Goal
Reliable transport control with low latency

### Tasks

**4.1 Transport Controller** (`apps/bridge/src/controllers/transport.ts`)
```typescript
class TransportController {
  play(): void;
  stop(): void;
  record(): void;
  setTempo(bpm: number): void;
  tapTempo(): void;  // Calculate from tap intervals
  setMetronome(on: boolean): void;
  setQuantization(value: number): void;
}
```

### Verification
- [ ] Play/stop commands execute immediately
- [ ] Tempo changes reflected in Ableton
- [ ] Tap tempo calculates correctly
- [ ] Measure latency: command → state change

---

## Phase A5: Mixer Controller

### Goal
Full mixer control with smooth automation

### Tasks

**5.1 Mixer Controller** (`apps/bridge/src/controllers/mixer.ts`)
```typescript
class MixerController {
  setVolume(trackId: number, value: number): void;
  setPan(trackId: number, value: number): void;
  setMute(trackId: number, muted: boolean): void;
  setSolo(trackId: number, soloed: boolean): void;
  setArm(trackId: number, armed: boolean): void;
  setSend(trackId: number, sendId: number, value: number): void;
}
```

**5.2 Rate Limiting**
- Throttle rapid fader movements (max 60 updates/sec per parameter)
- Coalesce multiple changes in same frame

### Verification
- [ ] Volume changes smooth (no stepping)
- [ ] Mute/solo/arm toggle correctly
- [ ] No message drops under rapid automation

---

## Phase A6: Device Controller

### Goal
Control any device parameter

### Tasks

**6.1 Device Controller** (`apps/bridge/src/controllers/devices.ts`)
```typescript
class DeviceController {
  getDevices(trackId: number): Promise<Device[]>;
  getParameters(trackId: number, deviceId: number): Promise<Parameter[]>;
  setParameter(trackId: number, deviceId: number, paramId: number, value: number): void;
  toggleDevice(trackId: number, deviceId: number): void;
}
```

### Verification
- [ ] Lists devices on any track
- [ ] Parameter values update in Ableton
- [ ] Works with native devices, VST/AU, M4L

---

## Phase A7: Stress Testing & Polish

### Goal
Production-ready server

### Tasks (Can Parallelize)

**Agent 1: Testing**
- Load test with 64+ tracks, 100+ clips
- Rapid state change stress test
- Memory profiling (check for leaks)
- Connection stress test (rapid connect/disconnect)

**Agent 2: Documentation & Polish**
- API documentation
- Error handling improvements
- Structured logging
- README with setup instructions

### Deliverable
Fully functional headless server that:
- Installs itself with one command
- Connects reliably to Ableton
- Handles multiple clients
- Syncs state in real-time
- Is well-documented

### Handoff Checklist
When complete, update SHARED_LOG.md:
```markdown
### [TIMESTAMP] TRACK-A - HANDOFF
Server track complete. Ready for integration.

Verified:
- [ ] Bridge installs remote script correctly
- [ ] WebSocket connections work
- [ ] Full session sync on connect
- [ ] Real-time state updates
- [ ] All controllers implemented
- [ ] Stress tested with large sessions
- [ ] Documentation complete

API Endpoint: ws://localhost:8080
Protocol: See packages/protocol/src/messages.ts
```

---

## Communication Checkpoints

Check SHARED_LOG.md at these points:
1. After A1 (basic bridge working)
2. After A2 (protocol types defined)
3. After A3 (state management done)
4. After A7 (ready for integration)

Post questions for Track B about:
- Expected data formats for UI
- Any specific state the UI needs
- Performance requirements

Answer questions from Track B about:
- OSC message formats
- State update timing
- Connection handling
