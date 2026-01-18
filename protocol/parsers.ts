/**
 * OSC Response Parsers
 * Parse incoming OSC messages from Ableton into typed response objects
 */

import type { OSCValue } from './types';
import type {
  AbletonResponse,
  TestResponse,
  VersionResponse,
  LogLevelResponse,
  StartupResponse,
  ErrorResponse,
  TempoResponse,
  IsPlayingResponse,
  MetronomeResponse,
  NumTracksResponse,
  NumScenesResponse,
  NumReturnTracksResponse,
  TrackNamesResponse,
  SongTimeResponse,
  SignatureResponse,
  LoopResponse,
  RecordModeResponse,
  SessionRecordResponse,
  QuantizationResponse,
  QuantizationValue,
  CuePointsResponse,
  TrackDataResponse,
  SelectedTrackResponse,
  SelectedSceneResponse,
  SelectedClipResponse,
  SelectedDeviceResponse,
  TrackNameResponse,
  TrackColorResponse,
  TrackVolumeResponse,
  TrackPanResponse,
  TrackMuteResponse,
  TrackSoloResponse,
  TrackArmResponse,
  TrackSendResponse,
  TrackMeterResponse,
  PlayingSlotResponse,
  FiredSlotResponse,
  HasClipResponse,
  ClipNameResponse,
  ClipColorResponse,
  ClipLengthResponse,
  ClipPlayingStatusResponse,
  ClipPlayingPositionResponse,
  ClipLoopResponse,
  ClipNotesResponse,
  MidiNote,
  SceneNameResponse,
  SceneColorResponse,
  SceneTempoResponse,
  SceneTimeSignatureResponse,
  SceneTriggeredResponse,
  DeviceNameResponse,
  DeviceTypeResponse,
  DeviceOnResponse,
  DeviceParametersResponse,
  DeviceParameter,
  DeviceParameterValueResponse,
  NumDevicesResponse,
} from './responses';

// =============================================================================
// Parser Type
// =============================================================================

/** Input format for OSC messages */
export interface RawOSCMessage {
  address: string;
  args: OSCValue[];
}

/** Result of parsing - either typed response or unknown */
export type ParseResult = AbletonResponse | { type: 'unknown'; address: string; args: OSCValue[] };

// =============================================================================
// Quantization Value Mapping
// =============================================================================

const quantizationMap: Record<number, QuantizationValue> = {
  0: 'none',
  1: 'q_8_bars',
  2: 'q_4_bars',
  3: 'q_2_bars',
  4: 'q_bar',
  5: 'q_half',
  6: 'q_half_triplet',
  7: 'q_quarter',
  8: 'q_quarter_triplet',
  9: 'q_eight',
  10: 'q_eight_triplet',
  11: 'q_sixteenth',
  12: 'q_sixteenth_triplet',
  13: 'q_thirtysecond',
};

// =============================================================================
// Helper Functions
// =============================================================================

/** Extract number from args at index */
function getNumber(args: OSCValue[], index: number, defaultValue = 0): number {
  const val = args[index];
  return typeof val === 'number' ? val : defaultValue;
}

/** Extract string from args at index */
function getString(args: OSCValue[], index: number, defaultValue = ''): string {
  const val = args[index];
  return typeof val === 'string' ? val : String(val ?? defaultValue);
}

