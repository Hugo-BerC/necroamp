import { createReadStream, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { parseFile } from 'music-metadata';
import { IPC_EVENT_CHANNELS } from '@shared/ipc';
import { BrowserWindow, Menu, app, dialog, ipcMain, protocol, session } from 'electron';
import { APP_NAME, PRELOAD_PATH_SEGMENTS, RENDERER_ROOT_SEGMENTS } from './constants';
import { installIpcHandlers } from './ipc/install-ipc';
import {
  attachRendererCrashHandler,
  installProcessCrashHandlers,
} from './lifecycle/crash-handlers';
import { installAppMenu, type AppMenuController } from './lifecycle/app-menu';
import {
  shouldCreateWindowOnActivate,
  shouldQuitOnAllWindowsClosed,
} from './lifecycle/platform-policy';
import { acquireSingleInstance, focusOrCreateWindow } from './lifecycle/single-instance';
import { E2E_USER_DATA_ENV, resolveUserDataOverride } from './lifecycle/user-data-override';
import { createArtworkStore } from './library/artwork';
import { createMediaRegistry } from './library/media-registry';
import { createMetadataReader } from './library/metadata';
import { createPlaylistPersistence } from './library/playlist-persistence';
import { createLogger } from './logging/logger';
import type { SkinFs } from './skins/asset-files';
import { createSkinPreference } from './skins/skin-preference';
import { resolveSkinRoots } from './skins/skin-roots';
import { createSkinService, type SkinService } from './skins/skin-service';
import { createSkinTokenStore } from './skins/skin-tokens';
import { installAppProtocol } from './protocol/app-protocol';
import { installMediaProtocol } from './protocol/media-handler';
import { registerPrivilegedSchemes } from './protocol/register-schemes';
import { buildCsp } from './security/csp';
import { installDevCspHook } from './security/dev-csp';
import { resolveTrustedOrigins } from './security/trusted-origins';
import { FRAMELESS_CHROME_PROFILE } from './window/chrome-profile';
import { createMainWindow } from './window/create-main-window';
import {
  applyWindowConstraints,
  attachWindowStatePush,
  createWindowControls,
  type WindowControls,
} from './window/window-controls';
import { constraintsFromSkinWindow } from './window/window-options';
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
let appMenu: AppMenuController | null = null;
const mediaRegistry = createMediaRegistry();
const artworkStore = createArtworkStore();
const skinTokens = createSkinTokenStore();
let windowControls: WindowControls | null = null;
// Created after `ready` (it needs `app.getPath`). The window is only opened after that.
let skinService: SkinService | null = null;

function openMainWindow(): void {
  const activeSkin = skinService?.getActive().skin.manifest.window;
  const window = createMainWindow({
    BrowserWindow,
    preloadPath,
    target,
    log,
    // Frameless chrome (ADR 0009). The trusted renderer title bar draws the decoration.
    profile: FRAMELESS_CHROME_PROFILE,
    platform: process.platform,
    ...(activeSkin === undefined ? {} : { constraints: constraintsFromSkinWindow(activeSkin) }),
  });
  mainWindow = window;
  const controls = createWindowControls(window, process.platform);
  windowControls = controls;
  const detachStatePush = attachWindowStatePush(window, controls, (state) => {
    if (!window.isDestroyed())
      window.webContents.send(IPC_EVENT_CHANNELS.windowStateChanged, state);
  });
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
    if (mainWindow === window) {
      mainWindow = null;
      windowControls = null;
    }
    detachStatePush();
    mediaRegistry.clear();
    // A reopened window asks for the active skin again and receives fresh tokens.
    skinService?.clearTokens();
    appMenu?.setClearPlaylistEnabled(false);
    artworkStore.clear();
  });
}

