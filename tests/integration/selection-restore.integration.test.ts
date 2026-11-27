import { existsSync } from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAYLIST_SCHEMA_VERSION, type MenuCommand } from '@shared/ipc';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import { createArtworkStore } from '@main/library/artwork';
import { createMediaRegistry } from '@main/library/media-registry';
import { createMetadataReader } from '@main/library/metadata';
import { createPlaylistPersistence, type PlaylistFs } from '@main/library/playlist-persistence';
import type { SenderEventLike } from '@main/security/sender-validation';
import type { AudioEngine, AudioEngineEvent, AudioEngineListener } from '@renderer/audio';
import {
  createLibraryClient,
  createPlaylistClient,
  type MenuClient,
} from '@renderer/app/bridge/necroamp-client';
import { connectNativeMenu } from '@renderer/app/bridge/native-menu';
import { createPlayerPort } from '@renderer/stores/player-port';
import { createPlayerStore } from '@renderer/stores/player-store';
import { createPlaylistStore } from '@renderer/stores/playlist-store';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';
import { makeWav } from '../fixtures/audio/generate-audio';
import { makeTaggedMp3 } from '../fixtures/audio/generate-tagged';

// Selection on import and restore (PR #7, manual acceptance finding). One session is the real
// main-process handlers, the real playlist.json persistence on disk, the real preload bridge,
// and the real player and playlist stores. Only Electron and the audio element are faked.
// A restart is a second session over the same user-data directory.
const TRUSTED = 'app://renderer';
const FRAME = { url: `${TRUSTED}/index.html`, parent: null };
const SENDER = { id: 'registered', mainFrame: FRAME };
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

const playlistFs: PlaylistFs = {
  readFile: (p) => fsp.readFile(p, 'utf8'),
  writeFile: (p, data) => fsp.writeFile(p, data, 'utf8'),
  rename: (from, to) => fsp.rename(from, to),
  rm: (p) => fsp.rm(p, { force: true }),
};

let root: string;
let musicDir: string;
let userData: string;
let counter = 0;
const files = new Map<string, string>();

beforeAll(async () => {
  root = await fsp.mkdtemp(path.join(tmpdir(), 'necroamp-selection-'));
  musicDir = path.join(root, 'music');
  await fsp.mkdir(musicDir);
  for (const name of ['a.wav', 'b.wav', 'c.wav', 'd.wav']) {
    const full = path.join(musicDir, name);
    await fsp.writeFile(full, makeWav(1));
    files.set(name, full);
  }
  const mp3 = path.join(musicDir, 'e.mp3');
  await fsp.writeFile(mp3, makeTaggedMp3());
  files.set('e.mp3', mp3);
});
afterAll(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});
beforeEach(async () => {
  counter += 1;
  userData = path.join(root, `user-data-${String(counter)}`);
  await fsp.mkdir(userData);
});

const playlistFile = (): string => path.join(userData, 'playlist.json');
const readSaved = async (): Promise<Record<string, unknown>> =>
  JSON.parse(await fsp.readFile(playlistFile(), 'utf8')) as Record<string, unknown>;

function fakeEngine() {
  let listener: AudioEngineListener | undefined;
  const mocks = {
    load: vi.fn<AudioEngine['load']>(),
    play: vi.fn<AudioEngine['play']>(() => Promise.resolve()),
    pause: vi.fn<AudioEngine['pause']>(),
    stop: vi.fn<AudioEngine['stop']>(),
    seek: vi.fn<AudioEngine['seek']>(),
    setVolume: vi.fn<AudioEngine['setVolume']>(),
    setMuted: vi.fn<AudioEngine['setMuted']>(),
    subscribe: vi.fn<AudioEngine['subscribe']>((l) => {
      listener = l;
      return () => {
        listener = undefined;
      };
    }),
    dispose: vi.fn<AudioEngine['dispose']>(),
  };
  return {
    engine: mocks satisfies AudioEngine,
    mocks,
    emit: (event: AudioEngineEvent) => listener?.(event),
  };
}

