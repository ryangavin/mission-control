# Track B: UI Development

You are continuing development on **Mission Control**, a touch controller for Ableton Live. You are working on **Track B: UI** - the Svelte web app that runs on iPad/tablet.

## Project Location
`/Users/ryan/The Source/mission-control`

## Your Focus
`apps/web/`

## Current State
- **B1-B4 SCAFFOLDED**: Basic UI structure exists
- Svelte 5 + Vite + PWA configured
- Design tokens in `src/app.css`
- Connection store with WebSocket to bridge
- Mock SessionGrid, Transport, ClipCell components

## Your Tasks

### Wire to Live Data
The connection store (`src/lib/stores/connection.svelte.ts`) connects to the bridge but uses mock data. Update components to use live session state from the bridge.

### B3: Session Grid Module (Polish)
`src/lib/components/SessionGrid/`:
- Replace mock data with live track/clip data from bridge
- Show real clip names, colors from Ableton
- Playing/triggered/recording states with visual feedback
- Smooth animations for state changes
- Responsive grid that adapts to screen size

### B4: Transport Module (Polish)
`src/lib/components/Transport/`:
- Live tempo display (updates in real-time)
- Play/stop/record with proper state reflection
- Tap tempo (tap BPM display multiple times)
- Quantization selector

### B5: Mixer Module (New)
`src/lib/components/Mixer/`:
- Channel strips with vertical faders
- Volume, pan per track
- Mute/Solo/Arm buttons
- Peak meters (if data available)
- Master channel

### B6: Device Control Module (New)
`src/lib/components/DeviceControl/`:
- Show current device name
- 8 parameter knobs (auto-mapped)
- Prev/Next device navigation
- Device on/off toggle

### B7: Touch & Performance
- Optimize touch gestures (tap, long-press, drag)
- Ensure 44px minimum touch targets
- Test on iPad Safari
- Add haptic feedback hints (CSS)

## Commands
- `bun run web` - Start dev server (http://localhost:5173)
- Network URL shown in terminal for iPad testing

## Communication
Update `SHARED_LOG.md` with progress. Check it for questions from Track A.

## Key Files to Read First
1. `apps/web/src/App.svelte` - Main app structure
2. `apps/web/src/lib/stores/connection.svelte.ts` - WebSocket connection
3. `apps/web/src/lib/components/SessionGrid/Grid.svelte` - Current grid
4. `apps/web/src/app.css` - Design tokens
5. `docs/TRACK-B-UI.md` - Detailed UI track plan
6. `packages/protocol/src/types.ts` - Data types from server

## Design Guidelines
- Dark theme (Ableton-inspired)
- Accent color: `#ff764d` (orange)
- Playing: `#00ff00` (green)
- Triggered: `#ffff00` (yellow, blinking)
- Recording: `#ff0000` (red)
- Touch targets: minimum 44px, comfortable 56px
- Use CSS variables from `app.css`

## Notes
- Bridge server runs on `ws://localhost:8080`
- Use Chrome DevTools device emulation for iPad testing
- PWA should work offline (show "disconnected" state gracefully)
- Primary target: iPad in landscape orientation
