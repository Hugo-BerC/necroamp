import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  MAX_TRACKS_PER_REQUEST,
  openFilesRequestSchema,
  openFilesResponseSchema,
  trackInfoSchema,
} from './library';

const TOKEN = '123e4567-e89b-42d3-a456-426614174000';
const track = {
  trackId: TOKEN,
  mediaUrl: `media://track/${TOKEN}`,
  fileName: 'a.mp3',
  title: 'a',
  artist: 'Unknown artist',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};

describe('trackInfoSchema', () => {
  it('accepts a valid track and an artwork url', () => {
    expect(trackInfoSchema.safeParse(track).success).toBe(true);
    expect(
      trackInfoSchema.safeParse({ ...track, artworkUrl: `media://art/${TOKEN}`, durationSec: 1.5 })
        .success,
    ).toBe(true);
  });

  it('rejects extra keys such as a path', () => {
    for (const key of ['path', 'filePath', 'file']) {
      expect(trackInfoSchema.safeParse({ ...track, [key]: 'C:\\x.mp3' }).success).toBe(false);
    }
  });

  it('rejects file urls, wrong hosts, traversal and non-token urls', () => {
    for (const mediaUrl of [
      'file:///C:/x.mp3',
      `media://art/${TOKEN}`,
      `media://track/${TOKEN}/x`,
      `media://track/${TOKEN}?a=1`,
      'media://track/..%2f..',
      'media://track/forged',
      `app://renderer/${TOKEN}`,
    ]) {
      expect(trackInfoSchema.safeParse({ ...track, mediaUrl }).success).toBe(false);
    }
    expect(
      trackInfoSchema.safeParse({ ...track, artworkUrl: `media://track/${TOKEN}` }).success,
    ).toBe(false);
  });

  it('rejects invalid durations and over-long strings', () => {
    for (const durationSec of [-1, Number.NaN, Number.POSITIVE_INFINITY, '1']) {
      expect(trackInfoSchema.safeParse({ ...track, durationSec }).success).toBe(false);
    }
    expect(trackInfoSchema.safeParse({ ...track, title: 'x'.repeat(257) }).success).toBe(false);
    expect(trackInfoSchema.safeParse({ ...track, title: '' }).success).toBe(false);
  });

  it('property: any media url not matching the token form is rejected', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 80 }), (suffix) => {
        const url = `media://track/${suffix}`;
        const expected = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          suffix,
        );
        expect(trackInfoSchema.safeParse({ ...track, mediaUrl: url }).success).toBe(expected);
      }),
    );
  });
});

describe('openFilesRequestSchema', () => {
  it('accepts exactly one strict object with a boolean', () => {
    expect(openFilesRequestSchema.safeParse([{ multiple: true }]).success).toBe(true);
    expect(openFilesRequestSchema.safeParse([{ multiple: false }]).success).toBe(true);
    for (const bad of [
      [],
      [{}],
      [{ multiple: 'yes' }],
      [{ multiple: true, path: 'C:\\x' }],
      [{ multiple: true }, 1],
      [null],
      {},
    ]) {
      expect(openFilesRequestSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('property: arbitrary values never throw', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => openFilesRequestSchema.safeParse(value)).not.toThrow();
      }),
    );
  });
});

describe('openFilesResponseSchema', () => {
  it('accepts tracks, errors and rejects over-limit lists', () => {
    expect(openFilesResponseSchema.safeParse({ ok: true, data: { tracks: [track] } }).success).toBe(
      true,
    );
    expect(openFilesResponseSchema.safeParse({ ok: true, data: { tracks: [] } }).success).toBe(
      true,
    );
    expect(
      openFilesResponseSchema.safeParse({
        ok: false,
        error: { code: 'INTERNAL', message: 'x' },
      }).success,
    ).toBe(true);
    const tooMany = Array.from({ length: MAX_TRACKS_PER_REQUEST + 1 }, () => track);
    expect(openFilesResponseSchema.safeParse({ ok: true, data: { tracks: tooMany } }).success).toBe(
      false,
    );
    expect(
      openFilesResponseSchema.safeParse({ ok: true, data: { tracks: [], x: 1 } }).success,
    ).toBe(false);
  });
});
