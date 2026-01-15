<script lang="ts">
  import type { Scene } from '../../protocol';
  import { intToHex } from './colorUtils';

  interface Props {
    scenes: Scene[];
    onSceneLaunch: (sceneIndex: number) => void;
    onStopAll: () => void;
  }

  let { scenes, onSceneLaunch, onStopAll }: Props = $props();
</script>

<div class="scene-column">
  <div class="scene-header">Scene</div>
  <button class="stop-all-btn" onclick={onStopAll} title="Stop All Clips">
    ■ All
  </button>
  {#each scenes as scene, sceneIndex}
    {@const sceneColor = intToHex(scene.color)}
    <button
      class="scene-btn"
      style="--scene-color: {sceneColor}"
      onclick={() => onSceneLaunch(scene.id)}
    >
      <span class="scene-name">{scene.name || `Scene ${sceneIndex + 1}`}</span>
      <span class="scene-play">▶</span>
    </button>
  {/each}
</div>

<style>
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

  .stop-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    box-sizing: border-box;
    background: #3d2d2d;
    border: 1px solid #5d3d3d;
    border-radius: 4px;
    color: #ff8888;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.1s;
    position: sticky;
    top: 59px; /* Below scene header (56px) + gap (3px) */
    z-index: 9;
    flex-shrink: 0;
  }

  .stop-all-btn:hover {
    background: #4d3d3d;
    border-color: #ff6666;
  }

  .stop-all-btn:active {
    transform: scale(0.95);
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
</style>
