import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  IPC_ERROR_MESSAGES,
  createIpcError,
  ipcErrorCodeSchema,
  ipcErrorSchema,
  ipcResultSchema,
} from './result';

describe('ipcErrorSchema', () => {
  it('accepts every code with its fixed message', () => {
    for (const code of ipcErrorCodeSchema.options) {
      expect(ipcErrorSchema.safeParse(createIpcError(code)).success).toBe(true);
    }
  });

  it('rejects unknown codes, extra keys and long messages', () => {
    expect(ipcErrorSchema.safeParse({ code: 'NOPE', message: 'x' }).success).toBe(false);
    expect(ipcErrorSchema.safeParse({ code: 'INTERNAL', message: 'x', stack: 's' }).success).toBe(
      false,
    );
    expect(ipcErrorSchema.safeParse({ code: 'INTERNAL', message: 'x'.repeat(121) }).success).toBe(
      false,
    );
  });

  it('keeps fixed messages within bounds and free of path separators', () => {
    for (const message of Object.values(IPC_ERROR_MESSAGES)) {
      expect(message.length).toBeLessThanOrEqual(120);
      expect(message).not.toMatch(/[\\/]/);
    }
  });
});

describe('ipcResultSchema', () => {
  const schema = ipcResultSchema(z.strictObject({ n: z.number() }));

  it('accepts ok and error results', () => {
    expect(schema.safeParse({ ok: true, data: { n: 1 } }).success).toBe(true);
    expect(schema.safeParse({ ok: false, error: createIpcError('INTERNAL') }).success).toBe(true);
  });

  it.each([
    null,
    undefined,
    'str',
    42,
    [],
    {},
    { ok: true },
    { ok: true, data: { n: 'x' } },
    { ok: true, data: { n: 1 }, extra: 1 },
    { ok: false },
    { ok: false, error: { code: 'INTERNAL' } },
    { ok: false, error: createIpcError('INTERNAL'), data: { n: 1 } },
    { ok: 'true', data: { n: 1 } },
  ])('rejects malformed result %j', (input) => {
    expect(schema.safeParse(input).success).toBe(false);
  });
});
