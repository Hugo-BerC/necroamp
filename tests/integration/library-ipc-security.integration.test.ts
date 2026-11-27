import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, openFilesResponseSchema, trackInfoSchema } from '@shared/ipc';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import type { OpenDialogOptions } from '@main/ipc/library-handlers';
import { createMediaRegistry } from '@main/library/media-registry';
import type { SenderEventLike } from '@main/security/sender-validation';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';

// Block A IPC security: preload -> installIpcHandlers -> library handler, with only Electron faked.
// The renderer may choose single or multiple selection and nothing else.

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

const FRAME = { url: 'app://renderer/index.html', parent: null };
const SENDER = { id: 'registered', mainFrame: FRAME };
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const SECRET_PATH = '/home/user/private/Song.Name.mp3';

function wire(
  options: {
    frame?: SenderEventLike['senderFrame'];
    sender?: unknown;
    files?: readonly string[];
    dialog?: () => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
  } = {},
) {
  const listeners = new Map<string, Listener>();
  const showOpenDialog = vi.fn((_options: OpenDialogOptions) =>
    (
      options.dialog ?? (() => Promise.resolve({ canceled: false, filePaths: options.files ?? [] }))
    )(),
  );
  const registry = createMediaRegistry();
  installIpcHandlers({
    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
    app: { getName: () => 'NecroAmp', getVersion: () => '0.0.0' },
    platform: 'linux',
    trusted: ['app://renderer'],
    isRegisteredSender: (s) => s === SENDER,
    log,
    showOpenDialog,
    fs: { stat: () => Promise.resolve({ isFile: () => true }) },
    path: path.posix,
    registry,
  });
  const frame = options.frame === undefined ? FRAME : options.frame;
  const sender = options.sender === undefined ? SENDER : options.sender;
  const raw = (...args: unknown[]): Promise<unknown> =>
    (listeners.get(IPC_CHANNELS.libraryOpenFiles) as Listener)(
      { senderFrame: frame, sender },
      ...args,
    );
  const api = createNecroampApi((channel, ...args) => {
    const listener = listeners.get(channel);
    if (listener === undefined) return Promise.reject(new Error('no handler'));
    return listener({ senderFrame: frame, sender }, ...args);
  });
  return { api, raw, showOpenDialog, registry };
}

