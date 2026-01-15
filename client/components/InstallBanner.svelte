<script lang="ts">
  import { onMount } from 'svelte';

  let show = $state(false);

  onMount(() => {
    // Check if iOS Safari and not already installed as PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem('install-banner-dismissed');

    if (isIOS && isSafari && !isStandalone && !dismissed) {
      show = true;
    }
  });

  function dismiss() {
    localStorage.setItem('install-banner-dismissed', 'true');
    show = false;
  }
</script>

{#if show}
  <div class="install-banner">
    <div class="content">
      <span class="icon"><i class="fa-solid fa-rocket"></i></span>
      <div class="text">
        <strong>Install Mission Control</strong>
        <span class="instructions">
          Tap <i class="fa-solid fa-arrow-up-from-bracket share-icon"></i> then "Add to Home Screen" for fullscreen
        </span>
      </div>
    </div>
    <button class="dismiss" onclick={dismiss} aria-label="Dismiss">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
{/if}

<style>
  .install-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
    background: linear-gradient(135deg, #2a2218 0%, #1a1a1a 100%);
    border-bottom: 1px solid #333;
  }

  .content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #ff9944;
    border-radius: 8px;
    color: #1a1a1a;
    font-size: 16px;
  }

  .icon i {
    transform: rotate(-90deg);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .text strong {
    font-size: 13px;
    color: #fff;
  }

  .instructions {
    font-size: 11px;
    color: #888;
  }

  .share-icon {
    color: #4af;
    margin: 0 2px;
  }

  .dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .dismiss:hover {
    background: #333;
    color: #fff;
  }
</style>
