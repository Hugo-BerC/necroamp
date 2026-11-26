# M0 closure validation

Scope: remaining M0 technical validation (workflow `wf_68835a08506da2aa`, step 1). Host: Windows x64, PowerShell 7, pnpm 10.34.9. All checks were read-only. No dependency was installed or reinstalled, no lifecycle script was run, and the lockfile was not touched.

## 1. Electron binary validation (V3, A.7): PASS (see 1a)

| Item | Result |
|---|---|
| Mechanism (design 9.3) | `pnpm exec install-electron --no`. This runs `node_modules/electron/install.js` (the `install-electron` bin), which downloads the official release asset through `@electron/get` and checks it against the release checksums. The `electron@45.5.0` package declares no lifecycle script (read from `node_modules/electron/package.json`: no `scripts`), so it is not in `onlyBuiltDependencies`. |
| Agent attempt | `pnpm.cmd exec install-electron --no` in the repository root. Exit -1. Blocked by the Kiro tool guard ("would execute a package's binary/script named install-electron from the local node_modules"). Not retried and not worked around. |
| Current state | `node_modules/electron` holds `install.js`, `cli.js`, `index.js`, `package.json` and no `dist/` or `path.txt`. `Test-Path node_modules/electron/dist/electron.exe` is False. |
| Electron version 45.5.0 | Package metadata only: `node_modules/electron` and the `.pnpm/electron@45.5.0` directory. Binary version NOT yet verified. |
| Embedded Node | NOT yet measured. Design 9.3 expects v24.22.3 from the Electron `DEPS` file (documented, not measured). |
| Binary architecture | NOT yet verified. Expected x64 win32. |

Human commands (ordinary PowerShell 7, repository root, no `-ExecutionPolicy Bypass`):

```powershell
pnpm.cmd exec install-electron --no
pnpm.cmd exec electron --version
$env:ELECTRON_RUN_AS_NODE='1'; pnpm.cmd exec electron -p "process.versions.node + ' ' + process.versions.electron + ' ' + process.arch + ' ' + process.platform"; Remove-Item Env:ELECTRON_RUN_AS_NODE
```

Expected: `v45.5.0`, then `24.22.3 undefined x64 win32` (with `ELECTRON_RUN_AS_NODE` set, `process.versions.electron` is undefined, so also read the version from the first command). The download is a development-time network call to the official Electron GitHub releases. The cache is outside the repository, so nothing new is tracked.

### 1a. Update after the human ran `install-electron --no`

Read-only inspection afterwards (no agent command downloaded or ran anything):

| Item | Result |
|---|---|
| Binary present | `node_modules/electron/dist/electron.exe` and `node_modules/electron/path.txt` (`electron.exe`) exist. |
| Version | `dist/version` contains `45.5.0`. `electron.exe` file `ProductVersion` is `45.5.0`. PASS. |
| Architecture | PE header machine field is `0x8664` (AMD64, x64). PASS. |
| SHA-256 of electron.exe | `231AB12BB3B6DBE647855F969D282920A8544968510F6274311BA06DA406A63D` |
| Embedded Node | `24.22.3 x64 win32`, exit 0. PASS. Run once by the orchestrator: `ELECTRON_RUN_AS_NODE=1`, `pnpm.cmd exec electron -p "process.versions.node + ' ' + process.arch + ' ' + process.platform"`, variable removed afterwards. This matches the design expectation (v24.22.3 from `DEPS`). Electron 45.5.0 embeds Node 24.22.3, which equals the host Node version by coincidence. The two runtimes are distinct. Two earlier agent attempts produced garbled shell output (quoting problem) and were abandoned per the two-failure rule. |
| Acquisition | Official download through `install-electron` and `@electron/get`, run by the human. Electron was not installed globally and the pin is unchanged. |

### 1b. Re-measurement after human acquisition (read-only, one run each)
| Command | Output |
|---|---|
| `pnpm.cmd exec electron --version` | `v45.5.0` (exit 0) |
| `ELECTRON_RUN_AS_NODE=1; pnpm.cmd exec electron -p "process.versions.node + ' ' + process.arch + ' ' + process.platform"` (variable removed in `finally`) | `24.22.3 x64 win32` (exit 0) |
The shell output was clean, so the values are measured, not carried over. They match section 1a. The values are also recorded in `docs/architecture/dependency-versions.md`.
Status: version (45.5.0), embedded Node (24.22.3) and architecture (x64 win32) all verified. V3 and A.7 are closed.

## 2. .gitignore (T0.4): PASS

`git check-ignore -v` result for each path:

| Path | Matching rule |
|---|---|
| `node_modules/` | `.gitignore:41 node_modules/` |
| `out/` | `.gitignore:79 out` |
| `coverage/` | `.gitignore:22 coverage` |
| `.cache/` | `.gitignore:90 .cache/` (also line 74 `.cache`) |
| `test-results/` | `.gitignore:163 /test-results/` |
| `playwright-report/` | `.gitignore:164 /playwright-report/` |
| `.kiro/steering/tech.md` | Not ignored (`check-ignore` exit 1). `git ls-files .kiro` lists 50 tracked files. |

