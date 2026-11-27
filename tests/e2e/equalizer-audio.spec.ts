import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { makeWav } from '../fixtures/audio/generate-audio';
import { expect, test } from './fixtures/launch';
// Audio Engine Gate C: the equalizer acts on real audio in the real AudioContext.
// A steady 440 Hz tone plays through the production Web Audio graph. The only observable is the
// spectrum canvas, which is drawn from the AnalyserNode after the equalizer, so a change in the
// number of lit pixels is a change in the analyser output. Only existing UI controls are used.
// Automated signal check, not a human listening check.
const SPECTRUM = '[data-part="spectrum-canvas"]';
let dir: string;
let tonePath: string;
test.beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-eq-'));
  tonePath = path.join(dir, 'long-tone.wav');
  writeFileSync(tonePath, makeWav(30));
});
test.afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});
async function stubDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, selected) => {
    (dialog as unknown as { showOpenDialog: unknown }).showOpenDialog = () =>
      Promise.resolve({ canceled: false, filePaths: [selected] });
  }, filePath);
}
/** Number of spectrum pixels that differ from the background colour (the drawn bars). */
async function litPixels(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    const canvas = document.querySelector<HTMLCanvasElement>(selector);
    const ctx = canvas?.getContext('2d');
    if (canvas == null || ctx == null) throw new Error('spectrum canvas missing');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) lit += 1;
    }
    return lit;
  }, SPECTRUM);
}
/**
 * Waits until the analyser output of a steady tone has settled (the analyser smooths over time)
 * and returns the median of the final readings. Bounded: it fails instead of looping forever.
 */
async function settledLevel(page: Page): Promise<number> {
  let result = -1;
  await expect
    .poll(
      async () => {
        const readings: number[] = [];
        for (let i = 0; i < 5; i += 1) {
          readings.push(await litPixels(page));
          await page.waitForTimeout(60);
        }
        const sorted = [...readings].sort((a, b) => a - b);
        const spread = (sorted[4] as number) - (sorted[0] as number);
        result = sorted[2] as number;
        return spread <= Math.max(8, result * 0.02);
      },
      { timeout: 20_000, intervals: [100] },
    )
    .toBe(true);
  return result;
}
const percent = (value: number, base: number): string => `${((value / base) * 100).toFixed(1)}%`;
test.describe('equalizer acts on real audio (automated, not human listening)', () => {
  test('preamp and a band near the tone change the analyser output, and bypass restores flat', async ({
    app,
    page,
  }, testInfo) => {
    await stubDialog(app, tonePath);
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect.poll(() => litPixels(page), { timeout: 15_000 }).toBeGreaterThan(0);
    const flat = await settledLevel(page);
    expect(flat).toBeGreaterThan(100); // a real tone draws a visible spectrum
    const preamp = page.locator('#eq-preamp-slider');
    const band500 = page.locator('#eq-band-4'); // 500 Hz peaking, the band nearest 440 Hz
    const bypass = page.locator('#eq-bypass-toggle');
    // Preamp down: quieter than flat.
    await preamp.fill('-12');
    const preampDown = await settledLevel(page);
    expect(preampDown, `preamp -12 dB: ${percent(preampDown, flat)} of flat`).toBeLessThan(
      flat * 0.9,
    );
    // Preamp up: louder than flat.
    await preamp.fill('12');
    const preampUp = await settledLevel(page);
    expect(preampUp, `preamp +12 dB: ${percent(preampUp, flat)} of flat`).toBeGreaterThan(
      flat * 1.03,
    );
    // Preamp back to 0, then cut the band near the tone.
    await preamp.fill('0');
    expect(Math.abs((await settledLevel(page)) - flat)).toBeLessThanOrEqual(
      Math.max(8, flat * 0.03),
    );
    await band500.fill('-12');
    const bandCut = await settledLevel(page);
    expect(bandCut, `500 Hz band -12 dB: ${percent(bandCut, flat)} of flat`).toBeLessThan(
      flat * 0.9,
    );
    // Boost the band near the tone: louder than flat.
    await band500.fill('12');
    const bandBoost = await settledLevel(page);
    expect(bandBoost, `500 Hz band +12 dB: ${percent(bandBoost, flat)} of flat`).toBeGreaterThan(
      flat * 1.03,
    );
    // Bypass with the boost still set returns the flat output.
    await bypass.check();
    const bypassed = await settledLevel(page);
    expect(Math.abs(bypassed - flat)).toBeLessThanOrEqual(Math.max(8, flat * 0.03));
    // The stored boost is kept and returns when bypass is cleared.
    await expect(band500).toHaveValue('12');
    await bypass.uncheck();
    const restored = await settledLevel(page);
    expect(restored).toBeGreaterThan(flat * 1.03);
    testInfo.annotations.push({
      type: 'equalizer-levels',
      description: JSON.stringify({
        flat,
        preampDown,
        preampUp,
        bandCut,
        bandBoost,
        bypassed,
        restored,
      }),
    });
  });
});
