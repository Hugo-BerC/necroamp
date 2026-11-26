import { useEffect } from 'react';
import { useStore } from 'zustand';
import type { AppInfoState, AppInfoStore } from '@renderer/stores/app-info-store';

/** Binds an injected store, starts loading once on mount, returns narrow slices. */
export function useAppInfo(store: AppInfoStore): {
  readonly status: AppInfoState['status'];
  readonly data: AppInfoState['data'];
  readonly failure: AppInfoState['failure'];
} {
  const status = useStore(store, (state) => state.status);
  const data = useStore(store, (state) => state.data);
  const failure = useStore(store, (state) => state.failure);

  useEffect(() => {
    // StrictMode runs effects twice in development. Only the first call starts a load.
    if (store.getState().status === 'idle') {
      void store.getState().load();
    }
  }, [store]);

  return { status, data, failure };
}
