# Architecture review: desktop-foundation-final

- Reviewer: necro-architect. Scope: `66f9f7f...10dfc3f` per `docs/release/review-desktop-foundation-final-diff-scope.md`.
- Authority: `structure.md`, `tech.md`, `product.md`, `kiroween.md`, ADRs 0001 to 0005.
- Method: read the diff scope report, then checked `src/**` layout, imports and `package.json` with directory listings and pattern searches. No source was edited and no command was run. Runtime evidence was not re-verified here; it is cited from ADR 0003 and ADR 0005.

## Verdict

No blockers. Dependency direction, process boundaries and the layout conform to steering. No open decision was resolved silently. Two major and five minor findings need an owner.

## Conformance checks

| Check | Result | Evidence |
|---|---|---|
| `renderer -/-> main` | Pass | No `@main/*`, `electron` or `node:*` import in `src/renderer/**`. |
| `shared` has no Electron, DOM or Node imports | Pass | `src/shared/ipc/**` imports only within `shared`. |
| `preload -> shared` only | Pass | `src/preload/index.ts` imports `electron` (allowed for the bridge), `@shared/ipc` and a local file. |
| `main` does not import renderer | Pass | No `@renderer` import under `src/main`, `src/preload` or `src/shared`. |
| Feature isolation | Pass | Only `app/app-shell.tsx` imports features, through each feature's `index.ts`. No feature-to-feature imports. |
| Aliases, no deep relative chains | Pass | No `../../../` imports found in renderer sources. |
| Layout vs `structure.md` | Pass | Features are `player, playlist, equalizer, visualizer, skins, github`, matching `structure.md`. `src/main` has `ipc`, `window`, and additional `lifecycle`, `logging`, `protocol`, `security`. These additions are consistent with the target layout's intent and ADR 0005. |
| IPC channel constants | Pass | `src/shared/ipc/channels.ts`. |
| Out-of-scope features absent | Pass | No Octokit, `safeStorage`, `AudioContext`, `music-metadata`, `electron-updater`, `crashReporter` or `shell.openExternal` call in `src/**` or `package.json`. |
| Network and telemetry | Pass | No such dependency in `package.json`. |
| Fixed versions | Pass | Dependencies are pinned exactly. Node range is `>=24.15.0 <25`, pnpm 10 via `packageManager`. |

## Open decisions audit (`structure.md`)

| # | Decision | Status in the diff |
|---|---|---|
| 1 | Repository layout | Resolved by human decision D1, recorded in ADR 0002. Not silent. |
| 8 | Styling (CSS Modules) | Resolved by D3, ADR 0002. Not silent. |
| 9 | Lint and format | Resolved by D2, ADR 0002. Not silent. |
| 16 | Window chrome, single window | Resolved for this phase by D5, ADR 0005. Not silent. |
| 17 | i18n | English only, D14, ADR 0005. Matches the assumption in `structure.md`. |
| 3 | Token storage | ADR 0001 (fail closed). No code yet. |
| 2, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15 | Auth, audio pipeline, metadata, skin format and packaging, auto-update, signing, Linux targets, GitHub scope, artwork, notification sounds | Untouched. No dependency or code implies a choice. No `electron-builder.yml` exists, so 10, 11 and 12 stay open. |

Result: none resolved silently.

## Findings

### Major

