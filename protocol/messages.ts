/**
 * OSC Message Builders
 * Type-safe message builders for all AbletonOSC commands
 * Reference: https://github.com/ideoforms/AbletonOSC
 */

import type { OSCMessage } from './types';
import type { QuantizationValue } from './responses';

// =============================================================================
// Helper Types
// =============================================================================

/** Log levels supported by AbletonOSC */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/** Quantization values as integers (for OSC) */
export const QuantizationValues = {
  none: 0,
  q_8_bars: 1,
  q_4_bars: 2,
  q_2_bars: 3,
  q_bar: 4,
  q_half: 5,
  q_half_triplet: 6,
  q_quarter: 7,
  q_quarter_triplet: 8,
  q_eight: 9,
  q_eight_triplet: 10,
  q_sixteenth: 11,
  q_sixteenth_triplet: 12,
  q_thirtysecond: 13,
} as const;

/** Launch modes for clips */
export type LaunchMode = 'trigger' | 'gate' | 'toggle' | 'repeat';

/** Monitoring states for tracks */
export type MonitoringState = 'in' | 'auto' | 'off';

// =============================================================================
// Application API
// =============================================================================

export const application = {
  /** Test connection - returns confirmation */
  test: (): OSCMessage => ({ address: '/live/test', args: [] }),

  /** Get Ableton Live version */
  getVersion: (): OSCMessage => ({ address: '/live/application/get/version', args: [] }),

  /** Reload the AbletonOSC script (for development) */
  reload: (): OSCMessage => ({ address: '/live/api/reload', args: [] }),

  /** Get current log level */
  getLogLevel: (): OSCMessage => ({ address: '/live/api/get/log_level', args: [] }),

  /** Set log level */
  setLogLevel: (level: LogLevel): OSCMessage => ({
    address: '/live/api/set/log_level',
    args: [level]
  }),

  /** Show a message in Ableton's status bar */
  showMessage: (message: string): OSCMessage => ({
    address: '/live/api/show_message',
    args: [message]
  }),
};

// =============================================================================
// Song API
// =============================================================================

