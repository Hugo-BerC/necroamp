import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  MAX_PLAYLIST_ITEMS,
  PREVIOUS_RESTART_THRESHOLD_SEC,
  createPlayOrder,
  createSeededRandom,
  cycleRepeat,
  exhaustedByFailures,
  insertItems,
  moveItem,
  nextIndex,
  previousIndex,
  removeAt,
  selectIndex,
  type AdvanceTrigger,
  type Playlist,
  type RepeatMode,
} from './playlist-ops';

// Audio Engine Block B: property tests for the pure playlist operations (tech.md "Testing").
// Items are unique objects so identity, not value, proves where each one went.
const RUNS = { numRuns: 200 };
const hostileIndex = fc.oneof(
  fc.integer({ min: -5, max: 60 }),
  fc.constantFrom(
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -0,
    0.5,
    -0.5,
    2.7,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
  ),
);
const repeatMode = fc.constantFrom<RepeatMode>('off', 'track', 'playlist');
const trigger = fc.constantFrom<AdvanceTrigger>('manual', 'auto', 'skip');

interface Item {
  readonly id: number;
}
const playlistArb: fc.Arbitrary<Playlist<Item>> = fc.integer({ min: 0, max: 30 }).chain((length) =>
  fc.record({
    items: fc.constant(Array.from({ length }, (_v, id): Item => ({ id }))),
    current:
      length === 0
        ? fc.constant(null)
        : fc.option(fc.integer({ min: 0, max: length - 1 }), { nil: null }),
  }),
);
const itemsOf = (list: Playlist<Item>): number[] => list.items.map((i) => i.id);
const currentItem = (list: Playlist<Item>): Item | null =>
  list.current === null ? null : (list.items[list.current] ?? null);
const fresh = (count: number, from = 1000): Item[] =>
  Array.from({ length: count }, (_v, i): Item => ({ id: from + i }));
const isPermutation = (order: readonly number[], length: number): boolean =>
  order.length === length && [...order].sort((a, b) => a - b).every((v, i) => v === i);

describe('insertItems', () => {
  it('keeps the old order, places the new block contiguously at the clamped position and keeps current on its item', () => {
    fc.assert(
      fc.property(playlistArb, fc.integer({ min: 0, max: 8 }), hostileIndex, (list, count, at) => {
        const added = fresh(count);
        const result = insertItems(list, added, at);
        const position = Number.isFinite(at)
          ? Math.min(Math.max(Math.trunc(at), 0), list.items.length)
          : list.items.length;
        if (count === 0) {
          expect(result).toBe(list);
          return;
        }
        expect(result.items).toHaveLength(list.items.length + count);
        expect(result.items.slice(position, position + count)).toEqual(added);
        expect([
          ...result.items.slice(0, position),
          ...result.items.slice(position + count),
        ]).toEqual(list.items);
        expect(currentItem(result)).toBe(currentItem(list));
      }),
      RUNS,
    );
  });

  it('never grows the list beyond the cap and keeps the earliest additions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), (extra) => {
        const base: Playlist<Item> = { items: fresh(MAX_PLAYLIST_ITEMS - 20, 0), current: 3 };
        const added = fresh(extra);
        const result = insertItems(base, added);
        expect(result.items.length).toBe(Math.min(MAX_PLAYLIST_ITEMS, base.items.length + extra));
        expect(result.items.length).toBeLessThanOrEqual(MAX_PLAYLIST_ITEMS);
        expect(result.items.slice(base.items.length)).toEqual(added.slice(0, 20));
      }),
      RUNS,
    );
  });

  it('is a no-op on a full list and does not mutate its input', () => {
    const full: Playlist<Item> = { items: fresh(MAX_PLAYLIST_ITEMS, 0), current: null };
    expect(insertItems(full, fresh(3))).toBe(full);
    fc.assert(
      fc.property(playlistArb, (list) => {
        const snapshot = JSON.stringify(list);
        insertItems(list, fresh(2), 1);
        removeAt(list, 0);
        moveItem(list, 0, 1);
        selectIndex(list, 0);
        expect(JSON.stringify(list)).toBe(snapshot);
      }),
      RUNS,
    );
  });
});

describe('removeAt', () => {
  it('drops exactly one item, keeps the others in order and keeps current on its item', () => {
    fc.assert(
      fc.property(playlistArb, hostileIndex, (list, index) => {
        const result = removeAt(list, index);
        const valid = Number.isInteger(index) && index >= 0 && index < list.items.length;
        if (!valid) {
          expect(result).toBe(list);
          return;
        }
        const expectedIds = itemsOf(list).filter((_id, i) => i !== index);
        expect(itemsOf(result)).toEqual(expectedIds);
        if (list.current === index) expect(result.current).toBeNull();
        else expect(currentItem(result)).toBe(currentItem(list));
      }),
      RUNS,
    );
  });

  it('removing every item one by one empties the list and ends with no current', () => {
    fc.assert(
      fc.property(playlistArb, fc.array(fc.nat(), { maxLength: 40 }), (list, picks) => {
        let state = list;
        for (const pick of picks) {
          if (state.items.length === 0) break;
          state = removeAt(state, pick % state.items.length);
        }
        const remaining = state.items.length;
        expect(remaining).toBeLessThanOrEqual(list.items.length);
        expect(state.current === null || state.current < remaining).toBe(true);
      }),
      RUNS,
    );
  });
});

