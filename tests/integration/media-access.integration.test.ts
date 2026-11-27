import { createReadStream } from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, openFilesResponseSchema } from '@shared/ipc';
import { registerLibraryHandlers } from '@main/ipc/library-handlers';
import type { IpcMainLike } from '@main/ipc/register-handler';
import { createMediaRegistry } from '@main/library/media-registry';
import { createMediaProtocolHandler, type MediaFs } from '@main/protocol/media-handler';
import type { SenderEventLike } from '@main/security/sender-validation';
import { makeGarbage, makeMp3, makeWav } from '../fixtures/audio/generate-audio';

// Block A media access boundaries, with the real filesystem and the real handler + registry
// wired together. Only Electron's dialog is replaced. Covers path traversal, unauthorised
// paths, symlink escape, extension swap after authorisation and HTTP range semantics.

const TRUSTED = 'app://renderer';
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const EVENT = { senderFrame: null, sender: {} } as unknown as SenderEventLike;
const UUID_UNISSUED = '00000000-0000-4000-8000-000000000000';

const realFs: MediaFs = {
  realpath: (p) => fsp.realpath(p),
  stat: (p) => fsp.stat(p),
  openRange: (p, start, end) =>
    Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream<Uint8Array>,
};

let root: string;
let outside: string;
const wav = makeWav(1);

async function bodyOf(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

function setup() {
  const registry = createMediaRegistry();
  const handler = createMediaProtocolHandler({
    registry,
    fs: realFs,
    trusted: [TRUSTED],
    extname: path.extname,
    log,
  });
  const request = (url: string, init?: RequestInit): Promise<Response> =>
    handler(new Request(url, init));
  return { registry, request };
}

/** Runs the real library handler with a stubbed dialog and returns the issued media URLs. */
async function authorise(files: string[], registry: ReturnType<typeof createMediaRegistry>) {
  let listener: ((event: SenderEventLike, ...args: unknown[]) => Promise<unknown>) | undefined;
  const ipcMain: IpcMainLike = {
    handle: (channel, l) => {
      expect(channel).toBe(IPC_CHANNELS.libraryOpenFiles);
      listener = l;
    },
    removeHandler: () => undefined,
  };
  registerLibraryHandlers({
    ipcMain,
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: files }),
    fs: { stat: (p) => fsp.stat(p) },
    path,
    registry,
    isTrustedSender: () => true,
    log,
  });
  const response = openFilesResponseSchema.parse(await listener?.(EVENT, { multiple: true }));
  if (!response.ok) throw new Error('library:open-files failed');
  return response.data.tracks;
}

beforeAll(async () => {
  root = await fsp.mkdtemp(path.join(tmpdir(), 'necroamp-media-'));
  outside = await fsp.mkdtemp(path.join(tmpdir(), 'necroamp-outside-'));
  await fsp.writeFile(path.join(root, 'tone.wav'), wav);
  await fsp.writeFile(path.join(root, 'silence.mp3'), makeMp3());
  await fsp.writeFile(path.join(root, 'notes.txt'), 'not audio');
  await fsp.writeFile(path.join(root, 'empty.wav'), new Uint8Array(0));
  await fsp.writeFile(path.join(root, 'bad.mp3'), makeGarbage());
  await fsp.writeFile(path.join(outside, 'secret.txt'), 'top secret');
  await fsp.mkdir(path.join(root, 'folder.mp3'));
});

afterAll(async () => {
  await fsp.rm(root, { recursive: true, force: true });
  await fsp.rm(outside, { recursive: true, force: true });
});

