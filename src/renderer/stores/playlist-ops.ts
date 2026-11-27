/**
 * Pure playlist operations. No React, DOM, Electron or audio imports, so every function can be
 * unit and property tested. All functions return new values and never mutate their input.
 *
 * HAND-OFF: the spec (design.md) places this module at `src/shared/audio/playlist.ts`, which is
 * outside the frontend write scope. It lives here until the audio-engineer moves it; the file has
 * no imports, so the move is a rename plus an import-path change in `playlist-store.ts`.
 *
 * The playlist is an ordered list plus `current`, the index of the selected item or `null`.
 * Duplicates are allowed, so identity is by index, never by value.
 */
export const MAX_PLAYLIST_ITEMS = 5000;
/** Previous restarts the current track when more than this many seconds have elapsed. */
export const PREVIOUS_RESTART_THRESHOLD_SEC = 3;

export type RepeatMode = 'off' | 'track' | 'playlist';

export interface Playlist<T> {
  readonly items: readonly T[];
  readonly current: number | null;
}

export function emptyPlaylist<T>(): Playlist<T> {
  return { items: [], current: null };
}

function isIndex(length: number, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

/** Inserts at `at` (clamped to the list; default end). Items beyond the cap are dropped. */
export function insertItems<T>(
  list: Playlist<T>,
  added: readonly T[],
  at: number = list.items.length,
): Playlist<T> {
  const room = Math.max(0, MAX_PLAYLIST_ITEMS - list.items.length);
  const accepted = added.slice(0, room);
  if (accepted.length === 0) {
    return list;
  }
  const position = Number.isFinite(at)
    ? Math.min(Math.max(Math.trunc(at), 0), list.items.length)
    : list.items.length;
  const items = [...list.items.slice(0, position), ...accepted, ...list.items.slice(position)];
  const current =
    list.current !== null && position <= list.current
      ? list.current + accepted.length
      : list.current;
  return { items, current };
}

/** Removes one item. Removing the current item clears `current`. Bad indexes are ignored. */
export function removeAt<T>(list: Playlist<T>, index: number): Playlist<T> {
  if (!isIndex(list.items.length, index)) {
    return list;
  }
  const items = [...list.items.slice(0, index), ...list.items.slice(index + 1)];
  let current = list.current;
  if (current !== null) {
    if (current === index) {
      current = null;
    } else if (current > index) {
      current -= 1;
    }
  }
  return { items, current };
}

/** Moves the item at `from` so it ends at index `to`. `current` follows its item. */
export function moveItem<T>(list: Playlist<T>, from: number, to: number): Playlist<T> {
  const length = list.items.length;
  if (!isIndex(length, from) || !isIndex(length, to) || from === to) {
    return list;
  }
  const items = [...list.items];
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved as T);
  let current = list.current;
  if (current !== null) {
    if (current === from) {
      current = to;
    } else if (from < current && to >= current) {
      current -= 1;
    } else if (from > current && to <= current) {
      current += 1;
    }
  }
  return { items, current };
}

/** Selects an item. Out-of-range indexes are ignored. */
export function selectIndex<T>(list: Playlist<T>, index: number): Playlist<T> {
  return isIndex(list.items.length, index) && list.current !== index
    ? { items: list.items, current: index }
    : list;
}

/** Deterministic PRNG (mulberry32) returning floats in `[0, 1)`, for injectable shuffling. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The play order: a permutation of `0..length-1`. Without shuffle it is the identity. With
 * shuffle every index appears once per cycle and `first` (the item playing now, if any) leads,
 * so it is not repeated until the cycle wraps. `random` returns floats in `[0, 1)`.
 */
export function createPlayOrder(
  length: number,
  first: number | null,
  shuffle: boolean,
  random: () => number,
): number[] {
  const size = Math.max(0, Math.trunc(length));
  if (!shuffle) {
    return Array.from({ length: size }, (_, i) => i);
  }
  const lead = first !== null && isIndex(size, first) ? first : null;
  const rest: number[] = [];
  for (let i = 0; i < size; i += 1) {
    if (i !== lead) {
      rest.push(i);
    }
  }
  // Fisher-Yates. The random value is clamped so a faulty source cannot index out of range.
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const raw = random();
    const unit = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.999999999) : 0;
    const j = Math.floor(unit * (i + 1));
    const swap = rest[i] as number;
    rest[i] = rest[j] as number;
    rest[j] = swap;
  }
  return lead === null ? rest : [lead, ...rest];
}

/** Why the player wants another track. */
export type AdvanceTrigger =
  /** The user pressed Next. */
  | 'manual'
  /** The track ended on its own. Repeat-track replays the same item. */
  | 'auto'
  /** The track failed to load or play. Repeat-track must not loop on a broken file. */
  | 'skip';

export interface AdvanceResult {
  readonly index: number;
  /** True when the order restarted. With shuffle the caller should build a fresh order. */
  readonly wrapped: boolean;
}

export interface OrderContext {
  readonly length: number;
  readonly current: number | null;
  readonly repeat: RepeatMode;
  /** Permutation from `createPlayOrder`. Must have `length` entries. */
  readonly order: readonly number[];
}

/** Next item to play, or `null` when playback should stop (or, for `manual`, stay put). */
export function nextIndex(context: OrderContext, trigger: AdvanceTrigger): AdvanceResult | null {
  const { length, current, repeat, order } = context;
  if (length <= 0 || order.length !== length) {
    return null;
  }
  if (current !== null && !isIndex(length, current)) {
    return null;
  }
  if (current !== null && trigger === 'auto' && repeat === 'track') {
    return { index: current, wrapped: false };
  }
  const position = current === null ? -1 : order.indexOf(current);
  if (current !== null && position === -1) {
    return null;
  }
  const following = order[position + 1];
  if (following !== undefined) {
    return { index: following, wrapped: false };
  }
  if (repeat === 'playlist') {
    return { index: order[0] as number, wrapped: true };
  }
  return null;
}

export type PreviousResult =
  | { readonly action: 'restart' }
  | { readonly action: 'go'; readonly index: number; readonly wrapped: boolean }
  | { readonly action: 'none' };

/**
 * Previous: restarts the track after more than 3 seconds, otherwise goes one step back in the
 * play order. At the first item it restarts, or wraps to the last with repeat-playlist.
 */
export function previousIndex(context: OrderContext, elapsedSec: number): PreviousResult {
  const { length, current, repeat, order } = context;
  if (length <= 0 || order.length !== length || current === null || !isIndex(length, current)) {
    return { action: 'none' };
  }
  if (Number.isFinite(elapsedSec) && elapsedSec > PREVIOUS_RESTART_THRESHOLD_SEC) {
    return { action: 'restart' };
  }
  const position = order.indexOf(current);
  if (position === -1) {
    return { action: 'none' };
  }
  const before = order[position - 1];
  if (before !== undefined) {
    return { action: 'go', index: before, wrapped: false };
  }
  if (repeat === 'playlist' && length > 1) {
    return { action: 'go', index: order[length - 1] as number, wrapped: true };
  }
  return { action: 'restart' };
}

/** Cycles `off -> track -> playlist -> off`. */
export function cycleRepeat(mode: RepeatMode): RepeatMode {
  return mode === 'off' ? 'track' : mode === 'track' ? 'playlist' : 'off';
}

/** After failures, stop once every item has failed in a row (one full loop). */
export function exhaustedByFailures(consecutiveFailures: number, length: number): boolean {
  return length <= 0 || consecutiveFailures >= length;
}
