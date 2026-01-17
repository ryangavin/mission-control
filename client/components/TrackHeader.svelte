<script lang="ts">
  import type { Track } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';
  import HeaderCell from './HeaderCell.svelte';

  interface Props {
    track: Track;
  }

  let { track }: Props = $props();
</script>

<HeaderCell name={track.name} color={intToHex(track.color)} />
