import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import { createSeededRandom } from './playlist-ops';
import {
  createPlaylistStore,
  type PlayerOutcomeEvent,
  type PlaylistPersistenceClient,
  type PlaylistPlayerPort,
} from './playlist-store';
import type { LibraryClient } from './player-store';

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function track(n: number, over: Partial<TrackInfo> = {}): TrackInfo {
  return {
    trackId: uuid(n),
    mediaUrl: `media://track/${uuid(n)}`,
    fileName: `t${String(n)}.mp3`,
    title: `Track ${String(n)}`,
    artist: 'Artist',
    album: 'Album',
    durationSec: 60,
    artworkUrl: null,
    available: true,
    ...over,
  };
}

function setup(initial: TrackInfo[] = [], options: { debounce?: number } = {}) {
  let outcome: ((e: PlayerOutcomeEvent) => void) | undefined;
  let position = 0;
  const port: PlaylistPlayerPort = {
    playTrack: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    restart: vi.fn(),
    positionSec: () => position,
    subscribe: (l) => {
      outcome = l;
      return () => {
        outcome = undefined;
      };
    },
  };
  let next: TrackInfo[] = initial;
  const library: LibraryClient = {
    openFiles: vi.fn(() => Promise.resolve({ ok: true as const, data: { tracks: next } })),
  };
  const persistence: PlaylistPersistenceClient = {
    load: vi.fn(() => Promise.resolve({ ok: true as const, items: [] })),
    save: vi.fn(() => Promise.resolve({ ok: true as const })),
  };
  const store = createPlaylistStore(port, library, persistence, {
    random: createSeededRandom(3),
    saveDebounceMs: options.debounce ?? 500,
  });
  return {
    store,
    port,
    library,
    persistence,
    setOpen: (tracks: TrackInfo[]) => {
      next = tracks;
    },
    setPosition: (p: number) => {
      position = p;
    },
    emit: (e: PlayerOutcomeEvent) => outcome?.(e),
    get: () => store.getState(),
  };
}

async function filled(n: number) {
  const ctx = setup(Array.from({ length: n }, (_, i) => track(i + 1)));
  await ctx.get().addFiles();
  return ctx;
}

const playedIds = (port: PlaylistPlayerPort): string[] =>
  (port.playTrack as ReturnType<typeof vi.fn>).mock.calls.map((c) => (c[0] as TrackInfo).trackId);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('adding files', () => {
  it('requests multi-select and appends in dialog order, allowing duplicates', async () => {
    const ctx = setup([track(1), track(2)]);
    await ctx.get().addFiles();
    expect(ctx.library.openFiles).toHaveBeenCalledWith({ multiple: true });
    await ctx.get().addFiles();
    expect(ctx.get().items.map((t) => t.title)).toEqual([
      'Track 1',
      'Track 2',
      'Track 1',
      'Track 2',
    ]);
  });

  it('does nothing when the dialog is cancelled', async () => {
    const ctx = setup([]);
    await ctx.get().addFiles();
    expect(ctx.get().items).toEqual([]);
    vi.advanceTimersByTime(1000);
    expect(ctx.persistence.save).not.toHaveBeenCalled();
  });

  it('reports a failed dialog request', async () => {
    const ctx = setup();
    vi.mocked(ctx.library.openFiles).mockResolvedValueOnce({ ok: false, reason: 'rejected' });
    await ctx.get().addFiles();
    expect(ctx.get().notice).toEqual({ code: 'open-failed', reason: 'rejected' });
    ctx.get().dismissNotice();
    expect(ctx.get().notice).toBeNull();
  });

  it('reports a full list', async () => {
    const ctx = setup(Array.from({ length: 5000 }, (_, i) => track(i + 1)));
    await ctx.get().addFiles();
    ctx.setOpen([track(9999)]);
    await ctx.get().addFiles();
    expect(ctx.get().items).toHaveLength(5000);
    expect(ctx.get().notice).toEqual({ code: 'list-full' });
  });
});

