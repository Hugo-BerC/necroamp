import { useMemo } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import { usePlaceholderActivation } from '@renderer/components/control-button';

export interface SkinSelection {
  readonly chooseLabel: string;
  readonly onChoose: () => void;
  readonly message: string;
}

/** Placeholder only. No skin is listed or loaded (the final Skin Engine is out of scope). */
export function useSkinSelection(): SkinSelection {
  const { message, activate } = usePlaceholderActivation();
  return useMemo(
    () => ({
      chooseLabel: STRINGS.skins.choose,
      onChoose: () => {
        activate(STRINGS.activationMessage(STRINGS.skins.choose));
      },
      message,
    }),
    [activate, message],
  );
}
