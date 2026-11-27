import { crc32 } from 'node:zlib';
import {
  FLAC_BLOCK_SIZE,
  FLAC_SAMPLE_RATE,
  flacFrame,
  flacStreamInfo,
  flacToneSamples,
  makeWav,
} from './generate-audio';

/**
 * Audio Engine Block B fixtures: a non-silent MP3, a decodable OGG and tagged files with embedded
 * artwork. Like `generate-audio.ts`, everything is generated from code at test time. The tones are
 * plain sines, the artwork is an 8x8 gradient written by this file, the tag text is invented. No
 * third-party material is stored, so no licence record is needed beyond the repository's MIT licence.
 *
 * OGG: the stream is Ogg-encapsulated FLAC (the Xiph "OggFLAC" mapping), not Ogg Vorbis. No Vorbis
 * or Opus encoder is available offline and a hand-written Vorbis encoder is out of proportion for a
 * fixture. It proves the `.ogg` path (extension allow list, media protocol, Ogg demux, decode,
 * Vorbis-comment and picture parsing) but NOT the Vorbis codec. See README.md, "Known gaps".
 */
export const TONE_HZ = 440;

const encoder = new TextEncoder();

/** Text used by the tag fixtures. Non-ASCII on purpose, to prove UTF-8 handling end to end. */
export const FIXTURE_TAGS = Object.freeze({
  title: 'Sonata para Árboles',
  artist: 'Synthetic Quartet',
  album: 'Fixture Collection ☾',
});

/** RIFF INFO has no declared text encoding (players read it as a code page), so WAV tags stay ASCII. */
export const WAV_TAGS = Object.freeze({
  title: 'Sonata for Trees',
  artist: 'Synthetic Quartet',
  album: 'Fixture Collection',
});

// ---------------------------------------------------------------------------------------------
// Artwork
// ---------------------------------------------------------------------------------------------

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const body = new Uint8Array(4 + data.length);
  body.set(encoder.encode(type), 0);
  body.set(data, 4);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(8 + data.length, crc32(body));
  return out;
}

/** An 8x8 RGB PNG with a fixed gradient. About 100 bytes. Stored with no compression. */
export function makeArtworkPng(): Uint8Array {
  const size = 8;
  const raw = new Uint8Array(size * (1 + size * 3));
  for (let y = 0; y < size; y += 1) {
    const row = y * (1 + size * 3);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x += 1) {
      raw.set([x * 32, y * 32, 96], row + 1 + x * 3);
    }
  }
  // zlib stream of one stored deflate block: deterministic and independent of the zlib build.
  const length = raw.length;
  const adler = (() => {
    let a = 1;
    let b = 0;
    for (const byte of raw) {
      a = (a + byte) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  })();
  const stored = new Uint8Array(2 + 5 + length + 4);
  stored.set([0x78, 0x01, 0x01, length & 0xff, length >> 8, ~length & 0xff, (~length >> 8) & 0xff]);
  stored.set(raw, 7);
  new DataView(stored.buffer).setUint32(7 + length, adler);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolour, deflate, adaptive filter, no interlace
  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', stored),
    pngChunk('IEND', new Uint8Array(0)),
  ];
  return concat(parts);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// MP3 with a real signal
// ---------------------------------------------------------------------------------------------

class BitWriter {
  readonly bytes: number[] = [];
  private bits = 0;
  write(value: number, count: number): void {
    for (let i = count - 1; i >= 0; i -= 1) {
      if (this.bits % 8 === 0) this.bytes.push(0);
      const bit = (value >>> i) & 1;
      this.bytes[this.bytes.length - 1] =
        (this.bytes.at(-1) as number) | (bit << (7 - (this.bits % 8)));
      this.bits += 1;
    }
  }
}

const MP3_FRAME_LENGTH = 417;
/** MDCT line 11 of 576 at 44.1 kHz is centred on (11 + 0.5) * 22050 / 576 = 440.2 Hz. */
const MP3_TONE_LINE = 11;

