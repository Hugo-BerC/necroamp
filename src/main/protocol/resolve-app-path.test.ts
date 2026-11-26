import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isAllowedExtension, mimeTypeFor } from './mime-types';
import { isPathInsideRoot, resolveAppPath, type AppPathRejection } from './resolve-app-path';

const MODULES = [
  { name: 'posix', api: path.posix, root: '/opt/necroamp/out/renderer' },
  { name: 'win32', api: path.win32, root: 'C:\\Program Files\\NecroAmp\\out\\renderer' },
] as const;

describe.each(MODULES)('resolveAppPath ($name)', ({ api, root }) => {
  const resolve = (input: unknown) => resolveAppPath(input, api, root);
  const rejected = (input: unknown): AppPathRejection | 'OK' => {
    const result = resolve(input);
    return result.ok ? 'OK' : result.code;
  };

  it.each([
    'con.js',
    'CON.css',
    'nul.css',
    'Aux.json',
    'prn.js',
    'com1.js',
    'LPT9.png',
    'assets/nul.js',
    'con.tar.js',
    'com\u00b9.js',
  ])('rejects the Windows reserved device name %s', (name) => {
    expect(rejected(`app://renderer/${name}`)).toBe('FORBIDDEN_CHARS');
  });

  it('still accepts names that merely contain a reserved word', () => {
    for (const name of ['console.js', 'com10.js', 'nullable.css', 'auxiliary.js']) {
      expect(rejected(`app://renderer/${name}`)).toBe('OK');
    }
  });

  it('maps the root to index.html', () => {
    for (const url of ['app://renderer', 'app://renderer/', 'app://renderer/index.html']) {
      expect(resolve(url)).toEqual({ ok: true, relativePath: 'index.html' });
    }
  });

  it('accepts nested allow-listed assets and ignores query and hash', () => {
    expect(resolve('app://renderer/assets/index-a1B2.js')).toEqual({
      ok: true,
      relativePath: api.join('assets', 'index-a1B2.js'),
    });
    expect(resolve('app://renderer/assets/main.css?v=1#x')).toMatchObject({ ok: true });
    expect(resolve('app://renderer/data.json')).toMatchObject({ ok: true });
  });

  it('keeps every accepted result inside the root', () => {
    const result = resolve('app://renderer/a/b/c.js');
    if (!result.ok) throw new Error('expected ok');
    expect(isPathInsideRoot(api, root, api.resolve(root, result.relativePath))).toBe(true);
  });

  it.each([
    ['app://renderer/../secret.txt', 'TRAVERSAL'],
    ['app://renderer/assets/../../x.js', 'TRAVERSAL'],
    ['app://renderer/./index.html', 'TRAVERSAL'],
    ['app://renderer/%2e%2e/x.js', 'TRAVERSAL'],
    ['app://renderer/%2E%2E/x.js', 'TRAVERSAL'],
    ['app://renderer/.%2e/x.js', 'TRAVERSAL'],
    ['app://renderer/a/%2e/x.js', 'TRAVERSAL'],
    ['app://renderer//index.html', 'TRAVERSAL'],
    ['app://renderer/a//b.js', 'TRAVERSAL'],
    ['app://renderer/a%2fb.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a%2Fb.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a%5cb.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a%00.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a\\b.js', 'FORBIDDEN_CHARS'],
    ['app://renderer\\..\\x.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a\0.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a\t.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a b.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/C:/Windows/win.ini', 'FORBIDDEN_CHARS'],
    ['app://renderer/C%3A/x.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/index.html:stream.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/a%3Cb.js', 'FORBIDDEN_CHARS'],
    ['app://renderer/.env.json', 'FORBIDDEN_CHARS'],
    ['app://renderer/.git/config.json', 'FORBIDDEN_CHARS'],
    ['app://renderer/a.js.', 'FORBIDDEN_CHARS'],
    ['app://renderer/a.js%20', 'FORBIDDEN_CHARS'],
    ['app://renderer/%zz.js', 'BAD_URL'],
    ['app://renderer/%E0%A4%A.js', 'BAD_URL'],
    ['app://renderer/file.exe', 'BAD_EXTENSION'],
    ['app://renderer/file.map', 'BAD_EXTENSION'],
    ['app://renderer/noextension', 'BAD_EXTENSION'],
    ['app://renderer/dir/', 'BAD_EXTENSION'],
    ['app://renderer/index.html.exe', 'BAD_EXTENSION'],
    ['app://renderer/js', 'BAD_EXTENSION'],
  ] as const)('%s -> %s', (url, expected) => {
    expect(rejected(url)).toBe(expected);
  });

  it('does not decode twice, so a double-encoded dot stays literal text', () => {
    const result = resolve('app://renderer/%252e%252e/x.js');
    if (!result.ok) throw new Error('expected ok');
    expect(result.relativePath).toBe(api.join('%2e%2e', 'x.js'));
    expect(isPathInsideRoot(api, root, api.resolve(root, result.relativePath))).toBe(true);
  });

  it.each([
    'file:///etc/passwd',
    'https://renderer/index.html',
    'http://renderer/index.html',
    'app:index.html',
    'about:blank',
    'javascript:alert(1)',
    'data:text/html,x',
    'not a url',
    '',
  ])('rejects scheme or shape %s', (url) => {
    expect(resolve(url).ok).toBe(false);
  });

  it.each([
    'app://evil/index.html',
    'app://renderer.evil.com/index.html',
    'app://RENDERER/index.html',
    'app://renderer:8080/index.html',
    'app://user@renderer/index.html',
    'app://user:pw@renderer/index.html',
  ])('rejects host %s', (url) => {
    expect(rejected(url)).toBe('BAD_HOST');
  });

  it('rejects over-long input and over-long segments', () => {
    expect(rejected(`app://renderer/${'a'.repeat(2100)}.js`)).toBe('TOO_LONG');
    expect(rejected(`app://renderer/${'a'.repeat(300)}.js`)).toBe('TOO_LONG');
  });

  it.each([undefined, null, 0, {}, [], Symbol.iterator])(
    'rejects non-string %s without throwing',
    (value) => {
      expect(rejected(value)).toBe('BAD_URL');
    },
  );
});

