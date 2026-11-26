import { describe, expect, it } from 'vitest';
import * as contract from './index';

describe('shared IPC public surface', () => {
  it('exports the contract and no generic sender or Electron names', () => {
    expect(Object.keys(contract).sort()).toEqual(
      [
        'IPC_CHANNELS',
        'IPC_ERROR_MESSAGES',
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
