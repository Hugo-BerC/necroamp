export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
  libraryOpenFiles: 'library:open-files',
  libraryOpenFolder: 'library:open-folder',
  libraryResolveTrack: 'library:resolve-track',
  menuReportState: 'menu:report-state',
  playlistLoad: 'playlist:load',
  playlistSave: 'playlist:save',
  skinsList: 'skins:list',
  skinsGetActive: 'skins:get-active',
  skinsSetActive: 'skins:set-active',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowGetState: 'window:get-state',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Main -> renderer push channels. They are never invokable from the renderer: the preload
 * subscribes to them with a fixed listener and validates every payload.
 */
export const IPC_EVENT_CHANNELS = {
  menuCommand: 'menu:command',
  skinsChanged: 'skins:changed',
  windowStateChanged: 'window:state-changed',
} as const;

export type IpcEventChannel = (typeof IPC_EVENT_CHANNELS)[keyof typeof IPC_EVENT_CHANNELS];
