import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { FOUNDATION_MANIFEST } from '../skins/foundation-manifest';
import type { SkinService } from '../skins/skin-service';
import type { SenderEventLike } from '../security/sender-validation';
import type { IpcMainLike } from './register-handler';
import { registerSkinsHandlers } from './skins-handlers';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;

const ACTIVE = {
  activeId: 'foundation',
  requestedId: null,
  fallbackReason: 'none-selected' as const,
  skin: { manifest: FOUNDATION_MANIFEST, assetUrls: {} },
};

function setup(trusted = true) {
  const handlers = new Map<string, (e: SenderEventLike, ...a: unknown[]) => Promise<unknown>>();
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => void handlers.set(channel, l),
    removeHandler: vi.fn(),
  };
  const skins = {
    list: vi.fn(() => ({
      skins: [
        {
          id: 'foundation',
          name: 'Foundation',
          version: '1.0.0',
          author: 'NecroAmp',
          description: 'x',
          origin: 'embedded' as const,
          status: 'ok' as const,
          errorCodes: [],
        },
      ],
      activeId: 'foundation',
    })),
    getActive: vi.fn(() => ACTIVE),
    setActive: vi.fn(() =>
      Promise.resolve({ applied: true as const, active: ACTIVE, persisted: true }),
    ),
  } satisfies Pick<SkinService, 'list' | 'getActive' | 'setActive'>;
  const dispose = registerSkinsHandlers({ ipcMain, skins, isTrustedSender: () => trusted, log });
  const invoke = (channel: string, ...a: unknown[]) =>
    (handlers.get(channel) as NonNullable<ReturnType<typeof handlers.get>>)(EVENT, ...a);
  return { invoke, skins, handlers, ipcMain, dispose };
}

describe('skins handlers', () => {
  it('registers exactly the three skins channels', () => {
    const { handlers } = setup();
    expect([...handlers.keys()].sort()).toEqual(
      [IPC_CHANNELS.skinsGetActive, IPC_CHANNELS.skinsList, IPC_CHANNELS.skinsSetActive].sort(),
    );
  });

  it('skins:list returns the service listing', async () => {
    const { invoke } = setup();
    expect(await invoke(IPC_CHANNELS.skinsList)).toMatchObject({
      ok: true,
      data: { activeId: 'foundation' },
    });
  });

  it('skins:get-active returns the resolved skin', async () => {
    const { invoke } = setup();
    expect(await invoke(IPC_CHANNELS.skinsGetActive)).toMatchObject({
      ok: true,
      data: { activeId: 'foundation', fallbackReason: 'none-selected' },
    });
  });

  it('skins:set-active forwards only the id, marked as renderer-initiated', async () => {
    const { invoke, skins } = setup();
    const res = await invoke(IPC_CHANNELS.skinsSetActive, { skinId: 'foundation' });
    expect(res).toMatchObject({ ok: true, data: { applied: true, persisted: true } });
    expect(skins.setActive).toHaveBeenCalledWith('foundation', 'renderer');
  });

  it('passes a refusal through unchanged', async () => {
    const { invoke, skins } = setup();
    skins.setActive.mockResolvedValueOnce({ applied: false, reason: 'unknown-skin' } as never);
    expect(await invoke(IPC_CHANNELS.skinsSetActive, { skinId: 'ghost' })).toEqual({
      ok: true,
      data: { applied: false, reason: 'unknown-skin' },
    });
  });

  it.each([
    [],
    [{}],
    [{ skinId: 7 }],
    [{ skinId: '../../etc/passwd' }],
    [{ skinId: 'C:\\skins\\x' }],
    [{ skinId: 'Upper' }],
    [{ skinId: 'ok', path: 'C:/x' }],
    [{ skinId: 'ok' }, 'extra'],
    ['foundation'],
  ])('skins:set-active rejects payload %j without calling the service', async (...args) => {
    const { invoke, skins } = setup();
    expect(await invoke(IPC_CHANNELS.skinsSetActive, ...args)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(skins.setActive).not.toHaveBeenCalled();
  });

  it.each([IPC_CHANNELS.skinsList, IPC_CHANNELS.skinsGetActive])(
    '%s rejects arguments',
    async (channel) => {
      const { invoke } = setup();
      expect(await invoke(channel, 'x')).toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
    },
  );

  it.each([IPC_CHANNELS.skinsList, IPC_CHANNELS.skinsGetActive, IPC_CHANNELS.skinsSetActive])(
    '%s rejects an untrusted sender',
    async (channel) => {
      const { invoke, skins } = setup(false);
      expect(await invoke(channel, { skinId: 'foundation' })).toMatchObject({
        error: { code: 'INVALID_SENDER' },
      });
      expect(skins.setActive).not.toHaveBeenCalled();
    },
  );

  it('answers INTERNAL, without error text, when the service throws', async () => {
    const { invoke, skins } = setup();
    skins.getActive.mockImplementationOnce(() => {
      throw new Error('C:\\secret\\path');
    });
    const res = await invoke(IPC_CHANNELS.skinsGetActive);
    expect(res).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(res)).not.toContain('secret');
  });

  it('answers INTERNAL when the service returns a payload that breaks the contract', async () => {
    const { invoke, skins } = setup();
    skins.getActive.mockReturnValueOnce({ ...ACTIVE, extra: 1 } as never);
    expect(await invoke(IPC_CHANNELS.skinsGetActive)).toMatchObject({
      error: { code: 'INTERNAL' },
    });
  });

  it('removes every handler on dispose', () => {
    const { dispose, ipcMain } = setup();
    dispose();
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(3);
  });
});
