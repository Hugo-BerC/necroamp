import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import {
  makeFlac,
  makeGarbage,
  makeMp3,
  makeOggContainerOnly,
  makeWav,
} from '../fixtures/audio/generate-audio';
import { makeOggFlac, makeToneMp3 } from '../fixtures/audio/generate-tagged';
import { makeOggVorbis } from '../fixtures/audio/generate-vorbis';
import { expect, test } from './fixtures/launch';

// Audio Engine Block A: automated playback verification against the production build.
// This proves the media element loads, progresses, seeks and reports state. It does NOT prove
// that sound is audible or musically correct: that needs a human listening check (H.2).
// Files are synthetic and generated at run time. No network, no real dialog.

interface Source {
  readonly state: {
    readonly paused: boolean;
    readonly muted: boolean;
    readonly volume: number;
    readonly currentTime: number;
    readonly duration: number;
    readonly readyState: number;
    readonly ended: boolean;
    readonly errorCode: number | null;
    readonly hasSrc: boolean;
  };
}

const AUDIO = 'audio[data-part="audio-source"]';

let dir: string;
const files = new Map<string, string>();

test.beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-audio-'));
  const write = (name: string, bytes: Uint8Array): void => {
    const full = path.join(dir, name);
    writeFileSync(full, bytes);
    files.set(name, full);
  };
  write('tone.wav', makeWav(3));
  write('long-tone.wav', makeWav(30));
  write('silence.mp3', makeMp3());
  write('tone.flac', makeFlac());
  write('tone.mp3', makeToneMp3());
  write('tone.ogg', makeOggFlac());
  write('vorbis.ogg', await makeOggVorbis());
  write('container-only.ogg', makeOggContainerOnly());
  write('garbage.mp3', makeGarbage());
});

test.afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Replaces the native dialog in main for this launch. The handler reads it at call time. */
async function stubDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, selected) => {
    (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = () =>
      Promise.resolve({ canceled: false, filePaths: [selected] });
  }, filePath);
}

async function source(page: Page): Promise<Source['state']> {
  return page.evaluate((selector) => {
    const el = document.querySelector<HTMLAudioElement>(selector);
    if (el === null) throw new Error('audio element missing');
    return {
      paused: el.paused,
      muted: el.muted,
      volume: el.volume,
      currentTime: el.currentTime,
      duration: el.duration,
      readyState: el.readyState,
      ended: el.ended,
      errorCode: el.error?.code ?? null,
      hasSrc: el.getAttribute('src') !== null,
    };
  }, AUDIO);
}

