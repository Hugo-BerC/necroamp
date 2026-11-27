import { describe, expect, it } from 'vitest';
import {
  CUSTOM_PRESET,
  DEFAULT_EQ_SETTINGS,
  EQ_BANDS,
  EQ_BAND_COUNT,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_PRESETS,
  EQ_PRESET_NAMES,
  EQ_Q_MAX,
  EQ_Q_MIN,
  applyPreset,
  clampFrequencyHz,
  clampGainDb,
  clampPreampDb,
  clampQ,
  dbToLinear,
  editBand,
  effectiveGains,
  flatGains,
  normalizeGains,
  sanitizeEqSettings,
  setBypass,
  setPreamp,
} from './eq';

describe('band table', () => {
  it('has ten octave bands with shelves at the ends', () => {
    expect(EQ_BANDS.map((b) => b.frequencyHz)).toEqual([
      31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
    ]);
    expect(EQ_BANDS).toHaveLength(EQ_BAND_COUNT);
    expect(EQ_BANDS[0]?.type).toBe('lowshelf');
    expect(EQ_BANDS[9]?.type).toBe('highshelf');
    expect(EQ_BANDS.slice(1, 9).every((b) => b.type === 'peaking')).toBe(true);
    expect(Object.isFrozen(EQ_BANDS)).toBe(true);
  });
});

describe('clamps', () => {
  it('clamps gains to +-12 dB and maps NaN to 0', () => {
    expect(clampGainDb(30)).toBe(EQ_GAIN_MAX_DB);
    expect(clampGainDb(-30)).toBe(EQ_GAIN_MIN_DB);
    expect(clampGainDb(Infinity)).toBe(12);
    expect(clampGainDb(-Infinity)).toBe(-12);
    expect(clampGainDb(Number.NaN)).toBe(0);
    expect(clampGainDb(3.5)).toBe(3.5);
    expect(clampGainDb('x' as unknown as number)).toBe(0);
  });
  it('clamps the preamp', () => {
    expect(clampPreampDb(99)).toBe(12);
    expect(clampPreampDb(-99)).toBe(-12);
    expect(clampPreampDb(Number.NaN)).toBe(0);
    expect(clampPreampDb(undefined as unknown as number)).toBe(0);
    expect(clampPreampDb(-4)).toBe(-4);
  });
  it('clamps Q to the documented range and defaults non-finite input', () => {
    expect(clampQ(0)).toBe(EQ_Q_MIN);
    expect(clampQ(1000)).toBe(EQ_Q_MAX);
    expect(clampQ(Number.NaN)).toBeGreaterThan(0);
  });
  it('keeps frequency below Nyquist and finite', () => {
    expect(clampFrequencyHz(16000, 8000)).toBe(3600);
    expect(clampFrequencyHz(16000, 48000)).toBe(16000);
    expect(clampFrequencyHz(Number.NaN, 48000)).toBe(10);
    expect(clampFrequencyHz(-5, Number.NaN)).toBe(10);
    expect(clampFrequencyHz(1e9, 1e9)).toBe(192000 * 0.45);
  });
  it('converts dB to a finite positive linear gain', () => {
    expect(dbToLinear(0)).toBe(1);
    expect(dbToLinear(6)).toBeCloseTo(1.995, 3);
    expect(dbToLinear(Infinity)).toBeCloseTo(10 ** (12 / 20), 10);
    expect(dbToLinear(Number.NaN)).toBe(1);
  });
});

describe('normalizeGains', () => {
  it('always yields ten clamped finite gains', () => {
    expect(normalizeGains(undefined)).toEqual(flatGains());
    expect(normalizeGains(null)).toEqual(flatGains());
    expect(normalizeGains([50, 'x', Number.NaN, -50])).toEqual([12, 0, 0, -12, 0, 0, 0, 0, 0, 0]);
    expect(normalizeGains(new Array(20).fill(1))).toHaveLength(10);
  });
});

