import { useMemo } from 'react';
import { useStore } from 'zustand';
import { formatTime } from '@shared/audio/time-format';
import { STRINGS } from '@renderer/app/strings/en';
import type { PlaylistNotice, PlaylistStore } from '@renderer/stores/playlist-store';
import type { RepeatMode } from '@renderer/stores/playlist-ops';

export interface PlaylistRow {
  /** Stable across reorders: the track id plus its occurrence number (duplicates are allowed). */
  readonly key: string;
  readonly index: number;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly duration: string;
  readonly artworkUrl: string | null;
  readonly available: boolean;
  readonly isCurrent: boolean;
}

export interface LivePlaylist {
  readonly rows: readonly PlaylistRow[];
  readonly countText: string;
  readonly loading: boolean;
  readonly shuffle: boolean;
  readonly repeat: RepeatMode;
  readonly repeatLabel: string;
  readonly noticeText: string;
  readonly addFiles: () => void;
  readonly addFolder: () => void;
  readonly clear: () => void;
  readonly toggleShuffle: () => void;
  readonly cycleRepeat: () => void;
  readonly play: (index: number) => void;
  readonly move: (from: number, to: number) => void;
  readonly remove: (index: number) => void;
}

export function noticeToText(notice: PlaylistNotice | null): string {
  if (notice === null) {
    return '';
  }
  return notice.code === 'open-failed'
    ? STRINGS.playlist.openFailures[notice.reason]
    : STRINGS.playlist.notices[notice.code];
}

/** Headless behavior for the live playlist. Every action goes through the store. */
export function useLivePlaylist(store: PlaylistStore): LivePlaylist {
  const items = useStore(store, (s) => s.items);
  const current = useStore(store, (s) => s.current);
  const shuffle = useStore(store, (s) => s.shuffle);
  const repeat = useStore(store, (s) => s.repeat);
  const loadStatus = useStore(store, (s) => s.loadStatus);
  const notice = useStore(store, (s) => s.notice);
  const actions = useStore(store, (s) => s);

  return useMemo(() => {
    const seen = new Map<string, number>();
    const rows = items.map((item, index): PlaylistRow => {
      const occurrence = seen.get(item.trackId) ?? 0;
      seen.set(item.trackId, occurrence + 1);
      return {
        key: `${item.trackId}:${String(occurrence)}`,
        index,
        title: item.title,
        artist: item.artist === '' ? STRINGS.playlist.unknownArtist : item.artist,
        album: item.album === '' ? STRINGS.playlist.unknownAlbum : item.album,
        duration: formatTime(item.durationSec),
        artworkUrl: item.artworkUrl,
        available: item.available,
        isCurrent: index === current,
      };
    });
    return {
      rows,
      countText: STRINGS.playlist.itemCount(items.length),
      loading: loadStatus === 'loading',
      shuffle,
      repeat,
      repeatLabel: STRINGS.playlist.repeatLabel(STRINGS.playlist.repeatValue[repeat]),
      noticeText: noticeToText(notice),
      addFiles: () => {
        void actions.addFiles();
      },
      addFolder: () => {
        void actions.addFolder();
      },
      clear: actions.clear,
      toggleShuffle: actions.toggleShuffle,
      cycleRepeat: actions.cycleRepeat,
      play: (index) => {
        void actions.playIndex(index);
      },
      move: actions.move,
      remove: actions.remove,
    };
  }, [items, current, shuffle, repeat, loadStatus, notice, actions]);
}
