/**
 * Pure equalizer model: band table, ranges, clamping, presets and settings operations.
 * No DOM, Web Audio or framework imports. The renderer graph and UI both read these
 * constants so ranges are enforced in one place (docs/audio/dsp-notes.md).
 */

export const EQ_BAND_COUNT = 10;
export type EqFilterType = 'lowshelf' | 'peaking' | 'highshelf';

export interface EqBand {
  readonly frequencyHz: number;
  readonly type: EqFilterType;
  readonly label: string;
}

/** Octave-spaced centers. First band is a low shelf, last a high shelf. */
export const EQ_BANDS: readonly EqBand[] = Object.freeze(
  (
    [
      [31, 'lowshelf', '31'],
      [62, 'peaking', '62'],
      [125, 'peaking', '125'],
      [250, 'peaking', '250'],
      [500, 'peaking', '500'],
      [1000, 'peaking', '1k'],
      [2000, 'peaking', '2k'],
      [4000, 'peaking', '4k'],
      [8000, 'peaking', '8k'],
      [16000, 'highshelf', '16k'],
    ] as const
  ).map(([frequencyHz, type, label]) => Object.freeze({ frequencyHz, type, label })),
);

/** Gain range in dB for every band and the preamp (inclusive). */
export const EQ_GAIN_MIN_DB = -12;
export const EQ_GAIN_MAX_DB = 12;
export const EQ_PREAMP_MIN_DB = -12;
export const EQ_PREAMP_MAX_DB = 12;
/** Quality factor for peaking bands. 1.4142 is about one octave bandwidth. Shelves ignore Q. */
export const EQ_PEAKING_Q = 1.4142;
export const EQ_Q_MIN = 0.1;
export const EQ_Q_MAX = 18;
/** Supported sample-rate range for Nyquist clamping. */
export const EQ_SAMPLE_RATE_MIN_HZ = 8000;
export const EQ_SAMPLE_RATE_MAX_HZ = 192000;
export const EQ_FREQUENCY_MIN_HZ = 10;
/** Time constant (seconds) for AudioParam smoothing of EQ and gain changes. */
export const EQ_SMOOTHING_TIME_CONSTANT_S = 0.015;

export const EQ_PRESET_NAMES = [
  'Flat',
  'Rock',
  'Pop',
  'Jazz',
  'Classical',
  'Bass Boost',
  'Treble Boost',
  'Vocal',
] as const;
export type EqPresetName = (typeof EQ_PRESET_NAMES)[number];
export type EqPresetId = EqPresetName | 'Custom';
export const CUSTOM_PRESET = 'Custom' as const;

export type EqGains = readonly number[];

const PRESET_GAINS: Readonly<Record<EqPresetName, readonly number[]>> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5],
  Pop: [-1, 2, 4, 5, 3, 0, -1, -1, -1, -1],
  Jazz: [4, 3, 1, 2, -2, -2, 0, 1, 3, 4],
  Classical: [0, 0, 0, 0, 0, 0, -3, -3, -3, -5],
  'Bass Boost': [8, 7, 5, 3, 1, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 1, 3, 5, 7, 8],
  Vocal: [-2, -3, -3, 1, 4, 4, 3, 1, 0, -1],
};

/** Presets as frozen data. Every value is within the gain range (tested). */
export const EQ_PRESETS: Readonly<Record<EqPresetName, EqGains>> = Object.freeze(
  Object.fromEntries(
    EQ_PRESET_NAMES.map((name) => [name, Object.freeze([...PRESET_GAINS[name]])]),
  ) as Record<EqPresetName, EqGains>,
);

