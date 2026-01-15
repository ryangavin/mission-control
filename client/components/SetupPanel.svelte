<script lang="ts">
  // Props
  let {
    isConnected = false,
    onDismiss = () => {}
  }: {
    isConnected: boolean;
    onDismiss: () => void;
  } = $props();

  // Detect platform for path display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const remoteScriptsPath = isMac
    ? '~/Music/Ableton/User Library/Remote Scripts/'
    : '~\\Documents\\Ableton\\User Library\\Remote Scripts\\';

  // Track expanded state
  let isExpanded = $state(true);

  function handleDismiss() {
    isExpanded = false;
    localStorage.setItem('setup-panel-dismissed', 'true');
    onDismiss();
  }

  // Check if previously dismissed
  $effect(() => {
    const dismissed = localStorage.getItem('setup-panel-dismissed');
    if (dismissed === 'true') {
      isExpanded = false;
    }
  });

  // Show again if disconnected and user hasn't dismissed
  $effect(() => {
    if (!isConnected) {
      const dismissed = localStorage.getItem('setup-panel-dismissed');
      if (dismissed !== 'true') {
        isExpanded = true;
      }
    }
  });
</script>

{#if !isConnected && isExpanded}
  <div class="setup-panel">
    <div class="panel-header">
      <span class="warning-icon">!</span>
      <span class="title">Waiting for Ableton Live</span>
      <button class="dismiss-btn" onclick={handleDismiss} title="Dismiss">
        <span>x</span>
      </button>
    </div>

    <div class="panel-content">
      <div class="step">
        <span class="step-number">1</span>
        <div class="step-content">
          <span class="step-title">Install AbletonOSC</span>
          <span class="step-desc">
            Copy the <code>AbletonOSC</code> folder to:<br>
            <code class="path">{remoteScriptsPath}</code>
          </span>
          <a href="https://github.com/ideoforms/AbletonOSC/releases" target="_blank" class="download-btn">
            Download AbletonOSC
          </a>
        </div>
      </div>

      <div class="step">
        <span class="step-number">2</span>
        <div class="step-content">
          <span class="step-title">Enable in Ableton</span>
          <span class="step-desc">
            <strong>Preferences</strong> → <strong>Link, Tempo & MIDI</strong> → <strong>Control Surface</strong> → select <strong>AbletonOSC</strong>
          </span>
        </div>
      </div>

      <div class="step">
        <span class="step-number">3</span>
        <div class="step-content">
          <span class="step-title">Open a Project</span>
          <span class="step-desc">
            Open or create a Live Set in Ableton
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .setup-panel {
    background: #252525;
    border-bottom: 1px solid #333;
    padding: 12px 16px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .warning-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #ff9944;
    color: #000;
    border-radius: 50%;
    font-weight: bold;
    font-size: 12px;
  }

  .title {
    flex: 1;
    font-weight: 500;
    color: #fff;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 16px;
    line-height: 1;
  }

  .dismiss-btn:hover {
    color: #fff;
  }

  .panel-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .step {
    display: flex;
    gap: 10px;
    flex: 1;
    min-width: 200px;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #333;
    color: #888;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
  }

  .step-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .step-title {
    color: #fff;
    font-weight: 500;
    font-size: 13px;
  }

  .step-desc {
    color: #888;
    font-size: 12px;
    line-height: 1.4;
  }

  .step-desc code {
    background: #333;
    padding: 1px 4px;
    border-radius: 3px;
    color: #ccc;
  }

  .step-desc code.path {
    display: block;
    margin-top: 4px;
    padding: 4px 8px;
    font-size: 11px;
    word-break: break-all;
  }

  .download-btn {
    display: inline-block;
    padding: 6px 12px;
    background: #333;
    color: #fff;
    text-decoration: none;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 4px;
    transition: background 0.15s;
  }

  .download-btn:hover {
    background: #444;
  }
</style>
