import type { Track, ClipSlot } from '../../protocol';
import { intToHex } from './colorUtils';

export type ClipState = 'empty' | 'has-clip' | 'playing' | 'triggered' | 'recording';

export function getClip(tracks: Track[], trackIndex: number, sceneIndex: number): ClipSlot | null {
  const track = tracks[trackIndex];
  if (!track?.clips) return null;
  return track.clips[sceneIndex] ?? null;
}

export function getClipState(tracks: Track[], trackIndex: number, sceneIndex: number): ClipState {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.hasClip) return 'empty';

  if (clipSlot.clip?.isRecording) return 'recording';

  const track = tracks[trackIndex];
  if (track) {
    if (track.playingSlotIndex === sceneIndex) return 'playing';
    if (track.firedSlotIndex === sceneIndex && track.firedSlotIndex !== track.playingSlotIndex) return 'triggered';
  }

  return 'has-clip';
}

export function getClipName(tracks: Track[], trackIndex: number, sceneIndex: number): string {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.hasClip || !clipSlot.clip) return '';
  const track = tracks[trackIndex];
  return clipSlot.clip.name || track?.name || '';
}

export function getClipProgress(tracks: Track[], trackIndex: number, sceneIndex: number, beatTime: number): number {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (!clipSlot?.clip?.length) return 0;

  const track = tracks[trackIndex];
  if (!track || track.playingSlotIndex !== sceneIndex) return 0;

  const clipLength = clipSlot.clip.length;
  const position = beatTime % clipLength;
  return position / clipLength;
}

export function getClipColor(tracks: Track[], trackIndex: number, sceneIndex: number): string {
  const clipSlot = getClip(tracks, trackIndex, sceneIndex);
  if (clipSlot?.clip?.color) {
    return intToHex(clipSlot.clip.color);
  }
  const track = tracks[trackIndex];
  return track ? intToHex(track.color) : '#666666';
}
