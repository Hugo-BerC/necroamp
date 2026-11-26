# Desktop Foundation delivery report

Branch: `feature/desktop-foundation`. Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0. Status as of Block C (M8 preparation). Committed and pushed at the end of Block C (see section 8).

Labels: IMPLEMENTED, TESTED, RUNTIME VERIFIED, INTEGRATION PENDING, DEFERRED, BLOCKED, COMPLETE. A task is not ticked because a file exists.

## 1. Delivery status M0 to M8

| Milestone | Label | Evidence and gaps |
|---|---|---|
| M0 Dependency bootstrap | COMPLETE | `m0-closure-validation.md`, `docs/engineering/m0-m1-acceptance-report.md`. Lockfile frozen install re-run fresh: exit 0. |
| M1 Repository scaffold | COMPLETE | Same acceptance report. Toolchain commands re-run fresh below. |
| M2 Electron main process | COMPLETE (RUNTIME VERIFIED on Windows) | Security review `docs/security/m2-m3-security-review.md`. Runtime items closed by E2E. Real-symlink containment and packaging checks stay DEFERRED. |
| M3 Shared contracts and preload | COMPLETE (RUNTIME VERIFIED on Windows) | Sandboxed preload loads and the bridge reports Connected in the E2E and preview run. Sender validation requires main-frame identity (commit `55c38d4`). |
| M4 Renderer shell | COMPLETE | Six regions plus header. T4.1 to T4.8 ticked. |
| M5 Styling foundation | IMPLEMENTED, TESTED. T5.5 DEFERRED | Tokens, CSS Modules, WCAG contrast function. T5.5 (seam review, optional) is not written: `desktop-foundation-skin-seams.md` does not exist. |
| M6 Tests | COMPLETE | Property, static, integration, jsdom a11y tests, coverage gate, traceability file. |
| M7 Smoke and production build | INTEGRATION PENDING | T7.0 to T7.4 done. T7.5 COMPLETE (`docs/release/desktop-foundation-build-validation.md`). T7.6 PENDING: bounded `pnpm dev` startup and shutdown verified, console, HMR and CSP-need evidence need a human (see tasks.md). T7.7 matrix ran fresh on Windows (section 3) and stays PENDING on T7.6 (HMR not tested, human launch not confirmed). Automated dev run: no page errors, dev `unsafe-inline` required for script and style, production CSP unchanged. macOS and Linux NOT VERIFIED. |
| M8 Final review and integration | INTEGRATION PENDING | T8.1 COMPLETE (base 66f9f7f, HEAD 10dfc3f). T8.2 COMPLETE (quality-review APPROVE WITH FIXES, 0 blockers; V-1 and V-2 need human decisions before merge). T8.4 COMPLETE (architecture gate APPROVED). T8.6 PENDING (human approval); T8.5 PENDING hook confirmation. T8.5 is done by this step (README, ADR notes, backlog, journal, this report). The final security review exists at `docs/security/desktop-foundation-final.md` (with `desktop-foundation-final-review.json`), verdict APPROVED; T8.3 is done. |

Placeholder regions only: the feature areas are not implemented in this phase. Player, playlist, equalizer, visualizer, skins and GitHub show "Not implemented in this phase". No audio engine, no playlist logic, no skin loading, no GitHub calls.

### Regions

Header (name, tagline, version, platform, bridge status, audio engine status) and six regions: Player, Playlist, Visualizer (Spectrum, Waveform placeholders), Equalizer (ten bands 31 Hz to 16 kHz, "Not available"), Skins, GitHub (optional, signed-out text). Controls are present and disabled-style placeholders.

### Architecture and skin compatibility

- Three process boundaries kept (main, sandboxed preload as one CommonJS file, renderer ESM). ADR 0002 to 0005 describe them. `sandbox`, `contextIsolation`, `webSecurity` are on.
- The renderer is served from `app://renderer` with a meta CSP (`default-src 'none'; script-src 'self'; style-src 'self'; ... connect-src 'none'`). Built `index.html` has one external module script and no inline script.
- Skin compatibility: colors, spacing and typography are CSS custom properties (`app/styles/tokens.css`), views use CSS Modules, and strings are centralized. This is seam-ready only. No skin manifest, loader or schema exists. Compatibility with the Skin Engine is a design intent, not tested against a skin. The seam review (T5.5) is open.

