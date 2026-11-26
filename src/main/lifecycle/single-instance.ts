/**
 * Single-instance behavior (design section 6, D11, R7.2). Call before the `ready` event.
 * The `second-instance` arguments (argv, working directory) are never read, so no command line
 * input is trusted.
 */
export interface SingleInstanceApp {
  requestSingleInstanceLock(): boolean;
  isReady(): boolean;
  quit(): void;
  on(event: 'second-instance', listener: () => void): unknown;
}

/** Returns false (after requesting quit) when another instance already holds the lock. */
export function acquireSingleInstance(
  app: SingleInstanceApp,
  onSecondInstance: () => void,
): boolean {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return false;
  }
  // A `second-instance` event before `ready` must not create a window (BrowserWindow throws
  // before ready). The second process has no other effect, so the event is dropped.
  app.on('second-instance', () => {
    if (app.isReady()) onSecondInstance();
  });
  return true;
}

export interface FocusableWindow {
  isMinimized(): boolean;
  restore(): void;
  show(): void;
  focus(): void;
}

/** Restores and focuses the existing window, or creates one when none exists. */
export function focusOrCreateWindow(
  existing: FocusableWindow | null | undefined,
  create: () => void,
): void {
  if (existing === null || existing === undefined) {
    create();
    return;
  }
  if (existing.isMinimized()) existing.restore();
  existing.show();
  existing.focus();
}