/** Extract boolean from args at index (0 = false, non-0 = true) */
function getBoolean(args: OSCValue[], index: number, defaultValue = false): boolean {
  const val = args[index];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  return defaultValue;
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse an OSC message from Ableton into a typed response
 * Returns the typed response or an 'unknown' type for unrecognized addresses
 */
export function parseOSCResponse(message: RawOSCMessage): ParseResult {
  const { address, args } = message;

  // Application responses
  if (address === '/live/test') {
    return parseTestResponse(args);
  }
  if (address === '/live/application/get/version') {
    return parseVersionResponse(args);
  }
  if (address === '/live/api/get/log_level') {
    return parseLogLevelResponse(args);
  }
  if (address === '/live/startup') {
    return { type: 'startup' } as StartupResponse;
  }
  if (address === '/live/error') {
    return parseErrorResponse(args);
  }

  // Song responses
  if (address === '/live/song/get/tempo') {
    return parseTempoResponse(args);
  }
  if (address === '/live/song/get/is_playing') {
    return parseIsPlayingResponse(args);
  }
  if (address === '/live/song/get/metronome') {
    return parseMetronomeResponse(args);
  }
  if (address === '/live/song/get/num_tracks') {
    return parseNumTracksResponse(args);
  }
  if (address === '/live/song/get/num_scenes') {
    return parseNumScenesResponse(args);
  }
  if (address === '/live/song/get/num_return_tracks') {
    return parseNumReturnTracksResponse(args);
  }
  if (address === '/live/song/get/track_names') {
    return parseTrackNamesResponse(args);
  }
  if (address === '/live/song/get/current_song_time') {
    return parseSongTimeResponse(args);
  }
  if (address === '/live/song/get/signature_numerator' || address === '/live/song/get/signature_denominator') {
    return parseSignatureResponse(address, args);
  }
  if (address === '/live/song/get/loop' || address === '/live/song/get/loop_start' || address === '/live/song/get/loop_length') {
    return parseLoopResponse(address, args);
  }
  if (address === '/live/song/get/record_mode') {
    return parseRecordModeResponse(args);
  }
  if (address === '/live/song/get/session_record' || address === '/live/song/get/session_record_status') {
    return parseSessionRecordResponse(args);
  }
  if (address === '/live/song/get/clip_trigger_quantization' || address === '/live/song/get/midi_recording_quantization') {
    return parseQuantizationResponse(args);
  }
  if (address === '/live/song/get/cue_points') {
    return parseCuePointsResponse(args);
  }
  if (address === '/live/song/get/track_data') {
    return parseTrackDataResponse(args);
  }

  // View responses
  if (address === '/live/view/get/selected_track') {
    return parseSelectedTrackResponse(args);
  }
  if (address === '/live/view/get/selected_scene') {
    return parseSelectedSceneResponse(args);
  }
  if (address === '/live/view/get/selected_clip') {
    return parseSelectedClipResponse(args);
  }
  if (address === '/live/view/get/selected_device') {
    return parseSelectedDeviceResponse(args);
  }

  // Track responses
  if (address === '/live/track/get/name') {
    return parseTrackNameResponse(args);
  }
  if (address === '/live/track/get/color' || address === '/live/track/get/color_index') {
    return parseTrackColorResponse(args);
  }
  if (address === '/live/track/get/volume') {
    return parseTrackVolumeResponse(args);
  }
  if (address === '/live/track/get/panning') {
    return parseTrackPanResponse(args);
  }
  if (address === '/live/track/get/mute') {
    return parseTrackMuteResponse(args);
  }
  if (address === '/live/track/get/solo') {
    return parseTrackSoloResponse(args);
  }
  if (address === '/live/track/get/arm') {
    return parseTrackArmResponse(args);
  }
  if (address === '/live/track/get/send') {
    return parseTrackSendResponse(args);
  }
  if (address === '/live/track/get/output_meter_level' ||
      address === '/live/track/get/output_meter_left' ||
      address === '/live/track/get/output_meter_right') {
    return parseTrackMeterResponse(args);
  }
  if (address === '/live/track/get/playing_slot_index') {
    return parsePlayingSlotResponse(args);
  }
  if (address === '/live/track/get/fired_slot_index') {
    return parseFiredSlotResponse(args);
  }
  if (address === '/live/track/get/num_devices') {
    return parseNumDevicesResponse(args);
  }

  // Clip slot responses
  if (address === '/live/clip_slot/get/has_clip') {
    return parseHasClipResponse(args);
  }

  // Clip responses
  if (address === '/live/clip/get/name') {
    return parseClipNameResponse(args);
  }
  if (address === '/live/clip/get/color' || address === '/live/clip/get/color_index') {
    return parseClipColorResponse(args);
  }
  if (address === '/live/clip/get/length') {
    return parseClipLengthResponse(args);
  }
  if (address === '/live/clip/get/playing_status') {
    return parseClipPlayingStatusResponse(args);
  }
  if (address === '/live/clip/get/playing_position') {
    return parseClipPlayingPositionResponse(args);
  }
  if (address === '/live/clip/get/loop_start' || address === '/live/clip/get/loop_end') {
    return parseClipLoopResponse(address, args);
  }
  if (address === '/live/clip/get/notes') {
    return parseClipNotesResponse(args);
  }

  // Scene responses
  if (address === '/live/scene/get/name') {
    return parseSceneNameResponse(args);
  }
  if (address === '/live/scene/get/color' || address === '/live/scene/get/color_index') {
    return parseSceneColorResponse(args);
  }
  if (address === '/live/scene/get/tempo') {
    return parseSceneTempoResponse(args);
  }
  if (address.startsWith('/live/scene/get/time_signature')) {
    return parseSceneTimeSignatureResponse(address, args);
  }
  if (address === '/live/scene/get/is_triggered') {
    return parseSceneTriggeredResponse(args);
  }

  // Device responses
  if (address === '/live/device/get/name') {
    return parseDeviceNameResponse(args);
  }
  if (address === '/live/device/get/type' || address === '/live/device/get/class_name') {
    return parseDeviceTypeResponse(args);
  }
  if (address === '/live/device/get/is_on') {
    return parseDeviceOnResponse(args);
  }
  if (address === '/live/device/get/parameters') {
    return parseDeviceParametersResponse(args);
  }
  if (address === '/live/device/get/parameter/value') {
    return parseDeviceParameterValueResponse(args);
  }

  // Listener update messages (same format as getters)
  // These are sent when values change after start_listen
  if (address.includes('/start_listen/') || address.includes('/stop_listen/')) {
    // Acknowledgment messages, no data to parse
    return { type: 'unknown', address, args };
  }

  // Handle listener update messages (format: /live/<object>/<property>)
  // These match getter addresses but are sent proactively
  const listenerPatterns = [
    { pattern: /^\/live\/song\/tempo$/, parser: () => parseTempoResponse(args) },
    { pattern: /^\/live\/song\/is_playing$/, parser: () => parseIsPlayingResponse(args) },
    { pattern: /^\/live\/song\/metronome$/, parser: () => parseMetronomeResponse(args) },
    { pattern: /^\/live\/view\/selected_track$/, parser: () => parseSelectedTrackResponse(args) },
    { pattern: /^\/live\/view\/selected_scene$/, parser: () => parseSelectedSceneResponse(args) },
    { pattern: /^\/live\/track\/volume$/, parser: () => parseTrackVolumeResponse(args) },
    { pattern: /^\/live\/track\/panning$/, parser: () => parseTrackPanResponse(args) },
    { pattern: /^\/live\/track\/mute$/, parser: () => parseTrackMuteResponse(args) },
    { pattern: /^\/live\/track\/solo$/, parser: () => parseTrackSoloResponse(args) },
    { pattern: /^\/live\/track\/arm$/, parser: () => parseTrackArmResponse(args) },
    { pattern: /^\/live\/track\/playing_slot_index$/, parser: () => parsePlayingSlotResponse(args) },
    { pattern: /^\/live\/track\/fired_slot_index$/, parser: () => parseFiredSlotResponse(args) },
    { pattern: /^\/live\/clip_slot\/has_clip$/, parser: () => parseHasClipResponse(args) },
    { pattern: /^\/live\/clip\/playing_status$/, parser: () => parseClipPlayingStatusResponse(args) },
    { pattern: /^\/live\/clip\/playing_position$/, parser: () => parseClipPlayingPositionResponse(args) },
    { pattern: /^\/live\/device\/is_on$/, parser: () => parseDeviceOnResponse(args) },
    { pattern: /^\/live\/device\/parameter\/value$/, parser: () => parseDeviceParameterValueResponse(args) },
  ];

  for (const { pattern, parser } of listenerPatterns) {
    if (pattern.test(address)) {
      return parser();
    }
  }

  // Unknown message type
  return { type: 'unknown', address, args };
}

// =============================================================================
// Individual Parsers
// =============================================================================

// Application Parsers

function parseTestResponse(args: OSCValue[]): TestResponse {
  return { type: 'test', ok: args.length > 0 };
}

function parseVersionResponse(args: OSCValue[]): VersionResponse {
  return {
    type: 'version',
    major: getNumber(args, 0),
    minor: getNumber(args, 1),
  };
}

function parseLogLevelResponse(args: OSCValue[]): LogLevelResponse {
  const level = getString(args, 0, 'info');
  const validLevels = ['debug', 'info', 'warning', 'error', 'critical'] as const;
  return {
    type: 'log_level',
    level: validLevels.includes(level as any) ? (level as LogLevelResponse['level']) : 'info',
  };
}

function parseErrorResponse(args: OSCValue[]): ErrorResponse {
  return {
    type: 'error',
    message: getString(args, 0, 'Unknown error'),
  };
}

// Song Parsers

function parseTempoResponse(args: OSCValue[]): TempoResponse {
  return { type: 'tempo', bpm: getNumber(args, 0, 120) };
}

function parseIsPlayingResponse(args: OSCValue[]): IsPlayingResponse {
  return { type: 'is_playing', playing: getBoolean(args, 0) };
}

function parseMetronomeResponse(args: OSCValue[]): MetronomeResponse {
  return { type: 'metronome', enabled: getBoolean(args, 0) };
}

function parseNumTracksResponse(args: OSCValue[]): NumTracksResponse {
  return { type: 'num_tracks', count: getNumber(args, 0) };
}

function parseNumScenesResponse(args: OSCValue[]): NumScenesResponse {
  return { type: 'num_scenes', count: getNumber(args, 0) };
}

function parseNumReturnTracksResponse(args: OSCValue[]): NumReturnTracksResponse {
  return { type: 'num_return_tracks', count: getNumber(args, 0) };
}

function parseTrackNamesResponse(args: OSCValue[]): TrackNamesResponse {
  return {
    type: 'track_names',
    names: args.filter((a): a is string => typeof a === 'string'),
  };
}

function parseSongTimeResponse(args: OSCValue[]): SongTimeResponse {
  return { type: 'song_time', beats: getNumber(args, 0) };
}

function parseSignatureResponse(address: string, args: OSCValue[]): SignatureResponse {
  // This is a partial response - caller should combine num/denom
  const isNumerator = address.includes('numerator');
  return {
    type: 'signature',
    numerator: isNumerator ? getNumber(args, 0, 4) : 4,
    denominator: isNumerator ? 4 : getNumber(args, 0, 4),
  };
}

function parseLoopResponse(address: string, args: OSCValue[]): LoopResponse {
  // This is a partial response
  const isEnabled = address.endsWith('/loop');
  const isStart = address.includes('loop_start');
  return {
    type: 'loop',
    enabled: isEnabled ? getBoolean(args, 0) : true,
    start: isStart ? getNumber(args, 0) : 0,
    length: !isEnabled && !isStart ? getNumber(args, 0) : 4,
  };
}

function parseRecordModeResponse(args: OSCValue[]): RecordModeResponse {
  return { type: 'record_mode', enabled: getBoolean(args, 0) };
}

function parseSessionRecordResponse(args: OSCValue[]): SessionRecordResponse {
  return { type: 'session_record', enabled: getBoolean(args, 0) };
}

function parseQuantizationResponse(args: OSCValue[]): QuantizationResponse {
  const value = getNumber(args, 0);
  return {
    type: 'quantization',
    value: quantizationMap[value] || 'q_bar',
  };
}

function parseCuePointsResponse(args: OSCValue[]): CuePointsResponse {
  // Format: [time1, name1, time2, name2, ...]
  const cuePoints: CuePointsResponse['cuePoints'] = [];
  for (let i = 0; i < args.length; i += 2) {
    if (i + 1 < args.length) {
      cuePoints.push({
        time: getNumber(args, i),
        name: getString(args, i + 1),
      });
    }
  }
  return { type: 'cue_points', cuePoints };
}

function parseTrackDataResponse(args: OSCValue[]): TrackDataResponse {
  // Format varies - this is a simplified parser
  // Real implementation would need to match AbletonOSC's track_data format
  const tracks: TrackDataResponse['tracks'] = [];
  // Assuming format: [index, name, color, isFoldable, isGrouped, ...]
  const fieldsPerTrack = 5;
  for (let i = 0; i < args.length; i += fieldsPerTrack) {
    if (i + 4 < args.length) {
      tracks.push({
        index: getNumber(args, i),
        name: getString(args, i + 1),
        color: getNumber(args, i + 2),
        isFoldable: getBoolean(args, i + 3),
        isGrouped: getBoolean(args, i + 4),
      });
    }
  }
  return { type: 'track_data', tracks };
}

// View Parsers

function parseSelectedTrackResponse(args: OSCValue[]): SelectedTrackResponse {
  return { type: 'selected_track', trackIndex: getNumber(args, 0) };
}

function parseSelectedSceneResponse(args: OSCValue[]): SelectedSceneResponse {
  return { type: 'selected_scene', sceneIndex: getNumber(args, 0) };
}

function parseSelectedClipResponse(args: OSCValue[]): SelectedClipResponse {
  return {
    type: 'selected_clip',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
  };
}

function parseSelectedDeviceResponse(args: OSCValue[]): SelectedDeviceResponse {
  return {
    type: 'selected_device',
    trackIndex: getNumber(args, 0),
    deviceIndex: getNumber(args, 1),
  };
}

// Track Parsers

function parseTrackNameResponse(args: OSCValue[]): TrackNameResponse {
  return {
    type: 'track_name',
    trackIndex: getNumber(args, 0),
    name: getString(args, 1),
  };
}

function parseTrackColorResponse(args: OSCValue[]): TrackColorResponse {
  return {
    type: 'track_color',
    trackIndex: getNumber(args, 0),
    color: getNumber(args, 1),
  };
}

function parseTrackVolumeResponse(args: OSCValue[]): TrackVolumeResponse {
  return {
    type: 'track_volume',
    trackIndex: getNumber(args, 0),
    volume: getNumber(args, 1, 0.85),
  };
}

function parseTrackPanResponse(args: OSCValue[]): TrackPanResponse {
  return {
    type: 'track_pan',
    trackIndex: getNumber(args, 0),
    pan: getNumber(args, 1),
  };
}

function parseTrackMuteResponse(args: OSCValue[]): TrackMuteResponse {
  return {
    type: 'track_mute',
    trackIndex: getNumber(args, 0),
    muted: getBoolean(args, 1),
  };
}

function parseTrackSoloResponse(args: OSCValue[]): TrackSoloResponse {
  return {
    type: 'track_solo',
    trackIndex: getNumber(args, 0),
    soloed: getBoolean(args, 1),
  };
}

function parseTrackArmResponse(args: OSCValue[]): TrackArmResponse {
  return {
    type: 'track_arm',
    trackIndex: getNumber(args, 0),
    armed: getBoolean(args, 1),
  };
}

function parseTrackSendResponse(args: OSCValue[]): TrackSendResponse {
  return {
    type: 'track_send',
    trackIndex: getNumber(args, 0),
    sendIndex: getNumber(args, 1),
    value: getNumber(args, 2),
  };
}

function parseTrackMeterResponse(args: OSCValue[]): TrackMeterResponse {
  return {
    type: 'track_meter',
    trackIndex: getNumber(args, 0),
    left: getNumber(args, 1),
    right: args.length > 2 ? getNumber(args, 2) : getNumber(args, 1),
  };
}

function parsePlayingSlotResponse(args: OSCValue[]): PlayingSlotResponse {
  return {
    type: 'playing_slot',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1, -1),
  };
}

