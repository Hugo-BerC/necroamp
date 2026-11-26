import type { PlatformPath } from 'node:path';
import { APP_HOST, APP_SCHEME } from '../constants';
import { isAllowedExtension } from './mime-types';

/**
 * Pure lexical URL to path resolution for `app://renderer` (design section 4, R15.4). The
 * filesystem step (realpath confinement) lives in `app-protocol.ts`.
 */
export type AppPathRejection =
  'BAD_URL' | 'BAD_HOST' | 'FORBIDDEN_CHARS' | 'TRAVERSAL' | 'BAD_EXTENSION' | 'TOO_LONG';

export type AppPathResult =
  | { readonly ok: true; readonly relativePath: string }
  | { readonly ok: false; readonly code: AppPathRejection };

export type PathApi = Pick<PlatformPath, 'join' | 'resolve' | 'sep' | 'isAbsolute'>;

const MAX_URL_LENGTH = 2048;
const MAX_SEGMENT_LENGTH = 255;
const ENTRY_FILE = 'index.html';

// Raw (still encoded) input checks. `%2e` is any encoded dot, so encoded dot segments never pass.
const RAW_TRAVERSAL = /%2e/i;
const RAW_DOT_SEGMENT = /(?:^|\/)\.\.?(?:[/?#]|$)/;
const RAW_SEPARATOR_OR_NUL = /%2f|%5c|%00/i;
// eslint-disable-next-line no-control-regex -- the point of the check is to reject control characters.
const RAW_FORBIDDEN = /[\u0000-\u0020\u007f\\]/;
// Decoded checks. Control characters, separators, a drive or stream colon and characters that
// are reserved in Windows file names.
// eslint-disable-next-line no-control-regex -- the point of the check is to reject control characters.
const DECODED_FORBIDDEN = /[\u0000-\u001f\u007f\\/:*?"<>|]/;

// Windows device names, reserved with or without an extension. Rejected on every platform so
// behavior does not depend on the host (security review F-2).
const RESERVED_DEVICE_NAME =
  /^(?:con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3]|conin\$|conout\$)$/i;

const reject = (code: AppPathRejection): AppPathResult => ({ ok: false, code });

function decodeOnce(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function extensionOf(segment: string): string {
  const dot = segment.lastIndexOf('.');
  return dot <= 0 ? '' : segment.slice(dot);
}

function isInside(pathApi: PathApi, root: string, candidate: string): boolean {
  const caseInsensitive = pathApi.sep === '\\';
  const normalize = (value: string): string => (caseInsensitive ? value.toLowerCase() : value);
  const base = normalize(pathApi.resolve(root));
  const target = normalize(candidate);
  const prefix = base.endsWith(pathApi.sep) ? base : base + pathApi.sep;
  return target.startsWith(prefix);
}

/** True when `candidate` is strictly inside `root`. Shared with the realpath step. */
export const isPathInsideRoot = isInside;

/**
 * Never throws. On success `relativePath` is relative, built with `pathApi.join`, and resolving
 * it against `root` stays inside `root`.
 */
export function resolveAppPath(input: unknown, pathApi: PathApi, root: string): AppPathResult {
  if (typeof input !== 'string') return reject('BAD_URL');
  if (input.length > MAX_URL_LENGTH) return reject('TOO_LONG');

  // Whitespace, control characters and backslashes are never part of a valid asset URL, and the URL
  // parser would silently strip some of them before the raw checks below can see them.
  if (RAW_FORBIDDEN.test(input)) return reject('FORBIDDEN_CHARS');

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return reject('BAD_URL');
  }
  if (url.protocol !== `${APP_SCHEME}:`) return reject('BAD_URL');
  if (url.hostname !== APP_HOST) return reject('BAD_HOST');
  if (url.username !== '' || url.password !== '' || url.port !== '') return reject('BAD_HOST');

  // Raw input, before any decoding. The URL parser may collapse dot segments, so check first.
  const rawPath = input.replace(/^[^:/?#]*:\/\/[^/?#]*/, '');
  if (RAW_TRAVERSAL.test(rawPath) || RAW_DOT_SEGMENT.test(rawPath)) return reject('TRAVERSAL');
  if (RAW_SEPARATOR_OR_NUL.test(rawPath)) return reject('FORBIDDEN_CHARS');

  const decoded = decodeOnce(url.pathname);
  if (decoded === null) return reject('BAD_URL');

  const trimmed = decoded === '' || decoded === '/' ? `/${ENTRY_FILE}` : decoded;
  if (!trimmed.startsWith('/')) return reject('BAD_URL');
  const segments = trimmed.slice(1).split('/');
  if (segments.at(-1) === '') segments.pop(); // one trailing slash
  if (segments.length === 0) return reject('BAD_URL');

  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..') return reject('TRAVERSAL');
    if (segment.length > MAX_SEGMENT_LENGTH) return reject('TOO_LONG');
    if (DECODED_FORBIDDEN.test(segment)) return reject('FORBIDDEN_CHARS');
    // Dotfiles. Windows also strips trailing dots and spaces, which would alias another name.
    if (segment.startsWith('.') || segment.endsWith('.') || segment.endsWith(' ')) {
      return reject('FORBIDDEN_CHARS');
    }
    const stem = (segment.split('.')[0] ?? '').trimEnd();
    if (RESERVED_DEVICE_NAME.test(stem)) return reject('FORBIDDEN_CHARS');
  }

  const last = segments.at(-1) ?? '';
  if (!isAllowedExtension(extensionOf(last))) return reject('BAD_EXTENSION');

  const relativePath = pathApi.join(...segments);
  if (pathApi.isAbsolute(relativePath)) return reject('TRAVERSAL');
  if (!isInside(pathApi, root, pathApi.resolve(root, relativePath))) return reject('TRAVERSAL');
  return { ok: true, relativePath };
}
