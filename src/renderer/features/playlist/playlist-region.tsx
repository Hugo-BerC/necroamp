import { usePlaylistStoreContext } from '@renderer/stores/playlist-store-context';
import type { PlaylistStore } from '@renderer/stores/playlist-store';
import { LivePlaylistView } from './live-playlist-view';
import { PlaylistView } from './playlist-view';
import { useLivePlaylist } from './use-live-playlist';
import { usePlaylistActions } from './use-playlist';

function LivePlaylistRegion({ store }: { readonly store: PlaylistStore }) {
  return <LivePlaylistView playlist={useLivePlaylist(store)} />;
}

function PlaceholderPlaylistRegion() {
  const { actions, message } = usePlaylistActions();
  return <PlaylistView actions={actions} message={message} />;
}

/** Live playlist when a store is provided, otherwise the inert placeholder. */
export function PlaylistRegion() {
  const store = usePlaylistStoreContext();
  return store === null ? <PlaceholderPlaylistRegion /> : <LivePlaylistRegion store={store} />;
}
