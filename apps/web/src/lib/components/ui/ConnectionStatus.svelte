<script lang="ts">
  import { connection } from '../../stores/connection.svelte';
</script>

<div class="status">
  <div class="indicator" class:connected={connection.connected} class:ableton={connection.abletonConnected}></div>
  <span class="label">
    {#if !connection.connected}
      Connecting...
    {:else if !connection.abletonConnected}
      Bridge connected
    {:else}
      Ableton connected
    {/if}
  </span>
</div>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-stopped);
    transition: background var(--transition-fast);
  }

  .indicator.connected {
    background: var(--color-triggered);
  }

  .indicator.connected.ableton {
    background: var(--color-playing);
  }

  .label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }
</style>
