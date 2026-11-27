import { useEffect, useRef, type RefObject } from 'react';
import {
  SPECTRUM_DEFAULT_BARS,
  WAVEFORM_DEFAULT_COLUMNS,
  bytesToBars,
  bytesToWaveformColumns,
  computeBarEdges,
} from '@shared/audio/visualizer-data';
import { createVisualLoop, type AudioProcessing } from '@renderer/audio';
import type { PlayerStore } from '@renderer/stores/player-store';
import {
  FALLBACK_COLORS,
  clearCanvas,
  drawSpectrum,
  drawWaveform,
  readVisualizerColors,
  type DrawContext,
  type VisualizerColors,
} from './draw-visualizer';

/** Internal canvas resolution. CSS scales the element. */
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 96;

export interface LiveVisualizer {
  readonly spectrumRef: RefObject<HTMLCanvasElement | null>;
  readonly waveformRef: RefObject<HTMLCanvasElement | null>;
}

function context2d(canvas: HTMLCanvasElement | null): DrawContext | null {
  // jsdom and some headless modes return null; drawing is then skipped.
  return canvas?.getContext('2d') ?? null;
}

/**
 * Drives both canvases from the analyser on requestAnimationFrame. The loop runs only while
 * playback is `playing` and the document is visible (docs: tech.md, audio rules). It only
 * reads data. It never feeds anything back into playback.
 */
export function useLiveVisualizer(
  processing: AudioProcessing,
  player: PlayerStore | null,
): LiveVisualizer {
  const spectrumRef = useRef<HTMLCanvasElement | null>(null);
  const waveformRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const bars = new Float32Array(SPECTRUM_DEFAULT_BARS);
    const columnsMin = new Float32Array(WAVEFORM_DEFAULT_COLUMNS);
    const columnsMax = new Float32Array(WAVEFORM_DEFAULT_COLUMNS);
    let edges: Int32Array | null = null;
    let edgesKey = '';
    let colors: VisualizerColors = FALLBACK_COLORS;

    const refreshColors = (): void => {
      const element = spectrumRef.current ?? waveformRef.current;
      if (element !== null) {
        colors = readVisualizerColors(element);
      }
    };

    const clearBoth = (): void => {
      const spectrum = context2d(spectrumRef.current);
      const waveform = context2d(waveformRef.current);
      if (spectrum !== null) clearCanvas(spectrum, CANVAS_WIDTH, CANVAS_HEIGHT, colors);
      if (waveform !== null) clearCanvas(waveform, CANVAS_WIDTH, CANVAS_HEIGHT, colors);
    };

    const onFrame = (): void => {
      const frequency = processing.getFrequencyData();
      const waveform = processing.getWaveformData();
      const spectrumCtx = context2d(spectrumRef.current);
      const waveformCtx = context2d(waveformRef.current);
      if (frequency !== null && spectrumCtx !== null) {
        const rate = processing.getSampleRate() ?? 44100;
        const key = `${frequency.length}:${rate}`;
        if (edges === null || key !== edgesKey) {
          edges = computeBarEdges(bars.length, frequency.length, rate);
          edgesKey = key;
        }
        bytesToBars(frequency, edges, bars);
        drawSpectrum(spectrumCtx, CANVAS_WIDTH, CANVAS_HEIGHT, bars, colors);
      }
      if (waveform !== null && waveformCtx !== null) {
        bytesToWaveformColumns(waveform, columnsMin, columnsMax);
        drawWaveform(waveformCtx, CANVAS_WIDTH, CANVAS_HEIGHT, columnsMin, columnsMax, colors);
      }
    };

    refreshColors();
    clearBoth();
    const loop = createVisualLoop({ onFrame });
    const onPlayingChange = (value: boolean): void => {
      if (value) {
        refreshColors();
      } else {
        clearBoth();
      }
      loop.setPlaying(value);
    };
    onPlayingChange(player?.getState().playback.status === 'playing');
    const unsubscribe =
      player?.subscribe((state, previous) => {
        const now = state.playback.status === 'playing';
        if (now !== (previous.playback.status === 'playing')) {
          onPlayingChange(now);
        }
      }) ?? ((): void => undefined);

    return () => {
      unsubscribe();
      loop.dispose();
    };
  }, [processing, player]);

  return { spectrumRef, waveformRef };
}
