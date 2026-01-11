<script lang="ts">
  import { connection, connect, disconnect } from './lib/stores/connection.svelte';
  import SessionGrid from './lib/components/SessionGrid/Grid.svelte';
  import Transport from './lib/components/Transport/Transport.svelte';
  import ConnectionStatus from './lib/components/ui/ConnectionStatus.svelte';

  // Auto-connect on mount
  $effect(() => {
    connect();
    return () => disconnect();
  });
</script>

<div class="app">
  <header class="header">
    <h1 class="title">Mission Control</h1>
    <ConnectionStatus />
  </header>

  <main class="main">
    <SessionGrid />
  </main>

  <footer class="footer">
    <Transport />
  </footer>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-bg-elevated);
  }

  .title {
    font-size: var(--font-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .main {
    flex: 1;
    overflow: auto;
    padding: var(--space-3);
  }

  .footer {
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-bg-elevated);
  }
</style>
