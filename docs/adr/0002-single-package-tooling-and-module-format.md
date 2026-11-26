# ADR 0002: Single package, ESLint plus Prettier, test stack, coverage and module format
- Status: Accepted (human decisions D1, D2, D3, D8, D12; exception E-ESM-1 recorded here, approved by the human on 2026-11-26)
- Resolves: open decisions 1 (repository layout), 8 (styling approach) and 9 (lint and format tooling) in `.kiro/steering/structure.md`, for the desktop-foundation phase
- Related: `.kiro/specs/desktop-foundation/design.md` sections 1, 9 and 10, `docs/engineering/package-script-policy.md`, ADR 0004 (dependency lifecycle policy)
## Context
`structure.md` lists the repository layout, the styling approach and the lint tool as open. The foundation phase needs all three fixed before code exists (R17.1). `tech.md` also requires "ES modules everywhere". Electron's sandboxed preload cannot be an ES module, so that rule needs a scoped exception.
## Decision
1. **Single package (D1).** One `package.json` at the repository root, `private`, no workspaces. Source lives under `src/{main,preload,renderer,shared}` as in `structure.md`. Splitting into a pnpm workspace later is possible and is a new ADR.
2. **ESLint plus Prettier (D2).** ESLint 9 flat config with `typescript-eslint`, `react`, `react-hooks` and `jsx-a11y`. Prettier formats. `eslint-config-prettier` removes rule overlap. Dependency direction is enforced with ESLint core `no-restricted-imports` per glob, so no import-boundary plugin is added. Each boundary rule has a fixture test that runs the ESLint `Linter` API on a string.
3. **CSS Modules over CSS custom properties (D3).** Component rules are CSS Modules. Global CSS holds only tokens and a reset. React's `style` prop is banned. Dynamic values are written to custom properties through the CSSOM. This keeps `style-src 'self'` sufficient (ADR 0003).
4. **Test stack (D8).** Vitest with two projects: `node` (main, shared, preload, static and lint-rule tests) and `renderer` (jsdom, Testing Library). fast-check for `*.property.test.ts` with at least 100 runs. Playwright in Electron mode for E2E, with `@axe-core/playwright` for the accessibility scan under the MPL-2.0 exception E1 (dev only, imported only from `tests/e2e`, never in `out/`). Tests are offline and deterministic. A setup file makes `fetch` and `net` throw.
5. **Coverage (D12).** Provider `v8`. Global thresholds: statements 80, lines 80, functions 80, branches 75. Lines and branches 95 for the IPC validation modules (`src/shared/ipc/**`, `register-handler.ts`, `sender-validation.ts`, `trusted-origins.ts`) and, as an addition pending human confirmation (design N5), `resolve-app-path.ts` and `csp.ts`. `pnpm test` stays coverage-free. `pnpm test:coverage` is the gate.
6. **Module format, exception E-ESM-1.** Source is ES modules with named exports, as `tech.md` requires. The build outputs and package metadata are fixed as follows.

| Artifact | Format and path | Why |
|---|---|---|
| Source (`src/**`, `tests/**`) | ES modules, named exports | `tech.md`. |
| Main bundle | CommonJS, `out/main/index.js` | Matches `package.json` `main`. `electron.vite.config.ts` pins `format: 'cjs'`. |
| Preload bundle | One self-contained CommonJS file, `out/preload/index.js` | A sandboxed preload (`sandbox: true`) runs as a single script. An ES module preload needs `sandbox: false`, which `tech.md` forbids. |
| Renderer | Browser ES modules, `out/renderer/index.html` plus `.js` and `.css` assets | Loaded by Chromium from `app://renderer`. |
| Tool configs | `eslint.config.mjs`, `prettier.config.mjs` | The explicit `.mjs` extension gives ESM without a `type` field. |
| Root `package.json` | No `"type": "module"` | With `"type": "module"`, electron-vite 6 emits `.mjs` for main and preload, which breaks the sandboxed preload. |

   **E-ESM-1 (scoped exception to "ES modules everywhere").** It covers only the main and preload build outputs (CommonJS `.js`) and the absence of `"type": "module"`. It does not relax any other `tech.md` rule. Changing the output format, the file extensions or the `type` field requires a new ADR. Revisit it when Electron supports ES module preloads under `sandbox: true`, or when Electron or electron-vite is re-pinned.
## Consequences
- E-ESM-1 was **approved by the human on 2026-11-26**. Sandboxed preload security takes priority over uniform compiled module formats. `sandbox`, `contextIsolation` and `webSecurity` are never disabled. Steering still says "ES modules everywhere" without the exception. Agents may not edit steering, so the approved replacement text is in `docs/architecture/tech-md-amendment.md` for the orchestrator to apply.
- Open decisions 1, 8 and 9 in `structure.md` are still listed as open until steering is updated.
- The module review (this workflow, step 2) is based on Electron and electron-vite behavior recalled from their documentation. It was not re-fetched and no build existed to test it. M1 completion keeps these gates open:
  1. `pnpm build` produces `out/main/index.js`, a single-file `out/preload/index.js` and `out/renderer/index.html`.
  2. An E2E test shows the bridge is present under `sandbox: true`.
  3. The loading behavior of `electron.vite.config.ts` without a `type` field is checked.
  4. ESM-only main dependencies, such as Octokit in a later phase, load from the CommonJS main (bundled or otherwise).
- Every package script is a single command, so Windows PowerShell compatibility holds.
## Alternatives rejected
- pnpm workspace monorepo (D1 option b). More configuration and three process builds across packages, for no benefit in this phase.
- Biome (D2 option b). Fewer plugins for React hooks, JSX accessibility and boundary rules.
- Plain global CSS or CSS-in-JS (D3 options b and c). Global CSS collides at scale. CSS-in-JS usually needs `unsafe-inline`.
- `"type": "module"` with an ESM preload and `sandbox: false`. It weakens a mandatory security setting.
- `"type": "module"` with a `.cjs` preload. Possible, but it adds a second naming rule and was not verified against electron-vite 6.
