import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { PlaylistStore } from './playlist-store';

const PlaylistStoreContext = createContext<PlaylistStore | null>(null);

export interface PlaylistStoreProviderProps {
  readonly store: PlaylistStore;
  readonly children: ReactNode;
}

/** Hands the injected playlist store to regions. Regions take no props (see app-shell). */
export function PlaylistStoreProvider({ store, children }: PlaylistStoreProviderProps) {
  return createElement(PlaylistStoreContext.Provider, { value: store }, children);
}

/** `null` when no store was provided; the playlist then shows its inert placeholder. */
export function usePlaylistStoreContext(): PlaylistStore | null {
  return useContext(PlaylistStoreContext);
}
