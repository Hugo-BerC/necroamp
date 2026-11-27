import {
  IPC_CHANNELS,
  createIpcError,
  windowActionRequestSchema,
  windowActionResponseSchema,
  windowGetStateRequestSchema,
  windowGetStateResponseSchema,
  type WindowState,
} from '@shared/ipc';
import type { Logger } from '../logging/logger';
import type { SenderEventLike } from '../security/sender-validation';
import { registerHandler, type IpcMainLike } from './register-handler';

export interface WindowControlsLike {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  getState(): WindowState;
}

export interface WindowHandlerDeps {
  readonly ipcMain: IpcMainLike;
  /**
   * The main window's controls, or null when there is none. The sender is already validated to be
   * that window's top frame, so the target never comes from the payload.
   */
  readonly getControls: () => WindowControlsLike | null;
  readonly isTrustedSender: (event: SenderEventLike) => boolean;
  readonly log: Logger;
}

/** `window:minimize`, `window:toggle-maximize`, `window:close` and `window:get-state`. */
export function registerWindowHandlers(deps: WindowHandlerDeps): () => void {
  const { ipcMain, getControls, isTrustedSender, log } = deps;
  const action = (
    channel:
      | typeof IPC_CHANNELS.windowMinimize
      | typeof IPC_CHANNELS.windowToggleMaximize
      | typeof IPC_CHANNELS.windowClose,
    run: (controls: WindowControlsLike) => void,
  ): (() => void) =>
    registerHandler({
      ipcMain,
      channel,
      requestSchema: windowActionRequestSchema,
      responseSchema: windowActionResponseSchema,
      isTrustedSender,
      log,
      handler: () => {
        const controls = getControls();
        if (controls === null) return { ok: false, error: createIpcError('INTERNAL') };
        run(controls);
        return { ok: true, data: { applied: true as const } };
      },
    });
  const disposers = [
    action(IPC_CHANNELS.windowMinimize, (c) => c.minimize()),
    action(IPC_CHANNELS.windowToggleMaximize, (c) => c.toggleMaximize()),
    action(IPC_CHANNELS.windowClose, (c) => c.close()),
    registerHandler({
      ipcMain,
      channel: IPC_CHANNELS.windowGetState,
      requestSchema: windowGetStateRequestSchema,
      responseSchema: windowGetStateResponseSchema,
      isTrustedSender,
      log,
      handler: () => {
        const controls = getControls();
        if (controls === null) return { ok: false, error: createIpcError('INTERNAL') };
        return { ok: true, data: controls.getState() };
      },
    }),
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
