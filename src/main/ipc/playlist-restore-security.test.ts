import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { createMediaRegistry } from '../library/media-registry';
import { createPlaylistPersistence, type PlaylistFs } from '../library/playlist-persistence';
import type { MetadataReader } from '../library/metadata';
import { createTrackFactory } from '../library/track-info';
import type { SenderEventLike } from '../security/sender-validation';
import { registerPlaylistHandlers } from './playlist-handlers';
import type { IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;

type Platform = 'win32' | 'linux';
const CASES: Record<
  Platform,
  { valid: string[]; rejected: string[]; pathApi: typeof path.win32 | typeof path.posix }
> = {
  win32: {
    pathApi: path.win32,
    valid: ['C:\\Music\\a.mp3', 'D:/Music/b.flac', 'C:\\Music\\c.ogg'],
    rejected: [
      '\\\\host\\share\\x.mp3',
      '//host/share/x.mp3',
      '\\\\?\\UNC\\host\\share\\x.mp3',
      '\\\\?\\C:\\x.mp3',
      '\\\\.\\pipe\\x.mp3',
      'C:x.mp3',
      '\\x.mp3',
      'rel\\x.mp3',
      'C:\\bad\0.mp3',
    ],
  },
  linux: {
    pathApi: path.posix,
    valid: ['/music/a.mp3', '/music/b.flac', '/music/c.ogg'],
    rejected: ['//host/share/x.mp3', 'rel/x.mp3', './x.mp3', '/bad\0.mp3', '/bad\n.mp3'],
  },
};

function setup(
  platform: Platform,
  saved: string[],
  selectedPath: string | null,
  missing: string[] = [],
) {
  const listeners = new Map<string, Listener>();
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => void listeners.set(channel, l),
    removeHandler: vi.fn(),
  };
  const registry = createMediaRegistry();
  const issue = vi.spyOn(registry, 'issue');
  const stat = vi.fn((p: string) =>
    missing.includes(p)
      ? Promise.reject(new Error('ENOENT'))
      : Promise.resolve({ isFile: () => true }),
  );
  const realpath = vi.fn();
  const open = vi.fn();
  const metadata = vi.fn<MetadataReader>(() =>
    Promise.resolve({
      title: '',
      artist: 'x',
      album: '',
      durationSec: 1,
      picture: null,
      parsed: true,
    }),
  );
  const tracks = createTrackFactory({
    fs: { stat, realpath, open } as unknown as { stat: typeof stat },
    path: CASES[platform].pathApi,
    registry,
    metadata,
    platform,
  });
  const persistence = {
    load: vi.fn(() => Promise.resolve(saved)),
    loadState: vi.fn(() => Promise.resolve({ paths: saved, selectedPath })),
    save: vi.fn(() => Promise.resolve(true)),
  };
  registerPlaylistHandlers({
    ipcMain,
    registry,
    tracks,
    persistence,
    isTrustedSender: () => true,
    log,
    platform,
  });
  const load = async () =>
    (await (listeners.get(IPC_CHANNELS.playlistLoad) as Listener)(EVENT)) as {
      ok: true;
      data: {
        items: { trackId: string; fileName: string; available: boolean }[];
        selectedTrackId?: string;
      };
    };
  return { registry, issue, stat, realpath, open, metadata, load };
}

