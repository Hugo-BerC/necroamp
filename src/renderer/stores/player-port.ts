import type { PlayerStore } from './player-store';
import type { PlaylistPlayerPort } from './playlist-store';

/**
 * Adapts the player store to the narrow port the playlist store depends on. This is the only
 * place that connects the two stores, so neither imports the other.
 */
export function createPlayerPort(player: PlayerStore): PlaylistPlayerPort {
  return {
    playTrack: (track) => player.getState().playTrack(track),
    stop: () => {
      player.getState().stop();
    },
    restart: () => {
      const state = player.getState();
      state.seek(0);
      if (state.playback.status !== 'playing') {
        void state.play();
      }
    },
    positionSec: () => player.getState().playback.positionSec,
    subscribe: (listener) => {
      let lastSeq = player.getState().lastOutcome?.seq ?? 0;
      return player.subscribe((state) => {
        const outcome = state.lastOutcome;
        if (outcome === null || outcome.seq === lastSeq) {
          return;
        }
        lastSeq = outcome.seq;
        listener({ kind: outcome.kind, trackId: outcome.trackId });
      });
    },
  };
}
