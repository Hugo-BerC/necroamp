import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createMediaRegistry } from '../library/media-registry';
import type { SkinAssetBytes } from '../skins/skin-service';
import { createMediaProtocolHandler } from './media-handler';
import { parseMediaUrl } from './media-protocol';

const ORIGIN = 'app://renderer';
const TOKEN = '123e4567-e89b-42d3-a456-426614174000';
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const SVG: SkinAssetBytes = { type: 'svg', bytes: new TextEncoder().encode('<svg/>') };
const PNG: SkinAssetBytes = { type: 'png', bytes: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]) };

function setup(assets: Record<string, SkinAssetBytes> = { [TOKEN]: SVG }, withSkins = true) {
  const readAsset = vi.fn((token: string) => Promise.resolve(assets[token]));
  const handler = createMediaProtocolHandler({
    registry: createMediaRegistry(),
    skins: withSkins ? { readAsset } : undefined,
    fs: {
      realpath: () => Promise.reject(new Error('skin must not touch the audio filesystem')),
      stat: () => Promise.reject(new Error('skin must not touch the audio filesystem')),
      openRange: () => {
        throw new Error('skin must not touch the audio filesystem');
      },
    },
    trusted: [ORIGIN],
    extname: path.extname,
    log,
  });
  const get = (url: string, method = 'GET', headers: Record<string, string> = {}) =>
    handler(new Request(url, { method, headers: { Origin: ORIGIN, ...headers } }));
  return { get, readAsset };
}

describe('parseMediaUrl: skin host', () => {
  it('accepts media://skin/<uuid>', () => {
    expect(parseMediaUrl(`media://skin/${TOKEN}`)).toEqual({
      ok: true,
      host: 'skin',
      token: TOKEN,
    });
  });

  it.each([
    `media://skin/${TOKEN}/x`,
    `media://skin/${TOKEN}?x=1`,
    `media://skin/${TOKEN.toUpperCase()}`,
    `media://skin/assets/bg.svg`,
    'media://skin/../../etc/passwd',
    `media://skin:80/${TOKEN}`,
    `media://skins/${TOKEN}`,
  ])('rejects %s', (url) => {
    expect(parseMediaUrl(url)).toEqual({ ok: false });
  });
});

describe('media://skin', () => {
  it('serves SVG with its declared type, nosniff and a sandboxing CSP header', async () => {
    const { get } = setup();
    const res = await get(`media://skin/${TOKEN}`, 'GET', { 'Sec-Fetch-Dest': 'image' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(res.headers.get('Content-Length')).toBe(String(SVG.bytes.byteLength));
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Content-Security-Policy')).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
    expect(await res.text()).toBe('<svg/>');
  });

  it.each([
    ['png', 'image/png'],
    ['webp', 'image/webp'],
    ['woff2', 'font/woff2'],
  ] as const)('serves %s as %s without an SVG policy header', async (type, mime) => {
    const { get } = setup({ [TOKEN]: { type, bytes: PNG.bytes } });
    const res = await get(`media://skin/${TOKEN}`, 'GET', { 'Sec-Fetch-Dest': 'font' });
    expect(res.headers.get('Content-Type')).toBe(mime);
    expect(res.headers.has('Content-Security-Policy')).toBe(false);
  });

  it('answers HEAD without a body', async () => {
    const { get } = setup();
    const res = await get(`media://skin/${TOKEN}`, 'HEAD');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('ignores Range and always serves the whole asset', async () => {
    const { get } = setup();
    const res = await get(`media://skin/${TOKEN}`, 'GET', { Range: 'bytes=0-1' });
    expect(res.status).toBe(200);
    expect(res.headers.has('Content-Range')).toBe(false);
    expect(await res.text()).toBe('<svg/>');
  });

  it.each(['image', 'font', 'empty'])('allows Sec-Fetch-Dest %s', async (dest) => {
    const { get } = setup();
    expect((await get(`media://skin/${TOKEN}`, 'GET', { 'Sec-Fetch-Dest': dest })).status).toBe(
      200,
    );
  });

  it.each(['document', 'iframe', 'frame', 'embed', 'object', 'script', 'worker', 'style'])(
    'refuses Sec-Fetch-Dest %s (never a document, frame or object load)',
    async (dest) => {
      const { get, readAsset } = setup();
      const res = await get(`media://skin/${TOKEN}`, 'GET', { 'Sec-Fetch-Dest': dest });
      expect(res.status).toBe(404);
      expect(readAsset).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for an unknown token without revealing why', async () => {
    const { get } = setup();
    const res = await get('media://skin/00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('answers 404 for every request when skin serving is not installed', async () => {
    const { get } = setup({ [TOKEN]: SVG }, false);
    expect((await get(`media://skin/${TOKEN}`)).status).toBe(404);
  });

  it('answers 404 for other methods and malformed URLs', async () => {
    const { get } = setup();
    expect((await get(`media://skin/${TOKEN}`, 'POST')).status).toBe(404);
    expect((await get(`media://skin/${TOKEN}/extra`)).status).toBe(404);
    expect((await get('media://skin/not-a-token')).status).toBe(404);
  });

  it('keeps token namespaces apart: a skin token never opens a track or art', async () => {
    const { get } = setup();
    expect((await get(`media://track/${TOKEN}`)).status).toBe(404);
    expect((await get(`media://art/${TOKEN}`)).status).toBe(404);
  });

  it('does not echo CORS for an untrusted origin', async () => {
    const handler = createMediaProtocolHandler({
      registry: createMediaRegistry(),
      skins: { readAsset: () => Promise.resolve(SVG) },
      fs: {
        realpath: () => Promise.reject(new Error('x')),
        stat: () => Promise.reject(new Error('x')),
        openRange: () => {
          throw new Error('x');
        },
      },
      trusted: [ORIGIN],
      extname: path.extname,
      log,
    });
    const res = await handler(
      new Request(`media://skin/${TOKEN}`, { headers: { Origin: 'https://evil.test' } }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  it('answers 404 instead of throwing when the reader fails', async () => {
    const handler = createMediaProtocolHandler({
      registry: createMediaRegistry(),
      skins: { readAsset: () => Promise.reject(new Error('C:\\secret')) },
      fs: {
        realpath: () => Promise.reject(new Error('x')),
        stat: () => Promise.reject(new Error('x')),
        openRange: () => {
          throw new Error('x');
        },
      },
      trusted: [ORIGIN],
      extname: path.extname,
      log,
    });
    const res = await handler(new Request(`media://skin/${TOKEN}`));
    expect(res.status).toBe(404);
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('secret');
  });
});