**M-1. Boundary enforcement and package tooling have no owning agent.** Owner: user (hand implementation), architectural decision with necro-architect.
`eslint.config.mjs`, `prettier.config.mjs`, `.npmrc`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.editorconfig`, `.gitattributes`, `.prettierignore` and `.gitignore` sit in no agent's write scope (diff scope report, "Files outside any agent's scope"). `eslint.config.mjs` carries the dependency-direction rules from design section 1, and `tests/lint-rules/boundary-rules.test.ts` depends on it. Changes there have no reviewer-of-record. ADR 0004 and `package-script-policy.md` already assign `.npmrc` and `pnpm-workspace.yaml` ownership decisions to the architect, but the architect cannot write them. Action: the user records an owner for these paths (extend an agent's scope, or accept user ownership) before the next phase. Any later edit to `eslint.config.mjs` needs architect review because it encodes steering rules.

**M-2. Steering edited without a recorded approval in the diff.** Owner: user.
`.kiro/steering/tech.md` changed by 3 lines (scoped exception E-ESM-1). ADR 0002 states the human approved the exception on 2026-11-26, and the text in `tech.md` cites ADR 0002 section 6, so the content is consistent. The commit trail does not show who edited it, and no agent may write steering. Action: the user confirms they approve the edit as committed. No design change needed.

### Minor

**m-1. Journal path differs from steering.** Owner: user or whoever maintains the journal (no agent scope covers it).
`kiroween.md` names `docs/kiro-journal.md`. The file is at `docs/kiroween/kiro-journal.md`. Either move it or update `kiroween.md`. Needs human decision, because `kiroween.md` is steering.

**m-2. `package` script missing.** Owner: desktop-engineer with release-engineer.
`tech.md` lists `dev, build, typecheck, lint, test, test:e2e, package` as standard scripts. `package.json` has no `package`. This is acceptable now because `electron-builder.yml` does not exist and packaging is deferred. Record it as an accepted deviation until the packaging task, and add the script under `package-script-policy.md` (including `--publish never`) then.

**m-3. Design document lags the implementation.** Owner: necro-architect (a later session), because `.kiro/specs/**` is outside my write scope the change goes to the user.
`design.md` section 1 names feature folders `visualization` and `skin-selector` and a store-based info hook; the code uses `visualizer` and `skins` (correct per `structure.md`) and keeps `use-app-info.ts` under `renderer/app/`. Update the design or add a note so the spec does not contradict the code.

**m-4. Renderer typing depends on a preload declaration file.** Owner: desktop-engineer (declaration), frontend-engineer (consumer).
`window.necroamp` is typed by `src/preload/necroamp-window.d.ts`, and `renderer/env.d.ts` relies on it through tsconfig inclusion. This is a type-only coupling, and `necroamp-client.ts` treats the value as `unknown`, so there is no runtime violation. Preferred end state: declare the ambient type in a file that both tsconfigs reach through `shared` or renderer, so the renderer project does not include preload files. Not blocking.

**m-5. Docs layout is wider than `structure.md`.** Owner: user.
`structure.md` lists `docs/` as architecture notes, ADRs and the asset license register. The diff adds `docs/design`, `docs/engineering`, `docs/kiroween`, `docs/release`, `docs/security` and `docs/testing`. This matches agent scopes and is harmless. `docs/assets.md` is not yet needed (no bundled assets). Suggest updating `structure.md` to list the subfolders when the user next edits steering.

## Carried conditions (not new defects)

- Development CSP allows `'unsafe-inline'` for `script-src` and `style-src` in `src/main/security/csp.ts` only. ADR 0003 accepted this with the condition that it is removed where runtime validation shows it is not needed (T7.6). Production CSP contains neither. Architecture position: acceptable while that condition stays open. Owner: desktop-engineer.
- F-3 pre-public-release reassessment and packaging-specific security checks remain deferred. Owner: security-reviewer and release-engineer.
- macOS and Linux behavior is unverified. CI (`.github/workflows/**`) is absent, not passing.

## Hand-off summary

| Item | Owner |
|---|---|
| M-1 owner assignment for tooling and lint config paths | user |
| M-2 confirm steering edit to `tech.md` | user |
| m-1 journal path (steering change) | user, needs human decision |
| m-2 `package` script | desktop-engineer, release-engineer |
| m-3 design sync | user (spec path), architect advises |
| m-4 ambient type location | desktop-engineer, frontend-engineer |
| m-5 `structure.md` docs list | user |
| Dev CSP condition | desktop-engineer |

Blockers: 0.
