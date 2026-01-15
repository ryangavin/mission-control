# Desktop App Setup Window

## Overview
Replace the tray-only approach with a visible setup window that appears on app launch. This improves the first-run experience by showing status, setup instructions, and connection URLs in one place.

## Problem
Currently:
- App launches to tray only - users don't see anything happen
- No feedback when "Install Remote Script" is clicked
- Users don't know how to configure Ableton
- Users don't know how to connect from other devices (iPad, phone)

## Solution
Add a main window to the Tauri app that displays:
1. Live connection status (bridge + Ableton)
2. Remote script installation with feedback
3. Brief Ableton configuration instructions
4. URLs for connecting from this computer and other devices on the network

---

## Window Design

```
┌─────────────────────────────────────────────┐
│  Mission Control Bridge                     │
├─────────────────────────────────────────────┤
│                                             │
│  Status                                     │
│  ┌─────────────────────────────────────┐   │
│  │ Bridge: ● Running on port 5555      │   │
│  │ Ableton: ○ Not connected            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Setup                                      │
│  ┌─────────────────────────────────────┐   │
│  │ [Install Remote Script]              │   │
│  │ ✓ Installed successfully!            │   │
│  │                                      │   │
│  │ After installing, open Ableton and   │   │
│  │ go to Preferences → Link, Tempo &    │   │
│  │ MIDI → Control Surface: AbletonOSC   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Connect                                    │
│  ┌─────────────────────────────────────┐   │
│  │ This computer:                       │   │
│  │   http://localhost:5555              │   │
│  │                                      │   │
│  │ Other devices (iPad, phone, etc):    │   │
│  │   http://192.168.1.42:5555           │   │
│  │                                      │   │
│  │ [Open Launchpad]  [Copy URL]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─────────────────────────────────────────  │
│  [Minimize to Tray]                         │
└─────────────────────────────────────────────┘
```

Window size: ~450x550px

---

## Technical Approach

Tauri uses web technologies (HTML/CSS/JS) for UI. Since we already have Svelte set up, we'll create a new Svelte component for the setup window.

### Architecture

```
client/
├── App.svelte              # Main launchpad (existing)
├── SetupWindow.svelte      # NEW: Setup window component
├── setup.html              # NEW: Entry point for setup window
└── lib/
    └── setup/
        └── StatusCard.svelte   # Optional: reusable status component
```

The setup window connects to the bridge WebSocket (`ws://localhost:5555/ws`) to get live status updates.

---

## Implementation Steps

### 1. Create setup window entry point
**File**: `client/setup.html`
- Minimal HTML that loads SetupWindow.svelte
- Similar structure to existing index.html

### 2. Create SetupWindow component
**File**: `client/SetupWindow.svelte`
- Self-contained setup UI
- WebSocket connection to bridge for live status
- Sections: Status, Setup, Connect
- Styling consistent with main app (can reuse CSS variables)

**Features:**
- Status indicators with live updates via WebSocket
- "Install Remote Script" button that calls Tauri command
- Success/error feedback after installation
- Display localhost URL
- Detect and display local network IP
- "Open Launchpad" button
- "Copy URL" button for sharing with other devices
- "Minimize to Tray" button

### 3. Update Tauri configuration
**File**: `desktop/src-tauri/tauri.conf.json`
- Add window configuration (currently `"windows": []`)
- Set window title, size, resizable options
- Point to setup.html as the window content

```json
"windows": [
  {
    "title": "Mission Control Bridge",
    "width": 450,
    "height": 550,
    "resizable": false,
    "center": true,
    "url": "setup.html"
  }
]
```

### 4. Add Tauri commands for IPC
**File**: `desktop/src-tauri/src/main.rs`
- Add `install_remote_script` as a Tauri command (not just menu handler)
- Add `get_network_ip` command to get local network IP
- Add `open_launchpad` command
- Add `minimize_to_tray` command

```rust
#[tauri::command]
fn install_remote_script(app: AppHandle) -> Result<String, String> {
    // Existing logic, but return success/error message
}

#[tauri::command]
fn get_network_ip() -> Result<String, String> {
    // Detect local network IP (192.168.x.x, 10.x.x.x, etc.)
}
```

### 5. Update Vite build configuration
**File**: `vite.config.ts`
- Add setup.html as additional entry point
- Ensure both index.html and setup.html are built

```typescript
build: {
  rollupOptions: {
    input: {
      main: 'index.html',
      setup: 'client/setup.html'
    }
  }
}
```

### 6. Wire up WebSocket status in SetupWindow
- Connect to `ws://localhost:5555/ws`
- Listen for status messages (bridge already sends these)
- Update UI reactively based on connection state

### 7. Handle window minimize to tray
- "Minimize to Tray" button hides window but keeps app running
- Tray icon click re-shows the window
- Update Rust code to handle show/hide

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `client/setup.html` | Create - entry point for setup window |
| `client/SetupWindow.svelte` | Create - main setup UI component |
| `desktop/src-tauri/tauri.conf.json` | Modify - add window config |
| `desktop/src-tauri/src/main.rs` | Modify - add Tauri commands, window management |
| `vite.config.ts` | Modify - add setup.html to build |

---

## Status Updates via WebSocket

The bridge already broadcasts status. The setup window should listen for:
```json
{
  "type": "status",
  "bridgeConnected": true,
  "abletonConnected": true
}
```

If this message format doesn't exist yet, add it to the bridge.

---

## Network IP Detection

For "Connect from other devices", we need to detect the machine's local network IP.

**Rust approach** (in main.rs):
```rust
use local_ip_address::local_ip;

#[tauri::command]
fn get_network_ip() -> Result<String, String> {
    local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| e.to_string())
}
```

Add `local-ip-address` crate to Cargo.toml.

---

## Verification

1. **Build succeeds**: `bun run build` produces both index.html and setup.html in dist/
2. **Tauri app launches with window**: Window appears on startup (not just tray)
3. **Status updates live**: Open Ableton, see status change from disconnected to connected
4. **Install button works**: Click install, see success message, verify files copied
5. **URLs display correctly**: Localhost and network IP shown
6. **Open Launchpad works**: Clicks open browser to localhost:5555
7. **Copy URL works**: Copies network URL to clipboard
8. **Minimize to tray**: Window hides, tray icon remains, can restore window

---

## Future Enhancements (Out of Scope)

- QR code for easy mobile scanning
- Auto-detect if remote script already installed
- Link to video tutorial
- Remember window position
