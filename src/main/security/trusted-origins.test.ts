import { describe, expect, it } from 'vitest';
import { isTrustedUrl, originOf, parseDevOrigin, resolveTrustedOrigins } from './trusted-origins';

const DEV = 'http://localhost:5173';

describe('parseDevOrigin', () => {
  it('accepts loopback http origins with a port', () => {
    expect(parseDevOrigin('http://localhost:5173')).toEqual({
      origin: DEV,
      host: 'localhost:5173',
    });
    expect(parseDevOrigin('http://127.0.0.1:3000/')).toEqual({
      origin: 'http://127.0.0.1:3000',
      host: '127.0.0.1:3000',
    });
  });

  it.each([
    'https://localhost:5173',
    'http://localhost',
    'http://example.com:5173',
    'http://localhost.evil.com:5173',
    'http://user:pw@localhost:5173',
    'http://localhost:5173/app',
    'http://localhost:5173/?x=1',
    'http://localhost:5173/#x',
    'http://[::1]:5173',
    'app://renderer',
    'file:///C:/x',
    'not a url',
    '',
  ])('rejects %s', (value) => {
    expect(parseDevOrigin(value)).toBeNull();
  });

  it.each([undefined, null, 5, {}, ['http://localhost:5173']])('rejects non-string %s', (value) => {
    expect(parseDevOrigin(value)).toBeNull();
  });
});

describe('resolveTrustedOrigins', () => {
  it('contains only the app origin in production', () => {
    expect(resolveTrustedOrigins({ mode: 'production' })).toEqual(['app://renderer']);
  });

  it('adds the dev origin in development', () => {
    expect(resolveTrustedOrigins({ mode: 'development', devOrigin: DEV })).toEqual([
      'app://renderer',
      DEV,
    ]);
  });

  it('ignores an invalid dev origin', () => {
    expect(resolveTrustedOrigins({ mode: 'development', devOrigin: 'https://evil.test' })).toEqual([
      'app://renderer',
    ]);
  });

  it('cannot gain a dev origin in production even if the object carries one', () => {
    const sneaky = { mode: 'production', devOrigin: DEV } as { mode: 'production' };
    expect(resolveTrustedOrigins(sneaky)).toEqual(['app://renderer']);
  });
});

describe('originOf', () => {
  it('returns protocol and host for the custom scheme', () => {
    expect(originOf('app://renderer/index.html')).toBe('app://renderer');
  });

  it('returns null for credentials, empty hosts and bad input', () => {
    for (const value of ['app://u:p@renderer/', 'file:///x', 'about:blank', 'x', '', 3, null]) {
      expect(originOf(value)).toBeNull();
    }
  });
});

describe('isTrustedUrl', () => {
  const trusted = ['app://renderer'];

  it('accepts URLs on the trusted origin', () => {
    expect(isTrustedUrl('app://renderer/index.html', trusted)).toBe(true);
    expect(isTrustedUrl('app://renderer', trusted)).toBe(true);
  });

  it.each([
    'https://renderer/',
    'app://renderer.evil.com/',
    'app://evil/',
    'app://RENDERER/',
    'app://renderer:8080/',
    'app://renderer@evil.com/',
    'app://user@renderer/',
    'http://localhost:5173/',
    'file:///C:/index.html',
    'about:blank',
    'javascript:alert(1)',
    'data:text/html,hi',
    'blob:app://renderer/uuid',
    'null',
    '',
  ])('rejects %s', (url) => {
    expect(isTrustedUrl(url, trusted)).toBe(false);
  });

  it.each([undefined, null, 0, {}, []])('rejects non-string %s', (value) => {
    expect(isTrustedUrl(value, trusted)).toBe(false);
  });

  it('rejects everything when the trusted set is empty', () => {
    expect(isTrustedUrl('app://renderer/', [])).toBe(false);
  });
});
