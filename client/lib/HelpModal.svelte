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
        <h2>Mission Control Help</h2>
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
                <strong>Download Mission Control</strong>
                <p>Download for your platform from <a href="https://github.com/ryangavin/mission-control/releases/latest" target="_blank" rel="noopener">GitHub Releases</a>.</p>
              </li>
              <li>
                <strong>Install and launch</strong>
                <p>Open the .dmg (macOS) or run the installer (Windows). The app runs in your menubar/system tray.</p>
              </li>
              <li>
                <strong>Install the Remote Script</strong>
                <p>Click the tray icon and select "Install Remote Script". This copies AbletonOSC to your Ableton User Library.</p>
              </li>
              <li>
                <strong>Configure Ableton</strong>
                <p>Open Ableton Live, go to Preferences → Link/Tempo/MIDI → Control Surface, and select "AbletonOSC" from the dropdown.</p>
              </li>
              <li>
                <strong>Open the UI</strong>
                <p>Click the tray icon and select "Show UI". Your browser will open and automatically connect.</p>
              </li>
            </ol>
          </div>

          <div class="section">
            <h3>Installing the Remote Script Manually</h3>
            <p>If the automatic installer doesn't work, you can install AbletonOSC manually:</p>
            <ol class="steps">
              <li>
                <strong>Download AbletonOSC</strong>
                <p>Get the latest release from <a href="https://github.com/ideoforms/AbletonOSC/releases" target="_blank" rel="noopener">GitHub</a>.</p>
              </li>
              <li>
                <strong>Extract and rename</strong>
                <p>Unzip the download and rename the folder to "AbletonOSC" (remove the version suffix).</p>
              </li>
              <li>
                <strong>Copy to Remote Scripts</strong>
                <p>
                  <strong>macOS:</strong> ~/Music/Ableton/User Library/Remote Scripts/<br>
                  <strong>Windows:</strong> ~\Documents\Ableton\User Library\Remote Scripts\
                </p>
              </li>
              <li>
                <strong>Restart Ableton</strong>
                <p>Restart Ableton Live and select AbletonOSC in Control Surface preferences.</p>
              </li>
            </ol>
          </div>

        {:else if activeTab === 'troubleshooting'}
          <div class="section">
            <h3>Common Issues</h3>

            <div class="issue">
              <h4>"Bridge not connected"</h4>
              <ul>
                <li>Make sure Mission Control is running (check your system tray)</li>
                <li>Try clicking "Show UI" from the tray menu to reconnect</li>
                <li>Restart the Mission Control app</li>
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
                <li>Click "Install Remote Script" from the tray menu</li>
                <li>Restart Ableton Live completely</li>
                <li>Check that the script exists at:
                  <br>macOS: ~/Music/Ableton/User Library/Remote Scripts/AbletonOSC
                  <br>Windows: ~\Documents\Ableton\User Library\Remote Scripts\AbletonOSC
                </li>
              </ul>
            </div>

            <div class="issue">
              <h4>macOS security warning</h4>
              <ul>
                <li>Right-click the app and select "Open" the first time</li>
                <li>Or go to System Settings → Privacy & Security and click "Open Anyway"</li>
              </ul>
            </div>

            <div class="issue">
              <h4>Windows SmartScreen warning</h4>
              <ul>
                <li>Click "More info" then "Run anyway"</li>
                <li>This warning appears because the app isn't code-signed yet</li>
              </ul>
            </div>
          </div>

        {:else if activeTab === 'about'}
          <div class="section">
            <h3>About Mission Control</h3>
            <p>Mission Control is a web-based controller for Ableton Live. It connects to Ableton through OSC (Open Sound Control) via the AbletonOSC remote script.</p>

            <h4>Features</h4>
            <ul>
              <li>View and control your Ableton session from any browser</li>
              <li>Launch clips and scenes</li>
              <li>Transport controls (play, stop, record)</li>
              <li>Track mute, solo, and arm</li>
              <li>Drag and drop clips between slots</li>
              <li>Real-time sync with Ableton</li>
            </ul>

            <h4>Links</h4>
            <p>
              <a href="https://github.com/ryangavin/mission-control" target="_blank" rel="noopener">GitHub Repository</a>
            </p>
            <p>
              <a href="https://github.com/ideoforms/AbletonOSC" target="_blank" rel="noopener">AbletonOSC (Remote Script)</a>
            </p>

            <p class="version">Version 0.1.0 (Beta)</p>
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
