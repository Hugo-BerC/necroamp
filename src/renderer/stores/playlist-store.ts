import { createStore, type StoreApi } from 'zustand';
import type { TrackInfo } from '@shared/ipc';
import type { LibraryClient, OpenFilesFailureReason } from './player-store';
import {
  MAX_PLAYLIST_ITEMS,
  createPlayOrder,
  cycleRepeat,
  emptyPlaylist,
  exhaustedByFailures,
  insertItems,
  moveItem,
  nextIndex,
  previousIndex,
  removeAt,
  type AdvanceTrigger,
  type Playlist,
  type RepeatMode,
} from './playlist-ops';

export type PersistenceFailureReason = OpenFilesFailureReason;

export type PlaylistLoadResult =
  | { readonly ok: true; readonly items: readonly TrackInfo[] }
  | { readonly ok: false; readonly reason: PersistenceFailureReason };
export type PlaylistSaveResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: PersistenceFailureReason };

/** What the store needs from the bridge for persistence. Tests pass a fake. */
export interface PlaylistPersistenceClient {
  readonly load: () => Promise<PlaylistLoadResult>;
  readonly save: (trackIds: readonly string[]) => Promise<PlaylistSaveResult>;
}

export interface PlayerOutcomeEvent {
  readonly kind: 'ended' | 'failed';
  readonly trackId: string;
}

/**
 * The only thing the playlist knows about playback. It carries no audio nodes and no UI.
 * `stores/player-port.ts` adapts the player store to this interface.
 */
export interface PlaylistPlayerPort {
  readonly playTrack: (track: TrackInfo) => Promise<void>;
  readonly stop: () => void;
  /** Seeks to the start of the loaded track and plays it. */
  readonly restart: () => void;
  readonly positionSec: () => number;
  /** Reports when a track ends on its own or fails. Returns an unsubscribe function. */
  readonly subscribe: (listener: (event: PlayerOutcomeEvent) => void) => () => void;
}

/** Fixed notice codes. User text comes from the strings file. */
export type PlaylistNotice =
  | { readonly code: 'open-failed'; readonly reason: OpenFilesFailureReason }
  | { readonly code: 'load-failed' }
  | { readonly code: 'save-failed' }
  | { readonly code: 'list-full' }
  | { readonly code: 'track-unavailable' }
  | { readonly code: 'all-failed' };

export type PlaylistLoadStatus = 'idle' | 'loading' | 'ready';

export interface PlaylistState {
  readonly items: readonly TrackInfo[];
  /** Index of the selected (playing) item, or `null`. */
  readonly current: number | null;
  readonly shuffle: boolean;
  readonly repeat: RepeatMode;
  readonly loadStatus: PlaylistLoadStatus;
  readonly notice: PlaylistNotice | null;
  /** Opens the native dialog with multi-select and appends the chosen files. */
  readonly addFiles: () => Promise<void>;
  /** Selects and plays the item at `index`. */
  readonly playIndex: (index: number) => Promise<void>;
  readonly next: () => Promise<void>;
  readonly previous: () => Promise<void>;
  readonly move: (from: number, to: number) => void;
  readonly remove: (index: number) => void;
  readonly clear: () => void;
  readonly toggleShuffle: () => void;
  readonly cycleRepeat: () => void;
  /** Loads the persisted playlist. */
  readonly load: () => Promise<void>;
  /** Saves now if a save is pending. Call on `pagehide`. */
  readonly flush: () => Promise<void>;
  readonly dismissNotice: () => void;
  /** Unsubscribes from the player and cancels a pending save. */
  readonly dispose: () => void;
}

export type PlaylistStore = StoreApi<PlaylistState>;

export interface PlaylistStoreOptions {
  /** Float source in `[0, 1)` for shuffling. Tests inject a seeded one. */
  readonly random?: () => number;
  readonly saveDebounceMs?: number;
}

export const DEFAULT_SAVE_DEBOUNCE_MS = 500;

/**
 * Playlist state only. All list logic is in `playlist-ops.ts`; playback is reached through the
 * injected port, so this store never touches audio or presentation.
 */
