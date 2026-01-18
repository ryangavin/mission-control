<script lang="ts">
  interface Props {
    value: number;           // 0-1 normalized value
    min?: number;            // default: 0
    max?: number;            // default: 1
    size?: number;           // diameter in pixels, default: 40
    sensitivity?: number;    // value change per pixel, default: 0.005
    disabled?: boolean;
    label?: string;          // optional label shown in arc gap
    onchange?: (value: number) => void;
  }

  let {
    value,
    min = 0,
    max = 1,
    size = 40,
    sensitivity = 0.005,
    disabled = false,
    label,
    onchange,
  }: Props = $props();

  // Drag state
  let dragState = $state<{
    startX: number;
    startY: number;
    startValue: number;
    currentValue: number;
  } | null>(null);

  // Normalized value 0-1 (use dragged value during drag, otherwise prop value)
  const displayValue = $derived(dragState ? dragState.currentValue : value);
  const normalized = $derived((displayValue - min) / (max - min));

  // Arc configuration (in degrees)
  // Gap at bottom: 60° total (30° each side of 6 o'clock)
  const gapDeg = 60;
  const startDeg = 180 + gapDeg / 2; // 210° (7 o'clock)
  const arcSpan = 360 - gapDeg; // 300°
  const valueDeg = $derived(startDeg + normalized * arcSpan);

  function handleDragStart(e: MouseEvent | TouchEvent) {
    if (disabled) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragState = {
      startX: clientX,
      startY: clientY,
      startValue: value,
      currentValue: value,
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    e.preventDefault();
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!dragState) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Up and right increase, down and left decrease
    const deltaX = clientX - dragState.startX;
    const deltaY = dragState.startY - clientY; // inverted: up = positive
    const delta = (deltaX + deltaY) * sensitivity;

    // Calculate new value clamped to min/max
    const newValue = Math.max(min, Math.min(max, dragState.startValue + delta));

    // Update local drag state for immediate visual feedback
    dragState.currentValue = newValue;

    if (newValue !== value) {
      onchange?.(newValue);
    }

    e.preventDefault();
  }

  function handleDragEnd() {
    dragState = null;

    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  }
</script>

<div
  class="knob"
  class:dragging={dragState !== null}
  class:disabled
  style="--size: {size}px; --start: {startDeg}deg; --value: {valueDeg}deg;"
  onmousedown={handleDragStart}
  ontouchstart={handleDragStart}
  role="slider"
  aria-valuenow={value}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
>
  <div class="knob-track"></div>
  <div class="knob-value"></div>
  <div class="knob-body"></div>
  {#if label}
    <span class="knob-label">{label}</span>
  {/if}
</div>

<style>
  .knob {
    --track-color: #3a3a3a;
    --value-color: #ff9944;
    --body-color: #2a2a2a;
    --border-color: #444;

    width: var(--size);
    height: var(--size);
    position: relative;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .knob.dragging {
    cursor: grabbing;
  }

  .knob.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .knob-track {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from var(--start),
      var(--track-color) 0deg,
      var(--track-color) 300deg,
      transparent 300deg
    );
    -webkit-mask: radial-gradient(transparent 59%, black 60%);
    mask: radial-gradient(transparent 59%, black 60%);
  }

  .knob-value {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from var(--start),
      var(--value-color) 0deg,
      var(--value-color) calc(var(--value) - var(--start)),
      transparent calc(var(--value) - var(--start))
    );
    -webkit-mask: radial-gradient(transparent 59%, black 60%);
    mask: radial-gradient(transparent 59%, black 60%);
    transition: background 0.05s ease-out;
  }

  .knob.dragging .knob-value {
    transition: none;
  }

  .knob:not(.disabled):hover {
    --value-color: #ffbb66;
  }

  .knob-body {
    position: absolute;
    inset: 20%;
    border-radius: 50%;
    background: var(--body-color);
    border: 1px solid var(--border-color);
  }

  .knob-label {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    font-weight: 500;
    color: #fff;
    line-height: 1;
  }
</style>