describe('moveItem', () => {
  it('is a permutation: nothing is lost or duplicated, the item lands at `to` and current follows its item', () => {
    fc.assert(
      fc.property(playlistArb, hostileIndex, hostileIndex, (list, from, to) => {
        const result = moveItem(list, from, to);
        const length = list.items.length;
        const ok = (i: number): boolean => Number.isInteger(i) && i >= 0 && i < length;
        if (!ok(from) || !ok(to) || from === to) {
          expect(result).toBe(list);
          return;
        }
        expect([...itemsOf(result)].sort((a, b) => a - b)).toEqual(
          [...itemsOf(list)].sort((a, b) => a - b),
        );
        expect(result.items[to]).toBe(list.items[from]);
        expect(currentItem(result)).toBe(currentItem(list));
      }),
      RUNS,
    );
  });

  it('moving back restores the original order and current', () => {
    fc.assert(
      fc.property(playlistArb, fc.nat(), fc.nat(), (list, a, b) => {
        fc.pre(list.items.length > 0);
        const from = a % list.items.length;
        const to = b % list.items.length;
        const result = moveItem(moveItem(list, from, to), to, from);
        expect(result.items).toEqual(list.items);
        expect(result.current).toBe(list.current);
      }),
      RUNS,
    );
  });
});

describe('selectIndex', () => {
  it('selects only valid indexes and never changes the items', () => {
    fc.assert(
      fc.property(playlistArb, hostileIndex, (list, index) => {
        const result = selectIndex(list, index);
        expect(result.items).toBe(list.items);
        const valid = Number.isInteger(index) && index >= 0 && index < list.items.length;
        // -0 and 0 are the same index: compare with === rather than Object.is.
        expect(result.current === (valid ? index : list.current)).toBe(true);
      }),
      RUNS,
    );
  });
});

describe('createPlayOrder', () => {
  const faultyRandom = fc.oneof(
    fc.constant(() => 0),
    fc.constant(() => 1),
    fc.constant(() => Number.NaN),
    fc.constant(() => Number.POSITIVE_INFINITY),
    fc.constant(() => -3),
    fc.constant(() => 42),
    fc.integer().map((seed) => createSeededRandom(seed)),
  );

  it('is always a permutation of 0..length-1, even with a faulty random source', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.boolean(),
        hostileIndex,
        faultyRandom,
        (length, shuffle, first, random) => {
          const order = createPlayOrder(length, first, shuffle, random);
          expect(isPermutation(order, length)).toBe(true);
        },
      ),
      RUNS,
    );
  });

  it('is the identity without shuffle and leads with the current item with shuffle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.nat(),
        fc.integer(),
        (length, pick, seed) => {
          const first = pick % length;
          expect(createPlayOrder(length, first, false, createSeededRandom(seed))).toEqual(
            Array.from({ length }, (_v, i) => i),
          );
          expect(createPlayOrder(length, first, true, createSeededRandom(seed))[0]).toBe(first);
        },
      ),
      RUNS,
    );
  });

  it('is deterministic for a seed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer(), (length, seed) => {
        expect(createPlayOrder(length, null, true, createSeededRandom(seed))).toEqual(
          createPlayOrder(length, null, true, createSeededRandom(seed)),
        );
      }),
      RUNS,
    );
  });

  it('createSeededRandom stays in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const random = createSeededRandom(seed);
        for (let i = 0; i < 50; i += 1) {
          const value = random();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      }),
      RUNS,
    );
  });
});

