import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  IPC_ERROR_MESSAGES,
  appInfoRequestSchema,
  appInfoResponseSchema,
  appInfoSchema,
  createIpcError,
  ipcErrorCodeSchema,
  ipcErrorSchema,
  ipcResultSchema,
} from './index';
import { z } from 'zod';

// R4: malformed input never throws out of safeParse and never yields a widened value.
const validInfo = fc.record({
  name: fc.string({ minLength: 1, maxLength: 64 }),
  version: fc.string({ minLength: 1, maxLength: 64 }),
  platform: fc.constantFrom('win32', 'darwin', 'linux'),
});

describe('IPC contract properties', () => {
  it('safeParse never throws for arbitrary values', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => appInfoSchema.safeParse(value)).not.toThrow();
        expect(() => appInfoResponseSchema.safeParse(value)).not.toThrow();
        expect(() => appInfoRequestSchema.safeParse(value)).not.toThrow();
        expect(() => ipcErrorSchema.safeParse(value)).not.toThrow();
      }),
    );
  });

  it('safeParse survives hostile prototype-pollution keys without polluting', () => {
    const payload: unknown = JSON.parse(
      '{"ok":true,"data":{"name":"a","version":"1","platform":"linux","__proto__":{"x":1}}}',
    );
    expect(appInfoResponseSchema.safeParse(payload).success).toBe(false);
    expect(({} as Record<string, unknown>)['x']).toBeUndefined();
  });

  it('accepts valid AppInfo and round-trips it unchanged', () => {
    fc.assert(
      fc.property(validInfo, (info) => {
        const parsed = appInfoSchema.parse(info);
        expect(parsed).toEqual(info);
        expect(appInfoResponseSchema.parse({ ok: true, data: info })).toEqual({
          ok: true,
          data: info,
        });
      }),
    );
  });

  it('rejects any extra field on AppInfo and on the response envelope', () => {
    fc.assert(
      fc.property(
        validInfo,
        fc.string({ minLength: 1 }).filter((k) => !['name', 'version', 'platform'].includes(k)),
        fc.anything(),
        (info, key, value) => {
          const extra = Object.defineProperty({ ...info }, key, { value, enumerable: true });
          expect(appInfoSchema.safeParse(extra).success).toBe(false);
          expect(
            appInfoResponseSchema.safeParse({ ok: true, data: info, [key]: value }).success,
          ).toBe(false);
        },
      ),
    );
  });

  it('rejects out-of-bound names, versions and unknown platforms', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.string({ minLength: 65, maxLength: 200 })),
        fc.string().filter((p) => !['win32', 'darwin', 'linux'].includes(p)),
        (badText, badPlatform) => {
          expect(
            appInfoSchema.safeParse({ name: badText, version: '1', platform: 'linux' }).success,
          ).toBe(false);
          expect(
            appInfoSchema.safeParse({ name: 'a', version: badText, platform: 'linux' }).success,
          ).toBe(false);
          expect(
            appInfoSchema.safeParse({ name: 'a', version: '1', platform: badPlatform }).success,
          ).toBe(false);
        },
      ),
    );
  });

  it('the request tuple accepts only the empty argument list', () => {
    fc.assert(
      fc.property(fc.array(fc.anything(), { minLength: 1, maxLength: 5 }), (args) => {
        expect(appInfoRequestSchema.safeParse(args).success).toBe(false);
      }),
    );
    expect(appInfoRequestSchema.safeParse([]).success).toBe(true);
  });

  it('error codes outside the enum never parse; known codes always carry the fixed message', () => {
    fc.assert(
      fc.property(
        fc.string().filter((c) => !ipcErrorCodeSchema.options.includes(c as never)),
        (code) => {
          expect(ipcErrorSchema.safeParse({ code, message: 'x' }).success).toBe(false);
        },
      ),
    );
    for (const code of ipcErrorCodeSchema.options) {
      expect(createIpcError(code).message).toBe(IPC_ERROR_MESSAGES[code]);
      expect(ipcErrorSchema.safeParse(createIpcError(code)).success).toBe(true);
    }
  });

  it('the result envelope is discriminated: ok true with error, or ok false with data, never parses', () => {
    const schema = ipcResultSchema(z.number());
    fc.assert(
      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (n) => {
        expect(schema.safeParse({ ok: true, error: createIpcError('INTERNAL') }).success).toBe(
          false,
        );
        expect(schema.safeParse({ ok: false, data: n }).success).toBe(false);
        expect(schema.safeParse({ ok: true, data: n }).success).toBe(true);
      }),
    );
  });

  it('no error message in the contract carries a path or stack marker', () => {
    for (const message of Object.values(IPC_ERROR_MESSAGES)) {
      expect(message).not.toMatch(/[\\/]|\bat\s|Error:|ghp_/);
    }
  });
});
