import {
  IPC_CHANNELS,
  skinsGetActiveRequestSchema,
  skinsGetActiveResponseSchema,
  skinsListRequestSchema,
  skinsListResponseSchema,
  skinsSetActiveRequestSchema,
  skinsSetActiveResponseSchema,
} from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import type { SkinService } from '../skins/skin-service';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface SkinsHandlerDeps {
  readonly ipcMain: IpcMainLike;
  readonly skins: Pick<SkinService, 'list' | 'getActive' | 'setActive'>;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/**
 * `skins:list`, `skins:get-active` and `skins:set-active`. The renderer names a skin id, never a
 * path. Unknown, invalid and incompatible skins are refused by the service, so a renderer cannot
 * activate anything the scanner did not accept.
 */
export function registerSkinsHandlers(deps: SkinsHandlerDeps): () => void {
  const { ipcMain, skins, isTrustedSender, log } = deps;
  const disposers = [
    registerHandler({
      ipcMain,
      channel: IPC_CHANNELS.skinsList,
      requestSchema: skinsListRequestSchema,
      responseSchema: skinsListResponseSchema,
      isTrustedSender,
      log,
      handler: () => ({ ok: true, data: skins.list() }),
    }),
    registerHandler({
      ipcMain,
      channel: IPC_CHANNELS.skinsGetActive,
      requestSchema: skinsGetActiveRequestSchema,
      responseSchema: skinsGetActiveResponseSchema,
      isTrustedSender,
      log,
      handler: () => ({ ok: true, data: skins.getActive() }),
    }),
    registerHandler({
      ipcMain,
      channel: IPC_CHANNELS.skinsSetActive,
      requestSchema: skinsSetActiveRequestSchema,
      responseSchema: skinsSetActiveResponseSchema,
      isTrustedSender,
      log,
      handler: async ([request]) => ({
        ok: true,
        data: await skins.setActive(request.skinId, 'renderer'),
      }),
    }),
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
