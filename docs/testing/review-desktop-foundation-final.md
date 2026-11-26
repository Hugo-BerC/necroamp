# QA review: desktop-foundation-final
- Scope: `66f9f7f...HEAD` (HEAD `10dfc3f`), per `docs/release/review-desktop-foundation-final-diff-scope.md`.
- Reviewer: qa-engineer. Only this file was written. Nothing installed, committed or pushed.
- Standard: "Testing" section of `.kiro/steering/tech.md`.

## Command results (this run, Windows x64)
| Command | Result |
|---|---|
| `pnpm.cmd typecheck` (`tsc -b`) | PASSED, no diagnostics |
| `pnpm.cmd lint` (`eslint .`) | PASSED, no diagnostics |
| `pnpm.cmd test` (`vitest run`) | PASSED: 52 files, 768 passed, 2 skipped |
| `test:coverage`, `test:e2e`, `build`, `format:check` | Not run in this review (not requested). Latest recorded results are in `docs/testing/desktop-foundation-coverage-and-gaps.md` (E2E 35 passed; coverage thresholds reported as passing after defect 0001 handling). Not independently re-verified here. |

## Assessment against tech.md "Testing"
- Vitest unit and component tests: present for main, preload, shared and renderer. Coverage of pure logic was recorded at about 99% statements and 96.6% branches in the Block B note.
- fast-check: 8 `*.property.test.ts` files cover origin check, CSP builder, IPC contract and `registerHandler`, lifecycle, `resolveAppPath` (path escape), preload API, renderer bridge adapter and contrast.
- Required property areas (equalizer mapping, skin manifest validation, playlist operations, metadata normalization, time formatting): no module exists yet, so no test exists. This is expected for Desktop Foundation and is not a defect now. Each area is mandatory when its feature lands.
- Playwright Electron smoke: launch, security settings, navigation guard, sender checks and accessibility are covered. "Load file", "play" and "change skin" cannot exist before the player and skin features.
- Determinism and offline: no network or token use found in the recorded design. The Block B note records no fixed sleeps in assertions, a per-test temporary user data directory and a fail-fast stale `out/` check. The two skips depend on symlink privilege (see m-1).

## Findings
No blockers.

### Major
- **M-1 (owner: human or main session, `.kiro/steering/tech.md`)**: The diff modifies authoritative steering (new exception E-ESM-1). It is in no agent's scope. I confirm only that it matches ADR 0002 section 6 as cited. Record explicit human approval before merge.
- **M-2 (owner: desktop-engineer, with the human deciding ownership)**: `eslint.config.mjs` and `prettier.config.mjs` are in no agent's scope, and `tests/lint-rules/boundary-rules.test.ts` depends on the ESLint config. Future edits to boundary rules have no accountable owner. Assign an owner.

### Minor
- **m-1 (owner: qa-engineer)**: Two real-symlink tests are skipped on this Windows host. Symlink escape is a security property (tech.md skin and path rules). Until a Linux or macOS run executes them, that coverage is unverified. Windows with Developer Mode would also run them.
- **m-2 (owner: qa-engineer)**: There are no visual snapshots because no approved baseline exists. Add per-platform baselines once the art-director approves the shell.
- **m-3 (owner: release-engineer)**: GitHub CI is absent. The cross-platform matrix (macOS, Linux, Windows) in tech.md CI/CD is therefore unexecuted. macOS and Linux install, build, unit and E2E remain NOT VERIFIED, including the darwin keep-alive branch of the close test and Linux virtual display prerequisites.
- **m-4 (owner: qa-engineer)**: E2E uses axe in `setLegacyMode(true)` and casts a missing Electron 45.5.0 type. Both are acceptable workarounds. Revisit on Electron upgrade.
- **m-5 (owner: qa-engineer)**: Audio decode per format (MP3, WAV, FLAC, OGG) is untestable until an audio engine exists. Add decode tests with the audio feature.
- **m-6 (owner: security-reviewer)**: Not a test defect. The diff scope report lists a binary PNG, `docs/engineering/screenshots/m7-preview-production-shell.png`, with no recorded provenance entry in `docs/assets.md` that I could confirm in this review. Confirm that it is covered.

## Verdict
Blockers: 0. Majors: 2 (process and ownership, not test failures). Minors: 6.
