import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createArtworkStore } from '../library/artwork';
import { createMediaRegistry } from '../library/media-registry';
import { createMediaProtocolHandler } from './media-handler';

const ORIGIN = 'app://renderer';
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function setup(withArtwork = true) {
  const registry = createMediaRegistry();
  const artwork = createArtworkStore();
  const handler = createMediaProtocolHandler({
    registry,
    artwork: withArtwork ? artwork : undefined,
    fs: {
      realpath: () => Promise.reject(new Error('art must not touch the filesystem')),
      stat: () => Promise.reject(new Error('art must not touch the filesystem')),
      openRange: () => {
        throw new Error('art must not touch the filesystem');
      },
    },
    trusted: [ORIGIN],
    extname: path.extname,
    log,
  });
  const get = (url: string, method = 'GET', headers: Record<string, string> = {}) =>
    handler(new Request(url, { method, headers: { Origin: ORIGIN, ...headers } }));
  return { registry, artwork, get };
}

describe('media://art', () => {
  it('serves cached artwork with the sniffed type and hardening headers', async () => {
    const { artwork, get } = setup();
    const token = artwork.put(PNG) as string;
    const res = await get(`media://art/${token}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Length')).toBe(String(PNG.byteLength));
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  });

  it('answers HEAD without a body', async () => {
    const { artwork, get } = setup();
    const res = await get(`media://art/${artwork.put(PNG) as string}`, 'HEAD');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('rejects unknown tokens, cross-namespace tokens and other methods', async () => {
    const { artwork, registry, get } = setup();
    const art = artwork.put(PNG) as string;
    const track = registry.issue(path.join('m', 'a.mp3')) as string;
    expect((await get('media://art/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await get(`media://art/${track}`)).status).toBe(404);
    expect((await get(`media://track/${art}`)).status).toBe(404);
    expect((await get(`media://art/${art}`, 'POST')).status).toBe(404);
  });

  it.each(['media://art/', 'media://art/../x', 'media://art/%2e%2e', 'media://art/x?y=1'])(
    'rejects malformed url %s',
    async (url) => {
      const { get } = setup();
      expect((await get(url)).status).toBe(404);
    },
  );

  it('is a 404 when no artwork store is wired and after clear()', async () => {
    const without = setup(false);
    expect((await without.get('media://art/00000000-0000-4000-8000-000000000001')).status).toBe(
      404,
    );
    const { artwork, get } = setup();
    const token = artwork.put(PNG) as string;
    artwork.clear();
    expect((await get(`media://art/${token}`)).status).toBe(404);
  });

  it('does not echo an untrusted origin', async () => {
    const { artwork, get } = setup();
    const res = await get(`media://art/${artwork.put(PNG) as string}`, 'GET', {
      Origin: 'https://evil.example',
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
