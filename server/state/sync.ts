/**
 * Initial Sync and Listener Management
 * Handles querying Ableton for session state and setting up real-time listeners
 */

import {
  song, view, track, clip, clipSlot, scene,
  type OSCMessage,
} from '../../protocol';
import type { SessionManager } from './session';

export interface SyncCallbacks {
  sendOSC: (message: OSCMessage) => void;
  onLog: (message: string) => void;
  onSyncPhase?: (phase: string, progress?: number) => void;
}

/**
 * Manages initial sync and listener subscriptions
 */
export class SyncManager {
  private session: SessionManager;
  private callbacks: SyncCallbacks;
  private pendingQueries = new Map<string, { resolve: (value: any) => void; timeout: ReturnType<typeof setTimeout> }>();
  private queryTimeout = 5000; // 5 second timeout for queries
  private numTracks = 0;
  private numScenes = 0;
  private listenersActive = false;

  constructor(session: SessionManager, callbacks: SyncCallbacks) {
    this.session = session;
    this.callbacks = callbacks;
  }

  /**
   * Perform initial sync with Ableton
   * Queries all session data and populates state
   */
  async performInitialSync(): Promise<void> {
    this.callbacks.onLog('Starting initial sync...');
    this.callbacks.onSyncPhase?.('structure');

    try {
      // Phase 1: Get song structure
      const [tempo, isPlaying, metronome, clipTriggerQuantization, punchIn, punchOut, loop, numTracks, numScenes] = await Promise.all([
        this.queryOSC(song.getTempo()),
        this.queryOSC(song.getIsPlaying()),
        this.queryOSC(song.getMetronome()),
        this.queryOSC(song.getClipTriggerQuantization()),
        this.queryOSC(song.getPunchIn()),
        this.queryOSC(song.getPunchOut()),
        this.queryOSC(song.getLoop()),
        this.queryOSC(song.getNumTracks()),
        this.queryOSC(song.getNumScenes()),
      ]);

      this.numTracks = numTracks;
      this.numScenes = numScenes;

      this.callbacks.onLog(`Found ${numTracks} tracks, ${numScenes} scenes`);

      // Initialize transport state first, then structure (order matters!)
      this.session.initialize({
        tempo,
        isPlaying: !!isPlaying,
        isRecording: false,
        metronome: !!metronome,
        clipTriggerQuantization: clipTriggerQuantization ?? 8,
        punchIn: !!punchIn,
        punchOut: !!punchOut,
        loop: !!loop,
      });

      // setStructure must come AFTER initialize to not be overwritten
      this.session.setStructure(numTracks, numScenes);

      // Phase 2: Get view selection
      const [selectedTrack, selectedScene] = await Promise.all([
        this.queryOSC(view.getSelectedTrack()),
        this.queryOSC(view.getSelectedScene()),
      ]);
      this.session.setSelectedTrack(selectedTrack);
      this.session.setSelectedScene(selectedScene);

      // Phase 3: Query all tracks in parallel
      this.callbacks.onSyncPhase?.('tracks');
      const trackPromises: Promise<void>[] = [];
      for (let t = 0; t < numTracks; t++) {
        trackPromises.push(this.syncTrack(t));
      }
      await Promise.all(trackPromises);

      // Phase 4: Query all scenes
      this.callbacks.onSyncPhase?.('scenes');
      const scenePromises: Promise<void>[] = [];
      for (let s = 0; s < numScenes; s++) {
        scenePromises.push(this.syncScene(s));
      }
      await Promise.all(scenePromises);

      // Phase 5: Query clip slots (has_clip status)
      this.callbacks.onSyncPhase?.('clips');
      await this.syncClipSlots();

      // Phase 6: Mark playing/triggered clips based on track slot indices
      this.updateClipPlayingStates();

      this.callbacks.onLog('Initial sync complete');
    } catch (error) {
      this.callbacks.onLog(`Sync error: ${error}`);
      throw error;
    }
  }

