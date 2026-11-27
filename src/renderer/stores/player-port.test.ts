import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import type { AudioEngine, AudioEngineEvent, AudioEngineListener } from '@renderer/audio';
import { createPlayerPort } from './player-port';
import { createPlayerStore } from './player-store';

const TRACK: TrackInfo = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'tone.mp3',
  title: 'tone',
  artist: '',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};

function setup() {
  let listener: AudioEngineListener | undefined;
  const engine: AudioEngine = {
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    subscribe: (l) => {
      listener = l;
      return () => undefined;
    },
    dispose: vi.fn(),
  };
  const store = createPlayerStore(engine, {
    openFiles: () => Promise.resolve({ ok: true, data: { tracks: [] } }),
  });
  const port = createPlayerPort(store);
  return { engine, store, port, emit: (e: AudioEngineEvent) => listener?.(e) };
}

describe('player store outcomes', () => {
  it('playTrack loads and plays a known track', async () => {
    const { store, engine } = setup();
    await store.getState().playTrack(TRACK);
    expect(engine.load).toHaveBeenCalledWith(TRACK.mediaUrl);
    expect(store.getState().track).toEqual(TRACK);
    expect(store.getState().playback.status).toBe('playing');
  });

  it('records ended only when a track was playing', async () => {
    const { store, emit } = setup();
    emit({ type: 'ended' });
    expect(store.getState().lastOutcome).toBeNull();
    await store.getState().playTrack(TRACK);
    emit({ type: 'ended' });
    expect(store.getState().lastOutcome).toEqual({ seq: 1, kind: 'ended', trackId: TRACK.trackId });
    emit({ type: 'ended' }); // late duplicate while stopped
    expect(store.getState().lastOutcome?.seq).toBe(1);
  });

  it('records a failed load', async () => {
    const { store, emit } = setup();
    await store.getState().playTrack(TRACK);
    emit({ type: 'error', code: 'CORRUPT' });
    expect(store.getState().lastOutcome).toEqual({
      seq: 1,
      kind: 'failed',
      trackId: TRACK.trackId,
    });
  });
});

describe('player port', () => {
  it('forwards outcomes once each and unsubscribes', async () => {
    const { store, port, emit } = setup();
    const listener = vi.fn();
    const off = port.subscribe(listener);
    await port.playTrack(TRACK);
    emit({ type: 'ended' });
    store.getState().setVolume(0.5); // unrelated state change must not re-emit
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ kind: 'ended', trackId: TRACK.trackId });
    off();
    await port.playTrack(TRACK);
    emit({ type: 'ended' });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('does not replay an outcome that happened before subscribing', async () => {
    const { port, emit } = setup();
    await port.playTrack(TRACK);
    emit({ type: 'ended' });
    const listener = vi.fn();
    port.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
  });

  it('exposes position, stop and restart', async () => {
    const { store, port, engine, emit } = setup();
    await port.playTrack(TRACK);
    emit({ type: 'metadata', durationSec: 100 });
    emit({ type: 'time', positionSec: 42 });
    expect(port.positionSec()).toBe(42);
    port.restart(); // playing: seek only
    expect(engine.seek).toHaveBeenCalledWith(0);
    expect(engine.play).toHaveBeenCalledOnce();
    port.stop();
    expect(store.getState().playback.status).toBe('stopped');
    port.restart(); // stopped: seek and play
    await vi.waitFor(() => {
      expect(engine.play).toHaveBeenCalledTimes(2);
    });
  });
});
