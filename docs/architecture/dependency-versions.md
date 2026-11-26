# Dependency versions (desktop foundation, M0)

Sources: `package.json` (exact pins), `pnpm-lock.yaml` (importer `.`, resolved versions), `docs/security/m0-post-install-validation.md`, `docs/security/m0-closure-validation.md`. Host: Windows x64, PowerShell 7. Nothing here was installed or changed by this document.

## Toolchain

| Item | Value | Note |
|---|---|---|
| Host Node.js | v24.22.3 x64 win32 | Runs pnpm, tsc, eslint, vitest, electron-vite. `engines.node` is `>=24.15.0 <25`. |
| Electron-embedded Node.js | 24.22.3 x64 win32 | Measured with `ELECTRON_RUN_AS_NODE=1` and `process.versions.node`. Same number as the host by coincidence. They are separate runtimes and are recorded separately. |
| Electron | 45.5.0 | `pnpm.cmd exec electron --version` printed `v45.5.0`. Binary PE machine `0x8664` (x64). |
| pnpm | 10.34.9 | Pinned by `packageManager`. |
| Lifecycle-script allowlist | `esbuild@0.28.2` only | `strictDepBuilds: true`, `ignoredBuiltDependencies: [fsevents]`, no `dangerouslyAllowAllBuilds`. |

## Top-level packages (31)

Pinned versions are exact (no ranges). Every resolved version in the lockfile importer equals the pin. Peer-dependency suffixes in lockfile keys are omitted. The post-install check (`pnpm.cmd ls --depth 0 --json`) found 0 mismatches. Note: earlier reports say "32 pins". `package.json` and the lockfile importer list 31 (4 dependencies, 27 devDependencies). The count of 32 was a miscount, not a missing package.

| Package | Section | Pinned | Resolved |
|---|---|---|---|
| `react` | dependencies | 19.3.1 | 19.3.1 |
| `react-dom` | dependencies | 19.3.1 | 19.3.1 |
| `zod` | dependencies | 4.6.7 | 4.6.7 |
| `zustand` | dependencies | 5.1.0 | 5.1.0 |
| `@axe-core/playwright` | devDependencies | 4.14.1 | 4.14.1 |
| `@eslint/js` | devDependencies | 9.39.5 | 9.39.5 |
| `@playwright/test` | devDependencies | 1.65.1 | 1.65.1 |
| `@testing-library/dom` | devDependencies | 10.4.2 | 10.4.2 |
| `@testing-library/jest-dom` | devDependencies | 8.0.0 | 8.0.0 |
| `@testing-library/react` | devDependencies | 16.3.3 | 16.3.3 |
| `@testing-library/user-event` | devDependencies | 14.6.13 | 14.6.13 |
| `@types/node` | devDependencies | 24.19.4 | 24.19.4 |
| `@types/react` | devDependencies | 19.3.3 | 19.3.3 |
| `@types/react-dom` | devDependencies | 19.3.0 | 19.3.0 |
| `@vitejs/plugin-react` | devDependencies | 5.2.0 | 5.2.0 |
| `@vitest/coverage-v8` | devDependencies | 5.1.2 | 5.1.2 |
| `electron` | devDependencies | 45.5.0 | 45.5.0 |
| `electron-vite` | devDependencies | 6.0.0 | 6.0.0 |
| `eslint` | devDependencies | 9.39.5 | 9.39.5 |
| `eslint-config-prettier` | devDependencies | 10.1.8 | 10.1.8 |
| `eslint-plugin-jsx-a11y` | devDependencies | 6.10.2 | 6.10.2 |
| `eslint-plugin-react` | devDependencies | 7.37.5 | 7.37.5 |
| `eslint-plugin-react-hooks` | devDependencies | 7.1.1 | 7.1.1 |
| `fast-check` | devDependencies | 4.11.0 | 4.11.0 |
| `globals` | devDependencies | 17.14.0 | 17.14.0 |
| `jsdom` | devDependencies | 31.0.1 | 31.0.1 |
| `prettier` | devDependencies | 3.10.1 | 3.10.1 |
| `typescript` | devDependencies | 6.0.3 | 6.0.3 |
| `typescript-eslint` | devDependencies | 8.74.0 | 8.74.0 |
| `vite` | devDependencies | 7.3.8 | 7.3.8 |
| `vitest` | devDependencies | 5.1.2 | 5.1.2 |

## Electron acquisition

`electron@45.5.0` declares no lifecycle script, so it is not in `onlyBuiltDependencies`. The binary is not part of the lockfile. The human operator ran the official acquisition once (`pnpm.cmd exec install-electron --no`, which uses `@electron/get` and release checksums). The agent attempt was blocked by the Kiro tool guard and was not retried. Electron was not installed globally and the pin is unchanged. `node_modules/electron/dist` and `path.txt` are generated and ignored.

## Installed-license summary

Source: `pnpm.cmd licenses list --json` and `--prod --json` (`m0-post-install-validation.md`).

- Production: MIT only (7 packages).
- All installed: MIT 333, Apache-2.0 22, ISC 11, BSD-2-Clause 9, BSD-3-Clause 3, BlueOak-1.0.0 4, Python-2.0 1, CC-BY-4.0 1, CC0-1.0 1, MPL-2.0 2.
- `pnpm audit`: no known vulnerabilities.

## Accepted exceptions

| ID | Exception | Status |
|---|---|---|
| E1 | MPL-2.0 on `axe-core@4.14.1` and `@axe-core/playwright@4.14.1`. Development only, not bundled into the app. | Accepted (design E1, ADR 0004). |
| S4 | `eslint@9.39.5` is flagged deprecated. Dev only. | Accepted temporarily by the human. No known vulnerabilities. |
| Licenses | Python-2.0, CC-BY-4.0, CC0-1.0 and BlueOak-1.0.0 (one to four packages each, transitive, development graph). | Accepted as part of the permissive set in the post-install validation. |
| E5 | `strictDepBuilds: true` deviates from the original R1.6 default and keeps deny-by-default execution. | Approved (design E5, ADR 0004). |

## Validation status

| Check | Status | Evidence |
|---|---|---|
| V1 host | PASSED | design.md section 16 |
| V2 installed-tree script scan | PASSED | one script-bearing package, `esbuild@0.28.2` (m0-closure-validation.md section 3) |
| V3 Electron binary | PASSED | 45.5.0, embedded Node 24.22.3, x64 win32 |
| V11 licenses | PASSED | summary above |

Limit: whether the esbuild postinstall actually ran is not directly observable (m0-closure-validation.md section 5).

