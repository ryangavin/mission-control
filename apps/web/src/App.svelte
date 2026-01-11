<script lang="ts">
  // Static data only - no reactive stores yet
  const tracks = [
    { id: 0, name: 'Drums', color: '#ff94a2' },
    { id: 1, name: 'Bass', color: '#ffa529' },
    { id: 2, name: 'Synth', color: '#50e3c2' },
    { id: 3, name: 'Vocals', color: '#b8e986' },
  ];

  const scenes = [
    { id: 0, name: 'Intro' },
    { id: 1, name: 'Verse' },
    { id: 2, name: 'Chorus' },
    { id: 3, name: 'Bridge' },
  ];

  function handleClipClick(trackId: number, sceneId: number) {
    console.log(`Clip clicked: track ${trackId}, scene ${sceneId}`);
  }

  function handleSceneLaunch(sceneId: number) {
    console.log(`Scene launch: ${sceneId}`);
  }
</script>

<div class="app">
  <header class="header">
    <h1>Mission Control</h1>
    <span class="status">Disconnected</span>
  </header>

  <main class="main">
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
          {scene.name}
        </button>
      {/each}
    </div>
  </main>

  <footer class="footer">
    <button class="transport-btn">Stop</button>
    <button class="transport-btn">Play</button>
    <span class="tempo">120 BPM</span>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #fff;
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
    padding: 12px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;
  }

  .header h1 {
    margin: 0;
    font-size: 18px;
  }

  .status {
    color: #888;
    font-size: 12px;
  }

  .main {
    flex: 1;
    padding: 12px;
    overflow: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 4px;
  }

  .track-header {
    padding: 8px;
    background: #2d2d2d;
    border-left: 3px solid var(--color);
    font-size: 12px;
    font-weight: 500;
  }

  .scene-header {
    padding: 8px;
    background: #2d2d2d;
    font-size: 12px;
    text-align: center;
    color: #888;
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
    transition: background 0.1s;
  }

  .clip:hover {
    background: color-mix(in srgb, var(--color) 40%, #3d3d3d);
  }

  .clip:active {
    transform: scale(0.98);
  }

  .scene-btn {
    padding: 8px;
    background: #2d2d2d;
    border: none;
    border-radius: 4px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
  }

  .scene-btn:hover {
    background: #3d3d3d;
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #2d2d2d;
    border-top: 1px solid #3d3d3d;
  }

  .transport-btn {
    padding: 8px 16px;
    background: #3d3d3d;
    border: none;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
  }

  .transport-btn:hover {
    background: #4d4d4d;
  }

  .tempo {
    margin-left: auto;
    font-size: 14px;
    color: #888;
  }
</style>
