import { createReadStream } from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { parseFile } from 'music-metadata';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IPC_CHANNELS,
  playlistLoadResponseSchema,
  playlistSaveResponseSchema,
  resolveTrackResponseSchema,
  openFilesResponseSchema,
  type TrackInfo,
} from '@shared/ipc';
import { installIpcHandlers } from '@main/ipc/install-ipc';
import { createArtworkStore, MAX_ARTWORK_BYTES } from '@main/library/artwork';
import { createMediaRegistry } from '@main/library/media-registry';
import { createMetadataReader, UNKNOWN_ARTIST } from '@main/library/metadata';
import { createPlaylistPersistence, type PlaylistFs } from '@main/library/playlist-persistence';
import { parseMediaUrl } from '@main/protocol/media-protocol';
import { createMediaProtocolHandler, type MediaFs } from '@main/protocol/media-handler';
import type { SenderEventLike } from '@main/security/sender-validation';
import { createNecroampApi } from '../../src/preload/create-necroamp-api';
import { makeGarbage, makeTruncatedWav, makeWav } from '../fixtures/audio/generate-audio';
import {
  FIXTURE_TAGS,
  TAGGED_FIXTURE_BUILDERS,
  defaultTags,
  makeArtworkPng,
  makeTaggedMp3,
  WAV_TAGS,
} from '../fixtures/audio/generate-tagged';

// Audio Engine Block B, real filesystem and real music-metadata 13.0.1, with only Electron faked.
// Covers metadata parsing against generated tagged fixtures, artwork serving, playlist persistence
// round trip, corrupt playlist files, and IPC security of library:resolve-track and playlist:*.
const TRUSTED = 'app://renderer';
const FRAME = { url: `${TRUSTED}/index.html`, parent: null };
const SENDER = { id: 'registered', mainFrame: FRAME };
const UUID_UNISSUED = '00000000-0000-4000-8000-000000000000';
const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;

const realFs: MediaFs = {
  realpath: (p) => fsp.realpath(p),
  stat: (p) => fsp.stat(p),
  openRange: (p, start, end) =>
    Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream<Uint8Array>,
};
const playlistFs: PlaylistFs = {
  readFile: (p) => fsp.readFile(p, 'utf8'),
  writeFile: (p, data) => fsp.writeFile(p, data, 'utf8'),
  rename: (from, to) => fsp.rename(from, to),
  rm: (p) => fsp.rm(p, { force: true }),
};

let root: string;
let userData: string;
let counter = 0;
const files = new Map<string, string>();

async function put(name: string, bytes: Uint8Array): Promise<string> {
  const full = path.join(root, name);
  await fsp.writeFile(full, bytes);
  files.set(name, full);
  return full;
}

beforeAll(async () => {
  root = await fsp.mkdtemp(path.join(tmpdir(), 'necroamp-blockb-'));
  for (const [name, build] of Object.entries(TAGGED_FIXTURE_BUILDERS)) await put(name, build());
  await put('plain.wav', makeWav(1));
  await put('garbage.mp3', makeGarbage());
  await put('truncated.wav', makeTruncatedWav());
  await put('empty.flac', new Uint8Array(0));
});
afterAll(async () => {
  await fsp.rm(root, { recursive: true, force: true });
});
beforeEach(async () => {
  counter += 1;
  userData = path.join(root, `user-data-${String(counter)}`);
  await fsp.mkdir(userData);
  for (const spy of Object.values(log)) spy.mockClear();
});

interface StackOptions {
  readonly frame?: SenderEventLike['senderFrame'];
  readonly sender?: unknown;
  readonly persistenceFs?: PlaylistFs;
  readonly dialogFiles?: readonly string[];
}

