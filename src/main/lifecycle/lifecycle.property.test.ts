import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { APP_ENTRY_URL } from '../constants';
import { parseDevOrigin } from '../security/trusted-origins';
import { resolveLoadTarget } from '../window/load-target';
import { buildWebPreferences } from '../window/window-options';
import { buildMenuTemplate, type MenuDescriptor } from './app-menu';
import { attachRendererCrashHandler } from './crash-handlers';
import { shouldCreateWindowOnActivate, shouldQuitOnAllWindowsClosed } from './platform-policy';

const KNOWN_ROLES = new Set([
  'appMenu',
  'fileMenu',
  'editMenu',
  'windowMenu',
  'quit',
  'undo',
  'redo',
  'cut',
  'copy',
  'paste',
  'selectAll',
  'minimize',
  'close',
  'reload',
  'toggleDevTools',
]);
const DEV_ONLY_ROLES = new Set(['reload', 'toggleDevTools']);

function collectRoles(items: readonly MenuDescriptor[]): string[] {
  return items.flatMap((i) => [
    ...(i.role === undefined ? [] : [i.role]),
    ...collectRoles(i.submenu ?? []),
  ]);
}

describe('platform policy (R7.3, R16.1)', () => {
  it('only darwin keeps running; every other string, including unknown, quits', () => {
    fc.assert(
      fc.property(fc.string(), (platform) => {
        expect(shouldQuitOnAllWindowsClosed(platform)).toBe(platform !== 'darwin');
      }),
    );
  });

  it('only darwin with zero windows recreates a window on activate', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 0, max: 5 }), (platform, windows) => {
        expect(shouldCreateWindowOnActivate(platform, windows)).toBe(
          platform === 'darwin' && windows === 0,
        );
      }),
    );
  });
});

describe('menu builder (R16.6)', () => {
  it('uses only known roles and exposes reload/devtools only in a dev run', () => {
    fc.assert(
      fc.property(fc.string(), fc.boolean(), (platform, isDevRun) => {
        const roles = collectRoles(buildMenuTemplate({ platform, isDevRun }));
        for (const role of roles) expect(KNOWN_ROLES.has(role)).toBe(true);
        const hasDev = roles.some((r) => DEV_ONLY_ROLES.has(r));
        expect(hasDev).toBe(isDevRun);
      }),
    );
  });
});

describe('resolveLoadTarget (design 3.1)', () => {
  it('a packaged app always loads the production entry, whatever the environment says', () => {
    fc.assert(
      fc.property(fc.option(fc.oneof(fc.string(), fc.webUrl()), { nil: undefined }), (url) => {
        expect(resolveLoadTarget({ ELECTRON_RENDERER_URL: url }, true)).toEqual({
          kind: 'production',
          url: APP_ENTRY_URL,
        });
      }),
    );
  });

  it('an unpackaged app uses the dev server only for a loopback http origin with a port', () => {
    fc.assert(
      fc.property(fc.option(fc.oneof(fc.string(), fc.webUrl()), { nil: undefined }), (url) => {
        const target = resolveLoadTarget({ ELECTRON_RENDERER_URL: url }, false);
        if (target.kind === 'development') {
          expect(parseDevOrigin(url)).not.toBeNull();
          expect(target.url.startsWith('http://')).toBe(true);
        } else {
          expect(target.url).toBe(APP_ENTRY_URL);
        }
      }),
    );
  });
});

describe('BrowserWindow security configuration (R3)', () => {
  it('keeps the four mandatory preferences for every preload path', () => {
    fc.assert(
      fc.property(fc.string(), (preload) => {
        const prefs = buildWebPreferences(preload);
        expect(prefs).toMatchObject({
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          webSecurity: true,
          webviewTag: false,
          allowRunningInsecureContent: false,
          nodeIntegrationInWorker: false,
          nodeIntegrationInSubFrames: false,
        });
        expect(prefs.preload).toBe(preload);
      }),
    );
  });
});

describe('renderer crash handler (R7.4)', () => {
  it('reloads exactly once and quits on every later crash', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), (crashes) => {
        let listener: ((d: { reason: string; exitCode: number }) => void) | undefined;
        let reloads = 0;
        let quits = 0;
        attachRendererCrashHandler(
          { onRenderProcessGone: (l) => void (listener = l), reload: () => void (reloads += 1) },
          { quit: () => void (quits += 1) },
          { info: () => undefined, warn: () => undefined, error: () => undefined },
        );
        for (let i = 0; i < crashes; i += 1) listener?.({ reason: 'crashed', exitCode: 1 });
        expect(reloads).toBe(1);
        expect(quits).toBe(crashes - 1);
      }),
    );
  });
});