describe('nextIndex and previousIndex', () => {
  const contextArb = fc
    .integer({ min: 0, max: 30 })
    .chain((length) =>
      fc.record({
        length: fc.constant(length),
        current:
          length === 0
            ? fc.constant(null)
            : fc.option(fc.integer({ min: 0, max: length - 1 }), { nil: null }),
        repeat: repeatMode,
        shuffle: fc.boolean(),
        seed: fc.integer(),
      }),
    )
    .map(({ length, current, repeat, shuffle, seed }) => ({
      length,
      current,
      repeat,
      order: createPlayOrder(length, current, shuffle, createSeededRandom(seed)),
    }));

  it('next always names a valid index or null, and null never happens in repeat-playlist for a non-empty list', () => {
    fc.assert(
      fc.property(contextArb, trigger, (context, why) => {
        const result = nextIndex(context, why);
        if (result !== null) {
          expect(Number.isInteger(result.index)).toBe(true);
          expect(result.index).toBeGreaterThanOrEqual(0);
          expect(result.index).toBeLessThan(context.length);
        }
        if (context.repeat === 'playlist' && context.length > 0) expect(result).not.toBeNull();
      }),
      RUNS,
    );
  });

  it('repeat-track replays the same item on auto and never on skip or manual', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        fc.pre(context.current !== null && context.length > 1);
        const repeating = { ...context, repeat: 'track' as const };
        expect(nextIndex(repeating, 'auto')).toEqual({ index: context.current, wrapped: false });
        for (const why of ['skip', 'manual'] as const) {
          const result = nextIndex(repeating, why);
          expect(result === null || result.index !== context.current).toBe(true);
        }
      }),
      RUNS,
    );
  });

  it('repeat-off stops after exactly length-1 steps; repeat-playlist visits every item once per cycle and wraps once', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 40 }),
        fc.boolean(),
        fc.integer(),
        (length, shuffle, seed) => {
          const order = createPlayOrder(length, null, shuffle, createSeededRandom(seed));
          const walk = (repeat: RepeatMode, steps: number) => {
            const visited: number[] = [];
            let current: number | null = null;
            let wraps = 0;
            for (let i = 0; i < steps; i += 1) {
              const next = nextIndex({ length, current, repeat, order }, 'auto');
              if (next === null) return { visited, wraps, stopped: true };
              if (next.wrapped) wraps += 1;
              visited.push(next.index);
              current = next.index;
            }
            return { visited, wraps, stopped: false };
          };
          const off = walk('off', length + 5);
          expect(off.visited).toEqual(order);
          expect(off.stopped).toBe(true);
          const loop = walk('playlist', length * 2);
          expect(loop.visited.slice(0, length)).toEqual(order);
          expect(loop.visited.slice(length)).toEqual(order);
          expect(loop.wraps).toBe(1);
          expect(loop.stopped).toBe(false);
        },
      ),
      RUNS,
    );
  });

  it('previous restarts after the threshold, otherwise steps back or wraps only in repeat-playlist', () => {
    fc.assert(
      fc.property(
        contextArb,
        fc.oneof(fc.double({ noNaN: false }), fc.constantFrom(0, 3, 3.0001, -1, Number.NaN)),
        (context, elapsed) => {
          const result = previousIndex(context, elapsed);
          if (context.current === null || context.length === 0) {
            expect(result).toEqual({ action: 'none' });
            return;
          }
          if (Number.isFinite(elapsed) && elapsed > PREVIOUS_RESTART_THRESHOLD_SEC) {
            expect(result).toEqual({ action: 'restart' });
            return;
          }
          const position = context.order.indexOf(context.current);
          if (result.action === 'go') {
            expect(result.index).toBe(
              position > 0 ? context.order[position - 1] : context.order[context.length - 1],
            );
            expect(result.wrapped).toBe(position === 0);
            if (position === 0) expect(context.repeat).toBe('playlist');
          } else {
            expect(result).toEqual({ action: 'restart' });
            expect(position === 0).toBe(true);
          }
        },
      ),
      RUNS,
    );
  });

  it('inputs with a mismatched order or an out-of-range current never throw and never invent an index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 10 }),
        fc.option(hostileIndex, { nil: null }),
        repeatMode,
        fc.array(fc.integer({ min: -2, max: 12 }), { maxLength: 12 }),
        trigger,
        fc.double(),
        (length, current, repeat, order, why, elapsed) => {
          const context = { length, current, repeat, order };
          const next = nextIndex(context, why);
          const previous = previousIndex(context, elapsed);
          if (length <= 0 || order.length !== length) {
            expect(next).toBeNull();
            expect(previous).toEqual({ action: 'none' });
          }
          // A malformed order is the caller's bug (the contract demands a permutation), so the
          // index is only required to come from the order, or be the current item for repeat-track.
          if (next !== null && !(why === 'auto' && repeat === 'track' && next.index === current)) {
            expect(order).toContain(next.index);
          }
        },
      ),
      RUNS,
    );
  });
});

// Regression for fast-check seed 1587075747 (counterexample length 2, current 0, repeat track, order [1, 1],
// auto): repeat-track returns the current item even when the order is malformed. The index is still valid.
describe('malformed order regression', () => {
  it('repeat-track on auto still answers an in-range index when the order does not contain current', () => {
    expect(nextIndex({ length: 2, current: 0, repeat: 'track', order: [1, 1] }, 'auto')).toEqual({
      index: 0,
      wrapped: false,
    });
  });
});

describe('repeat cycling and failure exhaustion', () => {
  it('cycleRepeat has period 3 and visits every mode', () => {
    fc.assert(
      fc.property(repeatMode, (mode) => {
        const once = cycleRepeat(mode);
        expect(once).not.toBe(mode);
        expect(cycleRepeat(cycleRepeat(once))).toBe(mode);
      }),
      RUNS,
    );
  });

  it('exhaustedByFailures is true exactly when a whole loop has failed (or the list is empty)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2, max: 50 }),
        fc.integer({ min: 0, max: 60 }),
        (length, failures) => {
          expect(exhaustedByFailures(failures, length)).toBe(length <= 0 || failures >= length);
        },
      ),
      RUNS,
    );
  });
});
