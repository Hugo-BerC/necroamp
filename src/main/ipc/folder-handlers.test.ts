import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import type { SenderEventLike } from '../security/sender-validation';
import type { TrackFactory } from '../library/track-info';
import { registerFolderHandlers } from './folder-handlers';
import type { IpcMainLike } from './register-handler';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;
const ID = '11111111-1111-4111-8111-111111111111';

const file = (name: string) => ({
  name,
  isFile: () => true,
  isDirectory: () => false,
  isSymbolicLink: () => false,
});

function setup(options: {
  trusted?: boolean;
  dialog?: () => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
  readdir?: () => Promise<ReturnType<typeof file>[]>;
  fromPath?: TrackFactory['fromPath'];
}) {
  let listener: ((e: SenderEventLike, ...a: unknown[]) => Promise<unknown>) | undefined;
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => {
      expect(channel).toBe(IPC_CHANNELS.libraryOpenFolder);
      listener = l;
    },
    removeHandler: vi.fn(),
  };
  const showOpenDialog = vi.fn(
    options.dialog ?? (() => Promise.resolve({ canceled: false, filePaths: ['/music'] })),
  );
  const fromPath = vi.fn(
    options.fromPath ??
      ((p: string) =>
        Promise.resolve({
          trackId: ID,
          mediaUrl: `media://track/${ID}`,
          fileName: p.split('/').pop() ?? 'x',
          title: 't',
          artist: '',
          album: '',
          durationSec: null,
          artworkUrl: null,
          available: true,
        })),
  );
  registerFolderHandlers({
    ipcMain,
    showOpenDialog,
    fs: {
      readdir:
        options.readdir ?? (() => Promise.resolve([file('b.mp3'), file('a.mp3'), file('n.txt')])),
      realpath: (p) => Promise.resolve(p),
    },
    path: { join: (...p) => p.join('/'), extname: (p) => /\.[^.]*$/.exec(p)?.[0] ?? '', sep: '/' },
    tracks: { fromPath },
    isTrustedSender: () => options.trusted ?? true,
    log,
  });
  return {
    invoke: (...a: unknown[]) => (listener as NonNullable<typeof listener>)(EVENT, ...a),
    showOpenDialog,
    fromPath,
  };
}

describe('library:open-folder handler', () => {
  it('rejects an untrusted sender before opening the dialog', async () => {
    const { invoke, showOpenDialog } = setup({ trusted: false });
    expect(await invoke()).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
    expect(showOpenDialog).not.toHaveBeenCalled();
  });

  it('rejects arguments', async () => {
    const { invoke } = setup({});
    expect(await invoke({ path: '/etc' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
  });

  it('opens a directory-only dialog and returns tracks without paths, in natural order', async () => {
    const { invoke, showOpenDialog, fromPath } = setup({});
    const result = (await invoke()) as { ok: true; data: { tracks: unknown[]; canceled: boolean } };
    expect(showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ properties: ['openDirectory'] }),
    );
    expect(fromPath.mock.calls.map((c) => c[0])).toEqual(['/music/a.mp3', '/music/b.mp3']);
    expect(result.data).toMatchObject({ canceled: false, truncated: false });
    expect(JSON.stringify(result)).not.toContain('/music');
  });

  it('reports canceled without scanning', async () => {
    const { invoke, fromPath } = setup({
      dialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
    });
    expect(await invoke()).toEqual({
      ok: true,
      data: { tracks: [], canceled: true, truncated: false },
    });
    expect(fromPath).not.toHaveBeenCalled();
  });

  it('returns an empty, not canceled result for a folder without audio', async () => {
    const { invoke } = setup({ readdir: () => Promise.resolve([file('n.txt')]) });
    expect(await invoke()).toEqual({
      ok: true,
      data: { tracks: [], canceled: false, truncated: false },
    });
  });

  it('maps a dialog failure and an unreadable folder to INTERNAL without leaking text', async () => {
    const a = setup({ dialog: () => Promise.reject(new Error('C:\\secret')) });
    expect(await a.invoke()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    const b = setup({ readdir: () => Promise.reject(new Error('C:\\secret')) });
    const result = await b.invoke();
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('reports truncation when the registry is full and skips rejected files', async () => {
    let n = 0;
    const { invoke } = setup({
      fromPath: () => {
        n += 1;
        return Promise.resolve(n === 1 ? null : 'full');
      },
    });
    expect(await invoke()).toEqual({
      ok: true,
      data: { tracks: [], canceled: false, truncated: true },
    });
  });
});
