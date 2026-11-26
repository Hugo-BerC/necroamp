import { createStore, type StoreApi } from 'zustand';
import type { AppInfo, IpcErrorCode } from '@shared/ipc';

export type AppInfoFailureReason =
  | 'unavailable' // window.necroamp is missing (R8.10)
  | 'rejected' // the bridge call threw or rejected
  | 'invalid-response' // the value did not match the shared schema
  | 'ipc-error'; // main answered with { ok: false }

export type AppInfoClientResult =
  | { readonly ok: true; readonly data: AppInfo }
  | {
      readonly ok: false;
      readonly reason: AppInfoFailureReason;
      readonly code?: IpcErrorCode;
    };

/** What the store needs from the bridge adapter. Tests pass a fake. */
export interface AppInfoClient {
  readonly getAppInfo: () => Promise<AppInfoClientResult>;
}

export type AppInfoStatus = 'idle' | 'loading' | 'loaded' | 'failed' | 'unavailable';

export interface AppInfoState {
  readonly status: AppInfoStatus;
  readonly data: AppInfo | undefined;
  readonly failure: AppInfoFailureReason | undefined;
  readonly load: () => Promise<void>;
}

export type AppInfoStore = StoreApi<AppInfoState>;

export function createAppInfoStore(client: AppInfoClient): AppInfoStore {
  return createStore<AppInfoState>()((set, get) => ({
    status: 'idle',
    data: undefined,
    failure: undefined,
    load: async () => {
      if (get().status === 'loading') {
        return;
      }
      set({ status: 'loading', data: undefined, failure: undefined });
      const result = await client.getAppInfo();
      if (result.ok) {
        set({ status: 'loaded', data: result.data, failure: undefined });
      } else if (result.reason === 'unavailable') {
        set({ status: 'unavailable', data: undefined, failure: result.reason });
      } else {
        set({ status: 'failed', data: undefined, failure: result.reason });
      }
    },
  }));
}
