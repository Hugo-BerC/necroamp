# Audio Engine: local playback, playlist, metadata, equalizer and visualization

Spec: `.kiro/specs/audio-engine/`. ADR: `docs/adr/0006-media-protocol-and-audio-pipeline.md` (provisional, needs human review H.1).

Leave this PR open for human review. Do not merge without explicit authorization naming this PR.

## Summary per block

### Block A: core playback

- Native file dialog in main (`library:open-files`), filtered to MP3, WAV, FLAC and OGG. The renderer receives tokens, never paths.
- `media://track/<uuid>` protocol in main with single-range `Range` support, so seeking does not load the whole file.
- One hidden `HTMLAudioElement` drives playback. Timing is not tied to React renders.
- Play, pause, stop, seek, elapsed and duration (`m:ss`, `--:--` when unknown), volume and mute (mute keeps the volume).
- Unsupported, corrupt, missing and zero-byte files show an error state and do not crash.

### Block B: playlist and metadata

- Multiple selection, track selection, previous and next (Previous restarts the track after 3 seconds), automatic progression, shuffle, repeat off, track and playlist, reorder and remove.
- Artist, title, album and duration from `music-metadata` in main. Tag text is cleaned and length-capped.
- Embedded artwork served from `media://art/<uuid>`. Only PNG, JPEG and WebP are accepted, identified by magic bytes. Limits are 2 MiB per image and 64 MiB in total.
- Playlist persistence in `userData/playlist.json` through `playlist:load` and `playlist:save`. The file is validated with a strict Zod schema and written atomically. A corrupt file or unknown version loads as an empty playlist, and missing files are marked unavailable.

### Block C: DSP and visualization

- Native Web Audio graph: source, ten `BiquadFilterNode`s (low shelf, eight peaking, high shelf), preamp gain, master gain, `AnalyserNode`, destination. No AudioWorklet, because native nodes cover the requirements.
- Equalizer with preamp, bypass and presets. Parameter changes are smoothed and the graph topology never changes.
- Spectrum and waveform canvases drawn from the analyser on `requestAnimationFrame`. The loop pauses when the window is hidden or playback stops. Colors come from CSS custom properties, so future skins can restyle them.
- The graph is built on the first play gesture. Disposal disconnects the nodes, closes the context and removes listeners.

### Final fixes in this step

- ESLint and `tests/static/renderer-policy.test.ts` allow `AudioContext`, `AnalyserNode` and `requestAnimationFrame` only in `src/renderer/audio/**`. The rest of the renderer still bans them.
- `app-shell.module.css`: the player and bottom rows use `min-content` instead of `auto`. Before this change the player region collapsed to 12 px at 800x600.
- `tests/e2e/lifecycle.spec.ts`: the Tab-order test now includes `select` elements, so the new preset select is covered.
- `tests/e2e/playback.spec.ts`: since Block C, volume and mute drive the master gain and the element stays at volume 1. The test now checks the real Web Audio output: the spectrum canvas has lit pixels while playing, none when muted or at volume 0, and lit pixels again after unmuting.

## New dependencies

| Package | Version | License | Kind |
|---|---|---|---|
| `music-metadata` | 13.0.1 (exact pin) | MIT | runtime, main process |
| `wasm-media-encoders` | 0.7.0 (exact pin) | MIT (package `LICENSE`). The WASM embeds libvorbis and libogg (BSD-3-Clause) and LAME (LGPL, unused) | devDependency, test fixtures only. Not imported by `src/`, not in `out/`, not packaged. See `audio-engine-dependency-review.md` |

Its transitive runtime packages, all MIT (from `pnpm licenses list --prod`): `@borewit/text-codec` 0.2.3, `@tokenizer/token` 0.3.0, `content-type` 3.1.1, `debug` 4.4.3, `ms` 2.1.3, `media-typer` 2.0.0, `strtok3` 10.8.0, `token-types` 6.2.0, `win-guid` 0.2.1. No new dev dependencies. `onlyBuiltDependencies` still allows only `esbuild`, so none of these packages runs an install script. `pnpm audit` was not run.

