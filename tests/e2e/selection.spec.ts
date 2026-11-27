import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { makeWav } from '../fixtures/audio/generate-audio';
import { FIXTURE_TAGS, makeTaggedMp3 } from '../fixtures/audio/generate-tagged';
import {
  expect,
  firstWindow,
  launchApp,
  makeUserData,
  shutdownApp,
  test,
  type LaunchedApp,
} from './fixtures/launch';

// Selection on import and restore (PR #7 manual acceptance finding), against the production
// build. The native dialog is stubbed, nothing touches the network, every file is generated.
// Automated checks cover DOM and media element state only. Audibility needs the human check.
const AUDIO = 'audio[data-part="audio-source"]';
const ITEM = 'li[data-part="playlist-item"]';
let dir: string;
const files = new Map<string, string>();

test.beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-selection-'));
  const write = (name: string, bytes: Uint8Array): void => {
    const full = path.join(dir, name);
    writeFileSync(full, bytes);
    files.set(name, full);
  };
  write('tagged.mp3', makeTaggedMp3());
  write('a.wav', makeWav(1));
  write('b.wav', makeWav(1));
  write('c.wav', makeWav(1));
  write('d.wav', makeWav(1));
});
test.afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const pathsOf = (...names: string[]): string[] => names.map((n) => files.get(n) as string);
async function stubDialog(app: ElectronApplication, selected: readonly string[]): Promise<void> {
  await app.evaluate(({ dialog }, chosen) => {
    (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = () =>
      Promise.resolve({ canceled: false, filePaths: chosen });
  }, selected as string[]);
}
async function addViaButton(app: ElectronApplication, page: Page, ...names: string[]) {
  await stubDialog(app, pathsOf(...names));
  await page.getByRole('button', { name: 'Add files', exact: true }).click();
}
async function clickMenu(app: ElectronApplication, label: string): Promise<void> {
  await app.evaluate(({ Menu }, wanted) => {
    const file = Menu.getApplicationMenu()?.items.find((item) => item.label === 'File');
    const item = file?.submenu?.items.find((entry) => entry.label === wanted);
    if (item === undefined) throw new Error('menu item missing: ' + wanted);
    item.click();
  }, label);
}
const rows = (page: Page) => page.locator(ITEM);
const play = (page: Page) => page.getByRole('button', { name: 'Play', exact: true });
const nowTitle = (page: Page) => page.locator('[data-part="now-playing-title"] dd');
const currentIndex = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const el = document.querySelector('li[aria-current="true"]');
    return el === null ? -1 : Number(el.getAttribute('data-index'));
  });
const audioState = (page: Page) =>
  page.evaluate((selector) => {
    const el = document.querySelector<HTMLAudioElement>(selector);
    if (el === null) throw new Error('audio element missing');
    return { paused: el.paused, currentTime: el.currentTime, src: el.getAttribute('src') };
  }, AUDIO);

