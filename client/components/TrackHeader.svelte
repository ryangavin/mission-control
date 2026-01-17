<script lang="ts">
  import type { Track } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';
  import HeaderCell from './HeaderCell.svelte';

  interface Props {
    track: Track;
    onMute: () => void;
    onSolo: () => void;
    onArm: () => void;
  }

  let { track, onMute, onSolo, onArm }: Props = $props();
</script>

<HeaderCell name={track.name} color={intToHex(track.color)}>
  <button
    class="control-btn mute"
    class:active={track.mute}
    onclick={onMute}
    title="Mute"
  >M</button>
  <button
    class="control-btn solo"
    class:active={track.solo}
    onclick={onSolo}
    title="Solo"
  >S</button>
  <button
    class="control-btn arm"
    class:active={track.arm}
    onclick={onArm}
    title="Arm"
  >●</button>
</HeaderCell>

<style>
  .mute.active {
    background: #b54;
    border-color: #d65;
    color: #fff;
  }

  .solo.active {
    background: #b90;
    border-color: #da2;
    color: #fff;
  }

  .arm.active {
    background: #b33;
    border-color: #d44;
    color: #fff;
  }
</style>
