import { APP_SCHEME } from '../constants';
import type { Logger } from '../logging/logger';
import { mimeTypeFor } from './mime-types';
import { isPathInsideRoot, resolveAppPath, type PathApi } from './resolve-app-path';

/**
 * `app://renderer` protocol (design section 4). Electron objects are injected so the handler is
 * unit testable. Privileges are `standard`, `secure` and `supportFetchAPI` only. `corsEnabled` is
 * a pre-approved fallback that needs runtime evidence (ADR 0003) and is deliberately not set.
 */
export const MAX_ASSET_BYTES = 5 * 1024 * 1024;

export interface SchemeRegistrar {
  registerSchemesAsPrivileged(
    schemes: {
      scheme: string;
      privileges: {
        standard: boolean;
        secure: boolean;
        supportFetchAPI: boolean;
        stream?: boolean;
        corsEnabled?: boolean;
      };
    }[],
  ): void;
}

export interface ProtocolHandlerApi {
  handle(scheme: string, handler: (request: Request) => Response | Promise<Response>): void;
  unhandle(scheme: string): void;
}

export interface AssetFs {
  realpath(path: string): Promise<string>;
  stat(path: string): Promise<{ isFile(): boolean; size: number }>;
  readFile(path: string): Promise<Uint8Array>;
}

export const APP_SCHEME_ENTRY = Object.freeze({
  scheme: APP_SCHEME,
  privileges: Object.freeze({ standard: true, secure: true, supportFetchAPI: true }),
});

/** Must run before the app `ready` event. Prefer `registerPrivilegedSchemes`: Electron keeps only the last call. */
export function registerAppScheme(registrar: SchemeRegistrar): void {
  registrar.registerSchemesAsPrivileged([APP_SCHEME_ENTRY]);
}

export interface AppProtocolDeps {
  readonly fs: AssetFs;
  readonly pathApi: PathApi;
  /** Absolute directory of the built renderer. */
  readonly rendererRoot: string;
  /** Value of the Content-Security-Policy header. Always the production policy. */
  readonly csp: string;
  readonly log: Logger;
}

function securityHeaders(csp: string): Record<string, string> {
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

export function createAppProtocolHandler(
  deps: AppProtocolDeps,
): (request: Request) => Promise<Response> {
  const { fs, pathApi, rendererRoot, csp, log } = deps;
  const base = securityHeaders(csp);
  // Resolved once. A failure leaves every request answered with 404.
  let rootReal: Promise<string | null> | undefined;
  const realRoot = (): Promise<string | null> => {
    rootReal ??= fs.realpath(rendererRoot).catch(() => null);
    return rootReal;
  };

  const notFound = (): Response => new Response(null, { status: 404, headers: base });

  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...base, Allow: 'GET, HEAD' } });
    }

    const resolved = resolveAppPath(request.url, pathApi, rendererRoot);
    if (!resolved.ok) {
      log.warn('protocol.rejected', { code: resolved.code });
      return notFound();
    }

    try {
      const root = await realRoot();
      if (root === null) return notFound();
      const real = await fs.realpath(pathApi.join(rendererRoot, resolved.relativePath));
      if (!isPathInsideRoot(pathApi, root, real)) {
        log.warn('protocol.rejected', { code: 'ESCAPE' });
        return notFound();
      }
      const stats = await fs.stat(real);
      if (!stats.isFile() || stats.size > MAX_ASSET_BYTES) return notFound();

      const extension = resolved.relativePath.slice(resolved.relativePath.lastIndexOf('.'));
      const contentType = mimeTypeFor(extension);
      if (contentType === undefined) return notFound();

      const headers = {
        ...base,
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
      };
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
      return new Response(await fs.readFile(real), { status: 200, headers });
    } catch {
      return notFound();
    }
  };
}

/** Installs the handler and returns a disposer that removes it. Call after `ready`. */
export function installAppProtocol(
  protocol: ProtocolHandlerApi,
  deps: AppProtocolDeps,
): () => void {
  protocol.handle(APP_SCHEME, createAppProtocolHandler(deps));
  return () => protocol.unhandle(APP_SCHEME);
}
