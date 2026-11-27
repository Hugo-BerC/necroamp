import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, REPO_ROOT, test } from './fixtures/launch';

// T7.2: smoke and security E2E against the production build (R3, R4, R5, R6, R8, R9, R15).
const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
  version: string;
};
const PLATFORM_LABEL: Record<string, string> = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
};
// Independent oracle: the frozen production policy written out, not imported from source.
// D-A6: media://art is deliberately absent from img-src until artwork support is implemented and
// explicitly authorized. ADR 0006 item 7 still lists it and is stale on this point.
const PRODUCTION_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  'media-src media://track',
  "manifest-src 'none'",
].join('; ');
const REGIONS = ['Player', 'Playlist', 'Equalizer', 'Visualizer', 'Skins', 'GitHub (optional)'];

test.describe('startup and visible regions', () => {
  test('opens exactly one visible window on app://renderer with the product title', async ({
    app,
    page,
  }) => {
    expect(app.windows()).toHaveLength(1);
    expect(page.url()).toBe('app://renderer/index.html');
    await expect(page).toHaveTitle('NecroAmp');
    const state = await app.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows();
      return { count: BrowserWindow.getAllWindows().length, visible: win?.isVisible() ?? false };
    });
    expect(state).toEqual({ count: 1, visible: true });
  });

  test('renders the heading, tagline and six labelled regions', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('NecroAmp');
    await expect(page.getByText('Code. Listen. Repeat.')).toBeVisible();
    for (const name of REGIONS) {
      await expect(page.getByRole('region', { name })).toBeVisible();
    }
    await expect(page.getByRole('region')).toHaveCount(6);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the version and platform reported by main over real IPC', async ({ page }) => {
    await expect(page.getByText(pkg.version, { exact: true })).toBeVisible();
    await expect(
      page.getByText(PLATFORM_LABEL[process.platform] ?? '?', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
  });

  test('has no uncaught page error and no console error on startup', async ({ app }) => {
    const errors: string[] = [];
    const page = await app.firstWindow();
    page.on('pageerror', (e) => errors.push(e.name));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('app:get-info IPC round trip', () => {
  test('returns the validated payload through the preload bridge', async ({ page }) => {
    const result = await page.evaluate(() => window.necroamp.app.getInfo());
    expect(result).toEqual({
      ok: true,
      data: { name: 'NecroAmp', version: pkg.version, platform: process.platform },
    });
  });
});

test.describe('sandboxed preload and live web preferences', () => {
  test('keeps every mandatory web preference on the live window', async ({ app, page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const prefs = await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return (
        (
          win?.webContents as unknown as { getLastWebPreferences(): unknown } | undefined
        )?.getLastWebPreferences() ?? null
      );
    });
    expect(prefs).toMatchObject({
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
    });
  });

  test('exposes no Node or Electron global to the renderer', async ({ page }) => {
    const types = await page.evaluate(() => ({
      require: typeof (globalThis as { require?: unknown }).require,
      process: typeof (globalThis as { process?: unknown }).process,
      Buffer: typeof (globalThis as { Buffer?: unknown }).Buffer,
      ipcRenderer: typeof (globalThis as { ipcRenderer?: unknown }).ipcRenderer,
      electron: typeof (globalThis as { electron?: unknown }).electron,
      module: typeof (globalThis as { module?: unknown }).module,
    }));
    expect(types).toEqual({
      require: 'undefined',
      process: 'undefined',
      Buffer: 'undefined',
      ipcRenderer: 'undefined',
      electron: 'undefined',
      module: 'undefined',
    });
  });

  test('exposes exactly a frozen necroamp.app.getInfo and nothing else', async ({ page }) => {
    const shape = await page.evaluate(() => {
      const bridge = window.necroamp as unknown as Record<string, unknown>;
      const app = bridge['app'] as Record<string, unknown>;
      return {
        keys: Object.keys(bridge),
        appKeys: Object.keys(app),
        frozen: Object.isFrozen(bridge) && Object.isFrozen(app),
        getInfoType: typeof app['getInfo'],
        rawIpc: Object.keys(window).filter((k) => /ipc|invoke|send/i.test(k)),
      };
    });
    expect(shape).toEqual({
      keys: ['app', 'library'],
      appKeys: ['getInfo'],
      frozen: true,
      getInfoType: 'function',
      rawIpc: [],
    });
  });

  test('cannot overwrite the bridge from the renderer', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        (window.necroamp.app as unknown as { getInfo: unknown }).getInfo = () => 'pwned';
      } catch {
        /* strict mode may throw; both outcomes are fine */
      }
      return window.necroamp.app.getInfo();
    });
    expect(result).toMatchObject({ ok: true });
  });
});

