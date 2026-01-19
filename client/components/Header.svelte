<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte';
  import ActionsGroup from './ActionsGroup.svelte';

  // Quantization value labels
  const QUANTIZATION_OPTIONS = [
    { value: 0, label: 'None' },
    { value: 1, label: '8 Bars' },
    { value: 2, label: '4 Bars' },
    { value: 3, label: '2 Bars' },
    { value: 4, label: '1 Bar' },
    { value: 5, label: '1/2' },
    { value: 6, label: '1/2T' },
    { value: 7, label: '1/4' },
    { value: 8, label: '1/4T' },
    { value: 9, label: '1/8' },
    { value: 10, label: '1/8T' },
    { value: 11, label: '1/16' },
    { value: 12, label: '1/16T' },
    { value: 13, label: '1/32' },
  ];

  interface Props {
    connectionState: 'disconnected' | 'connecting' | 'connected';
    abletonConnected: boolean;
    tempo: number;
    isPlaying: boolean;
    isRecording: boolean;
    metronome: boolean;
    punchIn: boolean;
    punchOut: boolean;
    loop: boolean;
    beatTime: number;
    quantization: number;
    onShowHelp: () => void;
    onPlay: () => void;
    onStop: () => void;
    onRecord: () => void;
    onMetronome: () => void;
    onPunchIn: () => void;
    onPunchOut: () => void;
    onLoop: () => void;
    onTapTempo: () => void;
    onQuantization: (value: number) => void;
    onTempoChange: (tempo: number) => void;
    onResync: () => void;
  }

  let {
    connectionState,
    abletonConnected,
    tempo,
    isPlaying,
    isRecording,
    metronome,
    punchIn,
    punchOut,
    loop,
    beatTime,
    quantization,
    onShowHelp,
    onPlay,
    onStop,
    onRecord,
    onMetronome,
    onPunchIn,
    onPunchOut,
    onLoop,
    onTapTempo,
    onQuantization,
    onTempoChange,
    onResync,
  }: Props = $props();

  // Tempo drag state for tap-and-drag control
  let tempoDragState = $state<{
    startX: number;
    startTempo: number;
  } | null>(null);

  // Format beat time as bar.beat.sixteenth (e.g., "1.1.1")
  function formatBeatTime(beats: number): string {
    // Ableton uses 4/4 time signature by default
    // 1 bar = 4 beats, 1 beat = 4 sixteenths
    const bar = Math.floor(beats / 4) + 1;
    const beat = Math.floor(beats % 4) + 1;
    const sixteenth = Math.floor((beats % 1) * 4) + 1;
    return `${bar}.${beat}.${sixteenth}`;
  }

  // Tempo drag handlers
  function handleTempoMouseDown(e: MouseEvent) {
    tempoDragState = {
      startX: e.clientX,
      startTempo: tempo,
    };
    e.preventDefault();

    // Add window event listeners
    window.addEventListener('mousemove', handleTempoMouseMove);
    window.addEventListener('mouseup', handleTempoMouseUp);
  }

  function handleTempoMouseMove(e: MouseEvent) {
    if (!tempoDragState) return;

    const deltaX = e.clientX - tempoDragState.startX;
    // Fine sensitivity: ~0.15 BPM per pixel
    const deltaTempo = deltaX * 0.15;
    const newTempo = Math.max(20, Math.min(999, tempoDragState.startTempo + deltaTempo));

    onTempoChange(newTempo);
  }

  function handleTempoMouseUp() {
    tempoDragState = null;
    // Remove window event listeners
    window.removeEventListener('mousemove', handleTempoMouseMove);
    window.removeEventListener('mouseup', handleTempoMouseUp);
  }

  function handleQuantization(e: Event) {
    const value = parseInt((e.target as HTMLSelectElement).value);
    onQuantization(value);
  }
</script>

