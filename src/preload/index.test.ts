import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@shared/ipc';

const exposeInMainWorld = vi.fn();
const invoke = vi.fn();

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld },
  ipcRenderer: { invoke, send: vi.fn(), on: vi.fn() },
}));

describe('preload entry', () => {
  beforeEach(() => {
    vi.resetModules();
    exposeInMainWorld.mockClear();
    invoke.mockReset();
  });

  it('exposes one key, necroamp, with the exact narrow surface', async () => {
    await import('./index');
    expect(exposeInMainWorld).toHaveBeenCalledTimes(1);
    const [key, api] = exposeInMainWorld.mock.calls[0] as [string, Record<string, unknown>];
    expect(key).toBe('necroamp');
    expect(Object.keys(api)).toEqual(['app', 'library', 'playlist']);
    expect(Object.keys(api['library'] as object)).toEqual(['openFiles', 'resolveTrack']);
    expect(Object.keys(api['playlist'] as object)).toEqual(['load', 'save']);
    expect(Object.keys(api['app'] as object)).toEqual(['getInfo']);
    expect(Object.isFrozen(api)).toBe(true);
  });

  it('does not expose ipcRenderer or its methods anywhere in the API', async () => {
    await import('./index');
    const [, api] = exposeInMainWorld.mock.calls[0] as [string, object];
    const seen = JSON.stringify(Object.getOwnPropertyNames(api));
    expect(seen).not.toMatch(/ipcRenderer|invoke|send/);
  });

  it('forwards getInfo to ipcRenderer.invoke on the app:get-info channel only', async () => {
    invoke.mockResolvedValue({
      ok: true,
      data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' },
    });
    await import('./index');
    const [, api] = exposeInMainWorld.mock.calls[0] as [
      string,
      { app: { getInfo: () => Promise<unknown> } },
    ];
    await api.app.getInfo();
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.appGetInfo);
  });
});

describe('preload entry library.openFiles', () => {
  beforeEach(() => {
    vi.resetModules();
    exposeInMainWorld.mockClear();
    invoke.mockReset();
  });

  it('forwards the validated request as an invoke argument on library:open-files', async () => {
    invoke.mockResolvedValue({ ok: true, data: { tracks: [] } });
    await import('./index');
    const [, api] = exposeInMainWorld.mock.calls[0] as [
      string,
      { library: { openFiles: (r: unknown) => Promise<unknown> } },
    ];
    await api.library.openFiles({ multiple: true });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.libraryOpenFiles, { multiple: true });
  });
});
