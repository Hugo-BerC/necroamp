import {
  IPC_CHANNELS,
  appInfoRequestSchema,
  appInfoResponseSchema,
  createIpcError,
  platformSchema,
  type AppInfoResponse,
} from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

/** Handler for `app:get-info`. Electron objects are injected (design section 5). */
export interface AppHandlerDeps {
  readonly ipcMain: IpcMainLike;
  readonly app: { getName(): string; getVersion(): string };
  readonly platform: string;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

export function registerAppHandlers(deps: AppHandlerDeps): () => void {
  const { ipcMain, app, platform, isTrustedSender, log } = deps;

  return registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.appGetInfo,
    requestSchema: appInfoRequestSchema,
    responseSchema: appInfoResponseSchema,
    isTrustedSender,
    log,
    handler: (): AppInfoResponse => {
      const parsedPlatform = platformSchema.safeParse(platform);
      if (!parsedPlatform.success) {
        log.error('ipc.unsupported_platform', { platform });
        return { ok: false, error: createIpcError('INTERNAL') };
      }
      return {
        ok: true,
        data: { name: app.getName(), version: app.getVersion(), platform: parsedPlatform.data },
      };
    },
  });
}