function parseFiredSlotResponse(args: OSCValue[]): FiredSlotResponse {
  return {
    type: 'fired_slot',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1, -1),
  };
}

function parseNumDevicesResponse(args: OSCValue[]): NumDevicesResponse {
  return {
    type: 'num_devices',
    trackIndex: getNumber(args, 0),
    count: getNumber(args, 1),
  };
}

// Clip Slot Parsers

function parseHasClipResponse(args: OSCValue[]): HasClipResponse {
  return {
    type: 'has_clip',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    hasClip: getBoolean(args, 2),
  };
}

// Clip Parsers

function parseClipNameResponse(args: OSCValue[]): ClipNameResponse {
  return {
    type: 'clip_name',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    name: getString(args, 2),
  };
}

function parseClipColorResponse(args: OSCValue[]): ClipColorResponse {
  return {
    type: 'clip_color',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    color: getNumber(args, 2),
  };
}

function parseClipLengthResponse(args: OSCValue[]): ClipLengthResponse {
  return {
    type: 'clip_length',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    length: getNumber(args, 2),
  };
}

function parseClipPlayingStatusResponse(args: OSCValue[]): ClipPlayingStatusResponse {
  return {
    type: 'clip_playing_status',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    isPlaying: getBoolean(args, 2),
    isTriggered: getBoolean(args, 3),
    isRecording: getBoolean(args, 4),
  };
}