  /**
   * Sync a single track's properties
   */
  private async syncTrack(trackIndex: number): Promise<void> {
    const [name, color, volume, pan, mute, solo, arm, playingSlot, firedSlot, hasMidiInput, hasAudioInput] = await Promise.all([
      this.queryOSC(track.getName(trackIndex)),
      this.queryOSC(track.getColor(trackIndex)),
      this.queryOSC(track.getVolume(trackIndex)),
      this.queryOSC(track.getPan(trackIndex)),
      this.queryOSC(track.getMute(trackIndex)),
      this.queryOSC(track.getSolo(trackIndex)),
      this.queryOSC(track.getArm(trackIndex)),
      this.queryOSC(track.getPlayingSlotIndex(trackIndex)),
      this.queryOSC(track.getFiredSlotIndex(trackIndex)),
      this.queryOSC(track.getHasMidiInput(trackIndex)),
      this.queryOSC(track.getHasAudioInput(trackIndex)),
    ]);

    this.session.updateTrack(trackIndex, {
      name: name || `Track ${trackIndex + 1}`,
      color: color || 0,
      volume: volume ?? 0.85,
      pan: pan ?? 0,
      mute: !!mute,
      solo: !!solo,
      arm: !!arm,
      playingSlotIndex: playingSlot ?? -1,
      firedSlotIndex: firedSlot ?? -1,
      hasMidiInput: !!hasMidiInput,
      hasAudioInput: !!hasAudioInput,
    });
  }

  /**
   * Sync a single scene's properties
   */
  private async syncScene(sceneIndex: number): Promise<void> {
    const [name, color] = await Promise.all([
      this.queryOSC(scene.getName(sceneIndex)),
      this.queryOSC(scene.getColor(sceneIndex)),
    ]);

    this.session.updateScene(sceneIndex, {
      name: name || `Scene ${sceneIndex + 1}`,
      color: color || 0,
    });
  }

  /**
   * Sync all clip slots (check which have clips)
   */
  private async syncClipSlots(): Promise<void> {
    // Query has_clip for all slots in parallel batches
    const batchSize = 32; // Limit concurrent queries
    const totalTracks = this.numTracks;

    for (let t = 0; t < this.numTracks; t++) {
      const scenePromises: Promise<void>[] = [];
      for (let s = 0; s < this.numScenes; s++) {
        scenePromises.push(this.syncClipSlot(t, s));
        if (scenePromises.length >= batchSize) {
          await Promise.all(scenePromises);
          scenePromises.length = 0;
        }
      }
      if (scenePromises.length > 0) {
        await Promise.all(scenePromises);
      }
      // Emit progress after each track completes
      const progress = Math.round(((t + 1) / totalTracks) * 100);
      this.callbacks.onSyncPhase?.('clips', progress);
    }
  }

  /**
   * Sync a single clip slot
   */
  private async syncClipSlot(trackIndex: number, sceneIndex: number): Promise<void> {
    const hasClipVal = await this.queryOSC(clipSlot.hasClip(trackIndex, sceneIndex));
    const hasClip = !!hasClipVal;

    this.session.setHasClip(trackIndex, sceneIndex, hasClip);

    // If there's a clip, get its properties
    // Note: playing_status can only be obtained via listeners, not direct query
    if (hasClip) {
      const [name, color, length, isAudioClip, isMidiClip] = await Promise.all([
        this.queryOSC(clip.getName(trackIndex, sceneIndex)),
        this.queryOSC(clip.getColor(trackIndex, sceneIndex)),
        this.queryOSC(clip.getLength(trackIndex, sceneIndex)),
        this.queryOSC(clip.getIsAudioClip(trackIndex, sceneIndex)),
        this.queryOSC(clip.getIsMidiClip(trackIndex, sceneIndex)),
      ]);

      this.session.updateClip(trackIndex, sceneIndex, {
        name: name || '',
        color: color || 0,
        length: length || 0,
        isPlaying: false,
        isTriggered: false,
        isRecording: false,
        isAudioClip: !!isAudioClip,
        isMidiClip: !!isMidiClip,
      });
    }
  }

