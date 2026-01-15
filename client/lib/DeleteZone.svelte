<script lang="ts">
  interface Props {
    isVisible: boolean;
    isOver: boolean;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent) => void;
  }

  let { isVisible, isOver, onDragOver, onDragLeave, onDrop }: Props = $props();
</script>

{#if isVisible}
  <div
    class="delete-overlay"
    role="button"
    tabindex="-1"
  >
    <div
      class="delete-zone"
      class:drag-over={isOver}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
    >
      <span class="delete-icon">🗑️</span>
      <span class="delete-text">Drop to Delete</span>
    </div>
  </div>
{/if}

<style>
  .delete-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
    pointer-events: none;
  }

  .delete-zone {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: linear-gradient(to top, rgba(180, 50, 50, 0.95), rgba(140, 40, 40, 0.85));
    color: white;
    font-size: 16px;
    font-weight: 500;
    z-index: 100;
    animation: slideUp 0.2s ease-out;
    transition: background 0.15s, transform 0.15s;
    border-top: 2px solid rgba(255, 100, 100, 0.5);
    pointer-events: auto;
  }

  .delete-zone.drag-over {
    background: linear-gradient(to top, rgba(220, 60, 60, 1), rgba(180, 50, 50, 0.95));
    transform: scale(1.02);
    border-top-color: rgba(255, 150, 150, 0.8);
  }

  .delete-icon {
    font-size: 28px;
  }

  .delete-text {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
