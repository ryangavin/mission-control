<script lang="ts">
  import type { Track } from '../../protocol';
  import { intToHex } from './colorUtils';

  interface Props {
    track: Track;
    onMute: () => void;
    onSolo: () => void;
    onArm: () => void;
  }

  let { track, onMute, onSolo, onArm }: Props = $props();
</script>

<div class="track-header" style="--color: {intToHex(track.color)}">
  <div class="track-info">
    <span class="track-color" style="background-color: {intToHex(track.color)}"></span>
    <span class="track-name">{track.name}</span>
  </div>
  <div class="track-controls">
    <button
      class="track-btn mute"
      class:active={track.mute}
      onclick={onMute}
      title="Mute"
    >M</button>
    <button
      class="track-btn solo"
      class:active={track.solo}
      onclick={onSolo}
      title="Solo"
    >S</button>
    <button
      class="track-btn arm"
      class:active={track.arm}
      onclick={onArm}
      title="Arm"
    >R</button>
  </div>
</div>

<style>
  .track-header {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    background: #1e1e1e;
    border-left: 3px solid var(--color);
    border-radius: 0 3px 3px 0;
    font-size: 10px;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;
    height: 56px;
    box-sizing: border-box;
  }

  .track-header::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 3px;
    background: #1a1a1a;
    pointer-events: none;
  }

  .track-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .track-color {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .track-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-controls {
    display: flex;
    gap: 2px;
    width: 100%;
  }

  .track-controls .track-btn {
    flex: 1;
  }

  .track-btn {
    padding: 4px 2px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid #555;
    border-radius: 3px;
    background: #3d3d3d;
    color: #888;
    cursor: pointer;
    transition: all 0.1s;
    min-width: 20px;
    min-height: 24px;
  }

  .track-btn:hover {
    background: #4d4d4d;
    color: #fff;
  }

  .track-btn.mute.active {
    background: #b54;
    border-color: #d65;
    color: #fff;
  }

  .track-btn.solo.active {
    background: #54b;
    border-color: #65d;
    color: #fff;
  }

  .track-btn.arm.active {
    background: #b33;
    border-color: #d44;
    color: #fff;
  }
</style>
