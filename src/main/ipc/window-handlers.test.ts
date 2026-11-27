import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import type { SenderEventLike } from '../security/sender-validation';
import type { IpcMainLike } from './register-handler';
import { registerWindowHandlers, type WindowControlsLike } from './window-handlers';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;
const STATE = { maximized: false, fullScreen: false, focused: true, platform: 'win32' as const };

function setup(options: { trusted?: boolean; controls?: boolean } = {}) {
  const handlers = new Map<string, (e: SenderEventLike, ...a: unknown[]) => Promise<unknown>>();
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => void handlers.set(channel, l),
    removeHandler: vi.fn(),
  };
  const controls: WindowControlsLike = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    getState: vi.fn(() => STATE),
  };
  const dispose = registerWindowHandlers({
    ipcMain,
    getControls: () => (options.controls === false ? null : controls),
    isTrustedSender: () => options.trusted !== false,
    log,
  });
  const invoke = (channel: string, ...a: unknown[]) =>
    (handlers.get(channel) as NonNullable<ReturnType<typeof handlers.get>>)(EVENT, ...a);
  return { invoke, controls, handlers, ipcMain, dispose };
}

const ACTIONS = [
  [IPC_CHANNELS.windowMinimize, 'minimize'],
  [IPC_CHANNELS.windowToggleMaximize, 'toggleMaximize'],
  [IPC_CHANNELS.windowClose, 'close'],
] as const;

describe('window handlers', () => {
  it('registers exactly four channels', () => {
    expect([...setup().handlers.keys()].sort()).toEqual(
      [
        IPC_CHANNELS.windowMinimize,
        IPC_CHANNELS.windowToggleMaximize,
        IPC_CHANNELS.windowClose,
        IPC_CHANNELS.windowGetState,
      ].sort(),
    );
  });

  it.each(ACTIONS)('%s runs only its own action', async (channel, method) => {
    const { invoke, controls } = setup();
    expect(await invoke(channel)).toEqual({ ok: true, data: { applied: true } });
    for (const name of ['minimize', 'toggleMaximize', 'close'] as const) {
      expect(controls[name]).toHaveBeenCalledTimes(name === method ? 1 : 0);
    }
  });

  it.each(ACTIONS)(
    '%s rejects any argument (no size, position or id can cross)',
    async (channel) => {
      const { invoke, controls } = setup();
      for (const args of [[{}], [{ width: 1 }], ['x'], [1, 2]]) {
        expect(await invoke(channel, ...args)).toMatchObject({
          error: { code: 'INVALID_PAYLOAD' },
        });
      }
      expect(controls.minimize).not.toHaveBeenCalled();
      expect(controls.toggleMaximize).not.toHaveBeenCalled();
      expect(controls.close).not.toHaveBeenCalled();
    },
  );

  it('window:get-state returns the snapshot', async () => {
    const { invoke } = setup();
    expect(await invoke(IPC_CHANNELS.windowGetState)).toEqual({ ok: true, data: STATE });
    expect(await invoke(IPC_CHANNELS.windowGetState, 1)).toMatchObject({
      error: { code: 'INVALID_PAYLOAD' },
    });
  });

  it.each([...ACTIONS.map(([c]) => c), IPC_CHANNELS.windowGetState])(
    '%s rejects an untrusted sender and does nothing',
    async (channel) => {
      const { invoke, controls } = setup({ trusted: false });
      expect(await invoke(channel)).toMatchObject({ error: { code: 'INVALID_SENDER' } });
      expect(controls.close).not.toHaveBeenCalled();
      expect(controls.getState).not.toHaveBeenCalled();
    },
  );

  it.each([...ACTIONS.map(([c]) => c), IPC_CHANNELS.windowGetState])(
    '%s answers INTERNAL when there is no window',
    async (channel) => {
      const { invoke } = setup({ controls: false });
      expect(await invoke(channel)).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    },
  );

  it('removes every handler on dispose', () => {
    const { dispose, ipcMain } = setup();
    dispose();
    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(4);
  });
});
