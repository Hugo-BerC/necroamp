import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveUserDataOverride } from './user-data-override';

const dirs = new Set(['/tmp/e2e', 'C:\\Temp\\e2e']);
const probe = { isDirectory: (p: string): boolean => dirs.has(p) };

describe('resolveUserDataOverride', () => {
  it('reports absent when the variable is unset', () => {
    expect(resolveUserDataOverride(undefined, false, path.posix, probe)).toEqual({
      status: 'absent',
    });
  });

  it('applies an absolute existing directory when not packaged', () => {
    expect(resolveUserDataOverride('/tmp/e2e', false, path.posix, probe)).toEqual({
      status: 'applied',
      path: '/tmp/e2e',
    });
    expect(resolveUserDataOverride('C:\\Temp\\e2e', false, path.win32, probe)).toEqual({
      status: 'applied',
      path: 'C:\\Temp\\e2e',
    });
  });

  it('is inert in a packaged build', () => {
    expect(resolveUserDataOverride('/tmp/e2e', true, path.posix, probe)).toEqual({
      status: 'ignored',
      code: 'PACKAGED',
    });
  });

  it.each([
    '',
    'relative/dir',
    '/tmp/e2e/../e2e',
    '/tmp/missing',
    `/${'a'.repeat(300)}`,
    '/tmp/e2e\0',
    42,
    null,
  ])('ignores invalid value %j', (value) => {
    expect(resolveUserDataOverride(value, false, path.posix, probe)).toEqual({
      status: 'ignored',
      code: 'INVALID',
    });
  });

  it('ignores a value when the probe throws', () => {
    const throwing = {
      isDirectory: (): boolean => {
        throw new Error('EACCES');
      },
    };
    expect(resolveUserDataOverride('/tmp/e2e', false, path.posix, throwing)).toEqual({
      status: 'ignored',
      code: 'INVALID',
    });
  });
});
