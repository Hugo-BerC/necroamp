import AxeBuilder from '@axe-core/playwright';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { makeGarbage, makeWav } from '../fixtures/audio/generate-audio';
import {
  FIXTURE_TAGS,
  WAV_TAGS,
  makeOggFlac,
  makeTaggedFlac,
  makeTaggedMp3,
  makeTaggedWav,
  defaultTags,
} from '../fixtures/audio/generate-tagged';
import {
  expect,
  firstWindow,
  launchApp,
  makeUserData,
  shutdownApp,
  test,
  type LaunchedApp,
} from './fixtures/launch';

// Audio Engine Block B: playlist, metadata, artwork and persistence against the production build.
// Automated verification of state and DOM only. Nothing here proves audibility: that needs the
// human listening check. Files are generated at run time, the dialog is stubbed, no network.
const AUDIO = 'audio[data-part="audio-source"]';
const ITEM = 'li[data-part="playlist-item"]';
let dir: string;
const files = new Map<string, string>();

test.beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-playlist-'));
  const write = (name: string, bytes: Uint8Array): void => {
    const full = path.join(dir, name);
    writeFileSync(full, bytes);
    files.set(name, full);
  };
  write('tagged.mp3', makeTaggedMp3());
  write('tagged.flac', makeTaggedFlac());
  write('tagged.ogg', makeOggFlac(defaultTags()));
  write('tagged.wav', makeTaggedWav(WAV_TAGS, 1));
  write('a.wav', makeWav(1));
  write('b.wav', makeWav(1));
  write('c.wav', makeWav(1));
  write('d.wav', makeWav(1));
  write('garbage.mp3', makeGarbage());
});
test.afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function paths(...names: string[]): string[] {
  return names.map((name) => files.get(name) as string);
}

/** Replaces the native dialog in main for this launch. The handler reads it at call time. */
async function stubDialog(app: ElectronApplication, selected: readonly string[]): Promise<void> {
  await app.evaluate(({ dialog }, chosen) => {
    (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = () =>
      Promise.resolve({ canceled: false, filePaths: chosen });
  }, selected as string[]);
}

async function addFiles(app: ElectronApplication, page: Page, ...names: string[]): Promise<void> {
  await stubDialog(app, paths(...names));
  await page.getByRole('button', { name: 'Add files', exact: true }).click();
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const rows = (page: Page) => page.locator(ITEM);
const titles = (page: Page) => rows(page).locator('[data-part="track-play"]').allInnerTexts();
const currentIndex = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const el = document.querySelector('li[aria-current="true"]');
    return el === null ? -1 : Number(el.getAttribute('data-index'));
  });

async function audioState(page: Page) {
  return page.evaluate((selector) => {
    const el = document.querySelector<HTMLAudioElement>(selector);
    if (el === null) throw new Error('audio element missing');
    return {
      paused: el.paused,
      ended: el.ended,
      currentTime: el.currentTime,
      errorCode: el.error?.code ?? null,
      src: el.getAttribute('src'),
    };
  }, AUDIO);
}

/** Records every change of the current row from now on into window.__seen. */
async function recordCurrent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __seen: number[] };
    w.__seen = [];
    const read = (): void => {
      const el = document.querySelector('li[aria-current="true"]');
      const index = el === null ? -1 : Number(el.getAttribute('data-index'));
      if (w.__seen.at(-1) !== index) w.__seen.push(index);
    };
    read();
    new MutationObserver(read).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    });
  });
}
const seen = (page: Page): Promise<number[]> =>
  page.evaluate(() => (window as unknown as { __seen: number[] }).__seen);

