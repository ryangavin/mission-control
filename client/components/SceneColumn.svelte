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
  class="scene-column flex-col hide-scrollbar"
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
      <span class="scene-name text-ellipsis">{scene.name || `Scene ${sceneIndex + 1}`}</span>
      <i class="fa-solid fa-play scene-play"></i>
    </button>
  {/each}

  <!-- Spacer for add scene row alignment -->
  <div class="add-row-spacer"></div>
</div>

<style>
  .scene-column {
    width: var(--track-width);
    min-width: var(--track-width);
    flex-shrink: 0;
    background: var(--bg-surface);
    padding: 0 var(--gap-sm) var(--gap-sm) 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: none;
  }

  .sticky-row {
    position: sticky;
    z-index: 10;
    background: var(--bg-surface);
    flex-shrink: 0;
  }

  .header-row {
    top: 0;
    padding-bottom: var(--gap-sm);
  }

  .scene-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: var(--gap-md) var(--gap-lg);
    height: var(--cell-height);
    box-sizing: border-box;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--scene-color, var(--text-subtle)) 10%, var(--bg-hover));
    border: none;
    border-left: 3px solid var(--scene-color, var(--text-subtle));
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 10px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .scene-btn + .scene-btn {
    margin-top: var(--gap-sm);
  }

  .scene-btn:hover {
    background: color-mix(in srgb, var(--scene-color, var(--text-subtle)) 20%, var(--bg-active));
  }

  .scene-btn:active {
    transform: scale(0.98);
  }

  .scene-name {
    flex: 1;
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
    height: var(--cell-height);
    flex-shrink: 0;
    margin-top: 15px;
  }

</style>
