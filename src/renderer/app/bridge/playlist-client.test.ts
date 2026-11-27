import { describe, expect, it, vi } from 'vitest';
import { createPlaylistClient } from './necroamp-client';

const TRACK = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'a.mp3',
  title: 'a',
  artist: 'x',
  album: '',
  durationSec: 12,
  artworkUrl: 'media://art/22222222-2222-4222-8222-222222222222',
  available: true,
};

const host = (playlist: unknown) => ({ necroamp: { playlist } });

describe('createPlaylistClient', () => {
  it.each([{}, { necroamp: null }, { necroamp: { playlist: {} } }])(
    'reports unavailable for %j',
    async (h) => {
      const client = createPlaylistClient(h);
      expect(await client.load()).toEqual({ ok: false, reason: 'unavailable' });
      expect(await client.save([], null)).toEqual({ ok: false, reason: 'unavailable' });
    },
  );

  it('returns parsed items on load', async () => {
    const client = createPlaylistClient(
      host({
        load: () => Promise.resolve({ ok: true, data: { schemaVersion: 1, items: [TRACK] } }),
      }),
    );
    expect(await client.load()).toEqual({ ok: true, items: [TRACK], selectedTrackId: null });
  });
  it('passes the resolved selected track id through on load', async () => {
    const client = createPlaylistClient(
      host({
        load: () =>
          Promise.resolve({
            ok: true,
            data: { schemaVersion: 1, items: [TRACK], selectedTrackId: TRACK.trackId },
          }),
      }),
    );
    expect(await client.load()).toEqual({
      ok: true,
      items: [TRACK],
      selectedTrackId: TRACK.trackId,
    });
  });

  it('maps rejection, invalid and ipc-error responses on load', async () => {
    expect(
      await createPlaylistClient(
        host({ load: () => Promise.reject(new Error('C:\\secret')) }),
      ).load(),
    ).toEqual({ ok: false, reason: 'rejected' });
    expect(
      await createPlaylistClient(
        host({
          load: () =>
            Promise.resolve({
              ok: true,
              data: { schemaVersion: 1, items: [{ ...TRACK, path: 'C:\\a.mp3' }] },
            }),
        }),
      ).load(),
    ).toEqual({ ok: false, reason: 'invalid-response' });
    expect(
      await createPlaylistClient(
        host({
          load: () => Promise.resolve({ ok: false, error: { code: 'INTERNAL', message: 'x' } }),
        }),
      ).load(),
    ).toEqual({ ok: false, reason: 'ipc-error' });
  });

  it('sends only track ids on save and parses the reply', async () => {
    const save = vi.fn(() => Promise.resolve({ ok: true, data: { saved: true } }));
    const client = createPlaylistClient(host({ save }));
    expect(await client.save([TRACK.trackId], TRACK.trackId)).toEqual({ ok: true });
    expect(save).toHaveBeenCalledWith({
      items: [{ trackId: TRACK.trackId }],
      selectedTrackId: TRACK.trackId,
    });
  });

  it('maps rejection, invalid and ipc-error responses on save', async () => {
    expect(
      await createPlaylistClient(host({ save: () => Promise.reject(new Error('x')) })).save(
        [],
        null,
      ),
    ).toEqual({ ok: false, reason: 'rejected' });
    expect(
      await createPlaylistClient(host({ save: () => Promise.resolve({ nope: 1 }) })).save([], null),
    ).toEqual({ ok: false, reason: 'invalid-response' });
    expect(
      await createPlaylistClient(
        host({
          save: () => Promise.resolve({ ok: false, error: { code: 'INTERNAL', message: 'x' } }),
        }),
      ).save([], null),
    ).toEqual({ ok: false, reason: 'ipc-error' });
  });
});
