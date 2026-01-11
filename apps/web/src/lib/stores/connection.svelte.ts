import type { ServerMessage, ClientMessage, SessionState } from '@mission-control/protocol';

// Connection state using Svelte 5 runes
let connected = $state(false);
let abletonConnected = $state(false);
let ws: WebSocket | null = $state(null);
let session = $state<Partial<SessionState>>({
  tempo: 120,
  isPlaying: false,
  isRecording: false,
  metronome: false,
  tracks: [],
  scenes: [],
});

// Reconnection config
const RECONNECT_DELAY = 2000;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

function getWsUrl(): string {
  // In production, connect to the bridge on the same host
  // In development, you might need to specify the bridge host
  const host = window.location.hostname || 'localhost';
  return `ws://${host}:8080`;
}

export function connect() {
  if (ws?.readyState === WebSocket.OPEN) return;

  const url = getWsUrl();
  console.log(`Connecting to bridge: ${url}`);

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('Connected to bridge');
    connected = true;

    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from bridge');
    connected = false;
    abletonConnected = false;

    // Schedule reconnect
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connect();
      }, RECONNECT_DELAY);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as ServerMessage;
      handleMessage(message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };
}

export function disconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  connected = false;
  abletonConnected = false;
}

function handleMessage(message: ServerMessage) {
  switch (message.type) {
    case 'connected':
      abletonConnected = message.abletonConnected;
      console.log(`Ableton connected: ${abletonConnected}`);
      break;

    case 'session':
      // Full state update (protocol uses 'session')
      session = message.payload;
      console.log('Session state received:', message.payload);
      break;

    case 'patch':
      // Partial state update - merge with existing
      session = { ...session, ...message.payload };

      // Handle raw OSC messages for now
      if ('_osc' in message.payload) {
        handleOscMessage(message.payload._osc as { address: string; args: unknown[] });
      }
      break;

    case 'error':
      console.error('Server error:', message.message);
      break;
  }
}

function handleOscMessage(osc: { address: string; args: unknown[] }) {
  // Parse OSC messages and update session state
  const { address, args } = osc;

  if (address === '/live/song/get/tempo') {
    session = { ...session, tempo: args[0] as number };
  } else if (address === '/live/song/get/is_playing') {
    session = { ...session, isPlaying: args[0] === 1 };
  } else if (address === '/live/song/get/record_mode') {
    session = { ...session, isRecording: args[0] === 1 };
  } else if (address === '/live/song/get/metronome') {
    session = { ...session, metronome: args[0] === 1 };
  }

  // Log for debugging
  console.log(`OSC: ${address}`, args);
}

export function send(message: ClientMessage) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('Cannot send: not connected');
  }
}

// Export reactive state
export const connection = {
  get connected() { return connected; },
  get abletonConnected() { return abletonConnected; },
  get session() { return session; },
};
