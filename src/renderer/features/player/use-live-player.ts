import { useMemo, useSyncExternalStore } from 'react';
import { useStore } from 'zustand';
import { formatTime } from '@shared/audio/time-format';
import { STRINGS } from '@renderer/app/strings/en';
import type { PlayerStore } from '@renderer/stores/player-store';
import type { PlaylistStore } from '@renderer/stores/playlist-store';
import type { TransportControlId } from './use-player';

export interface LiveTransportControl {
  readonly id: TransportControlId;
  readonly label: string;
  /** Shown with aria-disabled. The control stays focusable. */
  readonly unavailable: boolean;
  readonly onActivate: () => void;
}

const NO_SUBSCRIPTION = (): (() => void) => () => undefined;

interface PlaylistNav {
  readonly itemCount: number;
  readonly hasCurrent: boolean;
}

/** Reads the optional playlist store. Without one, navigation stays unavailable. */
function usePlaylistNav(playlist: PlaylistStore | null): PlaylistNav {
  const itemCount = useSyncExternalStore(
    playlist === null ? NO_SUBSCRIPTION : playlist.subscribe,
    () => playlist?.getState().items.length ?? 0,
  );
  const hasCurrent = useSyncExternalStore(
    playlist === null ? NO_SUBSCRIPTION : playlist.subscribe,
    () => playlist?.getState().current !== null && playlist?.getState().current !== undefined,
  );
  return { itemCount, hasCurrent };
}

export interface LivePlayer {
  readonly album: string;
  readonly artworkUrl: string | null;
  readonly hasPlaylist: boolean;
  readonly open: () => void;
  readonly controls: readonly LiveTransportControl[];
  readonly title: string;
  readonly artist: string;
  readonly elapsed: string;
  readonly duration: string;
  readonly positionSec: number;
  readonly durationSec: number | null;
  readonly seek: (positionSec: number) => void;
  readonly volumePercent: number;
  readonly setVolumePercent: (percent: number) => void;
  readonly muted: boolean;
  readonly toggleMute: () => void;
  readonly message: string;
  readonly isError: boolean;
}

/** Headless behavior for the live player. Every action goes through the store. */
export function useLivePlayer(
  store: PlayerStore,
  playlist: PlaylistStore | null = null,
): LivePlayer {
  const { itemCount, hasCurrent } = usePlaylistNav(playlist);
  const playback = useStore(store, (s) => s.playback);
  const track = useStore(store, (s) => s.track);
  const openFailure = useStore(store, (s) => s.openFailure);
  const { open, play, pause, stop, seek, setVolume, toggleMute } = useStore(store, (s) => s);

  return useMemo(() => {
    const hasTrack = track !== null && playback.status !== 'idle';
    const canPlay = hasTrack && playback.status !== 'playing';
    const controls: LiveTransportControl[] = [
      {
        id: 'previous',
        label: STRINGS.player.controls.previous,
        unavailable: playlist === null || !hasCurrent,
        onActivate: () => {
          void playlist?.getState().previous();
        },
      },
      {
        id: 'play',
        label: STRINGS.player.controls.play,
        unavailable: !canPlay,
        onActivate: () => {
          void play();
        },
      },
      {
        id: 'pause',
        label: STRINGS.player.controls.pause,
        unavailable: playback.status !== 'playing',
        onActivate: pause,
      },
      {
        id: 'stop',
        label: STRINGS.player.controls.stop,
        unavailable: !hasTrack || playback.status === 'error',
        onActivate: stop,
      },
      {
        id: 'next',
        label: STRINGS.player.controls.next,
        unavailable: playlist === null || itemCount === 0,
        onActivate: () => {
          void playlist?.getState().next();
        },
      },
    ];
    const message =
      playback.error !== null
        ? STRINGS.player.errors[playback.error]
        : openFailure !== null
          ? STRINGS.player.openFailures[openFailure]
          : '';
    return {
      open: () => {
        void open();
      },
      controls,
      hasPlaylist: playlist !== null,
      album: track === null || track.album === '' ? STRINGS.player.noAlbum : track.album,
      artworkUrl: track?.artworkUrl ?? null,
      title: track?.title ?? STRINGS.player.noTrack,
      artist: track === null || track.artist === '' ? STRINGS.player.noArtist : track.artist,
      elapsed: formatTime(hasTrack ? playback.positionSec : null),
      duration: formatTime(playback.durationSec),
      positionSec: playback.positionSec,
      durationSec: playback.durationSec,
      seek,
      volumePercent: Math.round(playback.volume * 100),
      setVolumePercent: (percent) => {
        setVolume(percent / 100);
      },
      muted: playback.muted,
      toggleMute,
      message,
      isError: message !== '',
    };
  }, [
    playback,
    track,
    openFailure,
    open,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleMute,
    playlist,
    itemCount,
    hasCurrent,
  ]);
}
