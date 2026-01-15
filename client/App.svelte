<script lang="ts">
  import { onMount } from 'svelte';
  import type { SessionState } from '../protocol';
  import { connect, disconnect, send, onMessage, onStateChange } from './lib/connection';
  import SetupPanel from './components/SetupPanel.svelte';
  import HelpModal from './components/HelpModal.svelte';
  import Header from './components/Header.svelte';
  import LoadingState from './components/LoadingState.svelte';
  import ClipGrid from './components/ClipGrid.svelte';
  import SceneColumn from './components/SceneColumn.svelte';
  import DeleteZone from './components/DeleteZone.svelte';
  import Footer from './components/Footer.svelte';
  import Toast from './components/Toast.svelte';

  // Help modal state
  let showHelpModal = $state(false);

  // Error toast state
  let errorMessage = $state('');

  // Connection state
  let connectionState = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');
  let abletonConnected = $state(false);
  let syncPhase = $state<string | null>(null);
  let syncProgress = $state<number | null>(null);

  // Full session state
  let session = $state<SessionState | null>(null);

  // Component refs for scroll sync
  let clipGridRef = $state<ClipGrid | null>(null);
  let sceneColumnRef = $state<SceneColumn | null>(null);

  // Delete zone drag state
  let dragOverDelete = $state(false);

  // Apply patches using the kind discriminator
  function applyPatch(patch: any) {
    if (!session) return;

    switch (patch.kind) {
      case 'transport':
        if (patch.tempo !== undefined) session.tempo = patch.tempo;
        if (patch.isPlaying !== undefined) session.isPlaying = patch.isPlaying;
        if (patch.isRecording !== undefined) session.isRecording = patch.isRecording;
        if (patch.metronome !== undefined) session.metronome = patch.metronome;
        if (patch.punchIn !== undefined) session.punchIn = patch.punchIn;
        if (patch.punchOut !== undefined) session.punchOut = patch.punchOut;
        if (patch.loop !== undefined) session.loop = patch.loop;
        if (patch.clipTriggerQuantization !== undefined) session.clipTriggerQuantization = patch.clipTriggerQuantization;
        if (patch.beatTime !== undefined) session.beatTime = patch.beatTime;
        break;

      case 'track':
        session.tracks[patch.trackIndex] = patch.track;
        break;

      case 'clip':
        if (session.tracks[patch.trackIndex]?.clips) {
          session.tracks[patch.trackIndex].clips[patch.sceneIndex] = patch.clipSlot;
        }
        break;

      case 'scene':
        session.scenes[patch.sceneIndex] = patch.scene;
        break;

      case 'selection':
        if (patch.selectedTrack !== undefined) session.selectedTrack = patch.selectedTrack;
        if (patch.selectedScene !== undefined) session.selectedScene = patch.selectedScene;
        break;

      case 'structure':
        console.log('[app] Structure changed, requesting new session');
        send({ type: 'session/request' });
        break;
    }
  }

  onMount(() => {
    onStateChange((state) => {
      connectionState = state;
    });

    onMessage((msg) => {
      switch (msg.type) {
        case 'connected':
          abletonConnected = msg.abletonConnected;
          break;

        case 'session':
          console.log('[app] Session received:', msg.payload.tracks?.length, 'tracks,', msg.payload.scenes?.length, 'scenes');
          session = msg.payload;
          syncPhase = null;
          syncProgress = null;
          break;

        case 'sync_phase':
          syncPhase = msg.phase;
          syncProgress = msg.progress ?? null;
          break;

        case 'patch':
          applyPatch(msg.payload);
          break;

        case 'error':
          console.error('[app] Bridge error:', msg.message);
          errorMessage = msg.message;
          break;
      }
    });

    connect();

    return () => {
      disconnect();
    };
  });

  // Sync vertical scroll between grid and scene column
  function handleGridScroll() {
    if (clipGridRef && sceneColumnRef) {
      const gridEl = clipGridRef.getElement();
      if (gridEl) {
        sceneColumnRef.setScrollTop(gridEl.scrollTop);
      }
    }
  }

  function handleSceneScroll() {
    if (clipGridRef && sceneColumnRef) {
      const sceneEl = sceneColumnRef.getElement();
      if (sceneEl) {
        clipGridRef.setScrollTop(sceneEl.scrollTop);
      }
    }
  }

  // Derived values for easier template access
  let tempo = $derived(session?.tempo ?? 120);
  let isPlaying = $derived(session?.isPlaying ?? false);
  let isRecording = $derived(session?.isRecording ?? false);
  let metronome = $derived(session?.metronome ?? false);
  let punchIn = $derived(session?.punchIn ?? false);
  let punchOut = $derived(session?.punchOut ?? false);
  let loop = $derived(session?.loop ?? false);
  let quantization = $derived(session?.clipTriggerQuantization ?? 8);
  let beatTime = $derived(session?.beatTime ?? 0);
  let tracks = $derived(session?.tracks ?? []);
  let scenes = $derived(session?.scenes ?? []);

  // Transport actions
  function handlePlay() {
    send({ type: 'transport/play' });
  }

  function handleStop() {
    send({ type: 'transport/stop' });
  }

  function handleRecord() {
    const current = session?.isRecording ?? false;
    send({ type: 'transport/record', enabled: !current });
  }

  function handleMetronome() {
    const current = session?.metronome ?? false;
    send({ type: 'transport/metronome', enabled: !current });
  }

  function handlePunchIn() {
    const current = session?.punchIn ?? false;
    send({ type: 'transport/punchIn', enabled: !current });
  }

  function handlePunchOut() {
    const current = session?.punchOut ?? false;
    send({ type: 'transport/punchOut', enabled: !current });
  }

  function handleLoop() {
    const current = session?.loop ?? false;
    send({ type: 'transport/loop', enabled: !current });
  }

  function handleTapTempo() {
    send({ type: 'transport/tapTempo' });
  }

  // Clip/Track/Scene actions
  function handleClipClick(trackId: number, sceneId: number) {
    send({ type: 'clip/fire', trackId, sceneId });
  }

  function handleTrackStop(trackId: number) {
    send({ type: 'track/stop', trackId });
  }

  function handleSceneLaunch(sceneId: number) {
    send({ type: 'scene/fire', sceneId });
  }

  function handleStopAll() {
    tracks.forEach(t => send({ type: 'track/stop', trackId: t.id }));
  }

  function handleMute(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      send({ type: 'mixer/mute', trackId, muted: !track.mute });
    }
  }

  function handleSolo(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      send({ type: 'mixer/solo', trackId, soloed: !track.solo });
    }
  }

  function handleArm(trackId: number) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      send({ type: 'mixer/arm', trackId, armed: !track.arm });
    }
  }

  function handleClipMove(srcTrack: number, srcScene: number, dstTrack: number, dstScene: number) {
    send({
      type: 'clip/move',
      srcTrack,
      srcScene,
      dstTrack,
      dstScene,
    });
  }

  function handleClipDelete(trackId: number, sceneId: number) {
    send({
      type: 'clip/delete',
      trackId,
      sceneId,
    });
  }

  // Delete zone handlers
  function handleDeleteDragOver(event: DragEvent) {
    event.preventDefault();
    dragOverDelete = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDeleteDragLeave() {
    dragOverDelete = false;
  }

  function handleDeleteDrop(event: DragEvent) {
    event.preventDefault();
    if (!clipGridRef) return;

    const dragState = clipGridRef.getDragState();
    if (dragState) {
      handleClipDelete(dragState.sourceTrack, dragState.sourceScene);
      clipGridRef.clearDragState();
    }
    dragOverDelete = false;
  }

  // Check if dragging for delete zone visibility
  let isDragging = $derived(clipGridRef?.getDragState()?.isDragging ?? false);
</script>

<div class="app">
  <SetupPanel isConnected={connectionState === 'connected'} onDismiss={() => {}} />

  <Header
    {connectionState}
    {abletonConnected}
    {tempo}
    {isPlaying}
    {isRecording}
    {metronome}
    {punchIn}
    {punchOut}
    {loop}
    {beatTime}
    {quantization}
    onShowHelp={() => showHelpModal = true}
    onPlay={handlePlay}
    onStop={handleStop}
    onRecord={handleRecord}
    onMetronome={handleMetronome}
    onPunchIn={handlePunchIn}
    onPunchOut={handlePunchOut}
    onLoop={handleLoop}
    onTapTempo={handleTapTempo}
    onQuantization={(value) => send({ type: 'transport/quantization', value })}
    onTempoChange={(newTempo) => send({ type: 'transport/tempo', bpm: newTempo })}
  />

  <main class="main">
    {#if tracks.length === 0}
      <LoadingState
        {connectionState}
        {abletonConnected}
        {syncPhase}
        {syncProgress}
      />
    {:else if session}
      <div class="grid-container">
        <ClipGrid
          bind:this={clipGridRef}
          {session}
          {beatTime}
          onClipClick={handleClipClick}
          onTrackStop={handleTrackStop}
          onMute={handleMute}
          onSolo={handleSolo}
          onArm={handleArm}
          onClipMove={handleClipMove}
          onScroll={handleGridScroll}
        />

        <SceneColumn
          bind:this={sceneColumnRef}
          {scenes}
          onSceneLaunch={handleSceneLaunch}
          onStopAll={handleStopAll}
          onScroll={handleSceneScroll}
        />
      </div>

      <DeleteZone
        isVisible={isDragging}
        isOver={dragOverDelete}
        onDragOver={handleDeleteDragOver}
        onDragLeave={handleDeleteDragLeave}
        onDrop={handleDeleteDrop}
      />
    {/if}
  </main>

  <Footer
    bridgeConnected={connectionState === 'connected'}
    {abletonConnected}
    onShowHelp={() => showHelpModal = true}
  />
</div>

<HelpModal isOpen={showHelpModal} onClose={() => showHelpModal = false} />

<Toast message={errorMessage} type="error" onClose={() => errorMessage = ''} />

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #1e1e1e;
    color: #fff;
    overflow: hidden;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .grid-container {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
</style>
