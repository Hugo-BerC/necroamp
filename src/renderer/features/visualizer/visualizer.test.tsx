import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand';
import type { AudioProcessing } from '@renderer/audio';
import { STRINGS } from '@renderer/app/strings/en';
import { AudioProcessingProvider } from '@renderer/stores/audio-processing-context';
import type { PlayerStore } from '@renderer/stores/player-store';
import { PlayerStoreProvider } from '@renderer/stores/player-store-context';
import { VisualizerRegion } from './visualizer-region';

const fills: string[] = [];
let frameCallbacks: ((t: number) => void)[] = [];

function fakeProcessing(active: boolean): AudioProcessing {
  const frequency = new Uint8Array(1024).fill(200);
  const waveform = new Uint8Array(2048).fill(200);
  return {
    ensureReady: () => Promise.resolve(true),
    setEq: () => undefined,
    getEq: () => {
      throw new Error('unused');
    },
    setMasterGain: () => true,
    isGraphActive: () => active,
    getContextStatus: () => 'running',
    subscribeContextStatus: () => () => undefined,
    getFrequencyData: () => (active ? frequency : null),
    getWaveformData: () => (active ? waveform : null),
    getSampleRate: () => 48000,
    dispose: () => undefined,
  };
}

function fakePlayer(status: string): PlayerStore {
  // The visualizer reads only `playback.status`; the rest of the state is not needed.
  return createStore(() => ({ playback: { status } })) as unknown as PlayerStore;
}

function runFrame(): void {
  const callbacks = frameCallbacks;
  frameCallbacks = [];
  act(() => {
    callbacks.forEach((cb) => {
      cb(0);
    });
  });
}

beforeEach(() => {
  fills.length = 0;
  frameCallbacks = [];
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => frameCallbacks.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frameCallbacks = [];
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () =>
      ({
        set fillStyle(value: string) {
          fills.push(value);
        },
        strokeStyle: '',
        lineWidth: 0,
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
      }) as unknown as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
});

function renderWith(processing: AudioProcessing, player: PlayerStore) {
  return render(
    <AudioProcessingProvider processing={processing}>
      <PlayerStoreProvider store={player}>
        <VisualizerRegion />
      </PlayerStoreProvider>
    </AudioProcessingProvider>,
  );
}

describe('visualizer region', () => {
  it('shows the inert placeholder without audio processing', () => {
    render(<VisualizerRegion />);
    expect(screen.getByText(STRINGS.visualizer.unavailable)).toBeInTheDocument();
  });

  it('renders two labelled canvases', () => {
    renderWith(fakeProcessing(true), fakePlayer('idle'));
    expect(screen.getByRole('img', { name: STRINGS.visualizer.spectrumDescription })).toBeTruthy();
    expect(screen.getByRole('img', { name: STRINGS.visualizer.waveformDescription })).toBeTruthy();
  });

  it('schedules no frames while not playing', () => {
    renderWith(fakeProcessing(true), fakePlayer('paused'));
    expect(frameCallbacks).toHaveLength(0);
  });

  it('draws frames while playing and stops when playback pauses', () => {
    const player = fakePlayer('playing');
    renderWith(fakeProcessing(true), player);
    expect(frameCallbacks).toHaveLength(1);
    const before = fills.length;
    runFrame();
    expect(fills.length).toBeGreaterThan(before);
    expect(frameCallbacks).toHaveLength(1);
    act(() => {
      player.setState({ playback: { status: 'paused' } } as never);
    });
    expect(frameCallbacks).toHaveLength(0);
  });

  it('starts when playback starts', () => {
    const player = fakePlayer('stopped');
    renderWith(fakeProcessing(true), player);
    act(() => {
      player.setState({ playback: { status: 'playing' } } as never);
    });
    expect(frameCallbacks).toHaveLength(1);
  });

  it('pauses while the document is hidden and resumes when visible', () => {
    renderWith(fakeProcessing(true), fakePlayer('playing'));
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(frameCallbacks).toHaveLength(0);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(frameCallbacks).toHaveLength(1);
  });

  it('skips drawing data before the audio graph exists', () => {
    renderWith(fakeProcessing(false), fakePlayer('playing'));
    const before = fills.length;
    runFrame();
    expect(fills.length).toBe(before);
  });

  it('cancels the loop on unmount', () => {
    const { unmount } = renderWith(fakeProcessing(true), fakePlayer('playing'));
    unmount();
    expect(frameCallbacks).toHaveLength(0);
  });

  it('works without a player store (never playing)', () => {
    render(
      <AudioProcessingProvider processing={fakeProcessing(true)}>
        <VisualizerRegion />
      </AudioProcessingProvider>,
    );
    expect(frameCallbacks).toHaveLength(0);
  });
});
