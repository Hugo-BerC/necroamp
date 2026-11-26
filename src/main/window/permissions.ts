/**
 * Deny-all permission policy (design section 3.3, R6.4). No permission is needed in this phase,
 * so there is no allow-list. Every request, synchronous check and device request is denied.
 * Electron 45.5.0 declares all three handler setters (T2.0).
 */
export interface SessionLike {
  setPermissionRequestHandler(
    handler: (
      webContents: unknown,
      permission: string,
      callback: (granted: boolean) => void,
    ) => void,
  ): void;
  setPermissionCheckHandler(handler: () => boolean): void;
  setDevicePermissionHandler(handler: () => boolean): void;
}

export function installPermissionHandlers(session: SessionLike): void {
  session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
  session.setDevicePermissionHandler(() => false);
}