/** One app run over the shared user-data directory. */
function session() {
  const listeners = new Map<string, Listener>();
  const persistence = createPlaylistPersistence({
    fs: playlistFs,
    filePath: playlistFile(),
    log,
  });
  let dialog: readonly string[] = [];
  installIpcHandlers({
    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
    app: { getName: () => 'NecroAmp', getVersion: () => '0.0.0' },
    platform: 'linux',
    trusted: [TRUSTED],
    isRegisteredSender: (s) => s === SENDER,
    log,
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: dialog }),
    fs: { stat: (p) => fsp.stat(p) },
    path,
    registry: createMediaRegistry(),
    metadata: createMetadataReader({ parseFile, log }),
    artwork: createArtworkStore(),
    folder: {
      fs: {
        readdir: (p: string) => fsp.readdir(p, { withFileTypes: true }),
        realpath: (p: string) => fsp.realpath(p),
      },
      path,
    },
    playlistPersistence: persistence,
  });
  const api = createNecroampApi((channel, ...args) =>
    (listeners.get(channel) as Listener)({ senderFrame: FRAME, sender: SENDER }, ...args),
  );
  const host = { necroamp: api };
  const library = createLibraryClient(host);
  const fake = fakeEngine();
  const player = createPlayerStore(fake.engine, library);
  const playlist = createPlaylistStore(
    createPlayerPort(player),
    library,
    createPlaylistClient(host),
    { saveDebounceMs: 3_600_000 },
  );
  let handler: ((command: MenuCommand['command']) => void) | undefined;
  const menuClient: MenuClient = {
    onCommand: (l) => {
      handler = l;
      return () => {
        handler = undefined;
      };
    },
    reportPlaylistState: () => Promise.resolve(true),
  };
  const disconnect = connectNativeMenu(menuClient, playlist);
  return {
    ...fake,
    player,
    playlist,
    /** What the native dialog returns next, for files and for folders. */
    pick: (...names: string[]) => {
      dialog = names.map((n) => files.get(n) as string);
    },
    pickFolder: () => {
      dialog = [musicDir];
    },
    menu: (command: MenuCommand['command']) => {
      handler?.(command);
    },
    close: () => {
      disconnect();
      playlist.getState().dispose();
      player.getState().dispose();
    },
  };
}
type Session = ReturnType<typeof session>;

/** Waits for real async work (IPC, file IO, metadata) by polling a condition, bounded and timer-free of wall-clock asserts. */
const settle = async (until: () => boolean = () => false): Promise<void> => {
  for (let i = 0; i < 400 && !until(); i += 1) await new Promise<void>((r) => setTimeout(r, 5));
};
const titles = (s: Session): string[] => s.playlist.getState().items.map((i) => i.title);
const view = (s: Session) => ({
  titles: titles(s),
  current: s.playlist.getState().current,
  loaded: s.player.getState().track?.title ?? null,
  status: s.player.getState().playback.status,
  loads: s.mocks.load.mock.calls.length,
  plays: s.mocks.play.mock.calls.length,
});

describe('R1 and R2: import into an empty playlist loads the first track and never plays', () => {
  it('Add files selects and loads the first track, with metadata, and does not play', async () => {
    const s = session();
    s.pick('e.mp3', 'a.wav', 'b.wav');
    await s.playlist.getState().addFiles();
    const first = s.playlist.getState().items[0];
    expect(s.playlist.getState().current).toBe(0);
    expect(s.player.getState().track).toEqual(first);
    expect(first?.title).not.toBe('');
    expect(s.player.getState().playback.status).toBe('loading');
    expect(s.mocks.load).toHaveBeenCalledOnce();
    expect(s.mocks.load).toHaveBeenCalledWith(first?.mediaUrl);
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });

  it('becomes ready, not playing, when the engine reports the duration', async () => {
    const s = session();
    s.pick('a.wav');
    await s.playlist.getState().addFiles();
    s.emit({ type: 'metadata', durationSec: 1 });
    expect(s.player.getState().playback.status).toBe('stopped');
    expect(s.player.getState().playback.durationSec).toBe(1);
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });

  it('Add folder into an empty playlist behaves the same', async () => {
    const s = session();
    s.pickFolder();
    await s.playlist.getState().addFolder();
    expect(s.playlist.getState().items.length).toBe(5);
    expect(s.playlist.getState().current).toBe(0);
    expect(s.player.getState().track?.trackId).toBe(s.playlist.getState().items[0]?.trackId);
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });
});

