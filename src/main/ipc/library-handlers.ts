import {
  IPC_CHANNELS,
  MAX_TRACKS_PER_REQUEST,
  createIpcError,
  openFilesRequestSchema,
  openFilesResponseSchema,
  type OpenFilesResponse,
  type TrackInfo,
} from '@shared/ipc';
import type { ArtworkStore } from '../library/artwork';
import type { MediaRegistry } from '../library/media-registry';
import type { MetadataReader } from '../library/metadata';
import { createTrackFactory } from '../library/track-info';
import type { Logger } from '../logging/logger';
import { AUDIO_EXTENSIONS } from '../protocol/media-handler';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface OpenDialogOptions {
  readonly title: string;
  readonly properties: readonly ('openFile' | 'multiSelections')[];
  readonly filters: readonly { name: string; extensions: readonly string[] }[];
}

export interface LibraryHandlerDeps {
  readonly ipcMain: IpcMainLike;
  /** Called at invoke time so tests (and E2E) can substitute the dialog. */
  readonly showOpenDialog: (
    options: OpenDialogOptions,
  ) => Promise<{ canceled: boolean; filePaths: readonly string[] }>;
  readonly fs: { stat(path: string): Promise<{ isFile(): boolean }> };
  readonly path: { basename(path: string, suffix?: string): string; extname(path: string): string };
  readonly registry: Pick<MediaRegistry, 'issue'>;
  /** Reads tags and duration in main. Optional so authorization can be tested alone. */
  readonly metadata?: MetadataReader;
  readonly artwork?: Pick<ArtworkStore, 'put'>;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/** Handler for `library:open-files`. Paths stay in main; the renderer gets tokens only. */
export function registerLibraryHandlers(deps: LibraryHandlerDeps): () => void {
  const { ipcMain, showOpenDialog, isTrustedSender, log } = deps;
  const factory = createTrackFactory(deps);
  return registerHandler({
    ipcMain,
    channel: IPC_CHANNELS.libraryOpenFiles,
    requestSchema: openFilesRequestSchema,
    responseSchema: openFilesResponseSchema,
    isTrustedSender,
    log,
    handler: async ([request]): Promise<OpenFilesResponse> => {
      let selection: { canceled: boolean; filePaths: readonly string[] };
      try {
        selection = await showOpenDialog({
          title: 'Open audio files',
          properties: request.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
          filters: [{ name: 'Audio', extensions: [...AUDIO_EXTENSIONS] }],
        });
      } catch {
        log.error('library.dialog_failed');
        return { ok: false, error: createIpcError('INTERNAL') };
      }
      if (selection.canceled) return { ok: true, data: { tracks: [] } };
      const tracks: TrackInfo[] = [];
      for (const filePath of selection.filePaths.slice(0, MAX_TRACKS_PER_REQUEST)) {
        const track = await factory.fromPath(filePath);
        if (track === 'full') break;
        if (track !== null) tracks.push(track);
      }
      return { ok: true, data: { tracks } };
    },
  });
}