export interface EqSettings {
  readonly bands: EqGains;
  readonly preampDb: number;
  readonly bypass: boolean;
  readonly preset: EqPresetId;
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamps a band gain to the documented range. NaN becomes 0, infinities saturate. */
export function clampGainDb(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return clamp(value, EQ_GAIN_MIN_DB, EQ_GAIN_MAX_DB);
}

export function clampPreampDb(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return clamp(value, EQ_PREAMP_MIN_DB, EQ_PREAMP_MAX_DB);
}

export function clampQ(value: number): number {
  return clamp(finiteOr(value, EQ_PEAKING_Q), EQ_Q_MIN, EQ_Q_MAX);
}

/** Clamps a sample rate into the supported range. */
export function clampSampleRate(sampleRate: number): number {
  return clamp(finiteOr(sampleRate, 44100), EQ_SAMPLE_RATE_MIN_HZ, EQ_SAMPLE_RATE_MAX_HZ);
}

/** Clamps a filter frequency to [EQ_FREQUENCY_MIN_HZ, 0.45 * sampleRate] (below Nyquist). */
export function clampFrequencyHz(frequencyHz: number, sampleRate: number): number {
  const ceiling = clampSampleRate(sampleRate) * 0.45;
  return clamp(finiteOr(frequencyHz, EQ_FREQUENCY_MIN_HZ), EQ_FREQUENCY_MIN_HZ, ceiling);
}

/** dB to linear amplitude. Input is clamped to the preamp range first, so output is finite. */
export function dbToLinear(db: number): number {
  return 10 ** (clampPreampDb(db) / 20);
}

export function flatGains(): EqGains {
  return Object.freeze(new Array<number>(EQ_BAND_COUNT).fill(0));
}

/** Always returns exactly ten clamped, finite gains. Missing entries are 0, extras are dropped. */
export function normalizeGains(gains: ArrayLike<unknown> | null | undefined): EqGains {
  const out: number[] = [];
  for (let i = 0; i < EQ_BAND_COUNT; i += 1) {
    const raw = gains?.[i];
    out.push(typeof raw === 'number' ? clampGainDb(raw) : 0);
  }
  return Object.freeze(out);
}

export const DEFAULT_EQ_SETTINGS: EqSettings = Object.freeze({
  bands: flatGains(),
  preampDb: 0,
  bypass: false,
  preset: 'Flat',
});

export function isPresetName(value: unknown): value is EqPresetName {
  return typeof value === 'string' && (EQ_PRESET_NAMES as readonly string[]).includes(value);
}

/** Selecting a preset sets all ten bands. Unknown names leave settings unchanged. */
export function applyPreset(settings: EqSettings, name: string): EqSettings {
  if (!isPresetName(name)) {
    return settings;
  }
  return { ...settings, bands: normalizeGains(EQ_PRESETS[name]), preset: name };
}

/** Sets one band. The preset becomes Custom. An out-of-range index leaves settings unchanged. */
export function editBand(settings: EqSettings, index: number, gainDb: number): EqSettings {
  if (!Number.isInteger(index) || index < 0 || index >= EQ_BAND_COUNT) {
    return settings;
  }
  const bands = [...normalizeGains(settings.bands)];
  bands[index] = clampGainDb(gainDb);
  return { ...settings, bands: Object.freeze(bands), preset: CUSTOM_PRESET };
}

/** Preamp edits do not change the preset name: the preamp is not part of a preset. */
export function setPreamp(settings: EqSettings, preampDb: number): EqSettings {
  return { ...settings, preampDb: clampPreampDb(preampDb) };
}

export function setBypass(settings: EqSettings, bypass: boolean): EqSettings {
  return { ...settings, bypass: bypass === true };
}

/** Gains the audio graph should apply. Bypass yields zeros and does not alter stored settings. */
export function effectiveGains(settings: EqSettings): {
  readonly bands: EqGains;
  readonly preampDb: number;
} {
  if (settings.bypass) {
    return { bands: flatGains(), preampDb: 0 };
  }
  return { bands: normalizeGains(settings.bands), preampDb: clampPreampDb(settings.preampDb) };
}

/**
 * Builds valid settings from untrusted stored data. Anything unusable falls back to Flat.
 * A preset name that no longer matches the bands is kept only if the bands equal the preset.
 */
export function sanitizeEqSettings(input: unknown): EqSettings {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_EQ_SETTINGS;
  }
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw['bands'])) {
    return DEFAULT_EQ_SETTINGS;
  }
  const bands = normalizeGains(raw['bands'] as unknown[]);
  const preampDb = clampPreampDb(finiteOr(raw['preampDb'], 0));
  const bypass = raw['bypass'] === true;
  const declared = raw['preset'];
  let preset: EqPresetId = CUSTOM_PRESET;
  if (isPresetName(declared) && EQ_PRESETS[declared].every((g, i) => g === bands[i])) {
    preset = declared;
  } else if (declared === CUSTOM_PRESET) {
    preset = CUSTOM_PRESET;
  }
  return { bands, preampDb, bypass, preset };
}