## Security review

Report: `docs/security/audio-engine-review.md`. It found no Critical, High or Medium issues. The review read the source files and ran no tools.

Controls confirmed in the review:

- `media://` URLs must match `media://(track|art)/<lowercase uuid>` exactly. Range handling is bounded, and the scheme has no `bypassCSP`.
- Production CSP: `img-src 'self' media://art` and `media-src media://track`. There is no `unsafe-eval`, and no `unsafe-inline` in production.
- All new IPC channels go through `registerHandler`, which checks the sender and validates requests and responses with Zod. They carry tokens or a boolean, never paths.
- The preload does not expose `ipcRenderer`.
- `contextIsolation`, `sandbox`, `webSecurity` and `nodeIntegration: false` are unchanged.

The Low and Info findings below are not fixed in this PR and are listed as limitations.

## Test results (Windows x64, Node 24.22.3, pnpm 10.34.9, run in this step)

| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm test:coverage` | exit 0. 119 files, 1662 passed, 0 expected fail, 8 skipped (1670 tests; all skips are conditional on symlink privilege). Coverage thresholds unchanged and met |
| Coverage | statements 99.3% (1993/2007), branches 96.13% (1143/1189), functions 99.16% (474/478), lines 99.5% (1824/1833). Thresholds unchanged. |
| `pnpm build` | exit 0 |
| `pnpm test:e2e` | exit 0. 89 passed on the final run (one earlier run of the same code had 1 failure that did not reproduce; cause not identified) |

- There is no expected-failure test. D-B1 (tag text kept C1 and bidi control characters) is fixed in `src/main/library/text.ts` and its regression test is a normal test.
- The 4 skips are file-symlink tests that need a privilege this Windows host does not grant. Unprivileged junction and mocked-`realpath` equivalents run everywhere (`docs/testing/audio-engine-skips-and-expected-fail.md`).

## Runtime evidence (automated, not human listening)

Playwright drives the production build in Electron with synthetic, script-generated fixtures (`tests/fixtures/audio/`):

- WAV, MP3 (silent and tone), FLAC and Ogg FLAC load and play with no media error. `currentTime` advances, pause holds the position, stop resets to 0, and seek moves the position to the slider value.
- `audio-decode.spec.ts` decodes each format in Chromium and checks for a 440 Hz tone of the expected length and level. Garbage bytes are rejected.
- Spectrum pixels are present while a tone plays and disappear when muted or at volume 0, which shows the real graph and analyser are active.
- Playlist progression, shuffle, repeat, reorder, remove, restart persistence, the corrupt `playlist.json` case and a corrupt file inside a selection are covered.
- CSP blocks image sources other than `media://art`. `media://art` is refused as an audio source. The bridge refuses paths and unknown tokens.

**No human has listened to the output.** Automation proves decoding, media element state and analyser activity. It does not prove that sound is audible or correct on speakers. Human gates H.1 (ADR 0006), H.2 (listening), H.3 (visual check of spectrum, waveform and EQ) and H.4 (PR approval) are open.

## Limitations

