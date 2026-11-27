# Audio Engine Gate C review (DSP and visualization)

Branch `feature/audio-engine`, working tree (Block B and C are uncommitted; only Block A is in `main...HEAD`). Nothing was committed or pushed. No production source was edited.
Authority: `.kiro/steering/tech.md` "Testing". All results below are automated. No human listened to anything.

## Verdict: CHANGES_REQUESTED

## Results (Windows, Node v24.22.3, pnpm 10.34.9)

| Check                     | Result                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`          | PASS                                                                                                                                                         |
| `pnpm lint`               | FAIL, 10 errors (`no-restricted-syntax`, "Audio and animation globals are not allowed in M0-M1 renderer code")                                              |
| `pnpm format:check`       | PASS                                                                                                                                                         |
| `pnpm test:coverage`      | FAIL, 2 failed / 1415 passed / 1 expected fail / 4 skipped (1422), 108 files. Failures: `tests/static/renderer-policy.test.ts` (2)                           |
| Coverage thresholds       | No threshold violation reported. Statements 99.3% (1993/2007), Branches 96.13% (1143/1189), Functions 99.16% (474/478), Lines 99.5% (1824/1833)              |
| `pnpm build`              | PASS                                                                                                                                                         |
| `pnpm test:e2e`           | FAIL, 3 failed / 73 passed (5.4 min). A rerun of lifecycle and playback specs showed 4 failed / 20 passed, the 4th a flaky "Render frame was disposed"       |

Coverage was read with `vitest run --coverage --coverage.reportOnFailure` because the standard command suppresses the report when tests fail. Vitest exited non-zero only because of the two policy tests.

## Findings

1. **Lint and static policy still forbid Block C code (blocker).** ESLint config and `tests/static/renderer-policy.test.ts` ban `AudioContext`, `AnalyserNode`, `requestAnimationFrame` in all of `src/renderer` ("M0-M1"). Offenders: `audio-engine.ts`, `audio-processing.ts`, `graph.ts`, `fake-audio-context.test.support.ts`, `visual-loop.ts`. Owner: desktop-engineer (ESLint config, `eslint.config.*`) with qa-engineer for the policy test. Fix: scope an allow-list to `src/renderer/audio/**` for those globals and keep the ban elsewhere (features must not touch them). I did not edit the existing policy test, because loosening it is a decision for the owners and must not lose the ban for the rest of the renderer.
2. **E2E `playback.spec.ts:131` stale (volume and mute).** Repro: `pnpm test:e2e tests/e2e/playback.spec.ts -g "volume"`. After Block C, `audio-engine.ts` sends volume and mute to the master `GainNode` and pins `element.volume = 1` and `element.muted = false` (lines 89-96), so the test's `source(page).volume` toBeCloseTo(0.3) reads 1. Either the test must observe the gain (needs a test hook) or the contract changed unannounced. Owner: qa-engineer (test) and audio-engineer (confirm intended contract).
3. **E2E `lifecycle.spec.ts:116` (800x600 layout).** A region is 12.14 px high, expected over 20. The EQ region regressed at the minimum window size. Owner: frontend-engineer. Repro: `pnpm test:e2e tests/e2e/lifecycle.spec.ts -g "six non-overlapping"`.
4. **E2E `lifecycle.spec.ts:157` (Tab order).** The new `eq-preset-select` is now in the tab sequence, and the test's expected list lacks it (received has it, expected has "Sign in with GitHub" at that position). Owner: qa-engineer updates the expected order once frontend-engineer confirms DOM order is intended.
5. **Flaky e2e: "Render frame was disposed before the request completed"** during the second run. Not reproduced in the first run. Owner: qa-engineer. Unresolved.
6. **No e2e for Block C.** No Playwright test exercises a real `AudioContext`, EQ change, bypass, or a non-blank spectrum/waveform canvas against `tone.mp3`/`tone.wav`. The graph tests use a fake `AudioContext`, so real Web Audio node behavior in Chromium is unverified. Owner: qa-engineer (follow-up). Not a blocker under the stated criteria, which are already failing.
7. **`.ogg` coverage is Ogg FLAC only.** `tone.ogg` and `tagged.ogg` are OggFLAC. Ogg Vorbis decode is not verified by automation (documented in `tests/fixtures/audio/README.md`). Owner: audio-engineer to obtain a licence-clean Vorbis sample, with art-director for the `docs/assets.md` entry.

## Tests added by this gate

Both files were writable, so no blocker content is needed.

- `src/shared/audio/eq.property.test.ts` (12 properties): gain, preamp, Q and frequency clamping (total, in range, idempotent, monotonic, below Nyquist), `dbToLinear` finite and bounded, `normalizeGains` always ten finite gains, `editBand` changes only the target band and sets Custom, invalid indexes ignored, unknown presets ignored, bypass yields flat gains without mutating stored settings, `sanitizeEqSettings` never throws and is idempotent.
- `src/shared/audio/visualizer-data.property.test.ts` (4 properties): bar edges monotonic and bounded, bar values in [0, 1], waveform min <= max within [-1, 1], peak level in [0, 1].
- Result: 16 tests pass.

## Coverage of required areas

| Area                            | Evidence                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| EQ mapping and clamping         | `eq.property.test.ts` (new), `eq.test.ts` (16)                                                        |
| EQ config, presets, store       | `eq.test.ts`, `eq-store.test.ts` (10)                                                                 |
| Visualizer data                 | `visualizer-data.test.ts` (8), property file (new), `draw-visualizer.test.ts`, `visual-loop.test.ts`  |
| Graph build, teardown, cleanup  | `graph.test.ts`, `audio-processing.test.ts`, `audio-engine.processing.test.ts`, `player-cleanup.integration.test.tsx` (fake AudioContext) |
| EQ and visualizer UI            | `equalizer.test.tsx` (6), `visualizer.test.tsx` (9)                                                   |
| OGG and non-silent MP3 fixtures | present (`tone.ogg`, `tone.mp3`, rms about 0.124), used by `tests/audio/tagged-fixtures.test.ts` and `tests/e2e/audio-decode.spec.ts` (Block B added them) |

## Gaps and limits

- Automated playback verification covers decode and media element state on Windows only. No human listening happened. macOS and Linux decoders are untested.
- Web Audio behavior is tested against mocks, not a real graph (finding 6).
- Existing tests and coverage thresholds were not weakened or deleted.
