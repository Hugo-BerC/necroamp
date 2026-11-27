import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { createMediaRegistry } from '../library/media-registry';
import { createTrackFactory } from '../library/track-info';
import type { SenderEventLike } from '../security/sender-validation';
import type { IpcMainLike } from './register-handler';
import { registerTrackHandlers } from './track-handlers';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;
const UNKNOWN = '00000000-0000-4000-8000-000000000000';

function setup(options: { trusted?: boolean; exists?: boolean } = {}) {
  let listener: Listener | undefined;
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => {
      expect(channel).toBe(IPC_CHANNELS.libraryResolveTrack);
      listener = l;
    },
    removeHandler: vi.fn(),
  };
  const registry = createMediaRegistry();
  const tracks = createTrackFactory({
    fs: {
      stat: () =>
        options.exists === false
          ? Promise.reject(new Error('ENOENT'))
          : Promise.resolve({ isFile: () => true }),
    },
    path,
    registry,
  });
  registerTrackHandlers({
    ipcMain,
    registry,
    tracks,
    isTrustedSender: () => options.trusted ?? true,
    log,
  });
  return { registry, invoke: (...args: unknown[]) => (listener as Listener)(EVENT, ...args) };
}

describe('library:resolve-track handler', () => {
  it('denies an untrusted sender', async () => {
    const { invoke } = setup({ trusted: false });
    expect(await invoke({ trackId: UNKNOWN })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
  });

  it.each([[], [{}], [{ trackId: 'C:\\x.mp3' }], [{ trackId: UNKNOWN, path: 'x' }]])(
    'rejects invalid payload %j',
    async (...args) => {
      const { invoke } = setup();
      expect(await invoke(...args)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_PAYLOAD' },
      });
    },
  );

  it('returns refreshed info for an issued token', async () => {
    const { invoke, registry } = setup();
    const token = registry.issue(path.join('m', 'a.mp3')) as string;
    expect(await invoke({ trackId: token })).toMatchObject({
      ok: true,
      data: { track: { trackId: token, title: 'a', available: true } },
    });
  });

  it('answers unavailable for an unknown token, without issuing one', async () => {
    const { invoke, registry } = setup();
    expect(await invoke({ trackId: UNKNOWN })).toEqual({ ok: true, data: { unavailable: true } });
    expect(registry.size).toBe(0);
  });

  it('answers unavailable when the file vanished', async () => {
    const { invoke, registry } = setup({ exists: false });
    const token = registry.issue(path.join('m', 'a.mp3')) as string;
    expect(await invoke({ trackId: token })).toEqual({ ok: true, data: { unavailable: true } });
  });
});
