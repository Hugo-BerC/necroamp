import { createHash, randomUUID } from 'node:crypto';

/** ADR 0006 item 7: PNG, JPEG or WebP by magic bytes, at most 2 MiB each. */
export const MAX_ARTWORK_BYTES = 2 * 1024 * 1024;
export const MAX_ARTWORK_ENTRIES = 5000;
/** Memory budget for all cached artwork. Identical images are stored once. */
export const MAX_ARTWORK_TOTAL_BYTES = 64 * 1024 * 1024;

export type ArtworkMimeType = 'image/png' | 'image/jpeg' | 'image/webp';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return (
    bytes.byteLength >= offset + signature.length &&
    signature.every((byte, index) => bytes[offset + index] === byte)
  );
}

/** Content type from magic bytes only. The tag's declared MIME type is never trusted. */
export function sniffImageType(bytes: Uint8Array): ArtworkMimeType | null {
  if (startsWith(bytes, PNG)) return 'image/png';
  if (startsWith(bytes, JPEG)) return 'image/jpeg';
  if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, 8)) return 'image/webp';
  return null;
}

export interface StoredArtwork {
  readonly data: Uint8Array<ArrayBuffer>;
  readonly mimeType: ArtworkMimeType;
}

/** In-memory artwork cache keyed by an unguessable token. It holds no file paths. */
export interface ArtworkStore {
  /** Returns a token, or null when the bytes are not an allowed image or a cap is reached. */
  put(bytes: Uint8Array): string | null;
  get(token: string): StoredArtwork | undefined;
  clear(): void;
  readonly size: number;
}

export function createArtworkStore(
  generateToken: () => string = randomUUID,
  limits: { readonly entries: number; readonly totalBytes: number } = {
    entries: MAX_ARTWORK_ENTRIES,
    totalBytes: MAX_ARTWORK_TOTAL_BYTES,
  },
): ArtworkStore {
  const byToken = new Map<string, StoredArtwork>();
  const tokenByDigest = new Map<string, string>();
  let totalBytes = 0;
  return {
    put(bytes) {
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_ARTWORK_BYTES) return null;
      const mimeType = sniffImageType(bytes);
      if (mimeType === null) return null;
      const digest = createHash('sha256').update(bytes).digest('hex');
      const existing = tokenByDigest.get(digest);
      if (existing !== undefined) return existing;
      if (byToken.size >= limits.entries || totalBytes + bytes.byteLength > limits.totalBytes) {
        return null;
      }
      const token = generateToken();
      if (byToken.has(token)) return null;
      byToken.set(token, { data: Uint8Array.from(bytes), mimeType });
      tokenByDigest.set(digest, token);
      totalBytes += bytes.byteLength;
      return token;
    },
    get(token) {
      return byToken.get(token);
    },
    clear() {
      byToken.clear();
      tokenByDigest.clear();
      totalBytes = 0;
    },
    get size() {
      return byToken.size;
    },
  };
}
