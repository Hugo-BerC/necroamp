import { describe, expect, it } from 'vitest';
import {
  bytesPeakLevel,
  bytesToBars,
  bytesToWaveformColumns,
  computeBarEdges,
} from './visualizer-data';

describe('computeBarEdges', () => {
  it('returns monotonic non-decreasing edges within the bin range', () => {
    const edges = computeBarEdges(32, 1024, 48000);
    expect(edges).toHaveLength(33);
    for (let i = 1; i < edges.length; i += 1) {
      expect(edges[i]!).toBeGreaterThanOrEqual(edges[i - 1]!);
    }
    expect(edges[edges.length - 1]!).toBeLessThanOrEqual(1024);
  });
  it('spaces bars logarithmically: low bars cover fewer bins than high bars', () => {
    const edges = computeBarEdges(16, 1024, 48000);
    const first = edges[1]! - edges[0]!;
    const last = edges[16]! - edges[15]!;
    expect(last).toBeGreaterThan(first);
  });
  it('survives hostile arguments', () => {
    expect(computeBarEdges(Number.NaN, Number.NaN, Number.NaN)).toHaveLength(2);
    expect(computeBarEdges(1e9, 1e9, 1e9).length).toBe(257);
    expect(computeBarEdges(8, 4, -1).every((v) => v >= 0 && v <= 4)).toBe(true);
  });
});

describe('bytesToBars', () => {
  it('normalizes the peak of each bar into 0..1', () => {
    const bytes = new Uint8Array(1024);
    bytes[10] = 255;
    const edges = computeBarEdges(8, 1024, 48000);
    const out = new Float32Array(8);
    bytesToBars(bytes, edges, out);
    expect(Math.max(...out)).toBe(1);
    expect([...out].every((v) => v >= 0 && v <= 1)).toBe(true);
  });
  it('writes zeros for silence and for bars beyond the edges, and tolerates short input', () => {
    const edges = computeBarEdges(4, 1024, 48000);
    const out = new Float32Array(6).fill(0.5);
    bytesToBars(new Uint8Array(0), edges, out);
    expect([...out]).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('bytesToWaveformColumns', () => {
  it('maps 128 to 0 and extremes to about -1 and +1', () => {
    const bytes = new Uint8Array(256).fill(128);
    bytes[0] = 0;
    bytes[255] = 255;
    const min = new Float32Array(2);
    const max = new Float32Array(2);
    bytesToWaveformColumns(bytes, min, max);
    expect(min[0]).toBe(-1);
    expect(max[0]).toBe(0);
    expect(min[1]).toBe(0);
    expect(max[1]).toBeCloseTo(0.9921875, 6);
  });
  it('yields zeros for empty input and keeps min <= max for any column count', () => {
    const min = new Float32Array(300);
    const max = new Float32Array(300);
    bytesToWaveformColumns(new Uint8Array(0), min, max);
    expect(min.every((v) => v === 0) && max.every((v) => v === 0)).toBe(true);
    const bytes = Uint8Array.from({ length: 100 }, (_, i) => (i * 37) % 256);
    bytesToWaveformColumns(bytes, min, max);
    for (let i = 0; i < 300; i += 1) {
      expect(min[i]!).toBeLessThanOrEqual(max[i]!);
    }
  });
});

describe('bytesPeakLevel', () => {
  it('is 0 for silence and 1 at full scale', () => {
    expect(bytesPeakLevel(new Uint8Array(16).fill(128))).toBe(0);
    expect(bytesPeakLevel(Uint8Array.of(128, 0))).toBe(1);
    expect(bytesPeakLevel([])).toBe(0);
  });
});
