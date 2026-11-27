import { describe, expect, it } from 'vitest';
import {
  FIXTURE_BUILDERS,
  FIXTURE_SAMPLE_RATE,
  makeFlac,
  makeMp3,
  makeOggContainerOnly,
  makeWav,
} from '../fixtures/audio/generate-audio';

// Block A fixtures: structural checks only. Real decoding is covered by the Electron E2E
// (tests/e2e/playback.spec.ts), which is the only place Chromium's decoders run.

const MAX_FIXTURE_BYTES = 64 * 1024;

describe('synthetic audio fixtures', () => {
  it('are deterministic', () => {
    for (const [name, build] of Object.entries(FIXTURE_BUILDERS)) {
      expect(Buffer.from(build()).equals(Buffer.from(build())), name).toBe(true);
    }
  });

  it('stay small', () => {
    for (const [name, build] of Object.entries(FIXTURE_BUILDERS)) {
      expect(build().byteLength, name).toBeLessThan(MAX_FIXTURE_BYTES);
    }
  });

  it('WAV has a consistent RIFF header and the requested duration', () => {
    const wav = makeWav(1);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(wav.byteLength - 8);
    expect(view.getUint32(24, true)).toBe(FIXTURE_SAMPLE_RATE);
    expect(view.getUint32(40, true) / 2 / FIXTURE_SAMPLE_RATE).toBe(1);
  });

  it('WAV contains a non-silent signal that stays inside the requested amplitude', () => {
    const wav = makeWav(1);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    let peak = 0;
    for (let offset = 44; offset < wav.byteLength; offset += 2) {
      peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
    }
    expect(peak).toBeGreaterThan(10000);
    expect(peak).toBeLessThan(0.41 * 32767);
  });

  it('FLAC has fLaC magic, STREAMINFO and a frame sync for each frame', () => {
    const flac = makeFlac();
    expect(String.fromCharCode(...flac.slice(0, 4))).toBe('fLaC');
    expect(flac[4]).toBe(0x80); // last metadata block, type STREAMINFO
    expect(flac[7]).toBe(34);
    const syncs = [];
    for (let i = 42; i < flac.length - 1; i += 1) {
      if (flac[i] === 0xff && flac[i + 1] === 0xf8 && flac[i + 2] === 0xc9) syncs.push(i);
    }
    const frame = 5 + 1 + 1 + 4096 * 2 + 2;
    expect(syncs).toEqual(Array.from({ length: 6 }, (_v, i) => 42 + i * frame));
    expect(flac.byteLength).toBe(42 + 6 * frame);
  });

  it('MP3 is a run of identical MPEG-1 Layer III frame headers', () => {
    const mp3 = makeMp3(10);
    expect(mp3.byteLength).toBe(417 * 10);
    for (let i = 0; i < 10; i += 1) {
      expect([...mp3.slice(i * 417, i * 417 + 4)]).toEqual([0xff, 0xfb, 0x90, 0xc4]);
    }
  });

  it('OGG fixture is container framing only', () => {
    expect(String.fromCharCode(...makeOggContainerOnly().slice(0, 4))).toBe('OggS');
  });
});
