# M0/M1 Acceptance Report (Desktop Foundation)

Branch: `feature/desktop-foundation`. Nothing committed or pushed.

## Verdict
- **M0 (final, 2026-11-26): COMPLETE.** T0.1 to T0.8 are all ticked with evidence. All four human gates are resolved (below). The human accepted `docs/security/m0-security-review.md` as the canonical T0.6 deliverable; a factual addendum documents the root `.npmrc` (exactly `engine-strict=true`).
- **M1: acceptance criteria met.** The five criteria in `tasks.md` (M1) hold: `pnpm lint` exit 0, `pnpm format:check` exit 0, `pnpm test` 1 file and 9 tests passed including the alias-consistency test, the three alias tables are identical, and `pnpm typecheck` exit 0. T1.1 to T1.7 are ticked. The earlier finding F1 ("M1 source files missing") was wrong: `tasks.md` assigns main, preload and renderer entry points to M2 to M4 and defers the whole-application build to T7.0, and M1 expected only the seed files `src/main/constants.ts` and `src/shared/ipc/channels.ts`, which exist. F1 is withdrawn and is not an M1 failure.
- **Deferred by design, not failures:** `pnpm build` (T7.0, needs M2 to M5 entries), Playwright E2E (T7.1 to T7.7), the M1 gates that need a build (bridge under `sandbox: true`, web preferences test, electron-vite 6 config load, ESM-only main dependencies from the CJS main).
## Note on the instruction text

The user's instruction text was truncated at the end of the module review section ("Record any scoped exception to the steering requirements for ..."). The exception was recorded for the ES-module steering requirement only ("ES modules everywhere" in `tech.md`), as E-ESM-1 in ADR 0002 section 6.

## H0

H0 (host gate) PASSED. Host record is in `design.md`. Task T0.1 says not to reinstall. Host: Windows x64, PowerShell, Node 24 LTS, pnpm 10.34.9.

## Tasks (`.kiro/specs/desktop-foundation/tasks.md`)

Completed (checked): T0.1 to T0.8, T1.1 to T1.7. M0 and M1 are complete.

Open: none in M0 or M1.

Open, no evidence: T2.0 to T2.8, T3.1 to T3.4, T4.1 to T4.8, T5.1 to T5.5, T6.1 to T6.6, T7.0 to T7.7, T8.1 to T8.6.

## Agents and skills used in this workflow

- Agents named in the workflow reports: wf-coder (this step and the orchestration), desktop-engineer (input to the module review), necro-architect (module review and ADRs), security-reviewer (final security validation).
- Skills: `testing-strategy` was loaded in this step. The earlier step reports do not state which skills they loaded, so none are claimed for them.

## Files created or modified (git status)

Modified: `.gitignore`, `.kiro/specs/desktop-foundation/design.md`, `.kiro/specs/desktop-foundation/tasks.md`, `README.md`.

Untracked: `.editorconfig`, `.gitattributes`, `.nvmrc`, `.prettierignore`, `docs/adr/0002` to `0005`, `docs/requirements/`, `docs/security/` (m0-closure-validation, m0-dependency-validation, m0-final-security-validation, m0-post-install-validation, m0-resolution-report, m0-security-review), `electron.vite.config.ts`, `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `prettier.config.mjs`, `src/`, `tests/`, `tsconfig.json`, `tsconfig.{main,preload,renderer,shared,tests}.json`, `vitest.config.ts`. This report is also new (`docs/engineering/`).

The branch holds no commits of this work. Everything above is uncommitted.

## Installed and resolved versions

- Electron 45.5.0 binary, embedded Node 24.22.3, x64 win32 (from `m0-closure-validation.md`). Acquired through the human-run `install-electron`, not globally.
- Vitest 5.1.2 (from this run's output).
- eslint 9.39.5 (deprecated, dev-only, accepted as S4).
- esbuild 0.28.2.
- pnpm 10.34.9.
- Other versions are in `package.json` and `pnpm-lock.yaml`. All 31 top-level versions are in `docs/architecture/dependency-versions.md` (earlier "32" was a miscount).

## Lifecycle scripts executed

- Policy in `pnpm-workspace.yaml`: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. Electron is not allowlisted.
- `esbuild@0.28.2` is the only installed package with an install script. I could not confirm that its postinstall ran.
- Electron's binary came from the human-run `install-electron`.

## Validation commands (this run, `pnpm.cmd`, one run each)

| Command | Exit code | Result |
|---|---|---|
| `pnpm.cmd typecheck` (`tsc -b`) | 0 | clean |
| `pnpm.cmd lint` (`eslint .`) | 0 | clean |
| `pnpm.cmd test` (`vitest run`) | 0 | 1 file, 9 tests passed |
| `pnpm.cmd format:check` (`prettier --check .`) | 0 | all files formatted |

`pnpm build` was not run. It cannot succeed because `src/main/index.ts`, `src/preload/index.ts` and `src/renderer/index.html` do not exist.

Lockfile: SHA-256 of `pnpm-lock.yaml` is `E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659`. It matches the recorded value from `m0-post-install-validation.md`, so the lockfile is unchanged.

## ADRs

ADRs 0002 to 0005 are written. ADR 0001 is untouched.

- 0002: single package, tooling, module format (E-ESM-1).
- 0003: `app://renderer` protocol, privileges, CSP. The dev CSP deviation from R5.5 awaits human acceptance.
- 0004: dependency lifecycle script policy, `strictDepBuilds` deviation from R1.6 (E5), MPL-2.0 exception for the axe packages (E1).
- 0005: IPC security model and main-process lifecycle. Only M1 code that exists is covered.

