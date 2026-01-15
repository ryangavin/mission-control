<script lang="ts">
  import { intToHex } from './colorUtils';

  interface Props {
    clipState: 'empty' | 'stopped' | 'playing' | 'triggered' | 'recording';
    clipName: string;
    clipColor: number;
    clipProgress: number;
    hasClip: boolean;
    isAudioClip: boolean;
    isMidiClip: boolean;
    isDragSource: boolean;
    isDropTarget: boolean;
    onClick: () => void;
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent) => void;
    onDragEnd: () => void;
  }

  let {
    clipState,
    clipName,
    clipColor,
    clipProgress,
    hasClip,
    isAudioClip,
    isMidiClip,
    isDragSource,
    isDropTarget,
    onClick,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  }: Props = $props();

  // Convert color to hex
  let colorHex = $derived(intToHex(clipColor));

  // Determine if draggable (has clip, not playing or recording)
  let isDraggable = $derived(hasClip && clipState !== 'playing' && clipState !== 'recording');
</script>

<button
  class="clip"
  class:empty={clipState === 'empty'}
  class:has-clip={hasClip}
  class:playing={clipState === 'playing'}
  class:triggered={clipState === 'triggered'}
  class:recording={clipState === 'recording'}
  class:dragging={isDragSource}
  class:drag-over={isDropTarget}
  class:audio-clip={isAudioClip}
  class:midi-clip={isMidiClip}
  style="--color: {colorHex}; --progress: {clipProgress}"
  draggable={isDraggable}
  ondragstart={onDragStart}
  ondragend={onDragEnd}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
  onclick={onClick}
>
  {#if clipState === 'playing' || clipState === 'recording'}
    <div class="clip-progress"></div>
  {/if}
  {#if hasClip}
    <span class="clip-name">{clipName}</span>
    {#if isAudioClip}
      <span class="clip-type-indicator audio">~</span>
    {:else if isMidiClip}
      <span class="clip-type-indicator midi">M</span>
    {/if}
  {/if}
</button>

<style>
  .clip {
    position: relative;
    overflow: hidden;
    padding: 8px 6px;
    height: 47px;
    box-sizing: border-box;
    background: color-mix(in srgb, var(--color) 20%, #2d2d2d);
    border: 1px solid color-mix(in srgb, var(--color) 30%, #111);
    border-radius: 3px;
    color: #fff;
    font-size: 9px;
    cursor: pointer;
    transition: background 0.1s, transform 0.1s;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color) 15%, rgba(255,255,255,0.08));
  }

  .clip:hover {
    background: color-mix(in srgb, var(--color) 40%, #3d3d3d);
  }

  .clip:active {
    transform: scale(0.97);
  }

  /* Empty clip state */
  .clip.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color, #666) 8%, #2a2a2a);
    border-color: color-mix(in srgb, var(--color, #666) 20%, #222);
    box-shadow: none;
    opacity: 0.7;
  }

  .clip.empty:hover {
    background: color-mix(in srgb, var(--color, #666) 15%, #3a3a3a);
    border-color: color-mix(in srgb, var(--color, #666) 30%, #333);
    opacity: 1;
  }

  /* Has clip state (stopped) */
  .clip.has-clip {
    cursor: grab;
  }

  .clip.has-clip:active {
    cursor: grabbing;
  }

  /* Playing state */
  .clip.playing {
    background: color-mix(in srgb, #00ff00 25%, #2d2d2d);
    border-color: #00ff00;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
    cursor: pointer;
  }

  .clip.playing:hover {
    background: color-mix(in srgb, #00ff00 35%, #2d2d2d);
  }

  /* Triggered state */
  .clip.triggered {
    background: color-mix(in srgb, #ffff00 25%, #2d2d2d);
    border-color: #ffff00;
    animation: blink 0.3s ease-in-out infinite;
    cursor: grab;
  }

  .clip.triggered:active {
    cursor: grabbing;
  }

  /* Recording state */
  .clip.recording {
    background: color-mix(in srgb, #ff0000 25%, #2d2d2d);
    border-color: #ff0000;
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.4);
    animation: pulse 0.5s ease-in-out infinite;
    cursor: pointer;
  }

  /* Dragging (source clip being dragged) */
  .clip.dragging {
    opacity: 0.5;
    transform: scale(0.95);
    cursor: grabbing;
  }

  /* Drop target (valid drop zone) */
  .clip.drag-over {
    border: 2px dashed #4CAF50 !important;
    background: color-mix(in srgb, #4CAF50 20%, #2d2d2d) !important;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.4);
  }

  .clip.drag-over::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(76, 175, 80, 0.15);
    border-radius: 2px;
    pointer-events: none;
  }

  /* Audio clip indicator */
  .clip.audio-clip {
    /* Audio clips can have subtle waveform-like styling if desired */
  }

  /* MIDI clip indicator */
  .clip.midi-clip {
    /* MIDI clips can have subtle note-like styling if desired */
  }

  /* Progress bar */
  .clip-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 3px;
    width: calc(var(--progress) * 100%);
    background: rgba(255, 255, 255, 0.6);
    border-radius: 2px 0 0 2px;
    transition: width 0.15s linear;
  }

  .clip.playing .clip-progress {
    background: rgba(100, 255, 100, 0.7);
  }

  .clip.recording .clip-progress {
    background: rgba(255, 100, 100, 0.8);
  }

  /* Clip name */
  .clip-name {
    position: relative;
    z-index: 2;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Clip type indicator */
  .clip-type-indicator {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 8px;
    opacity: 0.5;
    z-index: 2;
  }

  .clip-type-indicator.audio {
    color: #88aaff;
  }

  .clip-type-indicator.midi {
    color: #ffaa88;
  }

  /* Animations */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(255, 0, 0, 0.4); }
    50% { box-shadow: 0 0 16px rgba(255, 0, 0, 0.8); }
  }
</style>
