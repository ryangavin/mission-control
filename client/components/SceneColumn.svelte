<script lang="ts">
  import type { Scene } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';

  interface Props {
    scenes: Scene[];
    onSceneLaunch: (sceneId: number) => void;
    onStopAll: () => void;
    onAddScene: () => void;
    onScroll?: () => void;
  }

  let { scenes, onSceneLaunch, onStopAll, onAddScene, onScroll }: Props = $props();

  // Expose element for scroll sync via bindable
  let element = $state<HTMLDivElement | null>(null);

  export function getElement(): HTMLDivElement | null {
    return element;
  }

  export function setScrollTop(scrollTop: number) {
    if (element) {
      element.scrollTop = scrollTop;
    }
  }
</script>

<div
  class="scene-column"
  bind:this={element}
  onscroll={onScroll}
>
  <!-- Sticky header row with background -->
  <div class="sticky-row header-row">
    <div class="scene-header">
      <span>Master</span>
      <button class="add-scene-btn" onclick={onAddScene} title="Add Scene"><i class="fa-solid fa-plus"></i></button>
    </div>
  </div>

  <!-- Sticky stop button row with background -->
  <div class="sticky-row stop-row">
    <button class="stop-all-btn" onclick={onStopAll} title="Stop All Clips">
      ■ All
    </button>
  </div>

  {#each scenes as scene, sceneIndex (scene.id)}
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
    overscroll-behavior: none;
  }

  .scene-column::-webkit-scrollbar {
    display: none;
  }

  .sticky-row {
    position: sticky;
    z-index: 10;
    background: #1a1a1a;
    flex-shrink: 0;
  }

  .header-row {
    top: 0;
    padding-bottom: 3px;
  }

  .stop-row {
    top: 59px; /* Below scene header (56px) + gap (3px) */
    padding-bottom: 3px;
  }

  .scene-header {
    padding: 6px;
    background: #1e1e1e;
    border-left: 3px solid #666;
    border-radius: 0 3px 3px 0;
    font-size: 10px;
    font-weight: 500;
    color: #fff;
    height: 56px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
  }

  .stop-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
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

  .scene-btn + .scene-btn {
    margin-top: 3px;
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

  .add-scene-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 24px;
    max-height: 28px;
    padding: 4px 2px;
    box-sizing: border-box;
    background: #3d3d3d;
    border: 1px solid #555;
    border-radius: 3px;
    color: #888;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
  }

  .add-scene-btn:hover {
    background: #4d4d4d;
    color: #fff;
  }
</style>