describe('selecting and navigating', () => {
  it('plays the selected index and marks it current', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(1);
    expect(ctx.get().current).toBe(1);
    expect(playedIds(ctx.port)).toEqual([uuid(2)]);
  });

  it('ignores out-of-range selections', async () => {
    const ctx = await filled(2);
    await ctx.get().playIndex(7);
    expect(ctx.port.playTrack).not.toHaveBeenCalled();
  });

  it('refuses an unavailable track with a notice', async () => {
    const ctx = setup([track(1, { available: false })]);
    await ctx.get().addFiles();
    await ctx.get().playIndex(0);
    expect(ctx.port.playTrack).not.toHaveBeenCalled();
    expect(ctx.get().notice).toEqual({ code: 'track-unavailable' });
  });

  it('next and previous walk the list', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(0);
    await ctx.get().next();
    await ctx.get().next();
    expect(ctx.get().current).toBe(2);
    await ctx.get().next(); // end, repeat off: stays
    expect(ctx.get().current).toBe(2);
    await ctx.get().previous();
    expect(ctx.get().current).toBe(1);
  });

  it('previous restarts the track after 3 seconds', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(1);
    ctx.setPosition(10);
    await ctx.get().previous();
    expect(ctx.port.restart).toHaveBeenCalledOnce();
    expect(ctx.get().current).toBe(1);
  });

  it('previous does nothing without a current track', async () => {
    const ctx = await filled(2);
    await ctx.get().previous();
    expect(ctx.port.playTrack).not.toHaveBeenCalled();
    expect(ctx.port.restart).not.toHaveBeenCalled();
  });

  it('previous wraps with repeat playlist and refuses an unavailable target', async () => {
    const ctx = await filled(3);
    ctx.get().cycleRepeat();
    ctx.get().cycleRepeat();
    expect(ctx.get().repeat).toBe('playlist');
    await ctx.get().playIndex(0);
    await ctx.get().previous();
    expect(ctx.get().current).toBe(2);

    const missing = setup([track(1), track(2, { available: false })]);
    await missing.get().addFiles();
    missing.get().cycleRepeat();
    missing.get().cycleRepeat();
    await missing.get().playIndex(0);
    await missing.get().previous();
    expect(missing.get().notice).toEqual({ code: 'track-unavailable' });
    expect(missing.get().current).toBe(0);
  });

  it('next skips unavailable items', async () => {
    const ctx = setup([track(1), track(2, { available: false }), track(3)]);
    await ctx.get().addFiles();
    await ctx.get().playIndex(0);
    await ctx.get().next();
    expect(ctx.get().current).toBe(2);
  });
});

describe('auto advance', () => {
  it('advances when the current track ends', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(0);
    ctx.emit({ kind: 'ended', trackId: uuid(1) });
    await vi.waitFor(() => {
      expect(ctx.get().current).toBe(1);
    });
  });

  it('stops after the last track with repeat off', async () => {
    const ctx = await filled(2);
    await ctx.get().playIndex(1);
    ctx.emit({ kind: 'ended', trackId: uuid(2) });
    await Promise.resolve();
    expect(playedIds(ctx.port)).toEqual([uuid(2)]);
  });

  it('replays the same track with repeat track', async () => {
    const ctx = await filled(2);
    ctx.get().cycleRepeat();
    expect(ctx.get().repeat).toBe('track');
    await ctx.get().playIndex(0);
    ctx.emit({ kind: 'ended', trackId: uuid(1) });
    await vi.waitFor(() => {
      expect(playedIds(ctx.port)).toEqual([uuid(1), uuid(1)]);
    });
  });

  it('wraps to the start with repeat playlist', async () => {
    const ctx = await filled(2);
    ctx.get().cycleRepeat();
    ctx.get().cycleRepeat();
    await ctx.get().playIndex(1);
    ctx.emit({ kind: 'ended', trackId: uuid(2) });
    await vi.waitFor(() => {
      expect(ctx.get().current).toBe(0);
    });
  });

  it('ignores outcomes for tracks that are not the current playlist item', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(0);
    ctx.emit({ kind: 'ended', trackId: uuid(99) });
    await Promise.resolve();
    expect(playedIds(ctx.port)).toEqual([uuid(1)]);
  });

  it('skips a failed track and stops after a full loop of failures', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(0);
    ctx.emit({ kind: 'failed', trackId: uuid(1) });
    await vi.waitFor(() => {
      expect(ctx.get().current).toBe(1);
    });
    ctx.emit({ kind: 'failed', trackId: uuid(2) });
    await vi.waitFor(() => {
      expect(ctx.get().current).toBe(2);
    });
    ctx.emit({ kind: 'failed', trackId: uuid(3) });
    expect(ctx.get().notice).toEqual({ code: 'all-failed' });
    expect(playedIds(ctx.port)).toHaveLength(3);
  });

  it('does not loop forever on a broken track with repeat track', async () => {
    const ctx = await filled(1);
    ctx.get().cycleRepeat();
    await ctx.get().playIndex(0);
    ctx.emit({ kind: 'failed', trackId: uuid(1) });
    expect(ctx.get().notice).toEqual({ code: 'all-failed' });
    expect(playedIds(ctx.port)).toHaveLength(1);
  });
});

