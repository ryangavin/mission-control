/**
 * Vite Plugin for Mission Control Bridge
 * Integrates the bridge into Vite's dev server for unified development
 */

import type { Plugin, ViteDevServer } from 'vite';
import { Bridge } from './bridge';
import { defaultConfig } from './config';

export function bridgePlugin(): Plugin {
  let bridge: Bridge | null = null;

  return {
    name: 'mission-control-bridge',

    configureServer(server: ViteDevServer) {
      // Create bridge instance
      bridge = new Bridge({
        config: defaultConfig,
        onLog: (msg) => console.log(`[bridge] ${msg}`),
      });

      // Start OSC connection (async, but don't block server start)
      bridge.startOSC().catch((err) => {
        console.error('[bridge] OSC failed to start:', err);
      });

      // Handle WebSocket upgrade on /ws path
      server.httpServer?.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);

        if (url.pathname === '/ws') {
          bridge!.handleUpgrade(request, socket, head);
        }
        // Let Vite handle its own HMR WebSocket upgrades (usually on /)
      });

      // Cleanup on server close
      server.httpServer?.on('close', () => {
        bridge?.stop();
      });

      console.log('[bridge] Plugin initialized, WebSocket available on /ws');
    },
  };
}
