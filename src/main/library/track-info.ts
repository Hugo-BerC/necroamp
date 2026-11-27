import type { TrackInfo } from '@shared/ipc';
import { audioTypeFor } from '../protocol/media-handler';
import type { ArtworkStore } from './artwork';
import type { MediaRegistry } from './media-registry';
import type { MetadataReader } from './metadata';
import { UNKNOWN_ARTIST } from './metadata';
import { cleanText } from './text';

export interface TrackFactoryDeps {
  readonly fs: { stat(path: string): Promise<{ isFile(): boolean }> };
  readonly path: { basename(path: string, suffix?: string): string; extname(path: string): string };
  readonly registry: Pick<MediaRegistry, 'issue'>;
  /** Absent in tests that only exercise authorization. Then only file-name info is returned. */
  readonly metadata?: MetadataReader;
  readonly artwork?: Pick<ArtworkStore, 'put'>;
}

export interface TrackFactory {
  /**
   * Authorizes `filePath` for the media protocol and returns renderer-safe info. Returns null
   * for a path that is not an allowed audio file, and `'full'` when the registry is full.
   * With `allowMissing`, a file that cannot be read yields `available: false` instead of null.
   */
  fromPath(
    filePath: string,
    options?: { readonly allowMissing?: boolean },
  ): Promise<TrackInfo | 'full' | null>;
}

/** The single place that turns a main-side path into a `TrackInfo` (and issues its token). */
export function createTrackFactory(deps: TrackFactoryDeps): TrackFactory {
  const { fs, path, registry, metadata, artwork } = deps;
  return {
    async fromPath(filePath, options) {
      if (typeof filePath !== 'string') return null;
      const extension = path.extname(filePath);
      if (audioTypeFor(extension) === undefined) return null;
      let available = true;
      try {
        if (!(await fs.stat(filePath)).isFile()) available = false;
      } catch {
        available = false;
      }
      if (!available && options?.allowMissing !== true) return null;
      const fileName = cleanText(path.basename(filePath), 255);
      const baseTitle = cleanText(path.basename(filePath, extension), 256);
      if (fileName === '' || baseTitle === '') return null;
      const token = registry.issue(filePath);
      if (token === null) return 'full';
      const info = available && metadata !== undefined ? await metadata(filePath) : null;
      const artToken =
        info?.picture != null && artwork !== undefined ? artwork.put(info.picture) : null;
      return {
        trackId: token,
        mediaUrl: `media://track/${token}`,
        fileName,
        title: info !== null && info.title !== '' ? info.title : baseTitle,
        artist: info?.artist ?? UNKNOWN_ARTIST,
        album: info?.album ?? '',
        durationSec: info?.durationSec ?? null,
        artworkUrl: artToken === null ? null : `media://art/${artToken}`,
        available,
      };
    },
  };
}
