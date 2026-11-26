# M0 security review: dependency manifest and lifecycle configuration

Reviewer: security-reviewer (independent, read-only). Authority: `tech.md` (Dependencies, CI/CD), `product.md` principles 4 and 5, `design.md` section 9 (9.3 lifecycle policy, 9.5 licenses).
Status labels: VERIFIED (read in this review), DOCUMENTED (stated in another report or the design, not re-run), ASSUMED.

## Verdict: PASS WITH CONDITIONS

No blocking defect in the manifest, the lockfile or the allowlist. Four conditions must be met at or immediately after the installation approval gate (C1 to C4). No source modified.

## Scope and method
Files read: `package.json`, `pnpm-lock.yaml` (importers block fully, all `resolution`, `deprecated`, `optional` and prerelease lines by pattern search), `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, `docs/security/m0-dependency-validation.md`, `docs/security/m0-resolution-report.md`, `design.md` 9.3 and 9.4 to 9.5 policy text.
Not readable: `.npmrc` (agent deny rule `**/.npmrc`). Not possible: running pnpm, `pnpm audit`, registry or advisory lookups (no shell; web access limited to electronjs.org, docs.github.com, owasp.org, nvd.nist.gov).

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| S1 | Medium | `pnpm-workspace.yaml` (all 3 keys) | The resolution report ran `--lockfile-only` before this file existed and states the effect of `strictDepBuilds` "cannot be proven without a real install". Whether pnpm 10.34.9 honors a settings-only workspace file, and whether `ignoredBuiltDependencies: fsevents` counts as reviewed under strict mode, is UNVERIFIED (design 9.3, V1/V2). | Condition C1: run the install exactly as approved; treat a non-zero exit, a warning that the lists were ignored, or any script other than esbuild's `postinstall` as a stop. If rejected, move the same three keys to `pnpm` in `package.json` (design 9.3 fallback) or to `allowBuilds`, never to `dangerouslyAllowAllBuilds`. | orchestrator, desktop-engineer |
| S2 | Medium | `pnpm-lock.yaml`, whole file | `requiresBuild` is absent from the lockfile (VERIFIED by search; expected for `--lockfile-only`). The "only esbuild has a script" claim rests on 472 registry metadata lookups (DOCUMENTED, not re-run). Registry metadata can differ from what pnpm detects in the tarball (for example a script-less manifest with a `binding.gyp`). | Condition C2: after install, list packages that pnpm reports as having builds (`pnpm ignored-builds` and a lockfile search for `requiresBuild: true`). Expected set: esbuild 0.28.2 (allowed) and fsevents 2.3.3 (denied, optional, not installed on Windows or Linux). Any other entry stops work for human approval. | orchestrator |
| S3 | Medium | `.npmrc` (not readable) | Design 9.5 says it contains only `engine-strict=true` (DOCUMENTED). I could not read it. The lockfile records no registry URL, only `sha512` integrity, so the registry used at install time is decided by `.npmrc` and user-level config. | Condition C3: the human or orchestrator confirms the committed `.npmrc` has no `registry=`, `_authToken`, `proxy`, `cafile`, `strict-ssl=false` or path settings. Confirm no user-level `~/.npmrc` or `npm_config_*`/`PNPM_*` variable overrides the registry (the TLS-error history in the task makes this worth one check). Do not disable TLS validation. | orchestrator (human confirms) |
| S4 | Low | `pnpm-lock.yaml:1272` | `eslint@9.39.5` carries `deprecated: This version is no longer supported`. VERIFIED. Human accepted it temporarily (resolution report addendum). Dev only. | Condition C4: run `pnpm audit` after install and report results before M1 closes. Keep the addendum conditions: never bundled, ESLint 10 migration on the backlog, reassess before first public release. | desktop-engineer, orchestrator |
| S5 | Low | `pnpm-lock.yaml` electron entry (3219 to 3225) | `electron@45.5.0` depends on `@electron-internal/extract-zip@1.0.10` and `@electron/get@5.1.0`. Both are unfamiliar scope names to me. They are the only direct dependencies of electron and have no scripts (DOCUMENTED). I cannot confirm publisher identity from my allowed sources. | After install, confirm with `pnpm why` that both are reached only through `electron`, and have the orchestrator record the npm maintainer for each scope (`npm.cmd view <pkg> maintainers`). Treat a maintainer unrelated to the Electron organization as a stop. Status: ASSUMED legitimate. | orchestrator |
| S6 | Low | `design.md` 9.3, Electron binary | The Electron binary is fetched at first run or by `install-electron`, outside the lockfile. Integrity relies on `@electron/get` checksums published in the same GitHub release. | Accepted in principle by the human. Keep: no mirror or `ELECTRON_*` override in the repo; download only after the approval gate; record the version and checksum source in the M0 completion report. Revisit when packaging adds Electron Fuses and signing (open decisions 10, 11). | desktop-engineer, release-engineer |
| S7 | Low | `.gitignore` | `.npmrc` is not ignored (correct, it is intentionally committed) but a later local edit adding a token would be committable. `.env*` is ignored; `.kiro` is not ignored (VERIFIED, matches kiroween rules). | Add a secret-scan step to CI and the M1 hook plan; no change needed now. | release-engineer |
| S8 | Info | `pnpm-lock.yaml:223-228, 2405-2416` | Transitive prereleases `@emnapi/core` and `@emnapi/runtime` `2.0.0-beta.2` and `@rolldown/pluginutils 1.0.0-rc.3`, `gensync 1.0.0-beta.2`. The emnapi pair is `optional: true`, reached only through `@rolldown/binding-wasm32-wasi` (wasm32 CPU only, not installed on x64 or arm64 hosts). The others are build-time and long-standing. | None. Listed so the license and notice pass (T0.8) covers them. | none |
| S9 | Info | `package.json` | `packageManager` is `pnpm@10.34.9` with no integrity hash. Acceptable; a hash pin is optional hardening. `minimumReleaseAge` is deliberately unset (design 9.5). | None required. | none |

## Check results

| Check | Result | Status |
|---|---|---|
| Exact pins | All 4 dependencies and 28 devDependencies are exact (no `^`, `~`, ranges, tags). Every lockfile importer `specifier` equals the `package.json` value and `version` equals the specifier. `engines.node` is `>=24.15.0 <25`; `.nvmrc` is `24`; `packageManager` pnpm@10.34.9. | VERIFIED |
| Lockfile integrity and sources | `lockfileVersion 9.0`. A search for any `resolution:` line not starting with `integrity` found 0. No `tarball`, `git`, `file:`, `link:`, `workspace:` or `http(s)` resolutions (the only URL is in the eslint deprecation text). Every entry uses `sha512` integrity. No `overrides`, `patchedDependencies` or `catalogs` blocks. Registry host itself is not recorded in the lockfile. | VERIFIED (registry host: see S3) |
| Typosquats and unexpected packages | All 32 top-level names are the well-known packages for their purpose. No lookalike names, no install-helper or "postinstall-only" packages, no `core-js`, `node-gyp` or `puppeteer`-style downloaders in the lockfile. Only S5 needs an identity check. 472 packages with no sign of unrelated additions. | VERIFIED (S5 residual) |
| Lifecycle allowlist | `pnpm-workspace.yaml`: `strictDepBuilds: true`; `onlyBuiltDependencies: [esbuild@0.28.2]` (version-qualified, so a bump fails the install); `ignoredBuiltDependencies: [fsevents]`. Electron is in neither list, correct because it has no script (design 9.3, V3). `fsevents@2.3.3` is `optional: true` in the lockfile. No `dangerouslyAllowAllBuilds`, `ignoreScripts` or `neverBuiltDependencies`. `package.json` has no `pnpm` block, so there is a single policy source. | VERIFIED (behavior: S1, S2) |
| Project scripts | No `preinstall`, `install`, `postinstall`, `prepare`, `prepublish*` or `pre*`/`post*` entries. Bodies call only `electron-vite`, `tsc`, `eslint`, `prettier`, `vitest`, `playwright`. No `curl`, `node -e`, shell chaining or publish commands. Consistent with `docs/engineering/package-script-policy.md` intent (policy file not re-read). | VERIFIED |
| esbuild script | Body read from the registry tarball by the resolver (verifies the platform binary; network fallback only when the optional package is missing, with SHA-256 check). esbuild also works without the script, so the allowance is small. | DOCUMENTED |
| Licenses and E1 | `@axe-core/playwright` is in `devDependencies` only; `axe-core` is transitive only through it. Resolution report lists MPL-2.0 for exactly these two. No other MPL-2.0 (Vite 7 chosen to avoid lightningcss). Human accepted BlueOak-1.0.0, Python-2.0, CC0-1.0, CC-BY-4.0. Data is from registry `license` fields, not a file scan. | DOCUMENTED; installed-package check is T0.8 |
| Deprecated or advisory-flagged | Only `eslint@9.39.5` is flagged `deprecated` in the lockfile (S4). No advisory lookup was possible for any of the 472 packages. Absence of known vulnerabilities is NOT established. | VERIFIED (deprecation); advisories ASSUMED clear until C4 |
| Machine-specific config | `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, and both M0 reports contain no absolute paths, proxy, certificate, token or user data. The reports name tool versions only. `.npmrc` unread (S3). | VERIFIED except `.npmrc` |
| Renderer-facing risk | `react`, `react-dom`, `zod`, `zustand` are the only runtime dependencies. No Octokit, Shiki, markdown or HTML-rendering package is present yet, so no untrusted-content library is introduced at M0. | VERIFIED |

