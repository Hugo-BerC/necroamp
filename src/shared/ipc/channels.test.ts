import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS } from './channels';

describe('IPC_CHANNELS', () => {
  it('defines only the known channels', () => {
    expect(IPC_CHANNELS).toEqual({
      appGetInfo: 'app:get-info',
      libraryOpenFiles: 'library:open-files',
    });
  });

  it('uses domain:action names', () => {
    for (const name of Object.values(IPC_CHANNELS)) {
      expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});
