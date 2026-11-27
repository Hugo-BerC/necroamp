import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  MAX_TRACKS_PER_REQUEST,
  menuReportStateResponseSchema,
  openFolderResponseSchema,
} from '@shared/ipc';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import {
  buildMenuTemplate,
  CLEAR_PLAYLIST_MENU_ID,
  installAppMenu,
  type MenuDescriptor,
} from '@main/lifecycle/app-menu';
import { createMediaRegistry } from '@main/library/media-registry';
import { scanFolder } from '@main/library/folder-scan';
import type { PlaylistPersistence } from '@main/library/playlist-persistence';
import type { SenderEventLike } from '@main/security/sender-validation';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';

// Native menu and Open Folder (PR #7). Real filesystem under a temp directory; only Electron is
// faked. Covers the menu template per platform, folder discovery boundaries, IPC sender and
// schema checks for the new channels, and the preload surface.

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
const TRUSTED = 'app://renderer';
const FRAME = { url: `${TRUSTED}/index.html`, parent: null };
const SENDER = { id: 'registered', mainFrame: FRAME };
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const realFs = {
  readdir: (p: string) => fsp.readdir(p, { withFileTypes: true }),
  realpath: (p: string) => fsp.realpath(p),
};

let base: string;
let seq = 0;
beforeAll(async () => {
  base = await fsp.mkdtemp(path.join(tmpdir(), 'necroamp-menu-'));
});
afterAll(async () => {
  await fsp.rm(base, { recursive: true, force: true });
});

/** Builds a tree from `{ 'a/b.mp3': '' }` style entries inside a fresh root. */
async function tree(files: readonly string[]): Promise<string> {
  seq += 1;
  const root = path.join(base, `case-${String(seq)}`, 'music');
  await fsp.mkdir(root, { recursive: true });
  for (const rel of files) {
    const full = path.join(root, ...rel.split('/'));
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, 'x');
  }
  return root;
}

async function tryLink(target: string, link: string, type: 'dir' | 'file' | 'junction') {
  try {
    await fsp.symlink(target, link, type);
    return true;
  } catch {
    return false; // Not permitted on this host (for example Windows without developer mode).
  }
}

const rel = (root: string, files: readonly string[]): string[] =>
  files.map((f) => path.relative(root, f).split(path.sep).join('/'));

const scanDeps = { fs: realFs, path, maxFiles: MAX_TRACKS_PER_REQUEST };

