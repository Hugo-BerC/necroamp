/**
 * Pure parsing for the `media://` protocol (ADR 0006 item 5). No I/O, never throws.
 */
export type MediaHost = 'track' | 'art';

export type ParsedMediaUrl =
  { readonly ok: true; readonly host: MediaHost; readonly token: string } | { readonly ok: false };

const MEDIA_URL =
  /^media:\/\/(track|art)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/**
 * Accepts exactly `media://<track|art>/<lower-case uuid>`. Anything else (credentials, port,
 * query, fragment, extra segments, encoded separators, upper case, traversal) is rejected on the
 * raw string, before any URL normalization can hide it.
 */
export function parseMediaUrl(url: unknown): ParsedMediaUrl {
  if (typeof url !== 'string' || url.length > 128) return { ok: false };
  const match = MEDIA_URL.exec(url);
  if (match === null) return { ok: false };
  return { ok: true, host: match[1] as MediaHost, token: match[2] as string };
}

export type RangeResult =
  | { readonly kind: 'full' }
  | { readonly kind: 'partial'; readonly start: number; readonly end: number }
  | { readonly kind: 'unsatisfiable' };

const FULL: RangeResult = Object.freeze({ kind: 'full' });
const UNSATISFIABLE: RangeResult = Object.freeze({ kind: 'unsatisfiable' });
const SINGLE_RANGE = /^bytes=(\d{0,15})-(\d{0,15})$/;

/**
 * Parses one `Range` header against a known size. Absent, malformed, multi-range or `size === 0`
 * input yields the full body. Unsatisfiable single ranges yield `unsatisfiable` (416).
 * `end` is inclusive.
 */
export function parseRange(header: string | null | undefined, size: number): RangeResult {
  if (typeof header !== 'string' || !Number.isSafeInteger(size) || size <= 0) return FULL;
  const match = SINGLE_RANGE.exec(header.trim());
  if (match === null) return FULL;
  const first = match[1] as string;
  const last = match[2] as string;
  if (first === '' && last === '') return FULL;
  if (first === '') {
    const suffix = Number(last);
    if (suffix === 0) return UNSATISFIABLE;
    return { kind: 'partial', start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(first);
  if (start >= size) return UNSATISFIABLE;
  if (last === '') return { kind: 'partial', start, end: size - 1 };
  const end = Number(last);
  if (end < start) return FULL;
  return { kind: 'partial', start, end: Math.min(end, size - 1) };
}
