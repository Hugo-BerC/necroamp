import { z } from 'zod';

const SEGMENT = '[a-z0-9][a-z0-9_-]{0,47}';
const PATH_RE = new RegExp(`^assets/(?:${SEGMENT}/){0,3}${SEGMENT}\\.(svg|png|webp|woff2)$`);
/** Windows device names, checked on each segment stem. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;

/**
 * True only for a lower-case, relative, forward-slash path under `assets/` with one of the allowed
 * extensions. Rejects traversal, absolute, drive-letter, UNC, backslash, percent-encoded and
 * Windows-reserved forms. Pure and never throws.
 */
export function isSafeAssetPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length > 128 || !PATH_RE.test(path)) {
    return false;
  }
  return path.split('/').every((segment) => {
    const stem = segment.split('.')[0] ?? '';
    return !RESERVED.test(stem);
  });
}

export const assetPathSchema = z.string().max(128).refine(isSafeAssetPath);
