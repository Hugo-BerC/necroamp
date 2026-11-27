import { describe, expect, it } from 'vitest';
import {
  FALLBACK_COLORS,
  clearCanvas,
  drawSpectrum,
  drawWaveform,
  readVisualizerColors,
  type DrawContext,
} from './draw-visualizer';

interface Recorded {
  readonly ctx: DrawContext;
  readonly rects: number[][];
  readonly lines: string[];
}

function recorder(): Recorded {
  const rects: number[][] = [];
  const lines: string[] = [];
  const ctx: DrawContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect: (x, y, w, h) => rects.push([x, y, w, h]),
    beginPath: () => undefined,
    moveTo: (x, y) => lines.push(`m${x},${y}`),
    lineTo: (x, y) => lines.push(`l${x},${y}`),
    stroke: () => lines.push('s'),
  };
  return { ctx, rects, lines };
}

describe('draw-visualizer', () => {
  it('clears with the background color', () => {
    const { ctx, rects } = recorder();
    clearCanvas(ctx, 100, 50, FALLBACK_COLORS);
    expect(rects).toEqual([[0, 0, 100, 50]]);
    expect(ctx.fillStyle).toBe(FALLBACK_COLORS.background);
  });

  it('draws one bar per non-zero value anchored at the bottom', () => {
    const { ctx, rects } = recorder();
    drawSpectrum(ctx, 100, 50, [1, 0, 0.5, 2, -1], FALLBACK_COLORS);
    // First rect is the background clear. Zero and negative values draw nothing.
    expect(rects.slice(1)).toEqual([
      [0, 0, 19, 50],
      [40, 25, 19, 25],
      [60, 0, 19, 50],
    ]);
    expect(ctx.fillStyle).toBe(FALLBACK_COLORS.foreground);
  });

  it('draws nothing but the background for empty data', () => {
    const a = recorder();
    drawSpectrum(a.ctx, 10, 10, [], FALLBACK_COLORS);
    expect(a.rects).toHaveLength(1);
    const b = recorder();
    drawWaveform(b.ctx, 10, 10, [], [], FALLBACK_COLORS);
    expect(b.rects).toHaveLength(1);
    expect(b.lines).toEqual([]);
  });

  it('draws waveform columns as vertical strokes with a minimum length', () => {
    const { ctx, lines } = recorder();
    drawWaveform(ctx, 20, 100, [-1, 0, 5], [1, 0, 0.5], FALLBACK_COLORS);
    expect(lines.slice(0, 2)).toEqual(['m0.5,0', 'l0.5,100']);
    // Silent column keeps a one pixel stroke.
    expect(lines.slice(2, 4)).toEqual(['m6.5,50', 'l6.5,51']);
    expect(lines.at(-1)).toBe('s');
  });

  it('reads colors from CSS custom properties with fallbacks', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(readVisualizerColors(el)).toEqual(FALLBACK_COLORS);
    el.setAttribute('style', '--na-color-accent: #ff0000; --na-color-surface-inset: #00ff00');
    expect(readVisualizerColors(el)).toEqual({ background: '#00ff00', foreground: '#ff0000' });
    el.remove();
  });
});
