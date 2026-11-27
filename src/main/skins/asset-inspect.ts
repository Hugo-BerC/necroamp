/**
 * Pure byte inspection for skin assets (magic bytes and raster dimensions). Never throws and
 * never reads past the buffer. SVG content is validated separately by `validateSvg`.
 */
export type SkinAssetType = 'svg' | 'png' | 'webp' | 'woff2';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = start; i < start + length && i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i] ?? 0);
  }
  return out;
}

const u16le = (b: Uint8Array, o: number): number => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8);
const u24le = (b: Uint8Array, o: number): number => u16le(b, o) | ((b[o + 2] ?? 0) << 16);
const u32be = (b: Uint8Array, o: number): number =>
  (((b[o] ?? 0) << 24) | ((b[o + 1] ?? 0) << 16) | ((b[o + 2] ?? 0) << 8) | (b[o + 3] ?? 0)) >>> 0;

/** True when the leading bytes match the declared type. SVG always passes here. */
export function matchesMagic(type: SkinAssetType, bytes: Uint8Array): boolean {
  switch (type) {
    case 'png':
      return bytes.length >= 24 && PNG_MAGIC.every((value, index) => bytes[index] === value);
    case 'webp':
      return bytes.length >= 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';
    case 'woff2':
      return bytes.length >= 48 && ascii(bytes, 0, 4) === 'wOF2';
    case 'svg':
      return true;
    default:
      return false;
  }
}

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** Width and height of a PNG or WebP, or null when the header cannot be parsed. */
export function rasterDimensions(type: SkinAssetType, bytes: Uint8Array): Dimensions | null {
  if (type === 'png') {
    if (!matchesMagic('png', bytes) || ascii(bytes, 12, 4) !== 'IHDR') return null;
    const width = u32be(bytes, 16);
    const height = u32be(bytes, 20);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (type === 'webp') {
    if (!matchesMagic('webp', bytes)) return null;
    const chunk = ascii(bytes, 12, 4);
    if (chunk === 'VP8 ') {
      if (bytes.length < 30 || bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
        return null;
      }
      const width = u16le(bytes, 26) & 0x3fff;
      const height = u16le(bytes, 28) & 0x3fff;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    if (chunk === 'VP8L') {
      if (bytes[20] !== 0x2f) return null;
      const bits = (u16le(bytes, 21) | (u16le(bytes, 23) << 16)) >>> 0;
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { width: u24le(bytes, 24) + 1, height: u24le(bytes, 27) + 1 };
    }
    return null;
  }
  return null;
}
