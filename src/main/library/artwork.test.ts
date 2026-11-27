import { describe, expect, it } from 'vitest';
import { MAX_ARTWORK_BYTES, createArtworkStore, sniffImageType } from './artwork';

const png = (extra = 4) =>
  Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(extra).fill(7)]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 9]);
const ids = () => {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
};

describe('sniffImageType', () => {
  it('detects PNG, JPEG and WebP by magic bytes', () => {
    expect(sniffImageType(png())).toBe('image/png');
    expect(sniffImageType(jpeg)).toBe('image/jpeg');
    expect(sniffImageType(webp)).toBe('image/webp');
  });

  it.each([
    ['gif', Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
    ['svg', new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ['html', new TextEncoder().encode('<html><script>1</script>')],
    ['RIFF wave', Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])],
    ['short png', Uint8Array.from([0x89, 0x50, 0x4e])],
    ['empty', new Uint8Array(0)],
  ])('rejects %s', (_name, bytes) => {
    expect(sniffImageType(bytes)).toBeNull();
  });
});

describe('createArtworkStore', () => {
  it('stores an image under a token and returns a copy with its sniffed type', () => {
    const store = createArtworkStore(ids());
    const source = png();
    const token = store.put(source);
    expect(token).toBe('00000000-0000-4000-8000-000000000001');
    source[0] = 0;
    const stored = store.get(token as string);
    expect(stored?.mimeType).toBe('image/png');
    expect(stored?.data[0]).toBe(0x89);
    expect(store.size).toBe(1);
  });

  it('rejects wrong magic, empty and oversized input', () => {
    const store = createArtworkStore(ids());
    expect(store.put(Uint8Array.from([1, 2, 3]))).toBeNull();
    expect(store.put(new Uint8Array(0))).toBeNull();
    const big = new Uint8Array(MAX_ARTWORK_BYTES + 1);
    big.set(png(0));
    expect(store.put(big)).toBeNull();
    const exact = new Uint8Array(MAX_ARTWORK_BYTES);
    exact.set(png(0));
    expect(store.put(exact)).not.toBeNull();
  });

  it('stores identical images once', () => {
    const store = createArtworkStore(ids());
    expect(store.put(png())).toBe(store.put(png()));
    expect(store.size).toBe(1);
  });

  it('enforces the entry and byte caps', () => {
    const entries = createArtworkStore(ids(), { entries: 2, totalBytes: 1000 });
    expect(entries.put(png(1))).not.toBeNull();
    expect(entries.put(png(2))).not.toBeNull();
    expect(entries.put(png(3))).toBeNull();
    const bytes = createArtworkStore(ids(), { entries: 10, totalBytes: 30 });
    expect(bytes.put(png(10))).not.toBeNull();
    expect(bytes.put(png(11))).toBeNull();
  });

  it('refuses a colliding token and clears everything', () => {
    const store = createArtworkStore(() => 'fixed', { entries: 5, totalBytes: 1000 });
    expect(store.put(png(1))).toBe('fixed');
    expect(store.put(png(2))).toBeNull();
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get('fixed')).toBeUndefined();
    expect(store.put(png(2))).toBe('fixed');
  });

  it('uses random uuid tokens by default', () => {
    const token = createArtworkStore().put(png());
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