/**
 * Mono MPEG-1 Layer III frames with one non-zero spectral line (about 440 Hz) in every granule.
 * Hand-assembled: side information, then Huffman table 1 pairs (`1` for a zero pair, `001` plus a
 * sign bit for the pair (0, +1)). `globalGain` sets the level: each +4 doubles it. Measured in Chromium 45 / Electron 45.5.0: 200 decodes to rms about 0.124 and peak about 0.178 (a clean sine), 210 clips.
 */
export function makeToneMp3(frames = 39, globalGain = 200): Uint8Array {
  const pairs = (MP3_TONE_LINE >> 1) + 1; // pairs 0..5
  const huffmanBits = (pairs - 1) * 1 + 3 + 1;
  const out = new Uint8Array(MP3_FRAME_LENGTH * frames);
  for (let f = 0; f < frames; f += 1) {
    const w = new BitWriter();
    w.write(0, 9); // main_data_begin
    w.write(0, 5); // private bits (mono)
    w.write(0, 4); // scfsi
    for (let granule = 0; granule < 2; granule += 1) {
      w.write(huffmanBits, 12); // part2_3_length (part2 is empty: scalefac_compress 0)
      w.write(pairs, 9); // big_values
      w.write(globalGain, 8);
      w.write(0, 4); // scalefac_compress
      w.write(0, 1); // window_switching_flag
      w.write(1, 5); // table_select[0]
      w.write(1, 5); // table_select[1]
      w.write(1, 5); // table_select[2]
      w.write(0, 4); // region0_count
      w.write(0, 3); // region1_count
      w.write(0, 1); // preflag
      w.write(0, 1); // scalefac_scale
      w.write(0, 1); // count1table_select
    }
    for (let granule = 0; granule < 2; granule += 1) {
      for (let pair = 0; pair < pairs - 1; pair += 1) w.write(1, 1); // (0,0)
      w.write(0b001, 3); // (0,1): line 11 only
      w.write(0, 1); // sign: positive
    }
    out.set([0xff, 0xfb, 0x90, 0xc4], f * MP3_FRAME_LENGTH);
    out.set(w.bytes, f * MP3_FRAME_LENGTH + 4);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------------------------

export interface TagFields {
  readonly title?: string;
  readonly artist?: string;
  readonly album?: string;
  /** Raw bytes embedded as the front cover. The picture type is "front cover" (3). */
  readonly picture?: Uint8Array;
  /** Declared MIME type of the picture. The app must not trust it. */
  readonly pictureMime?: string;
}

function syncsafe(value: number): number[] {
  return [(value >> 21) & 0x7f, (value >> 14) & 0x7f, (value >> 7) & 0x7f, value & 0x7f];
}

function id3Frame(id: string, body: Uint8Array): Uint8Array {
  return concat([encoder.encode(id), Uint8Array.from([...syncsafe(body.length), 0, 0]), body]);
}

/** ID3v2.4 tag with UTF-8 text frames and an APIC picture. */
export function makeId3v24(tags: TagFields): Uint8Array {
  const frames: Uint8Array[] = [];
  const text = (id: string, value: string | undefined): void => {
    if (value !== undefined)
      frames.push(id3Frame(id, concat([Uint8Array.of(3), encoder.encode(value)])));
  };
  text('TIT2', tags.title);
  text('TPE1', tags.artist);
  text('TALB', tags.album);
  if (tags.picture !== undefined) {
    frames.push(
      id3Frame(
        'APIC',
        concat([
          Uint8Array.of(0),
          encoder.encode(tags.pictureMime ?? 'image/png'),
          Uint8Array.of(0, 3, 0), // end of MIME, picture type 3, empty description
          tags.picture,
        ]),
      ),
    );
  }
  const body = concat(frames);
  return concat([Uint8Array.from([0x49, 0x44, 0x33, 4, 0, 0, ...syncsafe(body.length)]), body]);
}

/** A tone MP3 with an ID3v2.4 tag in front. */
export function makeTaggedMp3(tags: TagFields = defaultTags(), frames = 39): Uint8Array {
  return concat([makeId3v24(tags), makeToneMp3(frames)]);
}

export function defaultTags(): TagFields {
  return { ...FIXTURE_TAGS, picture: makeArtworkPng() };
}

function le32(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff];
}
function be32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** FLAC VORBIS_COMMENT block body (also used by Ogg FLAC). */
export function vorbisCommentBody(tags: TagFields): Uint8Array {
  const vendor = encoder.encode('necroamp-fixture');
  const comments: Uint8Array[] = [];
  const add = (key: string, value: string | undefined): void => {
    if (value !== undefined) comments.push(encoder.encode(`${key}=${value}`));
  };
  add('TITLE', tags.title);
  add('ARTIST', tags.artist);
  add('ALBUM', tags.album);
  return concat([
    Uint8Array.from([...le32(vendor.length)]),
    vendor,
    Uint8Array.from(le32(comments.length)),
    ...comments.flatMap((c) => [Uint8Array.from(le32(c.length)), c]),
  ]);
}

/** FLAC PICTURE block body: front cover, 8x8, 24-bit. */
export function flacPictureBody(picture: Uint8Array, mime = 'image/png'): Uint8Array {
  const mimeBytes = encoder.encode(mime);
  return concat([
    Uint8Array.from([
      ...be32(3),
      ...be32(mimeBytes.length),
      ...mimeBytes,
      ...be32(0), // description length
      ...be32(8),
      ...be32(8),
      ...be32(24),
      ...be32(0),
      ...be32(picture.length),
    ]),
    picture,
  ]);
}

function metadataBlock(type: number, body: Uint8Array, last: boolean): Uint8Array {
  const header = [
    (last ? 0x80 : 0) | type,
    (body.length >> 16) & 0xff,
    (body.length >> 8) & 0xff,
    body.length & 0xff,
  ];
  return concat([Uint8Array.from(header), body]);
}

function tagBlocks(tags: TagFields): Uint8Array[] {
  const blocks: Uint8Array[] = [];
  if (tags.title !== undefined || tags.artist !== undefined || tags.album !== undefined) {
    blocks.push(metadataBlock(4, vorbisCommentBody(tags), false));
  }
  if (tags.picture !== undefined) {
    blocks.push(metadataBlock(6, flacPictureBody(tags.picture, tags.pictureMime), false));
  }
  return blocks;
}

/** Marks the last block in the list as the last metadata block. */
function markLast(blocks: Uint8Array[]): Uint8Array[] {
  const copy = blocks.map((b) => Uint8Array.from(b));
  const last = copy.at(-1);
  if (last !== undefined) last[0] = (last[0] as number) | 0x80;
  return copy;
}

/** Native FLAC with VORBIS_COMMENT and PICTURE blocks. */
export function makeTaggedFlac(tags: TagFields = defaultTags(), frames = 6): Uint8Array {
  const streamInfo = metadataBlock(0, Uint8Array.from(flacStreamInfo(frames)), false);
  const blocks = markLast([streamInfo, ...tagBlocks(tags)]);
  const samples = flacToneSamples(frames);
  const audio = Array.from({ length: frames }, (_v, i) => Uint8Array.from(flacFrame(i, samples)));
  return concat([encoder.encode('fLaC'), ...blocks, ...audio]);
}

/** WAV with a RIFF LIST/INFO chunk (title, artist, album). RIFF has no standard artwork. */
export function makeTaggedWav(tags: TagFields = FIXTURE_TAGS, seconds = 1): Uint8Array {
  const wav = makeWav(seconds);
  const sub = (id: string, value: string | undefined): Uint8Array => {
    if (value === undefined) return new Uint8Array(0);
    const bytes = concat([encoder.encode(value), Uint8Array.of(0)]);
    const padded = bytes.length % 2 === 0 ? bytes : concat([bytes, Uint8Array.of(0)]);
    return concat([encoder.encode(id), Uint8Array.from(le32(bytes.length)), padded]);
  };
  const info = concat([
    encoder.encode('INFO'),
    sub('INAM', tags.title),
    sub('IART', tags.artist),
    sub('IPRD', tags.album),
  ]);
  const list = concat([encoder.encode('LIST'), Uint8Array.from(le32(info.length)), info]);
  const out = concat([wav, list]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Ogg (OggFLAC mapping)
// ---------------------------------------------------------------------------------------------

const OGG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let r = i << 24;
    for (let bit = 0; bit < 8; bit += 1) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    table[i] = r >>> 0;
  }
  return table;
})();

