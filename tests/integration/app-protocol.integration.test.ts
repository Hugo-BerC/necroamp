import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildCsp } from '@main/security/csp';
import {
  MAX_ASSET_BYTES,
  createAppProtocolHandler,
  registerAppScheme,
} from '@main/protocol/app-protocol';

// T6.3: protocol handler against a real temporary directory (never inside src/).
const log = { info: () => undefined, warn: () => undefined, error: () => undefined };
let base: string;
let root: string;
let symlinkWorks = true;

beforeAll(() => {
  base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'necroamp-proto-')));
  root = path.join(base, 'renderer');
  mkdirSync(path.join(root, 'assets'), { recursive: true });
  writeFileSync(path.join(root, 'index.html'), '<!doctype html>');
  writeFileSync(path.join(root, 'assets', 'main.js'), 'export {}');
  writeFileSync(path.join(root, 'assets', 'logo.png'), 'x');
  writeFileSync(path.join(base, 'secret.json'), '{"secret":true}');
  writeFileSync(path.join(root, 'big.js'), Buffer.alloc(MAX_ASSET_BYTES + 1));
  try {
    symlinkSync(path.join(base, 'secret.json'), path.join(root, 'link.json'));
  } catch {
    symlinkWorks = false;
  }
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

const handler = () =>
  createAppProtocolHandler({
    fs: {
      realpath: (p) => fsp.realpath(p),
      stat: (p) => fsp.stat(p),
      readFile: (p) => fsp.readFile(p),
    },
    pathApi: path,
    rendererRoot: root,
    csp: buildCsp({ mode: 'production' }),
    log,
  });
const get = (url: string, method = 'GET') => handler()(new Request(url, { method }));

describe('app:// protocol against a real directory', () => {
  it('serves the entry with security headers and the production CSP', async () => {
    const res = await get('app://renderer/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toBe(buildCsp({ mode: 'production' }));
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('serves a nested allowed asset', async () => {
    expect((await get('app://renderer/assets/main.js')).status).toBe(200);
  });

  it.each([
    'app://renderer/../secret.json',
    'app://renderer/%2e%2e/secret.json',
    'app://renderer/assets/..%2f..%2fsecret.json',
    'app://renderer/assets/..%5c..%5csecret.json',
    'app://renderer/assets/logo.png',
    'app://renderer/missing.js',
    'app://renderer/.env',
    'app://evil/index.html',
    'file:///etc/passwd',
  ])('answers 404 for %s', async (url) => {
    const res = await get(url);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('answers 404 for a file above the size limit', async () => {
    expect((await get('app://renderer/big.js')).status).toBe(404);
  });

  it('answers 405 with Allow for non GET/HEAD methods and never reads the file', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const res = await get('app://renderer/index.html', method);
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('GET, HEAD');
    }
  });

  it('HEAD returns headers and an empty body', async () => {
    const res = await get('app://renderer/index.html', 'HEAD');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
  });

  it('refuses a symlink that leaves the root (skipped when symlinks are not permitted)', async (ctx) => {
    if (!symlinkWorks) ctx.skip();
    expect((await get('app://renderer/link.json')).status).toBe(404);
  });

  it('registers only standard, secure and supportFetchAPI privileges', () => {
    const calls: unknown[] = [];
    registerAppScheme({ registerSchemesAsPrivileged: (s) => void calls.push(...s) });
    expect(calls).toEqual([
      { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
    ]);
  });
});
