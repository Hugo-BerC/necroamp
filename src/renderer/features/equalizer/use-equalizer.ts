import { STRINGS } from '@renderer/app/strings/en';

export interface EqualizerBand {
  readonly index: number;
  readonly name: string;
  readonly frequency: string;
}

/** Ten non-interactive band placeholders. No parameter mapping or DSP exists in this phase. */
export function useEqualizerBands(): readonly EqualizerBand[] {
  return EQUALIZER_BANDS;
}

const EQUALIZER_BANDS: readonly EqualizerBand[] = STRINGS.equalizer.frequencies.map(
  (frequency, position): EqualizerBand => ({
    index: position + 1,
    name: STRINGS.equalizer.band(position + 1),
    frequency,
  }),
);
