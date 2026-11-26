import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, IPC_ERROR_MESSAGES } from '@shared/ipc';
import { createNecroampApi } from './create-necroamp-api';

const VALID = { ok: true, data: { name: 'NecroAmp', version: '0.1.0', platform: 'win32' } };

describe('createNecroampApi exposure boundary', () => {
  const api = createNecroampApi(() => Promise.resolve(VALID));

  it('exposes exactly app.getInfo', () => {
    expect(Object.keys(api)).toEqual(['app']);
    expect(Object.keys(api.app)).toEqual(['getInfo']);
    expect(typeof api.app.getInfo).toBe('function');
  });

  it('is frozen at every level', () => {
    expect(Object.isFrozen(api)).toBe(true);
    expect(Object.isFrozen(api.app)).toBe(true);
  });

  it('leaks no ipcRenderer, invoke, send or on', () => {
    const json = Object.keys(api).concat(Object.keys(api.app)).join(',');
    for (const forbidden of ['ipcRenderer', 'invoke', 'send', 'on', 'require', 'process']) {
      expect(json).not.toContain(forbidden);
    }
    expect('ipcRenderer' in api).toBe(false);
  });
});

describe('getInfo', () => {
  it('invokes only the app:get-info channel with no payload', async () => {
    const invoke = vi.fn(() => Promise.resolve(VALID));
    const result = await createNecroampApi(invoke).app.getInfo();
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.appGetInfo);
    expect(result).toEqual(VALID);
  });

  it('rejects extra arguments before invoking', async () => {
    const invoke = vi.fn(() => Promise.resolve(VALID));
    const call = createNecroampApi(invoke).app.getInfo as (...a: unknown[]) => Promise<unknown>;
    const result = await call('../secret');
    expect(invoke).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_PAYLOAD', message: IPC_ERROR_MESSAGES.INVALID_PAYLOAD },
    });
  });

  it('passes through a shared error result from main', async () => {
    const error = { code: 'INVALID_SENDER', message: IPC_ERROR_MESSAGES.INVALID_SENDER };
    const result = await createNecroampApi(() =>
      Promise.resolve({ ok: false, error }),
    ).app.getInfo();
    expect(result).toEqual({ ok: false, error });
  });

  it.each([
    ['null', null],
    ['a string', 'x'],
    ['unknown platform', { ok: true, data: { name: 'a', version: '1', platform: 'sunos' } }],
    [
      'extra field',
      { ok: true, data: { name: 'a', version: '1', platform: 'linux', path: 'C:\\x' } },
    ],
    ['unknown error code', { ok: false, error: { code: 'EPERM', message: 'm' } }],
  ])('maps a malformed response (%s) to INTERNAL', async (_name, raw) => {
    const result = await createNecroampApi(() => Promise.resolve(raw)).app.getInfo();
    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
    });
  });

  it('maps a transport rejection to INTERNAL without leaking its text', async () => {
    const api = createNecroampApi(() => Promise.reject(new Error('ENOENT C:\\Users\\me\\secret')));
    const result = await api.app.getInfo();
    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
    });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('returns a fresh object per error so callers cannot mutate shared state', async () => {
    const api = createNecroampApi(() => Promise.reject(new Error('x')));
    const a = (await api.app.getInfo()) as { error: { message: string } };
    a.error.message = 'changed';
    const b = (await api.app.getInfo()) as { error: { message: string } };
    expect(b.error.message).toBe(IPC_ERROR_MESSAGES.INTERNAL);
  });
});
