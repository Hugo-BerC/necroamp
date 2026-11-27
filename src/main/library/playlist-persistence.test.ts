import { describe, expect, it, vi } from 'vitest';
import { createPlaylistPersistence, type PlaylistFs } from './playlist-persistence';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const FILE = '/data/playlist.json';

function memoryFs(initial?: string) {
  const files = new Map<string, string>();
  if (initial !== undefined) files.set(FILE, initial);
  const fs: PlaylistFs & { failWrite: boolean; failRename: boolean } = {
    failWrite: false,
    failRename: false,
    readFile: (p) => {
      const value = files.get(p);
      return value === undefined
        ? Promise.reject(Object.assign(new Error('x'), { code: 'ENOENT' }))
        : Promise.resolve(value);
    },
    writeFile: (p, data) => {
      if (fs.failWrite)
        return Promise.reject(Object.assign(new Error('C:\\secret'), { code: 'ENOSPC' }));
      files.set(p, data);
      return Promise.resolve();
    },
    rename: (from, to) => {
      if (fs.failRename) return Promise.reject(Object.assign(new Error('x'), { code: 'EPERM' }));
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

const make = (fs: PlaylistFs) => createPlaylistPersistence({ fs, filePath: FILE, log });

describe('playlist persistence', () => {
  it('loads empty when the file does not exist, without a warning', async () => {
    log.warn.mockClear();
    expect(await make(memoryFs().fs).load()).toEqual([]);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('round-trips paths in order with schemaVersion 1', async () => {
    const { fs, files } = memoryFs();
    const store = make(fs);
    expect(await store.save(['/a.mp3', '/b.flac'])).toBe(true);
    expect(JSON.parse(files.get(FILE) as string)).toEqual({
      schemaVersion: 1,
      items: [{ path: '/a.mp3' }, { path: '/b.flac' }],
    });
    expect(files.has(`${FILE}.tmp`)).toBe(false);
    expect(await store.load()).toEqual(['/a.mp3', '/b.flac']);
  });

  it.each([
    ['invalid json', '{nope'],
    ['unknown version', JSON.stringify({ schemaVersion: 2, items: [] })],
    ['extra field', JSON.stringify({ schemaVersion: 1, items: [], extra: 1 })],
    ['entry with extra field', JSON.stringify({ schemaVersion: 1, items: [{ path: 'a', x: 1 }] })],
    ['non-string path', JSON.stringify({ schemaVersion: 1, items: [{ path: 3 }] })],
    ['empty path', JSON.stringify({ schemaVersion: 1, items: [{ path: '' }] })],
    ['array root', '[]'],
    ['null', 'null'],
  ])('loads empty for %s and logs a code only', async (_name, content) => {
    log.warn.mockClear();
    expect(await make(memoryFs(content).fs).load()).toEqual([]);
    expect(log.warn).toHaveBeenCalledWith('playlist.corrupt', expect.any(Object));
  });

  it('treats an unreadable file as empty and logs the error code', async () => {
    log.warn.mockClear();
    const { fs } = memoryFs();
    fs.readFile = () => Promise.reject(Object.assign(new Error('C:\\x'), { code: 'EACCES' }));
    expect(await make(fs).load()).toEqual([]);
    expect(log.warn).toHaveBeenCalledWith('playlist.read_failed', { code: 'EACCES' });
  });

  it('keeps the previous file when the write fails and cleans the temp file', async () => {
    const good = JSON.stringify({ schemaVersion: 1, items: [{ path: '/old.mp3' }] });
    const { fs, files } = memoryFs(good);
    fs.failWrite = true;
    expect(await make(fs).save(['/new.mp3'])).toBe(false);
    expect(files.get(FILE)).toBe(good);
    fs.failWrite = false;
    fs.failRename = true;
    log.error.mockClear();
    expect(await make(fs).save(['/new.mp3'])).toBe(false);
    expect(files.get(FILE)).toBe(good);
    expect(files.has(`${FILE}.tmp`)).toBe(false);
    expect(JSON.stringify(log.error.mock.calls)).not.toContain('secret');
  });

  it('survives a failing cleanup and an exotic error shape', async () => {
    const { fs } = memoryFs();
    fs.writeFile = () => Promise.reject('plain string');
    fs.rm = () => Promise.reject(new Error('x'));
    expect(await make(fs).save([])).toBe(false);
  });

  it('serializes overlapping saves so the last call wins', async () => {
    const { fs, files } = memoryFs();
    const store = make(fs);
    const results = await Promise.all([store.save(['/1.mp3']), store.save(['/2.mp3'])]);
    expect(results).toEqual([true, true]);
    expect(await store.load()).toEqual(['/2.mp3']);
    expect(files.size).toBe(1);
  });
});
