import type { BrowserWindowConstructorOptions } from 'electron';
import type { Logger } from '../logging/logger';
import { NATIVE_CHROME_PROFILE, type ChromeProfile } from './chrome-profile';
import type { LoadTarget } from './load-target';
import {
  FOUNDATION_CONSTRAINTS,
  buildWebPreferences,
  buildWindowOptions,
  type WindowConstraints,
} from './window-options';

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
  /** Defaults to the native profile. Production passes the frameless profile (ADR 0009). */
  readonly profile?: ChromeProfile;
  /** Active skin size constraints. Defaults to Foundation. */
  readonly constraints?: WindowConstraints;
  readonly platform?: string;
}

export function createMainWindow<W extends WindowLike>(deps: MainWindowDeps<W>): W {
  const { BrowserWindow, preloadPath, target, log } = deps;
  const profile = deps.profile ?? NATIVE_CHROME_PROFILE;
  const constraints = deps.constraints ?? FOUNDATION_CONSTRAINTS;
  const window = new BrowserWindow({
    ...buildWindowOptions(profile, constraints, deps.platform),
    webPreferences: buildWebPreferences(preloadPath),
  });
  window.once('ready-to-show', () => window.show());
  window.loadURL(target.url).catch(() => {
    // The error text may contain a path or URL, so only the event code is logged.
    log.error('window.load_failed', { code: target.kind });
  });
  return window;
}
