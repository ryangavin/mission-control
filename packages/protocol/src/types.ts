// Session State Types

export interface SessionState {
  tempo: number;
  isPlaying: boolean;
  isRecording: boolean;
  metronome: boolean;
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
  clips: ClipSlot[];
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
  | { type: 'device/parameter'; trackId: number; deviceId: number; parameterId: number; value: number };

export type ServerMessage =
  | { type: 'session'; payload: SessionState }
  | { type: 'patch'; payload: Partial<SessionState> }
  | { type: 'connected'; abletonConnected: boolean }
  | { type: 'error'; message: string };

// Connection Status

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