test.describe('playlist, metadata and artwork', () => {
  test('adds several files in one selection and lists their metadata and artwork', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'tagged.mp3', 'tagged.flac', 'tagged.ogg', 'a.wav');
    await expect(rows(page)).toHaveCount(4);
    await expect(page.locator('[data-part="playlist-count"]')).toHaveText('4 tracks');
    const first = rows(page).nth(0);
    await expect(first.locator('[data-part="track-play"]')).toHaveText(FIXTURE_TAGS.title);
    await expect(first.locator('[data-part="track-artist"]')).toHaveText(FIXTURE_TAGS.artist);
    await expect(first.locator('[data-part="track-album"]')).toHaveText(FIXTURE_TAGS.album);
    await expect(first.locator('[data-part="track-duration"]')).toHaveText('0:01');
    const plain = rows(page).nth(3);
    await expect(plain.locator('[data-part="track-play"]')).toHaveText('a');
    await expect(plain.locator('[data-part="track-artist"]')).toHaveText('Unknown artist');
    await expect(plain.locator('[data-part="playlist-artwork"]')).toHaveAttribute(
      'data-has-art',
      'false',
    );
    // The artwork really loads through media://art under the production CSP.
    for (const index of [0, 1, 2]) {
      const image = rows(page).nth(index).locator('[data-part="playlist-artwork"] img');
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), {
          timeout: 15_000,
        })
        .toBe(8);
    }
  });

  test('shows the current track metadata and artwork in the player region', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'tagged.flac');
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    await expect(page.locator('[data-part="now-playing-title"] dd')).toHaveText(FIXTURE_TAGS.title);
    await expect(page.locator('[data-part="now-playing-artist"] dd')).toHaveText(
      FIXTURE_TAGS.artist,
    );
    await expect(page.locator('[data-part="now-playing-album"] dd')).toHaveText(FIXTURE_TAGS.album);
    await expect
      .poll(() =>
        page
          .locator('[data-part="now-playing-artwork"] img')
          .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth),
      )
      .toBe(8);
    await expect(page.locator('[data-part="now-playing-artwork"] img')).toHaveAttribute(
      'alt',
      /^Artwork for /,
    );
  });

  test('previous and next move through the list, and Previous restarts only after 3 seconds', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'b.wav', 'c.wav');
    await rows(page).nth(1).locator('[data-part="track-play"]').click();
    await expect.poll(() => currentIndex(page)).toBe(1);
    await button(page, 'Next').click();
    await expect.poll(() => currentIndex(page)).toBe(2);
    await button(page, 'Previous').click();
    await expect.poll(() => currentIndex(page)).toBe(1);
    await button(page, 'Previous').click();
    await expect.poll(() => currentIndex(page)).toBe(0);
    // At the first item with repeat off Previous stays put.
    await button(page, 'Previous').click();
    await expect.poll(() => currentIndex(page)).toBe(0);
    expect((await audioState(page)).errorCode).toBeNull();
  });

  test('progresses automatically to the next track and stops after the last with repeat off', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'b.wav', 'c.wav');
    await recordCurrent(page);
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    await expect.poll(() => seen(page), { timeout: 30_000 }).toEqual([-1, 0, 1, 2]);
    await expect.poll(async () => (await audioState(page)).paused, { timeout: 15_000 }).toBe(true);
    await expect(page.getByText(/could not be played/)).toHaveCount(0);
    expect((await audioState(page)).errorCode).toBeNull();
    // Stayed on the last item: nothing wrapped.
    expect(await seen(page)).toEqual([-1, 0, 1, 2]);
  });

  test('repeat cycles Off, Track, Playlist and each mode behaves as named', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'b.wav');
    const repeat = page.locator('[data-part="playlist-repeat"]');
    await expect(repeat).toHaveText('Repeat: Off');
    await repeat.click();
    await expect(repeat).toHaveText('Repeat: Track');
    await repeat.click();
    await expect(repeat).toHaveText('Repeat: Playlist');
    // Playlist: after b ends the list wraps to a.
    await recordCurrent(page);
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    await expect.poll(() => seen(page), { timeout: 30_000 }).toEqual([-1, 0, 1, 0]);
    // Track: the same item plays again and again.
    await repeat.click(); // Off
    await repeat.click(); // Track
    await expect(repeat).toHaveText('Repeat: Track');
    await page.evaluate((selector) => {
      const w = window as unknown as { __ended: number };
      w.__ended = 0;
      document.querySelector(selector)?.addEventListener('ended', () => (w.__ended += 1));
    }, AUDIO);
    await rows(page).nth(1).locator('[data-part="track-play"]').click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __ended: number }).__ended), {
        timeout: 30_000,
      })
      .toBeGreaterThanOrEqual(2);
    expect(await currentIndex(page)).toBe(1);
  });

  test('shuffle plays every track exactly once per cycle, starting with the chosen one', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'b.wav', 'c.wav', 'd.wav');
    const shuffle = page.locator('[data-part="playlist-shuffle"]');
    await expect(shuffle).toHaveAttribute('aria-pressed', 'false');
    await shuffle.click();
    await expect(shuffle).toHaveAttribute('aria-pressed', 'true');
    await recordCurrent(page);
    await rows(page).nth(2).locator('[data-part="track-play"]').click();
    await expect
      .poll(async () => (await seen(page)).length, { timeout: 40_000 })
      .toBeGreaterThanOrEqual(5);
    const order = (await seen(page)).slice(1, 5);
    expect(order[0]).toBe(2);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
    await shuffle.click();
    await expect(shuffle).toHaveAttribute('aria-pressed', 'false');
  });

  test('reorders and removes tracks and keeps the count and current item right', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'b.wav', 'c.wav');
    await rows(page).nth(1).locator('[data-part="track-play"]').click();
    await expect.poll(() => currentIndex(page)).toBe(1);
    await button(page, 'Move c up').click();
    await expect.poll(() => titles(page)).toEqual(['a', 'c', 'b']);
    await expect.poll(() => currentIndex(page)).toBe(2); // b followed its item
    await button(page, 'Move a down').click();
    await expect.poll(() => titles(page)).toEqual(['c', 'a', 'b']);
    await button(page, 'Remove c').click();
    await expect.poll(() => titles(page)).toEqual(['a', 'b']);
    await expect(page.locator('[data-part="playlist-count"]')).toHaveText('2 tracks');
    await expect.poll(() => currentIndex(page)).toBe(1);
    await button(page, 'Clear').click();
    await expect(rows(page)).toHaveCount(0);
    await expect(page.locator('[data-part="playlist-count"]')).toHaveText('0 tracks');
  });

  test('a corrupt file in the selection is listed, skipped on auto progression and does not stop the rest', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'a.wav', 'garbage.mp3', 'c.wav');
    await recordCurrent(page);
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    await expect.poll(async () => (await seen(page)).includes(2), { timeout: 30_000 }).toBe(true);
    await expect(rows(page)).toHaveCount(3);
  });

  test('has no serious or critical accessibility violations with a populated playlist', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'tagged.mp3', 'a.wav');
    await expect(rows(page)).toHaveCount(2);
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    const results = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const blocking = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')) }));
    expect(blocking).toEqual([]);
  });
});

