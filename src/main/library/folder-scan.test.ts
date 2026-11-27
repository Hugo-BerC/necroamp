import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareNatural, scanFolder, type FolderScanDeps } from './folder-scan';

let root: string;

const deps = (extra: Partial<FolderScanDeps> = {}): FolderScanDeps => ({
  fs: {
    readdir: (p) => fsp.readdir(p, { withFileTypes: true }),
    realpath: (p) => fsp.realpath(p),
  },
  path,
  maxFiles: 5000,
  ...extra,
});

const rel = (files: readonly string[]): string[] =>
  files.map((f) => path.relative(root, f).split(path.sep).join('/'));

async function touch(...parts: string[]): Promise<void> {
  const target = path.join(root, ...parts);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, 'x');
}

beforeEach(async () => {
  root = await fsp.mkdtemp(path.join(os.tmpdir(), 'necroamp-scan-'));
});

afterEach(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});

describe('compareNatural', () => {
  it('orders numbers by value and is total', () => {
    expect(['10.mp3', '2.mp3', '1.mp3'].sort(compareNatural)).toEqual(['1.mp3', '2.mp3', '10.mp3']);
    expect(compareNatural('a', 'A')).not.toBe(0);
    expect(compareNatural('a', 'a')).toBe(0);
  });
});

describe('scanFolder', () => {
  it('returns an empty result for an empty folder', async () => {
    expect(await scanFolder(root, deps())).toEqual({ files: [], truncated: false });
  });

  it('keeps only allow-listed extensions, case-insensitively, in natural order', async () => {
    for (const n of [
      '10.mp3',
      '2.MP3',
      '1.flac',
      'a.wav',
      'b.ogg',
      'c.oga',
      'd.txt',
      'e.m4a',
      'f',
    ]) {
      await touch(n);
    }
    const { files } = await scanFolder(root, deps());
    expect(rel(files)).toEqual(['1.flac', '2.MP3', '10.mp3', 'a.wav', 'b.ogg', 'c.oga']);
  });

  it('lists a folder files before its sub-folders, recursively and deterministically', async () => {
    await touch('b', '2.mp3');
    await touch('a', '1.mp3');
    await touch('z.mp3');
    const first = rel((await scanFolder(root, deps())).files);
    expect(first).toEqual(['z.mp3', 'a/1.mp3', 'b/2.mp3']);
    expect(rel((await scanFolder(root, deps())).files)).toEqual(first);
  });

  it('stops at maxFiles and reports truncation', async () => {
    for (const n of ['1', '2', '3']) await touch(`${n}.mp3`);
    const result = await scanFolder(root, deps({ maxFiles: 2 }));
    expect(rel(result.files)).toEqual(['1.mp3', '2.mp3']);
    expect(result.truncated).toBe(true);
  });

  it('does not descend past maxDepth and reports truncation', async () => {
    await touch('a', 'b', 'c', 'deep.mp3');
    await touch('a', 'top.mp3');
    const result = await scanFolder(root, deps({ maxDepth: 2 }));
    expect(rel(result.files)).toEqual(['a/top.mp3']);
    expect(result.truncated).toBe(true);
  });

  it('stops at the entry budget', async () => {
    for (let i = 0; i < 10; i += 1) await touch(`${i}.txt`);
    expect((await scanFolder(root, deps({ maxEntries: 3 }))).truncated).toBe(true);
  });

  it('rejects when the chosen folder cannot be read', async () => {
    await expect(scanFolder(path.join(root, 'missing'), deps())).rejects.toBeDefined();
  });

  it('skips an unreadable sub-folder instead of failing', async () => {
    await touch('ok', '1.mp3');
    await fsp.mkdir(path.join(root, 'bad'));
    const real = deps();
    const result = await scanFolder(
      root,
      deps({
        fs: {
          realpath: real.fs.realpath,
          readdir: (p) =>
            path.basename(p) === 'bad' ? Promise.reject(new Error('EACCES')) : real.fs.readdir(p),
        },
      }),
    );
    expect(rel(result.files)).toEqual(['ok/1.mp3']);
  });

  it('never follows or lists symbolic links or junctions out of the folder', async () => {
    const outside = await fsp.mkdtemp(path.join(os.tmpdir(), 'necroamp-outside-'));
    try {
      await fsp.writeFile(path.join(outside, 'secret.mp3'), 'x');
      await touch('inside.mp3');
      await fsp.symlink(outside, path.join(root, 'link'), 'junction');
      await fsp
        .symlink(path.join(outside, 'secret.mp3'), path.join(root, 'file-link.mp3'))
        .catch(() => undefined);
      expect(rel((await scanFolder(root, deps())).files)).toEqual(['inside.mp3']);
    } finally {
      await fsp.rm(outside, { recursive: true, force: true });
    }
  });

  it('rejects a sub-folder whose real path leaves the root even if not reported as a link', async () => {
    await touch('sub', '1.mp3');
    const real = deps();
    const result = await scanFolder(
      root,
      deps({
        fs: {
          readdir: real.fs.readdir,
          realpath: (p) =>
            path.basename(p) === 'sub'
              ? Promise.resolve(path.join(os.tmpdir(), 'elsewhere'))
              : real.fs.realpath(p),
        },
      }),
    );
    expect(result.files).toEqual([]);
  });
});
