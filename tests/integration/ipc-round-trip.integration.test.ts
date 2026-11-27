import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { appInfoResponseSchema } from '@shared/ipc';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import { createMediaRegistry } from '@main/library/media-registry';
import type { SenderEventLike } from '@main/security/sender-validation';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';

// T6.3: preload API + installIpcHandlers (registerHandler, sender validation) with fakes at the edge.
type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

const TRUSTED_SENDER: { id: string; mainFrame?: SenderEventLike['senderFrame'] } = {
  id: 'registered',
};
const log = { info: () => undefined, warn: () => undefined, error: () => undefined };

function wire(senderFrame: SenderEventLike['senderFrame'], sender: unknown, platform = 'linux') {
  // A real WebContents always has a mainFrame; the trusted sender's main frame is the frame under test.
  if (sender === TRUSTED_SENDER) TRUSTED_SENDER.mainFrame = senderFrame;
  const listeners = new Map<string, Listener>();
  const removed: string[] = [];
  const dispose = installIpcHandlers({
    ipcMain: {
      handle: (channel, l) => void listeners.set(channel, l),
      removeHandler: (channel) => void removed.push(channel),
    },
    app: { getName: () => 'NecroAmp', getVersion: () => '0.1.0' },
    platform,
    trusted: ['app://renderer'],
    isRegisteredSender: (s) => s === TRUSTED_SENDER,
    log,
    showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
    fs: { stat: () => Promise.resolve({ isFile: () => true }) },
    path,
    registry: createMediaRegistry(),
  });
  const api = createNecroampApi((channel) => {
    const listener = listeners.get(channel);
    if (listener === undefined) return Promise.reject(new Error('no handler'));
    return listener({ senderFrame, sender });
  });
  return { api, listeners, removed, dispose };
}

describe('preload <-> main IPC round trip', () => {
  it('returns app info from a trusted renderer', async () => {
    const { api } = wire({ url: 'app://renderer/index.html', parent: null }, TRUSTED_SENDER);
    const result = appInfoResponseSchema.parse(await api.app.getInfo());
    expect(result).toEqual({
      ok: true,
      data: { name: 'NecroAmp', version: '0.1.0', platform: 'linux' },
    });
  });

  it.each([
    ['sub-frame', { url: 'app://renderer/', parent: {} }, TRUSTED_SENDER],
    ['foreign origin', { url: 'https://evil.example/', parent: null }, TRUSTED_SENDER],
    ['destroyed frame', null, TRUSTED_SENDER],
    ['unregistered sender', { url: 'app://renderer/', parent: null }, { id: 'other' }],
  ] as const)('maps an untrusted sender (%s) to INVALID_SENDER', async (_n, frame, sender) => {
    const { api } = wire(frame, sender);
    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
  });

  it('rejects a top-level frame that is not the sender main frame (CF-1)', async () => {
    const { api } = wire({ url: 'app://renderer/index.html', parent: null }, TRUSTED_SENDER);
    TRUSTED_SENDER.mainFrame = { url: 'app://renderer/index.html', parent: null };
    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
  });

  it('maps an unsupported platform to INTERNAL end to end', async () => {
    const { api } = wire({ url: 'app://renderer/', parent: null }, TRUSTED_SENDER, 'freebsd');
    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
  });

  it('registers exactly the app and library channels and the disposer removes them', () => {
    const { listeners, removed, dispose } = wire(null, null);
    expect([...listeners.keys()]).toEqual(['app:get-info', 'library:open-files']);
    dispose();
    expect(removed).toEqual(['app:get-info', 'library:open-files']);
  });
});
