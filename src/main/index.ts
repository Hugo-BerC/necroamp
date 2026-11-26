import { statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserWindow, Menu, app, ipcMain, protocol, session } from 'electron';
import { APP_NAME, PRELOAD_PATH_SEGMENTS, RENDERER_ROOT_SEGMENTS } from './constants';
import { installIpcHandlers } from './ipc/install-ipc';
import {
  attachRendererCrashHandler,
  installProcessCrashHandlers,
} from './lifecycle/crash-handlers';
import { installAppMenu } from './lifecycle/app-menu';
import {
  shouldCreateWindowOnActivate,
  shouldQuitOnAllWindowsClosed,
} from './lifecycle/platform-policy';
import { acquireSingleInstance, focusOrCreateWindow } from './lifecycle/single-instance';
import { E2E_USER_DATA_ENV, resolveUserDataOverride } from './lifecycle/user-data-override';
import { createLogger } from './logging/logger';
import { installAppProtocol, registerAppScheme } from './protocol/app-protocol';
import { buildCsp } from './security/csp';
import { installDevCspHook } from './security/dev-csp';
import { resolveTrustedOrigins } from './security/trusted-origins';
import { createMainWindow } from './window/create-main-window';
import { resolveLoadTarget } from './window/load-target';
import { installNavigationGuards } from './window/navigation-guards';
import { installPermissionHandlers } from './window/permissions';

/**
 * Composition root and the only file with startup side effects (design section 2). The order
 * below is fixed: some Electron calls must happen before `ready`.
 */
const log = createLogger(console);
const isDevRun = !app.isPackaged;

// 1. Application name. It also fixes the user-data directory.
app.setName(APP_NAME);

// 2. Test-only user-data override. Inert in a packaged build.
const override = resolveUserDataOverride(process.env[E2E_USER_DATA_ENV], app.isPackaged, path, {
  isDirectory: (candidate) => statSync(candidate).isDirectory(),
});
if (override.status === 'applied') {
  app.setPath('userData', override.path);
} else if (override.status === 'ignored') {
  log.warn('userdata.override_ignored', { code: override.code });
}

const target = resolveLoadTarget(process.env, app.isPackaged);
const trusted = resolveTrustedOrigins(
  target.kind === 'development'
    ? { mode: 'development', devOrigin: target.devOrigin }
    : { mode: 'production' },
);
const preloadPath = path.join(__dirname, ...PRELOAD_PATH_SEGMENTS);
const rendererRoot = path.join(app.getAppPath(), ...RENDERER_ROOT_SEGMENTS);

let mainWindow: BrowserWindow | null = null;
const disposers: (() => void)[] = [];

function openMainWindow(): void {
  const window = createMainWindow({ BrowserWindow, preloadPath, target, log });
  mainWindow = window;
  attachRendererCrashHandler(
    {
      onRenderProcessGone: (listener) =>
        window.webContents.on('render-process-gone', (_e, d) => listener(d)),
      reload: () => window.webContents.reload(),
    },
    app,
    log,
  );
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });
}

// 3. Single instance. A second process quits before any other work (D11).
if (acquireSingleInstance(app, () => focusOrCreateWindow(mainWindow, openMainWindow))) {
  // 4. Privileged scheme registration. Must run before `ready`.
  registerAppScheme(protocol);

  // 5. Process crash handlers.
  installProcessCrashHandlers(process, app, log);

  // 6. Guards and lifecycle listeners.
  installNavigationGuards(app, trusted, log);
  app.on('window-all-closed', () => {
    if (shouldQuitOnAllWindowsClosed(process.platform)) app.quit();
  });
  app.on('activate', () => {
    if (shouldCreateWindowOnActivate(process.platform, BrowserWindow.getAllWindows().length)) {
      openMainWindow();
    }
  });
  app.on('will-quit', () => {
    for (const dispose of disposers.splice(0)) dispose();
  });

  // 7. Everything that needs `ready`.
  void app.whenReady().then(() => {
    installPermissionHandlers(session.defaultSession);
    disposers.push(
      installAppProtocol(protocol, {
        fs,
        pathApi: path,
        rendererRoot,
        csp: buildCsp({ mode: 'production' }),
        log,
      }),
    );
    if (target.kind === 'development') {
      installDevCspHook(session.defaultSession.webRequest, target.devOrigin);
    }
    disposers.push(
      installIpcHandlers({
        ipcMain,
        app,
        platform: process.platform,
        trusted,
        isRegisteredSender: (sender) => mainWindow !== null && sender === mainWindow.webContents,
        log,
      }),
    );
    installAppMenu(Menu, { platform: process.platform, isDevRun });
    openMainWindow();
  });
}
