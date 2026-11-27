import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { EqStore } from './eq-store';

const EqStoreContext = createContext<EqStore | null>(null);

export interface EqStoreProviderProps {
  readonly store: EqStore;
  readonly children: ReactNode;
}

export function EqStoreProvider({ store, children }: EqStoreProviderProps) {
  return createElement(EqStoreContext.Provider, { value: store }, children);
}

/** `null` when none was provided; the equalizer then shows its inert placeholder. */
export function useEqStoreContext(): EqStore | null {
  return useContext(EqStoreContext);
}
