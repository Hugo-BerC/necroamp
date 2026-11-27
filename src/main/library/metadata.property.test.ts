import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { trackInfoSchema } from '@shared/ipc';
import { MAX_ARTWORK_BYTES, createArtworkStore, sniffImageType } from './artwork';
import { UNKNOWN_ARTIST, createMetadataReader, type ParseAudioFile } from './metadata';
import { createMediaRegistry } from './media-registry';
import { cleanText } from './text';
import { createTrackFactory } from './track-info';

// Audio Engine Block B: property tests for metadata normalization (tech.md "Testing").
const RUNS = { numRuns: 200 };
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
// eslint-disable-next-line no-control-regex -- the point of the assertions
const CONTROL = /[\u0000-\u001f\u007f]/;
const hostileText = fc.oneof(
  fc.string({ unit: 'binary', maxLength: 600 }),
  fc.string({ unit: 'grapheme', maxLength: 300 }),
  // eslint-disable-next-line no-control-regex -- hostile input on purpose
  fc.stringMatching(/^[\u0000-\u001f\u007f \t\r\n]{0,40}[a-z]{0,10}[\u0000-\u001f\u007f]{0,10}$/),
  fc.constantFrom(
    '__proto__',
    'constructor',
    '\u202e\u0000',
    '😀'.repeat(400),
    ' '.repeat(300),
    '',
  ),
);
const hasLoneSurrogate = (text: string): boolean =>
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);

describe('cleanText', () => {
  it('never throws, never keeps a control character, never exceeds the cap in code points and is trimmed', () => {
    fc.assert(
      fc.property(hostileText, fc.integer({ min: 0, max: 300 }), (input, max) => {
        const out = cleanText(input, max);
        expect(CONTROL.test(out)).toBe(false);
        expect(Array.from(out).length).toBeLessThanOrEqual(max);
        expect(out).toBe(out.trim());
      }),
      RUNS,
    );
  });

  // Regression for defect D-B1 (docs/testing/defects/0005-clean-text-keeps-c1-and-format-characters.md): cleanText strips C1 controls.
  it('D-B1: strips C1 control characters as well', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0x80, max: 0x9f }),
        fc.string({ maxLength: 5 }),
        (code, rest) => {
          const out = cleanText(`a${String.fromCodePoint(code)}${rest}`, 50);
          expect(/[\u0080-\u009f]/.test(out)).toBe(false);
        },
      ),
      RUNS,
    );
  });
  it('is idempotent', () => {
    fc.assert(
      fc.property(hostileText, fc.integer({ min: 0, max: 300 }), (input, max) => {
        const once = cleanText(input, max);
        expect(cleanText(once, max)).toBe(once);
      }),
      RUNS,
    );
  });

  it('never splits a surrogate pair: well-formed input stays well-formed', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'grapheme', maxLength: 200 }),
        fc.integer({ min: 0, max: 100 }),
        (input, max) => {
          fc.pre(!hasLoneSurrogate(input));
          expect(hasLoneSurrogate(cleanText(input, max))).toBe(false);
        },
      ),
      RUNS,
    );
  });

  it('leaves clean, short, trimmed text unchanged (no silent rewriting)', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', maxLength: 50 }), (input) => {
        fc.pre(!CONTROL.test(input) && input === input.trim());
        expect(cleanText(input, 256)).toBe(input);
      }),
      RUNS,
    );
  });
});

