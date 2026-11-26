import { useMemo } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import { usePlaceholderActivation } from '@renderer/components/control-button';

export type TransportControlId = keyof typeof STRINGS.player.controls;

export const TRANSPORT_CONTROL_IDS: readonly TransportControlId[] = [
  'previous',
  'play',
  'pause',
  'stop',
  'next',
];

export interface TransportControl {
  readonly id: TransportControlId;
  readonly label: string;
  readonly unavailable: true;
  readonly onActivate: () => void;
}

export interface PlayerControls {
  readonly controls: readonly TransportControl[];
  readonly message: string;
}

/**
 * Headless behavior for the transport. No audio engine exists yet, so every control is
 * unavailable and activation only changes the status message. It never touches audio.
 */
export function usePlayerControls(): PlayerControls {
  const { message, activate } = usePlaceholderActivation();
  const controls = useMemo(
    () =>
      TRANSPORT_CONTROL_IDS.map((id): TransportControl => {
        const label = STRINGS.player.controls[id];
        return {
          id,
          label,
          unavailable: true,
          onActivate: () => {
            activate(STRINGS.activationMessage(label));
          },
        };
      }),
    [activate],
  );
  return { controls, message };
}
