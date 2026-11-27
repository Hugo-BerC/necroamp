import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { INITIAL_PLAYBACK_STATE, reducePlayback, type PlaybackEvent } from './playback-state';

describe('playback state: position stays within the duration after duration changes', () => {
  it('keeps position within the new duration when durationchange reports a shorter length', () => {
    const events: PlaybackEvent[] = [
      { type: 'load', trackId: 'a' },
      { type: 'loaded', durationSec: null },
      { type: 'play' },
      { type: 'tick', positionSec: 50 },
      { type: 'loaded', durationSec: 10 },
    ];
    const state = events.reduce(reducePlayback, INITIAL_PLAYBACK_STATE);
    expect(state.positionSec).toBe(10);
    expect(state.durationSec).toBe(10);
  });

  it('clamps to 0 when the duration becomes 0', () => {
    const events: PlaybackEvent[] = [
      { type: 'load', trackId: 'a' },
      { type: 'loaded', durationSec: 100 },
      { type: 'play' },
      { type: 'tick', positionSec: 40 },
      { type: 'loaded', durationSec: 0 },
    ];
    expect(events.reduce(reducePlayback, INITIAL_PLAYBACK_STATE).positionSec).toBe(0);
  });

  it('keeps position within [0, duration] after any event sequence', () => {
    const num = fc.oneof(fc.double({ min: -10, max: 500, noNaN: true }), fc.constant(Infinity));
    const event = fc.oneof(
      fc.record({
        type: fc.constant('loaded' as const),
        durationSec: fc.oneof(fc.constant(null), num),
      }),
      fc.record({ type: fc.constant('tick' as const), positionSec: num }),
      fc.record({ type: fc.constant('seek' as const), positionSec: num }),
      fc.constant({ type: 'play' as const }),
      fc.constant({ type: 'pause' as const }),
    );
    fc.assert(
      fc.property(fc.array(event, { maxLength: 40 }), (evs) => {
        const start = reducePlayback(INITIAL_PLAYBACK_STATE, { type: 'load', trackId: 't' });
        const s = evs.reduce<typeof start>(reducePlayback, start);
        expect(s.positionSec).toBeGreaterThanOrEqual(0);
        if (s.durationSec !== null) {
          expect(s.positionSec).toBeLessThanOrEqual(s.durationSec);
        }
      }),
    );
  });
});
