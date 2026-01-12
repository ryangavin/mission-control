import OSC from 'osc-js';
import type { Config } from './config.js';
import type { OSCMessage, ClientMessage, ServerMessage, PatchPayload } from '@mission-control/protocol';
import { SessionManager, SyncManager } from './state/index.js';

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

  // State management
  private session: SessionManager;
  private sync: SyncManager;
  private syncInProgress = false;
  private synced = false;
  private beatTimeInterval: ReturnType<typeof setInterval> | null = null;
  private structurePollingInterval: ReturnType<typeof setInterval> | null = null;
  private structurePollingMs = 2000; // Check for new tracks/scenes every 2 seconds

  constructor(options: BridgeOptions) {
    this.config = options.config;
    this.log = options.onLog || console.log;

    // Initialize state managers
    this.session = new SessionManager();
    this.sync = new SyncManager(this.session, {
      sendOSC: (msg) => this.sendOSC(msg),
      onLog: (msg) => this.log(msg),
    });
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

    // Stop beat time polling
    this.stopBeatTimePolling();

    // Stop listeners
    this.sync.stopListeners();

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
          this.synced = false;
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

    // If already synced, send current session state
    if (this.synced) {
      this.sendToClient(ws, { type: 'session', payload: this.session.getState() });
    }
  }

  /**
   * Handle a message from a WebSocket client
   */
  private handleClientMessage(ws: ServerWebSocket<unknown>, data: string | Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      // Handle session request
      if (message.type === 'session/request') {
        this.handleSessionRequest(ws);
        return;
      }

      // Handle raw OSC messages (for testing and queries)
      if (message.type === 'osc' && message.address) {
        this.sendOSC({ address: message.address, args: message.args || [] });
        return;
      }

      // Convert client message to OSC and send to Ableton
      const oscMessage = this.clientMessageToOSC(message as ClientMessage);
      if (oscMessage) {
        this.sendOSC(oscMessage);
      }
    } catch (error) {
      this.log(`Invalid message from client: ${error}`);
    }
  }

  /**
   * Handle session request from client
   */
  private async handleSessionRequest(ws: ServerWebSocket<unknown>): Promise<void> {
    // If already synced, send current state
    if (this.synced) {
      this.sendToClient(ws, { type: 'session', payload: this.session.getState() });
      return;
    }

    // If sync in progress, wait for it
    if (this.syncInProgress) {
      this.log('Sync already in progress, waiting...');
      return;
    }

    // Perform initial sync
    this.syncInProgress = true;
    try {
      await this.sync.performInitialSync();
      this.sync.setupListeners();
      this.synced = true;

      // Broadcast session to all clients
      this.broadcastToClients({ type: 'session', payload: this.session.getState() });
    } catch (error) {
      this.log(`Sync failed: ${error}`);
      this.sendToClient(ws, { type: 'error', message: `Sync failed: ${error}` });
    } finally {
      this.syncInProgress = false;
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
        return { address: '/live/track/set/panning', args: [message.trackId, message.value] };
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
      case 'session/request':
        // Handled separately
        return null;
      default:
        this.log(`Unknown message type: ${(message as any).type}`);
        return null;
    }
  }

  /**
   * Handle an incoming OSC message from Ableton
   */
  private handleOSCMessage(message: { address: string; args: unknown[] }): void {
    // Log the message for debugging
    this.log(`OSC <- ${message.address} ${JSON.stringify(message.args)}`);

    // First, check if this is a response to a sync query
    const wasQueryResponse = this.sync.handleOSCResponse(message.address, message.args);
    if (wasQueryResponse) {
      return; // Don't broadcast query responses
    }

    // Parse listener updates and update state
    const patch = this.parseListenerUpdate(message.address, message.args);
    if (patch) {
      this.broadcastToClients({ type: 'patch', payload: patch });
    }
  }

  /**
   * Parse a listener update from Ableton and update session state
   */
  private parseListenerUpdate(address: string, args: unknown[]): PatchPayload | null {
    // Transport updates
    if (address === '/live/song/get/tempo') {
      const patch = this.session.setTempo(args[0] as number);
      // Update polling interval if tempo changed while playing
      this.updateBeatTimePollingInterval();
      return patch;
    }
    if (address === '/live/song/get/is_playing') {
      const isPlaying = !!args[0];
      // Start/stop beat time polling based on play state
      if (isPlaying) {
        this.startBeatTimePolling();
      } else {
        this.stopBeatTimePolling();
      }
      return this.session.setIsPlaying(isPlaying);
    }
    if (address === '/live/song/get/current_song_time') {
      return this.session.setBeatTime(args[0] as number);
    }
    if (address === '/live/song/get/metronome') {
      return this.session.setMetronome(!!args[0]);
    }

    // View selection updates
    if (address === '/live/view/get/selected_track') {
      return this.session.setSelectedTrack(args[0] as number);
    }
    if (address === '/live/view/get/selected_scene') {
      return this.session.setSelectedScene(args[0] as number);
    }

    // Track updates - format: [trackId, value]
    if (address === '/live/track/get/volume' && args.length >= 2) {
      return this.session.setTrackVolume(args[0] as number, args[1] as number);
    }
    if (address === '/live/track/get/panning' && args.length >= 2) {
      return this.session.setTrackPan(args[0] as number, args[1] as number);
    }
    if (address === '/live/track/get/mute' && args.length >= 2) {
      return this.session.setTrackMute(args[0] as number, !!args[1]);
    }
    if (address === '/live/track/get/solo' && args.length >= 2) {
      return this.session.setTrackSolo(args[0] as number, !!args[1]);
    }
    if (address === '/live/track/get/arm' && args.length >= 2) {
      return this.session.setTrackArm(args[0] as number, !!args[1]);
    }
    if (address === '/live/track/get/playing_slot_index' && args.length >= 2) {
      return this.session.setTrackPlayingSlot(args[0] as number, args[1] as number);
    }
    if (address === '/live/track/get/fired_slot_index' && args.length >= 2) {
      return this.session.setTrackFiredSlot(args[0] as number, args[1] as number);
    }

    // Clip updates - handle both formats:
    // 5 args: [trackId, sceneId, isPlaying, isTriggered, isRecording] (booleans)
    // 3 args: [trackId, sceneId, status] where status is 0=stopped, 1=playing, 2=triggered, 3=recording
    if (address === '/live/clip/get/playing_status' && args.length >= 3) {
      const trackId = args[0] as number;
      const sceneId = args[1] as number;

      let isPlaying = false;
      let isTriggered = false;
      let isRecording = false;

      if (args.length >= 5) {
        // 5-arg format: separate booleans
        isPlaying = !!args[2];
        isTriggered = !!args[3];
        isRecording = !!args[4];
      } else {
        // 3-arg format: combined status value
        const status = args[2] as number;
        isPlaying = status === 1;
        isTriggered = status === 2;
        isRecording = status === 3;
      }

      return this.session.setClipPlayingStatus(trackId, sceneId, isPlaying, isTriggered, isRecording);
    }

    // Clip slot updates - when a clip is created/deleted, update listeners
    if (address === '/live/clip_slot/get/has_clip' && args.length >= 3) {
      const trackId = args[0] as number;
      const sceneId = args[1] as number;
      const hasClip = !!args[2];

      // Dynamically subscribe/unsubscribe to clip status based on clip existence
      if (hasClip) {
        this.sync.startClipListener(trackId, sceneId);
        this.log(`New clip detected at ${trackId}:${sceneId}, listening to status`);
      } else {
        this.sync.stopClipListener(trackId, sceneId);
      }

      return this.session.setHasClip(trackId, sceneId, hasClip);
    }

    return null;
  }

  /**
   * Send an OSC message to Ableton
   */
  private sendOSC(message: OSCMessage): void {
    if (!this.osc) {
      this.log('Cannot send OSC: not connected');
      return;
    }

    this.log(`OSC -> ${message.address} ${JSON.stringify(message.args)}`);
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

  /**
   * Get current session state (for testing)
   */
  getSessionState() {
    return this.session.getState();
  }

  /**
   * Calculate polling interval based on tempo (poll ~2x per sixteenth note for smooth display)
   */
  private getBeatTimePollingInterval(): number {
    const tempo = this.session.getState().tempo || 120;
    // ms per sixteenth note = 60000 / tempo / 4
    // Poll twice per sixteenth for smooth display, with min 50ms and max 200ms
    const msPerSixteenth = 60000 / tempo / 4;
    const interval = Math.max(50, Math.min(200, msPerSixteenth / 2));
    return Math.round(interval);
  }

  /**
   * Start polling for beat time (called when playback starts)
   */
  private startBeatTimePolling(): void {
    if (this.beatTimeInterval) return; // Already polling

    const poll = () => {
      this.sendOSC({ address: '/live/song/get/current_song_time', args: [] });
    };

    // Initial poll
    poll();

    // Set up interval based on current tempo
    const interval = this.getBeatTimePollingInterval();
    this.beatTimeInterval = setInterval(poll, interval);
    this.log(`Beat time polling started (${interval}ms interval at ${this.session.getState().tempo} BPM)`);
  }

  /**
   * Stop polling for beat time (called when playback stops)
   */
  private stopBeatTimePolling(): void {
    if (this.beatTimeInterval) {
      clearInterval(this.beatTimeInterval);
      this.beatTimeInterval = null;
      this.log('Beat time polling stopped');
    }
  }

  /**
   * Update polling interval when tempo changes (while playing)
   */
  private updateBeatTimePollingInterval(): void {
    if (!this.beatTimeInterval) return; // Not currently polling

    // Restart polling with new interval
    this.stopBeatTimePolling();
    this.startBeatTimePolling();
  }
}

// Type for Bun's WebSocket
type ServerWebSocket<T> = {
  send(data: string | Buffer): void;
  close(): void;
};
