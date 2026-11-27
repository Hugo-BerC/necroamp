import { usePlayerStoreContext } from '@renderer/stores/player-store-context';
import type { PlayerStore } from '@renderer/stores/player-store';
import { LivePlayerView } from './live-player-view';
import { PlayerView } from './player-view';
import { useLivePlayer } from './use-live-player';
import { usePlayerControls } from './use-player';

function LivePlayerRegion({ store }: { readonly store: PlayerStore }) {
  return <LivePlayerView player={useLivePlayer(store)} />;
}

function PlaceholderPlayerRegion() {
  const { controls, message } = usePlayerControls();
  return <PlayerView controls={controls} message={message} />;
}

/** Live player when a store is provided, otherwise the inert placeholder. */
export function PlayerRegion() {
  const store = usePlayerStoreContext();
  return store === null ? <PlaceholderPlayerRegion /> : <LivePlayerRegion store={store} />;
}
