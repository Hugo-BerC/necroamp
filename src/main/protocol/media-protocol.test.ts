import { describe, expect, it } from 'vitest';
import { parseMediaUrl, parseRange } from './media-protocol';

const TOKEN = '123e4567-e89b-42d3-a456-426614174000';

describe('parseMediaUrl', () => {
  it('accepts track and art urls with a lower-case uuid', () => {
    expect(parseMediaUrl(`media://track/${TOKEN}`)).toEqual({
      ok: true,
      host: 'track',
      token: TOKEN,
    });
    expect(parseMediaUrl(`media://art/${TOKEN}`)).toEqual({ ok: true, host: 'art', token: TOKEN });
  });

  it.each([
    'media://other/' + TOKEN,
    `media://track/${TOKEN}/`,
    `media://track/${TOKEN}/x`,
    `media://track/${TOKEN}?a=1`,
    `media://track/${TOKEN}#x`,
    `media://user:pw@track/${TOKEN}`,
    `media://track:80/${TOKEN}`,
    `media://track/${TOKEN.toUpperCase()}`,
    'media://track/..%2f..%2fetc%2fpasswd',
    'media://track/../../etc/passwd',
    'media://track/%2e%2e',
    'media://track/C:\\Windows\\win.ini',
    `file:///${TOKEN}`,
    `app://renderer/${TOKEN}`,
    'media://track/',
    'media://track',
    '',
    `media://track/${TOKEN}\u0000`,
  ])('rejects %s', (url) => {
    expect(parseMediaUrl(url)).toEqual({ ok: false });
  });

  it('rejects non-strings and very long input', () => {
    for (const v of [undefined, null, 1, {}, []]) expect(parseMediaUrl(v)).toEqual({ ok: false });
    expect(parseMediaUrl('media://track/' + 'a'.repeat(500))).toEqual({ ok: false });
  });
});

describe('parseRange', () => {
  it('returns full for absent, malformed, multi-range and zero-size input', () => {
    expect(parseRange(null, 100)).toEqual({ kind: 'full' });
    expect(parseRange(undefined, 100)).toEqual({ kind: 'full' });
    expect(parseRange('items=0-1', 100)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=0-1,5-6', 100)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=-', 100)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=5-2', 100)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=0-1', 0)).toEqual({ kind: 'full' });
    expect(parseRange('bytes=0-1', Number.NaN)).toEqual({ kind: 'full' });
  });

  it('parses a-b, a- and -n', () => {
    expect(parseRange('bytes=0-9', 100)).toEqual({ kind: 'partial', start: 0, end: 9 });
    expect(parseRange('bytes=10-', 100)).toEqual({ kind: 'partial', start: 10, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ kind: 'partial', start: 90, end: 99 });
    expect(parseRange('bytes=-500', 100)).toEqual({ kind: 'partial', start: 0, end: 99 });
    expect(parseRange('bytes=90-500', 100)).toEqual({ kind: 'partial', start: 90, end: 99 });
  });

  it('flags unsatisfiable ranges', () => {
    expect(parseRange('bytes=100-', 100)).toEqual({ kind: 'unsatisfiable' });
    expect(parseRange('bytes=200-300', 100)).toEqual({ kind: 'unsatisfiable' });
    expect(parseRange('bytes=-0', 100)).toEqual({ kind: 'unsatisfiable' });
  });
});
