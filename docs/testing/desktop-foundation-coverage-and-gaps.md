# Desktop Foundation: coverage and gap note (Block B)

Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0. Evidence is from fresh runs in this block.

## Results

| Command | Exit | Result |
|---|---|---|
| `pnpm.cmd typecheck` | 0 | clean |
| `pnpm.cmd lint` | 0 | clean |
| `pnpm.cmd format:check` | 0 | clean |
| `pnpm.cmd test` (twice, same result) | 0 | 51 files, 764 passed, 3 expected-fail (known defects), 2 skipped |
| `pnpm.cmd test:coverage` | **1** | tests pass; threshold failure on `resolve-app-path.ts` branches 93.84% (defect 0001) |
| `pnpm.cmd build` | 0 | out/main, out/preload, out/renderer |
| `pnpm.cmd test:e2e` | 0 | 35 passed, 0 failed, 0 skipped, 1 worker |

## Coverage (V8)

Statements 99.08% (544/549), branches 96.57% (282/292), functions 100% (156/156), lines 99.78% (472/473).
Global thresholds (80/80/80/75) pass. Per-file 95% gates: `src/shared/ipc/**`, `register-handler.ts`,
`sender-validation.ts`, `trusted-origins.ts`, `csp.ts` pass. `resolve-app-path.ts` fails on branches
(four unreachable defensive branches, see defect 0001). Thresholds were not changed.

## Skipped and expected-fail

- 2 skipped: the real-symlink tests (`tests/integration/app-protocol.integration.test.ts` and `src/main/protocol/app-protocol.test.ts`) need symlink creation privilege, which this Windows host lacks. They stay in the suite and run on
  CI runners with the privilege (Linux and macOS, or Windows with Developer Mode). Privileges were not changed.
- 3 expected-fail (`it.fails`): R8.5, R8.8, R8.9, one per defect 0002 to 0004. They flip to failures when the
  owner fixes the UI, which prompts converting them to normal tests.

## Property areas (tech.md "Testing")

| Area | Status |
|---|---|
| Equalizer mapping and clamping, skin manifest, playlist, metadata, time formatting | Not applicable yet: no such module exists in the Desktop Foundation. These areas must get tests with their features. |
| Foundation modules | origin check, CSP builder, IPC parser and `registerHandler`, platform policy, `resolveLoadTarget`, menu builder, preload API, `resolveAppPath` (posix and win32), contrast function, renderer bridge adapter |

## E2E notes

- Production build only: `electron <repo root>` with `ELECTRON_RENDERER_URL` and `ELECTRON_RUN_AS_NODE` removed and
  `NECROAMP_E2E_USER_DATA` set to a fresh temporary directory per test. `global-setup.ts` fails fast when `out/` is missing or older than `src/`.
- No fixed sleeps in assertions. Waits are `expect.poll` and event promises. Bounded timers exist only as upper limits
  (exit within 5 s, 8 s forced-kill in teardown).
- Sub-frame negative case: the navigation guard blocks any foreign sub-frame load, and a script-created frame gets no
  bridge, so a real sub-frame IPC call cannot be produced. The sub-frame rule (`parent !== null`) is covered by the
  unit and integration tests. Foreign top frame and unregistered trusted-origin contents are covered end to end.
- Electron's `Target.createTarget` is unsupported, so `@axe-core/playwright` runs in `setLegacyMode(true)`. The shell has no iframe, so this scans the whole document.
- `getLastWebPreferences` is missing from the Electron 45.5.0 type definitions; the test casts it.
- Visual snapshots are not part of this block (no approved baseline; per-platform baselines needed).

## Platform gaps

| Platform | install | build | unit | e2e |
|---|---|---|---|---|
| Windows x64 | PASSED (prior block) | PASSED | PASSED | PASSED |
| macOS | NOT VERIFIED (no runner) | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED (darwin keep-alive branch of the close test unexecuted) |
| Linux | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED (needs a virtual display, sandbox prerequisites) |

Audio decode per format (MP3, WAV, FLAC, OGG) is not testable until an audio engine exists.
