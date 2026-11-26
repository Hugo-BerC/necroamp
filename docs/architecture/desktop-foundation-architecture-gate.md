# Desktop Foundation architecture gate (T8.4)

GATE: PASS

**Verdict: APPROVED** (zero blocking findings).

- Author: necro-architect. Scope: branch `feature/desktop-foundation`, PR #5, HEAD `10dfc3f`, verified base `66f9f7f`.
- Artifact name: `.kiro/specs/desktop-foundation/tasks.md` T8.4 requires only "Output in `docs/architecture/`" and names no file. This path was chosen. The `quality-review` workflow writes its own `review-<run_label>*.md` files, which are a separate artifact (T8.2).
- Method: read-only review of the `src/**` import graph and key modules (greps over non-test sources), ADRs 0001 to 0005, design sections 3 and 8, `structure.md` open decisions, and the existing delivery, release and security records. No code was run. Test and E2E results (768 passed, 2 skipped; 35 E2E; coverage thresholds met) are cited from `docs/engineering/desktop-foundation-delivery-report.md`, not re-run.
- Accepted decisions were not reopened.

## 1. Checks required by T8.4

| Check | Result | Evidence |
|---|---|---|
| Module boundaries and dependency direction (`structure.md`) | PASS | `src/shared/**` imports only `zod` and siblings; no Electron, DOM or Node API. `src/renderer/**` imports only `@renderer/*`, `@shared/*` and React/Zustand; no `@main` and no `electron`. `src/main/**` imports `@shared/*` and relative siblings, with no `../../..` chains. `src/preload/**` imports `electron` (contextBridge, ipcRenderer) and `@shared/ipc` only. Feature folders import `@renderer/app/strings`, `@renderer/components/*` and their own files, not each other's internals. Lint boundary rules (ADR 0002 item 2) enforce this. |
| ADR 0002 (single package, tooling, E-ESM-1) | PASS | One root package; `.mjs` configs; main and preload built as CommonJS, renderer as ES modules; `sandbox`, `contextIsolation`, `webSecurity` stay on. Preload is a single file and loads under sandbox (E2E, delivery report section 3). `tech.md` already carries E-ESM-1. |
| ADR 0003 (`app://renderer`, scheme privileges, CSP) | PASS | Production CSP is in `security/csp.ts` with an explicit mode; `corsEnabled` fallback was not needed (E2E). Dev CSP deviation remains conditional on T7.6 (see finding A-2). |
| ADR 0004 (lifecycle scripts) | PASS | Recorded as satisfied by M0 closure and the frozen offline install exit 0. Not re-audited here. |
| ADR 0005 (IPC, chrome, lifecycle, menu) | PASS with documentation drift (A-1) | One channel `app:get-info` as `IPC_CHANNELS`; `registerHandler` is the single `ipcMain.handle` caller path; bridge is a frozen `necroamp.app.getInfo` returning `unknown`; `ChromeProfile` is a union with only `native`; no `openExternal`, `safeStorage`, `crashReporter.start`, `AudioContext`, Octokit, Shiki, `music-metadata` or `electron-updater` anywhere in `src` or `package.json`. |
| `structure.md` open decisions not silently resolved | PASS | Resolved only through human-approved ADRs: 1, 8, 9 (ADR 0002) and 16 and 17 for this phase (ADR 0005, single window, English). Decisions 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15 are untouched by code. Steering still lists 1, 8 and 9 as open (finding A-3). |
| Skin Engine seams (design section 8) | PASS (seam-ready, untested against a skin) | `RegionFrame` with `data-part` hooks, `FOUNDATION_LAYOUT` descriptor with no style values (guarded by `shell-layout.test.ts`), behavior hooks separate from views, tokens in `tokens.css`, CSS Modules with no hex or rgb literals in component CSS, `ChromeProfile` union. No manifest, loader or skin protocol exists, as designed. T5.5 seam review remains optional and deferred. |
| Product principles | PASS | No network call, telemetry, crash reporting, GitHub code or cloud dependency in `src`. |

## 2. Findings

| ID | Severity | Finding | Owner | Blocking |
|---|---|---|---|---|
| A-1 | Low (documentation) | ADR 0005 F-5 addendum says validation uses `parent === null` plus an injected check and treats `frame === sender.mainFrame` as optional hardening S-1. The code (`sender-validation.ts`, commit `55c38d4`) now also requires `frame === sender.mainFrame`, runtime-verified across reload and crash recovery. The code is stricter than the ADR and fails closed. The "Runtime note" at the end of the ADR mentions it, but the F-5 text and the "Conditions" paragraph still read as if S-1 were not applied. | necro-architect (ADR text edit, next ADR touch) | No |
| A-2 | Low (conditional, tracked) | ADR 0003 item 6 condition (h) and F-4: dev `unsafe-inline` has not been shown necessary or removed. T7.6 evidence (console output, HMR) is not in the repository. This is an accepted, time-boxed deviation limited to development builds, and production CSP isolation is proven by `csp.test.ts` and `csp.property.test.ts`. Not an architecture defect. | desktop-engineer (T7.6 evidence and any removal) | No. It blocks T7.6 and T7.7, not this gate. |
| A-3 | Info | `structure.md` open decisions 1, 8 and 9 are still marked open although ADR 0002 resolved them with human approval. Agents cannot edit steering. | Human or Orch (steering edit; replacement text in `docs/architecture/tech-md-amendment.md` and the ADR) | No |
| A-4 | Info | `docs/architecture/contract-changes.md` does not exist. ADR 0005 finding C-2 says to create it with one baseline entry "initial `app:get-info` contract" when first needed. No contract has changed since M3. | necro-architect | No |
| A-5 | Info | Dependency-versions and design records predate some Block B and C changes. No drift was found in the files read, but they were not re-diffed against `package.json`. | necro-architect | No |

## 3. Preserved limits and carried items

- F-3 (TOCTOU in the `app://` handler, Low) stays a mandatory reassessment before the first public release.
- Packaging checks (F-7: fuses, ASAR integrity, `realpath` on the ASAR layout, production `devTools`, installers, signing, auto-update, Linux targets) stay deferred. ADR 0001 (Linux credential storage) has no code yet.
- macOS and Linux are NOT VERIFIED. Windows x64 only.
- GitHub CI is absent. This is not a pass.
- Limits of this gate: static review, no execution, no re-run of tests.

## 4. Hand-off

| Item | Owner |
|---|---|
| A-1 ADR 0005 text alignment | necro-architect |
| A-2 T7.6 dev runtime evidence and `unsafe-inline` decision | desktop-engineer, with Orch recording V4 and V5 |
| A-3 Steering open-decision status | Human or Orch |
| A-4 Baseline contract-changes entry | necro-architect |

T8.4 can be ticked on the strength of this document. T8.2, T8.6, T7.6 and T7.7 are separate gates.
