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

Known gap: there is no decodable OGG Vorbis or Opus fixture, because no encoder is available
offline and a hand-written Vorbis stream is not practical. OGG playback is therefore not verified by
automated tests. The MP3 fixture is silent, so it proves demux and decode but not signal content.
