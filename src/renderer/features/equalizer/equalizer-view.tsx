import { STRINGS } from '@renderer/app/strings/en';
import { RegionFrame } from '@renderer/components/region-frame';
import type { EqualizerBand } from './use-equalizer';
import styles from './equalizer-view.module.css';

export interface EqualizerViewProps {
  readonly bands: readonly EqualizerBand[];
}

export function EqualizerView({ bands }: EqualizerViewProps) {
  return (
    <RegionFrame id="equalizer" titleId="equalizer-heading" heading={STRINGS.regions.equalizer}>
      <div className={styles.root}>
        <p data-part="unavailable-note">{STRINGS.equalizer.unavailable}</p>
        <div data-part="eq-bands" role="group" aria-label={STRINGS.equalizer.bands}>
          {bands.map((band) => (
            <div key={band.index} role="group" aria-label={band.name} data-part="eq-band">
              <span data-part="eq-band-frequency">{band.frequency}</span>
              <span data-part="eq-band-state">{STRINGS.notAvailable}</span>
            </div>
          ))}
        </div>
      </div>
    </RegionFrame>
  );
}
