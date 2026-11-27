import { randomUUID } from 'node:crypto';

/**
 * Authorization registry (ADR 0006 item 4). Maps an opaque token to a real path that main itself
 * obtained from the open dialog (or later from main-owned persistence). Tokens are never derived
 * from renderer input, and the renderer can never ask for a path to be served.
 */
export const MAX_REGISTRY_ENTRIES = 5000;

export interface MediaRegistry {
  /** Returns a token for `filePath`, or null when the registry is full. Re-issues the same token. */
  issue(filePath: string): string | null;
  /** Returns the real path for a token, or undefined when the token was never issued. */
  resolve(token: string): string | undefined;
  clear(): void;
  readonly size: number;
}

export function createMediaRegistry(
  generateToken: () => string = randomUUID,
  limit: number = MAX_REGISTRY_ENTRIES,
): MediaRegistry {
  const pathByToken = new Map<string, string>();
  const tokenByPath = new Map<string, string>();
  return {
    issue(filePath) {
      const existing = tokenByPath.get(filePath);
      if (existing !== undefined) return existing;
      if (pathByToken.size >= limit) return null;
      const token = generateToken();
      if (pathByToken.has(token)) return null;
      pathByToken.set(token, filePath);
      tokenByPath.set(filePath, token);
      return token;
    },
    resolve(token) {
      return pathByToken.get(token);
    },
    clear() {
      pathByToken.clear();
      tokenByPath.clear();
    },
    get size() {
      return pathByToken.size;
    },
  };
}