## 2. Runtime launch

- Result: RUNTIME VERIFIED on Windows x64. `electron-vite preview` on the production build opened a `NecroAmp` window (Block A and Block B), and 35 Playwright Electron tests launched the built app (title, six regions, lifecycle, security checks, axe scan).
- Manual launch command (from the repo root, after `pnpm.cmd install --frozen-lockfile`):

```powershell
pnpm.cmd build; pnpm.cmd exec electron-vite preview
```

- `pnpm dev` (T7.6): a bounded run started the app (window `NecroAmp`, dev server on 5173) and the process tree was killed cleanly. Renderer console, HMR and the `style-src` need were not observed, so T7.6 stays PENDING for the human.
- Screenshot: `docs/engineering/screenshots/m7-preview-production-shell.png` (1084x655). Block C viewed it: it shows the real NecroAmp shell (header, Player, Playlist, Visualizer, Equalizer, Skins, GitHub regions, "Application bridge Connected", Platform Windows, Version 0.0.0). It was captured during the preview run in Block B (file time 2026-11-26 14:38); the capture command is not recorded. This step did not capture a new one.

## 3. Validation (fresh, Block C, same tree as HEAD `40bf76e`, no uncommitted source changes)

| Command | Exit | Result |
|---|---|---|
| `pnpm.cmd typecheck` | 0 | |
| `pnpm.cmd lint` | 0 | |
| `pnpm.cmd format:check` | 0 | Run before this step's doc edits; re-run recorded in section 7 if docs were reformatted. |
| `pnpm.cmd test` | 0 | 52 files, 768 passed, 2 skipped (770) |
| `pnpm.cmd test:coverage` | 0 | Statements 99.44 (542/545), branches 98.23 (279/284), functions 100 (156/156), lines 99.78 (470/471). Thresholds 80/80/80/75 global, 95 on critical files, unchanged. |
| `pnpm.cmd build` | 0 | main, preload, renderer outputs produced |
| `pnpm.cmd test:e2e` | 0 | 35 passed, about 1.8 min, 1 worker |
| `pnpm.cmd licenses list --prod` | 0 | zod, zustand, react, react-dom, scheduler, csstype, @types/react: all MIT. No GPL, UNLICENSED or Unknown in the full list. |
| `pnpm.cmd install --frozen-lockfile --offline` | 0 | "Already up to date" |

- Skipped tests: the two real-symlink tests (no symlink privilege on this host).
- Accessibility: jsdom conformance tests (R8.5, R8.8, R8.9) and the Playwright axe scan (T7.4) pass. `axe-core` does not appear in `out/`.
- Build observations: `out/main/index.js` 24 KB, `out/preload/index.js` 175 KB (starts with `"use strict"; require("electron")`, so a single CommonJS file with bundled Zod), `out/renderer/index.html` with meta CSP, one CSS and one JS asset, no `.map` files.
- Platforms: Windows x64 only. macOS and Linux: NOT VERIFIED.
- Historical versus fresh: everything in this table was run in Block C. The M0 to M3 acceptance reports, the M2/M3 security review and the Block A and B journal numbers are historical. Block A recorded 625 tests (42 files); Block B and this run record 768.

## 4. Security

- Verdict: no final security review exists for the whole application (T8.3 not done). The last formal verdict is the M2/M3 review: APPROVED, zero blockers. Block B's code review verdict was APPROVED with no findings. Treat the security status as "implementation reviewed, final gate pending".
- Findings carried: F-3 (filesystem TOCTOU in the `app://` handler, Low, accepted temporarily, mandatory reassessment before the first public release, see `docs/engineering/backlog.md`). F-4 (dev CSP `unsafe-inline`) awaits T7.6. F-7 (fuses, ASAR integrity, `devTools` in production) awaits packaging review. F-8 is largely closed by E2E (`app://renderer` with `'self'`, module scripts, sandboxed preload with bundled Zod, meta CSP in built HTML all work at runtime); the `corsEnabled` fallback was not needed.
- Residual risks: F-3 race window; Linux `safeStorage` `basic_text` backend (ADR 0001, implementation open, no token storage exists yet); unsigned, unpackaged builds only.
- Deferred packaging checks (stay deferred): fuses, ASAR integrity, `realpath` against the ASAR layout, `devTools` in production, installers, signing, auto-update, Linux targets, macOS x64 cross-build.
- Lockfile integrity: `pnpm install --frozen-lockfile --offline` exits 0 against the committed lockfile. Lifecycle scripts are deny-by-default (ADR 0004); the esbuild postinstall is functionally exercised because the build works.
- Secret scan: Block B scanned changed and untracked text files for common secret patterns and found nothing. Block C did not rescan.