export function createPlaylistStore(
  port: PlaylistPlayerPort,
  library: LibraryClient,
  persistence: PlaylistPersistenceClient,
  options: PlaylistStoreOptions = {},
): PlaylistStore {
  const random = options.random ?? Math.random;
  const debounceMs = options.saveDebounceMs ?? DEFAULT_SAVE_DEBOUNCE_MS;

  return createStore<PlaylistState>()((set, get) => {
    let order: number[] = [];
    let consecutiveFailures = 0;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let savePending = false;
    // Guards a late `playTrack` result against a newer user choice.
    let disposed = false;

    const snapshot = (): Playlist<TrackInfo> => ({ items: get().items, current: get().current });

    const rebuildOrder = (list: Playlist<TrackInfo>): void => {
      order = createPlayOrder(list.items.length, list.current, get().shuffle, random);
    };

    const save = async (): Promise<void> => {
      if (saveTimer !== undefined) {
        clearTimeout(saveTimer);
        saveTimer = undefined;
      }
      if (!savePending) {
        return;
      }
      savePending = false;
      const result = await persistence.save(get().items.map((item) => item.trackId));
      if (!result.ok) {
        set({ notice: { code: 'save-failed' } });
      }
    };

    const scheduleSave = (): void => {
      savePending = true;
      if (saveTimer !== undefined) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(() => {
        saveTimer = undefined;
        void save();
      }, debounceMs);
    };

    const commit = (list: Playlist<TrackInfo>): void => {
      set({ items: list.items, current: list.current });
      rebuildOrder(list);
    };

    const startItem = async (index: number): Promise<void> => {
      const item = get().items[index];
      if (item === undefined) {
        return;
      }
      set({ current: index });
      await port.playTrack(item);
    };

    /** Finds the next playable item. Unavailable items are skipped, at most one full loop. */
    const advance = async (trigger: AdvanceTrigger): Promise<boolean> => {
      const { items, repeat, shuffle } = get();
      const length = items.length;
      let cursor = get().current;
      let working = order;
      for (let attempt = 0; attempt <= length; attempt += 1) {
        const result = nextIndex(
          { length, current: cursor, repeat, order: working },
          attempt === 0 ? trigger : 'skip',
        );
        if (result === null) {
          return false;
        }
        if (result.wrapped && shuffle) {
          working = createPlayOrder(length, result.index, true, random);
        }
        cursor = result.index;
        if (items[cursor]?.available === true) {
          order = working;
          await startItem(cursor);
          return true;
        }
      }
      return false;
    };

    const unsubscribe = port.subscribe((event) => {
      const { items, current } = get();
      const playing = current === null ? undefined : items[current];
      if (playing === undefined || playing.trackId !== event.trackId) {
        return; // A track opened outside the playlist, or an outdated event.
      }
      if (event.kind === 'ended') {
        consecutiveFailures = 0;
        void advance('auto');
        return;
      }
      consecutiveFailures += 1;
      if (exhaustedByFailures(consecutiveFailures, items.length)) {
        consecutiveFailures = 0;
        set({ notice: { code: 'all-failed' } });
        return;
      }
      void advance('skip');
    });

    const edit = (list: Playlist<TrackInfo>): void => {
      commit(list);
      scheduleSave();
    };

    return {
      items: [],
      current: null,
      shuffle: false,
      repeat: 'off',
      loadStatus: 'idle',
      notice: null,

      addFiles: async () => {
        const result = await library.openFiles({ multiple: true });
        if (!result.ok) {
          set({ notice: { code: 'open-failed', reason: result.reason } });
          return;
        }
        const tracks = result.data.tracks;
        if (tracks.length === 0) {
          return; // The dialog was cancelled.
        }
        const before = snapshot();
        const after = insertItems(before, tracks);
        const full = after.items.length - before.items.length < tracks.length;
        set({ notice: full ? { code: 'list-full' } : null });
        if (after !== before) {
          edit(after);
        }
      },

      playIndex: async (index) => {
        const item = get().items[index];
        if (item === undefined) {
          return;
        }
        consecutiveFailures = 0;
        if (!item.available) {
          set({ notice: { code: 'track-unavailable' } });
          return;
        }
        set({ notice: null });
        if (get().current !== index) {
          commit({ items: get().items, current: index });
        }
        await startItem(index);
      },

      next: async () => {
        consecutiveFailures = 0;
        set({ notice: null });
        await advance('manual');
      },

      previous: async () => {
        consecutiveFailures = 0;
        const { items, current, repeat } = get();
        const result = previousIndex(
          { length: items.length, current, repeat, order },
          port.positionSec(),
        );
        if (result.action === 'restart') {
          port.restart();
          return;
        }
        if (result.action === 'none') {
          return;
        }
        const target = items[result.index];
        if (target === undefined || !target.available) {
          set({ notice: { code: 'track-unavailable' } });
          return;
        }
        if (result.wrapped && get().shuffle) {
          order = createPlayOrder(items.length, result.index, true, random);
        }
        await startItem(result.index);
      },

      move: (from, to) => {
        const before = snapshot();
        const after = moveItem(before, from, to);
        if (after !== before) {
          edit(after);
        }
      },

      remove: (index) => {
        const before = snapshot();
        const after = removeAt(before, index);
        if (after === before) {
          return;
        }
        if (before.current === index) {
          port.stop();
        }
        edit(after);
      },

      clear: () => {
        if (get().items.length === 0) {
          return;
        }
        if (get().current !== null) {
          port.stop();
        }
        edit(emptyPlaylist<TrackInfo>());
      },

      toggleShuffle: () => {
        set({ shuffle: !get().shuffle });
        rebuildOrder(snapshot());
      },

      cycleRepeat: () => {
        set({ repeat: cycleRepeat(get().repeat) });
      },

      load: async () => {
        set({ loadStatus: 'loading' });
        const result = await persistence.load();
        if (disposed) {
          return;
        }
        if (!result.ok) {
          set({ loadStatus: 'ready', notice: { code: 'load-failed' } });
          return;
        }
        // Files added while loading stay; the persisted entries go in front of them.
        const merged = insertItems(snapshot(), result.items.slice(0, MAX_PLAYLIST_ITEMS), 0);
        commit(merged);
        set({ loadStatus: 'ready' });
      },

      flush: save,

      dismissNotice: () => {
        set({ notice: null });
      },

      dispose: () => {
        disposed = true;
        unsubscribe();
        if (saveTimer !== undefined) {
          clearTimeout(saveTimer);
          saveTimer = undefined;
        }
      },
    };
  });
}