No edit was needed. `.kiro/` is version-controlled.

## 3. Security conditions C1 to C4

| ID | Status | Evidence |
|---|---|---|
| C1 | Satisfied (inferred, see limits) | `m0-post-install-validation.md`: install exit 0 per the operator, lockfile SHA-256 unchanged. Re-checked here: `pnpm.cmd ignored-builds` prints "None" and `.modules.yaml` has `ignoredBuilds: []` and `pendingBuilds: []`. A scan of every installed `package.json` under `node_modules/.pnpm` found exactly one package with a `preinstall`, `install` or `postinstall` script: `esbuild@0.28.2` (`postinstall: node install.js`). |
| C2 | Satisfied | Build-flagged set equals {esbuild allowed, fsevents denied and not installed on win32}. Confirmed by the scan above. `@esbuild/win32-x64@0.28.2` is installed (`esbuild.exe`, 11,694,592 bytes). |
| C3 | Satisfied (evidence retrieved, not repeated) | `m0-post-install-validation.md` row "C3 config": the orchestrator verified before install that there is no project or user `.npmrc`, no npm or pnpm rc files, no `npm_config_*`, `PNPM_*`, `NODE_TLS*`, proxy or `ELECTRON_*` variables, registry `https://registry.npmjs.org/`, strict-ssl true, and proxy, https-proxy, ca and cafile null. Corroboration read now: `.modules.yaml` records `registries.default: https://registry.npmjs.org/` (plus the default `@jsr` scope registry `https://npm.jsr.io/`), and the post-install record found every package resolved from the npm registry. |
| C4 | Satisfied | `pnpm.cmd audit` after install: "No known vulnerabilities found", 0 high, 0 critical (`m0-post-install-validation.md`). |

## 4. Security findings S1 to S5

| ID | Status | Evidence |
|---|---|---|
| S1 | Resolved with a stated limit. See section 5. | |
| S2 | Resolved | pnpm 10 lockfiles do not record `requiresBuild` (0 matches). The installed-tree scan in section 3 replaces the registry-metadata inference: one script-bearing package, esbuild. |
| S3 | Resolved | Same evidence as C3. |
| S4 | Accepted, audit clean | `eslint@9.39.5` is flagged deprecated (dev only, accepted by the human). `pnpm audit` reports no known vulnerabilities. |
| S5 | Resolved | `@electron-internal/extract-zip@1.0.10` and `@electron/get@5.1.0` are MIT, from `github.com/electron/*`, maintained by Electron project accounts (`m0-post-install-validation.md`). |

## 5. S1: does pnpm 10.34.9 honor the policy in pnpm-workspace.yaml?

`pnpm-workspace.yaml` content: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. The project `package.json` carries no `pnpm` block, so the workspace file is the only source.

Read-only evidence:

1. pnpm resolves all three keys from the workspace file as effective configuration: `pnpm.cmd config get strict-dep-builds` returns `true`, `only-built-dependencies` returns `esbuild@0.28.2`, `ignored-built-dependencies` returns `fsevents`, and `dangerously-allow-all-builds` returns `undefined`.
2. pnpm 10 blocks every dependency script by default. `esbuild@0.28.2` is not in `ignoredBuilds` (empty) and `pnpm ignored-builds` reports none. The only way esbuild escapes the ignored list is that pnpm matched the version-qualified entry `esbuild@0.28.2` from the workspace file. This shows the allowlist, including version qualification, was parsed and applied.
3. The only package in the installed tree with an install-phase script is `esbuild@0.28.2`. `electron@45.5.0` has none, and `fsevents` is not installed on win32.
4. No `dangerouslyAllowAllBuilds` is set anywhere.

Conclusion: pnpm 10.34.9 honors the allowlist and the default-deny of the policy (positive evidence in points 1 and 2). The failure branch of `strictDepBuilds` (exit non-zero on an unreviewed script) is not demonstrated, because the tree contains no unlisted package with a build script, and proving it would need a violating install, which is prohibited. That branch is documented pnpm behavior since 10.3.0, and the policy produces the same final state either way: no unapproved script ran. No lockfile defect was found. A later version bump of esbuild will exercise the version qualification and fail the install until it is reviewed.

Limit: whether esbuild's postinstall actually executed is not directly observable. `bin/esbuild` is the 9,350-byte JS launcher, and esbuild's installer may leave it unchanged on Windows, so file size is not a reliable marker. The operator's console output was not seen.

## 6. Shell failures

One: the guard-blocked `pnpm.cmd exec install-electron --no` (exit -1). No identical retry. All other commands succeeded.

## 7. Open items

- V3 and A.7 are closed (section 1a). Record the three values in `docs/architecture/dependency-versions.md` if not yet there.
- ADRs 0002 to 0005 are handled in a later workflow step.

