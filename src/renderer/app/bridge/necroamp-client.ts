import type { MenuCommand } from '@shared/ipc';
import {
  appInfoResponseSchema,
  menuCommandSchema,
  menuReportStateResponseSchema,
  openFilesResponseSchema,
  openFolderResponseSchema,
  playlistLoadResponseSchema,
  playlistSaveResponseSchema,
} from '@shared/ipc';
import type { AppInfoClient, AppInfoClientResult } from '@renderer/stores/app-info-store';
import type {
  LibraryClient,
  LibraryClientResult,
  OpenFolderClientResult,
} from '@renderer/stores/player-store';
import type {
  PlaylistLoadResult,
  PlaylistPersistenceClient,
  PlaylistSaveResult,
} from '@renderer/stores/playlist-store';

/**
 * The only module that reads `window.necroamp` (R4.9). The host is a parameter so tests
 * pass a fake. The bridge value is untrusted: it is narrowed from `unknown`, and every
 * response is parsed with the shared schema before use.
 */
export interface BridgeHost {
  readonly necroamp?: unknown;
}

type GetInfo = () => Promise<unknown>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function readGetInfo(host: BridgeHost): GetInfo | undefined {
  const bridge = host.necroamp;
  if (!isRecord(bridge)) {
    return undefined;
  }
  const app = bridge['app'];
  if (!isRecord(app) || typeof app['getInfo'] !== 'function') {
    return undefined;
  }
  // Call through the namespace object so `this` is preserved. The result is parsed below.
  return () => Promise.resolve((app['getInfo'] as GetInfo)());
}

export function createNecroampClient(host: BridgeHost): AppInfoClient {
  return {
    getAppInfo: async (): Promise<AppInfoClientResult> => {
      const getInfo = readGetInfo(host);
      if (getInfo === undefined) {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        raw = await getInfo();
      } catch {
        // The error object is deliberately dropped: it may carry paths or internals.
        return { ok: false, reason: 'rejected' };
      }
      const parsed = appInfoResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      if (!parsed.data.ok) {
        return { ok: false, reason: 'ipc-error', code: parsed.data.error.code };
      }
      return { ok: true, data: parsed.data.data };
    },
  };
}

type OpenFiles = (request: { readonly multiple: boolean }) => Promise<unknown>;

function readOpenFiles(host: BridgeHost): OpenFiles | undefined {
  const bridge = host.necroamp;
  if (!isRecord(bridge)) {
    return undefined;
  }
  const library = bridge['library'];
  if (!isRecord(library) || typeof library['openFiles'] !== 'function') {
    return undefined;
  }
  return (request) => Promise.resolve((library['openFiles'] as OpenFiles)(request));
}

/** Same trust model as `createNecroampClient`: the bridge is unknown and every reply is parsed. */
export function createLibraryClient(host: BridgeHost): LibraryClient {
  return {
    openFiles: async (request): Promise<LibraryClientResult> => {
      const openFiles = readOpenFiles(host);
      if (openFiles === undefined) {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        raw = await openFiles({ multiple: request.multiple });
      } catch {
        return { ok: false, reason: 'rejected' };
      }
      const parsed = openFilesResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      if (!parsed.data.ok) {
        return { ok: false, reason: 'ipc-error' };
      }
      return { ok: true, data: parsed.data.data };
    },
    openFolder: async (): Promise<OpenFolderClientResult> => {
      const openFolder = readLibraryFunction(host, 'openFolder');
      if (openFolder === undefined) {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        raw = await openFolder();
      } catch {
        return { ok: false, reason: 'rejected' };
      }
      const parsed = openFolderResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      if (!parsed.data.ok) {
        return { ok: false, reason: 'ipc-error' };
      }
      return { ok: true, data: parsed.data.data };
    },
  };
}

function readPlaylistNamespace(host: BridgeHost): Readonly<Record<string, unknown>> | undefined {
  const bridge = host.necroamp;
  if (!isRecord(bridge)) {
    return undefined;
  }
  const playlist = bridge['playlist'];
  return isRecord(playlist) ? playlist : undefined;
}

