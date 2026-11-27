import { useMemo } from 'react';
import { useStore } from 'zustand';
import {
  CUSTOM_PRESET,
  EQ_BANDS,
  EQ_GAIN_MAX_DB,
  EQ_GAIN_MIN_DB,
  EQ_PREAMP_MAX_DB,
  EQ_PREAMP_MIN_DB,
  EQ_PRESET_NAMES,
} from '@shared/audio/eq';
import { STRINGS } from '@renderer/app/strings/en';
import type { EqStore } from '@renderer/stores/eq-store';

export interface LiveEqBand {
  readonly index: number;
  readonly label: string;
  readonly frequencyText: string;
  readonly gainDb: number;
  readonly valueText: string;
  readonly set: (gainDb: number) => void;
}

export interface LiveEqualizer {
  readonly bands: readonly LiveEqBand[];
  readonly gainMin: number;
  readonly gainMax: number;
  readonly preamp: {
    readonly valueDb: number;
    readonly valueText: string;
    readonly min: number;
    readonly max: number;
    readonly set: (db: number) => void;
  };
  readonly bypass: boolean;
  readonly setBypass: (bypass: boolean) => void;
  /** Selectable preset names. */
  readonly presets: readonly string[];
  /** Current preset, or `Custom` after a manual edit. */
  readonly preset: string;
  readonly isCustom: boolean;
  readonly selectPreset: (name: string) => void;
}

/** Headless equalizer behavior. Reads only the equalizer store, never playback state. */
export function useLiveEqualizer(store: EqStore): LiveEqualizer {
  const settings = useStore(store, (s) => s.settings);
  const { setBand, setPreamp, setBypass, applyPreset } = useStore(store, (s) => s);
  return useMemo(
    () => ({
      bands: EQ_BANDS.map((band, index): LiveEqBand => {
        const frequencyText = STRINGS.equalizer.frequencies[index] ?? band.label;
        const gainDb = settings.bands[index] ?? 0;
        return {
          index,
          label: STRINGS.equalizer.bandSlider(frequencyText),
          frequencyText,
          gainDb,
          valueText: STRINGS.equalizer.gainText(gainDb),
          set: (value) => {
            setBand(index, value);
          },
        };
      }),
      gainMin: EQ_GAIN_MIN_DB,
      gainMax: EQ_GAIN_MAX_DB,
      preamp: {
        valueDb: settings.preampDb,
        valueText: STRINGS.equalizer.gainText(settings.preampDb),
        min: EQ_PREAMP_MIN_DB,
        max: EQ_PREAMP_MAX_DB,
        set: setPreamp,
      },
      bypass: settings.bypass,
      setBypass,
      presets: EQ_PRESET_NAMES,
      preset: settings.preset,
      isCustom: settings.preset === CUSTOM_PRESET,
      selectPreset: applyPreset,
    }),
    [settings, setBand, setPreamp, setBypass, applyPreset],
  );
}
