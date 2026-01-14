# Project Restructure Plan

## Goal

Flatten the monorepo structure. Remove unnecessary `apps/` and `packages/` nesting. End up with a simple, flat project structure.

---

## Current Structure

```
mission-control/
├── apps/
│   └── web/
│       ├── src/                    # Frontend Svelte code
│       │   ├── App.svelte
│       │   ├── main.ts
│       │   ├── app.css
│       │   └── lib/
│       │       ├── connection.ts
│       │       ├── SetupPanel.svelte
│       │       ├── HelpModal.svelte
│       │       └── Counter.svelte  # UNUSED - delete
│       ├── server/                 # Backend bridge code
│       │   ├── bridge.ts
│       │   ├── config.ts
│       │   ├── vite-plugin.ts
│       │   └── state/
│       │       ├── index.ts
│       │       ├── session.ts
│       │       └── sync.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       └── tsconfig.node.json
├── packages/
│   └── protocol/
│       ├── src/
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── messages.ts
│       │   ├── parsers.ts
│       │   └── responses.ts
│       ├── test-harness.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
├── package.json                    # Workspace root
└── tsconfig.json
```

---

## Target Structure

```
mission-control/
├── client/                         # Frontend (moved from apps/web/src)
│   ├── App.svelte
│   ├── main.ts
│   ├── app.css
│   └── lib/
│       ├── connection.ts
│       ├── SetupPanel.svelte
│       └── HelpModal.svelte
├── server/                         # Backend (moved from apps/web/server)
│   ├── bridge.ts
│   ├── config.ts
│   ├── vite-plugin.ts
│   └── state/
│       ├── index.ts
│       ├── session.ts
│       └── sync.ts
├── protocol/                       # Shared types (moved from packages/protocol/src)
│   ├── index.ts
│   ├── types.ts
│   ├── messages.ts
│   ├── parsers.ts
│   └── responses.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROTOCOL.md
│   └── ...
├── index.html
├── vite.config.ts
├── package.json                    # Single flat package (no workspaces)
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

---

## Step-by-Step Instructions

### Step 1: Move frontend files

```bash
mv apps/web/src ./client
mv apps/web/index.html ./index.html
mv apps/web/public ./public 2>/dev/null || true
```

### Step 2: Move backend files

```bash
mv apps/web/server ./server
```

### Step 3: Move protocol files (flatten the nested src/)

```bash
mv packages/protocol/src ./protocol
mv packages/protocol/test-harness.ts ./protocol/test-harness.ts
```

### Step 4: Move config files

```bash
mv apps/web/vite.config.ts ./vite.config.ts
mv apps/web/tsconfig.app.json ./tsconfig.app.json
mv apps/web/tsconfig.node.json ./tsconfig.node.json
```

### Step 5: Delete unused files

```bash
rm client/lib/Counter.svelte
```

### Step 6: Remove empty directories

```bash
rm -rf apps/
rm -rf packages/
```

### Step 7: Update imports

These files import from `@mission-control/protocol` and need to change to relative paths:

| File | Old Import | New Import |
|------|------------|------------|
| `server/bridge.ts` | `@mission-control/protocol` | `../protocol` |
| `server/vite-plugin.ts` | `@mission-control/protocol` | `../protocol` |
| `server/state/session.ts` | `@mission-control/protocol` | `../../protocol` |
| `server/state/sync.ts` | `@mission-control/protocol` | `../../protocol` |
| `server/state/index.ts` | `@mission-control/protocol` | `../../protocol` |

**Example change in `server/bridge.ts`:**
```typescript
// Before (line ~11)
import type { OSCMessage, ClientMessage, ServerMessage, PatchPayload } from '@mission-control/protocol';

// After
import type { OSCMessage, ClientMessage, ServerMessage, PatchPayload } from '../protocol';
```

### Step 8: Create new package.json

Replace the root `package.json` with this merged version:

```json
{
  "name": "mission-control",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json"
  },
  "dependencies": {
    "osc-js": "^2.4.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^6.2.1",
    "@tsconfig/svelte": "^5.0.6",
    "@types/bun": "latest",
    "@types/node": "^24.10.1",
    "@types/ws": "^8.18.0",
    "svelte": "^5.43.8",
    "svelte-check": "^4.3.4",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

### Step 9: Update tsconfig.json

Replace root `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### Step 10: Update tsconfig.app.json

Update paths to use `client/` instead of `src/`:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["client/**/*.ts", "client/**/*.svelte", "protocol/**/*.ts"]
}
```

### Step 11: Update tsconfig.node.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts", "server/**/*.ts", "protocol/**/*.ts"]
}
```

### Step 12: Update index.html

Change the script src from `/src/main.ts` to `/client/main.ts`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mission Control</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/client/main.ts"></script>
  </body>
</html>
```

### Step 13: Update vite.config.ts

The import path for the bridge plugin should still work since we moved `server/` to the root:

```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { bridgePlugin } from './server/vite-plugin'

export default defineConfig({
  plugins: [svelte(), bridgePlugin()],
})
```

### Step 14: Reinstall dependencies

```bash
rm -rf node_modules
rm bun.lock
bun install
```

---

## Verification Checklist

After completing all steps:

1. **Check file structure**
   ```bash
   ls -la
   # Should see: client/, server/, protocol/, docs/, index.html, vite.config.ts, package.json, etc.
   ```

2. **Run dev server**
   ```bash
   bun run dev
   # Should start Vite on localhost:5173
   ```

3. **Check for TypeScript errors**
   ```bash
   bun run check
   # Should pass with no errors
   ```

4. **Test the app**
   - Open http://localhost:5173
   - Should see the Mission Control UI
   - If Ableton is running with AbletonOSC, clips should sync

5. **Verify no broken imports**
   ```bash
   grep -r "@mission-control/protocol" client/ server/
   # Should return nothing (all imports updated)
   ```

---

## Files Summary

### Files to move
- `apps/web/src/*` → `client/`
- `apps/web/server/*` → `server/`
- `apps/web/index.html` → `index.html`
- `apps/web/vite.config.ts` → `vite.config.ts`
- `apps/web/tsconfig.*.json` → root
- `packages/protocol/src/*` → `protocol/`
- `packages/protocol/test-harness.ts` → `protocol/`

### Files to delete
- `client/lib/Counter.svelte` (unused)
- `apps/` directory (after moving contents)
- `packages/` directory (after moving contents)
- `apps/web/package.json` (merged into root)
- `packages/protocol/package.json` (no longer needed)

### Files to modify
- `index.html` - update script src to `/client/main.ts`
- `server/bridge.ts` - update imports
- `server/vite-plugin.ts` - update imports
- `server/state/session.ts` - update imports
- `server/state/sync.ts` - update imports
- `server/state/index.ts` - update imports
- `package.json` - rewrite (merged version)
- `tsconfig.json` - rewrite
- `tsconfig.app.json` - update include paths
- `tsconfig.node.json` - update include paths