// 3. Single instance. A second process quits before any other work (D11).
if (acquireSingleInstance(app, () => focusOrCreateWindow(mainWindow, openMainWindow))) {
  // 4. Privileged scheme registration. Must run before `ready`.
  registerPrivilegedSchemes(protocol);

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
  void app.whenReady().then(async () => {
    installPermissionHandlers(session.defaultSession);
    // Skin preference and scan run before the window exists, so the first window uses the skin's
    // size (ADR 0008). Any failure leaves Foundation active.
    const skinFs: SkinFs = {
      lstat: (p) => fs.lstat(p),
      realpath: (p) => fs.realpath(p),
      readdir: (p) => fs.readdir(p),
      readFile: (p) => fs.readFile(p),
    };
    const service = createSkinService({
      fs: skinFs,
      pathApi: path,
      roots: resolveSkinRoots({
        isPackaged: app.isPackaged,
        appPath: app.getAppPath(),
        resourcesPath: process.resourcesPath,
        join: path.join,
      }),
      preference: createSkinPreference({
        fs: {
          readFile: (p) => fs.readFile(p, 'utf8'),
          writeFile: (p, data) => fs.writeFile(p, data, 'utf8'),
          rename: (from, to) => fs.rename(from, to),
          rm: (p) => fs.rm(p, { force: true }),
        },
        filePath: path.join(app.getPath('userData'), 'skin-preference.json'),
        log,
      }),
      tokens: skinTokens,
      log,
    });
    await service.initialize();
    skinService = service;
    disposers.push(
      installAppProtocol(protocol, {
        fs,
        pathApi: path,
        rendererRoot,
        csp: buildCsp({ mode: 'production' }),
        log,
      }),
    );
    disposers.push(
      installMediaProtocol(protocol, {
        registry: mediaRegistry,
        artwork: artworkStore,
        skins: service,
        fs: {
          realpath: (p) => fs.realpath(p),
          stat: (p) => fs.stat(p),
          openRange: (p, start, end) =>
            Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream<Uint8Array>,
        },
        trusted,
        extname: path.extname,
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
        // Resolved at call time so a test can replace dialog.showOpenDialog.
        showOpenDialog: (options) =>
          mainWindow === null
            ? dialog.showOpenDialog(options as Electron.OpenDialogOptions)
            : dialog.showOpenDialog(mainWindow, options as Electron.OpenDialogOptions),
        fs,
        path,
        folder: {
          fs: {
            readdir: (p) => fs.readdir(p, { withFileTypes: true }),
            realpath: (p) => fs.realpath(p),
          },
          path,
        },
        setClearPlaylistEnabled: (enabled) => appMenu?.setClearPlaylistEnabled(enabled),
        skins: service,
        getWindowControls: () => windowControls,
        registry: mediaRegistry,
        metadata: createMetadataReader({ parseFile, log }),
        artwork: artworkStore,
        playlistPersistence: createPlaylistPersistence({
          fs: {
            readFile: (p) => fs.readFile(p, 'utf8'),
            writeFile: (p, data) => fs.writeFile(p, data, 'utf8'),
            rename: (from, to) => fs.rename(from, to),
            rm: (p) => fs.rm(p, { force: true }),
          },
          filePath: path.join(app.getPath('userData'), 'playlist.json'),
          log,
        }),
      }),
    );
    appMenu = installAppMenu(Menu, {
      platform: process.platform,
      isDevRun,
      skins: service.menuEntries(),
      activeSkinId: service.getActive().activeId,
      onSelectSkin: (skinId) => {
        // Same authority as skins:set-active. The change listener below pushes skins:changed.
        void service.setActive(skinId, 'menu');
      },
      onCommand: (command) => {
        const window = mainWindow;
        if (window === null || window.isDestroyed()) return;
        if (window.isMinimized()) window.restore();
        window.focus();
        // Payload is a command name only. The preload validates it again.
        window.webContents.send(IPC_EVENT_CHANNELS.menuCommand, { command });
      },
    });
    disposers.push(
      service.onChange(({ active, source }) => {
        appMenu?.setActiveSkin(active.activeId);
        const window = mainWindow;
        if (window === null || window.isDestroyed()) return;
        applyWindowConstraints(window, constraintsFromSkinWindow(active.skin.manifest.window));
        // A renderer-initiated change already has its answer. Only menu changes are pushed.
        if (source === 'menu') window.webContents.send(IPC_EVENT_CHANNELS.skinsChanged, active);
      }),
    );
    openMainWindow();
  });
}
