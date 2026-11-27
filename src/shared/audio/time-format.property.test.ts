import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { UNKNOWN_TIME, formatTime } from './time-format';

// tech.md "Testing": time formatting property tests are required.

const finiteNonNegative = fc.double({ min: 0, max: 1e9, noNaN: true });

function parse(text: string): number {
  return text.split(':').reduce((acc, part) => acc * 60 + Number(part), 0);
}

describe('formatTime properties', () => {
  it('never throws for any number, NaN, infinity or null', () => {
    fc.assert(
      fc.property(fc.oneof(fc.double(), fc.constant(null), fc.integer()), (value) => {
        expect(typeof formatTime(value)).toBe('string');
      }),
    );
  });

  it('maps null, NaN, infinities and negatives to the unknown marker', () => {
    fc.assert(
      fc.property(fc.double({ max: -Number.MIN_VALUE, noNaN: true }), (negative) => {
        expect(formatTime(negative)).toBe(UNKNOWN_TIME);
      }),
    );
    for (const value of [null, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(formatTime(value)).toBe(UNKNOWN_TIME);
    }
  });

  it('matches m:ss below one hour and h:mm:ss from one hour', () => {
    fc.assert(
      fc.property(finiteNonNegative, (seconds) => {
        const text = formatTime(seconds);
        expect(text).toMatch(seconds < 3600 ? /^\d+:[0-5]\d$/ : /^\d+:[0-5]\d:[0-5]\d$/);
      }),
    );
  });

  it('round-trips to the truncated whole second', () => {
    fc.assert(
      fc.property(finiteNonNegative, (seconds) => {
        expect(parse(formatTime(seconds))).toBe(Math.floor(seconds));
      }),
    );
  });

  it('never runs ahead of the real position', () => {
    fc.assert(
      fc.property(finiteNonNegative, (seconds) => {
        expect(parse(formatTime(seconds))).toBeLessThanOrEqual(seconds);
      }),
    );
  });

  it('is monotonic', () => {
    fc.assert(
      fc.property(finiteNonNegative, finiteNonNegative, (a, b) => {
        const [low, high] = a <= b ? [a, b] : [b, a];
        expect(parse(formatTime(low))).toBeLessThanOrEqual(parse(formatTime(high)));
      }),
    );
  });

  it('ignores the fractional part', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.double({ min: 0, max: 0.999, noNaN: true }),
        (whole, fraction) => {
          expect(formatTime(whole + fraction)).toBe(formatTime(whole));
        },
      ),
    );
  });

  it('pins known values', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(59.999)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(-0)).toBe('0:00');
  });
});
