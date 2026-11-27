import { describe, expect, it } from 'vitest';
import * as contract from './index';

describe('shared IPC public surface', () => {
  it('exports the contract and no generic sender or Electron names', () => {
    expect(Object.keys(contract).sort()).toEqual(
      [
        'IPC_CHANNELS',
        'IPC_ERROR_MESSAGES',
        'MAX_TRACKS_PER_REQUEST',
        'PLAYLIST_SCHEMA_VERSION',
        'playlistEntrySchema',
        'playlistLoadRequestSchema',
        'playlistLoadResponseSchema',
        'playlistSaveRequestSchema',
        'playlistSaveResponseSchema',
        'resolveTrackRequestSchema',
        'resolveTrackResponseSchema',
        'artworkUrlSchema',
        'openFilesRequestSchema',
        'openFilesResponseSchema',
        'trackInfoSchema',
        'trackMediaUrlSchema',
        'appInfoRequestSchema',
        'appInfoResponseSchema',
        'appInfoSchema',
        'createIpcError',
        'ipcErrorCodeSchema',
        'ipcErrorSchema',
        'ipcResultSchema',
        'platformSchema',
      ].sort(),
    );
  });
});
