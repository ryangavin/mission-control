<script lang="ts">
  interface Props {
    clipState: 'empty' | 'has-clip' | 'playing' | 'triggered' | 'recording';
    clipName: string;
    clipColor: string;
    sceneColor: string;
    clipProgress: number;
    isArmed: boolean;
    isDragSource: boolean;
    isDropTarget: boolean;
    isDropInvalid: boolean;
    onClick: () => void;
    onDragStart: (e: DragEvent) => void;
    onDragEnd: () => void;
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  }

  let {
    clipState,
    clipName,
    clipColor,
    sceneColor,
    clipProgress,
    isArmed,
    isDragSource,
    isDropTarget,
    isDropInvalid,
    onClick,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
  }: Props = $props();

  // Determine if draggable (has clip, not playing or recording)
  let isDraggable = $derived(clipState !== 'empty' && clipState !== 'playing' && clipState !== 'recording');
</script>

<button
  class="clip {clipState}"
  class:armed={isArmed && clipState === 'empty'}
  class:dragging={isDragSource}
  class:drop-target={isDropTarget}
  class:drop-invalid={isDropInvalid}
  style="--color: {clipColor}; --scene-color: {sceneColor}; --progress: {clipProgress}"
  draggable={isDraggable}
  ondragstart={onDragStart}
  ondragend={onDragEnd}
  ondragover={onDragOver}
  ondrop={onDrop}
  onclick={onClick}
>
  {#if clipState === 'playing' || clipState === 'recording'}
    <div class="clip-progress"></div>
  {/if}
  {#if clipState === 'empty'}
    {#if isArmed}
      <span class="clip-icon record-ready">●</span>
    {:else}
      <span class="clip-icon stop-ready">■</span>
    {/if}
  {/if}
  {#if clipState !== 'empty'}
    <span class="clip-name">{clipName}</span>
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
    border: 1px solid color-mix(in srgb, var(--color) 40%, #222);
    border-top: 3px solid var(--color);
    border-radius: 3px;
    color: #fff;
    font-size: 9px;
    cursor: pointer;
    transition: background 0.1s, transform 0.1s;
    text-align: left;
    text-overflow: ellipsis;
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
    background: color-mix(in srgb, var(--scene-color, #666) 8%, #2a2a2a);
    border: 1px solid color-mix(in srgb, var(--scene-color, #666) 20%, #222);
    box-shadow: none;
    opacity: 0.7;
  }

  .clip.empty:hover {
    background: color-mix(in srgb, var(--scene-color, #666) 15%, #3a3a3a);
    border-color: color-mix(in srgb, var(--scene-color, #666) 30%, #333);
    opacity: 1;
  }

  /* Armed empty slot has subtle red tint */
  .clip.empty.armed {
    background: color-mix(in srgb, #ff0000 8%, #2a2a2a);
    border-color: color-mix(in srgb, #ff0000 20%, #333);
  }

  /* Has clip state */
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

  /* Valid drop target */
  .clip.drop-target {
    border: 2px dashed #4CAF50 !important;
    background: color-mix(in srgb, #4CAF50 20%, #2d2d2d) !important;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.4);
  }

  .clip.drop-target::after {
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

  /* Clip with content when it's a drop target (shows replacement indicator) */
  .clip.drop-target.has-clip::before {
    content: '↻';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    z-index: 5;
  }

  /* Invalid drop target (while dragging) */
  .clip.drop-invalid {
    opacity: 0.3;
    cursor: not-allowed;
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

  /* Clip icon for empty cells */
  .clip-icon {
    font-size: 12px;
    position: relative;
    z-index: 2;
  }

  .clip-icon.record-ready {
    color: #aa4444;
    opacity: 0.6;
  }

  .clip-icon.stop-ready {
    color: #666;
    opacity: 0.4;
  }

  .clip.empty:hover .clip-icon.record-ready {
    color: #ff4444;
    opacity: 1;
  }

  .clip.empty:hover .clip-icon.stop-ready {
    color: #aaa;
    opacity: 0.8;
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