test.describe('production CSP and app:// loading', () => {
  test('serves index.html with the frozen production CSP header and nosniff', async ({ app }) => {
    const headers = await app.evaluate(async ({ net }) => {
      const res = await net.fetch('app://renderer/index.html');
      return {
        status: res.status,
        type: res.headers.get('content-type'),
        csp: res.headers.get('content-security-policy'),
        nosniff: res.headers.get('x-content-type-options'),
      };
    });
    expect(headers.status).toBe(200);
    expect(headers.type).toMatch(/^text\/html/);
    expect(headers.csp).toBe(PRODUCTION_CSP);
    expect(headers.nosniff).toBe('nosniff');
  });

  test('allows only self for images and only media://track for media', async ({ app }) => {
    const csp = await app.evaluate(async ({ net }) => {
      const res = await net.fetch('app://renderer/index.html');
      return res.headers.get('content-security-policy') ?? '';
    });
    const sources = (name: string): string[] => {
      const directive = csp.split('; ').find((d) => d.startsWith(name + ' '));
      return directive === undefined ? [] : directive.split(' ').slice(1);
    };
    expect(sources('img-src')).toEqual(["'self'"]);
    expect(sources('media-src')).toEqual(['media://track']);
    const img = sources('img-src').join(' ');
    for (const forbidden of [
      'media://art',
      'media:',
      'data:',
      'blob:',
      'http:',
      'https:',
      'file:',
      '*',
    ]) {
      expect(img, forbidden).not.toContain(forbidden);
    }
    expect(sources('media-src').join(' ')).not.toMatch(
      /media:\/\/art|blob:|data:|https?:|file:|\*/,
    );
  });
  test('has a meta CSP without frame-ancestors, no unsafe-* and no inline script in the DOM source', async ({
    page,
  }) => {
    const meta = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(meta).toBe(PRODUCTION_CSP.replace("; frame-ancestors 'none'", ''));
    expect(meta).not.toMatch(/unsafe-(inline|eval)/);
    const scripts = await page.evaluate(() =>
      [...document.scripts].map((s) => ({
        src: s.getAttribute('src'),
        inline: s.textContent?.trim(),
      })),
    );
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.src).toMatch(/^\.\/assets\/index-.+\.js$/);
    expect(scripts[0]?.inline).toBe('');
  });

  test('blocks inline script, string eval and any renderer network request', async ({ page }) => {
    // Playwright's evaluate bypasses the eval restriction, so eval is probed with a string timer,
    // which the page's own CSP enforces. The violation event is the observable state.
    const outcome = await page.evaluate(async () => {
      const violations: string[] = [];
      const seen = new Promise<void>((resolve) => {
        document.addEventListener('securitypolicyviolation', (e) => {
          violations.push(`${e.violatedDirective}|${e.blockedURI}`);
          if (
            violations.some((v) => v.startsWith('script-src|eval')) &&
            violations.some((v) => v.startsWith('connect-src'))
          ) {
            resolve();
          }
        });
      });
      const script = document.createElement('script');
      script.textContent = 'window.__inlineRan = true;';
      document.head.appendChild(script);
      window.setTimeout('window.__evalRan = true', 0);
      let fetchBlocked = false;
      try {
        await fetch('https://example.com/');
      } catch {
        fetchBlocked = true;
      }
      await Promise.race([seen, new Promise((resolve) => setTimeout(resolve, 3_000))]);
      const flags = window as { __inlineRan?: boolean; __evalRan?: boolean };
      return {
        inlineRan: flags.__inlineRan === true,
        evalRan: flags.__evalRan === true,
        fetchBlocked,
        violations,
      };
    });
    expect(outcome.inlineRan).toBe(false);
    expect(outcome.evalRan).toBe(false);
    expect(outcome.fetchBlocked).toBe(true);
    const directives = outcome.violations.map((v) => v.split('|')[0]);
    expect(directives).toEqual(
      expect.arrayContaining(['script-src-elem', 'script-src', 'connect-src']),
    );
  });
  test('loads every resource from app://renderer and nothing else', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(urls.length).toBeGreaterThan(2);
    for (const url of urls) expect(url.startsWith('app://renderer/'), url).toBe(true);
  });

  test('protocol returns 404 for traversal, foreign hosts, missing files and NUL bytes', async ({
    app,
  }) => {
    const targets = [
      'app://renderer/missing.js',
      'app://renderer/%2e%2e/package.json',
      'app://renderer/..%2fpackage.json',
      'app://renderer/..%5cpackage.json',
      'app://renderer/assets/..%2f..%2f..%2fpackage.json',
      'app://evil/index.html',
      'app://renderer/index.html%00.png',
    ];
    const statuses = await app.evaluate(async ({ net }, urls) => {
      const out: Record<string, number | string> = {};
      for (const url of urls) {
        try {
          out[url] = (await net.fetch(url)).status;
        } catch {
          out[url] = 'error';
        }
      }
      return out;
    }, targets);
    for (const url of targets) expect(['error', 404], url).toContain(statuses[url]);
  });
});

