import { z } from 'zod';
import { MAX_TRACKS_PER_REQUEST, PLAYLIST_SCHEMA_VERSION } from '@shared/ipc';
import type { Logger } from '../logging/logger';

/** Persisted shape. Paths stay in main; the renderer only ever sees session tokens. */
export const persistedPlaylistSchema = z.strictObject({
  schemaVersion: z.literal(PLAYLIST_SCHEMA_VERSION),
  /** Optional, absent in older files. Path of the selected item; resolved to a token on load. */
  selectedPath: z.string().min(1).max(4096).optional(),
  items: z.array(z.strictObject({ path: z.string().min(1).max(4096) })).max(MAX_TRACKS_PER_REQUEST),
});

export interface PlaylistFs {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  rm(path: string): Promise<void>;
}

export interface PlaylistState {
  readonly paths: string[];
  readonly selectedPath: string | null;
}
export interface PlaylistPersistence {
  /** Returns the saved paths. Missing, corrupt or unknown-version files give an empty list. */
  load(): Promise<string[]>;
  /** Like load, plus the saved selection (null when absent). */
  loadState(): Promise<PlaylistState>;
  /** Atomic replace. Returns false when the write failed. Calls are serialized. */
  save(paths: readonly string[], selectedPath?: string | null): Promise<boolean>;
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^[A-Z0-9_]{1,32}$/.test(code)) return code;
  }
  return 'UNKNOWN';
}

export function createPlaylistPersistence(deps: {
  readonly fs: PlaylistFs;
  /** Absolute path of `playlist.json` inside the user-data directory. */
  readonly filePath: string;
  readonly log: Logger;
}): PlaylistPersistence {
  const { fs, filePath, log } = deps;
  const tempPath = `${filePath}.tmp`;
  let queue: Promise<unknown> = Promise.resolve();

  const writeAtomic = async (
    paths: readonly string[],
    selectedPath: string | null | undefined,
  ): Promise<boolean> => {
    const body = JSON.stringify({
      schemaVersion: PLAYLIST_SCHEMA_VERSION,
      ...(selectedPath !== null && selectedPath !== undefined ? { selectedPath } : {}),
      items: paths.map((path) => ({ path })),
    });
    try {
      await fs.writeFile(tempPath, body);
      await fs.rename(tempPath, filePath);
      return true;
    } catch (error) {
      log.error('playlist.write_failed', { code: errorCode(error) });
      try {
        await fs.rm(tempPath);
      } catch {
        // The temporary file may not exist. Nothing more to clean up.
      }
      return false;
    }
  };

  const loadState = async (): Promise<PlaylistState> => {
    const empty: PlaylistState = { paths: [], selectedPath: null };
    {
      let text: string;
      try {
        text = await fs.readFile(filePath);
      } catch (error) {
        const code = errorCode(error);
        if (code !== 'ENOENT') log.warn('playlist.read_failed', { code });
        return empty;
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        log.warn('playlist.corrupt', { code: 'JSON' });
        return empty;
      }
      const parsed = persistedPlaylistSchema.safeParse(json);
      if (!parsed.success) {
        log.warn('playlist.corrupt', { code: 'SCHEMA' });
        return empty;
      }
      return {
        paths: parsed.data.items.map((item) => item.path),
        selectedPath: parsed.data.selectedPath ?? null,
      };
    }
  };
  return {
    loadState,
    async load() {
      return (await loadState()).paths;
    },
    save(paths, selectedPath) {
      const run = queue.then(() => writeAtomic(paths, selectedPath));
      queue = run.catch(() => undefined);
      return run;
    },
  };
}