## Module-system verdict

VALID WITH EXCEPTION. Omitting `"type": "module"` matches the approved architecture. Main and preload build as CJS `.js` (`out/main/index.js`, single-file `out/preload/index.js`), because a sandboxed preload must be one CJS file. The renderer is browser ESM. Tool configs are `.mjs`. Source stays ESM with named exports. E-ESM-1 is scoped to "ES modules everywhere" only and was approved by the human on 2026-11-26. Security accepts it, since `sandbox: true` stays on. The Electron and electron-vite behavior was recalled from documentation and has not been tested against a build.

## S1 conclusion

Resolved with a limit. pnpm applies the version-qualified allowlist (`esbuild@0.28.2` allowed, `fsevents` denied). The `strictDepBuilds` failure branch was never exercised, because that needs a violating install. Whether esbuild's postinstall ran is unconfirmed.

Other conditions: C1 to C4 satisfied, S2, S3 and S5 resolved, S4 accepted. `pnpm audit` found 0 vulnerabilities.

## Human gates resolved (2026-11-26)
- **Gate 1, E-ESM-1: APPROVED.** ADR 0002 section 6 and design E9 updated. `tech.md` is not edited; replacement text is in `docs/architecture/tech-md-amendment.md` for the orchestrator.
- **Gate 2, `.npmrc`: APPROVED and written.** Content is exactly `engine-strict=true` plus newline (19 bytes). `git check-ignore` shows it is not ignored. `node_modules/`, `out/`, `coverage/`, `.cache/`, `test-results/` and `playwright-report/` are ignored; `.kiro/` is not ignored and is tracked. T0.4 ticked.
- **Gate 3, ADR 0003 dev CSP: APPROVED WITH CONDITIONS.** ADR 0003 item 6 and design section 5 and N2 updated. Test requirement added to T2.2 and T6.1; removal of unneeded allowances is a validation duty at T7.6.
- **Gate 4, S1 limitations: ACCEPTED.** ADR 0004 updated. The `strictDepBuilds` rejection branch was not exercised and the esbuild `postinstall` execution was not observed. No reinstall. esbuild is validated in the real build (T7.0 and T7.5 notes). Policy and pins unchanged.
- **T0.2 ticked** (`m0-dependency-validation.md`, D1 resolved by the human). **T0.6 open** (see Verdict).
- The human's final instruction was truncated after "Retrieve existing evidence rather than repeating completed work: - M0 registry metadata validation. - Dependency ...". The T0.2 and T0.6 evidence lists were inferred from the task text; no further requirements were added.

## Remaining human gates
None. All human gates are resolved: E-ESM-1 approved (the `tech.md` amendment text is in `docs/architecture/tech-md-amendment.md`; the orchestrator applied it to `.kiro/steering/tech.md` after human approval), `.npmrc` approved and written, ADR 0003 dev CSP approved with conditions, S1 limits accepted, T0.6 deliverable accepted.
Carried forward (not gates): the build-dependent M1 checks move to T7.0 with the whole-application build; esbuild is validated in the real build.
## Git status

Branch `feature/desktop-foundation`. Four tracked files are modified. The remaining items listed above are untracked. No commit and no push.

