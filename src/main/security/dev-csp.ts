import { buildCsp } from './csp';
import { originOf, parseDevOrigin } from './trusted-origins';

/**
 * Development-only CSP delivery (design section 3.4). The dev server sends no CSP, so main adds
 * one to responses from the exact dev origin. Production never installs this hook.
 */
export type ResponseHeaders = Record<string, string[] | string>;

/** Removes every existing CSP header (any case) and sets exactly one. Returns a new object. */
export function withCspHeader(headers: ResponseHeaders, csp: string): ResponseHeaders {
  const next: ResponseHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() !== 'content-security-policy') next[name] = value;
  }
  next['Content-Security-Policy'] = [csp];
  return next;
}

export interface HeadersDetails {
  readonly url: string;
  readonly responseHeaders?: ResponseHeaders | undefined;
}

export interface WebRequestLike {
  onHeadersReceived(
    listener: (
      details: HeadersDetails,
      callback: (response: { responseHeaders?: ResponseHeaders }) => void,
    ) => void,
  ): void;
}

/** Returns false (and installs nothing) when `devOrigin` is not a valid loopback dev origin. */
export function installDevCspHook(webRequest: WebRequestLike, devOrigin: string): boolean {
  const dev = parseDevOrigin(devOrigin);
  if (dev === null) return false;
  const csp = buildCsp({ mode: 'development', devOrigin: dev.origin });
  webRequest.onHeadersReceived((details, callback) => {
    if (originOf(details.url) !== dev.origin) {
      callback(
        details.responseHeaders === undefined ? {} : { responseHeaders: details.responseHeaders },
      );
      return;
    }
    callback({ responseHeaders: withCspHeader(details.responseHeaders ?? {}, csp) });
  });
  return true;
}
