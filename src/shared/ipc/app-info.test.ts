import { describe, expect, it } from 'vitest';
import {
  appInfoRequestSchema,
  appInfoResponseSchema,
  appInfoSchema,
  platformSchema,
} from './app-info';
import { createIpcError } from './result';

const valid = { name: 'NecroAmp', version: '0.1.0', platform: 'win32' } as const;

describe('platformSchema', () => {
  it('allows only win32, darwin and linux', () => {
    for (const p of ['win32', 'darwin', 'linux'])
      expect(platformSchema.safeParse(p).success).toBe(true);
    for (const p of ['freebsd', 'WIN32', '', 1, null])
      expect(platformSchema.safeParse(p).success).toBe(false);
  });
});

describe('appInfoRequestSchema', () => {
  it('accepts no arguments only', () => {
    expect(appInfoRequestSchema.safeParse([]).success).toBe(true);
    expect(appInfoRequestSchema.safeParse([1]).success).toBe(false);
    expect(appInfoRequestSchema.safeParse([undefined]).success).toBe(false);
    expect(appInfoRequestSchema.safeParse({}).success).toBe(false);
    expect(appInfoRequestSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('appInfoSchema', () => {
  it('accepts a valid value and bounds at 64 characters', () => {
    expect(appInfoSchema.safeParse(valid).success).toBe(true);
    expect(appInfoSchema.safeParse({ ...valid, name: 'a'.repeat(64) }).success).toBe(true);
  });

  it.each([
    { ...valid, name: '' },
    { ...valid, name: 'a'.repeat(65) },
    { ...valid, version: '' },
    { ...valid, version: 'v'.repeat(65) },
    { ...valid, platform: 'sunos' },
    { ...valid, extra: true },
    { name: 'NecroAmp', version: '1' },
    null,
    'text',
    [],
  ])('rejects %j', (input) => {
    expect(appInfoSchema.safeParse(input).success).toBe(false);
  });
});

describe('appInfoResponseSchema', () => {
  it('accepts success and controlled error results', () => {
    expect(appInfoResponseSchema.safeParse({ ok: true, data: valid }).success).toBe(true);
    expect(
      appInfoResponseSchema.safeParse({ ok: false, error: createIpcError('INVALID_SENDER') })
        .success,
    ).toBe(true);
  });

  it('rejects a success result with bad data and an error with extra keys', () => {
    expect(
      appInfoResponseSchema.safeParse({ ok: true, data: { ...valid, platform: 'x' } }).success,
    ).toBe(false);
    expect(
      appInfoResponseSchema.safeParse({
        ok: false,
        error: { code: 'INTERNAL', message: 'm', cause: 'c' },
      }).success,
    ).toBe(false);
  });
});
