import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMediaRegistry } from '../library/media-registry';
import {
  audioTypeFor,
  createMediaProtocolHandler,
  installMediaProtocol,
  registerMediaScheme,
} from './media-handler';

const ORIGIN = 'app://renderer';
const BODY = Buffer.from('0123456789abcdefghij');
let dir: string;
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'necroamp-media-'));
  await fs.writeFile(path.join(dir, 'a.mp3'), BODY);
  await fs.writeFile(path.join(dir, 'b.FLAC'), BODY);
  await fs.writeFile(path.join(dir, 'secret.txt'), BODY);
  await fs.writeFile(path.join(dir, 'empty.wav'), '');
  await fs.mkdir(path.join(dir, 'folder.mp3'));
});
afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function setup() {
  const registry = createMediaRegistry();
  const handler = createMediaProtocolHandler({
    registry,
    fs: {
      realpath: (p) => fs.realpath(p),
      stat: (p) => fs.stat(p),
      openRange: (p, start, end) =>
        Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream<Uint8Array>,
    },
    trusted: [ORIGIN],
    extname: path.extname,
    log,
  });
  const urlFor = (file: string): string => `media://track/${registry.issue(path.join(dir, file))}`;
  const get = (url: string, headers: Record<string, string> = {}, method = 'GET') =>
    handler(new Request(url, { method, headers: { Origin: ORIGIN, ...headers } }));
  return { registry, handler, urlFor, get };
}

describe('media protocol handler', () => {
  it('serves the full file with CORS for the exact trusted origin', async () => {
    const { urlFor, get } = setup();
    const res = await get(urlFor('a.mp3'));
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer())).toEqual(BODY);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(res.headers.get('Accept-Ranges')).toBe('bytes');
    expect(res.headers.get('Content-Length')).toBe(String(BODY.length));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('serves 206 for a, a-b and suffix ranges', async () => {
    const { urlFor, get } = setup();
    const url = urlFor('a.mp3');
    const first = await get(url, { Range: 'bytes=2-5' });
    expect(first.status).toBe(206);
    expect(first.headers.get('Content-Range')).toBe('bytes 2-5/20');
    expect(Buffer.from(await first.arrayBuffer()).toString()).toBe('2345');
    const open = await get(url, { Range: 'bytes=15-' });
    expect(Buffer.from(await open.arrayBuffer()).toString()).toBe('fghij');
    const suffix = await get(url, { Range: 'bytes=-3' });
    expect(suffix.headers.get('Content-Range')).toBe('bytes 17-19/20');
    expect(Buffer.from(await suffix.arrayBuffer()).toString()).toBe('hij');
  });

  it('answers 416 with a size-only Content-Range for unsatisfiable ranges', async () => {
    const { urlFor, get } = setup();
    const res = await get(urlFor('a.mp3'), { Range: 'bytes=50-60' });
    expect(res.status).toBe(416);
    expect(res.headers.get('Content-Range')).toBe('bytes */20');
  });

  it('falls back to the full body for a multi-range request', async () => {
    const { urlFor, get } = setup();
    const res = await get(urlFor('a.mp3'), { Range: 'bytes=0-1,4-5' });
    expect(res.status).toBe(200);
    expect(await res.arrayBuffer()).toHaveProperty('byteLength', 20);
  });

  it('answers HEAD without a body and with headers', async () => {
    const { urlFor, get } = setup();
    const res = await get(urlFor('a.mp3'), {}, 'HEAD');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Length')).toBe('20');
    expect(res.body).toBeNull();
  });

  it('serves a zero-byte registered file as an empty 200', async () => {
    const { urlFor, get } = setup();
    const res = await get(urlFor('empty.wav'), { Range: 'bytes=0-1' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Length')).toBe('0');
  });

  it('accepts an upper-case extension', async () => {
    const { urlFor, get } = setup();
    expect((await get(urlFor('b.FLAC'))).headers.get('Content-Type')).toBe('audio/flac');
  });

  it('omits the CORS header for an untrusted or absent origin', async () => {
    const { urlFor, handler } = setup();
    const url = urlFor('a.mp3');
    const evil = await handler(new Request(url, { headers: { Origin: 'https://evil.test' } }));
    expect(evil.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const none = await handler(new Request(url));
    expect(none.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(evil.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
  });

  it('rejects with a bare 404: wrong extension, directory, missing, unknown token, bad url, method', async () => {
    const { urlFor, get, registry } = setup();
    const missing = `media://track/${registry.issue(path.join(dir, 'gone.mp3'))}`;
    const cases: [string, string?][] = [
      [urlFor('secret.txt')],
      [urlFor('folder.mp3')],
      [missing],
      ['media://track/123e4567-e89b-42d3-a456-426614174000'],
      ['media://track/..%2f..%2fsecret.txt'],
      ['media://track/forged'],
      ['media://other/123e4567-e89b-42d3-a456-426614174000'],
      [urlFor('a.mp3'), 'POST'],
      [urlFor('a.mp3'), 'OPTIONS'],
    ];
    for (const [url, method] of cases) {
      const res = await get(url, {}, method);
      expect(res.status).toBe(404);
      expect(res.body).toBeNull();
    }
  });

  it('does not serve the art host in Block A', async () => {
    const { get, registry } = setup();
    const token = registry.issue(path.join(dir, 'a.mp3'));
    expect((await get(`media://art/${token}`)).status).toBe(404);
  });

  it('rejects a symlink whose target is not audio', async () => {
    const link = path.join(dir, 'link.mp3');
    try {
      await fs.symlink(path.join(dir, 'secret.txt'), link);
    } catch {
      return; // Symlinks need privileges on some Windows hosts.
    }
    const { registry, get } = setup();
    const res = await get(`media://track/${registry.issue(link)}`);
    expect(res.status).toBe(404);
  });

  it('forgets files after the registry is cleared', async () => {
    const { urlFor, get, registry } = setup();
    const url = urlFor('a.mp3');
    registry.clear();
    expect((await get(url)).status).toBe(404);
  });
});

describe('media scheme registration', () => {
  it('uses stream and corsEnabled and never bypassCSP', () => {
    const registerSchemesAsPrivileged = vi.fn();
    registerMediaScheme({ registerSchemesAsPrivileged });
    const [[schemes]] = registerSchemesAsPrivileged.mock.calls as [
      [{ scheme: string; privileges: Record<string, boolean> }[]],
    ];
    expect(schemes).toEqual([
      {
        scheme: 'media',
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          stream: true,
          corsEnabled: true,
        },
      },
    ]);
    expect(JSON.stringify(schemes)).not.toContain('bypassCSP');
  });

  it('installs and unhandles the media scheme', () => {
    const protocol = { handle: vi.fn(), unhandle: vi.fn() };
    const dispose = installMediaProtocol(protocol, {
      registry: createMediaRegistry(),
      fs: { realpath: vi.fn(), stat: vi.fn(), openRange: vi.fn() },
      trusted: [ORIGIN],
      extname: path.extname,
      log,
    });
    expect(protocol.handle).toHaveBeenCalledWith('media', expect.any(Function));
    dispose();
    expect(protocol.unhandle).toHaveBeenCalledWith('media');
  });
});

describe('audioTypeFor', () => {
  it('allows only the four formats (plus .oga)', () => {
    for (const ext of ['.mp3', '.wav', '.flac', '.ogg', '.oga', '.MP3']) {
      expect(audioTypeFor(ext)).toBeDefined();
    }
    for (const ext of ['', '.txt', '.exe', '.m4a', 'mp3', '.constructor', '.__proto__']) {
      expect(audioTypeFor(ext)).toBeUndefined();
    }
  });
});