export const song = {
  // ---------------------------------------------------------------------------
  // Transport Controls
  // ---------------------------------------------------------------------------

  /** Start playback */
  play: (): OSCMessage => ({ address: '/live/song/start_playing', args: [] }),

  /** Stop playback */
  stop: (): OSCMessage => ({ address: '/live/song/stop_playing', args: [] }),

  /** Continue playback from current position */
  continuePlaying: (): OSCMessage => ({ address: '/live/song/continue_playing', args: [] }),

  /** Stop all clips */
  stopAllClips: (): OSCMessage => ({ address: '/live/song/stop_all_clips', args: [] }),

  /** Tap tempo */
  tapTempo: (): OSCMessage => ({ address: '/live/song/tap_tempo', args: [] }),

  /** Trigger session record */
  triggerSessionRecord: (): OSCMessage => ({ address: '/live/song/trigger_session_record', args: [] }),

  /** Capture MIDI (convert playing MIDI to clip) */
  captureMidi: (): OSCMessage => ({ address: '/live/song/capture_midi', args: [] }),

  /** Undo */
  undo: (): OSCMessage => ({ address: '/live/song/undo', args: [] }),

  /** Redo */
  redo: (): OSCMessage => ({ address: '/live/song/redo', args: [] }),

  // ---------------------------------------------------------------------------
  // Tempo
  // ---------------------------------------------------------------------------

  /** Get current tempo */
  getTempo: (): OSCMessage => ({ address: '/live/song/get/tempo', args: [] }),

  /** Set tempo in BPM */
  setTempo: (bpm: number): OSCMessage => ({ address: '/live/song/set/tempo', args: [bpm] }),

  /** Start listening to tempo changes */
  startListenTempo: (): OSCMessage => ({ address: '/live/song/start_listen/tempo', args: [] }),

  /** Stop listening to tempo changes */
  stopListenTempo: (): OSCMessage => ({ address: '/live/song/stop_listen/tempo', args: [] }),

  // ---------------------------------------------------------------------------
  // Play State
  // ---------------------------------------------------------------------------

  /** Get play state */
  getIsPlaying: (): OSCMessage => ({ address: '/live/song/get/is_playing', args: [] }),

  /** Start listening to play state changes */
  startListenIsPlaying: (): OSCMessage => ({ address: '/live/song/start_listen/is_playing', args: [] }),

  /** Stop listening to play state changes */
  stopListenIsPlaying: (): OSCMessage => ({ address: '/live/song/stop_listen/is_playing', args: [] }),

  // ---------------------------------------------------------------------------
  // Metronome
  // ---------------------------------------------------------------------------

  /** Get metronome state */
  getMetronome: (): OSCMessage => ({ address: '/live/song/get/metronome', args: [] }),

  /** Set metronome on/off */
  setMetronome: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/metronome',
    args: [enabled ? 1 : 0]
  }),

  /** Start listening to metronome changes */
  startListenMetronome: (): OSCMessage => ({ address: '/live/song/start_listen/metronome', args: [] }),

  /** Stop listening to metronome changes */
  stopListenMetronome: (): OSCMessage => ({ address: '/live/song/stop_listen/metronome', args: [] }),

  // ---------------------------------------------------------------------------
  // Punch In/Out
  // ---------------------------------------------------------------------------

  /** Start listening to punch in changes */
  startListenPunchIn: (): OSCMessage => ({ address: '/live/song/start_listen/punch_in', args: [] }),

  /** Stop listening to punch in changes */
  stopListenPunchIn: (): OSCMessage => ({ address: '/live/song/stop_listen/punch_in', args: [] }),

  /** Start listening to punch out changes */
  startListenPunchOut: (): OSCMessage => ({ address: '/live/song/start_listen/punch_out', args: [] }),

  /** Stop listening to punch out changes */
  stopListenPunchOut: (): OSCMessage => ({ address: '/live/song/stop_listen/punch_out', args: [] }),

  // ---------------------------------------------------------------------------
  // Recording
  // ---------------------------------------------------------------------------

  /** Get record mode state */
  getRecordMode: (): OSCMessage => ({ address: '/live/song/get/record_mode', args: [] }),

  /** Set record mode (arrangement recording) */
  setRecordMode: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/record_mode',
    args: [enabled ? 1 : 0]
  }),

  /** Start listening to record mode changes */
  startListenRecordMode: (): OSCMessage => ({ address: '/live/song/start_listen/record_mode', args: [] }),

  /** Stop listening to record mode changes */
  stopListenRecordMode: (): OSCMessage => ({ address: '/live/song/stop_listen/record_mode', args: [] }),

  /** Get session record state */
  getSessionRecord: (): OSCMessage => ({ address: '/live/song/get/session_record', args: [] }),

  /** Set session record on/off */
  setSessionRecord: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/session_record',
    args: [enabled ? 1 : 0]
  }),

  /** Get arrangement overdub state */
  getArrangementOverdub: (): OSCMessage => ({ address: '/live/song/get/arrangement_overdub', args: [] }),

  /** Set arrangement overdub on/off */
  setArrangementOverdub: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/arrangement_overdub',
    args: [enabled ? 1 : 0]
  }),

  /** Get punch in state */
  getPunchIn: (): OSCMessage => ({ address: '/live/song/get/punch_in', args: [] }),

  /** Set punch in on/off */
  setPunchIn: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/punch_in',
    args: [enabled ? 1 : 0]
  }),

  /** Get punch out state */
  getPunchOut: (): OSCMessage => ({ address: '/live/song/get/punch_out', args: [] }),

  /** Set punch out on/off */
  setPunchOut: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/punch_out',
    args: [enabled ? 1 : 0]
  }),

  // ---------------------------------------------------------------------------
  // Time & Position
  // ---------------------------------------------------------------------------

  /** Get current song time in beats */
  getCurrentSongTime: (): OSCMessage => ({ address: '/live/song/get/current_song_time', args: [] }),

  /** Set current song time (jump to position) */
  setCurrentSongTime: (beats: number): OSCMessage => ({
    address: '/live/song/set/current_song_time',
    args: [beats]
  }),

  /** Jump by relative amount */
  jumpBy: (beats: number): OSCMessage => ({ address: '/live/song/jump_by', args: [beats] }),

  /** Jump to next cue point */
  jumpToNextCue: (): OSCMessage => ({ address: '/live/song/jump_to_next_cue', args: [] }),

  /** Jump to previous cue point */
  jumpToPrevCue: (): OSCMessage => ({ address: '/live/song/jump_to_prev_cue', args: [] }),

  /** Jump to specific cue point by time */
  jumpToCue: (time: number): OSCMessage => ({ address: '/live/song/cue_point/jump', args: [time] }),

  /** Get song length */
  getSongLength: (): OSCMessage => ({ address: '/live/song/get/song_length', args: [] }),

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------

  /** Get loop enabled state */
  getLoop: (): OSCMessage => ({ address: '/live/song/get/loop', args: [] }),

  /** Set loop on/off */
  setLoop: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/loop',
    args: [enabled ? 1 : 0]
  }),

  /** Start listening to loop changes */
  startListenLoop: (): OSCMessage => ({ address: '/live/song/start_listen/loop', args: [] }),

  /** Stop listening to loop changes */
  stopListenLoop: (): OSCMessage => ({ address: '/live/song/stop_listen/loop', args: [] }),

  /** Get loop start position */
  getLoopStart: (): OSCMessage => ({ address: '/live/song/get/loop_start', args: [] }),

  /** Set loop start position */
  setLoopStart: (beats: number): OSCMessage => ({
    address: '/live/song/set/loop_start',
    args: [beats]
  }),

  /** Get loop length */
  getLoopLength: (): OSCMessage => ({ address: '/live/song/get/loop_length', args: [] }),

  /** Set loop length */
  setLoopLength: (beats: number): OSCMessage => ({
    address: '/live/song/set/loop_length',
    args: [beats]
  }),

  // ---------------------------------------------------------------------------
  // Time Signature
  // ---------------------------------------------------------------------------

  /** Get time signature numerator */
  getSignatureNumerator: (): OSCMessage => ({ address: '/live/song/get/signature_numerator', args: [] }),

  /** Set time signature numerator */
  setSignatureNumerator: (value: number): OSCMessage => ({
    address: '/live/song/set/signature_numerator',
    args: [value]
  }),

  /** Get time signature denominator */
  getSignatureDenominator: (): OSCMessage => ({ address: '/live/song/get/signature_denominator', args: [] }),

  /** Set time signature denominator */
  setSignatureDenominator: (value: number): OSCMessage => ({
    address: '/live/song/set/signature_denominator',
    args: [value]
  }),

  // ---------------------------------------------------------------------------
  // Quantization
  // ---------------------------------------------------------------------------

  /** Get clip trigger quantization */
  getClipTriggerQuantization: (): OSCMessage => ({
    address: '/live/song/get/clip_trigger_quantization',
    args: []
  }),

  /** Set clip trigger quantization */
  setClipTriggerQuantization: (value: QuantizationValue): OSCMessage => ({
    address: '/live/song/set/clip_trigger_quantization',
    args: [QuantizationValues[value]]
  }),

  /** Get MIDI recording quantization */
  getMidiRecordingQuantization: (): OSCMessage => ({
    address: '/live/song/get/midi_recording_quantization',
    args: []
  }),

  /** Set MIDI recording quantization */
  setMidiRecordingQuantization: (value: QuantizationValue): OSCMessage => ({
    address: '/live/song/set/midi_recording_quantization',
    args: [QuantizationValues[value]]
  }),

  // ---------------------------------------------------------------------------
  // Groove
  // ---------------------------------------------------------------------------

  /** Get groove amount */
  getGrooveAmount: (): OSCMessage => ({ address: '/live/song/get/groove_amount', args: [] }),

  /** Set groove amount (0.0-1.0) */
  setGrooveAmount: (amount: number): OSCMessage => ({
    address: '/live/song/set/groove_amount',
    args: [amount]
  }),

  // ---------------------------------------------------------------------------
  // Scale
  // ---------------------------------------------------------------------------

  /** Get root note (0-11) */
  getRootNote: (): OSCMessage => ({ address: '/live/song/get/root_note', args: [] }),

  /** Get scale name */
  getScaleName: (): OSCMessage => ({ address: '/live/song/get/scale_name', args: [] }),

  // ---------------------------------------------------------------------------
  // Cue Points
  // ---------------------------------------------------------------------------

  /** Get all cue points */
  getCuePoints: (): OSCMessage => ({ address: '/live/song/get/cue_points', args: [] }),

  /** Add or delete cue point at time */
  addOrDeleteCuePoint: (time: number): OSCMessage => ({
    address: '/live/song/cue_point/add_or_delete',
    args: [time]
  }),

  /** Set cue point name */
  setCuePointName: (time: number, name: string): OSCMessage => ({
    address: '/live/song/cue_point/set/name',
    args: [time, name]
  }),

  // ---------------------------------------------------------------------------
  // Track/Scene Management
  // ---------------------------------------------------------------------------

  /** Get number of tracks */
  getNumTracks: (): OSCMessage => ({ address: '/live/song/get/num_tracks', args: [] }),

  /** Start listening to track count changes */
  startListenNumTracks: (): OSCMessage => ({ address: '/live/song/start_listen/num_tracks', args: [] }),

  /** Stop listening to track count changes */
  stopListenNumTracks: (): OSCMessage => ({ address: '/live/song/stop_listen/num_tracks', args: [] }),

  /** Get number of scenes */
  getNumScenes: (): OSCMessage => ({ address: '/live/song/get/num_scenes', args: [] }),

  /** Start listening to scene count changes */
  startListenNumScenes: (): OSCMessage => ({ address: '/live/song/start_listen/num_scenes', args: [] }),

  /** Stop listening to scene count changes */
  stopListenNumScenes: (): OSCMessage => ({ address: '/live/song/stop_listen/num_scenes', args: [] }),

  /** Get all track names */
  getTrackNames: (): OSCMessage => ({ address: '/live/song/get/track_names', args: [] }),

  /** Get full track data (bulk sync) */
  getTrackData: (): OSCMessage => ({ address: '/live/song/get/track_data', args: [] }),

  /** Create new audio track */
  createAudioTrack: (index?: number): OSCMessage => ({
    address: '/live/song/create_audio_track',
    args: index !== undefined ? [index] : []
  }),

  /** Create new MIDI track */
  createMidiTrack: (index?: number): OSCMessage => ({
    address: '/live/song/create_midi_track',
    args: index !== undefined ? [index] : []
  }),

  /** Create new return track */
  createReturnTrack: (): OSCMessage => ({ address: '/live/song/create_return_track', args: [] }),

  /** Create new scene */
  createScene: (index?: number): OSCMessage => ({
    address: '/live/song/create_scene',
    args: index !== undefined ? [index] : []
  }),

  /** Delete track by index */
  deleteTrack: (trackId: number): OSCMessage => ({
    address: '/live/song/delete_track',
    args: [trackId]
  }),

  /** Delete return track by index */
  deleteReturnTrack: (returnId: number): OSCMessage => ({
    address: '/live/song/delete_return_track',
    args: [returnId]
  }),

  /** Delete scene by index */
  deleteScene: (sceneId: number): OSCMessage => ({
    address: '/live/song/delete_scene',
    args: [sceneId]
  }),

  /** Duplicate track */
  duplicateTrack: (trackId: number): OSCMessage => ({
    address: '/live/song/duplicate_track',
    args: [trackId]
  }),

  /** Duplicate scene */
  duplicateScene: (sceneId: number): OSCMessage => ({
    address: '/live/song/duplicate_scene',
    args: [sceneId]
  }),

  // ---------------------------------------------------------------------------
  // Nudge
  // ---------------------------------------------------------------------------

  /** Get nudge down state */
  getNudgeDown: (): OSCMessage => ({ address: '/live/song/get/nudge_down', args: [] }),

  /** Set nudge down */
  setNudgeDown: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/nudge_down',
    args: [enabled ? 1 : 0]
  }),

  /** Get nudge up state */
  getNudgeUp: (): OSCMessage => ({ address: '/live/song/get/nudge_up', args: [] }),

  /** Set nudge up */
  setNudgeUp: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/nudge_up',
    args: [enabled ? 1 : 0]
  }),

  // ---------------------------------------------------------------------------
  // Undo State
  // ---------------------------------------------------------------------------

  /** Can undo? */
  getCanUndo: (): OSCMessage => ({ address: '/live/song/get/can_undo', args: [] }),

  /** Can redo? */
  getCanRedo: (): OSCMessage => ({ address: '/live/song/get/can_redo', args: [] }),

  /** Back to arranger */
  getBackToArranger: (): OSCMessage => ({ address: '/live/song/get/back_to_arranger', args: [] }),

  /** Set back to arranger */
  setBackToArranger: (enabled: boolean): OSCMessage => ({
    address: '/live/song/set/back_to_arranger',
    args: [enabled ? 1 : 0]
  }),
};

