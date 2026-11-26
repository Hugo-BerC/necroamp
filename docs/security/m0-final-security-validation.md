# M0 final security validation

Workflow `wf_68835a08506da2aa`, step 4. Reviewer: security-reviewer (read-only, no shell). Labels: VERIFIED (read in this repository), DOCUMENTED (stated in an earlier report or ADR), ASSUMED (neither).

## 1. C1 to C4 and S1 to S5

Source: `docs/security/m0-security-review.md` (conditions), `m0-post-install-validation.md` and `m0-closure-validation.md` (evidence). I did not re-run any check. I re-read `pnpm-workspace.yaml` and `package.json`.

| ID | Status | Basis | Label |
|---|---|---|---|
| C1 (install as approved, no script other than esbuild) | Satisfied | Operator install exit 0. `ignoredBuilds: []`, `pendingBuilds: []`, installed-tree scan found one script-bearing package, `esbuild@0.28.2`. | DOCUMENTED |
| C2 (build-flagged set is esbuild allowed, fsevents denied) | Satisfied | Same scan. `fsevents` not installed on win32. | DOCUMENTED |
| C3 (registry, TLS, no proxy or token config) | Satisfied | Pre-install config check in `m0-post-install-validation.md`. `.modules.yaml` registry corroborates. | DOCUMENTED |
| C4 (`pnpm audit`) | Satisfied | 0 known vulnerabilities, 0 high, 0 critical. Point-in-time result. | DOCUMENTED |
| S1 (policy honored) | Resolved with a stated limit | Effective config keys resolve from the workspace file. `esbuild` is absent from `ignoredBuilds`, so the version-qualified allow entry was applied. The failure branch of `strictDepBuilds` was not exercised (it would need a violating install). Final state is the same either way. | DOCUMENTED |
| S2 (script set from the installed tree) | Resolved | Installed-tree scan replaces registry metadata. | DOCUMENTED |
| S3 (`.npmrc` and registry) | Resolved | Same evidence as C3. No `.npmrc` exists at repo root (root listing). | VERIFIED (file absent), DOCUMENTED (config) |
| S4 (eslint 9.39.5 deprecated) | Accepted | Dev only, human accepted, audit clean. Reassess before first public release. | DOCUMENTED |
| S5 (identity of `@electron/get`, `@electron-internal/extract-zip`) | Resolved | MIT, `github.com/electron/*`, Electron-owned maintainers. | DOCUMENTED |

Residual: whether esbuild's postinstall actually ran is not observable (closure report section 5). This has no security effect, since it is the one approved script.

## 2. Module-system decision (no `"type": "module"`)

Input: the module-review verdict "VALID WITH EXCEPTION" (E-ESM-1), plus ADR 0002 item 6.

Evidence read now:

- `package.json`: no `type` field. `main` is `./out/main/index.js`. VERIFIED.
- `electron.vite.config.ts`: main and preload use `output.format: 'cjs'` with `entryFileNames: '[name].js'`. Preload sets `externalizeDeps: false`, so dependencies are bundled into one file. Renderer uses defaults. VERIFIED.
- `src/main/constants.ts`: preload is resolved as `../preload/index.js`. Matches the config. VERIFIED.
- All `tsconfig.*.json`: `module: ESNext`, `moduleResolution: bundler`, `verbatimModuleSyntax: true`. Source stays ESM. VERIFIED.
- ADR 0002 records E-ESM-1, scoped to main and preload output and the missing `type` field, and lists rejected alternatives. It is marked pending human approval. VERIFIED.

Security assessment:

| Aspect | Verdict |
|---|---|
| `sandbox: true` preserved | Yes. The decision exists to keep a sandboxed preload. The rejected alternative (ESM preload with `sandbox: false`) would violate `tech.md` and is correctly refused. |
| Preload attack surface | Reduced. One bundled CJS file means the sandboxed preload needs no `require` of `node_modules` at runtime. Bundling puts all preload dependencies under the lockfile and review, which should stay small (`zod` and `src/shared` only). |
| Renderer | Browser ES modules served from `app://renderer`. Unaffected by the `type` field. Must stay under the strict CSP (ADR 0003). |
| Tool configs | `.mjs` extension gives ESM without the `type` field. No security effect. |
| Regression risk | A later change to `type`, extensions or format would silently switch the preload to `.mjs` and break the bridge, tempting someone to disable the sandbox. ADR 0002 requires a new ADR for that change. Adequate. |

