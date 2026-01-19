<script lang="ts">
  interface Props {
    value: number;        // 0-1 normalized volume
    showTicks?: boolean;  // show dB tick marks
    onchange?: (value: number) => void;
  }

  let { value, showTicks = true, onchange }: Props = $props();

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

  const volumeTicks = [
    { db: '6', pct: dbToSliderPct(6), zero: false },    // +6dB = 100%
    { db: '0', pct: dbToSliderPct(0), zero: true },     // 0dB = 85%
    { db: '60', pct: dbToSliderPct(-60), zero: false }, // -60dB = 3%
  ];

  function handleInput(e: Event) {
    const newValue = parseFloat((e.target as HTMLInputElement).value) / 100;
    onchange?.(newValue);
  }
</script>

<div class="volume-fader">
  <input
    type="range"
    class="volume-slider"
    min="0"
    max="100"
    value={Math.round(value * 100)}
    style="--value: {value * 100}%"
    oninput={handleInput}
    title="Volume"
    orient="vertical"
  />
  {#if showTicks}
    <div class="volume-ticks">
      {#each volumeTicks as tick}
        {@const offset = 5 * (1 - tick.pct / 50)}
        <div
          class="tick"
          class:zero={tick.zero}
          style="bottom: calc({tick.pct}% + {offset}px)"
        ><span>{tick.db}</span></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .volume-fader {
    flex: 1;
    position: relative;
    display: flex;
    min-height: 0;
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
    background: linear-gradient(to top, var(--accent-primary) var(--value, 0%), var(--border-medium) var(--value, 0%));
    border-radius: var(--radius-xs, 2px);
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 10px;
    background: var(--text-muted);
    border-radius: var(--radius-xs, 2px);
    cursor: pointer;
    margin-left: -7px;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    background: var(--text-primary);
  }

  /* Firefox support */
  .volume-slider::-moz-range-track {
    width: 6px;
    height: 100%;
    background: var(--border-medium);
    border-radius: var(--radius-xs, 2px);
  }

  .volume-slider::-moz-range-progress {
    background: var(--accent-primary);
    border-radius: var(--radius-xs, 2px);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 10px;
    background: var(--text-muted);
    border-radius: var(--radius-xs, 2px);
    border: none;
    cursor: pointer;
  }

  .volume-slider::-moz-range-thumb:hover {
    background: var(--text-primary);
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
    background: var(--text-subtle);
    transform: translateY(50%);
  }

  .tick.zero {
    background: var(--text-primary);
  }

  .tick span {
    position: absolute;
    left: 7px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 9px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .tick.zero span {
    color: var(--text-primary);
  }
</style>
