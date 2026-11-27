import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';
import { createNecroampApi } from './create-necroamp-api';

const TOKEN = '123e4567-e89b-42d3-a456-426614174000';
const track = {
  trackId: TOKEN,
  mediaUrl: `media://track/${TOKEN}`,
  fileName: 'a.mp3',
  title: 'a',
  artist: 'Artist',
  album: 'Album',
  durationSec: 12.5,
  artworkUrl: `media://art/${TOKEN}`,
  available: true,
};

type Loose = (...args: unknown[]) => Promise<unknown>;

describe('library.resolveTrack', () => {
  it('invokes only library:resolve-track with the parsed token', async () => {
    const invoke = vi.fn(() => Promise.resolve({ ok: true, data: { track } }));
    const api = createNecroampApi(invoke);
    const result = await api.library.resolveTrack({ trackId: TOKEN });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.libraryResolveTrack, { trackId: TOKEN });
    expect(result).toEqual({ ok: true, data: { track } });
  });

  it('passes the unavailable answer through', async () => {
    const api = createNecroampApi(() => Promise.resolve({ ok: true, data: { unavailable: true } }));
    expect(await api.library.resolveTrack({ trackId: TOKEN })).toEqual({
      ok: true,
      data: { unavailable: true },
    });
  });

  it.each([
    [],
    [{}],
    [{ trackId: 'C:\\x.mp3' }],
    [{ trackId: TOKEN, path: 'x' }],
    [{ trackId: TOKEN }, 1],
  ])('rejects invalid request %j before invoking', async (...args) => {
    const invoke = vi.fn(() => Promise.resolve({}));
    const result = await (createNecroampApi(invoke).library.resolveTrack as Loose)(...args);
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('maps a transport failure and a malformed reply to INTERNAL without leaking text', async () => {
    const failing = createNecroampApi(() => Promise.reject(new Error('C:\\secret\\a.mp3')));
    const bad = createNecroampApi(() => Promise.resolve({ ok: true, data: { path: 'C:\\x' } }));
    for (const api of [failing, bad]) {
      const result = await api.library.resolveTrack({ trackId: TOKEN });
      expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
      expect(JSON.stringify(result)).not.toContain('secret');
    }
  });
});

describe('playlist.load and playlist.save', () => {
  it('load invokes playlist:load with no payload and returns the parsed reply', async () => {
    const reply = { ok: true, data: { schemaVersion: 1, items: [track] } };
    const invoke = vi.fn(() => Promise.resolve(reply));
    expect(await createNecroampApi(invoke).playlist.load()).toEqual(reply);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.playlistLoad);
  });

  it('load rejects arguments and a wrong schema version', async () => {
    const invoke = vi.fn(() =>
      Promise.resolve({ ok: true, data: { schemaVersion: 2, items: [] } }),
    );
    const api = createNecroampApi(invoke);
    expect(await (api.playlist.load as Loose)('x')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(await api.playlist.load()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
  });

  it('save forwards only trackId entries', async () => {
    const invoke = vi.fn(() => Promise.resolve({ ok: true, data: { saved: true } }));
    const api = createNecroampApi(invoke);
    const result = await api.playlist.save({ items: [{ trackId: TOKEN }] });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.playlistSave, { items: [{ trackId: TOKEN }] });
    expect(result).toEqual({ ok: true, data: { saved: true } });
  });

  it.each([
    [],
    [{}],
    [{ items: [{ trackId: 'nope' }] }],
    [{ items: [{ trackId: TOKEN, path: 'C:\\x.mp3' }] }],
    [{ items: 'x' }],
    [{ items: new Array(5001).fill({ trackId: TOKEN }) }],
  ])('save rejects invalid request before invoking', async (...args) => {
    const invoke = vi.fn(() => Promise.resolve({}));
    const result = await (createNecroampApi(invoke).playlist.save as Loose)(...args);
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('save maps a transport failure to INTERNAL', async () => {
    const api = createNecroampApi(() => Promise.reject(new Error('EACCES C:\\Users\\me')));
    const result = await api.playlist.save({ items: [] });
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain('Users');
  });
});
