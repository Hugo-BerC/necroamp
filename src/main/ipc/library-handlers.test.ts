import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { createMediaRegistry } from '../library/media-registry';
import type { SenderEventLike } from '../security/sender-validation';
import { registerLibraryHandlers } from './library-handlers';
import type { IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;

function setup(options: {
  trusted?: boolean;
  dialog?: () => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
  stat?: (p: string) => Promise<{ isFile(): boolean }>;
}) {
  let listener: Listener | undefined;
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => {
      expect(channel).toBe(IPC_CHANNELS.libraryOpenFiles);
      listener = l;
    },
    removeHandler: vi.fn(),
  };
  const showOpenDialog = vi.fn(
    options.dialog ?? (() => Promise.resolve({ canceled: true, filePaths: [] })),
  );
  const registry = createMediaRegistry();
  registerLibraryHandlers({
    ipcMain,
    showOpenDialog,
    fs: { stat: options.stat ?? (() => Promise.resolve({ isFile: () => true })) },
    path,
    registry,
    isTrustedSender: () => options.trusted ?? true,
    log,
  });
  return {
    invoke: (...args: unknown[]) => (listener as Listener)(EVENT, ...args),
    showOpenDialog,
    registry,
  };
}

describe('library:open-files handler', () => {
  it('rejects an untrusted sender before opening the dialog (S4)', async () => {
    const { invoke, showOpenDialog } = setup({ trusted: false });
    expect(await invoke({ multiple: false })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
    expect(showOpenDialog).not.toHaveBeenCalled();
  });

  it.each([[], [{}], [{ multiple: true, path: 'C:\\x.mp3' }], ['x'], [{ multiple: 'y' }]])(
    'rejects invalid payload %j before opening the dialog',
    async (...args) => {
      const { invoke, showOpenDialog } = setup({});
      expect(await invoke(...args)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PAYLOAD' },
      });
      expect(showOpenDialog).not.toHaveBeenCalled();
    },
  );

  it('returns an empty list when the dialog is cancelled', async () => {
    const { invoke } = setup({});
    expect(await invoke({ multiple: true })).toEqual({ ok: true, data: { tracks: [] } });
  });

  it('requests single or multiple selection with an audio filter', async () => {
    const { invoke, showOpenDialog } = setup({});
    await invoke({ multiple: false });
    await invoke({ multiple: true });
    expect(
      (showOpenDialog.mock.calls as unknown as [{ properties: string[] }][])[0]?.[0].properties,
    ).toEqual(['openFile']);
    expect(
      (showOpenDialog.mock.calls as unknown as [{ properties: string[] }][])[1]?.[0].properties,
    ).toEqual(['openFile', 'multiSelections']);
    expect(
      (showOpenDialog.mock.calls as unknown as [{ filters: { extensions: string[] }[] }][])[0]?.[0]
        .filters[0]?.extensions,
    ).toEqual(['mp3', 'wav', 'flac', 'ogg', 'oga']);
  });

  it('issues tokens, returns no path and registers only accepted files', async () => {
    const good = path.join('music', 'Song One.mp3');
    const { invoke, registry } = setup({
      dialog: () =>
        Promise.resolve({
          canceled: false,
          filePaths: [good, path.join('music', 'notes.txt'), path.join('music', 'x.exe'), '.mp3'],
        }),
    });
    const result = (await invoke({ multiple: true })) as {
      ok: true;
      data: { tracks: { trackId: string; mediaUrl: string; title: string; fileName: string }[] };
    };
    expect(result.data.tracks).toHaveLength(1);
    const track = result.data.tracks[0] as (typeof result.data.tracks)[number];
    expect(track.title).toBe('Song One');
    expect(track.fileName).toBe('Song One.mp3');
    expect(track.mediaUrl).toBe(`media://track/${track.trackId}`);
    expect(registry.resolve(track.trackId)).toBe(good);
    expect(JSON.stringify(result)).not.toContain('music');
    expect(registry.size).toBe(1);
  });

  it('skips directories and unreadable paths', async () => {
    const calls: string[] = [];
    const { invoke } = setup({
      dialog: () =>
        Promise.resolve({ canceled: false, filePaths: ['dir.mp3', 'bad.mp3', 'ok.mp3'] }),
      stat: (p) => {
        calls.push(p);
        if (p === 'bad.mp3') return Promise.reject(new Error('ENOENT'));
        return Promise.resolve({ isFile: () => p !== 'dir.mp3' });
      },
    });
    const result = (await invoke({ multiple: true })) as { data: { tracks: unknown[] } };
    expect(result.data.tracks).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  it('strips control characters from names', async () => {
    const { invoke } = setup({
      dialog: () => Promise.resolve({ canceled: false, filePaths: ['a\u0007b.mp3'] }),
    });
    const result = (await invoke({ multiple: false })) as { data: { tracks: { title: string }[] } };
    expect(result.data.tracks[0]?.title).toBe('ab');
  });

  it('reports INTERNAL without leaking when the dialog throws', async () => {
    const { invoke } = setup({ dialog: () => Promise.reject(new Error('C:\\secret')) });
    const result = await invoke({ multiple: false });
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('stops issuing when the registry is full', async () => {
    let n = 0;
    const filePaths = ['a.mp3', 'b.mp3'];
    let listener: Listener | undefined;
    registerLibraryHandlers({
      ipcMain: { handle: (_c, l) => (listener = l), removeHandler: vi.fn() },
      showOpenDialog: () => Promise.resolve({ canceled: false, filePaths }),
      fs: { stat: () => Promise.resolve({ isFile: () => true }) },
      path,
      registry: createMediaRegistry(() => `00000000-0000-4000-8000-00000000000${n++}`, 1),
      isTrustedSender: () => true,
      log,
    });
    const result = (await (listener as Listener)(EVENT, { multiple: true })) as {
      data: { tracks: unknown[] };
    };
    expect(result.data.tracks).toHaveLength(1);
  });
});
