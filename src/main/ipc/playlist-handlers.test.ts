import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { createMediaRegistry } from '../library/media-registry';
import type { PlaylistPersistence } from '../library/playlist-persistence';
import { createTrackFactory } from '../library/track-info';
import type { SenderEventLike } from '../security/sender-validation';
import { registerPlaylistHandlers } from './playlist-handlers';
import type { IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;
const UNKNOWN = '00000000-0000-4000-8000-000000000000';

function setup(
  options: { trusted?: boolean; saved?: string[]; missing?: string[]; limit?: number } = {},
) {
  const listeners = new Map<string, Listener>();
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => void listeners.set(channel, l),
    removeHandler: vi.fn(),
  };
  const registry = createMediaRegistry(undefined, options.limit);
  const tracks = createTrackFactory({
    fs: {
      stat: (p) =>
        options.missing?.includes(p) === true
          ? Promise.reject(new Error('ENOENT'))
          : Promise.resolve({ isFile: () => true }),
    },
    path,
    registry,
  });
  const persistence = {
    load: vi.fn(() => Promise.resolve(options.saved ?? [])),
    save: vi.fn(() => Promise.resolve(true)),
  } satisfies PlaylistPersistence;
  const dispose = registerPlaylistHandlers({
    ipcMain,
    registry,
    tracks,
    persistence,
    isTrustedSender: () => options.trusted ?? true,
    log,
  });
  const invoke = (channel: string, ...args: unknown[]) =>
    (listeners.get(channel) as Listener)(EVENT, ...args);
  return { registry, persistence, invoke, dispose, ipcMain };
}

describe('playlist:load', () => {
  it('denies an untrusted sender before touching storage', async () => {
    const { invoke, persistence } = setup({ trusted: false });
    expect(await invoke(IPC_CHANNELS.playlistLoad)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(persistence.load).not.toHaveBeenCalled();
  });

  it('rejects arguments', async () => {
    const { invoke } = setup();
    expect(await invoke(IPC_CHANNELS.playlistLoad, { path: 'x' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
  });

  it('returns an empty versioned list when nothing is stored', async () => {
    const { invoke } = setup();
    expect(await invoke(IPC_CHANNELS.playlistLoad)).toEqual({
      ok: true,
      data: { schemaVersion: 1, items: [] },
    });
  });

  it('re-authorizes stored paths and marks missing files unavailable, keeping order', async () => {
    const a = path.join('m', 'a.mp3');
    const gone = path.join('m', 'gone.flac');
    const { invoke, registry } = setup({
      saved: [a, gone, path.join('m', 'x.txt')],
      missing: [gone],
    });
    const result = (await invoke(IPC_CHANNELS.playlistLoad)) as {
      ok: true;
      data: { items: { trackId: string; title: string; available: boolean }[] };
    };
    expect(result.data.items.map((i) => [i.title, i.available])).toEqual([
      ['a', true],
      ['gone', false],
    ]);
    expect(registry.resolve(result.data.items[0]?.trackId as string)).toBe(a);
    expect(JSON.stringify(result)).not.toContain('m' + path.sep);
  });

  it('stops when the registry is full', async () => {
    const { invoke } = setup({ saved: ['/m/a.mp3', '/m/b.mp3'], limit: 1 });
    const result = (await invoke(IPC_CHANNELS.playlistLoad)) as { data: { items: unknown[] } };
    expect(result.data.items).toHaveLength(1);
  });
});

describe('playlist:save', () => {
  it('denies an untrusted sender', async () => {
    const { invoke, persistence } = setup({ trusted: false });
    expect(await invoke(IPC_CHANNELS.playlistSave, { items: [] })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(persistence.save).not.toHaveBeenCalled();
  });

  it.each([
    [],
    [{}],
    [{ items: [{ trackId: 'C:\\x.mp3' }] }],
    [{ items: [{ path: 'C:\\x.mp3' }] }],
  ])('rejects invalid payload %j before storage', async (...args) => {
    const { invoke, persistence } = setup();
    expect(await invoke(IPC_CHANNELS.playlistSave, ...args)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(persistence.save).not.toHaveBeenCalled();
  });

  it('maps tokens to paths in order and drops unknown tokens', async () => {
    const { invoke, registry, persistence } = setup();
    const a = registry.issue(path.join('m', 'a.mp3')) as string;
    const b = registry.issue(path.join('m', 'b.mp3')) as string;
    const result = await invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: b }, { trackId: UNKNOWN }, { trackId: a }],
    });
    expect(result).toEqual({ ok: true, data: { saved: true } });
    expect(persistence.save).toHaveBeenCalledWith([
      path.join('m', 'b.mp3'),
      path.join('m', 'a.mp3'),
    ]);
  });

  it('reports INTERNAL when the write fails', async () => {
    const { invoke, persistence } = setup();
    persistence.save.mockResolvedValueOnce(false);
    expect(await invoke(IPC_CHANNELS.playlistSave, { items: [] })).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL' },
    });
  });

  it('removes both handlers on dispose', () => {
    const { dispose, ipcMain } = setup();
    dispose();
    expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.playlistLoad);
    expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.playlistSave);
  });
});
