import { describe, expect, it, vi } from 'vitest';
import { createPlaylistPersistence, type PlaylistFs } from '@main/library/playlist-persistence';

// Audio Engine Block B: error-path behavior of playlist persistence with an in-memory filesystem.
// The logged code must be a short allow-listed token and never an error message or a path.
const FILE = '/user-data/playlist.json';
const log = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
const failing = (error: unknown): (() => Promise<never>) => {
  return () => Promise.reject(error as Error);
};
const fsWith = (overrides: Partial<PlaylistFs>): PlaylistFs => ({
  readFile: () => Promise.resolve(''),
  writeFile: () => Promise.resolve(),
  rename: () => Promise.resolve(),
  rm: () => Promise.resolve(),
  ...overrides,
});

describe('playlist persistence read errors', () => {
  it('stays silent for a missing file (first run)', async () => {
    const sink = log();
    const fs = fsWith({ readFile: failing(Object.assign(new Error('x'), { code: 'ENOENT' })) });
    expect(await createPlaylistPersistence({ fs, filePath: FILE, log: sink }).load()).toEqual([]);
    expect(sink.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['a permission error', Object.assign(new Error('/secret/p'), { code: 'EACCES' }), 'EACCES'],
    [
      'an error with a lower-case code',
      Object.assign(new Error('x'), { code: 'eacces /secret' }),
      'UNKNOWN',
    ],
    ['an error with a numeric code', Object.assign(new Error('x'), { code: 13 }), 'UNKNOWN'],
    ['an over-long code', Object.assign(new Error('x'), { code: 'E'.repeat(64) }), 'UNKNOWN'],
    ['a thrown string', '/secret/path', 'UNKNOWN'],
    ['null', null, 'UNKNOWN'],
  ])('answers an empty list for %s and logs only the code %s', async (_name, error, code) => {
    const sink = log();
    const fs = fsWith({ readFile: failing(error) });
    expect(await createPlaylistPersistence({ fs, filePath: FILE, log: sink }).load()).toEqual([]);
    expect(sink.warn).toHaveBeenCalledWith('playlist.read_failed', { code });
    expect(JSON.stringify(sink.warn.mock.calls)).not.toContain('secret');
  });
});

describe('playlist persistence write errors', () => {
  it('returns false when the write fails and still tries to remove the temporary file', async () => {
    const sink = log();
    const rm = vi.fn(() => Promise.resolve());
    const fs = fsWith({
      writeFile: failing(Object.assign(new Error('/secret'), { code: 'ENOSPC' })),
      rm,
    });
    expect(
      await createPlaylistPersistence({ fs, filePath: FILE, log: sink }).save(['/a.mp3']),
    ).toBe(false);
    expect(rm).toHaveBeenCalledWith(`${FILE}.tmp`);
    expect(sink.error).toHaveBeenCalledWith('playlist.write_failed', { code: 'ENOSPC' });
  });

  it('returns false and does not throw when the cleanup fails too', async () => {
    const sink = log();
    const fs = fsWith({
      rename: failing(new Error('/secret')),
      rm: failing(Object.assign(new Error('/secret'), { code: 'EPERM' })),
    });
    expect(
      await createPlaylistPersistence({ fs, filePath: FILE, log: sink }).save(['/a.mp3']),
    ).toBe(false);
    expect(sink.error).toHaveBeenCalledWith('playlist.write_failed', { code: 'UNKNOWN' });
    expect(JSON.stringify(sink.error.mock.calls)).not.toContain('secret');
  });

  it('keeps accepting saves after a failed one (the queue does not stay rejected)', async () => {
    let calls = 0;
    const written: string[] = [];
    const fs = fsWith({
      writeFile: (_path, data) => {
        calls += 1;
        if (calls === 1) return Promise.reject(new Error('first write fails'));
        written.push(data);
        return Promise.resolve();
      },
    });
    const persistence = createPlaylistPersistence({ fs, filePath: FILE, log: log() });
    const [first, second] = await Promise.all([
      persistence.save(['/a.mp3']),
      persistence.save(['/b.mp3']),
    ]);
    expect([first, second]).toEqual([false, true]);
    expect(JSON.parse(written[0] as string)).toEqual({
      schemaVersion: 1,
      items: [{ path: '/b.mp3' }],
    });
  });
});