  /**
   * Update clip playing/triggered states based on track slot indices
   * Called after initial sync to mark clips that are currently playing
   */
  private updateClipPlayingStates(): void {
    const state = this.session.getState();

    for (let t = 0; t < state.tracks.length; t++) {
      const track = state.tracks[t];

      // Mark playing clip
      if (track.playingSlotIndex >= 0) {
        const clipSlot = track.clips[track.playingSlotIndex];
        if (clipSlot?.hasClip && clipSlot.clip) {
          this.session.updateClip(t, track.playingSlotIndex, { isPlaying: true });
          this.callbacks.onLog(`Track ${t} clip ${track.playingSlotIndex} is playing`);
        }
      }

      // Mark triggered clip (if different from playing)
      if (track.firedSlotIndex >= 0 && track.firedSlotIndex !== track.playingSlotIndex) {
        const clipSlot = track.clips[track.firedSlotIndex];
        if (clipSlot?.hasClip && clipSlot.clip) {
          this.session.updateClip(t, track.firedSlotIndex, { isTriggered: true });
          this.callbacks.onLog(`Track ${t} clip ${track.firedSlotIndex} is triggered`);
        }
      }
    }
  }

  /**
   * Set up real-time listeners for state changes
   */
  setupListeners(): void {
    if (this.listenersActive) return;
    this.listenersActive = true;

    this.callbacks.onLog('Setting up listeners...');

    // Song-level listeners
    this.callbacks.sendOSC(song.startListenTempo());
    this.callbacks.sendOSC(song.startListenIsPlaying());
    this.callbacks.sendOSC(song.startListenMetronome());
    this.callbacks.sendOSC(song.startListenPunchIn());
    this.callbacks.sendOSC(song.startListenPunchOut());
    this.callbacks.sendOSC(song.startListenLoop());

    // View listeners
    this.callbacks.sendOSC(view.startListenSelectedTrack());
    this.callbacks.sendOSC(view.startListenSelectedScene());

    // Track-level listeners
    for (let t = 0; t < this.numTracks; t++) {
      this.callbacks.sendOSC(track.startListenVolume(t));
      this.callbacks.sendOSC(track.startListenMute(t));
      this.callbacks.sendOSC(track.startListenSolo(t));
      this.callbacks.sendOSC(track.startListenArm(t));
      this.callbacks.sendOSC(track.startListenPlayingSlot(t));
      this.callbacks.sendOSC(track.startListenFiredSlot(t));
    }

    // Clip slot listeners - listen to has_clip changes on ALL slots for live looping
    const state = this.session.getState();
    for (let t = 0; t < this.numTracks; t++) {
      const trackData = state.tracks[t];
      if (!trackData) continue;
      for (let s = 0; s < trackData.clips.length; s++) {
        // Listen for clip creation/deletion
        this.callbacks.sendOSC(clipSlot.startListenHasClip(t, s));
      }
    }

    this.callbacks.onLog('Listeners active');
  }

  /**
   * Sync a single clip's properties (called when a new clip appears via listener)
   * Returns the patch payload for broadcasting
   */
  async syncNewClip(trackIndex: number, sceneIndex: number): Promise<void> {
    this.callbacks.onLog(`Syncing new clip at ${trackIndex}:${sceneIndex}`);

    const [name, color, length, isAudioClip, isMidiClip] = await Promise.all([
      this.queryOSC(clip.getName(trackIndex, sceneIndex)),
      this.queryOSC(clip.getColor(trackIndex, sceneIndex)),
      this.queryOSC(clip.getLength(trackIndex, sceneIndex)),
      this.queryOSC(clip.getIsAudioClip(trackIndex, sceneIndex)),
      this.queryOSC(clip.getIsMidiClip(trackIndex, sceneIndex)),
    ]);

    this.session.updateClip(trackIndex, sceneIndex, {
      name: name || '',
      color: color || 0,
      length: length || 0,
      isPlaying: false,
      isTriggered: false,
      isRecording: false,
      isAudioClip: !!isAudioClip,
      isMidiClip: !!isMidiClip,
    });
  }

