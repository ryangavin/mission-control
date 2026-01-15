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
    onTrackStop: (trackId: number) => void;
    onMute: (trackId: number) => void;
    onSolo: (trackId: number) => void;
    onArm: (trackId: number) => void;
    onClipMove: (srcTrack: number, srcScene: number, dstTrack: number, dstScene: number) => void;
    onScroll?: () => void;
  }

  let {
    session,
    beatTime,
    onClipClick,
    onTrackStop,
    onMute,
    onSolo,
    onArm,
    onClipMove,
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

<div class="grid-scroll" bind:this={element} onscroll={onScroll}>
  <!-- Sticky track headers row with background -->
  <div class="sticky-row track-headers-row" style="--cols: {tracks.length}">
    {#each tracks as track (track.id)}
      <TrackHeader
        {track}
        onMute={() => onMute(track.id)}
        onSolo={() => onSolo(track.id)}
        onArm={() => onArm(track.id)}
      />
    {/each}
  </div>

  <!-- Sticky stop buttons row with background -->
  <div class="sticky-row stop-buttons-row" style="--cols: {tracks.length}">
    {#each tracks as track (track.id)}
      <button
        class="clip-stop"
        style="--color: {intToHex(track.color)}"
        onclick={() => onTrackStop(track.id)}
        title="Stop {track.name}"
      >■</button>
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
</div>

<style>
  .grid-scroll {
    flex: 1;
    overflow: auto;
    background: #1a1a1a;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior: none;
    box-shadow: inset -20px 0 20px -10px rgba(0, 0, 0, 0.7);
  }

  .grid-scroll::-webkit-scrollbar {
    display: none;
  }

  .sticky-row {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 3px;
    min-width: fit-content;
    background: #1a1a1a;
    padding: 0 3px;
    position: sticky;
    z-index: 10;
  }

  .track-headers-row {
    top: 0;
    padding-bottom: 3px;
  }

  .stop-buttons-row {
    top: 59px; /* Below track header (56px) + gap (3px) */
    padding-bottom: 3px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 3px;
    min-width: fit-content;
    background: #1a1a1a;
    padding: 0 3px 3px 3px;
  }

  .clip-stop {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    box-sizing: border-box;
    background: #2a2a2a;
    border: 1px solid #333;
    border-radius: 3px;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .clip-stop:hover {
    background: #3d2d2d;
    border-color: #664444;
    color: #ff8888;
  }

  .clip-stop:active {
    transform: scale(0.97);
  }
</style>
