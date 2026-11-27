# Audio Engine Gate C review (DSP and visualization)

Branch `feature/audio-engine`, HEAD `de3b38e` (Blocks A to C committed) plus the uncommitted test-only changes listed below. Nothing was committed or pushed. No production source was edited.

Authority: `.kiro/steering/tech.md` "Testing". All results are automated. No human listened to anything.

## Verdict: APPROVED

Re-review after remediation. The earlier CHANGES_REQUESTED verdict listed seven findings. Each is verified below.

## Results (Windows, Node v24.22.3, pnpm 10.34.9)

| Check                | Result                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`     | PASS                                                                                                               |
| `pnpm lint`          | PASS (0 errors)                                                                                                    |
| `pnpm format:check`  | PASS                                                                                                               |
| `pnpm test:coverage` | PASS, 1417 passed / 1 expected fail / 4 skipped (1422), 108 files                                                  |
| Coverage             | Statements 99.3% (1993/2007), Branches 96.13% (1143/1189), Functions 99.16% (474/478), Lines 99.5% (1824/1833); no threshold violation |
| `pnpm build`         | PASS                                                                                                               |
| `pnpm test:e2e`      | PASS, 80 passed / 0 failed, run twice in full (5.1 min and 5.3 min)                                                |

## Earlier findings, verified

| #   | Finding                                                | Status                                                                                                                                           |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Lint and static policy banned Block C globals          | Resolved. `pnpm lint` 0 errors and `tests/static/renderer-policy.test.ts` passes in the 1417-test run.                                            |
| 2   | `playback.spec.ts` volume/mute expected `element.volume` 0.3 | Resolved. The test now asserts element volume 1 and observes the effect through the spectrum canvas. Passes.                              |
| 3   | `lifecycle.spec.ts` 800x600 region 12.14 px high       | Resolved. Passes in both full runs.                                                                                                              |
| 4   | `lifecycle.spec.ts` tab order lacked `eq-preset-select` | Resolved. Passes in both full runs.                                                                                                              |
| 5   | Flaky "Render frame was disposed"                      | Not reproduced in two full e2e runs (160 test executions) or the targeted runs. Treated as closed. Reopen if it recurs.                          |
| 6   | No e2e for real AudioContext, EQ change and bypass     | Resolved by `tests/e2e/equalizer-audio.spec.ts` (below).                                                                                          |
| 7   | `.ogg` verified only as Ogg FLAC                       | Resolved for Vorbis by `tests/fixtures/audio/generate-vorbis.ts` (below). Ogg Opus remains uncovered.                                            |

## Changes in this re-review (test-only, plus one pinned devDependency)

- `package.json`, `pnpm-lock.yaml`: `wasm-media-encoders` 0.7.0 as an exact-pinned devDependency (MIT; wraps libvorbis and LAME). Used only by fixture generation, not imported by `src/`. Added on the user's explicit request; the qa-engineer role cannot normally edit `package.json`, so desktop-engineer should confirm it against `docs/engineering/package-script-policy.md`.
- `tests/fixtures/audio/generate-vorbis.ts` (new): `makeOggVorbis()`, mono 44.1 kHz, 440 Hz sine, amplitude 0.4, 1 s, fixed Ogg serial number. Generated at test time, nothing binary committed.
- `tests/e2e/audio-decode.spec.ts`: `OGG (Vorbis)` case (440 Hz dominates every off-tone probe by 20x, rms 0.2 to 0.36, length 1 s within 0.06 s) and a test that the bytes contain the `\x01vorbis`, `\x03vorbis` and `\x05vorbis` headers and no Ogg FLAC marker. Existing cases and thresholds are unchanged.
- `tests/e2e/playback.spec.ts`: plays `vorbis.ogg`, asserts duration about 1 s, no media error, `currentTime` advancing and a lit spectrum.
- `tests/e2e/equalizer-audio.spec.ts` (new): a 30 s 440 Hz WAV plays through the production graph. Using only the preamp slider, the 500 Hz band slider and the bypass checkbox, it compares lit spectrum pixels (analyser output) after each setting settles. Measured: flat 1169, preamp -12 dB 868, preamp +12 dB 1659, 500 Hz band -12 dB 903, band +12 dB 1568, bypass on 1169 (equal to flat), bypass off 1568 (boost restored). Assertions use margins of 10% below and 3% above flat, and a 3% band for returning to flat.
- `tests/fixtures/audio/README.md`: Vorbis fixture, licence record and gaps.
- `docs/engineering/audio-engine-pr-body.md`: Ogg Vorbis and graph-test limitations updated.

## Gaps and limits

- Automated playback verification covers decode, media element state and analyser output on Windows only. No human listening happened. macOS and Linux decoders are untested.
- Ogg Opus is not covered.
- The EQ check uses lit-pixel counts of the spectrum canvas. It proves the analyser output changes and returns to flat, not the exact dB response. Filter math is covered by the unit and property tests.
- `docs/assets.md` does not exist. The fixtures are synthetic code output, so the licence note stays in `tests/fixtures/audio/README.md`.
- Property tests added earlier by this gate remain: `eq.property.test.ts` (12) and `visualizer-data.property.test.ts` (4).