describe('R5: adding to a non-empty playlist keeps the loaded track', () => {
  it('keeps the loaded track, its play state and position', async () => {
    const s = session();
    s.pick('a.wav', 'b.wav');
    await s.playlist.getState().addFiles();
    await s.playlist.getState().playIndex(1);
    s.emit({ type: 'metadata', durationSec: 1 });
    s.emit({ type: 'time', positionSec: 0.5 });
    const before = view(s);
    expect(before.status).toBe('playing');
    s.pick('c.wav', 'd.wav');
    await s.playlist.getState().addFiles();
    const after = view(s);
    expect(after.titles).toEqual(['a', 'b', 'c', 'd']);
    expect(after.current).toBe(1);
    expect(after.loaded).toBe('b');
    expect(after.status).toBe('playing');
    expect(after.loads).toBe(before.loads);
    expect(s.player.getState().playback.positionSec).toBe(0.5);
    s.close();
  });
});

describe('R4: double-click loads and plays', () => {
  it('playIndex loads and plays an unloaded track', async () => {
    const s = session();
    s.pick('a.wav', 'b.wav', 'c.wav');
    await s.playlist.getState().addFiles();
    expect(s.mocks.play).not.toHaveBeenCalled();
    await s.playlist.getState().playIndex(2);
    expect(s.playlist.getState().current).toBe(2);
    expect(s.player.getState().track?.title).toBe('c');
    expect(s.mocks.load).toHaveBeenLastCalledWith(s.playlist.getState().items[2]?.mediaUrl);
    expect(s.mocks.play).toHaveBeenCalledOnce();
    expect(s.player.getState().playback.status).toBe('playing');
    s.close();
  });

  it('playIndex on the already loaded (auto-selected) track plays it', async () => {
    const s = session();
    s.pick('a.wav', 'b.wav');
    await s.playlist.getState().addFiles();
    await s.playlist.getState().playIndex(0);
    expect(s.player.getState().playback.status).toBe('playing');
    expect(s.mocks.play).toHaveBeenCalledOnce();
    s.close();
  });
});

describe('R7: menu commands and renderer buttons share one path', () => {
  const run = async (how: 'menu' | 'button', action: 'files' | 'folder') => {
    const s = session();
    if (action === 'files') s.pick('a.wav', 'b.wav', 'e.mp3');
    else s.pickFolder();
    if (how === 'menu') s.menu(action === 'files' ? 'open-files' : 'open-folder');
    else
      await (action === 'files'
        ? s.playlist.getState().addFiles()
        : s.playlist.getState().addFolder());
    await settle(
      () => s.playlist.getState().items.length > 0 && s.player.getState().track !== null,
    );
    const result = { ...view(s), notice: s.playlist.getState().notice };
    s.close();
    return result;
  };

  it.each(['files', 'folder'] as const)(
    'Open %s: menu and button end in the same state',
    async (action) => {
      const viaMenu = await run('menu', action);
      const viaButton = await run('button', action);
      expect(viaMenu).toEqual(viaButton);
      expect(viaMenu.current).toBe(0);
      expect(viaMenu.plays).toBe(0);
      expect(viaMenu.loaded).toBe(viaMenu.titles[0]);
    },
  );

  it('Clear Playlist from the menu and from the button both stop, unload and persist empty', async () => {
    const outcomes: unknown[] = [];
    for (const how of ['menu', 'button'] as const) {
      counter += 1;
      userData = path.join(root, `user-data-clear-${how}-${String(counter)}`);
      await fsp.mkdir(userData);
      const s = session();
      s.pick('a.wav', 'b.wav');
      await s.playlist.getState().addFiles();
      await s.playlist.getState().playIndex(1);
      expect(s.player.getState().playback.status).toBe('playing');
      if (how === 'menu') s.menu('clear-playlist');
      else s.playlist.getState().clear();
      await settle(() => s.playlist.getState().items.length === 0);
      await s.playlist.getState().flush();
      await settle(() => existsSync(playlistFile()));
      outcomes.push({
        ...view(s),
        stops: s.mocks.stop.mock.calls.length,
        saved: await readSaved(),
      });
      s.close();
    }
    expect(outcomes[0]).toEqual(outcomes[1]);
    expect(outcomes[0]).toMatchObject({
      titles: [],
      current: null,
      loaded: null,
      status: 'idle',
      saved: { schemaVersion: PLAYLIST_SCHEMA_VERSION, items: [] },
    });
  });
});

