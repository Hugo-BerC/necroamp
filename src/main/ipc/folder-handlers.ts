import {
  IPC_CHANNELS,
  MAX_TRACKS_PER_REQUEST,
  createIpcError,
  openFolderRequestSchema,
  openFolderResponseSchema,
  type OpenFolderResponse,
  type TrackInfo,
} from '@shared/ipc';
import { scanFolder, type FolderScanDeps } from '../library/folder-scan';
import type { TrackFactory } from '../library/track-info';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import type { OpenDialogOptions } from './library-handlers';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface FolderHandlerDeps {
  readonly ipcMain: IpcMainLike;
  /** Called at invoke time so tests (and E2E) can substitute the dialog. */
  readonly showOpenDialog: (
    options: OpenDialogOptions,
  ) => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
  readonly fs: FolderScanDeps['fs'];
  readonly path: FolderScanDeps['path'];
  readonly tracks: TrackFactory;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/**
 * Handler for `library:open-folder`. The directory dialog, the scan and the path-to-token step
 * all run in main. The renderer receives tokens and metadata only, never a path.
 */
export function registerFolderHandlers(deps: FolderHandlerDeps): () => void {
  const { ipcMain, showOpenDialog, fs, path, tracks: factory, isTrustedSender, log } = deps;
  return registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.libraryOpenFolder,
    requestSchema: openFolderRequestSchema,
    responseSchema: openFolderResponseSchema,
    isTrustedSender,
    log,
    handler: async (): Promise<OpenFolderResponse> => {
      let selection: { canceled: boolean; filePaths: readonly string[] };
      try {
        selection = await showOpenDialog({
          title: 'Open music folder',
          properties: ['openDirectory'],
        });
      } catch {
        log.error('library.dialog_failed');
        return { ok: false, error: createIpcError('INTERNAL') };
      }
      const folder = selection.filePaths[0];
      if (selection.canceled || folder === undefined) {
        return { ok: true, data: { tracks: [], canceled: true, truncated: false } };
      }
      let scan: Awaited<ReturnType<typeof scanFolder>>;
      try {
        scan = await scanFolder(folder, { fs, path, maxFiles: MAX_TRACKS_PER_REQUEST });
      } catch {
        log.error('library.folder_scan_failed');
        return { ok: false, error: createIpcError('INTERNAL') };
      }
      const tracks: TrackInfo[] = [];
      let truncated = scan.truncated;
      for (const filePath of scan.files) {
        const track = await factory.fromPath(filePath);
        if (track === 'full') {
          truncated = true;
          break;
        }
        if (track !== null) tracks.push(track);
      }
      return { ok: true, data: { tracks, canceled: false, truncated } };
    },
  });
}