## 5. Kiro evidence

- Workflows: `git-reconcile` (Block A). The `quality-review` workflow (T8.2) ran later (run `desktop-foundation-final`, APPROVE WITH FIXES, base 66f9f7f, HEAD 10dfc3f).
- Agents actually invoked (from the journal): `necro-architect`, `frontend-engineer`, `art-director`, `wf-code-reviewer` (Block A); `qa-engineer`, `desktop-engineer`, `frontend-engineer`, and a Block B reviewer (Block B). Earlier phases used release-engineer, security-reviewer and others; see `docs/kiroween/kiro-journal.md`. No agent was invoked in Block C. The Block B agent names were copied from the Block A list by the prior step and are only partly confirmed.
- Skills actually loaded: `testing-strategy` (qa-engineer, Block B) is the only one the journal confirms. Per-agent skill mapping has not been runtime-tested (backlog A1).
- Decisions: ADR 0001 to 0005; Electron 45.5.0 pin; ESM exception E-ESM-1 (CommonJS main and preload); F-3 accepted temporarily; defects 0001 to 0004 fixed.

## 6. GitHub (to be completed by the delivery step)

- PR: draft PR #5 on `Hugo-BerC/necroamp`, base and head to be confirmed. Block B updated its body with `gh pr edit` (exit 0, not re-read).
- Pending: CI status (there is no `.github/workflows` directory, so no CI exists and no required checks can run), merge decision, final PR body, whether the PR leaves draft. Merge only if branch protection and checks allow it.

## 7. Remaining work and required human actions

1. Human: run `pnpm dev` once (T7.6) and record whether `unsafe-inline` is needed (F-4).
2. Write `docs/release/desktop-foundation-build-validation.md` (T7.5, release-engineer), using section 3 as input.
3. Run `quality-review` (T8.1, T8.2), then the architecture gate (T8.4); T8.3 is done (`docs/security/desktop-foundation-final.md`). T8.1 needs a base ref from the human.
4. Human final approval (T8.6). Confirm hooks `post-task-quality` and `ipc-security-check` stay disabled.
5. Optional: T5.5 seam review.
6. Before the first public release: reassess F-3; run the packaging checks; verify macOS and Linux; add CI.
7. Run the manual skill activation test (backlog A1).

## 8. Integration status (final)

- Commits: Block B `55c38d4`, `f5be83e`, `a695cc1`, `40bf76e`. Block C `d062b30` (security review), `ddea85a` (release docs), `af7fd19` (status reconciliation).
- PR: https://github.com/Hugo-BerC/necroamp/pull/5 (draft, base `main` = `66f9f7f`, 10+ commits ahead, mergeable CLEAN).
- CI: ABSENT. No `.github/workflows` exists, `gh pr checks` reports no checks, and the PR has no status check rollup. This is not a pass.
- Merge: NOT MERGED. Blockers: T7.6 (HMR probe and human `pnpm dev` confirmation), T7.7 (depends on T7.6), T8.5 hook confirmation, T8.6 human approval, V-1 and V-2 decisions. T8.1 to T8.4 are COMPLETE. GitHub CI ABSENT, macOS and Linux NOT VERIFIED, F-3 and packaging checks DEFERRED. Section 5 ("T5...") of the human message was cut off and is pending.
- Launch (production build): `pnpm.cmd build; pnpm.cmd exec electron-vite preview`. Development: `pnpm.cmd dev`.
