<script lang="ts">
  interface Props {
    onResync: () => void;
    onShowHelp: () => void;
  }

  let { onResync, onShowHelp }: Props = $props();
</script>

<div class="header-box header-group actions-group">
  <button class="group-item" title="Resync" onclick={onResync}>
    <i class="fa-solid fa-arrows-rotate"></i>
  </button>
  <button class="group-item" title="Help" onclick={onShowHelp}>
    <i class="fa-solid fa-question"></i>
  </button>
</div>
