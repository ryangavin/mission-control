<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte';
  import ActionsGroup from './ActionsGroup.svelte';

  interface Props {
    bridgeConnected: boolean;
    abletonConnected: boolean;
    onShowHelp: () => void;
    onResync: () => void;
  }

  let { bridgeConnected, abletonConnected, onShowHelp, onResync }: Props = $props();
</script>

<footer class="footer">
  <div class="app-brand">
    <i class="fa-solid fa-rocket app-icon"></i>
    <span class="app-title">Mission Control</span>
  </div>
  <div class="right-controls">
    <ConnectionStatus {bridgeConnected} {abletonConnected} />
    <ActionsGroup {onResync} {onShowHelp} />
  </div>
</footer>

<style>
  .footer {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-md);
    padding: var(--gap-md);
    background: var(--bg-darkest);
    border-top: 1px solid var(--border-subtle);
    flex-shrink: 0;
    z-index: 100;
  }

  .app-brand {
    display: flex;
    align-items: center;
    gap: var(--gap-lg);
  }

  .app-icon {
    font-size: 14px;
    color: var(--accent-primary);
    transform: rotate(-90deg);
  }

  .app-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
  }

  /* Show footer at narrow widths (when header hides its sides) */
  @media (max-width: 680px) {
    .footer {
      display: flex;
    }
  }

  /* Mobile-specific: safe area padding */
  @media (max-width: 500px) {
    .footer {
      padding-left: calc(var(--gap-md) + env(safe-area-inset-left, 0px));
      padding-right: calc(var(--gap-md) + env(safe-area-inset-right, 0px));
    }
  }
</style>
