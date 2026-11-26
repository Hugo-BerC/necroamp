# Dispositions: desktop-foundation-final quality findings (V-1 to V-16)

Source: `docs/architecture/review-desktop-foundation-final-verdict.md` (APPROVE WITH FIXES, 0 blockers, 2 major, 14 minor after deduplication; the "16 quality findings" are V-1 to V-16). Reconciliation branch `docs/post-merge-reconciliation`, base `main` 6f81009. See `docs/engineering/incident-pr5-merge-authorization.md` for why this reconciliation exists.

Disposition values: FIXED (evidence), ACCEPTED (rationale), BACKLOG (tracked in `docs/engineering/backlog.md`, section "Desktop Foundation quality findings").

| ID | Sev | Disposition | Evidence or rationale |
|---|---|---|---|
| V-1 | Major | FIXED (record) | E-ESM-1 is a previously accepted technical decision (ADR 0002 section 6, `m0-m1-acceptance-report.md` Gate 1). Recorded in the incident document, "E-ESM-1 record". Technical acceptance only, not a merge authorization. No fresh human confirmation was obtained before the merge. |
| V-2 | Major | FIXED (record) | Owner is the top-level orchestrator, necro-architect reviews dependency-boundary rules: `docs/engineering/shared-ownership-policy.md` section 5. Awaiting human confirmation of the assignment. No permission widened. |
| V-3 | Minor | ACCEPTED | T7.6 runtime evidence (`docs/release/desktop-foundation-dev-runtime-validation.md`) showed dev `script-src` and `style-src` `'unsafe-inline'` are both needed. Retained by explicit human decision. Production CSP unchanged, no `unsafe-eval`. |
| V-4 | Minor | BACKLOG | No fuses or `electron-builder.yml`; F-3 and F-7 reassessment before first public release. |
| V-5 | Minor | BACKLOG | `.github/workflows` absent. macOS and Linux NOT VERIFIED. |
| V-6 | Minor | BACKLOG | Navigation guards allow any same-origin URL. Revisit with routing or Skin Engine. |
| V-7 | Minor | FIXED | Journal lives at `docs/kiroween/kiro-journal.md`. `.kiro/steering/kiroween.md` (Kiro usage table) now names that path. `tasks.md` T8.5 also corrected. |
| V-8 | Minor | BACKLOG | `package.json` scripts: dev build typecheck lint format format:check test test:coverage test:e2e. No `package`. Accepted until `electron-builder.yml` exists; add with `--publish never`. |
| V-9 | Minor | FIXED | Actual code: folders `features/visualizer` and `features/skins`; region ids `visualization` and `skin-selector` (`src/renderer/app/shell-layout.ts`); hook at `src/renderer/app/use-app-info.ts`. `design.md` tree corrected (folders, hook file). The spec text already placed `useAppInfo` in `app/`, which matches. `structure.md` already used `visualizer` and `skins`. |
| V-10 | Minor | BACKLOG | `window.necroamp` ambient declaration lives in `src/preload/necroamp-window.d.ts`. Type-only coupling. |
| V-11 | Minor | FIXED | `docs/` holds `adr architecture design engineering kiroween release security testing`. `.kiro/steering/structure.md` target layout line updated and notes that `docs/assets.md` does not exist yet. |
| V-12 | Minor | BACKLOG | Two real-symlink tests skipped on this Windows host. Needs Linux, macOS or Developer Mode run. |
| V-13 | Minor | BACKLOG | No visual snapshot baselines until art-director approval. |
| V-14 | Minor | ACCEPTED | axe in `setLegacyMode(true)` plus a type cast for a missing Electron 45.5.0 type. The reviewers called it acceptable. Revisit on Electron upgrade. |
| V-15 | Minor | ACCEPTED | Not a defect. Audio decode and property tests become mandatory when each feature lands (`tech.md` Testing). Tracked as a trigger in the backlog. |
| V-16 | Minor | FIXED (provenance recorded), BACKLOG (`docs/assets.md`) | See below. |

## V-7, V-9 and V-11 against the repository

- V-7: the journal file is `docs/kiroween/kiro-journal.md`. Only `kiroween.md` (and one `tasks.md` line) pointed to `docs/kiro-journal.md`. The documents were changed to the existing file, not the file moved, because the journal already has history at that path.
- V-9: see table. Region ids are part of the tested contract (`data-testid`, E2E) and were left as they are.
- V-11: `structure.md` describes a target layout. It now lists the subfolders that exist. `docs/assets.md` is still missing (V-16).

## V-16 screenshot provenance

File: `docs/engineering/screenshots/m7-preview-production-shell.png`, 1084x655, SHA-256 `C1EFE7C772A168F077C6EF3B2CFC4B1F60FC08AAD5176C1FDC8FF93DC0A9A2A6` (re-computed on this branch, matches `docs/release/desktop-foundation-build-validation.md`).

Evidenced in the repository:
- Added to git in commit `40bf76e` (author Hugo-BerC, 2026-11-26 16:09:51 +0100, "docs(foundation): record Block B results ...", 64478 bytes), then carried into `main` by the squash `6f81009`.
- Captured during the Block B `electron-vite preview` run of the production build, file time 2026-11-26 14:38 (delivery report section 2; build-validation report). The orchestrator's Block B work captured it; the delivery report does not name an individual workflow step.
- Block C viewed it: it shows the real NecroAmp shell (header, six regions, "Application bridge Connected", Platform Windows, Version 0.0.0).

Unknown: the capture command or tool, and which agent or step ran it. The repository does not record them, and none is claimed here.

License: the image is a screenshot of this project's own UI (MIT project). Block C observed no third-party artwork in it. This is an observation, not a license record. No entry exists in `docs/assets.md`, which does not exist yet. The file is documentation evidence, not a bundled product asset. Backlog item: create `docs/assets.md` and list it.
