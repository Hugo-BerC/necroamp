import {
  IPC_CHANNELS,
  IPC_EVENT_CHANNELS,
  appInfoRequestSchema,
  appInfoResponseSchema,
  createIpcError,
  menuCommandSchema,
  menuReportStateRequestSchema,
  menuReportStateResponseSchema,
  openFilesRequestSchema,
  openFilesResponseSchema,
  openFolderRequestSchema,
  openFolderResponseSchema,
  playlistLoadRequestSchema,
  playlistLoadResponseSchema,
  playlistSaveRequestSchema,
  playlistSaveResponseSchema,
  resolveTrackRequestSchema,
  resolveTrackResponseSchema,
  skinsChangedEventSchema,
  skinsGetActiveRequestSchema,
  skinsGetActiveResponseSchema,
  skinsListRequestSchema,
  skinsListResponseSchema,
  skinsSetActiveRequestSchema,
  skinsSetActiveResponseSchema,
  windowActionRequestSchema,
  windowActionResponseSchema,
  windowGetStateRequestSchema,
  windowGetStateResponseSchema,
  windowStateChangedEventSchema,
  type IpcChannel,
  type IpcEventChannel,
} from '@shared/ipc';
import type { NecroampBridge, SkinsBridge, WindowBridge } from './bridge-types';

/**
 * The only IPC capability the bridge receives: invoke one named channel with validated arguments.
 * It is a closed function, not `ipcRenderer`, so this module cannot reach any other channel.
 */
