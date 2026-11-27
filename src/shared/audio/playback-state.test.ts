import { describe, expect, it } from 'vitest';
import {
  INITIAL_PLAYBACK_STATE,
  clampPosition,
  clampVolume,
  reducePlayback,
  type PlaybackEvent,
  type PlaybackState,
} from './playback-state';

function run(events: readonly PlaybackEvent[], from: PlaybackState = INITIAL_PLAYBACK_STATE) {
  return events.reduce(reducePlayback, from);
}
const LOAD: PlaybackEvent = { type: 'load', trackId: 't1' };

describe('reducePlayback', () => {
  it('ignores transport events while idle', () => {
    for (const type of ['play', 'pause', 'stop', 'ended'] as const) {
      expect(reducePlayback(INITIAL_PLAYBACK_STATE, { type })).toBe(INITIAL_PLAYBACK_STATE);
    }
  });

  it('loads, learns the duration, plays, pauses, stops', () => {
    expect(run([LOAD]).status).toBe('loading');
    const loaded = run([LOAD, { type: 'loaded', durationSec: 10 }]);
    expect(loaded).toMatchObject({ status: 'stopped', durationSec: 10 });
    const playing = run([{ type: 'play' }], loaded);
    expect(playing.status).toBe('playing');
    expect(run([{ type: 'tick', positionSec: 4 }], playing).positionSec).toBe(4);
    const paused = run([{ type: 'tick', positionSec: 4 }, { type: 'pause' }], playing);
    expect(paused).toMatchObject({ status: 'paused', positionSec: 4 });
    expect(run([{ type: 'stop' }], paused)).toMatchObject({ status: 'stopped', positionSec: 0 });
  });

  it('keeps playing when metadata arrives after play was requested', () => {
    const state = run([LOAD, { type: 'play' }, { type: 'loaded', durationSec: 3 }]);
    expect(state).toMatchObject({ status: 'playing', durationSec: 3 });
  });

  it('clamps seek to the duration and to zero', () => {
    const base = run([LOAD, { type: 'loaded', durationSec: 10 }]);
    expect(run([{ type: 'seek', positionSec: 99 }], base).positionSec).toBe(10);
    expect(run([{ type: 'seek', positionSec: -5 }], base).positionSec).toBe(0);
    expect(run([{ type: 'seek', positionSec: Number.NaN }], base).positionSec).toBe(0);
  });

  it('returns the same object for an unchanged tick', () => {
    const playing = run([LOAD, { type: 'loaded', durationSec: 10 }, { type: 'play' }]);
    expect(reducePlayback(playing, { type: 'tick', positionSec: 0 })).toBe(playing);
  });

  it('ends back at stopped with position zero', () => {
    const state = run([
      LOAD,
      { type: 'loaded', durationSec: 2 },
      { type: 'play' },
      { type: 'tick', positionSec: 2 },
      { type: 'ended' },
    ]);
    expect(state).toMatchObject({ status: 'stopped', positionSec: 0 });
  });

  it('records a failure code and a reload clears it', () => {
    const failed = run([LOAD, { type: 'failed', code: 'CORRUPT' }]);
    expect(failed).toMatchObject({ status: 'error', error: 'CORRUPT' });
    expect(run([{ type: 'play' }], failed).status).toBe('error');
    expect(run([LOAD], failed)).toMatchObject({ status: 'loading', error: null });
    expect(reducePlayback(INITIAL_PLAYBACK_STATE, { type: 'failed', code: 'DECODE' })).toBe(
      INITIAL_PLAYBACK_STATE,
    );
  });

  it('clamps volume and mute keeps the volume', () => {
    expect(run([{ type: 'volume', volume: 3 }]).volume).toBe(1);
    expect(run([{ type: 'volume', volume: -1 }]).volume).toBe(0);
    const muted = run([
      { type: 'volume', volume: 0.4 },
      { type: 'mute', muted: true },
    ]);
    expect(muted).toMatchObject({ volume: 0.4, muted: true });
    expect(run([{ type: 'mute', muted: false }], muted).volume).toBe(0.4);
  });

  it('clamp helpers handle non-finite input', () => {
    expect(clampVolume(Number.NaN)).toBe(0);
    expect(clampPosition(Number.POSITIVE_INFINITY, 5)).toBe(0);
    expect(clampPosition(3, null)).toBe(3);
  });

  it('ignores loaded and tick in states that cannot take them', () => {
    expect(reducePlayback(INITIAL_PLAYBACK_STATE, { type: 'loaded', durationSec: 1 })).toBe(
      INITIAL_PLAYBACK_STATE,
    );
    const loaded = run([LOAD, { type: 'loaded', durationSec: -1 }]);
    expect(loaded.durationSec).toBeNull();
    expect(reducePlayback(loaded, { type: 'tick', positionSec: 1 })).toBe(loaded);
  });
});
