import type { Track, ClipSlot } from '../../protocol';

export type ClipState = 'empty' | 'stopped' | 'playing' | 'triggered' | 'recording';

export function getClip(tracks: Track[], trackIndex: number, sceneIndex: number): ClipSlot | undefined {
  return tracks[trackIndex]?.clips[sceneIndex];
}

export function getClipState(tracks: Track[], trackIndex: number, sceneIndex: number): ClipState {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.hasClip) return 'empty';

  const track = tracks[trackIndex];
  if (!track) return 'stopped';

  // Check if this slot is the one that's playing or triggered
  const isPlaying = track.playingSlotIndex === sceneIndex;
  const isTriggered = track.firedSlotIndex === sceneIndex && !isPlaying;
  const isRecording = clipSlot.clip?.isRecording ?? false;

  if (isRecording) return 'recording';
  if (isPlaying) return 'playing';
  if (isTriggered) return 'triggered';
  return 'stopped';
}

export function getClipName(tracks: Track[], trackIndex: number, sceneIndex: number): string {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  return clipSlot?.clip?.name || '';
}

export function getClipProgress(tracks: Track[], trackIndex: number, sceneIndex: number, beatTime: number): number {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.clip?.length) return 0;
  const position = beatTime % clipSlot.clip.length;
  return position / clipSlot.clip.length;
}

export function getClipColor(tracks: Track[], trackIndex: number, sceneIndex: number): number {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  const track = tracks[trackIndex];
  return clipSlot?.clip?.color || track?.color || 0;
}
