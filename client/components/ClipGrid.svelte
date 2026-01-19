<script lang="ts">
  import type { SessionState } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';
  import { getClip, getClipState, getClipName, getClipProgress, getClipColor } from '../lib/clipUtils';
  import TrackHeader from './TrackHeader.svelte';
  import ClipCell from './ClipCell.svelte';

  interface Props {
    session: SessionState;
    beatTime: number;
    onClipClick: (trackId: number, sceneId: number) => void;
    onClipMove: (srcTrack: number, srcScene: number, dstTrack: number, dstScene: number) => void;
    onAddScene: () => void;
    onScroll?: () => void;
  }

  let {
    session,
    beatTime,
    onClipClick,
    onClipMove,
    onAddScene,
    onScroll,
  }: Props = $props();

  // Drag-and-drop state
  let dragState = $state<{
    isDragging: boolean;
    sourceTrack: number;
    sourceScene: number;
    clipType: 'audio' | 'midi' | null;
  } | null>(null);

  // Expose element for scroll sync
  let element = $state<HTMLDivElement | null>(null);

  export function getElement(): HTMLDivElement | null {
    return element;
  }

  export function setScrollTop(scrollTop: number) {
    if (element) {
      element.scrollTop = scrollTop;
    }
  }

  // Computed values
  let tracks = $derived(session?.tracks ?? []);
  let scenes = $derived(session?.scenes ?? []);

  // Compute valid drop targets based on clip type and track type
  function isValidDropTarget(trackIndex: number, sceneIndex: number): boolean {
    if (!dragState || !session) return false;

    const track = session.tracks[trackIndex];
    if (!track) return false;

    // Don't drop on self
    if (dragState.sourceTrack === trackIndex && dragState.sourceScene === sceneIndex) {
      return false;
    }

    // Check track type compatibility
    const clipType = dragState.clipType;
    if (clipType === 'audio') {
      return track.hasAudioInput && !track.hasMidiInput;
    } else if (clipType === 'midi') {
      return track.hasMidiInput && !track.hasAudioInput;
    }

    return true;
  }

  // Drag-and-drop handlers
  function handleDragStart(event: DragEvent, trackIndex: number, sceneIndex: number) {
    const clipSlot = getClip(tracks, trackIndex, sceneIndex);
    if (!clipSlot?.hasClip || !clipSlot.clip) {
      event.preventDefault();
      return;
    }

    if (clipSlot.clip.isPlaying || clipSlot.clip.isRecording) {
      event.preventDefault();
      return;
    }

    let clipType: 'audio' | 'midi' | null = null;
    if (clipSlot.clip.isAudioClip) {
      clipType = 'audio';
    } else if (clipSlot.clip.isMidiClip) {
      clipType = 'midi';
    }

    dragState = {
      isDragging: true,
      sourceTrack: trackIndex,
      sourceScene: sceneIndex,
      clipType,
    };

    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', `${trackIndex}:${sceneIndex}`);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(event: DragEvent, trackIndex: number, sceneIndex: number) {
    event.preventDefault();
    if (!dragState) return;

    const isValid = isValidDropTarget(trackIndex, sceneIndex);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = isValid ? 'move' : 'none';
    }
  }

  function handleDrop(event: DragEvent, trackIndex: number, sceneIndex: number) {
    event.preventDefault();
    if (!dragState || !session) return;

    if (!isValidDropTarget(trackIndex, sceneIndex)) {
      dragState = null;
      return;
    }

    onClipMove(dragState.sourceTrack, dragState.sourceScene, trackIndex, sceneIndex);
    dragState = null;
  }

  function handleDragEnd() {
    dragState = null;
  }

  // Expose drag state for delete zone
  export function getDragState() {
    return dragState;
  }

  export function clearDragState() {
    dragState = null;
  }
</script>

<div class="grid-scroll hide-scrollbar" bind:this={element} onscroll={onScroll}>
  <!-- Sticky track headers row with background -->
  <div class="sticky-row track-headers-row" style="--cols: {tracks.length}">
    {#each tracks as track (track.id)}
      <TrackHeader {track} />
    {/each}
  </div>

  <!-- Clip grid -->
  <div class="grid" style="--cols: {tracks.length}">
    {#each scenes as scene, sceneIndex (scene.id)}
      {@const sceneColor = intToHex(scene.color)}
      {#each tracks as track, trackIndex (track.id)}
        {@const clipState = getClipState(tracks, trackIndex, sceneIndex)}
        {@const isDropTarget = dragState && isValidDropTarget(trackIndex, sceneIndex)}
        {@const isDragSource = dragState?.sourceTrack === trackIndex && dragState?.sourceScene === sceneIndex}
        <ClipCell
          {clipState}
          clipName={getClipName(tracks, trackIndex, sceneIndex)}
          clipColor={getClipColor(tracks, trackIndex, sceneIndex)}
          {sceneColor}
          clipProgress={getClipProgress(tracks, trackIndex, sceneIndex, beatTime)}
          isArmed={track.arm}
          {isDragSource}
          isDropTarget={!!isDropTarget}
          isDropInvalid={!!dragState && !isDropTarget && !isDragSource}
          onClick={() => onClipClick(track.id, scene.id)}
          onDragStart={(e) => handleDragStart(e, trackIndex, sceneIndex)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, trackIndex, sceneIndex)}
          onDrop={(e) => handleDrop(e, trackIndex, sceneIndex)}
        />
      {/each}
    {/each}

  </div>

  <!-- Add scene button - outside grid so it can be sticky -->
  <div class="add-scene-row">
    <button class="add-scene-btn flex-center" onclick={onAddScene}>
      <i class="fa-solid fa-plus"></i>
      <span>Add New Scene</span>
    </button>
  </div>
</div>

<style>
  .grid-scroll {
    flex: 1;
    overflow: auto;
    background: var(--bg-dark);
    overscroll-behavior: none;
  }

  .sticky-row {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: var(--gap-sm);
    min-width: fit-content;
    background: var(--bg-dark);
    padding: 0 var(--gap-sm);
    position: sticky;
    z-index: 10;
  }

  .track-headers-row {
    top: 0;
    padding-bottom: var(--gap-sm);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: var(--gap-sm);
    min-width: fit-content;
    background: var(--bg-dark);
    padding: 0 var(--gap-sm) var(--gap-sm) var(--gap-sm);
  }

  .add-scene-row {
    position: sticky;
    left: 0;
    padding: var(--gap-xl) 20px var(--gap-sm) 20px;
    display: flex;
    justify-content: center;
  }

  .add-scene-btn {
    gap: var(--gap-lg);
    width: 200px;
    height: var(--cell-height);
    box-sizing: border-box;
    background: var(--bg-hover);
    border: 1px dashed var(--border-light);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .add-scene-btn i {
    font-size: 16px;
  }

  .add-scene-btn:hover {
    background: var(--bg-active);
    border-color: #777;
    color: var(--text-primary);
  }

  .add-scene-btn:active {
    transform: scale(0.98);
  }

</style>
