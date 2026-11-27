import {
  IPC_CHANNELS,
  MAX_TRACKS_PER_REQUEST,
  PLAYLIST_SCHEMA_VERSION,
  createIpcError,
  resolveSelectedTrackId,
  playlistLoadRequestSchema,
  playlistLoadResponseSchema,
  playlistSaveRequestSchema,
  playlistSaveResponseSchema,
  type PlaylistLoadResponse,
  type PlaylistSaveResponse,
  type TrackInfo,
} from '@shared/ipc';
import { isLocalAbsolutePath, type PathPlatform } from '../library/local-path';
import type { MediaRegistry } from '../library/media-registry';
import type { PlaylistPersistence } from '../library/playlist-persistence';
import type { TrackFactory } from '../library/track-info';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface PlaylistHandlerDeps {
  readonly ipcMain: IpcMainLike;
  readonly registry: Pick<MediaRegistry, 'resolve'>;
  readonly tracks: TrackFactory;
  readonly persistence: PlaylistPersistence;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
  /** Platform whose path rules apply to persisted paths. Defaults to the current platform. */
  readonly platform?: PathPlatform;
}

/**
 * `playlist:load` and `playlist:save`. Save accepts tokens only and maps them to paths in main;
 * an unknown token is dropped. Load is the only other issuer of media tokens besides the open
 * dialog: it re-authorizes persisted paths that are local absolute paths (no UNC, device or relative)
 * and still pass the audio extension and file checks. Rejected entries are dropped silently.
 */
export function registerPlaylistHandlers(deps: PlaylistHandlerDeps): () => void {
  const { ipcMain, registry, tracks, persistence, isTrustedSender, log } = deps;
  const platform = deps.platform ?? process.platform;
  const disposeLoad = registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.playlistLoad,
    requestSchema: playlistLoadRequestSchema,
    responseSchema: playlistLoadResponseSchema,
    isTrustedSender,
    log,
    handler: async (): Promise<PlaylistLoadResponse> => {
      const state = await persistence.loadState();
      const paths = state.paths;
      // A rejected selectedPath is treated as a stale selection and never issues a token.
      const selectedPath = isLocalAbsolutePath(state.selectedPath, platform)
        ? state.selectedPath
        : null;
      const items: TrackInfo[] = [];
      let savedSelection: string | null = null;
      for (const filePath of paths.slice(0, MAX_TRACKS_PER_REQUEST)) {
        const track = await tracks.fromPath(filePath, {
          allowMissing: true,
          localOnly: true,
        });
        if (track === 'full') break;
        if (track === null) continue;
        items.push(track);
        if (savedSelection === null && filePath === selectedPath) savedSelection = track.trackId;
      }
      const selectedTrackId = resolveSelectedTrackId(items, savedSelection);
      return {
        ok: true,
        data: {
          schemaVersion: PLAYLIST_SCHEMA_VERSION,
          items,
          ...(selectedTrackId === null ? {} : { selectedTrackId }),
        },
      };
    },
  });
  const disposeSave = registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.playlistSave,
    requestSchema: playlistSaveRequestSchema,
    responseSchema: playlistSaveResponseSchema,
    isTrustedSender,
    log,
    handler: async ([request]): Promise<PlaylistSaveResponse> => {
      const paths: string[] = [];
      for (const entry of request.items) {
        const filePath = registry.resolve(entry.trackId);
        if (filePath !== undefined) paths.push(filePath);
      }
      const selected = request.selectedTrackId;
      const selectedPath =
        selected === null || selected === undefined ? undefined : registry.resolve(selected);
      const saved = await persistence.save(
        paths,
        selectedPath !== undefined && paths.includes(selectedPath) ? selectedPath : null,
      );
      return saved
        ? { ok: true, data: { saved: true } }
        : { ok: false, error: createIpcError('INTERNAL') };
    },
  });
  return () => {
    disposeLoad();
    disposeSave();
  };
}
