import type { Logger } from '../logging/logger';
import { isTrustedSender, type SenderEventLike } from '../security/sender-validation';
import { registerAppHandlers } from './app-handlers';
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
}

export function installIpcHandlers(deps: InstallIpcDeps): () => void {
  const { ipcMain, app, platform, trusted, isRegisteredSender, log } = deps;
  const senderCheck = (event: SenderEventLike): boolean =>
    isTrustedSender(event, trusted, isRegisteredSender);

  const disposers = [
    registerAppHandlers({ ipcMain, app, platform, isTrustedSender: senderCheck, log }),
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
