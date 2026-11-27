import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import { STRINGS } from '@renderer/app/strings/en';
import {
  createPlaylistStore,
  type PlayerOutcomeEvent,
  type PlaylistPlayerPort,
} from '@renderer/stores/playlist-store';
import { PlaylistStoreProvider } from '@renderer/stores/playlist-store-context';
import { createSeededRandom } from '@renderer/stores/playlist-ops';
import { PlaylistRegion } from './playlist-region';

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const track = (n: number, over: Partial<TrackInfo> = {}): TrackInfo => ({
  trackId: uuid(n),
  mediaUrl: `media://track/${uuid(n)}`,
  fileName: `t${String(n)}.mp3`,
  title: `Song ${String(n)}`,
  artist: `Artist ${String(n)}`,
  album: `Album ${String(n)}`,
  durationSec: 61 + n,
  artworkUrl: null,
  available: true,
  ...over,
});

function setup(tracks: TrackInfo[]) {
  const port: PlaylistPlayerPort = {
    playTrack: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    loadTrack: vi.fn(),
    unload: vi.fn(),
    isIdle: () => true,
    restart: vi.fn(),
    positionSec: () => 0,
    subscribe: (_l: (e: PlayerOutcomeEvent) => void) => () => undefined,
  };
  const store = createPlaylistStore(
    port,
    { openFiles: () => Promise.resolve({ ok: true, data: { tracks } }) },
    {
      load: () => Promise.resolve({ ok: true, items: [] }),
      save: () => Promise.resolve({ ok: true }),
    },
    { random: createSeededRandom(1) },
  );
  render(
    <PlaylistStoreProvider store={store}>
      <PlaylistRegion />
    </PlaylistStoreProvider>,
  );
  return { port, store };
}

const rows = () => within(screen.getByRole('list', { name: STRINGS.playlist.listLabel }));