Security verdict: ACCEPTABLE. No mandatory `tech.md` security rule is weakened. E-ESM-1 touches only "ES modules everywhere", which is not a security rule.

Conditions (non-blocking for M0, required for M1 acceptance):

1. A built `out/preload/index.js` exists as a single file with no `require` of packages, and a test shows the bridge is present under `sandbox: true`. The sandbox, contextIsolation, nodeIntegration and webSecurity values must be asserted in a test.
2. Confirm that `electron.vite.config.ts` (which uses `import.meta.url` without a `type` field) loads in electron-vite 6, and that ESM-only main dependencies load from the CJS main.
3. Evidence limit: Electron sandbox and ESM-preload behavior is recalled from the Electron documentation, not re-fetched, and no build exists. ASSUMED until the gates pass.
4. The human has not yet approved E-ESM-1, and `tech.md` has not been amended. Both are open and belong to the human.

## 3. Policy and lockfile drift

| Check | Result | Label |
|---|---|---|
| `strictDepBuilds: true` | Unchanged | VERIFIED |
| `onlyBuiltDependencies: [esbuild@0.28.2]` | Unchanged | VERIFIED |
| `ignoredBuiltDependencies: [fsevents]` | Unchanged | VERIFIED |
| `dangerouslyAllowAllBuilds`, `pnpm` block in `package.json`, `.npmrc` | Absent | VERIFIED |
| `package.json` pins | Same shape as recorded (exact pins, `packageManager: pnpm@10.34.9`). No new dependency or script that invokes a lifecycle hook. | VERIFIED |
| `pnpm-lock.yaml` SHA-256 equals `E41CB59B...2659` | NOT COMPUTED. I have no shell and no tool that reads file hashes. The last recorded hash (`m0-post-install-validation.md`) is that value, identical to the pre-install hash. The lockfile is untracked, so `git diff` cannot show drift. | ASSUMED unchanged |

Human or orchestrator command to close this check (read-only):

```powershell
(Get-FileHash pnpm-lock.yaml -Algorithm SHA256).Hash -eq 'E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659'
```

Expected output: `True`. A `False` result is a stop for human review.

## 4. Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| F1 | High (acceptance, not a vulnerability) | `src/` tree | `src/` holds only `src/main/constants.ts` and `src/shared/ipc/channels.ts`. `src/main/index.ts`, `src/main/window/**`, `src/main/ipc/**`, `src/preload/**` and `src/renderer/**` do not exist, and `tests/` holds only `config` and `setup`. `electron.vite.config.ts` references `src/main/index.ts`, `src/preload/index.ts` and `src/renderer/index.html` as build inputs, so `pnpm build` cannot succeed. This contradicts the report that M1 is implemented. | Confirm whether the M1 files were lost, not written to this checkout, or are on another path. Re-create or restore them. Until they exist, none of the M1 security controls (web preferences, CSP, sender validation, navigation guards, preload surface) can be reviewed. | desktop-engineer, orchestrator |
| F2 | Low | ADR 0002, steering | E-ESM-1 not human-approved. `tech.md` not amended. | Human decision, then a steering update by the human. | human, necro-architect |
| F3 | Low | Lockfile hash | Not recomputed (no shell). | Run the command in section 3. | orchestrator |

## 5. Result

- C1 to C4: satisfied. S1 to S5: resolved or accepted, S1 and C1 with the stated limits.
- Module decision: security-acceptable, subject to the M1 gates above.
- Policy drift: none in `pnpm-workspace.yaml`. Lockfile hash: unconfirmed by me (F3).
- Blocking finding: F1 blocks M1 acceptance. It does not block M0 security closure.

Unreviewed: the M1 runtime code (see F1), CSP and protocol handler code, GitHub, token storage and skin loader (not yet in scope).

No source modified.
