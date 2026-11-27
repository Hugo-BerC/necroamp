import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import type { AudioEngine } from '@renderer/audio';
import { STRINGS } from '@renderer/app/strings/en';
import { createPlayerPort } from '@renderer/stores/player-port';
import { createPlayerStore } from '@renderer/stores/player-store';
import { PlayerStoreProvider } from '@renderer/stores/player-store-context';
import { createPlaylistStore } from '@renderer/stores/playlist-store';
import { PlaylistStoreProvider } from '@renderer/stores/playlist-store-context';
import { PlayerRegion } from './player-region';

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const track = (n: number): TrackInfo => ({
  trackId: uuid(n),
  mediaUrl: `media://track/${uuid(n)}`,
  fileName: `t${String(n)}.mp3`,
  title: `Song ${String(n)}`,
  artist: 'Band',
  album: n === 1 ? 'First Album' : '',
  durationSec: 100,
  artworkUrl: n === 1 ? 'media://art/22222222-2222-4222-8222-222222222222' : null,
  available: true,
});

function setup() {
  const engine: AudioEngine = {
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    subscribe: () => () => undefined,
    dispose: vi.fn(),
  };
  const tracks = [track(1), track(2), track(3)];
  const library = { openFiles: () => Promise.resolve({ ok: true as const, data: { tracks } }) };
  const player = createPlayerStore(engine, library);
  const playlist = createPlaylistStore(createPlayerPort(player), library, {
    load: () => Promise.resolve({ ok: true, items: [] }),
    save: () => Promise.resolve({ ok: true }),
  });
  render(
    <PlayerStoreProvider store={player}>
      <PlaylistStoreProvider store={playlist}>
        <PlayerRegion />
      </PlaylistStoreProvider>
    </PlayerStoreProvider>,
  );
  return { engine, playlist };
}

describe('player with a playlist', () => {
  it('enables Next with tracks and Previous once something is selected', async () => {
    const { engine, playlist } = setup();
    const next = screen.getByRole('button', { name: STRINGS.player.controls.next });
    const previous = screen.getByRole('button', { name: STRINGS.player.controls.previous });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    await playlist.getState().addFiles();
    expect(await screen.findByRole('button', { name: 'Next' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    await playlist.getState().playIndex(0);
    expect(await screen.findByText('First Album')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: STRINGS.player.artworkAlt('Song 1') })).toHaveAttribute(
      'src',
      'media://art/22222222-2222-4222-8222-222222222222',
    );
    expect(previous).not.toHaveAttribute('aria-disabled');
    await userEvent.click(next);
    expect(engine.load).toHaveBeenLastCalledWith(track(2).mediaUrl);
    expect(screen.queryByText(STRINGS.player.playlistNote)).toBeNull();
  });

  it('Previous returns to the earlier track', async () => {
    const { engine, playlist } = setup();
    await playlist.getState().addFiles();
    await playlist.getState().playIndex(1);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.player.controls.previous }));
    expect(engine.load).toHaveBeenLastCalledWith(track(1).mediaUrl);
  });
});