describe('isPathInsideRoot', () => {
  it('is case-insensitive on win32 only', () => {
    expect(isPathInsideRoot(path.win32, 'C:\\App\\Root', 'c:\\app\\root\\a.js')).toBe(true);
    expect(isPathInsideRoot(path.posix, '/App/Root', '/app/root/a.js')).toBe(false);
  });

  it('rejects the root itself, siblings that share a prefix and parents', () => {
    expect(isPathInsideRoot(path.posix, '/a/root', '/a/root')).toBe(false);
    expect(isPathInsideRoot(path.posix, '/a/root', '/a/root-evil/x.js')).toBe(false);
    expect(isPathInsideRoot(path.posix, '/a/root', '/a/x.js')).toBe(false);
    expect(isPathInsideRoot(path.win32, 'C:\\a\\root', 'C:\\a\\root-evil\\x.js')).toBe(false);
    expect(isPathInsideRoot(path.win32, 'C:\\a\\root', 'D:\\a\\root\\x.js')).toBe(false);
  });
});

describe('mime types', () => {
  it('allows only the four renderer extensions', () => {
    for (const ext of ['.html', '.js', '.css', '.json', '.JS'])
      expect(isAllowedExtension(ext)).toBe(true);
    for (const ext of ['', '.exe', '.svg', '.map', '.constructor', '__proto__', 'toString']) {
      expect(isAllowedExtension(ext)).toBe(false);
    }
  });

  it('returns a content type with a charset for text types', () => {
    expect(mimeTypeFor('.js')).toBe('text/javascript; charset=utf-8');
    expect(mimeTypeFor('.html')).toBe('text/html; charset=utf-8');
  });
});
