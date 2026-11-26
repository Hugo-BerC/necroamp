import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logging/logger';
import { buildCsp } from '../security/csp';
import {
  MAX_ASSET_BYTES,
  createAppProtocolHandler,
  installAppProtocol,
  registerAppScheme,
  type AssetFs,
} from './app-protocol';

const CSP = buildCsp({ mode: 'production' });
const ROOT = '/opt/necroamp/out/renderer';

const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });

interface FakeFile {
  readonly real?: string;
  readonly size?: number;
  readonly isFile?: boolean;
  readonly body?: string;
}

function fakeFs(files: Record<string, FakeFile>, rootReal = ROOT): AssetFs {
  return {
    realpath: (p) => {
      if (p === ROOT) return Promise.resolve(rootReal);
      const entry = files[p];
      return entry === undefined
        ? Promise.reject(new Error('ENOENT'))
        : Promise.resolve(entry.real ?? p);
    },
    stat: (p) => {
      const entry = Object.values(files).find((f) => (f.real ?? '') === p) ?? files[p];
      if (entry === undefined) return Promise.reject(new Error('ENOENT'));
      return Promise.resolve({
        isFile: () => entry.isFile ?? true,
        size: entry.size ?? (entry.body ?? '').length,
      });
    },
    readFile: (p) => {
      const entry = Object.values(files).find((f) => (f.real ?? '') === p) ?? files[p];
      return Promise.resolve(new TextEncoder().encode(entry?.body ?? ''));
    },
  };
}

const handlerFor = (files: Record<string, FakeFile>, log: Logger = silentLog()) =>
  createAppProtocolHandler({
    fs: fakeFs(files),
    pathApi: path.posix,
    rendererRoot: ROOT,
    csp: CSP,
    log,
  });

const get = (url: string, method = 'GET'): Request => new Request(url, { method });

describe('scheme registration', () => {
  it('requests only standard, secure and supportFetchAPI', () => {
    const registrar = { registerSchemesAsPrivileged: vi.fn() };
    registerAppScheme(registrar);
    expect(registrar.registerSchemesAsPrivileged).toHaveBeenCalledWith([
      {
        scheme: 'app',
        privileges: { standard: true, secure: true, supportFetchAPI: true },
      },
    ]);
  });
});

