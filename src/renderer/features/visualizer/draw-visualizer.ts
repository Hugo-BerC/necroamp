/**
 * Canvas drawing for the spectrum and waveform. Pure functions over a minimal 2D context
 * interface so they run in unit tests with a recording fake. No allocation per frame.
 */
export interface DrawContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
}

export interface VisualizerColors {
  readonly background: string;
  readonly foreground: string;
}

/** Used when a CSS custom property is missing. Matches the foundation tokens. */
export const FALLBACK_COLORS: VisualizerColors = {
  background: '#000000',
  foreground: '#3fd0b0',
};

export const SPECTRUM_BAR_GAP_PX = 1;

/** Reads colors from the existing CSS custom properties, so skins restyle them. */
export function readVisualizerColors(element: Element, view: Window = window): VisualizerColors {
  const style = view.getComputedStyle(element);
  const background = style.getPropertyValue('--na-color-surface-inset').trim();
  const foreground = style.getPropertyValue('--na-color-accent').trim();
  return {
    background: background === '' ? FALLBACK_COLORS.background : background,
    foreground: foreground === '' ? FALLBACK_COLORS.foreground : foreground,
  };
}

export function clearCanvas(
  ctx: DrawContext,
  width: number,
  height: number,
  colors: VisualizerColors,
): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);
}

/** `bars` holds values in 0..1. Each bar is at least one pixel tall when its value is above 0. */
export function drawSpectrum(
  ctx: DrawContext,
  width: number,
  height: number,
  bars: ArrayLike<number>,
  colors: VisualizerColors,
): void {
  clearCanvas(ctx, width, height, colors);
  const count = bars.length;
  if (count === 0) {
    return;
  }
  ctx.fillStyle = colors.foreground;
  const slot = width / count;
  const barWidth = Math.max(1, slot - SPECTRUM_BAR_GAP_PX);
  for (let i = 0; i < count; i += 1) {
    const value = Math.min(1, Math.max(0, bars[i] ?? 0));
    if (value <= 0) {
      continue;
    }
    const barHeight = Math.max(1, Math.round(value * height));
    ctx.fillRect(Math.floor(i * slot), height - barHeight, barWidth, barHeight);
  }
}

/** `min` and `max` hold per-column extremes in -1..1. Draws one vertical stroke per column. */
export function drawWaveform(
  ctx: DrawContext,
  width: number,
  height: number,
  min: ArrayLike<number>,
  max: ArrayLike<number>,
  colors: VisualizerColors,
): void {
  clearCanvas(ctx, width, height, colors);
  const columns = Math.min(min.length, max.length);
  if (columns === 0) {
    return;
  }
  ctx.strokeStyle = colors.foreground;
  ctx.lineWidth = 1;
  const mid = height / 2;
  const slot = width / columns;
  ctx.beginPath();
  for (let c = 0; c < columns; c += 1) {
    const lo = Math.min(1, Math.max(-1, min[c] ?? 0));
    const hi = Math.min(1, Math.max(-1, max[c] ?? 0));
    const x = Math.floor(c * slot) + 0.5;
    // Canvas y grows downward, so the larger sample is the smaller y.
    const top = mid - hi * mid;
    const bottom = Math.max(mid - lo * mid, top + 1);
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }
  ctx.stroke();
}
