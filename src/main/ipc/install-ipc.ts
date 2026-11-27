import type { Logger } from '../logging/logger';
import { isTrustedSender, type SenderEventLike } from '../security/sender-validation';
import type { ArtworkStore } from '../library/artwork';
import type { MediaRegistry } from '../library/media-registry';
import type { MetadataReader } from '../library/metadata';
import type { PlaylistPersistence } from '../library/playlist-persistence';
import { createTrackFactory } from '../library/track-info';
import { registerAppHandlers } from './app-handlers';
import { registerLibraryHandlers, type LibraryHandlerDeps } from './library-handlers';
import { registerFolderHandlers, type FolderHandlerDeps } from './folder-handlers';
import { registerMenuHandlers } from './menu-handlers';
import { registerPlaylistHandlers } from './playlist-handlers';
import { registerSkinsHandlers, type SkinsHandlerDeps } from './skins-handlers';
import { registerWindowHandlers, type WindowHandlerDeps } from './window-handlers';
import { registerTrackHandlers } from './track-handlers';
import type { IpcMainLike } from './register-handler';

/**
 * Registers every IPC domain with one shared sender policy. Adding a domain means adding one
 * line here and one handler file, so no handler can bypass `registerHandler`.
 */
export interface InstallIpcDeps {
  readonly ipcMain: IpcMainLike;
  readonly app: { getName(): string; getVersion(): string };
  readonly platform: string;
  readonly trusted: readonly string[];
  readonly isRegisteredSender: (sender: unknown) => boolean;
  readonly log: Logger;
  readonly showOpenDialog: LibraryHandlerDeps['showOpenDialog'];
  readonly fs: LibraryHandlerDeps['fs'];
  readonly path: LibraryHandlerDeps['path'];
  readonly registry: MediaRegistry;
  readonly metadata?: MetadataReader;
  readonly artwork?: Pick<ArtworkStore, 'put'>;
  /** Enables library:open-folder (with playlistPersistence): directory listing capability. */
  readonly folder?: {
    readonly fs: FolderHandlerDeps['fs'];
    readonly path: FolderHandlerDeps['path'];
  };
  /** Enables or disables the native Clear Playlist item. Registers menu:report-state. */
  readonly setClearPlaylistEnabled?: (enabled: boolean) => void;
  /** When present, library:resolve-track and the playlist:* channels are registered. */
  readonly playlistPersistence?: PlaylistPersistence;
  /** When present, the skins:* channels are registered. */
  readonly skins?: SkinsHandlerDeps['skins'];
  /** When present, the window:* channels are registered. */
  readonly getWindowControls?: WindowHandlerDeps['getControls'];
}

export function installIpcHandlers(deps: InstallIpcDeps): () => void {
  const { ipcMain, app, platform, trusted, isRegisteredSender, log } = deps;
  const { showOpenDialog, fs, path, registry, metadata, artwork, playlistPersistence } = deps;
  const { setClearPlaylistEnabled } = deps;
  const senderCheck = (event: SenderEventLike): boolean =>
    isTrustedSender(event, trusted, isRegisteredSender);

  const disposers = [
    registerAppHandlers({ ipcMain, app, platform, isTrustedSender: senderCheck, log }),
    registerLibraryHandlers({
      ipcMain,
      showOpenDialog,
      fs,
      path,
      registry,
      metadata,
      artwork,
      isTrustedSender: senderCheck,
      log,
    }),
  ];
  if (playlistPersistence !== undefined) {
    const tracks = createTrackFactory({ fs, path, registry, metadata, artwork });
    disposers.push(
      registerTrackHandlers({ ipcMain, registry, tracks, isTrustedSender: senderCheck, log }),
      registerPlaylistHandlers({
        ipcMain,
        registry,
        tracks,
        persistence: playlistPersistence,
        isTrustedSender: senderCheck,
        log,
      }),
    );
  }
  if (playlistPersistence !== undefined && deps.folder !== undefined) {
    const tracks = createTrackFactory({ fs, path, registry, metadata, artwork });
    disposers.push(
      registerFolderHandlers({
        ipcMain,
        showOpenDialog,
        fs: deps.folder.fs,
        path: deps.folder.path,
        tracks,
        isTrustedSender: senderCheck,
        log,
      }),
    );
  }
  if (setClearPlaylistEnabled !== undefined) {
    disposers.push(
      registerMenuHandlers({ ipcMain, setClearPlaylistEnabled, isTrustedSender: senderCheck, log }),
    );
  }
  if (deps.skins !== undefined) {
    disposers.push(
      registerSkinsHandlers({ ipcMain, skins: deps.skins, isTrustedSender: senderCheck, log }),
    );
  }
  if (deps.getWindowControls !== undefined) {
    disposers.push(
      registerWindowHandlers({
        ipcMain,
        getControls: deps.getWindowControls,
        isTrustedSender: senderCheck,
        log,
      }),
    );
  }
  return () => {
    for (const dispose of disposers) dispose();
  };
}
