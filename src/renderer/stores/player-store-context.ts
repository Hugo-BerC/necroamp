import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { PlayerStore } from './player-store';

const PlayerStoreContext = createContext<PlayerStore | null>(null);

export interface PlayerStoreProviderProps {
  readonly store: PlayerStore;
  readonly children: ReactNode;
}

/** Hands the injected player store to regions. Regions take no props (see app-shell). */
export function PlayerStoreProvider({ store, children }: PlayerStoreProviderProps) {
  return createElement(PlayerStoreContext.Provider, { value: store }, children);
}

/** `null` when no store was provided; the player then shows its inert placeholder. */
export function usePlayerStoreContext(): PlayerStore | null {
  return useContext(PlayerStoreContext);
}
