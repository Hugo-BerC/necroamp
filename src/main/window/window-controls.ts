import type { WindowState } from '@shared/ipc';
import type { WindowConstraints } from './window-options';

/**
 * Narrow window actions for the frameless chrome (ADR 0009 item 4). The renderer can ask for
 * three actions and a state snapshot. It never passes sizes, positions or ids, and it never
 * receives a `BrowserWindow`. Structural types keep this unit testable without Electron.
 */
export interface ControlledWindow {
  minimize(): void;
  maximize(): void;
  unmaximize(): void;
  close(): void;
  isMaximized(): boolean;
  isFullScreen(): boolean;
  isFocused(): boolean;
  isDestroyed(): boolean;
  getSize(): number[];
  setSize(width: number, height: number): void;
  setMinimumSize(width: number, height: number): void;
  on(event: WindowStateEvent, listener: () => void): unknown;
  removeListener(event: WindowStateEvent, listener: () => void): unknown;
}

export const WINDOW_STATE_EVENTS = [
  'maximize',
  'unmaximize',
  'enter-full-screen',
  'leave-full-screen',
  'focus',
  'blur',
] as const;
export type WindowStateEvent = (typeof WINDOW_STATE_EVENTS)[number];

export interface WindowControls {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  getState(): WindowState;
}

type StatePlatform = WindowState['platform'];

function toStatePlatform(platform: string): StatePlatform {
  return platform === 'win32' || platform === 'darwin' ? platform : 'linux';
}

export function createWindowControls(window: ControlledWindow, platform: string): WindowControls {
  return {
    minimize() {
      window.minimize();
    },
    toggleMaximize() {
      if (window.isMaximized()) window.unmaximize();
      else window.maximize();
    },
    close() {
      window.close();
    },
    getState() {
      return {
        maximized: window.isMaximized(),
        fullScreen: window.isFullScreen(),
        focused: window.isFocused(),
        platform: toStatePlatform(platform),
      };
    },
  };
}

/**
 * Pushes the window state after maximize, unmaximize, full-screen and focus changes. Returns a
 * disposer. Events after the window is destroyed are ignored.
 */
export function attachWindowStatePush(
  window: ControlledWindow,
  controls: Pick<WindowControls, 'getState'>,
  send: (state: WindowState) => void,
): () => void {
  const listener = (): void => {
    if (window.isDestroyed()) return;
    send(controls.getState());
  };
  for (const event of WINDOW_STATE_EVENTS) window.on(event, listener);
  return () => {
    if (window.isDestroyed()) return;
    for (const event of WINDOW_STATE_EVENTS) window.removeListener(event, listener);
  };
}

/**
 * Applies the active skin's size limits. The minimum is always updated. The window is enlarged to
 * the minimum only when it is smaller and neither maximized nor full screen.
 */
export function applyWindowConstraints(
  window: ControlledWindow,
  constraints: WindowConstraints,
): void {
  if (window.isDestroyed()) return;
  window.setMinimumSize(constraints.minWidth, constraints.minHeight);
  if (window.isMaximized() || window.isFullScreen()) return;
  const [width = 0, height = 0] = window.getSize();
  if (width < constraints.minWidth || height < constraints.minHeight) {
    window.setSize(Math.max(width, constraints.minWidth), Math.max(height, constraints.minHeight));
  }
}