/** One app session: fresh registry and artwork store, shared user-data directory. */
function stack(options: StackOptions = {}) {
  const listeners = new Map<string, Listener>();
  const registry = createMediaRegistry();
  const artwork = createArtworkStore();
  const persistence = createPlaylistPersistence({
    fs: options.persistenceFs ?? playlistFs,
    filePath: path.join(userData, 'playlist.json'),
    log,
  });
  const load = vi.spyOn(persistence, 'load');
  const save = vi.spyOn(persistence, 'save');
  let dialogFiles: readonly string[] = options.dialogFiles ?? [];
  installIpcHandlers({
    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
    app: { getName: () => 'NecroAmp', getVersion: () => '0.0.0' },
    platform: 'linux',
    trusted: [TRUSTED],
    isRegisteredSender: (s) => s === SENDER,
    log,
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: dialogFiles }),
    fs: { stat: (p) => fsp.stat(p) },
    path,
    registry,
    metadata: createMetadataReader({ parseFile, log }),
    artwork,
    playlistPersistence: persistence,
  });
  const frame = options.frame === undefined ? FRAME : options.frame;
  const sender = options.sender === undefined ? SENDER : options.sender;
  const invoke = (channel: string, ...args: unknown[]): Promise<unknown> =>
    (listeners.get(channel) as Listener)({ senderFrame: frame, sender }, ...args);
  const api = createNecroampApi((channel, ...args) => invoke(channel, ...args));
  const media = createMediaProtocolHandler({
    registry,
    artwork,
    fs: realFs,
    trusted: [TRUSTED],
    extname: path.extname,
    log,
  });
  return {
    registry,
    artwork,
    persistence,
    load,
    save,
    invoke,
    api,
    request: (url: string, init?: RequestInit) => media(new Request(url, init)),
    setDialog: (selected: readonly string[]) => {
      dialogFiles = selected;
    },
    async open(...names: string[]): Promise<TrackInfo[]> {
      dialogFiles = names.map((n) => files.get(n) as string);
      const parsed = openFilesResponseSchema.parse(
        await invoke(IPC_CHANNELS.libraryOpenFiles, { multiple: true }),
      );
      if (!parsed.ok) throw new Error('open failed');
      return parsed.data.tracks;
    },
  };
}

const playlistPath = (): string => path.join(userData, 'playlist.json');
const pngBytes = makeArtworkPng();
const bytesOf = async (response: Response): Promise<Uint8Array> =>
  new Uint8Array(await response.arrayBuffer());

describe('metadata parsing of tagged fixtures (real music-metadata)', () => {
  it.each([
    ['tagged.mp3', 1.0188, 0.06],
    ['tagged.flac', 0.557, 0.01],
    ['tagged.ogg', 0.557, 0.01],
    ['tagged.wav', 1.0, 0.01],
  ])('reads title, artist, album and duration from %s', async (name, seconds, tolerance) => {
    const [track] = await stack().open(name);
    const expected = name.endsWith('.wav') ? WAV_TAGS : FIXTURE_TAGS;
    expect(track).toMatchObject({
      title: expected.title,
      artist: expected.artist,
      album: expected.album,
      fileName: name,
      available: true,
    });
    expect(Math.abs((track?.durationSec ?? -1) - seconds)).toBeLessThanOrEqual(tolerance);
  });

  it.each(['tagged.mp3', 'tagged.flac', 'tagged.ogg'])(
    'extracts the embedded artwork of %s and serves identical bytes over media://art',
    async (name) => {
      const session = stack();
      const [track] = await session.open(name);
      expect(track?.artworkUrl).toMatch(/^media:\/\/art\/[0-9a-f-]{36}$/);
      const response = await session.request(track?.artworkUrl as string);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(Buffer.from(await bytesOf(response)).equals(Buffer.from(pngBytes))).toBe(true);
    },
  );

  it('gives a WAV without artwork a null artwork URL', async () => {
    const [track] = await stack().open('tagged.wav');
    expect(track?.artworkUrl).toBeNull();
  });

  it('stores identical artwork once and hands the same token to every track using it', async () => {
    const session = stack();
    const tracks = await session.open('tagged.mp3', 'tagged.flac', 'tagged.ogg');
    expect(new Set(tracks.map((t) => t.artworkUrl)).size).toBe(1);
    expect(session.artwork.size).toBe(1);
  });

  it('falls back to the file name and Unknown artist for an untagged file', async () => {
    const [track] = await stack().open('plain.wav');
    expect(track).toMatchObject({
      title: 'plain',
      artist: UNKNOWN_ARTIST,
      album: '',
      artworkUrl: null,
    });
  });

  it('returns every file of a multi-selection in dialog order with distinct tokens', async () => {
    const tracks = await stack().open('plain.wav', 'tagged.mp3', 'tagged.flac');
    expect(tracks.map((t) => t.fileName)).toEqual(['plain.wav', 'tagged.mp3', 'tagged.flac']);
    expect(new Set(tracks.map((t) => t.trackId)).size).toBe(3);
  });
});

