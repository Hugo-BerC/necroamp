import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS, IPC_EVENT_CHANNELS } from './channels';

describe('IPC_CHANNELS', () => {
  it('defines only the known channels', () => {
    expect(IPC_CHANNELS).toEqual({
      appGetInfo: 'app:get-info',
      libraryOpenFiles: 'library:open-files',
      libraryOpenFolder: 'library:open-folder',
      libraryResolveTrack: 'library:resolve-track',
      menuReportState: 'menu:report-state',
      playlistLoad: 'playlist:load',
      playlistSave: 'playlist:save',
    });
  });

  it('keeps push channels out of the invokable set', () => {
    expect(IPC_EVENT_CHANNELS).toEqual({ menuCommand: 'menu:command' });
    for (const name of Object.values(IPC_EVENT_CHANNELS)) {
      expect(Object.values(IPC_CHANNELS)).not.toContain(name);
    }
  });

  it('uses domain:action names', () => {
    for (const name of Object.values(IPC_CHANNELS)) {
      expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});
