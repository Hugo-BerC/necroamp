import type { BrowserWindowConstructorOptions, WebPreferences } from 'electron';
import { APP_NAME } from '../constants';
import type { ChromeProfile } from './chrome-profile';

/** Minimum window size, R8.11. */
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;

/**
 * The only source of web preferences. It takes no mode, profile or environment, so no caller can
 * weaken it. Every field is a literal except the absolute preload path, which main builds from a
 * constant (design section 3.1). Never disable `contextIsolation`, `sandbox`, `nodeIntegration`
 * or `webSecurity`.
 */
export function buildWebPreferences(preloadPath: string): WebPreferences {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
    allowRunningInsecureContent: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    experimentalFeatures: false,
    spellcheck: false,
    preload: preloadPath,
  };
}

/** Chrome-dependent options. Contains no web preferences. */
export function buildWindowOptions(profile: ChromeProfile): BrowserWindowConstructorOptions {
  switch (profile.kind) {
    case 'native':
      return {
        width: 1100,
        height: 720,
        minWidth: MIN_WINDOW_WIDTH,
        minHeight: MIN_WINDOW_HEIGHT,
        show: false,
        title: APP_NAME,
        frame: true,
        autoHideMenuBar: false,
      };
    default: {
      const exhaustive: never = profile.kind;
      throw new Error(`Unsupported chrome profile: ${String(exhaustive)}`);
    }
  }
}
