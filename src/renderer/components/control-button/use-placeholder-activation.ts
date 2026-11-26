import { useCallback, useState } from 'react';

export interface PlaceholderActivation {
  readonly message: string;
  readonly activate: (message: string) => void;
}

/** Local status text for controls that have no backend yet. Activation changes only the text. */
export function usePlaceholderActivation(): PlaceholderActivation {
  const [message, setMessage] = useState('');
  const activate = useCallback((next: string) => {
    setMessage(next);
  }, []);
  return { message, activate };
}
