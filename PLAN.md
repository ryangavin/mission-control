# MC Bridge - Simplified Local Deployment

## Goal

Package the app for beta testing where users run everything locally. The Tauri menubar app spawns both the bridge and a static web server. No external hosting.

## Current State

- `apps/bridge/` - Bun CLI that connects to Ableton via OSC, exposes WebSocket on :8080
- `apps/web/` - Svelte/Vite frontend, connects to bridge via WebSocket
- `apps/desktop/` - Tauri menubar app, currently spawns only bridge sidecar
- Web has GitHub Pages config in vite.config.ts (base path)

## Target State

- Root `bun run dev` starts both bridge and web for development
- Tauri app spawns two compiled binaries: bridge + static web server
- No external hosting, everything runs locally
- User clicks "Open UI" → browser opens to localhost:5173

---

## Implementation Steps

### Phase 1: Development Scripts (can run in parallel with Phase 2)

**Step 1.1: Update root package.json**

File: `/package.json`

Add these scripts:
```json
{
  "scripts": {
    "dev": "concurrently -n bridge,web -c blue,green \"bun run --filter @mission-control/bridge dev\" \"bun run --filter web dev\"",
    "build": "bun run build:web && bun run build:bridge",
    "build:web": "bun run --filter web build",
    "build:bridge": "bun run --filter @mission-control/bridge compile:sidecar"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Then run: `bun install`

**Step 1.2: Add dev script to bridge package.json**

File: `apps/bridge/package.json`

Ensure there's a `dev` script:
```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "compile:sidecar": "bun build --compile --outfile=../desktop/binaries/mission-control-bridge src/index.ts"
  }
}
```

---

### Phase 2: Static Web Server (can run in parallel with Phase 1)

**Step 2.1: Create static server script**

File: `apps/web/serve.ts`

```typescript
import { join } from 'path';

const distDir = join(import.meta.dir, 'dist');
const port = 5173;

const server = Bun.serve({
  port,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html for root or SPA routes
    if (pathname === '/' || !pathname.includes('.')) {
      pathname = '/index.html';
    }

    const filePath = join(distDir, pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback to index.html for SPA
    return new Response(Bun.file(join(distDir, 'index.html')));
  },
});

console.log(`Static server running at http://localhost:${port}`);
```

**Step 2.2: Add serve script to web package.json**

File: `apps/web/package.json`

```json
{
  "scripts": {
    "serve": "bun run serve.ts",
    "compile:server": "bun build --compile --outfile=../desktop/binaries/mission-control-web src/serve.ts"
  }
}
```

**Step 2.3: Remove GitHub Pages base path**

File: `apps/web/vite.config.ts`

Change from:
```typescript
base: process.env.GITHUB_ACTIONS ? '/mission-control/' : '/',
```

To:
```typescript
base: '/',
```

---

### Phase 3: Update Tauri App (depends on Phase 1 & 2)

**Step 3.1: Update main.rs to spawn both processes**

File: `apps/desktop/src/main.rs`

Update `start_bridge` function to start both:

```rust
fn start_bridge(app: &AppHandle, state: &State<BridgeState>) {
    let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");

    #[cfg(target_os = "macos")]
    let (bridge_name, web_name) = ("mission-control-bridge", "mission-control-web");
    #[cfg(target_os = "windows")]
    let (bridge_name, web_name) = ("mission-control-bridge.exe", "mission-control-web.exe");
    #[cfg(target_os = "linux")]
    let (bridge_name, web_name) = ("mission-control-bridge", "mission-control-web");

    let bridge_path = resource_dir.join("binaries").join(bridge_name);
    let web_path = resource_dir.join("binaries").join(web_name);

    // Start bridge
    match Command::new(&bridge_path).spawn() {
        Ok(child) => {
            state.bridge_process.lock().unwrap().replace(child);
            println!("Bridge started");
        }
        Err(e) => eprintln!("Failed to start bridge: {}", e),
    }

    // Start web server
    match Command::new(&web_path).spawn() {
        Ok(child) => {
            state.web_process.lock().unwrap().replace(child);
            println!("Web server started");
        }
        Err(e) => eprintln!("Failed to start web server: {}", e),
    }

    *state.running.lock().unwrap() = true;
}
```

Update `BridgeState` struct to track both processes:
```rust
struct BridgeState {
    bridge_process: Mutex<Option<Child>>,
    web_process: Mutex<Option<Child>>,
    running: Mutex<bool>,
}
```

Update `stop_bridge` to stop both:
```rust
fn stop_bridge(state: &State<BridgeState>) {
    // Stop bridge
    if let Some(ref mut child) = *state.bridge_process.lock().unwrap() {
        let _ = child.kill();
        let _ = child.wait();
    }
    *state.bridge_process.lock().unwrap() = None;

    // Stop web server
    if let Some(ref mut child) = *state.web_process.lock().unwrap() {
        let _ = child.kill();
        let _ = child.wait();
    }
    *state.web_process.lock().unwrap() = None;

    *state.running.lock().unwrap() = false;
    println!("Bridge stopped");
}
```

**Step 3.2: Update "Open UI" menu handler**

In `handle_menu_event`, update the URL:
```rust
"open_web_ui" => {
    let _ = open::that("http://localhost:5173");
}
```

---

### Phase 4: Build & Test

**Step 4.1: Build web UI**
```bash
cd apps/web && bun run build
```

**Step 4.2: Compile both binaries** (can run in parallel)
```bash
# Terminal 1
cd apps/bridge && bun build --compile --outfile=../desktop/binaries/mission-control-bridge src/index.ts

# Terminal 2
cd apps/web && bun build --compile --outfile=../desktop/binaries/mission-control-web serve.ts
```

**Step 4.3: Build Tauri app**
```bash
cd apps/desktop && cargo tauri build
```

---

## Verification Checklist

1. [ ] `bun run dev` from root starts both bridge (:8080) and web (:5173)
2. [ ] Open http://localhost:5173 - UI loads and connects to bridge
3. [ ] Connect to Ableton - OSC communication works
4. [ ] Build Tauri app - compiles without errors
5. [ ] Run Tauri app - "Start Bridge" spawns both processes
6. [ ] "Open UI" menu item opens browser to localhost:5173
7. [ ] "Stop Bridge" cleanly terminates both processes
8. [ ] "Quit" stops everything and exits

---

## Files Summary

**Create:**
- `apps/web/serve.ts` - static file server

**Modify:**
- `package.json` - add root dev/build scripts
- `apps/bridge/package.json` - ensure dev script exists
- `apps/web/package.json` - add serve/compile scripts
- `apps/web/vite.config.ts` - remove GitHub Pages base
- `apps/desktop/src/main.rs` - spawn both processes, update state struct

**Delete (optional cleanup later):**
- `.github/workflows/deploy-web.yml` - if exists

---

## Parallelization Guide

For fastest implementation:

**Parallel Group 1:**
- Step 1.1 (root package.json)
- Step 2.1 (serve.ts)
- Step 2.3 (vite.config.ts)

**Parallel Group 2:** (after Group 1)
- Step 1.2 (bridge package.json)
- Step 2.2 (web package.json)

**Sequential:** (after Group 2)
- Step 3.1 & 3.2 (main.rs updates)

**Sequential:** (after all above)
- Phase 4 (build & test)