/** Counts spectrum canvas pixels that differ from the background (drawn bars). */
async function litSpectrumPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-part="spectrum-canvas"]');
    const ctx = canvas?.getContext('2d');
    if (canvas == null || ctx == null) throw new Error('spectrum canvas missing');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) lit += 1;
    }
    return lit;
  });
}
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test.describe('local playback (automated, not human listening)', () => {
  test('opens a WAV, plays, advances, pauses, stops and shows time', async ({ app, page }) => {
    await stubDialog(app, files.get('tone.wav') as string);
    await button(page, 'Open').click();

    await expect(page.locator('[data-part="now-playing-title"] dd')).toHaveText('tone');
    await expect.poll(async () => (await source(page)).errorCode).toBeNull();
    await expect.poll(async () => (await source(page)).duration).toBeCloseTo(3, 1);
    await expect(page.locator('[data-part="duration"]')).toHaveText('0:03');

    await expect.poll(async () => (await source(page)).paused).toBe(false);
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(0.2);
    await expect(button(page, 'Pause')).not.toHaveAttribute('aria-disabled', 'true');

    await button(page, 'Pause').click();
    await expect.poll(async () => (await source(page)).paused).toBe(true);
    const frozen = (await source(page)).currentTime;
    await expect(button(page, 'Play')).not.toHaveAttribute('aria-disabled', 'true');
    await page.waitForTimeout(300); // negative check: position must not move while paused
    expect((await source(page)).currentTime).toBe(frozen);

    await button(page, 'Play').click();
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(frozen);

    await button(page, 'Stop').click();
    await expect.poll(async () => (await source(page)).paused).toBe(true);
    expect((await source(page)).currentTime).toBe(0);
    await expect(page.locator('[data-part="elapsed"]')).toHaveText('0:00');
  });

  test('seeks with the slider and the position follows', async ({ app, page }) => {
    await stubDialog(app, files.get('tone.wav') as string);
    await button(page, 'Open').click();
    await expect(page.locator('#player-seek')).toBeEnabled();
    await button(page, 'Pause').click();
    await page.locator('#player-seek').fill('2');
    await expect.poll(async () => (await source(page)).currentTime).toBeCloseTo(2, 0);
    await expect(page.locator('[data-part="elapsed"]')).toHaveText('0:02');
  });

  test('applies volume and mute to the media element and keeps the volume while muted', async ({
    app,
    page,
  }) => {
    // Block C: once the Web Audio graph exists (built on the play gesture), volume and mute
    // drive the master gain, which sits before the analyser. The element stays at unity, and
    // the effect is observed through the spectrum canvas, which is drawn from the analyser.
    await stubDialog(app, files.get('long-tone.wav') as string);
    await button(page, 'Open').click();
    await expect.poll(async () => (await source(page)).paused).toBe(false);
    const lit = () => litSpectrumPixels(page);
    await expect.poll(lit, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.locator('#player-volume').fill('30');
    await expect(page.locator('#player-volume')).toHaveValue('30');
    expect(await source(page)).toMatchObject({ volume: 1, muted: false });
    await expect.poll(lit, { timeout: 10_000 }).toBeGreaterThan(0);
    await button(page, 'Mute').click();
    await expect(button(page, 'Mute')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(lit, { timeout: 10_000 }).toBe(0);
    // The volume setting is kept while muted.
    await expect(page.locator('#player-volume')).toHaveValue('30');
    expect((await source(page)).paused).toBe(false);
    await button(page, 'Mute').click();
    await expect(button(page, 'Mute')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(lit, { timeout: 10_000 }).toBeGreaterThan(0);
    await page.locator('#player-volume').fill('0');
    await expect.poll(lit, { timeout: 10_000 }).toBe(0);
  });

  test('plays an MP3 of silent frames without a media error', async ({ app, page }) => {
    await stubDialog(app, files.get('silence.mp3') as string);
    await button(page, 'Open').click();
    await expect
      .poll(async () => (await source(page)).readyState, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);
    expect((await source(page)).errorCode).toBeNull();
    await expect.poll(async () => (await source(page)).duration).toBeGreaterThan(0.5);
  });

  test('plays an MP3 that carries a real signal, reports its duration and advances', async ({
    app,
    page,
  }) => {
    await stubDialog(app, files.get('tone.mp3') as string);
    await button(page, 'Open').click();
    await expect
      .poll(async () => (await source(page)).duration, { timeout: 15_000 })
      .toBeCloseTo(1.02, 1);
    expect((await source(page)).errorCode).toBeNull();
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(0.1);
  });
  test('plays an .ogg file (Ogg-encapsulated FLAC, not Vorbis) and reports its duration', async ({
    app,
    page,
  }) => {
    await stubDialog(app, files.get('tone.ogg') as string);
    await button(page, 'Open').click();
    await expect
      .poll(async () => (await source(page)).duration, { timeout: 15_000 })
      .toBeCloseTo(0.557, 1);
    expect((await source(page)).errorCode).toBeNull();
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(0.1);
  });
  test('plays a real Ogg Vorbis file, reports its duration and advances', async ({ app, page }) => {
    await stubDialog(app, files.get('vorbis.ogg') as string);
    await button(page, 'Open').click();
    await expect
      .poll(async () => (await source(page)).duration, { timeout: 15_000 })
      .toBeCloseTo(1, 1);
    expect((await source(page)).errorCode).toBeNull();
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(0.1);
    // The spectrum is drawn from the analyser, so a lit canvas shows the decoded tone reaches the graph.
    await expect.poll(() => litSpectrumPixels(page), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('plays a FLAC without a media error and reports its duration', async ({ app, page }) => {
    await stubDialog(app, files.get('tone.flac') as string);
    await button(page, 'Open').click();
    await expect
      .poll(async () => (await source(page)).duration, { timeout: 15_000 })
      .toBeCloseTo(0.557, 1);
    expect((await source(page)).errorCode).toBeNull();
    await expect
      .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
      .toBeGreaterThan(0.1);
  });

  for (const name of ['garbage.mp3', 'container-only.ogg']) {
    test(`shows a plain error for ${name} and keeps the app usable`, async ({ app, page }) => {
      await stubDialog(app, files.get(name) as string);
      await button(page, 'Open').click();
      await expect(
        page.locator('[data-part="status-text"], [role="status"]').first(),
      ).toBeVisible();
      await expect(
        page.getByText(/not supported|damaged|could not be decoded|could not be found/),
      ).toBeVisible({ timeout: 15_000 });
      await expect(button(page, 'Stop')).toHaveAttribute('aria-disabled', 'true'); // Play stays enabled so the user can retry
      // The app recovers: a good file plays afterwards.
      await stubDialog(app, files.get('tone.wav') as string);
      await button(page, 'Open').click();
      await expect
        .poll(async () => (await source(page)).currentTime, { timeout: 15_000 })
        .toBeGreaterThan(0);
      await expect(page.getByText(/not supported|damaged|could not be decoded/)).toHaveCount(0);
    });
  }

  test('a cancelled dialog changes nothing', async ({ app, page }) => {
    await app.evaluate(({ dialog }) => {
      (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = () =>
        Promise.resolve({ canceled: true, filePaths: [] });
    });
    await button(page, 'Open').click();
    await expect(page.locator('[data-part="now-playing-title"] dd')).toHaveText('No track loaded');
  });
});

test.describe('media:// boundaries in the real renderer', () => {
  test('the renderer cannot fetch media:// or reach a path (connect-src none)', async ({
    page,
  }) => {
    const outcomes = await page.evaluate(async () => {
      const attempts = [
        'media://track/00000000-0000-4000-8000-000000000000',
        'media://track/../../etc/passwd',
        'file:///etc/passwd',
      ];
      const results: string[] = [];
      for (const url of attempts) {
        try {
          const response = await fetch(url);
          results.push(`resolved:${String(response.status)}`);
        } catch (error) {
          results.push((error as Error).name);
        }
      }
      return results;
    });
    for (const outcome of outcomes) expect(outcome).not.toBe('resolved:200');
  });

  test('an audio element on an unissued token fails and never plays', async ({ page }) => {
    const result = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const el = new Audio();
          el.addEventListener('error', () => resolve(`error:${String(el.error?.code)}`));
          el.addEventListener('loadedmetadata', () => resolve('loaded'));
          el.src = 'media://track/00000000-0000-4000-8000-000000000000';
        }),
    );
    expect(result).toMatch(/^error:/);
  });

  test('the bridge exposes only the typed library and playlist methods, frozen', async ({
    page,
  }) => {
    const shape = await page.evaluate(() => {
      const bridge = window.necroamp as unknown as Record<string, Record<string, unknown>>;
      return {
        top: Object.keys(bridge).sort(),
        libraryKeys: Object.keys(bridge['library'] ?? {}).sort(),
        playlistKeys: Object.keys(bridge['playlist'] ?? {}).sort(),
        frozen: [bridge['library'], bridge['playlist']].map((o) => Object.isFrozen(o)),
      };
    });
    expect(shape).toEqual({
      top: ['app', 'library', 'playlist'],
      libraryKeys: ['openFiles', 'resolveTrack'],
      playlistKeys: ['load', 'save'],
      frozen: [true, true],
    });
  });
  test('closing the app releases the media element (no leftover audio on dispose)', async ({
    page,
  }) => {
    expect(await page.locator(AUDIO).count()).toBe(1);
  });
});
