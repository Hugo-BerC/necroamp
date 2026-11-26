import { PlaylistView } from './playlist-view';
import { usePlaylistActions } from './use-playlist';

export function PlaylistRegion() {
  const { actions, message } = usePlaylistActions();
  return <PlaylistView actions={actions} message={message} />;
}
