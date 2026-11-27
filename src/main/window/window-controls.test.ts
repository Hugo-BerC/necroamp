import { describe, expect, it, vi } from 'vitest';
import {
  WINDOW_STATE_EVENTS,
  applyWindowConstraints,
  attachWindowStatePush,
  createWindowControls,
  type ControlledWindow,
  type WindowStateEvent,
} from './window-controls';

function fakeWindow(
  initial: Partial<Record<'maximized' | 'fullScreen' | 'focused' | 'destroyed', boolean>> & {
    size?: number[];
  } = {},
) {
  const state = {
    maximized: false,
    fullScreen: false,
    focused: true,
    destroyed: false,
    size: [1100, 720],
    ...initial,
  };
  const listeners = new Map<WindowStateEvent, Set<() => void>>();
  const window: ControlledWindow = {
    minimize: vi.fn(),
    maximize: vi.fn(() => {
      state.maximized = true;
    }),
    unmaximize: vi.fn(() => {
      state.maximized = false;
    }),
    close: vi.fn(),
    isMaximized: () => state.maximized,
    isFullScreen: () => state.fullScreen,
    isFocused: () => state.focused,
    isDestroyed: () => state.destroyed,
    getSize: () => state.size,
    setSize: vi.fn((w: number, h: number) => {
      state.size = [w, h];
    }),
    setMinimumSize: vi.fn(),
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
    },
    removeListener: (event, listener) => {
      listeners.get(event)?.delete(listener);
    },
  };
  const emit = (event: WindowStateEvent) => listeners.get(event)?.forEach((l) => l());
  return { window, state, emit, listeners };
}

describe('createWindowControls', () => {
  it('minimizes and closes the window', () => {
    const { window } = fakeWindow();
    const controls = createWindowControls(window, 'win32');
    controls.minimize();
    controls.close();
    expect(window.minimize).toHaveBeenCalledTimes(1);
    expect(window.close).toHaveBeenCalledTimes(1);
  });

  it('toggles between maximized and restored', () => {
    const { window } = fakeWindow();
    const controls = createWindowControls(window, 'linux');
    controls.toggleMaximize();
    expect(window.maximize).toHaveBeenCalledTimes(1);
    controls.toggleMaximize();
    expect(window.unmaximize).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['win32', 'win32'],
    ['darwin', 'darwin'],
    ['linux', 'linux'],
    ['freebsd', 'linux'],
  ])('reports state with platform %s as %s', (platform, expected) => {
    const { window } = fakeWindow({ maximized: true, focused: false });
    expect(createWindowControls(window, platform).getState()).toEqual({
      maximized: true,
      fullScreen: false,
      focused: false,
      platform: expected,
    });
  });
});

describe('attachWindowStatePush', () => {
  it('pushes a snapshot for every state event and stops after dispose', () => {
    const { window, emit, state } = fakeWindow();
    const send = vi.fn();
    const dispose = attachWindowStatePush(window, createWindowControls(window, 'win32'), send);
    for (const event of WINDOW_STATE_EVENTS) emit(event);
    expect(send).toHaveBeenCalledTimes(WINDOW_STATE_EVENTS.length);
    state.maximized = true;
    emit('maximize');
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ maximized: true }));
    dispose();
    emit('focus');
    expect(send).toHaveBeenCalledTimes(WINDOW_STATE_EVENTS.length + 1);
  });

  it('ignores events from a destroyed window and does not detach from it', () => {
    const { window, emit, state, listeners } = fakeWindow();
    const send = vi.fn();
    const dispose = attachWindowStatePush(window, createWindowControls(window, 'win32'), send);
    state.destroyed = true;
    emit('blur');
    dispose();
    expect(send).not.toHaveBeenCalled();
    expect([...listeners.values()].every((set) => set.size > 0)).toBe(true);
  });
});

describe('applyWindowConstraints', () => {
  const constraints = { minWidth: 900, minHeight: 650, width: 1100, height: 720 };

  it('sets the minimum and enlarges a window that is too small', () => {
    const { window } = fakeWindow({ size: [800, 600] });
    applyWindowConstraints(window, constraints);
    expect(window.setMinimumSize).toHaveBeenCalledWith(900, 650);
    expect(window.setSize).toHaveBeenCalledWith(900, 650);
  });

  it('enlarges only the dimension that is too small', () => {
    const { window } = fakeWindow({ size: [1400, 600] });
    applyWindowConstraints(window, constraints);
    expect(window.setSize).toHaveBeenCalledWith(1400, 650);
  });

  it('keeps a large enough window as it is', () => {
    const { window } = fakeWindow({ size: [1300, 900] });
    applyWindowConstraints(window, constraints);
    expect(window.setMinimumSize).toHaveBeenCalledTimes(1);
    expect(window.setSize).not.toHaveBeenCalled();
  });

  it.each([{ maximized: true }, { fullScreen: true }])(
    'never resizes a maximized or full-screen window (%j)',
    (flags) => {
      const { window } = fakeWindow({ ...flags, size: [100, 100] });
      applyWindowConstraints(window, constraints);
      expect(window.setMinimumSize).toHaveBeenCalledTimes(1);
      expect(window.setSize).not.toHaveBeenCalled();
    },
  );

  it('does nothing for a destroyed window', () => {
    const { window } = fakeWindow({ destroyed: true });
    applyWindowConstraints(window, constraints);
    expect(window.setMinimumSize).not.toHaveBeenCalled();
  });

  it('treats a missing size as zero and still reaches the minimum', () => {
    const { window } = fakeWindow({ size: [] });
    applyWindowConstraints(window, constraints);
    expect(window.setSize).toHaveBeenCalledWith(900, 650);
  });
});
