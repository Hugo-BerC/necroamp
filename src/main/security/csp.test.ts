import { describe, expect, it } from 'vitest';
import { buildCsp, buildMetaCsp } from './csp';

const DEV = 'http://localhost:5173';

const EXPECTED_PRODUCTION =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' media://art; font-src 'self'; " +
  "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; " +
  "frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src media://track; " +
  "manifest-src 'none'";

function directive(policy: string, name: string): string[] {
  const entry = policy.split('; ').find((part) => part.startsWith(`${name} `));
  return entry === undefined ? [] : entry.slice(name.length + 1).split(' ');
}

describe('production CSP', () => {
  const policy = buildCsp({ mode: 'production' });

  it('equals the approved policy exactly', () => {
    expect(policy).toBe(EXPECTED_PRODUCTION);
  });

  it.each([
    "'unsafe-eval'",
    "'unsafe-inline'",
    'data:',
    'blob:',
    '*',
    'http:',
    'https:',
    'ws:',
    'wss:',
    'localhost',
    '127.0.0.1',
  ])('never contains %s', (token) => {
    expect(policy.split(/[\s;]+/)).not.toContain(token);
    expect(policy).not.toContain('localhost');
  });

  it('denies all connections', () => {
    expect(directive(policy, 'connect-src')).toEqual(["'none'"]);
  });

  it('is identical when the options object carries a dev origin', () => {
    const sneaky = { mode: 'production', devOrigin: DEV } as { mode: 'production' };
    expect(buildCsp(sneaky)).toBe(EXPECTED_PRODUCTION);
    expect(buildMetaCsp(sneaky)).toBe(buildMetaCsp({ mode: 'production' }));
  });

  it('is not affected by an earlier development build', () => {
    buildCsp({ mode: 'development', devOrigin: DEV });
    expect(buildCsp({ mode: 'production' })).toBe(EXPECTED_PRODUCTION);
  });
});

describe('development CSP', () => {
  const policy = buildCsp({ mode: 'development', devOrigin: DEV });

  it('limits connect-src to the dev origin and its websocket', () => {
    expect(directive(policy, 'connect-src')).toEqual([DEV, 'ws://localhost:5173']);
  });

  it('allows unsafe-inline only for scripts and styles', () => {
    expect(directive(policy, 'script-src')).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directive(policy, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
    const others = policy
      .split('; ')
      .filter((part) => !/^(script|style)-src /.test(part))
      .join('; ');
    expect(others).not.toContain('unsafe-inline');
  });

  it('never contains unsafe-eval, remote script sources or wildcards', () => {
    expect(policy).not.toContain('unsafe-eval');
    expect(directive(policy, 'script-src').some((s) => /^(https?:|\*|data:|blob:)/.test(s))).toBe(
      false,
    );
    expect(policy.split(/[\s;]+/)).not.toContain('*');
  });

  it('production differs from the Desktop Foundation policy only in media-src and img-src (S5, ADR 0006 item 7)', () => {
    const previous = EXPECTED_PRODUCTION.replace(
      'media-src media://track',
      "media-src 'none'",
    ).replace("img-src 'self' media://art", "img-src 'self'");
    const changed = EXPECTED_PRODUCTION.split('; ').filter((part) => !previous.includes(part));
    expect(changed).toEqual(["img-src 'self' media://art", 'media-src media://track']);
    for (const forbidden of ['blob:', 'data:', '*', 'bypass']) {
      expect(EXPECTED_PRODUCTION).not.toContain(forbidden);
    }
  });

  it('keeps every other directive equal to production', () => {
    const rest = (p: string): string[] =>
      p.split('; ').filter((part) => !/^(script|style|connect)-src /.test(part));
    expect(rest(policy)).toEqual(rest(EXPECTED_PRODUCTION));
  });

  it.each(['https://localhost:5173', 'http://evil.test:5173', 'http://localhost', '*', ''])(
    'throws for an invalid dev origin %s',
    (devOrigin) => {
      expect(() => buildCsp({ mode: 'development', devOrigin })).toThrow();
    },
  );
});

describe('meta CSP', () => {
  it('omits only directives a meta element ignores', () => {
    const header = buildCsp({ mode: 'production' }).split('; ');
    const meta = buildMetaCsp({ mode: 'production' }).split('; ');
    expect(header.filter((part) => !meta.includes(part))).toEqual(["frame-ancestors 'none'"]);
    expect(meta.every((part) => header.includes(part))).toBe(true);
  });

  it('contains no development allowance in production', () => {
    const meta = buildMetaCsp({ mode: 'production' });
    expect(meta).not.toMatch(/unsafe-|localhost|ws:|data:|\*/);
  });
});
