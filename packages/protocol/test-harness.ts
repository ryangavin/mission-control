#!/usr/bin/env bun
/**
 * Interactive Test Harness for AbletonOSC Protocol
 * Connects to the bridge and allows experimenting with the live Ableton session
 *
 * Usage:
 *   bun test-harness.ts              # Interactive REPL mode
 *   bun test-harness.ts info         # Run single command
 *   bun test-harness.ts play         # Start playback
 *   bun test-harness.ts fire 0 0     # Fire clip at track 0, scene 0
 */

import {
  song, track, clip, clipSlot, scene, device, view, application,
  parseOSCResponse, isResponseType,
  type OSCMessage,
} from './src/index.ts';

// Bridge connection
const WS_URL = 'ws://localhost:8080';
let ws: WebSocket | null = null;
let connected = false;
let abletonConnected = false;

// =============================================================================
// WebSocket Connection
// =============================================================================

function connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Connecting to bridge at ${WS_URL}...`);

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      connected = true;
      console.log('✅ Connected to bridge');
      resolve();
    };

    ws.onclose = () => {
      connected = false;
      console.log('❌ Disconnected from bridge');
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      reject(err);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  });
}

function handleServerMessage(msg: any) {
  if (msg.type === 'connected') {
    abletonConnected = msg.abletonConnected;
    console.log(`📡 Ableton connected: ${msg.abletonConnected}`);
    return;
  }

  if (msg.type === 'session') {
    const session = msg.payload;
    console.log(`\n📦 Session received:`);
    console.log(`   Tempo: ${session.tempo} BPM`);
    console.log(`   Playing: ${session.isPlaying}`);
    console.log(`   Metronome: ${session.metronome}`);
    console.log(`   Tracks: ${session.tracks?.length || 0}`);
    console.log(`   Scenes: ${session.scenes?.length || 0}`);
    if (session.tracks?.length > 0) {
      console.log(`\n   Track names:`);
      session.tracks.slice(0, 10).forEach((t: any, i: number) => {
        console.log(`     ${i}: ${t.name} (vol: ${t.volume?.toFixed(2)}, mute: ${t.mute}, solo: ${t.solo})`);
      });
      if (session.tracks.length > 10) {
        console.log(`     ... and ${session.tracks.length - 10} more`);
      }
    }
    return;
  }

  if (msg.type === 'patch') {
    const patch = msg.payload;
    if (patch.kind) {
      // New typed patch format
      switch (patch.kind) {
        case 'transport':
          console.log(`📥 Transport: tempo=${patch.tempo}, playing=${patch.isPlaying}, metro=${patch.metronome}`);
          break;
        case 'track':
          console.log(`📥 Track ${patch.trackIndex}: ${JSON.stringify(patch.track)}`);
          break;
        case 'clip':
          console.log(`📥 Clip [${patch.trackIndex},${patch.sceneIndex}]: ${JSON.stringify(patch.clipSlot)}`);
          break;
        case 'selection':
          console.log(`📥 Selection: track=${patch.selectedTrack}, scene=${patch.selectedScene}`);
          break;
        default:
          console.log(`📥 Patch: ${JSON.stringify(patch)}`);
      }
    } else if (patch._osc) {
      // Legacy OSC format
      const osc = patch._osc;
      const parsed = parseOSCResponse(osc);
      if (parsed.type !== 'unknown') {
        console.log(`📥 ${parsed.type}:`, JSON.stringify(parsed, null, 2));
      } else {
        console.log(`📥 OSC: ${osc.address}`, osc.args);
      }
    }
    return;
  }

  if (msg.type === 'error') {
    console.log(`❌ Error: ${msg.message}`);
    return;
  }
}

// =============================================================================
// Message Sending
// =============================================================================

function send(msg: OSCMessage): void {
  if (!ws || !connected) {
    console.log('❌ Not connected');
    return;
  }

  // Convert to client message format expected by bridge
  const clientMsg = oscToClientMessage(msg);
  if (clientMsg) {
    console.log(`📤 ${msg.address}`, msg.args);
    ws.send(JSON.stringify(clientMsg));
  } else {
    // Send raw OSC for messages not in ClientMessage type
    console.log(`📤 Raw: ${msg.address}`, msg.args);
    ws.send(JSON.stringify({ type: 'osc', address: msg.address, args: msg.args }));
  }
}

function oscToClientMessage(msg: OSCMessage): any {
  const { address, args } = msg;

  // Transport
  if (address === '/live/song/start_playing') return { type: 'transport/play' };
  if (address === '/live/song/stop_playing') return { type: 'transport/stop' };
  if (address === '/live/song/set/tempo') return { type: 'transport/tempo', bpm: args[0] };
  if (address === '/live/song/set/metronome') return { type: 'transport/metronome', enabled: args[0] === 1 };

  // Clips
  if (address === '/live/clip_slot/fire') return { type: 'clip/fire', trackId: args[0], sceneId: args[1] };
  if (address === '/live/clip_slot/stop') return { type: 'clip/stop', trackId: args[0], sceneId: args[1] };

  // Scenes
  if (address === '/live/scene/fire') return { type: 'scene/fire', sceneId: args[0] };

  // Track
  if (address === '/live/track/stop_all_clips') return { type: 'track/stop', trackId: args[0] };
  if (address === '/live/track/set/volume') return { type: 'mixer/volume', trackId: args[0], value: args[1] };
  if (address === '/live/track/set/panning') return { type: 'mixer/pan', trackId: args[0], value: args[1] };
  if (address === '/live/track/set/mute') return { type: 'mixer/mute', trackId: args[0], muted: args[1] === 1 };
  if (address === '/live/track/set/solo') return { type: 'mixer/solo', trackId: args[0], soloed: args[1] === 1 };
  if (address === '/live/track/set/arm') return { type: 'mixer/arm', trackId: args[0], armed: args[1] === 1 };

  // Device
  if (address === '/live/device/set/parameter/value') {
    return { type: 'device/parameter', trackId: args[0], deviceId: args[1], parameterId: args[2], value: args[3] };
  }

  return null;
}

// =============================================================================
// Command Functions
// =============================================================================

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Session request (new protocol)
function requestSession() {
  if (!ws || !connected) {
    console.log('Not connected');
    return;
  }
  console.log('Requesting session...');
  ws.send(JSON.stringify({ type: 'session/request' }));
}

// Session info (legacy OSC queries)
function getInfo() {
  send(song.getTempo());
  send(song.getIsPlaying());
  send(song.getMetronome());
  send(song.getNumTracks());
  send(song.getNumScenes());
}

// Transport
const play = () => send(song.play());
const stopPlayback = () => send(song.stop());
const setTempo = (bpm: number) => send(song.setTempo(bpm));
const metro = (on: boolean) => send(song.setMetronome(on));

// Clips
const fire = (t: number, s: number) => send(clipSlot.fire(t, s));
const stopClip = (t: number, s: number) => send(clipSlot.stop(t, s));
const fireScene = (s: number) => send(scene.fire(s));

// Mixer
const setVol = (t: number, v: number) => send(track.setVolume(t, v));
const setPan = (t: number, p: number) => send(track.setPan(t, p));
const setMute = (t: number, m: boolean) => send(track.setMute(t, m));
const setSolo = (t: number, s: boolean) => send(track.setSolo(t, s));
const setArm = (t: number, a: boolean) => send(track.setArm(t, a));
const stopTrack = (t: number) => send(track.stop(t));

// =============================================================================
// Command Parser
// =============================================================================

async function runCommand(cmd: string, args: string[]): Promise<void> {
  switch (cmd.toLowerCase()) {
    case 'session':
      requestSession();
      break;
    case 'info':
      getInfo();
      break;
    case 'play':
      play();
      break;
    case 'stop':
      stopPlayback();
      break;
    case 'tempo':
      if (args[0]) setTempo(parseFloat(args[0]));
      else console.log('Usage: tempo <bpm>');
      break;
    case 'metro':
      metro(args[0] === 'on' || args[0] === '1');
      break;
    case 'fire':
      if (args.length >= 2) fire(parseInt(args[0]), parseInt(args[1]));
      else console.log('Usage: fire <track> <scene>');
      break;
    case 'stopclip':
      if (args.length >= 2) stopClip(parseInt(args[0]), parseInt(args[1]));
      else console.log('Usage: stopclip <track> <scene>');
      break;
    case 'scene':
      if (args[0]) fireScene(parseInt(args[0]));
      else console.log('Usage: scene <scene>');
      break;
    case 'vol':
      if (args.length >= 2) setVol(parseInt(args[0]), parseFloat(args[1]));
      else console.log('Usage: vol <track> <value 0-1>');
      break;
    case 'pan':
      if (args.length >= 2) setPan(parseInt(args[0]), parseFloat(args[1]));
      else console.log('Usage: pan <track> <value -1 to 1>');
      break;
    case 'mute':
      if (args.length >= 2) setMute(parseInt(args[0]), args[1] === 'on' || args[1] === '1');
      else console.log('Usage: mute <track> on|off');
      break;
    case 'solo':
      if (args.length >= 2) setSolo(parseInt(args[0]), args[1] === 'on' || args[1] === '1');
      else console.log('Usage: solo <track> on|off');
      break;
    case 'arm':
      if (args.length >= 2) setArm(parseInt(args[0]), args[1] === 'on' || args[1] === '1');
      else console.log('Usage: arm <track> on|off');
      break;
    case 'stoptrack':
      if (args[0]) stopTrack(parseInt(args[0]));
      else console.log('Usage: stoptrack <track>');
      break;
    case 'help':
      printHelp();
      break;
    default:
      console.log(`Unknown command: ${cmd}. Try 'help'`);
  }
}

function printHelp() {
  console.log(`
