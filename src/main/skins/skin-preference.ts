import { z } from 'zod';
import { skinIdSchema } from '@shared/skins';
import type { Logger } from '../logging/logger';

/** `userData/skin-preference.json` (ADR 0008 item 7). Same atomic-write pattern as the playlist. */
export const SKIN_PREFERENCE_VERSION = 1;

export const skinPreferenceSchema = z.strictObject({
  schemaVersion: z.literal(SKIN_PREFERENCE_VERSION),
  skinId: skinIdSchema,
});

export interface SkinPreferenceFs {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  rm(path: string): Promise<void>;
}

export interface SkinPreference {
  /** The stored skin id. Missing, corrupt or unknown-version files give null. */
  load(): Promise<string | null>;
  /** Atomic replace. Returns false when the write failed. Calls are serialized. */
  save(skinId: string): Promise<boolean>;
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^[A-Z0-9_]{1,32}$/.test(code)) return code;
  }
  return 'UNKNOWN';
}

export function createSkinPreference(deps: {
  readonly fs: SkinPreferenceFs;
  readonly filePath: string;
  readonly log: Logger;
}): SkinPreference {
  const { fs, filePath, log } = deps;
  const tempPath = `${filePath}.tmp`;
  let queue: Promise<unknown> = Promise.resolve();

  const writeAtomic = async (skinId: string): Promise<boolean> => {
    const body = JSON.stringify({ schemaVersion: SKIN_PREFERENCE_VERSION, skinId });
    try {
      await fs.writeFile(tempPath, body);
      await fs.rename(tempPath, filePath);
      return true;
    } catch (error) {
      log.error('skins.preference_write_failed', { code: errorCode(error) });
      try {
        await fs.rm(tempPath);
      } catch {
        // The temporary file may not exist.
      }
      return false;
    }
  };

  return {
    async load() {
      let text: string;
      try {
        text = await fs.readFile(filePath);
      } catch (error) {
        const code = errorCode(error);
        if (code !== 'ENOENT') log.warn('skins.preference_read_failed', { code });
        return null;
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        log.warn('skins.preference_corrupt', { code: 'JSON' });
        return null;
      }
      const parsed = skinPreferenceSchema.safeParse(json);
      if (!parsed.success) {
        log.warn('skins.preference_corrupt', { code: 'SCHEMA' });
        return null;
      }
      return parsed.data.skinId;
    },
    save(skinId) {
      const run = queue.then(() => writeAtomic(skinId));
      queue = run.catch(() => undefined);
      return run;
    },
  };
}
