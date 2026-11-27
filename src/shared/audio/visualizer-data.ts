/**
 * Pure shaping of AnalyserNode byte data into drawable values. No DOM or Web Audio imports.
 * Functions write into caller-owned output arrays so a render loop allocates nothing per frame.
 */

export const ANALYSER_FFT_SIZE = 2048;
export const ANALYSER_SMOOTHING = 0.8;
export const ANALYSER_MIN_DECIBELS = -90;
export const ANALYSER_MAX_DECIBELS = -10;
export const SPECTRUM_MIN_HZ = 31;
export const SPECTRUM_MAX_HZ = 16000;
export const SPECTRUM_DEFAULT_BARS = 32;
export const SPECTRUM_MAX_BARS = 256;
export const WAVEFORM_DEFAULT_COLUMNS = 128;
export const WAVEFORM_MAX_COLUMNS = 2048;
/** Byte value that represents silence in `getByteTimeDomainData`. */
export const WAVEFORM_BYTE_CENTER = 128;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Bin index range [start, end) for each bar on a log frequency axis. Allocates; call once per layout. */
export function computeBarEdges(
  barCount: number,
  binCount: number,
  sampleRate: number,
  minHz: number = SPECTRUM_MIN_HZ,
  maxHz: number = SPECTRUM_MAX_HZ,
): Int32Array {
  const bars = clampInt(barCount, 1, SPECTRUM_MAX_BARS);
  const bins = clampInt(binCount, 1, 1 << 16);
  const rate = Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 44100;
  const nyquist = rate / 2;
  const lo = Math.max(1, Math.min(minHz, nyquist / 2));
  const hi = Math.min(Math.max(maxHz, lo * 2), nyquist);
  const edges = new Int32Array(bars + 1);
  const ratio = Math.log(hi / lo);
  let previous = 0;
  for (let i = 0; i <= bars; i += 1) {
    const hz = lo * Math.exp((ratio * i) / bars);
    let bin = Math.round((hz / nyquist) * bins);
    bin = Math.min(bins, Math.max(bin, previous));
    // Every bar covers at least one bin, while staying inside the bin range.
    if (i > 0 && bin <= edges[i - 1]!) {
      bin = Math.min(bins, edges[i - 1]! + 1);
    }
    edges[i] = bin;
    previous = bin;
  }
  return edges;
}

/**
 * Groups byte frequency data (0..255, already dB-scaled by the analyser) into bars in 0..1.
 * Each bar takes the maximum of its bins, which keeps narrow peaks visible.
 * `out.length` is the number of bars; `edges` comes from `computeBarEdges(out.length, ...)`.
 */
export function bytesToBars(
  bytes: ArrayLike<number>,
  edges: Int32Array,
  out: Float32Array,
): Float32Array {
  const bars = Math.min(out.length, edges.length - 1);
  for (let i = 0; i < bars; i += 1) {
    const start = Math.min(edges[i]!, bytes.length);
    const end = Math.min(Math.max(edges[i + 1]!, start + 1), bytes.length);
    let peak = 0;
    for (let b = start; b < end; b += 1) {
      const v = bytes[b] ?? 0;
      if (v > peak) {
        peak = v;
      }
    }
    out[i] = Math.min(1, Math.max(0, peak / 255));
  }
  for (let i = bars; i < out.length; i += 1) {
    out[i] = 0;
  }
  return out;
}

/**
 * Reduces time-domain bytes (0..255, 128 = silence) to per-column min and max in [-1, 1].
 * Both outputs must have the same length (the column count).
 */
export function bytesToWaveformColumns(
  bytes: ArrayLike<number>,
  outMin: Float32Array,
  outMax: Float32Array,
): void {
  const columns = Math.min(outMin.length, outMax.length);
  const n = bytes.length;
  for (let c = 0; c < columns; c += 1) {
    const start = n === 0 ? 0 : Math.floor((c * n) / columns);
    const end = n === 0 ? 0 : Math.max(start + 1, Math.floor(((c + 1) * n) / columns));
    let lo = 1;
    let hi = -1;
    for (let i = start; i < end && i < n; i += 1) {
      const s = ((bytes[i] ?? WAVEFORM_BYTE_CENTER) - WAVEFORM_BYTE_CENTER) / WAVEFORM_BYTE_CENTER;
      const v = Math.min(1, Math.max(-1, s));
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (lo > hi) {
      lo = 0;
      hi = 0;
    }
    outMin[c] = lo;
    outMax[c] = hi;
  }
}

/** Peak absolute level in 0..1 of time-domain bytes. Useful for a meter or silence detection. */
export function bytesPeakLevel(bytes: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    const v = Math.abs(
      ((bytes[i] ?? WAVEFORM_BYTE_CENTER) - WAVEFORM_BYTE_CENTER) / WAVEFORM_BYTE_CENTER,
    );
    if (v > peak) peak = v;
  }
  return Math.min(1, peak);
}