🎹 Test Harness Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  session           Request full session state (new protocol)
  info              Get session info via OSC (legacy)
  play / stop       Transport controls
  tempo <bpm>       Set tempo (e.g., tempo 128)
  metro on|off      Toggle metronome

  fire <t> <s>      Fire clip at track t, scene s
  stopclip <t> <s>  Stop clip at track t, scene s
  scene <s>         Fire scene s
  stoptrack <t>     Stop all clips on track t

  vol <t> <v>       Set track t volume (0-1, 0.85 = 0dB)
  pan <t> <p>       Set track t pan (-1 to 1)
  mute <t> on|off   Mute/unmute track t
  solo <t> on|off   Solo/unsolo track t
  arm <t> on|off    Arm/unarm track t

  help              Show this help
  quit              Exit (REPL mode only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// =============================================================================
// Interactive REPL
// =============================================================================

async function repl() {
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder();

  printHelp();
  process.stdout.write('\n> ');

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value);

    while (buffer.includes('\n')) {
      const newlineIdx = buffer.indexOf('\n');
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (line) {
        if (line === 'quit' || line === 'exit' || line === 'q') {
          console.log('👋 Bye!');
          process.exit(0);
        }

        const [cmd, ...args] = line.split(/\s+/);
        await runCommand(cmd, args);
      }

      process.stdout.write('> ');
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('       🎛️  Mission Control Protocol Test Harness');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await connect();
    await wait(300); // Give bridge time to send initial state

    // Check for command-line args
    const cliArgs = process.argv.slice(2);
    if (cliArgs.length > 0) {
      // Single command mode
      const [cmd, ...args] = cliArgs;
      await runCommand(cmd, args);
      await wait(500); // Wait for responses
      process.exit(0);
    } else {
      // Interactive REPL mode
      await repl();
    }
  } catch (err) {
    console.error('Failed to connect:', err);
    console.log('\n💡 Make sure the bridge is running: bun run bridge');
    process.exit(1);
  }
}

main();
