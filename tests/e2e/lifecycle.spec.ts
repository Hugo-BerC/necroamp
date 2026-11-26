import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { launchApp, launchEnv, REPO_ROOT, shutdownApp, test, expect } from './fixtures/launch';

// T7.3 (R7, R8.11, R9.2): lifecycle, layout and keyboard E2E against the production build.
const EXIT_BOUND_MS = 5_000;

function exitOf(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolve) => child.once('exit', (code) => resolve(code)));
}

async function exitsWithin(child: ChildProcess, ms: number): Promise<number | null | 'timeout'> {
  return Promise.race([
    exitOf(child),
    new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms)),
  ]);
}

test.describe('single instance', () => {
  test('a second process with the same profile exits and leaves one window', async ({
    app,
    page,
    launched,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const exe = await app.evaluate(() => process.execPath);
    const second = spawn(exe, [REPO_ROOT], {
      cwd: REPO_ROOT,
      env: launchEnv(launched.userData),
      stdio: 'ignore',
    });
    try {
      expect(await exitsWithin(second, 15_000)).toBe(0);
    } finally {
      if (second.exitCode === null) second.kill('SIGKILL');
    }
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
  });
});

test.describe('shutdown', () => {
  test('closing the last window follows the platform policy', async ({ app, page, launched }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close());
    if (process.platform === 'darwin') {
      // macOS keeps the app alive with no window (R7.3).
      expect(await exitsWithin(launched.child, 1_500)).toBe('timeout');
    } else {
      expect(await exitsWithin(launched.child, EXIT_BOUND_MS)).toBe(0);
    }
  });

  test('app.quit() exits with code 0 within five seconds', async ({ app, page, launched }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await app.evaluate(({ app: electronApp }) => electronApp.quit()).catch(() => undefined);
    expect(await exitsWithin(launched.child, EXIT_BOUND_MS)).toBe(0);
  });
});

test.describe('renderer crash policy (R7.4)', () => {
  test('reloads after the first crash and quits cleanly after the second', async ({
    app,
    page,
    launched,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const crash = () =>
      app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]?.webContents.forcefullyCrashRenderer(),
      );
    await crash();
    // The crashed Playwright page handle is dead. The reloaded renderer is observed from main.
    const probe = () =>
      app.evaluate(async ({ BrowserWindow }) => {
        const wc = BrowserWindow.getAllWindows()[0]?.webContents;
        if (wc === undefined || wc.isCrashed() || wc.isLoading()) return null;
        return (await wc.executeJavaScript('window.necroamp.app.getInfo()')) as unknown;
      });
    await expect.poll(probe).toMatchObject({ ok: true, data: { name: 'NecroAmp' } });
    expect(launched.child.exitCode).toBeNull();
    await crash();
    expect(await exitsWithin(launched.child, 10_000)).toBe(0);
    // The log carries event names and codes only, never paths or stacks.
    const log = launched.logs.join('\n');
    expect(log).toMatch(/render-process-gone|renderer\.gone|renderer/i);
    expect(log).not.toMatch(/[A-Za-z]:\\|\.js:\d+|\bat\s+\S+\s+\(/);
  });
});

test.describe('fresh profile per launch', () => {
  test('two sequential launches use separate user-data directories and both quit', async () => {
    const first = await launchApp();
    await shutdownApp(first);
    const second = await launchApp();
    expect(second.userData).not.toBe(first.userData);
    await shutdownApp(second);
    expect(second.child.exitCode ?? second.child.signalCode).not.toBeNull();
  });
});

test.describe('layout and keyboard', () => {
  test('keeps the minimum window size', async ({ app, page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const min = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.getMinimumSize(),
    );
    expect(min).toEqual([800, 600]);
  });

  for (const [width, height] of [
    [800, 600],
    [1920, 1080],
  ] as const) {
    test(`lays out six non-overlapping regions without horizontal overflow at ${width}x${height}`, async ({
      app,
      page,
    }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await app.evaluate(
        ({ BrowserWindow }, size) => {
          BrowserWindow.getAllWindows()[0]?.setContentSize(size.width, size.height);
        },
        { width, height },
      );
      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(width);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        boxes: [...document.querySelectorAll('section[data-region]')].map((el) => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute('data-region'), x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(metrics.boxes).toHaveLength(6);
      for (const b of metrics.boxes) {
        expect(b.w, b.id ?? '').toBeGreaterThan(40);
        expect(b.h, b.id ?? '').toBeGreaterThan(20);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(width + 0.5);
      }
      for (const [i, a] of metrics.boxes.entries()) {
        for (const b of metrics.boxes.slice(i + 1)) {
          const apart =
            a.x + a.w <= b.x + 0.5 ||
            b.x + b.w <= a.x + 0.5 ||
            a.y + a.h <= b.y + 0.5 ||
            b.y + b.h <= a.y + 0.5;
          expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
        }
      }
    });
  }

  test('Tab visits every button in DOM order with a visible focus ring and no trap', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const names = await page
      .getByRole('button')
      .evaluateAll((els) => els.map((e) => e.textContent));
    expect(names.length).toBeGreaterThanOrEqual(5);
    const seen: (string | null)[] = [];
    for (let i = 0; i < names.length; i += 1) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement?.textContent ?? null));
      const ring = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement as Element);
        return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
      });
      expect(ring.style).toBe('solid');
      expect(ring.width).toBe('2px');
      expect(ring.color).toBe('rgb(127, 180, 255)');
    }
    expect(seen).toEqual(names);
    // An Electron window has no browser chrome, so Tab after the last control wraps to the first.
    // Wrapping, and Shift+Tab walking back, proves there is no trap.
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent ?? null)).toBe(names[0]);
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent ?? null)).toBe(
      names[names.length - 1],
    );
  });

  test('an unavailable control stays focusable, keeps aria-disabled and reports itself', async ({
    page,
  }) => {
    const play = page.getByTestId('player').getByRole('button', { name: 'Play', exact: true });
    await play.focus();
    await expect(play).toBeFocused();
    await expect(play).toHaveAttribute('aria-disabled', 'true');
    await play.press('Enter');
    await expect(play).toBeFocused();
  });
});
