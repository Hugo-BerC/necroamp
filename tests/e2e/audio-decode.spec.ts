import type { Page } from '@playwright/test';
import { makeFlac, makeMp3, makeWav } from '../fixtures/audio/generate-audio';
import {
  makeOggFlac,
  makeTaggedFlac,
  makeTaggedMp3,
  makeToneMp3,
} from '../fixtures/audio/generate-tagged';
import { expect, test } from './fixtures/launch';

// Audio Engine Block B: decode every synthetic fixture with the real Chromium decoders of the
// production build and compare the decoded signal with tolerances (never byte equality).
// This is automated decode verification. It is NOT a human listening check: it proves that the
// decoder accepts the file and that the decoded samples contain a 440 Hz tone (or silence) at the
// expected level, not that the result sounds right on a speaker.
interface Analysis {
  readonly sampleRate: number;
  readonly channels: number;
  readonly durationSec: number;
  readonly rms: number;
  readonly peak: number;
  readonly nonFinite: number;
  /** Goertzel power at each probe frequency, normalised by signal energy. */
  readonly tone: Readonly<Record<string, number>>;
}

const PROBES = [220, 440, 1000, 2000, 3500];

async function analyse(page: Page, bytes: Uint8Array): Promise<Analysis> {
  return page.evaluate(
    async ({ data, probes }) => {
      const context = new OfflineAudioContext(1, 1, 44100);
      const buffer = await context.decodeAudioData(Uint8Array.from(data).buffer);
      const samples = buffer.getChannelData(0);
      let sum = 0;
      let peak = 0;
      let nonFinite = 0;
      for (const value of samples) {
        if (!Number.isFinite(value)) nonFinite += 1;
        sum += value * value;
        peak = Math.max(peak, Math.abs(value));
      }
      const goertzel = (hz: number): number => {
        const omega = (2 * Math.PI * hz) / buffer.sampleRate;
        const coefficient = 2 * Math.cos(omega);
        let s1 = 0;
        let s2 = 0;
        for (const value of samples) {
          const s0 = value + coefficient * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        return (
          (s1 * s1 + s2 * s2 - coefficient * s1 * s2) / (samples.length * Math.max(sum, 1e-12))
        );
      };
      const tone: Record<string, number> = {};
      for (const hz of probes) tone[String(hz)] = goertzel(hz);
      return {
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
        durationSec: buffer.duration,
        rms: Math.sqrt(sum / samples.length),
        peak,
        nonFinite,
        tone,
      };
    },
    { data: Array.from(bytes), probes: PROBES },
  );
}

/** The 440 Hz probe must dominate every off-tone probe by this factor. */
const TONE_DOMINANCE = 20;
function expectTone(result: Analysis): void {
  const at440 = result.tone['440'] as number;
  for (const hz of [220, 1000, 2000, 3500]) {
    expect(at440, `440 Hz vs ${String(hz)} Hz`).toBeGreaterThan(
      (result.tone[String(hz)] as number) * TONE_DOMINANCE,
    );
  }
}

const CASES = [
  { name: 'WAV', build: () => makeWav(1), seconds: 1, tolerance: 0.01, minRms: 0.2, maxRms: 0.4 },
  {
    name: 'FLAC',
    build: () => makeFlac(),
    seconds: 0.557,
    tolerance: 0.02,
    minRms: 0.2,
    maxRms: 0.4,
  },
  {
    name: 'OGG (Ogg FLAC)',
    build: () => makeOggFlac(),
    seconds: 0.557,
    tolerance: 0.02,
    minRms: 0.2,
    maxRms: 0.4,
  },
  {
    name: 'OGG (Ogg FLAC, tagged with artwork)',
    build: () =>
      makeOggFlac({
        title: 't',
        picture: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      }),
    seconds: 0.557,
    tolerance: 0.02,
    minRms: 0.2,
    maxRms: 0.4,
  },
  {
    name: 'FLAC (tagged with artwork)',
    build: () => makeTaggedFlac(),
    seconds: 0.557,
    tolerance: 0.02,
    minRms: 0.2,
    maxRms: 0.4,
  },
  // MP3 decoders differ slightly in level, so the band is wide: measured rms is about 0.124.
  {
    name: 'MP3 tone',
    build: () => makeToneMp3(),
    seconds: 1.02,
    tolerance: 0.08,
    minRms: 0.08,
    maxRms: 0.25,
  },
  {
    name: 'MP3 tone (ID3v2.4 tag + artwork)',
    build: () => makeTaggedMp3(),
    seconds: 1.02,
    tolerance: 0.08,
    minRms: 0.08,
    maxRms: 0.25,
  },
] as const;

test.describe('decoded fixtures (automated, not human listening)', () => {
  for (const item of CASES) {
    test(`${item.name} decodes to a 440 Hz tone of the expected length and level`, async ({
      page,
    }) => {
      const result = await analyse(page, item.build());
      expect(result.nonFinite).toBe(0);
      expect(result.channels).toBeGreaterThanOrEqual(1);
      expect(Math.abs(result.durationSec - item.seconds)).toBeLessThanOrEqual(item.tolerance);
      expect(result.rms).toBeGreaterThan(item.minRms);
      expect(result.rms).toBeLessThan(item.maxRms);
      expect(result.peak).toBeLessThanOrEqual(1.0001);
      expectTone(result);
    });
  }

  test('the silent MP3 decodes to silence, so a tone assertion can tell the two fixtures apart', async ({
    page,
  }) => {
    const result = await analyse(page, makeMp3());
    expect(result.rms).toBeLessThan(1e-4);
    expect(result.peak).toBeLessThan(1e-3);
  });

  test('a tagged MP3 decodes to the same signal as the untagged one (tags add no audio)', async ({
    page,
  }) => {
    const plain = await analyse(page, makeToneMp3());
    const tagged = await analyse(page, makeTaggedMp3());
    expect(Math.abs(tagged.rms - plain.rms)).toBeLessThan(plain.rms * 0.05 + 1e-4);
    expect(Math.abs(tagged.durationSec - plain.durationSec)).toBeLessThan(0.03);
  });

  test('garbage bytes are rejected by the decoder instead of producing audio', async ({ page }) => {
    const outcome = await page.evaluate(async () => {
      const context = new OfflineAudioContext(1, 1, 44100);
      const bytes = new Uint8Array(2048).map((_v, i) => (i * 131 + 17) & 0xfe);
      try {
        await context.decodeAudioData(bytes.buffer);
        return 'decoded';
      } catch (error) {
        return (error as Error).name;
      }
    });
    expect(outcome).toBe('EncodingError');
  });
});
