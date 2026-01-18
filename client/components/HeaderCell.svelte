<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    color?: string;
    borderPosition?: 'top' | 'left';
    children?: Snippet;
  }

  let { name, color = '#666', borderPosition = 'top', children }: Props = $props();

  // Check if we have children to render
  let hasControls = $derived(children !== undefined);
</script>

<div class="header-cell" class:compact={!hasControls} class:border-left={borderPosition === 'left'} style="--color: {color}">
  <span class="header-name">{name}</span>
  {#if hasControls}
    <div class="header-controls">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .header-cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 6px;
    background: #1e1e1e;
    border-top: 3px solid var(--color);
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    height: 56px;
    box-sizing: border-box;
  }

  .header-cell.compact {
    height: 32px;
  }

  .header-cell.border-left {
    border-top: none;
    border-left: 3px solid var(--color);
    border-radius: 3px;
  }

  .header-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #fff;
  }

  .header-controls {
    display: flex;
    gap: 2px;
    width: 100%;
  }

  .header-cell :global(.control-btn) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .header-cell :global(.control-btn:hover) {
    background: #4d4d4d;
    color: #fff;
  }
</style>
