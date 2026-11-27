import { STRINGS } from '@renderer/app/strings/en';
import { Artwork } from '@renderer/components/artwork';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { LivePlayer } from './use-live-player';
import styles from './player-view.module.css';

const NOTE_ID = 'player-playlist-note';

export function LivePlayerView({ player }: { readonly player: LivePlayer }) {
  const seekable = player.durationSec !== null && player.durationSec > 0;
  return (
    <RegionFrame id="player" titleId="player-heading" heading={STRINGS.regions.player}>
      <div className={styles.root}>
        <div data-part="now-playing" role="group" aria-label={STRINGS.player.nowPlaying}>
          <Artwork
            url={player.artworkUrl}
            alt={STRINGS.player.artworkAlt(player.title)}
            part="now-playing-artwork"
          />
          <dl>
            <div data-part="now-playing-title">
              <dt>{STRINGS.player.titleLabel}</dt>
              <dd>{player.title}</dd>
            </div>
            <div data-part="now-playing-artist">
              <dt>{STRINGS.player.artistLabel}</dt>
              <dd>{player.artist}</dd>
            </div>
            <div data-part="now-playing-album">
              <dt>{STRINGS.player.albumLabel}</dt>
              <dd>{player.album}</dd>
            </div>
            <div data-part="now-playing-position">
              <dt>{STRINGS.player.positionLabel}</dt>
              <dd>
                <span data-part="elapsed">{player.elapsed}</span>
                {' / '}
                <span data-part="duration">{player.duration}</span>
              </dd>
            </div>
          </dl>
        </div>
        <div data-part="file" role="group" aria-label={STRINGS.player.file}>
          <ControlButton label={STRINGS.player.open} part="open-file" onActivate={player.open} />
        </div>
        <div data-part="transport" role="group" aria-label={STRINGS.player.transport}>
          {player.controls.map((control) => (
            <ControlButton
              key={control.id}
              label={control.label}
              part={`transport-${control.id}`}
              unavailable={control.unavailable}
              describedBy={
                !player.hasPlaylist && (control.id === 'previous' || control.id === 'next')
                  ? NOTE_ID
                  : undefined
              }
              onActivate={control.onActivate}
            />
          ))}
        </div>
        <div data-part="seek">
          <label htmlFor="player-seek">{STRINGS.player.seek}</label>
          <input
            id="player-seek"
            type="range"
            min={0}
            max={seekable ? Math.floor(player.durationSec ?? 0) : 0}
            step={1}
            value={Math.min(Math.floor(player.positionSec), Math.floor(player.durationSec ?? 0))}
            disabled={!seekable}
            aria-valuetext={STRINGS.player.seekValueText(player.elapsed, player.duration)}
            onChange={(event) => {
              player.seek(Number(event.currentTarget.value));
            }}
          />
        </div>
        <div data-part="volume" role="group" aria-label={STRINGS.player.volumeGroup}>
          <label htmlFor="player-volume">{STRINGS.player.volume}</label>
          <input
            id="player-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={player.volumePercent}
            aria-valuetext={`${String(player.volumePercent)}%`}
            onChange={(event) => {
              player.setVolumePercent(Number(event.currentTarget.value));
            }}
          />
          <ControlButton
            label={STRINGS.player.mute}
            part="mute"
            pressed={player.muted}
            onActivate={player.toggleMute}
          />
        </div>
        {player.hasPlaylist ? null : (
          <p id={NOTE_ID} data-part="unavailable-note">
            {STRINGS.player.playlistNote}
          </p>
        )}
        <StatusText tone={player.isError ? 'danger' : 'neutral'}>{player.message}</StatusText>
      </div>
    </RegionFrame>
  );
}
