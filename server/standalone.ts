/**
 * Standalone Bridge Server
 * Serves both the static web app and the WebSocket bridge
 * Used for production deployment (compiled with `bun build --compile`)
 */

import { createServer } from 'http';
import { Bridge } from './bridge';
import { defaultConfig } from './config';
import { join, resolve, extname } from 'path';
import { statSync, readFileSync, existsSync } from 'fs';

const PORT = 5555;

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Resolve the dist directory
function getDistPath(): string {
  const execPath = process.execPath;
  const execDir = resolve(execPath, '..');

  // Different paths to check based on context
  const candidates = [
    // macOS app bundle: Contents/MacOS/sidecar -> Contents/Resources/dist
    join(execDir, '..', 'Resources', 'dist'),
    // Windows app: next to sidecar in same directory
    join(execDir, 'dist'),
    // Development: current working directory
    join(process.cwd(), 'dist'),
  ];

  console.log(`[standalone] Executable: ${execPath}`);
  console.log(`[standalone] Checking dist paths:`, candidates);

  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isDirectory()) {
        console.log(`[standalone] Found dist at: ${candidate}`);
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Fallback
  const fallback = join(process.cwd(), 'dist');
  console.log(`[standalone] Using fallback dist path: ${fallback}`);
  return fallback;
}

const distPath = getDistPath();
console.log(`[standalone] Serving static files from: ${distPath}`);

// Create bridge instance
const bridge = new Bridge({
  config: defaultConfig,
  onLog: (msg) => console.log(`[bridge] ${msg}`),
});

// Create HTTP server
const server = createServer((req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  let filePath = url.pathname;

  // Default to index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const fullPath = join(distPath, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(distPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      const content = readFileSync(fullPath);
      const ext = extname(fullPath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      // SPA fallback - serve index.html for client-side routing
      const indexPath = join(distPath, 'index.html');
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  } catch (err) {
    console.error(`[standalone] Error serving ${filePath}:`, err);
    res.writeHead(500);
    res.end('Internal server error');
  }
});

// Handle WebSocket upgrade on /ws path
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url!, `http://${request.headers.host}`);

  if (url.pathname === '/ws') {
    bridge.handleUpgrade(request, socket, head);
  } else {
    socket.destroy();
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`[standalone] Server running at http://localhost:${PORT}`);
  console.log(`[standalone] WebSocket available at ws://localhost:${PORT}/ws`);
});

// Start OSC connection
bridge.startOSC().catch((err) => {
  console.error('[bridge] OSC failed to start:', err);
});

// Handle shutdown
function shutdown() {
  console.log('\n[standalone] Shutting down...');
  bridge.stop();
  server.close(() => {
    console.log('[standalone] Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
