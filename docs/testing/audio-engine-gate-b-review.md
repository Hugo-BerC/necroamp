# Audio Engine Gate B review (Playlist and Metadata)

- Branch: `feature/audio-engine`, HEAD `85ba290` (Block A). Block B is the uncommitted working tree on top of it, so `git diff main...HEAD` shows Block A only. This review used that diff for context and `git status` plus `git diff` of the working tree for Block B.
- Reviewer: qa-engineer. No production source was edited. No commit, push or PR.
- Authority: `.kiro/steering/tech.md` "Testing", "Audio engineering rules"; `product.md` (formats, features); `docs/requirements/audio-engine/`; ADR 0006.
- Human listening: **not performed.** Everything below is automated. Decode tests prove the Chromium decoder accepts each file and yields the expected signal. They do not prove that sound is audible or correct on a speaker (task H.2 stays open).

## Verdict: APPROVED

All six mandatory gates pass. Three low findings and two observations are open and do not block. See "Findings".

## Results (exact)

| Gate                                | Command                      | Result                                                                                                                                          |
| ----------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck                           | `pnpm typecheck`             | pass (exit 0)                                                                                                                                   |
| Lint                                | `pnpm lint`                  | pass (exit 0)                                                                                                                                   |
| Format                              | `pnpm format:check`          | pass (exit 0)                                                                                                                                   |
| Unit, property, integration + thresholds | `pnpm test:coverage`    | pass: 96 files, 1317 passed, 1 expected fail (`it.fails`, D-B1), 4 skipped (Windows symlink tests from Block A), 0 failed. Statements 99.27% (1505/1516), branches 97.79% (930/951), functions 99.45% (363/365), lines 99.41% (1366/1374). All thresholds met. |
| Build                               | `pnpm build`                 | pass (exit 0). Rollup prints annotation-comment warnings from `zod`; no error.                                                                   |
| E2E                                 | `pnpm test:e2e`              | pass: 76 passed, 0 failed, 5.1 min, Windows only                                                                                                 |
| E2E determinism re-run              | playlist, audio-decode, playback specs | pass: 39 passed, 0 failed, 3.1 min                                                                                               |

Gate A comparison: 979 passed and 49 e2e at Gate A, now 1317 and 76. Coverage thresholds were not lowered. Four per-file thresholds were added (95% lines and branches): `artwork.ts`, `playlist-persistence.ts`, `text.ts`, `playlist-ops.ts`.

Property tests were re-run 15 times (playlist) and 12 times (metadata, persistence) with fresh random seeds after fixing two over-strict assertions of my own (see "Property test notes"). No further failures.

## Dependency license record

`music-metadata` 13.0.1 (MIT) is recorded in ADR 0006 item 6 with its eight runtime dependencies. Verified against `node_modules` and `pnpm licenses list --prod`: all MIT. The package has no install script, so ADR 0004 needs no build-script entry. One error in the record: ADR says `token-types` 6.2.0 is BSD-3-Clause, it is MIT (defect 0006, low, necro-architect). `docs/assets.md` does not exist yet (tasks D.3), so the ADR is the only record today.

## What was added (QA write scope only)

| Area | File | Notes |
| --- | --- | --- |
| Property: playlist operations | `src/renderer/stores/playlist-ops.property.test.ts` (20 tests) | insert, remove, move, select, play order, next, previous, repeat, failure exhaustion. Hostile indexes: NaN, infinities, -0, fractions, huge. Faulty random sources. Cap of 5000. |
| Property: metadata normalization | `src/main/library/metadata.property.test.ts` (15 tests, 1 `it.fails`) | `cleanText`, image sniffing, artwork store budgets, metadata reader with arbitrary parser output, `TrackInfo` schema validity, extension allow list. |
| Property: persistence | `src/main/library/playlist-persistence.property.test.ts` (6 tests) | round trip of any path list, no temp file left, serialized saves, arbitrary file content never throws, unknown keys are corruption, failing writes. |
| Integration: real parser and fs | `tests/integration/block-b-library.integration.test.ts` (89 tests) | Real `music-metadata` 13.0.1 on generated MP3, FLAC, OGG, WAV with tags and artwork; hostile tags; corrupt files; persistence round trip across a simulated restart; corrupt and tampered `playlist.json`; IPC security for `library:resolve-track` and `playlist:*`; `media://art` boundaries. |
| Integration: persistence errors | `tests/integration/playlist-persistence-errors.integration.test.ts` (10 tests) | Logged error codes are allow-listed tokens, never a message or path. |
| Fixtures | `tests/fixtures/audio/generate-tagged.ts`, `generate-audio.ts` (refactor, same bytes), `README.md` | Non-silent MP3, decodable OGG, tagged files. See below. |
| Fixture structure | `tests/audio/tagged-fixtures.test.ts` (11 tests) | PNG chunk CRCs, Ogg page CRCs (independent bitwise oracle), ID3 syncsafe sizes, parser view of each fixture. |
| E2E decode with tolerances | `tests/e2e/audio-decode.spec.ts` (10 tests) | Decodes each fixture with Chromium, checks duration, rms band, peak, Goertzel 440 Hz dominance over 220, 1000, 2000 and 3500 Hz. Silent MP3 decodes to silence. Garbage is rejected. |
| E2E playlist | `tests/e2e/playlist.spec.ts` (15 tests) | Multi-select, metadata and artwork in rows and player, previous and next, auto progression, repeat modes, shuffle, reorder, remove, clear, corrupt file skipped, axe scan, CSP behavior of `media://art`, bridge refusals, persistence across relaunch, corrupt and hand-edited `playlist.json`. |
| E2E formats | `tests/e2e/playback.spec.ts` | Added non-silent MP3 and OGG playback tests. Bridge-shape test updated. |
| Config | `vitest.config.ts` | Four added per-file thresholds only. Nothing lowered. |