- **AE-01 (Low).** Metadata is parsed in main with no per-file timeout, size cap or concurrency bound, and covers are read in full before the 2 MiB check. A hostile or very large file can stall `library:open-files` or `playlist:load`.
- **AE-02 (Low), fixed by restriction.** `playlist:load` now accepts only valid local absolute file paths (`src/main/library/local-path.ts`). UNC, Windows device namespace, relative, drive-relative, control-character, empty, oversized and non-string entries are rejected before any `stat`, metadata parse or token issue. A rejected item is dropped silently and a rejected `selectedPath` is treated as a stale selection. **Limitation:** network-hosted tracks (for example UNC shares) are not restored automatically at startup. Full network library support is outside the MVP scope. The restriction applies only to restoration; the Open Files and Open Folder dialogs are unchanged. Security-reviewer confirmation is pending.
- **AE-03 (Low).** The media handler reads the size with `stat` and opens the stream afterwards. A file that changes in between gets a mismatched `Content-Length`.
- **AE-04 (Info).** `media://` applies to the whole default session, and tokens live until the window closes. The Skin Engine must not load untrusted web content in this session.
- **AE-05 (Info).** Licenses are checked (all MIT, see above). `pnpm audit` and `pnpm audit --prod` at HEAD d516392 both exit 0 with "No known vulnerabilities found" (advisory data as of the run).
- **EQ settings are not persisted (spec C4).** No `settings:*` IPC channel exists, so the equalizer resets to Flat on restart.
- **Ogg Vorbis is verified on Windows only.** A real Ogg Vorbis fixture (libvorbis via the dev-only `wasm-media-encoders` 0.7.0, MIT) decodes in Chromium as a 440 Hz tone and plays with advancing `currentTime`. Ogg Opus is not covered, and macOS and Linux decoders are untested.
- **Tag text (AE-06, Info).** After the D-B1 fix, a few cosmetic characters (U+2028, U+2029, U+061C, the Unicode tag block) still pass `cleanText`. Tags render as text, never HTML.
- **Platforms.** Only Windows x64 was tested. macOS and Linux decoders and runtime are not verified, and there is no CI.
- **Graph tests.** Graph unit tests use a fake `AudioContext`. EQ preamp, band and bypass effects on real audio are covered by `tests/e2e/equalizer-audio.spec.ts`, which reads the spectrum canvas (drawn from the real `AnalyserNode`) while a 440 Hz tone plays.
- **`docs/assets.md`** does not exist yet. The fixture license note is in `tests/fixtures/audio/README.md`.

## Manual music-playback test

Prerequisites: Node 24 and pnpm 10, then `pnpm install --frozen-lockfile`. Use your own local MP3, WAV, FLAC and OGG files.

1. Run `pnpm dev` and wait for the window.
2. Click **Open** (or **Add files**) and select one file of each format: MP3, WAV, FLAC and OGG (preferably Ogg Vorbis). Each one should appear with title, artist, album, duration and artwork if it has any.
3. Select a track and click **Play**. Confirm you hear it. Then test **Pause** (sound stops, position holds), **Play** (resumes) and **Stop** (position returns to 0:00).
4. Drag the seek slider. Playback should jump there and the elapsed time should follow.
5. Move the volume slider and check the loudness changes. Click **Mute** (silent, slider keeps its value), then unmute.
6. Playlist:
   - **Next** and **Previous**. Previous restarts the track if more than 3 seconds have played.
   - Let a track finish and check the next one starts automatically.
   - Turn **Shuffle** on and check every track plays once per cycle.
   - Cycle **Repeat** through Off, Track and Playlist and check each behaves as named.
   - Reorder tracks and remove one.
7. Close the app and run `pnpm dev` again. The playlist order, metadata and artwork should be restored.
8. Equalizer:
   - Move single bands and listen for the change.
   - Change the **Preamp**.
   - Toggle **Bypass equalizer** and check the sound returns to flat while the sliders keep their positions.
   - Pick several presets.
   - The EQ resets to Flat after a restart; this is a known limitation.
9. Visualizer: during playback the spectrum and waveform should move with the music. They should stop when paused or when the window is minimized.
10. Native File menu (macOS: use Cmd instead of Ctrl; Exit is Quit in the app menu and on Linux):
    - Open the **File** menu. It should list **Open Files...** (Ctrl+O), **Open Folder...** (Ctrl+Shift+O), **Clear Playlist** and **Exit**.
    - Press Ctrl+O (or choose **Open Files...**) and add some tracks. They should be appended like the in-app Open button.
    - Press Ctrl+Shift+O (or choose **Open Folder...**) and pick a folder with audio files in subfolders. Supported files (MP3, WAV, FLAC, OGG) should be added in natural name order. Cancelling the dialog should change nothing. A folder with no supported audio should show an empty-folder message.
    - With an empty playlist, **Clear Playlist** should be disabled. After adding tracks it should be enabled.
    - Choose **Clear Playlist**. Playback should stop and the playlist should empty. Restart the app and check it stays empty. The item should be disabled again.
    - Choose **Exit**. The app should quit.
