import path, { type PlatformPath } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { resolveAppPath, type PathApi } from './resolve-app-path';

// R3 / R15.4: arbitrary input never throws and never escapes the root, on both path flavors.
const FLAVORS: readonly {
  name: string;
  api: PathApi & Pick<PlatformPath, 'relative'>;
  root: string;
}[] = [
  { name: 'posix', api: path.posix, root: '/srv/necroamp/out/renderer' },
  { name: 'win32', api: path.win32, root: 'C:\\necroamp\\out\\renderer' },
];

const TRAVERSAL_TOKENS = [
  '..',
  '%2e%2e',
  '%2E%2E',
  '.%2e',
  '%2e.',
  '..%2f',
  '%2e%2e%2f',
  '..%5c',
  '%2e%2e%5c',
  '%5c',
  '%2f',
  '%00',
  '..\\',
  'C:',
] as const;

const SAFE_SEGMENTS = ['index.html', 'assets', 'main.js', 'style.css', 'a', 'data.json'] as const;

const hostile = fc
  .array(fc.oneof(fc.constantFrom(...TRAVERSAL_TOKENS), fc.constantFrom(...SAFE_SEGMENTS)), {
    minLength: 1,
    maxLength: 6,
  })
  .filter((segments) => segments.some((s) => (TRAVERSAL_TOKENS as readonly string[]).includes(s)));

describe.each(FLAVORS)('resolveAppPath properties ($name)', ({ api, root }) => {
  it('never throws for arbitrary unknown input', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        expect(() => resolveAppPath(input, api, root)).not.toThrow();
      }),
    );
  });

  it('never throws for arbitrary strings, including unicode and control characters', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.string({ unit: 'binary' })), (input) => {
        expect(() => resolveAppPath(input, api, root)).not.toThrow();
        expect(() => resolveAppPath(`app://renderer/${input}`, api, root)).not.toThrow();
      }),
    );
  });

  it('rejects any URL containing a traversal, separator, NUL or drive token', () => {
    fc.assert(
      fc.property(hostile, (segments) => {
        const url = `app://renderer/${segments.join('/')}`;
        expect(resolveAppPath(url, api, root).ok).toBe(false);
      }),
    );
  });

  it('on success yields a relative path with no dot segment that stays inside the root', () => {
    const candidate = fc.oneof(
      fc.array(fc.string({ maxLength: 12 }), { maxLength: 5 }).map((s) => s.join('/')),
      fc
        .array(fc.constantFrom(...SAFE_SEGMENTS, ...TRAVERSAL_TOKENS), { maxLength: 5 })
        .map((s) => s.join('/')),
    );
    fc.assert(
      fc.property(candidate, (tail) => {
        const result = resolveAppPath(`app://renderer/${tail}`, api, root);
        if (!result.ok) return;
        expect(api.isAbsolute(result.relativePath)).toBe(false);
        const parts = result.relativePath.split(/[\\/]/);
        expect(parts).not.toContain('..');
        expect(parts).not.toContain('.');
        const resolved = api.resolve(root, result.relativePath);
        expect(api.relative(root, resolved).startsWith('..')).toBe(false);
        expect(api.isAbsolute(api.relative(root, resolved))).toBe(false);
      }),
    );
  });

  it('rejects every foreign scheme, host, credential and port', () => {
    const origin = fc.constantFrom(
      'file:///etc/passwd',
      'http://renderer/index.html',
      'https://renderer/index.html',
      'app://evil/index.html',
      'app://renderer.evil/index.html',
      'app://user@renderer/index.html',
      'app://user:pw@renderer/index.html',
      'app://renderer:8080/index.html',
      'APP-X://renderer/index.html',
      'javascript:alert(1)',
      'data:text/html,hi',
    );
    fc.assert(
      fc.property(origin, (url) => {
        expect(resolveAppPath(url, api, root).ok).toBe(false);
      }),
    );
  });

  it('rejects any extension outside the allow-list', () => {
    const ext = fc.constantFrom(
      '.exe',
      '.dll',
      '.node',
      '.svg',
      '.png',
      '.wasm',
      '.map',
      '.sh',
      '.bat',
      '',
    );
    fc.assert(
      fc.property(ext, fc.constantFrom('a', 'bundle', 'x'), (extension, base) => {
        expect(resolveAppPath(`app://renderer/${base}${extension}`, api, root).ok).toBe(false);
      }),
    );
  });
});

describe('resolveAppPath regressions', () => {
  it.each(FLAVORS)('serves the entry file for the bare origin ($name)', ({ api, root }) => {
    const result = resolveAppPath('app://renderer/', api, root);
    expect(result).toEqual({ ok: true, relativePath: 'index.html' });
  });
});
