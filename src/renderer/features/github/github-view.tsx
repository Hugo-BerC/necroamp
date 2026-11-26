import { STRINGS } from '@renderer/app/strings/en';
import { ControlButton } from '@renderer/components/control-button';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { GithubPlaceholder } from './use-github';
import styles from './github-view.module.css';

const NOTE_ID = 'github-unavailable-note';

export function GithubView({ signInLabel, onSignIn, message }: GithubPlaceholder) {
  return (
    <RegionFrame id="github" titleId="github-heading" heading={STRINGS.regions.github}>
      <div className={styles.root}>
        <p data-part="github-optional">{STRINGS.github.optional}</p>
        <ControlButton
          label={signInLabel}
          part="github-sign-in"
          unavailable
          describedBy={NOTE_ID}
          onActivate={onSignIn}
        />
        <p id={NOTE_ID} data-part="unavailable-note">
          {STRINGS.notImplemented}
        </p>
        <StatusText>{message}</StatusText>
      </div>
    </RegionFrame>
  );
}
