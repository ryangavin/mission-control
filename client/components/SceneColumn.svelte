<script lang="ts">
  import type { Scene } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';
  import HeaderCell from './HeaderCell.svelte';

  interface Props {
    scenes: Scene[];
    masterColor: number;
    onSceneLaunch: (sceneId: number) => void;
    onScroll?: () => void;
  }

  let { scenes, masterColor, onSceneLaunch, onScroll }: Props = $props();

  // Convert master track color to hex
  let masterColorHex = $derived(intToHex(masterColor));

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
    <HeaderCell name="Master" color={masterColorHex} borderPosition="left" />
  </div>

  {#each scenes as scene, sceneIndex (scene.id)}
    {@const sceneColor = intToHex(scene.color)}
    <button
      class="scene-btn"
      style="--scene-color: {sceneColor}"
      onclick={() => onSceneLaunch(scene.id)}
    >
      <span class="scene-name">{scene.name || `Scene ${sceneIndex + 1}`}</span>
      <i class="fa-solid fa-play scene-play"></i>
    </button>
  {/each}

  <!-- Spacer for add scene row alignment -->
  <div class="add-row-spacer"></div>
</div>

<style>
  .scene-column {
    display: flex;
    flex-direction: column;
    width: 80px;
    min-width: 80px;
    flex-shrink: 0;
    background: #222;
    padding: 0 3px 3px 0;
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
    background: #222;
    flex-shrink: 0;
  }

  .header-row {
    top: 0;
    padding-bottom: 3px;
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

  .add-row-spacer {
    height: 47px;
    flex-shrink: 0;
    margin-top: 15px;
  }

</style>
