# M2/M3 acceptance report (Step 7)

Branch: feature/desktop-foundation. No commit, push, dependency, pin, lockfile or steering/agent/skill/workflow change. `pnpm-lock.yaml` SHA-256 unchanged: E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659.

## Security verdict

APPROVED (`docs/security/m2-m3-focused-review.md`, second pass; first pass `docs/security/m2-m3-security-review.md` also APPROVED). No Critical, High or Medium findings. DEFECTS_CONFIRMED: no. Both reviews are code reading. Electron 45.5.0 documentation was unreadable to the reviewer, so every Electron behavior claim is labeled ASSUMED. No test or runtime was run by the reviewer.

## Findings by severity

All are notes, none a confirmed defect.

- Low: S-1 (`parent === null` does not prove `frame === sender.mainFrame`; no escalation, optional hardening). S-2 (MIME and extension allow-list use the requested name, not the real path; containment still holds).
- Info: S-3 (production CSP needs reviewed changes for audio, skins, Shiki). S-4 (extension allow-list only `.html .js .css .json`). S-5 (failed root `realpath` is cached, all requests 404). S-6 (`realpath`/`stat`/`readFile` TOCTOU, accepted, first-pass F-3). S-7 (`setDisplayMediaRequestHandler` unset; add E2E check). S-8 (guards also attach to DevTools contents in dev). S-9 (no `Referrer-Policy` or `Permissions-Policy` on protocol responses). S-10 (no renderer or `index.html` yet). S-11 (two real-symlink tests skip on Windows, accepted, unchanged).

## IPC sender validation decision (F-5)

Accepted: registered-sender identity check, `senderFrame.parent === null`, and exact-match trusted origin, with the frame read synchronously at call time and failing closed on null, missing parent or throwing getter. Judged equivalent in effect to `senderFrame === sender.mainFrame` for this threat model. The origin check must stay. Conditions: explicit registration of future windows, no remote origin in the trusted set, all handlers via `registerHandler`, exact-match origin test. Recorded in ADR 0005, section "Addendum: sender-frame validation (F-5)". Electron 45.5.0 member names, types and documentation statements are now checked (ADR 0005 "Technical rationale" and `docs/architecture/electron-api-verification.md`). Runtime behavior stays unverified until E2E.

## Finding dispositions (human decision, documentation closure)

Canonical review: `docs/security/m2-m3-security-review.md` (F-1 to F-8). Supporting: `docs/security/m2-m3-focused-review.md` (S-1 to S-11). The Findings by severity list above uses the S ids of the focused review.

| ID | Severity | Disposition |
|---|---|---|
| F-1 | Medium | Corrected: `acquireSingleInstance` drops `second-instance` while `app.isReady()` is false (`src/main/lifecycle/single-instance.ts`). Regression test "ignores second-instance while the app is not ready". Accepted. |
| F-2 | Low | Corrected: `RESERVED_DEVICE_NAME` rejects Windows device names (`con.js`, `nul.css`, `com1.js`) in `src/main/protocol/resolve-app-path.ts`. Regression tests in `resolve-app-path.test.ts`. Accepted. |
| F-3 | Low | Accepted temporarily, not resolved. Tracked in `docs/engineering/backlog.md` with preconditions, mitigations, residual risk, proposed handle-based mitigation and its limits. Mandatory reassessment before the first public release. |
| F-4 | Info | Accepted. Dev CSP `unsafe-inline` reduction at T7.6. |
| F-5 | Info | Accepted. Rationale and Electron 45.5.0 references in the ADR 0005 addendum. Optional S-1 hardening is a human decision. |
| F-6 | Info | Accepted, no action. |
| F-7 | Info | Accepted. Fuses, ASAR integrity and devTools at the packaging review. |
| F-8 | Info | Accepted. Runtime checks at T7.0 and E2E (`'self'` vs `app://renderer`, module scripts without `corsEnabled`, sandboxed preload with bundled Zod, meta CSP in built HTML). |

## Corrective changes

The earlier version of this report said no source or test changed. That was inconsistent with the working tree. In the documentation closure step the files were read and show the F-1 and F-2 corrections and their regression tests (paths above). Whether those edits were made before or during the review steps is not recorded in the hand-offs available to this step. The corrections are accepted by the human. The closure step made no source, test, dependency or lockfile change; it changed documentation and the spec status files only. The test counts below are the last recorded run and were not re-run in the closure step.
## Final validation (this step, one run each, pnpm.cmd, non-watch)

