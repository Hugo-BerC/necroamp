import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDomAudioEngine } from '@renderer/audio';
import { createPlayerStore, type LibraryClient } from '@renderer/stores/player-store';

// Block A resource cleanup: the real DOM engine and the real store together (jsdom).
// jsdom does not decode audio, so element methods that would start the media pipeline are stubbed.

const TRACK = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'tone.wav',
  title: 'tone',
  artist: 'Unknown artist',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};

const client: LibraryClient = {
  openFiles: () => Promise.resolve({ ok: true, data: { tracks: [TRACK] } }),
};

function stubMediaElement(): void {
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const audioElements = () => document.querySelectorAll('audio[data-part="audio-source"]');

describe('player store + DOM engine cleanup', () => {
  it('creates exactly one media element and removes it on dispose', async () => {
    stubMediaElement();
    const store = createPlayerStore(createDomAudioEngine(), client);
    expect(audioElements()).toHaveLength(1);
    await store.getState().open();
    expect(audioElements()[0]?.getAttribute('src')).toBe(TRACK.mediaUrl);
    store.getState().dispose();
    expect(audioElements()).toHaveLength(0);
  });

  it('dispose is idempotent', () => {
    stubMediaElement();
    const store = createPlayerStore(createDomAudioEngine(), client);
    store.getState().dispose();
    expect(() => {
      store.getState().dispose();
    }).not.toThrow();
    expect(audioElements()).toHaveLength(0);
  });

  it('element events after dispose no longer reach the store', async () => {
    stubMediaElement();
    const store = createPlayerStore(createDomAudioEngine(), client);
    await store.getState().open();
    const element = audioElements()[0] as HTMLAudioElement;
    store.getState().dispose();
    const before = store.getState().playback;
    element.dispatchEvent(new Event('ended'));
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('error'));
    expect(store.getState().playback).toBe(before);
  });

  it('dispose pauses and releases the source', async () => {
    stubMediaElement();
    const engine = createDomAudioEngine();
    const store = createPlayerStore(engine, client);
    await store.getState().open();
    const element = audioElements()[0] as HTMLAudioElement;
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);
    pause.mockClear();
    store.getState().dispose();
    expect(pause).toHaveBeenCalled();
    expect(element.getAttribute('src')).toBeNull();
  });

  it('play after dispose does not touch the released element', async () => {
    stubMediaElement();
    const engine = createDomAudioEngine();
    engine.dispose();
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    play.mockClear();
    await engine.play();
    expect(play).not.toHaveBeenCalled();
  });
});
