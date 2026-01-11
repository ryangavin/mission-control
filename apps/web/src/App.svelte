<script lang="ts">
  // Mock data - will be replaced with live data from bridge
  // Testing with larger set to verify scrolling
  const tracks = [
    { id: 0, name: 'Drums', color: '#ff94a2' },
    { id: 1, name: 'Bass', color: '#ffa529' },
    { id: 2, name: 'Synth', color: '#50e3c2' },
    { id: 3, name: 'Vocals', color: '#b8e986' },
    { id: 4, name: 'Guitar', color: '#9b59b6' },
    { id: 5, name: 'Keys', color: '#3498db' },
    { id: 6, name: 'FX', color: '#e74c3c' },
    { id: 7, name: 'Strings', color: '#1abc9c' },
  ];

  const scenes = [
    { id: 0, name: 'Intro' },
    { id: 1, name: 'Verse 1' },
    { id: 2, name: 'Chorus' },
    { id: 3, name: 'Verse 2' },
    { id: 4, name: 'Bridge' },
    { id: 5, name: 'Chorus 2' },
    { id: 6, name: 'Outro' },
    { id: 7, name: 'End' },
  ];

  function handleClipClick(trackId: number, sceneId: number) {
    console.log(`Clip fire: track ${trackId}, scene ${sceneId}`);
  }

  function handleSceneLaunch(sceneId: number) {
    console.log(`Scene launch: ${sceneId}`);
  }

  function handleTrackStop(trackId: number) {
    console.log(`Track stop: ${trackId}`);
  }

  function handleStopAll() {
    console.log('Stop all clips');
  }
</script>

<div class="app">
  <header class="header">
    <div class="transport">
      <button class="transport-btn stop" title="Stop">
        <span class="icon">■</span>
      </button>
      <button class="transport-btn play" title="Play">
        <span class="icon">▶</span>
      </button>
      <button class="transport-btn record" title="Record">
        <span class="icon">●</span>
      </button>
    </div>
    <div class="tempo-section">
      <span class="tempo-value">120.00</span>
      <span class="tempo-label">BPM</span>
    </div>
    <div class="header-right">
      <button class="transport-btn small" title="Metronome">
        <span class="icon">🔔</span>
      </button>
      <span class="status">Disconnected</span>
    </div>
  </header>

  <main class="main">
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

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .transport-btn.stop:hover {
    background: #3d3d3d;
  }

  .transport-btn.record:hover {
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
