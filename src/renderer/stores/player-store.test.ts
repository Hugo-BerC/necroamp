import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import type { AudioEngine, AudioEngineEvent, AudioEngineListener } from '@renderer/audio';
import { createPlayerStore, type LibraryClient, type LibraryClientResult } from './player-store';

const TRACK: TrackInfo = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'tone.mp3',
  title: 'tone',
  artist: 'Unknown artist',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};

function fakeEngine() {
  let listener: AudioEngineListener | undefined;
  const engine = {
    load: vi.fn<AudioEngine['load']>(),
    play: vi.fn<AudioEngine['play']>(() => Promise.resolve()),
    pause: vi.fn<AudioEngine['pause']>(),
    stop: vi.fn<AudioEngine['stop']>(),
    seek: vi.fn<AudioEngine['seek']>(),
    setVolume: vi.fn<AudioEngine['setVolume']>(),
    setMuted: vi.fn<AudioEngine['setMuted']>(),
    subscribe: vi.fn<AudioEngine['subscribe']>((l) => {
      listener = l;
      return () => {
        listener = undefined;
      };
    }),
    dispose: vi.fn<AudioEngine['dispose']>(),
  };
  return {
    engine: engine satisfies AudioEngine,
    mocks: engine,
    emit: (e: AudioEngineEvent) => listener?.(e),
    hasListener: () => listener !== undefined,
  };
}

function setup(result: LibraryClientResult = { ok: true, data: { tracks: [TRACK] } }) {
  const fake = fakeEngine();
  const client: LibraryClient = { openFiles: vi.fn(() => Promise.resolve(result)) };
  const store = createPlayerStore(fake.engine, client);
  return { ...fake, client, store };
}