// =============================================================================
// View API
// =============================================================================

export const view = {
  // ---------------------------------------------------------------------------
  // Selected Track
  // ---------------------------------------------------------------------------

  /** Get selected track index */
  getSelectedTrack: (): OSCMessage => ({ address: '/live/view/get/selected_track', args: [] }),

  /** Set selected track */
  setSelectedTrack: (trackId: number): OSCMessage => ({
    address: '/live/view/set/selected_track',
    args: [trackId]
  }),

  /** Start listening to selected track changes */
  startListenSelectedTrack: (): OSCMessage => ({
    address: '/live/view/start_listen/selected_track',
    args: []
  }),

  /** Stop listening to selected track changes */
  stopListenSelectedTrack: (): OSCMessage => ({
    address: '/live/view/stop_listen/selected_track',
    args: []
  }),

  // ---------------------------------------------------------------------------
  // Selected Scene
  // ---------------------------------------------------------------------------

  /** Get selected scene index */
  getSelectedScene: (): OSCMessage => ({ address: '/live/view/get/selected_scene', args: [] }),

  /** Set selected scene */
  setSelectedScene: (sceneId: number): OSCMessage => ({
    address: '/live/view/set/selected_scene',
    args: [sceneId]
  }),

  /** Start listening to selected scene changes */
  startListenSelectedScene: (): OSCMessage => ({
    address: '/live/view/start_listen/selected_scene',
    args: []
  }),

  /** Stop listening to selected scene changes */
  stopListenSelectedScene: (): OSCMessage => ({
    address: '/live/view/stop_listen/selected_scene',
    args: []
  }),

  // ---------------------------------------------------------------------------
  // Selected Clip
  // ---------------------------------------------------------------------------

  /** Get selected clip */
  getSelectedClip: (): OSCMessage => ({ address: '/live/view/get/selected_clip', args: [] }),

  /** Set selected clip */
  setSelectedClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/view/set/selected_clip',
    args: [trackId, sceneId]
  }),

  // ---------------------------------------------------------------------------
  // Selected Device
  // ---------------------------------------------------------------------------

  /** Get selected device */
  getSelectedDevice: (): OSCMessage => ({ address: '/live/view/get/selected_device', args: [] }),

  /** Set selected device */
  setSelectedDevice: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/view/set/selected_device',
    args: [trackId, deviceId]
  }),
};