describe('hostile and corrupt files', () => {
  it.each(['garbage.mp3', 'truncated.wav', 'empty.flac'])(
    'still lists %s, with no duration and no artwork, and never throws',
    async (name) => {
      const [track] = await stack().open(name);
      expect(track).toBeDefined();
      expect(track?.artworkUrl).toBeNull();
      expect(track?.artist).toBe(UNKNOWN_ARTIST);
    },
  );

  it('never writes a path or a parser message to the log', async () => {
    await stack().open('garbage.mp3', 'empty.flac', 'truncated.wav');
    const logged = JSON.stringify([
      ...log.info.mock.calls,
      ...log.warn.mock.calls,
      ...log.error.mock.calls,
    ]);
    expect(logged).not.toContain(root);
    expect(logged).not.toContain('garbage.mp3');
  });

  it('drops a picture whose bytes are not an image, even when the tag claims image/png', async () => {
    const file = await put(
      'fake-art.mp3',
      makeTaggedMp3({
        ...defaultTags(),
        picture: new TextEncoder().encode('<script>alert(1)</script>'),
      }),
    );
    const session = stack();
    session.setDialog([file]);
    const [track] = await session.open('fake-art.mp3');
    expect(track?.artworkUrl).toBeNull();
    expect(session.artwork.size).toBe(0);
  });

  it('serves a JPEG mislabelled as image/png under the type sniffed from its bytes', async () => {
    const jpeg = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff,
      0xd9,
    ]);
    await put(
      'jpeg-as-png.mp3',
      makeTaggedMp3({ ...defaultTags(), picture: jpeg, pictureMime: 'image/png' }),
    );
    const session = stack();
    const [track] = await session.open('jpeg-as-png.mp3');
    const response = await session.request(track?.artworkUrl as string);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('rejects a picture above the artwork size cap', async () => {
    const big = new Uint8Array(MAX_ARTWORK_BYTES + 1024);
    big.set(pngBytes);
    await put('huge-art.mp3', makeTaggedMp3({ ...defaultTags(), picture: big }));
    const session = stack();
    const [track] = await session.open('huge-art.mp3');
    expect(track?.artworkUrl).toBeNull();
    expect(track?.title).toBe(FIXTURE_TAGS.title);
  });

  it('strips control characters and caps tag text so TrackInfo stays schema-valid', async () => {
    const title = `A\u0000B\u001b[31m${'x'.repeat(5000)}`;
    await put('long-title.mp3', makeTaggedMp3({ ...defaultTags(), title }));
    const [track] = await stack().open('long-title.mp3');
    expect(track?.title.length).toBeLessThanOrEqual(256);
    // eslint-disable-next-line no-control-regex -- the point of the assertion
    expect(track?.title).not.toMatch(/[\u0000-\u001f\u007f]/);
    expect(track?.title.startsWith('AB[31m')).toBe(true);
  });

  it('keeps markup in a tag as inert text and never as a URL or HTML', async () => {
    await put(
      'markup.mp3',
      makeTaggedMp3({ ...defaultTags(), title: '<img src=x onerror=alert(1)>' }),
    );
    const [track] = await stack().open('markup.mp3');
    expect(track?.title).toBe('<img src=x onerror=alert(1)>');
    expect(track?.mediaUrl).toMatch(/^media:\/\/track\//);
  });
});

describe('playlist persistence round trip', () => {
  it('saves tokens as paths in main only and restores order, metadata and fresh tokens after a restart', async () => {
    const first = stack();
    const tracks = await first.open('tagged.flac', 'plain.wav', 'tagged.mp3', 'tagged.flac');
    // A duplicate path re-issues the same token: the playlist may still repeat it.
    const saved = playlistSaveResponseSchema.parse(
      await first.invoke(IPC_CHANNELS.playlistSave, {
        items: tracks.map((t) => ({ trackId: t.trackId })),
      }),
    );
    expect(saved).toEqual({ ok: true, data: { saved: true } });
    const onDisk = JSON.parse(await fsp.readFile(playlistPath(), 'utf8')) as {
      schemaVersion: number;
      items: { path: string }[];
    };
    expect(onDisk.schemaVersion).toBe(1);
    expect(onDisk.items.map((i) => path.basename(i.path))).toEqual([
      'tagged.flac',
      'plain.wav',
      'tagged.mp3',
      'tagged.flac',
    ]);
    expect(Object.keys(onDisk.items[0] as object)).toEqual(['path']);
    await expect(fsp.stat(`${playlistPath()}.tmp`)).rejects.toMatchObject({ code: 'ENOENT' });

    const second = stack(); // new process: empty registry and artwork store
    const loaded = playlistLoadResponseSchema.parse(await second.invoke(IPC_CHANNELS.playlistLoad));
    expect(loaded.ok).toBe(true);
    const items = loaded.ok ? loaded.data.items : [];
    expect(items.map((t) => t.fileName)).toEqual([
      'tagged.flac',
      'plain.wav',
      'tagged.mp3',
      'tagged.flac',
    ]);
    expect(items[0]).toMatchObject({
      title: FIXTURE_TAGS.title,
      artist: FIXTURE_TAGS.artist,
      available: true,
    });
    expect(items.every((t) => !tracks.some((old) => old.trackId === t.trackId))).toBe(true);
    expect(JSON.stringify(loaded)).not.toContain(root);
    // The restored tokens are usable and the old ones are not.
    expect((await second.request(items[0]?.mediaUrl as string)).status).toBe(200);
    expect((await second.request(tracks[0]?.mediaUrl as string)).status).toBe(404);
    expect((await second.request(items[0]?.artworkUrl as string)).status).toBe(200);
  });

  it('marks a file deleted since the save as unavailable and keeps its position', async () => {
    const copy = await put('will-vanish.wav', makeWav(1));
    const first = stack();
    const tracks = await first.open('plain.wav', 'will-vanish.wav', 'tagged.mp3');
    await first.invoke(IPC_CHANNELS.playlistSave, {
      items: tracks.map((t) => ({ trackId: t.trackId })),
    });
    await fsp.rm(copy);
    const loaded = playlistLoadResponseSchema.parse(
      await stack().invoke(IPC_CHANNELS.playlistLoad),
    );
    const items = loaded.ok ? loaded.data.items : [];
    expect(items.map((t) => [t.fileName, t.available])).toEqual([
      ['plain.wav', true],
      ['will-vanish.wav', false],
      ['tagged.mp3', true],
    ]);
    expect(items[1]?.durationSec).toBeNull();
  });

  it('an unavailable restored item cannot be played: media://track answers 404', async () => {
    const copy = await put('gone-later.wav', makeWav(1));
    const first = stack();
    const [track] = await first.open('gone-later.wav');
    await first.invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: (track as TrackInfo).trackId }],
    });
    await fsp.rm(copy);
    const second = stack();
    const loaded = playlistLoadResponseSchema.parse(await second.invoke(IPC_CHANNELS.playlistLoad));
    const item = loaded.ok ? loaded.data.items[0] : undefined;
    expect(item?.available).toBe(false);
    expect((await second.request(item?.mediaUrl as string)).status).toBe(404);
  });

  it('saves an empty playlist and loads it back empty', async () => {
    const session = stack();
    await session.invoke(IPC_CHANNELS.playlistSave, { items: [] });
    const loaded = playlistLoadResponseSchema.parse(
      await stack().invoke(IPC_CHANNELS.playlistLoad),
    );
    expect(loaded).toEqual({ ok: true, data: { schemaVersion: 1, items: [] } });
  });

  it('loads an empty playlist when nothing was ever saved, without logging a warning', async () => {
    const loaded = playlistLoadResponseSchema.parse(
      await stack().invoke(IPC_CHANNELS.playlistLoad),
    );
    expect(loaded).toEqual({ ok: true, data: { schemaVersion: 1, items: [] } });
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('serializes concurrent saves: the last call wins and the file is never torn', async () => {
    const session = stack();
    const [a, b] = await session.open('plain.wav', 'tagged.mp3');
    const calls = [
      session.invoke(IPC_CHANNELS.playlistSave, { items: [{ trackId: (a as TrackInfo).trackId }] }),
      session.invoke(IPC_CHANNELS.playlistSave, { items: [{ trackId: (b as TrackInfo).trackId }] }),
      session.invoke(IPC_CHANNELS.playlistSave, {
        items: [{ trackId: (a as TrackInfo).trackId }, { trackId: (b as TrackInfo).trackId }],
      }),
    ];
    await Promise.all(calls);
    const onDisk = JSON.parse(await fsp.readFile(playlistPath(), 'utf8')) as {
      items: { path: string }[];
    };
    expect(onDisk.items.map((i) => path.basename(i.path))).toEqual(['plain.wav', 'tagged.mp3']);
  });

  it('reports INTERNAL (and does not throw) when the write fails, leaving the previous file intact', async () => {
    const good = stack();
    const [track] = await good.open('plain.wav');
    await good.invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: (track as TrackInfo).trackId }],
    });
    const before = await fsp.readFile(playlistPath(), 'utf8');
    const failing = stack({
      persistenceFs: {
        ...playlistFs,
        rename: () => Promise.reject(Object.assign(new Error(`EPERM ${root}`), { code: 'EPERM' })),
      },
    });
    const [again] = await failing.open('tagged.mp3');
    const result = await failing.invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: (again as TrackInfo).trackId }],
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    expect(JSON.stringify(result)).not.toContain(root);
    expect(await fsp.readFile(playlistPath(), 'utf8')).toBe(before);
    await expect(fsp.stat(`${playlistPath()}.tmp`)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(JSON.stringify(log.error.mock.calls)).not.toContain(root);
  });
});