describe('live playlist region', () => {
  it('shows the empty state, then lists tracks with metadata and duration', async () => {
    setup([track(1), track(2, { artist: '', album: '', durationSec: null })]);
    expect(screen.getByText(STRINGS.playlist.emptyLive)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    const items = rows().getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0] as HTMLElement).getByText('Artist 1')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('Album 1')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('1:02')).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText('--:--')).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText(STRINGS.playlist.unknownArtist)).toBeVisible();
    expect(screen.getByText('2 tracks')).toBeInTheDocument();
  });

  it('plays a track on activation and marks it as current by text and aria-current', async () => {
    const { port } = setup([track(1), track(2)]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.play('Song 2') }));
    expect(port.playTrack).toHaveBeenCalledWith(expect.objectContaining({ title: 'Song 2' }));
    const current = rows().getAllByRole('listitem')[1] as HTMLElement;
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(within(current).getByText(STRINGS.playlist.nowPlayingMarker)).toBeInTheDocument();
  });

  it('plays with the keyboard (focus and Enter)', async () => {
    const { port } = setup([track(1)]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    screen.getByRole('button', { name: STRINGS.playlist.play('Song 1') }).focus();
    await userEvent.keyboard('{Enter}');
    expect(port.playTrack).toHaveBeenCalledOnce();
  });

  it('reorders with buttons, keeps focus on the moved row, and disables the edges', async () => {
    setup([track(1), track(2), track(3)]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    const up1 = screen.getByRole('button', { name: STRINGS.playlist.moveUp('Song 1') });
    expect(up1).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.moveUp('Song 3') }));
    const titles = rows()
      .getAllByRole('button', { name: /^Play / })
      .map((b) => b.getAttribute('aria-label'));
    expect(titles).toEqual(['Play Song 1', 'Play Song 3', 'Play Song 2']);
    expect(screen.getByRole('button', { name: STRINGS.playlist.moveUp('Song 3') })).toHaveFocus();
    await userEvent.click(
      screen.getByRole('button', { name: STRINGS.playlist.moveDown('Song 3') }),
    );
    expect(screen.getByRole('button', { name: STRINGS.playlist.moveDown('Song 3') })).toHaveFocus();
    // Edge buttons do nothing.
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.moveUp('Song 1') }));
    await userEvent.click(
      screen.getByRole('button', { name: STRINGS.playlist.moveDown('Song 3') }),
    );
    expect(rows().getAllByRole('listitem')).toHaveLength(3);
  });

  it('removes a track and moves focus sensibly', async () => {
    const { port } = setup([track(1), track(2)]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.play('Song 1') }));
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.remove('Song 1') }));
    expect(port.stop).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: STRINGS.playlist.play('Song 2') })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.remove('Song 2') }));
    expect(screen.getByRole('button', { name: STRINGS.playlist.addFiles })).toHaveFocus();
    expect(screen.getByText(STRINGS.playlist.emptyLive)).toBeInTheDocument();
  });

  it('clears the list', async () => {
    setup([track(1), track(2)]);
    const clear = screen.getByRole('button', { name: STRINGS.playlist.clear });
    expect(clear).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    await userEvent.click(clear);
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.getByRole('button', { name: STRINGS.playlist.addFiles })).toHaveFocus();
  });

  it('toggles shuffle (aria-pressed) and cycles repeat', async () => {
    setup([track(1)]);
    const shuffle = screen.getByRole('button', { name: STRINGS.playlist.shuffle });
    expect(shuffle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(shuffle);
    expect(shuffle).toHaveAttribute('aria-pressed', 'true');
    const repeat = (mode: 'off' | 'track' | 'playlist') =>
      STRINGS.playlist.repeatLabel(STRINGS.playlist.repeatValue[mode]);
    await userEvent.click(screen.getByRole('button', { name: repeat('off') }));
    await userEvent.click(screen.getByRole('button', { name: repeat('track') }));
    await userEvent.click(screen.getByRole('button', { name: repeat('playlist') }));
    expect(screen.getByRole('button', { name: repeat('off') })).toBeInTheDocument();
  });

  it('marks missing files and announces why they cannot play', async () => {
    setup([track(1, { available: false })]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    expect(screen.getByText(STRINGS.playlist.missing)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.play('Song 1') }));
    expect(screen.getByRole('status')).toHaveTextContent(
      STRINGS.playlist.notices['track-unavailable'],
    );
  });

  it('renders artwork when present and falls back to a placeholder on load error', async () => {
    const url = 'media://art/22222222-2222-4222-8222-222222222222';
    setup([track(1, { artworkUrl: url })]);
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    const item = rows().getAllByRole('listitem')[0] as HTMLElement;
    const image = item.querySelector('img');
    expect(image).toHaveAttribute('src', url);
    image?.dispatchEvent(new Event('error'));
    await vi.waitFor(() => {
      expect(item.querySelector('img')).toBeNull();
    });
    expect(item.querySelector('[data-has-art="false"]')).not.toBeNull();
  });

  it('shows a bridge failure when adding fails', async () => {
    const port: PlaylistPlayerPort = {
      playTrack: vi.fn(() => Promise.resolve()),
      stop: vi.fn(),
      loadTrack: vi.fn(),
      unload: vi.fn(),
      isIdle: () => true,
      restart: vi.fn(),
      positionSec: () => 0,
      subscribe: () => () => undefined,
    };
    const store = createPlaylistStore(
      port,
      { openFiles: () => Promise.resolve({ ok: false, reason: 'unavailable' }) },
      {
        load: () => Promise.resolve({ ok: true, items: [] }),
        save: () => Promise.resolve({ ok: true }),
      },
    );
    render(
      <PlaylistStoreProvider store={store}>
        <PlaylistRegion />
      </PlaylistStoreProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFiles }));
    expect(screen.getByRole('status')).toHaveTextContent(STRINGS.playlist.openFailures.unavailable);
  });

  it('shows a loading message while the saved playlist loads', () => {
    const port: PlaylistPlayerPort = {
      playTrack: vi.fn(() => Promise.resolve()),
      stop: vi.fn(),
      loadTrack: vi.fn(),
      unload: vi.fn(),
      isIdle: () => true,
      restart: vi.fn(),
      positionSec: () => 0,
      subscribe: () => () => undefined,
    };
    const store = createPlaylistStore(
      port,
      { openFiles: () => Promise.resolve({ ok: true, data: { tracks: [] } }) },
      {
        load: () => new Promise(() => undefined),
        save: () => Promise.resolve({ ok: true }),
      },
    );
    void store.getState().load();
    render(
      <PlaylistStoreProvider store={store}>
        <PlaylistRegion />
      </PlaylistStoreProvider>,
    );
    expect(screen.getByText(STRINGS.playlist.loading)).toBeInTheDocument();
  });

  it('adds a folder through the Add folder button and shows the truncation notice', async () => {
    const port: PlaylistPlayerPort = {
      playTrack: vi.fn(() => Promise.resolve()),
      stop: vi.fn(),
      loadTrack: vi.fn(),
      unload: vi.fn(),
      isIdle: () => true,
      restart: vi.fn(),
      positionSec: () => 0,
      subscribe: () => () => undefined,
    };
    const store = createPlaylistStore(
      port,
      {
        openFiles: () => Promise.resolve({ ok: true, data: { tracks: [] } }),
        openFolder: () =>
          Promise.resolve({
            ok: true,
            data: { tracks: [track(1)], canceled: false, truncated: true },
          }),
      },
      {
        load: () => Promise.resolve({ ok: true, items: [] }),
        save: () => Promise.resolve({ ok: true }),
      },
    );
    render(
      <PlaylistStoreProvider store={store}>
        <PlaylistRegion />
      </PlaylistStoreProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: STRINGS.playlist.addFolder }));
    expect(rows().getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText(STRINGS.playlist.notices['folder-truncated'])).toBeInTheDocument();
  });
});