describe('app protocol handler', () => {
  const files = {
    [`${ROOT}/index.html`]: { body: '<html></html>' },
    [`${ROOT}/assets/main.js`]: { body: 'console.log(1)' },
  };

  it('serves an allow-listed file with security headers', async () => {
    const response = await handlerFor(files)(get('app://renderer/'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<html></html>');
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('content-security-policy')).toBe(CSP);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
  });

  it('answers HEAD with headers and no body', async () => {
    const response = await handlerFor(files)(get('app://renderer/assets/main.js', 'HEAD'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
    expect(response.headers.get('content-length')).toBe('14');
  });

  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])(
    'answers %s with 405 and an Allow header',
    async (method) => {
      const response = await handlerFor(files)(
        new Request('app://renderer/index.html', { method, body: 'x' }),
      );
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET, HEAD');
      expect(response.headers.get('content-security-policy')).toBe(CSP);
    },
  );

  it.each([
    'app://renderer/../secret.js',
    'app://renderer/%2e%2e/secret.js',
    'app://renderer/a%2fb.js',
    'app://renderer/file.exe',
    'app://evil/index.html',
    'app://renderer/missing.js',
  ])('answers %s with 404 and no body', async (url) => {
    const response = await handlerFor(files)(get(url));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('logs only an allow-listed rejection code', async () => {
    const log = silentLog();
    await handlerFor(files, log)(get('app://renderer/a%2fb.js'));
    expect(log.warn).toHaveBeenCalledWith('protocol.rejected', { code: 'FORBIDDEN_CHARS' });
  });

  it('rejects a file whose realpath leaves the root (symlink escape)', async () => {
    const escape = { [`${ROOT}/link.js`]: { real: '/etc/secret.js', body: 'secret' } };
    const log = silentLog();
    const response = await handlerFor(escape, log)(get('app://renderer/link.js'));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
    expect(log.warn).toHaveBeenCalledWith('protocol.rejected', { code: 'ESCAPE' });
  });

  it('rejects a sibling directory that shares the root prefix', async () => {
    const escape = { [`${ROOT}/link.js`]: { real: `${ROOT}-evil/x.js`, body: 'secret' } };
    expect((await handlerFor(escape)(get('app://renderer/link.js'))).status).toBe(404);
  });

  it('rejects directories and files above the size bound', async () => {
    const odd = {
      [`${ROOT}/dir.js`]: { isFile: false },
      [`${ROOT}/big.js`]: { size: MAX_ASSET_BYTES + 1 },
      [`${ROOT}/limit.js`]: { size: MAX_ASSET_BYTES, body: 'ok' },
    };
    const handler = handlerFor(odd);
    expect((await handler(get('app://renderer/dir.js'))).status).toBe(404);
    expect((await handler(get('app://renderer/big.js'))).status).toBe(404);
    expect((await handler(get('app://renderer/limit.js'))).status).toBe(200);
  });

  it('answers 404 for everything when the renderer root cannot be resolved', async () => {
    const broken: AssetFs = {
      ...fakeFs(files),
      realpath: () => Promise.reject(new Error('ENOENT')),
    };
    const handler = createAppProtocolHandler({
      fs: broken,
      pathApi: path.posix,
      rendererRoot: ROOT,
      csp: CSP,
      log: silentLog(),
    });
    expect((await handler(get('app://renderer/index.html'))).status).toBe(404);
  });

  it('never leaks an internal error through the response', async () => {
    const throwing: AssetFs = {
      ...fakeFs(files),
      readFile: () => Promise.reject(new Error(`${ROOT} secret`)),
    };
    const handler = createAppProtocolHandler({
      fs: throwing,
      pathApi: path.posix,
      rendererRoot: ROOT,
      csp: CSP,
      log: silentLog(),
    });
    const response = await handler(get('app://renderer/index.html'));
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('secret');
  });
});

describe('installAppProtocol', () => {
  it('registers the handler for the app scheme only and returns a disposer', () => {
    const protocol = { handle: vi.fn(), unhandle: vi.fn() };
    const dispose = installAppProtocol(protocol, {
      fs: fakeFs({}),
      pathApi: path.posix,
      rendererRoot: ROOT,
      csp: CSP,
      log: silentLog(),
    });
    expect(protocol.handle).toHaveBeenCalledTimes(1);
    expect(protocol.handle.mock.calls[0]?.[0]).toBe('app');
    dispose();
    expect(protocol.unhandle).toHaveBeenCalledWith('app');
  });
});

describe('app protocol handler on the real filesystem', () => {
  let temp = '';
  let rendererRoot = '';
  let linkCreated = false;

  beforeAll(async () => {
    temp = await fs.mkdtemp(path.join(os.tmpdir(), 'necroamp-protocol-'));
    rendererRoot = path.join(temp, 'renderer');
    await fs.mkdir(rendererRoot);
    await fs.writeFile(path.join(rendererRoot, 'index.html'), '<p>ok</p>');
    await fs.writeFile(path.join(temp, 'outside.js'), 'secret');
    try {
      await fs.symlink(path.join(temp, 'outside.js'), path.join(rendererRoot, 'link.js'));
      linkCreated = true;
    } catch {
      // Creating symlinks needs a privilege on Windows. The test below reports the skip.
    }
  });

  afterAll(async () => {
    await fs.rm(temp, { recursive: true, force: true });
  });

  const realHandler = () =>
    createAppProtocolHandler({ fs, pathApi: path, rendererRoot, csp: CSP, log: silentLog() });

  it('serves a real file', async () => {
    const response = await realHandler()(get('app://renderer/index.html'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<p>ok</p>');
  });

  it('rejects a real symlink that points outside the root (skipped without symlink privilege)', async (context) => {
    if (!linkCreated) context.skip();
    const response = await realHandler()(get('app://renderer/link.js'));
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('secret');
  });
});
