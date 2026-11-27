import { describe, expect, it } from 'vitest';
import {
  MAX_PLAYLIST_ITEMS,
  createPlayOrder,
  createSeededRandom,
  cycleRepeat,
  emptyPlaylist,
  exhaustedByFailures,
  insertItems,
  moveItem,
  nextIndex,
  previousIndex,
  removeAt,
  selectIndex,
  type OrderContext,
  type Playlist,
  type RepeatMode,
} from './playlist-ops';

const list = (items: string[], current: number | null = null): Playlist<string> => ({
  items,
  current,
});
const identity = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const ctx = (
  length: number,
  current: number | null,
  repeat: RepeatMode,
  order: readonly number[] = identity(length),
): OrderContext => ({ length, current, repeat, order });

describe('insertItems', () => {
  it('appends by default and keeps current', () => {
    expect(insertItems(list(['a'], 0), ['b', 'c'])).toEqual(list(['a', 'b', 'c'], 0));
  });
  it('shifts current when inserting at or before it', () => {
    expect(insertItems(list(['a', 'b'], 1), ['x'], 0)).toEqual(list(['x', 'a', 'b'], 2));
    expect(insertItems(list(['a', 'b'], 1), ['x'], 1)).toEqual(list(['a', 'x', 'b'], 2));
    expect(insertItems(list(['a', 'b'], 0), ['x'], 2)).toEqual(list(['a', 'b', 'x'], 0));
  });
  it('allows duplicates and clamps the position', () => {
    expect(insertItems(list(['a']), ['a'], 99).items).toEqual(['a', 'a']);
    expect(insertItems(list(['a']), ['b'], -4).items).toEqual(['b', 'a']);
    expect(insertItems(list(['a']), ['b'], Number.NaN).items).toEqual(['a', 'b']);
  });
  it('returns the same list for no additions and enforces the cap', () => {
    const base = list(['a']);
    expect(insertItems(base, [])).toBe(base);
    const full = list(Array.from({ length: MAX_PLAYLIST_ITEMS }, () => 'x'));
    expect(insertItems(full, ['y'])).toBe(full);
    const nearly = list(Array.from({ length: MAX_PLAYLIST_ITEMS - 1 }, () => 'x'));
    expect(insertItems(nearly, ['y', 'z']).items).toHaveLength(MAX_PLAYLIST_ITEMS);
  });
});

describe('removeAt', () => {
  it('removes and adjusts current', () => {
    expect(removeAt(list(['a', 'b', 'c'], 2), 0)).toEqual(list(['b', 'c'], 1));
    expect(removeAt(list(['a', 'b', 'c'], 0), 2)).toEqual(list(['a', 'b'], 0));
  });
  it('clears current when the current item is removed', () => {
    expect(removeAt(list(['a', 'b'], 1), 1)).toEqual(list(['a'], null));
  });
  it('ignores bad indexes', () => {
    const base = list(['a']);
    expect(removeAt(base, 1)).toBe(base);
    expect(removeAt(base, -1)).toBe(base);
    expect(removeAt(base, 0.5)).toBe(base);
  });
});

describe('moveItem', () => {
  it('reorders and keeps the multiset', () => {
    expect(moveItem(list(['a', 'b', 'c']), 0, 2).items).toEqual(['b', 'c', 'a']);
    expect(moveItem(list(['a', 'b', 'c']), 2, 0).items).toEqual(['c', 'a', 'b']);
  });
  it('makes current follow its item', () => {
    expect(moveItem(list(['a', 'b', 'c'], 0), 0, 2).current).toBe(2);
    expect(moveItem(list(['a', 'b', 'c'], 1), 0, 2).current).toBe(0);
    expect(moveItem(list(['a', 'b', 'c'], 1), 2, 0).current).toBe(2);
    expect(moveItem(list(['a', 'b', 'c'], 0), 2, 1).current).toBe(0);
    expect(moveItem(list(['a', 'b', 'c'], null), 0, 1).current).toBeNull();
  });
  it('ignores no-ops and bad indexes', () => {
    const base = list(['a', 'b']);
    expect(moveItem(base, 0, 0)).toBe(base);
    expect(moveItem(base, 0, 5)).toBe(base);
    expect(moveItem(base, -1, 0)).toBe(base);
  });
});

describe('selectIndex', () => {
  it('selects in range only', () => {
    expect(selectIndex(list(['a', 'b']), 1).current).toBe(1);
    const base = list(['a', 'b'], 1);
    expect(selectIndex(base, 1)).toBe(base);
    expect(selectIndex(base, 2)).toBe(base);
  });
  it('emptyPlaylist is empty', () => {
    expect(emptyPlaylist()).toEqual({ items: [], current: null });
  });
});

