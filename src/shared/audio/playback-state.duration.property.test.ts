import { describe, expect, it } from 'vitest';
import { INITIAL_PLAYBACK_STATE, reducePlayback, type PlaybackEvent } from './playback-state';

describe('playback state: duration shrinking below the position', () => {
  // Regression for Gate A defect D-A4: 'loaded' must re-clamp positionSec to the new duration.
  it('keeps position within the new duration when durationchange reports a shorter length', () => {
    const events: PlaybackEvent[] = [
      { type: 'load', trackId: 'a' },
      { type: 'loaded', durationSec: null },
      { type: 'play' },
      { type: 'tick', positionSec: 50 },
      { type: 'loaded', durationSec: 10 },
    ];
    const state = events.reduce(reducePlayback, INITIAL_PLAYBACK_STATE);
    expect(state.positionSec).toBeLessThanOrEqual(state.durationSec ?? Infinity);
  });
});
