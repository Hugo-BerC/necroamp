import type { PlaybackErrorCode } from '@shared/audio/playback-state';

/** Events the engine emits. The store feeds them to the pure playback reducer. */
export type AudioEngineEvent =
  | { readonly type: 'metadata'; readonly durationSec: number | null }
  | { readonly type: 'time'; readonly positionSec: number }
  | { readonly type: 'ended' }
  | { readonly type: 'error'; readonly code: PlaybackErrorCode };

export type AudioEngineListener = (event: AudioEngineEvent) => void;

/**
 * Port between playback state and the audio element. Blocks B and C extend this
 * interface (EQ, analyser) without changing these members. UI code never calls it
 * directly; only the player store does.
 */
export interface AudioEngine {
  /** Loads a `media://track/<token>` URL. Resolves nothing; progress arrives as events. */
  readonly load: (url: string) => void;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly seek: (positionSec: number) => void;
  readonly setVolume: (volume: number) => void;
  readonly setMuted: (muted: boolean) => void;
  /** Returns an unsubscribe function. */
  readonly subscribe: (listener: AudioEngineListener) => () => void;
  /** Releases the element, listeners and any graph. Safe to call twice. */
  readonly dispose: () => void;
}

// HTMLMediaElement error codes (MediaError.MEDIA_ERR_*).
const MEDIA_ERR_ABORTED = 1;
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

/** Maps a media element error to a fixed code. `null` means the load was merely aborted. */
export function mapMediaErrorCode(code: number | undefined): PlaybackErrorCode | null {
  switch (code) {
    case MEDIA_ERR_ABORTED:
      return null;
    case MEDIA_ERR_NETWORK:
      return 'NOT_FOUND';
    case MEDIA_ERR_DECODE:
      return 'CORRUPT';
    case MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'UNSUPPORTED';
    default:
      return 'DECODE';
  }
}

/**
 * Block A engine: one hidden `HTMLAudioElement`. Playback timing belongs to the browser
 * media pipeline, not to React. The element is tagged `data-part="audio-source"` so tests
 * can observe it. `crossOrigin` is set so Block C can attach a MediaElementAudioSourceNode.
 */
export function createDomAudioEngine(doc: Document = document): AudioEngine {
  const element = doc.createElement('audio');
  element.crossOrigin = 'anonymous';
  element.preload = 'metadata';
  element.hidden = true;
  element.setAttribute('data-part', 'audio-source');
  doc.body.appendChild(element);

  const listeners = new Set<AudioEngineListener>();
  let disposed = false;

  const emit = (event: AudioEngineEvent): void => {
    for (const listener of [...listeners]) {
      listener(event);
    }
  };
  const onMetadata = (): void => {
    emit({
      type: 'metadata',
      durationSec: Number.isFinite(element.duration) ? element.duration : null,
    });
  };
  const onTime = (): void => {
    emit({ type: 'time', positionSec: element.currentTime });
  };
  const onEnded = (): void => {
    emit({ type: 'ended' });
  };
  const onError = (): void => {
    const code = mapMediaErrorCode(element.error?.code);
    if (code !== null) {
      emit({ type: 'error', code });
    }
  };
  element.addEventListener('loadedmetadata', onMetadata);
  element.addEventListener('durationchange', onMetadata);
  element.addEventListener('timeupdate', onTime);
  element.addEventListener('seeked', onTime);
  element.addEventListener('ended', onEnded);
  element.addEventListener('error', onError);

  return {
    load: (url) => {
      element.src = url;
      element.load();
    },
    play: async () => {
      if (!disposed) {
        await element.play();
      }
    },
    pause: () => {
      element.pause();
    },
    stop: () => {
      element.pause();
      element.currentTime = 0;
    },
    seek: (positionSec) => {
      if (Number.isFinite(positionSec) && positionSec >= 0) {
        element.currentTime = positionSec;
      }
    },
    setVolume: (volume) => {
      element.volume = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
    },
    setMuted: (muted) => {
      element.muted = muted;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      element.removeEventListener('loadedmetadata', onMetadata);
      element.removeEventListener('durationchange', onMetadata);
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('seeked', onTime);
      element.removeEventListener('ended', onEnded);
      element.removeEventListener('error', onError);
      element.pause();
      element.removeAttribute('src');
      element.load();
      element.remove();
      listeners.clear();
    },
  };
}