function parseClipPlayingPositionResponse(args: OSCValue[]): ClipPlayingPositionResponse {
  return {
    type: 'clip_playing_position',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    position: getNumber(args, 2),
  };
}

function parseClipLoopResponse(address: string, args: OSCValue[]): ClipLoopResponse {
  const isStart = address.includes('loop_start');
  return {
    type: 'clip_loop',
    trackIndex: getNumber(args, 0),
    sceneIndex: getNumber(args, 1),
    loopStart: isStart ? getNumber(args, 2) : 0,
    loopEnd: isStart ? 0 : getNumber(args, 2),
  };
}

function parseClipNotesResponse(args: OSCValue[]): ClipNotesResponse {
  const trackIndex = getNumber(args, 0);
  const sceneIndex = getNumber(args, 1);
  const notes: MidiNote[] = [];

  // Notes start at index 2, each note has 5 values: pitch, start, duration, velocity, mute
  for (let i = 2; i < args.length; i += 5) {
    if (i + 4 < args.length) {
      notes.push({
        pitch: getNumber(args, i),
        start: getNumber(args, i + 1),
        duration: getNumber(args, i + 2),
        velocity: getNumber(args, i + 3),
        mute: getBoolean(args, i + 4),
      });
    }
  }

  return { type: 'clip_notes', trackIndex, sceneIndex, notes };
}

