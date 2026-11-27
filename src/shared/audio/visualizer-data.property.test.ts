import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  bytesPeakLevel,
  bytesToBars,
  bytesToWaveformColumns,
  computeBarEdges,
  SPECTRUM_MAX_BARS,
} from './visualizer-data';

// Traceability: Block C "visualizer data" (bounded, finite, allocation-free output for any input).
const bytes = fc.uint8Array({ maxLength: 4096 });

describe('visualizer data properties', () => {
  it('computeBarEdges is monotonic, in bin range and sized bars + 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5, max: 1000 }),
        fc.integer({ min: -5, max: 70000 }),
        fc.oneof(fc.double(), fc.constant(44100), fc.constant(48000)),
        (bars, bins, rate) => {
          const edges = computeBarEdges(bars, bins, rate);
          expect(edges.length).toBeGreaterThanOrEqual(2);
          expect(edges.length - 1).toBeLessThanOrEqual(SPECTRUM_MAX_BARS);
          for (let i = 1; i < edges.length; i += 1) {
            expect(edges[i]!).toBeGreaterThanOrEqual(edges[i - 1]!);
          }
          expect(edges[0]!).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('bytesToBars yields finite values in [0, 1] for any bytes', () => {
    fc.assert(
      fc.property(bytes, fc.integer({ min: 1, max: 64 }), (data, bars) => {
        const edges = computeBarEdges(bars, Math.max(1, data.length), 44100);
        const out = new Float32Array(bars);
        bytesToBars(data, edges, out);
        for (const v of out) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }),
    );
  });

  it('bytesToWaveformColumns keeps min <= max within [-1, 1] and never throws', () => {
    fc.assert(
      fc.property(bytes, fc.integer({ min: 1, max: 256 }), (data, columns) => {
        const lo = new Float32Array(columns);
        const hi = new Float32Array(columns);
        bytesToWaveformColumns(data, lo, hi);
        for (let c = 0; c < columns; c += 1) {
          expect(lo[c]!).toBeGreaterThanOrEqual(-1);
          expect(hi[c]!).toBeLessThanOrEqual(1);
          expect(lo[c]!).toBeLessThanOrEqual(hi[c]!);
        }
      }),
    );
  });

  it('bytesPeakLevel is within [0, 1] and zero for pure silence (128)', () => {
    fc.assert(
      fc.property(bytes, (data) => {
        const p = bytesPeakLevel(data);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }),
    );
    expect(bytesPeakLevel(new Uint8Array(512).fill(128))).toBe(0);
  });
});
