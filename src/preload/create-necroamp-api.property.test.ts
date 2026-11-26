import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS, appInfoResponseSchema, type IpcChannel } from '@shared/ipc';
import { createNecroampApi } from './create-necroamp-api';

const SECRET = 'C:\\Users\\victim\\ghp_FAKE_TOKEN';

describe('preload API exposure boundary (properties)', () => {
  it('getInfo resolves to a valid IpcResult for any raw reply and never rejects', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (reply) => {
        const api = createNecroampApi(() => Promise.resolve(reply));
        const result = await api.app.getInfo();
        expect(appInfoResponseSchema.safeParse(result).success).toBe(true);
      }),
    );
  });

  it('a transport failure with any thrown value resolves to INTERNAL without leaking its text', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (thrown) => {
        const api = createNecroampApi(() => Promise.reject(thrown ?? new Error(SECRET)));
        const result = await api.app.getInfo();
        expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
        expect(JSON.stringify(result)).not.toContain('victim');
      }),
    );
  });

  it('any call with arguments is INVALID_PAYLOAD and never reaches invoke', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.anything(), { minLength: 1, maxLength: 4 }), async (args) => {
        let calls = 0;
        const api = createNecroampApi(() => {
          calls += 1;
          return Promise.resolve(undefined);
        });
        const getInfo = api.app.getInfo as (...a: unknown[]) => Promise<unknown>;
        const result = await getInfo(...args);
        expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
        expect(calls).toBe(0);
      }),
    );
  });

  it('only channels from IPC_CHANNELS are ever invoked', async () => {
    const seen: IpcChannel[] = [];
    const api = createNecroampApi((channel) => {
      seen.push(channel);
      return Promise.resolve(undefined);
    });
    await api.app.getInfo();
    expect(seen).toEqual([IPC_CHANNELS.appGetInfo]);
  });

  it('a reply with an extra field or widened value never passes through verbatim', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), fc.anything(), async (key, value) => {
        fc.pre(!['ok', 'data'].includes(key));
        const reply = {
          ok: true,
          data: { name: 'N', version: '1', platform: 'linux' },
          [key]: value,
        };
        const api = createNecroampApi(() => Promise.resolve(reply));
        expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
      }),
    );
  });
});