test.describe('navigation, new windows and permissions', () => {
  test('blocks and logs renderer navigation to https and http', async ({ page, launched }) => {
    const urls = ['https://example.com/', 'http://example.com/'];
    for (const [index, url] of urls.entries()) {
      void page.evaluate((u) => void (window.location.href = u), url).catch(() => undefined);
      await expect
        .poll(() => launched.logs.filter((l) => l.includes('navigation.blocked')).length)
        .toBeGreaterThan(index);
      expect(page.url()).toBe('app://renderer/index.html');
    }
  });

  test('keeps the app URL for file:, data: and javascript: navigations', async ({ app, page }) => {
    for (const url of [
      'file:///C:/Windows/win.ini',
      'data:text/html,<h1>x</h1>',
      'javascript:window.__js = 1',
    ]) {
      await page.evaluate((u) => void (window.location.href = u), url);
    }
    // IPC from the same renderer is ordered after the navigation requests above, so a completed round
    // trip means every attempt has been processed. No sleep is needed.
    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
    expect(page.url()).toBe('app://renderer/index.html');
    expect(await page.evaluate(() => (window as { __js?: number }).__js)).toBeUndefined();
    const main = await app.evaluate(({ BrowserWindow }) => ({
      url: BrowserWindow.getAllWindows()[0]?.webContents.getURL(),
      count: BrowserWindow.getAllWindows().length,
    }));
    expect(main).toEqual({ url: 'app://renderer/index.html', count: 1 });
  });
  test('window.open returns null and opens no window', async ({ app, page }) => {
    const opened = await page.evaluate(() => window.open('https://example.com/') === null);
    expect(opened).toBe(true);
    const count = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    expect(count).toBe(1);
    expect(app.windows()).toHaveLength(1);
  });

  test('denies media and geolocation permission requests', async ({ page }) => {
    const result = await page.evaluate(async () => {
      let media = 'resolved';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        media = (e as DOMException).name;
      }
      const geo = await new Promise<number>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          () => resolve(0),
          (err) => resolve(err.code),
        ),
      );
      return { media, geo };
    });
    expect(result.media).toBe('NotAllowedError');
    expect(result.geo).toBe(1);
  });

  test('cannot create an iframe that loads content or reaches the bridge', async ({ page }) => {
    const violations = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const seen: string[] = [];
          document.addEventListener('securitypolicyviolation', (e) => {
            seen.push(e.violatedDirective);
            resolve(seen);
          });
          const frame = document.createElement('iframe');
          frame.src = 'app://renderer/index.html';
          document.body.appendChild(frame);
          setTimeout(() => resolve(seen), 3_000);
        }),
    );
    expect(violations).toContain('frame-src');
    const subframes = page.frames().filter((f) => f !== page.mainFrame());
    for (const frame of subframes) {
      expect(frame.url()).not.toBe('app://renderer/index.html');
    }
    await expect(page.getByRole('region')).toHaveCount(6);
  });
});
