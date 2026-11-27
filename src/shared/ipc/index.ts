export { IPC_CHANNELS, type IpcChannel } from './channels';
export {
  IPC_ERROR_MESSAGES,
  createIpcError,
  ipcErrorCodeSchema,
  ipcErrorSchema,
  ipcResultSchema,
  type IpcError,
  type IpcErrorCode,
  type IpcResult,
} from './result';
export {
  appInfoRequestSchema,
  appInfoResponseSchema,
  appInfoSchema,
  platformSchema,
  type AppInfo,
  type AppInfoRequest,
  type AppInfoResponse,
  type Platform,
} from './app-info';
export type { NecroampApi } from './necroamp-api';
export {
  MAX_TRACKS_PER_REQUEST,
  artworkUrlSchema,
  openFilesRequestSchema,
  openFilesResponseSchema,
  trackInfoSchema,
  trackMediaUrlSchema,
  type OpenFilesRequest,
  type OpenFilesResponse,
  type TrackInfo,
} from './library';