describe('sniffImageType and the artwork store', () => {
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const JPEG = [0xff, 0xd8, 0xff];
  const WEBP = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50];

  it('never throws and answers only from magic bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 64 }), (bytes) => {
        const type = sniffImageType(bytes);
        const startsWith = (sig: readonly number[]): boolean => sig.every((b, i) => bytes[i] === b);
        const expected = startsWith(PNG)
          ? 'image/png'
          : startsWith(JPEG)
            ? 'image/jpeg'
            : startsWith(WEBP)
              ? 'image/webp'
              : null;
        expect(type).toBe(expected);
      }),
      RUNS,
    );
  });

  it('accepts each allowed signature followed by any payload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(PNG, JPEG, WEBP),
        fc.uint8Array({ maxLength: 64 }),
        (signature, tail) => {
          expect(sniffImageType(Uint8Array.from([...signature, ...tail]))).not.toBeNull();
        },
      ),
      RUNS,
    );
  });

  it('stores only allowed images within the caps, deduplicates by content and returns a token that round-trips', () => {
    fc.assert(
      fc.property(fc.array(fc.uint8Array({ maxLength: 40 }), { maxLength: 12 }), (blobs) => {
        let n = 0;
        const store = createArtworkStore(() => `token-${String(++n)}`);
        for (const blob of blobs) {
          const token = store.put(blob);
          const allowed = blob.byteLength > 0 && sniffImageType(blob) !== null;
          expect(token !== null).toBe(allowed);
          if (token !== null) {
            const stored = store.get(token);
            expect(Array.from(stored?.data ?? [])).toEqual(Array.from(blob));
            expect(store.put(blob)).toBe(token);
          }
        }
        const distinct = new Set(
          blobs
            .filter((b) => b.byteLength > 0 && sniffImageType(b) !== null)
            .map((b) => Array.from(b).join(',')),
        );
        expect(store.size).toBe(distinct.size);
      }),
      RUNS,
    );
  });

  it('rejects anything above the size cap whatever its signature', () => {
    const big = new Uint8Array(MAX_ARTWORK_BYTES + 1);
    big.set(PNG);
    expect(createArtworkStore().put(big)).toBeNull();
  });

  it('honours the entry and byte budgets', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 20, max: 120 }),
        (entries, totalBytes) => {
          let n = 0;
          const store = createArtworkStore(() => `t${String(++n)}`, { entries, totalBytes });
          let bytes = 0;
          for (let i = 0; i < 30; i += 1) {
            const blob = Uint8Array.from([...JPEG, i, 7, 7, 7, 7, 7, 7, 7, 7, 7]);
            if (store.put(blob) !== null) bytes += blob.byteLength;
          }
          expect(store.size).toBeLessThanOrEqual(entries);
          expect(bytes).toBeLessThanOrEqual(totalBytes);
        },
      ),
      RUNS,
    );
  });
});