describe('corrupt or tampered playlist files', () => {
  const emptyLoad = { ok: true, data: { schemaVersion: 1, items: [] } };
  it.each([
    ['empty file', ''],
    ['truncated JSON', '{"schemaVersion":1,"items":[{"path":"/x'],
    ['binary garbage', '\u0000\u0001\u0002\ufffd\ufffd'],
    ['JSON null', 'null'],
    ['a bare array', '[]'],
    ['unknown schema version', '{"schemaVersion":2,"items":[]}'],
    ['missing version', '{"items":[]}'],
    ['unknown top-level key', '{"schemaVersion":1,"items":[],"extra":1}'],
    ['unknown item key', '{"schemaVersion":1,"items":[{"path":"/a.mp3","trackId":"x"}]}'],
    ['non-string path', '{"schemaVersion":1,"items":[{"path":42}]}'],
    ['empty path', '{"schemaVersion":1,"items":[{"path":""}]}'],
    ['items is not an array', '{"schemaVersion":1,"items":"a.mp3"}'],
    ['prototype pollution attempt', '{"schemaVersion":1,"items":[],"__proto__":{"polluted":true}}'],
  ])(
    'answers an empty playlist for %s and logs a code, never the content',
    async (_name, content) => {
      await fsp.writeFile(playlistPath(), content);
      const session = stack();
      expect(await session.invoke(IPC_CHANNELS.playlistLoad)).toEqual(emptyLoad);
      expect(session.registry.size).toBe(0);
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
      expect(JSON.stringify(log.warn.mock.calls)).not.toContain('polluted');
    },
  );

  it('answers an empty playlist when the file is a directory (read error)', async () => {
    await fsp.mkdir(playlistPath());
    expect(await stack().invoke(IPC_CHANNELS.playlistLoad)).toEqual(emptyLoad);
    expect(log.warn).toHaveBeenCalled();
  });

  it('overwrites a corrupt file on the next successful save', async () => {
    await fsp.writeFile(playlistPath(), 'not json');
    const session = stack();
    const [track] = await session.open('plain.wav');
    await session.invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: (track as TrackInfo).trackId }],
    });
    const loaded = playlistLoadResponseSchema.parse(
      await stack().invoke(IPC_CHANNELS.playlistLoad),
    );
    expect(loaded.ok && loaded.data.items.map((t) => t.fileName)).toEqual(['plain.wav']);
  });

  it('a hand-edited playlist cannot authorise a non-audio path, a traversal or a directory', async () => {
    const hostile = [
      path.join(root, 'plain.wav', '..', '..', 'secrets.txt'),
      path.join(root, 'notes.txt'),
      path.join(root, 'script.exe'),
      root, // a directory
      path.join(root, 'folder.mp3'),
    ];
    await fsp.mkdir(path.join(root, 'folder.mp3'), { recursive: true });
    await fsp.writeFile(
      playlistPath(),
      JSON.stringify({ schemaVersion: 1, items: hostile.map((p) => ({ path: p })) }),
    );
    const session = stack();
    const loaded = playlistLoadResponseSchema.parse(
      await session.invoke(IPC_CHANNELS.playlistLoad),
    );
    const items = loaded.ok ? loaded.data.items : [];
    // Only the entry with an audio extension is kept, and as unavailable because it is a directory.
    expect(items.map((t) => [t.fileName, t.available])).toEqual([['folder.mp3', false]]);
    expect((await session.request(items[0]?.mediaUrl as string)).status).toBe(404);
    await fsp.rm(path.join(root, 'folder.mp3'), { recursive: true });
  });

  it('caps a playlist file with more than 5000 entries as corrupt', async () => {
    const items = Array.from({ length: 5001 }, () => ({ path: path.join(root, 'plain.wav') }));
    await fsp.writeFile(playlistPath(), JSON.stringify({ schemaVersion: 1, items }));
    expect(await stack().invoke(IPC_CHANNELS.playlistLoad)).toEqual(emptyLoad);
  });
});