/** Persistence adapter for the playlist. Same trust model: the bridge is unknown, replies are parsed. */
export function createPlaylistClient(host: BridgeHost): PlaylistPersistenceClient {
  return {
    load: async (): Promise<PlaylistLoadResult> => {
      const playlist = readPlaylistNamespace(host);
      if (playlist === undefined || typeof playlist['load'] !== 'function') {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        // Call through the namespace object so 	his is preserved. The result is parsed below.
        raw = await (playlist['load'] as () => Promise<unknown>)();
      } catch {
        return { ok: false, reason: 'rejected' };
      }
      const parsed = playlistLoadResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      return parsed.data.ok
        ? { ok: true, items: parsed.data.data.items }
        : { ok: false, reason: 'ipc-error' };
    },
    save: async (trackIds): Promise<PlaylistSaveResult> => {
      const playlist = readPlaylistNamespace(host);
      if (playlist === undefined || typeof playlist['save'] !== 'function') {
        return { ok: false, reason: 'unavailable' };
      }
      let raw: unknown;
      try {
        raw = await (playlist['save'] as (request: unknown) => Promise<unknown>)({
          items: trackIds.map((trackId) => ({ trackId })),
        });
      } catch {
        return { ok: false, reason: 'rejected' };
      }
      const parsed = playlistSaveResponseSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid-response' };
      }
      return parsed.data.ok ? { ok: true } : { ok: false, reason: 'ipc-error' };
    },
  };
}

function readLibraryFunction(host: BridgeHost, name: string): (() => Promise<unknown>) | undefined {
  const bridge = host.necroamp;
  if (!isRecord(bridge)) {
    return undefined;
  }
  const library = bridge['library'];
  if (!isRecord(library) || typeof library[name] !== 'function') {
    return undefined;
  }
  // Call through the namespace object so `this` is preserved. The result is parsed by the caller.
  return () => Promise.resolve((library[name] as () => unknown)());
}

/** What the app needs from the native menu bridge. Tests pass a fake. */
export interface MenuClient {
  /** Returns an unsubscribe function. Invalid payloads are dropped before the listener runs. */
  readonly onCommand: (listener: (command: MenuCommand['command']) => void) => () => void;
  /** Tells main whether the playlist has tracks. Resolves `false` on any failure. */
  readonly reportPlaylistState: (state: { readonly hasTracks: boolean }) => Promise<boolean>;
}

const NOOP = (): void => undefined;

export function createMenuClient(host: BridgeHost): MenuClient {
  const menu = (): Readonly<Record<string, unknown>> | undefined => {
    const bridge = host.necroamp;
    if (!isRecord(bridge)) {
      return undefined;
    }
    const value = bridge['menu'];
    return isRecord(value) ? value : undefined;
  };
  return {
    onCommand: (listener) => {
      const namespace = menu();
      if (namespace === undefined || typeof namespace['onCommand'] !== 'function') {
        return NOOP;
      }
      const unsubscribe = (namespace['onCommand'] as (cb: (payload: unknown) => void) => unknown)(
        (payload) => {
          const parsed = menuCommandSchema.safeParse(payload);
          if (parsed.success) {
            listener(parsed.data.command);
          }
        },
      );
      return typeof unsubscribe === 'function' ? (unsubscribe as () => void) : NOOP;
    },
    reportPlaylistState: async (state) => {
      const namespace = menu();
      if (namespace === undefined || typeof namespace['reportPlaylistState'] !== 'function') {
        return false;
      }
      try {
        const raw = await (namespace['reportPlaylistState'] as (s: unknown) => Promise<unknown>)({
          hasTracks: state.hasTracks,
        });
        const parsed = menuReportStateResponseSchema.safeParse(raw);
        return parsed.success && parsed.data.ok;
      } catch {
        return false;
      }
    },
  };
}