describe('createMetadataReader', () => {
  const pictureArb = fc.oneof(
    fc.uint8Array({ maxLength: 40 }),
    fc.constant(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])),
    fc.constant(Uint8Array.from([0xff, 0xd8, 0xff, 1, 2])),
  );
  const looseValue = fc.oneof(
    hostileText,
    fc.integer(),
    fc.double(),
    fc.constant(null),
    fc.constant(undefined),
    fc.array(fc.string(), { maxLength: 2 }),
  );
  const parsedArb = fc.record(
    {
      common: fc.oneof(
        fc.record(
          {
            title: looseValue,
            artist: looseValue,
            album: looseValue,
            picture: fc.oneof(
              fc.array(fc.record({ data: pictureArb }), { maxLength: 3 }),
              fc.constant('not an array'),
              fc.constant([null]),
              fc.constant([{ data: 'string' }]),
            ),
          },
          { requiredKeys: [] },
        ),
        fc.constant(null),
      ),
      format: fc.oneof(
        fc.record(
          {
            duration: fc.oneof(
              fc.double({ noNaN: false }),
              fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, -1, 0, -0),
              fc.string(),
              fc.constant(undefined),
            ),
          },
          { requiredKeys: [] },
        ),
        fc.constant(undefined),
      ),
    },
    { requiredKeys: [] },
  );

  it('never throws, whatever the parser returns, and always satisfies the TrackMetadata invariants', async () => {
    await fc.assert(
      fc.asyncProperty(parsedArb, async (parsed) => {
        const reader = createMetadataReader({
          parseFile: (() => Promise.resolve(parsed)) as unknown as ParseAudioFile,
          log,
        });
        const result = await reader('/music/x.mp3');
        expect(Array.from(result.title).length).toBeLessThanOrEqual(256);
        expect(CONTROL.test(result.title + result.artist + result.album)).toBe(false);
        expect(result.artist.length).toBeGreaterThan(0);
        expect(Array.from(result.artist).length).toBeLessThanOrEqual(256);
        expect(Array.from(result.album).length).toBeLessThanOrEqual(256);
        expect(
          result.durationSec === null ||
            (Number.isFinite(result.durationSec) && result.durationSec >= 0),
        ).toBe(true);
        if (result.picture !== null) {
          expect(sniffImageType(result.picture)).not.toBeNull();
          expect(result.picture.byteLength).toBeLessThanOrEqual(MAX_ARTWORK_BYTES);
        }
      }),
      RUNS,
    );
  });

  it('never throws when the parser rejects, and reports parsed:false with the Unknown artist fallback', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (reason) => {
        const reader = createMetadataReader({
          parseFile: () => Promise.reject(reason as Error),
          log,
        });
        const result = await reader('/music/x.mp3');
        expect(result).toMatchObject({
          parsed: false,
          artist: UNKNOWN_ARTIST,
          title: '',
          durationSec: null,
          picture: null,
        });
      }),
      RUNS,
    );
  });

  it('never puts the path or the parser message into a log call', async () => {
    const calls: unknown[][] = [];
    const spy = { info: vi.fn(), warn: vi.fn((...a: unknown[]) => calls.push(a)), error: vi.fn() };
    const reader = createMetadataReader({
      parseFile: () => Promise.reject(new Error('boom /home/secret/x.mp3')),
      log: spy,
    });
    await reader('/home/secret/x.mp3');
    expect(JSON.stringify(calls)).not.toMatch(/secret|boom/);
  });
});

describe('TrackInfo built from arbitrary file names and tags', () => {
  const nameArb = fc.string({ unit: 'binary', minLength: 0, maxLength: 80 });

  it('is either rejected or schema-valid, never carries a path, and never exposes the directory', async () => {
    await fc.assert(
      fc.asyncProperty(nameArb, hostileText, hostileText, async (base, title, artist) => {
        const posix = (await import('node:path')).posix;
        const factory = createTrackFactory({
          fs: { stat: () => Promise.resolve({ isFile: () => true }) },
          path: posix,
          registry: createMediaRegistry(),
          metadata: () =>
            Promise.resolve({
              title: cleanText(title, 256),
              artist: cleanText(artist, 256) || UNKNOWN_ARTIST,
              album: '',
              durationSec: null,
              picture: null,
              parsed: true,
            }),
          artwork: createArtworkStore(),
        });
        const result = await factory.fromPath(`/very/private/dir/${base.replaceAll('/', '_')}.mp3`);
        if (result === null || result === 'full') return;
        expect(trackInfoSchema.safeParse(result).success).toBe(true);
        expect(JSON.stringify(result)).not.toContain('/very/private');
      }),
      RUNS,
    );
  });

  it('rejects every path whose extension is not on the audio allow list', async () => {
    const posix = (await import('node:path')).posix;
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '.txt',
          '.exe',
          '.html',
          '.js',
          '.svg',
          '.m3u',
          '.mp3.exe',
          '',
          '.',
          '.MP3x',
          '.png',
        ),
        fc.stringMatching(/^[a-z0-9]{1,12}$/),
        async (extension, base) => {
          const registry = createMediaRegistry();
          const factory = createTrackFactory({
            fs: { stat: () => Promise.resolve({ isFile: () => true }) },
            path: posix,
            registry,
          });
          expect(await factory.fromPath(`/m/${base}${extension}`)).toBeNull();
          expect(registry.size).toBe(0);
        },
      ),
      RUNS,
    );
  });
});