function oggCrc(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes)
    crc = ((crc << 8) ^ (OGG_CRC_TABLE[((crc >>> 24) ^ byte) & 0xff] as number)) >>> 0;
  return crc;
}

/** One Ogg page holding whole packets. Each packet must be shorter than 255 * 255 bytes. */
export function oggPage(options: {
  readonly serial: number;
  readonly sequence: number;
  readonly packets: readonly Uint8Array[];
  readonly granule: number;
  readonly bos?: boolean;
  readonly eos?: boolean;
}): Uint8Array {
  const lacing: number[] = [];
  for (const packet of options.packets) {
    let remaining = packet.length;
    while (remaining >= 255) {
      lacing.push(255);
      remaining -= 255;
    }
    lacing.push(remaining);
  }
  if (lacing.length > 255) throw new Error('Ogg page has too many segments');
  const header = new Uint8Array(27 + lacing.length);
  const view = new DataView(header.buffer);
  header.set([0x4f, 0x67, 0x67, 0x53, 0], 0);
  header[5] = (options.bos === true ? 2 : 0) | (options.eos === true ? 4 : 0);
  view.setUint32(6, options.granule >>> 0, true); // granule is below 2^32 for these fixtures
  view.setUint32(10, 0, true);
  view.setUint32(14, options.serial, true);
  view.setUint32(18, options.sequence, true);
  header[26] = lacing.length;
  header.set(lacing, 27);
  const page = concat([header, ...options.packets]);
  new DataView(page.buffer).setUint32(22, oggCrc(page), true);
  return page;
}

