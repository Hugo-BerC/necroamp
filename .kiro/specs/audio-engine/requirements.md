# Audio Engine: Requirements

Authority: `product.md`, `tech.md`, `structure.md`, ADR 0003, 0005, 0006. Assumes Desktop Foundation is merged. Each criterion is testable. "Auto" = automated test, "Human" = human listening or visual check, never claimed by an agent.

## Block A: Core playback
- A1. The "Open" action shows a native file dialog in main, filtered to `.mp3 .wav .flac .ogg`. Auto: handler test with a mocked dialog.
- A2. A selected valid file plays. Auto: E2E with synthetic tone fixtures for each of the four formats where the platform decodes it; unsupported decoders are reported, not assumed. Human: audible output.
- A3. Play, pause and stop change state as `idle -> loading -> playing <-> paused -> stopped`; invalid transitions are no-ops. Auto: reducer unit and property tests.
- A4. Seek sets position within `[0, duration]`, clamped. Auto: property test, plus E2E seek on a Range-served file.
- A5. UI shows elapsed and duration as `m:ss` (or `h:mm:ss`). Unknown duration shows `--:--`. Auto: formatter property test.
- A6. Volume is clamped to `[0,1]`, mute preserves the previous volume. Auto: unit and property tests.
- A7. An unsupported, corrupt, missing or zero-byte file produces a visible, non-crashing error state and, in a playlist, skips to the next track. Auto: fixture tests.
- A8. Existing neutral controls call real playback through a store, not through component-local audio code. Auto: component test with a fake engine.

## Block B: Playlist and metadata
- B1. Multi-select adds files in dialog order. Duplicates allowed. Maximum 5000 entries. Auto.
- B2. Operations: select, remove, reorder (move index), clear. Invariants: length and set of ids preserved by reorder; current track follows its item. Auto: property tests.
- B3. Previous restarts the track if elapsed is over 3 s, else goes to the previous item. Next and auto-advance at track end follow repeat and shuffle rules. Auto.
- B4. Repeat modes `off | track | playlist`. Shuffle yields a permutation with every track once per cycle, with seed injection for tests. Auto: property test.
- B5. Metadata (artist, title, album, duration) is read in main. Missing tags fall back to the file name and "Unknown artist". Tag strings are length-bounded and control characters stripped. Auto: fixtures with tags, without tags, and corrupt.
- B6. Embedded artwork is extracted in main, limited to PNG, JPEG or WebP up to 2 MiB, shown when present, and a placeholder otherwise. Auto: fixture tests.
- B7. Playlist persists to the main-owned `userData` file with a Zod schema and `schemaVersion`. Corrupt or unknown-version files load as empty without crashing. Missing files stay listed and show as unavailable. Writes are atomic (temp file then rename). Auto.
- B8. New dependencies are maintained, permissively licensed (MIT, Apache-2.0, BSD, ISC), the version is resolved from the registry at install, and the license is recorded in `docs/assets.md` or the dependency record. Review item, not auto.
- B9. No network calls. Auto: tests assert no `net` import and CSP `connect-src 'none'`.

## Block C: DSP and visualization
- C1. Ten bands with centers 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k and 16 kHz: lowshelf at the first, highshelf at the last, peaking between. Gain clamped to ±12 dB. Auto: mapping property tests.
- C2. Preamp clamps to ±12 dB. Bypass sets all band gains to 0 and preamp to 0 dB without changing stored settings. Auto.
- C3. Presets (Flat, Rock, Pop, Jazz, Classical, Bass Boost, Treble Boost, Vocal) are pure data validated by schema. Selecting one sets bands. Editing a band marks the preset "Custom". Auto.
- C4. EQ settings persist locally through main-owned settings and reload. Invalid stored data falls back to Flat. Auto.
- C5. Graph: element source -> 10 biquads -> preamp gain -> master gain -> analyser -> destination. Auto: graph-construction unit test with a fake `AudioContext`; E2E with a real context shows non-zero analyser data when a tone plays.
- C6. Spectrum and waveform are drawn from `AnalyserNode` on `requestAnimationFrame`, pause when hidden or not playing. Auto: scheduler test with fake timers. Human: visual quality.
- C7. Lifecycle: one `AudioContext`, created or resumed on a user gesture, nodes disconnected and the element released on dispose and on window unload. Auto: cleanup test counts disconnects and cancelled frames.
- C8. No `AudioWorklet` and no custom DSP unless a later ADR justifies it.

## Security and boundaries
- S1. Media is served only by `media://track/<token>` and `media://art/<token>` for tokens issued by main. A forged, unknown, path-like, traversal (`..`, encoded separators), wrong host, wrong extension or non-regular file request returns `404`. Auto: handler and property tests.
- S2. Range requests return correct `206`, `Content-Range` and bytes; invalid ranges `416`. Auto.
- S3. The renderer can obtain no path. IPC payloads to the renderer contain tokens and metadata only. Auto: schema tests reject path fields.
- S4. Every new IPC channel is a constant in `src/shared/ipc/channels.ts`, uses `registerHandler`, strict Zod request and response, sender validation. Auto: existing sender tests extended per channel; bridge key-set test.
- S5. `contextIsolation`, `sandbox`, `webSecurity` stay on and the CSP builder test asserts the only differences from ADR 0003 are `media-src media://track` and `img-src 'self' media://art`. Auto.
- S6. Playback state, audio processing and visual presentation are separate modules: state store (pure), audio engine adapter, visual components. Components read the store only, so a future skin replaces presentation without touching the other two. Review item.

## Out of scope
Gapless playback, crossfade, `.m3u` import and export, network streams, tag editing, Skin Engine, NecroGit, packaging.


> As-built update: see [as-built.md](as-built.md) for deviations, deferred items (C4/C.3) and final status.
