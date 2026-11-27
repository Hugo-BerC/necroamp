import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  INITIAL_PLAYBACK_STATE,
  PLAYBACK_ERROR_CODES,
  clampPosition,
  clampVolume,
  reducePlayback,
  type PlaybackEvent,
  type PlaybackState,
} from './playback-state';

// Block A playback state invariants over arbitrary event sequences.

const anyNumber = fc.oneof(
  fc.double(),
  fc.double({ min: -10, max: 400, noNaN: true }),
  fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0),
);

const eventArb: fc.Arbitrary<PlaybackEvent> = fc.oneof(
  fc.record({ type: fc.constant('load' as const), trackId: fc.uuid() }),
  fc.record({
    type: fc.constant('loaded' as const),
    durationSec: fc.oneof(anyNumber, fc.constant(null)),
  }),
  fc.record({ type: fc.constant('tick' as const), positionSec: anyNumber }),
  fc.constant({ type: 'play' as const }),
  fc.constant({ type: 'pause' as const }),
  fc.constant({ type: 'stop' as const }),
  fc.record({ type: fc.constant('seek' as const), positionSec: anyNumber }),
  fc.constant({ type: 'ended' as const }),
  fc.record({
    type: fc.constant('failed' as const),
    code: fc.constantFrom(...PLAYBACK_ERROR_CODES),
  }),
  fc.record({ type: fc.constant('volume' as const), volume: anyNumber }),
  fc.record({ type: fc.constant('mute' as const), muted: fc.boolean() }),
);

function run(events: readonly PlaybackEvent[]): PlaybackState[] {
  const states = [INITIAL_PLAYBACK_STATE];
  for (const event of events) {
    states.push(reducePlayback(states[states.length - 1] as PlaybackState, event));
  }
  return states;
}

function finalState(events: readonly PlaybackEvent[]): PlaybackState {
  return run(events).at(-1) as PlaybackState;
}

describe('playback state properties', () => {
  it('never throws and always keeps its invariants', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 60 }), (events) => {
        for (const state of run(events)) {
          expect(state.volume).toBeGreaterThanOrEqual(0);
          expect(state.volume).toBeLessThanOrEqual(1);
          expect(Number.isFinite(state.positionSec)).toBe(true);
          expect(state.positionSec).toBeGreaterThanOrEqual(0);
          if (state.durationSec !== null) {
            expect(Number.isFinite(state.durationSec)).toBe(true);
            expect(state.durationSec).toBeGreaterThanOrEqual(0);
            expect(state.positionSec).toBeLessThanOrEqual(state.durationSec);
          }
          expect(state.error !== null).toBe(state.status === 'error');
          expect(state.trackId === null).toBe(state.status === 'idle');
        }
      }),
    );
  });

  it('never leaves idle without a load', () => {
    const transport = fc.constantFrom<PlaybackEvent>(
      { type: 'play' },
      { type: 'pause' },
      { type: 'stop' },
      { type: 'seek', positionSec: 5 },
      { type: 'ended' },
      { type: 'tick', positionSec: 3 },
      { type: 'loaded', durationSec: 10 },
    );
    fc.assert(
      fc.property(fc.array(transport, { maxLength: 20 }), (events) => {
        for (const state of run(events)) expect(state.status).toBe('idle');
      }),
    );
  });

  it('stop and ended always land on stopped at position zero when they apply', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { maxLength: 40 }),
        fc.constantFrom<'stop' | 'ended'>('stop', 'ended'),
        (events, type) => {
          const before = finalState(events);
          const after = reducePlayback(before, { type });
          if (after !== before) {
            expect(after.status).toBe('stopped');
            expect(after.positionSec).toBe(0);
          }
        },
      ),
    );
  });

  it('volume and mute events never change transport status, position or track', () => {
    fc.assert(
      fc.property(
        fc.array(eventArb, { maxLength: 40 }),
        anyNumber,
        fc.boolean(),
        (events, volume, muted) => {
          const before = finalState(events);
          for (const event of [
            { type: 'volume', volume },
            { type: 'mute', muted },
          ] as const) {
            const after = reducePlayback(before, event);
            expect(after.status).toBe(before.status);
            expect(after.positionSec).toBe(before.positionSec);
            expect(after.trackId).toBe(before.trackId);
          }
        },
      ),
    );
  });

  it('mute keeps the stored volume', () => {
    fc.assert(
      fc.property(anyNumber, (volume) => {
        const set = reducePlayback(INITIAL_PLAYBACK_STATE, { type: 'volume', volume });
        const muted = reducePlayback(set, { type: 'mute', muted: true });
        expect(muted.volume).toBe(set.volume);
        expect(reducePlayback(muted, { type: 'mute', muted: false }).volume).toBe(set.volume);
      }),
    );
  });

  it('a new load always clears an error and the previous position', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), fc.uuid(), (events, trackId) => {
        const after = reducePlayback(finalState(events), { type: 'load', trackId });
        expect(after).toMatchObject({
          status: 'loading',
          trackId,
          positionSec: 0,
          durationSec: null,
          error: null,
        });
      }),
    );
  });

  it('clampVolume and clampPosition are total, idempotent and bounded', () => {
    fc.assert(
      fc.property(anyNumber, fc.oneof(anyNumber, fc.constant(null)), (value, duration) => {
        const v = clampVolume(value);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        expect(clampVolume(v)).toBeCloseTo(v, 12);
        const known =
          duration !== null && Number.isFinite(duration) && duration >= 0 ? duration : null;
        const p = clampPosition(value, known);
        expect(p).toBeGreaterThanOrEqual(0);
        if (known !== null) expect(p).toBeLessThanOrEqual(known);
        expect(clampPosition(p, known)).toBeCloseTo(p, 12);
      }),
    );
  });

  it('is deterministic: the same events give the same states', () => {
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        expect(run(events)).toEqual(run(events));
      }),
    );
  });
});
