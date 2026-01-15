<script lang="ts">
  let {
    message = '',
    type = 'error',
    onClose = () => {}
  }: {
    message: string;
    type?: 'error' | 'info' | 'success';
    onClose: () => void;
  } = $props();

  // Auto-dismiss after 5 seconds
  $effect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  });
</script>

{#if message}
  <div class="toast toast-{type}" role="alert">
    <span class="message">{message}</span>
    <button class="close" onclick={onClose} aria-label="Dismiss">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000;
    animation: slideUp 0.2s ease-out;
    max-width: 90vw;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .toast-error {
    background: #442222;
    border: 1px solid #663333;
    color: #ff8888;
  }

  .toast-info {
    background: #222244;
    border: 1px solid #333366;
    color: #8888ff;
  }

  .toast-success {
    background: #224422;
    border: 1px solid #336633;
    color: #88ff88;
  }

  .message {
    font-size: 14px;
  }

  .close {
    background: none;
    border: none;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close:hover {
    opacity: 1;
  }
</style>
