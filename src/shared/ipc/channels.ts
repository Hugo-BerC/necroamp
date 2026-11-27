export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
  libraryOpenFiles: 'library:open-files',
  libraryOpenFolder: 'library:open-folder',
  libraryResolveTrack: 'library:resolve-track',
  menuReportState: 'menu:report-state',
  playlistLoad: 'playlist:load',
  playlistSave: 'playlist:save',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Main -> renderer push channels. They are never invokable from the renderer: the preload
 * subscribes to them with a fixed listener and validates every payload.
 */
export const IPC_EVENT_CHANNELS = {
  menuCommand: 'menu:command',
} as const;

export type IpcEventChannel = (typeof IPC_EVENT_CHANNELS)[keyof typeof IPC_EVENT_CHANNELS];