/** Mono 44.1 kHz FLAC tone in an Ogg container, with optional Vorbis comment and picture. */
export function makeOggFlac(tags: TagFields = {}, frames = 6): Uint8Array {
  const serial = 0x4e454352;
  // Real Ogg FLAC files always carry a VORBIS_COMMENT block. Chromium's demuxer rejected a stream
  // whose only header was STREAMINFO, so an untagged fixture still gets an empty comment block.
  const headerBlocks = tagBlocks(tags);
  if (headerBlocks.length === 0) headerBlocks.push(metadataBlock(4, vorbisCommentBody({}), false));
  const info = Uint8Array.from(flacStreamInfo(frames));
  const first = concat([
    Uint8Array.from([0x7f, 0x46, 0x4c, 0x41, 0x43, 1, 0]), // 0x7F "FLAC", mapping 1.0
    Uint8Array.from([(headerBlocks.length >> 8) & 0xff, headerBlocks.length & 0xff]),
    encoder.encode('fLaC'),
    metadataBlock(0, info, headerBlocks.length === 0),
  ]);
  const pages: Uint8Array[] = [
    oggPage({ serial, sequence: 0, packets: [first], granule: 0, bos: true }),
  ];
  let sequence = 1;
  const marked = headerBlocks.length === 0 ? [] : markLast(headerBlocks);
  for (const block of marked) {
    // A picture can exceed one page. Fixtures stay below 60 KB so one packet per page is enough.
    pages.push(oggPage({ serial, sequence, packets: [block], granule: 0 }));
    sequence += 1;
  }
  const samples = flacToneSamples(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    pages.push(
      oggPage({
        serial,
        sequence,
        packets: [Uint8Array.from(flacFrame(frame, samples))],
        granule: (frame + 1) * FLAC_BLOCK_SIZE,
        eos: frame === frames - 1,
      }),
    );
    sequence += 1;
  }
  return concat(pages);
}

/** Expected length of the FLAC based fixtures in seconds. */
export function flacSeconds(frames = 6): number {
  return (frames * FLAC_BLOCK_SIZE) / FLAC_SAMPLE_RATE;
}

export const TAGGED_FIXTURE_BUILDERS = {
  'tone.mp3': () => makeToneMp3(),
  'tone.ogg': () => makeOggFlac(),
  'tagged.mp3': () => makeTaggedMp3(),
  'tagged.flac': () => makeTaggedFlac(),
  'tagged.ogg': () => makeOggFlac(defaultTags()),
  'tagged.wav': () => makeTaggedWav(WAV_TAGS),
} as const;
export type TaggedFixtureName = keyof typeof TAGGED_FIXTURE_BUILDERS;