// =============================================================================
// Track API
// =============================================================================

export const track = {
  // ---------------------------------------------------------------------------
  // Track Info
  // ---------------------------------------------------------------------------

  /** Get track name */
  getName: (trackId: number): OSCMessage => ({
    address: '/live/track/get/name',
    args: [trackId]
  }),

  /** Set track name */
  setName: (trackId: number, name: string): OSCMessage => ({
    address: '/live/track/set/name',
    args: [trackId, name]
  }),

  /** Get track color (RGB integer) */
  getColor: (trackId: number): OSCMessage => ({
    address: '/live/track/get/color',
    args: [trackId]
  }),

  /** Set track color */
  setColor: (trackId: number, color: number): OSCMessage => ({
    address: '/live/track/set/color',
    args: [trackId, color]
  }),

  /** Get track color index */
  getColorIndex: (trackId: number): OSCMessage => ({
    address: '/live/track/get/color_index',
    args: [trackId]
  }),

  /** Set track color index */
  setColorIndex: (trackId: number, colorIndex: number): OSCMessage => ({
    address: '/live/track/set/color_index',
    args: [trackId, colorIndex]
  }),

  // ---------------------------------------------------------------------------
  // Volume & Pan
  // ---------------------------------------------------------------------------

  /** Get track volume (0.0-1.0, 0.85 = 0dB) */
  getVolume: (trackId: number): OSCMessage => ({
    address: '/live/track/get/volume',
    args: [trackId]
  }),

  /** Set track volume */
  setVolume: (trackId: number, value: number): OSCMessage => ({
    address: '/live/track/set/volume',
    args: [trackId, value]
  }),

  /** Start listening to volume changes */
  startListenVolume: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/volume',
    args: [trackId]
  }),

  /** Stop listening to volume changes */
  stopListenVolume: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/volume',
    args: [trackId]
  }),

  /** Get track panning (-1.0 to 1.0) */
  getPan: (trackId: number): OSCMessage => ({
    address: '/live/track/get/panning',
    args: [trackId]
  }),

  /** Set track panning */
  setPan: (trackId: number, value: number): OSCMessage => ({
    address: '/live/track/set/panning',
    args: [trackId, value]
  }),

  /** Start listening to panning changes */
  startListenPan: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/panning',
    args: [trackId]
  }),

  /** Stop listening to panning changes */
  stopListenPan: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/panning',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Mute, Solo, Arm
  // ---------------------------------------------------------------------------

  /** Get mute state */
  getMute: (trackId: number): OSCMessage => ({
    address: '/live/track/get/mute',
    args: [trackId]
  }),

  /** Set mute state */
  setMute: (trackId: number, muted: boolean): OSCMessage => ({
    address: '/live/track/set/mute',
    args: [trackId, muted ? 1 : 0]
  }),

  /** Start listening to mute changes */
  startListenMute: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/mute',
    args: [trackId]
  }),

  /** Stop listening to mute changes */
  stopListenMute: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/mute',
    args: [trackId]
  }),

  /** Get solo state */
  getSolo: (trackId: number): OSCMessage => ({
    address: '/live/track/get/solo',
    args: [trackId]
  }),

  /** Set solo state */
  setSolo: (trackId: number, soloed: boolean): OSCMessage => ({
    address: '/live/track/set/solo',
    args: [trackId, soloed ? 1 : 0]
  }),

  /** Start listening to solo changes */
  startListenSolo: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/solo',
    args: [trackId]
  }),

  /** Stop listening to solo changes */
  stopListenSolo: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/solo',
    args: [trackId]
  }),

  /** Get arm state */
  getArm: (trackId: number): OSCMessage => ({
    address: '/live/track/get/arm',
    args: [trackId]
  }),

  /** Set arm state */
  setArm: (trackId: number, armed: boolean): OSCMessage => ({
    address: '/live/track/set/arm',
    args: [trackId, armed ? 1 : 0]
  }),

  /** Start listening to arm changes */
  startListenArm: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/arm',
    args: [trackId]
  }),

  /** Stop listening to arm changes */
  stopListenArm: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/arm',
    args: [trackId]
  }),

  /** Check if track can be armed */
  getCanBeArmed: (trackId: number): OSCMessage => ({
    address: '/live/track/get/can_be_armed',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Sends
  // ---------------------------------------------------------------------------

  /** Get send level */
  getSend: (trackId: number, sendId: number): OSCMessage => ({
    address: '/live/track/get/send',
    args: [trackId, sendId]
  }),

  /** Set send level */
  setSend: (trackId: number, sendId: number, value: number): OSCMessage => ({
    address: '/live/track/set/send',
    args: [trackId, sendId, value]
  }),

  /** Start listening to send changes */
  startListenSend: (trackId: number, sendId: number): OSCMessage => ({
    address: '/live/track/start_listen/send',
    args: [trackId, sendId]
  }),

  /** Stop listening to send changes */
  stopListenSend: (trackId: number, sendId: number): OSCMessage => ({
    address: '/live/track/stop_listen/send',
    args: [trackId, sendId]
  }),

  // ---------------------------------------------------------------------------
  // Meters
  // ---------------------------------------------------------------------------

  /** Get output meter level */
  getOutputMeterLevel: (trackId: number): OSCMessage => ({
    address: '/live/track/get/output_meter_level',
    args: [trackId]
  }),

  /** Get output meter left */
  getOutputMeterLeft: (trackId: number): OSCMessage => ({
    address: '/live/track/get/output_meter_left',
    args: [trackId]
  }),

  /** Get output meter right */
  getOutputMeterRight: (trackId: number): OSCMessage => ({
    address: '/live/track/get/output_meter_right',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------

  /** Get input routing type */
  getInputRoutingType: (trackId: number): OSCMessage => ({
    address: '/live/track/get/input_routing_type',
    args: [trackId]
  }),

  /** Set input routing type */
  setInputRoutingType: (trackId: number, routingType: string): OSCMessage => ({
    address: '/live/track/set/input_routing_type',
    args: [trackId, routingType]
  }),

  /** Get input routing channel */
  getInputRoutingChannel: (trackId: number): OSCMessage => ({
    address: '/live/track/get/input_routing_channel',
    args: [trackId]
  }),

  /** Set input routing channel */
  setInputRoutingChannel: (trackId: number, channel: string): OSCMessage => ({
    address: '/live/track/set/input_routing_channel',
    args: [trackId, channel]
  }),

  /** Get output routing type */
  getOutputRoutingType: (trackId: number): OSCMessage => ({
    address: '/live/track/get/output_routing_type',
    args: [trackId]
  }),

  /** Set output routing type */
  setOutputRoutingType: (trackId: number, routingType: string): OSCMessage => ({
    address: '/live/track/set/output_routing_type',
    args: [trackId, routingType]
  }),

  /** Get output routing channel */
  getOutputRoutingChannel: (trackId: number): OSCMessage => ({
    address: '/live/track/get/output_routing_channel',
    args: [trackId]
  }),

  /** Set output routing channel */
  setOutputRoutingChannel: (trackId: number, channel: string): OSCMessage => ({
    address: '/live/track/set/output_routing_channel',
    args: [trackId, channel]
  }),

  /** Get available input routing types */
  getAvailableInputRoutingTypes: (trackId: number): OSCMessage => ({
    address: '/live/track/get/available_input_routing_types',
    args: [trackId]
  }),

  /** Get available input routing channels */
  getAvailableInputRoutingChannels: (trackId: number): OSCMessage => ({
    address: '/live/track/get/available_input_routing_channels',
    args: [trackId]
  }),

  /** Get available output routing types */
  getAvailableOutputRoutingTypes: (trackId: number): OSCMessage => ({
    address: '/live/track/get/available_output_routing_types',
    args: [trackId]
  }),

  /** Get available output routing channels */
  getAvailableOutputRoutingChannels: (trackId: number): OSCMessage => ({
    address: '/live/track/get/available_output_routing_channels',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Monitoring
  // ---------------------------------------------------------------------------

  /** Get current monitoring state */
  getCurrentMonitoringState: (trackId: number): OSCMessage => ({
    address: '/live/track/get/current_monitoring_state',
    args: [trackId]
  }),

  /** Set current monitoring state (0=In, 1=Auto, 2=Off) */
  setCurrentMonitoringState: (trackId: number, state: 0 | 1 | 2): OSCMessage => ({
    address: '/live/track/set/current_monitoring_state',
    args: [trackId, state]
  }),

  // ---------------------------------------------------------------------------
  // Clip Playback
  // ---------------------------------------------------------------------------

  /** Get currently playing slot index (-1 if none) */
  getPlayingSlotIndex: (trackId: number): OSCMessage => ({
    address: '/live/track/get/playing_slot_index',
    args: [trackId]
  }),

  /** Start listening to playing slot changes */
  startListenPlayingSlot: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/playing_slot_index',
    args: [trackId]
  }),

  /** Stop listening to playing slot changes */
  stopListenPlayingSlot: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/playing_slot_index',
    args: [trackId]
  }),

  /** Get fired (triggered) slot index (-1 if none) */
  getFiredSlotIndex: (trackId: number): OSCMessage => ({
    address: '/live/track/get/fired_slot_index',
    args: [trackId]
  }),

  /** Start listening to fired slot changes */
  startListenFiredSlot: (trackId: number): OSCMessage => ({
    address: '/live/track/start_listen/fired_slot_index',
    args: [trackId]
  }),

  /** Stop listening to fired slot changes */
  stopListenFiredSlot: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_listen/fired_slot_index',
    args: [trackId]
  }),

  /** Stop all clips on track */
  stop: (trackId: number): OSCMessage => ({
    address: '/live/track/stop_all_clips',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Group/Fold
  // ---------------------------------------------------------------------------

  /** Check if track is foldable (is a group track) */
  getIsFoldable: (trackId: number): OSCMessage => ({
    address: '/live/track/get/is_foldable',
    args: [trackId]
  }),

  /** Check if track is grouped */
  getIsGrouped: (trackId: number): OSCMessage => ({
    address: '/live/track/get/is_grouped',
    args: [trackId]
  }),

  /** Get fold state (collapsed/expanded) */
  getFoldState: (trackId: number): OSCMessage => ({
    address: '/live/track/get/fold_state',
    args: [trackId]
  }),

  /** Set fold state */
  setFoldState: (trackId: number, folded: boolean): OSCMessage => ({
    address: '/live/track/set/fold_state',
    args: [trackId, folded ? 1 : 0]
  }),

  /** Check if track is visible */
  getIsVisible: (trackId: number): OSCMessage => ({
    address: '/live/track/get/is_visible',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // I/O Info
  // ---------------------------------------------------------------------------

  /** Check if track has audio input */
  getHasAudioInput: (trackId: number): OSCMessage => ({
    address: '/live/track/get/has_audio_input',
    args: [trackId]
  }),

  /** Check if track has audio output */
  getHasAudioOutput: (trackId: number): OSCMessage => ({
    address: '/live/track/get/has_audio_output',
    args: [trackId]
  }),

  /** Check if track has MIDI input */
  getHasMidiInput: (trackId: number): OSCMessage => ({
    address: '/live/track/get/has_midi_input',
    args: [trackId]
  }),

  /** Check if track has MIDI output */
  getHasMidiOutput: (trackId: number): OSCMessage => ({
    address: '/live/track/get/has_midi_output',
    args: [trackId]
  }),

  // ---------------------------------------------------------------------------
  // Bulk Queries
  // ---------------------------------------------------------------------------

  /** Get number of devices on track */
  getNumDevices: (trackId: number): OSCMessage => ({
    address: '/live/track/get/num_devices',
    args: [trackId]
  }),

  /** Get all clip names on track */
  getClipNames: (trackId: number): OSCMessage => ({
    address: '/live/track/get/clips/name',
    args: [trackId]
  }),

  /** Get all clip lengths on track */
  getClipLengths: (trackId: number): OSCMessage => ({
    address: '/live/track/get/clips/length',
    args: [trackId]
  }),

  /** Get all clip colors on track */
  getClipColors: (trackId: number): OSCMessage => ({
    address: '/live/track/get/clips/color',
    args: [trackId]
  }),

  /** Get all device names on track */
  getDeviceNames: (trackId: number): OSCMessage => ({
    address: '/live/track/get/devices/name',
    args: [trackId]
  }),

  /** Get all device types on track */
  getDeviceTypes: (trackId: number): OSCMessage => ({
    address: '/live/track/get/devices/type',
    args: [trackId]
  }),

  /** Get all device class names on track */
  getDeviceClassNames: (trackId: number): OSCMessage => ({
    address: '/live/track/get/devices/class_name',
    args: [trackId]
  }),
};

// =============================================================================
// Clip Slot API
// =============================================================================

export const clipSlot = {
  /** Fire clip slot (start/stop clip) */
  fire: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/fire',
    args: [trackId, sceneId]
  }),

  /** Stop clip slot */
  stop: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/stop',
    args: [trackId, sceneId]
  }),

  /** Check if clip slot has a clip */
  hasClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/get/has_clip',
    args: [trackId, sceneId]
  }),

  /** Start listening to has_clip changes */
  startListenHasClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/start_listen/has_clip',
    args: [trackId, sceneId]
  }),

  /** Stop listening to has_clip changes */
  stopListenHasClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/stop_listen/has_clip',
    args: [trackId, sceneId]
  }),

  /** Get has stop button */
  getHasStopButton: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/get/has_stop_button',
    args: [trackId, sceneId]
  }),

  /** Set has stop button */
  setHasStopButton: (trackId: number, sceneId: number, hasButton: boolean): OSCMessage => ({
    address: '/live/clip_slot/set/has_stop_button',
    args: [trackId, sceneId, hasButton ? 1 : 0]
  }),

  /** Create a new clip in the slot */
  createClip: (trackId: number, sceneId: number, length: number): OSCMessage => ({
    address: '/live/clip_slot/create_clip',
    args: [trackId, sceneId, length]
  }),

  /** Delete clip from slot */
  deleteClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip_slot/delete_clip',
    args: [trackId, sceneId]
  }),

  /** Duplicate clip to another slot */
  duplicateClipTo: (
    sourceTrack: number,
    sourceScene: number,
    targetTrack: number,
    targetScene: number
  ): OSCMessage => ({
    address: '/live/clip_slot/duplicate_clip_to',
    args: [sourceTrack, sourceScene, targetTrack, targetScene]
  }),
};

