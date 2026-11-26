import { describe, expect, it, vi } from 'vitest';
import { appInfoResponseSchema } from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerAppHandlers } from './app-handlers';
import { installIpcHandlers } from './install-ipc';
import type { IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

function fakeIpcMain(): IpcMainLike & { channels: string[]; invoke: Listener; removed: string[] } {
  const listeners = new Map<string, Listener>();
  const removed: string[] = [];
  return {
    channels: [],
    removed,
    handle(channel, listener) {
      this.channels.push(channel);
      listeners.set(channel, listener);
    },
    removeHandler: (channel) => {
      removed.push(channel);
    },
    invoke: (event, ...args) => {
      const listener = listeners.get('app:get-info');
      if (listener === undefined) throw new Error('not registered');
      return listener(event, ...args);
    },
  };
}

const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
const app = { getName: () => 'NecroAmp', getVersion: () => '0.0.0' };
const goodEvent: SenderEventLike = {
  senderFrame: { url: 'app://renderer/index.html', parent: null },
  sender: 'main',
};

describe('registerAppHandlers', () => {
  it('returns name, version and platform to a trusted sender', async () => {
    const ipcMain = fakeIpcMain();
    registerAppHandlers({
      ipcMain,
      app,
      platform: 'linux',
      isTrustedSender: () => true,
      log: silentLog(),
    });
    const result = await ipcMain.invoke(goodEvent);
    expect(result).toEqual({
      ok: true,
      data: { name: 'NecroAmp', version: '0.0.0', platform: 'linux' },
    });
    expect(appInfoResponseSchema.safeParse(result).success).toBe(true);
  });

  it.each(['win32', 'darwin', 'linux'])('supports %s', async (platform) => {
    const ipcMain = fakeIpcMain();
    registerAppHandlers({ ipcMain, app, platform, isTrustedSender: () => true, log: silentLog() });
    expect(await ipcMain.invoke(goodEvent)).toMatchObject({ ok: true, data: { platform } });
  });

  it.each(['freebsd', 'aix', ''])(
    'returns INTERNAL for unsupported platform %s',
    async (platform) => {
      const ipcMain = fakeIpcMain();
      registerAppHandlers({
        ipcMain,
        app,
        platform,
        isTrustedSender: () => true,
        log: silentLog(),
      });
      expect(await ipcMain.invoke(goodEvent)).toMatchObject({
        ok: false,
        error: { code: 'INTERNAL' },
      });
    },
  );

  it('returns INTERNAL when the app name violates the contract bounds', async () => {
    const ipcMain = fakeIpcMain();
    registerAppHandlers({
      ipcMain,
      app: { getName: () => 'x'.repeat(65), getVersion: () => '1' },
      platform: 'linux',
      isTrustedSender: () => true,
      log: silentLog(),
    });
    expect(await ipcMain.invoke(goodEvent)).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL' },
    });
  });
});

describe('installIpcHandlers', () => {
  const trusted = ['app://renderer'];
  const make = (isRegisteredSender: (s: unknown) => boolean) => {
    const ipcMain = fakeIpcMain();
    const dispose = installIpcHandlers({
      ipcMain,
      app,
      platform: 'win32',
      trusted,
      isRegisteredSender,
      log: silentLog(),
    });
    return { ipcMain, dispose };
  };

  it('registers only the app:get-info channel', () => {
    expect(make(() => true).ipcMain.channels).toEqual(['app:get-info']);
  });

  it('accepts the registered top frame on a trusted origin', async () => {
    const { ipcMain } = make((sender) => sender === 'main');
    expect(await ipcMain.invoke(goodEvent)).toMatchObject({ ok: true });
  });

  it.each([
    ['null frame', { senderFrame: null, sender: 'main' }],
    ['sub-frame', { senderFrame: { url: 'app://renderer/', parent: {} }, sender: 'main' }],
    ['untrusted url', { senderFrame: { url: 'https://evil.test/', parent: null }, sender: 'main' }],
    ['file url', { senderFrame: { url: 'file:///C:/x.html', parent: null }, sender: 'main' }],
    [
      'unregistered sender',
      { senderFrame: { url: 'app://renderer/', parent: null }, sender: 'other' },
    ],
  ] as const)('rejects %s with INVALID_SENDER', async (_name, event) => {
    const { ipcMain } = make((sender) => sender === 'main');
    expect(await ipcMain.invoke(event)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SENDER' },
    });
  });

  it('removes the handler on dispose', () => {
    const { ipcMain, dispose } = make(() => true);
    dispose();
    expect(ipcMain.removed).toEqual(['app:get-info']);
  });
});
