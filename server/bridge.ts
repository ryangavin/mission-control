/**
 * Bridge - Connects browser clients to Ableton Live via OSC
 * Adapted for Vite integration using the `ws` package
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import OSC from 'osc-js';
import type { Config } from './config';
import type { OSCMessage, ClientMessage, ServerMessage, PatchPayload } from '../protocol';
import { application } from '../protocol';
import { SessionManager, SyncManager } from './state';

export interface BridgeOptions {
  config: Config;
  onLog?: (message: string) => void;
}

export class Bridge {
  private wss: WebSocketServer;
  private osc: OSC | null = null;
  private clients: Set<WebSocket> = new Set();
  private config: Config;
  private log: (message: string) => void;
  private abletonConnected = false;

  // State management
  private session: SessionManager;
  private sync: SyncManager;
  private syncInProgress = false;
  private synced = false;
  private beatTimeInterval: ReturnType<typeof setInterval> | null = null;

  // Connection check state
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private pendingPing: { resolve: (connected: boolean) => void; timeout: ReturnType<typeof setTimeout> } | null = null;
  private readonly CONNECTION_CHECK_INTERVAL = 5000; // Check every 5 seconds
  private readonly PING_TIMEOUT = 2000; // 2 second timeout for ping response

  constructor(options: BridgeOptions) {
    this.config = options.config;
    this.log = options.onLog || console.log;

    // Initialize WebSocket server (no HTTP server - we'll attach to Vite's)
    this.wss = new WebSocketServer({ noServer: true });
    this.setupWebSocketHandlers();

    // Initialize state managers
    this.session = new SessionManager();
    this.sync = new SyncManager(this.session, {
      sendOSC: (msg) => this.sendOSC(msg),
      onLog: (msg) => this.log(msg),
      onSyncPhase: (phase, progress) => this.broadcastToClients({ type: 'sync_phase', phase, progress }),
    });
  }

  /**
   * Handle WebSocket upgrade from Vite server
   */
  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  /**
   * Set up WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleClientConnection(ws);

      ws.on('message', (data) => {
        this.handleClientMessage(ws, data.toString());
      });

      ws.on('close', () => {
        this.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        this.log(`Client error: ${error.message}`);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * Start the OSC connection to Ableton (public for plugin to call)
   */
  async startOSC(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create OSC instance with DatagramPlugin for UDP
        // Cast needed: osc-js types are incomplete for DatagramPlugin config
        const DatagramPlugin = OSC.DatagramPlugin as any;
        this.osc = new OSC({
          plugin: new DatagramPlugin({
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

        this.osc.on('open', async () => {
          this.log('OSC socket ready, checking for AbletonOSC...');
          // Don't set abletonConnected yet - need to verify AbletonOSC is responding

          // Check if Ableton is actually responding
          const connected = await this.checkAbletonConnection();
          this.setAbletonConnected(connected);

          // Start periodic connection checks
          this.startConnectionChecking();

          resolve();
        });

        this.osc.on('error', (error: Error) => {
          this.log(`OSC error: ${error.message}`);
        });

        this.osc.on('close', () => {
          this.log('OSC connection closed');
          this.stopConnectionChecking();
          this.stopBeatTimePolling();
          // Use silent mode - don't try to send stop messages to closed connection
          this.sync.stopListeners(true);
          this.setAbletonConnected(false);
          this.synced = false;
        });

        this.osc.open();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the bridge
   */
  async stop(): Promise<void> {
    this.log('Stopping bridge...');

    // Stop connection checking
    this.stopConnectionChecking();

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
    this.wss.close();

    // Close OSC connection
    if (this.osc) {
      this.osc.close();
      this.osc = null;
    }

    this.log('Bridge stopped');
  }

  /**
   * Handle a new WebSocket client connection
   */
  private handleClientConnection(ws: WebSocket): void {
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
  private handleClientMessage(ws: WebSocket, data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle session request
      if (message.type === 'session/request') {
        this.handleSessionRequest(ws);
        return;
      }

      // Handle session resync (force re-fetch from Ableton)
      if (message.type === 'session/resync') {
        this.synced = false;
        this.handleSessionRequest(ws);
        return;
      }

      // Handle clip move (requires multiple OSC calls)
      if (message.type === 'clip/move') {
        this.handleClipMove(message.srcTrack, message.srcScene, message.dstTrack, message.dstScene);
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
        this.log(`Sending OSC: ${oscMessage.address} ${JSON.stringify(oscMessage.args)}`);
        this.sendOSC(oscMessage);

        // After stop, poll beat time to catch position reset (e.g., double-stop returns to 0)
        if (message.type === 'transport/stop') {
          setTimeout(() => {
            this.sendOSC({ address: '/live/song/get/current_song_time', args: [] });
          }, 100);
        }
      }
    } catch (error) {
      this.log(`Invalid message from client: ${error}`);
    }
  }

  /**
   * Handle clip move operation (duplicate to destination + delete source)
   */
  private async handleClipMove(srcTrack: number, srcScene: number, dstTrack: number, dstScene: number): Promise<void> {
    this.log(`Moving clip from ${srcTrack}:${srcScene} to ${dstTrack}:${dstScene}`);

    // Step 1: Duplicate to target
    this.sendOSC({
      address: '/live/clip_slot/duplicate_clip_to',
      args: [srcTrack, srcScene, dstTrack, dstScene],
    });

    // Step 2: Wait briefly for Ableton to process
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: Delete source
    this.sendOSC({
      address: '/live/clip_slot/delete_clip',
      args: [srcTrack, srcScene],
    });
  }

  /**
   * Handle session request from client
   */
  private async handleSessionRequest(ws: WebSocket): Promise<void> {
    // If already synced, send current state
    if (this.synced) {
      this.sendToClient(ws, { type: 'session', payload: this.session.getState() });
      return;
    }

    // If not connected to Ableton, don't try to sync
    if (!this.abletonConnected) {
      this.log('Session requested but Ableton not connected, waiting...');
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
      case 'clip/delete':
        return { address: '/live/clip_slot/delete_clip', args: [message.trackId, message.sceneId] };
      case 'scene/fire':
        return { address: '/live/scene/fire', args: [message.sceneId] };
      case 'scene/create':
        return { address: '/live/song/create_scene', args: [message.index ?? -1] };
      case 'track/stop':
        return { address: '/live/track/stop_all_clips', args: [message.trackId] };
      case 'transport/play':
        return { address: '/live/song/start_playing', args: [] };
      case 'transport/stop':
        return { address: '/live/song/stop_playing', args: [] };
      case 'transport/record':
        return { address: '/live/song/set/record_mode', args: [message.enabled ? 1 : 0] };
      case 'transport/tempo':
        return { address: '/live/song/set/tempo', args: [message.bpm] };
      case 'transport/metronome':
        return { address: '/live/song/set/metronome', args: [message.enabled ? 1 : 0] };
      case 'transport/punchIn':
        return { address: '/live/song/set/punch_in', args: [message.enabled ? 1 : 0] };
      case 'transport/punchOut':
        return { address: '/live/song/set/punch_out', args: [message.enabled ? 1 : 0] };
      case 'transport/loop':
        return { address: '/live/song/set/loop', args: [message.enabled ? 1 : 0] };
      case 'transport/tapTempo':
        return { address: '/live/song/tap_tempo', args: [] };
      case 'transport/quantization':
        return { address: '/live/song/set/clip_trigger_quantization', args: [message.value] };
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
    // Log volume/pan updates for debugging
    if (message.address.includes('/volume') || message.address.includes('/panning')) {
      this.log(`OSC <- ${message.address} ${JSON.stringify(message.args)}`);
    }

    // Check for ping response (connection test)
    if (message.address === '/live/test') {
      this.handlePingResponse();
      return;
    }

    // Handle startup signal (new Live Set loaded)
    if (message.address === '/live/startup') {
      this.log('New Live Set loaded, triggering full resync...');
      this.sync.stopListeners(true);  // Stop listeners silently
      this.synced = false;
      this.broadcastToClients({ type: 'session_reset' });  // Tell clients to show loading
      this.triggerSync();
      return;
    }

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
    if (address === '/live/song/get/record_mode') {
      return this.session.setIsRecording(!!args[0]);
    }
    if (address === '/live/song/get/metronome') {
      return this.session.setMetronome(!!args[0]);
    }
    if (address === '/live/song/get/clip_trigger_quantization') {
      return this.session.setClipTriggerQuantization(args[0] as number);
    }
    if (address === '/live/song/get/punch_in') {
      return this.session.setPunchIn(!!args[0]);
    }
    if (address === '/live/song/get/punch_out') {
      return this.session.setPunchOut(!!args[0]);
    }
    if (address === '/live/song/get/loop') {
      return this.session.setLoop(!!args[0]);
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

    // Structure updates - track/scene count changed
    if (address === '/live/song/get/num_tracks' || address === '/live/song/get/num_scenes') {
      const currentStructure = this.sync.getStructure();
      const newValue = args[0] as number;
      const isTrackChange = address === '/live/song/get/num_tracks';
      const changed = isTrackChange
        ? newValue !== currentStructure.numTracks
        : newValue !== currentStructure.numScenes;

      if (changed) {
        this.log(`Structure change detected: ${isTrackChange ? 'tracks' : 'scenes'} ${isTrackChange ? currentStructure.numTracks : currentStructure.numScenes} -> ${newValue}`);
        // Trigger async resync and broadcast structure patch when done
        this.sync.checkStructureChanges().then((didChange) => {
          if (didChange) {
            const newStructure = this.sync.getStructure();
            this.broadcastToClients({
              type: 'patch',
              payload: { kind: 'structure', numTracks: newStructure.numTracks, numScenes: newStructure.numScenes }
            });
          }
        });
      }
      return null;
    }

    // Clip slot updates - when a clip is created/deleted, update listeners
    if (address === '/live/clip_slot/get/has_clip' && args.length >= 3) {
      const trackId = args[0] as number;
      const sceneId = args[1] as number;
      const hasClip = !!args[2];

      // Sync new clip properties when created
      if (hasClip) {
        this.log(`New clip detected at ${trackId}:${sceneId}, syncing properties`);
        this.sync.syncNewClip(trackId, sceneId).then(() => {
          // Broadcast updated clip data to clients
          const clipSlot = this.session.getState().tracks[trackId]?.clips[sceneId];
          if (clipSlot) {
            this.broadcastToClients({
              type: 'patch',
              payload: { kind: 'clip', trackIndex: trackId, sceneIndex: sceneId, clipSlot }
            });
          }
        });
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

    // Logging disabled for now
    // this.log(`OSC -> ${message.address} ${JSON.stringify(message.args)}`);
    this.osc.send(new OSC.Message(message.address, ...message.args));
  }

  /**
   * Send a message to a specific WebSocket client
   */
  private sendToClient(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected WebSocket clients
   */
  private broadcastToClients(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
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

  /**
   * Set Ableton connection state and broadcast to clients if changed
   */
  private setAbletonConnected(connected: boolean): void {
    if (this.abletonConnected !== connected) {
      this.abletonConnected = connected;
      this.log(`Ableton connection: ${connected ? 'connected' : 'disconnected'}`);
      this.broadcastToClients({ type: 'connected', abletonConnected: connected });

      // Reset sync state when disconnected
      if (!connected) {
        this.synced = false;
      } else if (this.clients.size > 0 && !this.synced) {
        // Auto-sync when Ableton reconnects and we have waiting clients
        this.triggerSync();
      }
    }
  }

  /**
   * Trigger a sync for waiting clients
   */
  private async triggerSync(): Promise<void> {
    if (this.syncInProgress || this.synced || !this.abletonConnected) return;

    this.syncInProgress = true;
    try {
      await this.sync.performInitialSync();
      this.sync.setupListeners();
      this.synced = true;
      this.broadcastToClients({ type: 'session', payload: this.session.getState() });
    } catch (error) {
      this.log(`Sync failed: ${error}`);
      this.broadcastToClients({ type: 'error', message: `Sync failed: ${error}` });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Check if AbletonOSC is responding by sending a test message
   */
  private checkAbletonConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.osc) {
        resolve(false);
        return;
      }

      // Clear any pending ping
      if (this.pendingPing) {
        clearTimeout(this.pendingPing.timeout);
        this.pendingPing = null;
      }

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingPing = null;
        this.log('Ping timeout - AbletonOSC not responding');
        resolve(false);
      }, this.PING_TIMEOUT);

      this.pendingPing = { resolve, timeout };

      // Send test message
      this.sendOSC(application.test());
    });
  }

  /**
   * Handle ping response from AbletonOSC
   */
  private handlePingResponse(): void {
    if (this.pendingPing) {
      clearTimeout(this.pendingPing.timeout);
      this.pendingPing.resolve(true);
      this.pendingPing = null;
    }
  }

  /**
   * Start periodic connection checking
   */
  private startConnectionChecking(): void {
    if (this.connectionCheckInterval) return; // Already checking

    this.connectionCheckInterval = setInterval(async () => {
      const connected = await this.checkAbletonConnection();
      this.setAbletonConnected(connected);
    }, this.CONNECTION_CHECK_INTERVAL);

    this.log(`Connection checking started (every ${this.CONNECTION_CHECK_INTERVAL}ms)`);
  }

  /**
   * Stop periodic connection checking
   */
  private stopConnectionChecking(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
      this.log('Connection checking stopped');
    }

    // Clear any pending ping
    if (this.pendingPing) {
      clearTimeout(this.pendingPing.timeout);
      this.pendingPing = null;
    }
  }
}
