import type { NecroampApi } from '@shared/ipc';

declare global {
  interface Window {
    /** Injected by the sandboxed preload through contextBridge. Responses must be parsed with the shared schemas. */
    readonly necroamp: NecroampApi;
  }
}

export {};
