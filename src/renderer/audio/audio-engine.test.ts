import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDomAudioEngine, mapMediaErrorCode, type AudioEngineEvent } from './audio-engine';

function audioElement(): HTMLAudioElement {
  const el = document.querySelector<HTMLAudioElement>('audio[data-part="audio-source"]');
  if (el === null) {
    throw new Error('no audio element');
  }
  return el;
}

// jsdom does not implement media playback; stub the methods the engine calls.
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('mapMediaErrorCode', () => {
  it.each([
    [1, null],
    [2, 'NOT_FOUND'],
    [3, 'CORRUPT'],
    [4, 'UNSUPPORTED'],
    [undefined, 'DECODE'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(mapMediaErrorCode(code)).toBe(expected);
  });
});

describe('createDomAudioEngine', () => {
  it('creates one hidden tagged element and removes it on dispose', () => {
    const engine = createDomAudioEngine();
    expect(document.querySelectorAll('audio[data-part="audio-source"]')).toHaveLength(1);
    expect(audioElement().hidden).toBe(true);
    engine.dispose();
    engine.dispose();
    expect(document.querySelector('audio')).toBeNull();
  });

  it('forwards element events and stops after unsubscribe and dispose', () => {
    const engine = createDomAudioEngine();
    const el = audioElement();
    const seen: AudioEngineEvent[] = [];
    const off = engine.subscribe((e) => seen.push(e));
    Object.defineProperty(el, 'duration', { value: 12, configurable: true });
    Object.defineProperty(el, 'currentTime', { value: 3, writable: true, configurable: true });
    el.dispatchEvent(new Event('loadedmetadata'));
    el.dispatchEvent(new Event('timeupdate'));
    el.dispatchEvent(new Event('ended'));
    expect(seen).toEqual([
      { type: 'metadata', durationSec: 12 },
      { type: 'time', positionSec: 3 },
      { type: 'ended' },
    ]);
    off();
    el.dispatchEvent(new Event('ended'));
    expect(seen).toHaveLength(3);
    engine.dispose();
  });

  it('emits a mapped error and ignores aborted loads', () => {
    const engine = createDomAudioEngine();
    const el = audioElement();
    const seen: AudioEngineEvent[] = [];
    engine.subscribe((e) => seen.push(e));
    Object.defineProperty(el, 'error', { value: { code: 4 }, configurable: true });
    el.dispatchEvent(new Event('error'));
    Object.defineProperty(el, 'error', { value: { code: 1 }, configurable: true });
    el.dispatchEvent(new Event('error'));
    expect(seen).toEqual([{ type: 'error', code: 'UNSUPPORTED' }]);
    engine.dispose();
  });

  it('applies volume, mute, seek and stop to the element', () => {
    const engine = createDomAudioEngine();
    const el = audioElement();
    vi.spyOn(el, 'pause').mockImplementation(() => undefined);
    engine.setVolume(2);
    expect(el.volume).toBe(1);
    engine.setVolume(Number.NaN);
    expect(el.volume).toBe(0);
    engine.setVolume(0.25);
    expect(el.volume).toBe(0.25);
    engine.setMuted(true);
    expect(el.muted).toBe(true);
    Object.defineProperty(el, 'currentTime', { value: 0, writable: true, configurable: true });
    engine.seek(7);
    expect(el.currentTime).toBe(7);
    engine.seek(-1);
    expect(el.currentTime).toBe(7);
    engine.stop();
    expect(el.currentTime).toBe(0);
    engine.dispose();
  });
});