// Scene Parsers

function parseSceneNameResponse(args: OSCValue[]): SceneNameResponse {
  return {
    type: 'scene_name',
    sceneIndex: getNumber(args, 0),
    name: getString(args, 1),
  };
}

function parseSceneColorResponse(args: OSCValue[]): SceneColorResponse {
  return {
    type: 'scene_color',
    sceneIndex: getNumber(args, 0),
    color: getNumber(args, 1),
  };
}

function parseSceneTempoResponse(args: OSCValue[]): SceneTempoResponse {
  return {
    type: 'scene_tempo',
    sceneIndex: getNumber(args, 0),
    tempo: getNumber(args, 1, 120),
    tempoEnabled: getBoolean(args, 2),
  };
}

function parseSceneTimeSignatureResponse(address: string, args: OSCValue[]): SceneTimeSignatureResponse {
  const isNumerator = address.includes('numerator');
  const isDenominator = address.includes('denominator');
  const isEnabled = address.includes('enabled');

  return {
    type: 'scene_time_signature',
    sceneIndex: getNumber(args, 0),
    numerator: isNumerator ? getNumber(args, 1, 4) : 4,
    denominator: isDenominator ? getNumber(args, 1, 4) : 4,
    enabled: isEnabled ? getBoolean(args, 1) : true,
  };
}

