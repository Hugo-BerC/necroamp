# Tasks: desktop-foundation (Phase 05)

Status: APPROVE WITH FIXES applied (design E5 to E8). Gate H0 passed (design section 16). **M2: IMPLEMENTED - INTEGRATION PENDING. M3: IMPLEMENTED - INTEGRATION PENDING** (implementation acceptance, not whole-application runtime acceptance; T2.6, T2.7, T3.2 and T3.3 stay open until T4.2 and T7.x). M4 and M5 not started. Checkboxes are ticked only with recorded evidence, by Orch or the human. Inputs: `requirements.md` (R1 to R17), `preflight.md`, `design.md` (approved with fixes, E5 to E8; amended: N4 exception E1, lifecycle policy 9.3, validation tasks V1 to V11 in section 15, host gate H0 in section 16, Appendix A), steering, the nine agents in `.kiro/agents/`, and the three workflows in `.kiro/workflows/`.

## How to read this file

- **Orch** is the authorized top-level orchestrator (D13). It writes native Spec files, cross-cutting config files that no agent may write, and runs commands that agents cannot (`pnpm install`, `pnpm format*`, `pnpm licenses`, `pnpm exec`). Orch widens no agent permission. Only Orch or the human ticks boxes in this file (W2 in `preflight.md`).
- **Human** installs host tools, approves gates, runs interactive commands (`pnpm dev`), and decides on any commit. Nothing in this plan commits, pushes or opens a pull request.
- Agents listed as responsible are the **writers** or **reviewers** named in `design.md` section 11. Their write scopes were read from `.kiro/agents/*.md`:

