import { MAX_ARTWORK_BYTES, sniffImageType } from './artwork';
import type { Logger } from '../logging/logger';
import { cleanText } from './text';

export const UNKNOWN_ARTIST = 'Unknown artist';

/** Minimal structural view of `music-metadata`'s result, so tests need no real parser. */
export interface ParsedAudioMetadata {
  readonly common: {
    readonly title?: string;
    readonly artist?: string;
    readonly album?: string;
    readonly picture?: readonly { readonly data: Uint8Array }[];
  };
  readonly format: { readonly duration?: number };
}

export type ParseAudioFile = (
  filePath: string,
  options: { readonly duration: boolean; readonly skipCovers: boolean },
) => Promise<ParsedAudioMetadata>;

export interface TrackMetadata {
  /** Empty when the file has no usable title tag. The caller falls back to the file name. */
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly durationSec: number | null;
  /** Raw bytes of the first embedded picture, not yet validated. */
  readonly picture: Uint8Array | null;
  /** False when the parser rejected the file. The engine reports the playback error later. */
  readonly parsed: boolean;
}

export type MetadataReader = (filePath: string) => Promise<TrackMetadata>;

const FALLBACK: TrackMetadata = Object.freeze({
  title: '',
  artist: UNKNOWN_ARTIST,
  album: '',
  durationSec: null,
  picture: null,
  parsed: false,
});

function tag(value: unknown, max: number): string {
  return typeof value === 'string' ? cleanText(value, max) : '';
}

/**
 * Wraps a `music-metadata` style `parseFile`. It never throws and never logs a path or the
 * parser's message (they can contain user paths).
 */
export function createMetadataReader(deps: {
  readonly parseFile: ParseAudioFile;
  readonly log: Logger;
}): MetadataReader {
  const { parseFile, log } = deps;
  return async (filePath) => {
    let result: ParsedAudioMetadata;
    try {
      result = await parseFile(filePath, { duration: true, skipCovers: false });
    } catch {
      log.warn('metadata.parse_failed');
      return FALLBACK;
    }
    try {
      const duration = result.format.duration;
      const first = result.common.picture?.[0]?.data;
      // Skip oversized or non-image pictures here so a large tag is not retained.
      const picture =
        first instanceof Uint8Array &&
        first.byteLength <= MAX_ARTWORK_BYTES &&
        sniffImageType(first) !== null
          ? first
          : null;
      return {
        title: tag(result.common.title, 256),
        artist: tag(result.common.artist, 256) || UNKNOWN_ARTIST,
        album: tag(result.common.album, 256),
        durationSec:
          typeof duration === 'number' && Number.isFinite(duration) && duration >= 0
            ? duration
            : null,
        picture,
        parsed: true,
      };
    } catch {
      log.warn('metadata.parse_failed');
      return FALLBACK;
    }
  };
}
