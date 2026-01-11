#!/usr/bin/env bun
/**
 * Interactive Test Harness for AbletonOSC Protocol
 * Connects to the bridge and allows experimenting with the live Ableton session
 */

import {
  song, track, clip, clipSlot, scene, device, view, application,
  parseOSCResponse, isResponseType,
  type OSCMessage,
} from './src/index.js';

// Bridge connection
const WS_URL = 'ws://localhost:8080';
let ws: WebSocket | null = null;
let connected = false;

// Response tracking
const pendingResponses = new Map<string, (args: unknown[]) => void>();

// =============================================================================
// WebSocket Connection
// =============================================================================

function connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔌 Connecting to bridge at ${WS_URL}...`);

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      connected = true;
      console.log('✅ Connected to bridge\n');
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
    console.log(`📡 Ableton connected: ${msg.abletonConnected}`);
    return;
  }

  if (msg.type === 'patch' && msg.payload?._osc) {
    const osc = msg.payload._osc;
    const parsed = parseOSCResponse(osc);

    // Pretty print the response
    if (parsed.type !== 'unknown') {
      console.log(`\n📥 ${parsed.type}:`, JSON.stringify(parsed, null, 2));
    } else {
      console.log(`\n📥 OSC: ${osc.address}`, osc.args);
    }

    // Resolve any pending response
    const resolver = pendingResponses.get(osc.address);
    if (resolver) {
      resolver(osc.args);
      pendingResponses.delete(osc.address);
    }
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
    console.log(`\n📤 Sending: ${msg.address}`, msg.args);
    ws.send(JSON.stringify(clientMsg));
  } else {
    // Send raw OSC for messages not in ClientMessage type
    console.log(`\n📤 Raw OSC: ${msg.address}`, msg.args);
    // The bridge needs to handle raw OSC - for now just log
    ws.send(JSON.stringify({ type: 'osc', address: msg.address, args: msg.args }));
  }
}

function oscToClientMessage(msg: OSCMessage): any {
  // Map OSC messages to ClientMessage types that bridge understands
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
// Test Functions
// =============================================================================

async function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// Get session info
async function getSessionInfo() {
  console.log('\n📋 Getting session info...');
  send(song.getTempo());
  send(song.getIsPlaying());
  send(song.getMetronome());
  send(song.getNumTracks());
  send(song.getNumScenes());
}

// Transport controls
function play() { send(song.play()); }
function stop() { send(song.stop()); }
function toggleMetronome(on: boolean) { send(song.setMetronome(on)); }
function setTempo(bpm: number) { send(song.setTempo(bpm)); }

// Clip controls
function fireClip(trackId: number, sceneId: number) { send(clipSlot.fire(trackId, sceneId)); }
function stopClip(trackId: number, sceneId: number) { send(clipSlot.stop(trackId, sceneId)); }
function fireScene(sceneId: number) { send(scene.fire(sceneId)); }

// Track controls
function setVolume(trackId: number, vol: number) { send(track.setVolume(trackId, vol)); }
function setPan(trackId: number, pan: number) { send(track.setPan(trackId, pan)); }
function mute(trackId: number, muted: boolean) { send(track.setMute(trackId, muted)); }
function solo(trackId: number, soloed: boolean) { send(track.setSolo(trackId, soloed)); }
function arm(trackId: number, armed: boolean) { send(track.setArm(trackId, armed)); }
function stopTrack(trackId: number) { send(track.stop(trackId)); }

// =============================================================================
// Interactive REPL
// =============================================================================

async function repl() {
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder();

  console.log('\n🎹 Test Harness Ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Commands:');
  console.log('  info          - Get session info');
  console.log('  play / stop   - Transport controls');
  console.log('  tempo <bpm>   - Set tempo (e.g., tempo 128)');
  console.log('  metro on/off  - Toggle metronome');
  console.log('  fire <t> <s>  - Fire clip at track t, scene s');
  console.log('  scene <s>     - Fire scene s');
  console.log('  vol <t> <v>   - Set track t volume (0-1)');
  console.log('  pan <t> <p>   - Set track t pan (-1 to 1)');
  console.log('  mute <t>      - Toggle mute on track t');
  console.log('  solo <t>      - Toggle solo on track t');
  console.log('  arm <t>       - Toggle arm on track t');
  console.log('  stoptrack <t> - Stop all clips on track t');
  console.log('  quit          - Exit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Track toggle states
  const toggleState = { mute: new Set<number>(), solo: new Set<number>(), arm: new Set<number>() };

  process.stdout.write('> ');

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
        const [cmd, ...args] = line.split(/\s+/);

        switch (cmd.toLowerCase()) {
          case 'info':
            await getSessionInfo();
            break;
          case 'play':
            play();
            break;
          case 'stop':
            stop();
            break;
          case 'tempo':
            if (args[0]) setTempo(parseFloat(args[0]));
            else console.log('Usage: tempo <bpm>');
            break;
          case 'metro':
            toggleMetronome(args[0] === 'on');
            break;
          case 'fire':
            if (args.length >= 2) fireClip(parseInt(args[0]), parseInt(args[1]));
            else console.log('Usage: fire <track> <scene>');
            break;
          case 'scene':
            if (args[0]) fireScene(parseInt(args[0]));
            else console.log('Usage: scene <scene>');
            break;
          case 'vol':
            if (args.length >= 2) setVolume(parseInt(args[0]), parseFloat(args[1]));
            else console.log('Usage: vol <track> <value 0-1>');
            break;
          case 'pan':
            if (args.length >= 2) setPan(parseInt(args[0]), parseFloat(args[1]));
            else console.log('Usage: pan <track> <value -1 to 1>');
            break;
          case 'mute':
            if (args[0]) {
              const t = parseInt(args[0]);
              const isMuted = toggleState.mute.has(t);
              if (isMuted) toggleState.mute.delete(t);
              else toggleState.mute.add(t);
              mute(t, !isMuted);
            } else console.log('Usage: mute <track>');
            break;
          case 'solo':
            if (args[0]) {
              const t = parseInt(args[0]);
              const isSoloed = toggleState.solo.has(t);
              if (isSoloed) toggleState.solo.delete(t);
              else toggleState.solo.add(t);
              solo(t, !isSoloed);
            } else console.log('Usage: solo <track>');
            break;
          case 'arm':
            if (args[0]) {
              const t = parseInt(args[0]);
              const isArmed = toggleState.arm.has(t);
              if (isArmed) toggleState.arm.delete(t);
              else toggleState.arm.add(t);
              arm(t, !isArmed);
            } else console.log('Usage: arm <track>');
            break;
          case 'stoptrack':
            if (args[0]) stopTrack(parseInt(args[0]));
            else console.log('Usage: stoptrack <track>');
            break;
          case 'quit':
          case 'exit':
          case 'q':
            console.log('👋 Bye!');
            process.exit(0);
          default:
            console.log(`Unknown command: ${cmd}`);
        }
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
    await wait(500); // Give bridge time to send initial state
    await repl();
  } catch (err) {
    console.error('Failed to connect:', err);
    console.log('\n💡 Make sure the bridge is running: bun run bridge');
    process.exit(1);
  }
}

main();