// =============================================================================
// Clip API
// =============================================================================

export const clip = {
  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  /** Fire clip (start playing) */
  fire: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/fire',
    args: [trackId, sceneId]
  }),

  /** Stop clip */
  stop: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/stop',
    args: [trackId, sceneId]
  }),

  /** Get playing status */
  getPlayingStatus: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/playing_status',
    args: [trackId, sceneId]
  }),

  /** Get playing position */
  getPlayingPosition: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/playing_position',
    args: [trackId, sceneId]
  }),

  /** Start listening to playing position */
  startListenPlayingPosition: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/start_listen/playing_position',
    args: [trackId, sceneId]
  }),

  /** Stop listening to playing position */
  stopListenPlayingPosition: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/stop_listen/playing_position',
    args: [trackId, sceneId]
  }),

  // ---------------------------------------------------------------------------
  // Basic Properties
  // ---------------------------------------------------------------------------

  /** Get clip name */
  getName: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/name',
    args: [trackId, sceneId]
  }),

  /** Set clip name */
  setName: (trackId: number, sceneId: number, name: string): OSCMessage => ({
    address: '/live/clip/set/name',
    args: [trackId, sceneId, name]
  }),

  /** Get clip color */
  getColor: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/color',
    args: [trackId, sceneId]
  }),

  /** Set clip color */
  setColor: (trackId: number, sceneId: number, color: number): OSCMessage => ({
    address: '/live/clip/set/color',
    args: [trackId, sceneId, color]
  }),

  /** Get clip color index */
  getColorIndex: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/color_index',
    args: [trackId, sceneId]
  }),

  /** Set clip color index */
  setColorIndex: (trackId: number, sceneId: number, colorIndex: number): OSCMessage => ({
    address: '/live/clip/set/color_index',
    args: [trackId, sceneId, colorIndex]
  }),

  // ---------------------------------------------------------------------------
  // Length & Loop
  // ---------------------------------------------------------------------------

  /** Get clip length in beats */
  getLength: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/length',
    args: [trackId, sceneId]
  }),

  /** Get loop start */
  getLoopStart: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/loop_start',
    args: [trackId, sceneId]
  }),

  /** Set loop start */
  setLoopStart: (trackId: number, sceneId: number, beats: number): OSCMessage => ({
    address: '/live/clip/set/loop_start',
    args: [trackId, sceneId, beats]
  }),

  /** Get loop end */
  getLoopEnd: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/loop_end',
    args: [trackId, sceneId]
  }),

  /** Set loop end */
  setLoopEnd: (trackId: number, sceneId: number, beats: number): OSCMessage => ({
    address: '/live/clip/set/loop_end',
    args: [trackId, sceneId, beats]
  }),

  /** Duplicate the loop */
  duplicateLoop: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/duplicate_loop',
    args: [trackId, sceneId]
  }),

  /** Get start marker */
  getStartMarker: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/start_marker',
    args: [trackId, sceneId]
  }),

  /** Set start marker */
  setStartMarker: (trackId: number, sceneId: number, beats: number): OSCMessage => ({
    address: '/live/clip/set/start_marker',
    args: [trackId, sceneId, beats]
  }),

  /** Get end marker */
  getEndMarker: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/end_marker',
    args: [trackId, sceneId]
  }),

  /** Set end marker */
  setEndMarker: (trackId: number, sceneId: number, beats: number): OSCMessage => ({
    address: '/live/clip/set/end_marker',
    args: [trackId, sceneId, beats]
  }),

  // ---------------------------------------------------------------------------
  // Launch Settings
  // ---------------------------------------------------------------------------

  /** Get launch mode */
  getLaunchMode: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/launch_mode',
    args: [trackId, sceneId]
  }),

  /** Set launch mode (0=trigger, 1=gate, 2=toggle, 3=repeat) */
  setLaunchMode: (trackId: number, sceneId: number, mode: number): OSCMessage => ({
    address: '/live/clip/set/launch_mode',
    args: [trackId, sceneId, mode]
  }),

  /** Get launch quantization */
  getLaunchQuantization: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/launch_quantization',
    args: [trackId, sceneId]
  }),

  /** Set launch quantization */
  setLaunchQuantization: (trackId: number, sceneId: number, value: number): OSCMessage => ({
    address: '/live/clip/set/launch_quantization',
    args: [trackId, sceneId, value]
  }),

  /** Get legato mode */
  getLegato: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/legato',
    args: [trackId, sceneId]
  }),

  /** Set legato mode */
  setLegato: (trackId: number, sceneId: number, enabled: boolean): OSCMessage => ({
    address: '/live/clip/set/legato',
    args: [trackId, sceneId, enabled ? 1 : 0]
  }),

  // ---------------------------------------------------------------------------
  // Clip Type
  // ---------------------------------------------------------------------------

  /** Check if clip is audio */
  getIsAudioClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/is_audio_clip',
    args: [trackId, sceneId]
  }),

  /** Check if clip is MIDI */
  getIsMidiClip: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/is_midi_clip',
    args: [trackId, sceneId]
  }),

  // ---------------------------------------------------------------------------
  // Audio Clip Properties
  // ---------------------------------------------------------------------------

  /** Get clip gain (audio clips) */
  getGain: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/gain',
    args: [trackId, sceneId]
  }),

  /** Set clip gain */
  setGain: (trackId: number, sceneId: number, gain: number): OSCMessage => ({
    address: '/live/clip/set/gain',
    args: [trackId, sceneId, gain]
  }),

  /** Get warping state */
  getWarping: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/warping',
    args: [trackId, sceneId]
  }),

  /** Set warping state */
  setWarping: (trackId: number, sceneId: number, enabled: boolean): OSCMessage => ({
    address: '/live/clip/set/warping',
    args: [trackId, sceneId, enabled ? 1 : 0]
  }),

  /** Get warp mode */
  getWarpMode: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/warp_mode',
    args: [trackId, sceneId]
  }),

  /** Set warp mode */
  setWarpMode: (trackId: number, sceneId: number, mode: number): OSCMessage => ({
    address: '/live/clip/set/warp_mode',
    args: [trackId, sceneId, mode]
  }),

  /** Get pitch coarse */
  getPitchCoarse: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/pitch_coarse',
    args: [trackId, sceneId]
  }),

  /** Set pitch coarse (semitones) */
  setPitchCoarse: (trackId: number, sceneId: number, semitones: number): OSCMessage => ({
    address: '/live/clip/set/pitch_coarse',
    args: [trackId, sceneId, semitones]
  }),

  /** Get pitch fine */
  getPitchFine: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/pitch_fine',
    args: [trackId, sceneId]
  }),

  /** Set pitch fine (cents) */
  setPitchFine: (trackId: number, sceneId: number, cents: number): OSCMessage => ({
    address: '/live/clip/set/pitch_fine',
    args: [trackId, sceneId, cents]
  }),

  /** Get RAM mode */
  getRamMode: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/ram_mode',
    args: [trackId, sceneId]
  }),

  /** Set RAM mode */
  setRamMode: (trackId: number, sceneId: number, enabled: boolean): OSCMessage => ({
    address: '/live/clip/set/ram_mode',
    args: [trackId, sceneId, enabled ? 1 : 0]
  }),

  /** Get file path (audio clips) */
  getFilePath: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/file_path',
    args: [trackId, sceneId]
  }),

  /** Get sample length (audio clips) */
  getSampleLength: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/sample_length',
    args: [trackId, sceneId]
  }),

  // ---------------------------------------------------------------------------
  // MIDI Clip Notes
  // ---------------------------------------------------------------------------

  /** Get all notes in clip */
  getNotes: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/notes',
    args: [trackId, sceneId]
  }),

  /** Add notes to clip - notes format: [pitch, start, duration, velocity, mute][] */
  addNotes: (trackId: number, sceneId: number, notes: number[][]): OSCMessage => ({
    address: '/live/clip/add/notes',
    args: [trackId, sceneId, ...notes.flat()]
  }),

  /** Remove notes from clip - notes format: [pitch, start, duration, velocity, mute][] */
  removeNotes: (trackId: number, sceneId: number, notes: number[][]): OSCMessage => ({
    address: '/live/clip/remove/notes',
    args: [trackId, sceneId, ...notes.flat()]
  }),

  // ---------------------------------------------------------------------------
  // MIDI Clip Properties
  // ---------------------------------------------------------------------------

  /** Get muted state */
  getMuted: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/muted',
    args: [trackId, sceneId]
  }),

  /** Set muted state */
  setMuted: (trackId: number, sceneId: number, muted: boolean): OSCMessage => ({
    address: '/live/clip/set/muted',
    args: [trackId, sceneId, muted ? 1 : 0]
  }),

  /** Get velocity amount */
  getVelocityAmount: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/velocity_amount',
    args: [trackId, sceneId]
  }),

  /** Set velocity amount */
  setVelocityAmount: (trackId: number, sceneId: number, amount: number): OSCMessage => ({
    address: '/live/clip/set/velocity_amount',
    args: [trackId, sceneId, amount]
  }),

  /** Check if clip has groove */
  getHasGroove: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/has_groove',
    args: [trackId, sceneId]
  }),

  /** Get clip position (for arrangement clips) */
  getPosition: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/position',
    args: [trackId, sceneId]
  }),

  /** Set clip position */
  setPosition: (trackId: number, sceneId: number, beats: number): OSCMessage => ({
    address: '/live/clip/set/position',
    args: [trackId, sceneId, beats]
  }),

  /** Get start time (arrangement clips) */
  getStartTime: (trackId: number, sceneId: number): OSCMessage => ({
    address: '/live/clip/get/start_time',
    args: [trackId, sceneId]
  }),
};

