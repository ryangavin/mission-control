// Simple WebSocket connection to bridge
// No Svelte reactivity here - just plain TypeScript

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

type MessageHandler = (data: any) => void;

let ws: WebSocket | null = null;
let state: ConnectionState = 'disconnected';
let messageHandler: MessageHandler | null = null;
let stateHandler: ((state: ConnectionState) => void) | null = null;

const RECONNECT_DELAY = 2000;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

function getWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  const url = getWsUrl();
  console.log(`[connection] Connecting to ${url}`);

  setState('connecting');
  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[connection] Connected');
    setState('connected');
    clearReconnect();

    // Request current session state
    send({ type: 'session/request' });
  };

  ws.onclose = () => {
    console.log('[connection] Disconnected');
    setState('disconnected');
    scheduleReconnect();
  };

  ws.onerror = (e) => {
    console.error('[connection] Error:', e);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[connection] Message:', data.type);
      messageHandler?.(data);
    } catch (e) {
      console.error('[connection] Parse error:', e);
    }
  };
}

export function disconnect() {
  clearReconnect();
  if (ws) {
    ws.close();
    ws = null;
  }
  setState('disconnected');
}

export function send(message: object) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('[connection] Cannot send - not connected');
  }
}

export function onMessage(handler: MessageHandler) {
  messageHandler = handler;
}

export function onStateChange(handler: (state: ConnectionState) => void) {
  stateHandler = handler;
  // Immediately call with current state
  handler(state);
}

export function getState(): ConnectionState {
  return state;
}

function setState(newState: ConnectionState) {
  state = newState;
  stateHandler?.(newState);
}

function scheduleReconnect() {
  if (!reconnectTimeout) {
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connect();
    }, RECONNECT_DELAY);
  }
}

function clearReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}
