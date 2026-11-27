# Gate A review: Audio Engine Block A (core playback)

Reviewer: qa-engineer. Branch: `feature/audio-engine`. Host: Windows, Node 24, pnpm 10, Electron 45.
Verdict: **APPROVED**. Every mandatory check passes. Supersedes the earlier CHANGES_REQUESTED verdict.

## Validation (final run, after the D-A4 fix landed)

| Check | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `pnpm format:check` | pass |
| `pnpm test:coverage` | pass: 73 files, 979 passed, 4 skipped, 0 failed. Statements 98.83% (934/945), branches 97.24% (529/544), functions 98.75% (237/240), lines 99.16% (836/843). Thresholds unchanged. |
| `pnpm build` | pass |
| `pnpm test:e2e` | pass: 49 passed, 0 failed |

Before the audio-engineer finished D-A4, one run failed with "Expect test to fail" on the old `it.fails` pin, which
meant the fix was in and the test was still marked as an expected failure. The test is now a normal passing regression test.

## Defects

| Id | Owner | Status |
|---|---|---|
| D-A1 | desktop-engineer | resolved: one `registerSchemesAsPrivileged` call with both schemes |
| D-A2 | frontend-engineer | resolved: `a11y.spec.ts` passes |
| D-A3 | frontend-engineer | resolved: `lifecycle.spec.ts` passes |
| D-A4 | audio-engineer | resolved: regression test passes |
| D-A5 | audio-engineer | resolved: `player-store.test.ts` covers `NotAllowedError` showing paused |
| D-A6 | qa-engineer | resolved, see below |
| N-1 | necro-architect | open, low: ADR 0006 item 7 still lists `img-src 'self' media://art` |
| P-1 | orchestrator | open, process: Block A is uncommitted |

## D-A6 resolution

Production CSP (`src/main/security/csp.ts`, unchanged) has `img-src 'self'` and `media-src media://track`.
`media://art` stays disallowed until artwork support is implemented and explicitly authorized.

In `tests/e2e/smoke-security.spec.ts`:
- The frozen oracle now reads `img-src 'self'`. The exact-match header and meta CSP tests still compare the whole policy.
- New test "allows only self for images and only media://track for media" parses the live header. It requires
  `img-src` to equal `['self']` and `media-src` to equal `['media://track']`. It also asserts that `media://art`,
  `media:`, `data:`, `blob:`, `http:`, `https:`, `file:` and `*` are absent from `img-src`, and that `media-src` has none of
  `media://art`, `blob:`, `data:`, `http(s):`, `file:` or `*`.
- No security assertion was weakened. No production source was edited.

ADR 0006 item 7 is stale on `media://art` (it predates the CSP decision). I cannot edit `docs/adr`; the architect should amend it.

## Gaps
- OGG playback is not verified with a decodable fixture.
- The MP3 fixture is silent: decoding is proven, signal content is not.
- Symlink escape tests are skipped on Windows and must run on Linux and macOS.
- Only Windows was exercised.
- Automated playback only. Human listening (tasks.md H.2) is not performed.