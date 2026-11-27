import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  type IpcChannel,
  type IpcEventChannel,
} from '@shared/ipc';
import { createNecroampApi } from './create-necroamp-api';

// Sandboxed preload: imports only `electron` and shared code, bundled into one CJS file (E-ESM-1).
// Only channels present in IPC_CHANNELS can be invoked, only channels in IPC_EVENT_CHANNELS can be
// subscribed to, and ipcRenderer itself is never exposed.
const ALLOWED_CHANNELS: ReadonlySet<string> = new Set(Object.values(IPC_CHANNELS));
const ALLOWED_EVENT_CHANNELS: ReadonlySet<string> = new Set(Object.values(IPC_EVENT_CHANNELS));

const api = createNecroampApi(
  (channel: IpcChannel, ...args: unknown[]) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error('Channel not allowed'));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  (channel: IpcEventChannel, listener: (payload: unknown) => void) => {
    if (!ALLOWED_EVENT_CHANNELS.has(channel)) return () => undefined;
    // The Electron event (and its sender) is dropped: the listener sees the payload only.
    const wrapped = (_event: IpcRendererEvent, payload: unknown): void => listener(payload);
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
);

contextBridge.exposeInMainWorld('necroamp', api);
