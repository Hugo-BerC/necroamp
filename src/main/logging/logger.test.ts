import { describe, expect, it, vi } from 'vitest';
import { createLogger, errorNameOf, formatLogLine } from './logger';

describe('formatLogLine', () => {
  it('prints allow-listed fields in a fixed order', () => {
    expect(formatLogLine('warn', 'ipc.invalid_sender', { channel: 'app:get-info' })).toBe(
      '[necroamp] warn ipc.invalid_sender channel=app:get-info',
    );
  });

  it('drops fields that are not allow-listed', () => {
    const fields = { reason: 'crashed', secret: 'token' } as Record<string, string>;
    expect(formatLogLine('error', 'window.crash', fields)).toBe(
      '[necroamp] error window.crash reason=crashed',
    );
  });

  it('redacts paths, free text and oversized strings', () => {
    for (const value of ['C:\\Users\\me\\file.txt', '/home/me/file', 'two words', 'x'.repeat(65)]) {
      expect(formatLogLine('info', 'e.x', { reason: value })).toBe(
        '[necroamp] info e.x reason=[redacted]',
      );
    }
  });

  it('formats numbers and rejects non-finite numbers', () => {
    expect(formatLogLine('info', 'e.x', { exitCode: 3 })).toContain('exitCode=3');
    expect(formatLogLine('info', 'e.x', { exitCode: Number.NaN })).toContain('[redacted]');
  });

  it('replaces an invalid event code', () => {
    expect(formatLogLine('info', 'C:\\secret path')).toBe('[necroamp] info invalid_event');
  });
});

describe('createLogger', () => {
  it('routes levels to the matching sink method', () => {
    const sink = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const log = createLogger(sink);
    log.info('a.b');
    log.warn('a.b');
    log.error('a.b');
    expect(sink.info).toHaveBeenCalledTimes(1);
    expect(sink.warn).toHaveBeenCalledTimes(1);
    expect(sink.error).toHaveBeenCalledTimes(1);
  });
});

describe('errorNameOf', () => {
  it('returns the error name and never the message', () => {
    expect(errorNameOf(new TypeError('C:\\secret'))).toBe('TypeError');
  });

  it('returns a fixed name for non-errors and unsafe names', () => {
    expect(errorNameOf('boom')).toBe('UnknownError');
    const odd = new Error('x');
    odd.name = 'bad name/with\\path';
    expect(errorNameOf(odd)).toBe('UnknownError');
  });
});
