import type { NecroampApi } from '@shared/ipc';

// The E2E callbacks run in the renderer. This mirrors src/preload/necroamp-window.d.ts for the tests project.
declare global {
  interface Window {
    readonly necroamp: NecroampApi;
  }
}
export {};
