<script lang="ts">
  let {
    isOpen = false,
    onClose = () => {}
  }: {
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  // Active tab
  let activeTab = $state<'setup' | 'troubleshooting' | 'about'>('setup');

  // Close on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  // Close on backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div class="modal">
      <div class="modal-header">
        <h2>MC Bridge Help</h2>
        <button class="close-btn" onclick={onClose}>x</button>
      </div>

      <div class="tabs">
        <button
          class="tab"
          class:active={activeTab === 'setup'}
          onclick={() => activeTab = 'setup'}
        >
          Setup
        </button>
        <button
          class="tab"
          class:active={activeTab === 'troubleshooting'}
          onclick={() => activeTab = 'troubleshooting'}
        >
          Troubleshooting
        </button>
        <button
          class="tab"
          class:active={activeTab === 'about'}
          onclick={() => activeTab = 'about'}
        >
          About
        </button>
      </div>

      <div class="modal-content">
        {#if activeTab === 'setup'}
          <div class="section">
            <h3>Getting Started</h3>
            <ol class="steps">
              <li>
                <strong>Download the app</strong>
                <p>Download MC Bridge for your platform from the setup panel or GitHub releases.</p>
              </li>
              <li>
                <strong>Install and launch</strong>
                <p>Open the .dmg (macOS) or run the installer (Windows). The app runs in your menubar/system tray.</p>
              </li>
              <li>
                <strong>Install the Remote Script</strong>
                <p>Click the menubar icon and select "Install Remote Script". This copies the AbletonOSC script to your Ableton User Library.</p>
              </li>
              <li>
                <strong>Configure Ableton</strong>
                <p>Open Ableton Live, go to Preferences > Link/Tempo/MIDI, find Control Surface, and select "AbletonOSC" from the dropdown.</p>
              </li>
              <li>
                <strong>Start the Bridge</strong>
                <p>Click the menubar icon and select "Start Bridge". The icon will turn green when connected.</p>
              </li>
              <li>
                <strong>You're ready!</strong>
                <p>This web interface will automatically connect. You should see your Ableton session appear.</p>
              </li>
            </ol>
          </div>

        {:else if activeTab === 'troubleshooting'}
          <div class="section">
            <h3>Common Issues</h3>

            <div class="issue">
              <h4>"Bridge not connected"</h4>
              <ul>
                <li>Refresh the page to reconnect</li>
                <li>Check if the dev server is running (bun run dev)</li>
              </ul>
            </div>

            <div class="issue">
              <h4>"Waiting for Ableton Live"</h4>
              <ul>
                <li>Ensure Ableton Live is running</li>
                <li>Check that AbletonOSC is selected as a Control Surface in Preferences</li>
                <li>Try restarting Ableton after installing the remote script</li>
              </ul>
            </div>

            <div class="issue">
              <h4>AbletonOSC not appearing in Control Surface list</h4>
              <ul>
                <li>Click "Install Remote Script" from the menubar app</li>
                <li>Restart Ableton Live</li>
                <li>Check that the script was copied to: ~/Music/Ableton/User Library/Remote Scripts/</li>
              </ul>
            </div>

            <div class="issue">
              <h4>macOS security warning</h4>
              <ul>
                <li>Right-click the app and select "Open" the first time</li>
                <li>Or go to System Preferences > Security & Privacy and click "Open Anyway"</li>
              </ul>
            </div>
          </div>

        {:else if activeTab === 'about'}
          <div class="section">
            <h3>About MC Bridge</h3>
            <p>MC Bridge is a web-based controller for Ableton Live. It connects to Ableton through OSC (Open Sound Control) protocol via a local bridge application.</p>

            <h4>Features</h4>
            <ul>
              <li>View and control your Ableton session</li>
              <li>Launch clips and scenes</li>
              <li>Transport controls (play, stop, record)</li>
              <li>Track mute, solo, and arm</li>
              <li>Drag and drop clips between slots</li>
            </ul>

            <h4>Links</h4>
            <p>
              <a href="https://github.com/yourusername/mission-control" target="_blank" rel="noopener">GitHub Repository</a>
            </p>

            <p class="version">Version 0.1.0</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #333;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #fff;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 20px;
    line-height: 1;
  }

  .close-btn:hover {
    color: #fff;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #333;
    padding: 0 16px;
  }

  .tab {
    background: none;
    border: none;
    color: #888;
    padding: 12px 16px;
    cursor: pointer;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab:hover {
    color: #fff;
  }

  .tab.active {
    color: #ff9944;
    border-bottom-color: #ff9944;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }

  .section h4 {
    margin: 20px 0 8px 0;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
  }

  .section p {
    color: #aaa;
    font-size: 14px;
    line-height: 1.5;
    margin: 8px 0;
  }

  .section a {
    color: #ff9944;
  }

  .steps {
    list-style: none;
    padding: 0;
    margin: 0;
    counter-reset: step;
  }

  .steps li {
    position: relative;
    padding-left: 36px;
    margin-bottom: 16px;
    counter-increment: step;
  }

  .steps li::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: 0;
    width: 24px;
    height: 24px;
    background: #333;
    color: #888;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .steps li strong {
    display: block;
    color: #fff;
    margin-bottom: 4px;
  }

  .steps li p {
    margin: 0;
    color: #888;
    font-size: 13px;
  }

  .issue {
    margin-bottom: 20px;
    padding: 12px;
    background: #252525;
    border-radius: 6px;
  }

  .issue h4 {
    margin: 0 0 8px 0;
    color: #ff9944;
  }

  .issue ul {
    margin: 0;
    padding-left: 20px;
    color: #aaa;
    font-size: 13px;
  }

  .issue li {
    margin-bottom: 4px;
  }

  .version {
    margin-top: 24px;
    color: #666;
    font-size: 12px;
  }
</style>
