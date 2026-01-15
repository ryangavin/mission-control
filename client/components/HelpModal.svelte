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
            <h3>Setting Up Ableton Live</h3>
            <ol class="steps">
              <li>
                <strong>Install the Remote Script</strong>
                <p class="recommended">Click the tray icon → <code>Install Remote Script</code></p>
                <details class="manual-install">
                  <summary>Manual installation</summary>
                  <p>Download <a href="https://github.com/ideoforms/AbletonOSC/releases" target="_blank" rel="noopener">AbletonOSC</a> and copy the folder to:</p>
                  <p class="path">
                    <strong>macOS:</strong> ~/Music/Ableton/User Library/Remote Scripts/<br>
                    <strong>Windows:</strong> ~\Documents\Ableton\User Library\Remote Scripts\
                  </p>
                </details>
              </li>
              <li>
                <strong>Enable in Ableton</strong>
                <p class="nav-path"><code>Preferences</code> → <code>Link, Tempo & MIDI</code> → <code>Control Surface</code> → <code>AbletonOSC</code></p>
              </li>
              <li>
                <strong>Open a Project</strong>
                <p>Open or create a Live Set. Mission Control will automatically connect.</p>
              </li>
            </ol>
          </div>

        {:else if activeTab === 'troubleshooting'}
          <div class="section">
            <h3>Common Issues</h3>

            <div class="issue">
              <h4>"Waiting for Ableton Live"</h4>
              <ul>
                <li>Ensure Ableton Live is running with a project open</li>
                <li>Check that AbletonOSC is selected in Preferences → Link, Tempo & MIDI → Control Surface</li>
                <li>Try restarting Ableton after installing the remote script</li>
              </ul>
            </div>

            <div class="issue">
              <h4>AbletonOSC not appearing in Control Surface list</h4>
              <ul>
                <li>Make sure the folder is named exactly <code>AbletonOSC</code> (no version number)</li>
                <li>Restart Ableton Live completely after copying the folder</li>
                <li>Verify the script location:
                  <br>macOS: ~/Music/Ableton/User Library/Remote Scripts/AbletonOSC
                  <br>Windows: ~\Documents\Ableton\User Library\Remote Scripts\AbletonOSC
                </li>
              </ul>
            </div>

            <div class="issue">
              <h4>Controls not responding</h4>
              <ul>
                <li>Check that AbletonOSC is still selected in Control Surface preferences</li>
                <li>Try refreshing the browser page</li>
                <li>Restart Ableton Live</li>
              </ul>
            </div>
          </div>

        {:else if activeTab === 'about'}
          <div class="section about-section">
            <div class="about-left">
              <div class="app-icon">
                <i class="fa-solid fa-rocket"></i>
              </div>
            </div>
            <div class="about-right">
              <h3>Mission Control</h3>
              <p class="tagline">Web-based controller for Ableton Live</p>

              <div class="about-links">
                <a href="https://github.com/ryangavin/mission-control" target="_blank" rel="noopener" class="about-btn">
                  <i class="fa-brands fa-github"></i> GitHub
                </a>
                <a href="https://github.com/ideoforms/AbletonOSC" target="_blank" rel="noopener" class="about-btn">
                  AbletonOSC
                </a>
              </div>

              <div class="about-footer">
                <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener" class="license">GPL-3.0</a>
                <span class="version">v0.1.0</span>
              </div>
            </div>
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
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: all 0.1s;
  }

  .close-btn:hover {
    background: #2a2a2a;
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
    border-radius: 0;
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

  .about-section {
    display: flex;
    gap: 24px;
    padding: 0;
  }

  .about-left {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    border-radius: 6px;
  }

  .about-right {
    flex: 2;
    display: flex;
    flex-direction: column;
  }

  .app-icon {
    font-size: 56px;
    color: #ff9944;
  }

  .about-section h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
  }

  .tagline {
    color: #888;
    font-size: 14px;
    margin: 0;
  }

  .about-links {
    display: flex;
    gap: 12px;
    margin: 20px 0;
  }

  .about-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #ccc;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.1s;
  }

  .about-btn:hover {
    background: #2a2a2a;
    color: #fff;
  }

  .about-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid #333;
  }

  .license {
    color: #555;
    font-size: 12px;
  }

  .license:hover {
    color: #888;
  }

  .version {
    color: #555;
    font-size: 12px;
  }

  .nav-path {
    white-space: nowrap;
    color: #666;
  }

  .nav-path code {
    background: #333;
    padding: 2px 6px;
    border-radius: 3px;
    color: #ccc;
    font-size: 12px;
    margin: 0 2px;
  }

  .path {
    background: #252525;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    color: #888;
    margin-top: 4px;
  }

  .steps li code {
    background: #333;
    padding: 1px 5px;
    border-radius: 3px;
    color: #ccc;
    font-size: 12px;
  }

  .recommended {
    color: #ccc;
  }

  .manual-install {
    margin-top: 8px;
    font-size: 14px;
  }

  .manual-install summary {
    color: #aaa;
    cursor: pointer;
    user-select: none;
  }

  .manual-install summary:hover {
    color: #ccc;
  }

  .manual-install p {
    margin: 8px 0 0 0;
  }
</style>
