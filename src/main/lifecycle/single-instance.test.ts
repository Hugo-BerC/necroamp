import { describe, expect, it, vi } from 'vitest';
import { acquireSingleInstance, focusOrCreateWindow } from './single-instance';

function fakeApp(lock: boolean, ready = true) {
  const listeners: (() => void)[] = [];
  return {
    listeners,
    app: {
      requestSingleInstanceLock: vi.fn(() => lock),
      isReady: vi.fn(() => ready),
      quit: vi.fn(),
      on: vi.fn((_event: 'second-instance', listener: () => void) => {
        listeners.push(listener);
      }),
    },
  };
}

describe('acquireSingleInstance', () => {
  it('quits and registers nothing when the lock is held elsewhere', () => {
    const { app, listeners } = fakeApp(false);
    const onSecond = vi.fn();
    expect(acquireSingleInstance(app, onSecond)).toBe(false);
    expect(app.quit).toHaveBeenCalledTimes(1);
    expect(app.on).not.toHaveBeenCalled();
    expect(listeners).toHaveLength(0);
  });

  it('keeps running and handles second-instance when the lock is acquired', () => {
    const { app, listeners } = fakeApp(true);
    const onSecond = vi.fn();
    expect(acquireSingleInstance(app, onSecond)).toBe(true);
    expect(app.quit).not.toHaveBeenCalled();
    listeners[0]?.();
    expect(onSecond).toHaveBeenCalledTimes(1);
  });

  it('ignores second-instance while the app is not ready', () => {
    const { app, listeners } = fakeApp(true, false);
    const onSecond = vi.fn();
    expect(acquireSingleInstance(app, onSecond)).toBe(true);
    listeners[0]?.();
    expect(onSecond).not.toHaveBeenCalled();
    expect(app.quit).not.toHaveBeenCalled();
  });

  it('ignores second-instance arguments', () => {
    const { app, listeners } = fakeApp(true);
    const onSecond = vi.fn();
    acquireSingleInstance(app, onSecond);
    (listeners[0] as (...args: unknown[]) => void)(['--evil'], 'C:\\cwd');
    expect(onSecond).toHaveBeenCalledWith();
  });
});

describe('focusOrCreateWindow', () => {
  const makeWindow = (minimized: boolean) => ({
    isMinimized: vi.fn(() => minimized),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
  });

  it('restores a minimized window, then shows and focuses it', () => {
    const window = makeWindow(true);
    const create = vi.fn();
    focusOrCreateWindow(window, create);
    expect(window.restore).toHaveBeenCalledTimes(1);
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not restore a window that is not minimized', () => {
    const window = makeWindow(false);
    focusOrCreateWindow(window, vi.fn());
    expect(window.restore).not.toHaveBeenCalled();
    expect(window.focus).toHaveBeenCalledTimes(1);
  });

  it.each([null, undefined])('creates a window when none exists (%s)', (existing) => {
    const create = vi.fn();
    focusOrCreateWindow(existing, create);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
