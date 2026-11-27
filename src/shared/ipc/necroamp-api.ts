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
    readonly resolveTrack: (request: { readonly trackId: string }) => Promise<unknown>;
  };
  readonly playlist: {
    readonly load: () => Promise<unknown>;
    readonly save: (request: {
      readonly items: readonly { readonly trackId: string }[];
    }) => Promise<unknown>;
  };
}