## Conditions for the installation approval gate
- C1. Install with the exact approved command and `--frozen-lockfile`. Expect exit 0 with only esbuild's `postinstall` run. Stop on any other script, any warning that the lists were ignored, or any lockfile change (S1).
- C2. After install, enumerate build-flagged packages and confirm the set equals {esbuild allowed, fsevents denied} (S2).
- C3. Confirm `.npmrc` and user-level npm/pnpm configuration contain no registry, proxy, certificate or TLS overrides (S3).
- C4. Run `pnpm audit` after install and report high or critical findings to the human before M1 closes (S4).

## Unreviewed areas
`.npmrc` contents; `docs/engineering/package-script-policy.md` text; installed `node_modules` contents; transitive package source code (only esbuild's script was inspected, by the resolver); advisory databases; CI workflows (none exist yet); `tasks.md`.

No source modified.

## Addendum (2026-11-26, orchestrator, factual)
The human accepted this document as the canonical T0.6 deliverable. No duplicate review was produced.
- Root `.npmrc` (approved by the human, written after this review): exactly one line, `engine-strict=true`, plus a trailing newline (19 bytes). No registry, token, proxy, certificate, TLS or machine-specific setting. It is not ignored by `.gitignore`. This addresses finding S3 (the file was unreadable to the reviewer; its content is now quoted here by the orchestrator).
- C3 evidence (checked by the orchestrator before installation): no project or user-level `.npmrc`, no npm or pnpm global config file, no `npm_config_*`, `PNPM_*`, `NODE_TLS*`, proxy or `ELECTRON_*` environment variables; effective npm config had registry `https://registry.npmjs.org/`, `strict-ssl = true`, and null `proxy`, `https-proxy`, `ca`, `cafile`.
- Later evidence: `m0-post-install-validation.md`, `m0-closure-validation.md` and `m0-final-security-validation.md` record the post-install conditions C1, C2 and C4 and findings S1 to S5. Accepted limits (Gate 4): the `strictDepBuilds` rejection branch was not exercised, and execution of esbuild's `postinstall` was not observed.
- Policy and pins unchanged: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`.
