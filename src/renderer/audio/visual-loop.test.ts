import { describe, expect, it, vi } from 'vitest';
import { createVisualLoop } from './visual-loop';

function setup() {
  const doc = document.implementation.createHTMLDocument('t');
  let hidden = false;
  Object.defineProperty(doc, 'hidden', { get: () => hidden, configurable: true });
  const callbacks = new Map<number, (t: number) => void>();
  let next = 1;
  const cancelled: number[] = [];
  const onFrame = vi.fn();
  const loop = createVisualLoop({
    onFrame,
    doc,
    requestFrame: (cb) => {
      callbacks.set(next, cb);
      return next++;
    },
    cancelFrame: (h) => {
      cancelled.push(h);
      callbacks.delete(h);
    },
  });
  const flush = (): void => {
    const [handle, cb] = [...callbacks.entries()][0] ?? [];
    if (handle !== undefined && cb !== undefined) {
      callbacks.delete(handle);
      cb(16);
    }
  };
  return {
    loop,
    onFrame,
    flush,
    pending: () => callbacks.size,
    cancelled,
    setHidden: (value: boolean) => {
      hidden = value;
      doc.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

describe('createVisualLoop', () => {
  it('requests no frame until playing', () => {
    const t = setup();
    expect(t.pending()).toBe(0);
    expect(t.loop.isRunning()).toBe(false);
  });

  it('runs one frame per tick and reschedules while playing', () => {
    const t = setup();
    t.loop.setPlaying(true);
    t.loop.setPlaying(true);
    expect(t.pending()).toBe(1);
    t.flush();
    t.flush();
    expect(t.onFrame).toHaveBeenCalledTimes(2);
    expect(t.pending()).toBe(1);
  });

  it('cancels when playback stops', () => {
    const t = setup();
    t.loop.setPlaying(true);
    t.loop.setPlaying(false);
    expect(t.pending()).toBe(0);
    expect(t.cancelled).toHaveLength(1);
    expect(t.loop.isRunning()).toBe(false);
  });

  it('pauses while the document is hidden and resumes when visible', () => {
    const t = setup();
    t.loop.setPlaying(true);
    t.setHidden(true);
    expect(t.pending()).toBe(0);
    t.loop.setPlaying(true);
    expect(t.pending()).toBe(0);
    t.setHidden(false);
    expect(t.pending()).toBe(1);
  });

  it('does not draw a frame that fires after the document became hidden', () => {
    const t = setup();
    t.loop.setPlaying(true);
    t.setHidden(true);
    t.flush();
    expect(t.onFrame).not.toHaveBeenCalled();
  });

  it('dispose cancels the pending frame, removes the listener and is idempotent', () => {
    const t = setup();
    t.loop.setPlaying(true);
    t.loop.dispose();
    t.loop.dispose();
    expect(t.pending()).toBe(0);
    t.loop.setPlaying(true);
    t.setHidden(false);
    expect(t.pending()).toBe(0);
  });

  it('stops rescheduling when onFrame stops the loop', () => {
    const doc = document.implementation.createHTMLDocument('t');
    Object.defineProperty(doc, 'hidden', { value: false });
    let pending = 0;
    const loopRef: { current: ReturnType<typeof createVisualLoop> | null } = { current: null };
    let cb: ((t: number) => void) | null = null;
    loopRef.current = createVisualLoop({
      doc,
      onFrame: () => loopRef.current?.setPlaying(false),
      requestFrame: (c) => {
        pending += 1;
        cb = c;
        return pending;
      },
      cancelFrame: () => {
        pending -= 1;
      },
    });
    loopRef.current.setPlaying(true);
    expect(pending).toBe(1);
    cb!(1);
    expect(loopRef.current.isRunning()).toBe(false);
  });
});
