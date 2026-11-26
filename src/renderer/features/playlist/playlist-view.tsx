import { STRINGS } from '@renderer/app/strings/en';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { PlaylistAction } from './use-playlist';
import styles from './playlist-view.module.css';

export interface PlaylistViewProps {
  readonly actions: readonly PlaylistAction[];
  readonly message: string;
}

const NOTE_ID = 'playlist-unavailable-note';

export function PlaylistView({ actions, message }: PlaylistViewProps) {
  return (
    <RegionFrame id="playlist" titleId="playlist-heading" heading={STRINGS.regions.playlist}>
      <div className={styles.root}>
        <p data-part="playlist-empty">{STRINGS.playlist.empty}</p>
        <ul data-part="playlist-items" aria-label={STRINGS.playlist.listLabel} />
        <div data-part="playlist-actions" role="group" aria-label={STRINGS.regions.playlist}>
          {actions.map((action) => (
            <ControlButton
              key={action.id}
              label={action.label}
              part={`playlist-${action.id}`}
              unavailable={action.unavailable}
              describedBy={NOTE_ID}
              onActivate={action.onActivate}
            />
          ))}
        </div>
        <p id={NOTE_ID} data-part="unavailable-note">
          {STRINGS.notImplemented}
        </p>
        <StatusText>{message}</StatusText>
      </div>
    </RegionFrame>
  );
}