  /**
   * Stop all listeners
   */
  stopListeners(): void {
    if (!this.listenersActive) return;
    this.listenersActive = false;

    this.callbacks.onLog('Stopping listeners...');

    // Song-level
    this.callbacks.sendOSC(song.stopListenTempo());
    this.callbacks.sendOSC(song.stopListenIsPlaying());
    this.callbacks.sendOSC(song.stopListenMetronome());
    this.callbacks.sendOSC(song.stopListenPunchIn());
    this.callbacks.sendOSC(song.stopListenPunchOut());
    this.callbacks.sendOSC(song.stopListenLoop());

    // View
    this.callbacks.sendOSC(view.stopListenSelectedTrack());
    this.callbacks.sendOSC(view.stopListenSelectedScene());

    // Tracks
    for (let t = 0; t < this.numTracks; t++) {
      this.callbacks.sendOSC(track.stopListenVolume(t));
      this.callbacks.sendOSC(track.stopListenMute(t));
      this.callbacks.sendOSC(track.stopListenSolo(t));
      this.callbacks.sendOSC(track.stopListenArm(t));
      this.callbacks.sendOSC(track.stopListenPlayingSlot(t));
      this.callbacks.sendOSC(track.stopListenFiredSlot(t));
    }

    // Clip slots
    const state = this.session.getState();
    for (let t = 0; t < this.numTracks; t++) {
      const trackData = state.tracks[t];
      if (!trackData) continue;
      for (let s = 0; s < trackData.clips.length; s++) {
        this.callbacks.sendOSC(clipSlot.stopListenHasClip(t, s));
      }
    }

    this.callbacks.onLog('Listeners stopped');
  }