test.describe('media://art and the production CSP in the live renderer', () => {
  interface Outcome {
    readonly result: 'load' | 'error';
    readonly violation: string | null;
  }
  /** Loads `url` as an image and reports whether a CSP violation fired for it. */
  async function probe(page: Page, url: string): Promise<Outcome> {
    return page.evaluate(
      (target) =>
        new Promise<Outcome>((resolve) => {
          let violation: string | null = null;
          const onViolation = (event: SecurityPolicyViolationEvent): void => {
            violation = event.effectiveDirective;
          };
          document.addEventListener('securitypolicyviolation', onViolation);
          const image = new Image();
          const done = (result: 'load' | 'error'): void => {
            // The violation event is queued before the error event, so it has fired by now.
            setTimeout(() => {
              document.removeEventListener('securitypolicyviolation', onViolation);
              resolve({ result, violation });
            }, 50);
          };
          image.onload = () => done('load');
          image.onerror = () => done('error');
          image.src = target;
        }),
      url,
    );
  }

  test('an image may come from media://art only: every other source is blocked by img-src', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'tagged.mp3');
    await rows(page).nth(0).locator('[data-part="track-play"]').click();
    await expect.poll(async () => (await audioState(page)).src).toMatch(/^media:\/\/track\//);
    const trackUrl = (await audioState(page)).src as string;
    const artUrl = await rows(page)
      .nth(0)
      .locator('[data-part="playlist-artwork"] img')
      .getAttribute('src');
    expect(artUrl).toMatch(/^media:\/\/art\//);
    expect(await probe(page, artUrl as string)).toEqual({ result: 'load', violation: null });
    for (const blocked of [
      trackUrl, // an audio token is not an image source
      'https://example.com/a.png',
      'http://127.0.0.1:9/a.png',
      'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      'blob:app://renderer/00000000-0000-4000-8000-000000000000',
    ]) {
      const outcome = await probe(page, blocked);
      expect(outcome, blocked).toEqual({ result: 'error', violation: 'img-src' });
    }
    // Chromium refuses file: from a non-file page before CSP reporting: it must still fail to load.
    expect((await probe(page, 'file:///etc/hostname')).result).toBe('error');
    // An unissued art token passes the CSP and is answered 404 by the handler: error, no violation.
    expect(await probe(page, 'media://art/00000000-0000-4000-8000-000000000000')).toEqual({
      result: 'error',
      violation: null,
    });
  });

  test('media-src still refuses media://art as an audio source and fetch cannot read media://art', async ({
    app,
    page,
  }) => {
    await addFiles(app, page, 'tagged.mp3');
    const artUrl = await rows(page)
      .nth(0)
      .locator('[data-part="playlist-artwork"] img')
      .getAttribute('src');
    const outcome = await page.evaluate(async (url) => {
      const audioResult = await new Promise<string>((resolve) => {
        let violation = 'none';
        const listener = (event: SecurityPolicyViolationEvent): void => {
          violation = event.effectiveDirective;
        };
        document.addEventListener('securitypolicyviolation', listener);
        const el = new Audio();
        el.addEventListener('error', () => {
          setTimeout(() => {
            document.removeEventListener('securitypolicyviolation', listener);
            resolve(violation);
          }, 50);
        });
        el.src = url;
      });
      let fetchResult: string;
      try {
        const response = await fetch(url);
        fetchResult = `resolved:${String(response.status)}`;
      } catch (error) {
        fetchResult = (error as Error).name;
      }
      return { audioResult, fetchResult };
    }, artUrl as string);
    expect(outcome.audioResult).toBe('media-src');
    expect(outcome.fetchResult).not.toBe('resolved:200');
  });

  test('the bridge refuses paths and unknown tokens on the new channels', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const api = window.necroamp;
      const unissued = '00000000-0000-4000-8000-000000000000';
      return {
        resolveUnknown: await api.library.resolveTrack({ trackId: unissued }),
        resolvePath: await api.library
          .resolveTrack({ trackId: '/etc/passwd' })
          .catch((e: unknown) => ({ threw: (e as Error).name })),
        saveWithPath: await api.playlist
          .save({ items: [{ trackId: '/etc/passwd' }] })
          .catch((e: unknown) => ({ threw: (e as Error).name })),
        saveExtraKey: await api.playlist
          .save({ items: [], filePath: '/tmp/x' } as never)
          .catch((e: unknown) => ({ threw: (e as Error).name })),
      };
    });
    expect(results.resolveUnknown).toEqual({ ok: true, data: { unavailable: true } });
    for (const refused of [results.resolvePath, results.saveWithPath, results.saveExtraKey]) {
      expect(JSON.stringify(refused)).toMatch(/INVALID_PAYLOAD|threw/);
      expect(JSON.stringify(refused)).not.toContain('"ok":true');
    }
  });
});

