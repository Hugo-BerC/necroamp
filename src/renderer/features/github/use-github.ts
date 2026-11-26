import { useMemo } from 'react';
import { STRINGS } from '@renderer/app/strings/en';
import { usePlaceholderActivation } from '@renderer/components/control-button';

export interface GithubPlaceholder {
  readonly signInLabel: string;
  readonly onSignIn: () => void;
  readonly message: string;
}

/** Placeholder only. No authentication or network call exists in this phase. */
export function useGithubPlaceholder(): GithubPlaceholder {
  const { message, activate } = usePlaceholderActivation();
  return useMemo(
    () => ({
      signInLabel: STRINGS.github.signIn,
      onSignIn: () => {
        activate(STRINGS.activationMessage(STRINGS.github.signIn));
      },
      message,
    }),
    [activate, message],
  );
}
