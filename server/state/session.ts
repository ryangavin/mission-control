/**
 * Session State Manager
 * Maintains authoritative session state and generates patches for UI updates
 */

import type {
  SessionState,
  Track,
  Scene,
  ClipSlot,
  Clip,
  MasterTrack,
  PatchPayload,
} from '../../protocol';

export class SessionManager {
  private state: SessionState;

  constructor() {
    this.state = this.createEmptyState();
  }

  /**
   * Get the current session state
   */
  getState(): SessionState {
    return this.state;
  }

  /**
   * Reset to empty state
   */
  reset(): void {
    this.state = this.createEmptyState();
  }

  /**
   * Initialize with full session data (used during initial sync)
   */
  initialize(data: Partial<SessionState>): void {
    this.state = {
      ...this.createEmptyState(),
      ...data,
    };
  }

  // ==========================================================================
  // Transport Updates
  // ==========================================================================

  setTempo(tempo: number): PatchPayload {
    this.state.tempo = tempo;
    return { kind: 'transport', tempo };
  }

  setIsPlaying(isPlaying: boolean): PatchPayload {
    this.state.isPlaying = isPlaying;
    return { kind: 'transport', isPlaying };
  }

  setIsRecording(isRecording: boolean): PatchPayload {
    this.state.isRecording = isRecording;
    return { kind: 'transport', isRecording };
  }

  setMetronome(metronome: boolean): PatchPayload {
    this.state.metronome = metronome;
    return { kind: 'transport', metronome };
  }

  setPunchIn(punchIn: boolean): PatchPayload {
    this.state.punchIn = punchIn;
    return { kind: 'transport', punchIn };
  }

  setPunchOut(punchOut: boolean): PatchPayload {
    this.state.punchOut = punchOut;
    return { kind: 'transport', punchOut };
  }

  setLoop(loop: boolean): PatchPayload {
    this.state.loop = loop;
    return { kind: 'transport', loop };
  }

  setClipTriggerQuantization(clipTriggerQuantization: number): PatchPayload {
    this.state.clipTriggerQuantization = clipTriggerQuantization;
    return { kind: 'transport', clipTriggerQuantization };
  }

  setBeatTime(beatTime: number): PatchPayload {
    this.state.beatTime = beatTime;
    return { kind: 'transport', beatTime };
  }

  // ==========================================================================
  // Selection Updates
  // ==========================================================================

  setSelectedTrack(trackIndex: number): PatchPayload {
    this.state.selectedTrack = trackIndex;
    return { kind: 'selection', selectedTrack: trackIndex };
  }

  setSelectedScene(sceneIndex: number): PatchPayload {
    this.state.selectedScene = sceneIndex;
    return { kind: 'selection', selectedScene: sceneIndex };
  }

  // ==========================================================================
  // Structure Updates
  // ==========================================================================

  setStructure(numTracks: number, numScenes: number): PatchPayload {
    // Resize tracks array
    while (this.state.tracks.length < numTracks) {
      this.state.tracks.push(this.createEmptyTrack(this.state.tracks.length, numScenes));
    }
    this.state.tracks.length = numTracks;

    // Resize scenes array
    while (this.state.scenes.length < numScenes) {
      this.state.scenes.push(this.createEmptyScene(this.state.scenes.length));
    }
    this.state.scenes.length = numScenes;

    // Ensure each track has correct number of clip slots
    for (const track of this.state.tracks) {
      while (track.clips.length < numScenes) {
        track.clips.push(this.createEmptyClipSlot(track.id, track.clips.length));
      }
      track.clips.length = numScenes;
    }

    return { kind: 'structure', numTracks, numScenes };
  }

  // ==========================================================================
  // Track Updates
  // ==========================================================================

  getTrack(trackIndex: number): Track | undefined {
    return this.state.tracks[trackIndex];
  }

  updateTrack(trackIndex: number, updates: Partial<Track>): PatchPayload | null {
    const track = this.state.tracks[trackIndex];
    if (!track) return null;

    Object.assign(track, updates);
    return { kind: 'track', trackIndex, track };
  }

  setTrackVolume(trackIndex: number, volume: number): PatchPayload | null {
    return this.updateTrack(trackIndex, { volume });
  }

  setTrackPan(trackIndex: number, pan: number): PatchPayload | null {
    return this.updateTrack(trackIndex, { pan });
  }

  setTrackMute(trackIndex: number, mute: boolean): PatchPayload | null {
    return this.updateTrack(trackIndex, { mute });
  }

  setTrackSolo(trackIndex: number, solo: boolean): PatchPayload | null {
    return this.updateTrack(trackIndex, { solo });
  }

  setTrackArm(trackIndex: number, arm: boolean): PatchPayload | null {
    return this.updateTrack(trackIndex, { arm });
  }

  setTrackPlayingSlot(trackIndex: number, slotIndex: number): PatchPayload | null {
    return this.updateTrack(trackIndex, { playingSlotIndex: slotIndex });
  }

  setTrackFiredSlot(trackIndex: number, slotIndex: number): PatchPayload | null {
    return this.updateTrack(trackIndex, { firedSlotIndex: slotIndex });
  }