### Fixtures

- **Non-silent MP3** (`makeToneMp3`): hand-assembled MPEG-1 Layer III frames with one spectral line at about 440 Hz. Level measured in Chromium: gain 200 gives rms 0.124, peak 0.178 (peak/rms 1.43, a clean sine). Gain 210 clips. Duration 1.0188 s.
- **OGG** (`makeOggFlac`): **Ogg-encapsulated FLAC, not Vorbis.** No Vorbis or Opus encoder is available offline. It exercises the `.ogg` path end to end (extension list, media protocol, Ogg demux, Vorbis-comment and picture parsing, decode) but not the Vorbis codec. Chromium rejected a stream with only STREAMINFO, so the generator always writes a VORBIS_COMMENT block.
- **Tagged files**: ID3v2.4 MP3, FLAC, Ogg FLAC with UTF-8 tags and an 8x8 PNG; WAV with RIFF INFO (ASCII only, RIFF has no declared encoding). All generated at test time from code. The artwork is a gradient written by the generator. No third-party material, so no licence record beyond MIT. Nothing binary is committed.

## CSP e2e oracle (preserved and widened narrowly)

`tests/e2e/smoke-security.spec.ts` keeps an independent written-out policy, not imported from source. Change: `img-src 'self'` becomes `img-src 'self' media://art` in the oracle string (ADR 0006 item 7, task instruction). Every earlier assertion is kept or tightened:

- Full production CSP header equality and meta CSP equality (without `frame-ancestors`): kept.
- `img-src` is exactly `['self', 'media://art']`; `media-src` is exactly `['media://track']`: kept, adjusted.
- Forbidden in `img-src`: `media://track`, `media://*`, `data:`, `blob:`, `http:`, `https:`, `file:`, `*`, bare `media:`: kept (the old `media:` and `media://art` substring checks were replaced by exact-source checks, because `media://art` now legitimately contains both).
- `media-src` rejects `media://art`, `blob:`, `data:`, `http(s):`, `file:`, `*`: kept.
- New: no other directive contains `media:`, so the widening cannot leak.
- New, live renderer (`playlist.spec.ts`): an image from `media://art` loads with no violation; images from `media://track`, `https:`, `http:`, `data:` and `blob:` fail with an `img-src` violation; `file:` fails; an unissued art token passes CSP and gets 404. `media-src` still blocks `media://art` as audio. `fetch` of `media://art` does not resolve.

Two other existing oracles needed the new surface and were updated without dropping assertions: `smoke-security.spec.ts` (bridge keys now `app`, `library`, `playlist`, all frozen) and `library-ipc-security.integration.test.ts` and `playback.spec.ts` (exact method lists `openFiles, resolveTrack` and `load, save`, plus the "no ipc, invoke, send, fs, path" name check on every method).

## Traceability

| Criterion | Test |
| --- | --- |
| B: multiple file selection | `playlist.spec.ts` "adds several files in one selection"; `block-b-library` "returns every file of a multi-selection in dialog order" |
| B: playlist management, selection, reorder, removal | `playlist-ops.property.test.ts`; `playlist.spec.ts` "reorders and removes tracks" |
| B: previous and next | `playlist-ops.property.test.ts` (next, previous); `playlist.spec.ts` "previous and next move through the list" |
| B: automatic progression | `playlist.spec.ts` "progresses automatically ... stops after the last" |
| B: shuffle | `playlist-ops.property.test.ts` (permutation, leading item, determinism); `playlist.spec.ts` "shuffle plays every track exactly once per cycle" |
| B: repeat track and playlist | `playlist-ops.property.test.ts`; `playlist.spec.ts` "repeat cycles Off, Track, Playlist" |
| B: artist, title, album, duration | `block-b-library` (real parser, four formats, tolerances); `metadata.property.test.ts` |
| B: embedded artwork | `block-b-library` (served bytes equal source PNG); `playlist.spec.ts` (img decodes, naturalWidth 8) |
| B: local persistence, corrupt file | `block-b-library` (round trip, vanished file, 13 corrupt shapes, tampered paths, write failure); `playlist-persistence.property.test.ts`; `playlist.spec.ts` (relaunch) |
| IPC security of new channels | `block-b-library` (5 untrusted sender shapes on 3 channels, 17 payload rejections, token and existence oracle, no path in any response) |
| Media access (`media://art`) | `block-b-library` (namespace separation, 9 hostile URLs, methods, CORS origin, cleared store); `playlist.spec.ts` (live CSP) |
| Formats decode (MP3, WAV, FLAC, OGG) | `audio-decode.spec.ts`; `playback.spec.ts` |

