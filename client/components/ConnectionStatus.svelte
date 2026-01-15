<script lang="ts">
  interface Props {
    bridgeConnected: boolean;
    abletonConnected: boolean;
  }

  let { bridgeConnected, abletonConnected }: Props = $props();
</script>

<div class="header-box connection-status">
  <span class="status-indicator" class:connected={bridgeConnected} title="Bridge connection">
    <span class="dot"></span>Bridge
  </span>
  <span class="status-indicator" class:connected={abletonConnected} title="Ableton connection">
    <span class="dot"></span>Live
  </span>
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
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    color: #aa6666;
  }

  .status-indicator .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #884444;
  }

  .status-indicator.connected {
    color: #44aa44;
  }

  .status-indicator.connected .dot {
    background: #44ff44;
    box-shadow: 0 0 6px #44ff44;
  }
</style>
