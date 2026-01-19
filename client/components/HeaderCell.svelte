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
    gap: var(--gap-sm);
    padding: var(--gap-md);
    background: var(--bg-hover);
    border-top: 3px solid var(--color);
    border-radius: var(--radius-sm);
    font-size: 10px;
    font-weight: 500;
    height: 56px;
    box-sizing: border-box;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  .header-cell.compact {
    height: var(--header-height);
  }

  .header-cell.border-left {
    border-top: none;
    border-left: 3px solid var(--color);
    border-radius: var(--radius-sm);
  }

  .header-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }

  .header-controls {
    display: flex;
    gap: var(--gap-xs);
    width: 100%;
  }
</style>
