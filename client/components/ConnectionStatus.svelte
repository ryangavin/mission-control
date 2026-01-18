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
  .header-box {
    display: flex;
    align-items: center;
    height: 32px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
  }

  .connection-status {
    gap: 12px;
    padding: 0 8px;
  }

  .status-indicator {
    font-size: 10px;
    font-weight: 500;
    color: #aa6666;
  }

  .status-indicator.connected {
    color: #44ff44;
    text-shadow: 0 0 3px #44ff4488;
  }
</style>
