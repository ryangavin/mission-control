<script lang="ts">
  import pkg from '../../package.json';
  import appIcon from '../assets/app-icon.png';

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
  <div class="modal-backdrop flex-center" onclick={handleBackdropClick}>
    <div class="modal flex-col">
      <div class="modal-header">
        <h2>Mission Control Help</h2>
        <button class="btn-icon" onclick={onClose} aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
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
                  <p>Download <a href="https://github.com/ideoforms/AbletonOSC/releases" target="_blank" rel="noopener">AbletonOSC</a> and copy the folder to your Remote Scripts directory:</p>
                  <p class="path">
                    <strong>macOS:</strong> ~/Music/Ableton/User Library/Remote Scripts/<br>
                    <strong>Windows:</strong> ~\Documents\Ableton\User Library\Remote Scripts\
                  </p>
                  <p class="path-note">Your location may differ if you've customized your User Library path in Ableton's preferences.</p>
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
                <li>Verify the script is in your User Library's <code>Remote Scripts</code> folder. Find your User Library location in Ableton: <code>Preferences</code> → <code>Library</code> → <code>User Library</code></li>
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
            <div class="about-left flex-center">
              <img src={appIcon} alt="Mission Control" class="app-icon" />
            </div>
            <div class="about-right flex-col">
              <h3>Mission Control</h3>
              <p class="tagline">Web-based controller for Ableton Live</p>

              <div class="about-links">
                <a href="https://github.com/ryangavin/mission-control" target="_blank" rel="noopener" class="about-btn">
                  <i class="fa-brands fa-github"></i> GitHub
                </a>
                <a href="https://ko-fi.com/ryangavin" target="_blank" rel="noopener" class="about-btn donate">
                  <i class="fa-solid fa-heart"></i> Donate
                </a>
              </div>
              <p class="credits">Powered by <a href="https://github.com/ideoforms/AbletonOSC" target="_blank" rel="noopener">AbletonOSC</a></p>

              <div class="about-footer">
                <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener" class="license">GPL-3.0</a>
                <span class="version">v{pkg.version}</span>
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
    z-index: 1000;
  }

  .modal {
    background: var(--bg-medium);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    width: 90%;
    max-width: 600px;
    height: 410px;
    max-height: 80vh;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 16px;
  }

  .tab {
    background: none;
    border: none;
    border-radius: 0;
    color: var(--text-muted);
    padding: 12px 16px;
    cursor: pointer;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab:hover {
    color: var(--text-primary);
  }

  .tab.active {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
  }

  .modal-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 20px;
    min-height: 0;
  }

  .modal-content > .section {
    flex: 1;
  }

  .section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .section h4 {
    margin: 20px 0 8px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .section p {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
    margin: 8px 0;
  }

  .section a {
    color: var(--accent-primary);
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
    background: var(--border-subtle);
    color: var(--text-muted);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .steps li strong {
    display: block;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .steps li p {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .issue {
    margin-bottom: 20px;
    padding: 12px;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
  }

  .issue h4 {
    margin: 0 0 8px 0;
    color: var(--accent-primary);
  }

  .issue ul {
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .issue li {
    margin-bottom: 4px;
  }

  .section.about-section {
    display: flex;
    gap: 24px;
    padding: 0;
    height: 100%;
    box-sizing: border-box;
  }

  .about-left {
    flex: 1;
    background: var(--bg-dark);
    border-radius: var(--radius-lg);
  }

  .about-right {
    flex: 2;
    min-width: 0;
    overflow: hidden;
  }

  .app-icon {
    width: 180px;
    height: 180px;
  }

  .about-section h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
  }

  .tagline {
    color: var(--text-muted);
    font-size: 14px;
    margin: 0;
  }

  .about-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-xl);
    margin: 20px 0;
  }

  .about-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-md);
    padding: 10px 20px;
    background: var(--bg-dark);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: var(--transition-fast);
  }

  .about-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .about-btn.donate {
    border-color: var(--accent-donate);
    color: var(--accent-donate);
  }

  .about-btn.donate:hover {
    background: #ff6b6b22;
    border-color: var(--accent-donate);
  }

  .credits {
    font-size: 12px;
    color: var(--text-subtle);
    margin: 0;
  }

  .credits a {
    color: var(--accent-primary);
  }

  .about-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--border-subtle);
  }

  .license {
    color: var(--border-light);
    font-size: 12px;
  }

  .license:hover {
    color: var(--text-muted);
  }

  .version {
    color: var(--border-light);
    font-size: 12px;
  }

  .nav-path {
    white-space: nowrap;
    color: var(--text-subtle);
  }

  .nav-path code {
    background: var(--border-subtle);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 12px;
    margin: 0 2px;
  }

  .path {
    background: var(--bg-elevated);
    padding: 8px 12px;
    border-radius: var(--radius-md);
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .path-note {
    font-size: 11px;
    color: var(--text-subtle);
    font-style: italic;
    margin-top: 8px;
  }

  .steps li code {
    background: var(--border-subtle);
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 12px;
  }

  .recommended {
    color: var(--text-secondary);
  }

  .manual-install {
    margin-top: 8px;
    font-size: 14px;
  }

  .manual-install summary {
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
  }

  .manual-install summary:hover {
    color: var(--text-secondary);
  }

  .manual-install p {
    margin: 8px 0 0 0;
  }
</style>
