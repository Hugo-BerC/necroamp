import { describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import path from 'node:path';
import { createMediaRegistry } from '@main/library/media-registry';
import { createMediaProtocolHandler, type MediaFs } from '@main/protocol/media-handler';

// Unprivileged equivalents of the symlink tests that need Windows Developer Mode. A fake
// `realpath` stands in for the OS resolving a link, so the boundary logic runs on every host:
// the handler must re-check the extension on the resolved path and must never open or stat a
// resolved target it refused.
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

function setup(realpathResult: string) {
  const stat = vi.fn();
  const openRange = vi.fn();
  const fs: MediaFs = {
    realpath: () => Promise.resolve(realpathResult),
    stat,
    openRange: openRange as unknown as MediaFs['openRange'],
  };
  const registry = createMediaRegistry();
  const handler = createMediaProtocolHandler({
    registry,
    fs,
    trusted: ['app://renderer'],
    extname: path.extname,
    log,
  });
  const url = `media://track/${registry.issue('/library/song.wav')}`;
  return { handler, url, stat, openRange };
}

describe('media handler: symlink target boundary without a real symlink', () => {
  it.each(['/outside/secret.txt', '/outside/key.pem', '/outside/noext', '/outside/a.wav.exe'])(
    'refuses an audio-named path that resolves to %s and never touches the target',
    async (resolved) => {
      const { handler, url, stat, openRange } = setup(resolved);
      const res = await handler(new Request(url));
      expect(res.status).toBe(404);
      expect(res.body).toBeNull();
      expect(stat).not.toHaveBeenCalled();
      expect(openRange).not.toHaveBeenCalled();
    },
  );

  it('still serves when the resolved target keeps an audio extension', async () => {
    const { handler, url, stat, openRange } = setup('/elsewhere/real.flac');
    stat.mockResolvedValue({ size: 4, isFile: () => true });
    openRange.mockImplementation(
      () => Readable.toWeb(Readable.from([Buffer.from('abcd')])) as ReadableStream<Uint8Array>,
    );
    const res = await handler(new Request(url));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/flac');
  });
});
