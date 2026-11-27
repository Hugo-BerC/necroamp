import { useLayoutEffect, useRef, useState } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import { Artwork } from '@renderer/components/artwork';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { LivePlaylist } from './use-live-playlist';
import styles from './playlist-view.module.css';

/** Where focus should land after a row action re-renders the list. */
type FocusTarget =
  | { readonly kind: 'row'; readonly index: number; readonly part: string }
  | { readonly kind: 'add' };

export function LivePlaylistView({ playlist }: { readonly playlist: LivePlaylist }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const last = playlist.rows.length - 1;

  // Moving or removing a row re-orders the DOM, which can drop keyboard focus. Put it back.
  useLayoutEffect(() => {
    if (focusTarget === null || rootRef.current === null) {
      return;
    }
    const root = rootRef.current;
    const selector =
      focusTarget.kind === 'add'
        ? '[data-part="playlist-add-files"]'
        : `li[data-index="${String(focusTarget.index)}"] [data-part="${focusTarget.part}"]`;
    const target = root.querySelector<HTMLElement>(selector);
    (target ?? root.querySelector<HTMLElement>('[data-part="playlist-add-files"]'))?.focus();
    setFocusTarget(null);
  }, [focusTarget, playlist.rows]);

  return (
    <RegionFrame id="playlist" titleId="playlist-heading" heading={STRINGS.regions.playlist}>
      <div className={styles.root} ref={rootRef}>
        <div data-part="playlist-actions" role="group" aria-label={STRINGS.playlist.actionsLabel}>
          <ControlButton
            label={STRINGS.playlist.addFiles}
            part="playlist-add-files"
            onActivate={playlist.addFiles}
          />
          <ControlButton
            label={STRINGS.playlist.addFolder}
            part="playlist-add-folder"
            onActivate={playlist.addFolder}
          />
          <ControlButton
            label={STRINGS.playlist.clear}
            part="playlist-clear"
            unavailable={playlist.rows.length === 0}
            onActivate={() => {
              if (playlist.rows.length > 0) {
                playlist.clear();
                setFocusTarget({ kind: 'add' });
              }
            }}
          />
          <ControlButton
            label={STRINGS.playlist.shuffle}
            part="playlist-shuffle"
            pressed={playlist.shuffle}
            onActivate={playlist.toggleShuffle}
          />
          <ControlButton
            label={playlist.repeatLabel}
            part="playlist-repeat"
            onActivate={playlist.cycleRepeat}
          />
        </div>
        <p data-part="playlist-count">{playlist.countText}</p>
        {playlist.rows.length === 0 ? (
          <p data-part="playlist-empty">
            {playlist.loading ? STRINGS.playlist.loading : STRINGS.playlist.emptyLive}
          </p>
        ) : null}
        <ul data-part="playlist-items" aria-label={STRINGS.playlist.listLabel}>
          {playlist.rows.map((row) => (
            <li
              key={row.key}
              data-part="playlist-item"
              data-index={row.index}
              data-current={row.isCurrent ? 'true' : undefined}
              data-unavailable={row.available ? undefined : 'true'}
              aria-current={row.isCurrent ? 'true' : undefined}
            >
              <Artwork url={row.artworkUrl} alt="" part="playlist-artwork" />
              <div data-part="track-info">
                <button
                  type="button"
                  data-part="track-play"
                  aria-label={STRINGS.playlist.play(row.title)}
                  onClick={() => {
                    playlist.play(row.index);
                  }}
                >
                  {row.title}
                </button>
                <span data-part="track-artist">{row.artist}</span>
                <span data-part="track-album">{row.album}</span>
                {row.isCurrent ? (
                  <span data-part="track-marker">{STRINGS.playlist.nowPlayingMarker}</span>
                ) : null}
                {row.available ? null : (
                  <span data-part="track-missing">{STRINGS.playlist.missing}</span>
                )}
              </div>
              <span data-part="track-duration">{row.duration}</span>
              <div data-part="track-actions" role="group" aria-label={row.title}>
                <ControlButton
                  label={STRINGS.playlist.up}
                  ariaLabel={STRINGS.playlist.moveUp(row.title)}
                  part="track-move-up"
                  unavailable={row.index === 0}
                  onActivate={() => {
                    if (row.index > 0) {
                      playlist.move(row.index, row.index - 1);
                      setFocusTarget({ kind: 'row', index: row.index - 1, part: 'track-move-up' });
                    }
                  }}
                />
                <ControlButton
                  label={STRINGS.playlist.down}
                  ariaLabel={STRINGS.playlist.moveDown(row.title)}
                  part="track-move-down"
                  unavailable={row.index === last}
                  onActivate={() => {
                    if (row.index < last) {
                      playlist.move(row.index, row.index + 1);
                      setFocusTarget({
                        kind: 'row',
                        index: row.index + 1,
                        part: 'track-move-down',
                      });
                    }
                  }}
                />
                <ControlButton
                  label={STRINGS.playlist.removeLabel}
                  ariaLabel={STRINGS.playlist.remove(row.title)}
                  part="track-remove"
                  onActivate={() => {
                    playlist.remove(row.index);
                    setFocusTarget(
                      row.index < last
                        ? { kind: 'row', index: row.index, part: 'track-play' }
                        : row.index > 0
                          ? { kind: 'row', index: row.index - 1, part: 'track-play' }
                          : { kind: 'add' },
                    );
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        <StatusText tone={playlist.noticeText === '' ? 'neutral' : 'warning'}>
          {playlist.noticeText}
        </StatusText>
      </div>
    </RegionFrame>
  );
}
