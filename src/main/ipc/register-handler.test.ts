import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { IPC_CHANNELS, ipcResultSchema, type IpcResult } from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

function fakeIpcMain() {
  let listener: Listener | undefined;
  const handle = vi.fn((_channel: string, l: Listener) => {
    listener = l;
  });
  const removeHandler = vi.fn((_channel: string) => undefined);
  const ipcMain: IpcMainLike = { handle, removeHandler };
  const invoke: Listener = (event, ...args) => {
    if (listener === undefined) throw new Error('not registered');
    return listener(event, ...args);
  };
  return { ipcMain, handle, removeHandler, invoke };
}
const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
const event: SenderEventLike = { senderFrame: { url: 'app://renderer/', parent: null } };

const dataSchema = z.strictObject({ value: z.number() });
const responseSchema = ipcResultSchema(dataSchema);
type Response = z.output<typeof responseSchema>;

function setup(
  overrides: {
    trusted?: (e: SenderEventLike) => boolean;
    handler?: () => Response | Promise<Response>;
  } = {},
) {
  const fake = fakeIpcMain();
  const ipcMain = fake.ipcMain;
  const log = silentLog();
  const handler = vi.fn(overrides.handler ?? ((): Response => ({ ok: true, data: { value: 1 } })));
  const dispose = registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.appGetInfo,
    requestSchema: z.tuple([]),
    responseSchema,
    handler,
    isTrustedSender: overrides.trusted ?? (() => true),
    log,
  });
  return { ipcMain: fake, log, handler, dispose };
}

describe('registerHandler', () => {
  it('registers exactly the given channel constant once', () => {
    const { ipcMain } = setup();
    expect(ipcMain.handle).toHaveBeenCalledTimes(1);
    expect(ipcMain.handle.mock.calls[0]?.[0]).toBe('app:get-info');
  });

  it('returns the handler result for a trusted sender and a valid payload', async () => {
    const { ipcMain, handler } = setup();
    await expect(ipcMain.invoke(event)).resolves.toEqual({ ok: true, data: { value: 1 } });
    expect(handler).toHaveBeenCalledWith([]);
  });

  it('rejects an untrusted sender before reading the payload or running the handler', async () => {
    const { ipcMain, handler, log } = setup({ trusted: () => false });
    const payload = {
      get secret(): never {
        throw new Error('payload was read');
      },
    };
    const result = (await ipcMain.invoke(event, payload)) as IpcResult<unknown>;
    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_SENDER', message: 'The request came from an untrusted sender.' },
    });
    expect(handler).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith('ipc.invalid_sender', { channel: 'app:get-info' });
  });

  it('treats a throwing sender check as an untrusted sender', async () => {
    const { ipcMain, handler } = setup({
      trusted: () => {
        throw new Error('boom');
      },
    });
    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_SENDER');
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([[{ a: 1 }], ['x'], [null], [undefined], [1, 2]])(
    'rejects a non-empty argument list %j with INVALID_PAYLOAD and no payload text',
    async (...args) => {
      const { ipcMain, handler, log } = setup();
      const result = (await ipcMain.invoke(event, ...args)) as IpcResult<unknown>;
      expect(result).toEqual({
        ok: false,
        error: { code: 'INVALID_PAYLOAD', message: 'The request payload is invalid.' },
      });
      expect(JSON.stringify(result)).not.toMatch(/Expected|invalid_type|too_big/i);
      expect(handler).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith('ipc.invalid_payload', { channel: 'app:get-info' });
    },
  );

  it('maps a handler exception to INTERNAL without leaking its message', async () => {
    const { ipcMain, log } = setup({
      handler: () => {
        throw new Error('C:\\Users\\me\\secret.txt');
      },
    });
    const result = await ipcMain.invoke(event);
    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL', message: 'An internal error occurred.' },
    });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(log.error).toHaveBeenCalledWith('ipc.handler_failed', { channel: 'app:get-info' });
  });

  it('maps a rejected handler promise to INTERNAL', async () => {
    const { ipcMain } = setup({ handler: () => Promise.reject(new Error('nope')) });
    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
    expect(result.ok).toBe(false);
  });

  it('maps response shape drift to INTERNAL', async () => {
    const drift = { ok: true, data: { value: 'not a number' } } as unknown as Response;
    const { ipcMain, log } = setup({ handler: () => drift });
    await expect(ipcMain.invoke(event)).resolves.toEqual({
      ok: false,
      error: { code: 'INTERNAL', message: 'An internal error occurred.' },
    });
    expect(log.error).toHaveBeenCalledWith('ipc.invalid_response', { channel: 'app:get-info' });
  });

  it('strips unknown response fields and rejects extra ones (strict schema)', async () => {
    const extra = { ok: true, data: { value: 1, leaked: 'token' } } as unknown as Response;
    const { ipcMain } = setup({ handler: () => extra });
    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('never rejects across IPC', async () => {
    const { ipcMain } = setup({
      handler: () => {
        throw new Error('x');
      },
    });
    await expect(ipcMain.invoke(event)).resolves.toBeDefined();
  });

  it('returns a disposer that removes the handler', () => {
    const { ipcMain, dispose } = setup();
    dispose();
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('app:get-info');
  });
});
