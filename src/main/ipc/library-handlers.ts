import {
  IPC_CHANNELS,
  MAX_TRACKS_PER_REQUEST,
  createIpcError,
  openFilesRequestSchema,
  openFilesResponseSchema,
  type OpenFilesResponse,
  type TrackInfo,
} from '@shared/ipc';
import type { MediaRegistry } from '../library/media-registry';
import type { Logger } from '../logging/logger';
import { AUDIO_EXTENSIONS, audioTypeFor } from '../protocol/media-handler';
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
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

function isControl(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
}

function clean(value: string, max: number): string {
  return Array.from(value)
    .filter((char) => !isControl(char))
    .join('')
    .slice(0, max);
}

/** Handler for `library:open-files`. Paths stay in main; the renderer gets tokens only. */
export function registerLibraryHandlers(deps: LibraryHandlerDeps): () => void {
  const { ipcMain, showOpenDialog, fs, path, registry, isTrustedSender, log } = deps;
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
        if (typeof filePath !== 'string') continue;
        const extension = path.extname(filePath);
        if (audioTypeFor(extension) === undefined) continue;
        try {
          if (!(await fs.stat(filePath)).isFile()) continue;
        } catch {
          continue;
        }
        const token = registry.issue(filePath);
        if (token === null) break;
        const fileName = clean(path.basename(filePath), 255);
        const title = clean(path.basename(filePath, extension), 256);
        if (fileName === '' || title === '') continue;
        tracks.push({
          trackId: token,
          mediaUrl: `media://track/${token}`,
          fileName,
          title,
          artist: 'Unknown artist',
          album: '',
          durationSec: null,
          artworkUrl: null,
          available: true,
        });
      }
      return { ok: true, data: { tracks } };
    },
  });
}
