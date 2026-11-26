import { STRINGS } from '@renderer/app/strings/en';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { SkinSelection } from './use-skins';
import styles from './skins-view.module.css';

const NOTE_ID = 'skin-selector-unavailable-note';

export function SkinsView({ chooseLabel, onChoose, message }: SkinSelection) {
  return (
    <RegionFrame
      id="skin-selector"
      titleId="skin-selector-heading"
      heading={STRINGS.regions['skin-selector']}
    >
      <div className={styles.root}>
        <p data-part="skin-none">{STRINGS.skins.none}</p>
        <ControlButton
          label={chooseLabel}
          part="skin-choose"
          unavailable
          describedBy={NOTE_ID}
          onActivate={onChoose}
        />
        <p id={NOTE_ID} data-part="unavailable-note">
          {STRINGS.notImplemented}
        </p>
        <StatusText>{message}</StatusText>
      </div>
    </RegionFrame>
  );
}
