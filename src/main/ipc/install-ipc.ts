import type { Logger } from '../logging/logger';
import { isTrustedSender, type SenderEventLike } from '../security/sender-validation';
import type { MediaRegistry } from '../library/media-registry';
import { registerAppHandlers } from './app-handlers';
import { registerLibraryHandlers, type LibraryHandlerDeps } from './library-handlers';
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
}

export function installIpcHandlers(deps: InstallIpcDeps): () => void {
  const { ipcMain, app, platform, trusted, isRegisteredSender, log } = deps;
  const { showOpenDialog, fs, path, registry } = deps;
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
      isTrustedSender: senderCheck,
      log,
    }),
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
