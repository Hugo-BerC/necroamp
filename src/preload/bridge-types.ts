import type { ActiveSkin, NecroampApi, WindowState } from '@shared/ipc';

/**
 * Bridge members for the Skin Engine and the frameless window chrome. They extend the shared
 * `NecroampApi` locally because `src/shared` is owned by the orchestrator. Methods resolve to
 * unknown; the renderer adapter parses with the shared response schemas.
 */
export interface SkinsBridge {
  readonly list: () => Promise<unknown>;
  readonly getActive: () => Promise<unknown>;
  readonly setActive: (request: { readonly skinId: string }) => Promise<unknown>;
  /** Payloads are validated against `skinsChangedEventSchema`. Returns an idempotent unsubscribe. */
  readonly onChanged: (listener: (event: ActiveSkin) => void) => () => void;
}

export interface WindowBridge {
  readonly minimize: () => Promise<unknown>;
  readonly toggleMaximize: () => Promise<unknown>;
  readonly close: () => Promise<unknown>;
  readonly getState: () => Promise<unknown>;
  /** Payloads are validated against `windowStateChangedEventSchema`. */
  readonly onStateChanged: (listener: (state: WindowState) => void) => () => void;
}

export type NecroampBridge = NecroampApi & {
  readonly skins: SkinsBridge;
  readonly window: WindowBridge;
};
