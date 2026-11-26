/**
 * Renderer-facing bridge shape implemented by the preload (`window.necroamp`).
 * Methods return `Promise<unknown>`: the renderer adapter parses with the shared
 * response schemas. No raw IPC, generic invoke, filesystem or Electron objects.
 */
export interface NecroampApi {
  readonly app: {
    readonly getInfo: () => Promise<unknown>;
  };
}
