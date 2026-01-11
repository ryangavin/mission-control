<script lang="ts">
  import { send } from '../../stores/connection.svelte';
  import ClipCell from './ClipCell.svelte';

  // Mock data for now - will be replaced with live data
  const mockTracks = [
    { id: 0, name: 'Drums', color: '#ff94a2' },
    { id: 1, name: 'Bass', color: '#ffa529' },
    { id: 2, name: 'Synth', color: '#50e3c2' },
    { id: 3, name: 'Vocals', color: '#b8e986' },
  ];

  const mockScenes = [
    { id: 0, name: 'Intro' },
    { id: 1, name: 'Verse' },
    { id: 2, name: 'Chorus' },
    { id: 3, name: 'Bridge' },
  ];

  // Generate mock clips
  function generateMockClips() {
    const clips: { trackId: number; sceneId: number; hasClip: boolean; name?: string; color?: string }[] = [];
    for (const track of mockTracks) {
      for (const scene of mockScenes) {
        // ~70% chance of having a clip
        const hasClip = Math.random() > 0.3;
        clips.push({
          trackId: track.id,
          sceneId: scene.id,
          hasClip,
          name: hasClip ? `${track.name} ${scene.name}` : undefined,
          color: hasClip ? track.color : undefined,
        });
      }
    }
    return clips;
  }

  const mockClips = generateMockClips();

  function getClip(trackId: number, sceneId: number) {
    return mockClips.find(c => c.trackId === trackId && c.sceneId === sceneId);
  }

  function fireScene(sceneId: number) {
    send({ type: 'scene/fire', sceneId });
  }

  function stopTrack(trackId: number) {
    send({ type: 'track/stop', trackId });
  }

  function stopAll() {
    for (const track of mockTracks) {
      send({ type: 'track/stop', trackId: track.id });
    }
  }
</script>

<div class="grid-container">
  <div class="grid" style="--track-count: {mockTracks.length + 1}">
    <!-- Header row: Track names + Scene column header -->
    <div class="header-row">
      {#each mockTracks as track}
        <div class="track-header" style="--track-color: {track.color}">
          <span class="track-name">{track.name}</span>
        </div>
      {/each}
      <div class="scene-header">Scene</div>
    </div>

    <!-- Clip rows -->
    {#each mockScenes as scene}
      <div class="clip-row">
        {#each mockTracks as track}
          {@const clip = getClip(track.id, scene.id)}
          <ClipCell
            trackId={track.id}
            sceneId={scene.id}
            hasClip={clip?.hasClip ?? false}
            name={clip?.name}
            color={clip?.color}
          />
        {/each}
        <button class="scene-launcher" onclick={() => fireScene(scene.id)}>
          <span class="scene-name">{scene.name}</span>
          <svg class="scene-icon" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 20,12 8,19" />
          </svg>
        </button>
      </div>
    {/each}

    <!-- Stop row -->
    <div class="stop-row">
      {#each mockTracks as track}
        <button class="stop-btn" onclick={() => stopTrack(track.id)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      {/each}
      <button class="stop-all-btn" onclick={stopAll}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
        <span>All</span>
      </button>
    </div>
  </div>
</div>

<style>
  .grid-container {
    height: 100%;
    overflow: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--track-count), minmax(80px, 1fr));
    gap: var(--space-1);
    min-width: fit-content;
  }

  .header-row, .clip-row, .stop-row {
    display: contents;
  }

  .track-header {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--track-color, var(--color-accent));
  }

  .track-name {
    font-size: var(--font-sm);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scene-header {
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .scene-launcher {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    min-height: var(--touch-comfortable);
    background: var(--color-bg-secondary);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .scene-launcher:hover {
    background: var(--color-bg-hover);
  }

  .scene-launcher:active {
    transform: scale(0.98);
  }

  .scene-name {
    font-size: var(--font-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scene-icon {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }

  .stop-btn, .stop-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2);
    min-height: var(--touch-min);
    background: var(--color-bg-elevated);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .stop-btn:hover, .stop-all-btn:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  .stop-btn:active, .stop-all-btn:active {
    transform: scale(0.95);
  }

  .stop-btn svg, .stop-all-btn svg {
    width: 16px;
    height: 16px;
  }

  .stop-all-btn span {
    font-size: var(--font-xs);
  }
</style>
