import { describe, expect, it } from 'vitest';
import {
  MAX_TRACKS_PER_REQUEST,
  playlistLoadRequestSchema,
  playlistLoadResponseSchema,
  playlistSaveRequestSchema,
  playlistSaveResponseSchema,
  resolveTrackRequestSchema,
  resolveTrackResponseSchema,
} from '.';

const TOKEN = '123e4567-e89b-42d3-a456-426614174000';
const track = {
  trackId: TOKEN,
  mediaUrl: `media://track/${TOKEN}`,
  fileName: 'a.mp3',
  title: 'a',
  artist: 'x',
  album: '',
  durationSec: 1,
  artworkUrl: null,
  available: false,
};

describe('playlist contracts', () => {
  it('load takes no arguments', () => {
    expect(playlistLoadRequestSchema.safeParse([]).success).toBe(true);
    expect(playlistLoadRequestSchema.safeParse([{}]).success).toBe(false);
  });

  it('load response is versioned and strict', () => {
    const ok = { ok: true, data: { schemaVersion: 1, items: [track] } };
    expect(playlistLoadResponseSchema.safeParse(ok).success).toBe(true);
    expect(
      playlistLoadResponseSchema.safeParse({ ok: true, data: { schemaVersion: 2, items: [] } })
        .success,
    ).toBe(false);
    expect(
      playlistLoadResponseSchema.safeParse({
        ok: true,
        data: { schemaVersion: 1, items: [], extra: 1 },
      }).success,
    ).toBe(false);
  });

  it('save accepts uuid entries only, up to the cap', () => {
    const entry = { trackId: TOKEN };
    expect(playlistSaveRequestSchema.safeParse([{ items: [entry] }]).success).toBe(true);
    expect(
      playlistSaveRequestSchema.safeParse([
        { items: new Array(MAX_TRACKS_PER_REQUEST).fill(entry) },
      ]).success,
    ).toBe(true);
    expect(
      playlistSaveRequestSchema.safeParse([
        { items: new Array(MAX_TRACKS_PER_REQUEST + 1).fill(entry) },
      ]).success,
    ).toBe(false);
    expect(playlistSaveRequestSchema.safeParse([{ items: [{ trackId: 'x' }] }]).success).toBe(
      false,
    );
    expect(
      playlistSaveRequestSchema.safeParse([{ items: [{ ...entry, path: 'p' }] }]).success,
    ).toBe(false);
    expect(playlistSaveResponseSchema.safeParse({ ok: true, data: { saved: true } }).success).toBe(
      true,
    );
    expect(playlistSaveResponseSchema.safeParse({ ok: true, data: { saved: false } }).success).toBe(
      false,
    );
  });
});

describe('resolve-track contracts', () => {
  it('requests carry one uuid and nothing else', () => {
    expect(resolveTrackRequestSchema.safeParse([{ trackId: TOKEN }]).success).toBe(true);
    expect(resolveTrackRequestSchema.safeParse([{ trackId: '../x' }]).success).toBe(false);
    expect(resolveTrackRequestSchema.safeParse([{ trackId: TOKEN, path: 'x' }]).success).toBe(
      false,
    );
  });

  it('responses are a track or the unavailable marker', () => {
    expect(resolveTrackResponseSchema.safeParse({ ok: true, data: { track } }).success).toBe(true);
    expect(
      resolveTrackResponseSchema.safeParse({ ok: true, data: { unavailable: true } }).success,
    ).toBe(true);
    expect(
      resolveTrackResponseSchema.safeParse({ ok: true, data: { unavailable: false } }).success,
    ).toBe(false);
    expect(resolveTrackResponseSchema.safeParse({ ok: true, data: {} }).success).toBe(false);
  });
});
