import type { BrowserWindowConstructorOptions } from 'electron';
import type { Logger } from '../logging/logger';
import { NATIVE_CHROME_PROFILE } from './chrome-profile';
import type { LoadTarget } from './load-target';
import { buildWebPreferences, buildWindowOptions } from './window-options';

/**
 * The only file that constructs a window (R3.1). The constructor is injected so tests do not
 * need Electron, and the composition root passes the real `BrowserWindow` class.
 */
export interface WindowLike {
  once(event: 'ready-to-show', listener: () => void): unknown;
  show(): void;
  loadURL(url: string): Promise<void>;
}

export interface MainWindowDeps<W extends WindowLike> {
  readonly BrowserWindow: new (options: BrowserWindowConstructorOptions) => W;
  /** Absolute path of the built preload script. */
  readonly preloadPath: string;
  readonly target: LoadTarget;
  readonly log: Logger;
}

export function createMainWindow<W extends WindowLike>(deps: MainWindowDeps<W>): W {
  const { BrowserWindow, preloadPath, target, log } = deps;
  const window = new BrowserWindow({
    ...buildWindowOptions(NATIVE_CHROME_PROFILE),
    webPreferences: buildWebPreferences(preloadPath),
  });
  window.once('ready-to-show', () => window.show());
  window.loadURL(target.url).catch(() => {
    // The error text may contain a path or URL, so only the event code is logged.
    log.error('window.load_failed', { code: target.kind });
  });
  return window;
}
