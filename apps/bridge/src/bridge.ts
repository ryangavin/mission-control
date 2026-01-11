import OSC from 'osc-js';
import type { Config } from './config.js';
import type { OSCMessage, ClientMessage, ServerMessage } from '@mission-control/protocol';

export interface BridgeOptions {
  config: Config;
  onLog?: (message: string) => void;
}

export class Bridge {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private osc: OSC | null = null;
  private clients: Set<ServerWebSocket<unknown>> = new Set();
  private config: Config;
  private log: (message: string) => void;
  private abletonConnected = false;

  constructor(options: BridgeOptions) {
    this.config = options.config;
    this.log = options.onLog || console.log;
  }

  /**
   * Start the bridge server
   */
  async start(): Promise<void> {
    this.log(`Starting Mission Control Bridge...`);

    // Start OSC (UDP connection to Ableton)
    await this.startOSC();

    // Start WebSocket server (for browser clients)
    await this.startWebSocket();

    this.log(`Bridge running:`);
    this.log(`  WebSocket: ws://localhost:${this.config.wsPort}`);
    this.log(`  OSC Send: localhost:${this.config.oscSendPort}`);
    this.log(`  OSC Receive: localhost:${this.config.oscReceivePort}`);
    this.log(`\nWaiting for connections...`);
  }

  /**
   * Stop the bridge server
   */
  async stop(): Promise<void> {
    this.log('Stopping bridge...');

    // Close all WebSocket connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.server) {
      this.server.stop();
      this.server = null;
    }

    // Close OSC connection
    if (this.osc) {
      this.osc.close();
      this.osc = null;
    }

