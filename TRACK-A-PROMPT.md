# Track A: Server Development

You are continuing development on **Mission Control**, a touch controller for Ableton Live. You are working on **Track A: Server** - the headless bridge server that communicates with Ableton via OSC.

## Project Location
`/Users/ryan/The Source/mission-control`

## Your Focus
`apps/bridge/` and `packages/protocol/`

## Current State
- **A1 COMPLETE**: Bridge server works, OSC communication verified with Ableton
- Bridge relays WebSocket ↔ UDP (OSC) messages
- AbletonOSC remote script bundled and installer working
- Basic protocol types exist in `packages/protocol/src/types.ts`

## Your Tasks

### A2: OSC Protocol Layer
Enhance `packages/protocol/` with complete, type-safe AbletonOSC coverage:
- Add all OSC message types (song, track, clip, device, etc.)
- Create message builders that return properly typed OSC messages
- Create response parsers that convert OSC responses to typed objects
- Reference: https://github.com/ideoforms/AbletonOSC for full API

### A3: Session State Management
Create state management in `apps/bridge/src/state/`:
- `session.ts` - Full session state (tracks, clips, scenes)
- Sync on connect via `/live/song/get/track_data`
- Subscribe to changes via `/live/*/start_listen/*`
- Broadcast state changes to all WebSocket clients
- Support state diffing (only send what changed)

### A4: Transport Controller
`apps/bridge/src/controllers/transport.ts`:
- Play, stop, continue, record
- Tempo get/set
- Metronome toggle
- Quantization settings

### A5: Mixer Controller
`apps/bridge/src/controllers/mixer.ts`:
- Volume, pan, mute, solo, arm per track
- Send levels
- Master volume
- Throttle rapid fader movements (max 60/sec)

### A6: Device Controller
`apps/bridge/src/controllers/devices.ts`:
- List devices on selected track
- Get/set device parameters
- Device navigation (prev/next)

## Commands
- `bun run bridge` - Start bridge server
- `bun run --filter @mission-control/bridge test-osc` - Test OSC communication

## Communication
Update `SHARED_LOG.md` with progress. Check it for questions from Track B.

## Key Files to Read First
1. `apps/bridge/src/bridge.ts` - Current bridge implementation
2. `packages/protocol/src/types.ts` - Existing type definitions
3. `packages/protocol/src/messages.ts` - Existing message builders
4. `docs/TRACK-A-SERVER.md` - Detailed server track plan

## Notes
- User has Ableton Live running with AbletonOSC selected
- OSC ports: send to 11000, receive on 11001
- WebSocket server on port 8080
- Focus on reliability and low latency
