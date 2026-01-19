<script lang="ts">
  interface Props {
    bridgeConnected: boolean;
    abletonConnected: boolean;
  }

  let { bridgeConnected, abletonConnected }: Props = $props();
</script>

<div class="header-box connection-status">
  <span class="status-indicator" class:connected={bridgeConnected} title="Bridge connection">Bridge</span>
  <span class="status-indicator" class:connected={abletonConnected} title="Ableton connection">Live</span>
</div>

<style>
  .connection-status {
    gap: var(--gap-xl);
    padding: 0 var(--gap-lg);
  }

  .status-indicator {
    font-size: 10px;
    font-weight: 500;
    color: var(--accent-error-dim);
  }

  .status-indicator.connected {
    color: var(--accent-success);
    text-shadow: 0 0 3px var(--accent-success-dim);
  }
</style>