    this.log('Bridge stopped');
  }

  /**
   * Start the OSC connection to Ableton
   */
  private async startOSC(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create OSC instance with DatagramPlugin for UDP
        this.osc = new OSC({
          plugin: new OSC.DatagramPlugin({
            open: {
              host: 'localhost',
              port: this.config.oscReceivePort,
            },
            send: {
              host: 'localhost',
              port: this.config.oscSendPort,
            },
          }),
        });

        // Handle incoming OSC messages from Ableton
        this.osc.on('*', (message: { address: string; args: unknown[] }) => {
          this.handleOSCMessage(message);
        });

        this.osc.on('open', () => {
          this.log('OSC connection ready');
          this.abletonConnected = true;
          this.broadcastToClients({ type: 'connected', abletonConnected: true });
          resolve();
        });

        this.osc.on('error', (error: Error) => {
          this.log(`OSC error: ${error.message}`);
        });

        this.osc.on('close', () => {
          this.log('OSC connection closed');
          this.abletonConnected = false;
          this.broadcastToClients({ type: 'connected', abletonConnected: false });
        });

        this.osc.open();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start the WebSocket server for browser clients using Bun's native server
   */
  private async startWebSocket(): Promise<void> {
    const bridge = this;

    this.server = Bun.serve({
      port: this.config.wsPort,
      fetch(req, server) {
        // Upgrade HTTP request to WebSocket
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        return undefined;
      },
      websocket: {
        open(ws) {
          bridge.handleClientConnection(ws);
        },
        message(ws, message) {
          bridge.handleClientMessage(ws, message);
        },
        close(ws) {
          bridge.log('Client disconnected');
          bridge.clients.delete(ws);
        },
        error(ws, error) {
          bridge.log(`Client error: ${error.message}`);
          bridge.clients.delete(ws);
        },
      },
    });

    this.log('WebSocket server listening');
  }

  /**
   * Handle a new WebSocket client connection
   */
  private handleClientConnection(ws: ServerWebSocket<unknown>): void {
    this.log('Client connected');
    this.clients.add(ws);

    // Send current connection status
    this.sendToClient(ws, { type: 'connected', abletonConnected: this.abletonConnected });
  }

  /**
   * Handle a message from a WebSocket client
   */
  private handleClientMessage(ws: ServerWebSocket<unknown>, data: string | Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as ClientMessage;

      // Convert client message to OSC and send to Ableton
      const oscMessage = this.clientMessageToOSC(message);
      if (oscMessage) {
        this.sendOSC(oscMessage);
      }
    } catch (error) {
      this.log(`Invalid message from client: ${error}`);
    }
  }

  /**
   * Convert a client message to an OSC message
   */
  private clientMessageToOSC(message: ClientMessage): OSCMessage | null {
    switch (message.type) {
      case 'clip/fire':
        return { address: '/live/clip_slot/fire', args: [message.trackId, message.sceneId] };
      case 'clip/stop':
        return { address: '/live/clip_slot/stop', args: [message.trackId, message.sceneId] };
      case 'scene/fire':
        return { address: '/live/scene/fire', args: [message.sceneId] };
      case 'track/stop':
        return { address: '/live/track/stop_all_clips', args: [message.trackId] };
      case 'transport/play':
        return { address: '/live/song/start_playing', args: [] };
      case 'transport/stop':
        return { address: '/live/song/stop_playing', args: [] };
      case 'transport/record':
        return { address: '/live/song/record_mode', args: [] };
      case 'transport/tempo':
        return { address: '/live/song/set/tempo', args: [message.bpm] };
      case 'transport/metronome':
        return { address: '/live/song/set/metronome', args: [message.enabled ? 1 : 0] };
      case 'mixer/volume':
        return { address: '/live/track/set/volume', args: [message.trackId, message.value] };
      case 'mixer/pan':
        return { address: '/live/track/set/pan', args: [message.trackId, message.value] };
      case 'mixer/mute':
        return { address: '/live/track/set/mute', args: [message.trackId, message.muted ? 1 : 0] };
      case 'mixer/solo':
        return { address: '/live/track/set/solo', args: [message.trackId, message.soloed ? 1 : 0] };
      case 'mixer/arm':
        return { address: '/live/track/set/arm', args: [message.trackId, message.armed ? 1 : 0] };
      case 'device/parameter':
        return {
          address: '/live/device/set/parameter/value',
          args: [message.trackId, message.deviceId, message.parameterId, message.value]
        };
      default:
        this.log(`Unknown message type: ${(message as ClientMessage).type}`);
        return null;
    }
  }

  /**
   * Handle an incoming OSC message from Ableton
   */
  private handleOSCMessage(message: { address: string; args: unknown[] }): void {
    // Log the message for debugging
    this.log(`OSC ← ${message.address} ${JSON.stringify(message.args)}`);

    // Forward to all connected clients as raw OSC for now
    // TODO: Parse and convert to typed state updates
    this.broadcastToClients({
      type: 'patch',
      payload: {
        // Raw OSC data - will be parsed properly later
        _osc: { address: message.address, args: message.args }
      } as any
    });
  }

  /**
   * Send an OSC message to Ableton
   */
  private sendOSC(message: OSCMessage): void {
    if (!this.osc) {
      this.log('Cannot send OSC: not connected');
      return;
    }

    this.log(`OSC → ${message.address} ${JSON.stringify(message.args)}`);
    this.osc.send(new OSC.Message(message.address, ...message.args));
  }

  /**
   * Send a message to a specific WebSocket client
   */
  private sendToClient(ws: ServerWebSocket<unknown>, message: ServerMessage): void {
    ws.send(JSON.stringify(message));
  }

  /**
   * Broadcast a message to all connected WebSocket clients
   */
  private broadcastToClients(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      client.send(data);
    }
  }

  /**
   * Send a raw OSC message (for testing)
   */
  sendRawOSC(address: string, ...args: unknown[]): void {
    this.sendOSC({ address, args });
  }
}

// Type for Bun's WebSocket
type ServerWebSocket<T> = {
  send(data: string | Buffer): void;
  close(): void;
};
