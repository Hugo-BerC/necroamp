import { STRINGS } from '@renderer/app/strings/en';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { TransportControl } from './use-player';
import styles from './player-view.module.css';

export interface PlayerViewProps {
  readonly controls: readonly TransportControl[];
  readonly message: string;
}

const NOTE_ID = 'player-unavailable-note';

export function PlayerView({ controls, message }: PlayerViewProps) {
  return (
    <RegionFrame id="player" titleId="player-heading" heading={STRINGS.regions.player}>
      <div className={styles.root}>
        <div data-part="now-playing" role="group" aria-label={STRINGS.player.nowPlaying}>
          <dl>
            <div data-part="now-playing-title">
              <dt>{STRINGS.player.titleLabel}</dt>
              <dd>{STRINGS.player.noTrack}</dd>
            </div>
            <div data-part="now-playing-artist">
              <dt>{STRINGS.player.artistLabel}</dt>
              <dd>{STRINGS.player.noArtist}</dd>
            </div>
            <div data-part="now-playing-position">
              <dt>{STRINGS.player.positionLabel}</dt>
              <dd>{STRINGS.notAvailable}</dd>
            </div>
          </dl>
        </div>
        <div data-part="transport" role="group" aria-label={STRINGS.player.transport}>
          {controls.map((control) => (
            <ControlButton
              key={control.id}
              label={control.label}
              part={`transport-${control.id}`}
              unavailable={control.unavailable}
              describedBy={NOTE_ID}
              onActivate={control.onActivate}
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
