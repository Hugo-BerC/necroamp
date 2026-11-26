import { describe, expect, it, vi } from 'vitest';
import { createNecroampClient } from './necroamp-client';

const GOOD = { name: 'NecroAmp', version: '0.0.0', platform: 'win32' } as const;

function hostWith(getInfo: () => unknown) {
  return { necroamp: { app: { getInfo } } };
}

describe('createNecroampClient', () => {
  it('reports unavailable when the bridge is missing', async () => {
    expect(await createNecroampClient({}).getAppInfo()).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it.each([null, 'x', 1, {}, { app: null }, { app: {} }, { app: { getInfo: 'nope' } }])(
    'reports unavailable for a malformed bridge %j',
    async (bridge) => {
      const result = await createNecroampClient({ necroamp: bridge }).getAppInfo();
      expect(result).toEqual({ ok: false, reason: 'unavailable' });
    },
  );

  it('returns parsed data for a valid success response', async () => {
    const client = createNecroampClient(hostWith(() => Promise.resolve({ ok: true, data: GOOD })));
    expect(await client.getAppInfo()).toEqual({ ok: true, data: GOOD });
  });

  it('maps an ok:false envelope to ipc-error with its code', async () => {
    const error = { code: 'INVALID_SENDER', message: 'The request came from an untrusted sender.' };
    const client = createNecroampClient(hostWith(() => Promise.resolve({ ok: false, error })));
    expect(await client.getAppInfo()).toEqual({
      ok: false,
      reason: 'ipc-error',
      code: 'INVALID_SENDER',
    });
  });

  it.each([
    ['null', null],
    ['a string', 'ok'],
    ['an unknown field', { ok: true, data: GOOD, extra: 1 }],
    ['an unknown data field', { ok: true, data: { ...GOOD, path: 'C:/x' } }],
    ['a bad platform', { ok: true, data: { ...GOOD, platform: 'freebsd' } }],
    ['a missing version', { ok: true, data: { name: 'NecroAmp', platform: 'linux' } }],
    ['an unknown error code', { ok: false, error: { code: 'OTHER', message: 'x' } }],
  ])('rejects %s as invalid-response', async (_label, value) => {
    const client = createNecroampClient(hostWith(() => Promise.resolve(value)));
    expect(await client.getAppInfo()).toEqual({ ok: false, reason: 'invalid-response' });
  });

  it('maps a rejection to rejected without leaking the error', async () => {
    const client = createNecroampClient(
      hostWith(() => Promise.reject(new Error('C:/secret/path'))),
    );
    const result = await client.getAppInfo();
    expect(result).toEqual({ ok: false, reason: 'rejected' });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('maps a synchronous throw to rejected', async () => {
    const client = createNecroampClient(
      hostWith(() => {
        throw new Error('boom');
      }),
    );
    expect(await client.getAppInfo()).toEqual({ ok: false, reason: 'rejected' });
  });

  it('calls getInfo with no arguments and keeps the namespace as this', async () => {
    const getInfo = vi.fn(function (this: unknown, ...args: unknown[]) {
      expect(args).toHaveLength(0);
      expect(this).toBe(app);
      return Promise.resolve({ ok: true, data: GOOD });
    });
    const app = { getInfo };
    await createNecroampClient({ necroamp: { app } }).getAppInfo();
    expect(getInfo).toHaveBeenCalledTimes(1);
  });
});
