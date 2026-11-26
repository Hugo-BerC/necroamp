import { describe, expect, it } from 'vitest';
import { resolveLoadTarget } from './load-target';

describe('resolveLoadTarget', () => {
  it('uses the app:// entry when no dev URL is set', () => {
    expect(resolveLoadTarget({}, false)).toEqual({
      kind: 'production',
      url: 'app://renderer/index.html',
    });
  });

  it('uses a loopback dev URL only when the app is not packaged', () => {
    const env = { ELECTRON_RENDERER_URL: 'http://localhost:5173' };
    expect(resolveLoadTarget(env, false)).toEqual({
      kind: 'development',
      url: 'http://localhost:5173/',
      devOrigin: 'http://localhost:5173',
    });
    expect(resolveLoadTarget(env, true).kind).toBe('production');
  });

  it.each([
    'https://localhost:5173',
    'http://example.com:5173',
    'http://localhost',
    'http://user:pw@localhost:5173',
    'http://localhost:5173/evil',
    'file:///C:/index.html',
    'app://renderer',
    'javascript:alert(1)',
    '',
    'garbage',
  ])('falls back to production for %s', (value) => {
    expect(resolveLoadTarget({ ELECTRON_RENDERER_URL: value }, false)).toEqual({
      kind: 'production',
      url: 'app://renderer/index.html',
    });
  });
});
