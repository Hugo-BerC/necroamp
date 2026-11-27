export const IPC_CHANNELS = {
  appGetInfo: 'app:get-info',
  libraryOpenFiles: 'library:open-files',
  libraryResolveTrack: 'library:resolve-track',
  playlistLoad: 'playlist:load',
  playlistSave: 'playlist:save',
} as const;
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
