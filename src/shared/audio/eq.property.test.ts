import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  applyPreset,
  clampFrequencyHz,
  clampGainDb,
  clampPreampDb,
  clampQ,
  DEFAULT_EQ_SETTINGS,
  dbToLinear,
  editBand,
  effectiveGains,
  EQ_BAND_COUNT,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_PRESET_NAMES,
  EQ_PREAMP_MAX_DB,
  EQ_PREAMP_MIN_DB,
  normalizeGains,
  sanitizeEqSettings,
  setBypass,
  setPreamp,
} from './eq';

// Traceability: tech.md "Testing" (equalizer parameter mapping and clamping), design Block C.
const anyDouble = fc.double({ noNaN: false });
const anyJson = fc.anything();

describe('equalizer mapping and clamping properties', () => {
  it('clampGainDb is total, in range and idempotent', () => {
    fc.assert(
      fc.property(anyDouble, (x) => {
        const y = clampGainDb(x);
        expect(Number.isFinite(y)).toBe(true);
        expect(y).toBeGreaterThanOrEqual(EQ_GAIN_MIN_DB);
        expect(y).toBeLessThanOrEqual(EQ_GAIN_MAX_DB);
        expect(clampGainDb(y)).toBe(y);
      }),
    );
  });

  it('clampGainDb is the identity inside the range and monotonic', () => {
    fc.assert(
      fc.property(
        fc.double({ min: EQ_GAIN_MIN_DB, max: EQ_GAIN_MAX_DB, noNaN: true }),
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        (inside, a, b) => {
          expect(clampGainDb(inside)).toBe(inside);
          const [lo, hi] = a <= b ? [a, b] : [b, a];
          expect(clampGainDb(lo)).toBeLessThanOrEqual(clampGainDb(hi));
        },
      ),
    );
  });

  it('clampPreampDb and dbToLinear stay finite, positive and bounded', () => {
    fc.assert(
      fc.property(anyDouble, (x) => {
        const p = clampPreampDb(x);
        expect(p).toBeGreaterThanOrEqual(EQ_PREAMP_MIN_DB);
        expect(p).toBeLessThanOrEqual(EQ_PREAMP_MAX_DB);
        const lin = dbToLinear(x);
        expect(Number.isFinite(lin)).toBe(true);
        expect(lin).toBeGreaterThan(0);
        expect(lin).toBeLessThanOrEqual(10 ** (EQ_PREAMP_MAX_DB / 20) + 1e-9);
      }),
    );
  });

  it('clampFrequencyHz stays below Nyquist for any rate and frequency', () => {
    fc.assert(
      fc.property(anyDouble, anyDouble, (f, rate) => {
        const hz = clampFrequencyHz(f, rate);
        expect(Number.isFinite(hz)).toBe(true);
        expect(hz).toBeGreaterThan(0);
        expect(hz).toBeLessThan(192000 / 2);
        if (Number.isFinite(rate) && rate >= 8000) {
          expect(hz).toBeLessThan(Math.min(rate, 192000) / 2);
        }
      }),
    );
  });

  it('clampQ is finite and within range', () => {
    fc.assert(
      fc.property(anyDouble, (q) => {
        const v = clampQ(q);
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0.1);
        expect(v).toBeLessThanOrEqual(18);
      }),
    );
  });

  it('normalizeGains always yields exactly ten finite in-range gains for any input', () => {
    fc.assert(
      fc.property(fc.oneof(fc.array(anyJson, { maxLength: 40 }), fc.constant(null)), (input) => {
        const out = normalizeGains(input as ArrayLike<unknown> | null);
        expect(out).toHaveLength(EQ_BAND_COUNT);
        for (const g of out) {
          expect(Number.isFinite(g)).toBe(true);
          expect(g).toBeGreaterThanOrEqual(EQ_GAIN_MIN_DB);
          expect(g).toBeLessThanOrEqual(EQ_GAIN_MAX_DB);
        }
      }),
    );
  });

  it('editBand changes only the target band and marks the preset Custom', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: EQ_BAND_COUNT - 1 }), anyDouble, (i, gain) => {
        const next = editBand(DEFAULT_EQ_SETTINGS, i, gain);
        expect(next.preset).toBe('Custom');
        next.bands.forEach((g, j) => {
          if (j === i) expect(g).toBe(clampGainDb(gain));
          else expect(g).toBe(DEFAULT_EQ_SETTINGS.bands[j]);
        });
      }),
    );
  });

  it('editBand ignores out-of-range or non-integer indices', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: -1 }),
          fc.integer({ min: EQ_BAND_COUNT }),
          fc.double({ noInteger: true }),
        ),
        anyDouble,
        (i, gain) => {
          expect(editBand(DEFAULT_EQ_SETTINGS, i, gain)).toBe(DEFAULT_EQ_SETTINGS);
        },
      ),
    );
  });

  it('applyPreset ignores unknown names and never leaves the gain range', () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const next = applyPreset(DEFAULT_EQ_SETTINGS, name);
        if (!(EQ_PRESET_NAMES as readonly string[]).includes(name)) {
          expect(next).toBe(DEFAULT_EQ_SETTINGS);
        }
        expect(next.bands).toHaveLength(EQ_BAND_COUNT);
      }),
    );
  });

  it('effectiveGains under bypass is flat and leaves stored settings unchanged', () => {
    fc.assert(
      fc.property(fc.array(anyDouble, { maxLength: 12 }), anyDouble, (bands, preamp) => {
        const base = setPreamp({ ...DEFAULT_EQ_SETTINGS, bands: normalizeGains(bands) }, preamp);
        const bypassed = setBypass(base, true);
        const eff = effectiveGains(bypassed);
        expect(eff.bands.every((g) => g === 0)).toBe(true);
        expect(eff.preampDb).toBe(0);
        expect(bypassed.bands).toEqual(base.bands);
        expect(bypassed.preampDb).toBe(base.preampDb);
        expect(effectiveGains(setBypass(bypassed, false)).bands).toEqual(base.bands);
      }),
    );
  });

  it('sanitizeEqSettings never throws and always returns valid settings', () => {
    fc.assert(
      fc.property(anyJson, (input) => {
        const s = sanitizeEqSettings(input);
        expect(s.bands).toHaveLength(EQ_BAND_COUNT);
        expect(s.bands.every((g) => Number.isFinite(g) && g >= -12 && g <= 12)).toBe(true);
        expect(Number.isFinite(s.preampDb)).toBe(true);
        expect(s.preampDb).toBeGreaterThanOrEqual(EQ_PREAMP_MIN_DB);
        expect(s.preampDb).toBeLessThanOrEqual(EQ_PREAMP_MAX_DB);
        expect(typeof s.bypass).toBe('boolean');
      }),
    );
  });

  it('sanitizeEqSettings is idempotent', () => {
    fc.assert(
      fc.property(anyJson, (input) => {
        const once = sanitizeEqSettings(input);
        expect(sanitizeEqSettings(once)).toEqual(once);
      }),
    );
  });
});
