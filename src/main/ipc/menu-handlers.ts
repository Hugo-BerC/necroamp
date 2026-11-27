import {
  IPC_CHANNELS,
  menuReportStateRequestSchema,
  menuReportStateResponseSchema,
} from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface MenuHandlerDeps {
  readonly ipcMain: IpcMainLike;
  readonly setClearPlaylistEnabled: (enabled: boolean) => void;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/** Handler for `menu:report-state`: the renderer tells main whether the playlist has tracks. */
export function registerMenuHandlers(deps: MenuHandlerDeps): () => void {
  const { ipcMain, setClearPlaylistEnabled, isTrustedSender, log } = deps;
  return registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.menuReportState,
    requestSchema: menuReportStateRequestSchema,
    responseSchema: menuReportStateResponseSchema,
    isTrustedSender,
    log,
    handler: ([state]) => {
      setClearPlaylistEnabled(state.hasTracks);
      return { ok: true, data: { applied: true as const } };
    },
  });
}