| Command | Exit code | Result |
|---|---|---|
| `pnpm.cmd typecheck` | 0 | `tsc -b` clean |
| `pnpm.cmd lint` | 0 | `eslint .` clean |
| `pnpm.cmd test` | 0 | Vitest 36 files passed (36); 542 passed, 2 skipped (544 total) |
| `pnpm.cmd format:check` | 0 | all matched files use Prettier style |

Same counts as before (542 passed, 2 skipped, 36 files). The two skips are the accepted platform-limited real-symlink tests (one in `src/main/protocol/app-protocol.test.ts`, one in `tests/integration/app-protocol.integration.test.ts`), unchanged. Documentation files written after the format run are Markdown only; `prettier --check` was not re-run after them (no re-run requested; Markdown is not in the checked set if `.prettierignore` excludes it, which was not verified).

## M2/M3 implementation acceptance status

- **M2: IMPLEMENTED - INTEGRATION PENDING.**
- **M3: IMPLEMENTED - INTEGRATION PENDING.**
- This is implementation acceptance (code, unit, property and fake-based integration tests, code-reading security review). It is not whole-application runtime acceptance.
- Ticked in `tasks.md`: T2.1 to T2.5, T3.1 (implementation and tests). T2.0, T2.8 and T3.4 are ticked in the closure step for these reasons:
  - T2.0: `docs/architecture/electron-api-verification.md` exists with the five evidence levels per API. Typings and version-pinned documentation source were read; the rendered electronjs.org pages gave no content; some APIs rely on typings JSDoc only; runtime is not exercised.
  - T2.8: the human accepted `docs/security/m2-m3-security-review.md` as the deliverable. It covers window, CSP, protocol, navigation, permissions, single instance and shutdown, and logging, with zero blockers. Crash-handler and user-data override internals were not reviewed in depth and go to T8.3.
  - T3.4: the necro-architect contract review is in the ADR 0005 addendum (ACCEPT, no blockers) and the security review is the canonical file.
- Left open on purpose (integration dependent): T2.6 (composition root, needs T7.0), T2.7 (meta CSP plugin, V5 in built HTML at T7.0), T3.2 and T3.3 (need T4.2 and T7.x: real wrong-sender behavior, sandboxed preload with bundled Zod). M4 to M8 tasks are untouched.
- No M2/M3 PASSED status is claimed. PASSED needs the runtime and build tasks above.
## Deferred integration checks (not executed, not claimed)

Electron runtime integration, packaged CSP, sandboxed preload execution with bundled Zod, E2E (wrong-sender, subframe, display-media denial), real symlink and NTFS realpath, fuses and ASAR, macOS and Linux. Details and task mapping: `docs/engineering/m2-m3-deferred-runtime-validation.md`. M6 and M7 requirements are preserved unchanged. M4 and M5 were not started.

## Agents used

Per the hand-off messages: security-reviewer produced both reviews and modified no source. The fix and fix-tests steps ran and reported no changes. desktop-engineer and qa-engineer produced the earlier M2/M3 code and tests (before this workflow step); in this step they changed nothing. wf-coder (this step) changed only documentation. This report cannot verify agent activity beyond those hand-offs.

## Skills loaded

electron-security was requested for the security reviewer. Whether it actually loaded is not shown in the hand-off, so it is not confirmed here. The documentation closure step loaded `electron-security` and `typescript-standards`.

## Git status (list from the earlier step; the closure step added `docs/architecture/electron-api-verification.md` and edited `backlog.md`, ADR 0005, `design.md`, `tasks.md` and this report; nothing committed)

```
 M .kiro/specs/desktop-foundation/tasks.md
 M docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md
 M electron.vite.config.ts
 M tsconfig.renderer.json
?? docs/architecture/tech-md-amendment.md
?? docs/engineering/m2-m3-acceptance-report.md
?? docs/engineering/m2-m3-deferred-runtime-validation.md
?? docs/requirements/
?? docs/security/m2-m3-focused-review.md
?? docs/security/m2-m3-security-review.md
?? src/main/index.ts
?? src/main/ipc/  src/main/lifecycle/  src/main/logging/  src/main/protocol/  src/main/security/  src/main/window/  src/preload/
?? src/shared/ipc/{app-info,channels,index,ipc-contract.property,necroamp-api,result}*.ts (new files)
?? tests/integration/  tests/static/
```

Nothing committed.
