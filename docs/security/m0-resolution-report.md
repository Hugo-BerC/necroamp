# M0 resolution report

Command: `pnpm.cmd install --lockfile-only --ignore-scripts` (exit 0, run twice; second run left `pnpm-lock.yaml` byte-identical). No `node_modules`, no real install, no dependency lifecycle script executed. Lockfile: `lockfileVersion 9.0`, 472 packages.

## Resolved top-level versions (all equal the pins in package.json)
Dependencies: react 19.3.1, react-dom 19.3.1, zod 4.6.7, zustand 5.1.0.
Dev: @axe-core/playwright 4.14.1, @eslint/js 9.39.5, @playwright/test 1.65.1, @testing-library/dom 10.4.2, jest-dom 8.0.0, react 16.3.3, user-event 14.6.13, @types/node 24.19.4, @types/react 19.3.3, @types/react-dom 19.3.0, @vitejs/plugin-react 5.2.0, @vitest/coverage-v8 5.1.2, electron 45.5.0, electron-vite 6.0.0, eslint 9.39.5, eslint-config-prettier 10.1.8, eslint-plugin-jsx-a11y 6.10.2, eslint-plugin-react 7.37.5, eslint-plugin-react-hooks 7.1.1, fast-check 4.11.0, globals 17.14.0, jsdom 31.0.1, prettier 3.10.1, typescript 6.0.3, typescript-eslint 8.74.0, vite 7.3.8, vitest 5.1.2.
Notable transitive: esbuild 0.28.2, rolldown 1.2.19, playwright and playwright-core 1.65.1, axe-core 4.14.1, postcss 8.5.33, fsevents 2.3.3 (optional, macOS).

## Lifecycle scripts
`--lockfile-only` does not write `requiresBuild`, so every one of the 472 locked name@version pairs was looked up in registry metadata (`preinstall`, `install`, `postinstall`, `gypfile`). 0 lookup failures.

| Package | Script | Decision |
|---|---|---|
| esbuild 0.28.2 | `postinstall: node install.js` | ALLOW `esbuild@0.28.2`. Body read from the registry tarball: picks the platform binary from the `@esbuild/*` optional package, runs it for a version check, and only on a missing optional package falls back to `npm install` or an https download from registry.npmjs.org, verified by a SHA-256 in package.json. No other network use. |
| fsevents 2.3.3 | `install: node-gyp rebuild` (gypfile) | DENY (`ignoredBuiltDependencies`). macOS only, optional. |
| electron 45.5.0 | none | DENY (not listed). Binary is fetched on demand (design 9.3, V3). |
| all other 469 | none | DENY (not listed). |

Version-qualified allow entry means a bump of esbuild fails the install under strict builds until reviewed again.

## Licenses (transitive, 472 packages)
MIT 413, Apache-2.0 25, ISC 12, BSD-2-Clause 9, BlueOak-1.0.0 4, BSD-3-Clause 3, MPL-2.0 2, 0BSD 1, CC-BY-4.0 1, CC0-1.0 1, Python-2.0 1.
- MPL-2.0: @axe-core/playwright 4.14.1 and axe-core 4.14.1 only. Approved exception E1, dev only. No other MPL-2.0 package (no lightningcss).
- Outside the permissive set but not copyleft-code concerns, for human confirmation: caniuse-lite 1.0.30001828 (CC-BY-4.0, data, dev tooling via browserslist), argparse 2.0.1 (Python-2.0, permissive PSF-style, dev), language-subtag-registry 0.3.23 (CC0-1.0, data, dev). BlueOak-1.0.0 (isaacs packages: minimatch, lru-cache, graceful-fs, nonrecursive-glob-match) is permissive.
- Source: registry `license` field, not a file scan. `pnpm licenses` is T0.8 after install.

## Deprecations
eslint 9.39.5 only (see validation report D1).

## Policy placement
pnpm 10.34.9 accepted `onlyBuiltDependencies` and `ignoredBuiltDependencies` under `pnpm` in package.json without error. `strictDepBuilds: true` could NOT be written: this agent may not write `pnpm-workspace.yaml` or `.npmrc`. Its effect cannot be proven without a real install (`pnpm config get` does not display it). Orch must write `pnpm-workspace.yaml` containing `strictDepBuilds: true` (and may then move the two lists there, deleting the `pnpm` block in package.json to avoid duplicate sources).

## Human decisions (orchestrator addendum, after original evidence above)
- ESLint (scoped dependency decision, not architectural decision D1): eslint 9.39.5 accepted temporarily for Desktop Foundation. Reasons: peer compatibility with eslint-plugin-react 7.37.5 and eslint-plugin-jsx-a11y 6.10.2 (both peer at most eslint ^9); development-only. Conditions: record upstream deprecation and end-of-life status; verify known vulnerabilities (post-install `pnpm audit`); never bundle ESLint in production; add migration to ESLint 10 or a supported equivalent to the engineering backlog; resolve or reassess before the first public release. Version pin unchanged.
- Licenses accepted: BlueOak-1.0.0; Python-2.0 (argparse); CC0-1.0 (language-subtag-registry); CC-BY-4.0 (caniuse-lite, attribution required). MPL-2.0 exception E1 (axe-core, @axe-core/playwright, dev only) preserved. Project license stays MIT.
- Registry license metadata is preliminary. Installed-package license verification runs after installation (T0.8). THIRD_PARTY_NOTICES.md generation and validation belongs to the packaging or release milestone.
- Lifecycle: allow esbuild@0.28.2 postinstall; deny fsevents and all other unreviewed scripts; Electron official binary acquisition approved in principle.
