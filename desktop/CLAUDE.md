# Mission Control Desktop (Tauri)

System tray application that runs the Mission Control bridge server as a background service.

## Architecture

This is a **tray-only app** with no main window. It:
- Hides from macOS dock via `ActivationPolicy::Accessory`
- Spawns the bridge server as a **sidecar** (external compiled binary)
- Provides system tray menu for common actions
- Generates QR codes locally for mobile device pairing

### Sidecar Pattern

The bridge server (`server/standalone.ts`) is compiled to a native binary using `bun build --compile` and bundled as an external binary. Tauri spawns it via `tauri_plugin_shell::ShellExt`.

```
desktop/
├── src-tauri/
│   ├── src/main.rs          # All Rust logic (~380 lines)
│   └── capabilities/        # ACL permissions
├── dist-bridge/             # Compiled bridge binary (gitignored)
└── resources/AbletonOSC/    # Bundled Ableton remote script
```

### Port Configuration

| Mode    | UI Port | Notes |
|---------|---------|-------|
| Dev     | 5173    | Vite dev server (run separately) |
| Release | 5555    | Standalone bridge serves UI |

## Development

### Dev Mode

Run both processes separately:

```bash
# Terminal 1: Vite dev server + API
cd .. && bun run dev

# Terminal 2: Tauri shell (no sidecar)
cd desktop && cargo tauri dev
```

In dev mode, the sidecar is **not** spawned. The app expects a dev server at `localhost:5173`.

### Release Build

```bash
# 1. Build the bridge binary
cd .. && bun run build:bridge

# 2. Build the Tauri app
cd desktop && cargo tauri build
```

The release build:
1. Compiles bridge to `desktop/dist-bridge/mission-control-bridge`
2. Bundles it as an external binary
3. Spawns sidecar on app launch

## Tauri v2 Patterns

### Menu IDs

Menu items use string IDs matched in `handle_menu_event`:

```rust
let open_ui = MenuItem::with_id(app, "open_ui", "Open Mission Control", true, None::<&str>)?;

// Later in event handler:
fn handle_menu_event(app: &AppHandle, id: &str) {
    match id {
        "open_ui" => { /* ... */ }
        _ => {}
    }
}
```

### State Management

Global state via `app.manage()` and `app.state()`:

```rust
struct AppState {
    bridge_process: Mutex<Option<CommandChild>>,
}

// In setup:
app.manage(AppState { bridge_process: Mutex::new(None) });

// Later:
let state = app.state::<AppState>();
let mut process = state.bridge_process.lock().unwrap();
```

### Conditional Compilation

Dev vs release behavior controlled via `#[cfg]`:

```rust
#[cfg(debug_assertions)]
const UI_PORT: u16 = 5173;

#[cfg(not(debug_assertions))]
const UI_PORT: u16 = 5555;

#[cfg(not(debug_assertions))]
start_bridge(app.handle());
```

### Tray-Only App (macOS)

```rust
#[cfg(target_os = "macos")]
app.set_activation_policy(tauri::ActivationPolicy::Accessory);
```

### Data URL Windows

QR code window uses inline HTML via data URL:

```rust
let data_url = format!("data:text/html,{}", urlencoding::encode(&html));
match data_url.parse() {
    Ok(parsed_url) => {
        WebviewWindowBuilder::new(app, "qr", tauri::WebviewUrl::External(parsed_url))
            // ...
    }
    Err(e) => { /* handle error */ }
}
```

## Plugins Used

| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-shell` | Spawn/kill sidecar, open URLs |
| `tauri-plugin-dialog` | Native message dialogs |
| `tauri-plugin-autostart` | Launch at login (release only) |

## ACL Permissions

Minimal permissions in `capabilities/default.json`:

```json
{
  "permissions": [
    "shell:allow-spawn",
    "shell:allow-kill",
    "shell:allow-open"
  ]
}
```

## Known Issues

None currently tracked.

## Bundled Resources

### AbletonOSC

Python remote script installed to:
- macOS: `~/Music/Ableton/User Library/Remote Scripts/AbletonOSC`
- Windows: `~/Documents/Ableton/User Library/Remote Scripts/AbletonOSC`

Bundled from `resources/AbletonOSC/` → app bundle `AbletonOSC/`.

## Useful Commands

```bash
# Run Tauri dev
cargo tauri dev

# Build release
cargo tauri build

# Check Rust code
cargo check --manifest-path src-tauri/Cargo.toml

# Format Rust code
cargo fmt --manifest-path src-tauri/Cargo.toml

# View app logs (macOS)
log stream --predicate 'processImagePath contains "Mission Control"'
```
