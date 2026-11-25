# Electron end-to-end tests and fixtures

Steering: `.kiro/steering/tech.md` "Testing" and "Audio engineering rules" (format verification). Verify every Playwright and Electron API name in the official documentation before use. This file describes intent, not exact signatures.

## Playwright Electron setup

- Playwright's Electron support launches the app's main entry and returns an application handle with access to windows. Check the Playwright documentation (Electron section) for the launch options and how to get the first window.
- Test against the built output (electron-vite build) or the packaged app. The entry path comes from the project config. Do not hardcode machine paths.
- Run order in CI: build first, then `pnpm test:e2e`. If that script does not exist, request it from desktop-engineer.
- Linux CI usually has no display. Use whatever virtual display approach release-engineer configures. Record this as a platform dependency, not a test change.

### Isolation

1. Give every test run a fresh temporary user-data directory (passed through the app's supported mechanism, confirmed with desktop-engineer). Delete it in teardown.
2. Set no GitHub token. GitHub features must appear as signed out. Block outbound network in the test environment where possible, and assert that the smoke path makes no request (observe requests on the window if the documented Playwright API supports it).
3. Close the app in a teardown that also runs when the test fails or times out.
4. Do not share state between specs. Each spec launches its own instance, or uses one worker-scoped instance with a documented reset.

### Smoke scenarios (required)

| Scenario | Steps | Observable pass condition |
|---|---|---|
| Launch | Start app | A window opens, main landmark visible, no uncaught page error |
| Load file | Provide a fixture through the app's file-open path | Track appears in playlist with normalized title and duration |
| Play | Activate play | Playback state indicates playing; position advances (wait on state with a bounded timeout, not a fixed delay) |
| Change skin | Select the second bundled skin | Skin identifier in the UI state changes and a skin-owned element (for example a CSS custom property or labeled control) differs |

File dialogs are native and not drivable. Ask desktop-engineer for a test seam that passes a path through the same validated IPC route (for example an environment variable read only in test builds). If none exists, report the gap and do not bypass IPC validation.

Audio output in CI may have no device. Assert on state and on analyser or position values the app exposes, not on sound.

### Accessibility and visual specs

- Accessibility: run an automated checker (for example axe through its Playwright integration, if the user adds it as a dev dependency) on each main view and for both bundled skins. Fail on serious or critical findings. Automated checks do not replace keyboard and contrast review (see the typescript-standards accessibility checklist).
- Visual snapshots: pin viewport and device scale factor, disable animations through a test flag or reduced-motion preference, mask volatile regions (time, visualizer canvas). Baselines are per OS. Do not accept a changed baseline without a reviewer reading the diff.

## Fixture rules

- Location: `tests/fixtures/` with subfolders `audio/`, `skins/`, `github/`, `metadata/`.
- Small: audio fixtures a second or less, mono or low rate, a few tens of kilobytes. Large-limit tests generate data in memory or in a temp directory.
- License-clean: generate audio synthetically (sine, noise, silence) with a documented method, or use files with a compatible license. No commercial music, no content from other players' skins. Each fixture has an entry in `docs/assets.md`; QA requests the entry from art-director with author, source and license.
- Deterministic: no timestamps, host names or user names embedded. Tags in fixtures are fixed strings.
- Registry: keep `tests/fixtures/README.md` listing each fixture, purpose, how generated, license, expected decode result per platform.
- Negative fixtures are labeled `bad-*` or `malicious-*` and are small text or JSON. Corrupt audio is made by truncating a valid fixture, with the method documented.

### Per-format coverage

| Format | Fixture | Checks |
|---|---|---|
| MP3 | short tone | decodes, duration within stated tolerance |
| WAV | short tone | decodes, sample count exact |
| FLAC | short tone | decodes, matches WAV reference within tolerance |
| OGG | short tone | decodes, duration within stated tolerance |
| Corrupt (truncated) | each format | typed failure, no crash, playlist keeps working |

Duration tolerance for lossy formats is stated per test (encoder padding differs). Record which platforms decode which formats in `docs/testing/` and mark any platform gap. Do not promise a format that fails on a platform.

### Audio regression comparison

- Compare analyzed features (RMS, peak, band energy, spectral centroid) or offline-rendered samples against a stored reference with an explicit absolute or relative tolerance written next to the assertion.
- Equalizer: render a known tone through a band at boosted and neutral settings; assert the level change at the band frequency is within tolerance and other bands change less. Do not assert exact floating point samples across platforms.
- Reference data is regenerated only by an explicit, reviewed step.

## Cross-platform matrix note

Maintain `docs/testing/platform-matrix.md`: OS and architecture (Windows x64, macOS arm64 and x64, Linux x64), which suites run where, known gaps (no display, no audio device, symlink privilege, native dialogs). Mark each cell VERIFIED (run observed), DOCUMENTED (stated by docs) or ASSUMED.