// =============================================================================
// Scene API
// =============================================================================

export const scene = {
  /** Fire scene */
  fire: (sceneId: number): OSCMessage => ({
    address: '/live/scene/fire',
    args: [sceneId]
  }),

  /** Fire scene as if it were the selected scene */
  fireAsSelected: (sceneId: number): OSCMessage => ({
    address: '/live/scene/fire_as_selected',
    args: [sceneId]
  }),

  /** Fire the currently selected scene */
  fireSelected: (): OSCMessage => ({
    address: '/live/scene/fire_selected',
    args: []
  }),

  /** Get scene name */
  getName: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/name',
    args: [sceneId]
  }),

  /** Set scene name */
  setName: (sceneId: number, name: string): OSCMessage => ({
    address: '/live/scene/set/name',
    args: [sceneId, name]
  }),

  /** Get scene color */
  getColor: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/color',
    args: [sceneId]
  }),

  /** Set scene color */
  setColor: (sceneId: number, color: number): OSCMessage => ({
    address: '/live/scene/set/color',
    args: [sceneId, color]
  }),

  /** Get scene color index */
  getColorIndex: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/color_index',
    args: [sceneId]
  }),

  /** Set scene color index */
  setColorIndex: (sceneId: number, colorIndex: number): OSCMessage => ({
    address: '/live/scene/set/color_index',
    args: [sceneId, colorIndex]
  }),

  /** Check if scene is empty */
  getIsEmpty: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/is_empty',
    args: [sceneId]
  }),

  /** Check if scene is triggered */
  getIsTriggered: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/is_triggered',
    args: [sceneId]
  }),

  /** Get scene tempo */
  getTempo: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/tempo',
    args: [sceneId]
  }),

  /** Set scene tempo */
  setTempo: (sceneId: number, bpm: number): OSCMessage => ({
    address: '/live/scene/set/tempo',
    args: [sceneId, bpm]
  }),

  /** Check if scene tempo is enabled */
  getTempoEnabled: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/tempo_enabled',
    args: [sceneId]
  }),

  /** Set scene tempo enabled */
  setTempoEnabled: (sceneId: number, enabled: boolean): OSCMessage => ({
    address: '/live/scene/set/tempo_enabled',
    args: [sceneId, enabled ? 1 : 0]
  }),

  /** Get scene time signature numerator */
  getTimeSignatureNumerator: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/time_signature_numerator',
    args: [sceneId]
  }),

  /** Set scene time signature numerator */
  setTimeSignatureNumerator: (sceneId: number, numerator: number): OSCMessage => ({
    address: '/live/scene/set/time_signature_numerator',
    args: [sceneId, numerator]
  }),

  /** Get scene time signature denominator */
  getTimeSignatureDenominator: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/time_signature_denominator',
    args: [sceneId]
  }),

  /** Set scene time signature denominator */
  setTimeSignatureDenominator: (sceneId: number, denominator: number): OSCMessage => ({
    address: '/live/scene/set/time_signature_denominator',
    args: [sceneId, denominator]
  }),

  /** Check if scene time signature is enabled */
  getTimeSignatureEnabled: (sceneId: number): OSCMessage => ({
    address: '/live/scene/get/time_signature_enabled',
    args: [sceneId]
  }),

  /** Set scene time signature enabled */
  setTimeSignatureEnabled: (sceneId: number, enabled: boolean): OSCMessage => ({
    address: '/live/scene/set/time_signature_enabled',
    args: [sceneId, enabled ? 1 : 0]
  }),
};

