import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { createPlaylistPersistence, type PlaylistFs } from './playlist-persistence';

// Audio Engine Block B: property tests for playlist persistence (round trip and corrupt input),
// against an in-memory filesystem so no disk, clock or randomness is involved.
const RUNS = { numRuns: 200 };
const FILE = '/user-data/playlist.json';

function memoryFs(initial?: string): { fs: PlaylistFs; files: Map<string, string> } {
  const files = new Map<string, string>();
  if (initial !== undefined) files.set(FILE, initial);
  const enoent = (): Error => Object.assign(new Error('missing'), { code: 'ENOENT' });
  const fs: PlaylistFs = {
    readFile: (p) =>
      files.has(p) ? Promise.resolve(files.get(p) as string) : Promise.reject(enoent()),
    writeFile: (p, data) => {
      files.set(p, data);
      return Promise.resolve();
    },
    rename: (from, to) => {
      if (!files.has(from)) return Promise.reject(enoent());
      files.set(to, files.get(from) as string);
      files.delete(from);
      return Promise.resolve();
    },
    rm: (p) => {
      files.delete(p);
      return Promise.resolve();
    },
  };
  return { fs, files };
}
const logger = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

const pathArb = fc.oneof(
  fc.string({ unit: 'binary', minLength: 1, maxLength: 200 }),
  fc.string({ unit: 'grapheme', minLength: 1, maxLength: 80 }).map((s) => `/music/${s}.mp3`),
  fc.constantFrom('__proto__', 'C:\\Users\\a\\b.flac', '/a b/ü.ogg', '"quoted".wav', '\\u0000.mp3'),
);

describe('playlist persistence', () => {
  it('round-trips any list of paths exactly, in order, duplicates included', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(pathArb, { maxLength: 60 }), async (paths) => {
        const { fs } = memoryFs();
        const persistence = createPlaylistPersistence({ fs, filePath: FILE, log: logger() });
        expect(await persistence.save(paths)).toBe(true);
        expect(await persistence.load()).toEqual(paths);
      }),
      RUNS,
    );
  });

  it('leaves no temporary file behind after a successful save', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(pathArb, { maxLength: 10 }), async (paths) => {
        const { fs, files } = memoryFs();
        await createPlaylistPersistence({ fs, filePath: FILE, log: logger() }).save(paths);
        expect([...files.keys()]).toEqual([FILE]);
      }),
      RUNS,
    );
  });

  it('serializes overlapping saves: the persisted list is always the last one requested', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.array(pathArb, { maxLength: 5 }), { minLength: 1, maxLength: 8 }),
        async (lists) => {
          const { fs } = memoryFs();
          const persistence = createPlaylistPersistence({ fs, filePath: FILE, log: logger() });
          await Promise.all(lists.map((list) => persistence.save(list)));
          expect(await persistence.load()).toEqual(lists.at(-1));
        },
      ),
      RUNS,
    );
  });

  it('load never throws for arbitrary file content and returns only non-empty strings', async () => {
    const content = fc.oneof(
      fc.string({ unit: 'binary', maxLength: 300 }),
      fc.json(),
      fc.anything().map((value) => {
        try {
          return JSON.stringify(value) ?? 'undefined';
        } catch {
          return 'cyclic';
        }
      }),
      fc
        .record({ schemaVersion: fc.anything(), items: fc.anything() })
        .map((v) => JSON.stringify(v)),
    );
    await fc.assert(
      fc.asyncProperty(content, async (text) => {
        const { fs } = memoryFs(text);
        const result = await createPlaylistPersistence({
          fs,
          filePath: FILE,
          log: logger(),
        }).load();
        expect(Array.isArray(result)).toBe(true);
        for (const entry of result) {
          expect(typeof entry).toBe('string');
          expect(entry.length).toBeGreaterThan(0);
        }
      }),
      RUNS,
    );
  });

  it('load treats any unknown key anywhere in the document as corruption', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 12 })
          .filter((k) => k !== 'schemaVersion' && k !== 'items'),
        fc.array(pathArb, { maxLength: 4 }),
        fc.boolean(),
        async (key, paths, atItem) => {
          const body = atItem
            ? { schemaVersion: 1, items: paths.map((path) => ({ path, [key]: 1 })) }
            : { schemaVersion: 1, items: paths.map((path) => ({ path })), [key]: 1 };
          fc.pre(!atItem || paths.length > 0);
          const text = JSON.stringify(body).replace('"__proto__"', '"__proto__"');
          const { fs } = memoryFs(text);
          const result = await createPlaylistPersistence({
            fs,
            filePath: FILE,
            log: logger(),
          }).load();
          expect(result).toEqual([]);
        },
      ),
      RUNS,
    );
  });

  it('a failing write reports false, never throws, leaves the previous content and no temp file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(pathArb, { maxLength: 5 }),
        fc.array(pathArb, { maxLength: 5 }),
        fc.constantFrom('write', 'rename'),
        async (before, after, failing) => {
          const memory = memoryFs();
          const good = createPlaylistPersistence({ fs: memory.fs, filePath: FILE, log: logger() });
          await good.save(before);
          const broken: PlaylistFs = {
            ...memory.fs,
            [failing === 'write' ? 'writeFile' : 'rename']: () =>
              Promise.reject(Object.assign(new Error('/secret/path'), { code: 'EACCES' })),
          };
          const log = logger();
          const result = await createPlaylistPersistence({ fs: broken, filePath: FILE, log }).save(
            after,
          );
          expect(result).toBe(false);
          expect(await good.load()).toEqual(before);
          expect([...memory.files.keys()]).toEqual([FILE]);
          expect(JSON.stringify(log.error.mock.calls)).not.toContain('/secret');
        },
      ),
      RUNS,
    );
  });
});
