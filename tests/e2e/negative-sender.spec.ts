import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { expect, REPO_ROOT, test } from './fixtures/launch';

// T7.2 (R4.4, CF-1, CF-2): real-Electron negative tests for IPC sender validation.
// The app window is the only registered sender. Every probe window below carries the real preload
// but is NOT registered, so main must answer INVALID_SENDER (never data) whatever frame asks.
const PRELOAD = path.join(REPO_ROOT, 'out', 'preload', 'index.js');

let server: Server;
let origin: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader('content-type', 'text/html');
    if (req.url === '/frame') {
      res.end('<!doctype html><title>frame</title><p>frame</p>');
    } else if (req.url === '/with-frame') {
      res.end('<!doctype html><title>top</title><iframe id="f" src="/frame"></iframe>');
    } else {
      res.end('<!doctype html><title>foreign</title><p>foreign</p>');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function openProbeWindow(
  app: ElectronApplication,
  url: string,
  subFrames: boolean,
): Promise<Page> {
  const opened = app.waitForEvent('window');
  await app.evaluate(
    ({ BrowserWindow }, args) => {
      const win = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: args.preload,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          nodeIntegrationInSubFrames: args.subFrames,
        },
      });
      void win.loadURL(args.url);
    },
    { url, preload: PRELOAD, subFrames },
  );
  const page = await opened;
  await page.waitForLoadState('domcontentloaded');
  return page;
}

function expectInvalidSender(result: unknown): void {
  expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
  expect(result).not.toHaveProperty('data');
  // No application data and no path or stack may leak through the refusal.
  expect(JSON.stringify(result)).not.toMatch(/NecroAmp|version|platform|[A-Za-z]:\\|\.js:\d+/);
}

test.describe('IPC sender validation against the real main process', () => {
  test('control: the registered app window is accepted', async ({ page }) => {
    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({
      ok: true,
      data: { name: 'NecroAmp' },
    });
  });

  test('rejects a foreign-origin top frame that has the bridge', async ({ app, page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const probe = await openProbeWindow(app, `${origin}/`, false);
    expect(await probe.evaluate(() => typeof window.necroamp?.app?.getInfo)).toBe('function');
    expectInvalidSender(await probe.evaluate(() => window.necroamp.app.getInfo()));
  });

  test('blocks a foreign sub-frame navigation and gives a script-created sub-frame no usable bridge', async ({
    app,
    page,
    launched,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await openProbeWindow(app, `${origin}/with-frame`, true);
    // Layer 1: the navigation guard stops the sub-frame from ever loading a foreign page.
    await expect
      .poll(() => launched.logs.filter((l) => l.includes('navigation.blocked')).length)
      .toBeGreaterThan(0);
    // Layer 2: a sub-frame the guard cannot see (script-created about:blank) still gets the preload
    // because this probe window sets nodeIntegrationInSubFrames. Main must refuse it. Frames are
    // read in main (WebFrameMain), the same objects main validates against.
    await openProbeWindow(app, `${origin}/`, true);
    const ask = (src: string) =>
      app.evaluate(
        async ({ BrowserWindow }, args) => {
          const probe = BrowserWindow.getAllWindows().find(
            (w) => w.webContents.getURL() === args.url,
          );
          const contents = probe?.webContents;
          if (contents === undefined) return null;
          if (contents.mainFrame.frames.length === 0) {
            await contents.executeJavaScript(
              'void document.body.appendChild(document.createElement("iframe"))',
            );
          }
          const frame = contents.mainFrame.frames[0];
          if (frame === undefined) return null;
          return { url: frame.url, value: (await frame.executeJavaScript(args.code)) as unknown };
        },
        { code: src, url: `${origin}/` },
      );
    await expect
      .poll(async () => (await ask('typeof window.necroamp'))?.url)
      .toMatch(/^(about:blank)?$/);
    // Observed on Electron 45.5.0: the preload does not run in the initial about:blank document of a
    // script-created frame, so no bridge exists there and no IPC can originate from it. If a future
    // Electron runs the preload there, the sender check must answer INVALID_SENDER (unit-tested).
    const typeofBridge = (await ask('typeof window.necroamp'))?.value;
    if (typeofBridge === 'undefined') {
      expect(typeofBridge).toBe('undefined');
    } else {
      expectInvalidSender((await ask('window.necroamp.app.getInfo()'))?.value);
    }
    expect(launched.child.exitCode).toBeNull();
  });
  test('rejects a trusted-origin page in an unregistered web contents and shows a plain failure', async ({
    app,
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const probe = await openProbeWindow(app, 'app://renderer/index.html', false);
    expectInvalidSender(await probe.evaluate(() => window.necroamp.app.getInfo()));
    await expect(probe.getByText('The application refused the request.')).toBeVisible();
    await expect(probe.getByRole('region')).toHaveCount(6);
  });

  test('the app window still works after refusing the probes', async ({ app, page }) => {
    await openProbeWindow(app, `${origin}/`, false);
    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
  });
});
