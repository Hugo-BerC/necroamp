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

/** Size constraints taken from the active skin (ADR 0009 item 5). */
export interface WindowConstraints {
  readonly minWidth: number;
  readonly minHeight: number;
  readonly width: number;
  readonly height: number;
}

/** Foundation values. Also the default when no skin has been resolved yet. */
export const FOUNDATION_CONSTRAINTS: WindowConstraints = Object.freeze({
  minWidth: MIN_WINDOW_WIDTH,
  minHeight: MIN_WINDOW_HEIGHT,
  width: 1100,
  height: 720,
});

/** Hard bounds for a skin-provided minimum size (ADR 0009 item 5). */
export const SKIN_MIN_BOUNDS = Object.freeze({
  minWidth: 560,
  maxWidth: 1000,
  minHeight: 360,
  maxHeight: 700,
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));

/**
 * Clamps a skin's window block to the allowed range. The preferred size never goes below the
 * minimum. A skin cannot request a position or any other window option.
 */
export function constraintsFromSkinWindow(skinWindow: {
  readonly minSize: { readonly width: number; readonly height: number };
  readonly preferredSize: { readonly width: number; readonly height: number };
}): WindowConstraints {
  const minWidth = clamp(
    skinWindow.minSize.width,
    SKIN_MIN_BOUNDS.minWidth,
    SKIN_MIN_BOUNDS.maxWidth,
  );
  const minHeight = clamp(
    skinWindow.minSize.height,
    SKIN_MIN_BOUNDS.minHeight,
    SKIN_MIN_BOUNDS.maxHeight,
  );
  return {
    minWidth,
    minHeight,
    width: Math.max(minWidth, clamp(skinWindow.preferredSize.width, minWidth, 1920)),
    height: Math.max(minHeight, clamp(skinWindow.preferredSize.height, minHeight, 1200)),
  };
}

/**
 * Chrome-dependent options. Contains no web preferences.
 * Frameless: `frame: false` on Windows and Linux. On macOS the frame stays but the title bar is
 * hidden so the native traffic lights remain (ADR 0009 item 1).
 */
export function buildWindowOptions(
  profile: ChromeProfile,
  constraints: WindowConstraints = FOUNDATION_CONSTRAINTS,
  platform: string = process.platform,
): BrowserWindowConstructorOptions {
  const common = {
    width: constraints.width,
    height: constraints.height,
    minWidth: constraints.minWidth,
    minHeight: constraints.minHeight,
    show: false,
    title: APP_NAME,
    autoHideMenuBar: false,
  };
  switch (profile.kind) {
    case 'native':
      return { ...common, frame: true };
    case 'frameless':
      return platform === 'darwin'
        ? { ...common, frame: true, titleBarStyle: 'hidden' }
        : { ...common, frame: false };
    default: {
      const exhaustive: never = profile;
      throw new Error(
        `Unsupported chrome profile: ${String((exhaustive as { kind: string }).kind)}`,
      );
    }
  }
}
