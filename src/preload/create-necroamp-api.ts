import {
  IPC_CHANNELS,
  appInfoRequestSchema,
  appInfoResponseSchema,
  createIpcError,
  type IpcChannel,
  type NecroampApi,
} from '@shared/ipc';

/**
 * The only IPC capability the bridge receives: invoke one named channel with no arguments.
 * It is a closed function, not `ipcRenderer`, so this module cannot reach any other channel.
 */
export type InvokeChannel = (channel: IpcChannel) => Promise<unknown>;

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
  const app = Object.freeze({ getInfo });
  return Object.freeze({ app });
}
