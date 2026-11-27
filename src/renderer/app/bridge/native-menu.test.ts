import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import { createSeededRandom } from '@renderer/stores/playlist-ops';
import type { LibraryClient, OpenFolderClientResult } from '@renderer/stores/player-store';
import {
  createPlaylistStore,
  type PlaylistPersistenceClient,
  type PlaylistPlayerPort,
} from '@renderer/stores/playlist-store';
import { createMenuClient } from './necroamp-client';
import { connectNativeMenu } from './native-menu';

const ID = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const track = (n: number): TrackInfo => ({
  trackId: ID(n),
  mediaUrl: `media://track/${ID(n)}`,
  fileName: `t${String(n)}.mp3`,
  title: `T${String(n)}`,
  artist: '',
  album: '',
  durationSec: 1,
  artworkUrl: null,
  available: true,
});

function setup(folder: OpenFolderClientResult, restored: TrackInfo[] = []) {
  const port: PlaylistPlayerPort = {
    playTrack: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    restart: vi.fn(),
    positionSec: () => 0,
    subscribe: () => () => undefined,
  };
  const library: LibraryClient = {
    openFiles: vi.fn(() => Promise.resolve({ ok: true as const, data: { tracks: [track(1)] } })),
    openFolder: vi.fn(() => Promise.resolve(folder)),
  };
  const persistence: PlaylistPersistenceClient = {
    load: vi.fn(() => Promise.resolve({ ok: true as const, items: restored })),
    save: vi.fn(() => Promise.resolve({ ok: true as const })),
  };
  const store = createPlaylistStore(port, library, persistence, { random: createSeededRandom(1) });
  let listener: ((payload: unknown) => void) | undefined;
  const unsubscribe = vi.fn();
  const reportPlaylistState = vi.fn(() => Promise.resolve({ ok: true, data: { applied: true } }));
  const host = {
    necroamp: {
      menu: {
        onCommand: (cb: (payload: unknown) => void) => {
          listener = cb;
          return unsubscribe;
        },
        reportPlaylistState,
      },
    },
  };
  const dispose = connectNativeMenu(createMenuClient(host), store);
  return {
    store,
    port,
    library,
    persistence,
    unsubscribe,
    reportPlaylistState,
    dispose,
    send: (payload: unknown) => {
      listener?.(payload);
    },
  };
}
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};
const folderOk = (tracks: TrackInfo[], over = {}): OpenFolderClientResult => ({
  ok: true,
  data: { tracks, canceled: false, truncated: false, ...over },
});

describe('native menu wiring', () => {
  it('reports no tracks on connect and true after Open Files', async () => {
    const ctx = setup(folderOk([]));
    expect(ctx.reportPlaylistState).toHaveBeenLastCalledWith({ hasTracks: false });
    ctx.send({ command: 'open-files' });
    await flush();
    expect(ctx.library.openFiles).toHaveBeenCalledWith({ multiple: true });
    expect(ctx.store.getState().items).toHaveLength(1);
    expect(ctx.reportPlaylistState).toHaveBeenLastCalledWith({ hasTracks: true });
  });

  it('reports after the persisted playlist is restored', async () => {
    const ctx = setup(folderOk([]), [track(5)]);
    await ctx.store.getState().load();
    expect(ctx.reportPlaylistState).toHaveBeenLastCalledWith({ hasTracks: true });
  });

  it('does not repeat a report when the has-tracks state is unchanged', async () => {
    const ctx = setup(folderOk([track(1), track(2)]));
    ctx.send({ command: 'open-folder' });
    await flush();
    ctx.send({ command: 'open-files' });
    await flush();
    expect(ctx.reportPlaylistState).toHaveBeenCalledTimes(2);
  });

  it('Open Folder appends the tracks through the same path as Open Files', async () => {
    const ctx = setup(folderOk([track(1), track(2)]));
    ctx.send({ command: 'open-folder' });
    await flush();
    expect(ctx.store.getState().items.map((i) => i.trackId)).toEqual([ID(1), ID(2)]);
    expect(ctx.store.getState().notice).toBeNull();
  });

  it.each([
    [folderOk([], { canceled: true }), null],
    [folderOk([]), 'folder-empty'],
    [folderOk([track(1)], { truncated: true }), 'folder-truncated'],
    [{ ok: false, reason: 'ipc-error' } as const, 'open-failed'],
  ] as const)('maps the folder result %j to notice %s', async (result, code) => {
    const ctx = setup(result);
    ctx.send({ command: 'open-folder' });
    await flush();
    expect(ctx.store.getState().notice?.code ?? null).toBe(code);
  });

  it('Clear Playlist stops playback, empties the list and persists at once', async () => {
    const ctx = setup(folderOk([]));
    ctx.send({ command: 'open-files' });
    await flush();
    ctx.send({ command: 'clear-playlist' });
    await flush();
    expect(ctx.port.stop).toHaveBeenCalled();
    expect(ctx.store.getState().items).toEqual([]);
    expect(ctx.persistence.save).toHaveBeenLastCalledWith([]);
    expect(ctx.reportPlaylistState).toHaveBeenLastCalledWith({ hasTracks: false });
  });

  it('ignores a payload that fails validation', async () => {
    const ctx = setup(folderOk([]));
    ctx.send({ command: 'format-disk' });
    ctx.send({ command: 'open-files', extra: 1 });
    ctx.send(null);
    await flush();
    expect(ctx.library.openFiles).not.toHaveBeenCalled();
  });

  it('unsubscribes from the menu and from the store on dispose', async () => {
    const ctx = setup(folderOk([]));
    ctx.dispose();
    expect(ctx.unsubscribe).toHaveBeenCalledTimes(1);
    await ctx.store.getState().addFiles();
    expect(ctx.reportPlaylistState).toHaveBeenCalledTimes(1);
  });

  it('retries the report on the next store update after a failed report', async () => {
    const ctx = setup(folderOk([]));
    ctx.reportPlaylistState.mockResolvedValueOnce({ ok: false, data: { applied: true } });
    await ctx.store.getState().addFiles();
    await flush();
    await ctx.store.getState().clearAndSave();
    await flush();
    const reported = ctx.reportPlaylistState.mock.calls as unknown as [{ hasTracks: boolean }][];
    expect(reported.map((c) => c[0].hasTracks)).toEqual([false, true, true, false]);
  });
});

describe('createMenuClient without a bridge', () => {
  it('is inert', async () => {
    const client = createMenuClient({});
    expect(client.onCommand(() => undefined)()).toBeUndefined();
    expect(await client.reportPlaylistState({ hasTracks: true })).toBe(false);
  });

  it('reports false when the bridge rejects', async () => {
    const client = createMenuClient({
      necroamp: { menu: { reportPlaylistState: () => Promise.reject(new Error('C:\\x')) } },
    });
    expect(await client.reportPlaylistState({ hasTracks: true })).toBe(false);
  });
});
