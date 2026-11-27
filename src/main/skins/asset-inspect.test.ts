import { describe, expect, it } from 'vitest';
import { matchesMagic, rasterDimensions } from './asset-inspect';

function pngBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function riff(chunk: string, body: number[]): Uint8Array {
  const bytes = new Uint8Array(40);
  bytes.set([...'RIFF'].map((c) => c.charCodeAt(0)));
  bytes.set(
    [...'WEBP'].map((c) => c.charCodeAt(0)),
    8,
  );
  bytes.set(
    [...chunk].map((c) => c.charCodeAt(0)),
    12,
  );
  bytes.set(body, 20);
  return bytes;
}

describe('matchesMagic', () => {
  it('accepts a PNG signature and rejects other bytes', () => {
    expect(matchesMagic('png', pngBytes(1, 1))).toBe(true);
    expect(matchesMagic('png', new Uint8Array(40))).toBe(false);
    expect(matchesMagic('png', pngBytes(1, 1).subarray(0, 10))).toBe(false);
  });

  it('accepts WebP and WOFF2 headers only for their own type', () => {
    expect(matchesMagic('webp', riff('VP8X', []))).toBe(true);
    expect(matchesMagic('webp', pngBytes(1, 1))).toBe(false);
    const woff = new Uint8Array(64);
    woff.set([0x77, 0x4f, 0x46, 0x32]);
    expect(matchesMagic('woff2', woff)).toBe(true);
    expect(matchesMagic('woff2', new Uint8Array(64))).toBe(false);
    expect(matchesMagic('svg', new Uint8Array(0))).toBe(true);
  });

  it('is false for an unknown declared type', () => {
    expect(matchesMagic('gif' as never, pngBytes(1, 1))).toBe(false);
  });
});

describe('rasterDimensions', () => {
  it('reads PNG width and height', () => {
    expect(rasterDimensions('png', pngBytes(640, 480))).toEqual({ width: 640, height: 480 });
    expect(rasterDimensions('png', pngBytes(0, 480))).toBeNull();
  });

  it('rejects a PNG without an IHDR chunk', () => {
    const bytes = pngBytes(10, 10);
    bytes[12] = 0;
    expect(rasterDimensions('png', bytes)).toBeNull();
  });

  it('reads lossy, lossless and extended WebP headers', () => {
    const lossy = riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, 100, 0, 50, 0]);
    expect(rasterDimensions('webp', lossy)).toEqual({ width: 100, height: 50 });
    // width-1 = 99 (14 bits), height-1 = 49 (14 bits)
    const bits = (99 | (49 << 14)) >>> 0;
    const lossless = riff('VP8L', [
      0x2f,
      bits & 0xff,
      (bits >>> 8) & 0xff,
      (bits >>> 16) & 0xff,
      (bits >>> 24) & 0xff,
    ]);
    expect(rasterDimensions('webp', lossless)).toEqual({ width: 100, height: 50 });
    const extended = riff('VP8X', [0, 0, 0, 0, 199, 0, 0, 99, 0, 0]);
    expect(rasterDimensions('webp', extended)).toEqual({ width: 200, height: 100 });
  });

  it('returns null for broken WebP headers and non-raster types', () => {
    expect(rasterDimensions('webp', riff('VP8 ', [0, 0, 0, 1, 2, 3, 1, 0, 1, 0]))).toBeNull();
    expect(rasterDimensions('webp', riff('VP8L', [0x00]))).toBeNull();
    expect(rasterDimensions('webp', riff('ABCD', []))).toBeNull();
    expect(rasterDimensions('webp', new Uint8Array(40))).toBeNull();
    expect(rasterDimensions('svg', new Uint8Array(40))).toBeNull();
    expect(rasterDimensions('woff2', new Uint8Array(40))).toBeNull();
  });
});
