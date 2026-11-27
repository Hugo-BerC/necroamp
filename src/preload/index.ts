import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type IpcChannel } from '@shared/ipc';
import { createNecroampApi } from './create-necroamp-api';

// Sandboxed preload: imports only `electron` and shared code, bundled into one CJS file (E-ESM-1).
// Only channels present in IPC_CHANNELS can be invoked, and ipcRenderer itself is never exposed.
const ALLOWED_CHANNELS: ReadonlySet<string> = new Set(Object.values(IPC_CHANNELS));

const api = createNecroampApi((channel: IpcChannel, ...args: unknown[]) => {
  if (!ALLOWED_CHANNELS.has(channel)) {
    return Promise.reject(new Error('Channel not allowed'));
  }
  return ipcRenderer.invoke(channel, ...args);
});

contextBridge.exposeInMainWorld('necroamp', api);
