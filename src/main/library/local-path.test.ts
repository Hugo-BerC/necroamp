import { describe, expect, it } from 'vitest';
import { isLocalAbsolutePath, MAX_LOCAL_PATH_LENGTH } from './local-path';

const WIN_VALID = [
  'C:\\Music\\a.mp3',
  'c:\\a.flac',
  'D:/Music/a.ogg',
  'Z:\\dir with spaces\\ü.wav',
  'C:\\a\\..\\b.mp3',
  'C:\\\\double\\a.mp3',
];
const WIN_INVALID = [
  '\\\\host\\share\\a.mp3',
  '//host/share/a.mp3',
  '\\/host/share/a.mp3',
  '/\\host\\share\\a.mp3',
  '\\\\?\\C:\\a.mp3',
  '\\\\?\\UNC\\host\\share\\a.mp3',
  '\\\\.\\PhysicalDrive0\\a.mp3',
  '//?/C:/a.mp3',
  '//./pipe/a.mp3',
  'C:a.mp3',
  'C:',
  'C:music\\a.mp3',
  '\\a.mp3',
  '/a.mp3',
  'a.mp3',
  '.\\a.mp3',
  '..\\a.mp3',
  'music/a.mp3',
  '1:\\a.mp3',
  'CC:\\a.mp3',
  'C:\\a.mp3:stream',
  'C:\\a?.mp3',
  'C:\\a*.mp3',
  'C:\\a\0.mp3',
  'C:\\a\n.mp3',
  'C:\\a\t.mp3',
  'C:\\a\u007f.mp3',
  'C:\\a\u0085.mp3',
  '',
  ' ',
  'file:///C:/a.mp3',
  'https://host/a.mp3',
];
const POSIX_VALID = ['/a.mp3', '/home/u/Music/a.flac', '/mnt/nas/a.ogg', '/a/../b.mp3', '/ü ö.wav'];
const POSIX_INVALID = [
  '//host/share/a.mp3',
  '///a.mp3',
  '//',
  'a.mp3',
  './a.mp3',
  '../a.mp3',
  'music/a.mp3',
  '~/a.mp3',
  'C:\\a.mp3',
  '\\\\host\\share\\a.mp3',
  '/a\0.mp3',
  '/a\n.mp3',
  '/a\r.mp3',
  '/a\u001b.mp3',
  '/a\u007f.mp3',
  '/a\u0085.mp3',
  '',
  'file:///a.mp3',
];

describe('isLocalAbsolutePath (win32)', () => {
  it.each(WIN_VALID)('accepts %j', (p) => expect(isLocalAbsolutePath(p, 'win32')).toBe(true));
  it.each(WIN_INVALID)('rejects %j', (p) => expect(isLocalAbsolutePath(p, 'win32')).toBe(false));
});

describe('isLocalAbsolutePath (posix)', () => {
  it.each(['linux', 'darwin'] as const)('accepts valid paths on %s', (platform) => {
    for (const p of POSIX_VALID) expect(isLocalAbsolutePath(p, platform)).toBe(true);
  });
  it.each(['linux', 'darwin'] as const)('rejects invalid paths on %s', (platform) => {
    for (const p of POSIX_INVALID) expect(isLocalAbsolutePath(p, platform)).toBe(false);
  });
});

describe('isLocalAbsolutePath (shared rules)', () => {
  it.each(['win32', 'linux', 'darwin'] as const)('rejects non-strings on %s', (platform) => {
    for (const v of [undefined, null, 0, 1, true, {}, [], ['/a.mp3'], Symbol('x'), () => 'x']) {
      expect(isLocalAbsolutePath(v, platform)).toBe(false);
    }
  });
  it('enforces the length limit', () => {
    const tail = '.mp3';
    const ok = (prefix: string) =>
      prefix + 'a'.repeat(MAX_LOCAL_PATH_LENGTH - prefix.length - tail.length) + tail;
    expect(isLocalAbsolutePath(ok('C:\\'), 'win32')).toBe(true);
    expect(isLocalAbsolutePath(ok('/'), 'linux')).toBe(true);
    expect(isLocalAbsolutePath(ok('C:\\') + 'a', 'win32')).toBe(false);
    expect(isLocalAbsolutePath(ok('/') + 'a', 'linux')).toBe(false);
  });
  it('does not treat posix rules as valid on win32 and vice versa', () => {
    expect(isLocalAbsolutePath('/a.mp3', 'win32')).toBe(false);
    expect(isLocalAbsolutePath('C:\\a.mp3', 'linux')).toBe(false);
  });
});