  /**
   * Send an OSC query and wait for response
   */
  private queryOSC(message: OSCMessage): Promise<any> {
    return new Promise((resolve, _reject) => {
      const key = this.getQueryKey(message);

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingQueries.delete(key);
        // Resolve with undefined instead of rejecting to allow partial sync
        resolve(undefined);
      }, this.queryTimeout);

      this.pendingQueries.set(key, { resolve, timeout });
      this.callbacks.sendOSC(message);
    });
  }

  /**
   * Handle an OSC response (called by bridge when receiving messages)
   */
  handleOSCResponse(address: string, args: unknown[]): boolean {
    const key = this.getResponseKey(address, args);
    const pending = this.pendingQueries.get(key);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingQueries.delete(key);
      // Return the value based on response type
      const value = this.extractResponseValue(address, args);
      pending.resolve(value);
      return true;
    }

    return false;
  }

  /**
   * Extract the actual value from an OSC response
   */
  private extractResponseValue(address: string, args: unknown[]): unknown {
    // For clip_slot responses: [trackId, sceneId, value]
    if (address.includes('/clip_slot/')) {
      return args.length >= 3 ? args[2] : args[0];
    }
    // For clip playing_status: [trackId, sceneId, isPlaying, isTriggered, isRecording]
    // Return all status values as array, or single status number
    if (address.includes('/clip/') && address.includes('playing_status')) {
      if (args.length >= 5) {
        return [args[2], args[3], args[4]]; // [isPlaying, isTriggered, isRecording]
      }
      return args.length >= 3 ? args[2] : args[0]; // Single status value
    }
    // For clip responses: [trackId, sceneId, value]
    if (address.includes('/clip/')) {
      return args.length >= 3 ? args[2] : args[0];
    }
    // For track responses: [trackId, value]
    if (address.includes('/track/')) {
      return args.length >= 2 ? args[1] : args[0];
    }
    // For scene responses: [sceneId, value]
    if (address.includes('/scene/')) {
      return args.length >= 2 ? args[1] : args[0];
    }
    // For view responses: just the value
    if (address.includes('/view/')) {
      return args[0];
    }
    // For song responses: just the value
    return args[0];
  }

  /**
   * Generate a key for tracking pending queries
   */
  private getQueryKey(message: OSCMessage): string {
    // Convert /live/song/get/tempo to tempo query key
    // Convert /live/track/get/volume [0] to track_0_volume
    const parts = message.address.split('/').filter(Boolean);
    const args = message.args.map(a => String(a)).join('_');
    return args ? `${parts.join('_')}_${args}` : parts.join('_');
  }

  /**
   * Generate a key from response address to match pending query
   */
  private getResponseKey(address: string, args: unknown[]): string {
    // Response addresses mirror query addresses
    const parts = address.split('/').filter(Boolean);

    // For track/clip queries, args include the track/scene ID followed by the value
    // We need to extract just the ID portion for matching
    if (address.includes('/track/') && args.length > 1) {
      // /live/track/get/volume returns [trackId, value]
      return `${parts.join('_')}_${args[0]}`;
    }
    if (address.includes('/clip_slot/') && args.length > 2) {
      // /live/clip_slot/get/has_clip returns [trackId, sceneId, value]
      return `${parts.join('_')}_${args[0]}_${args[1]}`;
    }
    if (address.includes('/clip/') && args.length > 2) {
      // /live/clip/get/name returns [trackId, sceneId, value]
      return `${parts.join('_')}_${args[0]}_${args[1]}`;
    }
    if (address.includes('/scene/') && args.length > 1) {
      // /live/scene/get/name returns [sceneId, value]
      return `${parts.join('_')}_${args[0]}`;
    }
    if (address.includes('/view/') && args.length >= 1) {
      return parts.join('_');
    }

    return parts.join('_');
  }

  /**
   * Get track and scene counts for external use
   */
  getStructure(): { numTracks: number; numScenes: number } {
    return { numTracks: this.numTracks, numScenes: this.numScenes };
  }

  /**
   * Check for structure changes and sync new tracks/scenes
   * Returns true if structure changed
   */
  async checkStructureChanges(): Promise<boolean> {
    const [newNumTracks, newNumScenes] = await Promise.all([
      this.queryOSC(song.getNumTracks()),
      this.queryOSC(song.getNumScenes()),
    ]);

    const tracksChanged = newNumTracks !== this.numTracks;
    const scenesChanged = newNumScenes !== this.numScenes;

    if (!tracksChanged && !scenesChanged) {
      return false;
    }

    this.callbacks.onLog(`Structure changed: ${this.numTracks} -> ${newNumTracks} tracks, ${this.numScenes} -> ${newNumScenes} scenes`);

    // Sync new tracks
    if (newNumTracks > this.numTracks) {
      // Update structure first to create empty tracks
      this.session.setStructure(newNumTracks, this.numScenes);

      // Sync each new track
      for (let t = this.numTracks; t < newNumTracks; t++) {
        await this.syncTrack(t);
        // Set up listeners for new track
        this.setupTrackListeners(t);
      }
    } else if (newNumTracks < this.numTracks) {
      // Tracks were deleted - just update structure
      this.session.setStructure(newNumTracks, this.numScenes);
    }

    // Sync new scenes
    if (newNumScenes > this.numScenes) {
      // Update structure to create empty scenes
      this.session.setStructure(newNumTracks, newNumScenes);

      // Sync each new scene
      for (let s = this.numScenes; s < newNumScenes; s++) {
        await this.syncScene(s);
      }

      // Sync clip slots for new scenes across all tracks
      for (let t = 0; t < newNumTracks; t++) {
        for (let s = this.numScenes; s < newNumScenes; s++) {
          await this.syncClipSlot(t, s);
          // Set up has_clip listener for new slot
          this.callbacks.sendOSC(clipSlot.startListenHasClip(t, s));
        }
      }
    } else if (newNumScenes < this.numScenes) {
      // Scenes were deleted - just update structure
      this.session.setStructure(newNumTracks, newNumScenes);
    }

    // Update stored counts
    this.numTracks = newNumTracks;
    this.numScenes = newNumScenes;

    return true;
  }

  /**
   * Set up listeners for a single track
   */
  private setupTrackListeners(trackIndex: number): void {
    this.callbacks.sendOSC(track.startListenVolume(trackIndex));
    this.callbacks.sendOSC(track.startListenMute(trackIndex));
    this.callbacks.sendOSC(track.startListenSolo(trackIndex));
    this.callbacks.sendOSC(track.startListenArm(trackIndex));
    this.callbacks.sendOSC(track.startListenPlayingSlot(trackIndex));
    this.callbacks.sendOSC(track.startListenFiredSlot(trackIndex));

    // Set up clip slot listeners for this track
    for (let s = 0; s < this.numScenes; s++) {
      this.callbacks.sendOSC(clipSlot.startListenHasClip(trackIndex, s));
    }
  }
}