describe('application menu template per platform', () => {
  const labels = (items: MenuDescriptor[] | undefined) =>
    (items ?? []).filter((i) => i.type !== 'separator').map((i) => i.label ?? i.role);

  it.each(['win32', 'linux'] as const)('%s: File has the library items and the quit role', (p) => {
    const template = buildMenuTemplate({ platform: p, isDevRun: false });
    const file = template.find((m) => m.label === 'File');
    expect(labels(file?.submenu)).toEqual([
      'Open Files…',
      'Open Folder…',
      'Clear Playlist',
      'quit',
    ]);
    expect(template.some((m) => m.role === 'appMenu')).toBe(false);
  });

  it('darwin: app menu role, File with library items and close, no quit role in File', () => {
    const template = buildMenuTemplate({ platform: 'darwin', isDevRun: false });
    expect(template[0]).toEqual({ role: 'appMenu' });
    const file = template.find((m) => m.label === 'File');
    expect(labels(file?.submenu)).toEqual([
      'Open Files…',
      'Open Folder…',
      'Clear Playlist',
      'close',
    ]);
    expect(file?.submenu?.some((i) => i.role === 'quit')).toBe(false);
    expect(template.map((m) => m.role)).toEqual(
      expect.arrayContaining(['appMenu', 'editMenu', 'windowMenu']),
    );
  });

  it.each(['win32', 'linux', 'darwin'] as const)('%s: accelerators and ids', (p) => {
    const file = buildMenuTemplate({ platform: p, isDevRun: false }).find(
      (m) => m.label === 'File',
    );
    const byLabel = new Map((file?.submenu ?? []).map((i) => [i.label, i]));
    expect(byLabel.get('Open Files…')?.accelerator).toBe('CommandOrControl+O');
    expect(byLabel.get('Open Folder…')?.accelerator).toBe('CommandOrControl+Shift+O');
    expect(byLabel.get('Clear Playlist')?.id).toBe(CLEAR_PLAYLIST_MENU_ID);
    expect(byLabel.get('Clear Playlist')?.accelerator).toBeUndefined();
    const accelerators = JSON.stringify(buildMenuTemplate({ platform: p, isDevRun: true }));
    expect(accelerators.match(/CommandOrControl\+O"/g)).toHaveLength(1);
  });

  it.each(['win32', 'linux', 'darwin'] as const)(
    '%s: Clear Playlist is disabled by default and clicks emit typed commands',
    (p) => {
      const onCommand = vi.fn();
      const file = buildMenuTemplate({ platform: p, isDevRun: false, onCommand }).find(
        (m) => m.label === 'File',
      );
      const items = file?.submenu ?? [];
      const clear = items.find((i) => i.id === CLEAR_PLAYLIST_MENU_ID);
      expect(clear?.enabled).toBe(false);
      items.find((i) => i.label === 'Open Files…')?.click?.();
      items.find((i) => i.label === 'Open Folder…')?.click?.();
      clear?.click?.();
      expect(onCommand.mock.calls.map(([c]) => c)).toEqual([
        'open-files',
        'open-folder',
        'clear-playlist',
      ]);
    },
  );

  it('honours an initial enabled state and the View menu only in a development run', () => {
    const on = buildMenuTemplate({
      platform: 'linux',
      isDevRun: false,
      clearPlaylistEnabled: true,
    });
    const clear = on
      .find((m) => m.label === 'File')
      ?.submenu?.find((i) => i.id === 'clear-playlist');
    expect(clear?.enabled).toBe(true);
    expect(on.some((m) => m.label === 'View')).toBe(false);
    expect(
      buildMenuTemplate({ platform: 'linux', isDevRun: true }).some((m) => m.label === 'View'),
    ).toBe(true);
  });

  it('installAppMenu toggles only the Clear Playlist item on the installed menu', () => {
    const item = { enabled: false };
    const built = { getMenuItemById: (id: string) => (id === 'clear-playlist' ? item : null) };
    const setApplicationMenu = vi.fn();
    const controller = installAppMenu(
      { buildFromTemplate: () => built, setApplicationMenu },
      { platform: 'linux', isDevRun: false },
    );
    expect(setApplicationMenu).toHaveBeenCalledWith(built);
    controller.setClearPlaylistEnabled(true);
    expect(item.enabled).toBe(true);
    controller.setClearPlaylistEnabled(false);
    expect(item.enabled).toBe(false);
    const missing = installAppMenu(
      { buildFromTemplate: () => ({ getMenuItemById: () => null }), setApplicationMenu },
      { platform: 'linux', isDevRun: false },
    );
    expect(() => missing.setClearPlaylistEnabled(true)).not.toThrow();
  });
});

describe('folder discovery on a real filesystem', () => {
  it('returns an empty, untruncated result for an empty folder', async () => {
    const root = await tree([]);
    expect(await scanFolder(root, scanDeps)).toEqual({ files: [], truncated: false });
  });

  it('keeps only allow-listed audio extensions, case-insensitively', async () => {
    const root = await tree([
      'a.mp3',
      'b.WAV',
      'c.Flac',
      'd.ogg',
      'e.oga',
      'f.txt',
      'g.exe',
      'h.mp3.txt',
      'i.m4a',
      'j.opus',
      'noext',
      '.mp3',
      'k.mp3.exe',
    ]);
    const { files } = await scanFolder(root, scanDeps);
    expect(rel(root, files)).toEqual(['a.mp3', 'b.WAV', 'c.Flac', 'd.ogg', 'e.oga']);
  });

  it('sorts naturally and identically on every run, files before sub-folders', async () => {
    const root = await tree([
      '10.mp3',
      '2.mp3',
      '1.mp3',
      'B.mp3',
      'a.mp3',
      'sub10/x.mp3',
      'sub2/y.mp3',
      'sub2/deep/z.mp3',
    ]);
    const first = rel(root, (await scanFolder(root, scanDeps)).files);
    expect(first).toEqual([
      '1.mp3',
      '2.mp3',
      '10.mp3',
      'a.mp3',
      'B.mp3',
      'sub2/y.mp3',
      'sub2/deep/z.mp3',
      'sub10/x.mp3',
    ]);
    for (let i = 0; i < 3; i += 1) {
      expect(rel(root, (await scanFolder(root, scanDeps)).files)).toEqual(first);
    }
  });

  it('stops at the depth limit and reports truncation', async () => {
    const root = await tree(['d0.mp3', 'a/d1.mp3', 'a/b/d2.mp3', 'a/b/c/d3.mp3']);
    const result = await scanFolder(root, { ...scanDeps, maxDepth: 2 });
    expect(rel(root, result.files)).toEqual(['d0.mp3', 'a/d1.mp3', 'a/b/d2.mp3']);
    expect(result.truncated).toBe(true);
  });

  it('stops at the file limit and reports truncation', async () => {
    const root = await tree(['1.mp3', '2.mp3', '3.mp3', '4.mp3']);
    const result = await scanFolder(root, { ...scanDeps, maxFiles: 2 });
    expect(rel(root, result.files)).toEqual(['1.mp3', '2.mp3']);
    expect(result.truncated).toBe(true);
  });

  it('rejects an unreadable or missing root and skips nothing silently for the root', async () => {
    await expect(scanFolder(path.join(base, 'does-not-exist'), scanDeps)).rejects.toBeDefined();
  });

  it('does not follow a directory symlink that points outside the chosen folder', async (ctx) => {
    const root = await tree(['inside.mp3']);
    const outside = await tree(['secret.mp3']);
    if (!(await tryLink(outside, path.join(root, 'escape'), 'dir'))) return ctx.skip();
    const { files } = await scanFolder(root, scanDeps);
    expect(rel(root, files)).toEqual(['inside.mp3']);
  });

  it('does not follow a directory symlink that points inside the folder (no duplicates)', async (ctx) => {
    const root = await tree(['real/a.mp3']);
    if (!(await tryLink(path.join(root, 'real'), path.join(root, 'alias'), 'dir'))) {
      return ctx.skip();
    }
    expect(rel(root, (await scanFolder(root, scanDeps)).files)).toEqual(['real/a.mp3']);
  });

  it('does not follow a file symlink to an audio file outside the folder', async (ctx) => {
    const root = await tree(['inside.mp3']);
    const outside = await tree(['secret.mp3']);
    if (!(await tryLink(path.join(outside, 'secret.mp3'), path.join(root, 'link.mp3'), 'file'))) {
      return ctx.skip();
    }
    expect(rel(root, (await scanFolder(root, scanDeps)).files)).toEqual(['inside.mp3']);
  });

  it('does not follow a Windows junction that points outside the folder', async (ctx) => {
    if (process.platform !== 'win32') return ctx.skip();
    const root = await tree(['inside.mp3']);
    const outside = await tree(['secret.mp3']);
    if (!(await tryLink(outside, path.join(root, 'junction'), 'junction'))) return ctx.skip();
    expect(rel(root, (await scanFolder(root, scanDeps)).files)).toEqual(['inside.mp3']);
  });

  it('terminates on a symlink cycle', async (ctx) => {
    const root = await tree(['a.mp3']);
    if (!(await tryLink(root, path.join(root, 'loop'), 'dir'))) return ctx.skip();
    expect(rel(root, (await scanFolder(root, scanDeps)).files)).toEqual(['a.mp3']);
  });
});

function wire(
  options: {
    frame?: SenderEventLike['senderFrame'];
    sender?: unknown;
    dialog?: () => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
    maxFilesFs?: boolean;
  } = {},
) {
  const listeners = new Map<string, Listener>();
  const setClearPlaylistEnabled = vi.fn();
  const showOpenDialog = vi.fn((_o: unknown) =>
    (options.dialog ?? (() => Promise.resolve({ canceled: true, filePaths: [] })))(),
  );
  const registry = createMediaRegistry();
  installIpcHandlers({
    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
    app: { getName: () => 'NecroAmp', getVersion: () => '0.0.0' },
    platform: 'linux',
    trusted: [TRUSTED],
    isRegisteredSender: (s) => s === SENDER,
    log,
    showOpenDialog,
    fs: { stat: (p) => fsp.stat(p) },
    path,
    registry,
    folder: { fs: realFs, path },
    setClearPlaylistEnabled,
    playlistPersistence: {
      load: () => Promise.resolve({ ok: true, items: [] }),
      save: () => Promise.resolve({ ok: true }),
    } as unknown as PlaylistPersistence,
  });
  const frame = options.frame === undefined ? FRAME : options.frame;
  const sender = options.sender === undefined ? SENDER : options.sender;
  const raw = (channel: string, ...args: unknown[]): Promise<unknown> =>
    (listeners.get(channel) as Listener)({ senderFrame: frame, sender }, ...args);
  const api = createNecroampApi((channel, ...args) => raw(channel, ...args));
  return { listeners, raw, api, showOpenDialog, setClearPlaylistEnabled, registry };
}

describe('library:open-folder through preload and main', () => {
  it('returns tokens and metadata only: no path, no file URL, in natural order', async () => {
    const root = await tree(['10.mp3', '2.ogg', 'readme.txt', 'sub/3.wav']);
    const { api, showOpenDialog, registry } = wire({
      dialog: () => Promise.resolve({ canceled: false, filePaths: [root] }),
    });
    const raw = await api.library.openFolder();
    const parsed = openFolderResponseSchema.parse(raw);
    expect(parsed).toMatchObject({ ok: true, data: { canceled: false, truncated: false } });
    if (!parsed.ok) throw new Error('unreachable');
    expect(parsed.data.tracks.map((t) => t.fileName)).toEqual(['2.ogg', '10.mp3', '3.wav']);
    const serialized = JSON.stringify(raw);
    expect(serialized).not.toContain(root);
    expect(serialized).not.toContain(base);
    expect(serialized).not.toMatch(/file:|[A-Za-z]:\\\\|\/tmp\//);
    for (const track of parsed.data.tracks) {
      expect(track.mediaUrl).toBe(`media://track/${track.trackId}`);
    }
    expect(registry.size).toBe(3);
    expect(showOpenDialog.mock.calls[0]?.[0]).toMatchObject({ properties: ['openDirectory'] });
  });

  it('reports an empty folder as ok, not canceled, with no tracks', async () => {
    const root = await tree(['notes.txt']);
    const { api } = wire({ dialog: () => Promise.resolve({ canceled: false, filePaths: [root] }) });
    expect(await api.library.openFolder()).toEqual({
      ok: true,
      data: { tracks: [], canceled: false, truncated: false },
    });
  });

  it('reports a canceled dialog without scanning or issuing tokens', async () => {
    const { api, registry } = wire();
    expect(await api.library.openFolder()).toEqual({
      ok: true,
      data: { tracks: [], canceled: true, truncated: false },
    });
    expect(registry.size).toBe(0);
  });

  it('returns a fixed INTERNAL error for an unreadable folder without leaking the path', async () => {
    const missing = path.join(base, 'gone', 'secret-name');
    const { api } = wire({
      dialog: () => Promise.resolve({ canceled: false, filePaths: [missing] }),
    });
    const result = await api.library.openFolder();
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('secret-name');
  });

  it('returns a fixed INTERNAL error when the dialog itself fails', async () => {
    const { api } = wire({ dialog: () => Promise.reject(new Error('C:\\Users\\x\\leak')) });
    const result = await api.library.openFolder();
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('leak');
  });

  it.each([
    ['sub-frame', { url: FRAME.url, parent: {} }, SENDER],
    ['foreign origin', { url: 'https://evil.example/', parent: null }, SENDER],
    ['destroyed frame', null, SENDER],
    ['unregistered sender', FRAME, { id: 'other' }],
  ] as const)('denies %s on both new channels without side effects', async (_n, frame, sender) => {
    const { raw, showOpenDialog, setClearPlaylistEnabled } = wire({ frame, sender });
    expect(await raw(IPC_CHANNELS.libraryOpenFolder)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(await raw(IPC_CHANNELS.menuReportState, { hasTracks: true })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(showOpenDialog).not.toHaveBeenCalled();
    expect(setClearPlaylistEnabled).not.toHaveBeenCalled();
  });

  it.each([
    ['a string path', ['/etc']],
    ['an options object', [{ defaultPath: '/etc' }]],
    ['an empty object', [{}]],
    ['null', [null]],
  ])(
    'rejects open-folder arguments (%s) with INVALID_PAYLOAD before the dialog',
    async (_n, args) => {
      const { raw, showOpenDialog } = wire();
      expect(await raw(IPC_CHANNELS.libraryOpenFolder, ...args)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PAYLOAD' },
      });
      expect(showOpenDialog).not.toHaveBeenCalled();
    },
  );
});

describe('menu:report-state', () => {
  it('applies a valid state and returns the validated response', async () => {
    const { api, setClearPlaylistEnabled } = wire();
    const result = menuReportStateResponseSchema.parse(
      await api.menu.reportPlaylistState({ hasTracks: true }),
    );
    expect(result).toEqual({ ok: true, data: { applied: true } });
    await api.menu.reportPlaylistState({ hasTracks: false });
    expect(setClearPlaylistEnabled.mock.calls).toEqual([[true], [false]]);
  });

  it.each([
    ['no arguments', []],
    ['a bare boolean', [true]],
    ['a string flag', [{ hasTracks: 'true' }]],
    ['a numeric flag', [{ hasTracks: 1 }]],
    ['a missing flag', [{}]],
    ['an unknown key', [{ hasTracks: true, enabled: true }]],
    ['an extra positional argument', [{ hasTracks: true }, 'x']],
    ['an array', [[{ hasTracks: true }]]],
  ])('rejects %s in main with INVALID_PAYLOAD and no side effect', async (_n, args) => {
    const { raw, setClearPlaylistEnabled } = wire();
    expect(await raw(IPC_CHANNELS.menuReportState, ...args)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(setClearPlaylistEnabled).not.toHaveBeenCalled();
  });

  it('is not registered unless setClearPlaylistEnabled is provided', () => {
    const listeners = new Map<string, Listener>();
    installIpcHandlers({
      ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
      app: { getName: () => 'N', getVersion: () => '0' },
      platform: 'linux',
      trusted: [TRUSTED],
      isRegisteredSender: () => true,
      log,
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      fs: { stat: (p) => fsp.stat(p) },
      path,
      registry: createMediaRegistry(),
    });
    expect(listeners.has(IPC_CHANNELS.menuReportState)).toBe(false);
    expect(listeners.has(IPC_CHANNELS.libraryOpenFolder)).toBe(false);
  });
});

describe('preload surface for the menu', () => {
  it('exposes exactly the typed members, frozen, and no raw IPC primitive', () => {
    const { api } = wire();
    expect(Object.keys(api).sort()).toEqual(['app', 'library', 'menu', 'playlist']);
    expect(Object.keys(api.menu).sort()).toEqual(['onCommand', 'reportPlaylistState']);
    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.isFrozen(api.menu)).toBe(true);
    const text = JSON.stringify(Object.keys(api)) + Object.keys(api.menu).join();
    expect(text).not.toMatch(/ipcRenderer|invoke|send|on$/i);
    expect(api).not.toHaveProperty('ipcRenderer');
  });

  it('subscribes only to the menu command event channel and validates every payload', () => {
    const handlers: Array<(payload: unknown) => void> = [];
    const channels: string[] = [];
    const unsubscribe = vi.fn();
    const api = createNecroampApi(
      () => Promise.resolve(undefined),
      (channel, listener) => {
        channels.push(channel);
        handlers.push(listener);
        return unsubscribe;
      },
    );
    const received: unknown[] = [];
    const off = api.menu.onCommand((c) => received.push(c));
    expect(channels).toEqual([IPC_EVENT_CHANNELS.menuCommand]);
    expect(Object.values(IPC_CHANNELS)).not.toContain(IPC_EVENT_CHANNELS.menuCommand);
    const push = handlers[0] as (p: unknown) => void;
    push({ command: 'open-files' });
    push({ command: 'rm -rf' });
    push({ command: 'open-folder', path: '/etc' });
    push('clear-playlist');
    push(null);
    push({ command: 'clear-playlist' });
    expect(received).toEqual([{ command: 'open-files' }, { command: 'clear-playlist' }]);
    off();
    off();
    push({ command: 'open-folder' });
    expect(received).toHaveLength(2);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('ignores a non-function listener and survives a throwing listener', () => {
    const pushes: Array<(p: unknown) => void> = [];
    const push = (p: unknown): void => pushes.forEach((h) => h(p));
    const api = createNecroampApi(
      () => Promise.resolve(undefined),
      (_c, l) => {
        pushes.push(l);
        return () => undefined;
      },
    );
    expect(() => api.menu.onCommand('nope' as never)()).not.toThrow();
    const good = vi.fn();
    api.menu.onCommand(() => {
      throw new Error('boom');
    });
    api.menu.onCommand(good);
    expect(() => push({ command: 'open-files' })).not.toThrow();
    expect(good).toHaveBeenCalledWith({ command: 'open-files' });
  });
});
