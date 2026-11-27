import { createStore, type StoreApi } from 'zustand';
import type { OpenFilesResponse, TrackInfo } from '@shared/ipc';
import {
  INITIAL_PLAYBACK_STATE,
  reducePlayback,
  type PlaybackEvent,
  type PlaybackState,
} from '@shared/audio/playback-state';
import type { AudioEngine, AudioEngineEvent } from '@renderer/audio';

export type OpenFilesFailureReason = 'unavailable' | 'rejected' | 'invalid-response' | 'ipc-error';

export type LibraryClientResult =
  | { readonly ok: true; readonly data: Extract<OpenFilesResponse, { ok: true }>['data'] }
  | { readonly ok: false; readonly reason: OpenFilesFailureReason };

/** What the store needs from the bridge adapter. Tests pass a fake. */
export interface LibraryClient {
  readonly openFiles: (request: { readonly multiple: boolean }) => Promise<LibraryClientResult>;
}

/** How the last track finished. `seq` increases on every outcome so observers can detect repeats. */
export interface PlayerOutcome {
  readonly seq: number;
  readonly kind: 'ended' | 'failed';
  readonly trackId: string;
}

export interface PlayerState {
  readonly playback: PlaybackState;
  readonly track: TrackInfo | null;
  readonly openFailure: OpenFilesFailureReason | null;
  readonly lastOutcome: PlayerOutcome | null;
  readonly open: () => Promise<void>;
  /** Loads and plays a known track (used by the playlist). */
  readonly playTrack: (track: TrackInfo) => Promise<void>;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly seek: (positionSec: number) => void;
  readonly setVolume: (volume: number) => void;
  readonly toggleMute: () => void;
  /** Unsubscribes from the engine and disposes it. */
  readonly dispose: () => void;
}

export type PlayerStore = StoreApi<PlayerState>;

function engineEventToPlayback(event: AudioEngineEvent): PlaybackEvent {
  switch (event.type) {
    case 'metadata':
      return { type: 'loaded', durationSec: event.durationSec };
    case 'time':
      return { type: 'tick', positionSec: event.positionSec };
    case 'ended':
      return { type: 'ended' };
    case 'error':
      return { type: 'failed', code: event.code };
  }
}

/**
 * Playback state only. It holds no audio nodes and draws nothing: the engine is injected
 * and the pure reducer in `shared/audio` decides every transition.
 */
export function createPlayerStore(engine: AudioEngine, client: LibraryClient): PlayerStore {
  const store = createStore<PlayerState>()((set, get) => {
    const dispatch = (event: PlaybackEvent): void => {
      set((state) => {
        const playback = reducePlayback(state.playback, event);
        return playback === state.playback ? state : { playback };
      });
    };

    // Bumped on every load so a late play() rejection cannot change a newer track's state.
    let loadGeneration = 0;
    const startPlay = async (): Promise<void> => {
      const generation = loadGeneration;
      try {
        await engine.play();
      } catch (error) {
        // An interrupted play() (AbortError) is normal when a new load starts. Element
        // errors arrive as engine events. Any other rejection (for example
        // NotAllowedError) means the element is not playing, so the store must not say so.
        if (generation !== loadGeneration || !(error instanceof DOMException)) {
          return;
        }
        if (error.name === 'NotSupportedError') {
          dispatch({ type: 'failed', code: 'UNSUPPORTED' });
        } else if (error.name !== 'AbortError') {
          dispatch({ type: 'pause' });
        }
      }
    };

    let outcomeSeq = 0;
    const unsubscribe = engine.subscribe((event) => {
      const before = get().playback;
      dispatch(engineEventToPlayback(event));
      const after = get().playback;
      // Only a real transition counts, so stray late events cannot trigger auto-advance.
      if (event.type === 'ended' && before.status === 'playing' && before.trackId !== null) {
        outcomeSeq += 1;
        set({ lastOutcome: { seq: outcomeSeq, kind: 'ended', trackId: before.trackId } });
      } else if (event.type === 'error' && after.status === 'error' && after.trackId !== null) {
        outcomeSeq += 1;
        set({ lastOutcome: { seq: outcomeSeq, kind: 'failed', trackId: after.trackId } });
      }
    });
    const playTrack = async (track: TrackInfo): Promise<void> => {
      set({ track });
      loadGeneration += 1;
      dispatch({ type: 'load', trackId: track.trackId });
      engine.load(track.mediaUrl);
      dispatch({ type: 'play' });
      await startPlay();
    };
    engine.setVolume(INITIAL_PLAYBACK_STATE.volume);
    engine.setMuted(INITIAL_PLAYBACK_STATE.muted);

    return {
      playback: INITIAL_PLAYBACK_STATE,
      track: null,
      openFailure: null,
      lastOutcome: null,
      playTrack,
      open: async () => {
        const result = await client.openFiles({ multiple: false });
        if (!result.ok) {
          set({ openFailure: result.reason });
          return;
        }
        set({ openFailure: null });
        const track = result.data.tracks[0];
        if (track === undefined) {
          return; // The dialog was cancelled.
        }
        await playTrack(track);
      },
      play: async () => {
        const { playback } = get();
        if (playback.status === 'playing' || playback.status === 'idle') {
          return;
        }
        if (playback.status === 'error') {
          const track = get().track;
          if (track === null) {
            return;
          }
          loadGeneration += 1;
          dispatch({ type: 'load', trackId: track.trackId });
          engine.load(track.mediaUrl);
        }
        dispatch({ type: 'play' });
        await startPlay();
      },
      pause: () => {
        if (get().playback.status !== 'playing') {
          return;
        }
        engine.pause();
        dispatch({ type: 'pause' });
      },
      stop: () => {
        const { status } = get().playback;
        if (status === 'idle' || status === 'error') {
          return;
        }
        engine.stop();
        dispatch({ type: 'stop' });
      },
      seek: (positionSec) => {
        const { status } = get().playback;
        if (status === 'idle' || status === 'error') {
          return;
        }
        dispatch({ type: 'seek', positionSec });
        engine.seek(get().playback.positionSec);
      },
      setVolume: (volume) => {
        dispatch({ type: 'volume', volume });
        engine.setVolume(get().playback.volume);
      },
      toggleMute: () => {
        dispatch({ type: 'mute', muted: !get().playback.muted });
        engine.setMuted(get().playback.muted);
      },
      dispose: () => {
        unsubscribe();
        engine.dispose();
      },
    };
  });
  return store;
}
