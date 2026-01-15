<script lang="ts">
  // Props
  let {
    isConnected = false,
    onDismiss = () => {}
  }: {
    isConnected: boolean;
    onDismiss: () => void;
  } = $props();

  // Detect platform
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;

  // GitHub release URL - update this with your actual repo
  const releaseUrl = 'https://github.com/yourusername/mission-control/releases/latest';
  const macDownload = `${releaseUrl}/download/MC-Bridge.dmg`;
  const windowsDownload = `${releaseUrl}/download/MC-Bridge-Setup.exe`;

  // Track expanded state
  let isExpanded = $state(true);

  function handleDismiss() {
    isExpanded = false;
    // Store in localStorage so it doesn't show again this session
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
      <span class="title">Bridge not connected</span>
      <button class="dismiss-btn" onclick={handleDismiss} title="Dismiss">
        <span>x</span>
      </button>
    </div>

    <div class="panel-content">
      <div class="step">
        <span class="step-number">1</span>
        <div class="step-content">
          <span class="step-title">Download & Install</span>
          <div class="download-buttons">
            {#if isMac}
              <a href={macDownload} class="download-btn primary">
                Download for macOS
              </a>
              <a href={windowsDownload} class="download-btn secondary">
                Windows
              </a>
            {:else if isWindows}
              <a href={windowsDownload} class="download-btn primary">
                Download for Windows
              </a>
              <a href={macDownload} class="download-btn secondary">
                macOS
              </a>
            {:else}
              <a href={macDownload} class="download-btn">
                macOS
              </a>
              <a href={windowsDownload} class="download-btn">
                Windows
              </a>
            {/if}
          </div>
        </div>
      </div>

      <div class="step">
        <span class="step-number">2</span>
        <div class="step-content">
          <span class="step-title">Launch from Applications</span>
          <span class="step-desc">Click the menubar icon, then "Install Remote Script"</span>
        </div>
      </div>

      <div class="step">
        <span class="step-number">3</span>
        <div class="step-content">
          <span class="step-title">Configure Ableton</span>
          <span class="step-desc">Preferences > Link/MIDI > Control Surface > AbletonOSC</span>
        </div>
      </div>

      <div class="step">
        <span class="step-number">4</span>
        <div class="step-content">
          <span class="step-title">Start Bridge</span>
          <span class="step-desc">Click menubar icon > "Start Bridge"</span>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button class="help-link" onclick={() => {}}>
        Need help?
      </button>
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
    gap: 4px;
  }

  .step-title {
    color: #fff;
    font-weight: 500;
    font-size: 13px;
  }

  .step-desc {
    color: #888;
    font-size: 12px;
  }

  .download-buttons {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .download-btn {
    display: inline-block;
    padding: 6px 12px;
    background: #333;
    color: #fff;
    text-decoration: none;
    border-radius: 4px;
    font-size: 12px;
    transition: background 0.15s;
  }

  .download-btn:hover {
    background: #444;
  }

  .download-btn.primary {
    background: #ff9944;
    color: #000;
  }

  .download-btn.primary:hover {
    background: #ffaa66;
  }

  .download-btn.secondary {
    background: transparent;
    border: 1px solid #444;
  }

  .panel-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #333;
  }

  .help-link {
    background: none;
    border: none;
    color: #ff9944;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
  }

  .help-link:hover {
    text-decoration: underline;
  }
</style>
