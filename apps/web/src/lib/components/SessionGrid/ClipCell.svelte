<script lang="ts">
  import { send } from '../../stores/connection.svelte';

  interface Props {
    trackId: number;
    sceneId: number;
    hasClip: boolean;
    name?: string;
    color?: string;
    isPlaying?: boolean;
    isTriggered?: boolean;
    isRecording?: boolean;
  }

  let { trackId, sceneId, hasClip, name, color, isPlaying = false, isTriggered = false, isRecording = false }: Props = $props();

  function fire() {
    if (hasClip) {
      send({ type: 'clip/fire', trackId, sceneId });
    }
  }

  function stop() {
    send({ type: 'clip/stop', trackId, sceneId });
  }
</script>

<button
  class="cell"
  class:has-clip={hasClip}
  class:playing={isPlaying}
  class:triggered={isTriggered}
  class:recording={isRecording}
  style="--clip-color: {color || 'transparent'}"
  onclick={fire}
  aria-label={hasClip ? `Launch ${name}` : 'Empty slot'}
>
  {#if hasClip}
    <span class="name">{name}</span>
  {/if}
</button>

<style>
  .cell {
    position: relative;
    min-height: var(--touch-comfortable);
    padding: var(--space-2);
    background: var(--color-bg-elevated);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);
    overflow: hidden;
  }

  .cell.has-clip {
    background: color-mix(in srgb, var(--clip-color) 30%, var(--color-bg-elevated));
    border-color: var(--clip-color);
  }

  .cell:hover {
    background: var(--color-bg-hover);
  }

  .cell.has-clip:hover {
    background: color-mix(in srgb, var(--clip-color) 50%, var(--color-bg-elevated));
  }

  .cell:active {
    transform: scale(0.95);
  }

  .cell.playing {
    border-color: var(--color-playing);
    box-shadow: 0 0 8px var(--color-playing);
  }

  .cell.triggered {
    animation: blink 0.3s ease infinite;
  }

  .cell.recording {
    border-color: var(--color-recording);
    box-shadow: 0 0 8px var(--color-recording);
    animation: pulse-recording 1s ease infinite;
  }

  @keyframes blink {
    0%, 100% { border-color: var(--color-triggered); }
    50% { border-color: transparent; }
  }

  @keyframes pulse-recording {
    0%, 100% { box-shadow: 0 0 8px var(--color-recording); }
    50% { box-shadow: 0 0 16px var(--color-recording); }
  }

  .name {
    font-size: var(--font-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
</style>