  setTrackName(trackIndex: number, name: string): PatchPayload | null {
    return this.updateTrack(trackIndex, { name });
  }

  setTrackColor(trackIndex: number, color: number): PatchPayload | null {
    return this.updateTrack(trackIndex, { color });
  }

  // ==========================================================================
  // Scene Updates
  // ==========================================================================

  getScene(sceneIndex: number): Scene | undefined {
    return this.state.scenes[sceneIndex];
  }

  updateScene(sceneIndex: number, updates: Partial<Scene>): PatchPayload | null {
    const scene = this.state.scenes[sceneIndex];
    if (!scene) return null;

    Object.assign(scene, updates);
    return { kind: 'scene', sceneIndex, scene };
  }

  setSceneName(sceneIndex: number, name: string): PatchPayload | null {
    return this.updateScene(sceneIndex, { name });
  }

  setSceneColor(sceneIndex: number, color: number): PatchPayload | null {
    return this.updateScene(sceneIndex, { color });
  }

  // ==========================================================================
  // Master Track Updates
  // ==========================================================================

  getMasterTrack(): MasterTrack {
    return this.state.masterTrack;
  }

  updateMasterTrack(updates: Partial<MasterTrack>): PatchPayload {
    Object.assign(this.state.masterTrack, updates);
    return { kind: 'masterTrack', masterTrack: this.state.masterTrack };
  }

  setMasterTrackColor(color: number): PatchPayload {
    return this.updateMasterTrack({ color });
  }

  setMasterTrackVolume(volume: number): PatchPayload {
    return this.updateMasterTrack({ volume });
  }

  setMasterTrackPan(pan: number): PatchPayload {
    return this.updateMasterTrack({ pan });
  }

  // ==========================================================================
  // Clip Slot Updates
  // ==========================================================================

  getClipSlot(trackIndex: number, sceneIndex: number): ClipSlot | undefined {
    return this.state.tracks[trackIndex]?.clips[sceneIndex];
  }

  updateClipSlot(trackIndex: number, sceneIndex: number, updates: Partial<ClipSlot>): PatchPayload | null {
    const clipSlot = this.getClipSlot(trackIndex, sceneIndex);
    if (!clipSlot) return null;

    Object.assign(clipSlot, updates);
    return { kind: 'clip', trackIndex, sceneIndex, clipSlot };
  }

  setHasClip(trackIndex: number, sceneIndex: number, hasClip: boolean): PatchPayload | null {
    const clipSlot = this.getClipSlot(trackIndex, sceneIndex);
    if (!clipSlot) return null;

    clipSlot.hasClip = hasClip;
    if (!hasClip) {
      clipSlot.clip = undefined;
    }
    return { kind: 'clip', trackIndex, sceneIndex, clipSlot };
  }

  updateClip(trackIndex: number, sceneIndex: number, updates: Partial<Clip>): PatchPayload | null {
    const clipSlot = this.getClipSlot(trackIndex, sceneIndex);
    if (!clipSlot || !clipSlot.hasClip) return null;

    if (!clipSlot.clip) {
      clipSlot.clip = this.createEmptyClip();
    }
    Object.assign(clipSlot.clip, updates);
    return { kind: 'clip', trackIndex, sceneIndex, clipSlot };
  }

  setClipPlayingStatus(trackIndex: number, sceneIndex: number, isPlaying: boolean, isTriggered: boolean, isRecording: boolean): PatchPayload | null {
    return this.updateClip(trackIndex, sceneIndex, { isPlaying, isTriggered, isRecording });
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  private createEmptyState(): SessionState {
    return {
      tempo: 120,
      isPlaying: false,
      isRecording: false,
      punchIn: false,
      punchOut: false,
      metronome: false,
      loop: false,
      clipTriggerQuantization: 8,  // Default to 1/8
      beatTime: 0,
      tracks: [],
      scenes: [],
      masterTrack: { color: 0, volume: 0.85, pan: 0 },
      selectedTrack: 0,
      selectedScene: 0,
    };
  }

  private createEmptyTrack(id: number, numScenes: number): Track {
    const clips: ClipSlot[] = [];
    for (let i = 0; i < numScenes; i++) {
      clips.push(this.createEmptyClipSlot(id, i));
    }
    return {
      id,
      name: `Track ${id + 1}`,
      color: 0,
      volume: 0.85, // 0dB
      pan: 0,
      mute: false,
      solo: false,
      arm: false,
      playingSlotIndex: -1,
      firedSlotIndex: -1,
      clips,
      hasMidiInput: false,
      hasAudioInput: false,
    };
  }

  private createEmptyScene(id: number): Scene {
    return {
      id,
      name: '',
      color: 0,
    };
  }

  private createEmptyClipSlot(trackIndex: number, sceneIndex: number): ClipSlot {
    return {
      trackIndex,
      sceneIndex,
      hasClip: false,
    };
  }

  private createEmptyClip(): Clip {
    return {
      name: '',
      color: 0,
      isPlaying: false,
      isTriggered: false,
      isRecording: false,
      playingPosition: 0,
      length: 0,
      loopStart: 0,
      loopEnd: 0,
      isAudioClip: false,
      isMidiClip: false,
    };
  }
}
