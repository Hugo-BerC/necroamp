# Synthetic audio fixtures

All audio is generated from code by `generate-audio.ts` (plain sine waves and silence). No third-party
recording is stored or copied, so no licence record is needed beyond the repository's MIT licence.
Files are produced into a temporary directory at test time. Nothing binary is committed.

| Fixture              | Generated as                                                    | Plays in Chromium media element | Used for                                  |
| -------------------- | --------------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| `tone.wav`           | 16-bit mono PCM, 8 kHz, 440 Hz sine                             | yes (E2E)                       | playback, pause, stop, seek, volume, mute |
| `tone.flac`          | verbatim FLAC, 44.1 kHz, 440 Hz, CRC-8/16 correct, about 0.56 s | yes (E2E)                       | FLAC path                                 |
| `silence.mp3`        | 39 silent MPEG-1 Layer III frames, about 1.0 s                  | yes (E2E, silent)               | MP3 path                                  |
| `container-only.ogg` | one `OggS` page, not Vorbis                                     | no                              | unsupported `.ogg` handling               |
| `truncated.wav`      | WAV cut inside its data chunk                                   | partially                       | structural tests only                     |
| `garbage.mp3`        | pseudo-random bytes named `.mp3`                                | no                              | corrupt handling                          |

FLAC note: each frame header codes the sample rate explicitly. With rate code 0 ("take it from
STREAMINFO") the Chromium media element in Electron 45 failed with
`FFmpegDemuxer: PTS is not defined`, although `decodeAudioData` accepted the same bytes.

## Block B fixtures (`generate-tagged.ts`)

Also generated from code at test time; the artwork is an 8x8 gradient PNG written by the generator and the tag text is invented. No third-party material, so no licence record beyond the repository's MIT licence.

| Fixture       | Generated as                                                                                  | Decoded in Chromium (`audio-decode.spec.ts`) | Used for                      |
| ------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------- |
| `tone.mp3`    | 39 hand-assembled MPEG-1 Layer III frames, one spectral line at about 440 Hz, rms about 0.124 | yes, non-silent                              | MP3 playback and decode level |
| `tone.ogg`    | Ogg-encapsulated FLAC (OggFLAC mapping), 6 frames, empty Vorbis comment                       | yes                                          | `.ogg` playback               |
| `tagged.mp3`  | `tone.mp3` behind an ID3v2.4 tag (UTF-8 title, artist, album, PNG APIC)                       | yes                                          | metadata and artwork          |
| `tagged.flac` | FLAC with VORBIS_COMMENT and PICTURE blocks                                                   | yes                                          | metadata and artwork          |
| `tagged.ogg`  | Ogg FLAC with Vorbis comment and a PICTURE packet                                             | yes                                          | metadata and artwork          |
| `tagged.wav`  | WAV with a RIFF LIST/INFO chunk (ASCII only: RIFF INFO has no declared encoding)              | yes                                          | metadata without artwork      |

`silence.mp3` from Block A is kept as the silent counterpart: the decode spec asserts it decodes to silence, so a tone assertion can tell the two apart.

Method notes:

- The MP3 level was measured, not assumed: `globalGain` 200 gives a clean sine (peak/rms about 1.43), 210 clips. Decoders differ a little, so the test band is rms 0.08 to 0.25.
- Chromium's demuxer rejected an Ogg FLAC stream whose only header was STREAMINFO. The generator always writes a VORBIS_COMMENT block, as the reference FLAC encoder does.

## Known gaps

- There is no Ogg Vorbis or Ogg Opus fixture. No encoder is available offline and a hand-written Vorbis encoder is out of proportion for a fixture. `.ogg` is verified through Ogg FLAC, which exercises the extension allow list, the media protocol, the Ogg demuxer, tag and artwork parsing and the FLAC decoder, but NOT the Vorbis codec. Real-world `.ogg` files are almost always Vorbis, so Vorbis playback remains unverified by automation. A human with a Vorbis file (or a licence-clean encoded sample added to `tests/fixtures`, with an `docs/assets.md` entry from art-director) closes this gap.
- Only Windows has been exercised. macOS and Linux decoders are untested here.
- Decoding is verified, audibility is not: no human listening has taken place.