describe('IPC security of library:resolve-track and playlist:*', () => {
  const CHANNEL_CALLS: readonly [string, readonly unknown[]][] = [
    [IPC_CHANNELS.libraryResolveTrack, [{ trackId: UUID_UNISSUED }]],
    [IPC_CHANNELS.playlistLoad, []],
    [IPC_CHANNELS.playlistSave, [{ items: [] }]],
  ];

  it.each([
    ['sub-frame', { url: FRAME.url, parent: {} }, SENDER],
    ['foreign origin', { url: 'https://evil.example/', parent: null }, SENDER],
    ['file origin', { url: 'file:///index.html', parent: null }, SENDER],
    ['destroyed frame', null, SENDER],
    ['unregistered sender', FRAME, { id: 'other' }],
  ] as const)(
    'denies %s on every new channel before any work is done',
    async (_n, frame, sender) => {
      const session = stack({ frame, sender });
      for (const [channel, args] of CHANNEL_CALLS) {
        expect(await session.invoke(channel, ...args), channel).toMatchObject({
          ok: false,
          error: { code: 'INVALID_SENDER' },
        });
      }
      expect(session.load).not.toHaveBeenCalled();
      expect(session.save).not.toHaveBeenCalled();
      await expect(fsp.stat(playlistPath())).rejects.toMatchObject({ code: 'ENOENT' });
      expect(session.registry.size).toBe(0);
    },
  );

  it('checks the sender before the payload: a bad payload from a foreign origin is INVALID_SENDER', async () => {
    const session = stack({ frame: { url: 'https://evil.example/', parent: null } });
    expect(await session.invoke(IPC_CHANNELS.playlistSave, '/etc/passwd')).toMatchObject({
      error: { code: 'INVALID_SENDER' },
    });
  });

  it.each([
    ['resolve-track: a path', IPC_CHANNELS.libraryResolveTrack, ['/etc/passwd']],
    ['resolve-track: a path field', IPC_CHANNELS.libraryResolveTrack, [{ path: '/etc/passwd' }]],
    [
      'resolve-track: a non-uuid id',
      IPC_CHANNELS.libraryResolveTrack,
      [{ trackId: '../../etc/passwd' }],
    ],
    [
      'resolve-track: an extra key',
      IPC_CHANNELS.libraryResolveTrack,
      [{ trackId: UUID_UNISSUED, path: '/x.mp3' }],
    ],
    ['resolve-track: no argument', IPC_CHANNELS.libraryResolveTrack, []],
    [
      'resolve-track: extra positional',
      IPC_CHANNELS.libraryResolveTrack,
      [{ trackId: UUID_UNISSUED }, 'x'],
    ],
    ['resolve-track: array id', IPC_CHANNELS.libraryResolveTrack, [{ trackId: [UUID_UNISSUED] }]],
    ['playlist:load with an argument', IPC_CHANNELS.playlistLoad, [{ path: '/etc/passwd' }]],
    ['playlist:save with paths', IPC_CHANNELS.playlistSave, [{ items: [{ path: '/etc/passwd' }] }]],
    ['playlist:save with strings', IPC_CHANNELS.playlistSave, [{ items: ['/etc/passwd'] }]],
    [
      'playlist:save with a non-uuid id',
      IPC_CHANNELS.playlistSave,
      [{ items: [{ trackId: 'abc' }] }],
    ],
    [
      'playlist:save with an entry extra key',
      IPC_CHANNELS.playlistSave,
      [{ items: [{ trackId: UUID_UNISSUED, path: '/x.mp3' }] }],
    ],
    [
      'playlist:save with a top-level extra key',
      IPC_CHANNELS.playlistSave,
      [{ items: [], filePath: '/tmp/x' }],
    ],
    ['playlist:save with a bare array', IPC_CHANNELS.playlistSave, [[]]],
    [
      'playlist:save with 5001 entries',
      IPC_CHANNELS.playlistSave,
      [{ items: Array.from({ length: 5001 }, () => ({ trackId: UUID_UNISSUED })) }],
    ],
    ['playlist:save extra positional', IPC_CHANNELS.playlistSave, [{ items: [] }, '/tmp/x']],
    ['playlist:save null', IPC_CHANNELS.playlistSave, [null]],
  ])('rejects %s with INVALID_PAYLOAD and touches nothing', async (_name, channel, args) => {
    const session = stack();
    expect(await session.invoke(channel, ...args)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PAYLOAD' },
    });
    expect(session.load).not.toHaveBeenCalled();
    expect(session.save).not.toHaveBeenCalled();
    await expect(fsp.stat(playlistPath())).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('is not fooled by a prototype-polluted playlist:save payload', async () => {
    const session = stack();
    const payload = JSON.parse('{"items":[],"__proto__":{"path":"/etc/passwd"}}') as unknown;
    const result = await session.invoke(IPC_CHANNELS.playlistSave, payload);
    expect(result).toMatchObject({ ok: false });
    expect(session.save).not.toHaveBeenCalled();
  });

  it('drops tokens it never issued instead of persisting or revealing them', async () => {
    const session = stack();
    const [track] = await session.open('plain.wav');
    await session.invoke(IPC_CHANNELS.playlistSave, {
      items: [{ trackId: UUID_UNISSUED }, { trackId: (track as TrackInfo).trackId }],
    });
    const onDisk = JSON.parse(await fsp.readFile(playlistPath(), 'utf8')) as {
      items: { path: string }[];
    };
    expect(onDisk.items).toHaveLength(1);
    expect(path.basename(onDisk.items[0]?.path ?? '')).toBe('plain.wav');
  });

  it('answers the same way for an unissued token and a vanished file (no path or existence oracle)', async () => {
    const copy = await put('oracle.wav', makeWav(1));
    const session = stack();
    const [track] = await session.open('oracle.wav');
    await fsp.rm(copy);
    const vanished = await session.invoke(IPC_CHANNELS.libraryResolveTrack, {
      trackId: (track as TrackInfo).trackId,
    });
    const unknown = await session.invoke(IPC_CHANNELS.libraryResolveTrack, {
      trackId: UUID_UNISSUED,
    });
    expect(vanished).toEqual({ ok: true, data: { unavailable: true } });
    expect(unknown).toEqual(vanished);
  });

  it('resolve-track returns fresh metadata for a held token and never a path', async () => {
    const session = stack();
    const [track] = await session.open('tagged.flac');
    const response = resolveTrackResponseSchema.parse(
      await session.invoke(IPC_CHANNELS.libraryResolveTrack, {
        trackId: (track as TrackInfo).trackId,
      }),
    );
    expect(response).toMatchObject({
      ok: true,
      data: { track: { trackId: track?.trackId, title: FIXTURE_TAGS.title } },
    });
    expect(JSON.stringify(response)).not.toContain(root);
    expect(session.registry.size).toBe(1);
  });

  it('does not issue tokens for resolve-track on an unknown id (it cannot mint authorisation)', async () => {
    const session = stack();
    await session.invoke(IPC_CHANNELS.libraryResolveTrack, { trackId: UUID_UNISSUED });
    expect(session.registry.size).toBe(0);
  });

  it('the preload bridge exposes exactly the new methods and no path-taking variant', () => {
    const { api } = stack();
    expect(Object.keys(api.library).sort()).toEqual(['openFiles', 'openFolder', 'resolveTrack']);
    expect(Object.keys(api.playlist).sort()).toEqual(['load', 'save']);
    expect(Object.isFrozen(api.playlist)).toBe(true);
    expect(Object.isFrozen(api.library)).toBe(true);
  });

  it('no response of any new channel contains a filesystem path', async () => {
    const session = stack();
    const tracks = await session.open('tagged.mp3', 'plain.wav');
    const outputs = [
      await session.invoke(IPC_CHANNELS.playlistSave, {
        items: tracks.map((t) => ({ trackId: t.trackId })),
      }),
      await session.invoke(IPC_CHANNELS.playlistLoad),
      await session.invoke(IPC_CHANNELS.libraryResolveTrack, {
        trackId: (tracks[0] as TrackInfo).trackId,
      }),
    ];
    const text = JSON.stringify(outputs);
    expect(text).not.toContain(root);
    expect(text).not.toContain(userData);
    expect(text).not.toMatch(/[A-Za-z]:\\\\|\/tmp\/|\/home\//);
  });
});

describe('media://art access boundaries', () => {
  it('keeps token namespaces separate: a track token is not an art token and the reverse', async () => {
    const session = stack();
    const [track] = await session.open('tagged.mp3');
    const trackToken = (track as TrackInfo).trackId;
    const artToken = (track as TrackInfo).artworkUrl?.split('/').pop() as string;
    expect((await session.request(`media://art/${trackToken}`)).status).toBe(404);
    expect((await session.request(`media://track/${artToken}`)).status).toBe(404);
    expect((await session.request(`media://art/${artToken}`)).status).toBe(200);
  });

  it.each([
    'media://art/00000000-0000-4000-8000-000000000000',
    'media://art/../track/x',
    'media://art/%2e%2e%2fsecret',
    'media://art/',
    'media://art',
    'media://art/00000000-0000-4000-8000-000000000000?x=1',
    'media://art/00000000-0000-4000-8000-000000000000#frag',
    'media://other/00000000-0000-4000-8000-000000000000',
    'media://ART/00000000-0000-4000-8000-000000000000',
  ])('answers 404 for %s', async (url) => {
    expect((await stack().request(url)).status).toBe(404);
  });

  it('the URL parser rejects credentials before a request is ever built', () => {
    for (const url of [
      'media://user@art/00000000-0000-4000-8000-000000000000',
      'media://user:pw@art/00000000-0000-4000-8000-000000000000',
      'media://art:80/00000000-0000-4000-8000-000000000000',
    ]) {
      expect(parseMediaUrl(url)).toEqual({ ok: false });
    }
  });

  it('serves only GET and HEAD, and no body on HEAD', async () => {
    const session = stack();
    const [track] = await session.open('tagged.mp3');
    const url = track?.artworkUrl as string;
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      expect((await session.request(url, { method })).status, method).toBe(404);
    }
    const head = await session.request(url, { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(head.headers.get('Content-Length')).toBe(String(pngBytes.length));
  });

  it('allows cross-origin reads only for the trusted origin', async () => {
    const session = stack();
    const [track] = await session.open('tagged.mp3');
    const url = track?.artworkUrl as string;
    const trusted = await session.request(url, { headers: { Origin: TRUSTED } });
    expect(trusted.headers.get('Access-Control-Allow-Origin')).toBe(TRUSTED);
    const foreign = await session.request(url, { headers: { Origin: 'https://evil.example' } });
    expect(foreign.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect((await session.request(url)).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('stops serving artwork once the store is cleared (window closed)', async () => {
    const session = stack();
    const [track] = await session.open('tagged.mp3');
    session.artwork.clear();
    session.registry.clear();
    expect((await session.request(track?.artworkUrl as string)).status).toBe(404);
    expect((await session.request(track?.mediaUrl as string)).status).toBe(404);
  });

  it('artwork never exposes a path, and art is served from memory (no file read)', async () => {
    const session = stack();
    const [track] = await session.open('tagged.mp3');
    await fsp.rm(files.get('tagged.mp3') as string);
    await expect(session.request(track?.artworkUrl as string)).resolves.toMatchObject({
      status: 200,
    });
    files.set('tagged.mp3', await put('tagged.mp3', TAGGED_FIXTURE_BUILDERS['tagged.mp3']()));
  });
});
