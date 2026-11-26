import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { appInfoResponseSchema } from '@shared/ipc';
import { createNecroampClient } from './necroamp-client';

// T6.1 / R4.9: the renderer adapter treats the bridge as untrusted. For any host and any response it
// either returns validated data or a typed failure. It never throws and never leaks the raw value.
const FAILURE_REASONS = ['unavailable', 'rejected', 'invalid-response', 'ipc-error'];

const jsonish: fc.Arbitrary<unknown> = fc.oneof(
  fc.anything(),
  fc.constant(null),
  fc.constant(undefined),
  fc.constant({ ok: true }),
  fc.constant({ ok: true, data: { name: 'NecroAmp', version: '1', platform: 'plan9' } }),
  fc.constant({ ok: false, error: { code: 'NOPE' } }),
  fc.constant(JSON.parse('{"__proto__":{"ok":true},"ok":true,"data":{}}') as unknown),
  fc.record({ ok: fc.boolean(), data: fc.anything(), error: fc.anything() }),
);

describe('createNecroampClient properties', () => {
  it('never throws for any bridge value, and unusable bridges are "unavailable"', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (bridge) => {
        const usable =
          typeof bridge === 'object' &&
          bridge !== null &&
          typeof (bridge as { app?: { getInfo?: unknown } }).app?.getInfo === 'function';
        const result = await createNecroampClient({ necroamp: bridge }).getAppInfo();
        if (!usable) expect(result).toEqual({ ok: false, reason: 'unavailable' });
        else expect(typeof result.ok).toBe('boolean');
      }),
    );
  });

  it('for any response: ok only when the shared schema accepts it, otherwise a typed failure', async () => {
    await fc.assert(
      fc.asyncProperty(jsonish, async (response) => {
        const host = { necroamp: { app: { getInfo: () => Promise.resolve(response) } } };
        const result = await createNecroampClient(host).getAppInfo();
        const parsed = appInfoResponseSchema.safeParse(response);
        if (parsed.success && parsed.data.ok) {
          expect(result).toEqual({ ok: true, data: parsed.data.data });
        } else {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(FAILURE_REASONS).toContain(result.reason);
            expect(result.reason).toBe(parsed.success ? 'ipc-error' : 'invalid-response');
          }
        }
      }),
    );
  });

  it('turns any rejection or synchronous throw into "rejected" without exposing the error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), fc.boolean(), async (reason, sync) => {
        const getInfo = (): Promise<unknown> => {
          if (sync) throw reason;
          return Promise.reject(reason);
        };
        const result = await createNecroampClient({ necroamp: { app: { getInfo } } }).getAppInfo();
        expect(result).toEqual({ ok: false, reason: 'rejected' });
      }),
    );
  });

  it('does not mutate or retain the bridge response', async () => {
    const response = Object.freeze({
      ok: true,
      data: Object.freeze({ name: 'NecroAmp', version: '0.0.1', platform: 'linux' }),
    });
    const result = await createNecroampClient({
      necroamp: { app: { getInfo: () => Promise.resolve(response) } },
    }).getAppInfo();
    expect(result).toEqual({ ok: true, data: response.data });
  });
});

describe('regression: unexpected shapes (examples)', () => {
  it.each([
    ['null', null],
    ['string', 'ok'],
    [
      'extra key',
      { ok: true, data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' }, extra: 1 },
    ],
    [
      'unknown platform',
      { ok: true, data: { name: 'NecroAmp', version: '1.0.0', platform: 'freebsd' } },
    ],
  ])('%s is handled without throwing', async (_name, response) => {
    const result = await createNecroampClient({
      necroamp: { app: { getInfo: () => Promise.resolve(response) } },
    }).getAppInfo();
    expect(typeof result.ok).toBe('boolean');
  });
});