describe('createPlayOrder', () => {
  it('is the identity without shuffle', () => {
    expect(createPlayOrder(4, 2, false, Math.random)).toEqual([0, 1, 2, 3]);
    expect(createPlayOrder(0, null, false, Math.random)).toEqual([]);
  });
  it('is a permutation led by the current item with shuffle', () => {
    const order = createPlayOrder(8, 5, true, createSeededRandom(7));
    expect(order[0]).toBe(5);
    expect([...order].sort((a, b) => a - b)).toEqual(identity(8));
  });
  it('is deterministic for a seed and differs across seeds', () => {
    const a = createPlayOrder(20, null, true, createSeededRandom(1));
    expect(createPlayOrder(20, null, true, createSeededRandom(1))).toEqual(a);
    expect(createPlayOrder(20, null, true, createSeededRandom(2))).not.toEqual(a);
  });
  it('survives a faulty random source', () => {
    for (const bad of [Number.NaN, -3, 7, Number.POSITIVE_INFINITY]) {
      const order = createPlayOrder(6, null, true, () => bad);
      expect([...order].sort((a, b) => a - b)).toEqual(identity(6));
    }
  });
  it('ignores an out-of-range lead', () => {
    expect(createPlayOrder(3, 9, true, createSeededRandom(1))).toHaveLength(3);
  });
});

describe('nextIndex', () => {
  it('moves forward and stops at the end with repeat off', () => {
    expect(nextIndex(ctx(3, 0, 'off'), 'manual')).toEqual({ index: 1, wrapped: false });
    expect(nextIndex(ctx(3, 2, 'off'), 'auto')).toBeNull();
    expect(nextIndex(ctx(3, 2, 'off'), 'manual')).toBeNull();
  });
  it('starts at the first item when nothing is current', () => {
    expect(nextIndex(ctx(3, null, 'off'), 'manual')).toEqual({ index: 0, wrapped: false });
  });
  it('replays the same item on auto with repeat track, but not on manual or skip', () => {
    expect(nextIndex(ctx(3, 1, 'track'), 'auto')).toEqual({ index: 1, wrapped: false });
    expect(nextIndex(ctx(3, 1, 'track'), 'manual')).toEqual({ index: 2, wrapped: false });
    expect(nextIndex(ctx(3, 1, 'track'), 'skip')).toEqual({ index: 2, wrapped: false });
    expect(nextIndex(ctx(3, 2, 'track'), 'skip')).toBeNull();
  });
  it('wraps with repeat playlist', () => {
    expect(nextIndex(ctx(3, 2, 'playlist'), 'auto')).toEqual({ index: 0, wrapped: true });
  });
  it('follows the shuffle order', () => {
    expect(nextIndex(ctx(3, 2, 'off', [2, 0, 1]), 'auto')).toEqual({ index: 0, wrapped: false });
  });
  it('returns null for invalid input', () => {
    expect(nextIndex(ctx(0, null, 'playlist', []), 'auto')).toBeNull();
    expect(nextIndex(ctx(3, 5, 'off'), 'auto')).toBeNull();
    expect(nextIndex(ctx(3, 0, 'off', [0, 1]), 'auto')).toBeNull();
    expect(nextIndex(ctx(3, 0, 'off', [1, 1, 2]), 'auto')).toBeNull();
  });
});

describe('previousIndex', () => {
  it('restarts after more than 3 seconds', () => {
    expect(previousIndex(ctx(3, 1, 'off'), 3.1)).toEqual({ action: 'restart' });
  });
  it('goes back at 3 seconds or less', () => {
    expect(previousIndex(ctx(3, 1, 'off'), 3)).toEqual({ action: 'go', index: 0, wrapped: false });
  });
  it('restarts at the first item, or wraps with repeat playlist', () => {
    expect(previousIndex(ctx(3, 0, 'off'), 0)).toEqual({ action: 'restart' });
    expect(previousIndex(ctx(3, 0, 'track'), 0)).toEqual({ action: 'restart' });
    expect(previousIndex(ctx(3, 0, 'playlist'), 0)).toEqual({
      action: 'go',
      index: 2,
      wrapped: true,
    });
    expect(previousIndex(ctx(1, 0, 'playlist'), 0)).toEqual({ action: 'restart' });
  });
  it('does nothing without a current item or on invalid input', () => {
    expect(previousIndex(ctx(3, null, 'off'), 0)).toEqual({ action: 'none' });
    expect(previousIndex(ctx(0, null, 'off', []), 0)).toEqual({ action: 'none' });
    expect(previousIndex(ctx(3, 9, 'off'), 0)).toEqual({ action: 'none' });
    expect(previousIndex(ctx(3, 0, 'off', [1, 1, 2]), 0)).toEqual({ action: 'none' });
  });
  it('treats a non-finite elapsed time as not elapsed', () => {
    expect(previousIndex(ctx(3, 1, 'off'), Number.NaN)).toEqual({
      action: 'go',
      index: 0,
      wrapped: false,
    });
  });
});

describe('repeat helpers', () => {
  it('cycles off, track, playlist', () => {
    expect(cycleRepeat('off')).toBe('track');
    expect(cycleRepeat('track')).toBe('playlist');
    expect(cycleRepeat('playlist')).toBe('off');
  });
  it('stops after one full loop of failures', () => {
    expect(exhaustedByFailures(2, 3)).toBe(false);
    expect(exhaustedByFailures(3, 3)).toBe(true);
    expect(exhaustedByFailures(0, 0)).toBe(true);
  });
});
