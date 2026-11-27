import { SKIN_LIMITS, type SkinIssueCode } from '@shared/skins';
import { matchesMagic, rasterDimensions, type SkinAssetType } from './asset-inspect';
import { validateSvg } from './svg-safety';

/** Injected file access. `node:fs/promises` satisfies it through a thin adapter in `index.ts`. */
export interface SkinStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  readonly size: number;
}

export interface SkinFs {
  lstat(path: string): Promise<SkinStats>;
  realpath(path: string): Promise<string>;
  readdir(path: string): Promise<string[]>;
  readFile(path: string): Promise<Uint8Array>;
}

export interface SkinPathApi {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(path: string): boolean;
  readonly sep: string;
}

export type ReadResult =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly code: SkinIssueCode };

export function maxBytesFor(type: SkinAssetType): number {
  switch (type) {
    case 'svg':
      return SKIN_LIMITS.svgBytes;
    case 'woff2':
      return SKIN_LIMITS.fontBytes;
    default:
      return SKIN_LIMITS.rasterBytes;
  }
}

/** True when `candidate` is strictly inside `root` (both already resolved with realpath). */
export function isInside(pathApi: SkinPathApi, root: string, candidate: string): boolean {
  const rel = pathApi.relative(root, candidate);
  if (rel === '' || pathApi.isAbsolute(rel)) return false;
  return rel !== '..' && !rel.startsWith(`..${pathApi.sep}`) && !rel.startsWith('../');
}

/**
 * Reads one file under a skin root. Every path segment is `lstat`ed (no symlink or junction at any
 * level), the final file must be a regular file within `maxBytes`, and its real path must stay
 * inside the real path of the root. `relPath` must already be a safe forward-slash path.
 */
export async function readConfinedFile(
  fs: SkinFs,
  pathApi: SkinPathApi,
  rootPath: string,
  rootReal: string,
  relPath: string,
  maxBytes: number,
): Promise<ReadResult> {
  const segments = relPath.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..' || s.includes('\\'))) {
    return { ok: false, code: 'FILE_ESCAPE' };
  }
  let current = rootPath;
  let stats: SkinStats | undefined;
  for (const [index, segment] of segments.entries()) {
    current = pathApi.join(current, segment);
    try {
      stats = await fs.lstat(current);
    } catch {
      return { ok: false, code: 'FILE_MISSING' };
    }
    if (stats.isSymbolicLink()) return { ok: false, code: 'FILE_SYMLINK' };
    const last = index === segments.length - 1;
    if (last ? !stats.isFile() : !stats.isDirectory()) return { ok: false, code: 'FILE_MISSING' };
  }
  if (stats === undefined) return { ok: false, code: 'FILE_MISSING' };
  if (stats.size > maxBytes) return { ok: false, code: 'FILE_TOO_LARGE' };
  let real: string;
  try {
    real = await fs.realpath(current);
  } catch {
    return { ok: false, code: 'FILE_MISSING' };
  }
  if (!isInside(pathApi, rootReal, real)) return { ok: false, code: 'FILE_ESCAPE' };
  let bytes: Uint8Array;
  try {
    bytes = await fs.readFile(real);
  } catch {
    return { ok: false, code: 'FILE_MISSING' };
  }
  if (bytes.byteLength > maxBytes) return { ok: false, code: 'FILE_TOO_LARGE' };
  return { ok: true, bytes };
}

/** Content checks for the declared type. Returns an issue code, or null when the bytes are fine. */
export function inspectAssetBytes(
  type: SkinAssetType,
  bytes: Uint8Array,
  options: { readonly preview: boolean },
): SkinIssueCode | null {
  if (type === 'svg') return validateSvg(bytes).ok ? null : 'SVG_UNSAFE';
  if (!matchesMagic(type, bytes)) return 'MAGIC_MISMATCH';
  if (type === 'woff2') return null;
  const dimensions = rasterDimensions(type, bytes);
  if (dimensions === null) return 'IMAGE_UNPARSEABLE';
  const limit = options.preview ? SKIN_LIMITS.previewMaxDimension : SKIN_LIMITS.rasterMaxDimension;
  if (dimensions.width > limit || dimensions.height > limit) return 'IMAGE_TOO_LARGE';
  return null;
}