describe('media:// access boundaries (real filesystem)', () => {
  it('serves an authorised file in full with audio headers and no filesystem path', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const response = await request(track?.mediaUrl as string);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/wav');
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(Buffer.from(await bodyOf(response)).equals(Buffer.from(wav))).toBe(true);
    for (const [, value] of response.headers) expect(value).not.toContain(root);
  });

  it('never exposes the real path through the IPC result', async () => {
    const { registry } = setup();
    const tracks = await authorise([path.join(root, 'tone.wav')], registry);
    const serialised = JSON.stringify(tracks);
    expect(serialised).not.toContain(root);
    expect(serialised).not.toMatch(/[\\/]necroamp-media-/);
  });

  it('answers a byte range with 206 and exactly those bytes', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const response = await request(track?.mediaUrl as string, {
      headers: { Range: 'bytes=100-199' },
    });
    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe(`bytes 100-199/${wav.byteLength}`);
    expect(response.headers.get('Content-Length')).toBe('100');
    expect(Buffer.from(await bodyOf(response)).equals(Buffer.from(wav.slice(100, 200)))).toBe(true);
  });

  it('supports open-ended and suffix ranges (what a seek issues)', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const tail = await request(track?.mediaUrl as string, { headers: { Range: 'bytes=16000-' } });
    expect(tail.status).toBe(206);
    expect(Buffer.from(await bodyOf(tail)).equals(Buffer.from(wav.slice(16000)))).toBe(true);
    const suffix = await request(track?.mediaUrl as string, { headers: { Range: 'bytes=-10' } });
    expect(suffix.status).toBe(206);
    expect(Buffer.from(await bodyOf(suffix)).equals(Buffer.from(wav.slice(-10)))).toBe(true);
  });

  it('clamps an end past the file and returns 416 for a start past the file', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const size = wav.byteLength;
    const clamped = await request(track?.mediaUrl as string, {
      headers: { Range: `bytes=${size - 4}-${size + 1000}` },
    });
    expect(clamped.status).toBe(206);
    expect(clamped.headers.get('Content-Range')).toBe(`bytes ${size - 4}-${size - 1}/${size}`);
    const beyond = await request(track?.mediaUrl as string, {
      headers: { Range: `bytes=${size}-` },
    });
    expect(beyond.status).toBe(416);
    expect(beyond.headers.get('Content-Range')).toBe(`bytes */${size}`);
  });

  it('ignores a multi-range or malformed Range header and serves the full body', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    for (const header of ['bytes=0-1,5-6', 'bytes=abc', 'items=0-5', 'bytes=9-2']) {
      const response = await request(track?.mediaUrl as string, { headers: { Range: header } });
      expect(response.status, header).toBe(200);
      expect(Number(response.headers.get('Content-Length')), header).toBe(wav.byteLength);
      await response.arrayBuffer();
    }
  });

  it('answers HEAD with headers and no body', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const response = await request(track?.mediaUrl as string, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe(String(wav.byteLength));
    expect((await bodyOf(response)).byteLength).toBe(0);
  });

  it('answers 404 for a well-formed token that was never issued', async () => {
    const { request } = setup();
    expect((await request(`media://track/${UUID_UNISSUED}`)).status).toBe(404);
  });

  it('answers 404 for a path or traversal in place of a token', async () => {
    const { registry, request } = setup();
    await authorise([path.join(root, 'tone.wav')], registry);
    const attempts = [
      'media://track/../../etc/passwd',
      'media://track/..%2f..%2fetc%2fpasswd',
      `media://track/${encodeURIComponent(path.join(outside, 'secret.txt'))}`,
      `media://track/${path.join(outside, 'secret.txt').replaceAll('\\', '/')}`,
      'media://track/C:/Windows/win.ini',
      'media://track//etc/passwd',
      'media://track/',
      'media://track',
      'media:///track/x',
      'media://evil/x',
      'media://art/' + UUID_UNISSUED,
    ];
    for (const url of attempts) {
      const response = await request(url);
      expect(response.status, url).toBe(404);
      expect(await response.text(), url).not.toContain('top secret');
    }
  });

  it('rejects tokens with credentials, port, query, fragment, extra segment or upper case', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const url = track?.mediaUrl as string;
    const token = url.slice('media://track/'.length);
    const variants = [
      `${url}?x=1`,
      `${url}#frag`,
      `${url}/extra`,
      `${url}/`,

      `media://track:81/${token}`,
      `media://TRACK/${token}`,
      `media://track/${token.toUpperCase()}`,
      `${url}%00`,
    ];
    for (const variant of variants) {
      expect((await request(variant)).status, variant).toBe(404);
    }
  });

  it('rejects a URL with credentials (a Request object cannot carry one, so a fake is used)', async () => {
    const registry = createMediaRegistry();
    const handler = createMediaProtocolHandler({
      registry,
      fs: realFs,
      trusted: [TRUSTED],
      extname: path.extname,
      log,
    });
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const token = (track?.mediaUrl as string).slice('media://track/'.length);
    const fake = {
      url: `media://user:pw@track/${token}`,
      method: 'GET',
      headers: new Headers(),
    } as unknown as Request;
    expect((await handler(fake)).status).toBe(404);
  });

  it('refuses non-GET methods', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      expect((await request(track?.mediaUrl as string, { method, body: 'x' })).status, method).toBe(
        404,
      );
    }
  });

  it('echoes Access-Control-Allow-Origin only for the exact trusted origin', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    const url = track?.mediaUrl as string;
    const trusted = await request(url, { headers: { Origin: TRUSTED } });
    expect(trusted.headers.get('Access-Control-Allow-Origin')).toBe(TRUSTED);
    await trusted.arrayBuffer();
    for (const origin of [
      'https://evil.example',
      'app://renderer.evil',
      'null',
      'app://renderer/',
    ]) {
      const response = await request(url, { headers: { Origin: origin } });
      expect(response.headers.get('Access-Control-Allow-Origin'), origin).toBeNull();
      await response.arrayBuffer();
    }
    const none = await request(url);
    expect(none.headers.get('Access-Control-Allow-Origin')).toBeNull();
    await none.arrayBuffer();
  });

  it('never grants a non-audio file even when the dialog returns it', async () => {
    const { registry, request } = setup();
    const tracks = await authorise(
      [path.join(root, 'notes.txt'), path.join(outside, 'secret.txt')],
      registry,
    );
    expect(tracks).toEqual([]);
    expect(registry.size).toBe(0);
    expect((await request(`media://track/${UUID_UNISSUED}`)).status).toBe(404);
  });

  it('skips a directory named like an audio file', async () => {
    const { registry } = setup();
    const tracks = await authorise([path.join(root, 'folder.mp3')], registry);
    expect(tracks).toEqual([]);
  });

  it('serves a zero-byte audio file as an empty 200 without throwing', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'empty.wav')], registry);
    const response = await request(track?.mediaUrl as string);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe('0');
  });

  it('serves a corrupt file as bytes without sniffing: the type comes from the extension only', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'bad.mp3')], registry);
    const response = await request(track?.mediaUrl as string);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    await response.arrayBuffer();
  });

  it('answers 404 when the file disappears after authorisation', async () => {
    const { registry, request } = setup();
    const gone = path.join(root, 'gone.wav');
    await fsp.writeFile(gone, wav);
    const [track] = await authorise([gone], registry);
    await fsp.rm(gone);
    expect((await request(track?.mediaUrl as string)).status).toBe(404);
  });

  it('does not follow a symlink that was swapped to a non-audio target after authorisation', async (context) => {
    const { registry, request } = setup();
    const link = path.join(root, 'swap.wav');
    await fsp.writeFile(link, wav);
    const [track] = await authorise([link], registry);
    await fsp.rm(link);
    try {
      await fsp.symlink(path.join(outside, 'secret.txt'), link);
    } catch {
      context.skip('symlink creation is not permitted on this host');
      return;
    }
    const response = await request(track?.mediaUrl as string);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('top secret');
  });

  it('rechecks the extension after realpath: a symlink to a non-audio target is refused', async (context) => {
    const { registry, request } = setup();
    const link = path.join(root, 'link-to-secret.wav');
    try {
      await fsp.symlink(path.join(outside, 'secret.txt'), link);
    } catch {
      context.skip('symlink creation is not permitted on this host');
      return;
    }
    const [track] = await authorise([link], registry);
    expect(track).toBeDefined();
    const response = await request(track?.mediaUrl as string);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('top secret');
  });

  it('clearing the registry revokes every token (window closed)', async () => {
    const { registry, request } = setup();
    const [track] = await authorise([path.join(root, 'tone.wav')], registry);
    expect((await request(track?.mediaUrl as string)).status).toBe(200);
    registry.clear();
    expect((await request(track?.mediaUrl as string)).status).toBe(404);
  });
});