function parseSceneTriggeredResponse(args: OSCValue[]): SceneTriggeredResponse {
  return {
    type: 'scene_triggered',
    sceneIndex: getNumber(args, 0),
    isTriggered: getBoolean(args, 1),
  };
}

// Device Parsers

function parseDeviceNameResponse(args: OSCValue[]): DeviceNameResponse {
  return {
    type: 'device_name',
    trackIndex: getNumber(args, 0),
    deviceIndex: getNumber(args, 1),
    name: getString(args, 2),
  };
}

function parseDeviceTypeResponse(args: OSCValue[]): DeviceTypeResponse {
  return {
    type: 'device_type',
    trackIndex: getNumber(args, 0),
    deviceIndex: getNumber(args, 1),
    deviceType: getString(args, 2),
    className: getString(args, 3),
  };
}

function parseDeviceOnResponse(args: OSCValue[]): DeviceOnResponse {
  return {
    type: 'device_on',
    trackIndex: getNumber(args, 0),
    deviceIndex: getNumber(args, 1),
    isOn: getBoolean(args, 2),
  };
}

function parseDeviceParametersResponse(args: OSCValue[]): DeviceParametersResponse {
  const trackIndex = getNumber(args, 0);
  const deviceIndex = getNumber(args, 1);
  const parameters: DeviceParameter[] = [];

  // Parameters start at index 2
  // Format: [name, value, min, max, isQuantized, name, value, min, max, isQuantized, ...]
  const fieldsPerParam = 5;
  for (let i = 2; i < args.length; i += fieldsPerParam) {
    if (i + 4 < args.length) {
      parameters.push({
        index: Math.floor((i - 2) / fieldsPerParam),
        name: getString(args, i),
        value: getNumber(args, i + 1),
        min: getNumber(args, i + 2),
        max: getNumber(args, i + 3, 1),
        isQuantized: getBoolean(args, i + 4),
      });
    }
  }

  return { type: 'device_parameters', trackIndex, deviceIndex, parameters };
}

function parseDeviceParameterValueResponse(args: OSCValue[]): DeviceParameterValueResponse {
  return {
    type: 'device_parameter_value',
    trackIndex: getNumber(args, 0),
    deviceIndex: getNumber(args, 1),
    parameterIndex: getNumber(args, 2),
    value: getNumber(args, 3),
    valueString: getString(args, 4),
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a response is of a specific type
 */
export function isResponseType<T extends AbletonResponse['type']>(
  response: ParseResult,
  type: T
): response is Extract<AbletonResponse, { type: T }> {
  return response.type === type;
}

/**
 * Create a response handler that dispatches to type-specific callbacks
 */
export type ResponseHandlers = {
  [K in AbletonResponse['type']]?: (response: Extract<AbletonResponse, { type: K }>) => void;
} & {
  unknown?: (response: { type: 'unknown'; address: string; args: OSCValue[] }) => void;
};

export function handleResponse(response: ParseResult, handlers: ResponseHandlers): void {
  const handler = handlers[response.type as keyof ResponseHandlers];
  if (handler) {
    (handler as (r: typeof response) => void)(response);
  }
}
