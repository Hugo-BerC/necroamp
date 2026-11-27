import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TrackInfo } from '@shared/ipc';
import type { AudioEngine, AudioEngineListener } from '@renderer/audio';
import { STRINGS } from '@renderer/app/strings/en';
import { createPlayerStore } from '@renderer/stores/player-store';
import { PlayerStoreProvider } from '@renderer/stores/player-store-context';
import { PlayerRegion } from './player-region';

const TRACK: TrackInfo = {
  trackId: '11111111-1111-4111-8111-111111111111',
  mediaUrl: 'media://track/11111111-1111-4111-8111-111111111111',
  fileName: 'tone.mp3',
  title: 'Tone',
  artist: 'Unknown artist',
  album: '',
  durationSec: null,
  artworkUrl: null,
  available: true,
};

function setup() {
  let listener: AudioEngineListener | undefined;
  const engine: AudioEngine = {
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    subscribe: (l) => {
      listener = l;
      return () => undefined;
    },
    dispose: vi.fn(),
  };
  const store = createPlayerStore(engine, {
    openFiles: () => Promise.resolve({ ok: true, data: { tracks: [TRACK] } }),
  });
  render(
    <PlayerStoreProvider store={store}>
      <PlayerRegion />
    </PlayerStoreProvider>,
  );
  return { engine, store, emit: (e: Parameters<AudioEngineListener>[0]) => listener?.(e) };
}

describe('live player region', () => {
  it('opens a file and drives the engine through the store', async () => {
    const { engine } = setup();
    const play = screen.getByRole('button', { name: 'Play' });
    expect(play).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('button', { name: STRINGS.player.open }));
    expect(await screen.findByText('Tone')).toBeInTheDocument();
    expect(engine.load).toHaveBeenCalledWith(TRACK.mediaUrl);
    expect(engine.play).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(engine.pause).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(engine.play).toHaveBeenCalledTimes(2);
  });

  it('shows elapsed and duration and a labelled seek slider', async () => {
    const { emit, engine } = setup();
    await userEvent.click(screen.getByRole('button', { name: STRINGS.player.open }));
    act(() => {
      emit({ type: 'metadata', durationSec: 125 });
      emit({ type: 'time', positionSec: 61 });
    });
    const position = document.querySelector('[data-part="now-playing-position"]');
    expect(position).toHaveTextContent('1:01 / 2:05');
    const seek = screen.getByRole('slider', { name: STRINGS.player.seek });
    expect(seek).toHaveAttribute('aria-valuetext', '1:01 of 2:05');
    fireEvent.change(seek, { target: { value: '90' } });
    expect(engine.seek).toHaveBeenCalledWith(90);
  });

  it('has a volume slider and a mute toggle with aria-pressed', async () => {
    const { engine } = setup();
    const mute = screen.getByRole('button', { name: STRINGS.player.mute });
    expect(mute).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(mute);
    expect(mute).toHaveAttribute('aria-pressed', 'true');
    expect(engine.setMuted).toHaveBeenLastCalledWith(true);
    const volume = screen.getByRole('slider', { name: STRINGS.player.volume });
    fireEvent.change(volume, { target: { value: '40' } });
    expect(engine.setVolume).toHaveBeenLastCalledWith(0.4);
  });

  it('announces a fixed error message for a failed file', async () => {
    const { emit } = setup();
    await userEvent.click(screen.getByRole('button', { name: STRINGS.player.open }));
    act(() => {
      emit({ type: 'error', code: 'CORRUPT' });
    });
    const region = screen.getByRole('region', { name: STRINGS.regions.player });
    expect(within(region).getByRole('status')).toHaveTextContent(STRINGS.player.errors.CORRUPT);
  });
});
