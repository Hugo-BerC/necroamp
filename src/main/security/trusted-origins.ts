import { APP_ORIGIN } from '../constants';

/**
 * Trusted origin logic (design section 3.2). Pure: it never reads the environment.
 *
 * Origins are compared as `protocol//host` strings, not with `URL.origin`. Node's URL parser
 * reports the origin of a non-special scheme such as `app:` as the string "null".
 */
export type OriginMode =
  { readonly mode: 'production' } | { readonly mode: 'development'; readonly devOrigin: string };

export interface DevOrigin {
  /** For example `http://localhost:5173`. */
  readonly origin: string;
  /** For example `localhost:5173`. */
  readonly host: string;
}

const LOOPBACK_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1']);

/**
 * Accepts only a loopback http URL with an explicit port, no credentials, no query or fragment
 * and an empty path or `/`. Returns null for anything else (design section 3.1).
 */
export function parseDevOrigin(value: unknown): DevOrigin | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:') return null;
  if (!LOOPBACK_HOSTNAMES.has(url.hostname)) return null;
  if (url.port === '') return null;
  if (url.username !== '' || url.password !== '') return null;
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return null;
  return { origin: `${url.protocol}//${url.host}`, host: url.host };
}

export function resolveTrustedOrigins(options: OriginMode): readonly string[] {
  if (options.mode === 'production') return [APP_ORIGIN];
  const dev = parseDevOrigin(options.devOrigin);
  return dev === null ? [APP_ORIGIN] : [APP_ORIGIN, dev.origin];
}

/** Returns the `protocol//host` origin of a URL, or null when it has none or has credentials. */
export function originOf(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.host === '' || url.username !== '' || url.password !== '') return null;
  return `${url.protocol}//${url.host}`;
}

/** True only for a parseable URL whose origin is exactly one of `trusted`. */
export function isTrustedUrl(value: unknown, trusted: readonly string[]): boolean {
  const origin = originOf(value);
  return origin !== null && trusted.includes(origin);
}
