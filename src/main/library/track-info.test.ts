import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createArtworkStore } from './artwork';
import { createMediaRegistry } from './media-registry';
import type { MetadataReader } from './metadata';
import { createTrackFactory } from './track-info';

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const file = { isFile: () => true };

function make(options: {
  stat?: (p: string) => Promise<{ isFile(): boolean }>;
  metadata?: MetadataReader;
  limit?: number;
}) {
  const registry = createMediaRegistry(undefined, options.limit);
  const artwork = createArtworkStore();
  const factory = createTrackFactory({
    fs: { stat: options.stat ?? (() => Promise.resolve(file)) },
    path,
    registry,
    metadata: options.metadata,
    artwork,
  });
  return { factory, registry, artwork };
}

describe('track factory', () => {
  it('combines tags, duration and artwork into a path-free TrackInfo', async () => {
    const metadata = vi.fn<MetadataReader>(() =>
      Promise.resolve({
        title: 'Song',
        artist: 'Band',
        album: 'Record',
        durationSec: 61.5,
        picture: PNG,
        parsed: true,
      }),
    );
    const { factory, registry, artwork } = make({ metadata });
    const track = await factory.fromPath(path.join('music', 'a.mp3'));
    expect(track).not.toBeNull();
    expect(track).not.toBe('full');
    if (track === null || track === 'full') return;
    expect(track).toMatchObject({
      title: 'Song',
      artist: 'Band',
      album: 'Record',
      durationSec: 61.5,
      fileName: 'a.mp3',
      available: true,
    });
    expect(track.mediaUrl).toBe(`media://track/${track.trackId}`);
    expect(registry.resolve(track.trackId)).toBe(path.join('music', 'a.mp3'));
    const artToken = track.artworkUrl?.replace('media://art/', '') as string;
    expect(artwork.get(artToken)?.mimeType).toBe('image/png');
    expect(JSON.stringify(track)).not.toContain('music');
  });

  it('falls back to the file name and Unknown artist for an untagged file', async () => {
    const metadata: MetadataReader = () =>
      Promise.resolve({
        title: '',
        artist: 'Unknown artist',
        album: '',
        durationSec: null,
        picture: null,
        parsed: false,
      });
    const { factory } = make({ metadata });
    expect(await factory.fromPath('/m/My Song.FLAC')).toMatchObject({
      title: 'My Song',
      artist: 'Unknown artist',
      album: '',
      durationSec: null,
      artworkUrl: null,
      available: true,
    });
  });

  it('does not attach artwork that fails validation', async () => {
    const metadata: MetadataReader = () =>
      Promise.resolve({
        title: 'T',
        artist: 'A',
        album: '',
        durationSec: 1,
        picture: Uint8Array.from([1, 2, 3]),
        parsed: true,
      });
    const { factory } = make({ metadata });
    expect(await factory.fromPath('/m/a.mp3')).toMatchObject({ artworkUrl: null });
  });

  it('skips non-audio paths, directories and missing files by default', async () => {
    const { factory, registry } = make({
      stat: (p) =>
        p.endsWith('dir.mp3')
          ? Promise.resolve({ isFile: () => false })
          : Promise.reject(new Error('ENOENT')),
    });
    expect(await factory.fromPath('/m/notes.txt')).toBeNull();
    expect(await factory.fromPath('/m/dir.mp3')).toBeNull();
    expect(await factory.fromPath('/m/gone.mp3')).toBeNull();
    expect(await factory.fromPath(42 as unknown as string)).toBeNull();
    expect(registry.size).toBe(0);
  });

  it('with allowMissing returns an unavailable track and skips metadata', async () => {
    const metadata = vi.fn<MetadataReader>();
    const { factory } = make({ stat: () => Promise.reject(new Error('ENOENT')), metadata });
    expect(await factory.fromPath('/m/gone.mp3', { allowMissing: true })).toMatchObject({
      title: 'gone',
      available: false,
      durationSec: null,
    });
    expect(metadata).not.toHaveBeenCalled();
  });

  it('reports a full registry', async () => {
    const { factory } = make({ limit: 1 });
    expect(await factory.fromPath('/m/a.mp3')).toMatchObject({ available: true });
    expect(await factory.fromPath('/m/b.mp3')).toBe('full');
  });

  it('rejects a name that is empty after cleaning', async () => {
    const { factory } = make({});
    expect(await factory.fromPath('/m/\u0001.mp3')).toBeNull();
  });
});