test.describe('playlist persistence across launches', () => {
  /** Closes the app but keeps its user-data directory so the next launch can read it. */
  async function closeKeepingData(launched: LaunchedApp): Promise<void> {
    const exited = new Promise<void>((resolve) => launched.child.once('exit', () => resolve()));
    await Promise.race([
      launched.app.close().catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 8_000)),
    ]);
    if (launched.child.exitCode === null && launched.child.signalCode === null) {
      launched.child.kill('SIGKILL');
    }
    await exited;
  }

  async function withLaunches(
    userData: string,
    run: (launch: () => Promise<{ launched: LaunchedApp; page: Page }>) => Promise<void>,
  ): Promise<void> {
    const open: LaunchedApp[] = [];
    try {
      await run(async () => {
        const launched = await launchApp(userData);
        open.push(launched);
        return { launched, page: await firstWindow(launched.app) };
      });
    } finally {
      // Newest first: the directory is shared, and Windows refuses to delete it while an app uses it.
      for (const launched of open.reverse()) await shutdownApp(launched);
      rmSync(userData, { recursive: true, force: true });
    }
  }

  const playlistFile = (userData: string): string => path.join(userData, 'playlist.json');

  test('restores order, metadata and artwork after a restart, and marks a deleted file as missing', async () => {
    const userData = makeUserData();
    const keep = path.join(dir, 'restart-keep.wav');
    const vanish = path.join(dir, 'restart-vanish.wav');
    writeFileSync(keep, makeWav(1));
    writeFileSync(vanish, makeWav(1));
    await withLaunches(userData, async (launch) => {
      const first = await launch();
      await stubDialog(first.launched.app, [
        files.get('tagged.mp3') as string,
        vanish,
        keep,
        files.get('tagged.ogg') as string,
      ]);
      await first.page.getByRole('button', { name: 'Add files', exact: true }).click();
      await expect(rows(first.page)).toHaveCount(4);
      await button(first.page, 'Move restart-keep up').click();
      await expect
        .poll(() => titles(first.page))
        .toEqual([FIXTURE_TAGS.title, 'restart-keep', 'restart-vanish', FIXTURE_TAGS.title]);
      await expect
        .poll(
          () =>
            existsSync(playlistFile(userData)) &&
            (
              JSON.parse(readFileSync(playlistFile(userData), 'utf8')) as {
                items: { path: string }[];
              }
            ).items
              .map((i) => path.basename(i.path))
              .join(',') === 'tagged.mp3,restart-keep.wav,restart-vanish.wav,tagged.ogg',
          { timeout: 15_000 },
        )
        .toBe(true);
      // Only paths, a version and nothing else is stored.
      const saved = JSON.parse(readFileSync(playlistFile(userData), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(Object.keys(saved).sort()).toEqual(['items', 'schemaVersion']);
      await closeKeepingData(first.launched);
      rmSync(vanish);

      const second = await launch();
      await expect(rows(second.page)).toHaveCount(4);
      await expect
        .poll(() => titles(second.page))
        .toEqual([FIXTURE_TAGS.title, 'restart-keep', 'restart-vanish', FIXTURE_TAGS.title]);
      await expect(rows(second.page).nth(0).locator('[data-part="track-artist"]')).toHaveText(
        FIXTURE_TAGS.artist,
      );
      await expect
        .poll(() =>
          rows(second.page)
            .nth(0)
            .locator('[data-part="playlist-artwork"] img')
            .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth),
        )
        .toBe(8);
      await expect(rows(second.page).nth(2)).toHaveAttribute('data-unavailable', 'true');
      await expect(rows(second.page).nth(2).locator('[data-part="track-missing"]')).toBeVisible();
      // A restored track plays with a fresh session token, a missing one reports plainly.
      await rows(second.page).nth(1).locator('[data-part="track-play"]').click();
      await expect
        .poll(async () => (await audioState(second.page)).currentTime, { timeout: 15_000 })
        .toBeGreaterThan(0.1);
      expect((await audioState(second.page)).errorCode).toBeNull();
      await rows(second.page).nth(2).locator('[data-part="track-play"]').click();
      await expect(second.page.getByText(/missing|could not be found/).first()).toBeVisible();
      await expect(second.page.getByRole('heading', { level: 1 })).toBeVisible();
    });
    rmSync(keep, { force: true });
  });

  test('starts with an empty usable playlist when playlist.json is corrupt', async () => {
    for (const content of [
      '{"schemaVersion":1,"items":[{"path":',
      '\u0000\u0001garbage',
      '{"schemaVersion":99,"items":[]}',
    ]) {
      const userData = makeUserData();
      writeFileSync(playlistFile(userData), content);
      await withLaunches(userData, async (launch) => {
        const { launched, page } = await launch();
        await expect(page.locator('[data-part="playlist-count"]')).toHaveText('0 tracks');
        await expect(rows(page)).toHaveCount(0);
        await expect(page.locator('[data-part="playlist-empty"]')).toBeVisible();
        // Still usable, and a successful save replaces the corrupt file.
        await addFiles(launched.app, page, 'a.wav');
        await expect(rows(page)).toHaveCount(1);
        await expect
          .poll(
            () => {
              try {
                return (
                  JSON.parse(readFileSync(playlistFile(userData), 'utf8')) as { items: unknown[] }
                ).items.length;
              } catch {
                return -1;
              }
            },
            { timeout: 15_000 },
          )
          .toBe(1);
        expect(launched.logs.join('\n')).not.toContain(userData);
      });
    }
  });

  test('a hand-edited playlist.json cannot authorise a non-audio file', async () => {
    const userData = makeUserData();
    const secret = path.join(dir, 'secret.txt');
    writeFileSync(secret, 'not music');
    writeFileSync(
      playlistFile(userData),
      JSON.stringify({ schemaVersion: 1, items: [{ path: secret }, { path: files.get('a.wav') }] }),
    );
    await withLaunches(userData, async (launch) => {
      const { page } = await launch();
      await expect(rows(page)).toHaveCount(1);
      await expect.poll(() => titles(page)).toEqual(['a']);
    });
  });
});
