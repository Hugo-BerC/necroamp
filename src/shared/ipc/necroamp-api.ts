import type { ActiveSkin } from './skins';
import type { WindowState } from './window';

/**
 * Renderer-facing bridge shape implemented by the preload (`window.necroamp`).
 * Methods return `Promise<unknown>`: the renderer adapter parses with the shared
 * response schemas. No raw IPC, generic invoke, filesystem or Electron objects.
 */
export interface NecroampApi {
  readonly app: {
    readonly getInfo: () => Promise<unknown>;
  };
  readonly library: {
    readonly openFiles: (request: { readonly multiple: boolean }) => Promise<unknown>;
    readonly openFolder: () => Promise<unknown>;
    readonly resolveTrack: (request: { readonly trackId: string }) => Promise<unknown>;
  };
  readonly playlist: {
    readonly load: () => Promise<unknown>;
    readonly save: (request: {
      readonly items: readonly { readonly trackId: string }[];
    }) => Promise<unknown>;
  };
  readonly menu: {
    /**
     * Subscribes to native menu commands. Each payload is validated against `menuCommandSchema`
     * before the listener runs; invalid payloads are dropped. Returns an idempotent unsubscribe.
     */
    readonly onCommand: (
      listener: (command: {
        readonly command: 'open-files' | 'open-folder' | 'clear-playlist' | 'open-skin-picker';
      }) => void,
    ) => () => void;
    /** Reports whether the playlist has tracks. Resolves to `menuReportStateResponseSchema`. */
    readonly reportPlaylistState: (state: { readonly hasTracks: boolean }) => Promise<unknown>;
  };
  readonly skins: {
    readonly list: () => Promise<unknown>;
    readonly getActive: () => Promise<unknown>;
    readonly setActive: (request: { readonly skinId: string }) => Promise<unknown>;
    /** Payloads are validated against `skinsChangedEventSchema`; invalid ones are dropped. */
    readonly onChanged: (listener: (event: ActiveSkin) => void) => () => void;
  };
  readonly window: {
    readonly minimize: () => Promise<unknown>;
    readonly toggleMaximize: () => Promise<unknown>;
    readonly close: () => Promise<unknown>;
    readonly getState: () => Promise<unknown>;
    readonly onStateChanged: (listener: (state: WindowState) => void) => () => void;
  };
}
