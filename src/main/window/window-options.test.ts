import { describe, expect, it } from 'vitest';
import { FRAMELESS_CHROME_PROFILE, NATIVE_CHROME_PROFILE } from './chrome-profile';
import {
  FOUNDATION_CONSTRAINTS,
  buildWebPreferences,
  buildWindowOptions,
  constraintsFromSkinWindow,
} from './window-options';

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
    expect(() => buildWindowOptions({ kind: 'bogus' } as never)).toThrow();
  });
});

describe('buildWindowOptions: frameless profile (ADR 0009)', () => {
  it.each(['win32', 'linux'])('uses frame false on %s', (platform) => {
    const options = buildWindowOptions(FRAMELESS_CHROME_PROFILE, FOUNDATION_CONSTRAINTS, platform);
    expect(options).toMatchObject({ frame: false, show: false, title: 'NecroAmp' });
    expect(options).not.toHaveProperty('titleBarStyle');
  });

  it('keeps the frame with a hidden title bar on darwin so the traffic lights stay', () => {
    expect(
      buildWindowOptions(FRAMELESS_CHROME_PROFILE, FOUNDATION_CONSTRAINTS, 'darwin'),
    ).toMatchObject({ frame: true, titleBarStyle: 'hidden' });
  });

  it('never carries web preferences, in any profile or platform', () => {
    for (const platform of ['win32', 'darwin', 'linux']) {
      expect(buildWindowOptions(FRAMELESS_CHROME_PROFILE, undefined, platform)).not.toHaveProperty(
        'webPreferences',
      );
    }
  });

  it('applies the skin constraints to the size options', () => {
    const options = buildWindowOptions(
      FRAMELESS_CHROME_PROFILE,
      { minWidth: 640, minHeight: 400, width: 900, height: 500 },
      'win32',
    );
    expect(options).toMatchObject({ minWidth: 640, minHeight: 400, width: 900, height: 500 });
  });

  it('defaults to the Foundation constraints of 800 by 600 and 1100 by 720', () => {
    expect(buildWindowOptions(NATIVE_CHROME_PROFILE)).toMatchObject({
      minWidth: 800,
      minHeight: 600,
      width: 1100,
      height: 720,
    });
  });
});

describe('constraintsFromSkinWindow', () => {
  it('passes values inside the allowed range through', () => {
    expect(
      constraintsFromSkinWindow({
        minSize: { width: 640, height: 400 },
        preferredSize: { width: 900, height: 500 },
      }),
    ).toEqual({ minWidth: 640, minHeight: 400, width: 900, height: 500 });
  });

  it('clamps the minimum to 560 by 360 up to 1000 by 700', () => {
    expect(
      constraintsFromSkinWindow({
        minSize: { width: 10, height: 10 },
        preferredSize: { width: 2000, height: 2000 },
      }),
    ).toMatchObject({ minWidth: 560, minHeight: 360, width: 1920, height: 1200 });
    expect(
      constraintsFromSkinWindow({
        minSize: { width: 9999, height: 9999 },
        preferredSize: { width: 1, height: 1 },
      }),
    ).toMatchObject({ minWidth: 1000, minHeight: 700, width: 1000, height: 700 });
  });

  it('never returns a preferred size below the minimum, and survives non-finite input', () => {
    const result = constraintsFromSkinWindow({
      minSize: { width: Number.NaN, height: Number.POSITIVE_INFINITY },
      preferredSize: { width: Number.NaN, height: 0 },
    });
    expect(result.width).toBeGreaterThanOrEqual(result.minWidth);
    expect(result.height).toBeGreaterThanOrEqual(result.minHeight);
    expect(Number.isFinite(result.minWidth + result.minHeight)).toBe(true);
  });
});
