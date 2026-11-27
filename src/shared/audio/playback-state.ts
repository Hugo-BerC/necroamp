/** Fixed failure reasons. User text is looked up from the strings file, never from exceptions. */
export const PLAYBACK_ERROR_CODES = ['UNSUPPORTED', 'CORRUPT', 'NOT_FOUND', 'DECODE'] as const;
export type PlaybackErrorCode = (typeof PLAYBACK_ERROR_CODES)[number];

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export interface PlaybackState {
  readonly status: PlaybackStatus;
  readonly trackId: string | null;
  readonly positionSec: number;
  readonly durationSec: number | null;
  readonly error: PlaybackErrorCode | null;
  /** Linear gain in [0, 1]. Kept while muted. */
  readonly volume: number;
  readonly muted: boolean;
}

export type PlaybackEvent =
  | { readonly type: 'load'; readonly trackId: string }
  | { readonly type: 'loaded'; readonly durationSec: number | null }
  | { readonly type: 'tick'; readonly positionSec: number }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'stop' }
  | { readonly type: 'seek'; readonly positionSec: number }
  | { readonly type: 'ended' }
  | { readonly type: 'failed'; readonly code: PlaybackErrorCode }
  | { readonly type: 'volume'; readonly volume: number }
  | { readonly type: 'mute'; readonly muted: boolean };

export const DEFAULT_VOLUME = 0.8;

export const INITIAL_PLAYBACK_STATE: PlaybackState = {
  status: 'idle',
  trackId: null,
  positionSec: 0,
  durationSec: null,
  error: null,
  volume: DEFAULT_VOLUME,
  muted: false,
};

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Clamps to `[0, duration]`. Without a known duration only the lower bound applies. */
export function clampPosition(value: number, durationSec: number | null): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return durationSec === null ? value : Math.min(value, durationSec);
}

function hasTrack(state: PlaybackState): boolean {
  return state.trackId !== null && state.status !== 'idle' && state.status !== 'error';
}

/**
 * Pure transition function. Events that make no sense in the current state return the same
 * state object, so callers can skip re-rendering.
 */
export function reducePlayback(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  switch (event.type) {
    case 'load':
      return {
        ...state,
        status: 'loading',
        trackId: event.trackId,
        positionSec: 0,
        durationSec: null,
        error: null,
      };
    case 'loaded': {
      if (state.status !== 'loading' && state.status !== 'playing' && state.status !== 'paused') {
        return state;
      }
      const durationSec =
        event.durationSec !== null && Number.isFinite(event.durationSec) && event.durationSec >= 0
          ? event.durationSec
          : null;
      return {
        ...state,
        durationSec,
        positionSec: clampPosition(state.positionSec, durationSec),
        status: state.status === 'loading' ? 'stopped' : state.status,
      };
    }
    case 'tick': {
      if (state.status !== 'playing' && state.status !== 'paused') {
        return state;
      }
      const positionSec = clampPosition(event.positionSec, state.durationSec);
      return positionSec === state.positionSec ? state : { ...state, positionSec };
    }
    case 'play':
      return hasTrack(state) ? { ...state, status: 'playing' } : state;
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'stop':
      return hasTrack(state) ? { ...state, status: 'stopped', positionSec: 0 } : state;
    case 'seek':
      return hasTrack(state)
        ? { ...state, positionSec: clampPosition(event.positionSec, state.durationSec) }
        : state;
    case 'ended':
      return hasTrack(state) ? { ...state, status: 'stopped', positionSec: 0 } : state;
    case 'failed':
      return state.trackId === null
        ? state
        : { ...state, status: 'error', error: event.code, positionSec: 0 };
    case 'volume':
      return { ...state, volume: clampVolume(event.volume) };
    case 'mute':
      return { ...state, muted: event.muted };
  }
}