describe('library:open-files sender validation', () => {
  it.each([
    ['sub-frame', { url: FRAME.url, parent: {} }, SENDER],
    ['foreign origin', { url: 'https://evil.example/', parent: null }, SENDER],
    ['destroyed frame', null, SENDER],
    ['unregistered sender', FRAME, { id: 'other' }],
  ] as const)('denies %s without opening the dialog', async (_name, frame, sender) => {
    const { raw, showOpenDialog, registry } = wire({ frame, sender, files: [SECRET_PATH] });
    expect(await raw({ multiple: true })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(showOpenDialog).not.toHaveBeenCalled();
    expect(registry.size).toBe(0);
  });

  it('denies before parsing: an invalid payload from an untrusted sender is INVALID_SENDER', async () => {
    const { raw } = wire({ frame: null });
    expect(await raw('not an object')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
  });
});

describe('library:open-files Zod rejection', () => {
  it.each([
    ['no arguments', []],
    ['null', [null]],
    ['a string path', ['/etc/passwd']],
    ['an empty object', [{}]],
    ['a non-boolean flag', [{ multiple: 'yes' }]],
    ['a numeric flag', [{ multiple: 1 }]],
    ['an unknown key', [{ multiple: false, defaultPath: '/etc' }]],
    ['a filters key', [{ multiple: false, filters: [{ name: 'x', extensions: ['*'] }] }]],
    ['an options override', [{ multiple: false, properties: ['openDirectory'] }]],
    ['an extra positional argument', [{ multiple: false }, '/etc/passwd']],
    ['an array', [[{ multiple: false }]]],
  ])('rejects %s with INVALID_PAYLOAD and does not open the dialog', async (_name, args) => {
    const { raw, showOpenDialog } = wire({ files: [SECRET_PATH] });
    expect(await raw(...args)).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
    expect(showOpenDialog).not.toHaveBeenCalled();
  });

  it('does not let a prototype-polluted payload reach the dialog', async () => {
    const { raw, showOpenDialog } = wire();
    const payload = JSON.parse('{"multiple":false,"__proto__":{"defaultPath":"/etc"}}') as unknown;
    const result = await raw(payload);
    expect(result).toMatchObject({ ok: false });
    expect(showOpenDialog).not.toHaveBeenCalled();
  });
});

describe('library:open-files dialog options and results', () => {
  it('forces the dialog to file selection with an audio-only filter, whatever the renderer asks', async () => {
    const { api, showOpenDialog } = wire({ files: [] });
    await api.library.openFiles({ multiple: false });
    await api.library.openFiles({ multiple: true });
    const [single, multi] = showOpenDialog.mock.calls.map(([o]) => o);
    expect(single?.properties).toEqual(['openFile']);
    expect(multi?.properties).toEqual(['openFile', 'multiSelections']);
    for (const options of [single, multi]) {
      expect(options?.filters).toEqual([
        { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'ogg', 'oga'] },
      ]);
      expect(options?.properties).not.toContain('openDirectory');
    }
  });

  it('returns tokens and a media URL but never the path, and the result passes the schema', async () => {
    const { api, registry } = wire({ files: [SECRET_PATH] });
    const result = openFilesResponseSchema.parse(await api.library.openFiles({ multiple: false }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [track] = result.data.tracks;
    expect(track).toBeDefined();
    expect(trackInfoSchema.safeParse(track).success).toBe(true);
    expect(track?.mediaUrl).toBe(`media://track/${track?.trackId}`);
    expect(registry.resolve(track?.trackId as string)).toBe(SECRET_PATH);
    expect(JSON.stringify(result)).not.toContain('private');
    expect(JSON.stringify(result)).not.toContain('/home');
    expect(track?.title).toBe('Song.Name');
  });

  it('strips control characters from file names', async () => {
    const { api } = wire({ files: ['/music/ev\u0000il\u001b[31m\nname.mp3'] });
    const result = openFilesResponseSchema.parse(await api.library.openFiles({ multiple: false }));
    if (!result.ok) throw new Error('expected ok');
    const [track] = result.data.tracks;
    // eslint-disable-next-line no-control-regex -- asserting that control characters are gone
    expect(`${track?.fileName}${track?.title}`).not.toMatch(/[\u0000-\u001f\u007f]/);
  });

  it('filters out entries with a disallowed extension even if the dialog returns them', async () => {
    const { api, registry } = wire({
      files: ['/a/b.exe', '/a/b.txt', '/a/b', '/a/.mp3x', '/a/b.mp3.exe', '/a/b.MP3'],
    });
    const result = openFilesResponseSchema.parse(await api.library.openFiles({ multiple: true }));
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.tracks.map((t) => t.fileName)).toEqual(['b.MP3']);
    expect(registry.size).toBe(1);
  });

  it('returns an empty list on cancel and issues no token', async () => {
    const { api, registry } = wire({
      dialog: () => Promise.resolve({ canceled: true, filePaths: [SECRET_PATH] }),
    });
    expect(await api.library.openFiles({ multiple: true })).toEqual({
      ok: true,
      data: { tracks: [] },
    });
    expect(registry.size).toBe(0);
  });

  it('maps a failing dialog to INTERNAL without leaking the exception text', async () => {
    const { api } = wire({ dialog: () => Promise.reject(new Error('boom /secret/path')) });
    const result = await api.library.openFiles({ multiple: false });
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('secret');
    for (const call of [...log.info.mock.calls, ...log.warn.mock.calls, ...log.error.mock.calls]) {
      expect(JSON.stringify(call)).not.toContain('/secret/path');
    }
  });

  it('caps the number of tracks one call can register', async () => {
    const files = Array.from({ length: 5100 }, (_v, i) => `/m/${String(i)}.mp3`);
    const { api, registry } = wire({ files });
    const result = openFilesResponseSchema.parse(await api.library.openFiles({ multiple: true }));
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.tracks.length).toBeLessThanOrEqual(5000);
    expect(registry.size).toBeLessThanOrEqual(5000);
  });

  it('reuses one token per path so repeated opens do not grow the registry', async () => {
    const { api, registry } = wire({ files: [SECRET_PATH] });
    await api.library.openFiles({ multiple: false });
    await api.library.openFiles({ multiple: false });
    expect(registry.size).toBe(1);
  });
});

describe('preload API surface', () => {
  it('exposes only app.getInfo and library.openFiles, with no generic sender', () => {
    const { api } = wire();
    expect(Object.keys(api).sort()).toEqual(['app', 'library']);
    expect(Object.keys(api.library)).toEqual(['openFiles']);
    expect(JSON.stringify(Object.keys(api))).not.toMatch(/ipc|invoke|send|fs|path/i);
  });
});
