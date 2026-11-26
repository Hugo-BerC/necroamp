# Verdict: desktop-foundation-final

VERDICT: APPROVE WITH FIXES

- Run: desktop-foundation-final. Range `66f9f7f...10dfc3f` on `feature/desktop-foundation` (PR #5).
- Author: necro-architect. Method: merged and deduplicated the four reports below. No source edited, nothing committed, pushed or merged. No command run.
- Rule applied: any blocker means REJECT. All four reports record 0 blockers. Open majors and minors exist, so the verdict is APPROVE WITH FIXES.
- No correction loop. Every fix below is remediation for a separate feature-development run, or a human action.

## Reports merged

| Report | Path | Blockers | Major | Minor |
|---|---|---|---|---|
| Diff and scope inspection | `docs/release/review-desktop-foundation-final-diff-scope.md` | n/a (inventory) | n/a | n/a |
| Architecture | `docs/architecture/review-desktop-foundation-final.md` | 0 | 2 | 5 |
| Security | `docs/security/review-desktop-foundation-final.md` | 0 | 0 | 5 |
| Testing | `docs/testing/review-desktop-foundation-final.md` | 0 | 2 | 6 |

Deterministic results cited by the testing report: typecheck, lint and `vitest run` pass (52 files, 768 passed, 2 skipped). Coverage and E2E (35 passed) are recorded results, not re-run in the review.

## Merged findings

Severity is the highest assigned by any source. Source IDs: A = architecture, S = security, T = testing, D = diff scope.

| ID | Severity | Finding | Sources | Owner |
|---|---|---|---|---|
| V-1 | Major | `.kiro/steering/tech.md` was edited (3 lines, exception E-ESM-1) with no recorded approval in git. Content matches ADR 0002 section 6 and does not weaken a security rule. Human must confirm approval before merge. | A M-2, S FN-4, T M-1, D | user |
| V-2 | Major | Tooling files with no owning agent: `eslint.config.mjs` (carries the dependency-direction rules), `prettier.config.mjs`, `.npmrc`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.editorconfig`, `.gitattributes`, `.prettierignore`, `.gitignore`. Record an owner. Edits to `eslint.config.mjs` need architect review. | A M-1, S FN-4, T M-2, D | user (owner decision); necro-architect (review of boundary rules); desktop-engineer (proposed implementer) |
| V-3 | Minor | Development CSP allows `'unsafe-inline'` for `script-src` and `style-src` in `src/main/security/csp.ts`. Production CSP has neither. Keep until T7.6 runtime evidence shows which allowance is needed, then drop the unneeded one. Do not touch the production list. | A (carried), S FN-1 | desktop-engineer |
| V-4 | Minor | No fuses or `electron-builder.yml`. Packaging checks and F-3 pre-public-release reassessment are deferred, not passed. | S FN-2, A (carried) | release-engineer, security-reviewer |
| V-5 | Minor | CI is absent, not passing. Cross-platform matrix and CI hardening rules (SHA pins, least-privilege `permissions:`, `--frozen-lockfile`) are unchecked. macOS and Linux install, build, unit and E2E are NOT VERIFIED, including the darwin close branch and Linux display prerequisites. | S FN-3, T m-3, A (carried) | release-engineer |
| V-6 | Minor | Navigation guards allow any same-origin URL, not only the entry URL. No impact today. Revisit when routing or the Skin Engine adds origins. | S FN-5 | desktop-engineer |
| V-7 | Minor | Journal is at `docs/kiroween/kiro-journal.md`, steering names `docs/kiro-journal.md`. Move the file or update `kiroween.md`. Needs human decision. | A m-1 | user |
| V-8 | Minor | `package` script missing from `package.json` while `tech.md` lists it. Accepted deviation until `electron-builder.yml` exists. Add it with `--publish never` per `package-script-policy.md`. | A m-2 | desktop-engineer, release-engineer |
| V-9 | Minor | `design.md` names `visualization` and `skin-selector` and places the app-info hook differently from the code (`visualizer`, `skins`, `renderer/app/use-app-info.ts`). Sync the spec. `.kiro/specs/**` is outside the architect's write scope. | A m-3 | user (spec path), necro-architect advises |
| V-10 | Minor | `window.necroamp` type comes from `src/preload/necroamp-window.d.ts` through tsconfig inclusion. Type-only coupling, no runtime violation. Move the ambient declaration to a file both projects reach without including preload. | A m-4 | desktop-engineer, frontend-engineer |
| V-11 | Minor | `docs/` has subfolders (`design`, `engineering`, `kiroween`, `release`, `security`, `testing`) not listed in `structure.md`. Update `structure.md` at the next steering edit. | A m-5 | user |
| V-12 | Minor | Two real-symlink tests are skipped on this Windows host. Symlink escape is a security property and stays unverified until a Linux, macOS or Developer Mode Windows run. | T m-1 | qa-engineer |
| V-13 | Minor | No visual snapshots because no approved baseline exists. Add per-platform baselines after art-director approval. | T m-2 | qa-engineer, art-director |
| V-14 | Minor | E2E uses axe in `setLegacyMode(true)` and casts a missing Electron 45.5.0 type. Acceptable. Revisit on Electron upgrade. | T m-4 | qa-engineer |
| V-15 | Minor | Audio decode tests for MP3, WAV, FLAC and OGG, and property tests for equalizer, skin manifest, playlist, metadata and time formatting, cannot exist before those modules. Mandatory when each feature lands. Not a defect now. | T m-5 | qa-engineer (with audio-engineer, frontend-engineer later) |
| V-16 | Minor | Binary `docs/engineering/screenshots/m7-preview-production-shell.png` has no confirmed provenance or license entry. `docs/assets.md` does not exist yet. Confirm coverage or record provenance. | T m-6, D | security-reviewer to confirm; user to record |

Count after deduplication: 0 blockers, 2 major, 14 minor.

## Steering conformance

No contradiction with steering. Dependency direction, process boundaries, layout and fixed versions conform (architecture report, conformance table). No open decision in `structure.md` was resolved silently. Decisions 1, 8, 9, 16 and 17 were resolved by recorded human decisions in ADRs 0002 and 0005. Decisions 2, 4 to 7, 10 to 15 are untouched. Decision 3 has ADR 0001 and no code.

## Accepted limitations carried forward

- macOS and Linux are unverified.
- CI is absent, not passing.
- F-3 and packaging-specific security checks stay deferred.
- Development CSP condition (V-3) stays open until T7.6 runtime evidence.

## Required before merge

1. V-1: the user confirms approval of the `tech.md` edit.
2. V-2: the user names an owner for the unowned tooling paths (can be recorded as a decision after merge if the user accepts the risk).

All other items are follow-up work for separate runs.

## Report paths

- `docs/release/review-desktop-foundation-final-diff-scope.md`
- `docs/architecture/review-desktop-foundation-final.md`
- `docs/security/review-desktop-foundation-final.md`
- `docs/testing/review-desktop-foundation-final.md`
- Verdict: `docs/architecture/review-desktop-foundation-final-verdict.md`