| Agent | May write | Shell allowed without asking | Notable limits |
|---|---|---|---|
| desktop-engineer | `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `package.json`, `tsconfig*.json`, `electron.vite.config.ts`, `.nvmrc` | `pnpm typecheck*`, `lint*`, `test*`, `build*`, `dev*` | No `.npmrc`, `.gitignore`, `.kiro/**`, `*.property.test.ts`. `pnpm install*` asks. |
| frontend-engineer | `src/renderer/app|features|stores|components/**`, `src/renderer/*.{html,css,ts,tsx}` | `pnpm typecheck*`, `lint*`, `test*` | No `pnpm build`, no `src/main`, no property tests. |
| qa-engineer | `tests/**`, `**/*.property.test.ts`, `**/*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts`, `docs/testing/**` | `pnpm typecheck*`, `lint*`, `test*`, `test:e2e*`, `build*` | Never patches non-test source; reports defects to the owner. |
| security-reviewer | `docs/security/**` only | none (no shell) | Read-only on production source. Cannot read `.npmrc`. |
| necro-architect | `docs/adr/**`, `docs/architecture/**`, `docs/requirements/**` | none | No `.kiro/**`. |
| release-engineer | `.github/workflows/**`, `electron-builder.yml`, `resources/**`, `docs/release/**`, `CHANGELOG.md` | `pnpm build*`, `pnpm package*`, read-only `git status/diff/log/describe` | No `src/**`. Packaging is out of scope here (D10). |
| art-director | `skins/**`, `resources/icons/**`, `docs/design/**`, `docs/assets.md` | none | No code, no assets are produced in this phase. |
| audio-engineer | `src/renderer/audio/**`, `src/shared/audio/**`, `docs/audio/**` | `pnpm typecheck*`, `lint*`, `test*` | Not used: this phase has no audio (R8.4, R8.7). |

- **Workflows.** Only `quality-review.workflow.json` is used (M8), because it gives three independent reviews and a verdict. `feature-development` is not used: `preflight.md` W1, W3, W5 and W7 found it unfit for a multi-domain phase. `release-validation` is not used: it validates packaging (`pnpm package`, `electron-builder.yml`), which D10 defers. Small tasks run as direct single-agent sessions. Hooks stay disabled (`preflight.md` C, R-g in the design).
- **Platform.** Windows x64 with PowerShell 7 is the only runtime validation target. macOS and Linux are designed for (pure platform branches, `.gitattributes`, no POSIX-only commands) and reported **NOT VERIFIED** until run on those hosts. No milestone claims otherwise. In PowerShell 7 on this host, run `npm.cmd` and `pnpm.cmd` wherever commands below say `npm` or `pnpm` (design E6). Never change the execution policy, never disable TLS validation, and never add proxy, certificate or machine-specific environment configuration to the repository.
- **Failure rule.** A failing validation command is never retried unchanged. The runner stops, records command, exit code and first error lines, and applies the smallest-adjustment procedure in `design.md` section 15.
- **Run labels.** Fixed kebab-case labels such as `desktop-foundation-1` (W6).

## Milestone map

```
M0 host + deps ──► M1 scaffold ──► M2 main ──┬──► M3 contracts + preload ──┐
                                             │                              ├─► M6 tests ──► M7 smoke + build ──► M8 review
                                             └─► (T3.1 first) M4 renderer ──► M5 styling ┘
```

| Milestone | Primary agent | Can overlap with |
|---|---|---|
| M0 | Orch with human (necro-architect, desktop-engineer, security-reviewer for sub-tasks) | none (blocking) |
| M1 | desktop-engineer, qa-engineer, Orch | none inside M1 except its three writer groups |
| M2 | desktop-engineer | M3.1, M4 after T3.1 |
| M3 | desktop-engineer | M2, M4 |
| M4 | frontend-engineer | M2, M3 (needs T3.1 schemas for the adapter) |
| M5 | frontend-engineer (art-director optional review) | M4 (token files first) |
| M6 | qa-engineer | M4 and M5 tail, once code exists |
| M7 | qa-engineer, release-engineer, Orch, human | none |
| M8 | security-reviewer, necro-architect, Orch | none |

---

## Task-level dependencies and status rules (design E7)

- **Implementation complete** means the task's files exist, their unit tests pass, and typecheck, lint and test pass for the touched projects. **Integration validated** means every cross-milestone consumer exists and the combined command (for example `pnpm build`) has run.
- A milestone is PASSED only when its own tasks and all cross-milestone integration tasks it owns or depends on are complete. Otherwise it is recorded "IMPLEMENTED, integration pending: T..". A command that cannot yet run is recorded "DEFERRED to T..". No fake entry point, stub or empty CSS file is created to satisfy an intermediate command.

| Task | Requires | Reason |
|---|---|---|
| T3.2 | T2.2, T3.1 | Handlers need sender validation from T2.2 |
| T2.6 | T2.1 to T2.5, T3.2 | Composition root registers T3.2's IPC handlers |
| T2.7 | T1.2 | Config plugin only |
| T3.3 | T3.1 | Preload uses `IPC_CHANNELS` only |
| T4.2 | T3.1 | Adapter parses the shared response schema |
| T5.2 | T4.1 | `main.tsx` imports `global.css` once it exists |
| T5.3 | T4.5 | View files import their CSS Modules once they exist |
| T7.0 | T2.6, T2.7, T3.3, T4.6, T5.2, T5.3 | Whole-application build needs main, preload and renderer entries and all imported CSS |
| T7.1 to T7.7 | T7.0 | E2E runs against the built app |
## M0 Host environment and dependency bootstrap

**Responsible agent.** Orch with the human operator for host and install steps. Sub-tasks: necro-architect (ADRs and dependency notes), desktop-engineer (`package.json`, `.nvmrc`), security-reviewer (review).

**Agent Skills.** `cross-platform-packaging` (lockfile, pnpm, reproducible installs, license inventory), `electron-security` (dependency and script review), `typescript-standards`. necro-architect also carries `testing-strategy`.

**Dependencies.** None. M0 blocks everything else. Only T0.2 to T0.5 documentation work needs no host tools and may start before H0 passes. H0 has passed. `pnpm.cmd install` waits for T0.2, T0.6 and the section 14 approvals.

**Tasks.**

- [x] **T0.1 Gate H0 (host). H0 PASSED; do not reinstall.** Host record in `design.md` section 16 and A.0: PowerShell 7.6.10; Node v24.22.3 x64 win32; npm.cmd 11.19.1; pnpm.cmd 10.34.9; git 2.56.1.windows.1; `npm.cmd ping` OK; `pnpm.cmd view pnpm@10.34.9 version` OK; no TLS errors. Orch records the outputs (V1) and ticks this box. Host Node and Electron-embedded Node are recorded as separate facts; the embedded value is filled in at T0.8.
- [x] **T0.2 Registry re-check.** **DONE.** Evidence: `docs/security/m0-dependency-validation.md` (32 exact-version `npm.cmd view` lookups, exit 0) and `docs/security/m0-resolution-report.md`. One difference, D1 (eslint 9.39.5 deprecated), stopped the task and was resolved by the human (accepted temporarily). Orch runs the read-only registry loop from `design.md` section 14 with each exact version from 9.1 (`/<version>` instead of `/latest`). Any difference in version, license, engines, peers or scripts stops the milestone and goes to the human.
- [x] **T0.3 ADRs and dependency note.** **Status: DONE.** ADRs 0002 to 0005 are written in `docs/adr/` (0002 also records exception E-ESM-1). `docs/architecture/dependency-versions.md` now exists (31 top-level packages, toolchain, licenses, exceptions, V1/V2/V3/V11 status). necro-architect writes ADR 0002 (single package, ESLint plus Prettier, test stack, coverage), ADR 0003 (`app://` scheme, privileges, CSP, `corsEnabled` fallback), ADR 0004 (dependency lifecycle policy, esbuild and electron approvals in principle, fsevents denied, N4 exception E1), ADR 0005 (IPC security model, window chrome, lifecycle, menu, single instance), and `docs/architecture/dependency-versions.md` (candidate table, V1 to V11 status, N4 inventory entry with license notice handling).
- [x] **T0.4 Policy and ignore files.** **DONE (2026-11-26).** `.npmrc` approved by the human and written (exactly `engine-strict=true` plus newline, 19 bytes, not ignored by `.gitignore`). `pnpm-workspace.yaml` exists with the approved policy. `.gitignore` verified for all six generated paths and `.kiro/` is not ignored and is tracked (`docs/security/m0-closure-validation.md` section 2; re-checked with `git check-ignore -v`). Orch writes `.npmrc` (`engine-strict=true` only), `pnpm-workspace.yaml` (`strictDepBuilds: true`, an explicitly approved deviation from the original R1.6 default (design E5) that keeps deny-by-default lifecycle execution; `ignoredBuiltDependencies: [fsevents]`; no `esbuild` entry yet), and the `.gitignore` additions (`node_modules`, `out`, `coverage`, `test-results`, `playwright-report`, `node_modules/.cache`). `.kiro` is never added to `.gitignore`.
- [x] **T0.5 Dependency manifest.** desktop-engineer writes `package.json` (`private`, `engines.node >=24.15.0 <25`, `packageManager pnpm@10.34.9`, exact pins from 9.1 with N4 packages in `devDependencies`, the scripts table from design 9.5, no `pre*`/`post*`/`prepare`) and `.nvmrc` (`24`). No install.
- [x] **T0.6 Security review of the install surface.** **Status: DONE (2026-11-26).** The human accepted `docs/security/m0-security-review.md` as the canonical T0.6 deliverable (no duplicate report). The review ends with a factual addendum quoting the root `.npmrc` (exactly `engine-strict=true`). The remainder of this entry is the original task text. Original status: partial. Existing evidence: `docs/security/m0-security-review.md` (PASS WITH CONDITIONS; manifest, `pnpm-workspace.yaml`, lifecycle policy), `m0-resolution-report.md` (472 lockfile entries checked for scripts), `m0-post-install-validation.md`. Missing against the task text: the review did not cover the `.npmrc` text (the file did not exist then; it now holds one line) and the output file is not the named `desktop-foundation-m0-install-review.md`. Closing needs either a short security-reviewer addendum quoting the `.npmrc` line, or a human decision to accept the existing review as the T0.6 output. security-reviewer reads `package.json`, `pnpm-workspace.yaml`, script bodies and the dependency list, plus the `.npmrc` text that Orch quotes in the request (the agent cannot read `.npmrc`, N10). Output (actual, human-accepted): `docs/security/m0-security-review.md`. The earlier planned name `docs/security/desktop-foundation-m0-install-review.md` is not used.
- [x] **T0.7 Install under strict builds.** Evidence: `docs/security/m0-post-install-validation.md`. The operator ran a single `pnpm.cmd install --frozen-lockfile` (exit 0) with the `esbuild@0.28.2` entry already present (reviewed in M0 resolution), so the expected first failing run did not occur; lockfile hash unchanged. After human approval of the section 14 gate, Orch runs `pnpm install`. With `strictDepBuilds: true` the first run is expected to fail on `esbuild`. That output is the V2 evidence. Orch verifies the esbuild script body and the resolved version, adds the version-qualified `esbuild@<version>` entry to `onlyBuiltDependencies`, and reruns `pnpm install` once. Then `pnpm install --frozen-lockfile` once (R1.5). Any other unreviewed script stops the milestone.
- [x] **T0.8 Validation V1, V2, V3, V11.** **Status: DONE.** V3 (Electron 45.5.0, embedded Node 24.22.3, x64 win32), V2 (installed-tree scan, one script-bearing package) and V11 (licenses) have evidence in `docs/security/m0-closure-validation.md` and `m0-post-install-validation.md`. The record is in `docs/architecture/dependency-versions.md` (Electron v45.5.0, embedded Node 24.22.3 x64 win32, measured). Orch runs: lockfile `requiresBuild` listing (V2), Electron on-demand binary download with human approval of the network call (V3), `pnpm licenses list --prod --json` and `--dev --json` (V11), and Appendix A.7 for the embedded Node value. necro-architect records results in `docs/architecture/dependency-versions.md`.

**Expected deliverables.** Verified host (H0 record), ADRs 0002 to 0005, `docs/architecture/dependency-versions.md`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions, `package.json`, `.nvmrc`, `pnpm-lock.yaml`, `docs/security/desktop-foundation-m0-install-review.md`, run notes with install outcome (scripts that ran).

**Requirements traceability.** R1 (toolchain, pins, lockfile, build-script allowlist, licenses including R1.7 with exception E1), R11.8 (script review), R15 (supply chain), R17 (ADRs precede dependent code, cited sources).

**Acceptance criteria.**
1. H0 checklist (design 16) passes on Windows x64 with PowerShell 7, with no execution-policy bypass.
2. `pnpm install --frozen-lockfile` exits 0 and the lockfile is committed-ready and unchanged by the second run.
3. Only `esbuild` (version-qualified) ran a dependency script; `fsevents` did not; no `dangerouslyAllowAllBuilds` anywhere.
4. `pnpm exec electron --version` prints `v45.5.0`; the embedded Node major is 24; both Node values are recorded separately.
5. Production dependency graph is permissive-only; the development graph's only non-permissive packages are `axe-core` and `@axe-core/playwright` (E1).
6. V1, V2, V3, V11 recorded PASSED, or each failure has a smallest-adjustment proposal approved by the human.
7. security-reviewer report has zero open blockers.

**Validation commands (PowerShell 7).**

```powershell
node --version; node -p "process.arch + ' ' + process.platform"; pnpm --version
pnpm install --frozen-lockfile
Select-String -Path pnpm-lock.yaml -Pattern 'requiresBuild: true' -Context 3,0
pnpm exec electron --version
pnpm licenses list --prod --json
pnpm licenses list --dev --json
```

**Parallelism.** Sequential gate: T0.1 then T0.2. After T0.2, T0.3, T0.4 and T0.5 run in parallel (different writers and files). T0.6 needs T0.4 and T0.5. T0.7 and T0.8 are sequential after T0.6 and the human approval.

---

## M1 Repository scaffold and development toolchain

**Responsible agent.** desktop-engineer (TypeScript and build config), qa-engineer (test config), Orch (lint, format and cross-cutting files). Orch integrates.

**Agent Skills.** `typescript-standards`, `electron-security`, `cross-platform-packaging` (desktop-engineer); `testing-strategy` (qa-engineer).

**Dependencies.** M0 complete (installed `node_modules`, lockfile, ADR 0002).

**Tasks.**

- [x] **T1.1 TypeScript projects.** desktop-engineer writes `tsconfig.json` (solution with references) and `tsconfig.shared.json`, `.main.json`, `.preload.json`, `.renderer.json`, `.tests.json`: `strict: true`, `composite`, `emitDeclarationOnly`, output under `node_modules/.cache/tsc`, path aliases `@shared/*`, `@main/*`, `@renderer/*`; `tsconfig.shared.json` with `lib: ["ES2023"]` and `types: []` (R2.4).
- [x] **T1.2 electron-vite config.** desktop-engineer writes `electron.vite.config.ts` with main, preload and renderer targets, `resolve.alias` for the three aliases per target, the React plugin, CommonJS preload output, and the output layout in design 3.1. The meta-CSP plugin is added in T2.7.
- [x] **T1.3 Seed files.** desktop-engineer writes `src/main/constants.ts` and `src/shared/ipc/channels.ts` so project references have inputs. Projects without inputs yet (`renderer`, `tests`) are made green by their first files in M4 and M6; until then `tsc -b` may report TS18003 for them and this is recorded, not hidden.
- [x] **T1.4 Vitest config.** qa-engineer writes `vitest.config.ts` (node and jsdom projects, shared alias table, `globals: false`, setup file registering jest-dom and `cleanup`, network-stub setup, coverage block from design 10) and `tests/config/alias-consistency.test.ts` (R2.2).
- [x] **T1.5 Lint, format, repository hygiene.** Orch writes `eslint.config.mjs` (flat config, `typescript-eslint`, `react`, `react-hooks`, `jsx-a11y`, boundary `no-restricted-imports` blocks per design 1, `no-restricted-syntax` and globals for R3.1, R4.1, R6.5, R8.4, R8.7, R15.1), `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes` (LF normalization). Orch runs `pnpm format` once to normalize files it wrote.
- [x] **T1.6 README command section.** Orch adds the command table and platform status (Windows x64 validated, macOS and Linux not verified) to `README.md`.
- [x] **T1.7 Validation V7 (lint load) and V8 (test smoke).**

**Expected deliverables.** `tsconfig*.json`, `electron.vite.config.ts`, seeds, `vitest.config.ts`, `tests/config/alias-consistency.test.ts`, `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes`, README section.

**Requirements traceability.** R1.5 (scripts run), R2 (structure, aliases, strict TS, boundaries), R11 (commands), R12 (test setup), R14 (lint and format), R16 (line endings, no POSIX-only commands).

**Acceptance criteria.**
1. `pnpm lint` exits 0 and loads every plugin under ESLint 9.39.5 (V7).
2. `pnpm format:check` exits 0.
3. `pnpm test` runs both Vitest projects and the alias-consistency test passes (V8 smoke); `--passWithNoTests` is used only for this milestone's first run, never in the script.
4. The three alias tables are identical (R2.2).
5. `pnpm typecheck` passes for `shared` and `main`; any renderer or tests TS18003 is documented as expected until M4 and M6.

**Validation commands.**

```powershell
pnpm lint
pnpm format:check
pnpm test
pnpm typecheck
```

**Parallelism.** T1.1 to T1.3 (desktop-engineer), T1.4 (qa-engineer) and T1.5 to T1.6 (Orch) write disjoint files and run in parallel. T1.4's alias test needs T1.1 and T1.2 to exist before it can pass. T1.7 runs last.

---

## M2 Electron main process and security configuration

**Responsible agent.** desktop-engineer. security-reviewer reviews at the milestone gate.

**Agent Skills.** `electron-security`, `typescript-standards`, `cross-platform-packaging`.

**Dependencies.** M1. T3.2 requires T2.2 (sender validation) and T3.1. T2.6 requires T2.1 to T2.5 and T3.2 (IPC registration). M2 is "IMPLEMENTED, integration pending: T3.2" until T3.2 is done, and PASSED only after T2.6 to T2.8. Electron API names marked UNVERIFIED in design sections 3 to 6 are checked against the Electron 45.5.0 documentation first (T2.0).

**Tasks.**

- [x] **T2.0 Electron API verification.** desktop-engineer lists each version-sensitive API in design 3 to 6 (`will-frame-navigate`, `setDevicePermissionHandler`, `registerSchemesAsPrivileged`, `protocol.handle`, `WebFrameMain` properties, `ELECTRON_RENDERER_URL`, preload output name), checks the Electron 45.5.0 docs and the electron-vite 6.0.0 output, and reports page and result in its final message. necro-architect records them in `docs/architecture/electron-api-verification.md`. This is a documented source check, not a runtime claim (R17.2). **DONE as a source and documentation check (no runtime claim).** Evidence: `docs/architecture/electron-api-verification.md` (availability, type-level, documented behavior, runtime "not exercised", deferred validation per API). Why the task text is met: every API named in the task is listed; Electron 45.5.0 typings were read; the version-pinned documentation source (tag `v45.5.0`, fetched with `web_fetch`) was read for `ipc-main-invoke-event`, `web-frame-main`, `web-contents`, `protocol` and `session`; the electron-vite 6.0.0 output names were derived from tool source and `electron.vite.config.ts`; the file is the necro-architect record the task names. Qualifiers: the rendered electronjs.org pages returned no content and were not used; `detached`, the permission check and request handlers, and the `custom-scheme` and `privileges` pages rely on typings JSDoc only; no build output exists, so the preload name is a static derivation; the desktop-engineer's own report of pages and results is not in the repository. Runtime behavior of every API is deferred to T7.x.
- [x] **T2.1 Foundations.** `src/main/logging/logger.ts`, `lifecycle/platform-policy.ts`, `lifecycle/app-menu.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
- [x] **T2.2 Security modules.** `security/csp.ts` (`buildCsp`, `buildMetaCsp`), `security/trusted-origins.ts`, `security/sender-validation.ts`, plus unit tests. **Acceptance criterion (human gate 3, ADR 0003 item 6):** tests prove the production CSP never contains a development-only allowance (`unsafe-inline`, dev origin, websocket origin) and cannot inherit one from the development builder; the development policy never contains `unsafe-eval` or a remote script source, and its `connect-src` is exactly the trusted dev origin and its websocket. Not started. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run. Production CSP isolation proven by csp.test.ts and csp.property.test.ts.
- [x] **T2.3 Protocol.** `protocol/resolve-app-path.ts` (path module injected), `protocol/mime-types.ts`, `protocol/app-protocol.ts` (scheme registration, `protocol.handle`, realpath confinement, 5 MiB bound, response headers), plus unit tests. **DONE (unit and integration with temp dir).** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run. Real-symlink test skipped on this Windows host. Runtime check of app:// under the real CSP deferred to T7.0/E2E.
- [x] **T2.4 Window.** `window/chrome-profile.ts`, `window/window-options.ts`, `window/create-main-window.ts` (the only `new BrowserWindow`), `window/navigation-guards.ts`, `window/permissions.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
- [x] **T2.5 Lifecycle.** `lifecycle/single-instance.ts`, `lifecycle/crash-handlers.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
- [x] **T2.6 Composition root (requires T3.2).** `src/main/index.ts` with the fixed startup order (design 2), `resolveLoadTarget`, test user-data override `NECROAMP_E2E_USER_DATA`. It imports `registerHandler` and `app-handlers` from T3.2 and is not complete until they exist. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T2.7 Meta CSP build plugin.** Add the `transformIndexHtml` plugin to `electron.vite.config.ts` that calls `buildMetaCsp({ mode: 'production' })`. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T2.8 Security gate.** security-reviewer writes the M2 security review covering window, CSP, protocol, navigation, permissions, lifecycle, logging. **DONE (human decision): the canonical deliverable is `docs/security/m2-m3-security-review.md`** (combined M2 and M3, findings F-1 to F-8). `desktop-foundation-m2-review.md` is not created and no duplicate report is written. Why the task text is met: that review has a pass/fail row with evidence for window web preferences, production and development CSP, `app://` protocol, navigation, new windows, permissions and webviews, sender validation, single instance and shutdown, and error and log sanitization; verdict APPROVED with zero blockers. Supporting evidence: `docs/security/m2-m3-focused-review.md` (second pass, APPROVED, no Critical, High or Medium). Finding dispositions (human): F-1 and F-2 corrected with regression tests (`single-instance.test.ts` "ignores second-instance while the app is not ready"; `resolve-app-path.test.ts` reserved device names); F-3 accepted as a low risk temporarily and tracked in `docs/engineering/backlog.md` (mandatory reassessment before the first public release); F-5 accepted (ADR 0005 addendum); F-4 (dev CSP `unsafe-inline` reduction at T7.6), F-6, F-7 (fuses, ASAR, devTools at packaging review) and F-8 (runtime checks at T7.0 and E2E) accepted with their downstream validation requirements preserved. Limits: both reviews are code reading. Electron runtime behavior is not verified. Crash-handler and user-data override internals were reviewed in depth by neither pass beyond `index.ts` (focused review, "Unreviewed areas"); they go to the final review T8.3. This is implementation acceptance, not runtime acceptance.

**Expected deliverables.** Everything under `src/main/**` except `src/main/ipc/**`, co-located `*.test.ts`, the config plugin, the API verification note, the M2 security review.

**Requirements traceability.** R3 (window hardening, single factory), R5 (CSP), R6 (navigation, windows, webviews, permissions), R7 (lifecycle, crash handling, single instance, quit), R15 (privacy, no network, no secrets in logs), R16 (platform branches as pure functions), R17.2 (API sources).

**Acceptance criteria.**
1. `buildWebPreferences()` returns the literal object in design 3.1, identical in every mode (unit test by deep equality).
2. Production CSP has no `unsafe-eval`, `unsafe-inline`, `data:`, wildcard or remote source; the dev allowance (N2) appears only in the development output.
3. `resolveAppPath` rejects every case in design 4 and accepts only `app://renderer` files with allow-listed extensions.
4. `platform-policy` and `app-menu` are tested for `win32`, `darwin` and `linux` and for an unknown platform (quits).
5. Only one `new BrowserWindow`, no `shell.openExternal`, `net`, `fetch`, `crashReporter` or `autoUpdater` in `src` (lint and source scan).
6. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass for the touched projects. Whole-application `pnpm build` is DEFERRED to T7.0.
7. Each UNVERIFIED API name has a documented outcome (T2.0). security-reviewer reports zero blockers.

**Validation commands.**

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm build` is not run in M2: it needs the renderer entry (T4.6) and CSS (T5.2, T5.3). Main and preload typecheck and unit tests are the M2 evidence. No stub renderer is created.

**Parallelism.** T2.0 first. T2.1, T2.2 and T2.3 are independent pure-module groups and can run in parallel in separate desktop-engineer sessions. T2.4 needs T2.2. T2.5 needs T2.1. T2.6 follows T2.1 to T2.5 and T3.2. T2.7 follows T1.2. T2.8 is last. M2 may overlap with M3.1 and M4 (different files, different agents).

---

## M3 Shared contracts and secure preload bridge

**Responsible agent.** desktop-engineer (contracts, handler registration, preload). necro-architect reviews the shared contract (`shared-ownership-policy.md` 3.1). security-reviewer reviews sender validation and the bridge.

**Agent Skills.** `electron-security`, `typescript-standards`.

**Dependencies.** M1 for T3.1. T3.2 requires T3.1 and T2.2 (`sender-validation.ts`, `trusted-origins.ts`). T3.3 requires T3.1 only.

**Tasks.**

- [x] **T3.1 Shared contracts.** `src/shared/ipc/{channels,result,app-info,index}.ts`: `IPC_CHANNELS`, `ipcResultSchema`, `ipcErrorSchema`, error codes, `appInfoRequestSchema`, `appInfoSchema`, `platformSchema`, `appInfoResponseSchema`, all `z.strictObject` and bounded, plus unit tests. No Electron, DOM or Node imports. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
- [x] **T3.2 Handler registration.** `src/main/ipc/register-handler.ts` (sender check, request parse, handler in try/catch, response parse, no throw across IPC, disposer) and `src/main/ipc/app-handlers.ts`, plus unit tests with an `ipcMain` fake. Do not edit `src/main/index.ts`; T2.6 imports these modules and registers them. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T3.3 Preload bridge.** `src/preload/index.ts`: one frozen object `necroamp.app.getInfo` returning `Promise<unknown>`, `contextBridge.exposeInMainWorld('necroamp', api)`. Unit test with fakes asserts the key set. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T3.4 Contract review.** necro-architect reviews `src/shared/ipc/**` against ADR 0005 and `shared-ownership-policy.md`; security-reviewer writes the M3 security review. **DONE (human decision): the security deliverable is the canonical `docs/security/m2-m3-security-review.md`** (`desktop-foundation-m3-review.md` is not created, no duplicate). Contract review: section "Addendum: T3.4 contract review of `src/shared/ipc/**`" in `docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md` (verdict ACCEPT, no blockers; C-1 and C-2 are documentation follow-ups, C-3 to C-5 need no action). Why the task text is met: the necro-architect review against ADR 0005 and the ownership policy is recorded, and the security review covers sender validation, Zod validation, the preload surface and error sanitization with zero blockers. The F-5 decision is in the ADR 0005 addendum. Limits: code reading only; renderer adapter code, test assertions and runtime behavior are not covered (T4.2, T7.x). Acceptance criterion 5 (full green `typecheck`, `lint`, `test`) rests on the exit codes recorded in `docs/engineering/m2-m3-acceptance-report.md`.

**Expected deliverables.** `src/shared/ipc/**`, `src/main/ipc/**`, `src/preload/index.ts`, co-located tests, `docs/architecture` review note, M3 security review.

**Requirements traceability.** R4 (channel constants, one channel, Zod validation on receipt, sender validation, narrow bridge, unregistered channels; R4.8 partial, N3), R2.4 (shared has no DOM or Node), R3.5 (trusted frame), R15.

**Acceptance criteria.**
1. The only channel is `app:get-info`; channel literals appear only in `channels.ts` (lint and source scan).
2. `registerHandler` returns `INVALID_SENDER` before reading the payload, `INVALID_PAYLOAD` with no issue text, `INTERNAL` on throw or shape drift, and never throws.
3. Preload exposes exactly `necroamp.app.getInfo`; no `ipcRenderer`, no generic invoke.
4. Shared project compiles with no DOM and no Node types.
5. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass. This is the first full green typecheck for `shared`, `main`, `preload` (V6, partial).
6. security-reviewer and necro-architect report zero blockers.

**Validation commands.**

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

**Parallelism.** T3.1 can start right after M1 and in parallel with M2. T3.2 and T3.3 can run in parallel after T3.1 (T3.2 also needs M2.2). T3.4 reviews run in parallel with each other after T3.3.

---

## M4 React renderer and neutral application shell

**Responsible agent.** frontend-engineer.

**Agent Skills.** `typescript-standards`, `electron-security`, `skin-development` (to keep region ids and `data-part` hooks Skin Engine compatible; no skin code is written).

**Dependencies.** M1; T3.1 for the response schema used by the adapter. Independent of the main-process implementation, because tests use a fake client.

**Tasks.**

- [x] **T4.1 Entry files.** `src/renderer/index.html` (`lang="en"`, `<title>NecroAmp</title>`, no meta CSP in source), `main.tsx` (no CSS import until T5.2 exists), `env.d.ts` (typed `window.necroamp`).
- [x] **T4.2 Bridge adapter and store.** `app/bridge/necroamp-client.ts` (`createNecroampClient`, the only reader of `window.necroamp`), `stores/app-info-store.ts` (`createAppInfoStore(client)`), `useAppInfo` hook, plus tests with a fake client.
- [x] **T4.3 Strings and layout.** `app/strings/en.ts` (typed constants, including the exact tagline `Code. Listen. Repeat.`), `app/shell-layout.ts` (`REGION_IDS`, `FOUNDATION_LAYOUT`).
- [x] **T4.4 Shared components.** `components/control-button`, `region-frame`, `status-text` (props only).
- [x] **T4.5 Regions.** For `player`, `playlist`, `equalizer`, `visualization`, `skin-selector`, `github`: `index.ts`, `<name>-region.tsx`, `<name>-view.tsx`, `use-<name>.ts`. Equalizer shows ten labelled band placeholders. Buttons are `aria-disabled` and focusable with visible "Not implemented in this phase" text. View files import their `*.module.css` only after T5.3 creates them.
- [x] **T4.6 Shell.** `app/app-shell.tsx`: header with the single `h1` and tagline, `main` with six labelled sections, `data-testid` equal to each region id, "unavailable" state when the bridge is missing (R8.10).
- [x] **T4.7 Component tests.** Co-located `*.test.tsx`: six regions, tagline, one `h1`, store states, placeholder activation updates `StatusText`.
- [x] **T4.8 Renderer validation.** `pnpm typecheck`, `pnpm lint` and `pnpm test` for the renderer project. The V5 build part is DEFERRED to T7.0 (needs main, preload and renderer entries plus the M5 CSS). Do not add stubs.

**Expected deliverables.** `src/renderer/**` as in design section 1, co-located tests.

**Requirements traceability.** R8 (initial window: tagline, six regions, test ids, bridge-missing state, min size 800x600 layout), R9 (landmarks, names, focus order, one `h1`, `lang`), R10 (state, injected client, no audio state), R2.3 (feature isolation), R4.9 (single adapter).

**Acceptance criteria.**
1. The shell renders the exact tagline and six regions with stable ids and test ids.
2. No `AudioContext`, `requestAnimationFrame`, `style` prop, remote URL or `window.necroamp` access outside the adapter (lint and source scan).
3. User-facing strings come only from `strings/en.ts`.
4. Features import no other feature's internals; no `../../../` chains.
5. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass for the renderer. M4 is "IMPLEMENTED, integration pending: T5.2, T5.3, T7.0" until the build check at T7.0 shows `out/renderer/index.html` with the meta CSP (V5).

**Validation commands.**

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

**Parallelism.** T4.1 to T4.4 in parallel (disjoint files); T4.5 after T4.3 and T4.4; T4.6 after T4.5; T4.7 alongside each piece; T4.8 last. M4 runs in parallel with M2 and M3 (different agent), and with M5 token files.

---

## M5 Styling foundation and future Skin Engine compatibility

**Responsible agent.** frontend-engineer. art-director performs an optional read-only seam review that writes one note under `docs/design/`.

**Agent Skills.** `skin-development`, `typescript-standards`. art-director: `skin-development`.

**Dependencies.** Token and global CSS files (T5.1, T5.2) have no dependency beyond M1 and may start in parallel with M4. Region CSS Modules (T5.3) need M4.5. Contrast checks need the final tokens. T5.2 requires T4.1. T5.3 requires T4.5. The CSS import statements in `main.tsx` and in the views are added by T5.2 and T5.3 and are part of those tasks.

**Tasks.**

- [x] **T5.1 Tokens.** `app/styles/tokens.css`: color roles, spacing, type scale, radii, focus ring, font family tokens. Neutral dark gray and off-white palette. No Morgul Revenant palette value and no Analog 1984 look appears (design 8).
- [x] **T5.2 Global CSS and reset.** `app/styles/global.css`, imported once from `main.tsx`.
- [x] **T5.3 CSS Modules.** `*.module.css` per view using tokens only (no literal colors), `data-part` hooks, named grid areas from `FOUNDATION_LAYOUT`, `min-width: 0`, `overflow-wrap: anywhere`, layout valid at 800x600 and 1920x1080.
- [x] **T5.4 Contrast function and tests.** `app/theme/contrast.ts` (WCAG luminance, pure) with a test that reads token pairs from `tokens.css` and asserts text >= 4.5:1, large text and focus indicator >= 3:1.
- [ ] **T5.5 Seam review (optional).** art-director reads the shell and CSS and writes `docs/design/desktop-foundation-skin-seams.md` mapping each Morgul Revenant and Analog 1984 need (materials, custom controls, typography, geometry, chrome, effects) to the seams in design 8, and lists gaps. No art, fonts or assets are created, so no `docs/assets.md` entry is needed.

**Expected deliverables.** `app/styles/*.css`, per-view CSS Modules, `app/theme/contrast.ts` and test, optional design note.

**Requirements traceability.** R8.13 (CSS custom properties), R9.3, R9.4 (contrast), R9.7 (no animation), R8.11 (layout at both sizes), R2.3; design 8 compatibility constraints (skins are data; confined skin protocol root; license records; no third-party art).

**Acceptance criteria.**
1. No literal color outside `tokens.css`; no inline style, no `style` prop, no `@import`, no remote `url()` (lint, source scan).
2. Contrast tests pass for all declared pairs.
3. Region ids, `data-part` hooks and `FOUNDATION_LAYOUT` are unchanged by styling (a Skin Engine layout can reference them later).
4. CSP unchanged: `style-src 'self'` still sufficient in the built app (checked in M7 after T7.0 by CSP-violation listener).
5. If T5.5 runs, it records every gap as a future-design item and none as a foundation change.

**Validation commands.**

```powershell
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm build` is DEFERRED to T7.0.

**Parallelism.** T5.1, T5.2 and T5.4 in parallel and early; T5.3 after M4.5; T5.5 after T5.3 and independent of the rest.

---

## M6 Unit, integration, property-based and accessibility testing

**Responsible agent.** qa-engineer. Defects found in source are reported to desktop-engineer or frontend-engineer, never patched by qa-engineer.

**Agent Skills.** `testing-strategy`, `electron-security`, `typescript-standards`.

**Dependencies.** M2, M3, M4 and M5 code exists. `vitest.config.ts` from M1.

**Tasks.**

- [x] **T6.1 Property tests** (`*.property.test.ts`, at least 100 runs, seed reported): `resolveAppPath` never throws and never escapes under `path.posix` and `path.win32`; origin check; `buildCsp` (production never contains dev allowance, for every input including a dev origin and mode flags; development never contains `unsafe-eval` or remote scripts; human gate 3); IPC payload parser and `registerHandler`; platform policy (unknown platform quits); `resolveLoadTarget`; menu builder (no unknown roles); contrast function. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T6.2 Static and boundary tests.** `tests/static/source-policy.test.ts` (single `new BrowserWindow`, no literal channel names, no `shell.openExternal`, `AudioContext`, `requestAnimationFrame`, `crashReporter`, `autoUpdater`, `net`, `fetch`, no `style` prop), `tests/lint-rules/*.test.ts` (each boundary rule fails on a fixture through the ESLint `Linter` API). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T6.3 Integration tests.** Protocol handler against a fake `fs` for the escape case, and one real temporary directory with a symlink where the platform permits (reported SKIPPED with reason on Windows without privilege). Preload plus `registerHandler` round trip with fakes. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T6.4 jsdom accessibility tests.** Names, roles, one `h1`, `lang`, focus order, `aria-disabled` placeholder behavior (R9). These complement, and do not replace, the axe scan in M7. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T6.5 Coverage gate.** Finalize thresholds in `vitest.config.ts` (80/80/80 and 75 branches; 95 for the security-critical files, including the two extra files, N5) and run V8 in full. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T6.6 Traceability file.** `docs/testing/desktop-foundation-traceability.md` mapping R1 to R17 criteria to tests, with N3 (R4.8 partial) stated. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.

**Expected deliverables.** Property, static, lint-rule, integration and accessibility tests; final Vitest config; coverage report; traceability file.

**Requirements traceability.** R12 (unit and property tests, offline, deterministic), R2.3 (boundary fixtures), R3 to R7 (security and lifecycle logic under test), R9 (static and jsdom accessibility), R11.4 (single-run commands), R14.

**Acceptance criteria.**
1. `pnpm test` passes, offline, with no clock, network or home-directory dependency.
2. `pnpm test:coverage` meets every threshold and prints the report; failures name the file.
3. Each property test file runs at least 100 cases and prints a seed on failure.
4. Every R1 to R17 criterion is mapped to a test or to an explicit "NOT VERIFIED / E2E in M7" entry.
5. `pnpm typecheck` passes for all five projects (V6 complete) and `pnpm lint` passes (V7).

**Validation commands.**

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
```

**Parallelism.** T6.1, T6.2, T6.3 and T6.4 are independent files and can run in parallel (separate qa-engineer sessions). T6.5 and T6.6 follow.

---

## M7 Electron smoke tests and production build validation

**Responsible agent.** qa-engineer (Playwright and axe), release-engineer (production build inspection). Orch runs commands outside their shells and integrates. The human runs interactive `pnpm dev`.

**Agent Skills.** `testing-strategy`, `electron-security`, `cross-platform-packaging` (build output only; no installers).

**Dependencies.** M6 and the tasks in the dependency table (T2.6, T2.7, T3.3, T4.6, T5.2, T5.3), which T7.0 checks.

**Tasks.**

- [x] **T7.0 Whole-application build validation (V5 build part).** Also serves as the esbuild functionality validation accepted in human gate 4 (S1). Precondition: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `main.tsx` and every imported CSS file exist. Orch (or qa-engineer) runs `pnpm build` once. Record the exit code, `out/main/index.js`, `out/preload/index.js` and `out/renderer/index.html`, and the meta CSP. If a precondition is missing, record "BLOCKED by T.." and stop. Do not create stubs. M2, M4 and M5 are reported PASSED only after this task passes. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T7.1 Playwright setup.** qa-engineer writes `playwright.config.ts` (`workers: 1`, `retries: 0`, traces on failure) and the launch fixture (`_electron.launch` on `out/main/index.js`, `ELECTRON_RENDERER_URL` removed, `NECROAMP_E2E_USER_DATA` temp dir, teardown on failure, global-setup check that `out/main/index.js` exists and is current). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T7.2 Smoke and security E2E.** Title, tagline, six regions, platform equals host; live web preferences; `require`, `process`, `Buffer`, `ipcRenderer` undefined in the renderer; bridge key set; effective CSP by header and meta; inline script and remote fetch blocked; all requests on `app://renderer`; navigation to `https:`, `http:`, `file:`, `data:`, `javascript:` stays on the app URL; `window.open` returns null and opens no window; permission request denied. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T7.3 Lifecycle E2E.** Second instance exits and focuses the first window; last-window-close behavior for the host platform; quit within 5 seconds; layout bounding boxes at 800x600 and 1920x1080; keyboard Tab order. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T7.4 Accessibility scan (V10).** `@axe-core/playwright` against the real page, with the documented fallback (inject `axe-core`, call `axe.run`) if the constructor does not accept an Electron `Page`. Zero serious or critical violations; incomplete checks recorded. Imports restricted to `tests/e2e` (E1). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
- [x] **T7.5 Production build validation.** **COMPLETE (RUNTIME VERIFIED on Windows x64; evidence in `docs/release/desktop-foundation-build-validation.md`).** release-engineer runs `pnpm build` once and writes `docs/release/desktop-foundation-build-validation.md`: output layout, preload is one CommonJS file, built `index.html` has the meta CSP and no inline script, no source maps shipped by default, no mention of `axe` anywhere in `out/` (E1). **Validation note (human gate 4, S1):** confirm esbuild works in the real build (the build exits 0 and produces the three outputs); this is the functional check for the esbuild `postinstall`, which was not directly observed. Packaging, installers and `electron-builder` are not touched (D10).
- [ ] **T7.6 Interactive development run.** Human runs `pnpm dev`, confirms the window appears, no CSP violation beyond the accepted dev allowance (N2), then closes it. Validation duty (gate 3): record whether `unsafe-inline` for script and style is actually needed; remove any allowance that is not. Orch records V4 and V5 (dev part).
- [ ] **T7.7 Final matrix run.** Orch runs `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e` and `pnpm licenses` (V11) once each and records PASSED, FAILED or NOT VERIFIED per platform and per kind (R16.3). macOS and Linux rows read NOT VERIFIED.

**Expected deliverables.** `playwright.config.ts`, `tests/e2e/**`, `docs/release/desktop-foundation-build-validation.md`, run record with V4, V5, V9, V10, V11.

**Requirements traceability.** R13 (E2E scope, isolation, ignored output), R5.7 (effective CSP), R6 (navigation, windows, permissions in the real app), R7 (lifecycle), R8.11 (layout), R9.6 (axe), R11 (build and test commands), R16.3 (platform reporting), R1.7 with E1.

**Acceptance criteria.**
1. `pnpm build` exits 0 and the output layout matches design 3.1 and 4 (V5).
2. `pnpm test:e2e` passes on Windows x64: Electron launches (V4), the smoke test runs (V9), no browser binary was downloaded by Playwright.
3. The axe scan completes with zero serious or critical violations (V10).
4. Tests wait on observable state, with no fixed sleeps; each test cleans up its Electron process and temp directory.
5. No `axe` text in production output; production dependency licenses still permissive (V11).
6. Every failure has a defect report to its owner; none is patched by qa-engineer.

**Validation commands.**

```powershell
pnpm build
pnpm test:e2e
pnpm test:coverage
pnpm licenses list --prod --json
Select-String -Path out -Pattern 'axe-core' -Recurse
```

**Parallelism.** T7.1 first. T7.2, T7.3 and T7.4 can then be written in parallel (separate spec files, one launch fixture), but **executed with `workers: 1`**. T7.5 runs in parallel with T7.1 to T7.4 (release-engineer, read-only on source). T7.6 and T7.7 are sequential last steps.

---

## M8 Final security review and integration

**Responsible agent.** security-reviewer (final review), necro-architect (quality gate and ADR consistency), Orch (integration, status, evidence). The human gives final approval.

**Agent Skills.** `electron-security`, `cross-platform-packaging`, `testing-strategy`, `typescript-standards`, `skin-development` (seam check).

**Dependencies.** M7 complete with recorded results.

**Tasks.**

- [x] **T8.1 Committed baseline (human).** **COMPLETE: baseline committed and pushed on `feature/desktop-foundation` (HEAD 10dfc3f, PR #5); base_ref 66f9f7f (merge-base with origin/main, unchanged after fetch).** The `quality-review` workflow compares committed history (`git diff {{base_ref}}...HEAD`), and agents are not allowed to commit. The human commits the foundation work on branch `feature/desktop-foundation` (or tells Orch to) and supplies `base_ref`, the commit before the foundation work. Without this step the diff-scope report would miss uncommitted and untracked files.
- [x] **T8.2 Quality review (workflow).** **COMPLETE (run label `desktop-foundation-final`, range 66f9f7f...10dfc3f): verdict APPROVE WITH FIXES, 0 blockers, 2 major (V-1, V-2: human decisions), 14 minor. Reports: `docs/architecture/review-desktop-foundation-final-verdict.md` and the four review-desktop-foundation-final reports. Note the run label differs from the task text (`desktop-foundation-1`). Findings are routed, not fixed here; V-1 and V-2 are required before merge.** Run `.kiro/workflows/quality-review.workflow.json` with `run_label` = `desktop-foundation-1` and the `base_ref` from T8.1. Validated before use: the recipe has inputs `run_label` and `base_ref`; its agents `release-engineer`, `necro-architect`, `security-reviewer` and `qa-engineer` exist; every artifact path (`docs/release/`, `docs/architecture/`, `docs/security/`, `docs/testing/`) lies inside the writing agent's scope; its git commands match release-engineer's allow list and none matches a deny pattern; it is read-only and never commits, pushes or publishes. Runtime acceptance by Kiro is ASSUMED because the workflow has not been launched (`preflight.md` A). The qa review step runs only typecheck, lint and test, so Orch also supplies the T7.7 coverage, build and E2E results to the verdict author.
- [x] **T8.3 Final security review.** **DONE: `docs/security/desktop-foundation-final.md` (verdict APPROVED, zero open blockers, no High or Medium; Low and Informational findings FR-1 to FR-4 each have an owner; machine-readable copy in `docs/security/desktop-foundation-final-review.json`). The report was renamed from `desktop-foundation-final-review.md` with `git mv`; no new review was run. Limits: read-only code review, test and E2E results DOCUMENTED not re-run, macOS and Linux NOT VERIFIED, F-3 mandatory pre-public-release reassessment still open, packaging checks (F-7) deferred.** security-reviewer writes `docs/security/desktop-foundation-final.md`: Electron checklist from the `electron-security` skill, IPC and sender validation, CSP, protocol confinement, navigation and permissions, logging, dependency and lifecycle policy, E1 conditions, script bodies, `.npmrc` text quoted by Orch. Severity per finding; zero open blockers required (R15.5).
- [x] **T8.4 Architecture gate.** **COMPLETE: `docs/architecture/desktop-foundation-architecture-gate.md`, verdict APPROVED (GATE: PASS), static review, no blockers; A-1 to A-4 non-blocking.** necro-architect checks module boundaries, ADR 0002 to 0005 against the final code, that no `structure.md` open decision was resolved silently, and the Skin Engine seams (design 8). Output in `docs/architecture/`.
- [ ] **T8.5 Integration.** Orch fixes up cross-cutting files only (README commands and platform status, `.gitignore`), adds the session entry to `docs/kiro-journal.md` (Kiro usage evidence: spec, design amendments, agents, skills, workflow), updates the status of `tasks.md`, and reports defects to owners for correction. It verifies hooks `post-task-quality` and `ipc-security-check` remain disabled (the human confirms in the Kiro hooks panel).
- [ ] **T8.6 Final report and approval.** Orch presents PASSED, FAILED or NOT VERIFIED per platform and kind, V1 to V11 outcomes, open findings and decisions. Human approves. Packaging, signing, auto-update and Linux targets stay deferred (D7, D10).

**Expected deliverables.** Workflow reports (`docs/release/review-desktop-foundation-1-diff-scope.md`, architecture, security and testing reviews, verdict), `docs/security/desktop-foundation-final.md`, gate note, updated README, journal entry, final report.

**Requirements traceability.** R15.5 (zero open blockers), R16.3 (platform reporting), R17 (ADRs, hand-offs, cited sources, journal evidence), R1.7 with E1 (final license check), and a closing pass over R1 to R17 through `docs/testing/desktop-foundation-traceability.md`.

**Acceptance criteria.**
1. Workflow verdict is APPROVE or APPROVE WITH FIXES with no blocker; any blocker means REJECT and a separate remediation run.
2. `docs/security/desktop-foundation-final.md` has zero open blockers; every major finding has an owner and a decision.
3. Traceability file maps every requirement to evidence or an explicit NOT VERIFIED.
4. V1 to V11 are all PASSED, or each exception was approved by the human.
5. No secret, token or personal data in the repository; `.kiro/` committed and not ignored.
6. macOS and Linux appear as NOT VERIFIED everywhere unless run on those hosts.

**Validation commands.**

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:coverage
pnpm build
pnpm test:e2e
git status --short
```

**Parallelism.** After T8.1, the three reviews inside `quality-review` run in parallel (the workflow's own `parallel` step), and T8.3 and T8.4 can run in parallel with it as separate sessions. The verdict, T8.5 and T8.6 are sequential.

---

## Cross-milestone traceability

| Requirement | Milestones |
|---|---|
| R1 toolchain, installs, licenses | M0, M1, M7, M8 |
| R2 architecture, structure, boundaries | M1, M3, M4, M6 |
| R3 Electron security | M2, M6, M7 |
| R4 IPC | M3, M6, M7 |
| R5 CSP | M2, M6, M7 |
| R6 navigation and permissions | M2, M6, M7 |
| R7 lifecycle | M2, M7 |
| R8 initial window | M4, M5, M7 |
| R9 accessibility | M4, M5, M6, M7 |
| R10 state | M4 |
| R11 commands | M0, M1, M7 |
| R12 unit and property tests | M1, M6 |
| R13 E2E | M7 |
| R14 lint and format | M1, M6 |
| R15 privacy and security | M0, M2, M8 |
| R16 cross-platform | M1, M2, M7, M8 |
| R17 records | M0, M2, M8 |

## Open points carried into implementation

- N2 dev CSP deviation from R5.5 (accept or require a hash or nonce approach).
- N3 R4.8 only partially testable end to end.
- N5 extra 95 percent coverage files.
- N6 cross-cutting files outside the explicit D13 list (`.editorconfig`, `.gitattributes`, README section, `.prettierignore`).
- N7 `NECROAMP_E2E_USER_DATA` test input.
- N10 `.npmrc` unreadable by security-reviewer; mitigation is a one-line file quoted by Orch.
- `strictDepBuilds: true` is an approved deviation from the original R1.6 default (design E5).
- E1: MPL-2.0 exception for `axe-core` and `@axe-core/playwright` is human-approved, dev and accessibility test only.
- Execution policy: `pnpm.cmd` and `npm.cmd` are used; the policy is not changed (design E6).
- Branch point for `quality-review` (`base_ref`) and the human commit it requires (T8.1).


## Block B status (validated, labels)
- T7.5 production build validation: build exit 0 (RUNTIME VERIFIED); `docs/release/desktop-foundation-build-validation.md` not written, so the task stays open (INTEGRATION PENDING).
- T7.6 interactive `pnpm dev` run: DEFERRED (human).
- T7.7 final matrix: test:coverage, build, test:e2e PASSED on Windows (coverage: statements 99.44, branches 98.23, functions 100, lines 99.78; thresholds unchanged 80/80/80/75, 95 per critical file). `pnpm licenses` not run in Block B; macOS and Linux NOT VERIFIED. Stays open.
- T5.5 seam review, T8.x: DEFERRED.
- M6: COMPLETE. M7: not complete (T7.5 to T7.7 open).
- Defects 0001 to 0004: FIXED, closed.

## Block C status (fresh Windows x64 run, labels)
- T7.7 final matrix: typecheck, lint, format:check, test (768 passed, 2 skipped), test:coverage (99.44/98.23/100/99.78), build, test:e2e (35 passed), pnpm licenses (prod deps all MIT) all exit 0 on Windows. macOS and Linux NOT VERIFIED (R16.3). Kept unticked because its dependency T7.6 is open.
- T7.5: COMPLETE. docs/release/desktop-foundation-build-validation.md consolidates existing verified evidence plus facts re-checked on this tree.
- T7.6: PENDING. A bounded pnpm.cmd dev run (30 s, then process-tree kill) started electron-vite, built main and preload, served the renderer on port 5173 and opened a window titled NecroAmp; after the kill no node or electron process and no listener on 5173 remained. NOT observed: renderer console output (no CSP violation log), HMR, visual state. Static evidence only: the dev index.html contains an inline module script (React refresh preamble), so script-src 'unsafe-inline' is needed in dev; style-src 'unsafe-inline' was not shown to be removable or required. No dev CSP change was made. Human action: run pnpm dev, open DevTools, record CSP violations and whether style-src 'unsafe-inline' can be dropped, edit a renderer file to confirm HMR, then close the window.
- T7.7: PENDING until T7.6 closes (all commands exit 0).
- M7: INTEGRATION PENDING (T7.6, T7.7).
- T8.1: base_ref origin/main = 66f9f7f (merge-base of HEAD, unchanged after fetch; the PR base is the same commit). Branch is 10 commits ahead. Baseline is committed and pushed once this status is pushed.
- T8.2 (quality-review workflow), T8.4 (architecture gate), T8.6 (human approval): not done. T8.3: done. `docs/security/desktop-foundation-final.md` (renamed from `-final-review.md`) plus `desktop-foundation-final-review.json`, verdict APPROVED (no High or Medium), written read-only without a shell. T8.5: README, ADR notes, backlog, journal and delivery report updated.
- M8: INTEGRATION PENDING.
## Block D reconciliation (labels; base 66f9f7f, branch HEAD at review 10dfc3f; this step's edits are uncommitted until the integration commit)
- T7.5: COMPLETE (RUNTIME VERIFIED, Windows x64), `docs/release/desktop-foundation-build-validation.md`.
- T7.6: PENDING. Automated dev run (Electron 45.5.0, CDP) shows startup, renderer load, no page errors, clean shutdown, dev `script-src` and `style-src` `'unsafe-inline'` both required (style injection by Vite demonstrably blocked without it), production CSP unchanged. HMR NOT tested, and the Spec text requires a human-run `pnpm dev`. The evidence report `docs/release/desktop-foundation-dev-runtime-validation.md` is not yet written. Remaining: (1) write that report from the recorded evidence; (2) run the reversible HMR probe (tagline in `src/renderer/app/strings/en.ts`, padding in `app-shell.module.css`, restore, `git diff --quiet -- src/renderer`); (3) human confirms they ran `pnpm.cmd dev`, saw the window and closed it, or accepts the automated run in its place.
- T7.7: PENDING (all commands exit 0 on Windows, DEPENDS on T7.6). macOS and Linux NOT VERIFIED.
- T8.1: COMPLETE. T8.2: COMPLETE (APPROVE WITH FIXES). T8.3: COMPLETE (APPROVED). T8.4: COMPLETE (APPROVED).
- T8.5: PENDING. README, ADR notes, backlog, journal and delivery report updated; the human has not confirmed that hooks `post-task-quality` and `ipc-security-check` stay disabled.
- T8.6: PENDING (human approval). Before merge: V-1 (confirm approval of the `.kiro/steering/tech.md` E-ESM-1 edit) and V-2 (name an owner for unowned tooling paths, or accept the risk).
- T5.5: DEFERRED, optional per the Spec (task title "optional"; acceptance item 5 starts "If T5.5 runs").
- F-3: mandatory reassessment before the first public release, OPEN. Packaging checks (F-7: fuses, ASAR integrity, devTools, `electron-builder.yml`) DEFERRED. GitHub CI ABSENT (not passing). macOS and Linux NOT VERIFIED.
- Actionable findings by owner: desktop-engineer: V-3 (dev CSP, after T7.6), V-6, V-8, V-10 (with frontend-engineer), A-1 ADR note owner is necro-architect; qa-engineer: V-12, V-13, V-14; release-engineer: V-4, V-5; necro-architect: A-1, A-4. No finding requires a src/renderer change today.
## Block E reconciliation (T7.6 HMR, V-1, V-2)
- T7.6: PENDING. Automated validation PASSED on Windows x64 (report: `docs/release/desktop-foundation-dev-runtime-validation.md`). Startup, renderer load, no page errors, clean shutdown, HMR for TS (tagline) and CSS (padding) with no full reload, files restored (`git diff --quiet -- src/renderer` exit 0), dev `script-src` and `style-src` `'unsafe-inline'` both required, production CSP unchanged, `pnpm build` exit 0 afterwards. The Spec text requires a human-run `pnpm dev`, so it stays pending. Only remaining action: the human runs `pnpm.cmd dev`, sees the window and closes it, or accepts the automated run in its place.
- T7.7: PENDING on T7.6 only (all commands exit 0 on Windows; macOS and Linux NOT VERIFIED).
- V-1: the human approved the `.kiro/steering/tech.md` E-ESM-1 edit earlier (recorded here per the orchestrator).
- V-2: owner of the unowned tooling and config files (`eslint.config.mjs`, `prettier.config.mjs`, `.npmrc`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.editorconfig`, `.gitattributes`, `.prettierignore`, `.gitignore`) is the authorized top-level orchestrator. No permission widening.
- T8.5: PENDING (human hook confirmation requested). T8.6: PENDING; not merged.
