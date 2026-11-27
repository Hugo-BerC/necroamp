import { STRINGS } from '@renderer/app/strings/en';
import { RegionFrame } from '@renderer/components/region-frame';
import type { LiveEqualizer } from './use-live-equalizer';
import styles from './equalizer-view.module.css';

/**
 * Presentational equalizer. It receives a plain model, knows nothing about playback and sets
 * no inline styles, so a skin can restyle every `data-part` through CSS variables.
 */
export function LiveEqualizerView({ eq }: { readonly eq: LiveEqualizer }) {
  return (
    <RegionFrame id="equalizer" titleId="equalizer-heading" heading={STRINGS.regions.equalizer}>
      <div className={styles.root}>
        <div data-part="eq-controls" role="group" aria-label={STRINGS.equalizer.controls}>
          <div data-part="eq-preset">
            <label htmlFor="eq-preset-select">{STRINGS.equalizer.preset}</label>
            <select
              id="eq-preset-select"
              value={eq.preset}
              onChange={(event) => {
                eq.selectPreset(event.currentTarget.value);
              }}
            >
              {eq.isCustom ? (
                <option value={eq.preset} disabled>
                  {STRINGS.equalizer.custom}
                </option>
              ) : null}
              {eq.presets.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div data-part="eq-bypass">
            <input
              id="eq-bypass-toggle"
              type="checkbox"
              checked={eq.bypass}
              onChange={(event) => {
                eq.setBypass(event.currentTarget.checked);
              }}
            />
            <label htmlFor="eq-bypass-toggle">{STRINGS.equalizer.bypass}</label>
          </div>
          <div data-part="eq-preamp">
            <label htmlFor="eq-preamp-slider">{STRINGS.equalizer.preamp}</label>
            <input
              id="eq-preamp-slider"
              type="range"
              min={eq.preamp.min}
              max={eq.preamp.max}
              step={1}
              value={eq.preamp.valueDb}
              aria-valuetext={eq.preamp.valueText}
              onChange={(event) => {
                eq.preamp.set(Number(event.currentTarget.value));
              }}
            />
            <output data-part="eq-preamp-value" htmlFor="eq-preamp-slider">
              {eq.preamp.valueText}
            </output>
          </div>
        </div>
        <div data-part="eq-bands" role="group" aria-label={STRINGS.equalizer.bands}>
          {eq.bands.map((band) => (
            <div key={band.index} data-part="eq-band">
              <output data-part="eq-band-gain" htmlFor={`eq-band-${band.index}`}>
                {band.valueText}
              </output>
              <input
                id={`eq-band-${band.index}`}
                data-part="eq-band-slider"
                type="range"
                min={eq.gainMin}
                max={eq.gainMax}
                step={1}
                value={band.gainDb}
                aria-label={band.label}
                aria-valuetext={band.valueText}
                aria-orientation="vertical"
                onChange={(event) => {
                  band.set(Number(event.currentTarget.value));
                }}
              />
              <span data-part="eq-band-frequency" aria-hidden="true">
                {band.frequencyText}
              </span>
            </div>
          ))}
        </div>
      </div>
    </RegionFrame>
  );
}
