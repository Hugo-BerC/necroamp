import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMetadataReader } from './metadata';

// Exercises the real music-metadata 13.0.1 parser on generated, license-free fixtures.
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
// 1x1 PNG signature plus IHDR. Only the magic bytes matter to the artwork gate.
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89,
]);

/** Silent MPEG-1 Layer III, 128 kbit/s, 44.1 kHz frames (417 bytes each, about 1.0 s for 39). */
function makeMp3(frames = 39): Uint8Array {
  const out = new Uint8Array(frames * 417);
  for (let i = 0; i < frames; i += 1) out.set([0xff, 0xfb, 0x90, 0x00], i * 417);
  return out;
}
function makeGarbage(length = 2048): Uint8Array {
  return Uint8Array.from({ length }, (_v, i) => (i * 131 + 17) & 0xfe);
}

function frame(id: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(10 + body.length);
  out.set(new TextEncoder().encode(id));
  new DataView(out.buffer).setUint32(4, body.length);
  out.set(body, 10);
  return out;
}
function text(id: string, value: string): Uint8Array {
  return frame(id, Uint8Array.from([3, ...new TextEncoder().encode(value)]));
}
function id3v23(frames: Uint8Array[]): Uint8Array {
  const size = frames.reduce((n, f) => n + f.length, 0);
  const header = Uint8Array.from([
    0x49,
    0x44,
    0x33,
    3,
    0,
    0,
    (size >> 21) & 0x7f,
    (size >> 14) & 0x7f,
    (size >> 7) & 0x7f,
    size & 0x7f,
  ]);
  return Uint8Array.from([...header, ...frames.flatMap((f) => [...f])]);
}
function taggedMp3(): Uint8Array {
  const apic = frame(
    'APIC',
    Uint8Array.from([3, ...new TextEncoder().encode('image/png'), 0, 3, 0, ...PNG]),
  );
  const tag = id3v23([
    text('TIT2', 'Synthetic Title'),
    text('TPE1', 'Synthetic Artist'),
    text('TALB', 'Synthetic Album'),
    apic,
  ]);
  return Uint8Array.from([...tag, ...makeMp3()]);
}

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'necroamp-meta-'));
  await writeFile(path.join(dir, 'tagged.mp3'), taggedMp3());
  await writeFile(path.join(dir, 'plain.mp3'), makeMp3());
  await writeFile(path.join(dir, 'garbage.mp3'), makeGarbage());
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('music-metadata (real parser)', () => {
  const read = createMetadataReader({ parseFile, log });

  it('reads title, artist, album, duration and the embedded cover', async () => {
    const result = await read(path.join(dir, 'tagged.mp3'));
    expect(result).toMatchObject({
      title: 'Synthetic Title',
      artist: 'Synthetic Artist',
      album: 'Synthetic Album',
      parsed: true,
    });
    expect(result.durationSec).toBeGreaterThan(0.5);
    expect(result.durationSec).toBeLessThan(1.5);
    expect(Array.from(result.picture ?? [])).toEqual(Array.from(PNG));
  });

  it('gives fallbacks for an untagged file', async () => {
    const result = await read(path.join(dir, 'plain.mp3'));
    expect(result).toMatchObject({ title: '', artist: 'Unknown artist', album: '', picture: null });
    expect(result.durationSec).toBeGreaterThan(0.5);
  });

  it('does not throw on a corrupt or missing file', async () => {
    expect((await read(path.join(dir, 'garbage.mp3'))).picture).toBeNull();
    expect((await read(path.join(dir, 'missing.mp3'))).parsed).toBe(false);
  });
});
