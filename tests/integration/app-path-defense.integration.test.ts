import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAppPath, type PathApi } from '@main/protocol/resolve-app-path';

// T6.1/T6.3: defense in depth of resolveAppPath. The injected path API is the only seam, so a
// misbehaving implementation (absolute join result, resolve outside the root) must still be refused.
const URL_OK = 'app://renderer/assets/app.js';

describe('resolveAppPath defense in depth with a misbehaving path API', () => {
  it('refuses a join result that is absolute', () => {
    const api: PathApi = { ...path.posix, join: () => '/etc/passwd' };
    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
  });

  it('refuses a resolve result outside the root', () => {
    const api: PathApi = {
      ...path.posix,
      resolve: (...parts: string[]) => (parts.length === 1 ? '/opt/app' : '/opt/other/app.js'),
    };
    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
  });

  it('refuses a resolve result that is a sibling sharing the root name prefix', () => {
    const api: PathApi = {
      ...path.posix,
      resolve: (...parts: string[]) => (parts.length === 1 ? '/opt/app' : '/opt/app-evil/app.js'),
    };
    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
  });

  it.each([
    ['posix', path.posix, '/'],
    ['win32', path.win32, 'C:\\'],
  ] as const)(
    'accepts a file under a root that already ends with the separator (%s)',
    (_n, api, root) => {
      expect(resolveAppPath('app://renderer/index.html', api, root)).toMatchObject({ ok: true });
    },
  );
});