<header class="header hide-scrollbar">
  <div class="app-brand">
    <i class="fa-solid fa-rocket app-icon"></i>
    <span class="app-title">Mission Control</span>
  </div>
  <div class="header-box header-group">
    <button class="group-item" title="Tap Tempo" onclick={onTapTempo}>TAP</button>
    <span class="group-item tempo-item">
      <span
        class="tempo-value"
        class:dragging={tempoDragState !== null}
        role="slider"
        tabindex="0"
        aria-label="Tempo"
        aria-valuenow={tempo}
        aria-valuemin={20}
        aria-valuemax={999}
        onmousedown={handleTempoMouseDown}
      >{tempo.toFixed(2)}</span>
      <span class="tempo-suffix">BPM</span>
    </span>
    <button class="group-item" class:active={metronome} title="Metronome" onclick={onMetronome}>
      <span class="metronome-icon"><i class="fa-solid fa-circle"></i><i class="fa-regular fa-circle"></i></span>
    </button>
    <select class="group-item group-select" title="Clip Trigger Quantization" value={quantization} onchange={handleQuantization}>
      {#each QUANTIZATION_OPTIONS as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>
  <div class="header-box header-group">
    <span class="group-item playhead-item">
      <span class="playhead-value">{formatBeatTime(beatTime)}</span>
    </span>
    <button class="group-item transport-btn" class:active={isPlaying} title="Play" onclick={onPlay}>
      <i class="fa-solid fa-play icon"></i>
    </button>
    <button class="group-item transport-btn" title="Stop" onclick={onStop}>
      <i class="fa-solid fa-stop icon"></i>
    </button>
    <button class="group-item transport-btn record" class:active={isRecording} title="Record" onclick={onRecord}>
      <i class="fa-solid fa-circle icon"></i>
    </button>
  </div>
  <div class="header-box header-group">
    <button class="group-item loop-btn" class:active={punchIn} title="Punch In" aria-label="Punch In" onclick={onPunchIn}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <button class="group-item loop-btn" class:active={loop} title="Loop" aria-label="Loop" onclick={onLoop}>
      <i class="fa-solid fa-repeat"></i>
    </button>
    <button class="group-item loop-btn" class:active={punchOut} title="Punch Out" aria-label="Punch Out" onclick={onPunchOut}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  </div>
  <ConnectionStatus
    bridgeConnected={connectionState === 'connected'}
    {abletonConnected}
  />
  <ActionsGroup {onResync} {onShowHelp} />
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--gap-md);
    padding: var(--gap-md);
    background: var(--bg-darkest);
    flex-shrink: 0;
  }

  .app-brand {
    display: flex;
    align-items: center;
    gap: var(--gap-lg);
    padding: 0 var(--gap-lg);
  }

  .app-icon {
    font-size: 16px;
    color: var(--accent-primary);
    transform: rotate(-90deg);
  }

  .app-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .header-group {
    overflow: hidden;
    flex-shrink: 0;
  }

  .group-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 10px;
    background: transparent;
    border: none;
    border-radius: 0;
    border-right: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .group-item:last-child {
    border-right: none;
  }

  button.group-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  button.group-item:active {
    background: var(--bg-surface);
  }

  button.group-item.active {
    background: var(--accent-primary-dim);
    color: var(--accent-primary);
  }

  .group-select {
    padding: 0 8px;
    outline: none;
    cursor: pointer;
  }

  .group-select:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .transport-btn {
    min-width: 32px;
    flex-shrink: 0;
  }

  .transport-btn .icon {
    font-size: 12px;
    pointer-events: none;
  }

  .transport-btn.active {
    background: var(--accent-primary-dim);
    color: var(--accent-primary);
  }

  .transport-btn.record.active {
    background: var(--accent-record-dim);
    color: var(--accent-record);
  }

  .tempo-item {
    gap: 4px;
    cursor: default;
  }

  .tempo-value {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: var(--accent-primary);
    cursor: ew-resize;
    user-select: none;
  }

  .tempo-value.dragging {
    color: var(--accent-primary-light);
  }

  .tempo-suffix {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: var(--text-muted);
  }

  .playhead-item {
    cursor: default;
  }

  .playhead-value {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: var(--accent-primary);
  }

  .metronome-icon {
    font-size: 12px;
    display: flex;
    gap: var(--gap-xs);
  }

  .loop-btn {
    padding: 0 8px;
  }

  .loop-btn i {
    font-size: 12px;
    pointer-events: none;
  }

  /* Hide app title before it wraps */
  @media (max-width: 900px) {
    .app-title {
      display: none;
    }
  }

  /* Responsive: compact header at medium widths */
  @media (max-width: 850px) {
    .group-item {
      padding: 0 8px;
      font-size: 9px;
    }

    .tempo-value,
    .tempo-suffix,
    .playhead-value {
      font-size: 11px;
    }

    .transport-btn {
      min-width: 28px;
    }

    .transport-btn .icon {
      font-size: 10px;
    }

    .loop-btn {
      padding: 0 6px;
    }

    .loop-btn i {
      font-size: 10px;
    }

    .metronome-icon {
      font-size: 10px;
      flex-direction: column;
    }
  }

  /* Responsive: hide BPM suffix on narrow screens */
  @media (max-width: 450px) {
    .tempo-suffix {
      display: none;
    }
  }

  /* Responsive: extra compact for phones */
  @media (max-width: 450px) {
    .group-item {
      padding: 0 6px;
      font-size: 8px;
    }

    .tempo-value,
    .playhead-value {
      font-size: 10px;
    }

    .transport-btn {
      min-width: 24px;
    }

    .transport-btn .icon {
      font-size: 9px;
    }

    .loop-btn {
      padding: 0 5px;
    }

    .loop-btn i {
      font-size: 9px;
    }

    .metronome-icon {
      font-size: 8px;
    }
  }

  /* Responsive: hide brand/status/actions, footer takes over */
  @media (max-width: 680px) {
    .header {
      gap: var(--gap-sm);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .app-brand,
    .header :global(.connection-status),
    .header :global(.actions-group) {
      display: none;
    }
  }

  /* Landscape mobile: compact header to fit with safe area padding */
  @media (orientation: landscape) and (max-height: 500px) {
    .group-item {
      padding: 0 6px;
      font-size: 9px;
    }

    .tempo-value,
    .tempo-suffix,
    .playhead-value {
      font-size: 11px;
    }

    .transport-btn {
      min-width: 26px;
    }

    .transport-btn .icon {
      font-size: 10px;
    }

    .loop-btn {
      padding: 0 5px;
    }

    .loop-btn i {
      font-size: 10px;
    }

    .metronome-icon {
      font-size: 9px;
    }
  }

</style>
