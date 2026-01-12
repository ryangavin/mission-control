<script lang="ts">
  import { onMount } from 'svelte';
  import { connect, disconnect, send, onMessage, onStateChange } from './lib/connection';

  // Types from protocol
  interface ClipSlot {
    trackIndex: number;
    sceneIndex: number;
    hasClip: boolean;
    clip?: {
      name: string;
      color: number;
      isPlaying: boolean;
      isTriggered: boolean;
      isRecording: boolean;
    };
  }

  interface Track {
    id: number;
    name: string;
    color: number;
    volume: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    arm: boolean;
    playingSlotIndex: number;
    firedSlotIndex: number;
    clips: ClipSlot[];
  }

  interface Scene {
    id: number;
    name: string;
    color: number;
  }

  interface SessionState {
    tempo: number;
    isPlaying: boolean;
    isRecording: boolean;
    metronome: boolean;
    tracks: Track[];
    scenes: Scene[];
    selectedTrack: number;
    selectedScene: number;
  }

  // Connection state
  let connectionState = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');
  let abletonConnected = $state(false);

  // Full session state
  let session = $state<SessionState | null>(null);

  // Convert Ableton int color to hex
  function intToHex(color: number): string {
    if (!color) return '#666666';
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Apply patches using the kind discriminator
  function applyPatch(patch: any) {
    if (!session) return;

    switch (patch.kind) {
      case 'transport':
        if (patch.tempo !== undefined) session.tempo = patch.tempo;
        if (patch.isPlaying !== undefined) session.isPlaying = patch.isPlaying;
        if (patch.isRecording !== undefined) session.isRecording = patch.isRecording;
        if (patch.metronome !== undefined) session.metronome = patch.metronome;
        if (patch.beatTime !== undefined) session.beatTime = patch.beatTime;
        break;

      case 'track':
        session.tracks[patch.trackIndex] = patch.track;
        break;

      case 'clip':
        if (session.tracks[patch.trackIndex]?.clips) {
          session.tracks[patch.trackIndex].clips[patch.sceneIndex] = patch.clipSlot;
        }
        break;

      case 'scene':
        session.scenes[patch.sceneIndex] = patch.scene;
        break;

      case 'selection':
        if (patch.selectedTrack !== undefined) session.selectedTrack = patch.selectedTrack;
        if (patch.selectedScene !== undefined) session.selectedScene = patch.selectedScene;
        break;

      case 'structure':
        // Structure changed - request full session refresh
        console.log('[app] Structure changed, requesting new session');
        send({ type: 'session/request' });
        break;
    }
  }

  onMount(() => {
    // Set up connection state handler
    onStateChange((state) => {
      connectionState = state;
    });

    // Set up message handler
    onMessage((msg) => {
      switch (msg.type) {
        case 'connected':
          abletonConnected = msg.abletonConnected;
          break;

        case 'session':
          console.log('[app] Session received:', msg.payload.tracks?.length, 'tracks,', msg.payload.scenes?.length, 'scenes');
          session = msg.payload;
          break;

        case 'patch':
          applyPatch(msg.payload);
          break;

        case 'error':
          console.error('[app] Bridge error:', msg.message);
          break;
      }
    });

    // Connect
    connect();

    return () => {
      disconnect();
    };
  });

  // Element refs for scroll sync
  let gridScrollEl: HTMLDivElement;
  let sceneColumnEl: HTMLDivElement;

  // Sync vertical scroll between grid and scene column
  function syncScroll(source: 'grid' | 'scene') {
    if (!gridScrollEl || !sceneColumnEl) return;
    if (source === 'grid') {
      sceneColumnEl.scrollTop = gridScrollEl.scrollTop;
    } else {
      gridScrollEl.scrollTop = sceneColumnEl.scrollTop;
    }
  }

  // Derived values for easier template access
  let tempo = $derived(session?.tempo ?? 120);
  let isPlaying = $derived(session?.isPlaying ?? false);
  let isRecording = $derived(session?.isRecording ?? false);
  let beatTime = $derived(session?.beatTime ?? 0);
  let tracks = $derived(session?.tracks ?? []);
  let scenes = $derived(session?.scenes ?? []);

  // Format beat time as bar.beat.sixteenth (e.g., "1.1.1")
  function formatBeatTime(beats: number): string {
    // Ableton uses 4/4 time signature by default
    // 1 bar = 4 beats, 1 beat = 4 sixteenths
    const bar = Math.floor(beats / 4) + 1;
    const beat = Math.floor(beats % 4) + 1;
    const sixteenth = Math.floor((beats % 1) * 4) + 1;
    return `${bar}.${beat}.${sixteenth}`;
  }

  // Get clip for a specific cell
  function getClip(trackIndex: number, sceneIndex: number): ClipSlot | null {
    const track = session?.tracks[trackIndex];
    if (!track?.clips) return null;
    return track.clips[sceneIndex] ?? null;
  }

  // Determine clip state for styling
  function getClipState(trackIndex: number, sceneIndex: number): 'empty' | 'has-clip' | 'playing' | 'triggered' | 'recording' {
    const clipSlot = getClip(trackIndex, sceneIndex);
    if (!clipSlot?.hasClip) return 'empty';
    if (clipSlot.clip?.isRecording) return 'recording';
    if (clipSlot.clip?.isTriggered) return 'triggered';
    if (clipSlot.clip?.isPlaying) return 'playing';
    return 'has-clip';
  }

  // Get clip name for display
  function getClipName(trackIndex: number, sceneIndex: number): string {
    const clipSlot = getClip(trackIndex, sceneIndex);
    if (!clipSlot?.hasClip || !clipSlot.clip) return '';
    return clipSlot.clip.name || '';
  }

  // Get clip playback progress (0-1) for playing clips
  function getClipProgress(trackIndex: number, sceneIndex: number): number {
    const clipSlot = getClip(trackIndex, sceneIndex);
    if (!clipSlot?.clip?.isPlaying || !clipSlot.clip.length) return 0;
    // Calculate position within clip loop using song beat time
    const clipLength = clipSlot.clip.length;
    const position = beatTime % clipLength;
    return position / clipLength;
  }

  // Get clip color (uses clip color if available, otherwise track color)
  function getClipColor(trackIndex: number, sceneIndex: number): string {
    const clipSlot = getClip(trackIndex, sceneIndex);
    if (clipSlot?.clip?.color) {
      return intToHex(clipSlot.clip.color);
    }
    const track = session?.tracks[trackIndex];
    return track ? intToHex(track.color) : '#666666';
  }

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

  function handleMute(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Toggle - bridge will send patch with updated state
      send({ type: 'mixer/mute', trackId, muted: !track.mute });
    }
  }

  function handleSolo(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Toggle - bridge will send patch with updated state
      send({ type: 'mixer/solo', trackId, soloed: !track.solo });
    }
  }

  function handleArm(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Toggle - bridge will send patch with updated state
      send({ type: 'mixer/arm', trackId, armed: !track.arm });
    }
  }
