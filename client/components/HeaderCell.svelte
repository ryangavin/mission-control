<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    color?: string;
    children?: Snippet;
  }

  let { name, color = '#666', children }: Props = $props();
</script>

<div class="header-cell" style="--color: {color}">
  <span class="header-name">{name}</span>
  <div class="header-controls">
    {@render children?.()}
  </div>
</div>

<style>
  .header-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    background: #1e1e1e;
    border-left: 3px solid var(--color);
    border-radius: 0 3px 3px 0;
    font-size: 10px;
    font-weight: 500;
    height: 56px;
    box-sizing: border-box;
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
