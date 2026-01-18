<script lang="ts">
  import type { Track } from '../../protocol';
  import { intToHex } from '../lib/colorUtils';
  import Knob from './Knob.svelte';

  interface Props {
    tracks: Track[];
    masterVolume: number;
    masterPan: number;
    onVolume: (trackId: number, value: number) => void;
    onPan: (trackId: number, value: number) => void;
    onSend: (trackId: number, sendIndex: number, value: number) => void;
    onMute: (trackId: number) => void;
    onSolo: (trackId: number) => void;
    onArm: (trackId: number) => void;
    onStop: (trackId: number) => void;
    onMasterVolume: (value: number) => void;
    onMasterPan: (value: number) => void;
    onStopAll: () => void;
    onScroll?: () => void;
  }

  let {
    tracks,
    masterVolume,
    masterPan,
    onVolume,
    onPan,
    onSend,
    onMute,
    onSolo,
    onArm,
    onStop,
    onMasterVolume,
    onMasterPan,
    onStopAll,
    onScroll,
  }: Props = $props();

  // Send knob layout constants
  const KNOB_SIZE = 28;
  const KNOB_GAP = 10;
  const KNOB_LABEL_OVERFLOW = 8; // label extends below knob

  // Number of sends comes from track data (all tracks have same number)
  const numSends = $derived(tracks[0]?.sends?.length ?? 0);

  // Debug logging
  $effect(() => {
    console.log('[MixerFooter] tracks:', tracks.length);
    console.log('[MixerFooter] numSends:', numSends);
    if (tracks[0]) {
      console.log('[MixerFooter] track[0].sends:', tracks[0].sends);
    }
  });

  // Calculate minimum height needed to display all sends
  const minSendsHeight = $derived(
    numSends > 0
      ? numSends * KNOB_SIZE + (numSends - 1) * KNOB_GAP + KNOB_LABEL_OVERFLOW
      : 0
  );

  // Faders area height (not total footer height)
  const minFadersHeight = $derived(Math.max(minSendsHeight + 30, 80)); // add padding for pan slider
  const STORAGE_KEY = 'mixer-footer-height';

  // Max height is ~40% of viewport (2/5 of screen)
  let maxFadersHeight = $state(Math.round(window.innerHeight * 0.4));

  // Load saved height from storage
  function loadSavedHeight(): number {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 80) {
        return parsed;
      }
    }
    return 100; // default
  }

  let fadersHeight = $state(loadSavedHeight());

  // Ensure height meets minimum when sends change (but only if not collapsed)
  $effect(() => {
    if (fadersHeight > 0 && fadersHeight < minFadersHeight) {
      fadersHeight = minFadersHeight;
    }
  });

  // Update max height on window resize
  $effect(() => {
    const handleResize = () => {
      maxFadersHeight = Math.round(window.innerHeight * 0.4);
      if (fadersHeight > maxFadersHeight) {
        fadersHeight = maxFadersHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  let collapsed = $derived(fadersHeight === 0);

  // Volume tick marks - linear dB spacing
  // 0dB = 85%, +6dB = 100%
  // Same rate above and below: 2.5% per dB
  const dbToPos = (db: number) => {
    return 85 + db * 2.5;
  };

  // Thumb is 10px tall, so 5px offset at each end
  const THUMB_OFFSET = 5;

  // Convert dB to slider percentage
  // Known points: +6dB=100%, 0dB=85%, -60dB=3%
  // Above 0: 2.5% per dB (15% / 6dB)
  // Below 0: 1.367% per dB (82% / 60dB)
  const dbToSliderPct = (db: number) => {
    if (db >= 0) {
      return 85 + db * 2.5;
    }
    return 85 + db * (82 / 60);
  };

  const volumeTicks = $derived(() => {
    const ticks = [
      { db: '6', pct: dbToSliderPct(6), zero: false },    // +6dB = 100%
      { db: '0', pct: dbToSliderPct(0), zero: true },     // 0dB = 85%
      { db: '60', pct: dbToSliderPct(-60), zero: false }, // -60dB = 3%
    ];

    return ticks;
  });

  // Drag state
  let isDragging = $state(false);
  let dragStartY = $state(0);
  let dragStartHeight = $state(0);

  function handleDragStart(e: MouseEvent | TouchEvent) {
    isDragging = true;
    dragStartHeight = fadersHeight;
    dragStartY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);

    e.preventDefault();
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY;
    const rawHeight = Math.max(0, Math.min(maxFadersHeight, dragStartHeight + deltaY));

    // Snap to collapsed as soon as we go below minimum
    fadersHeight = rawHeight < minFadersHeight ? 0 : rawHeight;
  }

  function handleDragEnd() {
    isDragging = false;

    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);

    // Save height preference
    localStorage.setItem(STORAGE_KEY, String(fadersHeight));
  }

  // Scroll sync between faders and buttons areas
  let fadersTracksEl = $state<HTMLDivElement | null>(null);
  let buttonsTracksEl = $state<HTMLDivElement | null>(null);

  function handleFadersScroll() {
    if (fadersTracksEl && buttonsTracksEl) {
      buttonsTracksEl.scrollLeft = fadersTracksEl.scrollLeft;
    }
    onScroll?.();
  }

  function handleButtonsScroll() {
    if (fadersTracksEl && buttonsTracksEl) {
      fadersTracksEl.scrollLeft = buttonsTracksEl.scrollLeft;
    }
    onScroll?.();
  }

  // Expose element for external scroll sync
  export function getElement(): HTMLDivElement | null {
    return buttonsTracksEl;
  }

  export function setScrollLeft(scrollLeft: number) {
    if (buttonsTracksEl) {
      buttonsTracksEl.scrollLeft = scrollLeft;
    }
    if (fadersTracksEl) {
      fadersTracksEl.scrollLeft = scrollLeft;
    }
  }

  function handleVolumeInput(trackId: number, e: Event) {
    const value = parseFloat((e.target as HTMLInputElement).value) / 100;
    onVolume(trackId, value);
  }

  function handlePanInput(trackId: number, e: Event) {
    let value = parseFloat((e.target as HTMLInputElement).value) / 50;
    // Snap to center if within threshold
    if (Math.abs(value) < 0.08) {
      value = 0;
      (e.target as HTMLInputElement).value = '0';
    }
    onPan(trackId, value);
  }

  function handleMasterVolumeInput(e: Event) {
    const value = parseFloat((e.target as HTMLInputElement).value) / 100;
    onMasterVolume(value);
  }

  function handleMasterPanInput(e: Event) {
    let value = parseFloat((e.target as HTMLInputElement).value) / 50;
    // Snap to center if within threshold
    if (Math.abs(value) < 0.08) {
      value = 0;
      (e.target as HTMLInputElement).value = '0';
    }
    onMasterPan(value);
  }
</script>

<div class="mixer-footer">
  <!-- Resize handle -->
  <div
    class="resize-handle"
    class:dragging={isDragging}
    onmousedown={handleDragStart}
    ontouchstart={handleDragStart}
    role="separator"
    aria-orientation="horizontal"
    aria-label="Resize mixer"
  >
    <div class="grip"></div>
  </div>

  <!-- Faders area: resizable, can be hidden -->
  {#if !collapsed}
    <div class="faders-area" style="height: {fadersHeight}px">
      <div class="faders-tracks" bind:this={fadersTracksEl} onscroll={handleFadersScroll} style="--cols: {tracks.length}">
        {#each tracks as track (track.id)}
          <div class="fader-strip" style="--color: {intToHex(track.color)}">
            <div class="fader-content">
              <div class="sends-section">
                {#each track.sends as sendValue, sendIndex}
                  <Knob
                    value={sendValue}
                    onchange={(v) => onSend(track.id, sendIndex, v)}
                    size={28}
                    label={String.fromCharCode(65 + sendIndex)}
                  />
                {/each}
              </div>
              <div class="volume-section">
                <div class="slider-with-ticks">
                  <input
                    type="range"
                    class="volume-slider"
                    min="0"
                    max="100"
                    value={Math.round(track.volume * 100)}
                    style="--value: {track.volume * 100}%"
                    oninput={(e) => handleVolumeInput(track.id, e)}
                    title="Volume"
                    orient="vertical"
                  />
                  <div class="volume-ticks">
                    {#each volumeTicks() as tick}
                      {@const offset = 5 * (1 - tick.pct / 50)}
                      <div
                        class="tick"
                        class:zero={tick.zero}
                        style="bottom: calc({tick.pct}% + {offset}px)"
                      ><span>{tick.db}</span></div>
                    {/each}
                  </div>
                </div>
              </div>
              <div class="fader-spacer"></div>
            </div>
            <div class="pan-section">
              <input
                type="range"
                class="pan-slider"
                min="-50"
                max="50"
                value={track.pan * 50}
                style="--pan-start: {50 + Math.min(0, track.pan * 50)}%; --pan-end: {50 + Math.max(0, track.pan * 50)}%"
                oninput={(e) => handlePanInput(track.id, e)}
                title="Pan"
              />
            </div>
          </div>
        {/each}
      </div>
      <div class="faders-master">
        <div class="fader-strip master">
          <div class="volume-section">
            <input
              type="range"
              class="volume-slider"
              min="0"
              max="100"
              value={Math.round(masterVolume * 100)}
              style="--value: {masterVolume * 100}%"
              oninput={handleMasterVolumeInput}
              title="Master Volume"
              orient="vertical"
            />
          </div>
          <div class="pan-section">
            <input
              type="range"
              class="pan-slider"
              min="-50"
              max="50"
              value={masterPan * 50}
              style="--pan-start: {50 + Math.min(0, masterPan * 50)}%; --pan-end: {50 + Math.max(0, masterPan * 50)}%"
              oninput={handleMasterPanInput}
              title="Master Pan"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Buttons area: always visible, fixed height -->
  <div class="buttons-area">
    <div class="buttons-tracks" bind:this={buttonsTracksEl} onscroll={handleButtonsScroll} style="--cols: {tracks.length}">
      {#each tracks as track (track.id)}
        <div class="button-strip" style="--color: {intToHex(track.color)}">
          <div class="control-buttons">
            <button
              class="control-btn mute"
              class:active={track.mute}
              onclick={() => onMute(track.id)}
              title="Mute"
            >M</button>
            <button
              class="control-btn solo"
              class:active={track.solo}
              onclick={() => onSolo(track.id)}
              title="Solo"
            >S</button>
            <button
              class="control-btn arm"
              class:active={track.arm}
              onclick={() => onArm(track.id)}
              title="Arm"
            >●</button>
          </div>
          <button class="stop-btn" onclick={() => onStop(track.id)} title="Stop Track">■</button>
        </div>
      {/each}
    </div>
    <div class="buttons-master">
      <div class="button-strip master">
        <div class="control-buttons">
          <button class="control-btn placeholder" disabled>M</button>
          <button class="control-btn placeholder" disabled>S</button>
          <button class="control-btn placeholder" disabled>●</button>
        </div>
        <button class="stop-btn" onclick={onStopAll} title="Stop All Clips">■ All</button>
      </div>
    </div>
  </div>
</div>

<style>
  .mixer-footer {
    display: flex;
    flex-direction: column;
    background: #151515;
    border-top: 1px solid #333;
    flex-shrink: 0;
  }

  .resize-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 10px;
    background: #1e1e1e;
    cursor: ns-resize;
    user-select: none;
    touch-action: none;
  }

  .resize-handle:hover,
  .resize-handle.dragging {
    background: #282828;
  }

  .grip {
    width: 40px;
    height: 4px;
    background: #444;
    border-radius: 2px;
  }

  .resize-handle:hover .grip,
  .resize-handle.dragging .grip {
    background: #666;
  }

  /* Faders area: resizable */
  .faders-area {
    display: flex;
    overflow: hidden;
  }

  .faders-tracks {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 3px;
    flex: 1;
    padding: 6px 3px 0 3px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .faders-tracks::-webkit-scrollbar {
    display: none;
  }

  .faders-master {
    width: 80px;
    min-width: 80px;
    padding: 6px 3px 0 3px;
    flex-shrink: 0;
  }

  .fader-strip {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    padding: 4px;
    background: #1e1e1e;
    border-radius: 3px 3px 0 0;
    box-sizing: border-box;
  }

  .fader-content {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .volume-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 0;
  }

  .slider-with-ticks {
    flex: 1;
    position: relative;
    display: flex;
    min-height: 0;
  }


  .sends-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: flex-start;
    align-items: center;
  }

  .fader-spacer {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .volume-ticks {
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: 100%;
    margin-left: 4px;
    width: 30px;
    z-index: 0;
    pointer-events: none;
  }

  .tick {
    position: absolute;
    left: -3px;
    width: 5px;
    height: 1px;
    background: #666;
    transform: translateY(50%);
  }

  .tick.zero {
    background: #fff;
  }

  .tick span {
    position: absolute;
    left: 7px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    color: #888;
    white-space: nowrap;
  }

  .tick.zero span {
    color: #fff;
  }


  .volume-slider {
    flex: 1;
    width: 6px;
    min-height: 20px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    writing-mode: vertical-lr;
    direction: rtl;
    position: relative;
    z-index: 2;
  }

  .volume-slider::-webkit-slider-runnable-track {
    width: 6px;
    height: 100%;
    background: linear-gradient(to top, #5dade2 var(--value, 0%), #444 var(--value, 0%));
    border-radius: 2px;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 10px;
    background: #888;
    border-radius: 2px;
    cursor: pointer;
    margin-left: -6px;
    opacity: 1;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    background: #fff;
  }

  /* Firefox support */
  .volume-slider::-moz-range-track {
    width: 6px;
    height: 100%;
    background: #444;
    border-radius: 2px;
  }

  .volume-slider::-moz-range-progress {
    background: #5dade2;
    border-radius: 2px;
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 10px;
    background: #888;
    border-radius: 2px;
    border: none;
    cursor: pointer;
    opacity: 1;
  }

  .volume-slider::-moz-range-thumb:hover {
    background: #fff;
  }

  .pan-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-width: 0;
    padding: 3px 0;
  }

  .pan-slider {
    flex: 1;
    min-width: 0;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    /* Show blue fill from center to current pan position */
    background: linear-gradient(
      to right,
      #444 var(--pan-start, 50%),
      #5dade2 var(--pan-start, 50%),
      #5dade2 var(--pan-end, 50%),
      #444 var(--pan-end, 50%)
    );
    border-radius: 2px;
    cursor: pointer;
  }

  .pan-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: transparent;
    border-radius: 2px;
  }

  .pan-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -4px;
    background: #888;
    border-radius: 2px;
    cursor: pointer;
  }

  .pan-slider::-webkit-slider-thumb:hover {
    background: #fff;
  }

  /* Firefox pan slider support */
  .pan-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    background: #444;
    border-radius: 2px;
  }

  .pan-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #888;
    border-radius: 2px;
    border: none;
    cursor: pointer;
  }

  .pan-slider::-moz-range-thumb:hover {
    background: #fff;
  }

  /* Buttons area: fixed, always visible */
  .buttons-area {
    display: flex;
    flex-shrink: 0;
  }

  .buttons-tracks {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(80px, 1fr));
    gap: 3px;
    flex: 1;
    padding: 0 3px 6px 3px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .buttons-tracks::-webkit-scrollbar {
    display: none;
  }

  .buttons-master {
    width: 80px;
    min-width: 80px;
    padding: 0 3px 6px 3px;
    flex-shrink: 0;
  }

  .button-strip {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
    background: #1e1e1e;
    border-bottom: 3px solid var(--color, #888);
    border-radius: 0 0 3px 3px;
    box-sizing: border-box;
  }

  .button-strip.master {
    --color: #888;
    border-left: 3px solid var(--color);
    border-bottom: none;
    border-radius: 0 3px 3px 3px;
    padding-bottom: 7px; /* 4px base + 3px to align with track color borders */
  }

  .button-strip.master .stop-btn {
    margin-bottom: 3px;
  }

  .fader-strip.master {
    border-left: 3px solid #888;
    border-radius: 3px 3px 0 0;
  }

  .control-buttons {
    display: flex;
    gap: 2px;
  }

  .control-btn.placeholder {
    visibility: hidden;
  }

  .control-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 2px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid #555;
    border-radius: 3px;
    background: #3d3d3d;
    color: #888;
    cursor: pointer;
    transition: all 0.1s;
  }

  .control-btn:hover {
    background: #4d4d4d;
    color: #fff;
  }

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
