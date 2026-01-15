<script lang="ts">
  import ConnectionStatus from './ConnectionStatus.svelte';

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

<header class="header">
  <div class="header-left">
    <div class="app-brand">
      <i class="fa-solid fa-rocket app-icon"></i>
      <span class="app-title">Mission Control</span>
    </div>
  </div>
  <div class="header-center">
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
        <span class="metronome-icon"><span>●</span><span>○</span></span>
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
        <span class="icon">▶</span>
      </button>
      <button class="group-item transport-btn" title="Stop" onclick={onStop}>
        <span class="icon">■</span>
      </button>
      <button class="group-item transport-btn record" class:active={isRecording} title="Record" onclick={onRecord}>
        <span class="icon">●</span>
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
  </div>
  <div class="header-right">
    <div class="status-wrapper">
      <ConnectionStatus
        bridgeConnected={connectionState === 'connected'}
        {abletonConnected}
      />
    </div>
    <button class="header-box help-btn" title="Help" onclick={onShowHelp}>?</button>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: #151515;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .app-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .app-icon {
    font-size: 16px;
    color: #ff9944;
    transform: rotate(-90deg);
  }

  .app-title {
    font-size: 14px;
    font-weight: 600;
    color: #888;
  }

  .header-center {
    display: flex;
    align-items: stretch;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex: 1;
  }

  .header-box {
    display: flex;
    align-items: center;
    height: 32px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
  }

  .help-btn {
    justify-content: center;
    padding: 0 12px;
    color: #888;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
  }

  .help-btn:hover {
    background: #2a2a2a;
    color: #fff;
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
    border-right: 1px solid #333;
    color: #888;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
  }

  .group-item:last-child {
    border-right: none;
  }

  button.group-item:hover {
    background: #2a2a2a;
    color: #fff;
  }

  button.group-item:active {
    background: #222;
  }

  button.group-item.active {
    background: #2a2218;
    color: #ff9944;
  }

  .group-select {
    padding: 0 8px;
    outline: none;
    cursor: pointer;
  }

  .group-select:hover {
    background: #2a2a2a;
    color: #fff;
  }

  .transport-btn {
    min-width: 32px;
    flex-shrink: 0;
  }

  .transport-btn .icon {
    font-size: 10px;
    pointer-events: none;
  }

  .transport-btn.active {
    background: #2a2218;
    color: #ff9944;
  }

  .transport-btn.record.active {
    background: #3a2a2a;
    color: #f44;
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
    color: #ff9944;
    cursor: ew-resize;
    user-select: none;
  }

  .tempo-value.dragging {
    color: #ffbb66;
  }

  .tempo-suffix {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: #888;
  }

  .playhead-item {
    cursor: default;
  }

  .playhead-value {
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
    color: #ff9944;
  }

  .metronome-icon {
    font-size: 12px;
    display: flex;
    gap: 2px;
  }

  .loop-btn {
    padding: 0 8px;
  }

  .loop-btn i {
    font-size: 12px;
    pointer-events: none;
  }

  /* Responsive: hide app title at medium widths */
  @media (max-width: 900px) {
    .app-title {
      display: none;
    }
  }

  /* Responsive: hide status, help, and logo - footer takes over */
  @media (max-width: 580px) {
    .header-left,
    .header-right {
      display: none;
    }

    .tempo-suffix {
      display: none;
    }

    .header-center {
      flex: 1;
      justify-content: space-between;
      margin: 0 1px;
    }

    .metronome-icon {
      flex-direction: column;
    }
  }

</style>
