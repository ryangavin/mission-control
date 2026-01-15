<script lang="ts">
  interface Props {
    connectionState: 'disconnected' | 'connecting' | 'connected';
    abletonConnected: boolean;
    syncPhase: string | null;
    syncProgress: number | null;
  }

  let { connectionState, abletonConnected, syncPhase, syncProgress }: Props = $props();
</script>

<div class="empty-state">
  <div class="spinner"></div>
  <p class="empty-title">
    {#if connectionState !== 'connected'}
      Connecting to bridge...
    {:else if !abletonConnected}
      Waiting for Ableton Live
    {:else if syncPhase === 'structure'}
      Getting song info...
    {:else if syncPhase === 'tracks'}
      Syncing tracks...
    {:else if syncPhase === 'scenes'}
      Syncing scenes...
    {:else if syncPhase === 'clips'}
      Syncing clips{syncProgress !== null ? ` (${syncProgress}%)` : ''}...
    {:else}
      Loading session...
    {/if}
  </p>
  <p class="empty-hint">
    {#if connectionState !== 'connected'}
      Establishing connection
    {:else if !abletonConnected}
      Make sure Ableton is running with AbletonOSC
    {/if}
  </p>
</div>

<style>
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .empty-title {
    font-size: 18px;
    color: #888;
    margin: 0;
  }

  .empty-hint {
    font-size: 12px;
    color: #555;
    margin: 0;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #333;
    border-top-color: #888;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
