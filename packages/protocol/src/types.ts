// Session State Types

export interface SessionState {
  tempo: number;
  isPlaying: boolean;
  isRecording: boolean;
  metronome: boolean;
  beatTime: number;  // Current song time in beats
  tracks: Track[];
  scenes: Scene[];
  selectedTrack: number;
  selectedScene: number;
}

export interface Track {
  id: number;
  name: string;
  color: number;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  arm: boolean;
  playingSlotIndex: number;  // -1 if no slot playing
  firedSlotIndex: number;    // -1 if no slot triggered
  clips: ClipSlot[];
  hasMidiInput: boolean;     // true for MIDI tracks
  hasAudioInput: boolean;    // true for Audio tracks
}

export interface Scene {
  id: number;
  name: string;
  color: number;
}

export interface ClipSlot {
  trackIndex: number;
  sceneIndex: number;
  hasClip: boolean;
  clip?: Clip;
}

export interface Clip {
  name: string;
  color: number;
  isPlaying: boolean;
  isTriggered: boolean;
  isRecording: boolean;
  playingPosition: number;
  length: number;
  loopStart: number;
  loopEnd: number;
  isAudioClip: boolean;
  isMidiClip: boolean;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  isOn: boolean;
  parameters: Parameter[];
}

export interface Parameter {
  id: number;
  name: string;
  value: number;
  min: number;
  max: number;
  isQuantized: boolean;
}

// OSC Message Types

export type OSCValue = number | string | boolean | Uint8Array;

export interface OSCMessage {
  address: string;
  args: OSCValue[];
}

// WebSocket Protocol Types

export type ClientMessage =
  | { type: 'clip/fire'; trackId: number; sceneId: number }
  | { type: 'clip/stop'; trackId: number; sceneId: number }
  | { type: 'scene/fire'; sceneId: number }
  | { type: 'track/stop'; trackId: number }
  | { type: 'transport/play' }
  | { type: 'transport/stop' }
  | { type: 'transport/record' }
  | { type: 'transport/tempo'; bpm: number }
  | { type: 'transport/metronome'; enabled: boolean }
  | { type: 'mixer/volume'; trackId: number; value: number }
  | { type: 'mixer/pan'; trackId: number; value: number }
  | { type: 'mixer/mute'; trackId: number; muted: boolean }
  | { type: 'mixer/solo'; trackId: number; soloed: boolean }
  | { type: 'mixer/arm'; trackId: number; armed: boolean }
  | { type: 'device/parameter'; trackId: number; deviceId: number; parameterId: number; value: number }
  | { type: 'session/request' }
  | { type: 'clip/move'; srcTrack: number; srcScene: number; dstTrack: number; dstScene: number }
  | { type: 'clip/delete'; trackId: number; sceneId: number }
  | { type: 'osc'; address: string; args: OSCValue[] };

// Patch payloads for granular state updates
export type PatchPayload =
  | { kind: 'transport'; tempo?: number; isPlaying?: boolean; isRecording?: boolean; metronome?: boolean; beatTime?: number }
  | { kind: 'track'; trackIndex: number; track: Track }
  | { kind: 'clip'; trackIndex: number; sceneIndex: number; clipSlot: ClipSlot }
  | { kind: 'scene'; sceneIndex: number; scene: Scene }
  | { kind: 'selection'; selectedTrack?: number; selectedScene?: number }
  | { kind: 'structure'; numTracks: number; numScenes: number };

export type ServerMessage =
  | { type: 'session'; payload: SessionState }
  | { type: 'patch'; payload: PatchPayload }
  | { type: 'connected'; abletonConnected: boolean }
  | { type: 'error'; message: string };

// Connection Status

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
