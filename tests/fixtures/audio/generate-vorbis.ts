import { createOggEncoder } from 'wasm-media-encoders';
/**
 * Real Ogg Vorbis fixture: an original 440 Hz sine, encoded at test time by wasm-media-encoders
 * (MIT, devDependency, version pinned; it wraps libvorbis and libogg). Nothing binary is committed.
 * Unlike `makeOggFlac` (Ogg FLAC), this stream uses the Vorbis codec, which is what real-world
 * `.ogg` files almost always contain. See tests/fixtures/audio/README.md.
 */
export const VORBIS_SAMPLE_RATE = 44100;
export const VORBIS_TONE_HZ = 440;
export const VORBIS_SECONDS = 1;
const VORBIS_SERIAL = 0x4e45; // fixed serial number keeps the output deterministic

/** Mono Ogg Vorbis, 44.1 kHz, 440 Hz sine at amplitude 0.4, about 1 s. */
export async function makeOggVorbis(seconds = VORBIS_SECONDS): Promise<Uint8Array> {
  const encoder = await createOggEncoder();
  encoder.configure({
    channels: 1,
    sampleRate: VORBIS_SAMPLE_RATE,
    vbrQuality: 6,
    oggSerialNo: VORBIS_SERIAL,
  });
  const count = Math.round(seconds * VORBIS_SAMPLE_RATE);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    samples[i] = 0.4 * Math.sin((2 * Math.PI * VORBIS_TONE_HZ * i) / VORBIS_SAMPLE_RATE);
  }
  // The encoder returns a view into WASM memory that is only valid until the next call: copy it.
  const body = encoder.encode([samples]).slice();
  const tail = encoder.finalize().slice();
  const out = new Uint8Array(body.length + tail.length);
  out.set(body, 0);
  out.set(tail, body.length);
  return out;
}
