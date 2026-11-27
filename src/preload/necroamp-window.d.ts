import type { NecroampBridge } from './bridge-types';

declare global {
  interface Window {
    /** Injected by the sandboxed preload through contextBridge. Responses must be parsed with the shared schemas. */
    readonly necroamp: NecroampBridge;
  }
}

export {};