describe('R6: restore after restart', () => {
  it('persists the selection and restores it loaded, not playing, after a restart', async () => {
    const first = session();
    first.pick('a.wav', 'b.wav', 'c.wav');
    await first.playlist.getState().addFiles();
    await first.playlist.getState().playIndex(2);
    await first.playlist.getState().flush();
    const saved = await readSaved();
    expect(saved['selectedPath']).toBe(files.get('c.wav'));
    first.close();

    const second = session();
    await second.playlist.getState().load();
    expect(titles(second)).toEqual(['a', 'b', 'c']);
    expect(second.playlist.getState().current).toBe(2);
    expect(second.player.getState().track?.title).toBe('c');
    expect(second.player.getState().playback.status).toBe('loading');
    expect(second.mocks.load).toHaveBeenCalledOnce();
    expect(second.mocks.play).not.toHaveBeenCalled();
    second.close();
  });

  it('the restored selection also reaches the renderer without any path', async () => {
    const first = session();
    first.pick('a.wav', 'b.wav');
    await first.playlist.getState().addFiles();
    await first.playlist.getState().playIndex(1);
    await first.playlist.getState().flush();
    first.close();
    const second = session();
    await second.playlist.getState().load();
    const exposed = JSON.stringify(second.playlist.getState().items);
    expect(exposed).not.toContain(musicDir);
    expect(second.player.getState().track?.mediaUrl).toMatch(/^media:\/\/track\//);
    second.close();
  });

  it('loads a legacy playlist.json without a selection and selects the first track', async () => {
    await fsp.writeFile(
      playlistFile(),
      JSON.stringify({
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        items: [{ path: files.get('b.wav') }, { path: files.get('a.wav') }],
      }),
    );
    const s = session();
    await s.playlist.getState().load();
    expect(titles(s)).toEqual(['b', 'a']);
    expect(s.playlist.getState().current).toBe(0);
    expect(s.player.getState().track?.title).toBe('b');
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });

  it('falls back to the first track when the saved selection is not in the list', async () => {
    await fsp.writeFile(
      playlistFile(),
      JSON.stringify({
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        selectedPath: files.get('d.wav'),
        items: [{ path: files.get('a.wav') }, { path: files.get('b.wav') }],
      }),
    );
    const s = session();
    await s.playlist.getState().load();
    expect(s.playlist.getState().current).toBe(0);
    expect(s.player.getState().track?.title).toBe('a');
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });

  it('loads nothing and stays idle for an empty saved playlist', async () => {
    await fsp.writeFile(
      playlistFile(),
      JSON.stringify({ schemaVersion: PLAYLIST_SCHEMA_VERSION, items: [] }),
    );
    const s = session();
    await s.playlist.getState().load();
    expect(s.playlist.getState().current).toBeNull();
    expect(s.player.getState().playback.status).toBe('idle');
    expect(s.mocks.load).not.toHaveBeenCalled();
    s.close();
  });

  it('strict schema: a selection with a wrong type makes the file count as corrupt, not crash', async () => {
    await fsp.writeFile(
      playlistFile(),
      JSON.stringify({
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        selectedPath: 42,
        items: [{ path: files.get('a.wav') }],
      }),
    );
    const s = session();
    await s.playlist.getState().load();
    expect(s.playlist.getState().items).toEqual([]);
    expect(s.playlist.getState().current).toBeNull();
    s.close();
  });

  it('when the saved selection file was deleted, the first available track is loaded', async () => {
    const gone = path.join(musicDir, 'gone.wav');
    await fsp.writeFile(gone, makeWav(1));
    await fsp.writeFile(
      playlistFile(),
      JSON.stringify({
        schemaVersion: PLAYLIST_SCHEMA_VERSION,
        selectedPath: gone,
        items: [{ path: files.get('a.wav') }, { path: gone }],
      }),
    );
    await fsp.rm(gone);
    const s = session();
    await s.playlist.getState().load();
    expect(s.playlist.getState().items[1]?.available).toBe(false);
    expect(s.player.getState().track?.title).toBe('a');
    expect(s.mocks.play).not.toHaveBeenCalled();
    s.close();
  });
});
