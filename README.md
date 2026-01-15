# Mission Control

A modern web-based controller for Ableton Live. Control your sessions from any browser with real-time bidirectional sync.

![Mission Control Screenshot](docs/screenshot.png)

## Features

- **Transport Control** — Play, stop, record, tap tempo, punch in/out, loop toggle
- **Clip Launching** — Fire and stop clips with quantization support (1/32 to 8 bars)
- **Scene Launching** — Trigger entire scenes with one click
- **Mixer Controls** — Volume, pan, mute, solo, and arm per track
- **Drag & Drop** — Move clips between tracks with automatic type validation
- **Real-time Sync** — Instant bidirectional updates between Ableton and the UI
- **Visual Feedback** — Color-coded clips, playback progress indicators, playing states
- **Desktop App** — Optional Tauri-based app with system tray integration

## Requirements

- [Ableton Live](https://www.ableton.com/live/) (10 or 11)
- [AbletonOSC](https://github.com/ideoforms/AbletonOSC) remote script installed
- [Bun](https://bun.sh) (for development/building)

## Quick Start

### 1. Install AbletonOSC

Download [AbletonOSC](https://github.com/ideoforms/AbletonOSC) and copy the `AbletonOSC` folder to your Ableton Remote Scripts directory:

- **macOS**: `~/Music/Ableton/User Library/Remote Scripts/`
- **Windows**: `~\Documents\Ableton\User Library\Remote Scripts\`

Then in Ableton Live, go to **Preferences → Link, Tempo & MIDI → Control Surface** and select `AbletonOSC`.

### 2. Run Mission Control

```bash
# Install dependencies
bun install

# Start the development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Connect

Mission Control automatically connects to Ableton via OSC on ports 11000/11001. Once AbletonOSC is enabled in Ableton, the connection status indicator will turn green.

## Building

### Web (Standalone Server)

```bash
# Build the web assets
bun run build

# Build the bridge server binary
bun run build:bridge

# Run production server
bun run start:standalone
```

The standalone server runs on [http://localhost:5555](http://localhost:5555).

### Desktop App (Tauri)

```bash
# Development
bun run tauri:dev

# Production build
bun run tauri:build
```

Platform-specific bridge binaries:

```bash
bun run build:bridge:mac-arm   # macOS Apple Silicon
bun run build:bridge:mac-x64   # macOS Intel
bun run build:bridge:win       # Windows x64
```

## Project Structure

```
mission-control/
├── client/          # Svelte 5 frontend
├── server/          # Bridge server (OSC ↔ WebSocket)
├── protocol/        # Type-safe message protocol
├── desktop/         # Tauri desktop app
└── docs/            # Documentation
```

## Tech Stack

- **Frontend**: [Svelte 5](https://svelte.dev) + [Vite](https://vitejs.dev)
- **Runtime**: [Bun](https://bun.sh)
- **Desktop**: [Tauri 2](https://tauri.app) (Rust)
- **Protocol**: OSC via [osc-js](https://github.com/adzialocha/osc-js)

## How It Works

Mission Control acts as a bridge between your browser and Ableton Live:

```
Browser ←—WebSocket—→ Bridge Server ←—OSC—→ Ableton Live (AbletonOSC)
```

The bridge server translates WebSocket messages to OSC commands and vice versa, enabling real-time control from any modern browser.

## Contributing

Contributions are welcome! Please open an issue to discuss significant changes before submitting a PR.

## License

[GPL-3.0](LICENSE)