export type InvokeChannel = (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;

/**
 * The only push capability the bridge receives: subscribe to one named main -> renderer event
 * channel. The listener gets the payload only, never the Electron event. Returns an unsubscribe.
 */
export type SubscribeChannel = (
  channel: IpcEventChannel,
  listener: (payload: unknown) => void,
) => () => void;

const NOOP_SUBSCRIBE: SubscribeChannel = () => () => undefined;

const INTERNAL_RESULT = Object.freeze({ ok: false, error: createIpcError('INTERNAL') });
const INVALID_PAYLOAD_RESULT = Object.freeze({
  ok: false,
  error: createIpcError('INVALID_PAYLOAD'),
});

/**
 * Builds the frozen renderer-facing API (`window.necroamp`).
 * Requests are validated before invoke and responses after. Failures resolve to the shared
 * `{ ok: false, error }` shape with fixed messages. Nothing here rejects with raw error text.
 */
export function createNecroampApi(
  invoke: InvokeChannel,
  subscribe: SubscribeChannel = NOOP_SUBSCRIBE,
): NecroampBridge {
  const invalidPayload = (): unknown => ({
    ...INVALID_PAYLOAD_RESULT,
    error: { ...INVALID_PAYLOAD_RESULT.error },
  });

  const call = async (
    channel: IpcChannel,
    args: unknown[],
    schema: { safeParse(value: unknown): { success: true; data: unknown } | { success: false } },
  ): Promise<unknown> => {
    let raw: unknown;
    try {
      raw = await invoke(channel, ...args);
    } catch {
      // Transport failure. The exception text is dropped on purpose (it may hold paths).
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    return parsed.data;
  };

  const getInfo = async (...args: unknown[]): Promise<unknown> => {
    if (!appInfoRequestSchema.safeParse(args).success) {
      return { ...INVALID_PAYLOAD_RESULT, error: { ...INVALID_PAYLOAD_RESULT.error } };
    }
    let raw: unknown;
    try {
      raw = await invoke(IPC_CHANNELS.appGetInfo);
    } catch {
      // Transport failure. The exception text is dropped on purpose (it may hold paths).
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    const parsed = appInfoResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    return parsed.data;
  };

  const openFiles = async (...args: unknown[]): Promise<unknown> => {
    const request = openFilesRequestSchema.safeParse(args);
    if (!request.success) {
      return { ...INVALID_PAYLOAD_RESULT, error: { ...INVALID_PAYLOAD_RESULT.error } };
    }
    let raw: unknown;
    try {
      // Re-built from the parsed value so no extra property can travel across the bridge.
      raw = await invoke(IPC_CHANNELS.libraryOpenFiles, { multiple: request.data[0].multiple });
    } catch {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    const parsed = openFilesResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
    }
    return parsed.data;
  };

  const openFolder = async (...args: unknown[]): Promise<unknown> => {
    if (!openFolderRequestSchema.safeParse(args).success) return invalidPayload();
    return call(IPC_CHANNELS.libraryOpenFolder, [], openFolderResponseSchema);
  };

  const resolveTrack = async (...args: unknown[]): Promise<unknown> => {
    const request = resolveTrackRequestSchema.safeParse(args);
    if (!request.success) return invalidPayload();
    return call(
      IPC_CHANNELS.libraryResolveTrack,
      [{ trackId: request.data[0].trackId }],
      resolveTrackResponseSchema,
    );
  };

  const playlistLoad = async (...args: unknown[]): Promise<unknown> => {
    if (!playlistLoadRequestSchema.safeParse(args).success) return invalidPayload();
    return call(IPC_CHANNELS.playlistLoad, [], playlistLoadResponseSchema);
  };

  const playlistSave = async (...args: unknown[]): Promise<unknown> => {
    const request = playlistSaveRequestSchema.safeParse(args);
    if (!request.success) return invalidPayload();
    // Re-built from the parsed value so no extra property can travel across the bridge.
    const items = request.data[0].items.map((entry) => ({ trackId: entry.trackId }));
    const selected = request.data[0].selectedTrackId;
    const payload = selected === undefined ? { items } : { items, selectedTrackId: selected };
    return call(IPC_CHANNELS.playlistSave, [payload], playlistSaveResponseSchema);
  };

  const reportPlaylistState = async (...args: unknown[]): Promise<unknown> => {
    const request = menuReportStateRequestSchema.safeParse(args);
    if (!request.success) return invalidPayload();
    // Re-built from the parsed value so no extra property can travel across the bridge.
    return call(
      IPC_CHANNELS.menuReportState,
      [{ hasTracks: request.data[0].hasTracks }],
      menuReportStateResponseSchema,
    );
  };

  const onCommand = (listener: unknown): (() => void) => {
    if (typeof listener !== 'function') return () => undefined;
    const callback = listener as (command: { command: string }) => void;
    let active = true;
    let unsubscribe: () => void;
    try {
      unsubscribe = subscribe(IPC_EVENT_CHANNELS.menuCommand, (payload) => {
        if (!active) return;
        const parsed = menuCommandSchema.safeParse(payload);
        if (!parsed.success) return;
        try {
          // A fresh object, so the renderer cannot mutate shared state.
          callback({ command: parsed.data.command });
        } catch {
          // A throwing listener must not break the bridge. Its message is dropped on purpose.
        }
      });
    } catch {
      return () => undefined;
    }
    return () => {
      if (!active) return;
      active = false;
      try {
        unsubscribe();
      } catch {
        // Already detached.
      }
    };
  };

  /** Subscribes a validated listener. Invalid payloads are dropped and listener errors are contained. */
  const subscribeValidated = <T>(
    channel: IpcEventChannel,
    schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
    listener: unknown,
  ): (() => void) => {
    if (typeof listener !== 'function') return () => undefined;
    const callback = listener as (value: T) => void;
    let active = true;
    let unsubscribe: () => void;
    try {
      unsubscribe = subscribe(channel, (payload) => {
        if (!active) return;
        const parsed = schema.safeParse(payload);
        if (!parsed.success) return;
        try {
          callback(parsed.data);
        } catch {
          // A throwing listener must not break the bridge. Its message is dropped on purpose.
        }
      });
    } catch {
      return () => undefined;
    }
    return () => {
      if (!active) return;
      active = false;
      try {
        unsubscribe();
      } catch {
        // Already detached.
      }
    };
  };
  const noArgs = async (
    channel: IpcChannel,
    requestSchema: { safeParse(value: unknown): { success: boolean } },
    responseSchema: {
      safeParse(value: unknown): { success: true; data: unknown } | { success: false };
    },
    args: unknown[],
  ): Promise<unknown> => {
    if (!requestSchema.safeParse(args).success) return invalidPayload();
    return call(channel, [], responseSchema);
  };
  const skins: SkinsBridge = Object.freeze({
    list: (...args: unknown[]) =>
      noArgs(IPC_CHANNELS.skinsList, skinsListRequestSchema, skinsListResponseSchema, args),
    getActive: (...args: unknown[]) =>
      noArgs(
        IPC_CHANNELS.skinsGetActive,
        skinsGetActiveRequestSchema,
        skinsGetActiveResponseSchema,
        args,
      ),
    setActive: async (...args: unknown[]): Promise<unknown> => {
      const request = skinsSetActiveRequestSchema.safeParse(args);
      if (!request.success) return invalidPayload();
      // Re-built from the parsed value so no extra property can travel across the bridge.
      return call(
        IPC_CHANNELS.skinsSetActive,
        [{ skinId: request.data[0].skinId }],
        skinsSetActiveResponseSchema,
      );
    },
    onChanged: (listener: unknown) =>
      subscribeValidated(IPC_EVENT_CHANNELS.skinsChanged, skinsChangedEventSchema, listener),
  } as SkinsBridge);
  const windowBridge: WindowBridge = Object.freeze({
    minimize: (...args: unknown[]) =>
      noArgs(
        IPC_CHANNELS.windowMinimize,
        windowActionRequestSchema,
        windowActionResponseSchema,
        args,
      ),
    toggleMaximize: (...args: unknown[]) =>
      noArgs(
        IPC_CHANNELS.windowToggleMaximize,
        windowActionRequestSchema,
        windowActionResponseSchema,
        args,
      ),
    close: (...args: unknown[]) =>
      noArgs(IPC_CHANNELS.windowClose, windowActionRequestSchema, windowActionResponseSchema, args),
    getState: (...args: unknown[]) =>
      noArgs(
        IPC_CHANNELS.windowGetState,
        windowGetStateRequestSchema,
        windowGetStateResponseSchema,
        args,
      ),
    onStateChanged: (listener: unknown) =>
      subscribeValidated(
        IPC_EVENT_CHANNELS.windowStateChanged,
        windowStateChangedEventSchema,
        listener,
      ),
  } as WindowBridge);
  const app = Object.freeze({ getInfo });
  const library = Object.freeze({ openFiles, openFolder, resolveTrack });
  const playlist = Object.freeze({ load: playlistLoad, save: playlistSave });
  const menu = Object.freeze({ onCommand, reportPlaylistState });
  return Object.freeze({ app, library, playlist, menu, skins, window: windowBridge });
}