## Property test notes

- Two assertions of mine were wrong, not the product: (1) `selectIndex(-0)` returns `0`, and `Object.is(0, -0)` is false; compare with `===`. (2) `nextIndex` with a malformed order (not a permutation) returns an out-of-range or foreign index; the contract says the order must be a permutation, so only membership in the order is asserted. The second case is kept as a seeded regression (seed 1587075747, counterexample `length 2, current 0, repeat track, order [1, 1], auto`).
- The `it.fails` marker in `metadata.property.test.ts` documents D-B1. It turns the run red when the defect is fixed, so the marker is removed with the fix.
- I did not mutate production code to prove each property can fail. The integration tests that guard security rules call the real handlers, so removing a sender check or a schema key fails them.

## Findings

| ID | Severity | Owner | Summary | Blocks gate |
| --- | --- | --- | --- | --- |
| D-B1 | low | desktop-engineer | `cleanText` removes C0 and DEL only. C1 controls (U+0085), bidi override U+202E, zero-width space and U+2028 survive in titles, artists, albums and file names. Report `docs/testing/defects/0005-clean-text-keeps-c1-and-format-characters.md`, reproduction in the file, expected-fail test in place. | no |
| D-B2 | low | necro-architect | ADR 0006 item 6 records `token-types` 6.2.0 as BSD-3-Clause. Installed package and `pnpm licenses` say MIT. Report `docs/testing/defects/0006-adr-0006-token-types-license-recorded-wrongly.md`. | no |
| D-B3 | cosmetic | frontend-engineer | `src/renderer/components/artwork/artwork.tsx` line 5: the doc comment reads "or <LF>ull for the placeholder", a corrupted `null`. No behavior impact. Reproduce: open the file. | no |
| O-B1 | low, unmeasured | desktop-engineer | `playlist:load` calls `fromPath` sequentially for up to 5000 saved paths, and each call parses the file with `duration: true`. A large library may delay the first paint of the list. Not measured here. Consider a bounded concurrency or lazy metadata. | no |
| O-B2 | low | security-reviewer | `playlist.json` is trusted input. A hand-edited entry such as a UNC path (`\\host\share\x.mp3`) is passed to `fs.stat` and the metadata parser on Windows, which can open an SMB connection. Needs local write access to the user-data directory, and the extension and file checks still apply. Not exercised against a real network. Consider rejecting UNC and non-absolute paths on load. | no |
| G-B1 | gap | qa-engineer / orchestrator | No Ogg Vorbis (or Opus) fixture, so the Vorbis codec is unverified by automation. | no |
| N-1 (Gate A) | resolved | necro-architect | ADR 0006 item 7 listed `media://art` in `img-src` while the production CSP did not. They now agree. | n/a |
| D-A6 (Gate A) | superseded | qa-engineer | The Block A rule "`media://art` absent from `img-src`" is replaced by the narrow Block B rule above, as authorized. | n/a |

Hostile inputs that held: path traversal and credentials in `media://` URLs, track token on the art host and the reverse, pictures that are not images, JPEG labelled PNG (served as sniffed), pictures over 2 MiB, 5000-character titles, markup in tags, prototype-pollution keys in payloads and in `playlist.json`, unknown tokens (no existence oracle), files deleted after save, directories and non-audio extensions in a tampered playlist, write failures (previous file kept, no temp file, no path in logs).

## Coverage and gap note

- Coverage is above all thresholds. Uncovered code is concentrated in `media-handler.ts` lines 114-115 (Block A) and a few defensive branches. No percentage was chased with trivial tests.
- Windows only. macOS and Linux decoders, case-sensitive paths, symlink escape tests (skipped on Windows), Linux sandbox and the Wayland and X11 differences are not exercised. Run this suite on the CI matrix before release.
- Not covered: Vorbis codec (G-B1), human listening (H.2), visual snapshots of the playlist and artwork, very large playlists (O-B1), real drag-and-drop reordering (the UI offers Up and Down buttons only).
- Audio comparison uses stated tolerances: duration ±0.01 to ±0.08 s, rms bands, 20x Goertzel dominance. No byte equality and no real-time playback timing assertions. Auto-progression e2e tests wait on observable DOM state with 30 to 40 s upper bounds, no fixed sleeps except one existing negative check from Block A.
- Process: Block B is not committed (P-1 from Gate A still applies, orchestrator-owned). `docs/requirements/audio-engine/tasks.md` B items are not ticked; ticking is the orchestrator's job and human gates H.1 to H.4 remain open.
