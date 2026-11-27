import {
  IPC_CHANNELS,
  appInfoRequestSchema,
  appInfoResponseSchema,
  createIpcError,
  openFilesRequestSchema,
  openFilesResponseSchema,
  type IpcChannel,
  type NecroampApi,
} from '@shared/ipc';

/**
 * The only IPC capability the bridge receives: invoke one named channel with validated arguments.
 * It is a closed function, not `ipcRenderer`, so this module cannot reach any other channel.
 */
export type InvokeChannel = (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;

const INTERNAL_RESULT = Object.freeze({ ok: false, error: createIpcError('INTERNAL') });
const INVALID_PAYLOAD_RESULT = Object.freeze({
  ok: false,
  error: createIpcError('INVALID_PAYLOAD'),
});

/**
 * Builds the frozen renderer-facing API (`window.necroamp`).
 * Requests are validated before invoke and responses after. Failures resolve to the shared
 * `{ ok: false, error }` shape with fixed messages. Nothing here rejects with raw error text.
 */
export function createNecroampApi(invoke: InvokeChannel): NecroampApi {
  const getInfo = async (...args: unknown[]): Promise<unknown> => {
    if (!appInfoRequestSchema.safeParse(args).success) {
      return { ...INVALID_PAYLOAD_RESULT, error: { ...INVALID_PAYLOAD_RESULT.error } };
    }
    let raw: unknown;
    try {
      raw = await invoke(IPC_CHANNELS.appGetInfo);
    } catch {
      // Transport failure. The exception text is dropped on purpose (it may hold paths).
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    const parsed = appInfoResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    return parsed.data;
  };
  const openFiles = async (...args: unknown[]): Promise<unknown> => {
    const request = openFilesRequestSchema.safeParse(args);
    if (!request.success) {
      return { ...INVALID_PAYLOAD_RESULT, error: { ...INVALID_PAYLOAD_RESULT.error } };
    }
    let raw: unknown;
    try {
      // Re-built from the parsed value so no extra property can travel across the bridge.
      raw = await invoke(IPC_CHANNELS.libraryOpenFiles, { multiple: request.data[0].multiple });
    } catch {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    const parsed = openFilesResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    return parsed.data;
  };
  const app = Object.freeze({ getInfo });
  const library = Object.freeze({ openFiles });
  return Object.freeze({ app, library });
}
