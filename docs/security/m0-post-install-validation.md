# M0 post-install validation

Scope: evidence collected after the human operator ran `pnpm.cmd install --frozen-lockfile` manually in the repository root (Windows x64, PowerShell 7, pnpm 10.34.9). The agent did not run the install: Kiro's tool guard blocked the agent-run attempt, and the operator ran it instead. No agent permissions or security policies were changed. The checks below are read-only, except that `pnpm audit` and `npm view` made registry queries.

## Results

| Check | Command | Exit | Result |
|---|---|---|---|
| Install | `pnpm.cmd install --frozen-lockfile` (run by the operator) | 0 per the operator | `node_modules` is present. `.modules.yaml` records `packageManager: pnpm@10.34.9`, layout version 5. |
| Lockfile integrity | `Get-FileHash pnpm-lock.yaml -Algorithm SHA256` | 0 | `E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659`, identical to the pre-install hash. The lockfile is untracked, so `git diff` is empty by construction. The hash match is the evidence. |
| Top-level versions | `pnpm.cmd ls --depth 0 --json` compared with the `package.json` pins | 0 | 0 mismatches across all 32 pins. Examples: electron 45.5.0, electron-vite 6.0.0, vite 7.3.8, typescript 6.0.3, vitest 5.1.2, react 19.3.1, zod 4.6.7, zustand 5.1.0, eslint 9.39.5. Every package resolved from `https://registry.npmjs.org/`. |
| Effective lifecycle policy | `pnpm-workspace.yaml` | n/a | `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. There is no `dangerouslyAllowAllBuilds`, and electron is not allowlisted. |
| C1 scripts that ran | `pnpm.cmd ignored-builds`, `node_modules/.modules.yaml` | 0 | Automatically ignored builds: none. `pendingBuilds` and `ignoredBuilds` are empty. strictDepBuilds would have failed the install if any unlisted package had a build script, so exit 0 means only esbuild@0.28.2 was eligible to run. The esbuild binary package `@esbuild/win32-x64@0.28.2` is installed. Electron's `dist/` and `path.txt` are absent, which confirms that no electron script downloaded the binary. |
| C2 build-flagged set | `Select-String pnpm-lock.yaml 'requiresBuild'` | 0 | 0 matches. pnpm 10 lockfiles do not record `requiresBuild`. The effective set is esbuild (allowed and executed) plus fsevents (denied, and also skipped on win32 as an optional platform package). No other package was flagged. |
| C3 config | Verified by the orchestrator before install | n/a | There is no project or user `.npmrc` and no relevant environment variables. The registry is `https://registry.npmjs.org/` with strict-ssl true and no proxy or CA overrides. |
| C4 audit | `pnpm.cmd audit` | 0 | "No known vulnerabilities found". There are 0 high and 0 critical findings. |
| S5 provenance | `pnpm.cmd why …` and `npm.cmd view <pkg>@<ver> maintainers license repository.url` | 0 | `@electron-internal/extract-zip@1.0.10` (MIT, `github.com/electron/extract-zip`; maintainers: marshallofsound, electron-cfa, electronhq). `@electron/get@5.1.0` (MIT, `github.com/electron/get`; maintainer: electron-cfa). Both are pulled in only by `electron@45.5.0`, a devDependency. The maintainers are Electron project accounts, so S5 is resolved. |
| T0.8 / V11 licenses | `pnpm.cmd licenses list --json` and `--prod --json` | 0 | Prod: MIT only (7 packages). All: MIT 333, Apache-2.0 22, ISC 11, BSD-2-Clause 9, BSD-3-Clause 3, BlueOak-1.0.0 4, Python-2.0 1, CC-BY-4.0 1, CC0-1.0 1, MPL-2.0 2 (`@axe-core/playwright@4.14.1` and `axe-core@4.14.1` only, exception E1). Every license is in the accepted set. |

## Limits

- The agent did not see the operator's console output. "Only esbuild's postinstall ran, with no lists-ignored warning" is inferred from the exit code, the strictDepBuilds semantics and the `node_modules` state, not from a log.
- The skipped optional packages (non-win32 esbuild, rollup and rolldown binaries, fsevents, and the wasm-only `@emnapi`, `@napi-rs` and `@tybys` packages) were not installed. This is expected on win32.

## Still open in M0

- V3, the Electron binary download: Electron's `dist/` is absent, so `pnpm exec electron --version` (M0 acceptance criterion 4) and the embedded Node value (Appendix A.7) are not yet available. T0.8 schedules this download.
- `.gitignore` additions for `test-results` and `playwright-report` (T0.4).
- ADRs 0002 to 0005 and `docs/architecture/dependency-versions.md` (T0.3) are not covered by this record.
