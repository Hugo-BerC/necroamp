import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import type { SenderEventLike } from '../security/sender-validation';
import { registerMenuHandlers } from './menu-handlers';
import type { IpcMainLike } from './register-handler';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;

function setup(trusted = true) {
  let listener: ((e: SenderEventLike, ...a: unknown[]) => Promise<unknown>) | undefined;
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => {
      expect(channel).toBe(IPC_CHANNELS.menuReportState);
      listener = l;
    },
    removeHandler: vi.fn(),
  };
  const setClearPlaylistEnabled = vi.fn();
  registerMenuHandlers({ ipcMain, setClearPlaylistEnabled, isTrustedSender: () => trusted, log });
  return {
    invoke: (...a: unknown[]) => (listener as NonNullable<typeof listener>)(EVENT, ...a),
    setClearPlaylistEnabled,
  };
}

describe('menu:report-state handler', () => {
  it.each([true, false])('applies hasTracks=%s', async (hasTracks) => {
    const { invoke, setClearPlaylistEnabled } = setup();
    expect(await invoke({ hasTracks })).toEqual({ ok: true, data: { applied: true } });
    expect(setClearPlaylistEnabled).toHaveBeenCalledWith(hasTracks);
  });

  it('rejects an untrusted sender without touching the menu', async () => {
    const { invoke, setClearPlaylistEnabled } = setup(false);
    expect(await invoke({ hasTracks: true })).toMatchObject({ error: { code: 'INVALID_SENDER' } });
    expect(setClearPlaylistEnabled).not.toHaveBeenCalled();
  });

  it.each([
    [],
    [{}],
    [{ hasTracks: 'yes' }],
    [{ hasTracks: true, extra: 1 }],
    [{ hasTracks: true }, 1],
  ])('rejects invalid payload %j', async (...args) => {
    const { invoke, setClearPlaylistEnabled } = setup();
    expect(await invoke(...args)).toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
    expect(setClearPlaylistEnabled).not.toHaveBeenCalled();
  });
});