11. Corrupt file check: copy any non-audio file and rename it `broken.mp3`, then add it. The app should show an error for that track, not crash, and skip it during automatic progression.

Report what you heard and saw on the PR. Those observations are the input for gates H.2 and H.3.

## Selection behavior (added after manual acceptance testing)
- Importing files or a folder (renderer buttons or File menu) into an empty playlist loads the first track without playing it. Play is enabled once it is ready and the player shows its metadata, artwork and duration.
- Adding files to a non-empty playlist keeps the loaded track. Double-clicking an entry loads and plays it. Clear Playlist unloads the track.
- The selected track is stored as an optional \selectedPath\ in \playlist.json\ (still version 1; older files load) and restored on restart without autoplay. A stale selection falls back to the first track.
- Manual check: import tracks, confirm Play is enabled and nothing plays; double-click a track; add more files; restart and confirm the same track is loaded and paused.

## Pre-merge verification (PR #7, HEAD d516392)
- **Security (selectedPath persistence):** APPROVED_WITH_LIMITATIONS, no Critical, High or Medium. The renderer only handles opaque tokens. A stale or unknown selection falls back to the first track and cannot authorize a path outside the saved item list. Version-1 files without selectedPath load, and the schema is strict. See "Pre-merge verification" in docs/security/audio-engine-review.md.
- **AE-02 status (superseded by the fix above): RESOLVED, confirmed by the focused security review (APPROVED_WITH_LIMITATIONS; residual Info items AE-11 mapped network drives and mounts look local, AE-12 reserved device names, AE-13 two unreachable test assertions).** Original finding: playlist:load does not reject UNC, device (\\\\?\\, \\\\.\\) or relative paths in playlist.json items. A planted entry that ends in an audio extension makes s.stat touch the network on Windows. The attacker needs write access to the user's profile. A proposed fix (reject UNC, device and relative paths on load only) would also drop legitimately chosen UNC files at the next start, so it is a behavior decision for the maintainer and is not applied.
- **Dependency audit:** pnpm audit and pnpm audit --prod both report no known vulnerabilities.
- **Unresolved flaky test:** one E2E run of the final code had 1 failed test out of 89. The failing test was not recorded, the next run passed 89/89, and the cause is unidentified. It is not attributed to the earlier "Render frame was disposed" error, because no evidence links them. Open until reproduced and diagnosed.
- **Human confirmation (reported by the maintainer during manual acceptance testing):** audio playback is audible and equalization works correctly. This is a maintainer report, not an automated result. Gate H.2 (listening) is the maintainer's to close, and H.3 (visual check of spectrum, waveform and EQ) and H.1 and H.4 are still open.
- **Human validation (maintainer, manual acceptance testing):** audible music playback, working equalization and automatic track loading after importing audio files were confirmed. Not confirmed by a human: per-format listening, the visual check of spectrum and waveform (H.3), ADR 0006 review (H.1), double-click to play, adding files while a track is loaded, restoring the selection after restart, File menu parity and Open Folder. The maintainer explicitly authorized the merge of PR #7. Remaining limitations are accepted for the MVP and tracked in `docs/engineering/backlog.md`.
- **Final validation after the AE-02 fix (HEAD plus fix):** typecheck, lint, format:check and build pass; coverage run 119 files, 1662 passed, 8 skipped; e2e 89 passed. The earlier unidentified flaky e2e failure remains unresolved.


