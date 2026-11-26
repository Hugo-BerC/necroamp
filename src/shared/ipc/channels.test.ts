import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS } from './channels';

describe('IPC_CHANNELS', () => {
  it('defines only app:get-info', () => {
    expect(IPC_CHANNELS).toEqual({ appGetInfo: 'app:get-info' });
  });

  it('uses domain:action names', () => {
    for (const name of Object.values(IPC_CHANNELS)) {
      expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
    }
  });
});
