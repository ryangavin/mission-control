<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte';

  interface Props {
    bridgeConnected: boolean;
    abletonConnected: boolean;
    onShowHelp: () => void;
  }

  let { bridgeConnected, abletonConnected, onShowHelp }: Props = $props();
</script>

<footer class="footer">
  <ConnectionStatus {bridgeConnected} {abletonConnected} />
  <div class="app-brand">
    <i class="fa-solid fa-rocket app-icon"></i>
    <span class="app-title">Mission Control</span>
  </div>
  <button class="help-btn" title="Help" onclick={onShowHelp}>?</button>
</footer>

<style>
  .footer {
    display: none;
    position: relative;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #151515;
    border-top: 1px solid #333;
    flex-shrink: 0;
  }

  .footer :global(.connection-status) {
    background: none;
    border: none;
    padding: 0;
    height: auto;
  }

  .app-brand {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .app-icon {
    font-size: 14px;
    color: #ff9944;
    transform: rotate(-90deg);
  }

  .app-title {
    font-size: 12px;
    font-weight: 600;
    color: #888;
  }

  .help-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #888;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
  }

  .help-btn:hover {
    background: #2a2a2a;
    color: #fff;
  }

  /* Show footer at narrow widths (same breakpoint header elements hide) */
  @media (max-width: 580px) {
    .footer {
      display: flex;
    }
  }
</style>
