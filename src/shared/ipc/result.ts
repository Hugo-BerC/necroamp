import { z } from 'zod';

export const ipcErrorCodeSchema = z.enum(['INVALID_SENDER', 'INVALID_PAYLOAD', 'INTERNAL']);
export type IpcErrorCode = z.infer<typeof ipcErrorCodeSchema>;

export const ipcErrorSchema = z.strictObject({
  code: ipcErrorCodeSchema,
  message: z.string().max(120),
});
export type IpcError = z.infer<typeof ipcErrorSchema>;

/** Fixed, user-safe messages. Never derived from an exception, path or payload. */
export const IPC_ERROR_MESSAGES: Readonly<Record<IpcErrorCode, string>> = Object.freeze({
  INVALID_SENDER: 'The request came from an untrusted sender.',
  INVALID_PAYLOAD: 'The request payload is invalid.',
  INTERNAL: 'An internal error occurred.',
});

export function createIpcError(code: IpcErrorCode): IpcError {
  return { code, message: IPC_ERROR_MESSAGES[code] };
}

/** Builds the result union for a channel: `{ ok: true, data }` or `{ ok: false, error }`. */
export function ipcResultSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), data: dataSchema }),
    z.strictObject({ ok: z.literal(false), error: ipcErrorSchema }),
  ]);
}

export type IpcResult<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: IpcError };
