import type { z } from 'zod';
import { createIpcError, type IpcChannel, type IpcResult } from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';

/**
 * The only caller of `ipcMain.handle` (design section 5, R4). For each invoke it runs, in order:
 * sender check, request parse, handler, response parse. It never throws across IPC and never
 * returns or logs payload content, issue text, paths or exception messages.
 */
export interface IpcMainLike {
  handle(
    channel: string,
    listener: (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>,
  ): void;
  removeHandler(channel: string): void;
}

export interface RegisterHandlerOptions<Req extends z.ZodType, Res extends IpcResult<unknown>> {
  readonly ipcMain: IpcMainLike;
  readonly channel: IpcChannel;
  readonly requestSchema: Req;
  readonly responseSchema: z.ZodType<Res>;
  readonly handler: (request: z.output<Req>) => Res | Promise<Res>;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/** Returns a disposer that removes the handler. */
export function registerHandler<Req extends z.ZodType, Res extends IpcResult<unknown>>(
  options: RegisterHandlerOptions<Req, Res>,
): () => void {
  const { ipcMain, channel, requestSchema, responseSchema, handler, isTrustedSender, log } =
    options;

  ipcMain.handle(channel, async (event, ...args): Promise<IpcResult<unknown>> => {
    let trusted = false;
    try {
      trusted = isTrustedSender(event);
    } catch {
      trusted = false;
    }
    if (!trusted) {
      log.warn('ipc.invalid_sender', { channel });
      return { ok: false, error: createIpcError('INVALID_SENDER') };
    }

    const parsed = requestSchema.safeParse(args);
    if (!parsed.success) {
      log.warn('ipc.invalid_payload', { channel });
      return { ok: false, error: createIpcError('INVALID_PAYLOAD') };
    }

    try {
      const response = responseSchema.safeParse(await handler(parsed.data));
      if (!response.success) {
        log.error('ipc.invalid_response', { channel });
        return { ok: false, error: createIpcError('INTERNAL') };
      }
      return response.data;
    } catch {
      log.error('ipc.handler_failed', { channel });
      return { ok: false, error: createIpcError('INTERNAL') };
    }
  });

  return () => ipcMain.removeHandler(channel);
}