</script>

<div class="app">
  <header class="header">
    <div class="header-left">
      <div class="playhead-section">
        <span class="label">Position</span>
        <span class="playhead-value">{formatBeatTime(beatTime)}</span>
      </div>
      <div class="tempo-section">
        <span class="label">Tempo</span>
        <span class="tempo-value">{tempo.toFixed(2)}</span>
      </div>
    </div>
    <div class="transport">
      <span class="label">Transport</span>
      <div class="transport-buttons">
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
    </div>
    <div class="header-right">
      <div class="connection-status">
        <span class="label">Status</span>
        <div class="indicators">
          <span class="status-indicator" class:connected={connectionState === 'connected'} title="Bridge connection">
            <span class="dot"></span>Bridge
          </span>
          <span class="status-indicator" class:connected={abletonConnected} title="Ableton connection">
            <span class="dot"></span>Live
          </span>
        </div>
      </div>
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
      <div class="grid-container">
        <!-- Main scrollable grid area -->
        <div class="grid-scroll" bind:this={gridScrollEl} onscroll={() => syncScroll('grid')}>
          <div class="grid" style="--cols: {tracks.length}">
            <!-- Track headers -->
            {#each tracks as track, trackIndex}
              <div class="track-header" style="--color: {intToHex(track.color)}">
                <span class="track-name">{track.name}</span>
                <div class="track-controls">
                  <button
                    class="track-btn mute"
                    class:active={track.mute}
                    onclick={() => handleMute(track.id)}
                    title="Mute"
                  >M</button>
                  <button
                    class="track-btn solo"
                    class:active={track.solo}
                    onclick={() => handleSolo(track.id)}
                    title="Solo"
                  >S</button>
                  <button
                    class="track-btn arm"
                    class:active={track.arm}
                    onclick={() => handleArm(track.id)}
                    title="Arm"
                  >●</button>
                </div>
              </div>
            {/each}

            <!-- Stop buttons row (sticky) -->
            {#each tracks as track, trackIndex}
              <button
                class="clip-stop"
                style="--color: {intToHex(track.color)}"
                onclick={() => handleTrackStop(track.id)}
                title="Stop {track.name}"
              >■</button>
            {/each}

            <!-- Clip grid -->
            {#each scenes as scene, sceneIndex}
              {@const sceneColor = intToHex(scene.color)}
              {#each tracks as track, trackIndex}
                {@const clipState = getClipState(trackIndex, sceneIndex)}
                {@const clipName = getClipName(trackIndex, sceneIndex)}
                {@const clipColor = getClipColor(trackIndex, sceneIndex)}
                {@const clipProgress = getClipProgress(trackIndex, sceneIndex)}
                <button
                  class="clip {clipState}"
                  class:armed={track.arm && clipState === 'empty'}
                  style="--color: {clipColor}; --scene-color: {sceneColor}; --progress: {clipProgress}"
                  onclick={() => handleClipClick(track.id, scene.id)}
                >
                  {#if clipState === 'playing' || clipState === 'recording'}
                    <div class="clip-progress"></div>
                  {/if}
                  {#if clipState === 'empty'}
                    {#if track.arm}
                      <span class="clip-icon record-ready">●</span>
                    {:else}
                      <span class="clip-icon stop-ready">■</span>
                    {/if}
                  {/if}
                  {#if clipState !== 'empty'}
                    <span class="clip-name">{clipName || track.name}</span>
                  {/if}
                </button>
              {/each}
            {/each}
          </div>
        </div>

        <!-- Scene column (frozen to right) -->
        <div class="scene-column" bind:this={sceneColumnEl} onscroll={() => syncScroll('scene')}>
          <div class="scene-header">Scene</div>
          <button class="clip-stop stop-all" onclick={handleStopAll} title="Stop All Clips">
            ■ All
          </button>
          {#each scenes as scene, sceneIndex}
            {@const sceneColor = intToHex(scene.color)}
            <button
              class="scene-btn"
              style="--scene-color: {sceneColor}"
              onclick={() => handleSceneLaunch(scene.id)}
            >
              <span class="scene-name">{scene.name || `Scene ${sceneIndex + 1}`}</span>
              <span class="scene-play">▶</span>
            </button>
          {/each}
        </div>
      </div>

    {/if}
  </main>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
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
    gap: 8px;
    padding: 8px;
    background: #151515;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex: 1;
  }

  .connection-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
    padding: 6px 10px;
    background: #1a1a1a;
    border-radius: 4px;
    border: 1px solid #333;
  }

  .connection-status .label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .connection-status .indicators {
    display: flex;
    gap: 6px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    color: #664444;
  }

  .status-indicator .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #442222;
  }

  .status-indicator.connected {
    color: #44aa44;
  }

  .status-indicator.connected .dot {
    background: #44ff44;
    box-shadow: 0 0 6px #44ff44;
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

  .grid-container {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .grid-scroll {
    flex: 1;
    overflow: auto;
    background: #1a1a1a;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }

  .grid-scroll::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 3px;
    min-width: fit-content;
    background: #1a1a1a;
    padding: 0 3px 3px 3px;
  }

  .scene-column {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 80px;
    min-width: 80px;
    flex-shrink: 0;
    background: #1a1a1a;
    border-left: 1px solid #333;
    padding: 0 3px 3px 3px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .scene-column::-webkit-scrollbar {
    display: none;
  }

  .track-header {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    background: #1e1e1e;
    border-left: 3px solid var(--color);
    border-radius: 0 3px 3px 0;
    font-size: 10px;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;
    height: 56px;
    box-sizing: border-box;
  }

  .track-header::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 3px;
    background: #1a1a1a;
    pointer-events: none;
  }

  .track-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-controls {
    display: flex;
    gap: 2px;
    width: 100%;
  }

  .track-controls .track-btn {
    flex: 1;
  }

  .track-btn {
    padding: 4px 2px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid #555;
    border-radius: 3px;
    background: #3d3d3d;
    color: #888;
    cursor: pointer;
    transition: all 0.1s;
    min-width: 20px;
    min-height: 24px;
  }

  .track-btn:hover {
    background: #4d4d4d;
    color: #fff;
  }

  .track-btn.mute.active {
    background: #b54;
    border-color: #d65;
    color: #fff;
  }

  .track-btn.solo.active {
    background: #54b;
    border-color: #65d;
    color: #fff;
  }

  .track-btn.arm.active {
    background: #b33;
    border-color: #d44;
    color: #fff;
  }

  .track-btn.stop:hover {
    background: #4d3d3d;
    border-color: #888;
    color: #fff;
  }

  .scene-header {
    padding: 6px;
    background: #1e1e1e;
    font-size: 10px;
    text-align: center;
    color: #888;
    position: sticky;
    top: 0;
    z-index: 10;
    height: 56px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .clip-stop {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 47px;
    box-sizing: border-box;
    background: #2a2a2a;
    border: 1px solid #333;
    border-radius: 3px;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.1s;
    position: sticky;
    top: 59px; /* Below track header (56px) + gap (3px) */
    z-index: 9;
  }

  .clip-stop:hover {
    background: #3d2d2d;
    border-color: #664444;
    color: #ff8888;
  }

  .clip-stop:active {
    transform: scale(0.97);
  }

  .clip-stop.stop-all {
    font-size: 11px;
    flex-shrink: 0;
  }

  .scene-column .clip-stop.stop-all {
    position: sticky;
    top: 59px; /* Below scene header (56px) + gap (3px) */
    height: 47px;
    z-index: 9;
  }

  .clip {
    padding: 8px 6px;
    height: 47px;
    box-sizing: border-box;
    background: color-mix(in srgb, var(--color) 20%, #2d2d2d);
    border: 1px solid color-mix(in srgb, var(--color) 30%, #111);
    border-radius: 3px;
    color: #fff;
    font-size: 9px;
    cursor: pointer;
    transition: background 0.1s, transform 0.1s;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color) 15%, rgba(255,255,255,0.08));
  }

  .clip:hover {
    background: color-mix(in srgb, var(--color) 40%, #3d3d3d);
  }

  .clip:active {
    transform: scale(0.97);
  }

  /* Clip state styles */
  .clip.empty {
    background: color-mix(in srgb, var(--scene-color, #666) 8%, #2a2a2a);
    border-color: color-mix(in srgb, var(--scene-color, #666) 20%, #222);
    box-shadow: none;
    opacity: 0.7;
  }

  .clip.empty:hover {
    background: color-mix(in srgb, var(--scene-color, #666) 15%, #3a3a3a);
    border-color: color-mix(in srgb, var(--scene-color, #666) 30%, #333);
    opacity: 1;
  }

  .clip.has-clip {
    /* Default styles from .clip */
  }

  .clip.playing {
    background: color-mix(in srgb, #00ff00 25%, #2d2d2d);
    border-color: #00ff00;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
  }

  .clip.playing:hover {
    background: color-mix(in srgb, #00ff00 35%, #2d2d2d);
  }

  .clip.triggered {
    background: color-mix(in srgb, #ffff00 25%, #2d2d2d);
    border-color: #ffff00;
    animation: blink 0.3s ease-in-out infinite;
  }

  .clip.recording {
    background: color-mix(in srgb, #ff0000 25%, #2d2d2d);
    border-color: #ff0000;
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.4);
    animation: pulse 0.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(255, 0, 0, 0.4); }
    50% { box-shadow: 0 0 16px rgba(255, 0, 0, 0.8); }
  }

  .clip-icon {
    font-size: 12px;
    position: relative;
    z-index: 2;
  }

  .clip-name {
    position: relative;
    z-index: 2;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Progress bar - Grid-style sweep */
  .clip-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 3px;
    width: calc(var(--progress) * 100%);
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px 0 0 2px;
    transition: width 0.15s linear;
  }

  .clip.playing .clip-progress {
    background: rgba(100, 255, 100, 0.7);
  }

  .clip.recording .clip-progress {
    background: rgba(255, 100, 100, 0.8);
  }

  /* Center icons in empty slots */
  .clip.empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Make clip position relative for progress bar */
  .clip {
    position: relative;
    overflow: hidden;
  }

  .clip-icon.record-ready {
    color: #aa4444;
    opacity: 0.6;
  }

  .clip-icon.stop-ready {
    color: #666;
    opacity: 0.4;
  }

  .clip.empty:hover .clip-icon.record-ready {
    color: #ff4444;
    opacity: 1;
  }

  .clip.empty:hover .clip-icon.stop-ready {
    color: #aaa;
    opacity: 0.8;
  }

  /* Armed empty slot has subtle red tint */
  .clip.empty.armed {
    background: color-mix(in srgb, #ff0000 8%, #2a2a2a);
    border-color: color-mix(in srgb, #ff0000 20%, #333);
  }

  .scene-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 6px 8px;
    height: 47px;
    box-sizing: border-box;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--scene-color, #666) 10%, #2d2d2d);
    border: none;
    border-left: 3px solid var(--scene-color, #666);
    border-radius: 3px;
    color: #fff;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .scene-btn:hover {
    background: color-mix(in srgb, var(--scene-color, #666) 20%, #3d3d3d);
  }

  .scene-btn:active {
    transform: scale(0.98);
  }

  .scene-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    font-size: 9px;
  }

  .scene-play {
    opacity: 0.5;
    font-size: 10px;
    flex-shrink: 0;
  }

  .scene-btn:hover .scene-play {
    opacity: 1;
  }

  .stop-all-btn {
    padding: 0 10px;
    height: 44px;
    background: #3d2d2d;
    border: 1px solid #5d3d3d;
    border-radius: 4px;
    color: #ff8888;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.1s;
  }

  .stop-all-btn:hover {
    background: #4d3d3d;
    border-color: #ff6666;
  }

  .stop-all-btn:active {
    transform: scale(0.95);
  }

  .transport {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 6px 10px;
    background: #1a1a1a;
    border-radius: 4px;
    border: 1px solid #333;
  }

  .transport .label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .transport-buttons {
    display: flex;
    gap: 4px;
  }

  .transport-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    transition: all 0.1s;
  }

  .transport-btn:hover {
    background: #353535;
    color: #fff;
  }

  .transport-btn:active {
    transform: scale(0.95);
  }

  .transport-btn .icon {
    font-size: 12px;
  }

  .transport-btn.play:hover {
    background: #2a3a2a;
    border-color: #3a4a3a;
    color: #4f4;
  }

  .transport-btn.play.active {
    background: #2a3a2a;
    border-color: #4a5a4a;
    color: #4f4;
    box-shadow: 0 0 8px rgba(68, 255, 68, 0.3);
  }

  .transport-btn.stop:hover {
    background: #353535;
    border-color: #454545;
  }

  .transport-btn.record:hover {
    background: #3a2a2a;
    border-color: #4a3a3a;
    color: #f44;
  }

  .transport-btn.record.active {
    background: #3a2a2a;
    border-color: #5a4a4a;
    color: #f44;
    box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
  }

  .playhead-section,
  .tempo-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    padding: 6px 10px;
    background: #1a1a1a;
    border-radius: 4px;
    border: 1px solid #333;
  }

  .playhead-section .label,
  .tempo-section .label {
    font-size: 9px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .playhead-value,
  .tempo-value {
    font-size: 15px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: #ff9944;
    letter-spacing: 0.5px;
  }

</style>