test.describe('import into an empty playlist', () => {
  test('Add files loads the first track: Play enabled, metadata and duration shown, nothing playing', async ({
    app,
    page,
  }) => {
    await expect(page.getByText('No track loaded')).toBeVisible();
    await addViaButton(app, page, 'tagged.mp3', 'a.wav', 'b.wav');
    await expect(rows(page)).toHaveCount(3);
    await expect(nowTitle(page)).toHaveText(FIXTURE_TAGS.title);
    await expect(page.locator('[data-part="now-playing-artist"] dd')).toHaveText(
      FIXTURE_TAGS.artist,
    );
    await expect(page.locator('[data-part="now-playing-album"] dd')).toHaveText(FIXTURE_TAGS.album);
    await expect(page.getByText('No track loaded')).toHaveCount(0);
    await expect(page.locator('[data-part="duration"]')).toHaveText('0:01');
    await expect(play(page)).toBeVisible();
    await expect(play(page)).not.toHaveAttribute('aria-disabled', 'true');
    expect(await currentIndex(page)).toBe(0);
    // No playback started: the element holds the track, is paused at 0.
    const state = await audioState(page);
    expect(state.src).toMatch(/^media:\/\/track\//);
    expect(state.paused).toBe(true);
    expect(state.currentTime).toBe(0);
  });

  test('the native File > Open Files path ends in the same state as the button', async ({
    app,
    page,
  }) => {
    await stubDialog(app, pathsOf('tagged.mp3', 'a.wav'));
    await clickMenu(app, 'Open Files…');
    await expect(rows(page)).toHaveCount(2);
    await expect(nowTitle(page)).toHaveText(FIXTURE_TAGS.title);
    await expect(play(page)).not.toHaveAttribute('aria-disabled', 'true');
    expect((await audioState(page)).paused).toBe(true);
    expect(await currentIndex(page)).toBe(0);
  });

  test('Play starts the loaded track', async ({ app, page }) => {
    await addViaButton(app, page, 'a.wav');
    await expect(play(page)).not.toHaveAttribute('aria-disabled', 'true');
    await play(page).click();
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
  });
});

test.describe('non-empty playlist, double-click and Clear Playlist', () => {
  test('adding more files keeps the loaded track and its playing state', async ({ app, page }) => {
    await addViaButton(app, page, 'a.wav', 'b.wav');
    await rows(page).nth(1).locator('[data-part="track-play"]').dblclick();
    await expect(nowTitle(page)).toHaveText('b');
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
    await addViaButton(app, page, 'c.wav', 'd.wav');
    await expect(rows(page)).toHaveCount(4);
    await expect(nowTitle(page)).toHaveText('b');
    expect(await currentIndex(page)).toBe(1);
    expect((await audioState(page)).paused).toBe(false);
  });

  test('double-clicking an entry loads and plays it', async ({ app, page }) => {
    await addViaButton(app, page, 'a.wav', 'b.wav', 'c.wav');
    await expect(nowTitle(page)).toHaveText('a');
    expect((await audioState(page)).paused).toBe(true);
    await rows(page).nth(2).locator('[data-part="track-play"]').dblclick();
    await expect(nowTitle(page)).toHaveText('c');
    expect(await currentIndex(page)).toBe(2);
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
  });

  test('File > Clear Playlist stops playback and unloads the track', async ({ app, page }) => {
    await addViaButton(app, page, 'a.wav', 'b.wav');
    await rows(page).nth(0).locator('[data-part="track-play"]').dblclick();
    await expect.poll(async () => (await audioState(page)).paused).toBe(false);
    await clickMenu(app, 'Clear Playlist');
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByText('No track loaded')).toBeVisible();
    await expect(play(page)).toHaveAttribute('aria-disabled', 'true');
    await expect.poll(async () => (await audioState(page)).paused).toBe(true);
  });
});

test.describe('restore after restart', () => {
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
  const playlistFile = (userData: string): string => path.join(userData, 'playlist.json');

  test('the selected track comes back loaded, not playing, and a legacy file loads the first', async () => {
    const userData = makeUserData();
    const open: LaunchedApp[] = [];
    try {
      const first = await launchApp(userData);
      open.push(first);
      const firstPage = await firstWindow(first.app);
      await addViaButton(first.app, firstPage, 'a.wav', 'b.wav', 'c.wav');
      await rows(firstPage).nth(2).locator('[data-part="track-play"]').dblclick();
      await expect(nowTitle(firstPage)).toHaveText('c');
      await expect
        .poll(
          () =>
            existsSync(playlistFile(userData)) &&
            (JSON.parse(readFileSync(playlistFile(userData), 'utf8')) as { selectedPath?: string })
              .selectedPath === files.get('c.wav'),
          { timeout: 15_000 },
        )
        .toBe(true);
      await closeKeepingData(first);

      const second = await launchApp(userData);
      open.push(second);
      const page = await firstWindow(second.app);
      await expect(rows(page)).toHaveCount(3);
      await expect(nowTitle(page)).toHaveText('c');
      expect(await currentIndex(page)).toBe(2);
      await expect(play(page)).not.toHaveAttribute('aria-disabled', 'true');
      await expect(page.locator('[data-part="duration"]')).toHaveText('0:01');
      const state = await audioState(page);
      expect(state.paused).toBe(true);
      expect(state.currentTime).toBe(0);
      await closeKeepingData(second);

      // Legacy file: same paths, no selection field. The first track is loaded, not played.
      const legacy = JSON.parse(readFileSync(playlistFile(userData), 'utf8')) as Record<
        string,
        unknown
      >;
      delete legacy['selectedPath'];
      writeFileSync(playlistFile(userData), JSON.stringify(legacy));
      const third = await launchApp(userData);
      open.push(third);
      const legacyPage = await firstWindow(third.app);
      await expect(rows(legacyPage)).toHaveCount(3);
      await expect(nowTitle(legacyPage)).toHaveText('a');
      expect(await currentIndex(legacyPage)).toBe(0);
      expect((await audioState(legacyPage)).paused).toBe(true);
    } finally {
      for (const launched of open.reverse()) await shutdownApp(launched);
      rmSync(userData, { recursive: true, force: true });
    }
  });
});
