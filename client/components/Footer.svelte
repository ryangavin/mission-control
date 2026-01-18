<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte';

  interface Props {
    bridgeConnected: boolean;
    abletonConnected: boolean;
    onShowHelp: () => void;
  }

  let { bridgeConnected, abletonConnected, onShowHelp }: Props = $props();

  let collapsed = $state(true);
</script>

{#if collapsed}
  <button type="button" class="footer collapsed" onclick={() => collapsed = false}>
    <div class="collapsed-content">
      <i class="fa-solid fa-rocket app-icon"></i>
      <span class="app-title">Mission Control</span>
      <i class="fa-solid fa-chevron-up chevron"></i>
    </div>
  </button>
{:else}
  <footer class="footer">
    <ConnectionStatus {bridgeConnected} {abletonConnected} />
    <div class="app-brand">
      <i class="fa-solid fa-rocket app-icon"></i>
      <span class="app-title">Mission Control</span>
    </div>
    <div class="right-controls">
      <button class="help-btn" title="Help" onclick={onShowHelp}>?</button>
      <button class="collapse-btn" title="Collapse" onclick={() => collapsed = true}>
        <i class="fa-solid fa-chevron-down"></i>
      </button>
    </div>
  </footer>
{/if}

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
    z-index: 100;
  }

  .footer.collapsed {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: fit-content;
    padding: 6px 14px;
    background: #151515;
    border: 1px solid #333;
    border-radius: 20px;
    cursor: pointer;
  }

  .footer.collapsed:hover {
    background: #1a1a1a;
    border-color: #444;
  }

  .collapsed-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .collapsed-content .chevron {
    font-size: 10px;
    color: #666;
    margin-left: 4px;
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

  .right-controls {
    display: flex;
    align-items: center;
    gap: 6px;
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

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #666;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .collapse-btn:hover {
    background: #2a2a2a;
    color: #888;
  }

  /* Show footer at narrow widths (same breakpoint header elements hide) */
  @media (max-width: 750px) {
    .footer {
      display: flex;
    }
  }

  /* Mobile-specific: safe area padding and pill positioning */
  @media (max-width: 580px) {
    .footer:not(.collapsed) {
      padding-left: calc(40px + env(safe-area-inset-left, 0px));
      padding-right: calc(40px + env(safe-area-inset-right, 0px));
    }

    .footer.collapsed {
      bottom: 24px;
    }
  }
</style>