describe('presets', () => {
  it('provides the eight named presets inside the gain range', () => {
    expect([...EQ_PRESET_NAMES]).toEqual([
      'Flat',
      'Rock',
      'Pop',
      'Jazz',
      'Classical',
      'Bass Boost',
      'Treble Boost',
      'Vocal',
    ]);
    for (const name of EQ_PRESET_NAMES) {
      const gains = EQ_PRESETS[name];
      expect(gains).toHaveLength(10);
      expect(gains.every((g) => g >= EQ_GAIN_MIN_DB && g <= EQ_GAIN_MAX_DB)).toBe(true);
      expect(Object.isFrozen(gains)).toBe(true);
    }
    expect(EQ_PRESETS.Flat.every((g) => g === 0)).toBe(true);
  });
  it('applyPreset sets bands and name, and ignores unknown names', () => {
    const rock = applyPreset(DEFAULT_EQ_SETTINGS, 'Rock');
    expect(rock.bands).toEqual(EQ_PRESETS.Rock);
    expect(rock.preset).toBe('Rock');
    expect(applyPreset(rock, 'Nope')).toBe(rock);
    expect(applyPreset(rock, '__proto__')).toBe(rock);
  });
  it('editing a band marks the preset Custom and clamps', () => {
    const rock = applyPreset(DEFAULT_EQ_SETTINGS, 'Rock');
    const edited = editBand(rock, 3, 40);
    expect(edited.preset).toBe(CUSTOM_PRESET);
    expect(edited.bands[3]).toBe(12);
    expect(edited.bands[0]).toBe(EQ_PRESETS.Rock[0]);
    expect(rock.bands[3]).toBe(EQ_PRESETS.Rock[3]);
  });
  it('ignores edits to invalid band indexes', () => {
    expect(editBand(DEFAULT_EQ_SETTINGS, -1, 3)).toBe(DEFAULT_EQ_SETTINGS);
    expect(editBand(DEFAULT_EQ_SETTINGS, 10, 3)).toBe(DEFAULT_EQ_SETTINGS);
    expect(editBand(DEFAULT_EQ_SETTINGS, 1.5, 3)).toBe(DEFAULT_EQ_SETTINGS);
  });
});

describe('preamp and bypass', () => {
  it('clamps the preamp and keeps the preset', () => {
    const rock = applyPreset(DEFAULT_EQ_SETTINGS, 'Rock');
    const next = setPreamp(rock, 100);
    expect(next.preampDb).toBe(12);
    expect(next.preset).toBe('Rock');
  });
  it('bypass yields zero gains without changing stored settings', () => {
    const settings = setPreamp(applyPreset(DEFAULT_EQ_SETTINGS, 'Rock'), 6);
    const bypassed = setBypass(settings, true);
    expect(bypassed.bands).toEqual(settings.bands);
    expect(bypassed.preampDb).toBe(6);
    const effective = effectiveGains(bypassed);
    expect(effective.bands.every((g) => g === 0)).toBe(true);
    expect(effective.preampDb).toBe(0);
    expect(effectiveGains(setBypass(bypassed, false)).bands).toEqual(settings.bands);
  });
});

describe('sanitizeEqSettings', () => {
  it('falls back to Flat for unusable input', () => {
    for (const bad of [null, undefined, 3, 'x', [], {}, { bands: 'no' }]) {
      expect(sanitizeEqSettings(bad)).toEqual(DEFAULT_EQ_SETTINGS);
    }
  });
  it('clamps values and keeps a matching preset name', () => {
    const out = sanitizeEqSettings({
      bands: [...EQ_PRESETS.Rock],
      preampDb: 99,
      bypass: true,
      preset: 'Rock',
    });
    expect(out.preset).toBe('Rock');
    expect(out.preampDb).toBe(12);
    expect(out.bypass).toBe(true);
  });
  it('demotes a preset name that does not match the bands', () => {
    const out = sanitizeEqSettings({ bands: new Array(10).fill(1), preset: 'Rock' });
    expect(out.preset).toBe(CUSTOM_PRESET);
    expect(sanitizeEqSettings({ bands: new Array(10).fill(1), preset: 'Custom' }).preset).toBe(
      CUSTOM_PRESET,
    );
    expect(sanitizeEqSettings({ bands: [1], preset: 7, bypass: 'yes' }).bypass).toBe(false);
  });
});