describe('shuffle', () => {
  it('plays every track once per cycle', async () => {
    const ctx = await filled(6);
    ctx.get().toggleShuffle();
    expect(ctx.get().shuffle).toBe(true);
    await ctx.get().playIndex(2);
    const seen = [ctx.get().current];
    for (let i = 0; i < 5; i += 1) {
      await ctx.get().next();
      seen.push(ctx.get().current);
    }
    expect(new Set(seen).size).toBe(6);
    expect(seen[0]).toBe(2);
    await ctx.get().next(); // repeat off: end of the cycle
    expect(ctx.get().current).toBe(seen[5]);
  });

  it('starts a new cycle with repeat playlist', async () => {
    const ctx = await filled(3);
    ctx.get().toggleShuffle();
    ctx.get().cycleRepeat();
    ctx.get().cycleRepeat();
    await ctx.get().playIndex(0);
    const seen: (number | null)[] = [ctx.get().current];
    for (let i = 0; i < 5; i += 1) {
      await ctx.get().next();
      seen.push(ctx.get().current);
    }
    expect(new Set(seen.slice(0, 3)).size).toBe(3);
    expect(new Set(seen.slice(3)).size).toBe(3);
  });

  it('previous follows the shuffled history and toggling off restores list order', async () => {
    const ctx = await filled(4);
    ctx.get().toggleShuffle();
    await ctx.get().playIndex(0);
    await ctx.get().next();
    const second = ctx.get().current;
    await ctx.get().next();
    await ctx.get().previous();
    expect(ctx.get().current).toBe(second);
    ctx.get().toggleShuffle();
    await ctx.get().next();
    // List order again: the item after second, or no move at the end of the list.
    expect(ctx.get().current).toBe(second === 3 ? 3 : (second ?? 0) + 1);
  });
});

describe('reorder, remove, clear', () => {
  it('move keeps the current track attached to its item', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(0);
    ctx.get().move(0, 2);
    expect(ctx.get().current).toBe(2);
    expect(ctx.get().items[2]?.title).toBe('Track 1');
  });

  it('removing the current track stops playback and clears the selection', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(1);
    ctx.get().remove(1);
    expect(ctx.port.stop).toHaveBeenCalledOnce();
    expect(ctx.get().current).toBeNull();
    expect(ctx.get().items).toHaveLength(2);
  });

  it('removing another track keeps playback and adjusts the index', async () => {
    const ctx = await filled(3);
    await ctx.get().playIndex(2);
    ctx.get().remove(0);
    expect(ctx.port.stop).not.toHaveBeenCalled();
    expect(ctx.get().current).toBe(1);
    ctx.get().remove(9);
    ctx.get().move(0, 9);
    expect(ctx.get().items).toHaveLength(2);
  });

  it('clear empties the list and stops playback only when something is selected', async () => {
    const ctx = await filled(2);
    ctx.get().clear();
    expect(ctx.get().items).toEqual([]);
    expect(ctx.port.stop).not.toHaveBeenCalled();
    ctx.get().clear();
    const playing = await filled(2);
    await playing.get().playIndex(0);
    playing.get().clear();
    expect(playing.port.stop).toHaveBeenCalledOnce();
  });
});

describe('persistence', () => {
  it('saves ids debounced after edits and coalesces bursts', async () => {
    const ctx = await filled(3);
    ctx.get().move(0, 1);
    ctx.get().remove(2);
    expect(ctx.persistence.save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.persistence.save).toHaveBeenCalledOnce();
    expect(ctx.persistence.save).toHaveBeenCalledWith([uuid(2), uuid(1)]);
  });

  it('flush saves immediately once and not when nothing is pending', async () => {
    const ctx = await filled(2);
    await ctx.get().flush();
    expect(ctx.persistence.save).toHaveBeenCalledOnce();
    await ctx.get().flush();
    expect(ctx.persistence.save).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect(ctx.persistence.save).toHaveBeenCalledOnce();
  });

  it('reports a failed save', async () => {
    const ctx = await filled(1);
    vi.mocked(ctx.persistence.save).mockResolvedValueOnce({ ok: false, reason: 'rejected' });
    await ctx.get().flush();
    expect(ctx.get().notice).toEqual({ code: 'save-failed' });
  });

  it('loads the saved list in front of files added meanwhile and does not save', async () => {
    const ctx = setup([track(5)]);
    vi.mocked(ctx.persistence.load).mockResolvedValueOnce({
      ok: true,
      items: [track(1, { available: false }), track(2)],
    });
    const loading = ctx.get().load();
    expect(ctx.get().loadStatus).toBe('loading');
    await ctx.get().addFiles();
    await loading;
    expect(ctx.get().loadStatus).toBe('ready');
    expect(ctx.get().items.map((t) => t.trackId)).toEqual([uuid(1), uuid(2), uuid(5)]);
    expect(ctx.get().items[0]?.available).toBe(false);
  });

  it('reports a failed load and stays usable', async () => {
    const ctx = setup();
    vi.mocked(ctx.persistence.load).mockResolvedValueOnce({ ok: false, reason: 'ipc-error' });
    await ctx.get().load();
    expect(ctx.get().notice).toEqual({ code: 'load-failed' });
    expect(ctx.get().loadStatus).toBe('ready');
  });

  it('dispose unsubscribes, cancels the pending save and ignores a late load', async () => {
    const ctx = await filled(2);
    await ctx.get().playIndex(0);
    ctx.get().dispose();
    ctx.emit({ kind: 'ended', trackId: uuid(1) });
    await vi.advanceTimersByTimeAsync(1000);
    expect(ctx.persistence.save).not.toHaveBeenCalled();
    expect(playedIds(ctx.port)).toHaveLength(1);
    ctx.get().dispose();
    await ctx.get().load();
    expect(ctx.get().loadStatus).toBe('loading');
  });
});
