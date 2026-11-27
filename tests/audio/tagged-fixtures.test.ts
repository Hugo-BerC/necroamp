import { crc32 } from 'node:zlib';
import { parseBuffer } from 'music-metadata';
import { describe, expect, it } from 'vitest';
import { makeMp3 } from '../fixtures/audio/generate-audio';
import {
  FIXTURE_TAGS,
  TAGGED_FIXTURE_BUILDERS,
  WAV_TAGS,
  defaultTags,
  makeArtworkPng,
  makeId3v24,
  makeOggFlac,
  makeToneMp3,
} from '../fixtures/audio/generate-tagged';

// Audio Engine Block B fixtures: structure, determinism and what the real parser sees.
// Real decoding is covered by tests/e2e/audio-decode.spec.ts (Chromium is the only decoder).
const MAX_FIXTURE_BYTES = 128 * 1024;

describe('Block B audio fixtures', () => {
  it('are deterministic and small', () => {
    for (const [name, build] of Object.entries(TAGGED_FIXTURE_BUILDERS)) {
      expect(Buffer.from(build()).equals(Buffer.from(build())), name).toBe(true);
      expect(build().byteLength, name).toBeLessThan(MAX_FIXTURE_BYTES);
    }
  });

  it('the artwork is a valid PNG with correct chunk CRCs and an IEND', () => {
    const png = makeArtworkPng();
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    let offset = 8;
    const types: string[] = [];
    while (offset < png.length) {
      const length = view.getUint32(offset);
      const type = String.fromCharCode(...png.slice(offset + 4, offset + 8));
      types.push(type);
      const body = png.slice(offset + 4, offset + 8 + length);
      expect(view.getUint32(offset + 8 + length), type).toBe(crc32(body));
      offset += 12 + length;
    }
    expect(types).toEqual(['IHDR', 'IDAT', 'IEND']);
    expect(offset).toBe(png.length);
    expect(png.length).toBeLessThan(400);
  });

  it('the tone MP3 is whole frames with a non-zero main data section (not silence)', () => {
    const mp3 = makeToneMp3(39);
    expect(mp3.byteLength).toBe(417 * 39);
    const silent = makeMp3(39);
    expect(Buffer.from(mp3).equals(Buffer.from(silent))).toBe(false);
    for (let frame = 0; frame < 39; frame += 1) {
      const start = frame * 417;
      expect([...mp3.slice(start, start + 4)]).toEqual([0xff, 0xfb, 0x90, 0xc4]);
      expect(mp3.slice(start + 21, start + 417).some((byte) => byte !== 0)).toBe(true);
    }
  });

  it('the Ogg stream has valid pages: sync, sequence, CRC, BOS and EOS flags, rising granule', () => {
    const ogg = makeOggFlac();
    const view = new DataView(ogg.buffer, ogg.byteOffset, ogg.byteLength);
    let offset = 0;
    let sequence = 0;
    let lastGranule = 0;
    const flags: number[] = [];
    while (offset < ogg.length) {
      expect(String.fromCharCode(...ogg.slice(offset, offset + 4))).toBe('OggS');
      const segments = ogg[offset + 26] as number;
      let size = 0;
      for (let i = 0; i < segments; i += 1) size += ogg[offset + 27 + i] as number;
      const total = 27 + segments + size;
      const page = Uint8Array.from(ogg.slice(offset, offset + total));
      const stored = new DataView(page.buffer).getUint32(22, true);
      new DataView(page.buffer).setUint32(22, 0, true);
      // Independent oracle: bitwise Ogg CRC (polynomial 0x04C11DB7, MSB first).
      let crc = 0;
      for (const byte of page) {
        crc ^= byte << 24;
        for (let bit = 0; bit < 8; bit += 1)
          crc = (crc & 0x80000000 ? (crc << 1) ^ 0x04c11db7 : crc << 1) >>> 0;
      }
      expect(stored, `page ${String(sequence)} CRC`).toBe(crc >>> 0);
      expect(view.getUint32(offset + 18, true)).toBe(sequence);
      const granule = view.getUint32(offset + 6, true);
      expect(granule).toBeGreaterThanOrEqual(lastGranule);
      lastGranule = granule;
      flags.push(ogg[offset + 5] as number);
      sequence += 1;
      offset += total;
    }
    expect(offset).toBe(ogg.length);
    expect(flags[0]).toBe(2);
    expect(flags.at(-1)).toBe(4);
    expect(flags.slice(1, -1).every((flag) => flag === 0)).toBe(true);
    expect(lastGranule).toBe(6 * 4096);
  });

  it('the first Ogg packet carries the FLAC mapping signature', () => {
    const ogg = makeOggFlac();
    const first = ogg.slice(27 + 1, 27 + 1 + 13);
    expect(String.fromCharCode(...first.slice(1, 5))).toBe('FLAC');
    expect([...first.slice(5, 7)]).toEqual([1, 0]);
    expect(String.fromCharCode(...first.slice(9, 13))).toBe('fLaC');
  });

  it('ID3v2.4 sizes are syncsafe and match the tag body', () => {
    const tag = makeId3v24(defaultTags());
    expect(String.fromCharCode(...tag.slice(0, 3))).toBe('ID3');
    const size =
      ((tag[6] as number) << 21) |
      ((tag[7] as number) << 14) |
      ((tag[8] as number) << 7) |
      (tag[9] as number);
    expect(10 + size).toBe(tag.length);
    expect([...tag.slice(6, 10)].every((byte) => byte < 0x80)).toBe(true);
  });
});

describe('Block B fixtures as seen by music-metadata 13.0.1', () => {
  const MIME: Record<string, string> = {
    'tagged.mp3': 'audio/mpeg',
    'tagged.flac': 'audio/flac',
    'tagged.ogg': 'audio/ogg',
    'tagged.wav': 'audio/vnd.wave',
  };

  it.each(Object.keys(MIME))('%s: tags, duration and artwork', async (name) => {
    const bytes = TAGGED_FIXTURE_BUILDERS[name as keyof typeof TAGGED_FIXTURE_BUILDERS]();
    const { common, format } = await parseBuffer(
      bytes,
      { mimeType: MIME[name] as string },
      { duration: true },
    );
    const expected = name.endsWith('.wav') ? WAV_TAGS : FIXTURE_TAGS;
    expect(common.title).toBe(expected.title);
    expect(common.artist).toBe(expected.artist);
    expect(common.album).toBe(expected.album);
    expect(format.duration).toBeGreaterThan(0.5);
    if (name.endsWith('.wav')) {
      expect(common.picture ?? []).toHaveLength(0);
    } else {
      expect(common.picture).toHaveLength(1);
      expect(common.picture?.[0]?.format).toBe('image/png');
      expect(
        Buffer.from(common.picture?.[0]?.data ?? []).equals(Buffer.from(makeArtworkPng())),
      ).toBe(true);
    }
  });

  it('the untagged Ogg and tone MP3 parse with a duration and no tags', async () => {
    const ogg = await parseBuffer(makeOggFlac(), { mimeType: 'audio/ogg' }, { duration: true });
    expect(ogg.common.title).toBeUndefined();
    expect(ogg.format.duration).toBeCloseTo(0.557, 2);
    const mp3 = await parseBuffer(makeToneMp3(), { mimeType: 'audio/mpeg' }, { duration: true });
    expect(mp3.common.title).toBeUndefined();
    expect(mp3.format.duration).toBeCloseTo(1.0188, 1);
  });
});
