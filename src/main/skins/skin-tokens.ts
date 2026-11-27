import { randomUUID } from 'node:crypto';
import { SKIN_LIMITS } from '@shared/skins';

/**
 * `media://skin/<token>` token store (ADR 0008 item 3). A token is minted by main, never derived
 * from a path or an asset key, and is idempotent per skin and asset for the session. The renderer
 * can only ever present a token it was given. Capacity is bounded.
 */
export interface SkinTokenTarget {
  readonly skinId: string;
  readonly assetKey: string;
}

export interface SkinTokenStore {
  /** Returns the token for a skin asset, or null when the store is full. */
  mint(skinId: string, assetKey: string): string | null;
  resolve(token: string): SkinTokenTarget | undefined;
  clear(): void;
  readonly size: number;
}

export const MAX_SKIN_TOKENS = SKIN_LIMITS.registeredSkins * SKIN_LIMITS.assetCount;

export function createSkinTokenStore(
  generate: () => string = randomUUID,
  limit: number = MAX_SKIN_TOKENS,
): SkinTokenStore {
  const byToken = new Map<string, SkinTokenTarget>();
  const byKey = new Map<string, string>();
  return {
    mint(skinId, assetKey) {
      const key = `${skinId}\u0000${assetKey}`;
      const existing = byKey.get(key);
      if (existing !== undefined) return existing;
      if (byToken.size >= limit) return null;
      const token = generate();
      if (byToken.has(token)) return null;
      byToken.set(token, { skinId, assetKey });
      byKey.set(key, token);
      return token;
    },
    resolve(token) {
      return byToken.get(token);
    },
    clear() {
      byToken.clear();
      byKey.clear();
    },
    get size() {
      return byToken.size;
    },
  };
}
