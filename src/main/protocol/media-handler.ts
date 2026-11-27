import { MEDIA_SCHEME } from '../constants';
import type { Logger } from '../logging/logger';
import type { ArtworkStore } from '../library/artwork';
import type { MediaRegistry } from '../library/media-registry';
import type { ProtocolHandlerApi, SchemeRegistrar } from './app-protocol';
import { parseMediaUrl, parseRange } from './media-protocol';

/** Extension allow list for `media://track` (ADR 0006 item 5). Artwork types come from magic bytes. */
const AUDIO_TYPES: Readonly<Record<string, string>> = Object.freeze({
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
});

export const AUDIO_EXTENSIONS: readonly string[] = Object.freeze(
  Object.keys(AUDIO_TYPES).map((ext) => ext.slice(1)),
);

export function audioTypeFor(extension: string): string | undefined {
  const key = extension.toLowerCase();
  return Object.hasOwn(AUDIO_TYPES, key) ? AUDIO_TYPES[key] : undefined;
}

export const MEDIA_SCHEME_ENTRY = Object.freeze({
  scheme: MEDIA_SCHEME,
  privileges: Object.freeze({
    standard: true,
    secure: true,
    supportFetchAPI: true,
    stream: true,
    corsEnabled: true,
  }),
});

/** Never grants `bypassCSP`. Prefer `registerPrivilegedSchemes`: Electron keeps only the last call. */
export function registerMediaScheme(registrar: SchemeRegistrar): void {
  registrar.registerSchemesAsPrivileged([MEDIA_SCHEME_ENTRY]);
}

export interface MediaFs {
  realpath(path: string): Promise<string>;
  stat(path: string): Promise<{ isFile(): boolean; size: number }>;
  /** `end` is inclusive. Returns a Web stream body. */
  openRange(path: string, start: number, end: number): ReadableStream<Uint8Array>;
}

export interface MediaProtocolDeps {
  readonly registry: Pick<MediaRegistry, 'resolve'>;
  /** Serves media://art. Without it every art request is a 404. */
  readonly artwork?: Pick<ArtworkStore, 'get'>;
  readonly fs: MediaFs;
  /** Origins allowed to read responses. Echoed only when the request `Origin` matches exactly. */
  readonly trusted: readonly string[];
  readonly extname: (path: string) => string;
  readonly log: Logger;
}

export function createMediaProtocolHandler(
  deps: MediaProtocolDeps,
): (request: Request) => Promise<Response> {
  const { registry, artwork, fs, trusted, extname, log } = deps;
  const baseHeaders = (request: Request): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      Vary: 'Origin',
    };
    const origin = request.headers.get('Origin');
    if (origin !== null && trusted.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
    return headers;
  };
  const notFound = (request: Request): Response =>
    new Response(null, { status: 404, headers: baseHeaders(request) });

  return async (request) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') return notFound(request);
      const parsed = parseMediaUrl(request.url);
      if (!parsed.ok) {
        log.warn('media.rejected', { code: 'URL' });
        return notFound(request);
      }
      if (parsed.host === 'art') {
        // Separate token namespace: a track token never resolves here and the reverse (ADR 0006 item 7).
        const art = artwork?.get(parsed.token);
        if (art === undefined) {
          log.warn('media.rejected', { code: 'TOKEN' });
          return notFound(request);
        }
        const artHeaders = {
          ...baseHeaders(request),
          'Content-Type': art.mimeType,
          'Content-Length': String(art.data.byteLength),
        };
        return new Response(request.method === 'HEAD' ? null : art.data, {
          status: 200,
          headers: artHeaders,
        });
      }
      const registered = registry.resolve(parsed.token);
      if (registered === undefined) {
        log.warn('media.rejected', { code: 'TOKEN' });
        return notFound(request);
      }
      if (audioTypeFor(extname(registered)) === undefined) return notFound(request);
      const real = await fs.realpath(registered);
      const contentType = audioTypeFor(extname(real));
      if (contentType === undefined) {
        log.warn('media.rejected', { code: 'EXTENSION' });
        return notFound(request);
      }
      const stats = await fs.stat(real);
      if (!stats.isFile()) return notFound(request);
      const size = stats.size;
      const range = parseRange(request.headers.get('Range'), size);
      const headers = {
        ...baseHeaders(request),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      if (range.kind === 'unsatisfiable') {
        return new Response(null, {
          status: 416,
          headers: { ...baseHeaders(request), 'Content-Range': `bytes */${size}` },
        });
      }
      const partial = range.kind === 'partial';
      const start = partial ? range.start : 0;
      const end = partial ? range.end : size - 1;
      const length = size === 0 ? 0 : end - start + 1;
      const responseHeaders: Record<string, string> = {
        ...headers,
        'Content-Length': String(length),
      };
      if (partial) responseHeaders['Content-Range'] = `bytes ${start}-${end}/${size}`;
      const status = partial ? 206 : 200;
      if (request.method === 'HEAD' || length === 0) {
        return new Response(null, { status, headers: responseHeaders });
      }
      return new Response(fs.openRange(real, start, end), { status, headers: responseHeaders });
    } catch {
      log.warn('media.rejected', { code: 'IO' });
      return notFound(request);
    }
  };
}

/** Installs the handler and returns a disposer. Call after `ready`. */
export function installMediaProtocol(
  protocol: ProtocolHandlerApi,
  deps: MediaProtocolDeps,
): () => void {
  protocol.handle(MEDIA_SCHEME, createMediaProtocolHandler(deps));
  return () => protocol.unhandle(MEDIA_SCHEME);
}
