/**
 * Synthetic audio fixtures for NecroAmp tests. Everything is generated from code at test time:
 * no third-party audio is stored or copied, so there is no licence to track. The tones are
 * original (plain sine waves). See tests/fixtures/audio/README.md.
 *
 * Decodability is NOT the same for every format (see the README table):
 * - WAV: valid PCM, decodable everywhere.
 * - FLAC: valid stream (verbatim subframes, correct CRC-8 and CRC-16). The sample rate must be
 *   coded in each frame header: with code 0 ("from STREAMINFO") Chromium's media element fails with
 *   "FFmpegDemuxer: PTS is not defined" even though decodeAudioData accepts the file.
 * - MP3: valid MPEG-1 Layer III frames carrying silence (all-zero side info and data).
 * - OGG: container framing only (one `OggS` page). It is NOT a decodable Vorbis stream and
 *   is used only where the test needs an `.ogg` file that the app must reject cleanly.
 */

export const FIXTURE_SAMPLE_RATE = 8000;
export const FIXTURE_TONE_HZ = 440;

function sineSamples(count: number, amplitude = 0.4, rate = FIXTURE_SAMPLE_RATE): Int16Array {
  const out = new Int16Array(count);
  for (let i = 0; i < count; i += 1) {
    out[i] = Math.round(Math.sin((2 * Math.PI * FIXTURE_TONE_HZ * i) / rate) * amplitude * 32767);
  }
  return out;
}

/** 16-bit mono PCM WAV containing a 440 Hz sine. */
export function makeWav(seconds = 1): Uint8Array {
  const samples = sineSamples(Math.round(seconds * FIXTURE_SAMPLE_RATE));
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, FIXTURE_SAMPLE_RATE, true);
  view.setUint32(28, FIXTURE_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, dataBytes, true);
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, sample, true));
  return new Uint8Array(buffer);
}

function crc8(bytes: readonly number[]): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

function crc16(bytes: readonly number[]): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x8005) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

const FLAC_BLOCK = 4096;
const FLAC_RATE = 44100;

/** Mono 16-bit 44.1 kHz FLAC of verbatim frames (6 frames: 24576 samples, about 0.56 s, about 48 KB). */
export function makeFlac(frames = 6): Uint8Array {
  const total = BigInt(FLAC_BLOCK * frames);
  const info: number[] = [];
  const push16 = (v: number): void => void info.push((v >> 8) & 0xff, v & 0xff);
  const push24 = (v: number): void => void info.push((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
  push16(FLAC_BLOCK);
  push16(FLAC_BLOCK);
  const frameBytes = 5 + 1 + 1 + FLAC_BLOCK * 2 + 2; // header, CRC-8, subframe header, samples, CRC-16
  push24(frameBytes);
  push24(frameBytes);
  // 20-bit rate, 3-bit channels-1, 5-bit bits-1, 36-bit total samples = 64 bits.
  const packed = (BigInt(FLAC_RATE) << 44n) | (0n << 41n) | (15n << 36n) | total;
  for (let shift = 56n; shift >= 0n; shift -= 8n) info.push(Number((packed >> shift) & 0xffn));
  for (let i = 0; i < 16; i += 1) info.push(0); // MD5 unknown
  const bytes: number[] = [0x66, 0x4c, 0x61, 0x43, 0x80, 0, 0, info.length, ...info];
  const samples = sineSamples(FLAC_BLOCK * frames, 0.4, FLAC_RATE);
  for (let frame = 0; frame < frames; frame += 1) {
    // 0xC9: block size 4096, sample rate 44.1 kHz coded in the header (FFmpeg's parser needs it for PTS).
    const header = [0xff, 0xf8, 0xc9, 0x08, frame];
    const body: number[] = [...header, crc8(header), 0x02];
    for (let i = 0; i < FLAC_BLOCK; i += 1) {
      const value = samples[frame * FLAC_BLOCK + i] as number;
      body.push((value >> 8) & 0xff, value & 0xff);
    }
    const crc = crc16(body);
    bytes.push(...body, crc >> 8, crc & 0xff);
  }
  return Uint8Array.from(bytes);
}

/** MPEG-1 Layer III, 128 kbit/s, 44.1 kHz, mono-compatible silent frames (about 1.0 s). */
export function makeMp3(frames = 39): Uint8Array {
  const frameLength = 417; // floor(144 * 128000 / 44100), no padding
  const out = new Uint8Array(frameLength * frames);
  for (let i = 0; i < frames; i += 1) {
    out.set([0xff, 0xfb, 0x90, 0xc4], i * frameLength); // 0xC4: single channel, no padding
  }
  return out;
}

/** One `OggS` page with a non-Vorbis payload. Container framing only. Not decodable audio. */
export function makeOggContainerOnly(): Uint8Array {
  const payload = Uint8Array.from([0x01, ...new TextEncoder().encode('necroamp-fixture')]);
  const page = new Uint8Array(27 + 1 + payload.length);
  page.set([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02], 0); // OggS, version 0, beginning-of-stream
  page[26] = 1; // one segment
  page[27] = payload.length;
  page.set(payload, 28);
  return page;
}

/** Bytes that match no audio format, for the corrupt-file path. */
export function makeGarbage(length = 2048): Uint8Array {
  const out = new Uint8Array(length);
  let state = 0x2545f491;
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    out[i] = state >>> 24;
  }
  return out;
}

/** A WAV cut off in the middle of its data chunk. */
export function makeTruncatedWav(): Uint8Array {
  return makeWav(1).slice(0, 44 + 300);
}

export const FIXTURE_BUILDERS = {
  'tone.wav': () => makeWav(),
  'tone.flac': () => makeFlac(),
  'silence.mp3': () => makeMp3(),
  'container-only.ogg': () => makeOggContainerOnly(),
  'truncated.wav': () => makeTruncatedWav(),
  'garbage.mp3': () => makeGarbage(),
} as const;

export type FixtureName = keyof typeof FIXTURE_BUILDERS;
