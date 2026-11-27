import { describe, expect, it, vi } from 'vitest';
import { MAX_ARTWORK_BYTES } from './artwork';
import { createMetadataReader, UNKNOWN_ARTIST, type ParseAudioFile } from './metadata';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function reader(parse: ParseAudioFile) {
  return createMetadataReader({ parseFile: parse, log });
}

describe('createMetadataReader', () => {
  it('requests duration and covers', async () => {
    const parse = vi.fn<ParseAudioFile>(() => Promise.resolve({ common: {}, format: {} }));
    await reader(parse)('a.mp3');
    expect(parse).toHaveBeenCalledWith('a.mp3', { duration: true, skipCovers: false });
  });

  it('normalizes tags and returns the first valid picture', async () => {
    const result = await reader(() =>
      Promise.resolve({
        common: {
          title: ' Song\u0000 ',
          artist: 'A\nrtist',
          album: 'x'.repeat(400),
          picture: [{ data: PNG }],
        },
        format: { duration: 12.5 },
      }),
    )('a.mp3');
    expect(result).toMatchObject({
      title: 'Song',
      artist: 'Artist',
      durationSec: 12.5,
      parsed: true,
    });
    expect(result.album).toHaveLength(256);
    expect(result.picture).toBe(PNG);
  });

  it('falls back for missing tags', async () => {
    const result = await reader(() => Promise.resolve({ common: {}, format: {} }))('a.mp3');
    expect(result).toEqual({
      title: '',
      artist: UNKNOWN_ARTIST,
      album: '',
      durationSec: null,
      picture: null,
      parsed: true,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('drops invalid duration %s', async (d) => {
    const result = await reader(() => Promise.resolve({ common: {}, format: { duration: d } }))(
      'x',
    );
    expect(result.durationSec).toBeNull();
  });

  it('drops pictures that are oversized or not images', async () => {
    const big = new Uint8Array(MAX_ARTWORK_BYTES + 1);
    big.set(PNG);
    for (const data of [big, Uint8Array.from([1, 2, 3, 4]), new Uint8Array(0)]) {
      const result = await reader(() =>
        Promise.resolve({ common: { picture: [{ data }] }, format: {} }),
      )('x');
      expect(result.picture).toBeNull();
    }
  });

  it('never throws and never logs the path or the parser message', async () => {
    log.warn.mockClear();
    const result = await reader(() => Promise.reject(new Error('C:\\Users\\me\\secret.mp3')))(
      'C:\\Users\\me\\secret.mp3',
    );
    expect(result).toMatchObject({ parsed: false, picture: null, durationSec: null });
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('secret');
  });

  it('survives a malformed result object', async () => {
    const result = await reader(() => Promise.resolve({} as never))('x');
    expect(result.parsed).toBe(false);
  });
});
