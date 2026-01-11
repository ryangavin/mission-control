<script lang="ts">
  import { connection, send } from '../../stores/connection.svelte';

  function play() {
    send({ type: 'transport/play' });
  }

  function stop() {
    send({ type: 'transport/stop' });
  }

  function record() {
    send({ type: 'transport/record' });
  }

  function toggleMetronome() {
    send({ type: 'transport/metronome', enabled: !connection.session.metronome });
  }
</script>

<div class="transport">
  <div class="controls">
    <button
      class="btn stop"
      onclick={stop}
      aria-label="Stop"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" />
      </svg>
    </button>

    <button
      class="btn play"
      class:playing={connection.session.isPlaying}
      onclick={play}
      aria-label="Play"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="8,5 20,12 8,19" />
      </svg>
    </button>

    <button
      class="btn record"
      class:recording={connection.session.isRecording}
      onclick={record}
      aria-label="Record"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8" />
      </svg>
    </button>
  </div>

  <div class="tempo">
    <span class="tempo-value">{connection.session.tempo?.toFixed(2) ?? '120.00'}</span>
    <span class="tempo-label">BPM</span>
  </div>

  <div class="options">
    <button
      class="btn metronome"
      class:active={connection.session.metronome}
      onclick={toggleMetronome}
      aria-label="Metronome"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L8 22h8L12 2zm0 6l2.5 10h-5L12 8z" />
      </svg>
    </button>
  </div>
</div>

<style>
  .transport {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    gap: var(--space-4);
  }

  .controls {
    display: flex;
    gap: var(--space-2);
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--touch-comfortable);
    height: var(--touch-comfortable);
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .btn:hover {
    background: var(--color-bg-hover);
  }

  .btn:active {
    transform: scale(0.95);
  }

  .btn svg {
    width: 24px;
    height: 24px;
  }

  .btn.play.playing {
    background: var(--color-playing);
    color: var(--color-bg-primary);
  }

  .btn.record.recording {
    background: var(--color-recording);
    color: var(--color-text-primary);
  }

  .btn.metronome.active {
    background: var(--color-accent);
    color: var(--color-bg-primary);
  }

  .tempo {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .tempo-value {
    font-size: var(--font-xl);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .tempo-label {
    font-size: var(--font-sm);
    color: var(--color-text-secondary);
  }

  .options {
    display: flex;
    gap: var(--space-2);
  }
</style>
