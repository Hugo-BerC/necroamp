import { describe, expect, it } from 'vitest';
import { createLibraryClient } from './necroamp-client';

const TRACK = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'a.mp3',
  title: 'a',
  artist: 'x',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};
const host = (openFiles: unknown) => ({ necroamp: { library: { openFiles } } });

describe('createLibraryClient', () => {
  it.each([{}, { necroamp: null }, { necroamp: { library: {} } }])(
    'reports unavailable for %j',
    async (h) => {
      expect(await createLibraryClient(h).openFiles({ multiple: false })).toEqual({
        ok: false,
        reason: 'unavailable',
      });
    },
  );

  it('returns parsed tracks', async () => {
    const client = createLibraryClient(
      host(() => Promise.resolve({ ok: true, data: { tracks: [TRACK] } })),
    );
    expect(await client.openFiles({ multiple: false })).toEqual({
      ok: true,
      data: { tracks: [TRACK] },
    });
  });

  it('rejects a response carrying a path or an extra key', async () => {
    const client = createLibraryClient(
      host(() =>
        Promise.resolve({ ok: true, data: { tracks: [{ ...TRACK, filePath: 'C:\\x.mp3' }] } }),
      ),
    );
    expect(await client.openFiles({ multiple: false })).toEqual({
      ok: false,
      reason: 'invalid-response',
    });
  });

  it('maps a thrown bridge call and an ok:false envelope', async () => {
    const thrown = createLibraryClient(
      host(() => {
        throw new Error('C:\\secret');
      }),
    );
    expect(await thrown.openFiles({ multiple: true })).toEqual({ ok: false, reason: 'rejected' });
    const refused = createLibraryClient(
      host(() =>
        Promise.resolve({
          ok: false,
          error: { code: 'INVALID_SENDER', message: 'The request came from an untrusted sender.' },
        }),
      ),
    );
    expect(await refused.openFiles({ multiple: false })).toEqual({
      ok: false,
      reason: 'ipc-error',
    });
  });
});