describe('player store', () => {
  it('opens a file, loads its media URL and starts playing', async () => {
    const { store, mocks, client } = setup();
    await store.getState().open();
    expect(client.openFiles).toHaveBeenCalledWith({ multiple: false });
    expect(mocks.load).toHaveBeenCalledWith(TRACK.mediaUrl);
    expect(mocks.play).toHaveBeenCalledOnce();
    expect(store.getState().track).toEqual(TRACK);
    expect(store.getState().playback.status).toBe('playing');
  });

  it('does nothing when the dialog is cancelled', async () => {
    const { store, mocks } = setup({ ok: true, data: { tracks: [] } });
    await store.getState().open();
    expect(mocks.load).not.toHaveBeenCalled();
    expect(store.getState().playback.status).toBe('idle');
  });

  it('records a bridge failure without touching the engine', async () => {
    const { store, mocks } = setup({ ok: false, reason: 'unavailable' });
    await store.getState().open();
    expect(store.getState().openFailure).toBe('unavailable');
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it('pauses, resumes and stops through the engine', async () => {
    const { store, mocks, emit } = setup();
    await store.getState().open();
    emit({ type: 'metadata', durationSec: 10 });
    store.getState().pause();
    expect(mocks.pause).toHaveBeenCalledOnce();
    expect(store.getState().playback.status).toBe('paused');
    await store.getState().play();
    expect(mocks.play).toHaveBeenCalledTimes(2);
    expect(store.getState().playback.status).toBe('playing');
    store.getState().stop();
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(store.getState().playback).toMatchObject({ status: 'stopped', positionSec: 0 });
  });

  it('ignores play, pause, stop and seek with no track', async () => {
    const { store, mocks } = setup();
    await store.getState().play();
    store.getState().pause();
    store.getState().stop();
    store.getState().seek(5);
    expect(mocks.play).not.toHaveBeenCalled();
    expect(mocks.pause).not.toHaveBeenCalled();
    expect(mocks.stop).not.toHaveBeenCalled();
    expect(mocks.seek).not.toHaveBeenCalled();
  });

  it('tracks progress and clamps seek to the duration', async () => {
    const { store, mocks, emit } = setup();
    await store.getState().open();
    emit({ type: 'metadata', durationSec: 10 });
    emit({ type: 'time', positionSec: 2.5 });
    expect(store.getState().playback).toMatchObject({ positionSec: 2.5, durationSec: 10 });
    store.getState().seek(99);
    expect(mocks.seek).toHaveBeenLastCalledWith(10);
  });

  it('sets volume with clamping and toggles mute without losing volume', () => {
    const { store, mocks } = setup();
    store.getState().setVolume(1.7);
    expect(mocks.setVolume).toHaveBeenLastCalledWith(1);
    store.getState().setVolume(0.3);
    store.getState().toggleMute();
    expect(mocks.setMuted).toHaveBeenLastCalledWith(true);
    expect(store.getState().playback).toMatchObject({ volume: 0.3, muted: true });
    store.getState().toggleMute();
    expect(mocks.setMuted).toHaveBeenLastCalledWith(false);
  });

  it('shows an engine error and reloads the track on the next play', async () => {
    const { store, mocks, emit } = setup();
    await store.getState().open();
    emit({ type: 'error', code: 'CORRUPT' });
    expect(store.getState().playback).toMatchObject({ status: 'error', error: 'CORRUPT' });
    await store.getState().play();
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(store.getState().playback.error).toBeNull();
  });

  it('returns to stopped when the track ends', async () => {
    const { store, emit } = setup();
    await store.getState().open();
    emit({ type: 'metadata', durationSec: 1 });
    emit({ type: 'ended' });
    expect(store.getState().playback).toMatchObject({ status: 'stopped', positionSec: 0 });
  });

  it('reports an unsupported source rejected by play(), and ignores other rejections', async () => {
    const { store, mocks } = setup();
    mocks.play.mockRejectedValueOnce(new DOMException('x', 'NotSupportedError'));
    await store.getState().open();
    expect(store.getState().playback.error).toBe('UNSUPPORTED');
    const second = setup();
    second.mocks.play.mockRejectedValueOnce(new DOMException('x', 'AbortError'));
    await second.store.getState().open();
    expect(second.store.getState().playback.error).toBeNull();
  });

  it('shows paused, not playing, when play() is rejected with NotAllowedError', async () => {
    const { store, mocks } = setup();
    mocks.play.mockRejectedValueOnce(new DOMException('x', 'NotAllowedError'));
    await store.getState().open();
    expect(store.getState().playback.status).toBe('paused');
    expect(store.getState().playback.error).toBeNull();
  });
  it('ignores a late play() rejection that belongs to a replaced load', async () => {
    const { store, mocks } = setup();
    let rejectFirst: (reason: unknown) => void = () => undefined;
    mocks.play.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    const first = store.getState().open();
    await vi.waitFor(() => {
      expect(mocks.play).toHaveBeenCalledOnce();
    });
    await store.getState().open();
    rejectFirst(new DOMException('x', 'NotAllowedError'));
    await first;
    expect(store.getState().playback.status).toBe('playing');
  });
  it('dispose unsubscribes and disposes the engine', () => {
    const { store, mocks, hasListener } = setup();
    expect(hasListener()).toBe(true);
    store.getState().dispose();
    expect(hasListener()).toBe(false);
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
});

describe('player store load without play', () => {
  it('loadTrack loads the track, never plays, and becomes stopped when metadata arrives', () => {
    const { store, mocks, emit } = setup();
    store.getState().loadTrack(TRACK);
    expect(mocks.load).toHaveBeenCalledWith(TRACK.mediaUrl);
    expect(mocks.play).not.toHaveBeenCalled();
    expect(store.getState().track).toEqual(TRACK);
    expect(store.getState().playback.status).toBe('loading');
    emit({ type: 'metadata', durationSec: 42 });
    expect(store.getState().playback).toMatchObject({ status: 'stopped', durationSec: 42 });
  });

  it('play after loadTrack starts playback of the loaded track', async () => {
    const { store, mocks, emit } = setup();
    store.getState().loadTrack(TRACK);
    emit({ type: 'metadata', durationSec: 42 });
    await store.getState().play();
    expect(mocks.play).toHaveBeenCalledOnce();
    expect(mocks.load).toHaveBeenCalledOnce();
    expect(store.getState().playback.status).toBe('playing');
  });

  it('unload stops the engine, forgets the track and keeps volume and mute', async () => {
    const { store, mocks } = setup();
    await store.getState().open();
    store.getState().setVolume(0.3);
    store.getState().toggleMute();
    store.getState().unload();
    expect(mocks.stop).toHaveBeenCalled();
    expect(store.getState().track).toBeNull();
    expect(store.getState().playback).toMatchObject({
      status: 'idle',
      trackId: null,
      volume: 0.3,
      muted: true,
    });
  });

  it('unload on an idle player does not touch the engine', () => {
    const { store, mocks } = setup();
    store.getState().unload();
    expect(mocks.stop).not.toHaveBeenCalled();
  });
});
