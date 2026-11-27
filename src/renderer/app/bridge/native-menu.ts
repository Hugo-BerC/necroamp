import type { PlaylistStore } from '@renderer/stores/playlist-store';
import type { MenuClient } from './necroamp-client';

/**
 * Connects the native application menu to the playlist store. Each command runs the same store
 * action as the matching in-app control, so there is one code path per behavior. Returns a
 * disposer that unsubscribes from both directions.
 */
export function connectNativeMenu(menu: MenuClient, playlist: PlaylistStore): () => void {
  const stopCommands = menu.onCommand((command) => {
    const state = playlist.getState();
    switch (command) {
      case 'open-files':
        void state.addFiles();
        break;
      case 'open-folder':
        void state.addFolder();
        break;
      case 'clear-playlist':
        void state.clearAndSave();
        break;
    }
  });

  // Report on connect and on every change of "has tracks", including the persistence restore.
  let reported: boolean | undefined;
  const report = (): void => {
    const hasTracks = playlist.getState().items.length > 0;
    if (hasTracks === reported) {
      return;
    }
    reported = hasTracks;
    void menu.reportPlaylistState({ hasTracks }).then((applied) => {
      if (!applied && reported === hasTracks) {
        reported = undefined; // Let the next change retry.
      }
    });
  };
  report();
  const stopState = playlist.subscribe(report);

  return () => {
    stopCommands();
    stopState();
  };
}
