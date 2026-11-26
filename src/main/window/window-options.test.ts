import { describe, expect, it } from 'vitest';
import { NATIVE_CHROME_PROFILE } from './chrome-profile';
import { buildWebPreferences, buildWindowOptions } from './window-options';

const PRELOAD = '/app/out/preload/index.js';

describe('buildWebPreferences', () => {
  it('equals the approved literal exactly', () => {
    expect(buildWebPreferences(PRELOAD)).toEqual({
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
      preload: PRELOAD,
    });
  });

  it('keeps the four mandatory invariants regardless of environment', () => {
    const original = { ...process.env };
    try {
      for (const value of ['development', 'production', 'test']) {
        process.env['NODE_ENV'] = value;
        process.env['ELECTRON_RENDERER_URL'] = 'http://localhost:5173';
        const prefs = buildWebPreferences(PRELOAD);
        expect(prefs.contextIsolation).toBe(true);
        expect(prefs.sandbox).toBe(true);
        expect(prefs.nodeIntegration).toBe(false);
        expect(prefs.webSecurity).toBe(true);
      }
    } finally {
      process.env = original;
    }
  });

  it('only the preload path varies with the argument', () => {
    const { preload: a, ...restA } = buildWebPreferences('/a/index.js');
    const { preload: b, ...restB } = buildWebPreferences('/b/index.js');
    expect(a).not.toBe(b);
    expect(restA).toEqual(restB);
  });
});

describe('buildWindowOptions', () => {
  it('builds the native profile with the minimum size and a hidden first paint', () => {
    expect(buildWindowOptions(NATIVE_CHROME_PROFILE)).toEqual({
      width: 1100,
      height: 720,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: 'NecroAmp',
      frame: true,
      autoHideMenuBar: false,
    });
  });

  it('never carries web preferences', () => {
    expect(buildWindowOptions(NATIVE_CHROME_PROFILE)).not.toHaveProperty('webPreferences');
  });

  it('throws for an unknown profile instead of guessing', () => {
    expect(() => buildWindowOptions({ kind: 'frameless' } as never)).toThrow();
  });
});
