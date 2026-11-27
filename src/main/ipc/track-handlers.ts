import {
  IPC_CHANNELS,
  resolveTrackRequestSchema,
  resolveTrackResponseSchema,
  type ResolveTrackResponse,
} from '@shared/ipc';
import type { MediaRegistry } from '../library/media-registry';
import type { TrackFactory } from '../library/track-info';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface TrackHandlerDeps {
  readonly ipcMain: IpcMainLike;
  readonly registry: Pick<MediaRegistry, 'resolve'>;
  readonly tracks: TrackFactory;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/**
 * `library:resolve-track`. The renderer names a token it already holds. An unknown token and a
 * file that vanished both answer `{ unavailable: true }`, so the call reveals nothing about paths.
 */
export function registerTrackHandlers(deps: TrackHandlerDeps): () => void {
  const { ipcMain, registry, tracks, isTrustedSender, log } = deps;
  return registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.libraryResolveTrack,
    requestSchema: resolveTrackRequestSchema,
    responseSchema: resolveTrackResponseSchema,
    isTrustedSender,
    log,
    handler: async ([request]): Promise<ResolveTrackResponse> => {
      const filePath = registry.resolve(request.trackId);
      if (filePath === undefined) return { ok: true, data: { unavailable: true } };
      const track = await tracks.fromPath(filePath, { allowMissing: true });
      if (track === null || track === 'full' || !track.available) {
        return { ok: true, data: { unavailable: true } };
      }
      return { ok: true, data: { track } };
    },
  });
}
