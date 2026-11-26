import { useMemo } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import { usePlaceholderActivation } from '@renderer/components/control-button';

export interface PlaylistAction {
  readonly id: 'add-files' | 'save-playlist';
  readonly label: string;
  readonly unavailable: true;
  readonly onActivate: () => void;
}

export interface PlaylistActions {
  readonly actions: readonly PlaylistAction[];
  readonly message: string;
}

/** Playlist state does not exist yet. The actions are unavailable placeholders. */
export function usePlaylistActions(): PlaylistActions {
  const { message, activate } = usePlaceholderActivation();
  const actions = useMemo((): readonly PlaylistAction[] => {
    const make = (id: PlaylistAction['id'], label: string): PlaylistAction => ({
      id,
      label,
      unavailable: true,
      onActivate: () => {
        activate(STRINGS.activationMessage(label));
      },
    });
    return [
      make('add-files', STRINGS.playlist.addFiles),
      make('save-playlist', STRINGS.playlist.savePlaylist),
    ];
  }, [activate]);
  return { actions, message };
}