describe.each(['win32', 'linux'] as const)('playlist:load restoration on %s', (platform) => {
  const { valid, rejected } = CASES[platform];
  beforeEach(() => vi.clearAllMocks());

  it.each(rejected)('rejects item %j before any fs, metadata or registry use', async (bad) => {
    const ctx = setup(platform, [bad], null);
    const result = await ctx.load();
    expect(result.data.items).toEqual([]);
    expect(result.data.selectedTrackId).toBeUndefined();
    expect(ctx.stat).not.toHaveBeenCalled();
    expect(ctx.realpath).not.toHaveBeenCalled();
    expect(ctx.open).not.toHaveBeenCalled();
    expect(ctx.metadata).not.toHaveBeenCalled();
    expect(ctx.issue).not.toHaveBeenCalled();
  });

  it.each(rejected)('treats rejected selectedPath %j as stale and issues no token', async (bad) => {
    const ctx = setup(platform, [valid[0] as string, valid[1] as string], bad);
    const result = await ctx.load();
    expect(result.data.items).toHaveLength(2);
    expect(result.data.selectedTrackId).toBe(result.data.items[0]?.trackId);
    expect(ctx.issue).toHaveBeenCalledTimes(2);
    expect(ctx.stat.mock.calls.map((c) => c[0])).toEqual([valid[0], valid[1]]);
    expect(ctx.stat).not.toHaveBeenCalledWith(bad);
  });

  it('keeps only valid entries, in order, and still selects a valid saved selection', async () => {
    const mixed = [
      rejected[0],
      valid[0],
      rejected[1],
      valid[1],
      rejected[2] ?? 'x.mp3',
      valid[2],
    ] as string[];
    const ctx = setup(platform, mixed, valid[1] as string);
    const result = await ctx.load();
    expect(result.data.items.map((i) => i.fileName)).toEqual(
      valid.map((p) => CASES[platform].pathApi.basename(p)),
    );
    expect(result.data.selectedTrackId).toBe(result.data.items[1]?.trackId);
    expect(ctx.stat.mock.calls.map((c) => c[0])).toEqual(valid);
    expect(ctx.issue).toHaveBeenCalledTimes(valid.length);
    expect(ctx.open).not.toHaveBeenCalled();
    expect(ctx.realpath).not.toHaveBeenCalled();
  });

  it('keeps allowMissing behavior for a valid but missing local file', async () => {
    const ctx = setup(platform, valid, null, [valid[1] as string]);
    const result = await ctx.load();
    expect(result.data.items.map((i) => i.available)).toEqual([true, false, true]);
    expect(ctx.metadata).toHaveBeenCalledTimes(2);
  });
});

describe('playlist persistence compatibility', () => {
  function persistenceFor(text: string) {
    const fs: PlaylistFs = {
      readFile: vi.fn(() => Promise.resolve(text)),
      writeFile: vi.fn(() => Promise.resolve()),
      rename: vi.fn(() => Promise.resolve()),
      rm: vi.fn(() => Promise.resolve()),
    };
    return createPlaylistPersistence({ fs, filePath: path.resolve('playlist.json'), log });
  }

  it('loads a version-1 file without selectedPath', async () => {
    const p = persistenceFor(JSON.stringify({ schemaVersion: 1, items: [{ path: '/a.mp3' }] }));
    expect(await p.loadState()).toEqual({ paths: ['/a.mp3'], selectedPath: null });
  });

  it('stays strict: unknown keys give an empty list', async () => {
    const p = persistenceFor(
      JSON.stringify({ schemaVersion: 1, items: [{ path: '/a.mp3' }], extra: 1 }),
    );
    expect(await p.loadState()).toEqual({ paths: [], selectedPath: null });
  });

  it('a file with a UNC selectedPath still loads; the handler rejects the selection', async () => {
    const p = persistenceFor(
      JSON.stringify({
        schemaVersion: 1,
        selectedPath: '\\\\host\\share\\a.mp3',
        items: [{ path: 'C:\\Music\\a.mp3' }],
      }),
    );
    const state = await p.loadState();
    expect(state.paths).toEqual(['C:\\Music\\a.mp3']);
    expect(state.selectedPath).toBe('\\\\host\\share\\a.mp3');
  });
});

describe('interactive flows are unaffected', () => {
  it('fromPath without localOnly still accepts a UNC path (dialog-chosen file)', async () => {
    const stat = vi.fn(() => Promise.resolve({ isFile: () => true }));
    const tracks = createTrackFactory({
      fs: { stat },
      path: path.win32,
      registry: createMediaRegistry(),
      platform: 'win32',
    });
    const track = await tracks.fromPath('\\\\host\\share\\a.mp3');
    expect(track).not.toBeNull();
    expect(stat).toHaveBeenCalledTimes(1);
  });
});
