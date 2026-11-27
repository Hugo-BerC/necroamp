/**
 * One requestAnimationFrame loop for visualizers. It runs only while `playing` is true and the
 * document is visible, and restarts on `visibilitychange`. Drawing is the caller's `onFrame`;
 * nothing here feeds back into playback.
 */
export interface VisualLoop {
  /** Reflects playback status. Idempotent. */
  readonly setPlaying: (playing: boolean) => void;
  readonly isRunning: () => boolean;
  /** Cancels the pending frame and removes the listener. Idempotent. */
  readonly dispose: () => void;
}

export interface VisualLoopOptions {
  readonly onFrame: (timestampMs: number) => void;
  readonly doc?: Document;
  readonly requestFrame?: (callback: (timestampMs: number) => void) => number;
  readonly cancelFrame?: (handle: number) => void;
}

export function createVisualLoop(options: VisualLoopOptions): VisualLoop {
  const doc = options.doc ?? document;
  const requestFrame = options.requestFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancelFrame = options.cancelFrame ?? ((h) => cancelAnimationFrame(h));
  let playing = false;
  let handle: number | null = null;
  let disposed = false;

  const tick = (timestampMs: number): void => {
    handle = null;
    if (disposed || !playing || doc.hidden) {
      return;
    }
    options.onFrame(timestampMs);
    // onFrame may have stopped the loop.
    if (!disposed && playing && !doc.hidden && handle === null) {
      handle = requestFrame(tick);
    }
  };
  const sync = (): void => {
    const shouldRun = !disposed && playing && !doc.hidden;
    if (shouldRun && handle === null) {
      handle = requestFrame(tick);
    } else if (!shouldRun && handle !== null) {
      cancelFrame(handle);
      handle = null;
    }
  };
  doc.addEventListener('visibilitychange', sync);

  return {
    setPlaying: (value) => {
      playing = value;
      sync();
    },
    isRunning: () => handle !== null,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (handle !== null) {
        cancelFrame(handle);
        handle = null;
      }
      doc.removeEventListener('visibilitychange', sync);
    },
  };
}
