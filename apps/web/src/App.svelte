<script lang="ts">
  import { onMount } from 'svelte';
  import { connect, disconnect, send, onMessage, onStateChange } from './lib/connection';

  // Connection state
  let connectionState = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');
  let abletonConnected = $state(false);

  // Session data from bridge
  let tempo = $state(120);
  let isPlaying = $state(false);
  let isRecording = $state(false);

  // Track and scene data
  let tracks = $state<Array<{ id: number; name: string; color: string }>>([]);
  let scenes = $state<Array<{ id: number; name: string }>>([]);

  // Convert Ableton int color to hex
  function intToHex(color: number): string {
    if (!color) return '#666666';
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  onMount(() => {
    // Set up connection state handler
    onStateChange((state) => {
      connectionState = state;
    });

    // Set up message handler
    onMessage((msg) => {
      if (msg.type === 'connected') {
        abletonConnected = msg.abletonConnected;
      } else if (msg.type === 'session') {
        // Full session state
        const session = msg.payload;
        if (session.tempo) tempo = session.tempo;
        if (session.isPlaying !== undefined) isPlaying = session.isPlaying;
        if (session.isRecording !== undefined) isRecording = session.isRecording;
        if (session.tracks) {
          tracks = session.tracks.map((t: any) => ({
            id: t.id,
            name: t.name,
            color: intToHex(t.color),
          }));
        }
        if (session.scenes) {
          scenes = session.scenes.map((s: any) => ({
            id: s.id,
            name: s.name || `Scene ${s.id + 1}`,
          }));
        }
      } else if (msg.type === 'patch') {
        // Partial update
        const patch = msg.payload;
        if (patch.tempo) tempo = patch.tempo;
        if (patch.isPlaying !== undefined) isPlaying = patch.isPlaying;
        if (patch.isRecording !== undefined) isRecording = patch.isRecording;
      }
    });

    // Connect
    connect();

    return () => {
      disconnect();
    };
  });

  // Status text
  let statusText = $derived(
    connectionState === 'connected'
      ? (abletonConnected ? 'Connected' : 'Waiting for Ableton')
      : connectionState === 'connecting'
        ? 'Connecting...'
        : 'Disconnected'
  );

  let statusClass = $derived(
    connectionState === 'connected' && abletonConnected ? 'connected' : ''
  );

  // Actions
  function handleClipClick(trackId: number, sceneId: number) {
    send({ type: 'clip/fire', trackId, sceneId });
  }

  function handleSceneLaunch(sceneId: number) {
    send({ type: 'scene/fire', sceneId });
  }

  function handleTrackStop(trackId: number) {
    send({ type: 'track/stop', trackId });
  }

  function handleStopAll() {
    tracks.forEach(t => send({ type: 'track/stop', trackId: t.id }));
  }

  function handlePlay() {
    send({ type: 'transport/play' });
  }

  function handleStop() {
    send({ type: 'transport/stop' });
  }

  function handleRecord() {
    send({ type: 'transport/record' });
  }
</script>

<div class="app">
  <header class="header">
    <div class="transport">
      <button class="transport-btn stop" title="Stop" onclick={handleStop}>
        <span class="icon">■</span>
      </button>
      <button class="transport-btn play" class:active={isPlaying} title="Play" onclick={handlePlay}>
        <span class="icon">▶</span>
      </button>
      <button class="transport-btn record" class:active={isRecording} title="Record" onclick={handleRecord}>
        <span class="icon">●</span>
      </button>
    </div>
    <div class="tempo-section">
      <span class="tempo-value">{tempo.toFixed(2)}</span>
      <span class="tempo-label">BPM</span>
    </div>
    <div class="header-right">
      <button class="transport-btn small" title="Metronome">
        <span class="icon">🔔</span>
      </button>
      <span class="status {statusClass}">{statusText}</span>
    </div>
  </header>

  <main class="main">
    {#if tracks.length === 0}
      <div class="empty-state">
        <p class="empty-title">
          {#if connectionState !== 'connected'}
            Connecting to bridge...
          {:else if !abletonConnected}
            Waiting for Ableton Live
          {:else}
            Loading session...
          {/if}
        </p>
        <p class="empty-hint">
          {#if connectionState !== 'connected'}
            Bridge server: ws://localhost:8080
          {:else if !abletonConnected}
            Make sure Ableton is running with AbletonOSC
          {/if}
        </p>
      </div>
    {:else}
      <div class="grid-wrapper">
        <div class="grid" style="--cols: {tracks.length + 1}">
          <!-- Track headers -->
          {#each tracks as track}
            <div class="track-header" style="--color: {track.color}">
              {track.name}
            </div>
          {/each}
          <div class="scene-header">Scene</div>

          <!-- Clip grid -->
          {#each scenes as scene}
            {#each tracks as track}
              <button
                class="clip"
                style="--color: {track.color}"
                onclick={() => handleClipClick(track.id, scene.id)}
              >
                {track.name} {scene.name}
              </button>
            {/each}
            <button
              class="scene-btn"
              onclick={() => handleSceneLaunch(scene.id)}
            >
              <span class="scene-name">{scene.name}</span>
              <span class="scene-play">▶</span>
            </button>
          {/each}

          <!-- Stop row -->
          {#each tracks as track}
            <button
              class="stop-btn"
              onclick={() => handleTrackStop(track.id)}
              title="Stop {track.name}"
            >
              ■
            </button>
          {/each}
          <button class="stop-all-btn" onclick={handleStopAll}>
            Stop All
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #fff;
    overflow: hidden;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;
    flex-shrink: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status {
    color: #888;
    font-size: 12px;
  }

  .status.connected {
    color: #4f4;
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .empty-title {
    font-size: 18px;
    color: #888;
    margin: 0;
  }

  .empty-hint {
    font-size: 12px;
    color: #555;
    margin: 0;
  }

  .grid-wrapper {
    flex: 1;
    overflow: auto;
    padding: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(90px, 1fr));
    gap: 4px;
    min-width: max-content;
  }

  .track-header {
    padding: 8px 12px;
    background: #2d2d2d;
    border-left: 3px solid var(--color);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .scene-header {
    padding: 8px;
    background: #2d2d2d;
    font-size: 12px;
    text-align: center;
    color: #888;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .clip {
    padding: 12px 8px;
    min-height: 56px;
    background: color-mix(in srgb, var(--color) 20%, #3d3d3d);
    border: 1px solid var(--color);
    border-radius: 4px;
    color: #fff;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.1s, transform 0.1s;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .clip:hover {
    background: color-mix(in srgb, var(--color) 40%, #3d3d3d);
  }

  .clip:active {
    transform: scale(0.97);
  }

  .scene-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    min-height: 56px;
    background: #2d2d2d;
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .scene-btn:hover {
    background: #3d3d3d;
  }

  .scene-btn:active {
    transform: scale(0.98);
  }

  .scene-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scene-play {
    opacity: 0.5;
    font-size: 10px;
  }

  .scene-btn:hover .scene-play {
    opacity: 1;
  }

  .stop-btn {
    padding: 8px;
    min-height: 44px;
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .stop-btn:hover {
    background: #3d3d3d;
    color: #fff;
    border-color: #666;
  }

  .stop-all-btn {
    padding: 8px;
    min-height: 44px;
    background: #3d2d2d;
    border: 1px solid #5d3d3d;
    border-radius: 4px;
    color: #ff8888;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .stop-all-btn:hover {
    background: #4d3d3d;
    border-color: #ff6666;
  }

  .transport {
    display: flex;
    gap: 8px;
  }

  .transport-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #3d3d3d;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    transition: all 0.1s;
  }

  .transport-btn:hover {
    background: #4d4d4d;
  }

  .transport-btn:active {
    transform: scale(0.95);
  }

  .transport-btn .icon {
    font-size: 18px;
  }

  .transport-btn.play:hover {
    background: #2d4d2d;
    color: #4f4;
  }

  .transport-btn.play.active {
    background: #2d4d2d;
    color: #4f4;
  }

  .transport-btn.stop:hover {
    background: #3d3d3d;
  }

  .transport-btn.record:hover {
    background: #4d2d2d;
    color: #f44;
  }

  .transport-btn.record.active {
    background: #4d2d2d;
    color: #f44;
  }

  .transport-btn.small {
    width: 40px;
    height: 40px;
  }

  .transport-btn.small .icon {
    font-size: 14px;
  }

  .tempo-section {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .tempo-value {
    font-size: 24px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .tempo-label {
    font-size: 12px;
    color: #888;
  }

</style>