// =============================================================================
// Device API
// =============================================================================

export const device = {
  /** Get device name */
  getName: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/name',
    args: [trackId, deviceId]
  }),

  /** Get device class name */
  getClassName: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/class_name',
    args: [trackId, deviceId]
  }),

  /** Get device type */
  getType: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/type',
    args: [trackId, deviceId]
  }),

  /** Check if device is on */
  getIsOn: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/is_on',
    args: [trackId, deviceId]
  }),

  /** Set device on/off */
  setIsOn: (trackId: number, deviceId: number, isOn: boolean): OSCMessage => ({
    address: '/live/device/set/is_on',
    args: [trackId, deviceId, isOn ? 1 : 0]
  }),

  /** Start listening to is_on changes */
  startListenIsOn: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/start_listen/is_on',
    args: [trackId, deviceId]
  }),

  /** Stop listening to is_on changes */
  stopListenIsOn: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/stop_listen/is_on',
    args: [trackId, deviceId]
  }),

  /** Get number of parameters */
  getNumParameters: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/num_parameters',
    args: [trackId, deviceId]
  }),

  /** Get all parameters (names, values, ranges) */
  getParameters: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters',
    args: [trackId, deviceId]
  }),

  /** Get all parameter names */
  getParametersName: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters/name',
    args: [trackId, deviceId]
  }),

  /** Get all parameter values */
  getParametersValue: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters/value',
    args: [trackId, deviceId]
  }),

  /** Get all parameter min values */
  getParametersMin: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters/min',
    args: [trackId, deviceId]
  }),

  /** Get all parameter max values */
  getParametersMax: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters/max',
    args: [trackId, deviceId]
  }),

  /** Get all parameter is_quantized values */
  getParametersIsQuantized: (trackId: number, deviceId: number): OSCMessage => ({
    address: '/live/device/get/parameters/is_quantized',
    args: [trackId, deviceId]
  }),

  /** Get single parameter value */
  getParameterValue: (trackId: number, deviceId: number, paramId: number): OSCMessage => ({
    address: '/live/device/get/parameter/value',
    args: [trackId, deviceId, paramId]
  }),

  /** Set single parameter value */
  setParameterValue: (trackId: number, deviceId: number, paramId: number, value: number): OSCMessage => ({
    address: '/live/device/set/parameter/value',
    args: [trackId, deviceId, paramId, value]
  }),

  /** Get parameter value as string */
  getParameterValueString: (trackId: number, deviceId: number, paramId: number): OSCMessage => ({
    address: '/live/device/get/parameter/value_string',
    args: [trackId, deviceId, paramId]
  }),

  /** Set multiple parameter values */
  setParametersValue: (trackId: number, deviceId: number, values: number[]): OSCMessage => ({
    address: '/live/device/set/parameters/value',
    args: [trackId, deviceId, ...values]
  }),

  /** Start listening to parameter changes */
  startListenParameter: (trackId: number, deviceId: number, paramId: number): OSCMessage => ({
    address: '/live/device/start_listen/parameter/value',
    args: [trackId, deviceId, paramId]
  }),

  /** Stop listening to parameter changes */
  stopListenParameter: (trackId: number, deviceId: number, paramId: number): OSCMessage => ({
    address: '/live/device/stop_listen/parameter/value',
    args: [trackId, deviceId, paramId]
  }),
};

// =============================================================================
// MIDI Map API
// =============================================================================

export const midiMap = {
  /** Map MIDI CC to device parameter */
  mapCC: (
    trackId: number,
    deviceId: number,
    paramId: number,
    midiChannel: number,
    ccNumber: number
  ): OSCMessage => ({
    address: '/live/midi_map/map_cc',
    args: [trackId, deviceId, paramId, midiChannel, ccNumber]
  }),
};
