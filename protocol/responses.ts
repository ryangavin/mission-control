/**
 * OSC Response Types
 * Typed responses parsed from Ableton OSC messages
 */

import type { OSCValue } from './types';

// =============================================================================
// Base Response Types
// =============================================================================

/** Base response with address pattern matching */
export interface OSCResponse {
  address: string;
  args: OSCValue[];
}

// =============================================================================
// Application Responses
// =============================================================================

export interface TestResponse {
  type: 'test';
  ok: boolean;
}

export interface VersionResponse {
  type: 'version';
  major: number;
  minor: number;
}

export interface LogLevelResponse {
  type: 'log_level';
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

export interface StartupResponse {
  type: 'startup';
}

export interface ErrorResponse {
  type: 'error';
  message: string;
}

// =============================================================================
// Song Responses
// =============================================================================

export interface TempoResponse {
  type: 'tempo';
  bpm: number;
}

export interface IsPlayingResponse {
  type: 'is_playing';
  playing: boolean;
}

export interface MetronomeResponse {
  type: 'metronome';
  enabled: boolean;
}

export interface NumTracksResponse {
  type: 'num_tracks';
  count: number;
}

export interface NumScenesResponse {
  type: 'num_scenes';
  count: number;
}

export interface TrackNamesResponse {
  type: 'track_names';
  names: string[];
}

export interface SongTimeResponse {
  type: 'song_time';
  beats: number;
}

export interface SignatureResponse {
  type: 'signature';
  numerator: number;
  denominator: number;
}

export interface LoopResponse {
  type: 'loop';
  enabled: boolean;
  start: number;
  length: number;
}

export interface RecordModeResponse {
  type: 'record_mode';
  enabled: boolean;
}

export interface SessionRecordResponse {
  type: 'session_record';
  enabled: boolean;
}

export interface QuantizationResponse {
  type: 'quantization';
  value: QuantizationValue;
}

export type QuantizationValue =
  | 'none' | 'q_8_bars' | 'q_4_bars' | 'q_2_bars' | 'q_bar'
  | 'q_half' | 'q_half_triplet' | 'q_quarter' | 'q_quarter_triplet'
  | 'q_eight' | 'q_eight_triplet' | 'q_sixteenth' | 'q_sixteenth_triplet'
  | 'q_thirtysecond';

export interface CuePointsResponse {
  type: 'cue_points';
  cuePoints: CuePoint[];
}

export interface CuePoint {
  time: number;
  name: string;
}

export interface TrackDataResponse {
  type: 'track_data';
  tracks: TrackInfo[];
}

export interface TrackInfo {
  index: number;
  name: string;
  color: number;
  isFoldable: boolean;
  isGrouped: boolean;
}

// =============================================================================
// View Responses
// =============================================================================

export interface SelectedTrackResponse {
  type: 'selected_track';
  trackIndex: number;
}

export interface SelectedSceneResponse {
  type: 'selected_scene';
  sceneIndex: number;
}

export interface SelectedClipResponse {
  type: 'selected_clip';
  trackIndex: number;
  sceneIndex: number;
}

export interface SelectedDeviceResponse {
  type: 'selected_device';
  trackIndex: number;
  deviceIndex: number;
}

// =============================================================================
// Track Responses
// =============================================================================

export interface TrackNameResponse {
  type: 'track_name';
  trackIndex: number;
  name: string;
}

export interface TrackColorResponse {
  type: 'track_color';
  trackIndex: number;
  color: number;
}

export interface TrackVolumeResponse {
  type: 'track_volume';
  trackIndex: number;
  volume: number; // 0.0 - 1.0 (0.85 = 0dB)
}

export interface TrackPanResponse {
  type: 'track_pan';
  trackIndex: number;
  pan: number; // -1.0 (left) to 1.0 (right)
}

export interface TrackMuteResponse {
  type: 'track_mute';
  trackIndex: number;
  muted: boolean;
}

export interface TrackSoloResponse {
  type: 'track_solo';
  trackIndex: number;
  soloed: boolean;
}

export interface TrackArmResponse {
  type: 'track_arm';
  trackIndex: number;
  armed: boolean;
}

export interface TrackSendResponse {
  type: 'track_send';
  trackIndex: number;
  sendIndex: number;
  value: number;
}

export interface TrackMeterResponse {
  type: 'track_meter';
  trackIndex: number;
  left: number;
  right: number;
}

export interface PlayingSlotResponse {
  type: 'playing_slot';
  trackIndex: number;
  sceneIndex: number; // -1 if no clip playing
}

export interface FiredSlotResponse {
  type: 'fired_slot';
  trackIndex: number;
  sceneIndex: number; // -1 if no clip triggered
}

export interface TrackRoutingResponse {
  type: 'track_routing';
  trackIndex: number;
  inputType: string;
  inputChannel: string;
  outputType: string;
  outputChannel: string;
}

// =============================================================================
// Clip Slot Responses
// =============================================================================

export interface HasClipResponse {
  type: 'has_clip';
  trackIndex: number;
  sceneIndex: number;
  hasClip: boolean;
}

// =============================================================================
// Clip Responses
// =============================================================================

export interface ClipNameResponse {
  type: 'clip_name';
  trackIndex: number;
  sceneIndex: number;
  name: string;
}

export interface ClipColorResponse {
  type: 'clip_color';
  trackIndex: number;
  sceneIndex: number;
  color: number;
}

export interface ClipLengthResponse {
  type: 'clip_length';
  trackIndex: number;
  sceneIndex: number;
  length: number; // in beats
}

export interface ClipPlayingStatusResponse {
  type: 'clip_playing_status';
  trackIndex: number;
  sceneIndex: number;
  isPlaying: boolean;
  isTriggered: boolean;
  isRecording: boolean;
}

export interface ClipPlayingPositionResponse {
  type: 'clip_playing_position';
  trackIndex: number;
  sceneIndex: number;
  position: number; // in beats
}

export interface ClipLoopResponse {
  type: 'clip_loop';
  trackIndex: number;
  sceneIndex: number;
  loopStart: number;
  loopEnd: number;
}

export interface ClipNotesResponse {
  type: 'clip_notes';
  trackIndex: number;
  sceneIndex: number;
  notes: MidiNote[];
}

export interface MidiNote {
  pitch: number;     // 0-127
  start: number;     // start time in beats
  duration: number;  // length in beats
  velocity: number;  // 0-127
  mute: boolean;
}

export interface ClipPropertiesResponse {
  type: 'clip_properties';
  trackIndex: number;
  sceneIndex: number;
  isAudioClip: boolean;
  isMidiClip: boolean;
  warping: boolean;
  warpMode: WarpMode;
  gain: number;
  pitchCoarse: number;
  pitchFine: number;
}

export type WarpMode = 'beats' | 'tones' | 'texture' | 'repitch' | 'complex' | 'complex_pro';

// =============================================================================
// Scene Responses
// =============================================================================

export interface SceneNameResponse {
  type: 'scene_name';
  sceneIndex: number;
  name: string;
}

export interface SceneColorResponse {
  type: 'scene_color';
  sceneIndex: number;
  color: number;
}

export interface SceneTempoResponse {
  type: 'scene_tempo';
  sceneIndex: number;
  tempo: number;
  tempoEnabled: boolean;
}

export interface SceneTimeSignatureResponse {
  type: 'scene_time_signature';
  sceneIndex: number;
  numerator: number;
  denominator: number;
  enabled: boolean;
}

export interface SceneTriggeredResponse {
  type: 'scene_triggered';
  sceneIndex: number;
  isTriggered: boolean;
}

// =============================================================================
// Device Responses
// =============================================================================

export interface DeviceNameResponse {
  type: 'device_name';
  trackIndex: number;
  deviceIndex: number;
  name: string;
}

export interface DeviceTypeResponse {
  type: 'device_type';
  trackIndex: number;
  deviceIndex: number;
  deviceType: string;
  className: string;
}

export interface DeviceOnResponse {
  type: 'device_on';
  trackIndex: number;
  deviceIndex: number;
  isOn: boolean;
}

export interface DeviceParametersResponse {
  type: 'device_parameters';
  trackIndex: number;
  deviceIndex: number;
  parameters: DeviceParameter[];
}

export interface DeviceParameter {
  index: number;
  name: string;
  value: number;
  min: number;
  max: number;
  isQuantized: boolean;
}

export interface DeviceParameterValueResponse {
  type: 'device_parameter_value';
  trackIndex: number;
  deviceIndex: number;
  parameterIndex: number;
  value: number;
  valueString: string;
}

export interface NumDevicesResponse {
  type: 'num_devices';
  trackIndex: number;
  count: number;
}

// =============================================================================
// Union Types for Response Handling
// =============================================================================

export type ApplicationResponse =
  | TestResponse
  | VersionResponse
  | LogLevelResponse
  | StartupResponse
  | ErrorResponse;

export type SongResponse =
  | TempoResponse
  | IsPlayingResponse
  | MetronomeResponse
  | NumTracksResponse
  | NumScenesResponse
  | TrackNamesResponse
  | SongTimeResponse
  | SignatureResponse
  | LoopResponse
  | RecordModeResponse
  | SessionRecordResponse
  | QuantizationResponse
  | CuePointsResponse
  | TrackDataResponse;

export type ViewResponse =
  | SelectedTrackResponse
  | SelectedSceneResponse
  | SelectedClipResponse
  | SelectedDeviceResponse;

export type TrackResponse =
  | TrackNameResponse
  | TrackColorResponse
  | TrackVolumeResponse
  | TrackPanResponse
  | TrackMuteResponse
  | TrackSoloResponse
  | TrackArmResponse
  | TrackSendResponse
  | TrackMeterResponse
  | PlayingSlotResponse
  | FiredSlotResponse
  | TrackRoutingResponse;

export type ClipSlotResponse = HasClipResponse;

export type ClipResponse =
  | ClipNameResponse
  | ClipColorResponse
  | ClipLengthResponse
  | ClipPlayingStatusResponse
  | ClipPlayingPositionResponse
  | ClipLoopResponse
  | ClipNotesResponse
  | ClipPropertiesResponse;

export type SceneResponse =
  | SceneNameResponse
  | SceneColorResponse
  | SceneTempoResponse
  | SceneTimeSignatureResponse
  | SceneTriggeredResponse;

export type DeviceResponse =
  | DeviceNameResponse
  | DeviceTypeResponse
  | DeviceOnResponse
  | DeviceParametersResponse
  | DeviceParameterValueResponse
  | NumDevicesResponse;

/** All possible parsed responses */
export type AbletonResponse =
  | ApplicationResponse
  | SongResponse
  | ViewResponse
  | TrackResponse
  | ClipSlotResponse
  | ClipResponse
  | SceneResponse
  | DeviceResponse;
