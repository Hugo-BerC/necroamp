# Desktop Foundation final diff and scope inspection

- Run: desktop-foundation-final
- Base: `66f9f7f`. Comparison used: `66f9f7f...HEAD`.
- HEAD: `10dfc3f` on `feature/desktop-foundation`. The `git log` decoration shows `origin/feature/desktop-foundation` at the same commit.
- Commands run, each on its own: `git status --short`, `git log --oneline 66f9f7f..HEAD`, `git diff --stat 66f9f7f...HEAD`, `git diff 66f9f7f...HEAD`, `git diff --stat`. No other git command and no pnpm command ran.
- Nothing was committed, pushed, tagged or published.

## Method and assumptions

- Git history does not record which agent wrote a change. Ownership is assigned by path against the "Scope of work" section of each file in `.kiro/agents/`.
- A path is "outside scope" when no agent lists it.
- Co-located `*.test.ts(x)` files follow the owner of their directory. qa-engineer is scoped only to `tests/**`, `*.property.test.ts`, `*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts` and `docs/testing/**`.
- The raw diff was too large for one tool response (about 1 MB). The diff block below was assembled from the saved output of that single `git diff 66f9f7f...HEAD` run. Only three files exceed 400 diff lines and are truncated. This report file itself is new and is not part of the inspected diff.

## Summary

- 212 files changed, 18233 insertions, 29 deletions (`git diff --stat 66f9f7f...HEAD`). 14 commits.
- Uncommitted changes: none.
- Files in no agent's scope: 22 (listed below), one of them a binary PNG.
- `.kiro/`: four spec files added and `.kiro/steering/tech.md` modified. `.kiro/agents/**` unchanged.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `.npmrc` added. No `.github/workflows/**`. No `electron-builder.yml`.

## Commits (66f9f7f..HEAD, newest first)

```text
10dfc3f docs(foundation): record final integration status in delivery report
af7fd19 docs(foundation): reconcile M7/M8 status, delivery report, README, ADR notes, backlog and journal
ddea85a docs(release): add build validation and packaging review findings
d062b30 docs(security): add final desktop foundation security review (APPROVED, 2 Low, 2 Informational)
40bf76e docs(foundation): record Block B results, defects 0001-0004, coverage, traceability and task status
a695cc1 test(foundation): add property, static, integration, a11y and Playwright E2E tests
f5be83e feat(renderer): fix defects 0002-0004 (playlist list, default skin entry, not signed in status)
55c38d4 fix(core): require main-frame identity in sender validation and simplify app path checks
60b23a9 docs(architecture): record renderer architecture and contract changes
cee34ca feat(ui): establish accessible styling and skin-ready presentation
afcd0a8 docs(foundation): record M2-M3 specs, security reviews and acceptance reports
17d407f feat(core): implement secure Electron main process and typed IPC bridge
7addc1e feat(foundation): complete secure dependency bootstrap and desktop toolchain
76c4984 docs(spec): define desktop foundation architecture and implementation plan
```

## Uncommitted changes

None. `git status --short` and `git diff --stat` both returned empty output.

## Changed files grouped by owning agent

### desktop-engineer

- `package.json`, `electron.vite.config.ts`, `.nvmrc`, `tsconfig.json`, `tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json`, `tsconfig.shared.json`, `tsconfig.tests.json`
- `src/main/**`: `constants.ts`, `index.ts`, and the `ipc/`, `lifecycle/`, `logging/`, `protocol/`, `security/`, `window/` directories (non-property tests included)
- `src/preload/**`: `create-necroamp-api.ts`, `index.ts`, `necroamp-window.d.ts` and their unit tests
- `src/shared/ipc/**`: `app-info.ts`, `channels.ts`, `index.ts`, `necroamp-api.ts`, `result.ts` and their unit tests

### frontend-engineer

- `src/renderer/**` except `*.property.test.ts`: `index.html`, `main.tsx`, `env.d.ts`, `app/`, `components/`, `features/` (equalizer, github, player, playlist, skins, visualizer), `stores/`

### qa-engineer

- `*.property.test.ts`: `src/main/ipc/register-handler.property.test.ts`, `src/main/lifecycle/lifecycle.property.test.ts`, `src/main/protocol/resolve-app-path.property.test.ts`, `src/main/security/csp.property.test.ts`, `src/preload/create-necroamp-api.property.test.ts`, `src/renderer/app/bridge/necroamp-client.property.test.ts`, `src/renderer/app/theme/contrast.property.test.ts`, `src/shared/ipc/ipc-contract.property.test.ts`
- `tests/**`: `a11y/`, `config/`, `e2e/` (including `fixtures/`), `integration/`, `lint-rules/`, `setup/`, `static/`
- `vitest.config.ts`, `playwright.config.ts`
- `docs/testing/**`: `coverage-branch-variation.md`, `desktop-foundation-coverage-and-gaps.md`, `desktop-foundation-traceability.md`, and the four defect records `defects/0001` to `defects/0004`

### necro-architect

- `docs/adr/`: ADRs 0002, 0003, 0004 and the IPC security model and main process lifecycle ADR
- `docs/architecture/`: `contract-changes.md`, `dependency-versions.md`, `electron-api-verification.md`, `renderer-architecture.md`

### art-director

- `docs/design/foundation-styling.md`

### release-engineer

- `docs/release/desktop-foundation-build-validation.md`
- `docs/release/packaging-review-findings.md`

### security-reviewer

- `docs/security/desktop-foundation-final-review.md`, `docs/security/desktop-foundation-final-review.json`
- `docs/security/m0-closure-validation.md`, `m0-dependency-validation.md`, `m0-final-security-validation.md`, `m0-post-install-validation.md`, `m0-resolution-report.md`, `m0-security-review.md`
- `docs/security/m2-m3-focused-review.md`, `m2-m3-security-review.md`

### audio-engineer, github-engineer

No changes.

## Files outside any agent's scope

No `.kiro/agents` file lists these paths. The author was therefore not one of the nine role agents (probably the main session or the user). Each needs an explicit owner decision.

- Root tooling: `.editorconfig`, `.gitattributes`, `.gitignore`, `.npmrc`, `.prettierignore`, `eslint.config.mjs`, `prettier.config.mjs`, `pnpm-workspace.yaml`
- Lockfile: `pnpm-lock.yaml`
- Project docs: `README.md`
- `.kiro/specs/desktop-foundation/design.md`, `preflight.md`, `requirements.md`, `tasks.md`
- `.kiro/steering/tech.md`
- `docs/engineering/backlog.md`, `desktop-foundation-delivery-report.md`, `m0-m1-acceptance-report.md`, `m2-m3-acceptance-report.md`, `m2-m3-deferred-runtime-validation.md`, `screenshots/m7-preview-production-shell.png` (binary)
- `docs/kiroween/kiro-journal.md`

Notes on scope edge cases:

- `package.json`, `tsconfig*.json`, `electron.vite.config.ts` and `.nvmrc` are desktop-engineer scope, but `eslint.config.mjs` and `prettier.config.mjs` are not listed for any agent.
- The commit `60b23a9` message says it "also updates eslint config for renderer sources". That file is outside every agent scope.
- qa-engineer scope does not cover `eslint.config.mjs`, yet `tests/lint-rules/boundary-rules.test.ts` tests it.

## Changes to sensitive paths

### `.kiro/`

- Added: `.kiro/specs/desktop-foundation/design.md`, `preflight.md`, `requirements.md`, `tasks.md`.
- Modified: `.kiro/steering/tech.md` (3 lines, shown in the diff). Steering is authoritative and is in no agent's write scope. The change needs human confirmation that it was approved.
- `.kiro/agents/**`, `.kiro/hooks/**`: unchanged.

### Steering

- `.kiro/steering/tech.md` only (see above). `product.md`, `structure.md`, `kiroween.md` unchanged.

### `package.json`

- Added (new file in this range). Owner desktop-engineer. Release-engineer rules require reading its scripts, including `pre*` and `post*` hooks, and confirming `package` uses `--publish never` before any pnpm script runs. Review of the script bodies is a pending item for release-engineer, desktop-engineer and security-reviewer. This inspection did not execute any script.

### Lockfiles

- Added: `pnpm-lock.yaml` (4522 lines). Related: `pnpm-workspace.yaml`, `.npmrc`. All three are in no agent scope.

### `.github/workflows/**`

- No changes. The directory does not exist in the range. CI is absent.

### `electron-builder.yml`

- No changes. The file does not exist in the range. No publish provider is configured.

## Full diff

Source: single run of `git diff 66f9f7f...HEAD`. Per-file sections longer than 400 lines are truncated to their first 400 lines, followed by a `[TRUNCATED ...]` marker line.

Truncated files:

- `.kiro/specs/desktop-foundation/design.md`: first 400 diff lines shown
- `.kiro/specs/desktop-foundation/tasks.md`: first 400 diff lines shown
- `pnpm-lock.yaml`: first 400 diff lines shown

The PNG appears in the diff as a binary file marker only.

~~~~diff
diff --git a/.editorconfig b/.editorconfig
new file mode 100644
index 0000000..5a85f29
--- /dev/null
+++ b/.editorconfig
@@ -0,0 +1,13 @@
+root = true
+
+[*]
+charset = utf-8
+end_of_line = lf
+insert_final_newline = true
+trim_trailing_whitespace = true
+indent_style = space
+indent_size = 2
+
+[*.md]
+trim_trailing_whitespace = false
+
diff --git a/.gitattributes b/.gitattributes
new file mode 100644
index 0000000..a54853d
--- /dev/null
+++ b/.gitattributes
@@ -0,0 +1,17 @@
+* text=auto eol=lf
+*.png binary
+*.jpg binary
+*.jpeg binary
+*.gif binary
+*.webp binary
+*.ico binary
+*.icns binary
+*.woff binary
+*.woff2 binary
+*.ttf binary
+*.otf binary
+*.mp3 binary
+*.wav binary
+*.flac binary
+*.ogg binary
+
diff --git a/.gitignore b/.gitignore
index d01a216..2dd5318 100644
--- a/.gitignore
+++ b/.gitignore
@@ -158,3 +158,7 @@ vite.config.ts.timestamp-*
 # Kiro workflow scratch artifacts (evidence preserved under docs/engineering/reviews/)
 /.agents/
+
+# Test output
+/test-results/
+/playwright-report/
diff --git a/.kiro/specs/desktop-foundation/design.md b/.kiro/specs/desktop-foundation/design.md
new file mode 100644
index 0000000..208453c
--- /dev/null
+++ b/.kiro/specs/desktop-foundation/design.md
@@ -0,0 +1,904 @@
+# Design: desktop-foundation (Phase 05)
+
+Status: **APPROVE WITH FIXES, applied.** The human approved requirements, this design, the artistic direction, the dependency candidates (as candidates, accepted only by V1 to V11) and milestones M0 to M8, subject to the corrections in decision record addendum E5 to E8 and in `tasks.md`. D1 to D14 are unchanged. Earlier amendments: N4 license exception (E1), lifecycle policy (9.3), validation tasks (section 15), host prerequisites (section 16), Appendix A. Gate H0 has passed (section 16 host record). **Implementation status (documentation closure):** M2: IMPLEMENTED - INTEGRATION PENDING. M3: IMPLEMENTED - INTEGRATION PENDING. This is implementation acceptance, not whole-application runtime acceptance; see `docs/engineering/m2-m3-acceptance-report.md`. Pending gates: V1 to V11 results, the installation approval (section 14), final human approval after M8.
+Inputs: `requirements.md` (R1 to R17), `preflight.md`, steering (`product`, `tech`, `structure`, `kiroween`), `electron-security` skill and references, `testing-strategy` skill, `docs/engineering/package-script-policy.md`, `docs/engineering/shared-ownership-policy.md`, ADR 0001, and the human-approved decisions D1 to D14.
+
+## 0. Overview, evidence labels and honesty notes
+
+The foundation is a single-package Electron app. The main process is the only privileged code. It serves the production renderer from a minimal-privilege `app://renderer` protocol, delivers a strict CSP, denies navigation, new windows, webviews and all permissions, and exposes exactly one IPC channel, `app:get-info`, through a preload bridge. The renderer is a neutral React shell with six placeholder regions. Behavior (hooks and stores), state (Zustand) and presentation (CSS Modules over CSS custom properties) are separate, so a later Skin Engine can replace presentation and layout without rewriting behavior. No playback, equalizer, skin or GitHub logic exists.
+
+Evidence labels: **VERIFIED** (read in this repo during this run), **DOCUMENTED** (stable Electron or tool behavior I am relying on from prior knowledge of the official docs, not re-fetched in this run), **UNVERIFIED** (must be checked before use).
+
+**Dependency research (this run).** Section 9 versions were resolved from the public npm registry JSON and official Electron sources using read-only PowerShell 7 web requests (no `web_fetch` tool was available). Nothing was installed. Residual UNVERIFIED items are marked in 9.4. Electron API names in sections 3 to 6 are DOCUMENTED from long-stable APIs and carry an "UNVERIFIED for the pinned Electron" mark where the exact name or behavior is version-sensitive (requirements A7, R17.2). The first implementation task must check each against the Electron docs for the resolved version and cite the page in the implementation note.
+
+## 1. Project structure
+
+Single package (D1). Only directories used in this phase are created. `*` marks files no agent can write (written by the orchestrator under D13).
+
+```
+necroamp/
+├─ .kiro/specs/desktop-foundation/{requirements,preflight,design}.md   (tasks.md later)
+├─ docs/adr/0002..0005-*.md                       (architect, see section 11)
+├─ src/
+│  ├─ main/
+│  │  ├─ index.ts                  composition root (only file with startup side effects)
+│  │  ├─ constants.ts              APP_NAME, APP_SCHEME, APP_HOST, PRELOAD/RENDERER path segments
+│  │  ├─ logging/logger.ts         local console logger, scrubs payloads and paths
+│  │  ├─ lifecycle/
+│  │  │  ├─ platform-policy.ts     PURE: quit-on-all-closed, recreate-on-activate (platform string)
+│  │  │  ├─ app-menu.ts            PURE template builder + thin Menu adapter
+│  │  │  ├─ single-instance.ts     lock + second-instance handler (Electron injected)
+│  │  │  └─ crash-handlers.ts      uncaughtException, unhandledRejection, render-process-gone
+│  │  ├─ window/
+│  │  │  ├─ create-main-window.ts  THE only BrowserWindow call site (R3.1)
+│  │  │  ├─ window-options.ts      PURE: web preferences + chrome profile -> options
+│  │  │  ├─ chrome-profile.ts      ChromeProfile type, "native" profile only (D5)
+│  │  │  ├─ navigation-guards.ts   web-contents-created guards (navigate, redirect, open, webview)
+│  │  │  └─ permissions.ts         deny-all permission/check/device handlers
+│  │  ├─ security/
+│  │  │  ├─ csp.ts                 PURE: buildCsp({mode, devOrigin?})
+│  │  │  ├─ trusted-origins.ts     PURE: resolveTrustedOrigins, isTrustedUrl
+│  │  │  └─ sender-validation.ts   PURE: isTrustedSender(frameLike, trusted)
+│  │  ├─ protocol/
+│  │  │  ├─ app-protocol.ts        registerSchemes() and handler install (fs + Response)
+│  │  │  ├─ resolve-app-path.ts    PURE: URL -> confined relative path or typed rejection
+│  │  │  └─ mime-types.ts          extension allow-list
+│  │  └─ ipc/
+│  │     ├─ register-handler.ts    the one registration helper (sender check + parse + map)
+│  │     └─ app-handlers.ts        handler for app:get-info
+│  ├─ preload/index.ts             contextBridge, one namespaced frozen object
+│  ├─ renderer/
+│  │  ├─ index.html, main.tsx, env.d.ts          (frontend-engineer; top-level files)
+│  │  ├─ app/
+│  │  │  ├─ app-shell.tsx, shell-layout.ts       layout descriptor, region ids
+│  │  │  ├─ bridge/necroamp-client.ts            THE adapter around window.necroamp (R4.9)
+│  │  │  ├─ strings/en.ts                        all user-facing strings (D14)
+│  │  │  ├─ styles/{tokens.css,global.css}       CSS custom properties (R8.13)
+│  │  │  └─ theme/contrast.ts                    PURE contrast ratio functions
+│  │  ├─ features/{player,playlist,equalizer,visualization,skin-selector,github}/
+│  │  │     index.ts (public), <name>-region.tsx (container), <name>-view.tsx (presentational),
+│  │  │     use-<name>.ts (headless behavior), <name>-view.module.css
+│  │  ├─ stores/app-info-store.ts                Zustand, injected client
+│  │  └─ components/{control-button,region-frame,status-text}/  presentational, props only
+│  └─ shared/ipc/
+│     ├─ channels.ts               IPC_CHANNELS constants (R4.1)
+│     ├─ result.ts                 ipcResultSchema factory, ipcErrorSchema, error codes
+│     ├─ app-info.ts               appInfoRequestSchema, appInfoResponseSchema, platformSchema
+│     └─ index.ts
+├─ tests/{e2e,fixtures}/           qa-engineer
+├─ package.json, .nvmrc, tsconfig.json + 5 project tsconfigs, electron.vite.config.ts   (desktop-engineer)
+├─ vitest.config.ts, playwright.config.ts                                            (qa-engineer)
+├─ eslint.config.mjs*, prettier.config.mjs*, .prettierignore*, .editorconfig*, .gitattributes*,
+│  .npmrc*, pnpm-workspace.yaml*, .gitignore additions*, pnpm-lock.yaml*, README command section*
+```
+
+Decisions behind the layout:
+
+- No new `src/shared` subdirectory. Origin, CSP and path logic are main-only, so they live in `src/main/security` and `src/main/protocol`. The contrast function lives in `src/renderer/app/theme` because only the renderer and tests use it. This avoids the unassigned-`shared` ownership gap (`shared-ownership-policy.md` section 2) and needs no ADR for a new shared directory.
+- `src/renderer/styles`, `src/renderer/strings` and similar top-level renderer subdirectories would be writable by no agent (preflight section B), so styles, strings, adapter and theme sit under `src/renderer/app/`, which frontend-engineer owns.
+- Path aliases `@shared/*`, `@main/*`, `@renderer/*` (R2.2) are declared once per consumer: each project tsconfig `paths`, `electron.vite.config.ts` `resolve.alias` per target, and `vitest.config.ts` `resolve.alias`. All three read the same three mappings. A unit test in `tests/` loads the three configs' alias tables and asserts equality. `@preload/*` is not created because nothing imports preload.
+- **Module format.** `package.json` does not set `"type": "module"`. Source is ES modules. electron-vite bundles main and preload to CommonJS. Reason: a sandboxed preload (`sandbox: true`) must be a single CommonJS script, and an ESM preload requires `sandbox: false` (DOCUMENTED Electron behavior; electron-vite emits `.mjs` for `type: module` projects, UNVERIFIED for the pinned version). Config files that need ESM use the explicit `.mjs` extension (`eslint.config.mjs`, `prettier.config.mjs`). The E2E test that asserts the bridge is present proves the preload loaded under the sandbox.
+- Dependency direction (R2.3) is enforced with ESLint core `no-restricted-imports` in per-glob flat-config blocks, so no import-plugin dependency is added:
+  - `src/renderer/**` forbids `@main/*`, `electron`, `node:*` and Node built-in names.
+  - `src/shared/**` forbids `electron`, `react`, `node:*` and Node built-ins, plus `no-restricted-globals` for `window`, `document`, `navigator`, `process`, `Buffer`. `tsconfig.shared.json` also sets `lib: ["ES2023"]` and `types: []`, so DOM and Node types do not exist there (R2.4).
+  - `src/renderer/features/**` forbids `@renderer/features/*/*` (deep imports of another feature). A feature imports only another feature's `index.ts`, and the rule set also forbids feature-to-feature imports altogether in this phase.
+  - `src/preload/**` and `src/main/**` forbid `@renderer/*`.
+  - Three or more `../` segments are forbidden with a `no-restricted-imports` pattern `../../../*`.
+  - Each rule has a fixture test in `tests/lint-rules/` that runs ESLint's `Linter` API on a string and expects the violation (R2.3 "fixture or rule test"). No network, no files written.
+- Static checks that R3.1, R4.1, R6.5, R8.4, R8.7, R15.1 require (single `new BrowserWindow`, no literal channel names, no `shell.openExternal`, no `AudioContext`, `requestAnimationFrame`, `crashReporter`, `autoUpdater`, `net`, `fetch`) are `no-restricted-syntax`/`no-restricted-globals`/`no-restricted-properties` rules plus a source-scan test in `tests/static/source-policy.test.ts` that reads `src/**` with `node:fs` and applies regexes. Both fail `pnpm lint` or `pnpm test`.
+
+## 2. Electron process architecture
+
+Three processes (`tech.md`). No fourth window, utility process or worker exists in this phase.
+
+- **Main** (`src/main/index.ts`): composition root. Startup order is fixed, because Electron requires some calls before `ready`:
+  1. `app.setName('NecroAmp')` (R7.7; sets the user-data directory).
+  2. Test-only user-data override (section 6).
+  3. `app.requestSingleInstanceLock()`. If it returns false, `app.quit()` and return before any other work (D11).
+  4. `protocol.registerSchemesAsPrivileged([...])` (must run before `ready`, DOCUMENTED).
+  5. Register `process` crash handlers.
+  6. Register `app.on('web-contents-created', ...)` navigation guards, `window-all-closed`, `activate`, `second-instance`, `before-quit`/`will-quit`.
+  7. `await app.whenReady()`, then: install permission handlers on `session.defaultSession`, install the `app://` handler, install the dev CSP header hook (dev only), register IPC handlers, set the application menu, create the main window.
+- **Preload** (`src/preload/index.ts`): imports only `@shared/ipc` constants. Builds one frozen object and calls `contextBridge.exposeInMainWorld('necroamp', api)`. Contains no logic beyond `ipcRenderer.invoke(IPC_CHANNELS.appGetInfo)`.
+- **Renderer** (`src/renderer`): React 19 app built by Vite. It reaches the bridge only via `app/bridge/necroamp-client.ts`.
+
+Alternatives considered and rejected:
+
+| Question | Chosen | Rejected | Reason |
+|---|---|---|---|
+| Production renderer URL | `app://renderer/` (D4) | `file://`, local HTTP server | Stable origin for sender checks and CSP; no open port (`product.md`). |
+| Serving files from the handler | `fs` read into `new Response(...)` | `net.fetch(pathToFileURL(...))` | R15.1 forbids `net` in `src`. An `fs` read also lets the handler enforce realpath confinement itself. |
+| Where Electron objects enter | Injected parameters into small factories | Importing `electron` in every module | Required for unit tests without Electron (R12.4). Only `index.ts` and thin adapters import `electron`. |
+| Where guards are installed | `app.on('web-contents-created')` | Only inside the window factory | Covers every web contents ever created, including ones not made by the factory. The factory remains the sole `BrowserWindow` creator (R3.1). |
+| IPC style | `ipcMain.handle` / `ipcRenderer.invoke` | `send`/`on` | Request-response with a typed result; no event channels exist now. |
+
+**Window chrome extensibility (D5).** `chrome-profile.ts` defines `type ChromeProfile = { kind: 'native' }` as a discriminated union, with only `native` implemented. `window-options.ts` is a pure function `(profile, platform) -> BrowserWindowConstructorOptions` subset that sets `frame: true`, `autoHideMenuBar: false`, `minWidth: 800`, `minHeight: 600` (R8.11), `width: 1100`, `height: 720`, `show: false`, `title: 'NecroAmp'`. A future `frameless` member adds `frame: false`, `titleBarStyle`/`titleBarOverlay` per platform with no change to security preferences, which are built by a separate function `buildWebPreferences()` that takes no profile argument. Window-control channels (`window:minimize`, etc.) are not created now. Draggable regions will be CSS (`-webkit-app-region`) in skin-owned layout; the foundation CSS reserves a `data-part="titlebar"` hook in `app-shell.tsx` only if frontend-engineer needs it, otherwise nothing.
+
+## 3. Security boundaries
+
+### 3.1 Window factory (R3.1 to R3.5)
+
+`create-main-window.ts` exports `createMainWindow(deps)` where `deps` includes a `BrowserWindow` constructor, the trusted-origin set, the load target and the `preloadPath` constant. It is the only file with `new BrowserWindow` (S rule).
+
+`buildWebPreferences()` returns the same literal object in every mode:
+
+```
+{ contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
+  webviewTag: false, allowRunningInsecureContent: false, nodeIntegrationInWorker: false,
+  nodeIntegrationInSubFrames: false, experimentalFeatures: false, spellcheck: false,
+  preload: <absolute path built from __dirname + 'index.js' constant> }
+```
+
+`preload` path is `path.join(__dirname, '../preload/index.js')` (UNVERIFIED output layout of electron-vite; the E2E bridge assertion catches a mismatch). No input, env var or argument alters it. Tests assert the object by deep equality (U) and read `webContents.getLastWebPreferences()` on the live window (E).
+
+Load target: if `resolveLoadTarget(env, isPackaged)` returns a dev URL, the window calls `loadURL(devUrl)`; otherwise `loadURL('app://renderer/index.html')`. `resolveLoadTarget` is pure:
+
+- Dev requires `isPackaged === false` AND `ELECTRON_RENDERER_URL` set (electron-vite dev sets it, UNVERIFIED name for the pinned version) AND the value parses as `http:` with hostname exactly `localhost` or `127.0.0.1`, a port, no credentials, empty path or `/`. Anything else is ignored and production mode is used.
+- The built-app E2E run (`electron out/main/index.js`) has the variable unset, so it exercises the production `app://` path even though `isPackaged` is false. The test harness explicitly deletes `ELECTRON_RENDERER_URL` from the child environment.
+
+### 3.2 Trusted origins and sender validation (R4.4, R3.5)
+
+`trusted-origins.ts`: `resolveTrustedOrigins(mode)` returns `['app://renderer']` in production, plus the dev server origin in dev only. It never reads the environment itself; `index.ts` passes the parsed dev origin. `isTrustedUrl(url, trusted)` parses with `new URL`, compares `url.origin` to the set by exact string equality, and returns false for `null`/`'null'` origins, parse errors and non-string input.
+
+`sender-validation.ts`: `isTrustedSender(event, trusted, mainFrameOf)` returns true only if all hold: `event.senderFrame` is non-null, it is the top frame of the registered main window's web contents (`senderFrame === webContents.mainFrame`, UNVERIFIED property names, DOCUMENTED in Electron `WebFrameMain`), and `isTrustedUrl(senderFrame.url, trusted)`. Sub-frames, missing frames and destroyed frames are rejected. The function takes a plain structural type (`{ senderFrame: { url: string; parent: unknown } | null }`) so it is unit and property testable. Note that Electron may return a null `senderFrame` after the frame has navigated or been destroyed (DOCUMENTED, Electron 45.5.0). **Implemented deviation (F-5):** the code checks `senderFrame.parent === null`, the trusted origin, and the registered `WebContents` identity (`isRegisteredSender`) instead of `senderFrame === webContents.mainFrame`. The rationale, the S-1 note and the verification status are in the "Addendum: sender-frame validation (F-5)" of `docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md`. Runtime behavior is not yet verified (T7.x).
+
+### 3.3 Navigation, new windows, webviews, permissions (R6)
+
+`navigation-guards.ts` exports `installNavigationGuards(app, trusted)`. For each created `webContents`:
+
+- `will-navigate`, `will-redirect` and `will-frame-navigate` (UNVERIFIED availability of the last name for the pinned Electron; DOCUMENTED since v25): `event.preventDefault()` unless `isTrustedUrl(url, trusted)`. In-app same-origin navigation is allowed because a single-page app does not navigate; the guard therefore also blocks any URL that is not exactly the app entry or dev entry. Decision: allow only same-origin URLs; reload of the entry URL works.
+- `setWindowOpenHandler(() => ({ action: 'deny' }))`. No external opener exists in this phase (R6.2, R6.5).
+- `will-attach-webview` calls `preventDefault()` (R6.3), in addition to `webviewTag: false`.
+
+`permissions.ts` installs on `session.defaultSession`: `setPermissionRequestHandler((_, __, cb) => cb(false))`, `setPermissionCheckHandler(() => false)`, `setDevicePermissionHandler(() => false)` (UNVERIFIED name for the pinned Electron; skip only if the docs show it removed, and then record why). Deny-all is the whole policy (R6.4).
+
+### 3.4 Content Security Policy (R5)
+
+`csp.ts` exports `buildCsp(options: { mode: 'production' } | { mode: 'development'; devOrigin: string }): string` and `buildMetaCsp(options)` (the same policy minus directives that `<meta>` ignores: `frame-ancestors`, `report-uri`, `sandbox`).
+
+Production policy (exact):
+
+```
+default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
+connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
+frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'
+```
+
+- No `unsafe-eval`, no `unsafe-inline`, no `data:`, no `http:`/`https:`/`ws:`/`wss:` or `*` anywhere (R5.3). `media-src` and `worker-src` are opened to `'self'` by the Audio Engine phase through a design change, not now.
+- `'self'` is expected to match `app://renderer` because the scheme is registered `standard` (DOCUMENTED Chromium behavior for standard schemes; UNVERIFIED for the pinned build, E2E R5.7 and the CSP-effective test catch a mismatch).
+- Style: D3 is CSS Modules. Vite emits a linked stylesheet in production, so `style-src 'self'` suffices and no inline `<style>` or `style` attribute is used. React's `style` prop is banned by lint (`react/forbid-dom-props` for `style`) and by the source-scan test. Dynamic values are written to CSS custom properties with `element.style.setProperty(...)`. Script-driven CSSOM changes are not blocked by `style-src` (CSP3 DOCUMENTED); the E2E test sets one property and checks that no CSP violation is reported.
+- Delivery (R5.1): the `app://` handler sets `Content-Security-Policy` on every response (not only HTML). A `<meta http-equiv>` copy is injected into `index.html` at build time by a small inline Vite plugin in `electron.vite.config.ts` (`apply: 'build'`, `transformIndexHtml`) that calls `buildMetaCsp({ mode: 'production' })`, so there is one source of truth. The source `index.html` contains no meta CSP, because it would block the dev server. A unit test builds the meta string and compares it to the header string minus the ignored directives.
+- Development: the header is added by `session.webRequest.onHeadersReceived`, filtered to URLs whose origin equals the dev origin. The dev policy is the production policy plus `connect-src <devOrigin> ws://<dev host:port>` and `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`. The two `unsafe-inline` allowances exist only because Vite's React Fast Refresh preamble and CSS hot update inject inline script and style in dev (UNVERIFIED for the pinned plugin versions; if they are not needed, remove them). **This is a deviation from R5.5, which allowed only the two dev origins. ACCEPTED WITH CONDITIONS by the human on 2026-11-26 (N2, ADR 0003 item 6):** `unsafe-inline` only where runtime validation shows Vite HMR or React Fast Refresh needs it (remove any allowance that is not required); development connections only to the exact trusted local dev origin; never `unsafe-eval`; never remote scripts; the production CSP contains no development exception; all Electron security invariants stay. It is dev-only, produced by one option of the builder, and covered by tests (T2.2, T6.1) proving the production output cannot inherit a development allowance. E2E never runs in dev mode.
+
+### 3.5 Filesystem, network, secrets (R15)
+
+- The renderer has no filesystem access. Main reads files only through the `app://` handler (section 4).
+- Main makes no network request: no `net`, `fetch`, `autoUpdater`, `crashReporter` (S rule, R15.1).
+- No secrets, tokens or personal data exist in this phase. Logs go through `logger.ts`, which accepts only a fixed event code plus an optional small object of allow-listed scalar fields (reason, exit code, platform). It never accepts a raw `Error` message, payload or path (R15.3).
+- `shell.openExternal` is not called anywhere (R6.5).
+
+### 3.6 Invariant ownership
+
+| Invariant | Enforced in | Why there |
+|---|---|---|
+| Web preferences are hardened and identical in all modes | `buildWebPreferences()` plus single factory | One function, no parameters, so no caller can weaken it. |
+| Only trusted senders reach handlers | `register-handler.ts` | Every handler goes through it; a handler cannot omit the check. |
+| Payload shape and bounds | Zod schemas in `shared/ipc`, parsed in `register-handler.ts` (main) and `necroamp-client.ts` (renderer, for responses) | Receiver validates its own input; sharing the schema does not replace parsing. |
+| No path escape from the app root | `resolve-app-path.ts` (lexical) plus `app-protocol.ts` (realpath) | Lexical rules are pure and property testable; symlink checks need the filesystem. |
+| No remote origin ever runs | CSP builder plus navigation guards plus protocol scheme privileges | Defense in depth: three independent layers. |
+| Production has no dev allowance | `buildCsp`, `resolveLoadTarget`, `resolveTrustedOrigins` | Each takes an explicit mode and is tested for the production output. |
+
+## 4. Custom protocol design (`app://`)
+
+Scheme registration (`app-protocol.ts`, `registerAppScheme()`, called at module top-level before `ready`):
+
+```
+protocol.registerSchemesAsPrivileged([
+  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
+])
+```
+
+Privileges explained (DOCUMENTED Electron `protocol` API; UNVERIFIED against the pinned version's page, to be cited in the implementation note):
+
+| Privilege | Value | Reason |
+|---|---|---|
+| `standard` | true | Gives a real host and origin (`app://renderer`), enables relative URL resolution and the `'self'` CSP source. |
+| `secure` | true | Treats the origin as a secure context (needed later for AudioWorklet and `crypto.subtle`). |
+| `supportFetchAPI` | true | Needed for module script and asset loading by Chromium for this scheme. |
+| `corsEnabled` | omitted | Same-origin only. **Pre-approved fallback:** if the E2E smoke run shows module scripts blocked because the scheme is not CORS-enabled, add `corsEnabled: true` (still same-origin only) and record it in ADR 0003. The implementer must not add any other privilege. |
+| `bypassCSP` | omitted (never) | The CSP must apply. |
+| `stream` | omitted | No media streaming in this phase; the Audio phase decides. |
+| `allowServiceWorkers`, `codeCache` | omitted | Not needed. |
+
+**Origin.** `app://renderer`. The host is a fixed constant. Because the scheme is `standard`, the host is lowercased by the URL parser. Any request whose host is not exactly `renderer` is rejected.
+
+**Handler** (`protocol.handle('app', handler)`, installed after `ready`, DOCUMENTED since Electron 25; removed with `protocol.unhandle('app')` on quit):
+
+1. Method must be `GET` or `HEAD`, otherwise respond `405` with `Allow: GET, HEAD`.
+2. Call `resolveAppPath(request.url)` (pure). On rejection respond `404` for any rejection (do not leak which rule failed; the reason code is logged locally as an allow-listed code only).
+3. Join with `RENDERER_ROOT = path.join(app.getAppPath(), 'out', 'renderer')` (UNVERIFIED; electron-vite default output, and asar behavior is a packaging-phase check).
+4. `fs.promises.realpath(file)` and require `realpathRoot + path.sep` as a prefix of the result (platform path API, case-insensitive compare on `win32`). Resolve `realpathRoot` once at startup. A failure or escape yields `404`.
+5. `fs.promises.stat`; require a regular file; require size at most 5 MiB (bound; rejection yields `404`).
+6. Read the file and return `new Response(body, { status: 200, headers })` with `Content-Type` from `mime-types.ts`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Cross-Origin-Resource-Policy: same-origin`. `HEAD` returns the headers with a null body.
+
+**`resolveAppPath(urlString)` pure rules** (R15.4), taking the platform path module as an injected parameter so tests run it against both `path.posix` and `path.win32`:
+
+1. Reject strings longer than 2048 characters, non-strings, and strings that fail `new URL`.
+2. Require `protocol === 'app:'`, `hostname === 'renderer'`, empty `username` and `password`, empty `port`.
+3. Take the raw `pathname`. Reject if it contains, case-insensitively, `%2f`, `%5c`, `%00`, `%2e%2e`, or any percent-encoded form of `.` as the only content of a segment. Reject a backslash, a NUL, or a `:` anywhere (drive letters, alternate data streams).
+4. Percent-decode once. If decoding throws, reject. Reject if the decoded value differs in a way that introduced `/`, `\`, NUL or `:` (double-decoding is not performed; a `%25` stays literal and fails the extension or existence check).
+5. Split on `/`. Reject empty segments except one trailing slash, and reject segments `.` and `..`. Reject any segment starting with `.` (dotfiles) and longer than 255 characters.
+6. Map `/` to `index.html`. Require the final segment's extension in the mime allow-list (`.html`, `.js`, `.css`, `.json`). A segment without extension is rejected (single-page app serves one entry; no client routing in this phase).
+7. Return `{ ok: true, relativePath }`, with the segments joined by the injected path module, then verify with the injected module that `resolve(root, relativePath)` starts with `resolve(root) + sep`. The result is typed `{ ok: false, code: 'BAD_URL' | 'BAD_HOST' | 'FORBIDDEN_CHARS' | 'TRAVERSAL' | 'BAD_EXTENSION' | 'TOO_LONG' }`.
+
+Property tests (qa-engineer, `*.property.test.ts`): for arbitrary strings, `resolveAppPath` never throws; for every `ok` result, the resolved path stays inside the root under both path modules; strings built from traversal fragments (`..`, `%2e%2e`, `%2f`, `\`, `C:`, `//`, NUL) are never `ok`. Unit tests: fixtures for each rule. The realpath step is tested with a fake `fs` for the escape case and, once, with a real temp directory and a symlink where the platform permits (skipped on Windows without privilege, reported as such).
+
+Dev mode does not use the protocol for the renderer. The scheme is still registered so that behavior is identical.
+
+## 5. Typed IPC contracts
+
+One channel (R4.7). Names: `src/shared/ipc/channels.ts`:
+
+```ts
+export const IPC_CHANNELS = { appGetInfo: 'app:get-info' } as const;
+export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
+```
+
+Schemas (`src/shared/ipc/`), all `z.strictObject`, bounded:
+
+- `platformSchema = z.enum(['win32', 'darwin', 'linux'])`; type `Platform`.
+- `appInfoRequestSchema = z.tuple([])`. The handler receives the invoke arguments as an array; any extra argument fails parsing.
+- `appInfoSchema = z.strictObject({ name: z.string().min(1).max(64), version: z.string().min(1).max(64), platform: platformSchema })`; type `AppInfo`.
+- `ipcErrorCodeSchema = z.enum(['INVALID_SENDER', 'INVALID_PAYLOAD', 'INTERNAL'])`.
+- `ipcErrorSchema = z.strictObject({ code: ipcErrorCodeSchema, message: z.string().max(120) })`. Messages come from a fixed map by code, never from an exception.
+- `ipcResultSchema(dataSchema)` returns `z.discriminatedUnion('ok', [{ ok: true, data }, { ok: false, error }])`; `appInfoResponseSchema = ipcResultSchema(appInfoSchema)`.
+
+`register-handler.ts` exports `registerHandler({ ipcMain, channel, requestSchema, responseSchema, handler, isTrustedSender })` and returns a disposer. It is the only caller of `ipcMain.handle`. Behavior, in order:
+
+1. `isTrustedSender(event)`: false returns `{ ok: false, error: INVALID_SENDER }`. The payload is not read.
+2. `requestSchema.safeParse(args)`: failure returns `INVALID_PAYLOAD`. No issue text, path or payload content is returned or logged.
+3. `await handler(parsed)` inside `try/catch`: a throw returns `INTERNAL` and logs `ipc.handler_failed` with the channel constant only.
+4. The result is always checked with `responseSchema.safeParse` before returning (cheap, and it prevents shape drift). A mismatch returns `INTERNAL` and logs.
+5. The function never throws across IPC. Logging level: `warn` for invalid sender (channel name only), `warn` for invalid payload, `error` for internal.
+
+`app-handlers.ts` handler for `app:get-info`: returns `{ name: app.getName(), version: app.getVersion(), platform }` where platform is parsed with `platformSchema` from `process.platform` (an unsupported platform value returns `INTERNAL`). Electron objects are injected.
+
+Preload (`src/preload/index.ts`):
+
+```ts
+const api = Object.freeze({
+  app: Object.freeze({ getInfo: (): Promise<unknown> => ipcRenderer.invoke(IPC_CHANNELS.appGetInfo) }),
+});
+contextBridge.exposeInMainWorld('necroamp', api);
+```
+
+It returns `unknown`; the renderer adapter parses. The exposed key set is `necroamp.app.getInfo` only (R4.6). Renderer adapter `necroamp-client.ts` exports `createNecroampClient(bridge)`, which calls `bridge.app.getInfo()`, parses with `appInfoResponseSchema`, and maps any rejection or parse failure to `{ ok: false, error: { code: 'INTERNAL', ... } }`. `window.necroamp` is read in exactly one function, `getBridge()`, which returns `undefined` if absent (R8.10: the UI shows "unavailable").
+
+Validation rules summary:
+
+| Input | Required | Type and limits | On failure |
+|---|---|---|---|
+| `app:get-info` arguments | yes (empty array) | `z.tuple([])` | `INVALID_PAYLOAD` result |
+| IPC sender | yes | trusted top frame URL | `INVALID_SENDER` result |
+| Response in renderer | yes | `appInfoResponseSchema` | client maps to `INTERNAL`, UI shows "unavailable" |
+| `ELECTRON_RENDERER_URL` | optional | loopback http URL, see 3.1 | ignored, production mode |
+| `NECROAMP_E2E_USER_DATA` | optional | absolute path, only when `!app.isPackaged`, max 260 chars, must exist and be a directory | ignored with a warn log |
+
+Unregistered channels (R4.8): the renderer has no generic invoke, so it cannot call one. Verified by U (registration helper registers only `IPC_CHANNELS` values; an `ipcMain` fake records calls) and by E (the bridge key set). A direct E2E call of an unknown channel is not possible without adding a generic bridge, which R4.6 forbids. This partial coverage is item N3 in section 13.
+
+Per `shared-ownership-policy.md` 3.1, desktop-engineer writes the contract; necro-architect reviews it; security-reviewer reviews because it concerns sender validation. Because it changes the IPC security model, an ADR (0005) records it (`shared-ownership-policy.md` 3.2).
+
+## 6. Application lifecycle
+
+Pure policy (`platform-policy.ts`, R7.3, R16.1):
+
+```ts
+export type SupportedPlatform = 'win32' | 'darwin' | 'linux';
+export const shouldQuitOnAllWindowsClosed = (p: string): boolean => p !== 'darwin';
+export const shouldCreateWindowOnActivate = (p: string, openWindows: number): boolean => p === 'darwin' && openWindows === 0;
+```
+
+Any unknown platform string quits (R7.3 property). Behavior per OS:
+
+| Event | Windows | Linux | macOS |
+|---|---|---|---|
+| Launch | one window, shown on `ready-to-show` | same | same |
+| Last window closed | `app.quit()` | `app.quit()` | app stays running; menu bar remains |
+| `activate` (dock click) | n/a | n/a | creates the window if none exists |
+| Second instance launched | second process exits; first window restored and focused | same | same (lock works on macOS; Finder normally prevents a second launch) |
+| Menu | minimal menu bar visible (D6) | same | full role-based menu in the system bar |
+| `Ctrl/Cmd+Q`, OS quit | `before-quit` -> dispose handlers -> exit | same | same |
+
+Window creation: `show: false`, then `once('ready-to-show', () => win.show())` (R7.1). Title `NecroAmp`. The renderer's `<title>` is also `NecroAmp`, so `page-title-updated` cannot change it unexpectedly.
+
+Single instance (D11, R7.2): `single-instance.ts` exports `acquireSingleInstance(app, onSecond)`. `requestSingleInstanceLock()` false means `app.quit()` before `ready` (the second process exits quickly). The first process handles `second-instance` by restoring (`isMinimized()` then `restore()`), `show()` and `focus()` on the main window if it exists, otherwise by creating it. The handler ignores argv and working directory, so no command-line input is trusted (and none is parsed). The lock is keyed by the user-data directory in Electron (DOCUMENTED), so E2E tests with distinct user-data directories do not collide, and the second-instance test launches two processes with the same directory.
+
+**Test user-data isolation (R13.5).** Playwright passes `NECROAMP_E2E_USER_DATA=<temp dir>` in the child environment. `index.ts` calls `app.setPath('userData', value)` before the lock, only when `!app.isPackaged` and the validation in section 5 passes. Rationale: it does not weaken any web preference, does not use a Chromium flag, and is inert in packaged builds. An alternative, the Chromium `--user-data-dir` argument, is rejected because its effect on `app.getPath('userData')` and the lock is UNVERIFIED. Playwright suites that launch Electron run with `workers: 1`.
+
+Crash handling (R7.4, R7.5; `crash-handlers.ts`, Electron injected):
+
+- `webContents.on('render-process-gone', (_, details))`: log `{ reason: details.reason, exitCode: details.exitCode }`. First occurrence per window: `reload()` once. Second: `destroy` the window (`close()`), which leads to quit via the platform policy on win32 and linux. On macOS the app stays alive with the menu and `activate` recreates a window; this is not an invisible running app because the dock icon and menu bar are present. Decision: on macOS also quit when the renderer crashed twice, to keep behavior simple and avoid a zombie. (`app.quit()` after the second crash on all platforms.)
+- `process.on('uncaughtException')`: log the error `name` only in production (stack and message in dev), then `app.exit(1)`. Node documents that continuing after an uncaught exception is unsafe.
+- `process.on('unhandledRejection')`: log the reason's `name` only, no exit.
+- `crashReporter` is never started (S rule).
+- Quit (R7.6): on `will-quit` the disposers returned by `registerHandler`, `protocol.unhandle('app')`, and the navigation/permission handlers are released. There is no async work, so exit completes well within 5 seconds.
+
+Menu (D6, R16.6): `app-menu.ts` exports `buildMenuTemplate({ platform, isDevRun })`, a pure function returning plain descriptors (`role`, `label`, `submenu`) typed locally, converted by a thin adapter with `Menu.buildFromTemplate`. macOS: `appMenu`, `fileMenu`, `editMenu`, `windowMenu` roles. Windows and Linux: File (`quit`), Edit (`undo`, `redo`, separator, `cut`, `copy`, `paste`, `selectAll`), Window (`minimize`, `close`). View (`reload`, `toggleDevTools`) appears only when `isDevRun`. Roles supply localized labels, so no menu string enters the strings file. Unit tests cover all three platforms and the dev-only View.
+
+## 7. Renderer component architecture
+
+Layers per feature, enforced by lint and review:
+
+1. **Headless behavior** `use-<name>.ts`: React hooks returning plain props and handlers (for example `usePlayerControls()` returns a list of `{ id, labelKey, onActivate, disabled }`). No JSX, no CSS.
+2. **Container** `<name>-region.tsx`: calls the hook, reads stores through selectors, renders the view. It is the only layer aware of stores.
+3. **View** `<name>-view.tsx`: stateless, props in, JSX out, emits `data-part` attributes for stable styling and skin targeting. Imports its own `*.module.css` and shared components.
+4. **Shared components** `components/`: `ControlButton`, `RegionFrame` (labelled `section` with heading), `StatusText` (`role="status"`). Props only, no store, no bridge.
+
+State: `stores/app-info-store.ts` exports `createAppInfoStore(client)` returning a Zustand store with state `{ status: 'idle' | 'loading' | 'loaded' | 'failed', data?: AppInfo }` and action `load()`. A hook `useAppInfo` in `app/` binds the real client. Tests pass a fake client (R10.1, R12.4). Stores import only `@shared/*` and types. No audio state exists (R10.3).
+
+Shell and layout: `app/shell-layout.ts` exports `REGION_IDS` (`player`, `playlist`, `equalizer`, `visualization`, `skin-selector`, `github`) and `FOUNDATION_LAYOUT`, a typed constant describing region order and the grid area names. `app-shell.tsx` maps the layout to region containers using a `Record<RegionId, ComponentType>` and gives each region its `data-testid` equal to the id (R8.3). Region ids are the stable contract that a future Skin Engine layout will reference. The registry is a plain constant now; no registry or plug-in mechanism is built (YAGNI).
+
+Landmarks and accessibility: header with the single `h1` "NecroAmp" and the tagline; `main` containing six `section` elements, each labelled by its own `h2` through `aria-labelledby`. Placeholder buttons use `aria-disabled="true"` and `aria-describedby` pointing to a visible "Not implemented in this phase" text, are focusable (not `disabled` attribute, so they stay in the tab order), and activation only updates a `StatusText` message. Tab order equals DOM order, which equals reading order. The equalizer shows ten `<div role="group">` bands labelled "Band 1" to "Band 10" containing a non-interactive `<meter>`-free placeholder (a `span` with text), so they are not form controls and need no value semantics. No animation, no `requestAnimationFrame`, no `AudioContext` anywhere (R8.4, R8.7, R9.7).
+
+User-facing strings (D14): all text lives in `app/strings/en.ts` as a typed `as const` object keyed by id (`STRINGS.player.play`). Components receive text through props or import the constant. No i18n library. Keys are stable ids, so a later framework can replace the file with a lookup without touching components. Tests assert the exact tagline `Code. Listen. Repeat.` against the constant and the DOM.
+
+`index.html`: `lang="en"`, `<title>NecroAmp</title>`, `<div id="root">`, `<script type="module" src="./main.tsx">`. No meta CSP in source (3.4).
+
+Layout checks at 800x600 and 1920x1080 (R8.11): CSS grid with named areas, `min-width: 0`, no fixed widths above 800 minus padding, `overflow-wrap: anywhere` on text. E2E compares bounding boxes for overlap and `scrollWidth <= clientWidth`.
+
+## 8. Styling and future Skin Engine compatibility
+
+Foundation (D3, R8.13): CSS Modules for component rules, global CSS only for tokens and reset. Tokens in `app/styles/tokens.css` under `:root` as custom properties: color roles (`--na-color-surface`, `--na-color-text`, `--na-color-focus`, ...), spacing scale, type sizes, radii, a focus ring token. Components reference only tokens, never literal colors. The foundation palette is a neutral dark gray and off-white pair chosen to satisfy contrast (R9.3, R9.4) with no resemblance to either bundled skin. Contrast ratios (WCAG relative luminance) are computed by `theme/contrast.ts` and tested on the token pairs read from the CSS file by a test.
+
+Why this does not block the artistic direction. Skins are complete visual experiences, not color themes (Morgul Revenant: obsidian black, weathered stone and metal textures, spectral green glow, mist, angular gothic architecture, ornate frames, custom controls, diamond equalizer sliders, gothic type, localized glow; Analog 1984: brushed aluminium, knobs and switches, VU meters, mechanical controls, warm light, realistic textures; substantially different compositions). The foundation keeps the following seams open and builds none of them:
+
+| Skin need | Foundation seam | Not built now |
+|---|---|---|
+| Backgrounds, textures, decorative frames | Region views render inside `RegionFrame` with `data-part` hooks; no component hardcodes a surface; tokens for surfaces | Image assets, 9-slice frames |
+| Custom graphical controls (diamond sliders, knobs, switches) | Behavior hooks return plain props, views are replaceable; control semantics stay in the hook (value, min, max, onChange) | Alternative control views, skin-supplied renderers |
+| Skin typography | Font family and size are tokens | Font loading, `@font-face` from skins |
+| Component geometry and skin-dependent layouts | Region ids and `FOUNDATION_LAYOUT` descriptor separate "what regions exist" from "where they go"; grid areas are named from the descriptor | Declarative layout schema, absolute-region model |
+| Custom window chrome, draggable regions | `ChromeProfile` union in main; shell exposes an optional titlebar hook; no window-control channels yet | Frameless windows, window-control IPC |
+| Visual effects, animations | Presentation is CSS only, so effects can be added per skin; foundation has none (R9.7) | Effects, reduced-motion handling (becomes mandatory with the first animation) |
+| Declarative assets, no executable skin code | CSP forbids inline script and remote origins; styling is data (CSS variables) | Skin manifest, loader, skin protocol and CSP additions (`img-src`, `font-src` for the skin root) |
+
+Constraints future designs must respect, recorded here as design constraints: a skin supplies data only; every skin asset is served through a confined protocol root with its own license record in `docs/assets.md`; no third-party copyrighted art; provenance recorded; a human-approved Morgul concept image goes to art-director in the Skin Engine phase. The six Morgul palette values (#080D0A, #18251E, #354C3D, #6A9250, #B6E88A, #DEE8D4) are a reference only and are not used in foundation CSS. The foundation's CSP will need `img-src`/`font-src` additions for skin assets, which is a future design change, not a loosened policy now.
+
+## 9. Dependency inventory and version selection
+
+**Verification status.** Versions below were resolved in this run from the public npm registry (`https://registry.npmjs.org/<pkg>/<version>` JSON: `version`, `license`, `engines`, `peerDependencies`, `dependencies`, `scripts`) and from official sources named in the evidence table. Nothing was installed. Versions are pinned exactly in `package.json` (no `^`, no `~`) and the lockfile is committed. The registry moves, so the implementation task re-runs the same lookups and stops on any difference before it installs (R1.3). Registry publish dates in the metadata fall in 2026; they were not used to judge stability beyond the dist-tags noted below.
+
+### 9.1 Selected matrix (implementation candidates)
+
+The versions are candidates, resolved from registry metadata. Compatibility is accepted only by the executed validation tasks V1 to V11 in section 15.
+
+| Package | Exact version | License | Selection rationale |
+|---|---|---|---|
+| Node.js (tooling) | 24 LTS, `engines.node` `>=24.15.0 <25` | n/a | Steering fixes Node 24. The floor 24.15.0 comes from `jsdom@31.0.1` (`^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`). Vitest 5.1.2 accepts `^24.0.0`; Electron 45.5.0 needs `>= 22.12.0`. |
+| pnpm | 10.34.9 (`packageManager: pnpm@10.34.9`) | MIT | Registry dist-tag `latest-10`. No install scripts. Steering fixes pnpm 10; dist-tag `latest` is 12.23.0 and is rejected. |
+| electron | 45.5.0 | MIT | Dist-tag `latest` and `45-x-y`. Its `DEPS` file at tag `v45.5.0` sets `node_version` to v24.22.3, so the app runs the same Node major as the tooling. No `scripts` in its metadata (see 9.3). |
+| electron-vite | 6.0.0 | MIT | Peer `vite ^6 \|\| ^7 \|\| ^8`; `@swc/core` peer is optional. Depends on `rolldown ~1.2.10`. Engines `^20.19.0 \|\| >=22.12.0`. |
+| vite | 7.3.8 | MIT | Newest 7.x. Accepted by electron-vite 6.0.0 and by vitest 5.1.2 (`^6.4.0 \|\| ^7 \|\| ^8`). Chosen over 8.3.8 for a license reason, see 9.2. |
+| @vitejs/plugin-react | 5.2.0 | MIT | Newest 5.x. Peer `vite` includes `^7`. The 6.x line peers `vite ^8` only. |
+| react, react-dom | 19.3.1 | MIT | Latest. `react-dom` peers `react ^19.3.1`, so both are the same exact version. |
+| @types/react | 19.3.3 | MIT | Latest 19.x. |
+| @types/react-dom | 19.3.0 | MIT | Latest. Peers `@types/react ^19.3.0`. |
+| zustand | 5.1.0 | MIT | Latest. Peers `react >=18`; `immer`, `@types/react`, `use-sync-external-store` are optional peers and are not installed. |
+| zod | 4.6.7 | MIT | Latest. Runtime dependency of `src/shared` (policy 3.2). |
+| typescript | 6.0.3 | Apache-2.0 | Newest 6.0.x. `typescript-eslint@8.74.0` requires `typescript >=4.8.4 <6.1.0`, so 7.0.2 (`latest`) is held back. |
+| @types/node | 24.19.4 | MIT | Newest 24.x, matching the Node 24 line. Electron 45.5.0 itself depends on `@types/node ^24.9.0`. Vitest and Vite accept it. |
+| eslint | 9.39.5 | MIT | Dist-tag `maintenance`. `latest` is 10.15.0, but `eslint-plugin-react@7.37.5` peers `eslint ^9.7` at most and `eslint-plugin-jsx-a11y@6.10.2` peers `^9` at most. |
+| @eslint/js | 9.39.5 | MIT | Must match ESLint (`10.0.1` peers `eslint ^10`). |
+| typescript-eslint | 8.74.0 | MIT | Peers `eslint ^8.57 \|\| ^9 \|\| ^10`, `typescript >=4.8.4 <6.1.0`. |
+| eslint-plugin-react | 7.37.5 | MIT | Peers `eslint ... ^9.7`. |
+| eslint-plugin-react-hooks | 7.1.1 | MIT | Peers include `eslint ^9.0.0`. |
[TRUNCATED: .kiro/specs/desktop-foundation/design.md has 910 diff lines; remaining 510 lines omitted]
diff --git a/.kiro/specs/desktop-foundation/preflight.md b/.kiro/specs/desktop-foundation/preflight.md
new file mode 100644
index 0000000..abff97b
--- /dev/null
+++ b/.kiro/specs/desktop-foundation/preflight.md
@@ -0,0 +1,98 @@
+# Preflight report: desktop-foundation
+
+> **Location note.** This file is meant for `.kiro/specs/desktop-foundation/preflight.md`. The writing agent (necro-architect) is denied writes to `.kiro/**` and to everything outside `docs/adr|architecture|requirements/**` (finding W2 below), so it was staged here. Copy it, with `requirements.md`, to the Spec folder (human or IDE session). The same note applies to `requirements.md`.
+
+Read-only review. Nothing existing was modified. Evidence labels follow `docs/engineering/package-script-policy.md`: VERIFIED (read in this repository during this run), DOCUMENTED (stated by an existing repo document, not re-exercised), ASSUMED (inferred).
+
+Files read: the four steering files, `.kiro/agents/*.md` (full text of necro-architect, desktop-engineer, frontend-engineer, qa-engineer, security-reviewer, release-engineer, art-director; audio-engineer and github-engineer by listing only), `.kiro/workflows/feature-development.workflow.json`, `.kiro/hooks/*.json`, `.kiro/skills/electron-security/SKILL.md` and its hardening checklist, `docs/engineering/{package-script-policy,shared-ownership-policy,automation-validation,backlog}.md`, `docs/adr/0001-*`, `.gitignore`. The repository root holds only `.agents`, `.git`, `.kiro`, `docs`, `.gitignore`, `LICENSE`, `README.md` (VERIFIED). There is no `package.json`, `src/`, `tests/` or `.github/`.
+
+## A. Workflow validation: `feature-development.workflow.json`
+
+JSON structure is sound: every step has `type`, `id` and `prompt`; the parallel and repeat nodes have `steps`/`branches`; all nine `agent` values map to an existing `.kiro/agents/*.md` file; artifact paths fall inside each agent's write allow-list (VERIFIED). Runtime acceptance of the recipe by Kiro is ASSUMED (`automation-validation.md` check 5 says the same).
+
+Defects and risks relevant to this feature:
+
+| ID | Severity | Finding | Evidence | Consequence for desktop-foundation |
+|---|---|---|---|---|
+| W1 | High | The workflow writes requirements and architecture to `docs/requirements/{{run_label}}.md` and `docs/architecture/{{run_label}}.md`. It has no notion of a native Spec under `.kiro/specs/<name>/`. | Step `requirements-architecture` prompt and artifacts. | The workflow cannot produce or consume `requirements.md`/`design.md`/`tasks.md`. Using it as is would fork the requirements into a second location. |
+| W2 | High | `necro-architect` cannot write `.kiro/**`. Its `fs_write` deny list contains `.kiro/**`, and its allow list is `docs/adr|architecture|requirements/**`. No agent can write `.kiro/**`. Confirmed at runtime: a write to `.kiro/specs/desktop-foundation/preflight.md` was blocked ("deny fs_write matching `**`", source agent-profile). | `necro-architect.md` permissions; same deny in all seven agents read; blocked write in this run. | Spec files under `.kiro/specs/` can be written only by the human or the IDE main session, not by any custom agent. The same applies to ticking tasks in `tasks.md`. |
+| W3 | High | The workflow assigns exactly one domain agent per run ("If the feature spans several domains, recommend splitting"). This feature spans desktop, renderer, tests, lint config and unowned files. | Step 1 prompt; the `implement-*` branches skip unless `APPROVED DOMAIN AGENT` matches. | Phase 05 needs several sequential runs (section B). A single run cannot deliver it. |
+| W4 | High | No agent can write several mandatory files (section B, "no agent"): ESLint config, Prettier config, `.npmrc`, `pnpm-workspace.yaml`, lockfile (install is `ask`), `.gitignore`, unassigned `src/shared/**`. | Agent permission lists. | The workflow would fail or silently skip these, leaving lint and reproducible-install requirements unmet. A human must write them. |
+| W5 | Medium | No separate "requirements approved, now design" gate. Step 1 writes requirements and architecture together, then one approval. | Step order. | Does not match requirements-first Spec flow. Use the native Spec flow for requirements, design and tasks, and the workflow only for implementation, review and gate stages after approval. |
+| W6 | Medium | `run_label` is an unconstrained string interpolated into file paths. | Inputs and artifacts. | A label containing `..` or separators could point writes elsewhere (per-agent write rules still limit impact to allowed trees). Use a fixed kebab-case label such as `desktop-foundation-1`. |
+| W7 | Medium | Implementation prompts say "do not install dependencies without explicit human approval", and all agents have `pnpm install*` at `ask`. In an unattended run an `ask` may stall. | Branch prompts; agent shell rules. | Do the first install interactively, before any workflow run. |
+| W8 | Medium | `qa-engineer` participates only as reviewer. It is the only agent that can write `tests/**`, `vitest.config.ts`, `playwright.config.ts` and `*.property.test.ts`; implementers are denied those. | Agent scopes. | Property tests and Playwright setup need a dedicated qa-engineer implementation run. |
+| W9 | Low | `necro-architect` uses `send_message` for gates, but its `tools` list is `["read","write"]`. Availability is not stated. | `necro-architect.md`; `automation-validation.md` observation 3. | ASSUMED to work. Watch the first approval gate. |
+| W10 | Low | Review independence ("Do not read the security review") is a prompt instruction only. | Prompts; agent read rules. | Advisory control only. |
+| W11 | Low | `stopWhen` reads `quality-gate.output`, which does not exist on iteration one. | `build-review-gate`. | ASSUMED treated as not matching. Unverified. |
+| W12 | Info | `onMaxIterations: continue` lets the run reach `final-approval` with a failed gate. The final prompt handles it. | Final step prompt. | Acceptable. |
+
+Verdict: structurally valid, not fit to run all of Phase 05 as one run. Usable per slice (B), after Spec approval, with a fixed `run_label`, and with the W2/W4 items done by a human. It was not launched.
+
+## B. Agent permissions and safe task assignment
+
+All seven agents read in full deny: mcp, power, subagent; `fs_read` of secret-like paths and `.git/**`; and `fs_write` of `.kiro/**`, `.npmrc`, `.gitignore`, `LICENSE`, `.git/**`, secrets (VERIFIED). `security-reviewer`, `necro-architect` and `art-director` have no shell (VERIFIED). `desktop-engineer`, `frontend-engineer`, `qa-engineer` allow `pnpm typecheck|lint|test*`, set `pnpm install|add|remove|update|dlx*` to `ask`, and deny `git commit|push|reset|checkout|clean|rebase`, `gh`, `curl`, `npm`, `npx`, `yarn`, `rm`, `aws` (VERIFIED). Shell matching is pattern based and cannot see script bodies (DOCUMENTED, `package-script-policy.md` section 3). Compound-command matching is unverified.
+
+Gaps in shell patterns:
+- `desktop-engineer` allows `pnpm dev*`. `pnpm dev` starts a long-running Electron process and can hang a non-interactive run. Use it interactively only.
+- `frontend-engineer` allows `pnpm typecheck|lint|test*` but not `pnpm build*`. `pnpm test*` also matches `pnpm test:e2e` for desktop-engineer and frontend-engineer.
+- `qa-engineer` is the only agent explicitly allowed `pnpm test:e2e*` and `pnpm build*`.
+
+### Ownership for expected Phase 05 files
+
+| Work item | Path (target) | Writer | Notes |
+|---|---|---|---|
+| Package manifest, scripts, engines, packageManager | `package.json` | desktop-engineer only | Script bodies need security-reviewer review (policy 4.2). No `publish` script. |
+| `.nvmrc`, `tsconfig*.json`, `electron.vite.config.ts` | root | desktop-engineer | |
+| Main process, window factory, lifecycle, CSP, navigation guards | `src/main/**` (not `github/**`) | desktop-engineer | |
+| Preload bridge | `src/preload/**` | desktop-engineer | |
+| IPC channels and Zod schemas | `src/shared/ipc/**` | desktop-engineer | Architect reviews the contract (shared-ownership-policy 3.1). |
+| Renderer shell, placeholder features, Zustand stores, components | `src/renderer/app|features|stores|components/**` | frontend-engineer | |
+| `index.html`, entry `main.tsx`, top-level CSS, env typings | `src/renderer/*.html|css|ts|tsx` | frontend-engineer | Other renderer subdirectories (for example `src/renderer/styles/`) are writable by no one. |
+| Co-located unit tests `*.test.ts(x)` | next to code | implementing agent | |
+| Property and integration tests | `*.property.test.ts`, `*.integration.test.ts` | qa-engineer only | Implementers are denied. |
+| `vitest.config.ts`, `playwright.config.ts`, `tests/**` | root, `tests/` | qa-engineer only | |
+| Install and lockfile | `pnpm install`, `pnpm-lock.yaml` | human | All agents `ask`; lockfile has no writer. |
+| ESLint config, Prettier or Biome config, `.editorconfig` | root | **no agent** | Human writes. Blocked on decision D2. |
+| `.npmrc`, `pnpm-workspace.yaml` | root | **no agent** | Human writes after an architect ADR and security review. |
+| `.gitignore` additions (`test-results/`, `playwright-report/`) | root | **no agent** | Currently ignores `node_modules`, `out`, `dist`, `coverage`, not the Playwright folders (VERIFIED). |
+| Unassigned `src/shared/**` (for example shared types) | `src/shared/` | **no agent** | Architect owns design; human or main session implements (shared-ownership-policy section 2). |
+| Spec files and task tick-off | `.kiro/specs/**` | **no agent** | Human or IDE main session. |
+| CI workflow | `.github/workflows/**` | release-engineer | Out of scope for this phase. |
+
+### Recommended slices (each its own run or interactive session)
+
+1. Human: confirm Node 24 and pnpm 10; resolve D1 to D5, D9; write lint/format config, `.npmrc`/`pnpm-workspace.yaml`, `.gitignore` additions; approve installs.
+2. desktop-engineer: manifest and config, `src/main`, `src/preload`, `src/shared/ipc`, co-located tests. Then security-reviewer reviews scripts and dependencies, then IPC and window code.
+3. frontend-engineer: renderer shell and placeholder UI (needs the typed preload API from slice 2).
+4. qa-engineer: `vitest.config.ts`, `playwright.config.ts`, property tests, Playwright smoke test, accessibility checks.
+5. Architect gate review, human final approval.
+
+Never assign implementation to security-reviewer or necro-architect (read-only by design), nor to art-director, audio-engineer, github-engineer or release-engineer (outside scope for this feature).
+
+## C. Hooks
+
+| File | Hook | Trigger | Action | Enabled state |
+|---|---|---|---|---|
+| `.kiro/hooks/post-task-quality.json` | `post-task-quality-typecheck`, `-lint`, `-test` | `PostTaskExec` | `pnpm run --if-present typecheck|lint|test` | Not determinable from the file |
+| `.kiro/hooks/ipc-security-check.json` | `ipc-security-check` | `PostFileSave`, matcher `src/shared/ipc` or `src/preload` | read-only agent prompt, no edits or shell | Not determinable from the file |
+
+Findings:
+- The JSON files contain no `enabled` field (VERIFIED). The enabled state lives in the IDE, which this run cannot read. Confirm in the Kiro hooks panel that both are disabled before implementation.
+- `automation-validation.md` check 13 says no dry run was executed. Both hooks are unvalidated.
+- `ipc-security-check` was inert because `src/preload` and `src/shared/ipc` do not exist. Phase 05 creates them, so it would fire on the first save. Keep disabled until validated on a throwaway file.
+- `post-task-quality` runs project-defined scripts via `pnpm`. A watch-mode `test` script would hang it. R11.4 requires a non-watch `test`. The script bodies fall under the script-review policy.
+- Both hooks only run commands or a read-only prompt. Neither writes, installs or uses git (VERIFIED by reading).
+
+## D. Environment note
+
+`tech.md` records that Node.js and pnpm were not on PATH at genesis. This run has no shell and cannot check the host. Prerequisite verification is therefore requirement R1.1 and the first human step.
+
+## E. Items for the human
+
+1. Decide D1 to D14 (`requirements.md` section 14), at least D1, D2, D3, D4 and D5, before design.
+2. Move or copy the staged Spec files to `.kiro/specs/desktop-foundation/` (W2). Only you or the IDE session can maintain `tasks.md` status.
+3. Provide the unowned files (lint config, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions), or approve a scoped permission change per `shared-ownership-policy.md` option 2.
+4. Confirm hooks are disabled.
+
+No existing steering, agent, skill, workflow or hook file was modified.
diff --git a/.kiro/specs/desktop-foundation/requirements.md b/.kiro/specs/desktop-foundation/requirements.md
new file mode 100644
index 0000000..6c98e5a
--- /dev/null
+++ b/.kiro/specs/desktop-foundation/requirements.md
@@ -0,0 +1,285 @@
+# Requirements: desktop-foundation (Phase 05)
+
+Status: DRAFT, awaiting human approval. Design and tasks are not written.
+
+> **Location note.** Intended path: `.kiro/specs/desktop-foundation/requirements.md`. The writing agent (necro-architect) cannot write `.kiro/**` (see `preflight.md`, W2), so this file is staged under `docs/requirements/desktop-foundation/`. Move or copy it, with `preflight.md`, to the Spec folder.
+
+## 1. Purpose and scope
+
+Establish the first functional, secure, cross-platform Electron foundation for NecroAmp: toolchain, process separation, hardened window, narrow typed IPC, strict CSP, application lifecycle, test and lint foundations, and an initial window with placeholder areas for later features. The result is a foundation, not final art.
+
+Out of scope are listed in section 15. The audio engine, skin engine and GitHub integration are not implemented.
+
+## 2. Authority and sources
+
+Binding: `.kiro/steering/product.md`, `tech.md`, `structure.md`, `kiroween.md`. Procedures: `electron-security` and `typescript-standards` and `testing-strategy` skills. Policies: `docs/engineering/package-script-policy.md`, `docs/engineering/shared-ownership-policy.md`. Decision record: `docs/adr/0001-linux-credential-storage-fail-closed.md` (not exercised in this phase; no token storage here). This document cites those sources and does not restate them.
+
+Notation: EARS patterns (ubiquitous "The system shall", event "When", state "While", unwanted "If ... then", optional "Where"). Requirements are numbered `R<n>`, criteria `R<n>.<m>`. Each criterion states how it is verified: **U** unit test, **P** property test (fast-check), **E** Playwright Electron test, **C** command run, **S** static check (lint rule, grep-style test), **R** review (named reviewer). "Dev" means the unpackaged development run.
+
+## 3. Glossary
+
+- **App origin**: the origin from which the renderer document is loaded in production (see D4). In dev, the dev-server origin is additionally trusted (R3.5).
+- **Bridge**: the object exposed to the renderer through `contextBridge` by the preload script.
+- **Placeholder**: a UI element that is rendered, labelled and focusable but performs no feature behavior.
+
+## 4. Assumptions
+
+State these before approval. Each is an assumption, not a decision, and can be overturned.
+
+- A1. The development host is Windows with PowerShell (`tech.md`, Environment notes). Node.js and pnpm may be absent and must be verified (R1.1). macOS and Linux behavior may be unverifiable in this phase and must then be reported as NOT VERIFIED (R16.3).
+- A2. A single `app:get-info` channel is enough to prove the IPC path end to end. No other channel is created in this phase (R4.7).
+- A3. English-only UI (`structure.md` open decision 17, assumed there).
+- A4. No bundled binary assets (images, fonts, sounds) are added. System fonts and inline or text glyphs are used, so `docs/assets.md` needs no new entry (R8.12).
+- A5. Windows, macOS and Linux CI is a later task. This phase verifies locally; the commands must be CI-ready (frozen lockfile, non-interactive, non-watch).
+- A6. Electron, electron-vite, Vite, React, TypeScript, Zustand, Zod, Vitest, fast-check, Playwright and the lint tools are all current stable releases resolved at scaffold time from official documentation or the package registry (R1.3). No version is written in this document.
+- A7. Playwright's Electron support, the safeStorage API and Electron's session and protocol APIs may differ by Electron release. Any API name not confirmed against the documentation for the resolved version is ASSUMED and must be checked in the design.
+- A8. The Spec will be maintained by the human or IDE session; agents cannot write `.kiro/**`.
+
+## 5. Requirements: toolchain and reproducible installs
+
+**R1. User story:** As a maintainer, I want the toolchain pinned and installs reproducible, so that any contributor on any platform gets the same build.
+
+- R1.1 When a contributor prepares the workspace, the scaffold task shall verify `node --version` reports major version 24 and `pnpm --version` reports major version 10, and shall stop and report if either is missing or different. Verified by C.
+- R1.2 The project shall declare Node 24 in `package.json` `engines` and in `.nvmrc`, and declare pnpm 10 through the `packageManager` field with an exact version. Verified by S.
+- R1.3 Every dependency version shall be resolved at scaffold time from official documentation or the package registry and recorded in `package.json`. A version that cannot be confirmed shall be reported, not guessed. Verified by R (architect, security-reviewer).
+- R1.4 The recorded Electron, electron-vite, Vite, React and TypeScript versions shall be mutually compatible according to the official documentation of electron-vite and Electron for the resolved versions, and the compatibility source shall be cited in the design. Verified by R.
+- R1.5 When `pnpm install --frozen-lockfile` is run on a clean checkout with a committed `pnpm-lock.yaml`, it shall succeed on Windows, macOS and Linux, and shall fail when the lockfile is out of sync with `package.json`. Verified by C (host platform; others per R16.3).
+- R1.6 If a dependency has an install or build script, then it shall run only when allowed by name in the pnpm build-script approval setting, with the reason recorded in an ADR. `dangerouslyAllowAllBuilds` shall not be set and `strictDepBuilds` shall stay at its default (`package-script-policy.md` 4.4). Verified by R (security-reviewer, architect ADR).
+- R1.7 For each new runtime dependency, the license and purpose shall be recorded in the design, and only permissive licenses (MIT, Apache-2.0, BSD, ISC) shall be accepted without escalation to the user. Verified by R.
+- R1.8 The repository shall use pnpm only: no `package-lock.json` or `yarn.lock`, and no `npm` or `yarn` in documented commands. Verified by S.
+
+## 6. Requirements: architecture and structure
+
+**R2. User story:** As an architect, I want strict process and module boundaries, so that the untrusted renderer cannot reach privileged code.
+
+- R2.1 The project shall contain `src/main`, `src/preload`, `src/renderer` (with `app`, `features`, `stores`, `components` as needed) and `src/shared`, per `structure.md`, created only where this phase uses them. Verified by S.
+- R2.2 The path aliases `@shared/*`, `@main/*` and `@renderer/*` shall resolve identically in the TypeScript, electron-vite and Vitest configurations, and no import shall use a relative chain of three or more `../` segments. Verified by C (typecheck, test) and S.
+- R2.3 The dependency direction of `structure.md` shall be enforced automatically: a fixture or rule test shall show that each of these makes `pnpm lint` (or `pnpm test`) fail: renderer importing `src/main`; `src/shared` importing `electron`, a DOM global or a Node built-in; a feature folder importing another feature's non-public module. Verified by S.
+- R2.4 Code under `src/shared` shall import nothing from Electron, the DOM or Node-only APIs. Verified by S and `pnpm typecheck` with a shared tsconfig that excludes DOM and Node types.
+- R2.5 TypeScript shall run with `strict: true` in every tsconfig. `any` shall be rejected by lint unless an adjacent comment justifies it. Files shall be kebab-case, exports named (default exports only where a tool requires them). Verified by S.
+- R2.6 Pure logic (origin check, CSP builder, payload parsing, platform lifecycle policy) shall be in modules with no React, Electron or DOM imports so it can be unit and property tested. Verified by S and U.
+
+## 7. Requirements: Electron security
+
+**R3. User story:** As a user, I want the window hardened by default, so that a compromised renderer cannot reach my system.
+
+- R3.1 The system shall create every `BrowserWindow` through one factory function, and no other call site shall construct a `BrowserWindow`. Verified by S.
+- R3.2 The factory shall set `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` and `webviewTag: false`, and shall not allow insecure content. Verified by U (factory output) and E (read the live window's web preferences from the main process).
+- R3.3 These settings shall be identical in dev, test and production. No flag, environment variable or argument shall weaken them. Verified by U and S (no `--no-sandbox`, `--disable-web-security`, `--remote-debugging-port` in any script, config or source file).
+- R3.4 The preload script path shall be a fixed constant, never derived from input. Verified by S.
+- R3.5 The window shall load only the application's own renderer bundle. In dev only, the dev-server origin shall also be accepted. Where the build is production, no dev origin shall be present in any allow-list. Verified by U and E.
+- R3.6 The renderer shall have no access to `require`, `process`, `Buffer`, `ipcRenderer` or Node modules. Verified by E (evaluate `typeof` in the page for each name; expected `undefined`).
+
+**R4. User story:** As a security reviewer, I want a narrow typed IPC bridge, so that the renderer can only call named, validated operations.
+
+- R4.1 Every IPC channel name shall be a constant in `src/shared/ipc/channels.ts` in the form `domain:action`. No string literal channel name shall appear elsewhere in `src`. Verified by S.
+- R4.2 Every channel shall have a request schema and a response schema in `src/shared/ipc/`, named `fooSchema` with inferred type `Foo`. Verified by S and R (architect contract review per `shared-ownership-policy.md` 3.1).
+- R4.3 When a handler receives a payload, the receiving process shall parse it with the schema before use. If parsing fails, then the handler shall return a typed error result (a code and a short message) and shall not throw across the IPC boundary. The error shall contain no filesystem path, stack trace or payload content. Verified by U and P (arbitrary input never throws, and every non-conforming input yields the error result).
+- R4.4 When a privileged handler is invoked, it shall validate the sender (`event.senderFrame` origin or URL) against the trusted origins and reject any other sender. Verified by U (wrong sender, missing frame, sub-frame) and P (arbitrary origin strings never accepted unless exactly trusted).
+- R4.5 All handlers shall be registered through one helper that applies sender validation and schema parsing, so a handler cannot omit them. Verified by S and R.
+- R4.6 The preload shall expose one namespaced object through `contextBridge` containing named functions. It shall not expose `ipcRenderer`, a generic `invoke`, `send`, `on` or any function accepting an arbitrary channel name. Verified by E (the exposed key set equals an allow-list in the test) and U.
+- R4.7 This phase shall define exactly one channel, `app:get-info`, returning the application name, version string and a platform value limited to `win32`, `darwin`, `linux`. No file, token, navigation or `shell.openExternal` channel shall exist. Verified by S and E.
+- R4.8 If the renderer invokes a channel that is not registered, then no handler shall execute and the call shall reject without privileged effect. Verified by E.
+- R4.9 The renderer shall reach the bridge through one adapter module so components and stores can be tested with a fake. Verified by S and U.
+
+**R5. User story:** As a security reviewer, I want a strict Content Security Policy, so that injected content cannot run scripts or call out.
+
+- R5.1 The system shall deliver a CSP from the main process (response header or protocol response) for every renderer document load, in addition to any `<meta>` tag. Verified by E.
+- R5.2 The production policy shall include `default-src`, `script-src 'self'`, `object-src 'none'`, `base-uri` and `frame-ancestors` restricted to none or self, `form-action` restricted, and a `connect-src` that permits no remote host. Verified by U (policy builder output) and E (effective policy).
+- R5.3 The production policy shall contain no `unsafe-eval`, no `unsafe-inline` in `script-src`, and no `http:`, `https:`, `ws:`, `wss:` or wildcard source in any directive. Verified by P (for every builder option combination marked production) and E.
+- R5.4 The `style-src` value shall follow decision D3. If D3 does not approve `unsafe-inline`, then no inline `style` attribute or inline `<style>` element shall be needed by the UI. Verified by E and S.
+- R5.5 Where the run is dev, the policy may add the dev-server HTTP origin and its WebSocket origin only. The production build output shall contain neither. Verified by U and E on the built app.
+- R5.6 When the app starts offline, the renderer shall issue no request to any origin other than the app origin. Verified by E (record all requests during launch and first render).
+- R5.7 When a test injects an inline script and a remote `fetch`, both shall be blocked by the policy. Verified by E.
+
+**R6. User story:** As a user, I want the app to refuse unexpected navigation, new windows and permissions.
+
+- R6.1 When any navigation to a URL outside the app origin is attempted (`https:`, `http:`, `file:`, `data:`, `javascript:`), the main process shall prevent it. Verified by E for each scheme.
+- R6.2 When `window.open` or a new-window request occurs, the system shall deny it. No external opener exists in this phase. Verified by E.
+- R6.3 When a `<webview>` attach is attempted, the system shall block it. Verified by U.
+- R6.4 The permission request handler and the permission check handler shall deny every permission. Verified by U and E.
+- R6.5 The code shall not call `shell.openExternal` in this phase. If external opening is added later, then it shall go only through an allow-listed `https:` wrapper (`electron-security` skill, procedure 5). Verified by S.
+- R6.6 The code shall not enable the remote module, `nodeIntegrationInWorker`, `allowRunningInsecureContent` or experimental web features. Verified by S.
+
+## 8. Requirements: application lifecycle and cross-platform behavior
+
+**R7. User story:** As a user on any OS, I want standard app behavior for launching, closing and relaunching.
+
+- R7.1 When the app is ready, the system shall create exactly one main window, show it after its first paint, and set its title to `NecroAmp`. Verified by E (one window, visible, title matches) and U (factory call count).
+- R7.2 When a second instance is launched, the second process shall exit and the first window shall be restored and focused (single-instance lock). Verified by E. This is assumption D11 pending confirmation.
+- R7.3 When all windows are closed on `win32` or `linux`, the app shall quit. On `darwin` it shall stay running, and when it is activated with no window open it shall create the main window. The decision shall be a pure function of the platform string. Verified by U (all three platform values) and P (any other string selects quit) and E on the host platform.
+- R7.4 If the main window's renderer process terminates unexpectedly, then the main process shall log the reason without any user data and shall either reload the window once or close it, never leave an invisible running app. Verified by U (mocked event).
+- R7.5 If an uncaught exception or unhandled rejection occurs in the main process, then it shall be logged locally. The system shall not start the crash reporter or send data anywhere. Verified by S and U.
+- R7.6 When the user quits through the OS, the main process shall remove its handlers and exit within 5 seconds of the last window closing. Verified by E.
+- R7.7 The app name shall be set to `NecroAmp`, which determines the user-data directory. Verified by E.
+
+**R16. User story:** As a maintainer, I want parity across Windows, macOS and Linux, so that no platform is broken silently.
+
+- R16.1 Platform-dependent branches shall be isolated in small pure functions with unit tests covering `win32`, `darwin` and `linux`. Verified by U.
+- R16.2 Path handling shall use platform path APIs, with no hard-coded separators or drive letters. Verified by S.
+- R16.3 The final report shall state, per platform and per verification kind (install, build, test, e2e), one of PASSED, FAILED, or NOT VERIFIED with reason. NOT VERIFIED is acceptable only for platforms not available to the executor. Verified by R.
+- R16.4 No script, config or documented command shall use POSIX-only syntax (`export`, `&&` chains that break in PowerShell 5, `VAR=value cmd`, `rm`). Commands shall work in PowerShell, bash and zsh. Verified by S and C on the host.
+- R16.5 The app shall run with `sandbox: true` on Linux. Documentation shall describe the sandbox prerequisites for Linux development and CI, and shall not recommend `--no-sandbox`. Verified by S and R.
+- R16.6 Where the platform is macOS, the application menu shall provide the standard application, edit and window roles (quit, copy, paste, close window). Menu visibility on Windows and Linux follows decision D6. Verified by U.
+- R16.7 Line endings shall be normalized to LF in the repository so that Windows contributors do not produce CRLF diffs. Verified by S (a committed `.gitattributes` or `.editorconfig`; owner: human, see section 13).
+
+## 9. Requirements: initial window
+
+**R8. User story:** As a developer who listens to music, I want to see the NecroAmp window with its main areas, so that I understand the layout future features will fill.
+
+- R8.1 The window shall show the text `NecroAmp` as a visible heading (the page's single `h1`) and the document title `NecroAmp`. Verified by E.
+- R8.2 The window shall show the tagline exactly `Code. Listen. Repeat.` Verified by E (exact text match).
+- R8.3 The window shall contain these six regions, each a landmark or labelled group with a stable `data-testid` and an accessible name: player controls (`player`), playlist (`playlist`), equalizer (`equalizer`), visualization (`visualization`), skin selection (`skin-selector`), GitHub integration (`github`). Verified by E.
+- R8.4 The player region shall contain placeholder buttons Previous, Play, Pause, Stop and Next, each with a visible or accessible text name. When activated, a placeholder shall change nothing but may show a short "Not implemented in this phase" status. It shall create no `AudioContext`, call no IPC and make no network request. Verified by E and S (no `AudioContext` in the source).
+- R8.5 The playlist region shall contain a heading, an empty-state message and a list element for future items. Verified by E.
+- R8.6 The equalizer region shall contain ten inert band placeholders labelled "Band 1" to "Band 10". No frequency value, gain mapping or filter shall be defined here. Verified by E.
+- R8.7 The visualization region shall contain a static placeholder with no `AnalyserNode`, canvas animation loop or `requestAnimationFrame` call. Verified by E and S.
+- R8.8 The skin selection region shall contain a labelled placeholder control showing a single non-functional "Foundation default" entry. It shall load no skin, read no skin file and name no third-party skin. Verified by E and S.
+- R8.9 The GitHub region shall state that the integration is optional and not signed in, and may contain an inert "Sign in" placeholder button. It shall make no network call and use no token. Verified by E and S.
+- R8.10 When the renderer starts, it shall call `app:get-info` through the bridge and display the version and platform. If the call fails, then it shall display "unavailable" in that spot and the rest of the UI shall still render. Verified by E and U (store with fake bridge).
+- R8.11 The layout shall show all six regions without overlap or horizontal scrolling at a window size of 800 by 600 and at 1920 by 1080. Verified by E (bounding boxes) at both sizes. The minimum window size shall be set to the 800 by 600 value or smaller.
+- R8.12 The UI shall bundle no image, font or sound file. If any asset is added, then it shall be recorded in `docs/assets.md` with author, source and license first. Verified by S and R.
+- R8.13 Colors, spacing and type sizes shall be defined as CSS custom properties, so that the later skin engine can replace them. The visual design is explicitly provisional. Verified by S.
+- R8.14 The UI shall be fully rendered with no network access. Verified by E (same run as R5.6).
+
+**R9. User story:** As a keyboard or screen-reader user, I want the foundation UI to be operable, so that accessibility is built in from the start.
+
+- R9.1 The document shall set `lang="en"` and contain exactly one `h1`. Verified by E.
+- R9.2 Every interactive element shall have an accessible name and be reachable by Tab in reading order, with no keyboard trap. Verified by E (Tab through all controls and check focus order).
+- R9.3 Each focused element shall show a visible focus indicator with at least 3:1 contrast against its surroundings. Verified by U (token pair contrast function) and E (focus style present).
+- R9.4 Body and label text in the default theme shall have at least 4.5:1 contrast against its background. Verified by P (contrast function over the theme tokens) and U.
+- R9.5 Placeholder controls that do nothing shall expose that state to assistive technology (for example `aria-disabled` and a description), not rely on color alone. Verified by E.
+- R9.6 Where an automated accessibility scanner is approved (D8), the initial window shall have zero serious or critical violations. Verified by E.
+- R9.7 The UI shall contain no animation or auto-updating content in this phase. Verified by S.
+
+**R10. User story:** As a frontend developer, I want a state layer in place, so that later features share one pattern.
+
+- R10.1 The renderer shall contain at least one Zustand store under `src/renderer/stores`, holding the app-info loading state (idle, loading, loaded with data, failed). Verified by U (all transitions, including failure).
+- R10.2 Stores shall not import feature internals, and no component shall access `window` bridge members directly (R4.9). Verified by S.
+- R10.3 The renderer shall hold no audio state or timing logic in this phase. Verified by S.
+
+## 10. Requirements: tooling and testing
+
+**R11. User story:** As a contributor, I want a small set of reliable commands, so that I can build, check and test the same way everywhere.
+
+- R11.1 `package.json` shall define `dev`, `build`, `typecheck`, `lint`, `test` and `test:e2e` (names from `tech.md`). A `package` script is not part of this phase (D10). Verified by S.
+- R11.2 `pnpm build` shall exit 0 on a clean install and produce the main, preload and renderer outputs under the electron-vite output directory, with no network access after install. Verified by C.
+- R11.3 `pnpm typecheck` shall check main, preload, renderer, shared and test code with strict settings, exit 0 on the clean tree, and exit non-zero on a type error. Verified by C (clean run, plus an intentional-error fixture test or documented one-off check).
+- R11.4 `pnpm test` shall run the unit and property tests once and exit, without entering watch mode regardless of terminal or `CI` variable, so that automation hooks cannot hang. It shall exit non-zero on any failure. Verified by C and S (script body uses the single-run mode).
+- R11.5 `pnpm lint` shall exit 0 on the clean tree and non-zero on a violation, covering `src`, `tests` and config files. Verified by C.
+- R11.6 `pnpm dev` shall start the app with renderer hot reload, with all R3 settings in force. It is documented but not an automated gate. Verified by C (manual or smoke) and R.
+- R11.7 `pnpm test:e2e` shall run Playwright against a fresh build of the app, and fail with a clear message if the build output is missing or stale. Verified by C.
+- R11.8 Script bodies shall follow `package-script-policy.md` section 4.4: no publish, release, tag, push, `gh`, `curl` or credential reading, no `node -e`, no `pre*`/`post*` hook unless reviewed. Every script body and hook shall be listed in the hand-off for security-reviewer review. Verified by R (security-reviewer) and S.
+- R11.9 The README (or a linked document) shall list prerequisites, the commands and the platform notes of R16.5. Verified by R. Owner: see section 13.
+
+**R12. User story:** As a maintainer, I want the unit and property test foundation in place, so that pure logic is tested from the first commit.
+
+- R12.1 Vitest shall be configured so that `*.test.ts(x)` and `*.property.test.ts` files discover and run, with a Node environment for main and shared code and a DOM environment for renderer component tests (the DOM implementation is D8). Verified by C.
+- R12.2 fast-check shall be installed and each of these pure modules shall have at least one property test: the origin check (R4.4), the CSP builder (R5.3), the IPC payload parser (R4.3), the platform lifecycle policy (R7.3) and the contrast function (R9.4). Each property shall run at least 100 cases. Verified by C.
+- R12.3 Tests shall be deterministic and offline: no real network, no real token, no dependence on wall-clock time. The fast-check seed shall be reported on failure. Verified by C (run with network disabled where the platform allows, otherwise by review) and R.
+- R12.4 Main-process modules (window factory, lifecycle, handlers) shall take Electron objects as injected parameters so that they can be tested without launching Electron. Verified by U.
+- R12.5 At least one renderer component test shall render the shell and assert R8.1 to R8.3 text and regions. Verified by C.
+- R12.6 Where a coverage provider is approved (D12), a coverage report shall be available, and pure-logic modules shall reach the threshold set there. Verified by C.
+
+**R13. User story:** As a QA engineer, I want an end-to-end Electron test foundation, so that security and lifecycle claims are tested against the real app.
+
+- R13.1 Playwright shall be configured to launch the built Electron app. Verified by C.
+- R13.2 A smoke test shall launch the app, assert one window, the title, the tagline, the six regions and the displayed platform equal to the host platform. Verified by E.
+- R13.3 Security end-to-end tests shall cover R3.2, R3.6, R4.6, R4.8, R5.1 to R5.7, R6.1, R6.2 and R6.4. Verified by E.
+- R13.4 Lifecycle tests shall cover R7.1, R7.2, R7.3 (host platform) and R7.6. Verified by E.
+- R13.5 Tests shall not use fixed sleeps, shall run against an isolated user-data directory, and shall never touch the developer's real profile. Verified by R and S.
+- R13.6 Test output directories (`test-results`, `playwright-report`) shall be git-ignored, and traces or screenshots shall be kept only on failure. Verified by S (owner: human for `.gitignore`).
+- R13.7 On Linux, the e2e run shall work under a virtual display, documented in the README. CI wiring is out of scope. Verified by R.
+- R13.8 The e2e suite shall pass with no network access. Verified by E.
+
+**R14. User story:** As a contributor, I want automatic lint and format checks, so that style and boundaries are enforced mechanically.
+
+- R14.1 A lint tool and a format tool (D2) shall be configured and committed, with rules for no explicit `any`, React hooks correctness, basic accessibility of JSX, the import restrictions of R2.3 and no default exports except where a tool needs them. Verified by C and S.
+- R14.2 A command shall check formatting without writing, and `pnpm lint` shall fail on formatting violations or a separate documented check shall be provided. Verified by C.
+- R14.3 Lint and format tools shall not access the network when run. Verified by R.
+
+## 11. Requirements: cross-cutting security and privacy
+
+**R15. User story:** As a privacy-minded developer, I want no hidden network or telemetry, and no leaked data.
+
+- R15.1 The source shall contain no telemetry, analytics, crash reporting, advertising or update-check code, and the main process shall make no network request in this phase. Verified by S (no import or call of `crashReporter`, `autoUpdater`, `electron-updater`, `net`, `fetch`, HTTP clients in `src`) and E (R5.6).
+- R15.2 The repository shall contain no secrets, tokens or personal data; `.env` files remain ignored. Verified by R (security-reviewer) and S.
+- R15.3 Log output shall not include renderer-supplied payloads, filesystem paths or tokens. Verified by U (error mapper) and R.
+- R15.4 The renderer shall have no filesystem access. The main process shall read the filesystem in this phase only to load its own application bundle. Where D4 selects a custom protocol for the renderer, the handler shall resolve each URL against the bundle root and reject `..`, encoded separators, absolute paths, drive letters and symlinks leaving the root. Verified by U and P (arbitrary URL strings never resolve outside the root).
+- R15.5 A security-reviewer review of the IPC, window, CSP, scripts and dependency changes shall report zero open blockers before the Spec is considered done. Verified by R.
+- R15.6 Electron Fuses (RunAsNode, ASAR integrity) apply to packaged builds (`tech.md`). They are deferred to the packaging phase; this phase's code shall not depend on those settings being off. Verified by R.
+
+## 12. Requirements: documentation and record keeping
+
+**R17. User story:** As a maintainer entering Kiroween, I want decisions and Kiro usage recorded.
+
+- R17.1 Each decision in section 14 that is resolved by the human shall have an ADR in `docs/adr/` before the code that depends on it. Verified by R.
+- R17.2 The design shall cite its sources for version compatibility and Electron API names (A7). Verified by R.
+- R17.3 The hand-off shall list files this phase needs that no agent can write (section 13) and who writes them. Verified by R.
+
+## 13. Hand-off: ownership of work items
+
+Based on `preflight.md` section B. "Human" means the maintainer or the IDE main session.
+
+| Work item | Owner |
+|---|---|
+| Manifest, scripts, `.nvmrc`, tsconfig, electron-vite config | desktop-engineer |
+| `src/main`, `src/preload`, `src/shared/ipc` and their co-located unit tests | desktop-engineer |
+| Renderer shell, placeholder UI, stores, adapter, co-located tests | frontend-engineer |
+| `vitest.config.ts`, `playwright.config.ts`, `tests/**`, property and integration tests | qa-engineer |
+| ESLint and Prettier or Biome config, `.editorconfig`, `.gitattributes`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions, README command section | Human (no agent can write them; or a scoped permission change per `shared-ownership-policy.md`, user approval needed) |
+| Installs and `pnpm-lock.yaml` | Human (all agents are `ask`) |
+| Unassigned `src/shared/**` (if any shared pure util is needed) | Architect designs, human implements |
+| ADRs, design, architecture review, quality gate | necro-architect |
+| Script, dependency, IPC, CSP review | security-reviewer |
+| Spec files and task status in `.kiro/specs/**` | Human or IDE session |
+
+## 14. Unresolved technical decisions (needs human decision)
+
+None is resolved here. "Architect leaning" is a recommendation only, and the design will not rely on it until you confirm.
+
+| ID | Decision (structure.md ref) | Options | Trade-offs | Architect leaning |
+|---|---|---|---|---|
+| D1 | Repository layout (#1) | (a) single package; (b) pnpm workspace monorepo | (a) simplest, matches `structure.md` target, fewer config files, easy to split later. (b) clean package boundaries enforced by the package manager, but more config, slower scaffold, three process builds across packages. | (a) |
+| D2 | Lint and format tool (#9) | (a) ESLint + Prettier; (b) Biome | (a) mature plugins for React hooks, JSX accessibility and import-boundary rules (needed for R2.3, R14.1), more dependencies and config. (b) one tool, faster, but fewer rule plugins; boundary and a11y rules may need custom work. | (a) |
+| D3 | Styling approach (#8) and CSP `style-src` | (a) CSS Modules + CSS custom properties; (b) plain global CSS + custom properties; (c) runtime CSS-in-JS | (a) scoped, no runtime, works with `style-src 'self'`. (b) simplest, collisions at scale. (c) usually needs `unsafe-inline`, which weakens R5. React inline `style` attributes also need `style-src-attr`, so dynamic values should be set through CSS variables via the CSSOM. | (a) |
+| D4 | Production renderer origin | (a) `file://` URL; (b) custom privileged-minimal protocol (for example `app://`); (c) local HTTP server | (a) simplest, but origin is opaque, sender validation and CSP are weaker. (b) stable origin for sender checks and CSP, needs a path-confining handler (R15.4) and scheme registration before ready. (c) opens a network port, rejected by product principles. Backlog A7 notes scheme flags are not yet documented. | (b) |
+| D5 | Window chrome and multi-window (#16) | (a) native frame, single window; (b) frameless custom chrome, single window; (c) multi-window (main, equalizer, playlist) | (a) cheapest, accessible and parity-safe, reversible. (b) needs drag regions, resize and window controls on three OSes. (c) matches Winamp but multiplies windows and the security surface. R3.1 requires a factory in all cases. | (a) for this phase |
+| D6 | Application menu on Windows and Linux | (a) hide the menu bar; (b) minimal default menu; (c) full custom menu | Affects keyboard shortcuts such as copy and paste and platform parity. macOS needs a role menu regardless (R16.6). | (b) |
+| D7 | Linux targets (#12), auto-update (#10), signing (#11) | Deferred to the packaging phase | This phase produces no installer. Listed to confirm they are intentionally out. | Defer |
+| D8 | Renderer test environment and tools | DOM: jsdom or happy-dom; Testing Library; axe-based scanner (`@axe-core/playwright` or similar) | Each adds a dev dependency needing an ADR or architect note and security review (`package-script-policy.md` 4.2). Skipping the scanner leaves R9.6 inactive. | jsdom + Testing Library + scanner, subject to license check |
+| D9 | Dependency build-script approvals | Which packages may run install scripts (Electron's binary download is the expected one) and the setting name for the pinned pnpm | Policy requires a named allow-list and an ADR. Files `.npmrc` or `pnpm-workspace.yaml` have no agent writer. | Allow Electron only, by name |
+| D10 | `package` script and Electron Fuses | (a) include a `package` script now; (b) defer to the packaging phase | (a) adds electron-builder and its publish risk to this phase. (b) keeps scope to the listed commands. | (b) |
+| D11 | Single-instance lock (R7.2) | (a) enforce; (b) allow multiple instances | (a) avoids two processes sharing one user-data directory. (b) is simpler but risks data corruption later. | (a) |
+| D12 | Coverage provider and threshold (R12.6) | None; or v8 coverage with a threshold (for example 80 percent lines on pure logic) | A threshold gives a measurable gate but needs a dev dependency. | v8 coverage, threshold to be set by you |
+| D13 | Who writes the files no agent can write (section 13) | (a) human writes them; (b) widen one agent's `fs_write` with security review | (a) no permission change. (b) faster, widens permissions (`shared-ownership-policy.md` option 2). | (a) |
+| D14 | Internationalization (#17) | English only, assumed | Assumed in A3. Confirm. | Confirm |
+
+Decisions not touched by this phase and left open in `structure.md`: #2, #3 (decided by ADR 0001, not exercised), #4, #5, #6, #7, #10 to #15 except as listed above.
+
+## 15. Non-goals
+
+- Audio engine: no `AudioContext`, decoding, equalizer filters, `AnalyserNode` or visualizer rendering.
+- Skin engine: no manifest schema, loader, skin assets or skin switching.
+- GitHub integration: no Octokit, authentication, token storage, explorer, Actions monitor or notifications.
+- Library scanning, metadata, playlists logic, file dialogs, media protocol.
+- Packaging, installers, signing, Electron Fuses, auto-update, release workflow, CI workflows.
+- Final visual design, bundled artwork, fonts or sounds, localization, multi-window layout.
+- Any telemetry, analytics, crash reporting, cloud service or AWS resource.
+- Changes to steering, agents, skills, workflows or hooks.
+
+## 16. Traceability summary
+
+| Topic | Requirements | Primary verification |
+|---|---|---|
+| Toolchain, installs | R1, R11 | C, S |
+| Structure and direction | R2, R10 | S, U |
+| Window and bridge security | R3, R4, R5, R6, R15 | U, P, E, R |
+| Lifecycle, platforms | R7, R16 | U, P, E |
+| Initial window | R8, R9 | E, U |
+| Tests and lint | R11, R12, R13, R14 | C |
+| Records | R17 | R |
+
+## 17. Approval
+
+Please confirm: (1) the requirements as written; (2) a decision or an explicit "leave to design with the architect leaning" for D1 to D6, D8 to D14 (D7 is deferral); (3) how the files in section 13 will be written. Design starts after this approval.
diff --git a/.kiro/specs/desktop-foundation/tasks.md b/.kiro/specs/desktop-foundation/tasks.md
new file mode 100644
index 0000000..678c751
--- /dev/null
+++ b/.kiro/specs/desktop-foundation/tasks.md
@@ -0,0 +1,507 @@
+# Tasks: desktop-foundation (Phase 05)
+
+Status: APPROVE WITH FIXES applied (design E5 to E8). Gate H0 passed (design section 16). **M2: IMPLEMENTED - INTEGRATION PENDING. M3: IMPLEMENTED - INTEGRATION PENDING** (implementation acceptance, not whole-application runtime acceptance; T2.6, T2.7, T3.2 and T3.3 stay open until T4.2 and T7.x). M4 and M5 not started. Checkboxes are ticked only with recorded evidence, by Orch or the human. Inputs: `requirements.md` (R1 to R17), `preflight.md`, `design.md` (approved with fixes, E5 to E8; amended: N4 exception E1, lifecycle policy 9.3, validation tasks V1 to V11 in section 15, host gate H0 in section 16, Appendix A), steering, the nine agents in `.kiro/agents/`, and the three workflows in `.kiro/workflows/`.
+
+## How to read this file
+
+- **Orch** is the authorized top-level orchestrator (D13). It writes native Spec files, cross-cutting config files that no agent may write, and runs commands that agents cannot (`pnpm install`, `pnpm format*`, `pnpm licenses`, `pnpm exec`). Orch widens no agent permission. Only Orch or the human ticks boxes in this file (W2 in `preflight.md`).
+- **Human** installs host tools, approves gates, runs interactive commands (`pnpm dev`), and decides on any commit. Nothing in this plan commits, pushes or opens a pull request.
+- Agents listed as responsible are the **writers** or **reviewers** named in `design.md` section 11. Their write scopes were read from `.kiro/agents/*.md`:
+
+| Agent | May write | Shell allowed without asking | Notable limits |
+|---|---|---|---|
+| desktop-engineer | `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `package.json`, `tsconfig*.json`, `electron.vite.config.ts`, `.nvmrc` | `pnpm typecheck*`, `lint*`, `test*`, `build*`, `dev*` | No `.npmrc`, `.gitignore`, `.kiro/**`, `*.property.test.ts`. `pnpm install*` asks. |
+| frontend-engineer | `src/renderer/app|features|stores|components/**`, `src/renderer/*.{html,css,ts,tsx}` | `pnpm typecheck*`, `lint*`, `test*` | No `pnpm build`, no `src/main`, no property tests. |
+| qa-engineer | `tests/**`, `**/*.property.test.ts`, `**/*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts`, `docs/testing/**` | `pnpm typecheck*`, `lint*`, `test*`, `test:e2e*`, `build*` | Never patches non-test source; reports defects to the owner. |
+| security-reviewer | `docs/security/**` only | none (no shell) | Read-only on production source. Cannot read `.npmrc`. |
+| necro-architect | `docs/adr/**`, `docs/architecture/**`, `docs/requirements/**` | none | No `.kiro/**`. |
+| release-engineer | `.github/workflows/**`, `electron-builder.yml`, `resources/**`, `docs/release/**`, `CHANGELOG.md` | `pnpm build*`, `pnpm package*`, read-only `git status/diff/log/describe` | No `src/**`. Packaging is out of scope here (D10). |
+| art-director | `skins/**`, `resources/icons/**`, `docs/design/**`, `docs/assets.md` | none | No code, no assets are produced in this phase. |
+| audio-engineer | `src/renderer/audio/**`, `src/shared/audio/**`, `docs/audio/**` | `pnpm typecheck*`, `lint*`, `test*` | Not used: this phase has no audio (R8.4, R8.7). |
+
+- **Workflows.** Only `quality-review.workflow.json` is used (M8), because it gives three independent reviews and a verdict. `feature-development` is not used: `preflight.md` W1, W3, W5 and W7 found it unfit for a multi-domain phase. `release-validation` is not used: it validates packaging (`pnpm package`, `electron-builder.yml`), which D10 defers. Small tasks run as direct single-agent sessions. Hooks stay disabled (`preflight.md` C, R-g in the design).
+- **Platform.** Windows x64 with PowerShell 7 is the only runtime validation target. macOS and Linux are designed for (pure platform branches, `.gitattributes`, no POSIX-only commands) and reported **NOT VERIFIED** until run on those hosts. No milestone claims otherwise. In PowerShell 7 on this host, run `npm.cmd` and `pnpm.cmd` wherever commands below say `npm` or `pnpm` (design E6). Never change the execution policy, never disable TLS validation, and never add proxy, certificate or machine-specific environment configuration to the repository.
+- **Failure rule.** A failing validation command is never retried unchanged. The runner stops, records command, exit code and first error lines, and applies the smallest-adjustment procedure in `design.md` section 15.
+- **Run labels.** Fixed kebab-case labels such as `desktop-foundation-1` (W6).
+
+## Milestone map
+
+```
+M0 host + deps ──► M1 scaffold ──► M2 main ──┬──► M3 contracts + preload ──┐
+                                             │                              ├─► M6 tests ──► M7 smoke + build ──► M8 review
+                                             └─► (T3.1 first) M4 renderer ──► M5 styling ┘
+```
+
+| Milestone | Primary agent | Can overlap with |
+|---|---|---|
+| M0 | Orch with human (necro-architect, desktop-engineer, security-reviewer for sub-tasks) | none (blocking) |
+| M1 | desktop-engineer, qa-engineer, Orch | none inside M1 except its three writer groups |
+| M2 | desktop-engineer | M3.1, M4 after T3.1 |
+| M3 | desktop-engineer | M2, M4 |
+| M4 | frontend-engineer | M2, M3 (needs T3.1 schemas for the adapter) |
+| M5 | frontend-engineer (art-director optional review) | M4 (token files first) |
+| M6 | qa-engineer | M4 and M5 tail, once code exists |
+| M7 | qa-engineer, release-engineer, Orch, human | none |
+| M8 | security-reviewer, necro-architect, Orch | none |
+
+---
+
+## Task-level dependencies and status rules (design E7)
+
+- **Implementation complete** means the task's files exist, their unit tests pass, and typecheck, lint and test pass for the touched projects. **Integration validated** means every cross-milestone consumer exists and the combined command (for example `pnpm build`) has run.
+- A milestone is PASSED only when its own tasks and all cross-milestone integration tasks it owns or depends on are complete. Otherwise it is recorded "IMPLEMENTED, integration pending: T..". A command that cannot yet run is recorded "DEFERRED to T..". No fake entry point, stub or empty CSS file is created to satisfy an intermediate command.
+
+| Task | Requires | Reason |
+|---|---|---|
+| T3.2 | T2.2, T3.1 | Handlers need sender validation from T2.2 |
+| T2.6 | T2.1 to T2.5, T3.2 | Composition root registers T3.2's IPC handlers |
+| T2.7 | T1.2 | Config plugin only |
+| T3.3 | T3.1 | Preload uses `IPC_CHANNELS` only |
+| T4.2 | T3.1 | Adapter parses the shared response schema |
+| T5.2 | T4.1 | `main.tsx` imports `global.css` once it exists |
+| T5.3 | T4.5 | View files import their CSS Modules once they exist |
+| T7.0 | T2.6, T2.7, T3.3, T4.6, T5.2, T5.3 | Whole-application build needs main, preload and renderer entries and all imported CSS |
+| T7.1 to T7.7 | T7.0 | E2E runs against the built app |
+## M0 Host environment and dependency bootstrap
+
+**Responsible agent.** Orch with the human operator for host and install steps. Sub-tasks: necro-architect (ADRs and dependency notes), desktop-engineer (`package.json`, `.nvmrc`), security-reviewer (review).
+
+**Agent Skills.** `cross-platform-packaging` (lockfile, pnpm, reproducible installs, license inventory), `electron-security` (dependency and script review), `typescript-standards`. necro-architect also carries `testing-strategy`.
+
+**Dependencies.** None. M0 blocks everything else. Only T0.2 to T0.5 documentation work needs no host tools and may start before H0 passes. H0 has passed. `pnpm.cmd install` waits for T0.2, T0.6 and the section 14 approvals.
+
+**Tasks.**
+
+- [x] **T0.1 Gate H0 (host). H0 PASSED; do not reinstall.** Host record in `design.md` section 16 and A.0: PowerShell 7.6.10; Node v24.22.3 x64 win32; npm.cmd 11.19.1; pnpm.cmd 10.34.9; git 2.56.1.windows.1; `npm.cmd ping` OK; `pnpm.cmd view pnpm@10.34.9 version` OK; no TLS errors. Orch records the outputs (V1) and ticks this box. Host Node and Electron-embedded Node are recorded as separate facts; the embedded value is filled in at T0.8.
+- [x] **T0.2 Registry re-check.** **DONE.** Evidence: `docs/security/m0-dependency-validation.md` (32 exact-version `npm.cmd view` lookups, exit 0) and `docs/security/m0-resolution-report.md`. One difference, D1 (eslint 9.39.5 deprecated), stopped the task and was resolved by the human (accepted temporarily). Orch runs the read-only registry loop from `design.md` section 14 with each exact version from 9.1 (`/<version>` instead of `/latest`). Any difference in version, license, engines, peers or scripts stops the milestone and goes to the human.
+- [x] **T0.3 ADRs and dependency note.** **Status: DONE.** ADRs 0002 to 0005 are written in `docs/adr/` (0002 also records exception E-ESM-1). `docs/architecture/dependency-versions.md` now exists (31 top-level packages, toolchain, licenses, exceptions, V1/V2/V3/V11 status). necro-architect writes ADR 0002 (single package, ESLint plus Prettier, test stack, coverage), ADR 0003 (`app://` scheme, privileges, CSP, `corsEnabled` fallback), ADR 0004 (dependency lifecycle policy, esbuild and electron approvals in principle, fsevents denied, N4 exception E1), ADR 0005 (IPC security model, window chrome, lifecycle, menu, single instance), and `docs/architecture/dependency-versions.md` (candidate table, V1 to V11 status, N4 inventory entry with license notice handling).
+- [x] **T0.4 Policy and ignore files.** **DONE (2026-11-26).** `.npmrc` approved by the human and written (exactly `engine-strict=true` plus newline, 19 bytes, not ignored by `.gitignore`). `pnpm-workspace.yaml` exists with the approved policy. `.gitignore` verified for all six generated paths and `.kiro/` is not ignored and is tracked (`docs/security/m0-closure-validation.md` section 2; re-checked with `git check-ignore -v`). Orch writes `.npmrc` (`engine-strict=true` only), `pnpm-workspace.yaml` (`strictDepBuilds: true`, an explicitly approved deviation from the original R1.6 default (design E5) that keeps deny-by-default lifecycle execution; `ignoredBuiltDependencies: [fsevents]`; no `esbuild` entry yet), and the `.gitignore` additions (`node_modules`, `out`, `coverage`, `test-results`, `playwright-report`, `node_modules/.cache`). `.kiro` is never added to `.gitignore`.
+- [x] **T0.5 Dependency manifest.** desktop-engineer writes `package.json` (`private`, `engines.node >=24.15.0 <25`, `packageManager pnpm@10.34.9`, exact pins from 9.1 with N4 packages in `devDependencies`, the scripts table from design 9.5, no `pre*`/`post*`/`prepare`) and `.nvmrc` (`24`). No install.
+- [x] **T0.6 Security review of the install surface.** **Status: DONE (2026-11-26).** The human accepted `docs/security/m0-security-review.md` as the canonical T0.6 deliverable (no duplicate report). The review ends with a factual addendum quoting the root `.npmrc` (exactly `engine-strict=true`). The remainder of this entry is the original task text. Original status: partial. Existing evidence: `docs/security/m0-security-review.md` (PASS WITH CONDITIONS; manifest, `pnpm-workspace.yaml`, lifecycle policy), `m0-resolution-report.md` (472 lockfile entries checked for scripts), `m0-post-install-validation.md`. Missing against the task text: the review did not cover the `.npmrc` text (the file did not exist then; it now holds one line) and the output file is not the named `desktop-foundation-m0-install-review.md`. Closing needs either a short security-reviewer addendum quoting the `.npmrc` line, or a human decision to accept the existing review as the T0.6 output. security-reviewer reads `package.json`, `pnpm-workspace.yaml`, script bodies and the dependency list, plus the `.npmrc` text that Orch quotes in the request (the agent cannot read `.npmrc`, N10). Output (actual, human-accepted): `docs/security/m0-security-review.md`. The earlier planned name `docs/security/desktop-foundation-m0-install-review.md` is not used.
+- [x] **T0.7 Install under strict builds.** Evidence: `docs/security/m0-post-install-validation.md`. The operator ran a single `pnpm.cmd install --frozen-lockfile` (exit 0) with the `esbuild@0.28.2` entry already present (reviewed in M0 resolution), so the expected first failing run did not occur; lockfile hash unchanged. After human approval of the section 14 gate, Orch runs `pnpm install`. With `strictDepBuilds: true` the first run is expected to fail on `esbuild`. That output is the V2 evidence. Orch verifies the esbuild script body and the resolved version, adds the version-qualified `esbuild@<version>` entry to `onlyBuiltDependencies`, and reruns `pnpm install` once. Then `pnpm install --frozen-lockfile` once (R1.5). Any other unreviewed script stops the milestone.
+- [x] **T0.8 Validation V1, V2, V3, V11.** **Status: DONE.** V3 (Electron 45.5.0, embedded Node 24.22.3, x64 win32), V2 (installed-tree scan, one script-bearing package) and V11 (licenses) have evidence in `docs/security/m0-closure-validation.md` and `m0-post-install-validation.md`. The record is in `docs/architecture/dependency-versions.md` (Electron v45.5.0, embedded Node 24.22.3 x64 win32, measured). Orch runs: lockfile `requiresBuild` listing (V2), Electron on-demand binary download with human approval of the network call (V3), `pnpm licenses list --prod --json` and `--dev --json` (V11), and Appendix A.7 for the embedded Node value. necro-architect records results in `docs/architecture/dependency-versions.md`.
+
+**Expected deliverables.** Verified host (H0 record), ADRs 0002 to 0005, `docs/architecture/dependency-versions.md`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions, `package.json`, `.nvmrc`, `pnpm-lock.yaml`, `docs/security/desktop-foundation-m0-install-review.md`, run notes with install outcome (scripts that ran).
+
+**Requirements traceability.** R1 (toolchain, pins, lockfile, build-script allowlist, licenses including R1.7 with exception E1), R11.8 (script review), R15 (supply chain), R17 (ADRs precede dependent code, cited sources).
+
+**Acceptance criteria.**
+1. H0 checklist (design 16) passes on Windows x64 with PowerShell 7, with no execution-policy bypass.
+2. `pnpm install --frozen-lockfile` exits 0 and the lockfile is committed-ready and unchanged by the second run.
+3. Only `esbuild` (version-qualified) ran a dependency script; `fsevents` did not; no `dangerouslyAllowAllBuilds` anywhere.
+4. `pnpm exec electron --version` prints `v45.5.0`; the embedded Node major is 24; both Node values are recorded separately.
+5. Production dependency graph is permissive-only; the development graph's only non-permissive packages are `axe-core` and `@axe-core/playwright` (E1).
+6. V1, V2, V3, V11 recorded PASSED, or each failure has a smallest-adjustment proposal approved by the human.
+7. security-reviewer report has zero open blockers.
+
+**Validation commands (PowerShell 7).**
+
+```powershell
+node --version; node -p "process.arch + ' ' + process.platform"; pnpm --version
+pnpm install --frozen-lockfile
+Select-String -Path pnpm-lock.yaml -Pattern 'requiresBuild: true' -Context 3,0
+pnpm exec electron --version
+pnpm licenses list --prod --json
+pnpm licenses list --dev --json
+```
+
+**Parallelism.** Sequential gate: T0.1 then T0.2. After T0.2, T0.3, T0.4 and T0.5 run in parallel (different writers and files). T0.6 needs T0.4 and T0.5. T0.7 and T0.8 are sequential after T0.6 and the human approval.
+
+---
+
+## M1 Repository scaffold and development toolchain
+
+**Responsible agent.** desktop-engineer (TypeScript and build config), qa-engineer (test config), Orch (lint, format and cross-cutting files). Orch integrates.
+
+**Agent Skills.** `typescript-standards`, `electron-security`, `cross-platform-packaging` (desktop-engineer); `testing-strategy` (qa-engineer).
+
+**Dependencies.** M0 complete (installed `node_modules`, lockfile, ADR 0002).
+
+**Tasks.**
+
+- [x] **T1.1 TypeScript projects.** desktop-engineer writes `tsconfig.json` (solution with references) and `tsconfig.shared.json`, `.main.json`, `.preload.json`, `.renderer.json`, `.tests.json`: `strict: true`, `composite`, `emitDeclarationOnly`, output under `node_modules/.cache/tsc`, path aliases `@shared/*`, `@main/*`, `@renderer/*`; `tsconfig.shared.json` with `lib: ["ES2023"]` and `types: []` (R2.4).
+- [x] **T1.2 electron-vite config.** desktop-engineer writes `electron.vite.config.ts` with main, preload and renderer targets, `resolve.alias` for the three aliases per target, the React plugin, CommonJS preload output, and the output layout in design 3.1. The meta-CSP plugin is added in T2.7.
+- [x] **T1.3 Seed files.** desktop-engineer writes `src/main/constants.ts` and `src/shared/ipc/channels.ts` so project references have inputs. Projects without inputs yet (`renderer`, `tests`) are made green by their first files in M4 and M6; until then `tsc -b` may report TS18003 for them and this is recorded, not hidden.
+- [x] **T1.4 Vitest config.** qa-engineer writes `vitest.config.ts` (node and jsdom projects, shared alias table, `globals: false`, setup file registering jest-dom and `cleanup`, network-stub setup, coverage block from design 10) and `tests/config/alias-consistency.test.ts` (R2.2).
+- [x] **T1.5 Lint, format, repository hygiene.** Orch writes `eslint.config.mjs` (flat config, `typescript-eslint`, `react`, `react-hooks`, `jsx-a11y`, boundary `no-restricted-imports` blocks per design 1, `no-restricted-syntax` and globals for R3.1, R4.1, R6.5, R8.4, R8.7, R15.1), `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes` (LF normalization). Orch runs `pnpm format` once to normalize files it wrote.
+- [x] **T1.6 README command section.** Orch adds the command table and platform status (Windows x64 validated, macOS and Linux not verified) to `README.md`.
+- [x] **T1.7 Validation V7 (lint load) and V8 (test smoke).**
+
+**Expected deliverables.** `tsconfig*.json`, `electron.vite.config.ts`, seeds, `vitest.config.ts`, `tests/config/alias-consistency.test.ts`, `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes`, README section.
+
+**Requirements traceability.** R1.5 (scripts run), R2 (structure, aliases, strict TS, boundaries), R11 (commands), R12 (test setup), R14 (lint and format), R16 (line endings, no POSIX-only commands).
+
+**Acceptance criteria.**
+1. `pnpm lint` exits 0 and loads every plugin under ESLint 9.39.5 (V7).
+2. `pnpm format:check` exits 0.
+3. `pnpm test` runs both Vitest projects and the alias-consistency test passes (V8 smoke); `--passWithNoTests` is used only for this milestone's first run, never in the script.
+4. The three alias tables are identical (R2.2).
+5. `pnpm typecheck` passes for `shared` and `main`; any renderer or tests TS18003 is documented as expected until M4 and M6.
+
+**Validation commands.**
+
+```powershell
+pnpm lint
+pnpm format:check
+pnpm test
+pnpm typecheck
+```
+
+**Parallelism.** T1.1 to T1.3 (desktop-engineer), T1.4 (qa-engineer) and T1.5 to T1.6 (Orch) write disjoint files and run in parallel. T1.4's alias test needs T1.1 and T1.2 to exist before it can pass. T1.7 runs last.
+
+---
+
+## M2 Electron main process and security configuration
+
+**Responsible agent.** desktop-engineer. security-reviewer reviews at the milestone gate.
+
+**Agent Skills.** `electron-security`, `typescript-standards`, `cross-platform-packaging`.
+
+**Dependencies.** M1. T3.2 requires T2.2 (sender validation) and T3.1. T2.6 requires T2.1 to T2.5 and T3.2 (IPC registration). M2 is "IMPLEMENTED, integration pending: T3.2" until T3.2 is done, and PASSED only after T2.6 to T2.8. Electron API names marked UNVERIFIED in design sections 3 to 6 are checked against the Electron 45.5.0 documentation first (T2.0).
+
+**Tasks.**
+
+- [x] **T2.0 Electron API verification.** desktop-engineer lists each version-sensitive API in design 3 to 6 (`will-frame-navigate`, `setDevicePermissionHandler`, `registerSchemesAsPrivileged`, `protocol.handle`, `WebFrameMain` properties, `ELECTRON_RENDERER_URL`, preload output name), checks the Electron 45.5.0 docs and the electron-vite 6.0.0 output, and reports page and result in its final message. necro-architect records them in `docs/architecture/electron-api-verification.md`. This is a documented source check, not a runtime claim (R17.2). **DONE as a source and documentation check (no runtime claim).** Evidence: `docs/architecture/electron-api-verification.md` (availability, type-level, documented behavior, runtime "not exercised", deferred validation per API). Why the task text is met: every API named in the task is listed; Electron 45.5.0 typings were read; the version-pinned documentation source (tag `v45.5.0`, fetched with `web_fetch`) was read for `ipc-main-invoke-event`, `web-frame-main`, `web-contents`, `protocol` and `session`; the electron-vite 6.0.0 output names were derived from tool source and `electron.vite.config.ts`; the file is the necro-architect record the task names. Qualifiers: the rendered electronjs.org pages returned no content and were not used; `detached`, the permission check and request handlers, and the `custom-scheme` and `privileges` pages rely on typings JSDoc only; no build output exists, so the preload name is a static derivation; the desktop-engineer's own report of pages and results is not in the repository. Runtime behavior of every API is deferred to T7.x.
+- [x] **T2.1 Foundations.** `src/main/logging/logger.ts`, `lifecycle/platform-policy.ts`, `lifecycle/app-menu.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
+- [x] **T2.2 Security modules.** `security/csp.ts` (`buildCsp`, `buildMetaCsp`), `security/trusted-origins.ts`, `security/sender-validation.ts`, plus unit tests. **Acceptance criterion (human gate 3, ADR 0003 item 6):** tests prove the production CSP never contains a development-only allowance (`unsafe-inline`, dev origin, websocket origin) and cannot inherit one from the development builder; the development policy never contains `unsafe-eval` or a remote script source, and its `connect-src` is exactly the trusted dev origin and its websocket. Not started. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run. Production CSP isolation proven by csp.test.ts and csp.property.test.ts.
+- [x] **T2.3 Protocol.** `protocol/resolve-app-path.ts` (path module injected), `protocol/mime-types.ts`, `protocol/app-protocol.ts` (scheme registration, `protocol.handle`, realpath confinement, 5 MiB bound, response headers), plus unit tests. **DONE (unit and integration with temp dir).** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run. Real-symlink test skipped on this Windows host. Runtime check of app:// under the real CSP deferred to T7.0/E2E.
+- [x] **T2.4 Window.** `window/chrome-profile.ts`, `window/window-options.ts`, `window/create-main-window.ts` (the only `new BrowserWindow`), `window/navigation-guards.ts`, `window/permissions.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
+- [x] **T2.5 Lifecycle.** `lifecycle/single-instance.ts`, `lifecycle/crash-handlers.ts`, plus unit tests. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
+- [x] **T2.6 Composition root (requires T3.2).** `src/main/index.ts` with the fixed startup order (design 2), `resolveLoadTarget`, test user-data override `NECROAMP_E2E_USER_DATA`. It imports `registerHandler` and `app-handlers` from T3.2 and is not complete until they exist. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T2.7 Meta CSP build plugin.** Add the `transformIndexHtml` plugin to `electron.vite.config.ts` that calls `buildMetaCsp({ mode: 'production' })`. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T2.8 Security gate.** security-reviewer writes the M2 security review covering window, CSP, protocol, navigation, permissions, lifecycle, logging. **DONE (human decision): the canonical deliverable is `docs/security/m2-m3-security-review.md`** (combined M2 and M3, findings F-1 to F-8). `desktop-foundation-m2-review.md` is not created and no duplicate report is written. Why the task text is met: that review has a pass/fail row with evidence for window web preferences, production and development CSP, `app://` protocol, navigation, new windows, permissions and webviews, sender validation, single instance and shutdown, and error and log sanitization; verdict APPROVED with zero blockers. Supporting evidence: `docs/security/m2-m3-focused-review.md` (second pass, APPROVED, no Critical, High or Medium). Finding dispositions (human): F-1 and F-2 corrected with regression tests (`single-instance.test.ts` "ignores second-instance while the app is not ready"; `resolve-app-path.test.ts` reserved device names); F-3 accepted as a low risk temporarily and tracked in `docs/engineering/backlog.md` (mandatory reassessment before the first public release); F-5 accepted (ADR 0005 addendum); F-4 (dev CSP `unsafe-inline` reduction at T7.6), F-6, F-7 (fuses, ASAR, devTools at packaging review) and F-8 (runtime checks at T7.0 and E2E) accepted with their downstream validation requirements preserved. Limits: both reviews are code reading. Electron runtime behavior is not verified. Crash-handler and user-data override internals were reviewed in depth by neither pass beyond `index.ts` (focused review, "Unreviewed areas"); they go to the final review T8.3. This is implementation acceptance, not runtime acceptance.
+
+**Expected deliverables.** Everything under `src/main/**` except `src/main/ipc/**`, co-located `*.test.ts`, the config plugin, the API verification note, the M2 security review.
+
+**Requirements traceability.** R3 (window hardening, single factory), R5 (CSP), R6 (navigation, windows, webviews, permissions), R7 (lifecycle, crash handling, single instance, quit), R15 (privacy, no network, no secrets in logs), R16 (platform branches as pure functions), R17.2 (API sources).
+
+**Acceptance criteria.**
+1. `buildWebPreferences()` returns the literal object in design 3.1, identical in every mode (unit test by deep equality).
+2. Production CSP has no `unsafe-eval`, `unsafe-inline`, `data:`, wildcard or remote source; the dev allowance (N2) appears only in the development output.
+3. `resolveAppPath` rejects every case in design 4 and accepts only `app://renderer` files with allow-listed extensions.
+4. `platform-policy` and `app-menu` are tested for `win32`, `darwin` and `linux` and for an unknown platform (quits).
+5. Only one `new BrowserWindow`, no `shell.openExternal`, `net`, `fetch`, `crashReporter` or `autoUpdater` in `src` (lint and source scan).
+6. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass for the touched projects. Whole-application `pnpm build` is DEFERRED to T7.0.
+7. Each UNVERIFIED API name has a documented outcome (T2.0). security-reviewer reports zero blockers.
+
+**Validation commands.**
+
+```powershell
+pnpm typecheck
+pnpm lint
+pnpm test
+```
+
+`pnpm build` is not run in M2: it needs the renderer entry (T4.6) and CSS (T5.2, T5.3). Main and preload typecheck and unit tests are the M2 evidence. No stub renderer is created.
+
+**Parallelism.** T2.0 first. T2.1, T2.2 and T2.3 are independent pure-module groups and can run in parallel in separate desktop-engineer sessions. T2.4 needs T2.2. T2.5 needs T2.1. T2.6 follows T2.1 to T2.5 and T3.2. T2.7 follows T1.2. T2.8 is last. M2 may overlap with M3.1 and M4 (different files, different agents).
+
+---
+
+## M3 Shared contracts and secure preload bridge
+
+**Responsible agent.** desktop-engineer (contracts, handler registration, preload). necro-architect reviews the shared contract (`shared-ownership-policy.md` 3.1). security-reviewer reviews sender validation and the bridge.
+
+**Agent Skills.** `electron-security`, `typescript-standards`.
+
+**Dependencies.** M1 for T3.1. T3.2 requires T3.1 and T2.2 (`sender-validation.ts`, `trusted-origins.ts`). T3.3 requires T3.1 only.
+
+**Tasks.**
+
+- [x] **T3.1 Shared contracts.** `src/shared/ipc/{channels,result,app-info,index}.ts`: `IPC_CHANNELS`, `ipcResultSchema`, `ipcErrorSchema`, error codes, `appInfoRequestSchema`, `appInfoSchema`, `platformSchema`, `appInfoResponseSchema`, all `z.strictObject` and bounded, plus unit tests. No Electron, DOM or Node imports. **DONE.** Evidence: tests in node project; typecheck, lint, test (36 files, 542 passed, 2 skipped), format:check exit 0 on 2026 M2/M3 integration run.
+- [x] **T3.2 Handler registration.** `src/main/ipc/register-handler.ts` (sender check, request parse, handler in try/catch, response parse, no throw across IPC, disposer) and `src/main/ipc/app-handlers.ts`, plus unit tests with an `ipcMain` fake. Do not edit `src/main/index.ts`; T2.6 imports these modules and registers them. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T3.3 Preload bridge.** `src/preload/index.ts`: one frozen object `necroamp.app.getInfo` returning `Promise<unknown>`, `contextBridge.exposeInMainWorld('necroamp', api)`. Unit test with fakes asserts the key set. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T3.4 Contract review.** necro-architect reviews `src/shared/ipc/**` against ADR 0005 and `shared-ownership-policy.md`; security-reviewer writes the M3 security review. **DONE (human decision): the security deliverable is the canonical `docs/security/m2-m3-security-review.md`** (`desktop-foundation-m3-review.md` is not created, no duplicate). Contract review: section "Addendum: T3.4 contract review of `src/shared/ipc/**`" in `docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md` (verdict ACCEPT, no blockers; C-1 and C-2 are documentation follow-ups, C-3 to C-5 need no action). Why the task text is met: the necro-architect review against ADR 0005 and the ownership policy is recorded, and the security review covers sender validation, Zod validation, the preload surface and error sanitization with zero blockers. The F-5 decision is in the ADR 0005 addendum. Limits: code reading only; renderer adapter code, test assertions and runtime behavior are not covered (T4.2, T7.x). Acceptance criterion 5 (full green `typecheck`, `lint`, `test`) rests on the exit codes recorded in `docs/engineering/m2-m3-acceptance-report.md`.
+
+**Expected deliverables.** `src/shared/ipc/**`, `src/main/ipc/**`, `src/preload/index.ts`, co-located tests, `docs/architecture` review note, M3 security review.
+
+**Requirements traceability.** R4 (channel constants, one channel, Zod validation on receipt, sender validation, narrow bridge, unregistered channels; R4.8 partial, N3), R2.4 (shared has no DOM or Node), R3.5 (trusted frame), R15.
+
+**Acceptance criteria.**
+1. The only channel is `app:get-info`; channel literals appear only in `channels.ts` (lint and source scan).
+2. `registerHandler` returns `INVALID_SENDER` before reading the payload, `INVALID_PAYLOAD` with no issue text, `INTERNAL` on throw or shape drift, and never throws.
+3. Preload exposes exactly `necroamp.app.getInfo`; no `ipcRenderer`, no generic invoke.
+4. Shared project compiles with no DOM and no Node types.
+5. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass. This is the first full green typecheck for `shared`, `main`, `preload` (V6, partial).
+6. security-reviewer and necro-architect report zero blockers.
+
+**Validation commands.**
+
+```powershell
+pnpm typecheck
+pnpm lint
+pnpm test
+```
+
+**Parallelism.** T3.1 can start right after M1 and in parallel with M2. T3.2 and T3.3 can run in parallel after T3.1 (T3.2 also needs M2.2). T3.4 reviews run in parallel with each other after T3.3.
+
+---
+
+## M4 React renderer and neutral application shell
+
+**Responsible agent.** frontend-engineer.
+
+**Agent Skills.** `typescript-standards`, `electron-security`, `skin-development` (to keep region ids and `data-part` hooks Skin Engine compatible; no skin code is written).
+
+**Dependencies.** M1; T3.1 for the response schema used by the adapter. Independent of the main-process implementation, because tests use a fake client.
+
+**Tasks.**
+
+- [x] **T4.1 Entry files.** `src/renderer/index.html` (`lang="en"`, `<title>NecroAmp</title>`, no meta CSP in source), `main.tsx` (no CSS import until T5.2 exists), `env.d.ts` (typed `window.necroamp`).
+- [x] **T4.2 Bridge adapter and store.** `app/bridge/necroamp-client.ts` (`createNecroampClient`, the only reader of `window.necroamp`), `stores/app-info-store.ts` (`createAppInfoStore(client)`), `useAppInfo` hook, plus tests with a fake client.
+- [x] **T4.3 Strings and layout.** `app/strings/en.ts` (typed constants, including the exact tagline `Code. Listen. Repeat.`), `app/shell-layout.ts` (`REGION_IDS`, `FOUNDATION_LAYOUT`).
+- [x] **T4.4 Shared components.** `components/control-button`, `region-frame`, `status-text` (props only).
+- [x] **T4.5 Regions.** For `player`, `playlist`, `equalizer`, `visualization`, `skin-selector`, `github`: `index.ts`, `<name>-region.tsx`, `<name>-view.tsx`, `use-<name>.ts`. Equalizer shows ten labelled band placeholders. Buttons are `aria-disabled` and focusable with visible "Not implemented in this phase" text. View files import their `*.module.css` only after T5.3 creates them.
+- [x] **T4.6 Shell.** `app/app-shell.tsx`: header with the single `h1` and tagline, `main` with six labelled sections, `data-testid` equal to each region id, "unavailable" state when the bridge is missing (R8.10).
+- [x] **T4.7 Component tests.** Co-located `*.test.tsx`: six regions, tagline, one `h1`, store states, placeholder activation updates `StatusText`.
+- [x] **T4.8 Renderer validation.** `pnpm typecheck`, `pnpm lint` and `pnpm test` for the renderer project. The V5 build part is DEFERRED to T7.0 (needs main, preload and renderer entries plus the M5 CSS). Do not add stubs.
+
+**Expected deliverables.** `src/renderer/**` as in design section 1, co-located tests.
+
+**Requirements traceability.** R8 (initial window: tagline, six regions, test ids, bridge-missing state, min size 800x600 layout), R9 (landmarks, names, focus order, one `h1`, `lang`), R10 (state, injected client, no audio state), R2.3 (feature isolation), R4.9 (single adapter).
+
+**Acceptance criteria.**
+1. The shell renders the exact tagline and six regions with stable ids and test ids.
+2. No `AudioContext`, `requestAnimationFrame`, `style` prop, remote URL or `window.necroamp` access outside the adapter (lint and source scan).
+3. User-facing strings come only from `strings/en.ts`.
+4. Features import no other feature's internals; no `../../../` chains.
+5. `pnpm typecheck`, `pnpm lint`, `pnpm test` pass for the renderer. M4 is "IMPLEMENTED, integration pending: T5.2, T5.3, T7.0" until the build check at T7.0 shows `out/renderer/index.html` with the meta CSP (V5).
+
+**Validation commands.**
+
+```powershell
+pnpm typecheck
+pnpm lint
+pnpm test
+```
+
+**Parallelism.** T4.1 to T4.4 in parallel (disjoint files); T4.5 after T4.3 and T4.4; T4.6 after T4.5; T4.7 alongside each piece; T4.8 last. M4 runs in parallel with M2 and M3 (different agent), and with M5 token files.
+
+---
+
+## M5 Styling foundation and future Skin Engine compatibility
+
+**Responsible agent.** frontend-engineer. art-director performs an optional read-only seam review that writes one note under `docs/design/`.
+
+**Agent Skills.** `skin-development`, `typescript-standards`. art-director: `skin-development`.
+
+**Dependencies.** Token and global CSS files (T5.1, T5.2) have no dependency beyond M1 and may start in parallel with M4. Region CSS Modules (T5.3) need M4.5. Contrast checks need the final tokens. T5.2 requires T4.1. T5.3 requires T4.5. The CSS import statements in `main.tsx` and in the views are added by T5.2 and T5.3 and are part of those tasks.
+
+**Tasks.**
+
+- [x] **T5.1 Tokens.** `app/styles/tokens.css`: color roles, spacing, type scale, radii, focus ring, font family tokens. Neutral dark gray and off-white palette. No Morgul Revenant palette value and no Analog 1984 look appears (design 8).
+- [x] **T5.2 Global CSS and reset.** `app/styles/global.css`, imported once from `main.tsx`.
+- [x] **T5.3 CSS Modules.** `*.module.css` per view using tokens only (no literal colors), `data-part` hooks, named grid areas from `FOUNDATION_LAYOUT`, `min-width: 0`, `overflow-wrap: anywhere`, layout valid at 800x600 and 1920x1080.
+- [x] **T5.4 Contrast function and tests.** `app/theme/contrast.ts` (WCAG luminance, pure) with a test that reads token pairs from `tokens.css` and asserts text >= 4.5:1, large text and focus indicator >= 3:1.
+- [ ] **T5.5 Seam review (optional).** art-director reads the shell and CSS and writes `docs/design/desktop-foundation-skin-seams.md` mapping each Morgul Revenant and Analog 1984 need (materials, custom controls, typography, geometry, chrome, effects) to the seams in design 8, and lists gaps. No art, fonts or assets are created, so no `docs/assets.md` entry is needed.
+
+**Expected deliverables.** `app/styles/*.css`, per-view CSS Modules, `app/theme/contrast.ts` and test, optional design note.
+
+**Requirements traceability.** R8.13 (CSS custom properties), R9.3, R9.4 (contrast), R9.7 (no animation), R8.11 (layout at both sizes), R2.3; design 8 compatibility constraints (skins are data; confined skin protocol root; license records; no third-party art).
+
+**Acceptance criteria.**
+1. No literal color outside `tokens.css`; no inline style, no `style` prop, no `@import`, no remote `url()` (lint, source scan).
+2. Contrast tests pass for all declared pairs.
+3. Region ids, `data-part` hooks and `FOUNDATION_LAYOUT` are unchanged by styling (a Skin Engine layout can reference them later).
+4. CSP unchanged: `style-src 'self'` still sufficient in the built app (checked in M7 after T7.0 by CSP-violation listener).
+5. If T5.5 runs, it records every gap as a future-design item and none as a foundation change.
+
+**Validation commands.**
+
+```powershell
+pnpm typecheck
+pnpm lint
+pnpm test
+```
+
+`pnpm build` is DEFERRED to T7.0.
+
+**Parallelism.** T5.1, T5.2 and T5.4 in parallel and early; T5.3 after M4.5; T5.5 after T5.3 and independent of the rest.
+
+---
+
+## M6 Unit, integration, property-based and accessibility testing
+
+**Responsible agent.** qa-engineer. Defects found in source are reported to desktop-engineer or frontend-engineer, never patched by qa-engineer.
+
+**Agent Skills.** `testing-strategy`, `electron-security`, `typescript-standards`.
+
+**Dependencies.** M2, M3, M4 and M5 code exists. `vitest.config.ts` from M1.
+
+**Tasks.**
+
+- [x] **T6.1 Property tests** (`*.property.test.ts`, at least 100 runs, seed reported): `resolveAppPath` never throws and never escapes under `path.posix` and `path.win32`; origin check; `buildCsp` (production never contains dev allowance, for every input including a dev origin and mode flags; development never contains `unsafe-eval` or remote scripts; human gate 3); IPC payload parser and `registerHandler`; platform policy (unknown platform quits); `resolveLoadTarget`; menu builder (no unknown roles); contrast function. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T6.2 Static and boundary tests.** `tests/static/source-policy.test.ts` (single `new BrowserWindow`, no literal channel names, no `shell.openExternal`, `AudioContext`, `requestAnimationFrame`, `crashReporter`, `autoUpdater`, `net`, `fetch`, no `style` prop), `tests/lint-rules/*.test.ts` (each boundary rule fails on a fixture through the ESLint `Linter` API). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T6.3 Integration tests.** Protocol handler against a fake `fs` for the escape case, and one real temporary directory with a symlink where the platform permits (reported SKIPPED with reason on Windows without privilege). Preload plus `registerHandler` round trip with fakes. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T6.4 jsdom accessibility tests.** Names, roles, one `h1`, `lang`, focus order, `aria-disabled` placeholder behavior (R9). These complement, and do not replace, the axe scan in M7. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T6.5 Coverage gate.** Finalize thresholds in `vitest.config.ts` (80/80/80 and 75 branches; 95 for the security-critical files, including the two extra files, N5) and run V8 in full. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T6.6 Traceability file.** `docs/testing/desktop-foundation-traceability.md` mapping R1 to R17 criteria to tests, with N3 (R4.8 partial) stated. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+
+**Expected deliverables.** Property, static, lint-rule, integration and accessibility tests; final Vitest config; coverage report; traceability file.
+
+**Requirements traceability.** R12 (unit and property tests, offline, deterministic), R2.3 (boundary fixtures), R3 to R7 (security and lifecycle logic under test), R9 (static and jsdom accessibility), R11.4 (single-run commands), R14.
+
+**Acceptance criteria.**
+1. `pnpm test` passes, offline, with no clock, network or home-directory dependency.
+2. `pnpm test:coverage` meets every threshold and prints the report; failures name the file.
+3. Each property test file runs at least 100 cases and prints a seed on failure.
+4. Every R1 to R17 criterion is mapped to a test or to an explicit "NOT VERIFIED / E2E in M7" entry.
+5. `pnpm typecheck` passes for all five projects (V6 complete) and `pnpm lint` passes (V7).
+
+**Validation commands.**
+
+```powershell
+pnpm typecheck
+pnpm lint
+pnpm test
+pnpm test:coverage
+```
+
+**Parallelism.** T6.1, T6.2, T6.3 and T6.4 are independent files and can run in parallel (separate qa-engineer sessions). T6.5 and T6.6 follow.
+
+---
+
+## M7 Electron smoke tests and production build validation
+
+**Responsible agent.** qa-engineer (Playwright and axe), release-engineer (production build inspection). Orch runs commands outside their shells and integrates. The human runs interactive `pnpm dev`.
+
+**Agent Skills.** `testing-strategy`, `electron-security`, `cross-platform-packaging` (build output only; no installers).
+
+**Dependencies.** M6 and the tasks in the dependency table (T2.6, T2.7, T3.3, T4.6, T5.2, T5.3), which T7.0 checks.
+
+**Tasks.**
+
+- [x] **T7.0 Whole-application build validation (V5 build part).** Also serves as the esbuild functionality validation accepted in human gate 4 (S1). Precondition: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `main.tsx` and every imported CSS file exist. Orch (or qa-engineer) runs `pnpm build` once. Record the exit code, `out/main/index.js`, `out/preload/index.js` and `out/renderer/index.html`, and the meta CSP. If a precondition is missing, record "BLOCKED by T.." and stop. Do not create stubs. M2, M4 and M5 are reported PASSED only after this task passes. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T7.1 Playwright setup.** qa-engineer writes `playwright.config.ts` (`workers: 1`, `retries: 0`, traces on failure) and the launch fixture (`_electron.launch` on `out/main/index.js`, `ELECTRON_RENDERER_URL` removed, `NECROAMP_E2E_USER_DATA` temp dir, teardown on failure, global-setup check that `out/main/index.js` exists and is current). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T7.2 Smoke and security E2E.** Title, tagline, six regions, platform equals host; live web preferences; `require`, `process`, `Buffer`, `ipcRenderer` undefined in the renderer; bridge key set; effective CSP by header and meta; inline script and remote fetch blocked; all requests on `app://renderer`; navigation to `https:`, `http:`, `file:`, `data:`, `javascript:` stays on the app URL; `window.open` returns null and opens no window; permission request denied. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T7.3 Lifecycle E2E.** Second instance exits and focuses the first window; last-window-close behavior for the host platform; quit within 5 seconds; layout bounding boxes at 800x600 and 1920x1080; keyboard Tab order. **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T7.4 Accessibility scan (V10).** `@axe-core/playwright` against the real page, with the documented fallback (inject `axe-core`, call `axe.run`) if the constructor does not accept an Electron `Page`. Zero serious or critical violations; incomplete checks recorded. Imports restricted to `tests/e2e` (E1). **COMPLETE (TESTED, RUNTIME VERIFIED in Block B):** see `.agents` block-b review; typecheck, lint, format:check, test (768 passed, 2 skipped), build and test:e2e (35 passed) exit 0.
+- [x] **T7.5 Production build validation.** **COMPLETE (RUNTIME VERIFIED on Windows x64; evidence in `docs/release/desktop-foundation-build-validation.md`).** release-engineer runs `pnpm build` once and writes `docs/release/desktop-foundation-build-validation.md`: output layout, preload is one CommonJS file, built `index.html` has the meta CSP and no inline script, no source maps shipped by default, no mention of `axe` anywhere in `out/` (E1). **Validation note (human gate 4, S1):** confirm esbuild works in the real build (the build exits 0 and produces the three outputs); this is the functional check for the esbuild `postinstall`, which was not directly observed. Packaging, installers and `electron-builder` are not touched (D10).
+- [ ] **T7.6 Interactive development run.** Human runs `pnpm dev`, confirms the window appears, no CSP violation beyond the accepted dev allowance (N2), then closes it. Validation duty (gate 3): record whether `unsafe-inline` for script and style is actually needed; remove any allowance that is not. Orch records V4 and V5 (dev part).
+- [ ] **T7.7 Final matrix run.** Orch runs `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e` and `pnpm licenses` (V11) once each and records PASSED, FAILED or NOT VERIFIED per platform and per kind (R16.3). macOS and Linux rows read NOT VERIFIED.
+
+**Expected deliverables.** `playwright.config.ts`, `tests/e2e/**`, `docs/release/desktop-foundation-build-validation.md`, run record with V4, V5, V9, V10, V11.
+
+**Requirements traceability.** R13 (E2E scope, isolation, ignored output), R5.7 (effective CSP), R6 (navigation, windows, permissions in the real app), R7 (lifecycle), R8.11 (layout), R9.6 (axe), R11 (build and test commands), R16.3 (platform reporting), R1.7 with E1.
+
+**Acceptance criteria.**
+1. `pnpm build` exits 0 and the output layout matches design 3.1 and 4 (V5).
+2. `pnpm test:e2e` passes on Windows x64: Electron launches (V4), the smoke test runs (V9), no browser binary was downloaded by Playwright.
+3. The axe scan completes with zero serious or critical violations (V10).
+4. Tests wait on observable state, with no fixed sleeps; each test cleans up its Electron process and temp directory.
+5. No `axe` text in production output; production dependency licenses still permissive (V11).
+6. Every failure has a defect report to its owner; none is patched by qa-engineer.
+
[TRUNCATED: .kiro/specs/desktop-foundation/tasks.md has 514 diff lines; remaining 114 lines omitted]
diff --git a/.kiro/steering/tech.md b/.kiro/steering/tech.md
index ddee6a1..3233c67 100644
--- a/.kiro/steering/tech.md
+++ b/.kiro/steering/tech.md
@@ -30,7 +30,8 @@ Only Node.js 24 LTS and pnpm 10 are fixed. Electron and every other library vers
 ## Language and code rules
 - TypeScript strict mode, no `any` without a justifying comment. Prefer `unknown` plus Zod parsing at boundaries.
-- ES modules everywhere. Named exports; avoid default exports except where a tool requires them.
+- ES modules for all TypeScript application source. Named exports; avoid default exports except where a tool requires them.
+- Scoped exception E-ESM-1 (ADR 0002 section 6): the Electron main and sandboxed preload build outputs may be CommonJS, because a sandboxed preload must be a single CommonJS file. Renderer output stays ES modules. Configuration files that are ES modules use an explicit `.mjs` extension, and `package.json` has no `"type": "module"`. `sandbox`, `contextIsolation` and `webSecurity` are never disabled to obtain a uniform module format.
 - Pure logic (equalizer math, skin parsing, playlist operations, metadata normalization) lives in framework-free modules so it can be unit and property tested.
 - English identifiers, comments and docs.
 - Dependencies: add only when needed, prefer well-maintained and permissively licensed packages. Record any new runtime dependency and its license in the PR description.
diff --git a/.npmrc b/.npmrc
new file mode 100644
index 0000000..b6f27f1
--- /dev/null
+++ b/.npmrc
@@ -0,0 +1 @@
+engine-strict=true
diff --git a/.nvmrc b/.nvmrc
new file mode 100644
index 0000000..a45fd52
--- /dev/null
+++ b/.nvmrc
@@ -0,0 +1 @@
+24
diff --git a/.prettierignore b/.prettierignore
new file mode 100644
index 0000000..0ae5c20
--- /dev/null
+++ b/.prettierignore
@@ -0,0 +1,13 @@
+node_modules
+out
+dist
+coverage
+test-results
+playwright-report
+pnpm-lock.yaml
+.pnpm-store
+.agents
+.kiro
+docs
+LICENSE
+
diff --git a/README.md b/README.md
index f4ac62d..f5531a6 100644
--- a/README.md
+++ b/README.md
@@ -1,4 +1,5 @@
 # necroamp
+
 NecroAmp — The developer's music player. Resurrecting classic desktop music players for modern developers. Built with Kiro for Kiroween 2026.
 > Code. Listen. Repeat.
@@ -92,11 +93,28 @@ Project-specific Kiro configuration is maintained in the
 ## Development Status
-Project initialization.
+Desktop Foundation (branch `feature/desktop-foundation`): the Electron main process, sandboxed preload, typed IPC and a React shell with six placeholder regions are implemented and tested on Windows x64. Playback, playlists, equalizer, visualizer, skins and GitHub features are not implemented yet. macOS and Linux are not verified. Installers are not built. See `docs/engineering/desktop-foundation-delivery-report.md`.
-Application implementation, installers and documentation
-will be added during the development process.
+To launch the production build locally: `pnpm.cmd build; pnpm.cmd exec electron-vite preview`.
 ## License
 MIT License.
+
+## Development
+
+Requires Node.js 24 LTS and pnpm 10. On Windows PowerShell use `pnpm.cmd` if script execution is restricted.
+
+| Command                             | Purpose                                                                      |
+| ----------------------------------- | ---------------------------------------------------------------------------- |
+| `pnpm install --frozen-lockfile`    | Install pinned dependencies. Lifecycle scripts are deny-by-default.          |
+| `pnpm dev`                          | Start electron-vite in development mode (interactive run not yet validated). |
+| `pnpm build`                        | Build main, preload and renderer into `out/`.                                |
+| `pnpm typecheck`                    | Run `tsc -b` over all projects.                                              |
+| `pnpm lint`                         | Run ESLint.                                                                  |
+| `pnpm format` / `pnpm format:check` | Write or check Prettier formatting.                                          |
+| `pnpm test`                         | Run Vitest once.                                                             |
+| `pnpm test:coverage`                | Run Vitest with coverage thresholds.                                         |
+| `pnpm test:e2e`                     | Run Playwright against the built app.                                        |
+
+Platform status: Windows x64 is the only validated platform. macOS and Linux are not verified.
diff --git a/docs/adr/0002-single-package-tooling-and-module-format.md b/docs/adr/0002-single-package-tooling-and-module-format.md
new file mode 100644
index 0000000..077d502
--- /dev/null
+++ b/docs/adr/0002-single-package-tooling-and-module-format.md
@@ -0,0 +1,39 @@
+# ADR 0002: Single package, ESLint plus Prettier, test stack, coverage and module format
+- Status: Accepted (human decisions D1, D2, D3, D8, D12; exception E-ESM-1 recorded here, approved by the human on 2026-11-26)
+- Resolves: open decisions 1 (repository layout), 8 (styling approach) and 9 (lint and format tooling) in `.kiro/steering/structure.md`, for the desktop-foundation phase
+- Related: `.kiro/specs/desktop-foundation/design.md` sections 1, 9 and 10, `docs/engineering/package-script-policy.md`, ADR 0004 (dependency lifecycle policy)
+## Context
+`structure.md` lists the repository layout, the styling approach and the lint tool as open. The foundation phase needs all three fixed before code exists (R17.1). `tech.md` also requires "ES modules everywhere". Electron's sandboxed preload cannot be an ES module, so that rule needs a scoped exception.
+## Decision
+1. **Single package (D1).** One `package.json` at the repository root, `private`, no workspaces. Source lives under `src/{main,preload,renderer,shared}` as in `structure.md`. Splitting into a pnpm workspace later is possible and is a new ADR.
+2. **ESLint plus Prettier (D2).** ESLint 9 flat config with `typescript-eslint`, `react`, `react-hooks` and `jsx-a11y`. Prettier formats. `eslint-config-prettier` removes rule overlap. Dependency direction is enforced with ESLint core `no-restricted-imports` per glob, so no import-boundary plugin is added. Each boundary rule has a fixture test that runs the ESLint `Linter` API on a string.
+3. **CSS Modules over CSS custom properties (D3).** Component rules are CSS Modules. Global CSS holds only tokens and a reset. React's `style` prop is banned. Dynamic values are written to custom properties through the CSSOM. This keeps `style-src 'self'` sufficient (ADR 0003).
+4. **Test stack (D8).** Vitest with two projects: `node` (main, shared, preload, static and lint-rule tests) and `renderer` (jsdom, Testing Library). fast-check for `*.property.test.ts` with at least 100 runs. Playwright in Electron mode for E2E, with `@axe-core/playwright` for the accessibility scan under the MPL-2.0 exception E1 (dev only, imported only from `tests/e2e`, never in `out/`). Tests are offline and deterministic. A setup file makes `fetch` and `net` throw.
+5. **Coverage (D12).** Provider `v8`. Global thresholds: statements 80, lines 80, functions 80, branches 75. Lines and branches 95 for the IPC validation modules (`src/shared/ipc/**`, `register-handler.ts`, `sender-validation.ts`, `trusted-origins.ts`) and, as an addition pending human confirmation (design N5), `resolve-app-path.ts` and `csp.ts`. `pnpm test` stays coverage-free. `pnpm test:coverage` is the gate.
+6. **Module format, exception E-ESM-1.** Source is ES modules with named exports, as `tech.md` requires. The build outputs and package metadata are fixed as follows.
+
+| Artifact | Format and path | Why |
+|---|---|---|
+| Source (`src/**`, `tests/**`) | ES modules, named exports | `tech.md`. |
+| Main bundle | CommonJS, `out/main/index.js` | Matches `package.json` `main`. `electron.vite.config.ts` pins `format: 'cjs'`. |
+| Preload bundle | One self-contained CommonJS file, `out/preload/index.js` | A sandboxed preload (`sandbox: true`) runs as a single script. An ES module preload needs `sandbox: false`, which `tech.md` forbids. |
+| Renderer | Browser ES modules, `out/renderer/index.html` plus `.js` and `.css` assets | Loaded by Chromium from `app://renderer`. |
+| Tool configs | `eslint.config.mjs`, `prettier.config.mjs` | The explicit `.mjs` extension gives ESM without a `type` field. |
+| Root `package.json` | No `"type": "module"` | With `"type": "module"`, electron-vite 6 emits `.mjs` for main and preload, which breaks the sandboxed preload. |
+
+   **E-ESM-1 (scoped exception to "ES modules everywhere").** It covers only the main and preload build outputs (CommonJS `.js`) and the absence of `"type": "module"`. It does not relax any other `tech.md` rule. Changing the output format, the file extensions or the `type` field requires a new ADR. Revisit it when Electron supports ES module preloads under `sandbox: true`, or when Electron or electron-vite is re-pinned.
+## Consequences
+- E-ESM-1 was **approved by the human on 2026-11-26**. Sandboxed preload security takes priority over uniform compiled module formats. `sandbox`, `contextIsolation` and `webSecurity` are never disabled. Steering still says "ES modules everywhere" without the exception. Agents may not edit steering, so the approved replacement text is in `docs/architecture/tech-md-amendment.md` for the orchestrator to apply.
+- Open decisions 1, 8 and 9 in `structure.md` are still listed as open until steering is updated.
+- The module review (this workflow, step 2) is based on Electron and electron-vite behavior recalled from their documentation. It was not re-fetched and no build existed to test it. M1 completion keeps these gates open:
+  1. `pnpm build` produces `out/main/index.js`, a single-file `out/preload/index.js` and `out/renderer/index.html`.
+  2. An E2E test shows the bridge is present under `sandbox: true`.
+  3. The loading behavior of `electron.vite.config.ts` without a `type` field is checked.
+  4. ESM-only main dependencies, such as Octokit in a later phase, load from the CommonJS main (bundled or otherwise).
+- Every package script is a single command, so Windows PowerShell compatibility holds.
+## Alternatives rejected
+- pnpm workspace monorepo (D1 option b). More configuration and three process builds across packages, for no benefit in this phase.
+- Biome (D2 option b). Fewer plugins for React hooks, JSX accessibility and boundary rules.
+- Plain global CSS or CSS-in-JS (D3 options b and c). Global CSS collides at scale. CSS-in-JS usually needs `unsafe-inline`.
+- `"type": "module"` with an ESM preload and `sandbox: false`. It weakens a mandatory security setting.
+- `"type": "module"` with a `.cjs` preload. Possible, but it adds a second naming rule and was not verified against electron-vite 6.
diff --git a/docs/adr/0003-app-protocol-privileges-and-csp.md b/docs/adr/0003-app-protocol-privileges-and-csp.md
new file mode 100644
index 0000000..554c4e1
--- /dev/null
+++ b/docs/adr/0003-app-protocol-privileges-and-csp.md
@@ -0,0 +1,45 @@
+# ADR 0003: `app://renderer` protocol, scheme privileges and Content Security Policy
+- Status: Accepted (human decision D4; development CSP deviation accepted with conditions on 2026-11-26). Runtime behavior is not yet verified (see Consequences).
+- Resolves: production renderer origin (D4). Related to `tech.md` "Content Security Policy" and "Filesystem access is mediated by main".
+- Related: `.kiro/specs/desktop-foundation/design.md` sections 3.4 and 4, ADR 0005
+## Context
+`file://` gives an opaque origin, which weakens sender validation and CSP. A local HTTP server opens a network port, which `product.md` rules out. A custom scheme gives a stable origin, but its handler must confine file access and its privileges must stay minimal.
+## Decision
+1. **Origin.** The production renderer loads from `app://renderer/`. The host is a fixed constant. Any request with another host is rejected.
+2. **Scheme privileges.** Registered before `ready` with `protocol.registerSchemesAsPrivileged`:
+
+| Privilege | Value | Reason |
+|---|---|---|
+| `standard` | true | Real host and origin, relative URL resolution, `'self'` in CSP. |
+| `secure` | true | Secure context, needed later for AudioWorklet. |
+| `supportFetchAPI` | true | Module scripts and assets load through fetch. |
+| `corsEnabled` | omitted | Same-origin only. |
+| `bypassCSP`, `stream`, `allowServiceWorkers`, `codeCache` | omitted | Not needed. `bypassCSP` is never allowed. |
+
+3. **`corsEnabled` fallback (pre-approved).** If the E2E smoke run shows module scripts blocked because the scheme is not CORS-enabled, add `corsEnabled: true` and record it as an amendment to this ADR. No other privilege may be added without a new ADR. Status: not exercised.
+4. **Handler.** `protocol.handle('app', ...)` is installed after `ready`. It accepts `GET` and `HEAD` only (`405` otherwise) and reads files with `fs`, not `net.fetch`, so `net` stays forbidden in `src`. It resolves the URL with the pure `resolveAppPath` (rejects over-long input, wrong scheme or host, credentials, encoded separators, `..`, dotfiles, `:`, backslash, NUL, and extensions outside `.html .js .css .json`). It then checks the real path against the real renderer root, requires a regular file of at most 5 MiB, and answers `404` for every rejection without naming the rule. Responses carry `Content-Type`, the CSP header, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` and `Cross-Origin-Resource-Policy: same-origin`.
+5. **Production CSP.** Sent as a header on every `app://` response and copied into a `<meta>` tag at build time by one builder function:
+
+```
+default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
+connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
+frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'
+```
+
+   No `unsafe-eval`, no `unsafe-inline`, no `data:`, no remote scheme and no wildcard. `media-src` and `worker-src` open in the audio phase through a design change.
+6. **Development CSP.** The header is added only for the dev server origin. It adds `connect-src` for that origin and its websocket, and `'unsafe-inline'` for `script-src` and `style-src`, only if the pinned Vite and React plugin need it. This deviates from requirement R5.5 (design N2). **Accepted by the human with conditions on 2026-11-26.** Conditions: (a) `unsafe-inline` only where demonstrated necessary for Vite HMR or React Fast Refresh; (b) development connections restricted to the exact trusted local development origin; (c) never `unsafe-eval`; (d) never remote scripts; (e) the production CSP contains no development exception; (f) all Electron security invariants are preserved; (g) tests prove the production CSP cannot inherit development-only allowances (tasks T2.2, T6.1); (h) validation duty: if runtime validation (T7.6) shows an allowance is not required, remove it. The builder takes an explicit mode, and a test asserts the production output never contains a development allowance.
+7. **Dev loading.** `ELECTRON_RENDERER_URL` is honored only when the app is not packaged and the value is an `http:` loopback URL (`localhost` or `127.0.0.1`) with a port, no credentials and an empty path.
+## Consequences
+- Navigation guards, sender validation and the CSP share one trusted-origin set, so three independent layers keep remote code out (ADR 0005).
+- Skin assets will need `img-src` and `font-src` additions and a confined skin root later. That is a design change, not a loosened policy.
+- Packaged builds need a check of `realpath` against the asar layout. That is deferred to the packaging phase.
+- Unverified until the build and E2E tasks run: `'self'` matching `app://renderer`, the electron-vite output layout, and whether `corsEnabled` is needed. Each has a test that fails visibly.
+## Alternatives rejected
+- `file://` for production. Opaque origin, weaker checks.
+- Local HTTP server. Opens a port.
+- `net.fetch(pathToFileURL(...))` in the handler. It needs `net`, and it removes the handler's own confinement check.
+- `bypassCSP` or `corsEnabled` by default. Wider privileges without evidence of need.
+
+## Addendum: runtime verification
+
+Runtime note (Block C): the production build served from `app://renderer` with the meta CSP loads its module script and runs under E2E on Windows x64 (35 tests), so the item-3 `corsEnabled` fallback was not needed. macOS and Linux are not verified. F-3 remains open (see `docs/engineering/backlog.md`).
diff --git a/docs/adr/0004-dependency-lifecycle-script-policy.md b/docs/adr/0004-dependency-lifecycle-script-policy.md
new file mode 100644
index 0000000..981c3d0
--- /dev/null
+++ b/docs/adr/0004-dependency-lifecycle-script-policy.md
@@ -0,0 +1,39 @@
+# ADR 0004: Dependency lifecycle script policy
+- Status: Accepted (human decision D9, amendments E2 and E5, exception E1)
+- Related: `.kiro/specs/desktop-foundation/design.md` sections 9.3 and 14, `docs/engineering/package-script-policy.md` section 4.4, `docs/security/m0-closure-validation.md`
+## Context
+Dependency install scripts run arbitrary code at install time. pnpm 10 blocks them by default, and the policy must name each exception. The selected tree contains `esbuild` (a `postinstall`), `fsevents` (an `install` that compiles native code, macOS only) and `electron`, whose binary is downloaded outside any lifecycle script.
+## Decision
+1. **Settings** live in `pnpm-workspace.yaml`, which has no `packages:` list, so the project is not a monorepo:
+
+```yaml
+onlyBuiltDependencies:
+  - esbuild@0.28.2
+ignoredBuiltDependencies:
+  - fsevents
+strictDepBuilds: true
+```
+
+2. **`esbuild@0.28.2` is the only package allowed to run a lifecycle script.** The entry is version-qualified, so a version bump fails the install until it is reviewed.
+3. **`fsevents` is denied.** macOS file watching is not verified. Revisit only by human decision.
+4. **`electron@45.5.0` is not allowlisted.** It declares no lifecycle script. Its binary is fetched on demand by the official `install-electron` command (through `@electron/get`, with release checksums), run by the human. Nothing is installed globally. No mirror, proxy or `ELECTRON_*` variable is set. If a later Electron version adds an install script, the human must review it before `electron` is added to the list.
+5. **`strictDepBuilds: true` (E5).** This deviates deliberately from requirement R1.6, which relied on pnpm's default of `false`. An unreviewed script now fails the install instead of being skipped with a warning. Deny-by-default is kept and tightened.
+6. **Never set** `dangerouslyAllowAllBuilds`. Never approve "all". Never disable TLS validation or add proxy, certificate or registry overrides to the repository. `.npmrc` holds only `engine-strict=true`.
+7. **Fallback.** If a future pnpm ignores the preferred keys, move the same allow and deny set to `allowBuilds`. The set stays identical.
+8. **Exception E1 (license, not lifecycle).** `@axe-core/playwright` and `axe-core` are MPL-2.0. They are allowed only as `devDependencies`, used only from `tests/e2e`, excluded from production bundles and installers, with notices preserved. NecroAmp stays MIT. No other MPL-2.0 package is covered. Vite 7.3.8 was chosen over Vite 8 partly to avoid the MPL-2.0 `lightningcss` dependency.
+## Evidence (M0 closure, read-only, no reinstall)
+- `pnpm config get` returns `strict-dep-builds` true, `only-built-dependencies` `esbuild@0.28.2`, `ignored-built-dependencies` `fsevents`, and nothing for `dangerously-allow-all-builds`.
+- `pnpm ignored-builds` reports none. `.modules.yaml` has empty `ignoredBuilds` and `pendingBuilds`.
+- A scan of every installed `package.json` found one install-phase script: `esbuild@0.28.2`. `electron` has none.
+- `pnpm audit` reports no known vulnerabilities. Installed licenses are all in the accepted set, with MPL-2.0 only on the two E1 packages.
+## Consequences and limits
+- Not demonstrated: the failure branch of `strictDepBuilds` (a non-zero exit on an unlisted script). Proving it needs a violating install, which is prohibited. The documented pnpm 10 behavior is relied on, and the final state is the same either way.
+- Not observable: whether the esbuild `postinstall` actually executed. The operator's console output was not captured.
+- **Accepted by the human on 2026-11-26 (S1 limitations).** Neither limit will be closed by reinstalling or by running an unauthorized script. esbuild functionality is validated during the real application build (T7.0, T7.5). The security policy and exact pins are unchanged.
+- The lockfile does not record `requiresBuild`, so the installed-tree scan is the check to repeat after any dependency change.
+- Every dependency change repeats the scan and returns to the human gate if a new script, a new license class or a new dependency appears.
+## Alternatives rejected
+- Allow all builds. Contradicts the policy.
+- Allowlist `electron`. It has no lifecycle script, and an entry would invite one.
+- `--ignore-scripts` globally. It also stops project scripts and hides esbuild's missing binary.
+- `allowBuilds` first. It is the pnpm 10.26 replacement, kept only as a fallback because the older keys are the documented, tested ones for this version.
diff --git a/docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md b/docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md
new file mode 100644
index 0000000..a5331ee
--- /dev/null
+++ b/docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md
@@ -0,0 +1,111 @@
+# ADR 0005: IPC security model, window chrome, lifecycle, menu and single instance
+- Status: Accepted (human decisions D5, D6, D11, D14). Implemented for M2 and M3 (`src/main`, `src/preload`, `src/shared/ipc`); integration pending (see `docs/engineering/m2-m3-acceptance-report.md`). No Electron runtime check has run.
+- Resolves: open decision 16 in `structure.md` for this phase (window chrome, single window). Related to `tech.md` "Electron architecture and security" and `shared-ownership-policy.md` 3.2.
+- Related: `.kiro/specs/desktop-foundation/design.md` sections 2, 3, 5 and 6, ADR 0003
+## Context
+The renderer is untrusted. Every message that crosses the boundary needs a typed contract, a sender check and bounds. The foundation also has to fix platform behavior (quit, menu, second launch) so later phases do not change it silently.
+## Decision
+### IPC
+1. **One channel**, `app:get-info`, defined in `src/shared/ipc/channels.ts` as `IPC_CHANNELS`. No literal channel string appears elsewhere.
+2. **Contract.** Zod `strictObject` schemas in `src/shared/ipc`: an empty-tuple request, an `AppInfo` response (`name`, `version`, `platform` in `win32 | darwin | linux`) and a result union `{ ok: true, data } | { ok: false, error }`. Error codes are `INVALID_SENDER`, `INVALID_PAYLOAD` and `INTERNAL`, with fixed messages never taken from an exception.
+3. **One registration helper**, `registerHandler`, is the only caller of `ipcMain.handle`. In order: check the sender (trusted top frame whose URL origin is in the trusted set), parse the request, run the handler in `try/catch`, parse the response, never throw across IPC. Logs contain the channel constant and a code only.
+4. **Preload.** One frozen object, `necroamp.app.getInfo`, exposed with `contextBridge`. It returns `unknown`. No `ipcRenderer`, no generic invoke or send. The renderer adapter `necroamp-client.ts` is the only reader of `window.necroamp` and parses responses again.
+5. **Web preferences** come from one parameterless function and are identical in every mode: `contextIsolation`, `sandbox` and `webSecurity` on, `nodeIntegration` and `webviewTag` off, no insecure content. Only `create-main-window.ts` calls `new BrowserWindow`.
+6. **Navigation and permissions.** Guards on every created web contents block navigation, redirects and frame navigation to untrusted URLs, deny `window.open`, and block `webview` attachment. Permission request, check and device handlers deny everything. `shell.openExternal` is not called in this phase.
+### Window chrome (D5)
+7. Native frame, single window, minimum 800 by 600, default 1100 by 720, hidden until `ready-to-show`. `ChromeProfile` is a union with only `native` implemented, so frameless chrome can be added later without touching security preferences. No window-control channels exist.
+### Lifecycle (D11)
+8. **Quit policy.** Windows and Linux quit when the last window closes. macOS stays running and recreates a window on `activate`. An unknown platform string quits.
+9. **Single instance.** `requestSingleInstanceLock()` runs before `ready`. A second process exits. The first restores and focuses its window and ignores argv and working directory.
+10. **Crashes.** A renderer crash reloads once, and a second crash quits the app on every platform. `uncaughtException` logs the error name and exits with code 1. `unhandledRejection` logs the name only. `crashReporter` is never started.
+11. **Test isolation.** `NECROAMP_E2E_USER_DATA` sets `userData` only when the app is not packaged and the value is a short absolute path to an existing directory.
+### Menu (D6)
+12. Minimal menu on Windows and Linux: File (quit), Edit, Window, and View (reload, dev tools) only in a development run. macOS gets a role-based menu. The template builder is pure. Roles supply the labels, so no menu text enters the strings file.
+### Strings (D14)
+13. English only. All UI text is in a typed constants file, with no i18n library.
+## Consequences
+- Sender validation, payload parsing and error mapping cannot be skipped by a new handler, because they live in the only registration helper.
+- R4.8 (an unregistered channel is rejected) is covered at unit level and by the bridge key-set check. A direct end-to-end call is impossible without a generic bridge, which is forbidden (design N3).
+- Adding a channel changes the IPC security surface and needs a contract change note and a security review.
+- Verification by the final code is task T8.4. The sender-frame and `will-frame-navigate` property names are version-sensitive and are checked in T2.0.
+- Linux sandbox prerequisites and macOS and Linux behavior are NOT VERIFIED from the Windows host.
+## Alternatives rejected
+- Frameless custom chrome or multi-window now (D5 b and c). More cost and a larger security surface, with no phase need.
+- Hidden menu bar (D6 a). Loses standard copy and paste shortcuts.
+- Several instances (D11 b). Two processes would share one user-data directory.
+- `send`/`on` events or a generic bridge. No typed request and response.
+- Chromium `--user-data-dir` for tests. Its effect on `userData` and the instance lock is unverified.
+
+## Addendum: sender-frame validation (F-5)
+
+Status: accepted after the focused review (`docs/security/m2-m3-focused-review.md`). No code change.
+
+Decision. `src/main/security/sender-validation.ts` accepts an invoke when the sender is the registered main window `webContents`, `event.senderFrame` is non-null, `senderFrame.parent === null`, and the frame URL origin exactly matches the trusted set (`app://renderer`, plus the dev origin in development). It does not compare `senderFrame` with `sender.mainFrame`. For this threat model the two are equivalent in effect: subframes have a non-null parent and are also blocked by `frame-src 'none'` and the `will-frame-navigate` guard, and any other top-level frame tree in the same contents would still have to be a same-origin `app://renderer` document with the same capabilities.
+
+Rationale. Unregistered or destroyed contents fail the identity check. A null, disposed or throwing frame fails closed. The origin check stays because a disposed frame may report a null parent with an empty URL.
+
+Conditions that keep the decision valid: register any future window explicitly; never put a remote origin in the trusted set; register every handler through `registerHandler`; keep the origin comparison an exact match.
+
+Optional hardening (low, S-1): add `frame === sender.mainFrame`.
+
+Limit. The member names, types and documentation statements below are checked against Electron 45.5.0 (see the next subsection). The behavior of `senderFrame` and `WebFrameMain.parent` after reload, frame swap, navigation or destruction has not run. Runtime confirmation is deferred to E2E (T7.x); see `docs/engineering/m2-m3-deferred-runtime-validation.md`.
+
+### Technical rationale against the pinned Electron 45.5.0 API
+
+Sources. TYPE-LEVEL: `node_modules/electron/electron.d.ts` ("Type definitions for Electron 45.5.0"). DOCUMENTED: the documentation source at the tag `v45.5.0` of the Electron repository (`docs/api/structures/ipc-main-invoke-event.md`, `docs/api/web-frame-main.md`), also quoted in the typings. NOT VERIFIED AT RUNTIME: no Electron process has run. Details: `docs/architecture/electron-api-verification.md`.
+
+What the API provides.
+- `IpcMainInvokeEvent` declares `sender: WebContents` and `readonly senderFrame: WebFrameMain | null` (typings line 9557). DOCUMENTED: "The frame that sent this message. May be `null` if accessed after the frame has either navigated or been destroyed." This is why the code rejects a null or undefined frame first.
+- `WebFrameMain.parent` is `WebFrameMain | null` (typings line 20300). DOCUMENTED: the property "would be `null` if `frame` is the top frame in the frame hierarchy". Strict `=== null` therefore means top frame, and an `undefined` read from a bad object fails.
+- `WebFrameMain.url` is "the current URL of the frame". `origin` is a separate member and "may be different from the URL" (an `about:blank` child reports the parent's origin and an empty `url`). The code reads `url` and parses its origin itself.
+- DOCUMENTED: "In most cases, only the main frame of a WebContents can send or receive IPC messages", unless `nodeIntegrationInSubFrames` is enabled. The web preferences factory keeps the sub-frame node flags off (first-pass review, criterion 1), so sub-frames have no preload and no IPC path by default. `parent === null` is a second layer.
+
+Why the three controls together give the intended boundary.
+1. Registered `WebContents` identity. `event.sender` must be the contents of the registered main window, so a foreign, unexpected or closed contents fails before any frame property is trusted. This is an identity comparison and does not depend on frame semantics.
+2. `senderFrame.parent === null`. A non-null parent is a sub-frame and is rejected even on the trusted origin. A null frame fails. `parent` and `url` are read inside one `try`, so a throw from a disposed frame fails closed.
+3. Exact trusted origin from `senderFrame.url`, evaluated at call time, with no cache and no `await` before the check. A disposed frame may report an empty URL, and an empty URL fails the origin parse, so a disposed frame cannot pass on `parent === null` alone. The two checks must stay together. The empty-URL behavior of a disposed frame is recalled, not documented, and stays NOT VERIFIED AT RUNTIME.
+
+Why this equals `senderFrame === sender.mainFrame` for this threat model. Within one registered contents, the frames with `parent === null` are the roots of its frame trees. The explicit comparison is stricter only for a root that is not the primary `mainFrame`. Such a frame would still need the preload bridge and the exact origin `app://renderer` (or the dev loopback origin in a dev run), so it would hold the same capabilities as the primary page. Navigation guards (Decision item 6 above) deny other origins, and CSP `frame-src 'none'` blocks creating sub-frames.
+
+S-1 (Low, optional hardening). `parent === null` does not prove the frame is the primary `mainFrame`. A separate top frame tree in the same contents would also report a null parent. The effect is limited to a same-origin frame with equal capabilities. If defense in depth is wanted, add `frame === sender.mainFrame` through the injected registration check and a unit test with a frame that has `parent: null` but is not `mainFrame` (expect false). A mismatch on a `WebFrameMain` wrapper identity can only produce a false negative, so it fails closed. Owner: desktop-engineer. This is a human decision and is not part of this closure.
+
+What is and is not verified.
+- VERIFIED by reading and unit tests: the code paths for sub-frame, null frame, throwing getter, untrusted origin and unregistered sender.
+- TYPE-LEVEL and DOCUMENTED: the members and statements quoted above.
+- NOT VERIFIED AT RUNTIME: what `senderFrame` returns after reload, cross-process frame swap, navigation or destruction; `parent` and `url` on a disposed frame; whether `mainFrame` identity is stable across swaps; whether a separate top frame tree can exist in this app. T7.x (and T4.2) have not run, so the decision rests on code reading, typings and documentation, and its status changes only after those tests pass.
+
+This subsection does not change the Decision or the four conditions above.
+
+## Addendum: T3.4 contract review of `src/shared/ipc/**`
+
+Reviewer: necro-architect. Evidence: VERIFIED means read in this repository. Nothing was executed. The security conclusions belong to `docs/security/m2-m3-security-review.md` and are not repeated here.
+
+Scope. Files `channels.ts`, `result.ts`, `app-info.ts`, `necroamp-api.ts` and `index.ts`. Their co-located tests exist (`channels`, `result`, `app-info`, `index`, `ipc-contract.property`); this review did not assess their assertions. Consumers checked by search: `src/main/ipc/app-handlers.ts`, `src/preload/create-necroamp-api.ts`, `src/preload/index.ts`. Out of scope: renderer adapter code (M4).
+
+| Check | Result | Evidence |
+|---|---|---|
+| Decision item 1: one channel `app:get-info` as `IPC_CHANNELS`, no literal elsewhere | Pass | `channels.ts` defines it in `domain:action` form. In non-test `src/**` the string appears only there. |
+| Decision item 2: Zod `strictObject` schemas, empty-tuple request, `AppInfo`, result union | Pass | `appInfoRequestSchema = z.tuple([])`, `appInfoSchema` strict with bounded `name` and `version` and a `platform` limited to `win32`, `darwin`, `linux`; `ipcResultSchema` is a discriminated union on `ok`. |
+| Decision item 2: error codes `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL` with fixed messages | Pass | `IPC_ERROR_MESSAGES` is a frozen record; `createIpcError` takes only a code; no contract function accepts an exception, path or payload. |
+| Decision item 4: bridge shape returns `unknown`, no raw IPC | Pass | `NecroampApi` is `{ app: { getInfo: () => Promise<unknown> } }`. |
+| Ownership policy 3.4: `shared` imports no Electron, DOM, Node-only or renderer/main code | Pass | The only external import is `zod`. |
+| Ownership policy 3.4: a shared schema does not replace receiver validation | Pass by reading | `app-handlers.ts` and the preload each parse with the shared schemas. |
+| Naming (`structure.md`) | Pass | kebab-case files, `fooSchema` with inferred types, `domain:action` channel. |
+
+Findings.
+
+| ID | Severity | Finding | Action |
+|---|---|---|---|
+| C-1 | Low (documentation) | `design.md` section 3.2 describes `isTrustedSender(event, trusted, mainFrameOf)` with `senderFrame === webContents.mainFrame`. The code uses `parent === null` plus an injected registration check (finding F-5, accepted above). | Closed in the documentation closure step: a pointer to the F-5 addendum was added to design 3.2. |
+| C-2 | Low (process) | The Consequences section of this ADR requires a contract change note when a channel is added. Policy 3.3 requires one for breaking or cross-domain changes and exempts additive ones. M3 created the first channel, so nothing was broken, and `docs/architecture/contract-changes.md` does not exist. | Treat M3 as the baseline. When that file is first created, record one entry "initial `app:get-info` contract". Later channel or schema changes follow this ADR. Owner: necro-architect with desktop-engineer. |
+| C-3 | Info | Policy 3.2 lists a runtime dependency used from `shared` as an ADR trigger. No ADR names Zod for `shared`. `tech.md` fixes Zod as the validator and Decision item 2 above relies on it. | Steering is sufficient authority. A one-line ADR note is optional and is a human decision. |
+| C-4 | Info | `IpcResult<T>` is a hand-written generic type next to a schema factory. A generic factory output cannot be inferred as a reusable generic alias, so a single source of truth is not possible here. | Accept. Revisit if the union grows beyond `ok`, `data`, `error`. |
+| C-5 | Info | The `index.ts` barrel exports only public names. | None. |
+
+No finding concerns a missing schema, an exported Electron or DOM type, a literal channel string outside `channels.ts`, or a payload or error that can carry a path, token or stack trace.
+
+Verdict: ACCEPT. The contract matches Decision items 1, 2 and 4 and the dependency direction. No blockers. Not covered: renderer adapter code, test assertions, runtime behavior (T4.2, T7.x). The named file `docs/security/desktop-foundation-m3-review.md` is replaced by the canonical review `docs/security/m2-m3-security-review.md` (human decision).
+
+## Addendum: runtime verification
+
+Runtime note (Block C): the sandboxed preload (one CommonJS file with bundled Zod) loads and the bridge reports Connected in E2E on Windows x64. Sender validation requires main-frame identity (commit `55c38d4`).
diff --git a/docs/architecture/contract-changes.md b/docs/architecture/contract-changes.md
new file mode 100644
index 0000000..7cc929f
--- /dev/null
+++ b/docs/architecture/contract-changes.md
@@ -0,0 +1,49 @@
+# Contract changes
+
+Log of shared contract changes under `src/shared/`, newest first. Format and triggers follow `docs/engineering/shared-ownership-policy.md` section 3.3. Additive changes need no entry. Owner of the log: necro-architect. Closes finding C-2 of the T3.4 addendum in `docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md`.
+
+## 2026-11 (Desktop Foundation M3): initial `app:get-info` contract baseline
+
+- **Type of entry.** Baseline, not a breaking change. Every later change to the items below is measured against this entry.
+- **Contract paths.** `src/shared/ipc/channels.ts`, `result.ts`, `app-info.ts`, `necroamp-api.ts`, `index.ts`.
+- **Architectural owner.** necro-architect. **Implementation owner.** desktop-engineer (`src/shared/ipc/**`).
+- **Reviewers.** necro-architect (T3.4, ADR 0005 addendum, verdict ACCEPT), security-reviewer (`docs/security/m2-m3-security-review.md`).
+
+### Baseline surface
+
+| Item | Value |
+|---|---|
+| Channel constant | `IPC_CHANNELS.appGetInfo = 'app:get-info'`. It is the only channel. Literals appear only in `channels.ts`. |
+| Request | `appInfoRequestSchema = z.tuple([])`. The call takes no arguments, and any extra argument fails parsing in main. |
+| Success data | `appInfoSchema = z.strictObject({ name: string 1..64, version: string 1..64, platform: 'win32' \| 'darwin' \| 'linux' })`. Unknown keys are rejected. |
+| Result envelope | `ipcResultSchema(data)`: `{ ok: true, data }` or `{ ok: false, error }`. Both are strict objects. |
+| Error | `ipcErrorSchema = { code, message }`. `code` is one of `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL`. `message` is at most 120 characters and comes from the fixed `IPC_ERROR_MESSAGES` map, never from an exception, path or payload. |
+| Response schema | `appInfoResponseSchema = ipcResultSchema(appInfoSchema)`. |
+| Bridge shape | `NecroampApi = { readonly app: { readonly getInfo: () => Promise<unknown> } }`, exposed as `window.necroamp`. It returns `unknown` on purpose. The renderer adapter parses the value with `appInfoResponseSchema`. |
+
+### Compatibility rules for later changes
+
+- Adding a channel or an optional field is additive and needs no entry. It still goes in the owner's hand-off.
+- Removing or renaming an export, narrowing a schema, changing a channel name or payload, or changing `ok`/`error` semantics needs a new entry here, newest first.
+- Any change to sender validation, the validation strategy or the preload surface needs an ADR (policy 3.2), not only an entry.
+- `NecroampApi` must never gain a generic invoke, `ipcRenderer`, a filesystem path parameter or an Electron object.
+
+### Affected consumers
+
+| Consumer | Owner | Use |
+|---|---|---|
+| `src/main/ipc/**` | desktop-engineer | Parses the request, builds and validates the response. |
+| `src/preload/**` | desktop-engineer | Uses `IPC_CHANNELS` only. |
+| `src/renderer/app/bridge/necroamp-client.ts` (M4, T4.2) | frontend-engineer | Parses the bridge value with `appInfoResponseSchema`. |
+
+### Sanctioned dependency: Zod in `src/shared/`
+
+- **Decision.** Zod is the sanctioned runtime dependency for contract validation in `src/shared/`. Authority: `tech.md` ("Runtime validation: Zod", "Prefer `unknown` plus Zod parsing at boundaries") and ADR 0005 decision item 2. This closes finding C-3 of the T3.4 addendum. No new ADR is needed because steering already fixes the choice.
+- **Boundary.** `shared` may import `zod` and nothing else outside itself. It may not import Electron, React, DOM or Node APIs (`structure.md`, R2.4). `tsconfig.shared.json` keeps `lib: ["ES2023"]` and `types: []`.
+- **Consequence for bundles.** Zod is bundled into main and renderer. The sandboxed preload must not import any schema. It imports `IPC_CHANNELS` only, which keeps the preload single-file CommonJS and small (E-ESM-1).
+- **Version.** The exact pinned version is recorded in `package.json` and `docs/architecture/dependency-versions.md`. This note does not repeat it.
+- **Receiver rule.** A schema in `shared` does not replace validation. Main parses requests. The renderer adapter parses responses.
+
+### Tests that guard the baseline
+
+`src/shared/ipc/*.test.ts`, `ipc-contract.property.test.ts`, `src/preload/create-necroamp-api*.test.ts`. A future contract change updates these in the same task (owner: qa-engineer for property tests).
diff --git a/docs/architecture/dependency-versions.md b/docs/architecture/dependency-versions.md
new file mode 100644
index 0000000..00a0393
--- /dev/null
+++ b/docs/architecture/dependency-versions.md
@@ -0,0 +1,84 @@
+# Dependency versions (desktop foundation, M0)
+
+Sources: `package.json` (exact pins), `pnpm-lock.yaml` (importer `.`, resolved versions), `docs/security/m0-post-install-validation.md`, `docs/security/m0-closure-validation.md`. Host: Windows x64, PowerShell 7. Nothing here was installed or changed by this document.
+
+## Toolchain
+
+| Item | Value | Note |
+|---|---|---|
+| Host Node.js | v24.22.3 x64 win32 | Runs pnpm, tsc, eslint, vitest, electron-vite. `engines.node` is `>=24.15.0 <25`. |
+| Electron-embedded Node.js | 24.22.3 x64 win32 | Measured with `ELECTRON_RUN_AS_NODE=1` and `process.versions.node`. Same number as the host by coincidence. They are separate runtimes and are recorded separately. |
+| Electron | 45.5.0 | `pnpm.cmd exec electron --version` printed `v45.5.0`. Binary PE machine `0x8664` (x64). |
+| pnpm | 10.34.9 | Pinned by `packageManager`. |
+| Lifecycle-script allowlist | `esbuild@0.28.2` only | `strictDepBuilds: true`, `ignoredBuiltDependencies: [fsevents]`, no `dangerouslyAllowAllBuilds`. |
+
+## Top-level packages (31)
+
+Pinned versions are exact (no ranges). Every resolved version in the lockfile importer equals the pin. Peer-dependency suffixes in lockfile keys are omitted. The post-install check (`pnpm.cmd ls --depth 0 --json`) found 0 mismatches. Note: earlier reports say "32 pins". `package.json` and the lockfile importer list 31 (4 dependencies, 27 devDependencies). The count of 32 was a miscount, not a missing package.
+
+| Package | Section | Pinned | Resolved |
+|---|---|---|---|
+| `react` | dependencies | 19.3.1 | 19.3.1 |
+| `react-dom` | dependencies | 19.3.1 | 19.3.1 |
+| `zod` | dependencies | 4.6.7 | 4.6.7 |
+| `zustand` | dependencies | 5.1.0 | 5.1.0 |
+| `@axe-core/playwright` | devDependencies | 4.14.1 | 4.14.1 |
+| `@eslint/js` | devDependencies | 9.39.5 | 9.39.5 |
+| `@playwright/test` | devDependencies | 1.65.1 | 1.65.1 |
+| `@testing-library/dom` | devDependencies | 10.4.2 | 10.4.2 |
+| `@testing-library/jest-dom` | devDependencies | 8.0.0 | 8.0.0 |
+| `@testing-library/react` | devDependencies | 16.3.3 | 16.3.3 |
+| `@testing-library/user-event` | devDependencies | 14.6.13 | 14.6.13 |
+| `@types/node` | devDependencies | 24.19.4 | 24.19.4 |
+| `@types/react` | devDependencies | 19.3.3 | 19.3.3 |
+| `@types/react-dom` | devDependencies | 19.3.0 | 19.3.0 |
+| `@vitejs/plugin-react` | devDependencies | 5.2.0 | 5.2.0 |
+| `@vitest/coverage-v8` | devDependencies | 5.1.2 | 5.1.2 |
+| `electron` | devDependencies | 45.5.0 | 45.5.0 |
+| `electron-vite` | devDependencies | 6.0.0 | 6.0.0 |
+| `eslint` | devDependencies | 9.39.5 | 9.39.5 |
+| `eslint-config-prettier` | devDependencies | 10.1.8 | 10.1.8 |
+| `eslint-plugin-jsx-a11y` | devDependencies | 6.10.2 | 6.10.2 |
+| `eslint-plugin-react` | devDependencies | 7.37.5 | 7.37.5 |
+| `eslint-plugin-react-hooks` | devDependencies | 7.1.1 | 7.1.1 |
+| `fast-check` | devDependencies | 4.11.0 | 4.11.0 |
+| `globals` | devDependencies | 17.14.0 | 17.14.0 |
+| `jsdom` | devDependencies | 31.0.1 | 31.0.1 |
+| `prettier` | devDependencies | 3.10.1 | 3.10.1 |
+| `typescript` | devDependencies | 6.0.3 | 6.0.3 |
+| `typescript-eslint` | devDependencies | 8.74.0 | 8.74.0 |
+| `vite` | devDependencies | 7.3.8 | 7.3.8 |
+| `vitest` | devDependencies | 5.1.2 | 5.1.2 |
+
+## Electron acquisition
+
+`electron@45.5.0` declares no lifecycle script, so it is not in `onlyBuiltDependencies`. The binary is not part of the lockfile. The human operator ran the official acquisition once (`pnpm.cmd exec install-electron --no`, which uses `@electron/get` and release checksums). The agent attempt was blocked by the Kiro tool guard and was not retried. Electron was not installed globally and the pin is unchanged. `node_modules/electron/dist` and `path.txt` are generated and ignored.
+
+## Installed-license summary
+
+Source: `pnpm.cmd licenses list --json` and `--prod --json` (`m0-post-install-validation.md`).
+
+- Production: MIT only (7 packages).
+- All installed: MIT 333, Apache-2.0 22, ISC 11, BSD-2-Clause 9, BSD-3-Clause 3, BlueOak-1.0.0 4, Python-2.0 1, CC-BY-4.0 1, CC0-1.0 1, MPL-2.0 2.
+- `pnpm audit`: no known vulnerabilities.
+
+## Accepted exceptions
+
+| ID | Exception | Status |
+|---|---|---|
+| E1 | MPL-2.0 on `axe-core@4.14.1` and `@axe-core/playwright@4.14.1`. Development only, not bundled into the app. | Accepted (design E1, ADR 0004). |
+| S4 | `eslint@9.39.5` is flagged deprecated. Dev only. | Accepted temporarily by the human. No known vulnerabilities. |
+| Licenses | Python-2.0, CC-BY-4.0, CC0-1.0 and BlueOak-1.0.0 (one to four packages each, transitive, development graph). | Accepted as part of the permissive set in the post-install validation. |
+| E5 | `strictDepBuilds: true` deviates from the original R1.6 default and keeps deny-by-default execution. | Approved (design E5, ADR 0004). |
+
+## Validation status
+
+| Check | Status | Evidence |
+|---|---|---|
+| V1 host | PASSED | design.md section 16 |
+| V2 installed-tree script scan | PASSED | one script-bearing package, `esbuild@0.28.2` (m0-closure-validation.md section 3) |
+| V3 Electron binary | PASSED | 45.5.0, embedded Node 24.22.3, x64 win32 |
+| V11 licenses | PASSED | summary above |
+
+Limit: whether the esbuild postinstall actually ran is not directly observable (m0-closure-validation.md section 5).
+
diff --git a/docs/architecture/electron-api-verification.md b/docs/architecture/electron-api-verification.md
new file mode 100644
index 0000000..bb9add9
--- /dev/null
+++ b/docs/architecture/electron-api-verification.md
@@ -0,0 +1,142 @@
+# Electron API verification (T2.0)
+
+Status: source and documentation check only. It makes no runtime claim (R17.2). No Electron process, build or E2E run exists for these APIs.
+Scope: `.kiro/specs/desktop-foundation/design.md` sections 3 to 6.
+Pinned versions: Electron 45.5.0 (`node_modules/electron/package.json`, and the first line of `electron.d.ts`: "Type definitions for Electron 45.5.0") and electron-vite 6.0.0 (`node_modules/electron-vite/package.json`). Vite is 7.3.8 per `package.json`.
+
+## 1. Method, evidence levels and limits
+
+Each API below is reported on five separate levels. They are never merged.
+
+| Level | Meaning | Source |
+|---|---|---|
+| Availability | The API exists in 45.5.0 and is not removed. | `node_modules/electron/electron.d.ts` |
+| Type-level | Member name, optionality and type. | Same file, line numbers from a targeted search (exact where a line is given, otherwise approximate). |
+| Documented behavior | What the 45.5.0 documentation says. | D1: JSDoc inside `electron.d.ts`. D2: the documentation Markdown source at the tag `v45.5.0` of the Electron repository, fetched with `web_fetch` from `raw.githubusercontent.com/electron/electron/v45.5.0/docs/api/...` (pages: `structures/ipc-main-invoke-event`, `web-frame-main`, `web-contents`, `protocol`, `session`). |
+| Actual runtime behavior | Observed in a running Electron. | **Not exercised for every API.** |
+| Deferred integration validation | The task that will observe it. | `tasks.md` T4.2, T6.3, T7.x. |
+
+Limits:
+
+- **electronjs.org pages.** `https://www.electronjs.org/docs/latest/api/structures/ipc-main-invoke-event` was fetched with `web_fetch`. It returned only the page title and footer (the content is rendered by script), and `latest` is not pinned to 45.5.0. The rendered site is therefore not used as evidence. D2 above is the version-pinned substitute.
+- **Pages not fetched in D2:** `web-contents` sections for `will-attach-webview`, `setWindowOpenHandler` and `will-redirect`; `session` sections for `setPermissionCheckHandler` and `setPermissionRequestHandler`; `structures/custom-scheme` and `structures/privileges`; `app`. Behavior for those exists at D1 or type level only, and is labeled so.
+- **Line numbers.** The search tool does not index `node_modules` (earlier steps), so some numbers were found by reading ranges. Lines marked "exact" were confirmed with a text search in this step. Others carry "≈".
+- **No build output.** `out/` does not exist in the workspace (checked). Preload and main output names below are derived from configuration and tool source, not from a build.
+- **Validation commands.** The typecheck exit 0 recorded in `docs/engineering/m2-m3-acceptance-report.md` supports that the project code compiles against these typings. It is not a runtime result. This step ran no command.
+
+## 2. Per-API verification
+
+### 2.1 `will-frame-navigate` (design 3.3)
+
+- **Availability.** Declared on `WebContents` in 45.5.0 (`on` at exact line 18629, with `off`, `once`, `addListener`, `removeListener` after it). `will-navigate` and `will-redirect` are declared alongside. `WebviewTag` has a separate DOM-style `will-frame-navigate` (exact line 21011), which is a different API.
+- **Type-level.** `on(event: 'will-frame-navigate', listener: (details: Event<WebContentsWillFrameNavigateEventParams>) => void): this`. The params interface has `url: string`, `isSameDocument: boolean`, `isMainFrame: boolean`, `frame: WebFrameMain | null`, `initiator?: WebFrameMain | null` (≈25686). `src/main/window/navigation-guards.ts` registers the three events and reads only `details.url` and `details.preventDefault()`.
+- **Documented behavior (D1, D2).** D2 (`web-contents.md`): the event fires "when the main frame or any of its subframes attempts to navigate" and `isMainFrame` is true for the main frame. It does not fire for navigation started with `webContents.loadURL` or `webContents.back`, and not for in-page navigation (fragment, `history` API). "Calling `event.preventDefault()` will prevent the navigation." The `frame` member "may be `null` if accessed after the frame has either navigated or been destroyed". Event order for a document navigation: `did-start-navigation`, `will-frame-navigate`, `will-navigate` (main frame only), `will-redirect` (only on redirect). **Trap.** The `<webview>` variants say `preventDefault()` has no effect. That text belongs to the DOM tag, not to `WebContents`, which the guards use.
+- **Actual runtime behavior.** Not exercised. Whether `preventDefault` stops a real `location.href = 'https://…'` or an iframe navigation in the sandboxed window is unproven.
+- **Deferred validation.** T7.2 (navigation to `https:`, `http:`, `file:`, `data:`, `javascript:` stays on the app URL), after T7.0.
+- **Consequence for design.** The guard does not see the app's own `loadURL` or fragment changes. That matches design 3.3 (renderer-initiated navigation only).
+
+### 2.2 `session.setDevicePermissionHandler` and the other permission handlers (design 3.3)
+
+- **Availability.** Declared on `Session` (exact line 14309). Not deprecated, so the design's "skip only if removed" fallback does not apply. `setPermissionCheckHandler` (≈14347) and `setPermissionRequestHandler` (≈14365) are declared.
+- **Type-level.** `setDevicePermissionHandler(handler: ((details: DevicePermissionHandlerHandlerDetails) => boolean) | (null)): void`. `src/main/window/permissions.ts` passes handlers that deny; a `() => false` is assignable to each boolean-returning handler.
+- **Documented behavior (D2, `session.md`).** "Returning `true` will allow the device to be permitted and `false` will reject it." The handler gives default permissioning for `hid`, `serial` and `usb` devices without a prior request. Without it, permissions granted through device selection apply. `deviceType` is `hid`, `serial` or `usb`. For `setPermissionCheckHandler` and `setPermissionRequestHandler`, only D1 text was read (`setPermissionCheckHandler` says to also implement the request handler).
+- **Actual runtime behavior.** Not exercised. Which permission types route to which handler is documented only in part. Whether the main window uses the default session is true by construction when no `session` or `partition` is set (the `protocol.md` page states a window with a custom partition uses a different session).
+- **Deferred validation.** T7.2 (denial seen from the renderer, for example `navigator.geolocation`, `navigator.hid.requestDevice`). Handler wiring is unit tested with fakes (T2.4). S-7 (`setDisplayMediaRequestHandler` unset) needs an E2E check. D2 shows `setDisplayMediaRequestHandler(null)` resets to the default, and no handler is installed today.
+
+### 2.3 `protocol.registerSchemesAsPrivileged` (design 4)
+
+- **Availability.** Declared on `Protocol` (exact line 12440).
+- **Type-level.** `registerSchemesAsPrivileged(customSchemes: CustomScheme[]): void`. `CustomScheme` has `scheme: string` and `privileges?: Privileges` (≈7982). `Privileges` has optional booleans `standard`, `secure`, `bypassCSP`, `allowServiceWorkers`, `supportFetchAPI`, `corsEnabled`, `stream`, `codeCache`, `allowExtensions` (≈24482). `src/main/protocol/app-protocol.ts` requests only `standard`, `secure` and `supportFetchAPI`.
+- **Documented behavior (D2, `protocol.md`).** "This method can only be used before the `ready` event of the `app` module gets emitted and can be called only once." A standard scheme follows generic URI syntax and resolves relative URLs. Web storage APIs are disabled for non-standard schemes. `stream: true` is for streaming media. The page's own example for a bundle scheme uses exactly `standard`, `secure`, `supportFetchAPI`. Consequence: the composition root makes one call with all schemes (design 2 step 4).
+- **Actual runtime behavior.** Not exercised. Not verified: that `'self'` in a CSP matches `app://renderer` for a standard scheme, and that `supportFetchAPI` alone is enough for module scripts (the `corsEnabled: true` fallback in ADR 0003 stays pre-approved).
+- **Deferred validation.** T7.0, T7.2. If module scripts fail, apply the fallback and record it in ADR 0003.
+
+### 2.4 `protocol.handle` and `protocol.unhandle` (design 4)
+
+- **Availability.** `handle` at exact line 12299, `unhandle` at exact line 12496, on `Protocol`. The older `registerXxxProtocol` and `interceptXxxProtocol` families are marked `@deprecated` in the typings (D1), so `handle` is the right choice for this version.
+- **Type-level.** `handle(scheme: string, handler: (request: GlobalRequest) => (GlobalResponse) | (Promise<GlobalResponse>)): void`. `unhandle(scheme: string): void`.
+- **Documented behavior (D2).** A handler may return a `Response` or a `Promise<Response>`. `request.initiatorOrigin` is set to the issuing origin when web content made the request. It is not controlled by the page, unlike `referrer`, and the docs say to prefer it when deciding whether to serve a request. The current code does not use it (recommendation only, not a decision). `unhandle` removes a handler or a source. A protocol is registered per session (default session unless a window sets a `partition` or `session`).
+- **Experimental alternative, not adopted.** `registerSource(scheme, source)` (exact line 12462, "Experimental") serves directories without a JavaScript handler and confines the path to the route's `root`. Adopting it would change where containment is enforced and needs an ADR. The F-3 reassessment in `docs/engineering/backlog.md` may evaluate it.
+- **Actual runtime behavior.** Not exercised. Not verified: how headers set on the `Response` (`Content-Security-Policy`, `Cross-Origin-Resource-Policy`) are applied by Chromium, and the streaming and `HEAD` assumptions.
+- **Deferred validation.** T6.3 (integration, fake `fs` and a temp directory, already present), then T7.0 and T7.2 (headers on real responses).
+
+### 2.5 `WebFrameMain` properties: `parent`, `url`, `origin`, `detached` (design 3.2)
+
+- **Availability.** `WebFrameMain` and `WebContents.mainFrame` exist (`mainFrame` at exact line 19796).
+- **Type-level.** `readonly parent: (WebFrameMain) | (null)` (exact line 20300), `readonly detached: boolean` (exact line 20222), `readonly url: string` (≈20325), `readonly origin: string` (≈20288), `readonly top: (WebFrameMain) | (null)` (≈20318). Project use: `src/main/security/sender-validation.ts` reads only `parent` and `url`, through a structural `FrameLike`. `origin`, `detached`, `top` and `mainFrame` are not read in `src`.
+- **Documented behavior (D2, `web-frame-main.md`).** `frame.parent`: "the property would be `null` if `frame` is the top frame in the frame hierarchy." `frame.url`: "the current URL of the frame." `frame.origin`: serialized per RFC 6454 and "may be different from the URL"; for a child window on `about:blank`, `origin` is the parent's origin while `url` is the empty string; pages without a scheme/host/port origin give `"null"`. `frame.top`: the top frame of the hierarchy, or null. Also: "In most cases, only the main frame of a WebContents can send or receive IPC messages. However, if the `nodeIntegrationInSubFrames` option is enabled, it is possible for child frames to send and receive IPC messages also." The project sets the sub-frame node flags to false. For `detached` the only source read is D1 (typings JSDoc).
+- **Actual runtime behavior.** Not exercised. Not verified: `parent === null` for the top frame of a sandboxed window loaded from a standard custom scheme (the documentation implies it); whether `url` is updated before or after commit for a sender that runs during navigation; whether a destroyed frame throws on property access (the code fails closed with `try/catch`, which is not proof).
+- **Deferred validation.** T7.2 (the `app:get-info` round trip returns `ok` from the real top frame). No task exists for a sub-frame or foreign-origin negative E2E (see section 4).
+
+### 2.6 `IpcMainInvokeEvent.senderFrame` nullability (design 3.2, 5)
+
+- **Availability.** `IpcMainInvokeEvent` declares `senderFrame` (exact line 9557). `IpcMainEvent` declares it too (exact line 9529).
+- **Type-level.** `readonly senderFrame: (WebFrameMain) | (null)`. The `null` in the type is why `SenderEventLike` accepts `FrameLike | null | undefined` and fails closed.
+- **Documented behavior (D2, `structures/ipc-main-invoke-event.md`).** "The frame that sent this message. May be `null` if accessed after the frame has either navigated or been destroyed." The structure also has `processId`, `frameId` and `sender` (the `webContents` that sent the message).
+- **Design correction.** Design 3.2 says null happens "after the frame is destroyed". The documentation says "navigated or destroyed". Behavior of the code is unchanged because it fails closed on null. Per the code comments and the focused review, `registerHandler` runs the sender check synchronously at the top of the `ipcMain.handle` listener, before any `await`.
+- **Actual runtime behavior.** Not exercised. Not verified: how long after dispatch the value stays valid and whether property access on a destroyed frame throws.
+- **Deferred validation.** T7.2 after T4.2 (client adapter) and T3.3 (preload).
+
+### 2.7 `ELECTRON_RENDERER_URL` (design 3.1)
+
+- **Availability.** It is an electron-vite environment variable, not an Electron API.
+- **Type-level.** Not applicable. `src/main/window/load-target.ts` types it as `readonly ELECTRON_RENDERER_URL?: string | undefined`.
+- **Documented behavior (tool source, S).** In `node_modules/electron-vite/dist/chunks/lib-CLhLGLN3.js` line 66, after the renderer dev server listens: `process.env.ELECTRON_RENDERER_URL = \`${protocol}//${host}:${port}\``. Per the earlier source read, `protocol` is `https:` for an HTTPS server and otherwise `http:`, and `host` is the configured host, or `localhost` for a wildcard or non-string host. `electron.vite.config.ts` has no `server` block (checked by search for the keys used), so the default host is `localhost` (inference). `resolveLoadTarget` accepts only `http:` with `localhost` or `127.0.0.1`, so an HTTPS, IPv6 or custom host falls back to production and fails closed.
+- **Actual runtime behavior.** Not exercised. `pnpm dev` was not run. Not verified: the port when Vite moves to a free port, and whether `preview` sets the variable (the E2E harness removes it).
+- **Deferred validation.** T7.6 (interactive `pnpm dev`, dev CSP allowances measured), T7.1 and T7.2 (variable removed, production `app://`).
+
+### 2.8 Preload output name through electron-vite (design 1, 3.1)
+
+- **Availability.** electron-vite 6.0.0 builds the preload with its own factory and preset.
+- **Type-level.** Not applicable (build tool). Project config typechecks (acceptance report, exit 0).
+- **Documented behavior (config and tool source, S).** `electron.vite.config.ts` preload block: `outDir: 'out/preload'` (line 39), `externalizeDeps: false` (line 41), `output: { format: 'cjs', entryFileNames: '[name].js' }` (line 45), with input key `index`. `lib-DoUt4oMD.js` line 1670 carries `rollupOptions` into `rolldownOptions` (`??=`). The static derivation is `out/preload/index.js`, which matches the `'..', 'preload', 'index.js'` segments used from the main bundle directory (`out/main`). `externalizeDeps: false` is meant to bundle dependencies such as Zod into one file, which a sandboxed preload requires.
+- **Actual runtime behavior.** Not exercised. `out/` does not exist and `pnpm build` was not run. Not verified: that Vite 7.3.8 honors the carried options, that the emitted file is a single file with no chunk imports, that Zod is bundled, and that the file loads under `sandbox: true`.
+- **Deferred validation.** T7.0 (outputs exist), T7.5 (preload is one CommonJS file), T7.2 (the `window.necroamp` key set proves the preload ran under the sandbox).
+
+## 3. Other version-sensitive items noticed
+
+| Item | Type-level fact | Status |
+|---|---|---|
+| `will-attach-webview` | `on(event: 'will-attach-webview', …)` is declared on `WebContents`. | Declared. Behavior not verified. T7.2. |
+| `setWindowOpenHandler` | Used by `navigation-guards.ts`. Typings line not recorded in this check. | Not checked. Record at the next evidence update. |
+| `protocol` module vs `session.protocol` | `Session` has a `protocol` member. D2 says a protocol is registered per session. | The design uses the module-level `protocol` on the default session. Module export line not located. |
+| `registerSource` | Present, "Experimental" (exact line 12462). | Not used. Optional future evaluation by ADR. |
+
+## 4. Summary by evidence level
+
+Legend: Y done, - not done or not applicable, N/F not fetched.
+
+| API | Availability and type-level | D1 typings JSDoc | D2 docs at tag v45.5.0 | Tool source | Runtime |
+|---|---|---|---|---|---|
+| `will-frame-navigate` (and `will-navigate`, `will-redirect`) | Y | Y | Y (`web-contents`) | - | not exercised |
+| `setDevicePermissionHandler` | Y | Y | Y (`session`) | - | not exercised |
+| `setPermissionCheckHandler`, `setPermissionRequestHandler` | Y | Y | N/F | - | not exercised |
+| `registerSchemesAsPrivileged`, `CustomScheme`, `Privileges` | Y | Y | Y (`protocol`; structure pages N/F) | - | not exercised |
+| `protocol.handle`, `unhandle` | Y | Y | Y (`protocol`) | - | not exercised |
+| `WebFrameMain.parent`, `url`, `origin`, `top` | Y | Y | Y (`web-frame-main`) | - | not exercised |
+| `WebFrameMain.detached` | Y | Y | N/F | - | not exercised |
+| `IpcMainInvokeEvent.senderFrame` | Y | Y | Y (`ipc-main-invoke-event`) | - | not exercised |
+| `ELECTRON_RENDERER_URL` | project type only | - | - | Y | not exercised |
+| Preload output name | - | - | - | Y (static derivation) | not exercised |
+
+The electronjs.org rendered pages are not used (section 1).
+
+## 5. T2.0 criteria against the evidence
+
+| # | Criterion (tasks.md T2.0, M2 acceptance criterion 7) | Result | Reason |
+|---|---|---|---|
+| 1 | List each version-sensitive API of design 3 to 6. | Met | Section 2 covers the seven named items (eight rows, with the `WebFrameMain` and permission handler groups), plus section 3. |
+| 2 | Check the Electron 45.5.0 docs. | Met for the APIs marked Y in column D2, partly for the rest | Version-pinned documentation source was read for five pages. Items marked N/F rely on typings JSDoc only. |
+| 3 | Check the electron-vite 6.0.0 output. | Partly met | Tool source and project config read, names derived statically. No build output exists. |
+| 4 | Report page and result in the desktop-engineer final message. | Not verifiable here | The desktop-engineer hand-off is not in the repository. This file names the pages (section 1) and records the results. |
+| 5 | necro-architect records them in `docs/architecture/electron-api-verification.md`. | Met | This file. Content was produced by necro-architect and re-checked against the typings, the documentation source and the repository in a documentation closure step. |
+| 6 | A documented source check, not a runtime claim. | Met | Every API carries "not exercised" for runtime. |
+| 7 | M2 criterion 7: each UNVERIFIED API name has a documented outcome. | Met at type and documentation level | Behavioral outcomes depend on T7.x. |
+
+## 6. Findings to carry forward
+
+- `senderFrame` may be `null` after navigation as well as after destruction. Read it synchronously, as the code does.
+- `registerSchemesAsPrivileged` can be called only once and before `ready`.
+- `protocol.registerSource` is an experimental alternative. It is not adopted.
+- `request.initiatorOrigin` is available to `protocol.handle` and is not used. Possible later hardening, recommendation only.
+- No sub-frame or foreign-origin E2E exists in T7.x for the sender check. This is a gap, not a defect. Whether to add one is a human decision.
diff --git a/docs/architecture/renderer-architecture.md b/docs/architecture/renderer-architecture.md
new file mode 100644
index 0000000..3250016
--- /dev/null
+++ b/docs/architecture/renderer-architecture.md
@@ -0,0 +1,114 @@
+# Renderer architecture note (Desktop Foundation M4 and M5)
+
+Status: addendum to `.kiro/specs/desktop-foundation/design.md` sections 1, 7 and 8. It fixes details for implementers and changes no accepted decision. If this note and the design disagree, the design wins and this note is corrected. Authorities: `tech.md`, `structure.md`, `product.md`, ADR 0002 (E-ESM-1), ADR 0003 (CSP), ADR 0005 (IPC), `docs/architecture/contract-changes.md`. Owner of the code: frontend-engineer (`src/renderer/**`). The architect owns this note. Scope: placeholders only. No playback, audio, skin loading or GitHub logic.
+
+## 1. Fixed constraints
+
+- **Module format (E-ESM-1).** All TypeScript source is ESM. Renderer output stays ESM. Main and the sandboxed preload outputs may be CommonJS. Config files that are ESM use `.mjs`. `package.json` has no `"type": "module"`. Nothing in the renderer work changes this.
+- **Security flags.** `sandbox`, `contextIsolation` and `webSecurity` are never disabled, in any mode, to make the renderer easier to build or test.
+- **CSP.** Production CSP is `style-src 'self'; script-src 'self'` with no inline anything (ADR 0003, design 3.4). Therefore: no `style` prop, no inline `<style>`, no `@import`, no `data:` URLs, no remote URL. Dynamic values are written with `element.style.setProperty('--na-*', value)` from a hook.
+- **Process boundary.** The renderer imports `@shared/*` and `@renderer/*` only. No `electron`, no Node built-ins, no `@main/*`. Only `app/bridge/necroamp-client.ts` reads `window.necroamp`.
+
+## 2. Entry and shell
+
+| File | Rule |
+|---|---|
+| `src/renderer/index.html` | `lang="en"`, `<title>NecroAmp</title>`, `<div id="root">`, one module script. No meta CSP in source (the build plugin injects it). |
+| `src/renderer/main.tsx` | Creates the client, creates the store, mounts `AppShell`. Imports `global.css` once, after T5.2 exists. |
+| `src/renderer/env.d.ts` | Types `window.necroamp` as `NecroampApi | undefined` (undefined supports the "bridge missing" state, R8.10). |
+| `app/app-shell.tsx` | Header (one `h1` "NecroAmp", tagline `Code. Listen. Repeat.`, app-info and status indicators), `main` with one `RegionFrame` per layout entry. Maps `RegionId` to its region container through a `Record<RegionId, ComponentType>`. No plug-in registry (YAGNI). |
+| `app/shell-layout.ts` | `REGION_IDS`, `FOUNDATION_LAYOUT` (section 6). Pure data, no React. |
+
+## 3. Regions
+
+The six region ids in design section 7 are the stable contract and do not change in M4. The requested UI areas map to them as follows. No new region id is added.
+
+| UI area | Where it lives | Notes |
+|---|---|---|
+| Now Playing | `player` region, `data-part="now-playing"` | Placeholder title, artist and time text from `strings/en.ts`. |
+| Transport controls | `player` region, `data-part="transport"` | `ControlButton` list from `usePlayerControls()`: previous, play, pause, stop, next. `aria-disabled`, focusable, visible "Not implemented in this phase" text. Activation only updates `StatusText`. |
+| Playlist | `playlist` region | Placeholder list and empty state. |
+| Ten-band Equalizer | `equalizer` region | Ten `role="group"` bands "Band 1" to "Band 10", non-interactive placeholders, `data-part="eq-band"`. |
+| Spectrum / Waveform visualizer | `visualization` region | Two labelled placeholder panes, `data-part="spectrum"` and `data-part="waveform"`. No canvas loop, no `requestAnimationFrame`, no `AudioContext` (R8.4, R8.7). |
+| Skin selection | `skin-selector` region | Placeholder only. No skin is listed or loaded. |
+| GitHub | `github` region | Placeholder, labelled optional. Required by the existing six-region design. |
+| App info | Shell header, `data-part="app-info"` | Name, version and platform from the app-info store. |
+| Status indicators | Shell header or footer, `StatusText` with `role="status"` | Bridge state (`loading`, `loaded`, `failed`, `unavailable`) and placeholder-activation messages. |
+
+## 4. Bridge adapter and store
+
+- **Adapter** `app/bridge/necroamp-client.ts`: `createNecroampClient(win)` returns `{ getAppInfo(): Promise<ClientResult<AppInfo>> }`. It checks that `win.necroamp?.app?.getInfo` exists (otherwise returns `{ ok: false, reason: 'unavailable' }`), awaits the call inside `try/catch`, and parses the unknown value with `appInfoResponseSchema` from `@shared/ipc`. A rejection, a parse failure or `ok: false` becomes a typed failure. Messages shown to the user come from `strings/en.ts`. The adapter never logs payloads, never throws, never re-exports the raw bridge, and takes the window object as a parameter so tests use a fake.
+- **Store** `stores/app-info-store.ts`: `createAppInfoStore(client)` returns a Zustand store with `{ status: 'idle' | 'loading' | 'loaded' | 'failed' | 'unavailable', data?: AppInfo }` and `load()`. `unavailable` is added to the design's four states to implement R8.10 without a second store. It imports `@shared/*` types only. No audio, playlist or skin state exists in this phase.
+- **Hook** `useAppInfo` in `app/` binds the real client and calls `load()` once on mount. No global singleton store is created at module load, so tests inject a fake client.
+
+## 5. Separation of concerns
+
+| Layer | Files | May import | Must not |
+|---|---|---|---|
+| Behavior | `use-<name>.ts` | React, `@shared/*`, stores through selectors | JSX, CSS, `window.necroamp`, Electron |
+| State | `stores/*.ts` | `zustand`, `@shared/*`, client type | React components, DOM |
+| Privileged operations | Main only. Reached from the renderer through `necroamp-client.ts` | n/a | Any direct filesystem, network or shell access from the renderer |
+| Container | `<name>-region.tsx` | Hook, store selectors, view | Styling decisions |
+| Presentation | `<name>-view.tsx`, `*.module.css`, `components/*` | Props, `strings/en.ts`, own CSS Module | Stores, bridge, `style` prop, literal colors |
+
+Feature folders import no other feature's internals. They share through `stores/`, `components/` or `@shared/*`. A feature exposes only `index.ts`.
+
+## 6. RegionFrame and layout descriptors
+
+- **`RegionFrame`** (`components/region-frame`): presentational. Props: `id: RegionId`, `titleId`, `heading`, `children`. Renders `<section aria-labelledby>` with an `h2`, `data-testid={id}`, `data-region={id}` and `data-part` slots `frame`, `heading`, `body`. It owns no layout position and no color. Every region view renders inside it, so a skin can later restyle or replace the frame in one place.
+- **Layout descriptor** in `app/shell-layout.ts`, design level:
+
+```ts
+type RegionId = 'player' | 'playlist' | 'equalizer' | 'visualization' | 'skin-selector' | 'github';
+interface LayoutDescriptor {
+  readonly id: string;                       // layout id, kebab-case
+  readonly order: readonly RegionId[];       // DOM and tab order
+  readonly areas: Readonly<Record<RegionId, string>>; // CSS grid-area names
+}
+const FOUNDATION_LAYOUT: LayoutDescriptor;   // the only approved descriptor in this phase
+```
+
+  Rules. `order` is the DOM order and must equal the reading and tab order. Area names are written to CSS through the CSS Module, not through inline style. The descriptor holds no pixel values, no colors and no asset paths. Only `FOUNDATION_LAYOUT` is approved. Adding a second descriptor needs a design change. Region ids and `data-part` names are a public contract for the Skin Engine and are not renamed by M5 (T5 acceptance 3).
+
+## 7. Styling
+
+- **CSS Modules** for component rules. **Global CSS** (`global.css`) only for reset and base typography.
+- **Tokens** in `app/styles/tokens.css` as CSS custom properties on `:root`, namespace `--na-`. Two tiers:
+  1. *Semantic tokens* that components use: `--na-color-surface`, `--na-color-surface-raised`, `--na-color-text`, `--na-color-text-muted`, `--na-color-accent`, `--na-color-focus`, `--na-color-danger`, `--na-space-1..n`, `--na-font-family-ui`, `--na-font-size-*`, `--na-radius-*`, `--na-focus-ring`, `--na-border-width`.
+  2. *Raw values* of the neutral foundation palette, referenced only by the semantic tokens.
+  Component CSS references semantic tokens only, never raw values or literal colors. This is what lets a skin override the semantic layer at runtime.
+- No Morgul Revenant palette value and no Analog 1984 look appears in foundation CSS (design 8).
+- No animation in this phase. The first animation requires `prefers-reduced-motion` handling.
+- Layout uses named grid areas, `min-width: 0`, `overflow-wrap: anywhere`, valid at 800x600 and 1920x1080.
+- Contrast: `app/theme/contrast.ts` plus a test over token pairs (text 4.5:1, large text and focus 3:1).
+
+## 8. Skin-engine compatibility
+
+Rule: a skin is declarative data and never executable (`product.md` principle 5, `tech.md` skin rules). The foundation builds no skin code. It keeps these seams so a later skin can supply each item as data.
+
+| Skin capability | Seam kept now | Delivered later by |
+|---|---|---|
+| Custom backgrounds, textures, frames | Semantic surface tokens, `RegionFrame` `data-part` slots, no hardcoded surfaces | Skin manifest assets served through a confined skin protocol root, with CSP `img-src` extended by a design change |
+| Typography | `--na-font-family-*` and size tokens | Skin fonts through `@font-face` from the skin root, with `font-src` extended by a design change |
+| Graphical controls (knobs, diamond sliders, switches) | Behavior hooks return plain props (value, min, max, onChange). Views are replaceable | Skin-selected control views chosen from a fixed, app-shipped set. A skin selects and parameterizes, it does not supply code |
+| Control geometry and component positioning | `data-part` hooks, region ids, descriptor-based areas | A declarative layout schema in `src/shared/skins/**` (frontend-engineer, architect review) |
+| Skin-dependent layouts | `LayoutDescriptor` separates which regions exist from where they go | Additional descriptors validated by Zod, `schemaVersion` required |
+| Effects and animations | Presentation is CSS only, no per-frame JS in React | Declarative effect parameters mapped to CSS custom properties, with reduced-motion support |
+| Custom window chrome | Main-side `ChromeProfile` union with only `native` now. The shell reserves an optional `data-part="titlebar"` | Frameless profile and window-control IPC through a new contract and ADR. Draggable regions come from CSS |
+
+Constraints that stay in force: no skin script, no remote `url()`, no `@import`, path-traversal rejection, size and count limits, a license record per asset in `docs/assets.md`. None of this is built in M4 or M5.
+
+## 9. Test and review hooks
+
+- Component tests (co-located `*.test.tsx`) cover six regions, tagline, one `h1`, store states including `unavailable`, and placeholder activation updating `StatusText`. The adapter has unit tests with a fake window for: bridge missing, rejection, malformed value, `ok: false`, success. Property tests for the adapter parse (arbitrary unknown never throws) go to qa-engineer.
+- Lint and source scan forbid: `style` prop, `window.necroamp` outside the adapter, `AudioContext`, `requestAnimationFrame`, literal channel names, imports across features.
+
+## 10. Carry-forward items
+
+These are recorded decisions with owners. None changes M4 or M5 scope.
+
+| ID | Item | Owner | When |
+|---|---|---|---|
+| CF-1 | Add explicit main-frame identity validation to sender validation as defense in depth (S-1 of the focused review): require `frame === sender.mainFrame` in addition to the current checks. The current fail-closed sequence stays: non-null frame, `parent === null`, exact trusted origin, registered sender, any throw returns false. The new check is added to that sequence and never replaces an existing check. `WebContents.mainFrame` exists in Electron 45.5.0 typings (`docs/architecture/electron-api-verification.md` section 2.5), so it is compatible at type level. It is a code change to `src/main/security/sender-validation.ts` and the registration in `src/main/index.ts`, plus a unit test with `parent: null` but not `mainFrame` (expect false). Runtime behavior of `mainFrame` identity across reload and frame swap is not verified. It must pass under E2E before the check is called done, and if it rejects the legitimate main frame in any lifecycle case, stop and report instead of removing the check. | desktop-engineer, reviewed by security-reviewer. Contract note not required (no shared change). The ADR 0005 F-5 addendum is updated by necro-architect when done | Schedule before M7 so E2E covers it. Not part of M4 or M5. Needs human approval to schedule because it touches accepted M2/M3 code |
+| CF-2 | Negative E2E tests for IPC from untrusted contexts: a sub-frame and a foreign-origin page must get no bridge result or `INVALID_SENDER`, and must never reach a handler. Because `frame-src 'none'` and the navigation guards block most constructions, the test drives what the app allows and records any construction that cannot be built as "blocked by CSP or guard". | qa-engineer (M7, T7.x), with desktop-engineer for any test hook. A test hook must not weaken production code | M7 |
+| CF-3 | Keep backlog item F-3 (filesystem TOCTOU in the `app://` handler, Low, accepted temporarily) open in `docs/engineering/backlog.md`. Reassessment before the first public release is mandatory: accept permanently, implement a handle-based read, or adopt another serving mechanism (such as `protocol.registerSource`, which needs an ADR). The decision is recorded in an ADR or a security note. | desktop-engineer with security-reviewer. necro-architect writes the ADR if the serving mechanism changes | Before the first public release. Not in M4 or M5 |
diff --git a/docs/design/foundation-styling.md b/docs/design/foundation-styling.md
new file mode 100644
index 0000000..3731c00
--- /dev/null
+++ b/docs/design/foundation-styling.md
@@ -0,0 +1,125 @@
+# Foundation styling spec (M5)
+
+Status: design input for T5.1 to T5.4. Owner of the spec: art-director. Owner of the code: frontend-engineer (`src/renderer/**`). Authorities: `docs/architecture/renderer-architecture.md` sections 3, 6, 7, 8 (cited, not repeated), `tech.md` skin rules, `product.md` principle 5 and 6.
+
+This is a neutral foundation theme. It is not Morgul Revenant and not Analog 1984. It carries no bundled art, no font file and no remote resource, so it adds no asset-register entry. Fonts are system stacks only (open decision 14 is not triggered).
+
+## 1. Design intent
+
+A compact desktop player: a dense, fixed-feeling deck where the Now Playing display dominates, transport is second, and playlist, equalizer and visualizer fill the rest. Panels read as hardware modules (inset wells, thin bevel lines), not as web cards. No gradients that imply a skin identity, no animation.
+
+## 2. Tokens (`app/styles/tokens.css`, namespace `--na-`)
+
+Tier 1, raw values (referenced only by tier 2):
+
+| Raw | Value |
+|---|---|
+| `--na-raw-ink-0` | `#0d1012` |
+| `--na-raw-ink-1` | `#121417` |
+| `--na-raw-ink-2` | `#1a1d21` |
+| `--na-raw-ink-3` | `#232830` |
+| `--na-raw-line-1` | `#2c323b` |
+| `--na-raw-line-2` | `#6b7482` |
+| `--na-raw-fog-1` | `#e6e9ee` |
+| `--na-raw-fog-2` | `#9aa3ae` |
+| `--na-raw-fog-3` | `#7a8391` |
+| `--na-raw-teal` | `#5cc8c0` |
+| `--na-raw-blue` | `#7fb4ff` |
+| `--na-raw-red` | `#ff8a80` |
+
+Tier 2, semantic (the only tokens components may use):
+
+| Semantic token | Raw | Use |
+|---|---|---|
+| `--na-color-app-bg` | ink-1 | window background |
+| `--na-color-surface` | ink-2 | region body, well |
+| `--na-color-surface-raised` | ink-3 | buttons, headings strip |
+| `--na-color-surface-inset` | ink-0 | display, visualizer, EQ track |
+| `--na-color-border-subtle` | line-1 | decorative dividers only |
+| `--na-color-border-control` | line-2 | boundary of any interactive or meaningful control |
+| `--na-color-text` | fog-1 | primary text |
+| `--na-color-text-muted` | fog-2 | secondary text |
+| `--na-color-text-disabled` | fog-3 | disabled text (always paired with a non-color cue) |
+| `--na-color-accent` | teal | active state, EQ fill, display value |
+| `--na-color-on-accent` | ink-0 | text on accent fill |
+| `--na-color-focus` | blue | focus ring |
+| `--na-color-danger` | red | failed state text |
+
+Scales: `--na-space-1..6` = 2, 4, 8, 12, 16, 24 px. `--na-radius-1..2` = 2, 4 px. `--na-border-width` = 1px. `--na-focus-ring-width` = 2px, `--na-focus-ring-offset` = 2px. `--na-control-size` = 36px (transport hit area, min 32px), `--na-font-size-1..4` = 11, 12, 14, 20 px (display). Family tokens: `--na-font-family-ui` = `system-ui, "Segoe UI", Roboto, sans-serif`; `--na-font-family-mono` = `ui-monospace, "Cascadia Mono", Consolas, monospace` (time and values, tabular numerals). Minimum text size is 11px, used only for uppercase labels; body is 12px or more.
+
+Rules: no literal color, no raw token and no pixel color in any `*.module.css`. A skin later overrides tier 2 only.
+
+## 3. Composition
+
+Window minimum 800x600 (design 8). `FOUNDATION_LAYOUT` areas are named in the CSS Module; the descriptor carries no pixels.
+
+```
+"player        player        player"
+"playlist      visualization equalizer"
+"playlist      visualization equalizer"
+"skin-selector skin-selector github"
+```
+
+Columns `minmax(0,1.3fr) minmax(0,1.2fr) minmax(0,1fr)`; rows `auto 1fr 1fr auto`; gap `--na-space-3`; app padding `--na-space-3`. The `player` row is the visual top deck: Now Playing display on the left (inset well, mono time at `--na-font-size-4`), transport row to the right, then a placeholder seek line. `skin-selector` and `github` are shrunk to a compact footer row. At widths under 900px the grid collapses to two columns with `player` full width; DOM order stays equal to tab order. Every region scrolls inside its own body (`overflow: auto`, `min-width: 0`), never the page.
+
+Shell header: a slim strip with the wordmark text "NecroAmp" (`h1`, text only, no logo asset), the tagline muted, app info and status right aligned. Reserve an empty `data-part="titlebar"` hook; no drag region now.
+
+## 4. RegionFrame and part contract
+
+`RegionFrame` keeps `data-part` slots `frame`, `heading`, `body`. Styling rules:
+
+- `frame`: `surface` background, 1px `border-subtle`, 2px radius, plus a 1px top highlight line using `border-subtle` to read as a module.
+- `heading`: `surface-raised` strip, uppercase 11px, letter-spacing 0.08em, `text-muted`. This is a 4.5:1 text pair (section 7).
+- `body`: padding `--na-space-3`.
+
+Part names are a Skin Engine contract and are not renamed.
+
+## 5. Control specs
+
+All controls are CSS-only shapes (no image, no inline SVG with style attributes). Behavior stays in hooks so a skin can later swap views.
+
+| Control | Shape and size | Normal | Hover | Pressed | Focus | Disabled or unimplemented | Active |
+|---|---|---|---|---|---|---|---|
+| Transport button (previous, play, pause, stop, next) | Rounded square, 36x36 hit area, 20px glyph drawn with CSS borders or an accessible text glyph. Play is 44x36 and visually dominant. | `surface-raised`, 1px `border-control` | border and glyph shift to `text` plus `surface` lightened via an inset line | inset 1px shadow-free: swap to `surface-inset`, glyph moves 1px down | 2px `focus` ring, 2px offset, never removed | `aria-disabled`, `text-disabled`, dashed border (shape cue, not color only), remains focusable | `accent` bottom bar 3px plus `aria-pressed` |
+| Now Playing display | Inset well, 2px radius, mono time 20px | `surface-inset`, `accent` time digits, `text` title, `text-muted` artist | none | none | not focusable | placeholder text states "No track loaded" | n/a |
+| Seek placeholder | 6px track, 12px non-interactive thumb | `border-control` outline track | none | none | none (non-interactive, `aria-hidden` or labelled static) | always inert | n/a |
+| EQ band (10) | Vertical track 6x96px, 14x8 thumb, label below, "Band n" group | `surface-inset` track, `border-control` outline, thumb `text-muted` | none | none | `focus` ring if made focusable later | inert placeholder, label `text-muted` | fill `accent` |
+| Playlist row | 28px row, index, title, duration (mono, right) | `surface` | `surface-raised` | n/a | 2px inset `focus` ring | n/a | selected: `accent` left bar 3px plus bold title |
+| Visualizer pane | Inset frame, 1px `border-control`, centered caption | `surface-inset` | n/a | n/a | n/a | caption "Not implemented in this phase" | n/a |
+| Status text | `role="status"`, 12px | `text-muted` | n/a | n/a | n/a | failed: `danger` text plus "Error:" prefix | n/a |
+
+State differences never rely on color alone: disabled uses dashed border, pressed uses inset plus offset, active uses a bar, failed uses a text prefix.
+
+## 6. Skin seams that M5 must preserve
+
+Checked against `renderer-architecture.md` section 8. Backgrounds, textures and frames: surfaces only via tier 2 tokens, so a later `--na-texture-*` or `background-image` token can be added to `frame` without edits to components. Typography: family and size tokens. Graphical controls: views only consume props. Geometry and positioning: grid area names plus `--na-control-size`, `--na-space-*`, `--na-radius-*`. Layouts: descriptors. Effects and animations: none now; any later animation must honor `prefers-reduced-motion: reduce`. Window chrome: `titlebar` hook reserved. Nothing here sets `style`, `@import`, `url()` or `data:`.
+
+## 7. Contrast report (WCAG 2.x)
+
+Method: relative luminance L per WCAG 2.x from sRGB hex, ratio = (L1 + 0.05) / (L2 + 0.05). Computed by hand, rounded to one decimal; qa-engineer must automate the same pairs in `app/theme/contrast.ts` tests and treat a mismatch as a bug in this table.
+
+| Pair (foreground on background) | Ratio | Threshold | Result |
+|---|---|---|---|
+| `text` on `app-bg` | 15.2 | 4.5 | pass |
+| `text` on `surface` | 13.9 | 4.5 | pass |
+| `text` on `surface-raised` | 12.2 | 4.5 | pass |
+| `text-muted` on `app-bg` | 7.2 | 4.5 | pass |
+| `text-muted` on `surface` | 6.6 | 4.5 | pass |
+| `text-muted` on `surface-raised` | 5.8 | 4.5 | pass |
+| `text-disabled` on `surface-raised` | 3.9 | none (disabled exempt) | informational |
+| `accent` on `surface` | 8.4 | 4.5 | pass |
+| `accent` on `surface-inset` | about 9.5 | 4.5 | pass |
+| `on-accent` on `accent` | 9.5 | 4.5 | pass |
+| `danger` on `surface` | 7.4 | 4.5 | pass |
+| `border-control` on `surface-raised` | 3.1 | 3 (component boundary) | pass, thin margin |
+| `border-control` on `surface` | 3.6 | 3 | pass |
+| `focus` on `app-bg` | 8.7 | 3 (focus indicator) | pass |
+| `focus` on `surface-raised` | 7.0 | 3 | pass |
+
+`border-subtle` is decorative and is never the only boundary of a control. If the `border-control` margin on `surface-raised` is lost to a change, raise `line-2` rather than lower the threshold. Forced-colors mode: add `@media (forced-colors: active)` rules that keep borders and focus rings using system colors (`CanvasText`, `Highlight`).
+
+## 8. Out-of-scope requests (owners)
+
+- All `src/renderer/**` CSS, tokens, components and tests: frontend-engineer. I cannot write there or run commands, so this spec is the hand-off.
+- `app/theme/contrast.ts` and its test: frontend-engineer (code), qa-engineer (property or table tests).
+- Visual check by screenshot at 800x600 and 1920x1080: qa-engineer or orchestrator, after build.
diff --git a/docs/engineering/backlog.md b/docs/engineering/backlog.md
index 36f4efc..a4e0f3d 100644
--- a/docs/engineering/backlog.md
+++ b/docs/engineering/backlog.md
@@ -1,26 +1,70 @@
-# NecroAmp Engineering Backlog
+# NecroAmp Engineering Backlog

+

+## Phase 03: non-blocking skill review findings

+

+Source: `docs/engineering/reviews/review-gate-final.json`, a preserved copy of the workflow artifact `.agents/tasks/engineering-skills/review-gate-final.json` (verdict APPROVED, 16 non-blocking entries; F5 and A5 are one combined entry). Detailed reports: `docs/security/skills-review-final.md`, `docs/testing/skills-qa-review-final.md`. None blocks Phase 03.

+

+| ID | Severity | Owner | Area | Finding | Status |

+|---|---|---|---|---|---|

+| F1 | Medium | desktop-engineer, qa-engineer | electron-security credential storage | Linux `safeStorage` can report encryption available while the backend is `basic_text`. | Decided in ADR 0001 (fail closed). Skill text updated. Implementation and tests are open. |

+| A1 | Medium | human | agent skill mapping | Not shown that each agent loads only its mapped skills. Run the manual activation test in `docs/engineering/skill-catalog.md` and record the results in the journal. | Open. Runtime test not performed. |

+| F2 | Low | release-engineer | YAML validation | The security review ran no YAML parser. QA ran PyYAML on 7 skills and 9 agents and it passed. | Largely closed. Add a YAML lint to CI once CI exists. |

+| F3 | Low | orchestrator | staging copies | Staging copies could drift from `.kiro/skills`. | Resolved. Removed after a SHA-256 equivalence check (`docs/engineering/skills-staging-inventory.md`). |

+| F4 | Low | audio-engineer | audio-processing | Preamp placement is unspecified and may add a node beyond the `tech.md` graph. | Open. |

+| F5/A5 | Low | necro-architect | github-integration cross-skill link | The credential-notes link only works when both skills are present. | Partly resolved. The reference now names the `electron-security` dependency explicitly, with both workspace and relative paths. Portability when the skill is copied alone remains a limitation. |

+| F6 | Info | desktop-engineer, github-engineer, frontend-engineer | wf-coder-authored skills | `electron-security`, `github-integration` and `typescript-standards` were written by wf-coder. The owner agents should read them once. | Open. |

+| A2 | Low | necro-architect | qa-engineer and security-reviewer agent prompts | "Do not invent Skills..." could be read as a reason to ignore the new skills. | Open. Needs a prompt wording change, which is out of Phase 03 scope. |

+| A3 | Low | necro-architect | github-integration, typescript-standards | The skills name other skills that their agents are not mapped to (name references only). | Open, accepted. |

+| A4 | Low | necro-architect | audio-engineer mapping | `audio-engineer` is not mapped to `electron-security`. Acceptable because the skill delegates. | Accepted. |

+| A7 | Low | desktop-engineer | electron-security | No guidance on privileged custom-scheme registration flags. | Open. Address when the protocol is implemented. |

+| A8 | Low | audio-engineer, qa-engineer | audio-processing equalizer notes | Invariant 7 fails when Nyquist is below 20 Hz. Restrict property-test sample rates (for example 8000 to 192000). | Open. |

+| A9 | Low | release-engineer | cross-platform-packaging CI | A macOS x64 cross-build on Apple silicon is not proven to produce a launchable binary. | Open. Verify on a native x64 runner or with an architecture check plus a launch smoke test. |

+| A10 | Info | none | typescript-standards | The broadest description, so it may activate on most TypeScript edits. | Watch during the activation test. |

+| A11 | Info | none | skin-development | Stricter than `tech.md` and consistent with it. | No action. |

+| GAP-1 | Info | qa-engineer, security-reviewer | review coverage | 21 reference files were not all read line by line. `testing-strategy` was reviewed by security only. | Open. Cover in the next review touching these files. |

+

+The QA advisories A2 to A9 in the QA report map to the IDs above. A6 does not appear in the gate file.

+

+## Desktop Foundation M2/M3: accepted temporary risks and downstream validation

+

+Source: `docs/security/m2-m3-security-review.md` (canonical combined review, findings F-1 to F-8). Human decision: implementation acceptance of M2 and M3, not runtime acceptance.

+

+### F-3: filesystem TOCTOU in the `app://` handler (Low, accepted temporarily)

+

+Status: **accepted temporarily for Desktop Foundation. Not resolved.** Mandatory reassessment before the first public release (owner: desktop-engineer with security-reviewer; decision recorded in an ADR or a security note). The protocol code is unchanged by this decision.

+

+- **Location.** `src/main/protocol/app-protocol.ts`, the sequence `realpath`, `stat`, `readFile` on a path (review cites about L98 to L113).

+- **Preconditions.** A local process that can write inside the app's own output directory (the unpacked `out/renderer` tree, or the installed resources) must replace a file or directory component with a symlink or junction between the containment check and the read. No renderer-supplied input can create that condition.

+- **Affected boundary.** Confinement of served files to the renderer root. A successful swap could return a file outside the root to the renderer through `app://renderer`.

+- **Current mitigations.**

+  - The URL path is validated lexically before any filesystem access (no traversal, encoded separators, backslashes, dotfiles, reserved device names, extension allow-list).

+  - The root is resolved once. Each file's `realpath` must be inside the root. The file must be a regular file of at most 5 MiB.

+  - Every rejection returns 404 without detail.

+  - The renderer is sandboxed and has no filesystem or network access of its own. Only GET and HEAD are served.

+  - An attacker with write access to the install directory can already replace the application's code, so the residual gain is small.

+- **Residual risk.** A narrow race window remains between the checks and the read. The effect is limited to disclosure of a file readable by the user running the app, and only to that app's own renderer.

+- **Proposed mitigation (not implemented).** Open the file once, `fstat` the handle, and read through the same handle. Compare the handle's identity (device and inode where available) and the resolved path of the opened file against the root.

+- **Limitations of that mitigation.**

+  - Windows semantics differ: there is no inode comparison in the POSIX sense, and resolving the final path of an open handle needs a platform-specific step. Behavior on NTFS junctions and reparse points must be tested on a real Windows host (the two real-symlink tests are skipped on this host).

+  - Node has no atomic "open below this directory" primitive. Directory components can still be swapped before the open, so the approach narrows the race and does not remove it.

+  - It adds cost: handle lifetime management, streaming or bounded reads through the handle, and more test fixtures. `protocol.registerSource` (experimental in Electron 45.5.0) moves containment into Electron and could be evaluated instead; adopting it needs an ADR (see `docs/architecture/electron-api-verification.md`, section 2.4).

+- **Reassessment gate.** Before the first public release, decide among accept permanently, implement the handle-based read, or adopt a different serving mechanism. Until then F-3 stays open in this table.

+

+### Downstream validation duties from the accepted findings

+

+| ID | Finding | Required validation | Task |

+|---|---|---|---|

+| F-4 | Dev CSP allows `unsafe-inline` for scripts and styles on design grounds only. | Run `pnpm dev`, remove each allowance the pinned Vite and React plugin does not need, record the result. | T7.6 |

+| F-7 | Fuses, ASAR integrity, `realpath` against the ASAR layout, and `devTools` in production builds are not part of M2/M3. | Cover in the packaging review. | M7, M8, release-engineer |

+| F-8 | Not verified at runtime: `'self'` matching `app://renderer`; module scripts without `corsEnabled`; sandboxed preload with bundled Zod; meta CSP in built HTML. | Verify against the built app and E2E. If module scripts fail, apply the `corsEnabled` fallback (ADR 0003 item 3) and amend the ADR. | T7.0, T7.2, T7.5 |

+| F-6 | Environment variables honored only when unpackaged. | No action. | none |

+

+F-1 and F-2 are corrected in code with regression tests (accepted by the human). F-5 is accepted and recorded in ADR 0005.

-## Phase 03: non-blocking skill review findings
-
-Source: `docs/engineering/reviews/review-gate-final.json`, a preserved copy of the workflow artifact `.agents/tasks/engineering-skills/review-gate-final.json` (verdict APPROVED, 16 non-blocking entries; F5 and A5 are one combined entry). Detailed reports: `docs/security/skills-review-final.md`, `docs/testing/skills-qa-review-final.md`. None blocks Phase 03.
-
-| ID | Severity | Owner | Area | Finding | Status |
-|---|---|---|---|---|---|
-| F1 | Medium | desktop-engineer, qa-engineer | electron-security credential storage | Linux `safeStorage` can report encryption available while the backend is `basic_text`. | Decided in ADR 0001 (fail closed). Skill text updated. Implementation and tests are open. |
-| A1 | Medium | human | agent skill mapping | Not shown that each agent loads only its mapped skills. Run the manual activation test in `docs/engineering/skill-catalog.md` and record the results in the journal. | Open. Runtime test not performed. |
-| F2 | Low | release-engineer | YAML validation | The security review ran no YAML parser. QA ran PyYAML on 7 skills and 9 agents and it passed. | Largely closed. Add a YAML lint to CI once CI exists. |
-| F3 | Low | orchestrator | staging copies | Staging copies could drift from `.kiro/skills`. | Resolved. Removed after a SHA-256 equivalence check (`docs/engineering/skills-staging-inventory.md`). |
-| F4 | Low | audio-engineer | audio-processing | Preamp placement is unspecified and may add a node beyond the `tech.md` graph. | Open. |
-| F5/A5 | Low | necro-architect | github-integration cross-skill link | The credential-notes link only works when both skills are present. | Partly resolved. The reference now names the `electron-security` dependency explicitly, with both workspace and relative paths. Portability when the skill is copied alone remains a limitation. |
-| F6 | Info | desktop-engineer, github-engineer, frontend-engineer | wf-coder-authored skills | `electron-security`, `github-integration` and `typescript-standards` were written by wf-coder. The owner agents should read them once. | Open. |
-| A2 | Low | necro-architect | qa-engineer and security-reviewer agent prompts | "Do not invent Skills..." could be read as a reason to ignore the new skills. | Open. Needs a prompt wording change, which is out of Phase 03 scope. |
-| A3 | Low | necro-architect | github-integration, typescript-standards | The skills name other skills that their agents are not mapped to (name references only). | Open, accepted. |
-| A4 | Low | necro-architect | audio-engineer mapping | `audio-engineer` is not mapped to `electron-security`. Acceptable because the skill delegates. | Accepted. |
-| A7 | Low | desktop-engineer | electron-security | No guidance on privileged custom-scheme registration flags. | Open. Address when the protocol is implemented. |
-| A8 | Low | audio-engineer, qa-engineer | audio-processing equalizer notes | Invariant 7 fails when Nyquist is below 20 Hz. Restrict property-test sample rates (for example 8000 to 192000). | Open. |
-| A9 | Low | release-engineer | cross-platform-packaging CI | A macOS x64 cross-build on Apple silicon is not proven to produce a launchable binary. | Open. Verify on a native x64 runner or with an architecture check plus a launch smoke test. |
-| A10 | Info | none | typescript-standards | The broadest description, so it may activate on most TypeScript edits. | Watch during the activation test. |
-| A11 | Info | none | skin-development | Stricter than `tech.md` and consistent with it. | No action. |
-| GAP-1 | Info | qa-engineer, security-reviewer | review coverage | 21 reference files were not all read line by line. `testing-strategy` was reviewed by security only. | Open. Cover in the next review touching these files. |
-
-The QA advisories A2 to A9 in the QA report map to the IDs above. A6 does not appear in the gate file.
+### Block C status of the downstream duties (fresh run, Windows x64)
+- F-3 stays open: mandatory reassessment before the first public release. No code change.
+- F-8: runtime-verified by the 35 E2E tests and the preview run (module scripts and 'self' on pp://renderer, sandboxed preload with bundled Zod, meta CSP in built HTML). The corsEnabled fallback was not needed.
+- F-4: still open until the human pnpm dev run (T7.6).
+- F-7 and all packaging-specific checks (fuses, ASAR integrity, 
ealpath on the ASAR layout, production devTools, installers, signing, auto-update, Linux targets, macOS x64 cross-build): DEFERRED.
+- No CI exists (.github/workflows is absent). Add the CI workflow (including YAML lint, F2) before release.
+- Open items from the final delivery: T5.5 seam review, T7.5 build validation document, T8.1 to T8.4 reviews, manual skill activation test (A1).
diff --git a/docs/engineering/desktop-foundation-delivery-report.md b/docs/engineering/desktop-foundation-delivery-report.md
new file mode 100644
index 0000000..d10274e
--- /dev/null
+++ b/docs/engineering/desktop-foundation-delivery-report.md
@@ -0,0 +1,102 @@
+# Desktop Foundation delivery report
+
+Branch: `feature/desktop-foundation`. Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0. Status as of Block C (M8 preparation). Committed and pushed at the end of Block C (see section 8).
+
+Labels: IMPLEMENTED, TESTED, RUNTIME VERIFIED, INTEGRATION PENDING, DEFERRED, BLOCKED, COMPLETE. A task is not ticked because a file exists.
+
+## 1. Delivery status M0 to M8
+
+| Milestone | Label | Evidence and gaps |
+|---|---|---|
+| M0 Dependency bootstrap | COMPLETE | `m0-closure-validation.md`, `docs/engineering/m0-m1-acceptance-report.md`. Lockfile frozen install re-run fresh: exit 0. |
+| M1 Repository scaffold | COMPLETE | Same acceptance report. Toolchain commands re-run fresh below. |
+| M2 Electron main process | COMPLETE (RUNTIME VERIFIED on Windows) | Security review `docs/security/m2-m3-security-review.md`. Runtime items closed by E2E. Real-symlink containment and packaging checks stay DEFERRED. |
+| M3 Shared contracts and preload | COMPLETE (RUNTIME VERIFIED on Windows) | Sandboxed preload loads and the bridge reports Connected in the E2E and preview run. Sender validation requires main-frame identity (commit `55c38d4`). |
+| M4 Renderer shell | COMPLETE | Six regions plus header. T4.1 to T4.8 ticked. |
+| M5 Styling foundation | IMPLEMENTED, TESTED. T5.5 DEFERRED | Tokens, CSS Modules, WCAG contrast function. T5.5 (seam review, optional) is not written: `desktop-foundation-skin-seams.md` does not exist. |
+| M6 Tests | COMPLETE | Property, static, integration, jsdom a11y tests, coverage gate, traceability file. |
+| M7 Smoke and production build | INTEGRATION PENDING | T7.0 to T7.4 done. T7.5 COMPLETE (`docs/release/desktop-foundation-build-validation.md`). T7.6 PENDING: bounded `pnpm dev` startup and shutdown verified, console, HMR and CSP-need evidence need a human (see tasks.md). T7.7 matrix ran fresh on Windows (section 3). macOS and Linux NOT VERIFIED. |
+| M8 Final review and integration | INTEGRATION PENDING | T8.1 to T8.4 and T8.6 not done: no final review workflow run, no `docs/security/desktop-foundation-final.md`, no architecture gate document, no human approval. T8.5 is done by this step (README, ADR notes, backlog, journal, this report). `docs/security/desktop-foundation-final-review.json` does not exist, so there are no final review findings to repair. |
+
+Placeholder regions only: the feature areas are not implemented in this phase. Player, playlist, equalizer, visualizer, skins and GitHub show "Not implemented in this phase". No audio engine, no playlist logic, no skin loading, no GitHub calls.
+
+### Regions
+
+Header (name, tagline, version, platform, bridge status, audio engine status) and six regions: Player, Playlist, Visualizer (Spectrum, Waveform placeholders), Equalizer (ten bands 31 Hz to 16 kHz, "Not available"), Skins, GitHub (optional, signed-out text). Controls are present and disabled-style placeholders.
+
+### Architecture and skin compatibility
+
+- Three process boundaries kept (main, sandboxed preload as one CommonJS file, renderer ESM). ADR 0002 to 0005 describe them. `sandbox`, `contextIsolation`, `webSecurity` are on.
+- The renderer is served from `app://renderer` with a meta CSP (`default-src 'none'; script-src 'self'; style-src 'self'; ... connect-src 'none'`). Built `index.html` has one external module script and no inline script.
+- Skin compatibility: colors, spacing and typography are CSS custom properties (`app/styles/tokens.css`), views use CSS Modules, and strings are centralized. This is seam-ready only. No skin manifest, loader or schema exists. Compatibility with the Skin Engine is a design intent, not tested against a skin. The seam review (T5.5) is open.
+
+## 2. Runtime launch
+
+- Result: RUNTIME VERIFIED on Windows x64. `electron-vite preview` on the production build opened a `NecroAmp` window (Block A and Block B), and 35 Playwright Electron tests launched the built app (title, six regions, lifecycle, security checks, axe scan).
+- Manual launch command (from the repo root, after `pnpm.cmd install --frozen-lockfile`):
+
+```powershell
+pnpm.cmd build; pnpm.cmd exec electron-vite preview
+```
+
+- `pnpm dev` (T7.6): a bounded run started the app (window `NecroAmp`, dev server on 5173) and the process tree was killed cleanly. Renderer console, HMR and the `style-src` need were not observed, so T7.6 stays PENDING for the human.
+- Screenshot: `docs/engineering/screenshots/m7-preview-production-shell.png` (1084x655). Block C viewed it: it shows the real NecroAmp shell (header, Player, Playlist, Visualizer, Equalizer, Skins, GitHub regions, "Application bridge Connected", Platform Windows, Version 0.0.0). It was captured during the preview run in Block B (file time 2026-11-26 14:38); the capture command is not recorded. This step did not capture a new one.
+
+## 3. Validation (fresh, Block C, same tree as HEAD `40bf76e`, no uncommitted source changes)
+
+| Command | Exit | Result |
+|---|---|---|
+| `pnpm.cmd typecheck` | 0 | |
+| `pnpm.cmd lint` | 0 | |
+| `pnpm.cmd format:check` | 0 | Run before this step's doc edits; re-run recorded in section 7 if docs were reformatted. |
+| `pnpm.cmd test` | 0 | 52 files, 768 passed, 2 skipped (770) |
+| `pnpm.cmd test:coverage` | 0 | Statements 99.44 (542/545), branches 98.23 (279/284), functions 100 (156/156), lines 99.78 (470/471). Thresholds 80/80/80/75 global, 95 on critical files, unchanged. |
+| `pnpm.cmd build` | 0 | main, preload, renderer outputs produced |
+| `pnpm.cmd test:e2e` | 0 | 35 passed, about 1.8 min, 1 worker |
+| `pnpm.cmd licenses list --prod` | 0 | zod, zustand, react, react-dom, scheduler, csstype, @types/react: all MIT. No GPL, UNLICENSED or Unknown in the full list. |
+| `pnpm.cmd install --frozen-lockfile --offline` | 0 | "Already up to date" |
+
+- Skipped tests: the two real-symlink tests (no symlink privilege on this host).
+- Accessibility: jsdom conformance tests (R8.5, R8.8, R8.9) and the Playwright axe scan (T7.4) pass. `axe-core` does not appear in `out/`.
+- Build observations: `out/main/index.js` 24 KB, `out/preload/index.js` 175 KB (starts with `"use strict"; require("electron")`, so a single CommonJS file with bundled Zod), `out/renderer/index.html` with meta CSP, one CSS and one JS asset, no `.map` files.
+- Platforms: Windows x64 only. macOS and Linux: NOT VERIFIED.
+- Historical versus fresh: everything in this table was run in Block C. The M0 to M3 acceptance reports, the M2/M3 security review and the Block A and B journal numbers are historical. Block A recorded 625 tests (42 files); Block B and this run record 768.
+
+## 4. Security
+
+- Verdict: no final security review exists for the whole application (T8.3 not done). The last formal verdict is the M2/M3 review: APPROVED, zero blockers. Block B's code review verdict was APPROVED with no findings. Treat the security status as "implementation reviewed, final gate pending".
+- Findings carried: F-3 (filesystem TOCTOU in the `app://` handler, Low, accepted temporarily, mandatory reassessment before the first public release, see `docs/engineering/backlog.md`). F-4 (dev CSP `unsafe-inline`) awaits T7.6. F-7 (fuses, ASAR integrity, `devTools` in production) awaits packaging review. F-8 is largely closed by E2E (`app://renderer` with `'self'`, module scripts, sandboxed preload with bundled Zod, meta CSP in built HTML all work at runtime); the `corsEnabled` fallback was not needed.
+- Residual risks: F-3 race window; Linux `safeStorage` `basic_text` backend (ADR 0001, implementation open, no token storage exists yet); unsigned, unpackaged builds only.
+- Deferred packaging checks (stay deferred): fuses, ASAR integrity, `realpath` against the ASAR layout, `devTools` in production, installers, signing, auto-update, Linux targets, macOS x64 cross-build.
+- Lockfile integrity: `pnpm install --frozen-lockfile --offline` exits 0 against the committed lockfile. Lifecycle scripts are deny-by-default (ADR 0004); the esbuild postinstall is functionally exercised because the build works.
+- Secret scan: Block B scanned changed and untracked text files for common secret patterns and found nothing. Block C did not rescan.
+
+## 5. Kiro evidence
+
+- Workflows: `git-reconcile` (Block A). The `quality-review` workflow (T8.2) has NOT been run.
+- Agents actually invoked (from the journal): `necro-architect`, `frontend-engineer`, `art-director`, `wf-code-reviewer` (Block A); `qa-engineer`, `desktop-engineer`, `frontend-engineer`, and a Block B reviewer (Block B). Earlier phases used release-engineer, security-reviewer and others; see `docs/kiroween/kiro-journal.md`. No agent was invoked in Block C. The Block B agent names were copied from the Block A list by the prior step and are only partly confirmed.
+- Skills actually loaded: `testing-strategy` (qa-engineer, Block B) is the only one the journal confirms. Per-agent skill mapping has not been runtime-tested (backlog A1).
+- Decisions: ADR 0001 to 0005; Electron 45.5.0 pin; ESM exception E-ESM-1 (CommonJS main and preload); F-3 accepted temporarily; defects 0001 to 0004 fixed.
+
+## 6. GitHub (to be completed by the delivery step)
+
+- PR: draft PR #5 on `Hugo-BerC/necroamp`, base and head to be confirmed. Block B updated its body with `gh pr edit` (exit 0, not re-read).
+- Pending: CI status (there is no `.github/workflows` directory, so no CI exists and no required checks can run), merge decision, final PR body, whether the PR leaves draft. Merge only if branch protection and checks allow it.
+
+## 7. Remaining work and required human actions
+
+1. Human: run `pnpm dev` once (T7.6) and record whether `unsafe-inline` is needed (F-4).
+2. Write `docs/release/desktop-foundation-build-validation.md` (T7.5, release-engineer), using section 3 as input.
+3. Run `quality-review` (T8.1, T8.2), then `docs/security/desktop-foundation-final.md` (T8.3) and the architecture gate (T8.4). T8.1 needs a base ref from the human.
+4. Human final approval (T8.6). Confirm hooks `post-task-quality` and `ipc-security-check` stay disabled.
+5. Optional: T5.5 seam review.
+6. Before the first public release: reassess F-3; run the packaging checks; verify macOS and Linux; add CI.
+7. Run the manual skill activation test (backlog A1).
+
+## 8. Integration status (final)
+
+- Commits: Block B `55c38d4`, `f5be83e`, `a695cc1`, `40bf76e`. Block C `d062b30` (security review), `ddea85a` (release docs), `af7fd19` (status reconciliation).
+- PR: https://github.com/Hugo-BerC/necroamp/pull/5 (draft, base `main` = `66f9f7f`, 10+ commits ahead, mergeable CLEAN).
+- CI: ABSENT. No `.github/workflows` exists, `gh pr checks` reports no checks, and the PR has no status check rollup. This is not a pass.
+- Merge: NOT MERGED. Blockers: T7.6 (human `pnpm dev` observation), T7.7 (depends on T7.6), T8.2 quality-review workflow, T8.4 architecture gate, T8.6 human approval. Section 5 ("T5...") of the human message was cut off and is pending.
+- Launch (production build): `pnpm.cmd build; pnpm.cmd exec electron-vite preview`. Development: `pnpm.cmd dev`.
diff --git a/docs/engineering/m0-m1-acceptance-report.md b/docs/engineering/m0-m1-acceptance-report.md
new file mode 100644
index 0000000..05be3cf
--- /dev/null
+++ b/docs/engineering/m0-m1-acceptance-report.md
@@ -0,0 +1,99 @@
+# M0/M1 Acceptance Report (Desktop Foundation)
+
+Branch: `feature/desktop-foundation`. Nothing committed or pushed.
+
+## Verdict
+- **M0 (final, 2026-11-26): COMPLETE.** T0.1 to T0.8 are all ticked with evidence. All four human gates are resolved (below). The human accepted `docs/security/m0-security-review.md` as the canonical T0.6 deliverable; a factual addendum documents the root `.npmrc` (exactly `engine-strict=true`).
+- **M1: acceptance criteria met.** The five criteria in `tasks.md` (M1) hold: `pnpm lint` exit 0, `pnpm format:check` exit 0, `pnpm test` 1 file and 9 tests passed including the alias-consistency test, the three alias tables are identical, and `pnpm typecheck` exit 0. T1.1 to T1.7 are ticked. The earlier finding F1 ("M1 source files missing") was wrong: `tasks.md` assigns main, preload and renderer entry points to M2 to M4 and defers the whole-application build to T7.0, and M1 expected only the seed files `src/main/constants.ts` and `src/shared/ipc/channels.ts`, which exist. F1 is withdrawn and is not an M1 failure.
+- **Deferred by design, not failures:** `pnpm build` (T7.0, needs M2 to M5 entries), Playwright E2E (T7.1 to T7.7), the M1 gates that need a build (bridge under `sandbox: true`, web preferences test, electron-vite 6 config load, ESM-only main dependencies from the CJS main).
+## Note on the instruction text
+
+The user's instruction text was truncated at the end of the module review section ("Record any scoped exception to the steering requirements for ..."). The exception was recorded for the ES-module steering requirement only ("ES modules everywhere" in `tech.md`), as E-ESM-1 in ADR 0002 section 6.
+
+## H0
+
+H0 (host gate) PASSED. Host record is in `design.md`. Task T0.1 says not to reinstall. Host: Windows x64, PowerShell, Node 24 LTS, pnpm 10.34.9.
+
+## Tasks (`.kiro/specs/desktop-foundation/tasks.md`)
+
+Completed (checked): T0.1 to T0.8, T1.1 to T1.7. M0 and M1 are complete.
+
+Open: none in M0 or M1.
+
+Open, no evidence: T2.0 to T2.8, T3.1 to T3.4, T4.1 to T4.8, T5.1 to T5.5, T6.1 to T6.6, T7.0 to T7.7, T8.1 to T8.6.
+
+## Agents and skills used in this workflow
+
+- Agents named in the workflow reports: wf-coder (this step and the orchestration), desktop-engineer (input to the module review), necro-architect (module review and ADRs), security-reviewer (final security validation).
+- Skills: `testing-strategy` was loaded in this step. The earlier step reports do not state which skills they loaded, so none are claimed for them.
+
+## Files created or modified (git status)
+
+Modified: `.gitignore`, `.kiro/specs/desktop-foundation/design.md`, `.kiro/specs/desktop-foundation/tasks.md`, `README.md`.
+
+Untracked: `.editorconfig`, `.gitattributes`, `.nvmrc`, `.prettierignore`, `docs/adr/0002` to `0005`, `docs/requirements/`, `docs/security/` (m0-closure-validation, m0-dependency-validation, m0-final-security-validation, m0-post-install-validation, m0-resolution-report, m0-security-review), `electron.vite.config.ts`, `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `prettier.config.mjs`, `src/`, `tests/`, `tsconfig.json`, `tsconfig.{main,preload,renderer,shared,tests}.json`, `vitest.config.ts`. This report is also new (`docs/engineering/`).
+
+The branch holds no commits of this work. Everything above is uncommitted.
+
+## Installed and resolved versions
+
+- Electron 45.5.0 binary, embedded Node 24.22.3, x64 win32 (from `m0-closure-validation.md`). Acquired through the human-run `install-electron`, not globally.
+- Vitest 5.1.2 (from this run's output).
+- eslint 9.39.5 (deprecated, dev-only, accepted as S4).
+- esbuild 0.28.2.
+- pnpm 10.34.9.
+- Other versions are in `package.json` and `pnpm-lock.yaml`. All 31 top-level versions are in `docs/architecture/dependency-versions.md` (earlier "32" was a miscount).
+
+## Lifecycle scripts executed
+
+- Policy in `pnpm-workspace.yaml`: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. Electron is not allowlisted.
+- `esbuild@0.28.2` is the only installed package with an install script. I could not confirm that its postinstall ran.
+- Electron's binary came from the human-run `install-electron`.
+
+## Validation commands (this run, `pnpm.cmd`, one run each)
+
+| Command | Exit code | Result |
+|---|---|---|
+| `pnpm.cmd typecheck` (`tsc -b`) | 0 | clean |
+| `pnpm.cmd lint` (`eslint .`) | 0 | clean |
+| `pnpm.cmd test` (`vitest run`) | 0 | 1 file, 9 tests passed |
+| `pnpm.cmd format:check` (`prettier --check .`) | 0 | all files formatted |
+
+`pnpm build` was not run. It cannot succeed because `src/main/index.ts`, `src/preload/index.ts` and `src/renderer/index.html` do not exist.
+
+Lockfile: SHA-256 of `pnpm-lock.yaml` is `E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659`. It matches the recorded value from `m0-post-install-validation.md`, so the lockfile is unchanged.
+
+## ADRs
+
+ADRs 0002 to 0005 are written. ADR 0001 is untouched.
+
+- 0002: single package, tooling, module format (E-ESM-1).
+- 0003: `app://renderer` protocol, privileges, CSP. The dev CSP deviation from R5.5 awaits human acceptance.
+- 0004: dependency lifecycle script policy, `strictDepBuilds` deviation from R1.6 (E5), MPL-2.0 exception for the axe packages (E1).
+- 0005: IPC security model and main-process lifecycle. Only M1 code that exists is covered.
+
+## Module-system verdict
+
+VALID WITH EXCEPTION. Omitting `"type": "module"` matches the approved architecture. Main and preload build as CJS `.js` (`out/main/index.js`, single-file `out/preload/index.js`), because a sandboxed preload must be one CJS file. The renderer is browser ESM. Tool configs are `.mjs`. Source stays ESM with named exports. E-ESM-1 is scoped to "ES modules everywhere" only and was approved by the human on 2026-11-26. Security accepts it, since `sandbox: true` stays on. The Electron and electron-vite behavior was recalled from documentation and has not been tested against a build.
+
+## S1 conclusion
+
+Resolved with a limit. pnpm applies the version-qualified allowlist (`esbuild@0.28.2` allowed, `fsevents` denied). The `strictDepBuilds` failure branch was never exercised, because that needs a violating install. Whether esbuild's postinstall ran is unconfirmed.
+
+Other conditions: C1 to C4 satisfied, S2, S3 and S5 resolved, S4 accepted. `pnpm audit` found 0 vulnerabilities.
+
+## Human gates resolved (2026-11-26)
+- **Gate 1, E-ESM-1: APPROVED.** ADR 0002 section 6 and design E9 updated. `tech.md` is not edited; replacement text is in `docs/architecture/tech-md-amendment.md` for the orchestrator.
+- **Gate 2, `.npmrc`: APPROVED and written.** Content is exactly `engine-strict=true` plus newline (19 bytes). `git check-ignore` shows it is not ignored. `node_modules/`, `out/`, `coverage/`, `.cache/`, `test-results/` and `playwright-report/` are ignored; `.kiro/` is not ignored and is tracked. T0.4 ticked.
+- **Gate 3, ADR 0003 dev CSP: APPROVED WITH CONDITIONS.** ADR 0003 item 6 and design section 5 and N2 updated. Test requirement added to T2.2 and T6.1; removal of unneeded allowances is a validation duty at T7.6.
+- **Gate 4, S1 limitations: ACCEPTED.** ADR 0004 updated. The `strictDepBuilds` rejection branch was not exercised and the esbuild `postinstall` execution was not observed. No reinstall. esbuild is validated in the real build (T7.0 and T7.5 notes). Policy and pins unchanged.
+- **T0.2 ticked** (`m0-dependency-validation.md`, D1 resolved by the human). **T0.6 open** (see Verdict).
+- The human's final instruction was truncated after "Retrieve existing evidence rather than repeating completed work: - M0 registry metadata validation. - Dependency ...". The T0.2 and T0.6 evidence lists were inferred from the task text; no further requirements were added.
+
+## Remaining human gates
+None. All human gates are resolved: E-ESM-1 approved (the `tech.md` amendment text is in `docs/architecture/tech-md-amendment.md`; the orchestrator applied it to `.kiro/steering/tech.md` after human approval), `.npmrc` approved and written, ADR 0003 dev CSP approved with conditions, S1 limits accepted, T0.6 deliverable accepted.
+Carried forward (not gates): the build-dependent M1 checks move to T7.0 with the whole-application build; esbuild is validated in the real build.
+## Git status
+
+Branch `feature/desktop-foundation`. Four tracked files are modified. The remaining items listed above are untracked. No commit and no push.
+
diff --git a/docs/engineering/m2-m3-acceptance-report.md b/docs/engineering/m2-m3-acceptance-report.md
new file mode 100644
index 0000000..00c0286
--- /dev/null
+++ b/docs/engineering/m2-m3-acceptance-report.md
@@ -0,0 +1,91 @@
+# M2/M3 acceptance report (Step 7)
+
+Branch: feature/desktop-foundation. No commit, push, dependency, pin, lockfile or steering/agent/skill/workflow change. `pnpm-lock.yaml` SHA-256 unchanged: E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659.
+
+## Security verdict
+
+APPROVED (`docs/security/m2-m3-focused-review.md`, second pass; first pass `docs/security/m2-m3-security-review.md` also APPROVED). No Critical, High or Medium findings. DEFECTS_CONFIRMED: no. Both reviews are code reading. Electron 45.5.0 documentation was unreadable to the reviewer, so every Electron behavior claim is labeled ASSUMED. No test or runtime was run by the reviewer.
+
+## Findings by severity
+
+All are notes, none a confirmed defect.
+
+- Low: S-1 (`parent === null` does not prove `frame === sender.mainFrame`; no escalation, optional hardening). S-2 (MIME and extension allow-list use the requested name, not the real path; containment still holds).
+- Info: S-3 (production CSP needs reviewed changes for audio, skins, Shiki). S-4 (extension allow-list only `.html .js .css .json`). S-5 (failed root `realpath` is cached, all requests 404). S-6 (`realpath`/`stat`/`readFile` TOCTOU, accepted, first-pass F-3). S-7 (`setDisplayMediaRequestHandler` unset; add E2E check). S-8 (guards also attach to DevTools contents in dev). S-9 (no `Referrer-Policy` or `Permissions-Policy` on protocol responses). S-10 (no renderer or `index.html` yet). S-11 (two real-symlink tests skip on Windows, accepted, unchanged).
+
+## IPC sender validation decision (F-5)
+
+Accepted: registered-sender identity check, `senderFrame.parent === null`, and exact-match trusted origin, with the frame read synchronously at call time and failing closed on null, missing parent or throwing getter. Judged equivalent in effect to `senderFrame === sender.mainFrame` for this threat model. The origin check must stay. Conditions: explicit registration of future windows, no remote origin in the trusted set, all handlers via `registerHandler`, exact-match origin test. Recorded in ADR 0005, section "Addendum: sender-frame validation (F-5)". Electron 45.5.0 member names, types and documentation statements are now checked (ADR 0005 "Technical rationale" and `docs/architecture/electron-api-verification.md`). Runtime behavior stays unverified until E2E.
+
+## Finding dispositions (human decision, documentation closure)
+
+Canonical review: `docs/security/m2-m3-security-review.md` (F-1 to F-8). Supporting: `docs/security/m2-m3-focused-review.md` (S-1 to S-11). The Findings by severity list above uses the S ids of the focused review.
+
+| ID | Severity | Disposition |
+|---|---|---|
+| F-1 | Medium | Corrected: `acquireSingleInstance` drops `second-instance` while `app.isReady()` is false (`src/main/lifecycle/single-instance.ts`). Regression test "ignores second-instance while the app is not ready". Accepted. |
+| F-2 | Low | Corrected: `RESERVED_DEVICE_NAME` rejects Windows device names (`con.js`, `nul.css`, `com1.js`) in `src/main/protocol/resolve-app-path.ts`. Regression tests in `resolve-app-path.test.ts`. Accepted. |
+| F-3 | Low | Accepted temporarily, not resolved. Tracked in `docs/engineering/backlog.md` with preconditions, mitigations, residual risk, proposed handle-based mitigation and its limits. Mandatory reassessment before the first public release. |
+| F-4 | Info | Accepted. Dev CSP `unsafe-inline` reduction at T7.6. |
+| F-5 | Info | Accepted. Rationale and Electron 45.5.0 references in the ADR 0005 addendum. Optional S-1 hardening is a human decision. |
+| F-6 | Info | Accepted, no action. |
+| F-7 | Info | Accepted. Fuses, ASAR integrity and devTools at the packaging review. |
+| F-8 | Info | Accepted. Runtime checks at T7.0 and E2E (`'self'` vs `app://renderer`, module scripts without `corsEnabled`, sandboxed preload with bundled Zod, meta CSP in built HTML). |
+
+## Corrective changes
+
+The earlier version of this report said no source or test changed. That was inconsistent with the working tree. In the documentation closure step the files were read and show the F-1 and F-2 corrections and their regression tests (paths above). Whether those edits were made before or during the review steps is not recorded in the hand-offs available to this step. The corrections are accepted by the human. The closure step made no source, test, dependency or lockfile change; it changed documentation and the spec status files only. The test counts below are the last recorded run and were not re-run in the closure step.
+## Final validation (this step, one run each, pnpm.cmd, non-watch)
+
+| Command | Exit code | Result |
+|---|---|---|
+| `pnpm.cmd typecheck` | 0 | `tsc -b` clean |
+| `pnpm.cmd lint` | 0 | `eslint .` clean |
+| `pnpm.cmd test` | 0 | Vitest 36 files passed (36); 542 passed, 2 skipped (544 total) |
+| `pnpm.cmd format:check` | 0 | all matched files use Prettier style |
+
+Same counts as before (542 passed, 2 skipped, 36 files). The two skips are the accepted platform-limited real-symlink tests (one in `src/main/protocol/app-protocol.test.ts`, one in `tests/integration/app-protocol.integration.test.ts`), unchanged. Documentation files written after the format run are Markdown only; `prettier --check` was not re-run after them (no re-run requested; Markdown is not in the checked set if `.prettierignore` excludes it, which was not verified).
+
+## M2/M3 implementation acceptance status
+
+- **M2: IMPLEMENTED - INTEGRATION PENDING.**
+- **M3: IMPLEMENTED - INTEGRATION PENDING.**
+- This is implementation acceptance (code, unit, property and fake-based integration tests, code-reading security review). It is not whole-application runtime acceptance.
+- Ticked in `tasks.md`: T2.1 to T2.5, T3.1 (implementation and tests). T2.0, T2.8 and T3.4 are ticked in the closure step for these reasons:
+  - T2.0: `docs/architecture/electron-api-verification.md` exists with the five evidence levels per API. Typings and version-pinned documentation source were read; the rendered electronjs.org pages gave no content; some APIs rely on typings JSDoc only; runtime is not exercised.
+  - T2.8: the human accepted `docs/security/m2-m3-security-review.md` as the deliverable. It covers window, CSP, protocol, navigation, permissions, single instance and shutdown, and logging, with zero blockers. Crash-handler and user-data override internals were not reviewed in depth and go to T8.3.
+  - T3.4: the necro-architect contract review is in the ADR 0005 addendum (ACCEPT, no blockers) and the security review is the canonical file.
+- Left open on purpose (integration dependent): T2.6 (composition root, needs T7.0), T2.7 (meta CSP plugin, V5 in built HTML at T7.0), T3.2 and T3.3 (need T4.2 and T7.x: real wrong-sender behavior, sandboxed preload with bundled Zod). M4 to M8 tasks are untouched.
+- No M2/M3 PASSED status is claimed. PASSED needs the runtime and build tasks above.
+## Deferred integration checks (not executed, not claimed)
+
+Electron runtime integration, packaged CSP, sandboxed preload execution with bundled Zod, E2E (wrong-sender, subframe, display-media denial), real symlink and NTFS realpath, fuses and ASAR, macOS and Linux. Details and task mapping: `docs/engineering/m2-m3-deferred-runtime-validation.md`. M6 and M7 requirements are preserved unchanged. M4 and M5 were not started.
+
+## Agents used
+
+Per the hand-off messages: security-reviewer produced both reviews and modified no source. The fix and fix-tests steps ran and reported no changes. desktop-engineer and qa-engineer produced the earlier M2/M3 code and tests (before this workflow step); in this step they changed nothing. wf-coder (this step) changed only documentation. This report cannot verify agent activity beyond those hand-offs.
+
+## Skills loaded
+
+electron-security was requested for the security reviewer. Whether it actually loaded is not shown in the hand-off, so it is not confirmed here. The documentation closure step loaded `electron-security` and `typescript-standards`.
+
+## Git status (list from the earlier step; the closure step added `docs/architecture/electron-api-verification.md` and edited `backlog.md`, ADR 0005, `design.md`, `tasks.md` and this report; nothing committed)
+
+```
+ M .kiro/specs/desktop-foundation/tasks.md
+ M docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md
+ M electron.vite.config.ts
+ M tsconfig.renderer.json
+?? docs/architecture/tech-md-amendment.md
+?? docs/engineering/m2-m3-acceptance-report.md
+?? docs/engineering/m2-m3-deferred-runtime-validation.md
+?? docs/requirements/
+?? docs/security/m2-m3-focused-review.md
+?? docs/security/m2-m3-security-review.md
+?? src/main/index.ts
+?? src/main/ipc/  src/main/lifecycle/  src/main/logging/  src/main/protocol/  src/main/security/  src/main/window/  src/preload/
+?? src/shared/ipc/{app-info,channels,index,ipc-contract.property,necroamp-api,result}*.ts (new files)
+?? tests/integration/  tests/static/
+```
+
+Nothing committed.
diff --git a/docs/engineering/m2-m3-deferred-runtime-validation.md b/docs/engineering/m2-m3-deferred-runtime-validation.md
new file mode 100644
index 0000000..fce2753
--- /dev/null
+++ b/docs/engineering/m2-m3-deferred-runtime-validation.md
@@ -0,0 +1,31 @@
+# M2/M3 deferred runtime validation
+
+Nothing below has been executed. No Electron runtime, packaged build or E2E run exists for M2/M3. These items are not claimed as passed.
+
+| Item | Needs | Task |
+|---|---|---|
+| Electron 45.5.0 runtime semantics (`senderFrame` after navigation or destruction, `WebFrameMain.parent` and `url` on disposed frames, `mainFrame` identity, `will-frame-navigate`, `protocol.handle`). The docs and typings check is done (T2.0, `docs/architecture/electron-api-verification.md`). | Electron runtime | T7.x |
+| Startup order of `src/main/index.ts` in a real app | Whole-application build with renderer entry | T2.6, T7.0 |
+| Packaged production CSP (header plus meta tag, `'self'` match for `app://renderer`, tag present in `out/renderer/index.html`) | Whole-application build | T2.7, T7.0 |
+| Sandboxed preload execution with bundled Zod (`out/preload/index.js`), `contextBridge` cloning of the frozen API | Built output run under Electron | T3.3, T7.x |
+| Real wrong-sender and subframe rejection, `setDisplayMediaRequestHandler` denial (S-7) | E2E (Playwright Electron) | T3.2, T7.x |
+| Real-symlink containment and NTFS realpath (two tests skipped on Windows, accepted) | POSIX host or privileged Windows | T7.x |
+| Fuses, ASAR integrity, packaged realpath layout, macOS and Linux behavior | Packaging phase | M7, M8 |
+| Renderer shell, `index.html`, extension allow-list for fonts, images, wasm (S-3, S-4, S-10) | M4/M5 work, reviewed CSP change | M4, M5 |
+
+## Preserved deferred requirements
+
+- M6 (unit, integration, property-based and accessibility testing) and M7 (Electron smoke tests and production build validation) remain as written in `.kiro/specs/desktop-foundation/tasks.md`. No M6 or M7 requirement was dropped or weakened.
+- M4 and M5 were not started.
+
+## Related open items
+
+- F-3 filesystem race: accepted temporarily, reassessment before the first public release (docs/engineering/backlog.md).
+- F-4, F-7, F-8 downstream validation: table in docs/engineering/backlog.md.
+- Optional S-1 hardening (rame === sender.mainFrame) and a sub-frame or foreign-origin negative E2E for the sender check: no task exists today. Human decision.
+- Status: M2 and M3 are IMPLEMENTED - INTEGRATION PENDING.
+
+## Update after Block B (fresh evidence: pnpm test:e2e 35 passed, build exit 0, test 768 passed and 2 skipped)
+- RUNTIME VERIFIED: startup order and real app launch (T2.6, T7.0); built meta CSP and CSP header, no unsafe-* (T2.7); sandboxed preload with bundled Zod and frozen `app.getInfo` bridge (T3.3); real wrong-sender and subframe rejection (negative-sender e2e); renderer shell and shell extension checks (M4, M5); S-1 hardening (`frame === sender.mainFrame`) implemented with negative E2E.
+- DEFERRED: real-symlink containment (2 tests skipped on Windows without privilege); fuses, ASAR integrity, packaging (packaging phase); macOS and Linux behavior NOT VERIFIED.
+- Status: M2 and M3 COMPLETE on Windows x64, with the deferrals above.
diff --git a/docs/engineering/screenshots/m7-preview-production-shell.png b/docs/engineering/screenshots/m7-preview-production-shell.png
new file mode 100644
index 0000000..5da6cf5
Binary files /dev/null and b/docs/engineering/screenshots/m7-preview-production-shell.png differ
diff --git a/docs/kiroween/kiro-journal.md b/docs/kiroween/kiro-journal.md
index 776b13e..25b406b 100644
--- a/docs/kiroween/kiro-journal.md
+++ b/docs/kiroween/kiro-journal.md
@@ -213,3 +213,38 @@ Added 5 config files and 4 docs. Agents, skills and steering are unchanged (empt
 ### Limitations
 Recipe and hook syntax is VERIFIED only as valid JSON and against IDE-bundle evidence. IDE acceptance of the recipes was not tested in this step. `post-task-quality` fails silently without `package.json`. See `docs/engineering/automation-validation.md`.
+
+## 13. Phase 05: renderer and styling, Block A (M4, M5; branch `feature/desktop-foundation`)
+
+### What was done
+Implemented the renderer shell, stores, bridge adapter, six placeholder regions (M4) and the token-based, accessible CSS Modules styling with a pure WCAG contrast function (M5). First integration launch: `electron-vite preview` on the fresh build opened a `NecroAmp` BrowserWindow.
+
+### Agents and skills actually invoked
+- `git-reconcile` wf-coder: reconciled repository state before Block A.
+- `necro-architect`: renderer architecture and contract notes (`docs/architecture/renderer-architecture.md`, `contract-changes.md`).
+- `frontend-engineer`: renderer implementation (`src/renderer/`).
+- `art-director`: styling and skin-seam notes (`docs/design/foundation-styling.md`).
+- `wf-code-reviewer`: reviewed Block A; findings were resolved.
+
+### Result
+Fresh validation: typecheck, lint, format:check and build exit 0. Vitest 625 passed, 2 skipped (symlink privilege, same two as before), 42 files. T4.1 to T4.8 and T5.1 to T5.4 ticked; T5.5 stays open (no `desktop-foundation-skin-seams.md`).
+
+## 14. Phase 06: tests, defect fixes and E2E, Block B (M6, M7; branch `feature/desktop-foundation`)
+### Agents and skills actually invoked
+- `qa-engineer` (with the `testing-strategy` skill): property, static, integration, jsdom a11y and Playwright Electron tests, axe scan, defects 0001 to 0004, coverage notes.
+- `desktop-engineer`: resolve-app-path coverage fix (0001) and stricter sender validation.
+- `frontend-engineer`: renderer fixes for defects 0002 to 0004.
+- Block B reviewer (verdict `APPROVED`, no findings).
+### Result
+Fresh: typecheck, lint, format:check, build exit 0; vitest 52 files, 768 passed, 2 skipped; coverage statements 99.44, branches 98.23, functions 100, lines 99.78 (thresholds unchanged); test:e2e 35 passed. M6 complete; M7 partly open (T7.5 to T7.7).
+
+## 15. Phase 07: final delivery preparation, Block C (M8 preparation; branch `feature/desktop-foundation`)
+### What was done
+Acceptance reconciliation of M0 to M8 against tasks.md, fresh full validation, README, ADR 0003 and 0005 runtime notes, backlog update and the single delivery report (`docs/engineering/desktop-foundation-delivery-report.md`). No `desktop-foundation-final-review.json` existed, so no repair work was done.
+### Agents and skills actually invoked
+None. The orchestrator did this work directly. The `quality-review` workflow was not run.
+### Result
+Fresh on Windows x64: typecheck, lint, format:check, test, test:coverage, build, test:e2e and pnpm licenses exit 0. Vitest 52 files, 768 passed, 2 skipped. E2E 35 passed. M7 and M8 stay INTEGRATION PENDING (T7.5, T7.6, T8.1 to T8.4, T8.6).
+
+### Block C closing step
+T7.5 build-validation document written. Bounded `pnpm dev` run: startup and clean shutdown confirmed, T7.6 remains pending (needs human console/HMR observation). base_ref origin/main = 66f9f7f. Fresh run after the dev run: build exit 0, test:e2e 35 passed. Final commit hashes, PR and merge status are in the delivery report section 8.
diff --git a/docs/release/desktop-foundation-build-validation.md b/docs/release/desktop-foundation-build-validation.md
new file mode 100644
index 0000000..ee95689
--- /dev/null
+++ b/docs/release/desktop-foundation-build-validation.md
@@ -0,0 +1,43 @@
+# Desktop Foundation build validation (T7.5)
+
+Scope: consolidation of evidence that exists in this repository, plus the build facts re-checked on this tree. Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0, electron-vite (Vite 7.3.8). Branch `feature/desktop-foundation`. No installer, packaging or electron-builder step was run (none exists). macOS and Linux are NOT VERIFIED.
+
+## Commands and results
+
+| Command | Exit | Result |
+|---|---|---|
+| `pnpm.cmd build` | 0 | Run twice in Block C (once before and once after the bounded `pnpm dev` run, which overwrites `out/main` and `out/preload` with development builds). |
+| `pnpm.cmd test:e2e` | 0 | 35 passed (about 1.9 min, 1 worker), run against the rebuilt `out/`. |
+| `pnpm.cmd typecheck`, `lint`, `format:check`, `test`, `test:coverage` | 0 | 768 passed, 2 skipped. Coverage 99.44 / 98.23 / 100 / 99.78. |
+
+## Output layout (`out/`, git-ignored)
+
+| File | Bytes |
+|---|---|
+| `out/main/index.js` | 24407 |
+| `out/preload/index.js` | 175282 |
+| `out/renderer/index.html` | 799 |
+| `out/renderer/assets/index-DEsaqZMb.css` | 10780 |
+| `out/renderer/assets/index-Dsw4fJRS.js` | 838685 |
+
+## Checks required by T7.5
+
+- **Preload is one CommonJS file.** `out/preload/index.js` starts with `"use strict"; const electron = require("electron");` and has no `import` or `export` lines. Zod is bundled (`externalizeDeps: false`). The sandboxed preload loads at runtime: the E2E suite reads the bridge status "Connected".
+- **Meta CSP in built HTML.** `out/renderer/index.html` carries `<meta http-equiv="Content-Security-Policy">` with `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'`. No `unsafe-inline` and no `unsafe-eval`.
+- **No inline script.** The only script is `<script type="module" crossorigin src="./assets/index-Dsw4fJRS.js">`. Module script loading under `app://renderer` is proven by the E2E run (F-8 runtime item closed on Windows).
+- **No source maps.** 0 `.map` files under `out/`.
+- **No axe text in `out/`.** 0 matches for `axe-core` in all files under `out/` (E1).
+- **esbuild works in the real build** (T7.5 validation note): the build exits 0 and produces the three outputs.
+
+## Runtime evidence
+
+- Electron 45.5.0 launched the built app from `out/main/index.js` in 35 Playwright tests: title, tagline, six regions, live web preferences, `require`, `process`, `Buffer` and `ipcRenderer` undefined in the renderer, effective CSP, blocked inline script and remote fetch, navigation and `window.open` blocking, permission denial, second-instance and quit behavior, layout at 800x600 and 1920x1080, tab order, and an axe scan with zero serious or critical violations.
+- `electron-vite preview` on the production build opened a `NecroAmp` window in Blocks A and B.
+- Screenshot: `docs/engineering/screenshots/m7-preview-production-shell.png` (SHA-256 `C1EFE7C772A168F077C6EF3B2CFC4B1F60FC08AAD5176C1FDC8FF93DC0A9A2A6`). It shows the shell with header, six regions, "Application bridge Connected", Platform Windows, Version 0.0.0. It was captured during the Block B preview run (file time 2026-11-26 14:38). The capture command is not recorded and this document does not claim one.
+
+## Limitations
+
+- Windows x64 only. macOS and Linux builds and runs are NOT VERIFIED (R16.3).
+- Two real-symlink containment tests are skipped on this host (no symlink privilege).
+- Not covered here: Electron Fuses, ASAR integrity, `realpath` against an ASAR layout, installers and signing (finding F-7, deferred with packaging). `out/main/index.js` includes the application menu role `toggleDevTools`; whether it is reachable in a packaged build was not assessed.
+- No CI workflow exists in the repository, so no CI build result exists.
diff --git a/docs/release/packaging-review-findings.md b/docs/release/packaging-review-findings.md
new file mode 100644
index 0000000..7cb0ec1
--- /dev/null
+++ b/docs/release/packaging-review-findings.md
@@ -0,0 +1,44 @@
+# Packaging and workflow review findings
+
+Scope: `.github/workflows/**`, `electron-builder.yml`, `package.json` scripts (including `pre*` and `post*` hooks), per `docs/engineering/package-script-policy.md` and "CI/CD" in `tech.md`.
+Reviewer: release/DevOps role. No commit, push, PR edit or merge was done. No `pnpm` script was run.
+
+## Evidence (read-only inspection of the working tree)
+
+| Item | State |
+|---|---|
+| `.github/workflows/` | Does not exist. No CI or release workflow is present. |
+| `electron-builder.yml` | Does not exist. |
+| `electron-builder` dependency | Not in `package.json`. |
+| `package` script | Not defined. |
+| `pre*` / `post*` hooks | None defined. |
+
+## package.json script review
+
+Scripts: `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `test:e2e`.
+None publishes, pushes, tags, calls `gh` or `curl`, or reads tokens. No lifecycle hooks exist. Bodies are plain tool invocations (`electron-vite`, `tsc -b`, `eslint`, `prettier`, `vitest`, `playwright`). `format` writes files and is not used by CI.
+
+## Publication check
+
+- No workflow exists, so nothing publishes or releases on any trigger. A merge to `main` cannot start a release.
+- The condition "no publish without a maintainer-pushed tag" holds trivially. It must be enforced when a release workflow is added later.
+
+## Gaps against the CI/CD requirement in `tech.md`
+
+1. No CI workflow on Windows, macOS and Linux (frozen install, typecheck, lint, test, build).
+2. No release workflow for tags.
+3. No `electron-builder.yml`, no `package` script (it must use `--publish never`), no `electron-builder` dependency.
+4. Packaging, signing, SBOM and the per-platform artifact table are not documented. Open decisions 10 to 12 (auto-update, signing, Linux targets) remain undecided.
+
+These are outside the Desktop Foundation scope stated for this delivery (M0 to M8 GitHub part), so they are backlog items, not blockers for merging. The delivery report must not claim packaged installers or CI coverage for them.
+
+## Notes for the committing agent
+
+- Required CI checks: none can exist from workflows in this repo. When running `gh pr checks`, an empty result means "no checks present". Report it as absent, not as passing. If branch protection requires checks, they are unsatisfied by definition.
+- `engines.node` is `>=24.15.0 <25`. Any future workflow should pin Node 24 and pnpm 10.34.9 via `packageManager`.
+
+## Requests for other owners
+
+- desktop-engineer: add `electron-builder` and a `package` script with `--publish never` when packaging starts.
+- security-reviewer: review future packaging, signing and publish steps per the package-script policy.
+- architect and user: decide open decisions 10 to 12.
diff --git a/docs/security/desktop-foundation-final-review.json b/docs/security/desktop-foundation-final-review.json
new file mode 100644
index 0000000..25cb28b
--- /dev/null
+++ b/docs/security/desktop-foundation-final-review.json
@@ -0,0 +1,38 @@
+{
+  "verdict": "APPROVED",
+  "findings": [
+    {
+      "id": "FR-1",
+      "severity": "Low",
+      "location": "src/main/protocol/app-protocol.ts:98-103",
+      "evidence": "realpath, stat and readFile are separate calls (carry-over F-3 TOCTOU). Backlog F-3 stays open.",
+      "fix": "Mandatory reassessment before first public release: accept permanently, read through an opened handle, or evaluate protocol.registerSource. Record in an ADR.",
+      "owner": "desktop-engineer"
+    },
+    {
+      "id": "FR-2",
+      "severity": "Low",
+      "location": "src/main/lifecycle/user-data-override.ts; src/main/index.ts:39-44",
+      "evidence": "NECROAMP_E2E_USER_DATA redirects userData in unpackaged runs only. Packaged builds ignore it.",
+      "fix": "Optional: restrict to the OS temp directory. Confirm in a packaged-build test (F-7).",
+      "owner": "desktop-engineer"
+    },
+    {
+      "id": "FR-3",
+      "severity": "Informational",
+      "location": "src/main/security/csp.ts (development policy)",
+      "evidence": "Dev CSP allows unsafe-inline. Not reachable in production. Pending T7.6 / F-4.",
+      "fix": "Remove allowances the pnpm dev run shows are unneeded.",
+      "owner": "desktop-engineer"
+    },
+    {
+      "id": "FR-4",
+      "severity": "Informational",
+      "location": "src/main/index.ts",
+      "evidence": "No will-download handler or non-app scheme webRequest block. Existing guards and CSP already deny these paths. Fuses and ASAR integrity not reviewed (packaging deferred, F-7).",
+      "fix": "Add deny-all download handler when file features arrive. Review Fuses at packaging.",
+      "owner": "desktop-engineer"
+    }
+  ],
+  "reviewDoc": "C:/Users/hberm/Desktop/necroamp/docs/security/desktop-foundation-final-review.md"
+}
diff --git a/docs/security/desktop-foundation-final-review.md b/docs/security/desktop-foundation-final-review.md
new file mode 100644
index 0000000..287d5ee
--- /dev/null
+++ b/docs/security/desktop-foundation-final-review.md
@@ -0,0 +1,56 @@
+# Desktop Foundation final security review (M8)
+
+Reviewer: security-reviewer (read-only). Branch `feature/desktop-foundation`, HEAD `40bf76e` per the Block C report.
+Skill loaded: `electron-security` (only skill loaded). Authority: `tech.md` (Electron architecture and security, Skin engine, CI/CD), `product.md` principles 1 to 6.
+Evidence labels: VERIFIED (code read in this review), DOCUMENTED (stated in repository reports, not re-run), ASSUMED.
+
+## Verdict
+
+**APPROVED.** No High or Medium finding is confirmed. Four Low or Informational items are listed for follow-up. F-3 remains open with its mandatory pre-release reassessment.
+
+I have no shell. Test, build and E2E results (768 passed, 2 skipped, 35 E2E, coverage 99.44 / 98.23 / 100 / 99.78) are DOCUMENTED from the Block C report, not re-run by me. macOS and Linux are NOT VERIFIED.
+
+## Scope and trust boundaries
+
+Covered: main (`src/main/index.ts`, window, ipc, security, protocol, lifecycle), preload (`src/preload/*`), shared IPC contract use, renderer (static search), CSP, dependency policy. Not reviewed: packaging, Electron Fuses, installers, CI (no `.github/workflows` exists), macOS and Linux behavior, GitHub, token storage and skin loader (none implemented), the full `src/shared/ipc` schemas beyond their use sites, the renderer React components line by line.
+
+## Checks
+
+| Area | Result | Evidence |
+|---|---|---|
+| BrowserWindow preferences | PASS, VERIFIED | `window-options.ts:16-28`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, plus `webviewTag: false`, `allowRunningInsecureContent: false`, worker and subframe node integration false. The function takes only the preload path. `create-main-window.ts` is the only window constructor and spreads these preferences last. |
+| IPC allowlist | PASS, VERIFIED | One channel (`app:get-info`). Handlers register only through `registerHandler` (`install-ipc.ts`, `register-handler.ts:36`). |
+| Zod validation | PASS, VERIFIED | Request parse of `args` (`register-handler.ts:48`) and response parse (`:57`) in main. Preload parses request and response again (`create-necroamp-api.ts`). Errors are fixed codes with no payload, path or exception text. |
+| Sender validation | PASS, VERIFIED, fail-closed | `sender-validation.ts:41-54`: null frame, non-null `parent` (subframe), frame not identical to `sender.mainFrame`, untrusted origin, unregistered sender, or any exception all return false. Trusted origin compared as `protocol//host`; credentials rejected (`trusted-origins.ts originOf`). Subframe and foreign-origin negative cases are covered by tests (DOCUMENTED). |
+| Preload exposure | PASS, VERIFIED | `preload/index.ts`: `ipcRenderer` is closed over, never exposed. Bridge is `Object.freeze({ app: { getInfo } })`. `invoke` takes a typed channel and forwards no arguments. No FS, no generic invoke, no event forwarding. |
+| `app://` containment | PASS, VERIFIED | Layers: raw checks (`%2e`, dot segments, encoded separators, NUL, control chars, backslash), decoded checks (separators, `:`, reserved chars, dotfiles, trailing dot or space, Windows device names), extension allow-list, lexical `isInside` (case-insensitive on `\`), then `realpath` plus root re-check in `app-protocol.ts`, 5 MiB cap, GET and HEAD only, `nosniff`, `no-store`, CORP `same-origin`, CSP header. |
+| Defect 0001 change | PASS, VERIFIED | The only change is one `/* v8 ignore next -- @preserve */` at `resolve-app-path.ts:97`, covering the single statement `if (!trimmed.startsWith('/')) return reject('BAD_URL')`. The branch is unreachable: `url.pathname` of an authority URL starts with `/` or is empty, and an empty or `/` value is replaced by `/index.html` at line 96. `decoded` cannot lose the leading `/` because encoded separators are rejected earlier (line 85). No check was removed or reordered, and the later segment, extension and `isInside` checks are unchanged. `vitest.config.ts` keeps the 95% per-file gate for this file and excludes only `src/main/index.ts`, `src/renderer/main.tsx` and similar entry files (VERIFIED for those two). |
+| Renderer isolation | PASS, VERIFIED (static) | No `fetch`, XHR, WebSocket, `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `window.open`, `localStorage` or remote URL in `src/renderer`, `src/preload`, `src/shared`. The only script tag is the module entry in `index.html`. |
+| Production CSP | PASS, VERIFIED | `csp.ts` frozen directives: `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `img-src` and `font-src 'self'`, `connect-src 'none'`, `object-src`, `frame-src`, `worker-src`, `media-src`, `base-uri`, `form-action`, `frame-ancestors 'none'`. No `unsafe-*`, no remote origin. Dev allowances live in a separate function, wired only when `target.kind === 'development'` (`index.ts:81`). The Block C report states the built HTML has the meta CSP and no inline script (DOCUMENTED). |
+| Network | PASS, VERIFIED | No network code in main beyond the dev-server load. `connect-src 'none'`. No telemetry, update check or crash reporter (`crash-handlers.ts` logs only error name and code). |
+| Navigation, new window, webview | PASS, VERIFIED | `installNavigationGuards` attaches to every `web-contents-created`. `will-navigate`, `will-redirect` and `will-frame-navigate` are blocked unless the origin is trusted. `will-attach-webview` is prevented. `setWindowOpenHandler` returns deny. |
+| Permissions | PASS, VERIFIED | `permissions.ts`: request, check and device handlers deny everything, installed on `session.defaultSession` before the window opens. |
+| Dev-only trust | PASS, VERIFIED | The dev origin is used only when `!app.isPackaged` and `ELECTRON_RENDERER_URL` parses as `http://localhost` or `127.0.0.1` with a port (`load-target.ts`, `trusted-origins.ts parseDevOrigin`). |
+| User-data override | PASS with note | `user-data-override.ts`: inert when packaged, requires an absolute, already-normalized, existing directory of at most 260 chars, no NUL. See L-2. |
+| Crash handlers | PASS | `uncaughtException` logs the error name and calls `app.exit(1)`. `unhandledRejection` logs the name. Renderer crash reloads once, then quits. No reporter, no messages or stacks logged. |
+| Credentials | PASS | No token, safeStorage or GitHub code exists. No secret found in the files read. |
+| Dependencies | PASS, VERIFIED and DOCUMENTED | `package.json`: all 4 runtime and 27 dev dependencies are exact versions, `packageManager` pinned `pnpm@10.34.9`. `pnpm-workspace.yaml`: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]` (version-qualified), `ignoredBuiltDependencies: [fsevents]`. No `.npmrc` content and no lifecycle scripts (`pre*`, `post*`, `install`, `prepare`) in `package.json`. `pnpm-lock.yaml` has integrity hashes. Accepted exceptions (`dependency-versions.md`): MPL-2.0 axe-core (dev only, not in `out/` per the Block C report), `eslint@9.39.5` deprecated (temporary human acceptance, no known vulnerabilities per `pnpm audit`, DOCUMENTED), permissive dev-graph licenses. Production licenses are MIT only (DOCUMENTED). |
+| F-3 TOCTOU | OPEN as required | `backlog.md` F-3 (Low, accepted temporarily), reassessment mandatory before the first public release. `app-protocol.ts` still does `realpath` then `stat` then `readFile` as separate calls, so the race exists and the backlog describes it correctly. |
+
+## Findings
+
+| ID | Severity | Location | Evidence | Fix | Owner |
+|---|---|---|---|---|---|
+| FR-1 | Low (carry-over F-3) | `src/main/protocol/app-protocol.ts:98-103` | `realpath`, `stat` and `readFile` run separately on a path. A local attacker who can write inside the app resources directory could swap a file between calls. The directory is not writable by the renderer, and the handler serves only the bundled renderer today. | Before first public release: accept permanently, read through an opened handle, or evaluate `protocol.registerSource`; record in an ADR. Must be reassessed as soon as skins or user media are served through a protocol (higher exposure). | desktop-engineer with security-reviewer |
+| FR-2 | Low | `src/main/lifecycle/user-data-override.ts`, `src/main/index.ts:39-44` | Any environment that can set `NECROAMP_E2E_USER_DATA` in an unpackaged run can redirect user data to any existing absolute directory. Packaged builds ignore it (VERIFIED, `isPackaged` check). Impact is limited to developer and test runs. | None required. Optionally require the path to sit under the OS temp directory. Confirm with a packaged-build test during packaging (F-7). | desktop-engineer |
+| FR-3 | Informational | `src/main/security/csp.ts:55-62` (dev policy) | Dev CSP allows `unsafe-inline` for script and style. It is unreachable in production code paths. F-4 (human `pnpm dev` run, T7.6) will decide whether it can be removed. | Remove the allowances the T7.6 run shows are unneeded. | desktop-engineer |
+| FR-4 | Informational | `src/main/index.ts` | There is no `session.on('will-download')` handler and no `webRequest` block for non-`app:` schemes. Today navigation guards plus `default-src 'none'` and `connect-src 'none'` already deny these paths, so this is defense in depth only. | Consider a deny-all download handler when file features arrive. Re-review at packaging for Fuses, ASAR integrity and `RunAsNode` (tech.md Fuses rule), which are not reviewed here. | desktop-engineer |
+
+## Residual and deferred items
+
+- Packaging-specific checks (Fuses, ASAR integrity, installers, signing) stay deferred (backlog F-7).
+- No CI workflow exists. The `tech.md` CI rules (action pinning by SHA, least-privilege `permissions:`) cannot be checked until `.github/workflows` is created. Owner: release-engineer.
+- Electron downloads its binary at install time in a way that is not covered by `onlyBuiltDependencies`. How Electron 45.5.0 obtains the binary under `strictDepBuilds` is ASSUMED (the documented V2 scan found only esbuild with a build script, and E2E runs prove the binary is present).
+- Re-review is required when any of these arrive: file, token, skin or GitHub IPC; `shell.openExternal`; a second window; media served by protocol.
+
+No source modified.
diff --git a/docs/security/m0-closure-validation.md b/docs/security/m0-closure-validation.md
new file mode 100644
index 0000000..fe1f5b1
--- /dev/null
+++ b/docs/security/m0-closure-validation.md
@@ -0,0 +1,105 @@
+# M0 closure validation
+
+Scope: remaining M0 technical validation (workflow `wf_68835a08506da2aa`, step 1). Host: Windows x64, PowerShell 7, pnpm 10.34.9. All checks were read-only. No dependency was installed or reinstalled, no lifecycle script was run, and the lockfile was not touched.
+
+## 1. Electron binary validation (V3, A.7): PASS (see 1a)
+
+| Item | Result |
+|---|---|
+| Mechanism (design 9.3) | `pnpm exec install-electron --no`. This runs `node_modules/electron/install.js` (the `install-electron` bin), which downloads the official release asset through `@electron/get` and checks it against the release checksums. The `electron@45.5.0` package declares no lifecycle script (read from `node_modules/electron/package.json`: no `scripts`), so it is not in `onlyBuiltDependencies`. |
+| Agent attempt | `pnpm.cmd exec install-electron --no` in the repository root. Exit -1. Blocked by the Kiro tool guard ("would execute a package's binary/script named install-electron from the local node_modules"). Not retried and not worked around. |
+| Current state | `node_modules/electron` holds `install.js`, `cli.js`, `index.js`, `package.json` and no `dist/` or `path.txt`. `Test-Path node_modules/electron/dist/electron.exe` is False. |
+| Electron version 45.5.0 | Package metadata only: `node_modules/electron` and the `.pnpm/electron@45.5.0` directory. Binary version NOT yet verified. |
+| Embedded Node | NOT yet measured. Design 9.3 expects v24.22.3 from the Electron `DEPS` file (documented, not measured). |
+| Binary architecture | NOT yet verified. Expected x64 win32. |
+
+Human commands (ordinary PowerShell 7, repository root, no `-ExecutionPolicy Bypass`):
+
+```powershell
+pnpm.cmd exec install-electron --no
+pnpm.cmd exec electron --version
+$env:ELECTRON_RUN_AS_NODE='1'; pnpm.cmd exec electron -p "process.versions.node + ' ' + process.versions.electron + ' ' + process.arch + ' ' + process.platform"; Remove-Item Env:ELECTRON_RUN_AS_NODE
+```
+
+Expected: `v45.5.0`, then `24.22.3 undefined x64 win32` (with `ELECTRON_RUN_AS_NODE` set, `process.versions.electron` is undefined, so also read the version from the first command). The download is a development-time network call to the official Electron GitHub releases. The cache is outside the repository, so nothing new is tracked.
+
+### 1a. Update after the human ran `install-electron --no`
+
+Read-only inspection afterwards (no agent command downloaded or ran anything):
+
+| Item | Result |
+|---|---|
+| Binary present | `node_modules/electron/dist/electron.exe` and `node_modules/electron/path.txt` (`electron.exe`) exist. |
+| Version | `dist/version` contains `45.5.0`. `electron.exe` file `ProductVersion` is `45.5.0`. PASS. |
+| Architecture | PE header machine field is `0x8664` (AMD64, x64). PASS. |
+| SHA-256 of electron.exe | `231AB12BB3B6DBE647855F969D282920A8544968510F6274311BA06DA406A63D` |
+| Embedded Node | `24.22.3 x64 win32`, exit 0. PASS. Run once by the orchestrator: `ELECTRON_RUN_AS_NODE=1`, `pnpm.cmd exec electron -p "process.versions.node + ' ' + process.arch + ' ' + process.platform"`, variable removed afterwards. This matches the design expectation (v24.22.3 from `DEPS`). Electron 45.5.0 embeds Node 24.22.3, which equals the host Node version by coincidence. The two runtimes are distinct. Two earlier agent attempts produced garbled shell output (quoting problem) and were abandoned per the two-failure rule. |
+| Acquisition | Official download through `install-electron` and `@electron/get`, run by the human. Electron was not installed globally and the pin is unchanged. |
+
+### 1b. Re-measurement after human acquisition (read-only, one run each)
+| Command | Output |
+|---|---|
+| `pnpm.cmd exec electron --version` | `v45.5.0` (exit 0) |
+| `ELECTRON_RUN_AS_NODE=1; pnpm.cmd exec electron -p "process.versions.node + ' ' + process.arch + ' ' + process.platform"` (variable removed in `finally`) | `24.22.3 x64 win32` (exit 0) |
+The shell output was clean, so the values are measured, not carried over. They match section 1a. The values are also recorded in `docs/architecture/dependency-versions.md`.
+Status: version (45.5.0), embedded Node (24.22.3) and architecture (x64 win32) all verified. V3 and A.7 are closed.
+
+## 2. .gitignore (T0.4): PASS
+
+`git check-ignore -v` result for each path:
+
+| Path | Matching rule |
+|---|---|
+| `node_modules/` | `.gitignore:41 node_modules/` |
+| `out/` | `.gitignore:79 out` |
+| `coverage/` | `.gitignore:22 coverage` |
+| `.cache/` | `.gitignore:90 .cache/` (also line 74 `.cache`) |
+| `test-results/` | `.gitignore:163 /test-results/` |
+| `playwright-report/` | `.gitignore:164 /playwright-report/` |
+| `.kiro/steering/tech.md` | Not ignored (`check-ignore` exit 1). `git ls-files .kiro` lists 50 tracked files. |
+
+No edit was needed. `.kiro/` is version-controlled.
+
+## 3. Security conditions C1 to C4
+
+| ID | Status | Evidence |
+|---|---|---|
+| C1 | Satisfied (inferred, see limits) | `m0-post-install-validation.md`: install exit 0 per the operator, lockfile SHA-256 unchanged. Re-checked here: `pnpm.cmd ignored-builds` prints "None" and `.modules.yaml` has `ignoredBuilds: []` and `pendingBuilds: []`. A scan of every installed `package.json` under `node_modules/.pnpm` found exactly one package with a `preinstall`, `install` or `postinstall` script: `esbuild@0.28.2` (`postinstall: node install.js`). |
+| C2 | Satisfied | Build-flagged set equals {esbuild allowed, fsevents denied and not installed on win32}. Confirmed by the scan above. `@esbuild/win32-x64@0.28.2` is installed (`esbuild.exe`, 11,694,592 bytes). |
+| C3 | Satisfied (evidence retrieved, not repeated) | `m0-post-install-validation.md` row "C3 config": the orchestrator verified before install that there is no project or user `.npmrc`, no npm or pnpm rc files, no `npm_config_*`, `PNPM_*`, `NODE_TLS*`, proxy or `ELECTRON_*` variables, registry `https://registry.npmjs.org/`, strict-ssl true, and proxy, https-proxy, ca and cafile null. Corroboration read now: `.modules.yaml` records `registries.default: https://registry.npmjs.org/` (plus the default `@jsr` scope registry `https://npm.jsr.io/`), and the post-install record found every package resolved from the npm registry. |
+| C4 | Satisfied | `pnpm.cmd audit` after install: "No known vulnerabilities found", 0 high, 0 critical (`m0-post-install-validation.md`). |
+
+## 4. Security findings S1 to S5
+
+| ID | Status | Evidence |
+|---|---|---|
+| S1 | Resolved with a stated limit. See section 5. | |
+| S2 | Resolved | pnpm 10 lockfiles do not record `requiresBuild` (0 matches). The installed-tree scan in section 3 replaces the registry-metadata inference: one script-bearing package, esbuild. |
+| S3 | Resolved | Same evidence as C3. |
+| S4 | Accepted, audit clean | `eslint@9.39.5` is flagged deprecated (dev only, accepted by the human). `pnpm audit` reports no known vulnerabilities. |
+| S5 | Resolved | `@electron-internal/extract-zip@1.0.10` and `@electron/get@5.1.0` are MIT, from `github.com/electron/*`, maintained by Electron project accounts (`m0-post-install-validation.md`). |
+
+## 5. S1: does pnpm 10.34.9 honor the policy in pnpm-workspace.yaml?
+
+`pnpm-workspace.yaml` content: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. The project `package.json` carries no `pnpm` block, so the workspace file is the only source.
+
+Read-only evidence:
+
+1. pnpm resolves all three keys from the workspace file as effective configuration: `pnpm.cmd config get strict-dep-builds` returns `true`, `only-built-dependencies` returns `esbuild@0.28.2`, `ignored-built-dependencies` returns `fsevents`, and `dangerously-allow-all-builds` returns `undefined`.
+2. pnpm 10 blocks every dependency script by default. `esbuild@0.28.2` is not in `ignoredBuilds` (empty) and `pnpm ignored-builds` reports none. The only way esbuild escapes the ignored list is that pnpm matched the version-qualified entry `esbuild@0.28.2` from the workspace file. This shows the allowlist, including version qualification, was parsed and applied.
+3. The only package in the installed tree with an install-phase script is `esbuild@0.28.2`. `electron@45.5.0` has none, and `fsevents` is not installed on win32.
+4. No `dangerouslyAllowAllBuilds` is set anywhere.
+
+Conclusion: pnpm 10.34.9 honors the allowlist and the default-deny of the policy (positive evidence in points 1 and 2). The failure branch of `strictDepBuilds` (exit non-zero on an unreviewed script) is not demonstrated, because the tree contains no unlisted package with a build script, and proving it would need a violating install, which is prohibited. That branch is documented pnpm behavior since 10.3.0, and the policy produces the same final state either way: no unapproved script ran. No lockfile defect was found. A later version bump of esbuild will exercise the version qualification and fail the install until it is reviewed.
+
+Limit: whether esbuild's postinstall actually executed is not directly observable. `bin/esbuild` is the 9,350-byte JS launcher, and esbuild's installer may leave it unchanged on Windows, so file size is not a reliable marker. The operator's console output was not seen.
+
+## 6. Shell failures
+
+One: the guard-blocked `pnpm.cmd exec install-electron --no` (exit -1). No identical retry. All other commands succeeded.
+
+## 7. Open items
+
+- V3 and A.7 are closed (section 1a). Record the three values in `docs/architecture/dependency-versions.md` if not yet there.
+- ADRs 0002 to 0005 are handled in a later workflow step.
+
diff --git a/docs/security/m0-dependency-validation.md b/docs/security/m0-dependency-validation.md
new file mode 100644
index 0000000..2620de8
--- /dev/null
+++ b/docs/security/m0-dependency-validation.md
@@ -0,0 +1,20 @@
+# M0 dependency validation (registry metadata)
+
+Task T0.2. Read-only `npm.cmd view <pkg>@<exact> --json` lookups against the public npm registry (PowerShell 7.6.10, Node v24.22.3, npm.cmd 11.19.1, pnpm.cmd 10.34.9). Nothing installed, no dependency script run. Candidates: `design.md` 9.1.
+
+Result: all 32 candidates (31 packages plus the pnpm packageManager pin) exist at the exact version with the license stated in design 9.1. None declares `preinstall`, `install` or `postinstall`. `prepare` exists on globals, jsdom and @axe-core/playwright and is not run for registry installs. One difference: D1.
+
+Licenses: Apache-2.0 for typescript and @playwright/test; MPL-2.0 for @axe-core/playwright (approved exception E1, dev only); MIT for all others.
+
+Engines vs host Node v24.22.3: jsdom `^24.15.0`, vitest `^24.0.0`, jest-dom `>=22`, @axe-core/playwright `>=22.12.0`, electron `>=22.12.0`. All satisfied.
+
+## Findings
+- D1. eslint 9.39.5 is deprecated ("This version is no longer supported", eslint.org/version-support). Every 9.x release carries the notice; `latest` is 10.15.0, `maintenance` is 9.39.5. Design 9.2 holds 9.x because eslint-plugin-react 7.37.5 and eslint-plugin-jsx-a11y 6.10.2 peer at most `eslint ^9`. pnpm prints a WARN only. T0.2 stops on any difference: human decision needed (accept for this phase, or ADR for ESLint 10 with other plugins).
+- Only exact pins were validated; design dist-tag claims were not re-checked except eslint.
+
+## Commands
+32 per-package `npm.cmd view` calls, exit 0 each; `npm.cmd view eslint dist-tags --json` and `npm.cmd view eslint@9 version deprecated --json`, exit 0. TLS verification succeeded; no setting changed.
+
+## Human decision
+D1 resolved: eslint 9.39.5 accepted temporarily; see m0-resolution-report.md addendum.
+
diff --git a/docs/security/m0-final-security-validation.md b/docs/security/m0-final-security-validation.md
new file mode 100644
index 0000000..ec8f5a1
--- /dev/null
+++ b/docs/security/m0-final-security-validation.md
@@ -0,0 +1,90 @@
+# M0 final security validation
+
+Workflow `wf_68835a08506da2aa`, step 4. Reviewer: security-reviewer (read-only, no shell). Labels: VERIFIED (read in this repository), DOCUMENTED (stated in an earlier report or ADR), ASSUMED (neither).
+
+## 1. C1 to C4 and S1 to S5
+
+Source: `docs/security/m0-security-review.md` (conditions), `m0-post-install-validation.md` and `m0-closure-validation.md` (evidence). I did not re-run any check. I re-read `pnpm-workspace.yaml` and `package.json`.
+
+| ID | Status | Basis | Label |
+|---|---|---|---|
+| C1 (install as approved, no script other than esbuild) | Satisfied | Operator install exit 0. `ignoredBuilds: []`, `pendingBuilds: []`, installed-tree scan found one script-bearing package, `esbuild@0.28.2`. | DOCUMENTED |
+| C2 (build-flagged set is esbuild allowed, fsevents denied) | Satisfied | Same scan. `fsevents` not installed on win32. | DOCUMENTED |
+| C3 (registry, TLS, no proxy or token config) | Satisfied | Pre-install config check in `m0-post-install-validation.md`. `.modules.yaml` registry corroborates. | DOCUMENTED |
+| C4 (`pnpm audit`) | Satisfied | 0 known vulnerabilities, 0 high, 0 critical. Point-in-time result. | DOCUMENTED |
+| S1 (policy honored) | Resolved with a stated limit | Effective config keys resolve from the workspace file. `esbuild` is absent from `ignoredBuilds`, so the version-qualified allow entry was applied. The failure branch of `strictDepBuilds` was not exercised (it would need a violating install). Final state is the same either way. | DOCUMENTED |
+| S2 (script set from the installed tree) | Resolved | Installed-tree scan replaces registry metadata. | DOCUMENTED |
+| S3 (`.npmrc` and registry) | Resolved | Same evidence as C3. No `.npmrc` exists at repo root (root listing). | VERIFIED (file absent), DOCUMENTED (config) |
+| S4 (eslint 9.39.5 deprecated) | Accepted | Dev only, human accepted, audit clean. Reassess before first public release. | DOCUMENTED |
+| S5 (identity of `@electron/get`, `@electron-internal/extract-zip`) | Resolved | MIT, `github.com/electron/*`, Electron-owned maintainers. | DOCUMENTED |
+
+Residual: whether esbuild's postinstall actually ran is not observable (closure report section 5). This has no security effect, since it is the one approved script.
+
+## 2. Module-system decision (no `"type": "module"`)
+
+Input: the module-review verdict "VALID WITH EXCEPTION" (E-ESM-1), plus ADR 0002 item 6.
+
+Evidence read now:
+
+- `package.json`: no `type` field. `main` is `./out/main/index.js`. VERIFIED.
+- `electron.vite.config.ts`: main and preload use `output.format: 'cjs'` with `entryFileNames: '[name].js'`. Preload sets `externalizeDeps: false`, so dependencies are bundled into one file. Renderer uses defaults. VERIFIED.
+- `src/main/constants.ts`: preload is resolved as `../preload/index.js`. Matches the config. VERIFIED.
+- All `tsconfig.*.json`: `module: ESNext`, `moduleResolution: bundler`, `verbatimModuleSyntax: true`. Source stays ESM. VERIFIED.
+- ADR 0002 records E-ESM-1, scoped to main and preload output and the missing `type` field, and lists rejected alternatives. It is marked pending human approval. VERIFIED.
+
+Security assessment:
+
+| Aspect | Verdict |
+|---|---|
+| `sandbox: true` preserved | Yes. The decision exists to keep a sandboxed preload. The rejected alternative (ESM preload with `sandbox: false`) would violate `tech.md` and is correctly refused. |
+| Preload attack surface | Reduced. One bundled CJS file means the sandboxed preload needs no `require` of `node_modules` at runtime. Bundling puts all preload dependencies under the lockfile and review, which should stay small (`zod` and `src/shared` only). |
+| Renderer | Browser ES modules served from `app://renderer`. Unaffected by the `type` field. Must stay under the strict CSP (ADR 0003). |
+| Tool configs | `.mjs` extension gives ESM without the `type` field. No security effect. |
+| Regression risk | A later change to `type`, extensions or format would silently switch the preload to `.mjs` and break the bridge, tempting someone to disable the sandbox. ADR 0002 requires a new ADR for that change. Adequate. |
+
+Security verdict: ACCEPTABLE. No mandatory `tech.md` security rule is weakened. E-ESM-1 touches only "ES modules everywhere", which is not a security rule.
+
+Conditions (non-blocking for M0, required for M1 acceptance):
+
+1. A built `out/preload/index.js` exists as a single file with no `require` of packages, and a test shows the bridge is present under `sandbox: true`. The sandbox, contextIsolation, nodeIntegration and webSecurity values must be asserted in a test.
+2. Confirm that `electron.vite.config.ts` (which uses `import.meta.url` without a `type` field) loads in electron-vite 6, and that ESM-only main dependencies load from the CJS main.
+3. Evidence limit: Electron sandbox and ESM-preload behavior is recalled from the Electron documentation, not re-fetched, and no build exists. ASSUMED until the gates pass.
+4. The human has not yet approved E-ESM-1, and `tech.md` has not been amended. Both are open and belong to the human.
+
+## 3. Policy and lockfile drift
+
+| Check | Result | Label |
+|---|---|---|
+| `strictDepBuilds: true` | Unchanged | VERIFIED |
+| `onlyBuiltDependencies: [esbuild@0.28.2]` | Unchanged | VERIFIED |
+| `ignoredBuiltDependencies: [fsevents]` | Unchanged | VERIFIED |
+| `dangerouslyAllowAllBuilds`, `pnpm` block in `package.json`, `.npmrc` | Absent | VERIFIED |
+| `package.json` pins | Same shape as recorded (exact pins, `packageManager: pnpm@10.34.9`). No new dependency or script that invokes a lifecycle hook. | VERIFIED |
+| `pnpm-lock.yaml` SHA-256 equals `E41CB59B...2659` | NOT COMPUTED. I have no shell and no tool that reads file hashes. The last recorded hash (`m0-post-install-validation.md`) is that value, identical to the pre-install hash. The lockfile is untracked, so `git diff` cannot show drift. | ASSUMED unchanged |
+
+Human or orchestrator command to close this check (read-only):
+
+```powershell
+(Get-FileHash pnpm-lock.yaml -Algorithm SHA256).Hash -eq 'E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659'
+```
+
+Expected output: `True`. A `False` result is a stop for human review.
+
+## 4. Findings
+
+| ID | Severity | Location | Evidence | Fix | Owner |
+|---|---|---|---|---|---|
+| F1 | High (acceptance, not a vulnerability) | `src/` tree | `src/` holds only `src/main/constants.ts` and `src/shared/ipc/channels.ts`. `src/main/index.ts`, `src/main/window/**`, `src/main/ipc/**`, `src/preload/**` and `src/renderer/**` do not exist, and `tests/` holds only `config` and `setup`. `electron.vite.config.ts` references `src/main/index.ts`, `src/preload/index.ts` and `src/renderer/index.html` as build inputs, so `pnpm build` cannot succeed. This contradicts the report that M1 is implemented. | Confirm whether the M1 files were lost, not written to this checkout, or are on another path. Re-create or restore them. Until they exist, none of the M1 security controls (web preferences, CSP, sender validation, navigation guards, preload surface) can be reviewed. | desktop-engineer, orchestrator |
+| F2 | Low | ADR 0002, steering | E-ESM-1 not human-approved. `tech.md` not amended. | Human decision, then a steering update by the human. | human, necro-architect |
+| F3 | Low | Lockfile hash | Not recomputed (no shell). | Run the command in section 3. | orchestrator |
+
+## 5. Result
+
+- C1 to C4: satisfied. S1 to S5: resolved or accepted, S1 and C1 with the stated limits.
+- Module decision: security-acceptable, subject to the M1 gates above.
+- Policy drift: none in `pnpm-workspace.yaml`. Lockfile hash: unconfirmed by me (F3).
+- Blocking finding: F1 blocks M1 acceptance. It does not block M0 security closure.
+
+Unreviewed: the M1 runtime code (see F1), CSP and protocol handler code, GitHub, token storage and skin loader (not yet in scope).
+
+No source modified.
diff --git a/docs/security/m0-post-install-validation.md b/docs/security/m0-post-install-validation.md
new file mode 100644
index 0000000..9f2f5fd
--- /dev/null
+++ b/docs/security/m0-post-install-validation.md
@@ -0,0 +1,29 @@
+# M0 post-install validation
+
+Scope: evidence collected after the human operator ran `pnpm.cmd install --frozen-lockfile` manually in the repository root (Windows x64, PowerShell 7, pnpm 10.34.9). The agent did not run the install: Kiro's tool guard blocked the agent-run attempt, and the operator ran it instead. No agent permissions or security policies were changed. The checks below are read-only, except that `pnpm audit` and `npm view` made registry queries.
+
+## Results
+
+| Check | Command | Exit | Result |
+|---|---|---|---|
+| Install | `pnpm.cmd install --frozen-lockfile` (run by the operator) | 0 per the operator | `node_modules` is present. `.modules.yaml` records `packageManager: pnpm@10.34.9`, layout version 5. |
+| Lockfile integrity | `Get-FileHash pnpm-lock.yaml -Algorithm SHA256` | 0 | `E41CB59BD827D8A6E461BBA3BC7FED27D81F58F1EA5260428FA1DC57B9042659`, identical to the pre-install hash. The lockfile is untracked, so `git diff` is empty by construction. The hash match is the evidence. |
+| Top-level versions | `pnpm.cmd ls --depth 0 --json` compared with the `package.json` pins | 0 | 0 mismatches across all 32 pins. Examples: electron 45.5.0, electron-vite 6.0.0, vite 7.3.8, typescript 6.0.3, vitest 5.1.2, react 19.3.1, zod 4.6.7, zustand 5.1.0, eslint 9.39.5. Every package resolved from `https://registry.npmjs.org/`. |
+| Effective lifecycle policy | `pnpm-workspace.yaml` | n/a | `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`. There is no `dangerouslyAllowAllBuilds`, and electron is not allowlisted. |
+| C1 scripts that ran | `pnpm.cmd ignored-builds`, `node_modules/.modules.yaml` | 0 | Automatically ignored builds: none. `pendingBuilds` and `ignoredBuilds` are empty. strictDepBuilds would have failed the install if any unlisted package had a build script, so exit 0 means only esbuild@0.28.2 was eligible to run. The esbuild binary package `@esbuild/win32-x64@0.28.2` is installed. Electron's `dist/` and `path.txt` are absent, which confirms that no electron script downloaded the binary. |
+| C2 build-flagged set | `Select-String pnpm-lock.yaml 'requiresBuild'` | 0 | 0 matches. pnpm 10 lockfiles do not record `requiresBuild`. The effective set is esbuild (allowed and executed) plus fsevents (denied, and also skipped on win32 as an optional platform package). No other package was flagged. |
+| C3 config | Verified by the orchestrator before install | n/a | There is no project or user `.npmrc` and no relevant environment variables. The registry is `https://registry.npmjs.org/` with strict-ssl true and no proxy or CA overrides. |
+| C4 audit | `pnpm.cmd audit` | 0 | "No known vulnerabilities found". There are 0 high and 0 critical findings. |
+| S5 provenance | `pnpm.cmd why …` and `npm.cmd view <pkg>@<ver> maintainers license repository.url` | 0 | `@electron-internal/extract-zip@1.0.10` (MIT, `github.com/electron/extract-zip`; maintainers: marshallofsound, electron-cfa, electronhq). `@electron/get@5.1.0` (MIT, `github.com/electron/get`; maintainer: electron-cfa). Both are pulled in only by `electron@45.5.0`, a devDependency. The maintainers are Electron project accounts, so S5 is resolved. |
+| T0.8 / V11 licenses | `pnpm.cmd licenses list --json` and `--prod --json` | 0 | Prod: MIT only (7 packages). All: MIT 333, Apache-2.0 22, ISC 11, BSD-2-Clause 9, BSD-3-Clause 3, BlueOak-1.0.0 4, Python-2.0 1, CC-BY-4.0 1, CC0-1.0 1, MPL-2.0 2 (`@axe-core/playwright@4.14.1` and `axe-core@4.14.1` only, exception E1). Every license is in the accepted set. |
+
+## Limits
+
+- The agent did not see the operator's console output. "Only esbuild's postinstall ran, with no lists-ignored warning" is inferred from the exit code, the strictDepBuilds semantics and the `node_modules` state, not from a log.
+- The skipped optional packages (non-win32 esbuild, rollup and rolldown binaries, fsevents, and the wasm-only `@emnapi`, `@napi-rs` and `@tybys` packages) were not installed. This is expected on win32.
+
+## Still open in M0
+
+- V3, the Electron binary download: Electron's `dist/` is absent, so `pnpm exec electron --version` (M0 acceptance criterion 4) and the embedded Node value (Appendix A.7) are not yet available. T0.8 schedules this download.
+- `.gitignore` additions for `test-results` and `playwright-report` (T0.4).
+- ADRs 0002 to 0005 and `docs/architecture/dependency-versions.md` (T0.3) are not covered by this record.
diff --git a/docs/security/m0-resolution-report.md b/docs/security/m0-resolution-report.md
new file mode 100644
index 0000000..d77bb44
--- /dev/null
+++ b/docs/security/m0-resolution-report.md
@@ -0,0 +1,38 @@
+# M0 resolution report
+
+Command: `pnpm.cmd install --lockfile-only --ignore-scripts` (exit 0, run twice; second run left `pnpm-lock.yaml` byte-identical). No `node_modules`, no real install, no dependency lifecycle script executed. Lockfile: `lockfileVersion 9.0`, 472 packages.
+
+## Resolved top-level versions (all equal the pins in package.json)
+Dependencies: react 19.3.1, react-dom 19.3.1, zod 4.6.7, zustand 5.1.0.
+Dev: @axe-core/playwright 4.14.1, @eslint/js 9.39.5, @playwright/test 1.65.1, @testing-library/dom 10.4.2, jest-dom 8.0.0, react 16.3.3, user-event 14.6.13, @types/node 24.19.4, @types/react 19.3.3, @types/react-dom 19.3.0, @vitejs/plugin-react 5.2.0, @vitest/coverage-v8 5.1.2, electron 45.5.0, electron-vite 6.0.0, eslint 9.39.5, eslint-config-prettier 10.1.8, eslint-plugin-jsx-a11y 6.10.2, eslint-plugin-react 7.37.5, eslint-plugin-react-hooks 7.1.1, fast-check 4.11.0, globals 17.14.0, jsdom 31.0.1, prettier 3.10.1, typescript 6.0.3, typescript-eslint 8.74.0, vite 7.3.8, vitest 5.1.2.
+Notable transitive: esbuild 0.28.2, rolldown 1.2.19, playwright and playwright-core 1.65.1, axe-core 4.14.1, postcss 8.5.33, fsevents 2.3.3 (optional, macOS).
+
+## Lifecycle scripts
+`--lockfile-only` does not write `requiresBuild`, so every one of the 472 locked name@version pairs was looked up in registry metadata (`preinstall`, `install`, `postinstall`, `gypfile`). 0 lookup failures.
+
+| Package | Script | Decision |
+|---|---|---|
+| esbuild 0.28.2 | `postinstall: node install.js` | ALLOW `esbuild@0.28.2`. Body read from the registry tarball: picks the platform binary from the `@esbuild/*` optional package, runs it for a version check, and only on a missing optional package falls back to `npm install` or an https download from registry.npmjs.org, verified by a SHA-256 in package.json. No other network use. |
+| fsevents 2.3.3 | `install: node-gyp rebuild` (gypfile) | DENY (`ignoredBuiltDependencies`). macOS only, optional. |
+| electron 45.5.0 | none | DENY (not listed). Binary is fetched on demand (design 9.3, V3). |
+| all other 469 | none | DENY (not listed). |
+
+Version-qualified allow entry means a bump of esbuild fails the install under strict builds until reviewed again.
+
+## Licenses (transitive, 472 packages)
+MIT 413, Apache-2.0 25, ISC 12, BSD-2-Clause 9, BlueOak-1.0.0 4, BSD-3-Clause 3, MPL-2.0 2, 0BSD 1, CC-BY-4.0 1, CC0-1.0 1, Python-2.0 1.
+- MPL-2.0: @axe-core/playwright 4.14.1 and axe-core 4.14.1 only. Approved exception E1, dev only. No other MPL-2.0 package (no lightningcss).
+- Outside the permissive set but not copyleft-code concerns, for human confirmation: caniuse-lite 1.0.30001828 (CC-BY-4.0, data, dev tooling via browserslist), argparse 2.0.1 (Python-2.0, permissive PSF-style, dev), language-subtag-registry 0.3.23 (CC0-1.0, data, dev). BlueOak-1.0.0 (isaacs packages: minimatch, lru-cache, graceful-fs, nonrecursive-glob-match) is permissive.
+- Source: registry `license` field, not a file scan. `pnpm licenses` is T0.8 after install.
+
+## Deprecations
+eslint 9.39.5 only (see validation report D1).
+
+## Policy placement
+pnpm 10.34.9 accepted `onlyBuiltDependencies` and `ignoredBuiltDependencies` under `pnpm` in package.json without error. `strictDepBuilds: true` could NOT be written: this agent may not write `pnpm-workspace.yaml` or `.npmrc`. Its effect cannot be proven without a real install (`pnpm config get` does not display it). Orch must write `pnpm-workspace.yaml` containing `strictDepBuilds: true` (and may then move the two lists there, deleting the `pnpm` block in package.json to avoid duplicate sources).
+
+## Human decisions (orchestrator addendum, after original evidence above)
+- ESLint (scoped dependency decision, not architectural decision D1): eslint 9.39.5 accepted temporarily for Desktop Foundation. Reasons: peer compatibility with eslint-plugin-react 7.37.5 and eslint-plugin-jsx-a11y 6.10.2 (both peer at most eslint ^9); development-only. Conditions: record upstream deprecation and end-of-life status; verify known vulnerabilities (post-install `pnpm audit`); never bundle ESLint in production; add migration to ESLint 10 or a supported equivalent to the engineering backlog; resolve or reassess before the first public release. Version pin unchanged.
+- Licenses accepted: BlueOak-1.0.0; Python-2.0 (argparse); CC0-1.0 (language-subtag-registry); CC-BY-4.0 (caniuse-lite, attribution required). MPL-2.0 exception E1 (axe-core, @axe-core/playwright, dev only) preserved. Project license stays MIT.
+- Registry license metadata is preliminary. Installed-package license verification runs after installation (T0.8). THIRD_PARTY_NOTICES.md generation and validation belongs to the packaging or release milestone.
+- Lifecycle: allow esbuild@0.28.2 postinstall; deny fsevents and all other unreviewed scripts; Electron official binary acquisition approved in principle.
diff --git a/docs/security/m0-security-review.md b/docs/security/m0-security-review.md
new file mode 100644
index 0000000..4a90ee2
--- /dev/null
+++ b/docs/security/m0-security-review.md
@@ -0,0 +1,59 @@
+# M0 security review: dependency manifest and lifecycle configuration
+
+Reviewer: security-reviewer (independent, read-only). Authority: `tech.md` (Dependencies, CI/CD), `product.md` principles 4 and 5, `design.md` section 9 (9.3 lifecycle policy, 9.5 licenses).
+Status labels: VERIFIED (read in this review), DOCUMENTED (stated in another report or the design, not re-run), ASSUMED.
+
+## Verdict: PASS WITH CONDITIONS
+
+No blocking defect in the manifest, the lockfile or the allowlist. Four conditions must be met at or immediately after the installation approval gate (C1 to C4). No source modified.
+
+## Scope and method
+Files read: `package.json`, `pnpm-lock.yaml` (importers block fully, all `resolution`, `deprecated`, `optional` and prerelease lines by pattern search), `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, `docs/security/m0-dependency-validation.md`, `docs/security/m0-resolution-report.md`, `design.md` 9.3 and 9.4 to 9.5 policy text.
+Not readable: `.npmrc` (agent deny rule `**/.npmrc`). Not possible: running pnpm, `pnpm audit`, registry or advisory lookups (no shell; web access limited to electronjs.org, docs.github.com, owasp.org, nvd.nist.gov).
+
+## Findings
+
+| ID | Severity | Location | Evidence | Fix | Owner |
+|---|---|---|---|---|---|
+| S1 | Medium | `pnpm-workspace.yaml` (all 3 keys) | The resolution report ran `--lockfile-only` before this file existed and states the effect of `strictDepBuilds` "cannot be proven without a real install". Whether pnpm 10.34.9 honors a settings-only workspace file, and whether `ignoredBuiltDependencies: fsevents` counts as reviewed under strict mode, is UNVERIFIED (design 9.3, V1/V2). | Condition C1: run the install exactly as approved; treat a non-zero exit, a warning that the lists were ignored, or any script other than esbuild's `postinstall` as a stop. If rejected, move the same three keys to `pnpm` in `package.json` (design 9.3 fallback) or to `allowBuilds`, never to `dangerouslyAllowAllBuilds`. | orchestrator, desktop-engineer |
+| S2 | Medium | `pnpm-lock.yaml`, whole file | `requiresBuild` is absent from the lockfile (VERIFIED by search; expected for `--lockfile-only`). The "only esbuild has a script" claim rests on 472 registry metadata lookups (DOCUMENTED, not re-run). Registry metadata can differ from what pnpm detects in the tarball (for example a script-less manifest with a `binding.gyp`). | Condition C2: after install, list packages that pnpm reports as having builds (`pnpm ignored-builds` and a lockfile search for `requiresBuild: true`). Expected set: esbuild 0.28.2 (allowed) and fsevents 2.3.3 (denied, optional, not installed on Windows or Linux). Any other entry stops work for human approval. | orchestrator |
+| S3 | Medium | `.npmrc` (not readable) | Design 9.5 says it contains only `engine-strict=true` (DOCUMENTED). I could not read it. The lockfile records no registry URL, only `sha512` integrity, so the registry used at install time is decided by `.npmrc` and user-level config. | Condition C3: the human or orchestrator confirms the committed `.npmrc` has no `registry=`, `_authToken`, `proxy`, `cafile`, `strict-ssl=false` or path settings. Confirm no user-level `~/.npmrc` or `npm_config_*`/`PNPM_*` variable overrides the registry (the TLS-error history in the task makes this worth one check). Do not disable TLS validation. | orchestrator (human confirms) |
+| S4 | Low | `pnpm-lock.yaml:1272` | `eslint@9.39.5` carries `deprecated: This version is no longer supported`. VERIFIED. Human accepted it temporarily (resolution report addendum). Dev only. | Condition C4: run `pnpm audit` after install and report results before M1 closes. Keep the addendum conditions: never bundled, ESLint 10 migration on the backlog, reassess before first public release. | desktop-engineer, orchestrator |
+| S5 | Low | `pnpm-lock.yaml` electron entry (3219 to 3225) | `electron@45.5.0` depends on `@electron-internal/extract-zip@1.0.10` and `@electron/get@5.1.0`. Both are unfamiliar scope names to me. They are the only direct dependencies of electron and have no scripts (DOCUMENTED). I cannot confirm publisher identity from my allowed sources. | After install, confirm with `pnpm why` that both are reached only through `electron`, and have the orchestrator record the npm maintainer for each scope (`npm.cmd view <pkg> maintainers`). Treat a maintainer unrelated to the Electron organization as a stop. Status: ASSUMED legitimate. | orchestrator |
+| S6 | Low | `design.md` 9.3, Electron binary | The Electron binary is fetched at first run or by `install-electron`, outside the lockfile. Integrity relies on `@electron/get` checksums published in the same GitHub release. | Accepted in principle by the human. Keep: no mirror or `ELECTRON_*` override in the repo; download only after the approval gate; record the version and checksum source in the M0 completion report. Revisit when packaging adds Electron Fuses and signing (open decisions 10, 11). | desktop-engineer, release-engineer |
+| S7 | Low | `.gitignore` | `.npmrc` is not ignored (correct, it is intentionally committed) but a later local edit adding a token would be committable. `.env*` is ignored; `.kiro` is not ignored (VERIFIED, matches kiroween rules). | Add a secret-scan step to CI and the M1 hook plan; no change needed now. | release-engineer |
+| S8 | Info | `pnpm-lock.yaml:223-228, 2405-2416` | Transitive prereleases `@emnapi/core` and `@emnapi/runtime` `2.0.0-beta.2` and `@rolldown/pluginutils 1.0.0-rc.3`, `gensync 1.0.0-beta.2`. The emnapi pair is `optional: true`, reached only through `@rolldown/binding-wasm32-wasi` (wasm32 CPU only, not installed on x64 or arm64 hosts). The others are build-time and long-standing. | None. Listed so the license and notice pass (T0.8) covers them. | none |
+| S9 | Info | `package.json` | `packageManager` is `pnpm@10.34.9` with no integrity hash. Acceptable; a hash pin is optional hardening. `minimumReleaseAge` is deliberately unset (design 9.5). | None required. | none |
+
+## Check results
+
+| Check | Result | Status |
+|---|---|---|
+| Exact pins | All 4 dependencies and 28 devDependencies are exact (no `^`, `~`, ranges, tags). Every lockfile importer `specifier` equals the `package.json` value and `version` equals the specifier. `engines.node` is `>=24.15.0 <25`; `.nvmrc` is `24`; `packageManager` pnpm@10.34.9. | VERIFIED |
+| Lockfile integrity and sources | `lockfileVersion 9.0`. A search for any `resolution:` line not starting with `integrity` found 0. No `tarball`, `git`, `file:`, `link:`, `workspace:` or `http(s)` resolutions (the only URL is in the eslint deprecation text). Every entry uses `sha512` integrity. No `overrides`, `patchedDependencies` or `catalogs` blocks. Registry host itself is not recorded in the lockfile. | VERIFIED (registry host: see S3) |
+| Typosquats and unexpected packages | All 32 top-level names are the well-known packages for their purpose. No lookalike names, no install-helper or "postinstall-only" packages, no `core-js`, `node-gyp` or `puppeteer`-style downloaders in the lockfile. Only S5 needs an identity check. 472 packages with no sign of unrelated additions. | VERIFIED (S5 residual) |
+| Lifecycle allowlist | `pnpm-workspace.yaml`: `strictDepBuilds: true`; `onlyBuiltDependencies: [esbuild@0.28.2]` (version-qualified, so a bump fails the install); `ignoredBuiltDependencies: [fsevents]`. Electron is in neither list, correct because it has no script (design 9.3, V3). `fsevents@2.3.3` is `optional: true` in the lockfile. No `dangerouslyAllowAllBuilds`, `ignoreScripts` or `neverBuiltDependencies`. `package.json` has no `pnpm` block, so there is a single policy source. | VERIFIED (behavior: S1, S2) |
+| Project scripts | No `preinstall`, `install`, `postinstall`, `prepare`, `prepublish*` or `pre*`/`post*` entries. Bodies call only `electron-vite`, `tsc`, `eslint`, `prettier`, `vitest`, `playwright`. No `curl`, `node -e`, shell chaining or publish commands. Consistent with `docs/engineering/package-script-policy.md` intent (policy file not re-read). | VERIFIED |
+| esbuild script | Body read from the registry tarball by the resolver (verifies the platform binary; network fallback only when the optional package is missing, with SHA-256 check). esbuild also works without the script, so the allowance is small. | DOCUMENTED |
+| Licenses and E1 | `@axe-core/playwright` is in `devDependencies` only; `axe-core` is transitive only through it. Resolution report lists MPL-2.0 for exactly these two. No other MPL-2.0 (Vite 7 chosen to avoid lightningcss). Human accepted BlueOak-1.0.0, Python-2.0, CC0-1.0, CC-BY-4.0. Data is from registry `license` fields, not a file scan. | DOCUMENTED; installed-package check is T0.8 |
+| Deprecated or advisory-flagged | Only `eslint@9.39.5` is flagged `deprecated` in the lockfile (S4). No advisory lookup was possible for any of the 472 packages. Absence of known vulnerabilities is NOT established. | VERIFIED (deprecation); advisories ASSUMED clear until C4 |
+| Machine-specific config | `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, and both M0 reports contain no absolute paths, proxy, certificate, token or user data. The reports name tool versions only. `.npmrc` unread (S3). | VERIFIED except `.npmrc` |
+| Renderer-facing risk | `react`, `react-dom`, `zod`, `zustand` are the only runtime dependencies. No Octokit, Shiki, markdown or HTML-rendering package is present yet, so no untrusted-content library is introduced at M0. | VERIFIED |
+
+## Conditions for the installation approval gate
+- C1. Install with the exact approved command and `--frozen-lockfile`. Expect exit 0 with only esbuild's `postinstall` run. Stop on any other script, any warning that the lists were ignored, or any lockfile change (S1).
+- C2. After install, enumerate build-flagged packages and confirm the set equals {esbuild allowed, fsevents denied} (S2).
+- C3. Confirm `.npmrc` and user-level npm/pnpm configuration contain no registry, proxy, certificate or TLS overrides (S3).
+- C4. Run `pnpm audit` after install and report high or critical findings to the human before M1 closes (S4).
+
+## Unreviewed areas
+`.npmrc` contents; `docs/engineering/package-script-policy.md` text; installed `node_modules` contents; transitive package source code (only esbuild's script was inspected, by the resolver); advisory databases; CI workflows (none exist yet); `tasks.md`.
+
+No source modified.
+
+## Addendum (2026-11-26, orchestrator, factual)
+The human accepted this document as the canonical T0.6 deliverable. No duplicate review was produced.
+- Root `.npmrc` (approved by the human, written after this review): exactly one line, `engine-strict=true`, plus a trailing newline (19 bytes). No registry, token, proxy, certificate, TLS or machine-specific setting. It is not ignored by `.gitignore`. This addresses finding S3 (the file was unreadable to the reviewer; its content is now quoted here by the orchestrator).
+- C3 evidence (checked by the orchestrator before installation): no project or user-level `.npmrc`, no npm or pnpm global config file, no `npm_config_*`, `PNPM_*`, `NODE_TLS*`, proxy or `ELECTRON_*` environment variables; effective npm config had registry `https://registry.npmjs.org/`, `strict-ssl = true`, and null `proxy`, `https-proxy`, `ca`, `cafile`.
+- Later evidence: `m0-post-install-validation.md`, `m0-closure-validation.md` and `m0-final-security-validation.md` record the post-install conditions C1, C2 and C4 and findings S1 to S5. Accepted limits (Gate 4): the `strictDepBuilds` rejection branch was not exercised, and execution of esbuild's `postinstall` was not observed.
+- Policy and pins unchanged: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`, `ignoredBuiltDependencies: [fsevents]`.
diff --git a/docs/security/m2-m3-focused-review.md b/docs/security/m2-m3-focused-review.md
new file mode 100644
index 0000000..693e379
--- /dev/null
+++ b/docs/security/m2-m3-focused-review.md
@@ -0,0 +1,112 @@
+# Focused security review: M2 (main process) and M3 (shared IPC, preload), second pass
+
+Reviewer: security-reviewer (independent, read-only). One pass. Branch `feature/desktop-foundation`. Skill loaded: `electron-security`. Builds on `docs/security/m2-m3-security-review.md` (first pass, F-1 to F-8). Findings here use IDs `S-n`.
+
+## Verdict: APPROVED (no confirmed defects)
+
+No Critical, High or Medium findings. Two Low and several Info items are NOTEs that need no code fix before M2/M3 acceptance. Runtime behavior is not verified (see "Not verified").
+
+## Evidence labels and limits of this review
+
+- VERIFIED: read in this repository (production code and tests).
+- DOCUMENTED: stated in the official Electron documentation for 45.5.0. **I could not fetch any Electron documentation.** `web_fetch` was denied by the agent profile permission rule (`deny web_fetch matching "*"`), and `node_modules/electron/electron.d.ts` (28,659 lines) cannot be searched or parsed with the tools I have. Every Electron behavior claim below is therefore labeled ASSUMED (recalled from the Electron API docs, not re-checked against 45.5.0). The first pass records that the 45.5.0 typings declare `will-navigate`, `will-redirect`, `will-frame-navigate`, `will-attach-webview` and the three permission setters (code comments in `navigation-guards.ts` and `permissions.ts`, task T2.0). I did not re-verify that.
+- ASSUMED: not exercised and not re-checked.
+- I have no shell. I executed nothing and ran no tests. The "542 passed, 2 skipped" figure is taken from the brief.
+
+## 1. IPC sender validation: decision
+
+Code (VERIFIED): `src/main/security/sender-validation.ts` `isTrustedSender` returns true only if, in order inside one `try`: `event.senderFrame` is not null or undefined; `frame.parent === null` (strict, so `undefined` fails); `isTrustedUrl(frame.url, trusted)`; `isRegisteredSender(event.sender)`. Any throw returns false. `src/main/index.ts` supplies `isRegisteredSender = sender => mainWindow !== null && sender === mainWindow.webContents`. `register-handler.ts` calls the check first, synchronously at the top of the `ipcMain.handle` listener, wraps it in a second `try/catch`, and is the only `ipcMain.handle` caller (grep over `src/**` found no `ipcMain.on`, `once`, `handleOnce`).
+
+### Decision: ACCEPT the `parent === null` plus registered-sender design. It is equivalent in effect to `senderFrame === sender.mainFrame` for this threat model. No correction required. One optional hardening is listed (S-1).
+
+| Required guarantee | Control | Result |
+|---|---|---|
+| Sender belongs to the registered, authorized WebContents | `sender === mainWindow.webContents` (identity). A foreign, unregistered or `undefined` sender fails. After close, `mainWindow` is null so every call fails. | HELD (VERIFIED code and tests `rejects an unregistered sender`) |
+| Sender is the intended top-level application frame | `parent === null` and trusted origin on a registered contents. Within one registered contents the only frames with `parent === null` are top frames of a frame tree. | HELD, with the S-1 caveat (ASSUMED Electron semantics) |
+| Subframes cannot invoke privileged handlers | `parent !== null` returns false, even on the trusted origin (test `rejects a sub-frame even on a trusted origin`). Independently, CSP `frame-src 'none'` and `will-frame-navigate` block creating a non-trusted subframe. | HELD |
+| Unexpected or destroyed WebContents rejected | Identity check against the current `mainWindow.webContents`. Reading `webContents` on a destroyed window throws and is caught. | HELD (ASSUMED that the getter throws on a destroyed object; the result is false either way) |
+| Untrusted origins rejected | `originOf` builds `protocol//host` with the WHATWG parser and compares exact membership in `trusted`. Credentials, empty host, `blob:`, `about:`, `file:`, `data:`, port-bearing hosts (`renderer:80`) and lookalike hosts all fail (VERIFIED by reading `trusted-origins.ts`; test table covers lookalikes). Production trusts only `app://renderer`. | HELD |
+| Navigation cannot invalidate the trust assumptions | See below. | HELD |
+| Missing, detached or inaccessible frames fail closed | `null`/`undefined` frame, missing `parent`, throwing getters, throwing registration check all return false (tests present). | HELD |
+
+Navigation and frame replacement (answers to the review questions):
+
+- What `event.senderFrame` points to (ASSUMED, Electron `IpcMainInvokeEvent` docs): the frame that sent the message. It is `null` if the frame was destroyed or navigated away by the time it is read. A `null` is rejected.
+- Is the URL re-checked at call time (VERIFIED): yes. `frame.url` is read inside `isTrustedSender` on every invoke. Nothing is cached.
+- Is there an async gap (VERIFIED): no. The check runs synchronously at the start of the listener, before any `await`. The earlier `isRegisteredSender` also runs at call time against the current `mainWindow`.
+- After `will-navigate`, `will-frame-navigate`, `will-redirect`: `navigation-guards.ts` calls `preventDefault()` on every URL whose origin is not trusted, for all web contents created by the app (`web-contents-created`). The top frame can therefore only move within `app://renderer` (or the dev origin in a dev run). A stale frame from before a navigation would still be on the trusted origin. Programmatic `loadURL` from main is not guarded by these events but main only loads `target.url` (`create-main-window.ts`).
+- After reload or cross-process frame swap (ASSUMED): a frame object from the old document either reads as destroyed (null) or still reports a trusted URL. Both outcomes are safe, because the document is the same trusted origin.
+- Disposed frame getters (ASSUMED): a detached frame reports an empty URL and a null parent in recalled Electron behavior. The empty URL fails `originOf`, so a null `parent` on a dead frame cannot pass. This is why the origin check and the parent check must stay together. Do not remove the origin check.
+
+Why not an explicit `mainFrame` comparison: both approaches reject subframes and foreign contents. The explicit comparison is stricter only for other top-level frame trees inside the same registered contents (for example a prerender tree). Such a frame would have to be a same-origin `app://renderer` document, which already holds the same preload bridge and the same capabilities as the primary page. No privilege boundary is crossed, so the extra strictness adds no protection here. The explicit comparison also relies on JS object identity of `WebFrameMain` wrappers across frame swaps (ASSUMED), which can only produce false negatives (fail closed).
+
+Conditions that keep this decision valid (record them in the design or an ADR note):
+1. Any future window or WebContents that gets the preload must be added to `isRegisteredSender` explicitly.
+2. The trusted origin set must never include a remote or user-controlled origin. Today it is `app://renderer`, plus the loopback dev origin only when `!app.isPackaged`.
+3. No handler may be registered outside `registerHandler`.
+4. The origin check must not be relaxed to a prefix or `startsWith` test.
+
+## Findings
+
+| ID | Severity | Class | Location | Evidence | Fix | Owner |
+|---|---|---|---|---|---|---|
+| S-1 | Low | NOTE | `src/main/security/sender-validation.ts`, `src/main/index.ts` L113 | The check does not prove the frame is the primary main frame. `parent === null` also holds for a top frame of a separate frame tree in the same contents (prerender-like). That frame must still be same-origin `app://renderer` on the registered contents, so no escalation is possible (reasoning above, Electron semantics ASSUMED). | Optional defense in depth, not required: extend the injected `isRegisteredSender` or the event shape so the check also requires `frame === sender.mainFrame`, and add a test with a frame that has `parent: null` but is not `mainFrame` (expect false). Not needed for acceptance. | desktop-engineer |
+| S-2 | Low | NOTE | `src/main/protocol/app-protocol.ts` L98 to L113 | The MIME type and the extension allow-list come from the requested path (`resolved.relativePath`), not from the `realpath` target. A symlink inside the renderer root named `x.js` that points to another file inside the root (of any extension) is served with the `.js` type. Containment is still enforced on the real path, so no escape. Build output contains no symlinks (ASSUMED). | None required. Optionally also require `isAllowedExtension` on the extension of `real`. | desktop-engineer |
+| S-3 | Info | NOTE | `src/main/security/csp.ts` L19 to L32 | Production CSP is correct for the shell (`default-src 'none'`, `script-src 'self'`, `connect-src 'none'`, `frame-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`, no `unsafe-*`). It also sets `media-src 'none'`, `worker-src 'none'`, and `img-src`, `font-src` to `'self'` only. Audio (M later: `blob:`/protocol media URLs, AudioWorklet module loading), skins and Shiki will need deliberate, reviewed changes. | Change only through a design change and security review. Do not loosen now. | desktop-engineer, security-reviewer |
+| S-4 | Info | NOTE | `src/main/protocol/mime-types.ts` | Allow-list is `.html .js .css .json`. Fonts, images, `.wasm` and source maps are refused with 404. This is safe and fail closed. It will need extending when the renderer ships such assets. | Extend through a reviewed design change. | desktop-engineer |
+| S-5 | Info | NOTE | `src/main/protocol/app-protocol.ts` L65 to L69 | `realRoot()` caches a failed `realpath(rendererRoot)` as `null` for the process lifetime, so every request returns 404. Availability only. Fail closed. | None. | none |
+| S-6 | Info | NOTE | `src/main/protocol/app-protocol.ts` L98 to L113 | `realpath`, `stat`, `readFile` are separate calls (TOCTOU, first-pass F-3). `readFile` uses the realpath result, so a link swapped later is not followed again from the lexical path. Needs write access to the install directory. Accepted. | None. | none |
+| S-7 | Info | NOTE | `src/main/window/permissions.ts` | Request, check and device handlers deny everything on `session.defaultSession`, installed before the window is created. `setDisplayMediaRequestHandler` is not set. Recalled Electron behavior without a handler is denial, but this is ASSUMED. No renderer code can request it under the current CSP. | When a renderer exists, add a runtime assertion in E2E that `getDisplayMedia` and `Notification` are denied. Optionally set a deny handler. | qa-engineer |
+| S-8 | Info | NOTE | `src/main/window/navigation-guards.ts` | Guards attach to every web contents, including a DevTools contents in a dev run, where they may block DevTools-internal navigation. Dev-only usability, not a security gap. | Observe in the dev run (T7.6). | desktop-engineer |
+| S-9 | Info | NOTE | `src/main/protocol/app-protocol.ts` `securityHeaders` | Headers set: CSP, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Cross-Origin-Resource-Policy: same-origin`. No `Referrer-Policy` or `Permissions-Policy`. The renderer has no external links or network, so there is no practical effect. | Optional: add `Referrer-Policy: no-referrer`. | desktop-engineer |
+| S-10 | Info | NOTE | `src/renderer/` | No renderer source or `index.html` exists in the tree (`file_search` found none outside `node_modules`). The production entry `app://renderer/index.html` cannot be loaded, and the meta-CSP plugin and CSP-on-document behavior cannot be exercised. This is expected for M2/M3. | Verify when the renderer lands (M4) and in E2E. | desktop-engineer, qa-engineer |
+| S-11 | Info | NOTE | `src/main/protocol/resolve-app-path.test.ts` and companions | Two real-symlink tests are skipped on Windows. Accepted by the user. The symlink containment logic is covered by `realpath` plus `isPathInsideRoot` with injected `fs` in the remaining tests. | Keep as is. | none |
+
+## 2. Custom protocol `app://renderer` (VERIFIED by code reading, not executed)
+
+Order of operations in `resolveAppPath`, then the handler:
+1. Type and length (`<= 2048`). Raw forbidden characters (controls, space, backslash) rejected before parsing, because the WHATWG parser would silently strip some of them.
+2. `new URL`. Scheme must be `app:`, hostname exactly `renderer`, no username, password or port.
+3. Raw (still encoded) path checks: any `%2e`, any raw `.` or `..` segment, `%2f`, `%5c`, `%00` rejected.
+4. One `decodeURIComponent` of `url.pathname`. A malformed escape is rejected. `%252e` decodes to the literal text `%2e` and is not decoded again, so double encoding cannot become a dot or separator. No later step decodes or normalizes again.
+5. Per-segment checks on decoded text: empty, `.`, `..`, length, `\ / : * ? " < > |` and controls, leading dot, trailing dot or space, Windows device names (`con`, `nul`, `com1` and so on, with or without extension) on every platform.
+6. Extension allow-list on the last segment.
+7. `pathApi.join`, reject absolute, lexical containment check against `resolve(root)` (case-insensitive when `sep` is `\`).
+8. Handler: `realpath` of the joined path, `isPathInsideRoot` against the once-resolved real root, `stat` must be a regular file of at most 5 MiB, then `readFile(real)`. Every failure maps to 404 with a fixed code in the log only.
+
+Result: containment is checked last on the real path, and the file read uses that real path. No decode or normalize step follows the containment check, so an earlier check cannot be invalidated. Windows specifics covered: reserved names, alternate data streams (`:` rejected), trailing dot or space, case-insensitive compare, `\` rejected. POSIX: case-sensitive compare. Methods limited to GET and HEAD (405 otherwise). Scheme privileges are `standard`, `secure`, `supportFetchAPI` only (no `bypassCSP`, `corsEnabled`, `stream`). Whether Chromium canonicalizes `request.url` before the handler (collapsing `..`) is ASSUMED. The code is safe either way because it validates the string it receives.
+
+Not verifiable without runtime: real `realpath` casing and short-name behavior on NTFS, symlink and junction behavior, `'self'` matching `app://renderer`, module-script fetch without `corsEnabled` (ADR 0003 fallback).
+
+## 3. Electron invariants (VERIFIED in code)
+
+- `buildWebPreferences` is a literal object: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, plus `webviewTag: false`, `allowRunningInsecureContent: false`, worker and subframe node integration false. It takes only the preload path. `create-main-window.ts` is the only `new BrowserWindow` (grep). No `loadFile`, `executeJavaScript`, `openExternal`, `session.fromPartition`, `WebContentsView` in production code.
+- Navigation: `will-navigate`, `will-redirect`, `will-frame-navigate` denied unless the origin is trusted. `will-attach-webview` prevented. `setWindowOpenHandler(() => ({ action: 'deny' }))` on every contents. Registered before `ready` through `web-contents-created`.
+- Permissions: deny-all request, check and device handlers, installed before the first window.
+- CSP: production policy is a frozen constant used for the protocol header and the build-time meta tag, always called with `{ mode: 'production' }` literals. Development policy comes from a separate function, is delivered only by a header hook scoped to the exact loopback dev origin, and the hook is installed only when `target.kind === 'development'`, which requires `!app.isPackaged` and a validated loopback `http:` origin with a port. `unsafe-eval` and remote script sources appear nowhere.
+- DevTools and reload menu items exist only when `isDevRun` is true.
+
+## 4. IPC and preload (VERIFIED in code)
+
+- Channels: one constant `app:get-info` in `src/shared/ipc/channels.ts`. Preload also checks membership in `Object.values(IPC_CHANNELS)` before invoking.
+- Validation: main parses request args with `z.tuple([])` (extra args fail), parses the handler response, and returns a fixed-message `INTERNAL` on drift. Preload validates request and response again. Schemas use `strictObject`.
+- Errors: only the codes `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL` with fixed messages. Handler exceptions, transport exceptions and schema issues are dropped. Logger accepts allow-listed scalar fields and redacts values that are not `[A-Za-z0-9_.:-]` (so paths cannot pass).
+- Bridge: `contextBridge.exposeInMainWorld('necroamp', api)` with a frozen `{ app: { getInfo } }`. `ipcRenderer` is used only inside a closure that invokes one allow-listed channel with no renderer-supplied argument. No `send`, `on`, generic invoke, `process`, `fs` or Electron object is exposed.
+- Sandboxed CJS compatibility: preload imports only `electron` and `@shared/ipc`. `electron.vite.config.ts` sets `externalizeDeps: false` and `format: 'cjs'` for the preload, so Zod is bundled into one file. Whether the bundle actually loads in a sandboxed preload (no unsupported `require`) is ASSUMED until the built output is executed.
+
+## Not verified (needs the Electron runtime or tools I lack)
+
+- All Electron semantics for 45.5.0: `senderFrame` after navigation or destruction, `WebFrameMain.parent` and `url` on a disposed frame, `webContents.mainFrame` identity across frame swaps, prerender frame trees. Labeled ASSUMED because the Electron docs and typings were not readable (see "Evidence labels").
+- Sandboxed preload execution with the bundled Zod, contextBridge cloning of the frozen API, `app://renderer` loading, `'self'` CSP match, header CSP plus meta CSP interplay, `protocol.handle` behavior on 45.5.0, Chromium URL canonicalization before the handler.
+- Real-symlink containment on Windows (platform-limited tests), NTFS realpath casing.
+- Fuses, ASAR integrity, packaged `realpath` layout (packaging phase). macOS and Linux behavior. No E2E has run.
+
+## Unreviewed areas
+
+Renderer code (none exists), crash handlers and user-data override internals beyond what `index.ts` shows, test files other than `sender-validation.test.ts`, credential storage (no code), skin loader (not in scope), `.github/**`, `package.json` scripts.
+
+## Required corrections
+
+None. S-1 and S-2 are optional hardening.
+
+No source modified.
diff --git a/docs/security/m2-m3-security-review.md b/docs/security/m2-m3-security-review.md
new file mode 100644
index 0000000..edddbb9
--- /dev/null
+++ b/docs/security/m2-m3-security-review.md
@@ -0,0 +1,47 @@
+# Security review: M2 (main process) and M3 (shared IPC contracts, preload)
+
+Reviewer: security-reviewer (independent, read-only). One pass. Branch `feature/desktop-foundation`.
+
+## Verdict: APPROVED
+
+No blockers. Two non-blocking findings (Medium and Low) should be fixed by the owner before M4. Evidence labels: VERIFIED (read in source), ASSUMED (not exercised at runtime).
+
+## Scope and method
+
+- Read `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `electron.vite.config.ts`, ADR 0003, `tech.md`, and the electron-security skill checklists.
+- I have no shell, so I could not run `git status` or `git diff`. I reviewed the current working-tree files directly. Tests were read only where they affected a conclusion. I did not execute any test.
+- Not reviewed: renderer code (none exists), packaged runtime, Electron Fuses and ASAR layout (packaging phase), macOS and Linux behavior, credential storage (no code yet), skin loader (not in scope).
+
+## Checks against the requested criteria
+
+| Criterion | Result | Evidence |
+|---|---|---|
+| contextIsolation, sandbox, nodeIntegration, webSecurity never disabled | PASS (VERIFIED) | `window-options.ts` `buildWebPreferences` is a literal object with no mode parameter. It also sets `webviewTag`, `allowRunningInsecureContent`, worker and sub-frame node flags to false. `create-main-window.ts` is the only `new BrowserWindow`. |
+| Production CSP has no dev allowance | PASS (VERIFIED) | `csp.ts`: `PRODUCTION_DIRECTIVES` is a frozen constant. `buildCsp` takes the dev path only for `mode: 'development'`. `index.ts` and `meta-csp-tag.ts` pass `{ mode: 'production' }` as a literal to the protocol header and the meta tag. Matches ADR 0003 item 5 exactly. |
+| Dev CSP limits (ADR 0003 item 6 a to h) | PASS with one open duty | `unsafe-inline` only in `script-src` and `style-src`. `connect-src` is the parsed loopback origin plus `ws://host`. No `unsafe-eval`, no remote source. `dev-csp.ts` applies it only to responses from the exact dev origin. `load-target.ts` and `parseDevOrigin` honor `ELECTRON_RENDERER_URL` only when unpackaged, `http:`, loopback, with a port, no credentials, and an empty path. Condition (h) (remove unneeded allowances after runtime validation, T7.6) is still open. See F-4. |
+| `app://` traversal, symlink, encoding | PASS (VERIFIED, not run) | `resolve-app-path.ts` rejects raw `%2e`, `%2f`, `%5c`, `%00`, dot segments, backslash, whitespace and controls, decoded `: * ? " < > \|`, dotfiles, trailing dot or space, host, port, credentials, over-long input, and extensions outside the allow-list. It decodes once only, so `%252e` stays a literal name. `app-protocol.ts` then applies `realpath` to the file and a root resolved once, requires a regular file of at most 5 MiB, and answers 404 for every rejection. GET and HEAD only. Headers: CSP, nosniff, no-store, CORP. Privileges: `standard`, `secure`, `supportFetchAPI` only. |
+| Navigation, new window, permissions, webview | PASS (VERIFIED) | `navigation-guards.ts` guards `will-navigate`, `will-redirect` and `will-frame-navigate` for every web contents through `web-contents-created`. It prevents webview attach and denies `setWindowOpenHandler`. `permissions.ts` denies the request, check and device handlers. No `shell.openExternal` exists. |
+| Sender validation on every privileged handler | PASS (VERIFIED) | `register-handler.ts` is the only `ipcMain.handle` caller and checks the sender before touching the payload. A throw during the check denies. `sender-validation.ts` requires a non-null `senderFrame`, `parent === null`, a trusted origin, and `event.sender` equal to the registered window contents. |
+| Zod validation of requests and responses | PASS (VERIFIED) | Request `safeParse(args)` with `z.tuple([])`. Response `safeParse` in main and again in preload. Schemas are `strictObject`. |
+| Preload surface | PASS (VERIFIED) | `index.ts` exposes one frozen object `necroamp.app.getInfo`. `ipcRenderer` is used only inside a closure bound to an allow-listed channel with no renderer-supplied argument. No generic invoke, send, on, fs, or `process`. |
+| No paths or stacks to the renderer | PASS (VERIFIED) | `IPC_ERROR_MESSAGES` are fixed strings. Handler throws and response drift map to `INTERNAL`. The logger takes allow-listed fields and redacts unsafe values. `errorNameOf` returns only the name. Transport errors in preload are dropped. |
+| Single-instance and shutdown | PASS with F-1 | Lock is requested before other work. `second-instance` args are never read. Disposers run on `will-quit`. Unknown platforms quit. |
+
+## Findings
+
+| ID | Severity | Location | Evidence | Fix | Owner |
+|---|---|---|---|---|---|
+| F-1 | Medium | `src/main/index.ts` (the `acquireSingleInstance(app, () => focusOrCreateWindow(mainWindow, openMainWindow))` call, near L77 to L79) and `src/main/lifecycle/single-instance.ts` `focusOrCreateWindow` | The `second-instance` listener is registered before `ready`. If it fires before the first window exists (`mainWindow === null`), `focusOrCreateWindow` calls `openMainWindow`, which constructs a `BrowserWindow` before `app.whenReady()` resolves. Electron forbids that and throws. `installProcessCrashHandlers` then runs `app.exit(1)` and the first instance dies (availability, not confidentiality). ASSUMED: the pre-ready timing is not exercised, and the docs do not guarantee it cannot happen. A second `whenReady().then(openMainWindow)` would also create a duplicate window if it fires in the gap. | In the `second-instance` callback, do nothing if `!app.isReady()` (the initial `whenReady` path already opens the window). Add a unit test for the not-ready case. | desktop-engineer |
+| F-2 | Low | `src/main/protocol/resolve-app-path.ts` segment loop (reserved names) | Windows legacy device names (`con.js`, `nul.css`, `aux.html`) pass the lexical checks. `realpath` should resolve them outside the root, so the confinement check returns 404, but this is not tested. ASSUMED. | Reject segments whose stem (before the first dot) matches `CON, PRN, AUX, NUL, COM1-9, LPT1-9` case-insensitively, and add a case to the property test. | desktop-engineer, then qa-engineer |
+| F-3 | Low | `src/main/protocol/app-protocol.ts` L98 to L113 | `realpath`, `stat` and `readFile` are separate calls on a path, so a local process that can write inside the app's own output directory could swap a file between them. Requires write access to the install directory, so it sits outside the renderer threat model. | Accept and document. Optionally open the file once and `fstat` the handle. | desktop-engineer (optional) |
+| F-4 | Info | `src/main/security/csp.ts` `developmentDirectives` | ADR 0003 condition (h): `unsafe-inline` for scripts and styles is justified by design, not by a dev run. No dev run exists yet. | During T7.6, remove `unsafe-inline` from whichever directive the pinned Vite and React plugin does not need, and record the result. | desktop-engineer, necro-architect |
+| F-5 | Info | `src/main/security/sender-validation.ts` | Deviation from the design: it checks `parent === null` plus registered `event.sender` instead of `senderFrame === mainFrame`. Both reject sub-frames and foreign contents, and the check fails closed on any throw. I accept the deviation. | None. Record it in the design or an ADR note. | necro-architect |
+| F-6 | Info | `src/main/index.ts` (env reads) | `ELECTRON_RENDERER_URL` and `NECROAMP_E2E_USER_DATA` are honored only when `!app.isPackaged`, and validated. A local user who controls the environment of an unpackaged build is out of scope. | None. | none |
+| F-7 | Info | Packaging phase | Fuses (`RunAsNode` off, ASAR integrity), the `realpath` check against the asar layout, and `devTools` in production builds are not part of M2/M3. Dev menu roles are already gated by `isDevRun`. | Cover them in the packaging review. | release-engineer |
+| F-8 | Info | `electron.vite.config.ts`, `app-protocol.ts` | Unverified at runtime: `'self'` matching `app://renderer`, module scripts without `corsEnabled` (ADR 0003 item 3 fallback), the sandboxed preload with Zod bundled, and the meta CSP in built HTML. The fallback needs no other privileges and no new ADR beyond an amendment. | Verify in T7.0 and E2E. | desktop-engineer, qa-engineer |
+
+## Required before M4
+
+F-1 (Medium). F-2 is recommended. Everything else is informational.
+
+No source modified.
diff --git a/docs/testing/coverage-branch-variation.md b/docs/testing/coverage-branch-variation.md
new file mode 100644
index 0000000..650de90
--- /dev/null
+++ b/docs/testing/coverage-branch-variation.md
@@ -0,0 +1,7 @@
+# Coverage branch-count variation (QA finding)
+
+- Symptom: `pnpm.cmd test:coverage` reported branches 279/284 (98.23%) in some runs and 278/284 (97.88%) in others, with identical test results.
+- Method: 6 runs with the lcov reporter, branch hit flags (taken > 0) compared per file and branch.
+- Cause: one branch, `src/renderer/app/theme/contrast.ts` line 46 (`!raw.has(name)` in `readCustomProperties`, the repeated-name case). Only the fast-check property test in `contrast.property.test.ts` reaches it, and only when the random generator emits a duplicate custom-property name. `tests/setup/offline.ts` sets numRuns 100 and no fixed seed, so reachability differs per run. Observed 278 in runs 1, 4, 6 and 279 in runs 2, 3, 5. No other branch varied.
+- Gate impact: none. The global branches threshold is 75 and contrast.ts has no per-file threshold. All per-file gates (shared/ipc, register-handler, sender-validation, trusted-origins, resolve-app-path, csp) were identical in every run.
+- Fix: `tests/integration/contrast-first-declaration.integration.test.ts` covers the case deterministically. Six runs after the fix all gave 279/284. The property test seed was not pinned, since a fixed seed would hide generator variety.
diff --git a/docs/testing/defects/0001-resolve-app-path-branch-coverage-gate.md b/docs/testing/defects/0001-resolve-app-path-branch-coverage-gate.md
new file mode 100644
index 0000000..fde1df6
--- /dev/null
+++ b/docs/testing/defects/0001-resolve-app-path-branch-coverage-gate.md
@@ -0,0 +1,45 @@
+# 0001: `resolve-app-path.ts` cannot reach its 95% branch coverage gate
+
+- Owner: desktop-engineer
+- Severity: Medium (blocks T6.5, the coverage gate; no runtime impact)
+- Criterion: R12.6, T6.5, design section 10 N5 (`src/main/protocol/resolve-app-path.ts` branches at least 95)
+- Found: Block B, fresh run
+
+## Evidence
+
+`pnpm.cmd test:coverage` exits 1 with:
+
+```
+ERROR: Coverage for branches (93.84%) does not meet "src/main/protocol/resolve-app-path.ts" threshold (95%)
+```
+
+All other thresholds pass (global 99.08 statements, 96.91 branches, 100 functions, 99.78 lines).
+Before QA added `tests/integration/app-path-defense.integration.test.ts` the file was at 89.23%
+(58 of 65 branches). That file now covers three more branches (lines 58, 117, 118). Four branches remain.
+
+## Remaining uncovered branches (lcov BRDA, `src/main/protocol/resolve-app-path.ts`)
+
+| Line | Code | Why QA cannot reach it |
+|---|---|---|
+| 96 | `if (!trimmed.startsWith('/')) return reject('BAD_URL');` | `URL.pathname` of a hierarchical `app://renderer/...` URL always starts with `/`, and the empty and `/` cases are replaced by `/index.html` first. |
+| 99 | `if (segments.length === 0) return reject('BAD_URL');` | `trimmed` is never `/`, so `split` yields at least one element. |
+| 109 | `(segment.split('.')[0] ?? '')` | `String.prototype.split` always returns at least one element. |
+| 113 | `segments.at(-1) ?? ''` | `segments` is non-empty here. |
+
+## Reproduction
+
+```
+pnpm.cmd test:coverage
+pnpm.cmd exec vitest run --coverage --coverage.reporter=lcovonly
+# then read BRDA lines ending in ",0" or ",-" for src\main\protocol\resolve-app-path.ts in coverage/lcov.info
+```
+
+## Suggested fix (owner decides)
+
+Remove the dead branches (for example iterate with `for (const [index, segment] of segments.entries())`,
+take `last` from the loop, and drop the two `?? ''` fallbacks), or mark the intentional defensive
+lines with a justified `/* v8 ignore next */` comment. Do not lower the threshold.
+
+## Resolution
+Status: FIXED (desktop-engineer). pnpm.cmd test:coverage exits 0; branches of resolve-app-path.ts 57/57 (100%), threshold 95% unchanged. Three dead branches removed, one defensive branch excluded with a justified `/* v8 ignore next -- @preserve */`.
+Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
diff --git a/docs/testing/defects/0002-playlist-has-no-list-element.md b/docs/testing/defects/0002-playlist-has-no-list-element.md
new file mode 100644
index 0000000..9b4ef26
--- /dev/null
+++ b/docs/testing/defects/0002-playlist-has-no-list-element.md
@@ -0,0 +1,26 @@
+# 0002: Playlist region has no list element (R8.5)
+
+- Owner: desktop-engineer
+- Severity: Low (spec conformance, no security impact)
+- Criterion: R8.5 "a heading, an empty-state message and a list element for future items"
+- Found: Block B, fresh run
+
+## Evidence
+
+`src/renderer/features/playlist/playlist-view.tsx` renders a heading (from `RegionFrame`), an empty-state
+paragraph and a button group. It contains no `ul`, `ol` or `role="list"` element.
+
+## Reproduction
+
+`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`
+
+The test `R8.5: the playlist region contains a heading, an empty-state message and a list element` is
+marked `it.fails` and passes only while the defect exists. After the fix it fails: change it to a plain `it`.
+
+## Expected
+
+An empty `ul` (or `role="list"`) inside the playlist region, with an accessible name.
+
+## Resolution
+Status: FIXED (frontend-engineer). playlist-view.tsx renders an empty `<ul aria-label="Playlist items">`. The R8.5 test is a plain `it` and passes.
+Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
diff --git a/docs/testing/defects/0003-skin-region-lacks-foundation-default-entry.md b/docs/testing/defects/0003-skin-region-lacks-foundation-default-entry.md
new file mode 100644
index 0000000..59d2ccb
--- /dev/null
+++ b/docs/testing/defects/0003-skin-region-lacks-foundation-default-entry.md
@@ -0,0 +1,26 @@
+# 0003: Skin region has no "Foundation default" entry (R8.8)
+
+- Owner: desktop-engineer (UI strings), necro-architect if the requirement was intentionally changed
+- Severity: Low (spec conformance)
+- Criterion: R8.8 "a labelled placeholder control showing a single non-functional 'Foundation default' entry"
+- Found: Block B, fresh run
+
+## Evidence
+
+`src/renderer/features/skins/skins-view.tsx` shows `STRINGS.skins.none` ("No skins are available. Skin
+selection is not implemented in this phase.") and a "Choose skin" button. The text "Foundation default"
+appears nowhere in `src/renderer`, `design.md` or `tasks.md`. No design note records a decision to drop it.
+
+## Reproduction
+
+`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`
+
+The `R8.8` test is `it.fails`. After the fix (or after the requirement is formally amended) update the test.
+
+## Expected
+
+Either the entry exists, or R8.8 is amended with a recorded decision.
+
+## Resolution
+Status: FIXED (frontend-engineer). skins-view.tsx renders a labelled list with one non-interactive 'Foundation default' item. The R8.8 test is a plain `it` and passes.
+Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
diff --git a/docs/testing/defects/0004-github-region-does-not-say-not-signed-in.md b/docs/testing/defects/0004-github-region-does-not-say-not-signed-in.md
new file mode 100644
index 0000000..921637d
--- /dev/null
+++ b/docs/testing/defects/0004-github-region-does-not-say-not-signed-in.md
@@ -0,0 +1,25 @@
+# 0004: GitHub region never says "not signed in" (R8.9)
+
+- Owner: desktop-engineer
+- Severity: Low (spec conformance)
+- Criterion: R8.9 "state that the integration is optional and not signed in"
+- Found: Block B, fresh run
+
+## Evidence
+
+`STRINGS.github.optional` reads "GitHub features are optional. NecroAmp works fully without signing in."
+The sign-in state is not stated. The optional part is satisfied and tested.
+
+## Reproduction
+
+`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`
+
+The `R8.9: ... not signed in` test is `it.fails`.
+
+## Expected
+
+A visible status such as "Not signed in" in the GitHub region.
+
+## Resolution
+Status: FIXED (frontend-engineer). github-view.tsx shows 'Not signed in'. The R8.9 test is a plain `it` and passes.
+Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
diff --git a/docs/testing/desktop-foundation-coverage-and-gaps.md b/docs/testing/desktop-foundation-coverage-and-gaps.md
new file mode 100644
index 0000000..9ede911
--- /dev/null
+++ b/docs/testing/desktop-foundation-coverage-and-gaps.md
@@ -0,0 +1,59 @@
+# Desktop Foundation: coverage and gap note (Block B)
+
+Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0. Evidence is from fresh runs in this block.
+
+## Results
+
+| Command | Exit | Result |
+|---|---|---|
+| `pnpm.cmd typecheck` | 0 | clean |
+| `pnpm.cmd lint` | 0 | clean |
+| `pnpm.cmd format:check` | 0 | clean |
+| `pnpm.cmd test` (twice, same result) | 0 | 51 files, 764 passed, 3 expected-fail (known defects), 2 skipped |
+| `pnpm.cmd test:coverage` | **1** | tests pass; threshold failure on `resolve-app-path.ts` branches 93.84% (defect 0001) |
+| `pnpm.cmd build` | 0 | out/main, out/preload, out/renderer |
+| `pnpm.cmd test:e2e` | 0 | 35 passed, 0 failed, 0 skipped, 1 worker |
+
+## Coverage (V8)
+
+Statements 99.08% (544/549), branches 96.57% (282/292), functions 100% (156/156), lines 99.78% (472/473).
+Global thresholds (80/80/80/75) pass. Per-file 95% gates: `src/shared/ipc/**`, `register-handler.ts`,
+`sender-validation.ts`, `trusted-origins.ts`, `csp.ts` pass. `resolve-app-path.ts` fails on branches
+(four unreachable defensive branches, see defect 0001). Thresholds were not changed.
+
+## Skipped and expected-fail
+
+- 2 skipped: the real-symlink tests (`tests/integration/app-protocol.integration.test.ts` and `src/main/protocol/app-protocol.test.ts`) need symlink creation privilege, which this Windows host lacks. They stay in the suite and run on
+  CI runners with the privilege (Linux and macOS, or Windows with Developer Mode). Privileges were not changed.
+- 3 expected-fail (`it.fails`): R8.5, R8.8, R8.9, one per defect 0002 to 0004. They flip to failures when the
+  owner fixes the UI, which prompts converting them to normal tests.
+
+## Property areas (tech.md "Testing")
+
+| Area | Status |
+|---|---|
+| Equalizer mapping and clamping, skin manifest, playlist, metadata, time formatting | Not applicable yet: no such module exists in the Desktop Foundation. These areas must get tests with their features. |
+| Foundation modules | origin check, CSP builder, IPC parser and `registerHandler`, platform policy, `resolveLoadTarget`, menu builder, preload API, `resolveAppPath` (posix and win32), contrast function, renderer bridge adapter |
+
+## E2E notes
+
+- Production build only: `electron <repo root>` with `ELECTRON_RENDERER_URL` and `ELECTRON_RUN_AS_NODE` removed and
+  `NECROAMP_E2E_USER_DATA` set to a fresh temporary directory per test. `global-setup.ts` fails fast when `out/` is missing or older than `src/`.
+- No fixed sleeps in assertions. Waits are `expect.poll` and event promises. Bounded timers exist only as upper limits
+  (exit within 5 s, 8 s forced-kill in teardown).
+- Sub-frame negative case: the navigation guard blocks any foreign sub-frame load, and a script-created frame gets no
+  bridge, so a real sub-frame IPC call cannot be produced. The sub-frame rule (`parent !== null`) is covered by the
+  unit and integration tests. Foreign top frame and unregistered trusted-origin contents are covered end to end.
+- Electron's `Target.createTarget` is unsupported, so `@axe-core/playwright` runs in `setLegacyMode(true)`. The shell has no iframe, so this scans the whole document.
+- `getLastWebPreferences` is missing from the Electron 45.5.0 type definitions; the test casts it.
+- Visual snapshots are not part of this block (no approved baseline; per-platform baselines needed).
+
+## Platform gaps
+
+| Platform | install | build | unit | e2e |
+|---|---|---|---|---|
+| Windows x64 | PASSED (prior block) | PASSED | PASSED | PASSED |
+| macOS | NOT VERIFIED (no runner) | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED (darwin keep-alive branch of the close test unexecuted) |
+| Linux | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED (needs a virtual display, sandbox prerequisites) |
+
+Audio decode per format (MP3, WAV, FLAC, OGG) is not testable until an audio engine exists.
diff --git a/docs/testing/desktop-foundation-traceability.md b/docs/testing/desktop-foundation-traceability.md
new file mode 100644
index 0000000..ff69ce8
--- /dev/null
+++ b/docs/testing/desktop-foundation-traceability.md
@@ -0,0 +1,80 @@
+# Desktop Foundation: requirements traceability (T6.6)
+
+Scope: acceptance criteria R2 to R16 that tests can observe. R1, R11 (scripts), R14, R15.2, R15.5, R17 are
+process or review criteria and are listed under "No automated test". Kinds: U unit, P property
+(fast-check), I integration (Vitest, fakes at the Electron edge), S static, E Playwright against the
+production build, A jsdom accessibility. Authority: `.kiro/steering/tech.md` "Testing".
+
+Paths are relative to the repository root. `[c]` = co-located test written by the implementer.
+"QA" files are in the QA write scope.
+
+| Requirement | Tests |
+|---|---|
+| R2.2 aliases agree | `tests/config/alias-consistency.test.ts` |
+| R2.3 boundary rules fail on a fixture | `tests/lint-rules/boundary-rules.test.ts` (47 cases, ESLint `Linter` API) |
+| R2.4 shared is environment-neutral | `tests/static/main-preload-policy.test.ts`, lint-rules (shared imports and globals) |
+| R2.5 strict, no `any` | lint-rules (`no-explicit-any`), `pnpm typecheck` |
+| R2.6 pure logic is framework-free | `src/main/**/*.test.ts` [c], `src/shared/ipc/*.test.ts` [c] |
+| R3.1 one window factory | `tests/static/main-preload-policy.test.ts`; `create-main-window.test.ts` [c]; E: one window |
+| R3.2, R3.3 web preferences | `window-options.test.ts` [c], `lifecycle.property.test.ts` [c] (every preload path); `tests/static/main-preload-policy.test.ts` (no insecure value); E `smoke-security` "keeps every mandatory web preference on the live window" |
+| R3.5 only own bundle; dev origin only in dev | `load-target.test.ts`, `trusted-origins.test.ts` [c]; `lifecycle.property.test.ts` [c]; E: all requests are `app://renderer/` |
+| R3.6 no Node globals | E `smoke-security` "exposes no Node or Electron global" |
+| R4.1 channel constants only | `channels.test.ts` [c]; static (no literal channel); lint-rules (`ipcLiteral`) |
+| R4.2, R4.3 schemas and typed errors | `app-info.test.ts`, `result.test.ts`, `ipc-contract.property.test.ts` [c]; `register-handler.test.ts`, `register-handler.property.test.ts` [c] |
+| R4.4 sender validation | `sender-validation.test.ts` [c]; `tests/integration/ipc-round-trip.integration.test.ts` (sub-frame, foreign origin, destroyed frame, unregistered sender, frame that is not the main frame); `tests/integration/shell-bridge.integration.test.tsx`; E `negative-sender.spec.ts` (foreign top frame, trusted-origin unregistered contents, sub-frame layers) |
+| R4.5 one registration helper | `install-ipc.ts` via `app-handlers.test.ts` [c]; static |
+| R4.6 narrow bridge | `create-necroamp-api.test.ts`, `create-necroamp-api.property.test.ts`, `index.test.ts` [c]; E "exposes exactly a frozen necroamp.app.getInfo" |
+| R4.7 `app:get-info` | `app-handlers.test.ts` [c]; I round trip; E real IPC round trip |
+| R4.8 unregistered channel | `create-necroamp-api.test.ts` [c] (channel allow list). E gap: no real call to an unknown channel because the bridge exposes no generic invoke (nothing to call) |
+| R4.9 single adapter | `necroamp-client.test.ts` [c]; `src/renderer/app/bridge/necroamp-client.property.test.ts` (P: any bridge value, any response); `tests/static/renderer-policy.test.ts` ("reads window.necroamp only in the bridge adapter") |
+| R5.1 CSP on every load | `csp.test.ts`, `app-protocol.test.ts` [c]; `tests/integration/app-protocol.integration.test.ts`; E header equals the frozen policy |
+| R5.2, R5.3 production policy | `csp.test.ts`, `csp.property.test.ts` [c]; E meta and header literal |
+| R5.5 dev allowance never in production | `csp.property.test.ts`, `dev-csp.test.ts` [c]; E meta and header have no `unsafe-*` |
+| R5.6, R8.14 no foreign request | E "loads every resource from app://renderer and nothing else" |
+| R5.7 inline script and remote fetch blocked | E "blocks inline script, string eval and any renderer network request" (asserts the violation events) |
+| R6.1 navigation blocked | `navigation-guards.test.ts` [c]; `tests/integration/navigation-wiring.integration.test.ts` (will-navigate, will-redirect, will-frame-navigate on a fake WebContents); E https, http (logged) and file, data, javascript (URL unchanged) |
+| R6.2 `window.open` denied | wiring test; E "window.open returns null and opens no window" |
+| R6.3 webview blocked | navigation-guards [c], wiring test |
+| R6.4 permissions denied | `permissions.test.ts` [c]; E media and geolocation denied |
+| R6.5 no `openExternal` | static, lint-rules |
+| R7.1 one window, title | `create-main-window.test.ts` [c]; E smoke |
+| R7.2 single instance | `single-instance.test.ts` [c]; E second process exits, one window remains |
+| R7.3 platform policy | `platform-policy.test.ts`, `lifecycle.property.test.ts` [c]; E last window closed (host platform) |
+| R7.4 crash policy | `crash-handlers.test.ts`, `lifecycle.property.test.ts` [c]; E first crash reloads, second quits with code 0 |
+| R7.5 no crash reporter | static, lint-rules; `crash-handlers.test.ts` [c] |
+| R7.6 quit within 5 s | E `app.quit()` exits 0 within 5 s |
+| R7.7 app name | E ("fresh profile" uses an isolated directory); name via `app-info` |
+| R8.1, R8.2, R8.3 heading, tagline, regions | `app-shell.test.tsx` [c]; E smoke; `tests/a11y/shell-a11y.test.tsx` |
+| R8.4 transport placeholders | `tests/a11y/requirements-conformance.test.tsx`; `components.test.tsx` [c] |
+| R8.5 playlist list element | `requirements-conformance.test.tsx` `it.fails`, defect 0002 |
+| R8.6 ten band placeholders | `app-shell.test.tsx` [c], `requirements-conformance.test.tsx` |
+| R8.7 no analyser, no rAF | `tests/static/renderer-policy.test.ts`; lint-rules |
+| R8.8 "Foundation default" | `requirements-conformance.test.tsx` `it.fails`, defect 0003 |
+| R8.9 GitHub text | optional: tested; "not signed in": `it.fails`, defect 0004 |
+| R8.10 failure states | `app-info-store.test.ts`, `app-shell.test.tsx` [c]; `tests/integration/shell-bridge.integration.test.tsx` (real adapter, preload API and handlers) |
+| R8.11 layout | E 800x600 and 1920x1080 (bounding boxes, overflow), minimum size |
+| R8.12, R8.13 no assets, tokens | `contrast.test.ts` [c] (no literal colors, no `url(`); `tests/static/renderer-policy.test.ts` (no remote `url()`, no `@import`) |
+| R9.1 lang, one `h1` | `shell-a11y.test.tsx`; static (`index.html`); E smoke |
+| R9.2 names, Tab order, no trap | `shell-a11y.test.tsx` (Tab and Shift+Tab); E Tab in DOM order with wrap |
+| R9.3 focus indicator | `renderer-policy.test.ts` (`:focus-visible` uses the focus token); `shell-a11y.test.tsx` (3:1); `contrast.property.test.ts`; E computed outline 2 px solid `rgb(127, 180, 255)` |
+| R9.4 text contrast | `contrast.test.ts` [c], `contrast.property.test.ts`, `shell-a11y.test.tsx` |
+| R9.5 placeholders exposed | `shell-a11y.test.tsx` (`aria-disabled`, `aria-describedby` resolves, focusable); E |
+| R9.6 axe scan | E `a11y.spec.ts`: 31 rules passed, 0 violations of any impact, 0 incomplete |
+| R9.7 no animation | static (no `animation`, `transition`, `@keyframes`, no rAF) |
+| R10.1 to R10.3 store, no audio state | `app-info-store.test.ts` [c]; static |
+| R12.2 property tests present | origin check, CSP builder, IPC parser, platform policy, contrast: all present (`trusted-origins.test.ts` is example-based, the origin check is exercised by `lifecycle.property.test.ts` and `register-handler.property.test.ts`) |
+| R12.3 deterministic, offline | `tests/setup/offline.ts` stubs `fetch`, XHR, WebSocket, EventSource; seeds printed by fast-check; two consecutive runs recorded in `desktop-foundation-coverage-and-gaps.md` |
+| R13.1 to R13.5, R13.8 E2E foundation | `playwright.config.ts`, `tests/e2e/**` (one worker, no retries, isolated user data, teardown on failure, no fixed sleeps in assertions) |
+| R15.3 log hygiene | `logger.test.ts` [c]; E crash test checks the log has no path or stack; navigation log has no URL (wiring test) |
+| R16.1 platform branches | `platform-policy.test.ts`, `app-menu.test.ts` [c] |
+| R16.2 platform path APIs | `resolve-app-path.test.ts` [c] (posix and win32); `resolve-app-path.property.test.ts` [c] |
+
+## No automated test (process or review)
+
+R1.x (toolchain, lockfile), R11.x (script policy, README), R14.x (lint config exists; behavior covered by lint-rules),
+R15.2, R15.5, R15.6, R16.3, R16.4, R16.5 to R16.7, R17.x. R4.8 is partial (see above). N3 from the design
+(R4.8 partial) stands.
+
+## Defects found this block
+
+0001 coverage gate on `resolve-app-path.ts`; 0002 R8.5; 0003 R8.8; 0004 R8.9. Reports are in `docs/testing/defects/`.
diff --git a/electron.vite.config.ts b/electron.vite.config.ts
new file mode 100644
index 0000000..882ddb4
--- /dev/null
+++ b/electron.vite.config.ts
@@ -0,0 +1,61 @@
+import { fileURLToPath } from 'node:url';
+import react from '@vitejs/plugin-react';
+import { defineConfig } from 'electron-vite';
+import type { Plugin } from 'vite';
+import { buildMetaCspTag } from './src/main/security/meta-csp-tag';
+
+// Single alias table. tsconfig `paths` and vitest.config.ts mirror it (R2.2).
+const alias = {
+  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
+  '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
+  '@renderer': fileURLToPath(new URL('./src/renderer', import.meta.url)),
+};
+
+// Injects the production meta CSP into the built index.html only (T2.7). The source index.html has
+// no meta CSP, so the dev server is not blocked. The dev policy is delivered by a header hook.
+const metaCspPlugin = (): Plugin => ({
+  name: 'necroamp-meta-csp',
+  apply: 'build',
+  transformIndexHtml: () => {
+    const tag = buildMetaCspTag();
+    return [{ ...tag, attrs: { ...tag.attrs } }];
+  },
+});
+
+export default defineConfig({
+  main: {
+    resolve: { alias },
+    build: {
+      outDir: 'out/main',
+      rollupOptions: {
+        input: { index: fileURLToPath(new URL('./src/main/index.ts', import.meta.url)) },
+        output: { format: 'cjs', entryFileNames: '[name].js' },
+      },
+    },
+  },
+  preload: {
+    resolve: { alias },
+    build: {
+      outDir: 'out/preload',
+      // A sandboxed preload cannot require() packages from node_modules, so bundle them.
+      externalizeDeps: false,
+      rollupOptions: {
+        input: { index: fileURLToPath(new URL('./src/preload/index.ts', import.meta.url)) },
+        // Sandboxed preload must be a single CommonJS script (design section 1).
+        output: { format: 'cjs', entryFileNames: '[name].js' },
+      },
+    },
+  },
+  renderer: {
+    root: 'src/renderer',
+    resolve: { alias },
+    plugins: [react(), metaCspPlugin()],
+    build: {
+      outDir: 'out/renderer',
+      emptyOutDir: true,
+      rollupOptions: {
+        input: { index: fileURLToPath(new URL('./src/renderer/index.html', import.meta.url)) },
+      },
+    },
+  },
+});
diff --git a/eslint.config.mjs b/eslint.config.mjs
new file mode 100644
index 0000000..2815af7
--- /dev/null
+++ b/eslint.config.mjs
@@ -0,0 +1,188 @@
+import { builtinModules } from 'node:module';
+import js from '@eslint/js';
+import tseslint from 'typescript-eslint';
+import react from 'eslint-plugin-react';
+import reactHooks from 'eslint-plugin-react-hooks';
+import jsxA11y from 'eslint-plugin-jsx-a11y';
+import prettier from 'eslint-config-prettier';
+import globals from 'globals';
+
+const nodeBuiltins = builtinModules.flatMap((name) => [name, `node:${name}`]);
+const deepRelative = {
+  group: ['../../../*'],
+  message: 'Use a path alias instead of a deep relative import.',
+};
+const networkModules = [
+  'http',
+  'https',
+  'net',
+  'node:http',
+  'node:https',
+  'node:net',
+  'undici',
+  'electron-updater',
+];
+const forbidElectronNamed = {
+  name: 'electron',
+  importNames: ['crashReporter', 'autoUpdater', 'net'],
+  message: 'No telemetry, auto-update or network modules (R15.1).',
+};
+
+const restrictedImports = (patterns, paths = []) => ({
+  'no-restricted-imports': ['error', { paths, patterns }],
+});
+
+const openExternal = {
+  selector: "MemberExpression[property.name='openExternal']",
+  message: 'Use the allow-listed external-link wrapper (R6.5).',
+};
+const browserWindow = {
+  selector: "NewExpression[callee.name='BrowserWindow']",
+  message: 'Create windows only in src/main/window/create-main-window.ts (R3.1).',
+};
+const ipcLiteral = {
+  selector:
+    'CallExpression[callee.property.name=/^(handle|handleOnce|invoke|removeHandler)$/][arguments.0.value=/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/]',
+  message: 'IPC channel names must come from src/shared/ipc/channels.ts (R4.1).',
+};
+const audioSyntax = {
+  selector:
+    'Identifier[name=/^(AudioContext|webkitAudioContext|OfflineAudioContext|AnalyserNode|requestAnimationFrame)$/]',
+  message: 'Audio and animation globals are not allowed in M0-M1 renderer code (R8.4, R8.7).',
+};
+const networkGlobals = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
+  name,
+  message: 'Network access from the renderer or preload is denied (R15.1).',
+}));
+
+export default tseslint.config(
+  {
+    ignores: [
+      'node_modules',
+      'out',
+      'dist',
+      'coverage',
+      'test-results',
+      'playwright-report',
+      '.agents',
+      '.kiro',
+      'docs',
+    ],
+  },
+  js.configs.recommended,
+  ...tseslint.configs.recommended,
+  {
+    rules: {
+      '@typescript-eslint/no-explicit-any': 'error',
+      '@typescript-eslint/consistent-type-imports': 'error',
+      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
+      ...restrictedImports([deepRelative]),
+    },
+  },
+  {
+    files: ['src/renderer/**/*.{ts,tsx}'],
+    languageOptions: { globals: globals.browser },
+    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
+    settings: { react: { version: 'detect' } },
+    rules: {
+      ...react.configs.flat.recommended.rules,
+      ...react.configs.flat['jsx-runtime'].rules,
+      ...reactHooks.configs.flat.recommended.rules,
+      ...jsxA11y.flatConfigs.recommended.rules,
+      'react/forbid-dom-props': ['error', { forbid: ['style'] }],
+      ...restrictedImports(
+        [
+          { group: ['@main/*'], message: 'The renderer must not import main code.' },
+          { group: ['node:*'], message: 'No Node built-ins in the renderer.' },
+          deepRelative,
+        ],
+        [...new Set([...nodeBuiltins, 'electron', ...networkModules])].map((name) => ({ name })),
+      ),
+      'no-restricted-globals': ['error', ...networkGlobals],
+      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral, audioSyntax],
+    },
+  },
+  {
+    files: ['src/renderer/features/**/*.{ts,tsx}'],
+    rules: {
+      ...restrictedImports(
+        [
+          { group: ['@main/*'], message: 'The renderer must not import main code.' },
+          { group: ['node:*'], message: 'No Node built-ins in the renderer.' },
+          { group: ['@renderer/features/*'], message: 'Features must not import other features.' },
+          { group: ['../../*'], message: 'Features must not reach across feature folders.' },
+          deepRelative,
+        ],
+        [...new Set([...nodeBuiltins, 'electron', ...networkModules])].map((name) => ({ name })),
+      ),
+    },
+  },
+  {
+    files: ['src/shared/**/*.ts'],
+    languageOptions: { globals: {} },
+    rules: {
+      ...restrictedImports(
+        [
+          {
+            group: ['@main/*', '@renderer/*', 'node:*'],
+            message: 'shared must not import other layers.',
+          },
+          deepRelative,
+        ],
+        [...nodeBuiltins, 'electron', 'react', 'react-dom'].map((name) => ({ name })),
+      ),
+      'no-restricted-globals': [
+        'error',
+        ...['window', 'document', 'navigator', 'process', 'Buffer', 'fetch'].map((name) => ({
+          name,
+          message: 'shared code must be environment-neutral.',
+        })),
+      ],
+      'no-restricted-syntax': ['error', ipcLiteral],
+    },
+  },
+  {
+    files: ['src/main/**/*.ts'],
+    languageOptions: { globals: globals.node },
+    rules: {
+      ...restrictedImports(
+        [{ group: ['@renderer/*'], message: 'main must not import renderer code.' }, deepRelative],
+        [forbidElectronNamed, ...networkModules.map((name) => ({ name }))],
+      ),
+      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral],
+    },
+  },
+  {
+    files: ['src/main/window/create-main-window.ts'],
+    rules: { 'no-restricted-syntax': ['error', openExternal, ipcLiteral] },
+  },
+  {
+    files: ['src/preload/**/*.ts'],
+    languageOptions: { globals: globals.node },
+    rules: {
+      ...restrictedImports(
+        [
+          { group: ['@renderer/*', '@main/*'], message: 'preload may import only shared.' },
+          deepRelative,
+        ],
+        [forbidElectronNamed, ...networkModules.map((name) => ({ name }))],
+      ),
+      'no-restricted-globals': ['error', ...networkGlobals],
+      'no-restricted-syntax': ['error', openExternal, browserWindow, ipcLiteral],
+    },
+  },
+  {
+    files: ['src/shared/ipc/channels.ts'],
+    rules: { 'no-restricted-syntax': 'off' },
+  },
+  {
+    files: ['**/*.test.{ts,tsx}', 'tests/**', '*.config.{ts,mjs}'],
+    languageOptions: { globals: { ...globals.node } },
+    rules: {
+      'no-restricted-globals': 'off',
+      'no-restricted-syntax': 'off',
+      ...restrictedImports([deepRelative]),
+    },
+  },
+  prettier,
+);
diff --git a/package.json b/package.json
new file mode 100644
index 0000000..003891f
--- /dev/null
+++ b/package.json
@@ -0,0 +1,58 @@
+{
+  "name": "necroamp",
+  "version": "0.0.0",
+  "private": true,
+  "description": "Open-source, cross-platform desktop music player for developers. Code. Listen. Repeat.",
+  "license": "MIT",
+  "main": "./out/main/index.js",
+  "packageManager": "pnpm@10.34.9",
+  "engines": {
+    "node": ">=24.15.0 <25"
+  },
+  "scripts": {
+    "dev": "electron-vite dev",
+    "build": "electron-vite build",
+    "typecheck": "tsc -b",
+    "lint": "eslint .",
+    "format": "prettier --write .",
+    "format:check": "prettier --check .",
+    "test": "vitest run",
+    "test:coverage": "vitest run --coverage",
+    "test:e2e": "playwright test"
+  },
+  "dependencies": {
+    "react": "19.3.1",
+    "react-dom": "19.3.1",
+    "zod": "4.6.7",
+    "zustand": "5.1.0"
+  },
+  "devDependencies": {
+    "@axe-core/playwright": "4.14.1",
+    "@eslint/js": "9.39.5",
+    "@playwright/test": "1.65.1",
+    "@testing-library/dom": "10.4.2",
+    "@testing-library/jest-dom": "8.0.0",
+    "@testing-library/react": "16.3.3",
+    "@testing-library/user-event": "14.6.13",
+    "@types/node": "24.19.4",
+    "@types/react": "19.3.3",
+    "@types/react-dom": "19.3.0",
+    "@vitejs/plugin-react": "5.2.0",
+    "@vitest/coverage-v8": "5.1.2",
+    "electron": "45.5.0",
+    "electron-vite": "6.0.0",
+    "eslint": "9.39.5",
+    "eslint-config-prettier": "10.1.8",
+    "eslint-plugin-jsx-a11y": "6.10.2",
+    "eslint-plugin-react": "7.37.5",
+    "eslint-plugin-react-hooks": "7.1.1",
+    "fast-check": "4.11.0",
+    "globals": "17.14.0",
+    "jsdom": "31.0.1",
+    "prettier": "3.10.1",
+    "typescript": "6.0.3",
+    "typescript-eslint": "8.74.0",
+    "vite": "7.3.8",
+    "vitest": "5.1.2"
+  }
+}
diff --git a/playwright.config.ts b/playwright.config.ts
new file mode 100644
index 0000000..296d95b
--- /dev/null
+++ b/playwright.config.ts
@@ -0,0 +1,21 @@
+import { defineConfig } from '@playwright/test';
+
+// T7.1: one worker, no retries (a flaky test is quarantined and reported, not retried), traces kept on failure.
+// The suite drives the production build in out/. Run `pnpm build` first; global-setup fails fast on a missing or stale build.
+export default defineConfig({
+  testDir: './tests/e2e',
+  testMatch: '**/*.spec.ts',
+  globalSetup: './tests/e2e/global-setup.ts',
+  workers: 1,
+  fullyParallel: false,
+  retries: 0,
+  forbidOnly: true,
+  timeout: 45_000,
+  expect: { timeout: 10_000 },
+  reporter: [['list']],
+  outputDir: 'test-results',
+  use: {
+    trace: 'retain-on-failure',
+    screenshot: 'only-on-failure',
+  },
+});
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
new file mode 100644
index 0000000..0465f73
--- /dev/null
+++ b/pnpm-lock.yaml
@@ -0,0 +1,4522 @@
+lockfileVersion: '9.0'
+
+settings:
+  autoInstallPeers: true
+  excludeLinksFromLockfile: false
+
+importers:
+
+  .:
+    dependencies:
+      react:
+        specifier: 19.3.1
+        version: 19.3.1
+      react-dom:
+        specifier: 19.3.1
+        version: 19.3.1(react@19.3.1)
+      zod:
+        specifier: 4.6.7
+        version: 4.6.7
+      zustand:
+        specifier: 5.1.0
+        version: 5.1.0(@types/react@19.3.3)(react@19.3.1)
+    devDependencies:
+      '@axe-core/playwright':
+        specifier: 4.14.1
+        version: 4.14.1(playwright-core@1.65.1)
+      '@eslint/js':
+        specifier: 9.39.5
+        version: 9.39.5
+      '@playwright/test':
+        specifier: 1.65.1
+        version: 1.65.1
+      '@testing-library/dom':
+        specifier: 10.4.2
+        version: 10.4.2
+      '@testing-library/jest-dom':
+        specifier: 8.0.0
+        version: 8.0.0(@testing-library/dom@10.4.2)(vitest@5.1.2)
+      '@testing-library/react':
+        specifier: 16.3.3
+        version: 16.3.3(@testing-library/dom@10.4.2)(@types/react-dom@19.3.0(@types/react@19.3.3))(@types/react@19.3.3)(react-dom@19.3.1(react@19.3.1))(react@19.3.1)
+      '@testing-library/user-event':
+        specifier: 14.6.13
+        version: 14.6.13(@testing-library/dom@10.4.2)
+      '@types/node':
+        specifier: 24.19.4
+        version: 24.19.4
+      '@types/react':
+        specifier: 19.3.3
+        version: 19.3.3
+      '@types/react-dom':
+        specifier: 19.3.0
+        version: 19.3.0(@types/react@19.3.3)
+      '@vitejs/plugin-react':
+        specifier: 5.2.0
+        version: 5.2.0(vite@7.3.8(@types/node@24.19.4))
+      '@vitest/coverage-v8':
+        specifier: 5.1.2
+        version: 5.1.2(vitest@5.1.2)
+      electron:
+        specifier: 45.5.0
+        version: 45.5.0
+      electron-vite:
+        specifier: 6.0.0
+        version: 6.0.0(vite@7.3.8(@types/node@24.19.4))
+      eslint:
+        specifier: 9.39.5
+        version: 9.39.5
+      eslint-config-prettier:
+        specifier: 10.1.8
+        version: 10.1.8(eslint@9.39.5)
+      eslint-plugin-jsx-a11y:
+        specifier: 6.10.2
+        version: 6.10.2(eslint@9.39.5)
+      eslint-plugin-react:
+        specifier: 7.37.5
+        version: 7.37.5(eslint@9.39.5)
+      eslint-plugin-react-hooks:
+        specifier: 7.1.1
+        version: 7.1.1(eslint@9.39.5)
+      fast-check:
+        specifier: 4.11.0
+        version: 4.11.0
+      globals:
+        specifier: 17.14.0
+        version: 17.14.0
+      jsdom:
+        specifier: 31.0.1
+        version: 31.0.1
+      prettier:
+        specifier: 3.10.1
+        version: 3.10.1
+      typescript:
+        specifier: 6.0.3
+        version: 6.0.3
+      typescript-eslint:
+        specifier: 8.74.0
+        version: 8.74.0(eslint@9.39.5)(typescript@6.0.3)
+      vite:
+        specifier: 7.3.8
+        version: 7.3.8(@types/node@24.19.4)
+      vitest:
+        specifier: 5.1.2
+        version: 5.1.2(@types/node@24.19.4)(@vitest/coverage-v8@5.1.2)(jsdom@31.0.1)(vite@7.3.8(@types/node@24.19.4))
+
+packages:
+
+  '@adobe/css-tools@4.5.0':
+    resolution: {integrity: sha512-6OzddxPio9UiWTCemp4N8cYLV2ZN1ncRnV1cVGtve7dhPOtRkleRyx32GQCYSwDYgaHU3USMm84tNsvKzRCa1Q==}
+
+  '@axe-core/playwright@4.14.1':
+    resolution: {integrity: sha512-cSN1ijrWLnlOof22sPN4RtWGSoPpt7GzOVyOKomyhnPsy1fPNoRdBiJAUziuCRs8KoK50kKufiMUFt7itAuwOg==}
+    engines: {node: '>=22.12.0'}
+    peerDependencies:
+      playwright-core: '>= 1.0.0'
+
+  '@babel/code-frame@7.29.7':
+    resolution: {integrity: sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/compat-data@7.29.7':
+    resolution: {integrity: sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/core@7.29.13':
+    resolution: {integrity: sha512-j1nvOQCZYSgp7HLmisnCXFTpVvFODiijQ9QHkORfGKWH6YDtskTEeCJS7eV545GZ9UBzrq0e2xsOd5QQ5PjIqw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/generator@7.29.15':
+    resolution: {integrity: sha512-gNWJUX0FlevflramOkaInywOMhU1lkln38gAC7TFZv2tsWbLYbN/2WZFGcq8zbX0Z55e4vGa27IB/NaeZoauWQ==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-compilation-targets@7.29.13':
+    resolution: {integrity: sha512-8WxJ4/Vmes3ghacj8VOJy3NW8eyHiFY/4thU/LSBuBE470+igjR/j1ZTNn8fV5VdNrLx6iXUwig526UdOvfP0w==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-globals@7.29.7':
+    resolution: {integrity: sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-module-imports@7.29.7':
+    resolution: {integrity: sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-module-transforms@7.29.14':
+    resolution: {integrity: sha512-2XDvQVd9JESaOgGc4jT2/jquTAO7ppA5noTZQqH+MmZ89yjCzScLwtCPbWtkPZylL+TLWR49IwWmk+QkRR4GsA==}
+    engines: {node: '>=6.9.0'}
+    peerDependencies:
+      '@babel/core': ^7.0.0
+
+  '@babel/helper-plugin-utils@7.29.7':
+    resolution: {integrity: sha512-G7sHYigPY17oO5SYWnfD/0MTBwVR781S/JI643e/JhUYgVgWE/61SoW3NH9KWUKyKq5LVh3npif99Wkt6j86Jw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-string-parser@7.29.15':
+    resolution: {integrity: sha512-C2FuapQ2Kh1OnVHAoLi5rD3GBJ8COb9Q609T6HEpLqaBAo560PDP5OxBE5dCI/h951MBO/+bCUYU5SZ+8ZlV+w==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-validator-identifier@7.29.7':
+    resolution: {integrity: sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-validator-option@7.29.7':
+    resolution: {integrity: sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helpers@7.29.15':
+    resolution: {integrity: sha512-l+ezV2czw3t2d2ELq+3CwPL4WLKK5O8IywBXb9/gpmbCOVZFmRYJPmHVqSCv2k+8iKbE30Zf54siOoIZ52XOxA==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/parser@7.29.15':
+    resolution: {integrity: sha512-RpKWyisHoP81twtSCgmE02iU0RnPcq1DN5bBEbpUePrjA9Q3wXhufnCJrrayPpoZieqFh3zyZQqwtSK0gGccRA==}
+    engines: {node: '>=6.0.0'}
+    hasBin: true
+
+  '@babel/plugin-transform-arrow-functions@7.29.7':
+    resolution: {integrity: sha512-N7zArUXWzAMzm+/N0uPBeVB3Fam5lMxtUwMmDK5f/IBBS7a7p1qeUoxd/6CckXoxUdgsntq1Dh8xNW06maZbDQ==}
+    engines: {node: '>=6.9.0'}
+    peerDependencies:
+      '@babel/core': ^7.0.0-0
+
+  '@babel/plugin-transform-react-jsx-self@7.29.7':
+    resolution: {integrity: sha512-TL0hMc9xzy86VD31nUiwzd5otRAcyEPcsegCxolO0PvcXuH1v0kECe/UIznYFihpkvU5wg/jk4v0TTEFfm53fw==}
+    engines: {node: '>=6.9.0'}
+    peerDependencies:
+      '@babel/core': ^7.0.0-0
+
+  '@babel/plugin-transform-react-jsx-source@7.29.7':
+    resolution: {integrity: sha512-06IyK09H3wi4cGbhDBwp5gUGo0IKtnYa8tyTiephirPCK6fbobVGiXMMI5zLQ4aKEYP3wZ3ArU44o+8KMrSG/Q==}
+    engines: {node: '>=6.9.0'}
+    peerDependencies:
+      '@babel/core': ^7.0.0-0
+
+  '@babel/runtime@7.29.15':
+    resolution: {integrity: sha512-304gsbbGVmQc+cNGHzwHBlqepYdWLKj3VXCQBGt/EGcV7PUPfKI7kAUNW1FZEOCwlQiLvQjg1JEaAlRQ616h+Q==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/template@7.29.7':
+    resolution: {integrity: sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/traverse@7.29.15':
+    resolution: {integrity: sha512-ZfawBo2i8vvt+BTt37dWDKBPjUfm/H+bw+ltwsCRhW7gPtyNVwUXuNo54eO2Xo+P4VXpalPFfFISbBTRKC8SOQ==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/types@7.29.15':
+    resolution: {integrity: sha512-/XKpKDakL//LZ66bq1XsZOswuqeI5MZqPLDu18o3XdkU1fNJ7bdPtzgnc4ZNS+bBGHV0FJG8jjb8SwcC3nNVQQ==}
+    engines: {node: '>=6.9.0'}
+
+  '@bcoe/v8-coverage@1.0.2':
+    resolution: {integrity: sha512-6zABk/ECA/QYSCQ1NGiVwwbQerUCZ+TQbp64Q3AgmfNvurHH0j8TtXa1qbShXA6qqkpAj4V5W8pP6mLe1mcMqA==}
+    engines: {node: '>=18'}
+
+  '@electron-internal/extract-zip@1.0.10':
+    resolution: {integrity: sha512-3ZpfrVbqRKZ1/K0BjUfziapy3aZQzDeJX70SbsO8tc+gGlzJYnFAgZGE8LtxMV19RsoF8+Uwvd04FtIiMD4KyA==}
+    engines: {node: '>=22.12.0'}
+
+  '@electron/get@5.1.0':
+    resolution: {integrity: sha512-3kSBtG8ObcTVfXanm5vVJ6UnBLEVmVsRk1M+vGqCuMBV+XLCbJYuWQful+yIy0GQDsSlK0kHEriEHn7SPk4EnA==}
+    engines: {node: '>=22.12.0'}
+
+  '@emnapi/core@2.0.0-beta.2':
+    resolution: {integrity: sha512-MzCVoWtcg4Pm2B3je5mMvYMvj3MmBKw+fU7vbsJc9/iT8ip6/eYIHo/Dsm/mr+wsHB6SEyJDuxB09Yy6r/8+4A==}
+
+  '@emnapi/runtime@2.0.0-beta.2':
+    resolution: {integrity: sha512-JcrSPzPvZuNZvJqPTF9Fw25LbOJ8avzFVlaf2grmH4Cku0oGP47tRgqPZadcfj3YoZMHkFVnCYFbQM8I+i5QEw==}
+
+  '@emnapi/wasi-threads@2.2.0':
+    resolution: {integrity: sha512-JP7OYH38Q7+pyTAe14raZHLQIK7BDKbdwji+Xi3pcd/6QkJYQH3SX4wu6EplGrGJWRepoNzedfm0G3B9Z4e9Rw==}
+
+  '@esbuild/aix-ppc64@0.28.2':
+    resolution: {integrity: sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==}
+    engines: {node: '>=18'}
+    cpu: [ppc64]
+    os: [aix]
+
+  '@esbuild/android-arm64@0.28.2':
+    resolution: {integrity: sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [android]
+
+  '@esbuild/android-arm@0.28.2':
+    resolution: {integrity: sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==}
+    engines: {node: '>=18'}
+    cpu: [arm]
+    os: [android]
+
+  '@esbuild/android-x64@0.28.2':
+    resolution: {integrity: sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [android]
+
+  '@esbuild/darwin-arm64@0.28.2':
+    resolution: {integrity: sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@esbuild/darwin-x64@0.28.2':
+    resolution: {integrity: sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [darwin]
+
+  '@esbuild/freebsd-arm64@0.28.2':
+    resolution: {integrity: sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [freebsd]
+
+  '@esbuild/freebsd-x64@0.28.2':
+    resolution: {integrity: sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [freebsd]
+
+  '@esbuild/linux-arm64@0.28.2':
+    resolution: {integrity: sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [linux]
+
+  '@esbuild/linux-arm@0.28.2':
+    resolution: {integrity: sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==}
+    engines: {node: '>=18'}
+    cpu: [arm]
+    os: [linux]
+
+  '@esbuild/linux-ia32@0.28.2':
+    resolution: {integrity: sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==}
+    engines: {node: '>=18'}
+    cpu: [ia32]
+    os: [linux]
+
+  '@esbuild/linux-loong64@0.28.2':
+    resolution: {integrity: sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==}
+    engines: {node: '>=18'}
+    cpu: [loong64]
+    os: [linux]
+
+  '@esbuild/linux-mips64el@0.28.2':
+    resolution: {integrity: sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==}
+    engines: {node: '>=18'}
+    cpu: [mips64el]
+    os: [linux]
+
+  '@esbuild/linux-ppc64@0.28.2':
+    resolution: {integrity: sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==}
+    engines: {node: '>=18'}
+    cpu: [ppc64]
+    os: [linux]
+
+  '@esbuild/linux-riscv64@0.28.2':
+    resolution: {integrity: sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==}
+    engines: {node: '>=18'}
+    cpu: [riscv64]
+    os: [linux]
+
+  '@esbuild/linux-s390x@0.28.2':
+    resolution: {integrity: sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==}
+    engines: {node: '>=18'}
+    cpu: [s390x]
+    os: [linux]
+
+  '@esbuild/linux-x64@0.28.2':
+    resolution: {integrity: sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [linux]
+
+  '@esbuild/netbsd-arm64@0.28.2':
+    resolution: {integrity: sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [netbsd]
+
+  '@esbuild/netbsd-x64@0.28.2':
+    resolution: {integrity: sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [netbsd]
+
+  '@esbuild/openbsd-arm64@0.28.2':
+    resolution: {integrity: sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [openbsd]
+
+  '@esbuild/openbsd-x64@0.28.2':
+    resolution: {integrity: sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [openbsd]
+
+  '@esbuild/openharmony-arm64@0.28.2':
+    resolution: {integrity: sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [openharmony]
+
+  '@esbuild/sunos-x64@0.28.2':
+    resolution: {integrity: sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [sunos]
+
+  '@esbuild/win32-arm64@0.28.2':
+    resolution: {integrity: sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [win32]
+
+  '@esbuild/win32-ia32@0.28.2':
+    resolution: {integrity: sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==}
+    engines: {node: '>=18'}
+    cpu: [ia32]
+    os: [win32]
+
+  '@esbuild/win32-x64@0.28.2':
+    resolution: {integrity: sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [win32]
+
+  '@eslint-community/eslint-utils@4.10.1':
+    resolution: {integrity: sha512-cuadcxVFE8sDK6iWJbs8Sn0av2Nrh2QSGQhVlBW9AaAHqHwjWsZHT8LJ4hFGPh7ASBV2deFdM7H/DPjulmh8rg==}
+    engines: {node: ^12.22.0 || ^14.17.0 || >=16.0.0}
+    peerDependencies:
+      eslint: ^6.0.0 || ^7.0.0 || >=8.0.0
+
+  '@eslint-community/regexpp@4.12.3':
+    resolution: {integrity: sha512-R76UKbvsqI68DJJVTVyqFKqU98CN4+B+acxNfEA2IFarSzP0SjtKf/3+fFiXzTyv5Fj3PxLkGHe2wnVWWMxobQ==}
[TRUNCATED: pnpm-lock.yaml has 4528 diff lines, remaining 4128 lines omitted]
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
new file mode 100644
index 0000000..4728fca
--- /dev/null
+++ b/pnpm-workspace.yaml
@@ -0,0 +1,12 @@
+# Single authoritative source for pnpm dependency lifecycle policy (pnpm 10.34.9).
+# strictDepBuilds (added in pnpm 10.3.0): installation exits non-zero when a dependency
+# has an unreviewed build script. Approved deviation from the R1.6 default.
+strictDepBuilds: true
+
+# Version-qualified allow entries are supported since pnpm 10.19.0.
+# A bump of esbuild fails the install until the new version is reviewed again.
+onlyBuiltDependencies:
+  - esbuild@0.28.2
+
+ignoredBuiltDependencies:
+  - fsevents
diff --git a/prettier.config.mjs b/prettier.config.mjs
new file mode 100644
index 0000000..ecddd6a
--- /dev/null
+++ b/prettier.config.mjs
@@ -0,0 +1,7 @@
+export default {
+  singleQuote: true,
+  semi: true,
+  trailingComma: 'all',
+  printWidth: 100,
+  endOfLine: 'lf',
+};
diff --git a/src/main/constants.ts b/src/main/constants.ts
new file mode 100644
index 0000000..1583581
--- /dev/null
+++ b/src/main/constants.ts
@@ -0,0 +1,13 @@
+export const APP_NAME = 'NecroAmp';
+
+/** Custom protocol that serves the production renderer (design section 4). */
+export const APP_SCHEME = 'app';
+export const APP_HOST = 'renderer';
+export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
+export const APP_ENTRY_URL = `${APP_ORIGIN}/index.html`;
+
+/** Built preload script, relative to the directory of the built main bundle. */
+export const PRELOAD_PATH_SEGMENTS = ['..', 'preload', 'index.js'] as const;
+
+/** Built renderer root, relative to `app.getAppPath()`. */
+export const RENDERER_ROOT_SEGMENTS = ['out', 'renderer'] as const;
diff --git a/src/main/index.ts b/src/main/index.ts
new file mode 100644
index 0000000..4fd3c63
--- /dev/null
+++ b/src/main/index.ts
@@ -0,0 +1,127 @@
+import { statSync } from 'node:fs';
+import fs from 'node:fs/promises';
+import path from 'node:path';
+import { BrowserWindow, Menu, app, ipcMain, protocol, session } from 'electron';
+import { APP_NAME, PRELOAD_PATH_SEGMENTS, RENDERER_ROOT_SEGMENTS } from './constants';
+import { installIpcHandlers } from './ipc/install-ipc';
+import {
+  attachRendererCrashHandler,
+  installProcessCrashHandlers,
+} from './lifecycle/crash-handlers';
+import { installAppMenu } from './lifecycle/app-menu';
+import {
+  shouldCreateWindowOnActivate,
+  shouldQuitOnAllWindowsClosed,
+} from './lifecycle/platform-policy';
+import { acquireSingleInstance, focusOrCreateWindow } from './lifecycle/single-instance';
+import { E2E_USER_DATA_ENV, resolveUserDataOverride } from './lifecycle/user-data-override';
+import { createLogger } from './logging/logger';
+import { installAppProtocol, registerAppScheme } from './protocol/app-protocol';
+import { buildCsp } from './security/csp';
+import { installDevCspHook } from './security/dev-csp';
+import { resolveTrustedOrigins } from './security/trusted-origins';
+import { createMainWindow } from './window/create-main-window';
+import { resolveLoadTarget } from './window/load-target';
+import { installNavigationGuards } from './window/navigation-guards';
+import { installPermissionHandlers } from './window/permissions';
+
+/**
+ * Composition root and the only file with startup side effects (design section 2). The order
+ * below is fixed: some Electron calls must happen before `ready`.
+ */
+const log = createLogger(console);
+const isDevRun = !app.isPackaged;
+
+// 1. Application name. It also fixes the user-data directory.
+app.setName(APP_NAME);
+
+// 2. Test-only user-data override. Inert in a packaged build.
+const override = resolveUserDataOverride(process.env[E2E_USER_DATA_ENV], app.isPackaged, path, {
+  isDirectory: (candidate) => statSync(candidate).isDirectory(),
+});
+if (override.status === 'applied') {
+  app.setPath('userData', override.path);
+} else if (override.status === 'ignored') {
+  log.warn('userdata.override_ignored', { code: override.code });
+}
+
+const target = resolveLoadTarget(process.env, app.isPackaged);
+const trusted = resolveTrustedOrigins(
+  target.kind === 'development'
+    ? { mode: 'development', devOrigin: target.devOrigin }
+    : { mode: 'production' },
+);
+const preloadPath = path.join(__dirname, ...PRELOAD_PATH_SEGMENTS);
+const rendererRoot = path.join(app.getAppPath(), ...RENDERER_ROOT_SEGMENTS);
+
+let mainWindow: BrowserWindow | null = null;
+const disposers: (() => void)[] = [];
+
+function openMainWindow(): void {
+  const window = createMainWindow({ BrowserWindow, preloadPath, target, log });
+  mainWindow = window;
+  attachRendererCrashHandler(
+    {
+      onRenderProcessGone: (listener) =>
+        window.webContents.on('render-process-gone', (_e, d) => listener(d)),
+      reload: () => window.webContents.reload(),
+    },
+    app,
+    log,
+  );
+  window.on('closed', () => {
+    if (mainWindow === window) mainWindow = null;
+  });
+}
+
+// 3. Single instance. A second process quits before any other work (D11).
+if (acquireSingleInstance(app, () => focusOrCreateWindow(mainWindow, openMainWindow))) {
+  // 4. Privileged scheme registration. Must run before `ready`.
+  registerAppScheme(protocol);
+
+  // 5. Process crash handlers.
+  installProcessCrashHandlers(process, app, log);
+
+  // 6. Guards and lifecycle listeners.
+  installNavigationGuards(app, trusted, log);
+  app.on('window-all-closed', () => {
+    if (shouldQuitOnAllWindowsClosed(process.platform)) app.quit();
+  });
+  app.on('activate', () => {
+    if (shouldCreateWindowOnActivate(process.platform, BrowserWindow.getAllWindows().length)) {
+      openMainWindow();
+    }
+  });
+  app.on('will-quit', () => {
+    for (const dispose of disposers.splice(0)) dispose();
+  });
+
+  // 7. Everything that needs `ready`.
+  void app.whenReady().then(() => {
+    installPermissionHandlers(session.defaultSession);
+    disposers.push(
+      installAppProtocol(protocol, {
+        fs,
+        pathApi: path,
+        rendererRoot,
+        csp: buildCsp({ mode: 'production' }),
+        log,
+      }),
+    );
+    if (target.kind === 'development') {
+      installDevCspHook(session.defaultSession.webRequest, target.devOrigin);
+    }
+    disposers.push(
+      installIpcHandlers({
+        ipcMain,
+        app,
+        platform: process.platform,
+        trusted,
+        isRegisteredSender: (sender) => mainWindow !== null && sender === mainWindow.webContents,
+        log,
+      }),
+    );
+    installAppMenu(Menu, { platform: process.platform, isDevRun });
+    openMainWindow();
+  });
+}
diff --git a/src/main/ipc/app-handlers.test.ts b/src/main/ipc/app-handlers.test.ts
new file mode 100644
index 0000000..d548d41
--- /dev/null
+++ b/src/main/ipc/app-handlers.test.ts
@@ -0,0 +1,168 @@
+import { describe, expect, it, vi } from 'vitest';
+import { appInfoResponseSchema } from '@shared/ipc';
+import type { Logger } from '../logging/logger';
+import type { SenderEventLike } from '../security/sender-validation';
+import { registerAppHandlers } from './app-handlers';
+import { installIpcHandlers } from './install-ipc';
+import type { IpcMainLike } from './register-handler';
+
+type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
+
+function fakeIpcMain(): IpcMainLike & { channels: string[]; invoke: Listener; removed: string[] } {
+  const listeners = new Map<string, Listener>();
+  const removed: string[] = [];
+  return {
+    channels: [],
+    removed,
+    handle(channel, listener) {
+      this.channels.push(channel);
+      listeners.set(channel, listener);
+    },
+    removeHandler: (channel) => {
+      removed.push(channel);
+    },
+    invoke: (event, ...args) => {
+      const listener = listeners.get('app:get-info');
+      if (listener === undefined) throw new Error('not registered');
+      return listener(event, ...args);
+    },
+  };
+}
+
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+const app = { getName: () => 'NecroAmp', getVersion: () => '0.0.0' };
+const goodEvent: SenderEventLike = {
+  senderFrame: { url: 'app://renderer/index.html', parent: null },
+  sender: 'main',
+};
+
+describe('registerAppHandlers', () => {
+  it('returns name, version and platform to a trusted sender', async () => {
+    const ipcMain = fakeIpcMain();
+    registerAppHandlers({
+      ipcMain,
+      app,
+      platform: 'linux',
+      isTrustedSender: () => true,
+      log: silentLog(),
+    });
+    const result = await ipcMain.invoke(goodEvent);
+    expect(result).toEqual({
+      ok: true,
+      data: { name: 'NecroAmp', version: '0.0.0', platform: 'linux' },
+    });
+    expect(appInfoResponseSchema.safeParse(result).success).toBe(true);
+  });
+
+  it.each(['win32', 'darwin', 'linux'])('supports %s', async (platform) => {
+    const ipcMain = fakeIpcMain();
+    registerAppHandlers({ ipcMain, app, platform, isTrustedSender: () => true, log: silentLog() });
+    expect(await ipcMain.invoke(goodEvent)).toMatchObject({ ok: true, data: { platform } });
+  });
+
+  it.each(['freebsd', 'aix', ''])(
+    'returns INTERNAL for unsupported platform %s',
+    async (platform) => {
+      const ipcMain = fakeIpcMain();
+      registerAppHandlers({
+        ipcMain,
+        app,
+        platform,
+        isTrustedSender: () => true,
+        log: silentLog(),
+      });
+      expect(await ipcMain.invoke(goodEvent)).toMatchObject({
+        ok: false,
+        error: { code: 'INTERNAL' },
+      });
+    },
+  );
+
+  it('returns INTERNAL when the app name violates the contract bounds', async () => {
+    const ipcMain = fakeIpcMain();
+    registerAppHandlers({
+      ipcMain,
+      app: { getName: () => 'x'.repeat(65), getVersion: () => '1' },
+      platform: 'linux',
+      isTrustedSender: () => true,
+      log: silentLog(),
+    });
+    expect(await ipcMain.invoke(goodEvent)).toMatchObject({
+      ok: false,
+      error: { code: 'INTERNAL' },
+    });
+  });
+});
+
+let registeredContents: unknown;
+
+describe('installIpcHandlers', () => {
+  const trusted = ['app://renderer'];
+  const make = (isRegisteredSender: (s: unknown) => boolean) => {
+    const ipcMain = fakeIpcMain();
+    const dispose = installIpcHandlers({
+      ipcMain,
+      app,
+      platform: 'win32',
+      trusted,
+      isRegisteredSender,
+      log: silentLog(),
+    });
+    return { ipcMain, dispose };
+  };
+
+  it('registers only the app:get-info channel', () => {
+    expect(make(() => true).ipcMain.channels).toEqual(['app:get-info']);
+  });
+
+  it('accepts the registered top frame on a trusted origin', async () => {
+    const { ipcMain } = make((sender) => sender === registeredContents);
+    const frame = { url: 'app://renderer/index.html', parent: null };
+    const event = { senderFrame: frame, sender: { mainFrame: frame } };
+    registeredContents = event.sender;
+    expect(await ipcMain.invoke(event)).toMatchObject({ ok: true });
+  });
+
+  it('rejects an unregistered contents even when the frame is its main frame', async () => {
+    registeredContents = { mainFrame: null };
+    const { ipcMain } = make((s) => s === registeredContents);
+    const frame = { url: 'app://renderer/index.html', parent: null };
+    expect(
+      await ipcMain.invoke({ senderFrame: frame, sender: { mainFrame: frame } }),
+    ).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
+  });
+
+  it('rejects a parentless frame that is not the sender main frame', async () => {
+    const sender = { mainFrame: { url: 'app://renderer/index.html', parent: null } };
+    registeredContents = sender;
+    const { ipcMain } = make((s) => s === registeredContents);
+    const event = { senderFrame: { url: 'app://renderer/index.html', parent: null }, sender };
+    expect(await ipcMain.invoke(event)).toMatchObject({
+      ok: false,
+      error: { code: 'INVALID_SENDER' },
+    });
+  });
+
+  it.each([
+    ['null frame', { senderFrame: null, sender: 'main' }],
+    ['sub-frame', { senderFrame: { url: 'app://renderer/', parent: {} }, sender: 'main' }],
+    ['untrusted url', { senderFrame: { url: 'https://evil.test/', parent: null }, sender: 'main' }],
+    ['file url', { senderFrame: { url: 'file:///C:/x.html', parent: null }, sender: 'main' }],
+    [
+      'unregistered sender',
+      { senderFrame: { url: 'app://renderer/', parent: null }, sender: 'other' },
+    ],
+  ] as const)('rejects %s with INVALID_SENDER', async (_name, event) => {
+    const { ipcMain } = make((sender) => sender === 'main');
+    expect(await ipcMain.invoke(event)).toMatchObject({
+      ok: false,
+      error: { code: 'INVALID_SENDER' },
+    });
+  });
+
+  it('removes the handler on dispose', () => {
+    const { ipcMain, dispose } = make(() => true);
+    dispose();
+    expect(ipcMain.removed).toEqual(['app:get-info']);
+  });
+});
diff --git a/src/main/ipc/app-handlers.ts b/src/main/ipc/app-handlers.ts
new file mode 100644
index 0000000..9a20769
--- /dev/null
+++ b/src/main/ipc/app-handlers.ts
@@ -0,0 +1,44 @@
+import {
+  IPC_CHANNELS,
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  createIpcError,
+  platformSchema,
+  type AppInfoResponse,
+} from '@shared/ipc';
+import type { Logger } from '../logging/logger';
+import type { SenderEventLike } from '../security/sender-validation';
+import { registerHandler, type IpcMainLike } from './register-handler';
+
+/** Handler for `app:get-info`. Electron objects are injected (design section 5). */
+export interface AppHandlerDeps {
+  readonly ipcMain: IpcMainLike;
+  readonly app: { getName(): string; getVersion(): string };
+  readonly platform: string;
+  readonly isTrustedSender: (event: SenderEventLike) => boolean;
+  readonly log: Logger;
+}
+
+export function registerAppHandlers(deps: AppHandlerDeps): () => void {
+  const { ipcMain, app, platform, isTrustedSender, log } = deps;
+
+  return registerHandler({
+    ipcMain,
+    channel: IPC_CHANNELS.appGetInfo,
+    requestSchema: appInfoRequestSchema,
+    responseSchema: appInfoResponseSchema,
+    isTrustedSender,
+    log,
+    handler: (): AppInfoResponse => {
+      const parsedPlatform = platformSchema.safeParse(platform);
+      if (!parsedPlatform.success) {
+        log.error('ipc.unsupported_platform', { platform });
+        return { ok: false, error: createIpcError('INTERNAL') };
+      }
+      return {
+        ok: true,
+        data: { name: app.getName(), version: app.getVersion(), platform: parsedPlatform.data },
+      };
+    },
+  });
+}
diff --git a/src/main/ipc/install-ipc.ts b/src/main/ipc/install-ipc.ts
new file mode 100644
index 0000000..f84a35a
--- /dev/null
+++ b/src/main/ipc/install-ipc.ts
@@ -0,0 +1,30 @@
+import type { Logger } from '../logging/logger';
+import { isTrustedSender, type SenderEventLike } from '../security/sender-validation';
+import { registerAppHandlers } from './app-handlers';
+import type { IpcMainLike } from './register-handler';
+
+/**
+ * Registers every IPC domain with one shared sender policy. Adding a domain means adding one
+ * line here and one handler file, so no handler can bypass `registerHandler`.
+ */
+export interface InstallIpcDeps {
+  readonly ipcMain: IpcMainLike;
+  readonly app: { getName(): string; getVersion(): string };
+  readonly platform: string;
+  readonly trusted: readonly string[];
+  readonly isRegisteredSender: (sender: unknown) => boolean;
+  readonly log: Logger;
+}
+
+export function installIpcHandlers(deps: InstallIpcDeps): () => void {
+  const { ipcMain, app, platform, trusted, isRegisteredSender, log } = deps;
+  const senderCheck = (event: SenderEventLike): boolean =>
+    isTrustedSender(event, trusted, isRegisteredSender);
+
+  const disposers = [
+    registerAppHandlers({ ipcMain, app, platform, isTrustedSender: senderCheck, log }),
+  ];
+  return () => {
+    for (const dispose of disposers) dispose();
+  };
+}
diff --git a/src/main/ipc/register-handler.property.test.ts b/src/main/ipc/register-handler.property.test.ts
new file mode 100644
index 0000000..c19e7a5
--- /dev/null
+++ b/src/main/ipc/register-handler.property.test.ts
@@ -0,0 +1,153 @@
+import fc from 'fast-check';
+import { describe, expect, it, vi } from 'vitest';
+import {
+  IPC_CHANNELS,
+  IPC_ERROR_MESSAGES,
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  type AppInfoResponse,
+} from '@shared/ipc';
+import type { Logger } from '../logging/logger';
+import type { SenderEventLike } from '../security/sender-validation';
+import { registerAppHandlers } from './app-handlers';
+import { registerHandler, type IpcMainLike } from './register-handler';
+
+type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
+
+function harness(options: {
+  trusted: (event: SenderEventLike) => boolean;
+  handler: () => AppInfoResponse | Promise<AppInfoResponse>;
+}) {
+  let listener: Listener | undefined;
+  const ipcMain: IpcMainLike = {
+    handle: (_channel, l) => {
+      listener = l;
+    },
+    removeHandler: () => undefined,
+  };
+  const logCalls: string[] = [];
+  const log: Logger = {
+    info: (e, f) => logCalls.push(JSON.stringify([e, f])),
+    warn: (e, f) => logCalls.push(JSON.stringify([e, f])),
+    error: (e, f) => logCalls.push(JSON.stringify([e, f])),
+  };
+  const handler = vi.fn(options.handler);
+  registerHandler({
+    ipcMain,
+    channel: IPC_CHANNELS.appGetInfo,
+    requestSchema: appInfoRequestSchema,
+    responseSchema: appInfoResponseSchema,
+    isTrustedSender: options.trusted,
+    log,
+    handler,
+  });
+  const invoke = (event: SenderEventLike, ...args: unknown[]) => {
+    if (listener === undefined) throw new Error('not registered');
+    return listener(event, ...args);
+  };
+  return { invoke, handler, logCalls };
+}
+
+const goodEvent: SenderEventLike = { senderFrame: { url: 'app://renderer/', parent: null } };
+const goodInfo: AppInfoResponse = {
+  ok: true,
+  data: { name: 'NecroAmp', version: '0.0.0', platform: 'linux' },
+};
+const SECRET = 'C:\\Users\\victim\\secret-token-ghp_FAKE';
+
+describe('registerHandler properties (R4)', () => {
+  it('an untrusted sender never reaches the handler and gets INVALID_SENDER for any payload', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.array(fc.anything(), { maxLength: 4 }), async (args) => {
+        const h = harness({ trusted: () => false, handler: () => goodInfo });
+        const result = await h.invoke(goodEvent, ...args);
+        expect(result).toEqual({
+          ok: false,
+          error: { code: 'INVALID_SENDER', message: IPC_ERROR_MESSAGES.INVALID_SENDER },
+        });
+        expect(h.handler).not.toHaveBeenCalled();
+      }),
+    );
+  });
+
+  it('a throwing sender check is treated as untrusted', async () => {
+    const h = harness({
+      trusted: () => {
+        throw new Error(SECRET);
+      },
+      handler: () => goodInfo,
+    });
+    const result = await h.invoke(goodEvent);
+    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
+    expect(JSON.stringify(result)).not.toContain('victim');
+    expect(h.handler).not.toHaveBeenCalled();
+  });
+
+  it('any non-empty argument list is INVALID_PAYLOAD and the handler is not called', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.array(fc.anything(), { minLength: 1, maxLength: 4 }), async (args) => {
+        const h = harness({ trusted: () => true, handler: () => goodInfo });
+        const result = await h.invoke(goodEvent, ...args);
+        expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
+        expect(h.handler).not.toHaveBeenCalled();
+        expect(h.logCalls.join('')).not.toContain('ghp_');
+      }),
+    );
+  });
+
+  it('a handler that throws any value yields INTERNAL with a fixed message and no leaked text', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.anything(), async (thrown) => {
+        const h = harness({
+          trusted: () => true,
+          handler: () => {
+            throw thrown ?? new Error(SECRET);
+          },
+        });
+        const result = await h.invoke(goodEvent);
+        expect(result).toEqual({
+          ok: false,
+          error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
+        });
+      }),
+    );
+  });
+
+  it('a handler that returns arbitrary data (response drift) yields INTERNAL, never the data', async () => {
+    await fc.assert(
+      fc.asyncProperty(
+        fc.anything().filter((v) => !appInfoResponseSchema.safeParse(v).success),
+        async (drift) => {
+          const h = harness({ trusted: () => true, handler: () => drift as AppInfoResponse });
+          const result = await h.invoke(goodEvent);
+          expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
+        },
+      ),
+    );
+  });
+
+  it('a valid response passes through unchanged and never rejects', async () => {
+    const h = harness({ trusted: () => true, handler: () => goodInfo });
+    await expect(h.invoke(goodEvent)).resolves.toEqual(goodInfo);
+  });
+
+  it('registerAppHandlers: any platform string outside the supported set yields INTERNAL', async () => {
+    await fc.assert(
+      fc.asyncProperty(
+        fc.string().filter((p) => !['win32', 'darwin', 'linux'].includes(p)),
+        async (platform) => {
+          let listener: Listener | undefined;
+          registerAppHandlers({
+            ipcMain: { handle: (_c, l) => void (listener = l), removeHandler: () => undefined },
+            app: { getName: () => 'NecroAmp', getVersion: () => '1.0.0' },
+            platform,
+            isTrustedSender: () => true,
+            log: { info: () => undefined, warn: () => undefined, error: () => undefined },
+          });
+          const result = await listener?.(goodEvent);
+          expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
+        },
+      ),
+    );
+  });
+});
diff --git a/src/main/ipc/register-handler.test.ts b/src/main/ipc/register-handler.test.ts
new file mode 100644
index 0000000..d219583
--- /dev/null
+++ b/src/main/ipc/register-handler.test.ts
@@ -0,0 +1,161 @@
+import { describe, expect, it, vi } from 'vitest';
+import { z } from 'zod';
+import { IPC_CHANNELS, ipcResultSchema, type IpcResult } from '@shared/ipc';
+import type { Logger } from '../logging/logger';
+import type { SenderEventLike } from '../security/sender-validation';
+import { registerHandler, type IpcMainLike } from './register-handler';
+
+type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
+
+function fakeIpcMain() {
+  let listener: Listener | undefined;
+  const handle = vi.fn((_channel: string, l: Listener) => {
+    listener = l;
+  });
+  const removeHandler = vi.fn((_channel: string) => undefined);
+  const ipcMain: IpcMainLike = { handle, removeHandler };
+  const invoke: Listener = (event, ...args) => {
+    if (listener === undefined) throw new Error('not registered');
+    return listener(event, ...args);
+  };
+  return { ipcMain, handle, removeHandler, invoke };
+}
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+const event: SenderEventLike = { senderFrame: { url: 'app://renderer/', parent: null } };
+
+const dataSchema = z.strictObject({ value: z.number() });
+const responseSchema = ipcResultSchema(dataSchema);
+type Response = z.output<typeof responseSchema>;
+
+function setup(
+  overrides: {
+    trusted?: (e: SenderEventLike) => boolean;
+    handler?: () => Response | Promise<Response>;
+  } = {},
+) {
+  const fake = fakeIpcMain();
+  const ipcMain = fake.ipcMain;
+  const log = silentLog();
+  const handler = vi.fn(overrides.handler ?? ((): Response => ({ ok: true, data: { value: 1 } })));
+  const dispose = registerHandler({
+    ipcMain,
+    channel: IPC_CHANNELS.appGetInfo,
+    requestSchema: z.tuple([]),
+    responseSchema,
+    handler,
+    isTrustedSender: overrides.trusted ?? (() => true),
+    log,
+  });
+  return { ipcMain: fake, log, handler, dispose };
+}
+
+describe('registerHandler', () => {
+  it('registers exactly the given channel constant once', () => {
+    const { ipcMain } = setup();
+    expect(ipcMain.handle).toHaveBeenCalledTimes(1);
+    expect(ipcMain.handle.mock.calls[0]?.[0]).toBe('app:get-info');
+  });
+
+  it('returns the handler result for a trusted sender and a valid payload', async () => {
+    const { ipcMain, handler } = setup();
+    await expect(ipcMain.invoke(event)).resolves.toEqual({ ok: true, data: { value: 1 } });
+    expect(handler).toHaveBeenCalledWith([]);
+  });
+
+  it('rejects an untrusted sender before reading the payload or running the handler', async () => {
+    const { ipcMain, handler, log } = setup({ trusted: () => false });
+    const payload = {
+      get secret(): never {
+        throw new Error('payload was read');
+      },
+    };
+    const result = (await ipcMain.invoke(event, payload)) as IpcResult<unknown>;
+    expect(result).toEqual({
+      ok: false,
+      error: { code: 'INVALID_SENDER', message: 'The request came from an untrusted sender.' },
+    });
+    expect(handler).not.toHaveBeenCalled();
+    expect(log.warn).toHaveBeenCalledWith('ipc.invalid_sender', { channel: 'app:get-info' });
+  });
+
+  it('treats a throwing sender check as an untrusted sender', async () => {
+    const { ipcMain, handler } = setup({
+      trusted: () => {
+        throw new Error('boom');
+      },
+    });
+    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
+    expect(result.ok).toBe(false);
+    if (!result.ok) expect(result.error.code).toBe('INVALID_SENDER');
+    expect(handler).not.toHaveBeenCalled();
+  });
+
+  it.each([[{ a: 1 }], ['x'], [null], [undefined], [1, 2]])(
+    'rejects a non-empty argument list %j with INVALID_PAYLOAD and no payload text',
+    async (...args) => {
+      const { ipcMain, handler, log } = setup();
+      const result = (await ipcMain.invoke(event, ...args)) as IpcResult<unknown>;
+      expect(result).toEqual({
+        ok: false,
+        error: { code: 'INVALID_PAYLOAD', message: 'The request payload is invalid.' },
+      });
+      expect(JSON.stringify(result)).not.toMatch(/Expected|invalid_type|too_big/i);
+      expect(handler).not.toHaveBeenCalled();
+      expect(log.warn).toHaveBeenCalledWith('ipc.invalid_payload', { channel: 'app:get-info' });
+    },
+  );
+
+  it('maps a handler exception to INTERNAL without leaking its message', async () => {
+    const { ipcMain, log } = setup({
+      handler: () => {
+        throw new Error('C:\\Users\\me\\secret.txt');
+      },
+    });
+    const result = await ipcMain.invoke(event);
+    expect(result).toEqual({
+      ok: false,
+      error: { code: 'INTERNAL', message: 'An internal error occurred.' },
+    });
+    expect(JSON.stringify(result)).not.toContain('secret');
+    expect(log.error).toHaveBeenCalledWith('ipc.handler_failed', { channel: 'app:get-info' });
+  });
+
+  it('maps a rejected handler promise to INTERNAL', async () => {
+    const { ipcMain } = setup({ handler: () => Promise.reject(new Error('nope')) });
+    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
+    expect(result.ok).toBe(false);
+  });
+
+  it('maps response shape drift to INTERNAL', async () => {
+    const drift = { ok: true, data: { value: 'not a number' } } as unknown as Response;
+    const { ipcMain, log } = setup({ handler: () => drift });
+    await expect(ipcMain.invoke(event)).resolves.toEqual({
+      ok: false,
+      error: { code: 'INTERNAL', message: 'An internal error occurred.' },
+    });
+    expect(log.error).toHaveBeenCalledWith('ipc.invalid_response', { channel: 'app:get-info' });
+  });
+
+  it('strips unknown response fields and rejects extra ones (strict schema)', async () => {
+    const extra = { ok: true, data: { value: 1, leaked: 'token' } } as unknown as Response;
+    const { ipcMain } = setup({ handler: () => extra });
+    const result = (await ipcMain.invoke(event)) as IpcResult<unknown>;
+    expect(result.ok).toBe(false);
+    expect(JSON.stringify(result)).not.toContain('token');
+  });
+
+  it('never rejects across IPC', async () => {
+    const { ipcMain } = setup({
+      handler: () => {
+        throw new Error('x');
+      },
+    });
+    await expect(ipcMain.invoke(event)).resolves.toBeDefined();
+  });
+
+  it('returns a disposer that removes the handler', () => {
+    const { ipcMain, dispose } = setup();
+    dispose();
+    expect(ipcMain.removeHandler).toHaveBeenCalledWith('app:get-info');
+  });
+});
diff --git a/src/main/ipc/register-handler.ts b/src/main/ipc/register-handler.ts
new file mode 100644
index 0000000..91ecc2f
--- /dev/null
+++ b/src/main/ipc/register-handler.ts
@@ -0,0 +1,68 @@
+import type { z } from 'zod';
+import { createIpcError, type IpcChannel, type IpcResult } from '@shared/ipc';
+import type { Logger } from '../logging/logger';
+import type { SenderEventLike } from '../security/sender-validation';
+
+/**
+ * The only caller of `ipcMain.handle` (design section 5, R4). For each invoke it runs, in order:
+ * sender check, request parse, handler, response parse. It never throws across IPC and never
+ * returns or logs payload content, issue text, paths or exception messages.
+ */
+export interface IpcMainLike {
+  handle(
+    channel: string,
+    listener: (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>,
+  ): void;
+  removeHandler(channel: string): void;
+}
+
+export interface RegisterHandlerOptions<Req extends z.ZodType, Res extends IpcResult<unknown>> {
+  readonly ipcMain: IpcMainLike;
+  readonly channel: IpcChannel;
+  readonly requestSchema: Req;
+  readonly responseSchema: z.ZodType<Res>;
+  readonly handler: (request: z.output<Req>) => Res | Promise<Res>;
+  readonly isTrustedSender: (event: SenderEventLike) => boolean;
+  readonly log: Logger;
+}
+
+/** Returns a disposer that removes the handler. */
+export function registerHandler<Req extends z.ZodType, Res extends IpcResult<unknown>>(
+  options: RegisterHandlerOptions<Req, Res>,
+): () => void {
+  const { ipcMain, channel, requestSchema, responseSchema, handler, isTrustedSender, log } =
+    options;
+
+  ipcMain.handle(channel, async (event, ...args): Promise<IpcResult<unknown>> => {
+    let trusted = false;
+    try {
+      trusted = isTrustedSender(event);
+    } catch {
+      trusted = false;
+    }
+    if (!trusted) {
+      log.warn('ipc.invalid_sender', { channel });
+      return { ok: false, error: createIpcError('INVALID_SENDER') };
+    }
+
+    const parsed = requestSchema.safeParse(args);
+    if (!parsed.success) {
+      log.warn('ipc.invalid_payload', { channel });
+      return { ok: false, error: createIpcError('INVALID_PAYLOAD') };
+    }
+
+    try {
+      const response = responseSchema.safeParse(await handler(parsed.data));
+      if (!response.success) {
+        log.error('ipc.invalid_response', { channel });
+        return { ok: false, error: createIpcError('INTERNAL') };
+      }
+      return response.data;
+    } catch {
+      log.error('ipc.handler_failed', { channel });
+      return { ok: false, error: createIpcError('INTERNAL') };
+    }
+  });
+
+  return () => ipcMain.removeHandler(channel);
+}
diff --git a/src/main/lifecycle/app-menu.test.ts b/src/main/lifecycle/app-menu.test.ts
new file mode 100644
index 0000000..d5a1404
--- /dev/null
+++ b/src/main/lifecycle/app-menu.test.ts
@@ -0,0 +1,46 @@
+import { describe, expect, it, vi } from 'vitest';
+import { buildMenuTemplate, installAppMenu, type MenuDescriptor } from './app-menu';
+
+const labelsOf = (template: MenuDescriptor[]): (string | undefined)[] =>
+  template.map((item) => item.label ?? item.role);
+
+describe('buildMenuTemplate', () => {
+  it('uses role menus on darwin', () => {
+    expect(labelsOf(buildMenuTemplate({ platform: 'darwin', isDevRun: false }))).toEqual([
+      'appMenu',
+      'fileMenu',
+      'editMenu',
+      'windowMenu',
+    ]);
+  });
+
+  it.each(['win32', 'linux', 'freebsd'])('uses File, Edit and Window on %s', (platform) => {
+    const template = buildMenuTemplate({ platform, isDevRun: false });
+    expect(labelsOf(template)).toEqual(['File', 'Edit', 'Window']);
+    expect(template[0]?.submenu).toEqual([{ role: 'quit' }]);
+  });
+
+  it.each(['win32', 'darwin', 'linux', 'freebsd'])(
+    'shows the View menu only in a development run (%s)',
+    (platform) => {
+      const dev = buildMenuTemplate({ platform, isDevRun: true });
+      const prod = buildMenuTemplate({ platform, isDevRun: false });
+      expect(labelsOf(dev)).toContain('View');
+      expect(labelsOf(prod)).not.toContain('View');
+      expect(JSON.stringify(prod)).not.toMatch(/toggleDevTools|reload/);
+    },
+  );
+});
+
+describe('installAppMenu', () => {
+  it('builds the template and sets it as the application menu', () => {
+    const built = { id: 'menu' };
+    const menu = {
+      buildFromTemplate: vi.fn(() => built),
+      setApplicationMenu: vi.fn(),
+    };
+    installAppMenu(menu, { platform: 'linux', isDevRun: false });
+    expect(menu.buildFromTemplate).toHaveBeenCalledTimes(1);
+    expect(menu.setApplicationMenu).toHaveBeenCalledWith(built);
+  });
+});
diff --git a/src/main/lifecycle/app-menu.ts b/src/main/lifecycle/app-menu.ts
new file mode 100644
index 0000000..d2bd33d
--- /dev/null
+++ b/src/main/lifecycle/app-menu.ts
@@ -0,0 +1,75 @@
+import type { MenuItemConstructorOptions } from 'electron';
+
+/**
+ * Menu template builder (design section 6, D6, R16.6). Roles supply localized labels. The View
+ * menu with reload and DevTools exists only in a development run.
+ */
+export interface MenuDescriptor {
+  role?:
+    | 'appMenu'
+    | 'fileMenu'
+    | 'editMenu'
+    | 'windowMenu'
+    | 'quit'
+    | 'undo'
+    | 'redo'
+    | 'cut'
+    | 'copy'
+    | 'paste'
+    | 'selectAll'
+    | 'minimize'
+    | 'close'
+    | 'reload'
+    | 'toggleDevTools';
+  label?: string;
+  type?: 'separator';
+  submenu?: MenuDescriptor[];
+}
+
+export interface MenuOptions {
+  readonly platform: string;
+  readonly isDevRun: boolean;
+}
+
+const EDIT_SUBMENU: MenuDescriptor[] = [
+  { role: 'undo' },
+  { role: 'redo' },
+  { type: 'separator' },
+  { role: 'cut' },
+  { role: 'copy' },
+  { role: 'paste' },
+  { role: 'selectAll' },
+];
+
+export function buildMenuTemplate({ platform, isDevRun }: MenuOptions): MenuDescriptor[] {
+  const template: MenuDescriptor[] =
+    platform === 'darwin'
+      ? [{ role: 'appMenu' }, { role: 'fileMenu' }, { role: 'editMenu' }]
+      : [
+          { label: 'File', submenu: [{ role: 'quit' }] },
+          { label: 'Edit', submenu: EDIT_SUBMENU },
+        ];
+  if (isDevRun) {
+    template.push({
+      label: 'View',
+      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }],
+    });
+  }
+  template.push(
+    platform === 'darwin'
+      ? { role: 'windowMenu' }
+      : { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
+  );
+  return template;
+}
+
+/** Thin adapter. The real `Menu` class is passed in by the composition root. */
+export function installAppMenu<M>(
+  menu: {
+    buildFromTemplate(template: MenuItemConstructorOptions[]): M;
+    setApplicationMenu(menu: M): void;
+  },
+  options: MenuOptions,
+): void {
+  menu.setApplicationMenu(menu.buildFromTemplate(buildMenuTemplate(options)));
+}
diff --git a/src/main/lifecycle/crash-handlers.test.ts b/src/main/lifecycle/crash-handlers.test.ts
new file mode 100644
index 0000000..a92034c
--- /dev/null
+++ b/src/main/lifecycle/crash-handlers.test.ts
@@ -0,0 +1,98 @@
+import { describe, expect, it, vi } from 'vitest';
+import type { Logger } from '../logging/logger';
+import {
+  attachRendererCrashHandler,
+  installProcessCrashHandlers,
+  type RenderGoneDetails,
+} from './crash-handlers';
+
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+
+function fakeProcess() {
+  const handlers = new Map<string, (value: unknown) => void>();
+  return {
+    handlers,
+    proc: {
+      on: (
+        event: 'uncaughtException' | 'unhandledRejection',
+        listener: (value: unknown) => void,
+      ) => {
+        handlers.set(event, listener);
+      },
+    },
+  };
+}
+
+describe('installProcessCrashHandlers', () => {
+  it('logs the error name only and exits with code 1 on uncaughtException', () => {
+    const { proc, handlers } = fakeProcess();
+    const app = { exit: vi.fn(), quit: vi.fn() };
+    const log = silentLog();
+    installProcessCrashHandlers(proc, app, log);
+    handlers.get('uncaughtException')?.(new RangeError('C:\\Users\\me\\secret'));
+    expect(log.error).toHaveBeenCalledWith('process.uncaught_exception', {
+      errorName: 'RangeError',
+    });
+    expect(JSON.stringify((log.error as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
+      'secret',
+    );
+    expect(app.exit).toHaveBeenCalledWith(1);
+  });
+
+  it('logs the name only and does not exit on unhandledRejection', () => {
+    const { proc, handlers } = fakeProcess();
+    const app = { exit: vi.fn(), quit: vi.fn() };
+    const log = silentLog();
+    installProcessCrashHandlers(proc, app, log);
+    handlers.get('unhandledRejection')?.('plain string reason with /secret/path');
+    expect(log.error).toHaveBeenCalledWith('process.unhandled_rejection', {
+      errorName: 'UnknownError',
+    });
+    expect(app.exit).not.toHaveBeenCalled();
+    expect(app.quit).not.toHaveBeenCalled();
+  });
+});
+
+describe('attachRendererCrashHandler', () => {
+  function setup() {
+    let listener: ((d: RenderGoneDetails) => void) | undefined;
+    const contents = {
+      onRenderProcessGone: (l: (d: RenderGoneDetails) => void) => {
+        listener = l;
+      },
+      reload: vi.fn(),
+    };
+    const app = { quit: vi.fn() };
+    const log = silentLog();
+    attachRendererCrashHandler(contents, app, log);
+    return { contents, app, log, crash: (d: RenderGoneDetails) => listener?.(d) };
+  }
+
+  it('reloads once on the first crash', () => {
+    const { contents, app, crash, log } = setup();
+    crash({ reason: 'crashed', exitCode: 11 });
+    expect(contents.reload).toHaveBeenCalledTimes(1);
+    expect(app.quit).not.toHaveBeenCalled();
+    expect(log.error).toHaveBeenCalledWith('renderer.process_gone', {
+      reason: 'crashed',
+      exitCode: 11,
+    });
+  });
+
+  it('quits on the second crash and does not reload again', () => {
+    const { contents, app, crash } = setup();
+    crash({ reason: 'crashed', exitCode: 11 });
+    crash({ reason: 'oom', exitCode: 1 });
+    expect(contents.reload).toHaveBeenCalledTimes(1);
+    expect(app.quit).toHaveBeenCalledTimes(1);
+  });
+
+  it('counts crashes per attached contents', () => {
+    const first = setup();
+    const second = setup();
+    first.crash({ reason: 'crashed', exitCode: 1 });
+    second.crash({ reason: 'crashed', exitCode: 1 });
+    expect(first.app.quit).not.toHaveBeenCalled();
+    expect(second.app.quit).not.toHaveBeenCalled();
+  });
+});
diff --git a/src/main/lifecycle/crash-handlers.ts b/src/main/lifecycle/crash-handlers.ts
new file mode 100644
index 0000000..984a97c
--- /dev/null
+++ b/src/main/lifecycle/crash-handlers.ts
@@ -0,0 +1,60 @@
+import { errorNameOf, type Logger } from '../logging/logger';
+
+/**
+ * Crash and failure policy (design section 6, R7.4, R7.5). No crash-reporting service is started.
+ * Only error names and numeric codes are logged, never messages, stacks or paths (R15.3).
+ */
+export interface ProcessLike {
+  on(
+    event: 'uncaughtException' | 'unhandledRejection',
+    listener: (value: unknown) => void,
+  ): unknown;
+}
+
+export interface ExitableApp {
+  exit(code: number): void;
+  quit(): void;
+}
+
+export function installProcessCrashHandlers(
+  proc: ProcessLike,
+  app: ExitableApp,
+  log: Logger,
+): void {
+  proc.on('uncaughtException', (error) => {
+    // Continuing after an uncaught exception is unsafe (Node documentation), so exit.
+    log.error('process.uncaught_exception', { errorName: errorNameOf(error) });
+    app.exit(1);
+  });
+  proc.on('unhandledRejection', (reason) => {
+    log.error('process.unhandled_rejection', { errorName: errorNameOf(reason) });
+  });
+}
+
+export interface RenderGoneDetails {
+  readonly reason: string;
+  readonly exitCode: number;
+}
+
+export interface CrashableContents {
+  onRenderProcessGone(listener: (details: RenderGoneDetails) => void): void;
+  reload(): void;
+}
+
+/** First crash reloads once. A second crash quits on every platform (design section 6). */
+export function attachRendererCrashHandler(
+  contents: CrashableContents,
+  app: Pick<ExitableApp, 'quit'>,
+  log: Logger,
+): void {
+  let crashes = 0;
+  contents.onRenderProcessGone((details) => {
+    crashes += 1;
+    log.error('renderer.process_gone', { reason: details.reason, exitCode: details.exitCode });
+    if (crashes === 1) {
+      contents.reload();
+    } else {
+      app.quit();
+    }
+  });
+}
diff --git a/src/main/lifecycle/lifecycle.property.test.ts b/src/main/lifecycle/lifecycle.property.test.ts
new file mode 100644
index 0000000..b8a03da
--- /dev/null
+++ b/src/main/lifecycle/lifecycle.property.test.ts
@@ -0,0 +1,136 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { APP_ENTRY_URL } from '../constants';
+import { parseDevOrigin } from '../security/trusted-origins';
+import { resolveLoadTarget } from '../window/load-target';
+import { buildWebPreferences } from '../window/window-options';
+import { buildMenuTemplate, type MenuDescriptor } from './app-menu';
+import { attachRendererCrashHandler } from './crash-handlers';
+import { shouldCreateWindowOnActivate, shouldQuitOnAllWindowsClosed } from './platform-policy';
+
+const KNOWN_ROLES = new Set([
+  'appMenu',
+  'fileMenu',
+  'editMenu',
+  'windowMenu',
+  'quit',
+  'undo',
+  'redo',
+  'cut',
+  'copy',
+  'paste',
+  'selectAll',
+  'minimize',
+  'close',
+  'reload',
+  'toggleDevTools',
+]);
+const DEV_ONLY_ROLES = new Set(['reload', 'toggleDevTools']);
+
+function collectRoles(items: readonly MenuDescriptor[]): string[] {
+  return items.flatMap((i) => [
+    ...(i.role === undefined ? [] : [i.role]),
+    ...collectRoles(i.submenu ?? []),
+  ]);
+}
+
+describe('platform policy (R7.3, R16.1)', () => {
+  it('only darwin keeps running; every other string, including unknown, quits', () => {
+    fc.assert(
+      fc.property(fc.string(), (platform) => {
+        expect(shouldQuitOnAllWindowsClosed(platform)).toBe(platform !== 'darwin');
+      }),
+    );
+  });
+
+  it('only darwin with zero windows recreates a window on activate', () => {
+    fc.assert(
+      fc.property(fc.string(), fc.integer({ min: 0, max: 5 }), (platform, windows) => {
+        expect(shouldCreateWindowOnActivate(platform, windows)).toBe(
+          platform === 'darwin' && windows === 0,
+        );
+      }),
+    );
+  });
+});
+
+describe('menu builder (R16.6)', () => {
+  it('uses only known roles and exposes reload/devtools only in a dev run', () => {
+    fc.assert(
+      fc.property(fc.string(), fc.boolean(), (platform, isDevRun) => {
+        const roles = collectRoles(buildMenuTemplate({ platform, isDevRun }));
+        for (const role of roles) expect(KNOWN_ROLES.has(role)).toBe(true);
+        const hasDev = roles.some((r) => DEV_ONLY_ROLES.has(r));
+        expect(hasDev).toBe(isDevRun);
+      }),
+    );
+  });
+});
+
+describe('resolveLoadTarget (design 3.1)', () => {
+  it('a packaged app always loads the production entry, whatever the environment says', () => {
+    fc.assert(
+      fc.property(fc.option(fc.oneof(fc.string(), fc.webUrl()), { nil: undefined }), (url) => {
+        expect(resolveLoadTarget({ ELECTRON_RENDERER_URL: url }, true)).toEqual({
+          kind: 'production',
+          url: APP_ENTRY_URL,
+        });
+      }),
+    );
+  });
+
+  it('an unpackaged app uses the dev server only for a loopback http origin with a port', () => {
+    fc.assert(
+      fc.property(fc.option(fc.oneof(fc.string(), fc.webUrl()), { nil: undefined }), (url) => {
+        const target = resolveLoadTarget({ ELECTRON_RENDERER_URL: url }, false);
+        if (target.kind === 'development') {
+          expect(parseDevOrigin(url)).not.toBeNull();
+          expect(target.url.startsWith('http://')).toBe(true);
+        } else {
+          expect(target.url).toBe(APP_ENTRY_URL);
+        }
+      }),
+    );
+  });
+});
+
+describe('BrowserWindow security configuration (R3)', () => {
+  it('keeps the four mandatory preferences for every preload path', () => {
+    fc.assert(
+      fc.property(fc.string(), (preload) => {
+        const prefs = buildWebPreferences(preload);
+        expect(prefs).toMatchObject({
+          contextIsolation: true,
+          sandbox: true,
+          nodeIntegration: false,
+          webSecurity: true,
+          webviewTag: false,
+          allowRunningInsecureContent: false,
+          nodeIntegrationInWorker: false,
+          nodeIntegrationInSubFrames: false,
+        });
+        expect(prefs.preload).toBe(preload);
+      }),
+    );
+  });
+});
+
+describe('renderer crash handler (R7.4)', () => {
+  it('reloads exactly once and quits on every later crash', () => {
+    fc.assert(
+      fc.property(fc.integer({ min: 1, max: 12 }), (crashes) => {
+        let listener: ((d: { reason: string; exitCode: number }) => void) | undefined;
+        let reloads = 0;
+        let quits = 0;
+        attachRendererCrashHandler(
+          { onRenderProcessGone: (l) => void (listener = l), reload: () => void (reloads += 1) },
+          { quit: () => void (quits += 1) },
+          { info: () => undefined, warn: () => undefined, error: () => undefined },
+        );
+        for (let i = 0; i < crashes; i += 1) listener?.({ reason: 'crashed', exitCode: 1 });
+        expect(reloads).toBe(1);
+        expect(quits).toBe(crashes - 1);
+      }),
+    );
+  });
+});
diff --git a/src/main/lifecycle/platform-policy.test.ts b/src/main/lifecycle/platform-policy.test.ts
new file mode 100644
index 0000000..da940e9
--- /dev/null
+++ b/src/main/lifecycle/platform-policy.test.ts
@@ -0,0 +1,25 @@
+import { describe, expect, it } from 'vitest';
+import { shouldCreateWindowOnActivate, shouldQuitOnAllWindowsClosed } from './platform-policy';
+
+describe('shouldQuitOnAllWindowsClosed', () => {
+  it.each([
+    ['win32', true],
+    ['linux', true],
+    ['darwin', false],
+    ['freebsd', true],
+    ['', true],
+  ])('%s -> %s', (platform, expected) => {
+    expect(shouldQuitOnAllWindowsClosed(platform)).toBe(expected);
+  });
+});
+
+describe('shouldCreateWindowOnActivate', () => {
+  it('creates a window only on macOS with no open windows', () => {
+    expect(shouldCreateWindowOnActivate('darwin', 0)).toBe(true);
+    expect(shouldCreateWindowOnActivate('darwin', 1)).toBe(false);
+  });
+
+  it.each(['win32', 'linux', 'freebsd', ''])('never creates a window on %s', (platform) => {
+    expect(shouldCreateWindowOnActivate(platform, 0)).toBe(false);
+  });
+});
diff --git a/src/main/lifecycle/platform-policy.ts b/src/main/lifecycle/platform-policy.ts
new file mode 100644
index 0000000..3bcde32
--- /dev/null
+++ b/src/main/lifecycle/platform-policy.ts
@@ -0,0 +1,9 @@
+/** Pure platform lifecycle policy (design section 6, R7.3, R16.1). */
+export type SupportedPlatform = 'win32' | 'darwin' | 'linux';
+
+/** Every platform except macOS quits when the last window closes. Unknown platforms quit. */
+export const shouldQuitOnAllWindowsClosed = (platform: string): boolean => platform !== 'darwin';
+
+/** Only macOS keeps running without windows, so only macOS recreates one on activate. */
+export const shouldCreateWindowOnActivate = (platform: string, openWindows: number): boolean =>
+  platform === 'darwin' && openWindows === 0;
diff --git a/src/main/lifecycle/single-instance.test.ts b/src/main/lifecycle/single-instance.test.ts
new file mode 100644
index 0000000..d34ea82
--- /dev/null
+++ b/src/main/lifecycle/single-instance.test.ts
@@ -0,0 +1,86 @@
+import { describe, expect, it, vi } from 'vitest';
+import { acquireSingleInstance, focusOrCreateWindow } from './single-instance';
+
+function fakeApp(lock: boolean, ready = true) {
+  const listeners: (() => void)[] = [];
+  return {
+    listeners,
+    app: {
+      requestSingleInstanceLock: vi.fn(() => lock),
+      isReady: vi.fn(() => ready),
+      quit: vi.fn(),
+      on: vi.fn((_event: 'second-instance', listener: () => void) => {
+        listeners.push(listener);
+      }),
+    },
+  };
+}
+
+describe('acquireSingleInstance', () => {
+  it('quits and registers nothing when the lock is held elsewhere', () => {
+    const { app, listeners } = fakeApp(false);
+    const onSecond = vi.fn();
+    expect(acquireSingleInstance(app, onSecond)).toBe(false);
+    expect(app.quit).toHaveBeenCalledTimes(1);
+    expect(app.on).not.toHaveBeenCalled();
+    expect(listeners).toHaveLength(0);
+  });
+
+  it('keeps running and handles second-instance when the lock is acquired', () => {
+    const { app, listeners } = fakeApp(true);
+    const onSecond = vi.fn();
+    expect(acquireSingleInstance(app, onSecond)).toBe(true);
+    expect(app.quit).not.toHaveBeenCalled();
+    listeners[0]?.();
+    expect(onSecond).toHaveBeenCalledTimes(1);
+  });
+
+  it('ignores second-instance while the app is not ready', () => {
+    const { app, listeners } = fakeApp(true, false);
+    const onSecond = vi.fn();
+    expect(acquireSingleInstance(app, onSecond)).toBe(true);
+    listeners[0]?.();
+    expect(onSecond).not.toHaveBeenCalled();
+    expect(app.quit).not.toHaveBeenCalled();
+  });
+
+  it('ignores second-instance arguments', () => {
+    const { app, listeners } = fakeApp(true);
+    const onSecond = vi.fn();
+    acquireSingleInstance(app, onSecond);
+    (listeners[0] as (...args: unknown[]) => void)(['--evil'], 'C:\\cwd');
+    expect(onSecond).toHaveBeenCalledWith();
+  });
+});
+
+describe('focusOrCreateWindow', () => {
+  const makeWindow = (minimized: boolean) => ({
+    isMinimized: vi.fn(() => minimized),
+    restore: vi.fn(),
+    show: vi.fn(),
+    focus: vi.fn(),
+  });
+
+  it('restores a minimized window, then shows and focuses it', () => {
+    const window = makeWindow(true);
+    const create = vi.fn();
+    focusOrCreateWindow(window, create);
+    expect(window.restore).toHaveBeenCalledTimes(1);
+    expect(window.show).toHaveBeenCalledTimes(1);
+    expect(window.focus).toHaveBeenCalledTimes(1);
+    expect(create).not.toHaveBeenCalled();
+  });
+
+  it('does not restore a window that is not minimized', () => {
+    const window = makeWindow(false);
+    focusOrCreateWindow(window, vi.fn());
+    expect(window.restore).not.toHaveBeenCalled();
+    expect(window.focus).toHaveBeenCalledTimes(1);
+  });
+
+  it.each([null, undefined])('creates a window when none exists (%s)', (existing) => {
+    const create = vi.fn();
+    focusOrCreateWindow(existing, create);
+    expect(create).toHaveBeenCalledTimes(1);
+  });
+});
diff --git a/src/main/lifecycle/single-instance.ts b/src/main/lifecycle/single-instance.ts
new file mode 100644
index 0000000..c056155
--- /dev/null
+++ b/src/main/lifecycle/single-instance.ts
@@ -0,0 +1,49 @@
+/**
+ * Single-instance behavior (design section 6, D11, R7.2). Call before the `ready` event.
+ * The `second-instance` arguments (argv, working directory) are never read, so no command line
+ * input is trusted.
+ */
+export interface SingleInstanceApp {
+  requestSingleInstanceLock(): boolean;
+  isReady(): boolean;
+  quit(): void;
+  on(event: 'second-instance', listener: () => void): unknown;
+}
+
+/** Returns false (after requesting quit) when another instance already holds the lock. */
+export function acquireSingleInstance(
+  app: SingleInstanceApp,
+  onSecondInstance: () => void,
+): boolean {
+  if (!app.requestSingleInstanceLock()) {
+    app.quit();
+    return false;
+  }
+  // A `second-instance` event before `ready` must not create a window (BrowserWindow throws
+  // before ready). The second process has no other effect, so the event is dropped.
+  app.on('second-instance', () => {
+    if (app.isReady()) onSecondInstance();
+  });
+  return true;
+}
+
+export interface FocusableWindow {
+  isMinimized(): boolean;
+  restore(): void;
+  show(): void;
+  focus(): void;
+}
+
+/** Restores and focuses the existing window, or creates one when none exists. */
+export function focusOrCreateWindow(
+  existing: FocusableWindow | null | undefined,
+  create: () => void,
+): void {
+  if (existing === null || existing === undefined) {
+    create();
+    return;
+  }
+  if (existing.isMinimized()) existing.restore();
+  existing.show();
+  existing.focus();
+}
diff --git a/src/main/lifecycle/user-data-override.test.ts b/src/main/lifecycle/user-data-override.test.ts
new file mode 100644
index 0000000..06d5359
--- /dev/null
+++ b/src/main/lifecycle/user-data-override.test.ts
@@ -0,0 +1,60 @@
+import path from 'node:path';
+import { describe, expect, it } from 'vitest';
+import { resolveUserDataOverride } from './user-data-override';
+
+const dirs = new Set(['/tmp/e2e', 'C:\\Temp\\e2e']);
+const probe = { isDirectory: (p: string): boolean => dirs.has(p) };
+
+describe('resolveUserDataOverride', () => {
+  it('reports absent when the variable is unset', () => {
+    expect(resolveUserDataOverride(undefined, false, path.posix, probe)).toEqual({
+      status: 'absent',
+    });
+  });
+
+  it('applies an absolute existing directory when not packaged', () => {
+    expect(resolveUserDataOverride('/tmp/e2e', false, path.posix, probe)).toEqual({
+      status: 'applied',
+      path: '/tmp/e2e',
+    });
+    expect(resolveUserDataOverride('C:\\Temp\\e2e', false, path.win32, probe)).toEqual({
+      status: 'applied',
+      path: 'C:\\Temp\\e2e',
+    });
+  });
+
+  it('is inert in a packaged build', () => {
+    expect(resolveUserDataOverride('/tmp/e2e', true, path.posix, probe)).toEqual({
+      status: 'ignored',
+      code: 'PACKAGED',
+    });
+  });
+
+  it.each([
+    '',
+    'relative/dir',
+    '/tmp/e2e/../e2e',
+    '/tmp/missing',
+    `/${'a'.repeat(300)}`,
+    '/tmp/e2e\0',
+    42,
+    null,
+  ])('ignores invalid value %j', (value) => {
+    expect(resolveUserDataOverride(value, false, path.posix, probe)).toEqual({
+      status: 'ignored',
+      code: 'INVALID',
+    });
+  });
+
+  it('ignores a value when the probe throws', () => {
+    const throwing = {
+      isDirectory: (): boolean => {
+        throw new Error('EACCES');
+      },
+    };
+    expect(resolveUserDataOverride('/tmp/e2e', false, path.posix, throwing)).toEqual({
+      status: 'ignored',
+      code: 'INVALID',
+    });
+  });
+});
diff --git a/src/main/lifecycle/user-data-override.ts b/src/main/lifecycle/user-data-override.ts
new file mode 100644
index 0000000..49a82ed
--- /dev/null
+++ b/src/main/lifecycle/user-data-override.ts
@@ -0,0 +1,43 @@
+import type { PlatformPath } from 'node:path';
+
+/**
+ * Test-only user-data isolation (design section 6, R13.5). The override is inert in a packaged
+ * build. The value must be a short absolute path to an existing directory.
+ */
+export const E2E_USER_DATA_ENV = 'NECROAMP_E2E_USER_DATA';
+export const MAX_USER_DATA_PATH_LENGTH = 260;
+
+export type UserDataOverrideResult =
+  | { readonly status: 'absent' }
+  | { readonly status: 'ignored'; readonly code: 'PACKAGED' | 'INVALID' }
+  | { readonly status: 'applied'; readonly path: string };
+
+export interface DirectoryProbe {
+  isDirectory(path: string): boolean;
+}
+
+export function resolveUserDataOverride(
+  value: unknown,
+  isPackaged: boolean,
+  pathApi: Pick<PlatformPath, 'isAbsolute' | 'normalize'>,
+  probe: DirectoryProbe,
+): UserDataOverrideResult {
+  if (value === undefined) return { status: 'absent' };
+  if (isPackaged) return { status: 'ignored', code: 'PACKAGED' };
+  if (
+    typeof value !== 'string' ||
+    value.length === 0 ||
+    value.length > MAX_USER_DATA_PATH_LENGTH ||
+    value.includes('\0') ||
+    !pathApi.isAbsolute(value) ||
+    pathApi.normalize(value) !== value
+  ) {
+    return { status: 'ignored', code: 'INVALID' };
+  }
+  try {
+    if (!probe.isDirectory(value)) return { status: 'ignored', code: 'INVALID' };
+  } catch {
+    return { status: 'ignored', code: 'INVALID' };
+  }
+  return { status: 'applied', path: value };
+}
diff --git a/src/main/logging/logger.test.ts b/src/main/logging/logger.test.ts
new file mode 100644
index 0000000..df09053
--- /dev/null
+++ b/src/main/logging/logger.test.ts
@@ -0,0 +1,60 @@
+import { describe, expect, it, vi } from 'vitest';
+import { createLogger, errorNameOf, formatLogLine } from './logger';
+
+describe('formatLogLine', () => {
+  it('prints allow-listed fields in a fixed order', () => {
+    expect(formatLogLine('warn', 'ipc.invalid_sender', { channel: 'app:get-info' })).toBe(
+      '[necroamp] warn ipc.invalid_sender channel=app:get-info',
+    );
+  });
+
+  it('drops fields that are not allow-listed', () => {
+    const fields = { reason: 'crashed', secret: 'token' } as Record<string, string>;
+    expect(formatLogLine('error', 'window.crash', fields)).toBe(
+      '[necroamp] error window.crash reason=crashed',
+    );
+  });
+
+  it('redacts paths, free text and oversized strings', () => {
+    for (const value of ['C:\\Users\\me\\file.txt', '/home/me/file', 'two words', 'x'.repeat(65)]) {
+      expect(formatLogLine('info', 'e.x', { reason: value })).toBe(
+        '[necroamp] info e.x reason=[redacted]',
+      );
+    }
+  });
+
+  it('formats numbers and rejects non-finite numbers', () => {
+    expect(formatLogLine('info', 'e.x', { exitCode: 3 })).toContain('exitCode=3');
+    expect(formatLogLine('info', 'e.x', { exitCode: Number.NaN })).toContain('[redacted]');
+  });
+
+  it('replaces an invalid event code', () => {
+    expect(formatLogLine('info', 'C:\\secret path')).toBe('[necroamp] info invalid_event');
+  });
+});
+
+describe('createLogger', () => {
+  it('routes levels to the matching sink method', () => {
+    const sink = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
+    const log = createLogger(sink);
+    log.info('a.b');
+    log.warn('a.b');
+    log.error('a.b');
+    expect(sink.info).toHaveBeenCalledTimes(1);
+    expect(sink.warn).toHaveBeenCalledTimes(1);
+    expect(sink.error).toHaveBeenCalledTimes(1);
+  });
+});
+
+describe('errorNameOf', () => {
+  it('returns the error name and never the message', () => {
+    expect(errorNameOf(new TypeError('C:\\secret'))).toBe('TypeError');
+  });
+
+  it('returns a fixed name for non-errors and unsafe names', () => {
+    expect(errorNameOf('boom')).toBe('UnknownError');
+    const odd = new Error('x');
+    odd.name = 'bad name/with\\path';
+    expect(errorNameOf(odd)).toBe('UnknownError');
+  });
+});
diff --git a/src/main/logging/logger.ts b/src/main/logging/logger.ts
new file mode 100644
index 0000000..f0e0bba
--- /dev/null
+++ b/src/main/logging/logger.ts
@@ -0,0 +1,75 @@
+/**
+ * Local console logger (design sections 3.5 and 6). It accepts a fixed event code and a small
+ * object of allow-listed scalar fields. It never accepts a raw Error message, a payload or a path
+ * (R15.3), and it has no network sink.
+ */
+export type LogLevel = 'info' | 'warn' | 'error';
+
+export const ALLOWED_LOG_FIELDS = [
+  'reason',
+  'exitCode',
+  'platform',
+  'channel',
+  'code',
+  'errorName',
+] as const;
+
+export type LogFieldName = (typeof ALLOWED_LOG_FIELDS)[number];
+export type LogFields = Partial<Record<LogFieldName, string | number | boolean>>;
+
+export interface Logger {
+  info(event: string, fields?: LogFields): void;
+  warn(event: string, fields?: LogFields): void;
+  error(event: string, fields?: LogFields): void;
+}
+
+export interface LogSink {
+  info(message: string): void;
+  warn(message: string): void;
+  error(message: string): void;
+}
+
+const REDACTED = '[redacted]';
+const MAX_STRING_LENGTH = 64;
+const EVENT_PATTERN = /^[a-z][a-z0-9_.]{0,63}$/;
+const SAFE_STRING_PATTERN = /^[A-Za-z0-9_.:-]+$/;
+
+function sanitizeValue(value: unknown): string {
+  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : REDACTED;
+  if (typeof value === 'boolean') return String(value);
+  if (typeof value === 'string' && value.length <= MAX_STRING_LENGTH) {
+    // Path separators, spaces and control characters are not in the safe set, so paths and free
+    // text cannot pass through an allow-listed field.
+    return SAFE_STRING_PATTERN.test(value) ? value : REDACTED;
+  }
+  return REDACTED;
+}
+
+/** Pure formatter. Unknown fields are dropped and unsafe values are replaced. */
+export function formatLogLine(level: LogLevel, event: string, fields?: LogFields): string {
+  const safeEvent = EVENT_PATTERN.test(event) ? event : 'invalid_event';
+  const parts: string[] = [`[necroamp] ${level} ${safeEvent}`];
+  if (fields !== undefined) {
+    for (const name of ALLOWED_LOG_FIELDS) {
+      const value = fields[name];
+      if (value !== undefined) parts.push(`${name}=${sanitizeValue(value)}`);
+    }
+  }
+  return parts.join(' ');
+}
+
+export function createLogger(sink: LogSink): Logger {
+  return {
+    info: (event, fields) => sink.info(formatLogLine('info', event, fields)),
+    warn: (event, fields) => sink.warn(formatLogLine('warn', event, fields)),
+    error: (event, fields) => sink.error(formatLogLine('error', event, fields)),
+  };
+}
+
+/** Returns a safe error name. Never the message or stack (R15.3). */
+export function errorNameOf(value: unknown): string {
+  if (value instanceof Error && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.name)) {
+    return value.name;
+  }
+  return 'UnknownError';
+}
diff --git a/src/main/protocol/app-protocol.test.ts b/src/main/protocol/app-protocol.test.ts
new file mode 100644
index 0000000..8194ce4
--- /dev/null
+++ b/src/main/protocol/app-protocol.test.ts
@@ -0,0 +1,244 @@
+import fs from 'node:fs/promises';
+import os from 'node:os';
+import path from 'node:path';
+import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
+import type { Logger } from '../logging/logger';
+import { buildCsp } from '../security/csp';
+import {
+  MAX_ASSET_BYTES,
+  createAppProtocolHandler,
+  installAppProtocol,
+  registerAppScheme,
+  type AssetFs,
+} from './app-protocol';
+
+const CSP = buildCsp({ mode: 'production' });
+const ROOT = '/opt/necroamp/out/renderer';
+
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+
+interface FakeFile {
+  readonly real?: string;
+  readonly size?: number;
+  readonly isFile?: boolean;
+  readonly body?: string;
+}
+
+function fakeFs(files: Record<string, FakeFile>, rootReal = ROOT): AssetFs {
+  return {
+    realpath: (p) => {
+      if (p === ROOT) return Promise.resolve(rootReal);
+      const entry = files[p];
+      return entry === undefined
+        ? Promise.reject(new Error('ENOENT'))
+        : Promise.resolve(entry.real ?? p);
+    },
+    stat: (p) => {
+      const entry = Object.values(files).find((f) => (f.real ?? '') === p) ?? files[p];
+      if (entry === undefined) return Promise.reject(new Error('ENOENT'));
+      return Promise.resolve({
+        isFile: () => entry.isFile ?? true,
+        size: entry.size ?? (entry.body ?? '').length,
+      });
+    },
+    readFile: (p) => {
+      const entry = Object.values(files).find((f) => (f.real ?? '') === p) ?? files[p];
+      return Promise.resolve(new TextEncoder().encode(entry?.body ?? ''));
+    },
+  };
+}
+
+const handlerFor = (files: Record<string, FakeFile>, log: Logger = silentLog()) =>
+  createAppProtocolHandler({
+    fs: fakeFs(files),
+    pathApi: path.posix,
+    rendererRoot: ROOT,
+    csp: CSP,
+    log,
+  });
+
+const get = (url: string, method = 'GET'): Request => new Request(url, { method });
+
+describe('scheme registration', () => {
+  it('requests only standard, secure and supportFetchAPI', () => {
+    const registrar = { registerSchemesAsPrivileged: vi.fn() };
+    registerAppScheme(registrar);
+    expect(registrar.registerSchemesAsPrivileged).toHaveBeenCalledWith([
+      {
+        scheme: 'app',
+        privileges: { standard: true, secure: true, supportFetchAPI: true },
+      },
+    ]);
+  });
+});
+
+describe('app protocol handler', () => {
+  const files = {
+    [`${ROOT}/index.html`]: { body: '<html></html>' },
+    [`${ROOT}/assets/main.js`]: { body: 'console.log(1)' },
+  };
+
+  it('serves an allow-listed file with security headers', async () => {
+    const response = await handlerFor(files)(get('app://renderer/'));
+    expect(response.status).toBe(200);
+    expect(await response.text()).toBe('<html></html>');
+    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
+    expect(response.headers.get('content-security-policy')).toBe(CSP);
+    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
+    expect(response.headers.get('cache-control')).toBe('no-store');
+    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
+  });
+
+  it('answers HEAD with headers and no body', async () => {
+    const response = await handlerFor(files)(get('app://renderer/assets/main.js', 'HEAD'));
+    expect(response.status).toBe(200);
+    expect(await response.text()).toBe('');
+    expect(response.headers.get('content-length')).toBe('14');
+  });
+
+  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])(
+    'answers %s with 405 and an Allow header',
+    async (method) => {
+      const response = await handlerFor(files)(
+        new Request('app://renderer/index.html', { method, body: 'x' }),
+      );
+      expect(response.status).toBe(405);
+      expect(response.headers.get('allow')).toBe('GET, HEAD');
+      expect(response.headers.get('content-security-policy')).toBe(CSP);
+    },
+  );
+
+  it.each([
+    'app://renderer/../secret.js',
+    'app://renderer/%2e%2e/secret.js',
+    'app://renderer/a%2fb.js',
+    'app://renderer/file.exe',
+    'app://evil/index.html',
+    'app://renderer/missing.js',
+  ])('answers %s with 404 and no body', async (url) => {
+    const response = await handlerFor(files)(get(url));
+    expect(response.status).toBe(404);
+    expect(await response.text()).toBe('');
+  });
+
+  it('logs only an allow-listed rejection code', async () => {
+    const log = silentLog();
+    await handlerFor(files, log)(get('app://renderer/a%2fb.js'));
+    expect(log.warn).toHaveBeenCalledWith('protocol.rejected', { code: 'FORBIDDEN_CHARS' });
+  });
+
+  it('rejects a file whose realpath leaves the root (symlink escape)', async () => {
+    const escape = { [`${ROOT}/link.js`]: { real: '/etc/secret.js', body: 'secret' } };
+    const log = silentLog();
+    const response = await handlerFor(escape, log)(get('app://renderer/link.js'));
+    expect(response.status).toBe(404);
+    expect(await response.text()).toBe('');
+    expect(log.warn).toHaveBeenCalledWith('protocol.rejected', { code: 'ESCAPE' });
+  });
+
+  it('rejects a sibling directory that shares the root prefix', async () => {
+    const escape = { [`${ROOT}/link.js`]: { real: `${ROOT}-evil/x.js`, body: 'secret' } };
+    expect((await handlerFor(escape)(get('app://renderer/link.js'))).status).toBe(404);
+  });
+
+  it('rejects directories and files above the size bound', async () => {
+    const odd = {
+      [`${ROOT}/dir.js`]: { isFile: false },
+      [`${ROOT}/big.js`]: { size: MAX_ASSET_BYTES + 1 },
+      [`${ROOT}/limit.js`]: { size: MAX_ASSET_BYTES, body: 'ok' },
+    };
+    const handler = handlerFor(odd);
+    expect((await handler(get('app://renderer/dir.js'))).status).toBe(404);
+    expect((await handler(get('app://renderer/big.js'))).status).toBe(404);
+    expect((await handler(get('app://renderer/limit.js'))).status).toBe(200);
+  });
+
+  it('answers 404 for everything when the renderer root cannot be resolved', async () => {
+    const broken: AssetFs = {
+      ...fakeFs(files),
+      realpath: () => Promise.reject(new Error('ENOENT')),
+    };
+    const handler = createAppProtocolHandler({
+      fs: broken,
+      pathApi: path.posix,
+      rendererRoot: ROOT,
+      csp: CSP,
+      log: silentLog(),
+    });
+    expect((await handler(get('app://renderer/index.html'))).status).toBe(404);
+  });
+
+  it('never leaks an internal error through the response', async () => {
+    const throwing: AssetFs = {
+      ...fakeFs(files),
+      readFile: () => Promise.reject(new Error(`${ROOT} secret`)),
+    };
+    const handler = createAppProtocolHandler({
+      fs: throwing,
+      pathApi: path.posix,
+      rendererRoot: ROOT,
+      csp: CSP,
+      log: silentLog(),
+    });
+    const response = await handler(get('app://renderer/index.html'));
+    expect(response.status).toBe(404);
+    expect(await response.text()).not.toContain('secret');
+  });
+});
+
+describe('installAppProtocol', () => {
+  it('registers the handler for the app scheme only and returns a disposer', () => {
+    const protocol = { handle: vi.fn(), unhandle: vi.fn() };
+    const dispose = installAppProtocol(protocol, {
+      fs: fakeFs({}),
+      pathApi: path.posix,
+      rendererRoot: ROOT,
+      csp: CSP,
+      log: silentLog(),
+    });
+    expect(protocol.handle).toHaveBeenCalledTimes(1);
+    expect(protocol.handle.mock.calls[0]?.[0]).toBe('app');
+    dispose();
+    expect(protocol.unhandle).toHaveBeenCalledWith('app');
+  });
+});
+
+describe('app protocol handler on the real filesystem', () => {
+  let temp = '';
+  let rendererRoot = '';
+  let linkCreated = false;
+
+  beforeAll(async () => {
+    temp = await fs.mkdtemp(path.join(os.tmpdir(), 'necroamp-protocol-'));
+    rendererRoot = path.join(temp, 'renderer');
+    await fs.mkdir(rendererRoot);
+    await fs.writeFile(path.join(rendererRoot, 'index.html'), '<p>ok</p>');
+    await fs.writeFile(path.join(temp, 'outside.js'), 'secret');
+    try {
+      await fs.symlink(path.join(temp, 'outside.js'), path.join(rendererRoot, 'link.js'));
+      linkCreated = true;
+    } catch {
+      // Creating symlinks needs a privilege on Windows. The test below reports the skip.
+    }
+  });
+
+  afterAll(async () => {
+    await fs.rm(temp, { recursive: true, force: true });
+  });
+
+  const realHandler = () =>
+    createAppProtocolHandler({ fs, pathApi: path, rendererRoot, csp: CSP, log: silentLog() });
+
+  it('serves a real file', async () => {
+    const response = await realHandler()(get('app://renderer/index.html'));
+    expect(response.status).toBe(200);
+    expect(await response.text()).toBe('<p>ok</p>');
+  });
+
+  it('rejects a real symlink that points outside the root (skipped without symlink privilege)', async (context) => {
+    if (!linkCreated) context.skip();
+    const response = await realHandler()(get('app://renderer/link.js'));
+    expect(response.status).toBe(404);
+    expect(await response.text()).not.toContain('secret');
+  });
+});
diff --git a/src/main/protocol/app-protocol.ts b/src/main/protocol/app-protocol.ts
new file mode 100644
index 0000000..ef8f030
--- /dev/null
+++ b/src/main/protocol/app-protocol.ts
@@ -0,0 +1,122 @@
+import { APP_SCHEME } from '../constants';
+import type { Logger } from '../logging/logger';
+import { mimeTypeFor } from './mime-types';
+import { isPathInsideRoot, resolveAppPath, type PathApi } from './resolve-app-path';
+
+/**
+ * `app://renderer` protocol (design section 4). Electron objects are injected so the handler is
+ * unit testable. Privileges are `standard`, `secure` and `supportFetchAPI` only. `corsEnabled` is
+ * a pre-approved fallback that needs runtime evidence (ADR 0003) and is deliberately not set.
+ */
+export const MAX_ASSET_BYTES = 5 * 1024 * 1024;
+
+export interface SchemeRegistrar {
+  registerSchemesAsPrivileged(
+    schemes: {
+      scheme: string;
+      privileges: { standard: boolean; secure: boolean; supportFetchAPI: boolean };
+    }[],
+  ): void;
+}
+
+export interface ProtocolHandlerApi {
+  handle(scheme: string, handler: (request: Request) => Response | Promise<Response>): void;
+  unhandle(scheme: string): void;
+}
+
+export interface AssetFs {
+  realpath(path: string): Promise<string>;
+  stat(path: string): Promise<{ isFile(): boolean; size: number }>;
+  readFile(path: string): Promise<Uint8Array>;
+}
+
+/** Must run before the app `ready` event. */
+export function registerAppScheme(registrar: SchemeRegistrar): void {
+  registrar.registerSchemesAsPrivileged([
+    {
+      scheme: APP_SCHEME,
+      privileges: { standard: true, secure: true, supportFetchAPI: true },
+    },
+  ]);
+}
+
+export interface AppProtocolDeps {
+  readonly fs: AssetFs;
+  readonly pathApi: PathApi;
+  /** Absolute directory of the built renderer. */
+  readonly rendererRoot: string;
+  /** Value of the Content-Security-Policy header. Always the production policy. */
+  readonly csp: string;
+  readonly log: Logger;
+}
+
+function securityHeaders(csp: string): Record<string, string> {
+  return {
+    'Content-Security-Policy': csp,
+    'X-Content-Type-Options': 'nosniff',
+    'Cache-Control': 'no-store',
+    'Cross-Origin-Resource-Policy': 'same-origin',
+  };
+}
+
+export function createAppProtocolHandler(
+  deps: AppProtocolDeps,
+): (request: Request) => Promise<Response> {
+  const { fs, pathApi, rendererRoot, csp, log } = deps;
+  const base = securityHeaders(csp);
+  // Resolved once. A failure leaves every request answered with 404.
+  let rootReal: Promise<string | null> | undefined;
+  const realRoot = (): Promise<string | null> => {
+    rootReal ??= fs.realpath(rendererRoot).catch(() => null);
+    return rootReal;
+  };
+
+  const notFound = (): Response => new Response(null, { status: 404, headers: base });
+
+  return async (request) => {
+    if (request.method !== 'GET' && request.method !== 'HEAD') {
+      return new Response(null, { status: 405, headers: { ...base, Allow: 'GET, HEAD' } });
+    }
+
+    const resolved = resolveAppPath(request.url, pathApi, rendererRoot);
+    if (!resolved.ok) {
+      log.warn('protocol.rejected', { code: resolved.code });
+      return notFound();
+    }
+
+    try {
+      const root = await realRoot();
+      if (root === null) return notFound();
+      const real = await fs.realpath(pathApi.join(rendererRoot, resolved.relativePath));
+      if (!isPathInsideRoot(pathApi, root, real)) {
+        log.warn('protocol.rejected', { code: 'ESCAPE' });
+        return notFound();
+      }
+      const stats = await fs.stat(real);
+      if (!stats.isFile() || stats.size > MAX_ASSET_BYTES) return notFound();
+
+      const extension = resolved.relativePath.slice(resolved.relativePath.lastIndexOf('.'));
+      const contentType = mimeTypeFor(extension);
+      if (contentType === undefined) return notFound();
+
+      const headers = {
+        ...base,
+        'Content-Type': contentType,
+        'Content-Length': String(stats.size),
+      };
+      if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
+      return new Response(await fs.readFile(real), { status: 200, headers });
+    } catch {
+      return notFound();
+    }
+  };
+}
+
+/** Installs the handler and returns a disposer that removes it. Call after `ready`. */
+export function installAppProtocol(
+  protocol: ProtocolHandlerApi,
+  deps: AppProtocolDeps,
+): () => void {
+  protocol.handle(APP_SCHEME, createAppProtocolHandler(deps));
+  return () => protocol.unhandle(APP_SCHEME);
+}
diff --git a/src/main/protocol/mime-types.ts b/src/main/protocol/mime-types.ts
new file mode 100644
index 0000000..8f77101
--- /dev/null
+++ b/src/main/protocol/mime-types.ts
@@ -0,0 +1,19 @@
+/**
+ * Extension allow-list for the `app://` protocol (design section 4). A file whose extension is
+ * not listed is never served. The Audio and Skin phases extend this table through a design change.
+ */
+const MIME_TYPES: Readonly<Record<string, string>> = Object.freeze({
+  '.html': 'text/html; charset=utf-8',
+  '.js': 'text/javascript; charset=utf-8',
+  '.css': 'text/css; charset=utf-8',
+  '.json': 'application/json; charset=utf-8',
+});
+
+/** `extension` includes the leading dot and is compared in lower case. */
+export function mimeTypeFor(extension: string): string | undefined {
+  const key = extension.toLowerCase();
+  return Object.hasOwn(MIME_TYPES, key) ? MIME_TYPES[key] : undefined;
+}
+
+export const isAllowedExtension = (extension: string): boolean =>
+  mimeTypeFor(extension) !== undefined;
diff --git a/src/main/protocol/resolve-app-path.property.test.ts b/src/main/protocol/resolve-app-path.property.test.ts
new file mode 100644
index 0000000..1656152
--- /dev/null
+++ b/src/main/protocol/resolve-app-path.property.test.ts
@@ -0,0 +1,138 @@
+import path, { type PlatformPath } from 'node:path';
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { resolveAppPath, type PathApi } from './resolve-app-path';
+
+// R3 / R15.4: arbitrary input never throws and never escapes the root, on both path flavors.
+const FLAVORS: readonly {
+  name: string;
+  api: PathApi & Pick<PlatformPath, 'relative'>;
+  root: string;
+}[] = [
+  { name: 'posix', api: path.posix, root: '/srv/necroamp/out/renderer' },
+  { name: 'win32', api: path.win32, root: 'C:\\necroamp\\out\\renderer' },
+];
+
+const TRAVERSAL_TOKENS = [
+  '..',
+  '%2e%2e',
+  '%2E%2E',
+  '.%2e',
+  '%2e.',
+  '..%2f',
+  '%2e%2e%2f',
+  '..%5c',
+  '%2e%2e%5c',
+  '%5c',
+  '%2f',
+  '%00',
+  '..\\',
+  'C:',
+] as const;
+
+const SAFE_SEGMENTS = ['index.html', 'assets', 'main.js', 'style.css', 'a', 'data.json'] as const;
+
+const hostile = fc
+  .array(fc.oneof(fc.constantFrom(...TRAVERSAL_TOKENS), fc.constantFrom(...SAFE_SEGMENTS)), {
+    minLength: 1,
+    maxLength: 6,
+  })
+  .filter((segments) => segments.some((s) => (TRAVERSAL_TOKENS as readonly string[]).includes(s)));
+
+describe.each(FLAVORS)('resolveAppPath properties ($name)', ({ api, root }) => {
+  it('never throws for arbitrary unknown input', () => {
+    fc.assert(
+      fc.property(fc.anything(), (input) => {
+        expect(() => resolveAppPath(input, api, root)).not.toThrow();
+      }),
+    );
+  });
+
+  it('never throws for arbitrary strings, including unicode and control characters', () => {
+    fc.assert(
+      fc.property(fc.oneof(fc.string(), fc.string({ unit: 'binary' })), (input) => {
+        expect(() => resolveAppPath(input, api, root)).not.toThrow();
+        expect(() => resolveAppPath(`app://renderer/${input}`, api, root)).not.toThrow();
+      }),
+    );
+  });
+
+  it('rejects any URL containing a traversal, separator, NUL or drive token', () => {
+    fc.assert(
+      fc.property(hostile, (segments) => {
+        const url = `app://renderer/${segments.join('/')}`;
+        expect(resolveAppPath(url, api, root).ok).toBe(false);
+      }),
+    );
+  });
+
+  it('on success yields a relative path with no dot segment that stays inside the root', () => {
+    const candidate = fc.oneof(
+      fc.array(fc.string({ maxLength: 12 }), { maxLength: 5 }).map((s) => s.join('/')),
+      fc
+        .array(fc.constantFrom(...SAFE_SEGMENTS, ...TRAVERSAL_TOKENS), { maxLength: 5 })
+        .map((s) => s.join('/')),
+    );
+    fc.assert(
+      fc.property(candidate, (tail) => {
+        const result = resolveAppPath(`app://renderer/${tail}`, api, root);
+        if (!result.ok) return;
+        expect(api.isAbsolute(result.relativePath)).toBe(false);
+        const parts = result.relativePath.split(/[\\/]/);
+        expect(parts).not.toContain('..');
+        expect(parts).not.toContain('.');
+        const resolved = api.resolve(root, result.relativePath);
+        expect(api.relative(root, resolved).startsWith('..')).toBe(false);
+        expect(api.isAbsolute(api.relative(root, resolved))).toBe(false);
+      }),
+    );
+  });
+
+  it('rejects every foreign scheme, host, credential and port', () => {
+    const origin = fc.constantFrom(
+      'file:///etc/passwd',
+      'http://renderer/index.html',
+      'https://renderer/index.html',
+      'app://evil/index.html',
+      'app://renderer.evil/index.html',
+      'app://user@renderer/index.html',
+      'app://user:pw@renderer/index.html',
+      'app://renderer:8080/index.html',
+      'APP-X://renderer/index.html',
+      'javascript:alert(1)',
+      'data:text/html,hi',
+    );
+    fc.assert(
+      fc.property(origin, (url) => {
+        expect(resolveAppPath(url, api, root).ok).toBe(false);
+      }),
+    );
+  });
+
+  it('rejects any extension outside the allow-list', () => {
+    const ext = fc.constantFrom(
+      '.exe',
+      '.dll',
+      '.node',
+      '.svg',
+      '.png',
+      '.wasm',
+      '.map',
+      '.sh',
+      '.bat',
+      '',
+    );
+    fc.assert(
+      fc.property(ext, fc.constantFrom('a', 'bundle', 'x'), (extension, base) => {
+        expect(resolveAppPath(`app://renderer/${base}${extension}`, api, root).ok).toBe(false);
+      }),
+    );
+  });
+});
+
+describe('resolveAppPath regressions', () => {
+  it.each(FLAVORS)('serves the entry file for the bare origin ($name)', ({ api, root }) => {
+    const result = resolveAppPath('app://renderer/', api, root);
+    expect(result).toEqual({ ok: true, relativePath: 'index.html' });
+  });
+});
diff --git a/src/main/protocol/resolve-app-path.test.ts b/src/main/protocol/resolve-app-path.test.ts
new file mode 100644
index 0000000..2619622
--- /dev/null
+++ b/src/main/protocol/resolve-app-path.test.ts
@@ -0,0 +1,172 @@
+import path from 'node:path';
+import { describe, expect, it } from 'vitest';
+import { isAllowedExtension, mimeTypeFor } from './mime-types';
+import { isPathInsideRoot, resolveAppPath, type AppPathRejection } from './resolve-app-path';
+
+const MODULES = [
+  { name: 'posix', api: path.posix, root: '/opt/necroamp/out/renderer' },
+  { name: 'win32', api: path.win32, root: 'C:\\Program Files\\NecroAmp\\out\\renderer' },
+] as const;
+
+describe.each(MODULES)('resolveAppPath ($name)', ({ api, root }) => {
+  const resolve = (input: unknown) => resolveAppPath(input, api, root);
+  const rejected = (input: unknown): AppPathRejection | 'OK' => {
+    const result = resolve(input);
+    return result.ok ? 'OK' : result.code;
+  };
+
+  it.each([
+    'con.js',
+    'CON.css',
+    'nul.css',
+    'Aux.json',
+    'prn.js',
+    'com1.js',
+    'LPT9.png',
+    'assets/nul.js',
+    'con.tar.js',
+    'com\u00b9.js',
+  ])('rejects the Windows reserved device name %s', (name) => {
+    expect(rejected(`app://renderer/${name}`)).toBe('FORBIDDEN_CHARS');
+  });
+
+  it('still accepts names that merely contain a reserved word', () => {
+    for (const name of ['console.js', 'com10.js', 'nullable.css', 'auxiliary.js']) {
+      expect(rejected(`app://renderer/${name}`)).toBe('OK');
+    }
+  });
+
+  it('maps the root to index.html', () => {
+    for (const url of ['app://renderer', 'app://renderer/', 'app://renderer/index.html']) {
+      expect(resolve(url)).toEqual({ ok: true, relativePath: 'index.html' });
+    }
+  });
+
+  it('accepts nested allow-listed assets and ignores query and hash', () => {
+    expect(resolve('app://renderer/assets/index-a1B2.js')).toEqual({
+      ok: true,
+      relativePath: api.join('assets', 'index-a1B2.js'),
+    });
+    expect(resolve('app://renderer/assets/main.css?v=1#x')).toMatchObject({ ok: true });
+    expect(resolve('app://renderer/data.json')).toMatchObject({ ok: true });
+  });
+
+  it('keeps every accepted result inside the root', () => {
+    const result = resolve('app://renderer/a/b/c.js');
+    if (!result.ok) throw new Error('expected ok');
+    expect(isPathInsideRoot(api, root, api.resolve(root, result.relativePath))).toBe(true);
+  });
+
+  it.each([
+    ['app://renderer/../secret.txt', 'TRAVERSAL'],
+    ['app://renderer/assets/../../x.js', 'TRAVERSAL'],
+    ['app://renderer/./index.html', 'TRAVERSAL'],
+    ['app://renderer/%2e%2e/x.js', 'TRAVERSAL'],
+    ['app://renderer/%2E%2E/x.js', 'TRAVERSAL'],
+    ['app://renderer/.%2e/x.js', 'TRAVERSAL'],
+    ['app://renderer/a/%2e/x.js', 'TRAVERSAL'],
+    ['app://renderer//index.html', 'TRAVERSAL'],
+    ['app://renderer/a//b.js', 'TRAVERSAL'],
+    ['app://renderer/a%2fb.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a%2Fb.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a%5cb.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a%00.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a\\b.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer\\..\\x.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a\0.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a\t.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a b.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/C:/Windows/win.ini', 'FORBIDDEN_CHARS'],
+    ['app://renderer/C%3A/x.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/index.html:stream.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a%3Cb.js', 'FORBIDDEN_CHARS'],
+    ['app://renderer/.env.json', 'FORBIDDEN_CHARS'],
+    ['app://renderer/.git/config.json', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a.js.', 'FORBIDDEN_CHARS'],
+    ['app://renderer/a.js%20', 'FORBIDDEN_CHARS'],
+    ['app://renderer/%zz.js', 'BAD_URL'],
+    ['app://renderer/%E0%A4%A.js', 'BAD_URL'],
+    ['app://renderer/file.exe', 'BAD_EXTENSION'],
+    ['app://renderer/file.map', 'BAD_EXTENSION'],
+    ['app://renderer/noextension', 'BAD_EXTENSION'],
+    ['app://renderer/dir/', 'BAD_EXTENSION'],
+    ['app://renderer/index.html.exe', 'BAD_EXTENSION'],
+    ['app://renderer/js', 'BAD_EXTENSION'],
+  ] as const)('%s -> %s', (url, expected) => {
+    expect(rejected(url)).toBe(expected);
+  });
+
+  it('does not decode twice, so a double-encoded dot stays literal text', () => {
+    const result = resolve('app://renderer/%252e%252e/x.js');
+    if (!result.ok) throw new Error('expected ok');
+    expect(result.relativePath).toBe(api.join('%2e%2e', 'x.js'));
+    expect(isPathInsideRoot(api, root, api.resolve(root, result.relativePath))).toBe(true);
+  });
+
+  it.each([
+    'file:///etc/passwd',
+    'https://renderer/index.html',
+    'http://renderer/index.html',
+    'app:index.html',
+    'about:blank',
+    'javascript:alert(1)',
+    'data:text/html,x',
+    'not a url',
+    '',
+  ])('rejects scheme or shape %s', (url) => {
+    expect(resolve(url).ok).toBe(false);
+  });
+
+  it.each([
+    'app://evil/index.html',
+    'app://renderer.evil.com/index.html',
+    'app://RENDERER/index.html',
+    'app://renderer:8080/index.html',
+    'app://user@renderer/index.html',
+    'app://user:pw@renderer/index.html',
+  ])('rejects host %s', (url) => {
+    expect(rejected(url)).toBe('BAD_HOST');
+  });
+
+  it('rejects over-long input and over-long segments', () => {
+    expect(rejected(`app://renderer/${'a'.repeat(2100)}.js`)).toBe('TOO_LONG');
+    expect(rejected(`app://renderer/${'a'.repeat(300)}.js`)).toBe('TOO_LONG');
+  });
+
+  it.each([undefined, null, 0, {}, [], Symbol.iterator])(
+    'rejects non-string %s without throwing',
+    (value) => {
+      expect(rejected(value)).toBe('BAD_URL');
+    },
+  );
+});
+
+describe('isPathInsideRoot', () => {
+  it('is case-insensitive on win32 only', () => {
+    expect(isPathInsideRoot(path.win32, 'C:\\App\\Root', 'c:\\app\\root\\a.js')).toBe(true);
+    expect(isPathInsideRoot(path.posix, '/App/Root', '/app/root/a.js')).toBe(false);
+  });
+
+  it('rejects the root itself, siblings that share a prefix and parents', () => {
+    expect(isPathInsideRoot(path.posix, '/a/root', '/a/root')).toBe(false);
+    expect(isPathInsideRoot(path.posix, '/a/root', '/a/root-evil/x.js')).toBe(false);
+    expect(isPathInsideRoot(path.posix, '/a/root', '/a/x.js')).toBe(false);
+    expect(isPathInsideRoot(path.win32, 'C:\\a\\root', 'C:\\a\\root-evil\\x.js')).toBe(false);
+    expect(isPathInsideRoot(path.win32, 'C:\\a\\root', 'D:\\a\\root\\x.js')).toBe(false);
+  });
+});
+
+describe('mime types', () => {
+  it('allows only the four renderer extensions', () => {
+    for (const ext of ['.html', '.js', '.css', '.json', '.JS'])
+      expect(isAllowedExtension(ext)).toBe(true);
+    for (const ext of ['', '.exe', '.svg', '.map', '.constructor', '__proto__', 'toString']) {
+      expect(isAllowedExtension(ext)).toBe(false);
+    }
+  });
+
+  it('returns a content type with a charset for text types', () => {
+    expect(mimeTypeFor('.js')).toBe('text/javascript; charset=utf-8');
+    expect(mimeTypeFor('.html')).toBe('text/html; charset=utf-8');
+  });
+});
diff --git a/src/main/protocol/resolve-app-path.ts b/src/main/protocol/resolve-app-path.ts
new file mode 100644
index 0000000..1aba39b
--- /dev/null
+++ b/src/main/protocol/resolve-app-path.ts
@@ -0,0 +1,121 @@
+import type { PlatformPath } from 'node:path';
+import { APP_HOST, APP_SCHEME } from '../constants';
+import { isAllowedExtension } from './mime-types';
+
+/**
+ * Pure lexical URL to path resolution for `app://renderer` (design section 4, R15.4). The
+ * filesystem step (realpath confinement) lives in `app-protocol.ts`.
+ */
+export type AppPathRejection =
+  'BAD_URL' | 'BAD_HOST' | 'FORBIDDEN_CHARS' | 'TRAVERSAL' | 'BAD_EXTENSION' | 'TOO_LONG';
+
+export type AppPathResult =
+  | { readonly ok: true; readonly relativePath: string }
+  | { readonly ok: false; readonly code: AppPathRejection };
+
+export type PathApi = Pick<PlatformPath, 'join' | 'resolve' | 'sep' | 'isAbsolute'>;
+
+const MAX_URL_LENGTH = 2048;
+const MAX_SEGMENT_LENGTH = 255;
+const ENTRY_FILE = 'index.html';
+
+// Raw (still encoded) input checks. `%2e` is any encoded dot, so encoded dot segments never pass.
+const RAW_TRAVERSAL = /%2e/i;
+const RAW_DOT_SEGMENT = /(?:^|\/)\.\.?(?:[/?#]|$)/;
+const RAW_SEPARATOR_OR_NUL = /%2f|%5c|%00/i;
+// eslint-disable-next-line no-control-regex -- the point of the check is to reject control characters.
+const RAW_FORBIDDEN = /[\u0000-\u0020\u007f\\]/;
+// Decoded checks. Control characters, separators, a drive or stream colon and characters that
+// are reserved in Windows file names.
+// eslint-disable-next-line no-control-regex -- the point of the check is to reject control characters.
+const DECODED_FORBIDDEN = /[\u0000-\u001f\u007f\\/:*?"<>|]/;
+
+// Windows device names, reserved with or without an extension. Rejected on every platform so
+// behavior does not depend on the host (security review F-2).
+const RESERVED_DEVICE_NAME =
+  /^(?:con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3]|conin\$|conout\$)$/i;
+
+const reject = (code: AppPathRejection): AppPathResult => ({ ok: false, code });
+
+function decodeOnce(pathname: string): string | null {
+  try {
+    return decodeURIComponent(pathname);
+  } catch {
+    return null;
+  }
+}
+
+function extensionOf(segment: string): string {
+  const dot = segment.lastIndexOf('.');
+  return dot <= 0 ? '' : segment.slice(dot);
+}
+
+function isInside(pathApi: PathApi, root: string, candidate: string): boolean {
+  const caseInsensitive = pathApi.sep === '\\';
+  const normalize = (value: string): string => (caseInsensitive ? value.toLowerCase() : value);
+  const base = normalize(pathApi.resolve(root));
+  const target = normalize(candidate);
+  const prefix = base.endsWith(pathApi.sep) ? base : base + pathApi.sep;
+  return target.startsWith(prefix);
+}
+
+/** True when `candidate` is strictly inside `root`. Shared with the realpath step. */
+export const isPathInsideRoot = isInside;
+
+/**
+ * Never throws. On success `relativePath` is relative, built with `pathApi.join`, and resolving
+ * it against `root` stays inside `root`.
+ */
+export function resolveAppPath(input: unknown, pathApi: PathApi, root: string): AppPathResult {
+  if (typeof input !== 'string') return reject('BAD_URL');
+  if (input.length > MAX_URL_LENGTH) return reject('TOO_LONG');
+
+  // Whitespace, control characters and backslashes are never part of a valid asset URL, and the URL
+  // parser would silently strip some of them before the raw checks below can see them.
+  if (RAW_FORBIDDEN.test(input)) return reject('FORBIDDEN_CHARS');
+
+  let url: URL;
+  try {
+    url = new URL(input);
+  } catch {
+    return reject('BAD_URL');
+  }
+  if (url.protocol !== `${APP_SCHEME}:`) return reject('BAD_URL');
+  if (url.hostname !== APP_HOST) return reject('BAD_HOST');
+  if (url.username !== '' || url.password !== '' || url.port !== '') return reject('BAD_HOST');
+
+  // Raw input, before any decoding. The URL parser may collapse dot segments, so check first.
+  const rawPath = input.replace(/^[^:/?#]*:\/\/[^/?#]*/, '');
+  if (RAW_TRAVERSAL.test(rawPath) || RAW_DOT_SEGMENT.test(rawPath)) return reject('TRAVERSAL');
+  if (RAW_SEPARATOR_OR_NUL.test(rawPath)) return reject('FORBIDDEN_CHARS');
+
+  const decoded = decodeOnce(url.pathname);
+  if (decoded === null) return reject('BAD_URL');
+
+  const trimmed = decoded === '' || decoded === '/' ? `/${ENTRY_FILE}` : decoded;
+  // Defensive: a hierarchical URL pathname always starts with '/'. Unreachable through URL.
+  /* v8 ignore next -- @preserve */
+  if (!trimmed.startsWith('/')) return reject('BAD_URL');
+  const segments = trimmed.slice(1).split('/');
+  if (segments.at(-1) === '') segments.pop(); // one trailing slash
+
+  for (const segment of segments) {
+    if (segment === '' || segment === '.' || segment === '..') return reject('TRAVERSAL');
+    if (segment.length > MAX_SEGMENT_LENGTH) return reject('TOO_LONG');
+    if (DECODED_FORBIDDEN.test(segment)) return reject('FORBIDDEN_CHARS');
+    // Dotfiles. Windows also strips trailing dots and spaces, which would alias another name.
+    if (segment.startsWith('.') || segment.endsWith('.') || segment.endsWith(' ')) {
+      return reject('FORBIDDEN_CHARS');
+    }
+    const stem = segment.split('.', 1)[0]!.trimEnd();
+    if (RESERVED_DEVICE_NAME.test(stem)) return reject('FORBIDDEN_CHARS');
+  }
+
+  const last = segments[segments.length - 1]!;
+  if (!isAllowedExtension(extensionOf(last))) return reject('BAD_EXTENSION');
+
+  const relativePath = pathApi.join(...segments);
+  if (pathApi.isAbsolute(relativePath)) return reject('TRAVERSAL');
+  if (!isInside(pathApi, root, pathApi.resolve(root, relativePath))) return reject('TRAVERSAL');
+  return { ok: true, relativePath };
+}
diff --git a/src/main/security/csp.property.test.ts b/src/main/security/csp.property.test.ts
new file mode 100644
index 0000000..a91d88e
--- /dev/null
+++ b/src/main/security/csp.property.test.ts
@@ -0,0 +1,298 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { APP_ORIGIN } from '../constants';
+import { buildCsp, buildMetaCsp, type CspOptions } from './csp';
+import { installDevCspHook, type ResponseHeaders } from './dev-csp';
+import { isTrustedSender } from './sender-validation';
+import { isTrustedUrl, originOf, parseDevOrigin, resolveTrustedOrigins } from './trusted-origins';
+
+// Human gate 3 / R5 / ADR 0003 item 6: production CSP never inherits a development allowance.
+const PRODUCTION_BASELINE = buildCsp({ mode: 'production' });
+const FORBIDDEN_IN_PRODUCTION = [
+  'unsafe-inline',
+  'unsafe-eval',
+  'localhost',
+  '127.0.0.1',
+  'ws:',
+  'wss:',
+  'http:',
+  'https:',
+  'data:',
+  'blob:',
+  'filesystem:',
+  '*',
+];
+
+const devOrigin = fc
+  .tuple(fc.constantFrom('localhost', '127.0.0.1'), fc.integer({ min: 1, max: 65535 }))
+  .map(([host, port]) => `http://${host}:${port}`);
+
+const anyOrigin = fc.oneof(
+  devOrigin,
+  fc.string(),
+  fc.webUrl(),
+  fc.constant('https://evil.example:443'),
+);
+
+const mangledOptions = fc
+  .record({
+    mode: fc.oneof(
+      fc.constant('production'),
+      fc.string(),
+      fc.constant('Development'),
+      fc.constant('dev'),
+    ),
+    devOrigin: anyOrigin,
+    isDev: fc.boolean(),
+    unsafeInline: fc.boolean(),
+    NODE_ENV: fc.string(),
+  })
+  .filter((o) => o.mode !== 'development');
+
+describe('production CSP isolation (properties)', () => {
+  it('equals the constant baseline for every option object that is not mode development', () => {
+    fc.assert(
+      fc.property(mangledOptions, (options) => {
+        expect(buildCsp(options as unknown as CspOptions)).toBe(PRODUCTION_BASELINE);
+      }),
+    );
+  });
+
+  it('never contains a development or remote allowance', () => {
+    for (const token of FORBIDDEN_IN_PRODUCTION) {
+      expect(PRODUCTION_BASELINE).not.toContain(token);
+      expect(buildMetaCsp({ mode: 'production' })).not.toContain(token);
+    }
+    fc.assert(
+      fc.property(mangledOptions, (options) => {
+        const csp = buildCsp(options as unknown as CspOptions);
+        const meta = buildMetaCsp(options as unknown as CspOptions);
+        for (const token of FORBIDDEN_IN_PRODUCTION) {
+          expect(csp).not.toContain(token);
+          expect(meta).not.toContain(token);
+        }
+      }),
+    );
+  });
+
+  it('has script-src and style-src of exactly self, and connect-src none', () => {
+    const directives = new Map(
+      PRODUCTION_BASELINE.split('; ').map((d) => [
+        d.split(' ')[0] ?? '',
+        d.split(' ').slice(1).join(' '),
+      ]),
+    );
+    expect(directives.get('script-src')).toBe("'self'");
+    expect(directives.get('style-src')).toBe("'self'");
+    expect(directives.get('connect-src')).toBe("'none'");
+    expect(directives.get('default-src')).toBe("'none'");
+  });
+
+  it('the meta copy differs from the header policy only by the directives meta ignores', () => {
+    const header = PRODUCTION_BASELINE.split('; ');
+    const meta = buildMetaCsp({ mode: 'production' }).split('; ');
+    expect(header.filter((d) => !meta.includes(d)).map((d) => d.split(' ')[0])).toEqual([
+      'frame-ancestors',
+    ]);
+  });
+});
+
+describe('development CSP (properties)', () => {
+  it('never contains unsafe-eval or a remote source for any valid dev origin', () => {
+    fc.assert(
+      fc.property(devOrigin, (origin) => {
+        const csp = buildCsp({ mode: 'development', devOrigin: origin });
+        expect(csp).not.toContain('unsafe-eval');
+        expect(csp).not.toMatch(/https?:\/\/(?!(localhost|127\.0\.0\.1):\d+)/);
+        expect(csp).not.toMatch(/\bwss?:\/\/(?!(localhost|127\.0\.0\.1):\d+)/);
+        expect(csp).not.toContain('*');
+        const script = csp.split('; ').find((d) => d.startsWith('script-src '));
+        expect(script).toBe("script-src 'self' 'unsafe-inline'");
+      }),
+    );
+  });
+
+  it('either throws a plain error or stays free of unsafe-eval for arbitrary dev origins', () => {
+    fc.assert(
+      fc.property(fc.oneof(fc.string(), fc.webUrl()), (origin) => {
+        try {
+          const csp = buildCsp({ mode: 'development', devOrigin: origin });
+          expect(csp).not.toContain('unsafe-eval');
+          expect(csp).not.toContain('*');
+          expect(parseDevOrigin(origin)).not.toBeNull();
+        } catch (error) {
+          expect(error).toBeInstanceOf(Error);
+          expect(parseDevOrigin(origin)).toBeNull();
+        }
+      }),
+    );
+  });
+
+  it('the dev header hook leaves other origins untouched and sets exactly one CSP on the dev origin', () => {
+    fc.assert(
+      fc.property(
+        devOrigin,
+        fc.webUrl(),
+        fc.dictionary(fc.string(), fc.string()),
+        (origin, other, extra) => {
+          let listener:
+            | ((
+                d: { url: string; responseHeaders?: ResponseHeaders },
+                cb: (r: { responseHeaders?: ResponseHeaders }) => void,
+              ) => void)
+            | undefined;
+          expect(installDevCspHook({ onHeadersReceived: (l) => (listener = l) }, origin)).toBe(
+            true,
+          );
+          let out: ResponseHeaders | undefined;
+          listener?.(
+            {
+              url: `${origin}/x`,
+              responseHeaders: { ...extra, 'content-security-policy': ['bad'] },
+            },
+            (r) => {
+              out = r.responseHeaders;
+            },
+          );
+          const cspKeys = Object.keys(out ?? {}).filter(
+            (k) => k.toLowerCase() === 'content-security-policy',
+          );
+          expect(cspKeys).toEqual(['Content-Security-Policy']);
+          if (originOf(other) !== origin) {
+            let untouched: ResponseHeaders | undefined = { sentinel: 'x' };
+            listener?.({ url: other }, (r) => {
+              untouched = r.responseHeaders;
+            });
+            expect(untouched).toBeUndefined();
+          }
+        },
+      ),
+    );
+  });
+
+  it('refuses to install the dev hook for a non-loopback origin', () => {
+    fc.assert(
+      fc.property(
+        fc.webUrl().filter((u) => parseDevOrigin(u) === null),
+        (origin) => {
+          let called = false;
+          expect(installDevCspHook({ onHeadersReceived: () => (called = true) }, origin)).toBe(
+            false,
+          );
+          expect(called).toBe(false);
+        },
+      ),
+    );
+  });
+});
+
+describe('trusted origins and sender validation (properties)', () => {
+  const production = resolveTrustedOrigins({ mode: 'production' });
+
+  it('never throws for arbitrary unknown values', () => {
+    fc.assert(
+      fc.property(fc.anything(), (value) => {
+        expect(() => originOf(value)).not.toThrow();
+        expect(() => isTrustedUrl(value, production)).not.toThrow();
+        expect(() => parseDevOrigin(value)).not.toThrow();
+      }),
+    );
+  });
+
+  it('production trusts only the app origin, whatever dev option is supplied', () => {
+    fc.assert(
+      fc.property(anyOrigin, (origin) => {
+        expect(resolveTrustedOrigins({ mode: 'production' })).toEqual([APP_ORIGIN]);
+        const dev = resolveTrustedOrigins({ mode: 'development', devOrigin: origin });
+        expect(dev[0]).toBe(APP_ORIGIN);
+        expect(dev.length).toBeLessThanOrEqual(2);
+        for (const o of dev.slice(1)) expect(parseDevOrigin(o)).not.toBeNull();
+      }),
+    );
+  });
+
+  it('a trusted URL always parses to the app scheme and host without credentials', () => {
+    fc.assert(
+      fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.constant('app://renderer/x')), (value) => {
+        if (!isTrustedUrl(value, production)) return;
+        const url = new URL(value);
+        expect(url.protocol).toBe('app:');
+        expect(url.hostname).toBe('renderer');
+        expect(url.username + url.password).toBe('');
+      }),
+    );
+  });
+
+  it('rejects look-alike hosts and userinfo tricks', () => {
+    const hosts = fc.constantFrom(
+      'app://renderer.evil.com/',
+      'app://evil.com/renderer',
+      'app://renderer@evil.com/',
+      'app://evil.com@renderer/',
+      'app://renderer:1/',
+      'app://RENDERER/',
+      'http://renderer/',
+      'file://renderer/',
+    );
+    fc.assert(
+      fc.property(hosts, (url) => {
+        expect(isTrustedUrl(url, production)).toBe(false);
+      }),
+    );
+  });
+
+  const frame = fc.record({
+    url: fc.oneof(fc.string(), fc.constant('app://renderer/index.html')),
+    parent: fc.anything(),
+  });
+
+  it('never throws on arbitrary events and returns a boolean', () => {
+    fc.assert(
+      fc.property(fc.anything(), (event) => {
+        const result = isTrustedSender(event as never, production, () => true);
+        expect(typeof result).toBe('boolean');
+      }),
+    );
+  });
+
+  it('rejects every sub-frame, whatever the URL', () => {
+    fc.assert(
+      fc.property(
+        frame.filter((f) => f.parent !== null),
+        (f) => {
+          expect(isTrustedSender({ senderFrame: f, sender: {} }, production, () => true)).toBe(
+            false,
+          );
+        },
+      ),
+    );
+  });
+
+  it('rejects an unregistered sender even for a perfect frame', () => {
+    fc.assert(
+      fc.property(fc.anything(), (sender) => {
+        const event = { senderFrame: { url: 'app://renderer/index.html', parent: null }, sender };
+        expect(isTrustedSender(event, production, () => false)).toBe(false);
+      }),
+    );
+  });
+
+  it('fails closed when reading the frame throws', () => {
+    const event = {
+      get senderFrame(): never {
+        throw new Error('destroyed');
+      },
+    };
+    expect(isTrustedSender(event, production, () => true)).toBe(false);
+  });
+
+  it('rejects any top frame whose URL is not trusted', () => {
+    fc.assert(
+      fc.property(fc.oneof(fc.string(), fc.webUrl()), (url) => {
+        fc.pre(!isTrustedUrl(url, production));
+        const event = { senderFrame: { url, parent: null }, sender: {} };
+        expect(isTrustedSender(event, production, () => true)).toBe(false);
+      }),
+    );
+  });
+});
diff --git a/src/main/security/csp.test.ts b/src/main/security/csp.test.ts
new file mode 100644
index 0000000..04c5019
--- /dev/null
+++ b/src/main/security/csp.test.ts
@@ -0,0 +1,108 @@
+import { describe, expect, it } from 'vitest';
+import { buildCsp, buildMetaCsp } from './csp';
+
+const DEV = 'http://localhost:5173';
+
+const EXPECTED_PRODUCTION =
+  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; " +
+  "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; " +
+  "frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; " +
+  "manifest-src 'none'";
+
+function directive(policy: string, name: string): string[] {
+  const entry = policy.split('; ').find((part) => part.startsWith(`${name} `));
+  return entry === undefined ? [] : entry.slice(name.length + 1).split(' ');
+}
+
+describe('production CSP', () => {
+  const policy = buildCsp({ mode: 'production' });
+
+  it('equals the approved policy exactly', () => {
+    expect(policy).toBe(EXPECTED_PRODUCTION);
+  });
+
+  it.each([
+    "'unsafe-eval'",
+    "'unsafe-inline'",
+    'data:',
+    'blob:',
+    '*',
+    'http:',
+    'https:',
+    'ws:',
+    'wss:',
+    'localhost',
+    '127.0.0.1',
+  ])('never contains %s', (token) => {
+    expect(policy.split(/[\s;]+/)).not.toContain(token);
+    expect(policy).not.toContain('localhost');
+  });
+
+  it('denies all connections', () => {
+    expect(directive(policy, 'connect-src')).toEqual(["'none'"]);
+  });
+
+  it('is identical when the options object carries a dev origin', () => {
+    const sneaky = { mode: 'production', devOrigin: DEV } as { mode: 'production' };
+    expect(buildCsp(sneaky)).toBe(EXPECTED_PRODUCTION);
+    expect(buildMetaCsp(sneaky)).toBe(buildMetaCsp({ mode: 'production' }));
+  });
+
+  it('is not affected by an earlier development build', () => {
+    buildCsp({ mode: 'development', devOrigin: DEV });
+    expect(buildCsp({ mode: 'production' })).toBe(EXPECTED_PRODUCTION);
+  });
+});
+
+describe('development CSP', () => {
+  const policy = buildCsp({ mode: 'development', devOrigin: DEV });
+
+  it('limits connect-src to the dev origin and its websocket', () => {
+    expect(directive(policy, 'connect-src')).toEqual([DEV, 'ws://localhost:5173']);
+  });
+
+  it('allows unsafe-inline only for scripts and styles', () => {
+    expect(directive(policy, 'script-src')).toEqual(["'self'", "'unsafe-inline'"]);
+    expect(directive(policy, 'style-src')).toEqual(["'self'", "'unsafe-inline'"]);
+    const others = policy
+      .split('; ')
+      .filter((part) => !/^(script|style)-src /.test(part))
+      .join('; ');
+    expect(others).not.toContain('unsafe-inline');
+  });
+
+  it('never contains unsafe-eval, remote script sources or wildcards', () => {
+    expect(policy).not.toContain('unsafe-eval');
+    expect(directive(policy, 'script-src').some((s) => /^(https?:|\*|data:|blob:)/.test(s))).toBe(
+      false,
+    );
+    expect(policy.split(/[\s;]+/)).not.toContain('*');
+  });
+
+  it('keeps every other directive equal to production', () => {
+    const rest = (p: string): string[] =>
+      p.split('; ').filter((part) => !/^(script|style|connect)-src /.test(part));
+    expect(rest(policy)).toEqual(rest(EXPECTED_PRODUCTION));
+  });
+
+  it.each(['https://localhost:5173', 'http://evil.test:5173', 'http://localhost', '*', ''])(
+    'throws for an invalid dev origin %s',
+    (devOrigin) => {
+      expect(() => buildCsp({ mode: 'development', devOrigin })).toThrow();
+    },
+  );
+});
+
+describe('meta CSP', () => {
+  it('omits only directives a meta element ignores', () => {
+    const header = buildCsp({ mode: 'production' }).split('; ');
+    const meta = buildMetaCsp({ mode: 'production' }).split('; ');
+    expect(header.filter((part) => !meta.includes(part))).toEqual(["frame-ancestors 'none'"]);
+    expect(meta.every((part) => header.includes(part))).toBe(true);
+  });
+
+  it('contains no development allowance in production', () => {
+    const meta = buildMetaCsp({ mode: 'production' });
+    expect(meta).not.toMatch(/unsafe-|localhost|ws:|data:|\*/);
+  });
+});
diff --git a/src/main/security/csp.ts b/src/main/security/csp.ts
new file mode 100644
index 0000000..29d7dc2
--- /dev/null
+++ b/src/main/security/csp.ts
@@ -0,0 +1,72 @@
+import { parseDevOrigin } from './trusted-origins';
+
+/**
+ * Content Security Policy builders (design section 3.4, ADR 0003 item 6).
+ *
+ * The production policy is a frozen constant that no option can modify. The development policy is
+ * produced by a separate code path, so production output cannot inherit a development allowance.
+ */
+export type CspOptions =
+  { readonly mode: 'production' } | { readonly mode: 'development'; readonly devOrigin: string };
+
+type Directive = readonly [name: string, sources: readonly string[]];
+
+const PRODUCTION_DIRECTIVES: readonly Directive[] = Object.freeze([
+  ['default-src', ["'none'"]],
+  ['script-src', ["'self'"]],
+  ['style-src', ["'self'"]],
+  ['img-src', ["'self'"]],
+  ['font-src', ["'self'"]],
+  ['connect-src', ["'none'"]],
+  ['object-src', ["'none'"]],
+  ['base-uri', ["'none'"]],
+  ['form-action', ["'none'"]],
+  ['frame-ancestors', ["'none'"]],
+  ['frame-src', ["'none'"]],
+  ['worker-src', ["'none'"]],
+  ['media-src', ["'none'"]],
+  ['manifest-src', ["'none'"]],
+] as const);
+
+/** Directives a `<meta http-equiv>` policy ignores (CSP3). Omitted from the meta copy. */
+const META_IGNORED: ReadonlySet<string> = new Set(['frame-ancestors', 'report-uri', 'sandbox']);
+
+function serialize(directives: readonly Directive[], omit: ReadonlySet<string>): string {
+  return directives
+    .filter(([name]) => !omit.has(name))
+    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
+    .join('; ');
+}
+
+/**
+ * Development-only directives. `unsafe-inline` for scripts and styles exists only for the Vite
+ * React Fast Refresh preamble and CSS hot update (ADR 0003 item 6). Remove any allowance that
+ * runtime validation shows is not needed. `unsafe-eval` and remote script sources never appear.
+ */
+function developmentDirectives(devOrigin: string): readonly Directive[] {
+  const dev = parseDevOrigin(devOrigin);
+  if (dev === null) {
+    throw new Error('buildCsp: the development origin must be a loopback http origin with a port.');
+  }
+  return PRODUCTION_DIRECTIVES.map(([name, sources]): Directive => {
+    if (name === 'script-src') return [name, ["'self'", "'unsafe-inline'"]];
+    if (name === 'style-src') return [name, ["'self'", "'unsafe-inline'"]];
+    if (name === 'connect-src') return [name, [dev.origin, `ws://${dev.host}`]];
+    return [name, sources];
+  });
+}
+
+function directivesFor(options: CspOptions): readonly Directive[] {
+  return options.mode === 'development'
+    ? developmentDirectives(options.devOrigin)
+    : PRODUCTION_DIRECTIVES;
+}
+
+export function buildCsp(options: CspOptions): string {
+  return serialize(directivesFor(options), new Set());
+}
+
+/** Same policy without the directives a `<meta>` element ignores. */
+export function buildMetaCsp(options: CspOptions): string {
+  return serialize(directivesFor(options), META_IGNORED);
+}
diff --git a/src/main/security/dev-csp.test.ts b/src/main/security/dev-csp.test.ts
new file mode 100644
index 0000000..68a7316
--- /dev/null
+++ b/src/main/security/dev-csp.test.ts
@@ -0,0 +1,72 @@
+import { describe, expect, it, vi } from 'vitest';
+import { buildCsp } from './csp';
+import {
+  installDevCspHook,
+  withCspHeader,
+  type HeadersDetails,
+  type ResponseHeaders,
+} from './dev-csp';
+
+const DEV = 'http://localhost:5173';
+
+type Listener = (
+  details: HeadersDetails,
+  callback: (response: { responseHeaders?: ResponseHeaders }) => void,
+) => void;
+
+function capture(): {
+  webRequest: { onHeadersReceived(l: Listener): void };
+  listener: () => Listener;
+} {
+  let stored: Listener | undefined;
+  return {
+    webRequest: {
+      onHeadersReceived(l) {
+        stored = l;
+      },
+    },
+    listener: () => {
+      if (stored === undefined) throw new Error('no listener');
+      return stored;
+    },
+  };
+}
+
+describe('withCspHeader', () => {
+  it('replaces CSP headers of any case and keeps other headers', () => {
+    const result = withCspHeader(
+      { 'content-security-policy': ['x'], 'Content-Security-Policy': ['y'], 'X-A': ['1'] },
+      'policy',
+    );
+    expect(result).toEqual({ 'X-A': ['1'], 'Content-Security-Policy': ['policy'] });
+  });
+});
+
+describe('installDevCspHook', () => {
+  it('adds the dev policy to responses from the dev origin only', () => {
+    const { webRequest, listener } = capture();
+    expect(installDevCspHook(webRequest, DEV)).toBe(true);
+    const callback = vi.fn();
+    listener()({ url: `${DEV}/src/main.tsx`, responseHeaders: { A: ['1'] } }, callback);
+    expect(callback).toHaveBeenCalledWith({
+      responseHeaders: {
+        A: ['1'],
+        'Content-Security-Policy': [buildCsp({ mode: 'development', devOrigin: DEV })],
+      },
+    });
+  });
+
+  it('leaves other origins untouched', () => {
+    const { webRequest, listener } = capture();
+    installDevCspHook(webRequest, DEV);
+    const callback = vi.fn();
+    listener()({ url: 'https://evil.test/x', responseHeaders: { A: ['1'] } }, callback);
+    expect(callback).toHaveBeenCalledWith({ responseHeaders: { A: ['1'] } });
+  });
+
+  it('installs nothing for an invalid dev origin', () => {
+    const onHeadersReceived = vi.fn();
+    expect(installDevCspHook({ onHeadersReceived }, 'https://evil.test')).toBe(false);
+    expect(onHeadersReceived).not.toHaveBeenCalled();
+  });
+});
diff --git a/src/main/security/dev-csp.ts b/src/main/security/dev-csp.ts
new file mode 100644
index 0000000..f772ad5
--- /dev/null
+++ b/src/main/security/dev-csp.ts
@@ -0,0 +1,49 @@
+import { buildCsp } from './csp';
+import { originOf, parseDevOrigin } from './trusted-origins';
+
+/**
+ * Development-only CSP delivery (design section 3.4). The dev server sends no CSP, so main adds
+ * one to responses from the exact dev origin. Production never installs this hook.
+ */
+export type ResponseHeaders = Record<string, string[] | string>;
+
+/** Removes every existing CSP header (any case) and sets exactly one. Returns a new object. */
+export function withCspHeader(headers: ResponseHeaders, csp: string): ResponseHeaders {
+  const next: ResponseHeaders = {};
+  for (const [name, value] of Object.entries(headers)) {
+    if (name.toLowerCase() !== 'content-security-policy') next[name] = value;
+  }
+  next['Content-Security-Policy'] = [csp];
+  return next;
+}
+
+export interface HeadersDetails {
+  readonly url: string;
+  readonly responseHeaders?: ResponseHeaders | undefined;
+}
+
+export interface WebRequestLike {
+  onHeadersReceived(
+    listener: (
+      details: HeadersDetails,
+      callback: (response: { responseHeaders?: ResponseHeaders }) => void,
+    ) => void,
+  ): void;
+}
+
+/** Returns false (and installs nothing) when `devOrigin` is not a valid loopback dev origin. */
+export function installDevCspHook(webRequest: WebRequestLike, devOrigin: string): boolean {
+  const dev = parseDevOrigin(devOrigin);
+  if (dev === null) return false;
+  const csp = buildCsp({ mode: 'development', devOrigin: dev.origin });
+  webRequest.onHeadersReceived((details, callback) => {
+    if (originOf(details.url) !== dev.origin) {
+      callback(
+        details.responseHeaders === undefined ? {} : { responseHeaders: details.responseHeaders },
+      );
+      return;
+    }
+    callback({ responseHeaders: withCspHeader(details.responseHeaders ?? {}, csp) });
+  });
+  return true;
+}
diff --git a/src/main/security/meta-csp-tag.test.ts b/src/main/security/meta-csp-tag.test.ts
new file mode 100644
index 0000000..49788e7
--- /dev/null
+++ b/src/main/security/meta-csp-tag.test.ts
@@ -0,0 +1,18 @@
+import { describe, expect, it } from 'vitest';
+import { buildMetaCsp } from './csp';
+import { buildMetaCspTag } from './meta-csp-tag';
+
+describe('buildMetaCspTag', () => {
+  it('carries the production meta policy and nothing else', () => {
+    const tag = buildMetaCspTag();
+    expect(tag.tag).toBe('meta');
+    expect(tag.attrs['http-equiv']).toBe('Content-Security-Policy');
+    expect(tag.attrs.content).toBe(buildMetaCsp({ mode: 'production' }));
+    expect(tag.injectTo).toBe('head-prepend');
+  });
+
+  it('has no development allowance and no directive a meta element ignores', () => {
+    const { content } = buildMetaCspTag().attrs;
+    expect(content).not.toMatch(/unsafe-|localhost|ws:|data:|\*|frame-ancestors/);
+  });
+});
diff --git a/src/main/security/meta-csp-tag.ts b/src/main/security/meta-csp-tag.ts
new file mode 100644
index 0000000..ece0146
--- /dev/null
+++ b/src/main/security/meta-csp-tag.ts
@@ -0,0 +1,23 @@
+import { buildMetaCsp } from './csp';
+
+/**
+ * Descriptor of the `<meta http-equiv>` CSP tag that the build injects into the renderer
+ * `index.html` (T2.7, design section 3.4). It always uses the production policy, so a production
+ * build cannot carry a development allowance. The shape matches Vite's `HtmlTagDescriptor`.
+ */
+export interface MetaCspTag {
+  readonly tag: 'meta';
+  readonly attrs: { readonly 'http-equiv': 'Content-Security-Policy'; readonly content: string };
+  readonly injectTo: 'head-prepend';
+}
+
+export function buildMetaCspTag(): MetaCspTag {
+  return {
+    tag: 'meta',
+    attrs: {
+      'http-equiv': 'Content-Security-Policy',
+      content: buildMetaCsp({ mode: 'production' }),
+    },
+    injectTo: 'head-prepend',
+  };
+}
diff --git a/src/main/security/sender-validation.test.ts b/src/main/security/sender-validation.test.ts
new file mode 100644
index 0000000..8b53431
--- /dev/null
+++ b/src/main/security/sender-validation.test.ts
@@ -0,0 +1,123 @@
+import { describe, expect, it } from 'vitest';
+import { isTrustedSender, type SenderEventLike } from './sender-validation';
+
+const TRUSTED = ['app://renderer'];
+const SENDER: { id: string; mainFrame: unknown } = { id: 'main-contents', mainFrame: undefined };
+const registered = (sender: unknown): boolean => sender === SENDER;
+
+/** Builds an event whose frame is the sender's main frame unless sender is overridden. */
+const event = (url: string, parent: unknown = null, sender: unknown = SENDER): SenderEventLike => {
+  const senderFrame = { url, parent };
+  if (sender === SENDER) SENDER.mainFrame = senderFrame;
+  return { senderFrame, sender };
+};
+
+describe('isTrustedSender', () => {
+  it('accepts the top frame of the registered contents on a trusted origin', () => {
+    expect(isTrustedSender(event('app://renderer/index.html'), TRUSTED, registered)).toBe(true);
+  });
+
+  it('rejects a null or missing sender frame', () => {
+    expect(isTrustedSender({ senderFrame: null, sender: SENDER }, TRUSTED, registered)).toBe(false);
+    expect(isTrustedSender({ senderFrame: undefined, sender: SENDER }, TRUSTED, registered)).toBe(
+      false,
+    );
+  });
+
+  it('rejects a sub-frame even on a trusted origin', () => {
+    expect(
+      isTrustedSender(event('app://renderer/x.html', { top: true }), TRUSTED, registered),
+    ).toBe(false);
+  });
+
+  it('rejects a frame whose parent is undefined (fail closed)', () => {
+    const noParent: SenderEventLike = {
+      senderFrame: { url: 'app://renderer/' } as unknown as { url: string; parent: unknown },
+      sender: SENDER,
+    };
+    expect(isTrustedSender(noParent, TRUSTED, registered)).toBe(false);
+  });
+
+  it.each([
+    'https://evil.test/',
+    'file:///C:/index.html',
+    'about:blank',
+    'app://evil/',
+    'app://renderer.evil.test/',
+    'http://localhost:5173/',
+    '',
+  ])('rejects an untrusted url %s', (url) => {
+    expect(isTrustedSender(event(url), TRUSTED, registered)).toBe(false);
+  });
+
+  it('accepts the dev origin only when it is in the trusted set', () => {
+    const url = 'http://localhost:5173/';
+    expect(isTrustedSender(event(url), [...TRUSTED, 'http://localhost:5173'], registered)).toBe(
+      true,
+    );
+    expect(isTrustedSender(event(url), TRUSTED, registered)).toBe(false);
+  });
+
+  it('rejects a top-level frame that is not the sender main frame', () => {
+    const other = { url: 'app://renderer/other', parent: null };
+    SENDER.mainFrame = { url: 'app://renderer/', parent: null };
+    expect(isTrustedSender({ senderFrame: other, sender: SENDER }, TRUSTED, registered)).toBe(
+      false,
+    );
+  });
+
+  it('rejects an equal-looking frame object that is not the same identity', () => {
+    SENDER.mainFrame = { url: 'app://renderer/', parent: null };
+    const clone = { url: 'app://renderer/', parent: null };
+    expect(isTrustedSender({ senderFrame: clone, sender: SENDER }, TRUSTED, registered)).toBe(
+      false,
+    );
+  });
+
+  it.each([undefined, null])('rejects when the sender main frame is %s', (mainFrame) => {
+    const frame = { url: 'app://renderer/', parent: null };
+    const sender = { mainFrame };
+    expect(isTrustedSender({ senderFrame: frame, sender }, TRUSTED, () => true)).toBe(false);
+  });
+
+  it('rejects when the sender is not an object', () => {
+    const frame = { url: 'app://renderer/', parent: null };
+    expect(isTrustedSender({ senderFrame: frame, sender: 'x' }, TRUSTED, () => true)).toBe(false);
+  });
+
+  it('rejects an unregistered sender', () => {
+    expect(isTrustedSender(event('app://renderer/', null, {}), TRUSTED, registered)).toBe(false);
+    // The frame is the main frame of `foreign`, so only the registration check can reject it.
+    const frame = { url: 'app://renderer/', parent: null };
+    const foreign = { mainFrame: frame };
+    expect(isTrustedSender({ senderFrame: frame, sender: foreign }, TRUSTED, registered)).toBe(
+      false,
+    );
+    expect(isTrustedSender({ senderFrame: frame, sender: foreign }, TRUSTED, () => true)).toBe(
+      true,
+    );
+    expect(
+      isTrustedSender(
+        { senderFrame: { url: 'app://renderer/', parent: null } },
+        TRUSTED,
+        registered,
+      ),
+    ).toBe(false);
+  });
+
+  it('fails closed when reading the frame throws', () => {
+    const throwing: SenderEventLike = {
+      get senderFrame(): never {
+        throw new Error('frame destroyed');
+      },
+    };
+    expect(isTrustedSender(throwing, TRUSTED, registered)).toBe(false);
+  });
+
+  it('fails closed when the registration check throws', () => {
+    const boom = (): boolean => {
+      throw new Error('boom');
+    };
+    expect(isTrustedSender(event('app://renderer/'), TRUSTED, boom)).toBe(false);
+  });
+});
diff --git a/src/main/security/sender-validation.ts b/src/main/security/sender-validation.ts
new file mode 100644
index 0000000..ab75e9d
--- /dev/null
+++ b/src/main/security/sender-validation.ts
@@ -0,0 +1,50 @@
+import { isTrustedUrl } from './trusted-origins';
+
+/**
+ * IPC sender validation (design section 3.2, R4.4). Structural types keep this unit testable
+ * without Electron. `IpcMainInvokeEvent` satisfies `SenderEventLike`.
+ */
+export interface FrameLike {
+  readonly url: string;
+  /** `null` only for the top frame of a page. */
+  readonly parent: unknown;
+}
+
+export interface SenderEventLike {
+  readonly senderFrame: FrameLike | null | undefined;
+  /** For `IpcMainInvokeEvent` this is the `WebContents`, which exposes `mainFrame`. */
+  readonly sender?: unknown;
+}
+
+function mainFrameOf(sender: unknown): unknown {
+  if (typeof sender !== 'object' || sender === null) return undefined;
+  return (sender as { readonly mainFrame?: unknown }).mainFrame;
+}
+
+/**
+ * True only if all hold:
+ * 1. `event.senderFrame` exists (Electron returns null for a destroyed frame).
+ * 2. It is a top frame (`parent === null`). Sub-frames are rejected.
+ * 3. It is the primary main frame of its web contents (`frame === sender.mainFrame`, by
+ *    identity). Verified at runtime on Electron 45.5.0 across reload and renderer crash recovery.
+ * 4. Its URL has a trusted origin.
+ * 5. `event.sender` is a web contents the app registered (`isRegisteredSender`).
+ * Any exception while reading the frame fails closed.
+ */
+export function isTrustedSender(
+  event: SenderEventLike,
+  trusted: readonly string[],
+  isRegisteredSender: (sender: unknown) => boolean,
+): boolean {
+  try {
+    const frame = event.senderFrame;
+    if (frame === null || frame === undefined) return false;
+    if (frame.parent !== null) return false;
+    const main = mainFrameOf(event.sender);
+    if (main === undefined || main === null || main !== frame) return false;
+    if (!isTrustedUrl(frame.url, trusted)) return false;
+    return isRegisteredSender(event.sender);
+  } catch {
+    return false;
+  }
+}
diff --git a/src/main/security/trusted-origins.test.ts b/src/main/security/trusted-origins.test.ts
new file mode 100644
index 0000000..4349008
--- /dev/null
+++ b/src/main/security/trusted-origins.test.ts
@@ -0,0 +1,112 @@
+import { describe, expect, it } from 'vitest';
+import { isTrustedUrl, originOf, parseDevOrigin, resolveTrustedOrigins } from './trusted-origins';
+
+const DEV = 'http://localhost:5173';
+
+describe('parseDevOrigin', () => {
+  it('accepts loopback http origins with a port', () => {
+    expect(parseDevOrigin('http://localhost:5173')).toEqual({
+      origin: DEV,
+      host: 'localhost:5173',
+    });
+    expect(parseDevOrigin('http://127.0.0.1:3000/')).toEqual({
+      origin: 'http://127.0.0.1:3000',
+      host: '127.0.0.1:3000',
+    });
+  });
+
+  it.each([
+    'https://localhost:5173',
+    'http://localhost',
+    'http://example.com:5173',
+    'http://localhost.evil.com:5173',
+    'http://user:pw@localhost:5173',
+    'http://localhost:5173/app',
+    'http://localhost:5173/?x=1',
+    'http://localhost:5173/#x',
+    'http://[::1]:5173',
+    'app://renderer',
+    'file:///C:/x',
+    'not a url',
+    '',
+  ])('rejects %s', (value) => {
+    expect(parseDevOrigin(value)).toBeNull();
+  });
+
+  it.each([undefined, null, 5, {}, ['http://localhost:5173']])('rejects non-string %s', (value) => {
+    expect(parseDevOrigin(value)).toBeNull();
+  });
+});
+
+describe('resolveTrustedOrigins', () => {
+  it('contains only the app origin in production', () => {
+    expect(resolveTrustedOrigins({ mode: 'production' })).toEqual(['app://renderer']);
+  });
+
+  it('adds the dev origin in development', () => {
+    expect(resolveTrustedOrigins({ mode: 'development', devOrigin: DEV })).toEqual([
+      'app://renderer',
+      DEV,
+    ]);
+  });
+
+  it('ignores an invalid dev origin', () => {
+    expect(resolveTrustedOrigins({ mode: 'development', devOrigin: 'https://evil.test' })).toEqual([
+      'app://renderer',
+    ]);
+  });
+
+  it('cannot gain a dev origin in production even if the object carries one', () => {
+    const sneaky = { mode: 'production', devOrigin: DEV } as { mode: 'production' };
+    expect(resolveTrustedOrigins(sneaky)).toEqual(['app://renderer']);
+  });
+});
+
+describe('originOf', () => {
+  it('returns protocol and host for the custom scheme', () => {
+    expect(originOf('app://renderer/index.html')).toBe('app://renderer');
+  });
+
+  it('returns null for credentials, empty hosts and bad input', () => {
+    for (const value of ['app://u:p@renderer/', 'file:///x', 'about:blank', 'x', '', 3, null]) {
+      expect(originOf(value)).toBeNull();
+    }
+  });
+});
+
+describe('isTrustedUrl', () => {
+  const trusted = ['app://renderer'];
+
+  it('accepts URLs on the trusted origin', () => {
+    expect(isTrustedUrl('app://renderer/index.html', trusted)).toBe(true);
+    expect(isTrustedUrl('app://renderer', trusted)).toBe(true);
+  });
+
+  it.each([
+    'https://renderer/',
+    'app://renderer.evil.com/',
+    'app://evil/',
+    'app://RENDERER/',
+    'app://renderer:8080/',
+    'app://renderer@evil.com/',
+    'app://user@renderer/',
+    'http://localhost:5173/',
+    'file:///C:/index.html',
+    'about:blank',
+    'javascript:alert(1)',
+    'data:text/html,hi',
+    'blob:app://renderer/uuid',
+    'null',
+    '',
+  ])('rejects %s', (url) => {
+    expect(isTrustedUrl(url, trusted)).toBe(false);
+  });
+
+  it.each([undefined, null, 0, {}, []])('rejects non-string %s', (value) => {
+    expect(isTrustedUrl(value, trusted)).toBe(false);
+  });
+
+  it('rejects everything when the trusted set is empty', () => {
+    expect(isTrustedUrl('app://renderer/', [])).toBe(false);
+  });
+});
diff --git a/src/main/security/trusted-origins.ts b/src/main/security/trusted-origins.ts
new file mode 100644
index 0000000..7d70025
--- /dev/null
+++ b/src/main/security/trusted-origins.ts
@@ -0,0 +1,64 @@
+import { APP_ORIGIN } from '../constants';
+
+/**
+ * Trusted origin logic (design section 3.2). Pure: it never reads the environment.
+ *
+ * Origins are compared as `protocol//host` strings, not with `URL.origin`. Node's URL parser
+ * reports the origin of a non-special scheme such as `app:` as the string "null".
+ */
+export type OriginMode =
+  { readonly mode: 'production' } | { readonly mode: 'development'; readonly devOrigin: string };
+
+export interface DevOrigin {
+  /** For example `http://localhost:5173`. */
+  readonly origin: string;
+  /** For example `localhost:5173`. */
+  readonly host: string;
+}
+
+const LOOPBACK_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1']);
+
+/**
+ * Accepts only a loopback http URL with an explicit port, no credentials, no query or fragment
+ * and an empty path or `/`. Returns null for anything else (design section 3.1).
+ */
+export function parseDevOrigin(value: unknown): DevOrigin | null {
+  if (typeof value !== 'string' || value.length === 0 || value.length > 256) return null;
+  let url: URL;
+  try {
+    url = new URL(value);
+  } catch {
+    return null;
+  }
+  if (url.protocol !== 'http:') return null;
+  if (!LOOPBACK_HOSTNAMES.has(url.hostname)) return null;
+  if (url.port === '') return null;
+  if (url.username !== '' || url.password !== '') return null;
+  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') return null;
+  return { origin: `${url.protocol}//${url.host}`, host: url.host };
+}
+
+export function resolveTrustedOrigins(options: OriginMode): readonly string[] {
+  if (options.mode === 'production') return [APP_ORIGIN];
+  const dev = parseDevOrigin(options.devOrigin);
+  return dev === null ? [APP_ORIGIN] : [APP_ORIGIN, dev.origin];
+}
+
+/** Returns the `protocol//host` origin of a URL, or null when it has none or has credentials. */
+export function originOf(value: unknown): string | null {
+  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
+  let url: URL;
+  try {
+    url = new URL(value);
+  } catch {
+    return null;
+  }
+  if (url.host === '' || url.username !== '' || url.password !== '') return null;
+  return `${url.protocol}//${url.host}`;
+}
+
+/** True only for a parseable URL whose origin is exactly one of `trusted`. */
+export function isTrustedUrl(value: unknown, trusted: readonly string[]): boolean {
+  const origin = originOf(value);
+  return origin !== null && trusted.includes(origin);
+}
diff --git a/src/main/window/chrome-profile.ts b/src/main/window/chrome-profile.ts
new file mode 100644
index 0000000..4c477e5
--- /dev/null
+++ b/src/main/window/chrome-profile.ts
@@ -0,0 +1,8 @@
+/**
+ * Window chrome profile (design section 2, D5). Only the native profile exists. A later
+ * `frameless` member must not change the security preferences, which are built separately by
+ * `buildWebPreferences()` in `window-options.ts`.
+ */
+export type ChromeProfile = { readonly kind: 'native' };
+
+export const NATIVE_CHROME_PROFILE: ChromeProfile = Object.freeze({ kind: 'native' });
diff --git a/src/main/window/create-main-window.test.ts b/src/main/window/create-main-window.test.ts
new file mode 100644
index 0000000..5d757de
--- /dev/null
+++ b/src/main/window/create-main-window.test.ts
@@ -0,0 +1,99 @@
+import type { BrowserWindowConstructorOptions } from 'electron';
+import { describe, expect, it, vi } from 'vitest';
+import type { Logger } from '../logging/logger';
+import { createMainWindow, type WindowLike } from './create-main-window';
+import type { LoadTarget } from './load-target';
+import { buildWebPreferences } from './window-options';
+
+const PRELOAD = '/app/out/preload/index.js';
+const PRODUCTION: LoadTarget = { kind: 'production', url: 'app://renderer/index.html' };
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+
+function fakeWindowClass(loadResult: () => Promise<void> = () => Promise.resolve()) {
+  const created: { options: BrowserWindowConstructorOptions; window: FakeWindow }[] = [];
+  class FakeWindow implements WindowLike {
+    readonly handlers = new Map<string, () => void>();
+    readonly show = vi.fn();
+    readonly loadURL = vi.fn((_url: string) => loadResult());
+    constructor(readonly options: BrowserWindowConstructorOptions) {
+      created.push({ options, window: this });
+    }
+    once(event: 'ready-to-show', listener: () => void): this {
+      this.handlers.set(event, listener);
+      return this;
+    }
+  }
+  return { FakeWindow, created };
+}
+
+describe('createMainWindow', () => {
+  it('creates exactly one window with the approved web preferences', () => {
+    const { FakeWindow, created } = fakeWindowClass();
+    createMainWindow({
+      BrowserWindow: FakeWindow,
+      preloadPath: PRELOAD,
+      target: PRODUCTION,
+      log: silentLog(),
+    });
+    expect(created).toHaveLength(1);
+    expect(created[0]?.options.webPreferences).toEqual(buildWebPreferences(PRELOAD));
+  });
+
+  it('uses the same web preferences for production and development targets', () => {
+    const dev: LoadTarget = {
+      kind: 'development',
+      url: 'http://localhost:5173/',
+      devOrigin: 'http://localhost:5173',
+    };
+    const a = fakeWindowClass();
+    const b = fakeWindowClass();
+    createMainWindow({
+      BrowserWindow: a.FakeWindow,
+      preloadPath: PRELOAD,
+      target: PRODUCTION,
+      log: silentLog(),
+    });
+    createMainWindow({
+      BrowserWindow: b.FakeWindow,
+      preloadPath: PRELOAD,
+      target: dev,
+      log: silentLog(),
+    });
+    expect(a.created[0]?.options.webPreferences).toEqual(b.created[0]?.options.webPreferences);
+  });
+
+  it('starts hidden and shows on ready-to-show', () => {
+    const { FakeWindow, created } = fakeWindowClass();
+    createMainWindow({
+      BrowserWindow: FakeWindow,
+      preloadPath: PRELOAD,
+      target: PRODUCTION,
+      log: silentLog(),
+    });
+    const entry = created[0];
+    expect(entry?.options.show).toBe(false);
+    expect(entry?.window.show).not.toHaveBeenCalled();
+    entry?.window.handlers.get('ready-to-show')?.();
+    expect(entry?.window.show).toHaveBeenCalledTimes(1);
+  });
+
+  it('loads the target URL', () => {
+    const { FakeWindow, created } = fakeWindowClass();
+    createMainWindow({
+      BrowserWindow: FakeWindow,
+      preloadPath: PRELOAD,
+      target: PRODUCTION,
+      log: silentLog(),
+    });
+    expect(created[0]?.window.loadURL).toHaveBeenCalledWith('app://renderer/index.html');
+  });
+
+  it('logs a failed load by code only', async () => {
+    const { FakeWindow } = fakeWindowClass(() => Promise.reject(new Error('C:\\secret\\path')));
+    const log = silentLog();
+    createMainWindow({ BrowserWindow: FakeWindow, preloadPath: PRELOAD, target: PRODUCTION, log });
+    await Promise.resolve();
+    await Promise.resolve();
+    expect(log.error).toHaveBeenCalledWith('window.load_failed', { code: 'production' });
+  });
+});
diff --git a/src/main/window/create-main-window.ts b/src/main/window/create-main-window.ts
new file mode 100644
index 0000000..d10382b
--- /dev/null
+++ b/src/main/window/create-main-window.ts
@@ -0,0 +1,37 @@
+import type { BrowserWindowConstructorOptions } from 'electron';
+import type { Logger } from '../logging/logger';
+import { NATIVE_CHROME_PROFILE } from './chrome-profile';
+import type { LoadTarget } from './load-target';
+import { buildWebPreferences, buildWindowOptions } from './window-options';
+
+/**
+ * The only file that constructs a window (R3.1). The constructor is injected so tests do not
+ * need Electron, and the composition root passes the real `BrowserWindow` class.
+ */
+export interface WindowLike {
+  once(event: 'ready-to-show', listener: () => void): unknown;
+  show(): void;
+  loadURL(url: string): Promise<void>;
+}
+
+export interface MainWindowDeps<W extends WindowLike> {
+  readonly BrowserWindow: new (options: BrowserWindowConstructorOptions) => W;
+  /** Absolute path of the built preload script. */
+  readonly preloadPath: string;
+  readonly target: LoadTarget;
+  readonly log: Logger;
+}
+
+export function createMainWindow<W extends WindowLike>(deps: MainWindowDeps<W>): W {
+  const { BrowserWindow, preloadPath, target, log } = deps;
+  const window = new BrowserWindow({
+    ...buildWindowOptions(NATIVE_CHROME_PROFILE),
+    webPreferences: buildWebPreferences(preloadPath),
+  });
+  window.once('ready-to-show', () => window.show());
+  window.loadURL(target.url).catch(() => {
+    // The error text may contain a path or URL, so only the event code is logged.
+    log.error('window.load_failed', { code: target.kind });
+  });
+  return window;
+}
diff --git a/src/main/window/load-target.test.ts b/src/main/window/load-target.test.ts
new file mode 100644
index 0000000..b687f9d
--- /dev/null
+++ b/src/main/window/load-target.test.ts
@@ -0,0 +1,39 @@
+import { describe, expect, it } from 'vitest';
+import { resolveLoadTarget } from './load-target';
+
+describe('resolveLoadTarget', () => {
+  it('uses the app:// entry when no dev URL is set', () => {
+    expect(resolveLoadTarget({}, false)).toEqual({
+      kind: 'production',
+      url: 'app://renderer/index.html',
+    });
+  });
+
+  it('uses a loopback dev URL only when the app is not packaged', () => {
+    const env = { ELECTRON_RENDERER_URL: 'http://localhost:5173' };
+    expect(resolveLoadTarget(env, false)).toEqual({
+      kind: 'development',
+      url: 'http://localhost:5173/',
+      devOrigin: 'http://localhost:5173',
+    });
+    expect(resolveLoadTarget(env, true).kind).toBe('production');
+  });
+
+  it.each([
+    'https://localhost:5173',
+    'http://example.com:5173',
+    'http://localhost',
+    'http://user:pw@localhost:5173',
+    'http://localhost:5173/evil',
+    'file:///C:/index.html',
+    'app://renderer',
+    'javascript:alert(1)',
+    '',
+    'garbage',
+  ])('falls back to production for %s', (value) => {
+    expect(resolveLoadTarget({ ELECTRON_RENDERER_URL: value }, false)).toEqual({
+      kind: 'production',
+      url: 'app://renderer/index.html',
+    });
+  });
+});
diff --git a/src/main/window/load-target.ts b/src/main/window/load-target.ts
new file mode 100644
index 0000000..a29cb34
--- /dev/null
+++ b/src/main/window/load-target.ts
@@ -0,0 +1,23 @@
+import { APP_ENTRY_URL } from '../constants';
+import { parseDevOrigin } from '../security/trusted-origins';
+
+/**
+ * Pure choice between the production `app://` entry and the dev server (design section 3.1).
+ * The dev server is used only when the app is not packaged and `ELECTRON_RENDERER_URL` is a
+ * loopback http origin. Anything else falls back to production.
+ */
+export type LoadTarget =
+  | { readonly kind: 'production'; readonly url: string }
+  | { readonly kind: 'development'; readonly url: string; readonly devOrigin: string };
+
+export interface LoadTargetEnv {
+  readonly ELECTRON_RENDERER_URL?: string | undefined;
+}
+
+export function resolveLoadTarget(env: LoadTargetEnv, isPackaged: boolean): LoadTarget {
+  if (!isPackaged) {
+    const dev = parseDevOrigin(env.ELECTRON_RENDERER_URL);
+    if (dev !== null) return { kind: 'development', url: `${dev.origin}/`, devOrigin: dev.origin };
+  }
+  return { kind: 'production', url: APP_ENTRY_URL };
+}
diff --git a/src/main/window/navigation-guards.test.ts b/src/main/window/navigation-guards.test.ts
new file mode 100644
index 0000000..c5f479d
--- /dev/null
+++ b/src/main/window/navigation-guards.test.ts
@@ -0,0 +1,96 @@
+import { describe, expect, it, vi } from 'vitest';
+import type { Logger } from '../logging/logger';
+import {
+  attachNavigationGuards,
+  isNavigationAllowed,
+  type GuardedContents,
+  type NavigationDetails,
+} from './navigation-guards';
+
+const TRUSTED = ['app://renderer'];
+const silentLog = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+
+function fakeContents() {
+  const state: {
+    navigation?: (d: NavigationDetails) => void;
+    webview?: (e: { preventDefault(): void }) => void;
+    windowOpenDenied: boolean;
+  } = { windowOpenDenied: false };
+  const contents: GuardedContents = {
+    onNavigation: (l) => {
+      state.navigation = l;
+    },
+    onWebviewAttach: (l) => {
+      state.webview = l;
+    },
+    denyWindowOpen: () => {
+      state.windowOpenDenied = true;
+    },
+  };
+  return { contents, state };
+}
+
+const navigate = (state: ReturnType<typeof fakeContents>['state'], url: string): boolean => {
+  const preventDefault = vi.fn();
+  state.navigation?.({ url, preventDefault });
+  return preventDefault.mock.calls.length > 0;
+};
+
+describe('isNavigationAllowed', () => {
+  it('allows only trusted origins', () => {
+    expect(isNavigationAllowed('app://renderer/index.html', TRUSTED)).toBe(true);
+    expect(isNavigationAllowed('https://github.com/', TRUSTED)).toBe(false);
+  });
+});
+
+describe('attachNavigationGuards', () => {
+  it('installs navigation, webview and window-open guards', () => {
+    const { contents, state } = fakeContents();
+    attachNavigationGuards(contents, TRUSTED, silentLog());
+    expect(state.navigation).toBeTypeOf('function');
+    expect(state.webview).toBeTypeOf('function');
+    expect(state.windowOpenDenied).toBe(true);
+  });
+
+  it('allows in-app navigation to the entry URL', () => {
+    const { contents, state } = fakeContents();
+    attachNavigationGuards(contents, TRUSTED, silentLog());
+    expect(navigate(state, 'app://renderer/index.html')).toBe(false);
+  });
+
+  it.each([
+    'https://evil.test/',
+    'http://localhost:5173/',
+    'file:///C:/Windows/win.ini',
+    'javascript:alert(1)',
+    'data:text/html,<script>1</script>',
+    'about:blank',
+    'app://evil/',
+    'app://renderer.evil.test/',
+    '',
+  ])('prevents navigation or redirect to %s', (url) => {
+    const { contents, state } = fakeContents();
+    const log = silentLog();
+    attachNavigationGuards(contents, TRUSTED, log);
+    expect(navigate(state, url)).toBe(true);
+    expect(log.warn).toHaveBeenCalledWith('navigation.blocked');
+  });
+
+  it('does not log the blocked URL', () => {
+    const { contents, state } = fakeContents();
+    const log = silentLog();
+    attachNavigationGuards(contents, TRUSTED, log);
+    navigate(state, 'https://evil.test/?token=abc');
+    expect(JSON.stringify((log.warn as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
+      'token',
+    );
+  });
+
+  it('prevents every webview attach', () => {
+    const { contents, state } = fakeContents();
+    attachNavigationGuards(contents, TRUSTED, silentLog());
+    const preventDefault = vi.fn();
+    state.webview?.({ preventDefault });
+    expect(preventDefault).toHaveBeenCalledTimes(1);
+  });
+});
diff --git a/src/main/window/navigation-guards.ts b/src/main/window/navigation-guards.ts
new file mode 100644
index 0000000..4aa1b73
--- /dev/null
+++ b/src/main/window/navigation-guards.ts
@@ -0,0 +1,80 @@
+import type { WebContents } from 'electron';
+import type { Logger } from '../logging/logger';
+import { isTrustedUrl } from '../security/trusted-origins';
+
+/**
+ * Navigation, new-window and webview restrictions (design section 3.3, R6.1 to R6.3, R6.5).
+ *
+ * Decisions are pure (`isNavigationAllowed`). Electron wiring is a thin adapter. `will-navigate`,
+ * `will-redirect`, `will-frame-navigate` and `will-attach-webview` are declared by the
+ * Electron 45.5.0 typings (T2.0).
+ */
+export interface NavigationDetails {
+  readonly url: string;
+  preventDefault(): void;
+}
+
+export interface GuardedContents {
+  onNavigation(listener: (details: NavigationDetails) => void): void;
+  onWebviewAttach(listener: (event: { preventDefault(): void }) => void): void;
+  denyWindowOpen(): void;
+}
+
+/** Same-origin navigation to a trusted origin only. Everything else is denied. */
+export function isNavigationAllowed(url: unknown, trusted: readonly string[]): boolean {
+  return isTrustedUrl(url, trusted);
+}
+
+export function attachNavigationGuards(
+  contents: GuardedContents,
+  trusted: readonly string[],
+  log: Logger,
+): void {
+  contents.onNavigation((details) => {
+    if (!isNavigationAllowed(details.url, trusted)) {
+      details.preventDefault();
+      // The URL is not logged. It may carry a path or a token.
+      log.warn('navigation.blocked');
+    }
+  });
+  contents.onWebviewAttach((event) => {
+    event.preventDefault();
+    log.warn('webview.blocked');
+  });
+  contents.denyWindowOpen();
+}
+
+/** Adapts a real `WebContents` to the structural interface. */
+export function adaptWebContents(contents: WebContents): GuardedContents {
+  return {
+    onNavigation(listener) {
+      contents.on('will-navigate', (details) => listener(details));
+      contents.on('will-redirect', (details) => listener(details));
+      contents.on('will-frame-navigate', (details) => listener(details));
+    },
+    onWebviewAttach(listener) {
+      contents.on('will-attach-webview', (event) => listener(event));
+    },
+    denyWindowOpen() {
+      contents.setWindowOpenHandler(() => ({ action: 'deny' }));
+    },
+  };
+}
+
+export interface WebContentsCreatedSource {
+  on(
+    event: 'web-contents-created',
+    listener: (event: unknown, contents: WebContents) => void,
+  ): unknown;
+}
+
+/** Guards every web contents the app ever creates, not only the main window's. */
+export function installNavigationGuards(
+  app: WebContentsCreatedSource,
+  trusted: readonly string[],
+  log: Logger,
+): void {
+  app.on('web-contents-created', (_event, contents) => {
+    attachNavigationGuards(adaptWebContents(contents), trusted, log);
+  });
+}
diff --git a/src/main/window/permissions.test.ts b/src/main/window/permissions.test.ts
new file mode 100644
index 0000000..1f984e0
--- /dev/null
+++ b/src/main/window/permissions.test.ts
@@ -0,0 +1,59 @@
+import { describe, expect, it, vi } from 'vitest';
+import { installPermissionHandlers, type SessionLike } from './permissions';
+
+function fakeSession() {
+  const captured: {
+    request?: Parameters<SessionLike['setPermissionRequestHandler']>[0];
+    check?: () => boolean;
+    device?: () => boolean;
+  } = {};
+  const session: SessionLike = {
+    setPermissionRequestHandler: (h) => {
+      captured.request = h;
+    },
+    setPermissionCheckHandler: (h) => {
+      captured.check = h;
+    },
+    setDevicePermissionHandler: (h) => {
+      captured.device = h;
+    },
+  };
+  return { session, captured };
+}
+
+describe('installPermissionHandlers', () => {
+  it.each([
+    'media',
+    'geolocation',
+    'notifications',
+    'clipboard-read',
+    'openExternal',
+    'fullscreen',
+    'serial',
+    'hid',
+    'usb',
+    'unknown',
+  ])('denies permission request %s', (permission) => {
+    const { session, captured } = fakeSession();
+    installPermissionHandlers(session);
+    const callback = vi.fn();
+    captured.request?.({}, permission, callback);
+    expect(callback).toHaveBeenCalledTimes(1);
+    expect(callback).toHaveBeenCalledWith(false);
+  });
+
+  it('denies permission checks and device permissions', () => {
+    const { session, captured } = fakeSession();
+    installPermissionHandlers(session);
+    expect(captured.check?.()).toBe(false);
+    expect(captured.device?.()).toBe(false);
+  });
+
+  it('installs all three handlers', () => {
+    const { session, captured } = fakeSession();
+    installPermissionHandlers(session);
+    expect(captured.request).toBeTypeOf('function');
+    expect(captured.check).toBeTypeOf('function');
+    expect(captured.device).toBeTypeOf('function');
+  });
+});
diff --git a/src/main/window/permissions.ts b/src/main/window/permissions.ts
new file mode 100644
index 0000000..0e5a00c
--- /dev/null
+++ b/src/main/window/permissions.ts
@@ -0,0 +1,22 @@
+/**
+ * Deny-all permission policy (design section 3.3, R6.4). No permission is needed in this phase,
+ * so there is no allow-list. Every request, synchronous check and device request is denied.
+ * Electron 45.5.0 declares all three handler setters (T2.0).
+ */
+export interface SessionLike {
+  setPermissionRequestHandler(
+    handler: (
+      webContents: unknown,
+      permission: string,
+      callback: (granted: boolean) => void,
+    ) => void,
+  ): void;
+  setPermissionCheckHandler(handler: () => boolean): void;
+  setDevicePermissionHandler(handler: () => boolean): void;
+}
+
+export function installPermissionHandlers(session: SessionLike): void {
+  session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
+  session.setPermissionCheckHandler(() => false);
+  session.setDevicePermissionHandler(() => false);
+}
diff --git a/src/main/window/window-options.test.ts b/src/main/window/window-options.test.ts
new file mode 100644
index 0000000..ca98a1e
--- /dev/null
+++ b/src/main/window/window-options.test.ts
@@ -0,0 +1,70 @@
+import { describe, expect, it } from 'vitest';
+import { NATIVE_CHROME_PROFILE } from './chrome-profile';
+import { buildWebPreferences, buildWindowOptions } from './window-options';
+
+const PRELOAD = '/app/out/preload/index.js';
+
+describe('buildWebPreferences', () => {
+  it('equals the approved literal exactly', () => {
+    expect(buildWebPreferences(PRELOAD)).toEqual({
+      contextIsolation: true,
+      nodeIntegration: false,
+      sandbox: true,
+      webSecurity: true,
+      webviewTag: false,
+      allowRunningInsecureContent: false,
+      nodeIntegrationInWorker: false,
+      nodeIntegrationInSubFrames: false,
+      experimentalFeatures: false,
+      spellcheck: false,
+      preload: PRELOAD,
+    });
+  });
+
+  it('keeps the four mandatory invariants regardless of environment', () => {
+    const original = { ...process.env };
+    try {
+      for (const value of ['development', 'production', 'test']) {
+        process.env['NODE_ENV'] = value;
+        process.env['ELECTRON_RENDERER_URL'] = 'http://localhost:5173';
+        const prefs = buildWebPreferences(PRELOAD);
+        expect(prefs.contextIsolation).toBe(true);
+        expect(prefs.sandbox).toBe(true);
+        expect(prefs.nodeIntegration).toBe(false);
+        expect(prefs.webSecurity).toBe(true);
+      }
+    } finally {
+      process.env = original;
+    }
+  });
+
+  it('only the preload path varies with the argument', () => {
+    const { preload: a, ...restA } = buildWebPreferences('/a/index.js');
+    const { preload: b, ...restB } = buildWebPreferences('/b/index.js');
+    expect(a).not.toBe(b);
+    expect(restA).toEqual(restB);
+  });
+});
+
+describe('buildWindowOptions', () => {
+  it('builds the native profile with the minimum size and a hidden first paint', () => {
+    expect(buildWindowOptions(NATIVE_CHROME_PROFILE)).toEqual({
+      width: 1100,
+      height: 720,
+      minWidth: 800,
+      minHeight: 600,
+      show: false,
+      title: 'NecroAmp',
+      frame: true,
+      autoHideMenuBar: false,
+    });
+  });
+
+  it('never carries web preferences', () => {
+    expect(buildWindowOptions(NATIVE_CHROME_PROFILE)).not.toHaveProperty('webPreferences');
+  });
+
+  it('throws for an unknown profile instead of guessing', () => {
+    expect(() => buildWindowOptions({ kind: 'frameless' } as never)).toThrow();
+  });
+});
diff --git a/src/main/window/window-options.ts b/src/main/window/window-options.ts
new file mode 100644
index 0000000..35ac338
--- /dev/null
+++ b/src/main/window/window-options.ts
@@ -0,0 +1,50 @@
+import type { BrowserWindowConstructorOptions, WebPreferences } from 'electron';
+import { APP_NAME } from '../constants';
+import type { ChromeProfile } from './chrome-profile';
+
+/** Minimum window size, R8.11. */
+export const MIN_WINDOW_WIDTH = 800;
+export const MIN_WINDOW_HEIGHT = 600;
+
+/**
+ * The only source of web preferences. It takes no mode, profile or environment, so no caller can
+ * weaken it. Every field is a literal except the absolute preload path, which main builds from a
+ * constant (design section 3.1). Never disable `contextIsolation`, `sandbox`, `nodeIntegration`
+ * or `webSecurity`.
+ */
+export function buildWebPreferences(preloadPath: string): WebPreferences {
+  return {
+    contextIsolation: true,
+    nodeIntegration: false,
+    sandbox: true,
+    webSecurity: true,
+    webviewTag: false,
+    allowRunningInsecureContent: false,
+    nodeIntegrationInWorker: false,
+    nodeIntegrationInSubFrames: false,
+    experimentalFeatures: false,
+    spellcheck: false,
+    preload: preloadPath,
+  };
+}
+
+/** Chrome-dependent options. Contains no web preferences. */
+export function buildWindowOptions(profile: ChromeProfile): BrowserWindowConstructorOptions {
+  switch (profile.kind) {
+    case 'native':
+      return {
+        width: 1100,
+        height: 720,
+        minWidth: MIN_WINDOW_WIDTH,
+        minHeight: MIN_WINDOW_HEIGHT,
+        show: false,
+        title: APP_NAME,
+        frame: true,
+        autoHideMenuBar: false,
+      };
+    default: {
+      const exhaustive: never = profile.kind;
+      throw new Error(`Unsupported chrome profile: ${String(exhaustive)}`);
+    }
+  }
+}
diff --git a/src/preload/create-necroamp-api.property.test.ts b/src/preload/create-necroamp-api.property.test.ts
new file mode 100644
index 0000000..1b2e44d
--- /dev/null
+++ b/src/preload/create-necroamp-api.property.test.ts
@@ -0,0 +1,70 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { IPC_CHANNELS, appInfoResponseSchema, type IpcChannel } from '@shared/ipc';
+import { createNecroampApi } from './create-necroamp-api';
+
+const SECRET = 'C:\\Users\\victim\\ghp_FAKE_TOKEN';
+
+describe('preload API exposure boundary (properties)', () => {
+  it('getInfo resolves to a valid IpcResult for any raw reply and never rejects', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.anything(), async (reply) => {
+        const api = createNecroampApi(() => Promise.resolve(reply));
+        const result = await api.app.getInfo();
+        expect(appInfoResponseSchema.safeParse(result).success).toBe(true);
+      }),
+    );
+  });
+
+  it('a transport failure with any thrown value resolves to INTERNAL without leaking its text', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.anything(), async (thrown) => {
+        const api = createNecroampApi(() => Promise.reject(thrown ?? new Error(SECRET)));
+        const result = await api.app.getInfo();
+        expect(result).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
+        expect(JSON.stringify(result)).not.toContain('victim');
+      }),
+    );
+  });
+
+  it('any call with arguments is INVALID_PAYLOAD and never reaches invoke', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.array(fc.anything(), { minLength: 1, maxLength: 4 }), async (args) => {
+        let calls = 0;
+        const api = createNecroampApi(() => {
+          calls += 1;
+          return Promise.resolve(undefined);
+        });
+        const getInfo = api.app.getInfo as (...a: unknown[]) => Promise<unknown>;
+        const result = await getInfo(...args);
+        expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
+        expect(calls).toBe(0);
+      }),
+    );
+  });
+
+  it('only channels from IPC_CHANNELS are ever invoked', async () => {
+    const seen: IpcChannel[] = [];
+    const api = createNecroampApi((channel) => {
+      seen.push(channel);
+      return Promise.resolve(undefined);
+    });
+    await api.app.getInfo();
+    expect(seen).toEqual([IPC_CHANNELS.appGetInfo]);
+  });
+
+  it('a reply with an extra field or widened value never passes through verbatim', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.string({ minLength: 1 }), fc.anything(), async (key, value) => {
+        fc.pre(!['ok', 'data'].includes(key));
+        const reply = {
+          ok: true,
+          data: { name: 'N', version: '1', platform: 'linux' },
+          [key]: value,
+        };
+        const api = createNecroampApi(() => Promise.resolve(reply));
+        expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
+      }),
+    );
+  });
+});
diff --git a/src/preload/create-necroamp-api.test.ts b/src/preload/create-necroamp-api.test.ts
new file mode 100644
index 0000000..6f0e84f
--- /dev/null
+++ b/src/preload/create-necroamp-api.test.ts
@@ -0,0 +1,92 @@
+import { describe, expect, it, vi } from 'vitest';
+import { IPC_CHANNELS, IPC_ERROR_MESSAGES } from '@shared/ipc';
+import { createNecroampApi } from './create-necroamp-api';
+
+const VALID = { ok: true, data: { name: 'NecroAmp', version: '0.1.0', platform: 'win32' } };
+
+describe('createNecroampApi exposure boundary', () => {
+  const api = createNecroampApi(() => Promise.resolve(VALID));
+
+  it('exposes exactly app.getInfo', () => {
+    expect(Object.keys(api)).toEqual(['app']);
+    expect(Object.keys(api.app)).toEqual(['getInfo']);
+    expect(typeof api.app.getInfo).toBe('function');
+  });
+
+  it('is frozen at every level', () => {
+    expect(Object.isFrozen(api)).toBe(true);
+    expect(Object.isFrozen(api.app)).toBe(true);
+  });
+
+  it('leaks no ipcRenderer, invoke, send or on', () => {
+    const json = Object.keys(api).concat(Object.keys(api.app)).join(',');
+    for (const forbidden of ['ipcRenderer', 'invoke', 'send', 'on', 'require', 'process']) {
+      expect(json).not.toContain(forbidden);
+    }
+    expect('ipcRenderer' in api).toBe(false);
+  });
+});
+
+describe('getInfo', () => {
+  it('invokes only the app:get-info channel with no payload', async () => {
+    const invoke = vi.fn(() => Promise.resolve(VALID));
+    const result = await createNecroampApi(invoke).app.getInfo();
+    expect(invoke).toHaveBeenCalledTimes(1);
+    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.appGetInfo);
+    expect(result).toEqual(VALID);
+  });
+
+  it('rejects extra arguments before invoking', async () => {
+    const invoke = vi.fn(() => Promise.resolve(VALID));
+    const call = createNecroampApi(invoke).app.getInfo as (...a: unknown[]) => Promise<unknown>;
+    const result = await call('../secret');
+    expect(invoke).not.toHaveBeenCalled();
+    expect(result).toEqual({
+      ok: false,
+      error: { code: 'INVALID_PAYLOAD', message: IPC_ERROR_MESSAGES.INVALID_PAYLOAD },
+    });
+  });
+
+  it('passes through a shared error result from main', async () => {
+    const error = { code: 'INVALID_SENDER', message: IPC_ERROR_MESSAGES.INVALID_SENDER };
+    const result = await createNecroampApi(() =>
+      Promise.resolve({ ok: false, error }),
+    ).app.getInfo();
+    expect(result).toEqual({ ok: false, error });
+  });
+
+  it.each([
+    ['null', null],
+    ['a string', 'x'],
+    ['unknown platform', { ok: true, data: { name: 'a', version: '1', platform: 'sunos' } }],
+    [
+      'extra field',
+      { ok: true, data: { name: 'a', version: '1', platform: 'linux', path: 'C:\\x' } },
+    ],
+    ['unknown error code', { ok: false, error: { code: 'EPERM', message: 'm' } }],
+  ])('maps a malformed response (%s) to INTERNAL', async (_name, raw) => {
+    const result = await createNecroampApi(() => Promise.resolve(raw)).app.getInfo();
+    expect(result).toEqual({
+      ok: false,
+      error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
+    });
+  });
+
+  it('maps a transport rejection to INTERNAL without leaking its text', async () => {
+    const api = createNecroampApi(() => Promise.reject(new Error('ENOENT C:\\Users\\me\\secret')));
+    const result = await api.app.getInfo();
+    expect(result).toEqual({
+      ok: false,
+      error: { code: 'INTERNAL', message: IPC_ERROR_MESSAGES.INTERNAL },
+    });
+    expect(JSON.stringify(result)).not.toContain('secret');
+  });
+
+  it('returns a fresh object per error so callers cannot mutate shared state', async () => {
+    const api = createNecroampApi(() => Promise.reject(new Error('x')));
+    const a = (await api.app.getInfo()) as { error: { message: string } };
+    a.error.message = 'changed';
+    const b = (await api.app.getInfo()) as { error: { message: string } };
+    expect(b.error.message).toBe(IPC_ERROR_MESSAGES.INTERNAL);
+  });
+});
diff --git a/src/preload/create-necroamp-api.ts b/src/preload/create-necroamp-api.ts
new file mode 100644
index 0000000..cb02a44
--- /dev/null
+++ b/src/preload/create-necroamp-api.ts
@@ -0,0 +1,47 @@
+import {
+  IPC_CHANNELS,
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  createIpcError,
+  type IpcChannel,
+  type NecroampApi,
+} from '@shared/ipc';
+
+/**
+ * The only IPC capability the bridge receives: invoke one named channel with no arguments.
+ * It is a closed function, not `ipcRenderer`, so this module cannot reach any other channel.
+ */
+export type InvokeChannel = (channel: IpcChannel) => Promise<unknown>;
+
+const INTERNAL_RESULT = Object.freeze({ ok: false, error: createIpcError('INTERNAL') });
+const INVALID_PAYLOAD_RESULT = Object.freeze({
+  ok: false,
+  error: createIpcError('INVALID_PAYLOAD'),
+});
+
+/**
+ * Builds the frozen renderer-facing API (`window.necroamp`).
+ * Requests are validated before invoke and responses after. Failures resolve to the shared
+ * `{ ok: false, error }` shape with fixed messages. Nothing here rejects with raw error text.
+ */
+export function createNecroampApi(invoke: InvokeChannel): NecroampApi {
+  const getInfo = async (...args: unknown[]): Promise<unknown> => {
+    if (!appInfoRequestSchema.safeParse(args).success) {
+      return { ...INVALID_PAYLOAD_RESULT, error: { ...INVALID_PAYLOAD_RESULT.error } };
+    }
+    let raw: unknown;
+    try {
+      raw = await invoke(IPC_CHANNELS.appGetInfo);
+    } catch {
+      // Transport failure. The exception text is dropped on purpose (it may hold paths).
+      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
+    }
+    const parsed = appInfoResponseSchema.safeParse(raw);
+    if (!parsed.success) {
+      return { ...INTERNAL_RESULT, error: { ...INTERNAL_RESULT.error } };
+    }
+    return parsed.data;
+  };
+  const app = Object.freeze({ getInfo });
+  return Object.freeze({ app });
+}
diff --git a/src/preload/index.test.ts b/src/preload/index.test.ts
new file mode 100644
index 0000000..6e770b2
--- /dev/null
+++ b/src/preload/index.test.ts
@@ -0,0 +1,50 @@
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { IPC_CHANNELS } from '@shared/ipc';
+
+const exposeInMainWorld = vi.fn();
+const invoke = vi.fn();
+
+vi.mock('electron', () => ({
+  contextBridge: { exposeInMainWorld },
+  ipcRenderer: { invoke, send: vi.fn(), on: vi.fn() },
+}));
+
+describe('preload entry', () => {
+  beforeEach(() => {
+    vi.resetModules();
+    exposeInMainWorld.mockClear();
+    invoke.mockReset();
+  });
+
+  it('exposes one key, necroamp, with the exact narrow surface', async () => {
+    await import('./index');
+    expect(exposeInMainWorld).toHaveBeenCalledTimes(1);
+    const [key, api] = exposeInMainWorld.mock.calls[0] as [string, Record<string, unknown>];
+    expect(key).toBe('necroamp');
+    expect(Object.keys(api)).toEqual(['app']);
+    expect(Object.keys(api['app'] as object)).toEqual(['getInfo']);
+    expect(Object.isFrozen(api)).toBe(true);
+  });
+
+  it('does not expose ipcRenderer or its methods anywhere in the API', async () => {
+    await import('./index');
+    const [, api] = exposeInMainWorld.mock.calls[0] as [string, object];
+    const seen = JSON.stringify(Object.getOwnPropertyNames(api));
+    expect(seen).not.toMatch(/ipcRenderer|invoke|send/);
+  });
+
+  it('forwards getInfo to ipcRenderer.invoke on the app:get-info channel only', async () => {
+    invoke.mockResolvedValue({
+      ok: true,
+      data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' },
+    });
+    await import('./index');
+    const [, api] = exposeInMainWorld.mock.calls[0] as [
+      string,
+      { app: { getInfo: () => Promise<unknown> } },
+    ];
+    await api.app.getInfo();
+    expect(invoke).toHaveBeenCalledTimes(1);
+    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.appGetInfo);
+  });
+});
diff --git a/src/preload/index.ts b/src/preload/index.ts
new file mode 100644
index 0000000..379ea52
--- /dev/null
+++ b/src/preload/index.ts
@@ -0,0 +1,16 @@
+import { contextBridge, ipcRenderer } from 'electron';
+import { IPC_CHANNELS, type IpcChannel } from '@shared/ipc';
+import { createNecroampApi } from './create-necroamp-api';
+
+// Sandboxed preload: imports only `electron` and shared code, bundled into one CJS file (E-ESM-1).
+// Only channels present in IPC_CHANNELS can be invoked, and ipcRenderer itself is never exposed.
+const ALLOWED_CHANNELS: ReadonlySet<string> = new Set(Object.values(IPC_CHANNELS));
+
+const api = createNecroampApi((channel: IpcChannel) => {
+  if (!ALLOWED_CHANNELS.has(channel)) {
+    return Promise.reject(new Error('Channel not allowed'));
+  }
+  return ipcRenderer.invoke(channel);
+});
+
+contextBridge.exposeInMainWorld('necroamp', api);
diff --git a/src/preload/necroamp-window.d.ts b/src/preload/necroamp-window.d.ts
new file mode 100644
index 0000000..6098e24
--- /dev/null
+++ b/src/preload/necroamp-window.d.ts
@@ -0,0 +1,10 @@
+import type { NecroampApi } from '@shared/ipc';
+
+declare global {
+  interface Window {
+    /** Injected by the sandboxed preload through contextBridge. Responses must be parsed with the shared schemas. */
+    readonly necroamp: NecroampApi;
+  }
+}
+
+export {};
diff --git a/src/renderer/app/app-shell.module.css b/src/renderer/app/app-shell.module.css
new file mode 100644
index 0000000..298438d
--- /dev/null
+++ b/src/renderer/app/app-shell.module.css
@@ -0,0 +1,110 @@
+.shell {
+  display: grid;
+  grid-template-rows: auto minmax(0, 1fr);
+  height: 100%;
+  min-width: 0;
+  padding: var(--na-space-3);
+  gap: var(--na-space-3);
+}
+
+.header {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: baseline;
+  gap: var(--na-space-3) var(--na-space-5);
+  min-width: 0;
+  padding: var(--na-space-2) var(--na-space-3);
+  border: var(--na-border-width) solid var(--na-color-border-subtle);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface);
+}
+
+.header h1 {
+  font-size: var(--na-font-size-3);
+  letter-spacing: 0.08em;
+  text-transform: uppercase;
+}
+
+.header [data-part='tagline'] {
+  color: var(--na-color-text-muted);
+}
+
+.header [data-part='app-info'],
+.header [data-part='status-indicators'] {
+  min-width: 0;
+}
+
+.header [data-part='app-info'] {
+  margin-inline-start: auto;
+}
+
+.header dl {
+  display: flex;
+  flex-wrap: wrap;
+  gap: var(--na-space-2) var(--na-space-5);
+}
+
+.header dl > div {
+  display: flex;
+  gap: var(--na-space-2);
+  min-width: 0;
+}
+
+.header dt {
+  color: var(--na-color-text-muted);
+}
+
+.header dd {
+  overflow-wrap: anywhere;
+}
+
+.regions {
+  display: grid;
+  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.2fr) minmax(0, 1fr);
+  grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr) auto;
+  grid-template-areas:
+    'player        player        player'
+    'playlist      visualization equalizer'
+    'playlist      visualization equalizer'
+    'skin-selector skin-selector github';
+  gap: var(--na-space-3);
+  min-width: 0;
+  min-height: 0;
+}
+
+.regions > [data-region='player'] {
+  grid-area: player;
+}
+
+.regions > [data-region='playlist'] {
+  grid-area: playlist;
+}
+
+.regions > [data-region='visualization'] {
+  grid-area: visualization;
+}
+
+.regions > [data-region='equalizer'] {
+  grid-area: equalizer;
+}
+
+.regions > [data-region='skin-selector'] {
+  grid-area: skin-selector;
+}
+
+.regions > [data-region='github'] {
+  grid-area: github;
+}
+
+@media (max-width: 899px) {
+  .regions {
+    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
+    grid-template-rows: auto repeat(3, minmax(0, 1fr)) auto;
+    grid-template-areas:
+      'player        player'
+      'playlist      visualization'
+      'playlist      visualization'
+      'equalizer     equalizer'
+      'skin-selector github';
+  }
+}
diff --git a/src/renderer/app/app-shell.test.tsx b/src/renderer/app/app-shell.test.tsx
new file mode 100644
index 0000000..92df49e
--- /dev/null
+++ b/src/renderer/app/app-shell.test.tsx
@@ -0,0 +1,195 @@
+import { render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { describe, expect, it } from 'vitest';
+import {
+  createAppInfoStore,
+  type AppInfoClient,
+  type AppInfoClientResult,
+} from '@renderer/stores/app-info-store';
+import { AppShell } from './app-shell';
+import { REGION_IDS } from './shell-layout';
+import { STRINGS } from './strings/en';
+
+function renderShell(result: AppInfoClientResult | Promise<AppInfoClientResult>) {
+  const client: AppInfoClient = { getAppInfo: () => Promise.resolve(result) };
+  const store = createAppInfoStore(client);
+  return { store, ...render(<AppShell appInfoStore={store} />) };
+}
+
+const LOADED: AppInfoClientResult = {
+  ok: true,
+  data: { name: 'NecroAmp', version: '9.9.9', platform: 'win32' },
+};
+
+describe('AppShell structure', () => {
+  it('shows one h1, the exact tagline and one labelled region per id', async () => {
+    renderShell(LOADED);
+    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
+    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NecroAmp');
+    expect(screen.getByText('Code. Listen. Repeat.')).toBeInTheDocument();
+    for (const id of REGION_IDS) {
+      const region = screen.getByTestId(id);
+      expect(region.tagName).toBe('SECTION');
+      expect(screen.getByRole('region', { name: STRINGS.regions[id] })).toBe(region);
+    }
+    expect(await screen.findByText('9.9.9')).toBeInTheDocument();
+  });
+
+  it('has banner and main landmarks and six sections inside main', async () => {
+    renderShell(LOADED);
+    expect(screen.getByRole('banner')).toBeInTheDocument();
+    const main = screen.getByRole('main');
+    expect(main.querySelectorAll(':scope > section')).toHaveLength(6);
+    await screen.findByText('9.9.9');
+  });
+
+  it('keeps DOM order equal to the layout order', async () => {
+    renderShell(LOADED);
+    const ids = screen.getAllByRole('region').map((el) => el.getAttribute('data-region'));
+    expect(ids).toEqual([...REGION_IDS]);
+    await screen.findByText('9.9.9');
+  });
+
+  it('uses no inline style attributes (CSP)', async () => {
+    const { container } = renderShell(LOADED);
+    await screen.findByText('9.9.9');
+    expect(container.querySelector('[style]')).toBeNull();
+  });
+
+  it('shows ten labelled equalizer band placeholders that are not form controls', async () => {
+    renderShell(LOADED);
+    const eq = screen.getByTestId('equalizer');
+    for (let i = 1; i <= 10; i += 1) {
+      expect(within(eq).getByRole('group', { name: `Band ${i}` })).toBeInTheDocument();
+    }
+    expect(within(eq).queryAllByRole('slider')).toHaveLength(0);
+    expect(eq.querySelectorAll('input, button')).toHaveLength(0);
+    await screen.findByText('9.9.9');
+  });
+
+  it('shows spectrum and waveform panes without a canvas', async () => {
+    renderShell(LOADED);
+    const viz = screen.getByTestId('visualization');
+    expect(viz.querySelector('[data-part="spectrum"]')).not.toBeNull();
+    expect(viz.querySelector('[data-part="waveform"]')).not.toBeNull();
+    expect(viz.querySelector('canvas')).toBeNull();
+    await screen.findByText('9.9.9');
+  });
+
+  it('states that audio is not implemented and skins are a placeholder', async () => {
+    renderShell(LOADED);
+    const indicators = screen.getByRole('group', { name: STRINGS.header.statusLabel });
+    expect(within(indicators).getByText(STRINGS.header.audioEngineValue)).toBeInTheDocument();
+    expect(
+      within(screen.getByTestId('skin-selector')).getByText(STRINGS.skins.none),
+    ).toBeInTheDocument();
+    await screen.findByText('9.9.9');
+  });
+});
+
+describe('AppShell bridge states', () => {
+  it('shows version and platform when loaded', async () => {
+    renderShell(LOADED);
+    expect(await screen.findByText('Windows')).toBeInTheDocument();
+    expect(screen.getByText('9.9.9')).toBeInTheDocument();
+    expect(screen.getAllByRole('status')[0]).toHaveTextContent(STRINGS.bridgeStatus.loaded);
+  });
+
+  it('shows the unavailable state and still renders every region', async () => {
+    renderShell({ ok: false, reason: 'unavailable' });
+    expect(await screen.findByText(STRINGS.bridgeStatus.unavailable)).toBeInTheDocument();
+    for (const id of REGION_IDS) {
+      expect(screen.getByTestId(id)).toBeInTheDocument();
+    }
+  });
+
+  it.each(['rejected', 'invalid-response', 'ipc-error'] as const)(
+    'shows a plain failure for %s',
+    async (reason) => {
+      renderShell({ ok: false, reason });
+      const text = `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure[reason]}`;
+      expect(await screen.findByText(text)).toBeInTheDocument();
+    },
+  );
+
+  it('shows the loading state before the client resolves', () => {
+    const store = createAppInfoStore({ getAppInfo: () => new Promise(() => undefined) });
+    render(<AppShell appInfoStore={store} />);
+    expect(screen.getAllByRole('status')[0]).toHaveTextContent(STRINGS.bridgeStatus.loading);
+  });
+
+  it('loads only once under StrictMode', async () => {
+    let calls = 0;
+    const store = createAppInfoStore({
+      getAppInfo: () => {
+        calls += 1;
+        return Promise.resolve(LOADED);
+      },
+    });
+    const { StrictMode } = await import('react');
+    render(
+      <StrictMode>
+        <AppShell appInfoStore={store} />
+      </StrictMode>,
+    );
+    await screen.findByText('9.9.9');
+    expect(calls).toBe(1);
+  });
+});
+
+describe('AppShell placeholder controls', () => {
+  it('lists the five transport controls as unavailable but focusable', async () => {
+    renderShell(LOADED);
+    const transport = screen.getByRole('group', { name: STRINGS.player.transport });
+    const buttons = within(transport).getAllByRole('button');
+    expect(buttons.map((b) => b.textContent)).toEqual([
+      'Previous',
+      'Play',
+      'Pause',
+      'Stop',
+      'Next',
+    ]);
+    for (const button of buttons) {
+      expect(button).toHaveAttribute('aria-disabled', 'true');
+      expect(button).not.toBeDisabled();
+      expect(button).toHaveAccessibleDescription(STRINGS.notImplemented);
+    }
+    await screen.findByText('9.9.9');
+  });
+
+  it('updates the region status text on activation and changes nothing else', async () => {
+    renderShell(LOADED);
+    await screen.findByText('9.9.9');
+    const player = screen.getByTestId('player');
+    const status = within(player).getByRole('status');
+    expect(status).toBeEmptyDOMElement();
+    await userEvent.click(within(player).getByRole('button', { name: 'Play' }));
+    expect(status).toHaveTextContent('Play: not implemented in this phase.');
+    expect(within(player).getByText(STRINGS.player.noTrack)).toBeInTheDocument();
+  });
+
+  it('is operable by keyboard in DOM order', async () => {
+    renderShell(LOADED);
+    await screen.findByText('9.9.9');
+    await userEvent.tab();
+    expect(screen.getByRole('button', { name: 'Previous' })).toHaveFocus();
+    await userEvent.keyboard('{Enter}');
+    expect(within(screen.getByTestId('player')).getByRole('status')).toHaveTextContent(
+      'Previous: not implemented in this phase.',
+    );
+    await userEvent.tab();
+    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus();
+  });
+
+  it.each([
+    ['playlist', STRINGS.playlist.addFiles],
+    ['skin-selector', STRINGS.skins.choose],
+    ['github', STRINGS.github.signIn],
+  ] as const)('%s placeholder activation updates its status', async (id, label) => {
+    renderShell(LOADED);
+    await screen.findByText('9.9.9');
+    const region = screen.getByTestId(id);
+    await userEvent.click(within(region).getByRole('button', { name: label }));
+    expect(within(region).getByRole('status')).toHaveTextContent(STRINGS.activationMessage(label));
+  });
+});
diff --git a/src/renderer/app/app-shell.tsx b/src/renderer/app/app-shell.tsx
new file mode 100644
index 0000000..5d9d202
--- /dev/null
+++ b/src/renderer/app/app-shell.tsx
@@ -0,0 +1,91 @@
+import type { ComponentType } from 'react';
+import { EqualizerRegion } from '@renderer/features/equalizer';
+import { GithubRegion } from '@renderer/features/github';
+import { PlayerRegion } from '@renderer/features/player';
+import { PlaylistRegion } from '@renderer/features/playlist';
+import { SkinsRegion } from '@renderer/features/skins';
+import { VisualizerRegion } from '@renderer/features/visualizer';
+import { RegionBoundary } from '@renderer/components/region-boundary';
+import { RegionFrame } from '@renderer/components/region-frame';
+import { StatusText } from '@renderer/components/status-text';
+import type { AppInfoStore } from '@renderer/stores/app-info-store';
+import { FOUNDATION_LAYOUT, type RegionId } from './shell-layout';
+import { STRINGS } from './strings/en';
+import { useAppInfo } from './use-app-info';
+import styles from './app-shell.module.css';
+
+const REGION_COMPONENTS: Readonly<Record<RegionId, ComponentType>> = {
+  player: PlayerRegion,
+  playlist: PlaylistRegion,
+  equalizer: EqualizerRegion,
+  visualization: VisualizerRegion,
+  'skin-selector': SkinsRegion,
+  github: GithubRegion,
+};
+
+export interface AppShellProps {
+  readonly appInfoStore: AppInfoStore;
+}
+
+export function AppShell({ appInfoStore }: AppShellProps) {
+  const { status, data, failure } = useAppInfo(appInfoStore);
+  const bridgeText =
+    status === 'failed' && failure !== undefined
+      ? `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure[failure]}`
+      : STRINGS.bridgeStatus[status];
+  const tone = status === 'failed' ? 'danger' : status === 'unavailable' ? 'warning' : 'neutral';
+
+  return (
+    <div className={styles.shell} data-part="shell">
+      <header className={styles.header} data-part="header">
+        <h1>{STRINGS.appName}</h1>
+        <p data-part="tagline">{STRINGS.tagline}</p>
+        <div data-part="app-info" role="group" aria-label={STRINGS.header.appInfoLabel}>
+          {data === undefined ? null : (
+            <dl>
+              <div>
+                <dt>{STRINGS.header.version}</dt>
+                <dd data-part="app-version">{data.version}</dd>
+              </div>
+              <div>
+                <dt>{STRINGS.header.platform}</dt>
+                <dd data-part="app-platform">{STRINGS.platforms[data.platform]}</dd>
+              </div>
+            </dl>
+          )}
+        </div>
+        <div data-part="status-indicators" role="group" aria-label={STRINGS.header.statusLabel}>
+          <dl>
+            <div>
+              <dt>{STRINGS.header.bridge}</dt>
+              <dd>
+                <StatusText tone={tone}>{bridgeText}</StatusText>
+              </dd>
+            </div>
+            <div>
+              <dt>{STRINGS.header.audioEngine}</dt>
+              <dd>{STRINGS.header.audioEngineValue}</dd>
+            </div>
+          </dl>
+        </div>
+      </header>
+      <main className={styles.regions} data-part="regions">
+        {FOUNDATION_LAYOUT.order.map((id) => {
+          const Region = REGION_COMPONENTS[id];
+          return (
+            <RegionBoundary
+              key={id}
+              fallback={
+                <RegionFrame id={id} titleId={`${id}-heading`} heading={STRINGS.regions[id]}>
+                  <p role="alert">{STRINGS.regionFailed}</p>
+                </RegionFrame>
+              }
+            >
+              <Region />
+            </RegionBoundary>
+          );
+        })}
+      </main>
+    </div>
+  );
+}
diff --git a/src/renderer/app/bridge/necroamp-client.property.test.ts b/src/renderer/app/bridge/necroamp-client.property.test.ts
new file mode 100644
index 0000000..09a9d80
--- /dev/null
+++ b/src/renderer/app/bridge/necroamp-client.property.test.ts
@@ -0,0 +1,98 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { appInfoResponseSchema } from '@shared/ipc';
+import { createNecroampClient } from './necroamp-client';
+
+// T6.1 / R4.9: the renderer adapter treats the bridge as untrusted. For any host and any response it
+// either returns validated data or a typed failure. It never throws and never leaks the raw value.
+const FAILURE_REASONS = ['unavailable', 'rejected', 'invalid-response', 'ipc-error'];
+
+const jsonish: fc.Arbitrary<unknown> = fc.oneof(
+  fc.anything(),
+  fc.constant(null),
+  fc.constant(undefined),
+  fc.constant({ ok: true }),
+  fc.constant({ ok: true, data: { name: 'NecroAmp', version: '1', platform: 'plan9' } }),
+  fc.constant({ ok: false, error: { code: 'NOPE' } }),
+  fc.constant(JSON.parse('{"__proto__":{"ok":true},"ok":true,"data":{}}') as unknown),
+  fc.record({ ok: fc.boolean(), data: fc.anything(), error: fc.anything() }),
+);
+
+describe('createNecroampClient properties', () => {
+  it('never throws for any bridge value, and unusable bridges are "unavailable"', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.anything(), async (bridge) => {
+        const usable =
+          typeof bridge === 'object' &&
+          bridge !== null &&
+          typeof (bridge as { app?: { getInfo?: unknown } }).app?.getInfo === 'function';
+        const result = await createNecroampClient({ necroamp: bridge }).getAppInfo();
+        if (!usable) expect(result).toEqual({ ok: false, reason: 'unavailable' });
+        else expect(typeof result.ok).toBe('boolean');
+      }),
+    );
+  });
+
+  it('for any response: ok only when the shared schema accepts it, otherwise a typed failure', async () => {
+    await fc.assert(
+      fc.asyncProperty(jsonish, async (response) => {
+        const host = { necroamp: { app: { getInfo: () => Promise.resolve(response) } } };
+        const result = await createNecroampClient(host).getAppInfo();
+        const parsed = appInfoResponseSchema.safeParse(response);
+        if (parsed.success && parsed.data.ok) {
+          expect(result).toEqual({ ok: true, data: parsed.data.data });
+        } else {
+          expect(result.ok).toBe(false);
+          if (!result.ok) {
+            expect(FAILURE_REASONS).toContain(result.reason);
+            expect(result.reason).toBe(parsed.success ? 'ipc-error' : 'invalid-response');
+          }
+        }
+      }),
+    );
+  });
+
+  it('turns any rejection or synchronous throw into "rejected" without exposing the error', async () => {
+    await fc.assert(
+      fc.asyncProperty(fc.anything(), fc.boolean(), async (reason, sync) => {
+        const getInfo = (): Promise<unknown> => {
+          if (sync) throw reason;
+          return Promise.reject(reason);
+        };
+        const result = await createNecroampClient({ necroamp: { app: { getInfo } } }).getAppInfo();
+        expect(result).toEqual({ ok: false, reason: 'rejected' });
+      }),
+    );
+  });
+
+  it('does not mutate or retain the bridge response', async () => {
+    const response = Object.freeze({
+      ok: true,
+      data: Object.freeze({ name: 'NecroAmp', version: '0.0.1', platform: 'linux' }),
+    });
+    const result = await createNecroampClient({
+      necroamp: { app: { getInfo: () => Promise.resolve(response) } },
+    }).getAppInfo();
+    expect(result).toEqual({ ok: true, data: response.data });
+  });
+});
+
+describe('regression: unexpected shapes (examples)', () => {
+  it.each([
+    ['null', null],
+    ['string', 'ok'],
+    [
+      'extra key',
+      { ok: true, data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' }, extra: 1 },
+    ],
+    [
+      'unknown platform',
+      { ok: true, data: { name: 'NecroAmp', version: '1.0.0', platform: 'freebsd' } },
+    ],
+  ])('%s is handled without throwing', async (_name, response) => {
+    const result = await createNecroampClient({
+      necroamp: { app: { getInfo: () => Promise.resolve(response) } },
+    }).getAppInfo();
+    expect(typeof result.ok).toBe('boolean');
+  });
+});
diff --git a/src/renderer/app/bridge/necroamp-client.test.ts b/src/renderer/app/bridge/necroamp-client.test.ts
new file mode 100644
index 0000000..39c1866
--- /dev/null
+++ b/src/renderer/app/bridge/necroamp-client.test.ts
@@ -0,0 +1,82 @@
+import { describe, expect, it, vi } from 'vitest';
+import { createNecroampClient } from './necroamp-client';
+
+const GOOD = { name: 'NecroAmp', version: '0.0.0', platform: 'win32' } as const;
+
+function hostWith(getInfo: () => unknown) {
+  return { necroamp: { app: { getInfo } } };
+}
+
+describe('createNecroampClient', () => {
+  it('reports unavailable when the bridge is missing', async () => {
+    expect(await createNecroampClient({}).getAppInfo()).toEqual({
+      ok: false,
+      reason: 'unavailable',
+    });
+  });
+
+  it.each([null, 'x', 1, {}, { app: null }, { app: {} }, { app: { getInfo: 'nope' } }])(
+    'reports unavailable for a malformed bridge %j',
+    async (bridge) => {
+      const result = await createNecroampClient({ necroamp: bridge }).getAppInfo();
+      expect(result).toEqual({ ok: false, reason: 'unavailable' });
+    },
+  );
+
+  it('returns parsed data for a valid success response', async () => {
+    const client = createNecroampClient(hostWith(() => Promise.resolve({ ok: true, data: GOOD })));
+    expect(await client.getAppInfo()).toEqual({ ok: true, data: GOOD });
+  });
+
+  it('maps an ok:false envelope to ipc-error with its code', async () => {
+    const error = { code: 'INVALID_SENDER', message: 'The request came from an untrusted sender.' };
+    const client = createNecroampClient(hostWith(() => Promise.resolve({ ok: false, error })));
+    expect(await client.getAppInfo()).toEqual({
+      ok: false,
+      reason: 'ipc-error',
+      code: 'INVALID_SENDER',
+    });
+  });
+
+  it.each([
+    ['null', null],
+    ['a string', 'ok'],
+    ['an unknown field', { ok: true, data: GOOD, extra: 1 }],
+    ['an unknown data field', { ok: true, data: { ...GOOD, path: 'C:/x' } }],
+    ['a bad platform', { ok: true, data: { ...GOOD, platform: 'freebsd' } }],
+    ['a missing version', { ok: true, data: { name: 'NecroAmp', platform: 'linux' } }],
+    ['an unknown error code', { ok: false, error: { code: 'OTHER', message: 'x' } }],
+  ])('rejects %s as invalid-response', async (_label, value) => {
+    const client = createNecroampClient(hostWith(() => Promise.resolve(value)));
+    expect(await client.getAppInfo()).toEqual({ ok: false, reason: 'invalid-response' });
+  });
+
+  it('maps a rejection to rejected without leaking the error', async () => {
+    const client = createNecroampClient(
+      hostWith(() => Promise.reject(new Error('C:/secret/path'))),
+    );
+    const result = await client.getAppInfo();
+    expect(result).toEqual({ ok: false, reason: 'rejected' });
+    expect(JSON.stringify(result)).not.toContain('secret');
+  });
+
+  it('maps a synchronous throw to rejected', async () => {
+    const client = createNecroampClient(
+      hostWith(() => {
+        throw new Error('boom');
+      }),
+    );
+    expect(await client.getAppInfo()).toEqual({ ok: false, reason: 'rejected' });
+  });
+
+  it('calls getInfo with no arguments and keeps the namespace as this', async () => {
+    const getInfo = vi.fn(function (this: unknown, ...args: unknown[]) {
+      expect(args).toHaveLength(0);
+      expect(this).toBe(app);
+      return Promise.resolve({ ok: true, data: GOOD });
+    });
+    const app = { getInfo };
+    await createNecroampClient({ necroamp: { app } }).getAppInfo();
+    expect(getInfo).toHaveBeenCalledTimes(1);
+  });
+});
diff --git a/src/renderer/app/bridge/necroamp-client.ts b/src/renderer/app/bridge/necroamp-client.ts
new file mode 100644
index 0000000..f36cb06
--- /dev/null
+++ b/src/renderer/app/bridge/necroamp-client.ts
@@ -0,0 +1,56 @@
+import { appInfoResponseSchema } from '@shared/ipc';
+import type { AppInfoClient, AppInfoClientResult } from '@renderer/stores/app-info-store';
+
+/**
+ * The only module that reads `window.necroamp` (R4.9). The host is a parameter so tests
+ * pass a fake. The bridge value is untrusted: it is narrowed from `unknown`, and every
+ * response is parsed with the shared schema before use.
+ */
+export interface BridgeHost {
+  readonly necroamp?: unknown;
+}
+
+type GetInfo = () => Promise<unknown>;
+
+function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
+  return typeof value === 'object' && value !== null;
+}
+
+function readGetInfo(host: BridgeHost): GetInfo | undefined {
+  const bridge = host.necroamp;
+  if (!isRecord(bridge)) {
+    return undefined;
+  }
+  const app = bridge['app'];
+  if (!isRecord(app) || typeof app['getInfo'] !== 'function') {
+    return undefined;
+  }
+  // Call through the namespace object so `this` is preserved. The result is parsed below.
+  return () => Promise.resolve((app['getInfo'] as GetInfo)());
+}
+
+export function createNecroampClient(host: BridgeHost): AppInfoClient {
+  return {
+    getAppInfo: async (): Promise<AppInfoClientResult> => {
+      const getInfo = readGetInfo(host);
+      if (getInfo === undefined) {
+        return { ok: false, reason: 'unavailable' };
+      }
+      let raw: unknown;
+      try {
+        raw = await getInfo();
+      } catch {
+        // The error object is deliberately dropped: it may carry paths or internals.
+        return { ok: false, reason: 'rejected' };
+      }
+      const parsed = appInfoResponseSchema.safeParse(raw);
+      if (!parsed.success) {
+        return { ok: false, reason: 'invalid-response' };
+      }
+      if (!parsed.data.ok) {
+        return { ok: false, reason: 'ipc-error', code: parsed.data.error.code };
+      }
+      return { ok: true, data: parsed.data.data };
+    },
+  };
+}
diff --git a/src/renderer/app/shell-layout.test.ts b/src/renderer/app/shell-layout.test.ts
new file mode 100644
index 0000000..1803471
--- /dev/null
+++ b/src/renderer/app/shell-layout.test.ts
@@ -0,0 +1,39 @@
+import { describe, expect, it } from 'vitest';
+import { FOUNDATION_LAYOUT, REGION_IDS } from './shell-layout';
+import { STRINGS } from './strings/en';
+
+describe('FOUNDATION_LAYOUT', () => {
+  it('lists the six stable region ids in order', () => {
+    expect(REGION_IDS).toEqual([
+      'player',
+      'playlist',
+      'equalizer',
+      'visualization',
+      'skin-selector',
+      'github',
+    ]);
+    expect(FOUNDATION_LAYOUT.order).toEqual(REGION_IDS);
+  });
+
+  it('names a distinct grid area for every region and holds no style values', () => {
+    const areas = REGION_IDS.map((id) => FOUNDATION_LAYOUT.areas[id]);
+    expect(new Set(areas).size).toBe(REGION_IDS.length);
+    expect(JSON.stringify(FOUNDATION_LAYOUT)).not.toMatch(/#[0-9a-f]{3,8}|px|url\(/i);
+  });
+
+  it('has a heading string for each region', () => {
+    for (const id of REGION_IDS) {
+      expect(STRINGS.regions[id].length).toBeGreaterThan(0);
+    }
+  });
+});
+
+describe('STRINGS', () => {
+  it('keeps the exact tagline', () => {
+    expect(STRINGS.tagline).toBe('Code. Listen. Repeat.');
+  });
+
+  it('has ten equalizer frequencies', () => {
+    expect(STRINGS.equalizer.frequencies).toHaveLength(10);
+  });
+});
diff --git a/src/renderer/app/shell-layout.ts b/src/renderer/app/shell-layout.ts
new file mode 100644
index 0000000..ace5cfa
--- /dev/null
+++ b/src/renderer/app/shell-layout.ts
@@ -0,0 +1,27 @@
+import { REGION_IDS, type RegionId } from '@renderer/components/region-frame';
+
+export { REGION_IDS, type RegionId };
+
+/**
+ * Which regions exist and in which order. `order` is the DOM, reading and tab order.
+ * `areas` are CSS grid-area names applied by the CSS Module through `data-region`.
+ * No pixels, colors or asset paths belong here. Only FOUNDATION_LAYOUT is approved.
+ */
+export interface LayoutDescriptor {
+  readonly id: string;
+  readonly order: readonly RegionId[];
+  readonly areas: Readonly<Record<RegionId, string>>;
+}
+
+export const FOUNDATION_LAYOUT: LayoutDescriptor = {
+  id: 'foundation',
+  order: REGION_IDS,
+  areas: {
+    player: 'player',
+    playlist: 'playlist',
+    equalizer: 'equalizer',
+    visualization: 'visualization',
+    'skin-selector': 'skin-selector',
+    github: 'github',
+  },
+};
diff --git a/src/renderer/app/strings/en.ts b/src/renderer/app/strings/en.ts
new file mode 100644
index 0000000..d4203bd
--- /dev/null
+++ b/src/renderer/app/strings/en.ts
@@ -0,0 +1,103 @@
+import type { Platform } from '@shared/ipc';
+import type { AppInfoFailureReason, AppInfoStatus } from '@renderer/stores/app-info-store';
+import type { RegionId } from '@renderer/components/region-frame';
+
+/** All user-facing text. Keys are stable ids so a later i18n layer can replace this file. */
+export const STRINGS = {
+  appName: 'NecroAmp',
+  tagline: 'Code. Listen. Repeat.',
+  notImplemented: 'Not implemented in this phase',
+  notAvailable: 'Not available',
+  activationMessage: (label: string): string => `${label}: not implemented in this phase.`,
+  regionFailed: 'This section failed to load. The rest of the application is still usable.',
+  header: {
+    appInfoLabel: 'Application information',
+    statusLabel: 'Status indicators',
+    version: 'Version',
+    platform: 'Platform',
+    bridge: 'Application bridge',
+    audioEngine: 'Audio engine',
+    audioEngineValue: 'Not implemented in this phase',
+  },
+  bridgeStatus: {
+    idle: 'Waiting to start',
+    loading: 'Loading application information',
+    loaded: 'Connected',
+    failed: 'Application information could not be loaded',
+    unavailable: 'The application bridge is unavailable. Running without it.',
+  } satisfies Record<AppInfoStatus, string>,
+  bridgeFailure: {
+    unavailable: 'The application bridge is unavailable. Running without it.',
+    rejected: 'The application did not respond.',
+    'invalid-response': 'The application returned an unexpected response.',
+    'ipc-error': 'The application refused the request.',
+  } satisfies Record<AppInfoFailureReason, string>,
+  platforms: {
+    win32: 'Windows',
+    darwin: 'macOS',
+    linux: 'Linux',
+  } satisfies Record<Platform, string>,
+  regions: {
+    player: 'Player',
+    playlist: 'Playlist',
+    equalizer: 'Equalizer',
+    visualization: 'Visualizer',
+    'skin-selector': 'Skins',
+    github: 'GitHub (optional)',
+  } satisfies Record<RegionId, string>,
+  player: {
+    nowPlaying: 'Now playing',
+    transport: 'Transport controls',
+    titleLabel: 'Title',
+    artistLabel: 'Artist',
+    positionLabel: 'Position',
+    noTrack: 'No track loaded',
+    noArtist: 'Unknown',
+    controls: {
+      previous: 'Previous',
+      play: 'Play',
+      pause: 'Pause',
+      stop: 'Stop',
+      next: 'Next',
+    },
+  },
+  playlist: {
+    empty: 'The playlist is empty. Playlists are not implemented in this phase.',
+    addFiles: 'Add files',
+    savePlaylist: 'Save playlist',
+    listLabel: 'Playlist items',
+  },
+  equalizer: {
+    bands: 'Equalizer bands',
+    band: (index: number): string => `Band ${index}`,
+    frequencies: [
+      '31 Hz',
+      '62 Hz',
+      '125 Hz',
+      '250 Hz',
+      '500 Hz',
+      '1 kHz',
+      '2 kHz',
+      '4 kHz',
+      '8 kHz',
+      '16 kHz',
+    ],
+    unavailable: 'Equalizer is not implemented in this phase. No audio is processed.',
+  },
+  visualizer: {
+    spectrum: 'Spectrum',
+    waveform: 'Waveform',
+    unavailable: 'Visualizations are not implemented in this phase. There is no audio to show.',
+  },
+  skins: {
+    none: 'No skins are available. Skin selection is not implemented in this phase.',
+    choose: 'Choose skin',
+    selectLabel: 'Skin',
+    foundationDefault: 'Foundation default',
+  },
+  github: {
+    optional: 'GitHub features are optional. NecroAmp works fully without signing in.',
+    signIn: 'Sign in with GitHub',
+    status: 'Not signed in',
+  },
+} as const;
diff --git a/src/renderer/app/styles/global.css b/src/renderer/app/styles/global.css
new file mode 100644
index 0000000..5183653
--- /dev/null
+++ b/src/renderer/app/styles/global.css
@@ -0,0 +1,43 @@
+/* Global reset and base (T5.2). Imported once from main.tsx after tokens.css (no @import). Semantic tokens only. */
+*,
+*::before,
+*::after {
+  box-sizing: border-box;
+}
+
+html,
+body,
+#root {
+  height: 100%;
+  margin: 0;
+}
+
+body {
+  min-width: 800px;
+  min-height: 600px;
+  background: var(--na-color-app-bg);
+  color: var(--na-color-text);
+  font-family: var(--na-font-family-ui);
+  font-size: var(--na-font-size-2);
+  line-height: 1.4;
+  overflow: hidden;
+}
+
+h1,
+h2,
+p,
+dl,
+dd {
+  margin: 0;
+}
+
+:focus-visible {
+  outline: var(--na-focus-ring-width) solid var(--na-color-focus);
+  outline-offset: var(--na-focus-ring-offset);
+}
+
+@media (forced-colors: active) {
+  :focus-visible {
+    outline-color: Highlight;
+  }
+}
diff --git a/src/renderer/app/styles/tokens.css b/src/renderer/app/styles/tokens.css
new file mode 100644
index 0000000..ef791b3
--- /dev/null
+++ b/src/renderer/app/styles/tokens.css
@@ -0,0 +1,52 @@
+/* Foundation tokens (T5.1). Neutral theme: not Morgul Revenant, not Analog 1984.
+   Tier 1 raw values are referenced only by tier 2. Components use tier 2 only.
+   A skin later overrides tier 2 through setProperty('--na-*'). */
+:root {
+  --na-raw-ink-0: #0d1012;
+  --na-raw-ink-1: #121417;
+  --na-raw-ink-2: #1a1d21;
+  --na-raw-ink-3: #232830;
+  --na-raw-line-1: #2c323b;
+  --na-raw-line-2: #6b7482;
+  --na-raw-fog-1: #e6e9ee;
+  --na-raw-fog-2: #9aa3ae;
+  --na-raw-fog-3: #7a8391;
+  --na-raw-teal: #5cc8c0;
+  --na-raw-blue: #7fb4ff;
+  --na-raw-red: #ff8a80;
+  --na-raw-amber: #f0c674;
+
+  --na-color-app-bg: var(--na-raw-ink-1);
+  --na-color-surface: var(--na-raw-ink-2);
+  --na-color-surface-raised: var(--na-raw-ink-3);
+  --na-color-surface-inset: var(--na-raw-ink-0);
+  --na-color-border-subtle: var(--na-raw-line-1);
+  --na-color-border-control: var(--na-raw-line-2);
+  --na-color-text: var(--na-raw-fog-1);
+  --na-color-text-muted: var(--na-raw-fog-2);
+  --na-color-text-disabled: var(--na-raw-fog-3);
+  --na-color-accent: var(--na-raw-teal);
+  --na-color-on-accent: var(--na-raw-ink-0);
+  --na-color-focus: var(--na-raw-blue);
+  --na-color-danger: var(--na-raw-red);
+  --na-color-warning: var(--na-raw-amber);
+
+  --na-space-1: 2px;
+  --na-space-2: 4px;
+  --na-space-3: 8px;
+  --na-space-4: 12px;
+  --na-space-5: 16px;
+  --na-space-6: 24px;
+  --na-radius-1: 2px;
+  --na-radius-2: 4px;
+  --na-border-width: 1px;
+  --na-focus-ring-width: 2px;
+  --na-focus-ring-offset: 2px;
+  --na-control-size: 36px;
+  --na-font-size-1: 11px;
+  --na-font-size-2: 12px;
+  --na-font-size-3: 14px;
+  --na-font-size-4: 20px;
+  --na-font-family-ui: system-ui, 'Segoe UI', Roboto, sans-serif;
+  --na-font-family-mono: ui-monospace, 'Cascadia Mono', Consolas, monospace;
+}
diff --git a/src/renderer/app/theme/contrast.property.test.ts b/src/renderer/app/theme/contrast.property.test.ts
new file mode 100644
index 0000000..298539a
--- /dev/null
+++ b/src/renderer/app/theme/contrast.property.test.ts
@@ -0,0 +1,98 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import { contrastRatio, parseHexColor, readCustomProperties, relativeLuminance } from './contrast';
+
+// R12.2, R9.4: property tests for the contrast function. Run count and seed reporting come from tests/setup.
+const channel = fc.integer({ min: 0, max: 255 });
+const rgb = fc.tuple(channel, channel, channel);
+const hex = (c: readonly [number, number, number]): string =>
+  `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
+
+describe('contrast function properties', () => {
+  it('is symmetric and always within [1, 21]', () => {
+    fc.assert(
+      fc.property(rgb, rgb, (a, b) => {
+        const ratio = contrastRatio(a, b);
+        expect(ratio).toBeCloseTo(contrastRatio(b, a), 10);
+        expect(ratio).toBeGreaterThanOrEqual(1);
+        expect(ratio).toBeLessThanOrEqual(21 + 1e-9);
+      }),
+    );
+  });
+
+  it('is exactly 1 for identical colors', () => {
+    fc.assert(fc.property(rgb, (a) => contrastRatio(a, a) === 1));
+  });
+
+  it('luminance lies in [0, 1] and is monotonic when one channel grows', () => {
+    fc.assert(
+      fc.property(rgb, fc.integer({ min: 0, max: 2 }), (c, index) => {
+        const lum = relativeLuminance(c);
+        expect(lum).toBeGreaterThanOrEqual(0);
+        expect(lum).toBeLessThanOrEqual(1);
+        const brighter: [number, number, number] = [c[0], c[1], c[2]];
+        brighter[index] = 255;
+        expect(relativeLuminance(brighter)).toBeGreaterThanOrEqual(lum);
+      }),
+    );
+  });
+
+  it('black against any color is at least as contrasting as any darker pair member', () => {
+    fc.assert(
+      fc.property(rgb, rgb, (a, b) => {
+        const white: [number, number, number] = [255, 255, 255];
+        expect(contrastRatio(white, [0, 0, 0])).toBeGreaterThanOrEqual(contrastRatio(a, b) - 1e-9);
+      }),
+    );
+  });
+
+  it('parseHexColor round-trips every #rrggbb, in either case and with padding', () => {
+    fc.assert(
+      fc.property(rgb, fc.boolean(), (c, upper) => {
+        const text = upper ? hex(c).toUpperCase() : hex(c);
+        expect(parseHexColor(`  ${text} `)).toEqual(c);
+      }),
+    );
+  });
+
+  it('parseHexColor never throws and accepts nothing but #rrggbb', () => {
+    fc.assert(
+      fc.property(fc.string({ unit: 'binary' }), (text) => {
+        const parsed = parseHexColor(text);
+        if (parsed !== undefined) expect(text.trim()).toMatch(/^#[0-9a-f]{6}$/i);
+      }),
+    );
+  });
+
+  it('readCustomProperties never throws on arbitrary text, including prototype keys', () => {
+    fc.assert(
+      fc.property(
+        fc.oneof(
+          fc.string({ unit: 'binary' }),
+          fc.constant('--__proto__: #000000; --constructor: var(--constructor); --a: var(--a);'),
+          fc
+            .array(fc.tuple(fc.stringMatching(/^--[a-z0-9-]{1,6}$/), fc.string()), { maxLength: 8 })
+            .map((entries) =>
+              entries.map(([name, value]) => `${name}: ${value.replaceAll(';', '')};`).join('\n'),
+            ),
+        ),
+        (css) => {
+          const map = readCustomProperties(css);
+          for (const [name, value] of map) {
+            expect(name.startsWith('--')).toBe(true);
+            expect(typeof value).toBe('string');
+          }
+        },
+      ),
+    );
+  });
+
+  it('resolves var() chains to the terminal value and leaves cycles unresolved', () => {
+    expect(readCustomProperties('--a: #112233; --b: var(--a); --c: var(--b);').get('--c')).toBe(
+      '#112233',
+    );
+    expect(
+      parseHexColor(readCustomProperties('--x: var(--y); --y: var(--x);').get('--x') ?? ''),
+    ).toBeUndefined();
+  });
+});
diff --git a/src/renderer/app/theme/contrast.test.ts b/src/renderer/app/theme/contrast.test.ts
new file mode 100644
index 0000000..0a3466a
--- /dev/null
+++ b/src/renderer/app/theme/contrast.test.ts
@@ -0,0 +1,88 @@
+import { readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { describe, expect, it } from 'vitest';
+import { contrastRatio, parseHexColor, readCustomProperties, type Rgb } from './contrast';
+
+// Vitest runs from the repository root (jsdom has no file: import.meta.url).
+const RENDERER_ROOT = join(process.cwd(), 'src', 'renderer');
+const tokensCss = readFileSync(join(RENDERER_ROOT, 'app', 'styles', 'tokens.css'), 'utf8');
+const tokens = readCustomProperties(tokensCss);
+
+function color(name: string): Rgb {
+  const parsed = parseHexColor(tokens.get(name) ?? '');
+  if (parsed === undefined) {
+    throw new Error(`Token ${name} does not resolve to a hex color.`);
+  }
+  return parsed;
+}
+
+describe('contrast helpers', () => {
+  it('computes the extremes', () => {
+    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
+    expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBeCloseTo(1, 5);
+  });
+
+  it('is symmetric', () => {
+    expect(contrastRatio([1, 2, 3], [200, 100, 50])).toBeCloseTo(
+      contrastRatio([200, 100, 50], [1, 2, 3]),
+      10,
+    );
+  });
+
+  it('parses only #rrggbb', () => {
+    expect(parseHexColor('#0d1012')).toEqual([13, 16, 18]);
+    expect(parseHexColor('red')).toBeUndefined();
+    expect(parseHexColor('#fff')).toBeUndefined();
+  });
+});
+
+describe('foundation tokens (R9.3, R9.4)', () => {
+  const textPairs: ReadonlyArray<readonly [string, string]> = [
+    ['--na-color-text', '--na-color-app-bg'],
+    ['--na-color-text', '--na-color-surface'],
+    ['--na-color-text', '--na-color-surface-raised'],
+    ['--na-color-text', '--na-color-surface-inset'],
+    ['--na-color-text-muted', '--na-color-app-bg'],
+    ['--na-color-text-muted', '--na-color-surface'],
+    ['--na-color-text-muted', '--na-color-surface-raised'],
+    ['--na-color-text-muted', '--na-color-surface-inset'],
+    ['--na-color-accent', '--na-color-surface'],
+    ['--na-color-accent', '--na-color-surface-inset'],
+    ['--na-color-on-accent', '--na-color-accent'],
+    ['--na-color-danger', '--na-color-surface'],
+    ['--na-color-warning', '--na-color-surface'],
+    ['--na-color-warning', '--na-color-app-bg'],
+  ];
+  it.each(textPairs)('text %s on %s is at least 4.5:1', (fg, bg) => {
+    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
+  });
+
+  const nonTextPairs: ReadonlyArray<readonly [string, string]> = [
+    ['--na-color-border-control', '--na-color-surface'],
+    ['--na-color-border-control', '--na-color-surface-raised'],
+    ['--na-color-border-control', '--na-color-surface-inset'],
+    ['--na-color-focus', '--na-color-app-bg'],
+    ['--na-color-focus', '--na-color-surface'],
+    ['--na-color-focus', '--na-color-surface-raised'],
+  ];
+  it.each(nonTextPairs)('indicator %s on %s is at least 3:1', (fg, bg) => {
+    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(3);
+  });
+});
+
+describe('styling rules (T5.3)', () => {
+  it('components never reference raw palette tokens or literal colors', async () => {
+    const { readdirSync } = await import('node:fs');
+    const root = RENDERER_ROOT;
+    const files = (readdirSync(root, { recursive: true }) as string[]).filter((f) =>
+      f.endsWith('.module.css'),
+    );
+    expect(files.length).toBeGreaterThanOrEqual(10);
+    for (const file of files) {
+      const css = readFileSync(`${root}/${file}`, 'utf8');
+      expect(css, file).not.toMatch(/#[0-9a-f]{3,8}\b/i);
+      expect(css, file).not.toMatch(/--na-raw-/);
+      expect(css, file).not.toMatch(/@import|url\(/);
+    }
+  });
+});
diff --git a/src/renderer/app/theme/contrast.ts b/src/renderer/app/theme/contrast.ts
new file mode 100644
index 0000000..d5ee896
--- /dev/null
+++ b/src/renderer/app/theme/contrast.ts
@@ -0,0 +1,65 @@
+/** Pure WCAG 2.x contrast helpers. No DOM, no React. */
+
+const HEX_COLOR = /^#([0-9a-f]{6})$/i;
+
+export type Rgb = readonly [number, number, number];
+
+/** Parses `#rrggbb`. Returns undefined for any other input. */
+export function parseHexColor(value: string): Rgb | undefined {
+  const match = HEX_COLOR.exec(value.trim());
+  const digits = match?.[1];
+  if (digits === undefined) {
+    return undefined;
+  }
+  return [
+    Number.parseInt(digits.slice(0, 2), 16),
+    Number.parseInt(digits.slice(2, 4), 16),
+    Number.parseInt(digits.slice(4, 6), 16),
+  ];
+}
+
+function linearize(channel: number): number {
+  const c = channel / 255;
+  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
+}
+
+export function relativeLuminance([r, g, b]: Rgb): number {
+  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
+}
+
+/** Contrast ratio in the range 1 to 21. Symmetric in its arguments. */
+export function contrastRatio(a: Rgb, b: Rgb): number {
+  const la = relativeLuminance(a);
+  const lb = relativeLuminance(b);
+  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
+}
+
+/**
+ * Reads `--name: value;` declarations from CSS text and resolves `var(--other)` chains.
+ * Only the first declaration of a name is used. Returns hex strings for resolvable names.
+ */
+export function readCustomProperties(css: string): ReadonlyMap<string, string> {
+  const raw = new Map<string, string>();
+  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
+    const name = match[1];
+    const value = match[2];
+    if (name !== undefined && value !== undefined && !raw.has(name)) {
+      raw.set(name, value.trim());
+    }
+  }
+  const resolved = new Map<string, string>();
+  for (const name of raw.keys()) {
+    let value = raw.get(name);
+    for (let depth = 0; depth < 8 && value !== undefined; depth += 1) {
+      const ref = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
+      if (ref?.[1] === undefined) {
+        break;
+      }
+      value = raw.get(ref[1]);
+    }
+    if (value !== undefined) {
+      resolved.set(name, value);
+    }
+  }
+  return resolved;
+}
diff --git a/src/renderer/app/use-app-info.ts b/src/renderer/app/use-app-info.ts
new file mode 100644
index 0000000..cd4acb4
--- /dev/null
+++ b/src/renderer/app/use-app-info.ts
@@ -0,0 +1,23 @@
+import { useEffect } from 'react';
+import { useStore } from 'zustand';
+import type { AppInfoState, AppInfoStore } from '@renderer/stores/app-info-store';
+
+/** Binds an injected store, starts loading once on mount, returns narrow slices. */
+export function useAppInfo(store: AppInfoStore): {
+  readonly status: AppInfoState['status'];
+  readonly data: AppInfoState['data'];
+  readonly failure: AppInfoState['failure'];
+} {
+  const status = useStore(store, (state) => state.status);
+  const data = useStore(store, (state) => state.data);
+  const failure = useStore(store, (state) => state.failure);
+
+  useEffect(() => {
+    // StrictMode runs effects twice in development. Only the first call starts a load.
+    if (store.getState().status === 'idle') {
+      void store.getState().load();
+    }
+  }, [store]);
+
+  return { status, data, failure };
+}
diff --git a/src/renderer/components/components.test.tsx b/src/renderer/components/components.test.tsx
new file mode 100644
index 0000000..659af9a
--- /dev/null
+++ b/src/renderer/components/components.test.tsx
@@ -0,0 +1,86 @@
+import { render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { describe, expect, it, vi } from 'vitest';
+import { ControlButton } from './control-button';
+import { RegionBoundary } from './region-boundary';
+import { RegionFrame } from './region-frame';
+import { StatusText } from './status-text';
+
+describe('ControlButton', () => {
+  it('is a focusable native button that uses aria-disabled, not disabled, when unavailable', async () => {
+    const onActivate = vi.fn();
+    render(
+      <>
+        <ControlButton label="Play" unavailable describedBy="note" onActivate={onActivate} />
+        <p id="note">Not implemented</p>
+      </>,
+    );
+    const button = screen.getByRole('button', { name: 'Play' });
+    expect(button).toHaveAttribute('aria-disabled', 'true');
+    expect(button).not.toBeDisabled();
+    expect(button).toHaveAccessibleDescription('Not implemented');
+    await userEvent.tab();
+    expect(button).toHaveFocus();
+    await userEvent.keyboard('{Enter}');
+    await userEvent.keyboard(' ');
+    await userEvent.click(button);
+    expect(onActivate).toHaveBeenCalledTimes(3);
+  });
+
+  it('omits aria-disabled when available', () => {
+    render(<ControlButton label="Go" onActivate={() => undefined} />);
+    expect(screen.getByRole('button', { name: 'Go' })).not.toHaveAttribute('aria-disabled');
+  });
+});
+
+describe('RegionFrame', () => {
+  it('renders a section labelled by its heading with stable hooks', () => {
+    render(
+      <RegionFrame id="player" titleId="player-heading" heading="Player">
+        <p>body</p>
+      </RegionFrame>,
+    );
+    const section = screen.getByRole('region', { name: 'Player' });
+    expect(section).toHaveAttribute('data-testid', 'player');
+    expect(section).toHaveAttribute('data-region', 'player');
+    expect(screen.getByRole('heading', { level: 2, name: 'Player' })).toHaveAttribute(
+      'data-part',
+      'heading',
+    );
+    expect(section.querySelector('[data-part="body"]')).toHaveTextContent('body');
+  });
+});
+
+describe('StatusText', () => {
+  it('is a polite status live region', () => {
+    render(<StatusText tone="warning">Hello</StatusText>);
+    const status = screen.getByRole('status');
+    expect(status).toHaveTextContent('Hello');
+    expect(status).toHaveAttribute('data-tone', 'warning');
+  });
+});
+
+describe('RegionBoundary', () => {
+  it('renders the fallback when a child throws', () => {
+    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
+    function Broken(): never {
+      throw new Error('x');
+    }
+    render(
+      <RegionBoundary fallback={<p role="alert">fallback</p>}>
+        <Broken />
+      </RegionBoundary>,
+    );
+    expect(screen.getByRole('alert')).toHaveTextContent('fallback');
+    spy.mockRestore();
+  });
+
+  it('renders children when nothing throws', () => {
+    render(
+      <RegionBoundary fallback={<p>fallback</p>}>
+        <p>child</p>
+      </RegionBoundary>,
+    );
+    expect(screen.getByText('child')).toBeInTheDocument();
+  });
+});
diff --git a/src/renderer/components/control-button/control-button.module.css b/src/renderer/components/control-button/control-button.module.css
new file mode 100644
index 0000000..f46710e
--- /dev/null
+++ b/src/renderer/components/control-button/control-button.module.css
@@ -0,0 +1,32 @@
+.control {
+  min-width: var(--na-control-size);
+  min-height: var(--na-control-size);
+  padding: 0 var(--na-space-4);
+  border: var(--na-border-width) solid var(--na-color-border-control);
+  border-radius: var(--na-radius-2);
+  background: var(--na-color-surface-raised);
+  color: var(--na-color-text);
+  font: inherit;
+  cursor: pointer;
+}
+
+.control:hover {
+  background: var(--na-color-surface);
+}
+
+.control:active {
+  background: var(--na-color-surface-inset);
+}
+
+/* Unavailable is shown by a dashed border and muted text, not by color alone. */
+.control[aria-disabled='true'] {
+  border-style: dashed;
+  color: var(--na-color-text-muted);
+  cursor: not-allowed;
+}
+
+@media (forced-colors: active) {
+  .control {
+    border-color: CanvasText;
+  }
+}
diff --git a/src/renderer/components/control-button/control-button.tsx b/src/renderer/components/control-button/control-button.tsx
new file mode 100644
index 0000000..2a22d13
--- /dev/null
+++ b/src/renderer/components/control-button/control-button.tsx
@@ -0,0 +1,33 @@
+import styles from './control-button.module.css';
+
+export interface ControlButtonProps {
+  readonly label: string;
+  readonly onActivate: () => void;
+  /** Unavailable controls stay focusable. They use aria-disabled, not the disabled attribute. */
+  readonly unavailable?: boolean;
+  /** Id of a visible element that explains why the control is unavailable. */
+  readonly describedBy?: string;
+  readonly part?: string;
+}
+
+export function ControlButton({
+  label,
+  onActivate,
+  unavailable = false,
+  describedBy,
+  part = 'control',
+}: ControlButtonProps) {
+  return (
+    <button
+      type="button"
+      className={styles.control}
+      aria-disabled={unavailable ? true : undefined}
+      aria-describedby={describedBy}
+      data-part={part}
+      data-unavailable={unavailable ? 'true' : undefined}
+      onClick={onActivate}
+    >
+      {label}
+    </button>
+  );
+}
diff --git a/src/renderer/components/control-button/index.ts b/src/renderer/components/control-button/index.ts
new file mode 100644
index 0000000..a9449b8
--- /dev/null
+++ b/src/renderer/components/control-button/index.ts
@@ -0,0 +1,2 @@
+export { ControlButton, type ControlButtonProps } from './control-button';
+export { usePlaceholderActivation, type PlaceholderActivation } from './use-placeholder-activation';
diff --git a/src/renderer/components/control-button/use-placeholder-activation.ts b/src/renderer/components/control-button/use-placeholder-activation.ts
new file mode 100644
index 0000000..833b08e
--- /dev/null
+++ b/src/renderer/components/control-button/use-placeholder-activation.ts
@@ -0,0 +1,15 @@
+import { useCallback, useState } from 'react';
+
+export interface PlaceholderActivation {
+  readonly message: string;
+  readonly activate: (message: string) => void;
+}
+
+/** Local status text for controls that have no backend yet. Activation changes only the text. */
+export function usePlaceholderActivation(): PlaceholderActivation {
+  const [message, setMessage] = useState('');
+  const activate = useCallback((next: string) => {
+    setMessage(next);
+  }, []);
+  return { message, activate };
+}
diff --git a/src/renderer/components/region-boundary/index.ts b/src/renderer/components/region-boundary/index.ts
new file mode 100644
index 0000000..72149b9
--- /dev/null
+++ b/src/renderer/components/region-boundary/index.ts
@@ -0,0 +1 @@
+export { RegionBoundary, type RegionBoundaryProps } from './region-boundary';
diff --git a/src/renderer/components/region-boundary/region-boundary.tsx b/src/renderer/components/region-boundary/region-boundary.tsx
new file mode 100644
index 0000000..14af2ac
--- /dev/null
+++ b/src/renderer/components/region-boundary/region-boundary.tsx
@@ -0,0 +1,27 @@
+import { Component, type ErrorInfo, type ReactNode } from 'react';
+
+export interface RegionBoundaryProps {
+  readonly fallback: ReactNode;
+  readonly children: ReactNode;
+}
+
+interface RegionBoundaryState {
+  readonly failed: boolean;
+}
+
+/** Keeps one failing region from blanking the shell. The error is not shown or logged (no payloads). */
+export class RegionBoundary extends Component<RegionBoundaryProps, RegionBoundaryState> {
+  override state: RegionBoundaryState = { failed: false };
+
+  static getDerivedStateFromError(): RegionBoundaryState {
+    return { failed: true };
+  }
+
+  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
+    // Intentionally empty: the fallback is the handling. No telemetry exists (R15.1).
+  }
+
+  override render(): ReactNode {
+    return this.state.failed ? this.props.fallback : this.props.children;
+  }
+}
diff --git a/src/renderer/components/region-frame/index.ts b/src/renderer/components/region-frame/index.ts
new file mode 100644
index 0000000..3c54842
--- /dev/null
+++ b/src/renderer/components/region-frame/index.ts
@@ -0,0 +1,2 @@
+export { RegionFrame, type RegionFrameProps } from './region-frame';
+export { REGION_IDS, type RegionId } from './region-ids';
diff --git a/src/renderer/components/region-frame/region-frame.module.css b/src/renderer/components/region-frame/region-frame.module.css
new file mode 100644
index 0000000..11a7ac9
--- /dev/null
+++ b/src/renderer/components/region-frame/region-frame.module.css
@@ -0,0 +1,31 @@
+.frame {
+  display: flex;
+  flex-direction: column;
+  min-width: 0;
+  min-height: 0;
+  border: var(--na-border-width) solid var(--na-color-border-subtle);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface);
+}
+
+.frame > [data-part='heading'] {
+  padding: var(--na-space-2) var(--na-space-3);
+  background: var(--na-color-surface-raised);
+  color: var(--na-color-text-muted);
+  font-size: var(--na-font-size-1);
+  font-weight: 600;
+  letter-spacing: 0.08em;
+  text-transform: uppercase;
+}
+
+.frame > [data-part='body'] {
+  display: flex;
+  flex-direction: column;
+  flex: 1 1 auto;
+  gap: var(--na-space-3);
+  min-width: 0;
+  min-height: 0;
+  padding: var(--na-space-3);
+  overflow: auto;
+  overflow-wrap: anywhere;
+}
diff --git a/src/renderer/components/region-frame/region-frame.tsx b/src/renderer/components/region-frame/region-frame.tsx
new file mode 100644
index 0000000..0990f3b
--- /dev/null
+++ b/src/renderer/components/region-frame/region-frame.tsx
@@ -0,0 +1,28 @@
+import styles from './region-frame.module.css';
+import type { ReactNode } from 'react';
+import type { RegionId } from './region-ids';
+
+export interface RegionFrameProps {
+  readonly id: RegionId;
+  readonly titleId: string;
+  readonly heading: string;
+  readonly children: ReactNode;
+}
+
+/** Labelled section for one region. Owns no position or color (skins restyle it later). */
+export function RegionFrame({ id, titleId, heading, children }: RegionFrameProps) {
+  return (
+    <section
+      className={styles.frame}
+      aria-labelledby={titleId}
+      data-testid={id}
+      data-region={id}
+      data-part="frame"
+    >
+      <h2 id={titleId} data-part="heading">
+        {heading}
+      </h2>
+      <div data-part="body">{children}</div>
+    </section>
+  );
+}
diff --git a/src/renderer/components/region-frame/region-ids.ts b/src/renderer/components/region-frame/region-ids.ts
new file mode 100644
index 0000000..c321e82
--- /dev/null
+++ b/src/renderer/components/region-frame/region-ids.ts
@@ -0,0 +1,11 @@
+export const REGION_IDS = [
+  'player',
+  'playlist',
+  'equalizer',
+  'visualization',
+  'skin-selector',
+  'github',
+] as const;
+
+/** Stable region ids. A future Skin Engine layout references these, so they are not renamed. */
+export type RegionId = (typeof REGION_IDS)[number];
diff --git a/src/renderer/components/status-text/index.ts b/src/renderer/components/status-text/index.ts
new file mode 100644
index 0000000..038c704
--- /dev/null
+++ b/src/renderer/components/status-text/index.ts
@@ -0,0 +1 @@
+export { StatusText, type StatusTextProps, type StatusTone } from './status-text';
diff --git a/src/renderer/components/status-text/status-text.module.css b/src/renderer/components/status-text/status-text.module.css
new file mode 100644
index 0000000..938e2b3
--- /dev/null
+++ b/src/renderer/components/status-text/status-text.module.css
@@ -0,0 +1,13 @@
+.status {
+  color: var(--na-color-text-muted);
+  font-size: var(--na-font-size-2);
+  overflow-wrap: anywhere;
+}
+
+.status[data-tone='warning'] {
+  color: var(--na-color-warning);
+}
+
+.status[data-tone='danger'] {
+  color: var(--na-color-danger);
+}
diff --git a/src/renderer/components/status-text/status-text.tsx b/src/renderer/components/status-text/status-text.tsx
new file mode 100644
index 0000000..3d3ade8
--- /dev/null
+++ b/src/renderer/components/status-text/status-text.tsx
@@ -0,0 +1,19 @@
+import type { ReactNode } from 'react';
+import styles from './status-text.module.css';
+
+export type StatusTone = 'neutral' | 'warning' | 'danger';
+
+export interface StatusTextProps {
+  readonly children?: ReactNode;
+  readonly tone?: StatusTone;
+  readonly id?: string;
+}
+
+/** Polite live region. Content changes are announced by screen readers. */
+export function StatusText({ children, tone = 'neutral', id }: StatusTextProps) {
+  return (
+    <p id={id} className={styles.status} role="status" data-part="status" data-tone={tone}>
+      {children}
+    </p>
+  );
+}
diff --git a/src/renderer/env.d.ts b/src/renderer/env.d.ts
new file mode 100644
index 0000000..8ffe0bf
--- /dev/null
+++ b/src/renderer/env.d.ts
@@ -0,0 +1,13 @@
+// Ambient declarations for the renderer project.
+// `window.necroamp` is typed by src/preload/necroamp-window.d.ts. Only
+// app/bridge/necroamp-client.ts reads it, and it treats the value as unknown so a
+// missing bridge is handled (R8.10).
+
+// CSS Modules are resolved by Vite. Class names are plain strings at runtime.
+declare module '*.module.css' {
+  const classes: Readonly<Record<string, string>>;
+  export default classes;
+}
+
+// Plain stylesheets are imported for side effects only (tokens.css, global.css).
+declare module '*.css';
diff --git a/src/renderer/features/equalizer/equalizer-region.tsx b/src/renderer/features/equalizer/equalizer-region.tsx
new file mode 100644
index 0000000..417d412
--- /dev/null
+++ b/src/renderer/features/equalizer/equalizer-region.tsx
@@ -0,0 +1,6 @@
+import { EqualizerView } from './equalizer-view';
+import { useEqualizerBands } from './use-equalizer';
+
+export function EqualizerRegion() {
+  return <EqualizerView bands={useEqualizerBands()} />;
+}
diff --git a/src/renderer/features/equalizer/equalizer-view.module.css b/src/renderer/features/equalizer/equalizer-view.module.css
new file mode 100644
index 0000000..2a18dee
--- /dev/null
+++ b/src/renderer/features/equalizer/equalizer-view.module.css
@@ -0,0 +1,38 @@
+.root {
+  display: flex;
+  flex-direction: column;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='unavailable-note'] {
+  color: var(--na-color-text-muted);
+}
+
+.root [data-part='eq-bands'] {
+  display: grid;
+  grid-template-columns: repeat(auto-fit, minmax(3.5rem, 1fr));
+  gap: var(--na-space-2);
+}
+
+.root [data-part='eq-band'] {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  gap: var(--na-space-1);
+  min-width: 0;
+  padding: var(--na-space-2);
+  border: var(--na-border-width) dashed var(--na-color-border-control);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface-inset);
+  text-align: center;
+}
+
+.root [data-part='eq-band-frequency'] {
+  font-family: var(--na-font-family-mono);
+}
+
+.root [data-part='eq-band-state'] {
+  color: var(--na-color-text-muted);
+  font-size: var(--na-font-size-1);
+}
diff --git a/src/renderer/features/equalizer/equalizer-view.tsx b/src/renderer/features/equalizer/equalizer-view.tsx
new file mode 100644
index 0000000..aaee539
--- /dev/null
+++ b/src/renderer/features/equalizer/equalizer-view.tsx
@@ -0,0 +1,26 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { RegionFrame } from '@renderer/components/region-frame';
+import type { EqualizerBand } from './use-equalizer';
+import styles from './equalizer-view.module.css';
+
+export interface EqualizerViewProps {
+  readonly bands: readonly EqualizerBand[];
+}
+
+export function EqualizerView({ bands }: EqualizerViewProps) {
+  return (
+    <RegionFrame id="equalizer" titleId="equalizer-heading" heading={STRINGS.regions.equalizer}>
+      <div className={styles.root}>
+        <p data-part="unavailable-note">{STRINGS.equalizer.unavailable}</p>
+        <div data-part="eq-bands" role="group" aria-label={STRINGS.equalizer.bands}>
+          {bands.map((band) => (
+            <div key={band.index} role="group" aria-label={band.name} data-part="eq-band">
+              <span data-part="eq-band-frequency">{band.frequency}</span>
+              <span data-part="eq-band-state">{STRINGS.notAvailable}</span>
+            </div>
+          ))}
+        </div>
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/features/equalizer/index.ts b/src/renderer/features/equalizer/index.ts
new file mode 100644
index 0000000..f347263
--- /dev/null
+++ b/src/renderer/features/equalizer/index.ts
@@ -0,0 +1 @@
+export { EqualizerRegion } from './equalizer-region';
diff --git a/src/renderer/features/equalizer/use-equalizer.ts b/src/renderer/features/equalizer/use-equalizer.ts
new file mode 100644
index 0000000..65c7e35
--- /dev/null
+++ b/src/renderer/features/equalizer/use-equalizer.ts
@@ -0,0 +1,20 @@
+import { STRINGS } from '@renderer/app/strings/en';
+
+export interface EqualizerBand {
+  readonly index: number;
+  readonly name: string;
+  readonly frequency: string;
+}
+
+/** Ten non-interactive band placeholders. No parameter mapping or DSP exists in this phase. */
+export function useEqualizerBands(): readonly EqualizerBand[] {
+  return EQUALIZER_BANDS;
+}
+
+const EQUALIZER_BANDS: readonly EqualizerBand[] = STRINGS.equalizer.frequencies.map(
+  (frequency, position): EqualizerBand => ({
+    index: position + 1,
+    name: STRINGS.equalizer.band(position + 1),
+    frequency,
+  }),
+);
diff --git a/src/renderer/features/github/github-region.tsx b/src/renderer/features/github/github-region.tsx
new file mode 100644
index 0000000..84588c7
--- /dev/null
+++ b/src/renderer/features/github/github-region.tsx
@@ -0,0 +1,6 @@
+import { GithubView } from './github-view';
+import { useGithubPlaceholder } from './use-github';
+
+export function GithubRegion() {
+  return <GithubView {...useGithubPlaceholder()} />;
+}
diff --git a/src/renderer/features/github/github-view.module.css b/src/renderer/features/github/github-view.module.css
new file mode 100644
index 0000000..2d454ee
--- /dev/null
+++ b/src/renderer/features/github/github-view.module.css
@@ -0,0 +1,16 @@
+.root {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='unavailable-note'] {
+  color: var(--na-color-text-muted);
+}
+
+.root [data-part='github-status'] {
+  color: var(--na-color-text);
+  font-weight: 600;
+}
diff --git a/src/renderer/features/github/github-view.tsx b/src/renderer/features/github/github-view.tsx
new file mode 100644
index 0000000..57e9c9c
--- /dev/null
+++ b/src/renderer/features/github/github-view.tsx
@@ -0,0 +1,30 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { ControlButton } from '@renderer/components/control-button';
+import { RegionFrame } from '@renderer/components/region-frame';
+import { StatusText } from '@renderer/components/status-text';
+import type { GithubPlaceholder } from './use-github';
+import styles from './github-view.module.css';
+
+const NOTE_ID = 'github-unavailable-note';
+
+export function GithubView({ signInLabel, onSignIn, message }: GithubPlaceholder) {
+  return (
+    <RegionFrame id="github" titleId="github-heading" heading={STRINGS.regions.github}>
+      <div className={styles.root}>
+        <p data-part="github-optional">{STRINGS.github.optional}</p>
+        <p data-part="github-status">{STRINGS.github.status}</p>
+        <ControlButton
+          label={signInLabel}
+          part="github-sign-in"
+          unavailable
+          describedBy={NOTE_ID}
+          onActivate={onSignIn}
+        />
+        <p id={NOTE_ID} data-part="unavailable-note">
+          {STRINGS.notImplemented}
+        </p>
+        <StatusText>{message}</StatusText>
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/features/github/index.ts b/src/renderer/features/github/index.ts
new file mode 100644
index 0000000..490b8f3
--- /dev/null
+++ b/src/renderer/features/github/index.ts
@@ -0,0 +1 @@
+export { GithubRegion } from './github-region';
diff --git a/src/renderer/features/github/use-github.ts b/src/renderer/features/github/use-github.ts
new file mode 100644
index 0000000..2de2a83
--- /dev/null
+++ b/src/renderer/features/github/use-github.ts
@@ -0,0 +1,24 @@
+import { useMemo } from 'react';
+import { STRINGS } from '@renderer/app/strings/en';
+import { usePlaceholderActivation } from '@renderer/components/control-button';
+
+export interface GithubPlaceholder {
+  readonly signInLabel: string;
+  readonly onSignIn: () => void;
+  readonly message: string;
+}
+
+/** Placeholder only. No authentication or network call exists in this phase. */
+export function useGithubPlaceholder(): GithubPlaceholder {
+  const { message, activate } = usePlaceholderActivation();
+  return useMemo(
+    () => ({
+      signInLabel: STRINGS.github.signIn,
+      onSignIn: () => {
+        activate(STRINGS.activationMessage(STRINGS.github.signIn));
+      },
+      message,
+    }),
+    [activate, message],
+  );
+}
diff --git a/src/renderer/features/player/index.ts b/src/renderer/features/player/index.ts
new file mode 100644
index 0000000..52766a8
--- /dev/null
+++ b/src/renderer/features/player/index.ts
@@ -0,0 +1 @@
+export { PlayerRegion } from './player-region';
diff --git a/src/renderer/features/player/player-region.tsx b/src/renderer/features/player/player-region.tsx
new file mode 100644
index 0000000..e8cc85f
--- /dev/null
+++ b/src/renderer/features/player/player-region.tsx
@@ -0,0 +1,7 @@
+import { PlayerView } from './player-view';
+import { usePlayerControls } from './use-player';
+
+export function PlayerRegion() {
+  const { controls, message } = usePlayerControls();
+  return <PlayerView controls={controls} message={message} />;
+}
diff --git a/src/renderer/features/player/player-view.module.css b/src/renderer/features/player/player-view.module.css
new file mode 100644
index 0000000..05765f7
--- /dev/null
+++ b/src/renderer/features/player/player-view.module.css
@@ -0,0 +1,48 @@
+.root {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: var(--na-space-3) var(--na-space-5);
+  min-width: 0;
+}
+
+.root [data-part='now-playing'] {
+  flex: 1 1 16rem;
+  min-width: 0;
+  padding: var(--na-space-3);
+  border: var(--na-border-width) solid var(--na-color-border-control);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface-inset);
+}
+
+.root [data-part='now-playing'] dl {
+  display: grid;
+  gap: var(--na-space-1);
+}
+
+.root [data-part='now-playing'] dl > div {
+  display: flex;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='now-playing'] dt {
+  color: var(--na-color-text-muted);
+}
+
+.root [data-part='now-playing-position'] dd {
+  color: var(--na-color-accent);
+  font-family: var(--na-font-family-mono);
+  font-size: var(--na-font-size-4);
+}
+
+.root [data-part='transport'] {
+  display: flex;
+  flex-wrap: wrap;
+  gap: var(--na-space-3);
+}
+
+.root [data-part='unavailable-note'] {
+  flex: 1 1 100%;
+  color: var(--na-color-text-muted);
+}
diff --git a/src/renderer/features/player/player-view.tsx b/src/renderer/features/player/player-view.tsx
new file mode 100644
index 0000000..6d599ad
--- /dev/null
+++ b/src/renderer/features/player/player-view.tsx
@@ -0,0 +1,54 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { ControlButton } from '@renderer/components/control-button';
+import { RegionFrame } from '@renderer/components/region-frame';
+import { StatusText } from '@renderer/components/status-text';
+import type { TransportControl } from './use-player';
+import styles from './player-view.module.css';
+
+export interface PlayerViewProps {
+  readonly controls: readonly TransportControl[];
+  readonly message: string;
+}
+
+const NOTE_ID = 'player-unavailable-note';
+
+export function PlayerView({ controls, message }: PlayerViewProps) {
+  return (
+    <RegionFrame id="player" titleId="player-heading" heading={STRINGS.regions.player}>
+      <div className={styles.root}>
+        <div data-part="now-playing" role="group" aria-label={STRINGS.player.nowPlaying}>
+          <dl>
+            <div data-part="now-playing-title">
+              <dt>{STRINGS.player.titleLabel}</dt>
+              <dd>{STRINGS.player.noTrack}</dd>
+            </div>
+            <div data-part="now-playing-artist">
+              <dt>{STRINGS.player.artistLabel}</dt>
+              <dd>{STRINGS.player.noArtist}</dd>
+            </div>
+            <div data-part="now-playing-position">
+              <dt>{STRINGS.player.positionLabel}</dt>
+              <dd>{STRINGS.notAvailable}</dd>
+            </div>
+          </dl>
+        </div>
+        <div data-part="transport" role="group" aria-label={STRINGS.player.transport}>
+          {controls.map((control) => (
+            <ControlButton
+              key={control.id}
+              label={control.label}
+              part={`transport-${control.id}`}
+              unavailable={control.unavailable}
+              describedBy={NOTE_ID}
+              onActivate={control.onActivate}
+            />
+          ))}
+        </div>
+        <p id={NOTE_ID} data-part="unavailable-note">
+          {STRINGS.notImplemented}
+        </p>
+        <StatusText>{message}</StatusText>
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/features/player/use-player.ts b/src/renderer/features/player/use-player.ts
new file mode 100644
index 0000000..6a54f8b
--- /dev/null
+++ b/src/renderer/features/player/use-player.ts
@@ -0,0 +1,49 @@
+import { useMemo } from 'react';
+import { STRINGS } from '@renderer/app/strings/en';
+import { usePlaceholderActivation } from '@renderer/components/control-button';
+
+export type TransportControlId = keyof typeof STRINGS.player.controls;
+
+export const TRANSPORT_CONTROL_IDS: readonly TransportControlId[] = [
+  'previous',
+  'play',
+  'pause',
+  'stop',
+  'next',
+];
+
+export interface TransportControl {
+  readonly id: TransportControlId;
+  readonly label: string;
+  readonly unavailable: true;
+  readonly onActivate: () => void;
+}
+
+export interface PlayerControls {
+  readonly controls: readonly TransportControl[];
+  readonly message: string;
+}
+
+/**
+ * Headless behavior for the transport. No audio engine exists yet, so every control is
+ * unavailable and activation only changes the status message. It never touches audio.
+ */
+export function usePlayerControls(): PlayerControls {
+  const { message, activate } = usePlaceholderActivation();
+  const controls = useMemo(
+    () =>
+      TRANSPORT_CONTROL_IDS.map((id): TransportControl => {
+        const label = STRINGS.player.controls[id];
+        return {
+          id,
+          label,
+          unavailable: true,
+          onActivate: () => {
+            activate(STRINGS.activationMessage(label));
+          },
+        };
+      }),
+    [activate],
+  );
+  return { controls, message };
+}
diff --git a/src/renderer/features/playlist/index.ts b/src/renderer/features/playlist/index.ts
new file mode 100644
index 0000000..136158a
--- /dev/null
+++ b/src/renderer/features/playlist/index.ts
@@ -0,0 +1 @@
+export { PlaylistRegion } from './playlist-region';
diff --git a/src/renderer/features/playlist/playlist-region.tsx b/src/renderer/features/playlist/playlist-region.tsx
new file mode 100644
index 0000000..c60e3ec
--- /dev/null
+++ b/src/renderer/features/playlist/playlist-region.tsx
@@ -0,0 +1,7 @@
+import { PlaylistView } from './playlist-view';
+import { usePlaylistActions } from './use-playlist';
+
+export function PlaylistRegion() {
+  const { actions, message } = usePlaylistActions();
+  return <PlaylistView actions={actions} message={message} />;
+}
diff --git a/src/renderer/features/playlist/playlist-view.module.css b/src/renderer/features/playlist/playlist-view.module.css
new file mode 100644
index 0000000..26b596a
--- /dev/null
+++ b/src/renderer/features/playlist/playlist-view.module.css
@@ -0,0 +1,24 @@
+.root {
+  display: flex;
+  flex-direction: column;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='playlist-empty'] {
+  padding: var(--na-space-3);
+  border: var(--na-border-width) solid var(--na-color-border-control);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface-inset);
+  color: var(--na-color-text-muted);
+}
+
+.root [data-part='playlist-actions'] {
+  display: flex;
+  flex-wrap: wrap;
+  gap: var(--na-space-3);
+}
+
+.root [data-part='unavailable-note'] {
+  color: var(--na-color-text-muted);
+}
diff --git a/src/renderer/features/playlist/playlist-view.tsx b/src/renderer/features/playlist/playlist-view.tsx
new file mode 100644
index 0000000..4a94f0a
--- /dev/null
+++ b/src/renderer/features/playlist/playlist-view.tsx
@@ -0,0 +1,40 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { ControlButton } from '@renderer/components/control-button';
+import { RegionFrame } from '@renderer/components/region-frame';
+import { StatusText } from '@renderer/components/status-text';
+import type { PlaylistAction } from './use-playlist';
+import styles from './playlist-view.module.css';
+
+export interface PlaylistViewProps {
+  readonly actions: readonly PlaylistAction[];
+  readonly message: string;
+}
+
+const NOTE_ID = 'playlist-unavailable-note';
+
+export function PlaylistView({ actions, message }: PlaylistViewProps) {
+  return (
+    <RegionFrame id="playlist" titleId="playlist-heading" heading={STRINGS.regions.playlist}>
+      <div className={styles.root}>
+        <p data-part="playlist-empty">{STRINGS.playlist.empty}</p>
+        <ul data-part="playlist-items" aria-label={STRINGS.playlist.listLabel} />
+        <div data-part="playlist-actions" role="group" aria-label={STRINGS.regions.playlist}>
+          {actions.map((action) => (
+            <ControlButton
+              key={action.id}
+              label={action.label}
+              part={`playlist-${action.id}`}
+              unavailable={action.unavailable}
+              describedBy={NOTE_ID}
+              onActivate={action.onActivate}
+            />
+          ))}
+        </div>
+        <p id={NOTE_ID} data-part="unavailable-note">
+          {STRINGS.notImplemented}
+        </p>
+        <StatusText>{message}</StatusText>
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/features/playlist/use-playlist.ts b/src/renderer/features/playlist/use-playlist.ts
new file mode 100644
index 0000000..b842b0b
--- /dev/null
+++ b/src/renderer/features/playlist/use-playlist.ts
@@ -0,0 +1,35 @@
+import { useMemo } from 'react';
+import { STRINGS } from '@renderer/app/strings/en';
+import { usePlaceholderActivation } from '@renderer/components/control-button';
+
+export interface PlaylistAction {
+  readonly id: 'add-files' | 'save-playlist';
+  readonly label: string;
+  readonly unavailable: true;
+  readonly onActivate: () => void;
+}
+
+export interface PlaylistActions {
+  readonly actions: readonly PlaylistAction[];
+  readonly message: string;
+}
+
+/** Playlist state does not exist yet. The actions are unavailable placeholders. */
+export function usePlaylistActions(): PlaylistActions {
+  const { message, activate } = usePlaceholderActivation();
+  const actions = useMemo((): readonly PlaylistAction[] => {
+    const make = (id: PlaylistAction['id'], label: string): PlaylistAction => ({
+      id,
+      label,
+      unavailable: true,
+      onActivate: () => {
+        activate(STRINGS.activationMessage(label));
+      },
+    });
+    return [
+      make('add-files', STRINGS.playlist.addFiles),
+      make('save-playlist', STRINGS.playlist.savePlaylist),
+    ];
+  }, [activate]);
+  return { actions, message };
+}
diff --git a/src/renderer/features/skins/index.ts b/src/renderer/features/skins/index.ts
new file mode 100644
index 0000000..45bb4da
--- /dev/null
+++ b/src/renderer/features/skins/index.ts
@@ -0,0 +1 @@
+export { SkinsRegion } from './skins-region';
diff --git a/src/renderer/features/skins/skins-region.tsx b/src/renderer/features/skins/skins-region.tsx
new file mode 100644
index 0000000..98e7c6f
--- /dev/null
+++ b/src/renderer/features/skins/skins-region.tsx
@@ -0,0 +1,6 @@
+import { SkinsView } from './skins-view';
+import { useSkinSelection } from './use-skins';
+
+export function SkinsRegion() {
+  return <SkinsView {...useSkinSelection()} />;
+}
diff --git a/src/renderer/features/skins/skins-view.module.css b/src/renderer/features/skins/skins-view.module.css
new file mode 100644
index 0000000..e54a747
--- /dev/null
+++ b/src/renderer/features/skins/skins-view.module.css
@@ -0,0 +1,21 @@
+.root {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='unavailable-note'] {
+  color: var(--na-color-text-muted);
+}
+
+.root [data-part='skin-select'] {
+  margin: 0;
+  padding: var(--na-space-2) var(--na-space-3);
+  list-style: none;
+  color: var(--na-color-text-muted);
+  background: var(--na-color-surface-inset);
+  border: var(--na-border-width) solid var(--na-color-border-control);
+  border-radius: var(--na-radius-1);
+}
diff --git a/src/renderer/features/skins/skins-view.tsx b/src/renderer/features/skins/skins-view.tsx
new file mode 100644
index 0000000..42efc2d
--- /dev/null
+++ b/src/renderer/features/skins/skins-view.tsx
@@ -0,0 +1,36 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { ControlButton } from '@renderer/components/control-button';
+import { RegionFrame } from '@renderer/components/region-frame';
+import { StatusText } from '@renderer/components/status-text';
+import type { SkinSelection } from './use-skins';
+import styles from './skins-view.module.css';
+
+const NOTE_ID = 'skin-selector-unavailable-note';
+
+export function SkinsView({ chooseLabel, onChoose, message }: SkinSelection) {
+  return (
+    <RegionFrame
+      id="skin-selector"
+      titleId="skin-selector-heading"
+      heading={STRINGS.regions['skin-selector']}
+    >
+      <div className={styles.root}>
+        <p data-part="skin-none">{STRINGS.skins.none}</p>
+        <ul data-part="skin-select" aria-label={STRINGS.skins.selectLabel}>
+          <li>{STRINGS.skins.foundationDefault}</li>
+        </ul>
+        <ControlButton
+          label={chooseLabel}
+          part="skin-choose"
+          unavailable
+          describedBy={NOTE_ID}
+          onActivate={onChoose}
+        />
+        <p id={NOTE_ID} data-part="unavailable-note">
+          {STRINGS.notImplemented}
+        </p>
+        <StatusText>{message}</StatusText>
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/features/skins/use-skins.ts b/src/renderer/features/skins/use-skins.ts
new file mode 100644
index 0000000..cbe8e88
--- /dev/null
+++ b/src/renderer/features/skins/use-skins.ts
@@ -0,0 +1,24 @@
+import { useMemo } from 'react';
+import { STRINGS } from '@renderer/app/strings/en';
+import { usePlaceholderActivation } from '@renderer/components/control-button';
+
+export interface SkinSelection {
+  readonly chooseLabel: string;
+  readonly onChoose: () => void;
+  readonly message: string;
+}
+
+/** Placeholder only. No skin is listed or loaded (the final Skin Engine is out of scope). */
+export function useSkinSelection(): SkinSelection {
+  const { message, activate } = usePlaceholderActivation();
+  return useMemo(
+    () => ({
+      chooseLabel: STRINGS.skins.choose,
+      onChoose: () => {
+        activate(STRINGS.activationMessage(STRINGS.skins.choose));
+      },
+      message,
+    }),
+    [activate, message],
+  );
+}
diff --git a/src/renderer/features/visualizer/index.ts b/src/renderer/features/visualizer/index.ts
new file mode 100644
index 0000000..9eeb512
--- /dev/null
+++ b/src/renderer/features/visualizer/index.ts
@@ -0,0 +1 @@
+export { VisualizerRegion } from './visualizer-region';
diff --git a/src/renderer/features/visualizer/use-visualizer.ts b/src/renderer/features/visualizer/use-visualizer.ts
new file mode 100644
index 0000000..6003ae4
--- /dev/null
+++ b/src/renderer/features/visualizer/use-visualizer.ts
@@ -0,0 +1,16 @@
+import { STRINGS } from '@renderer/app/strings/en';
+
+export interface VisualizerPane {
+  readonly id: 'spectrum' | 'waveform';
+  readonly label: string;
+}
+
+const PANES: readonly VisualizerPane[] = [
+  { id: 'spectrum', label: STRINGS.visualizer.spectrum },
+  { id: 'waveform', label: STRINGS.visualizer.waveform },
+];
+
+/** Two labelled placeholder panes. No analyser, canvas or animation loop exists in this phase. */
+export function useVisualizerPanes(): readonly VisualizerPane[] {
+  return PANES;
+}
diff --git a/src/renderer/features/visualizer/visualizer-region.tsx b/src/renderer/features/visualizer/visualizer-region.tsx
new file mode 100644
index 0000000..f54152a
--- /dev/null
+++ b/src/renderer/features/visualizer/visualizer-region.tsx
@@ -0,0 +1,6 @@
+import { useVisualizerPanes } from './use-visualizer';
+import { VisualizerView } from './visualizer-view';
+
+export function VisualizerRegion() {
+  return <VisualizerView panes={useVisualizerPanes()} />;
+}
diff --git a/src/renderer/features/visualizer/visualizer-view.module.css b/src/renderer/features/visualizer/visualizer-view.module.css
new file mode 100644
index 0000000..7ff9e51
--- /dev/null
+++ b/src/renderer/features/visualizer/visualizer-view.module.css
@@ -0,0 +1,27 @@
+.root {
+  display: flex;
+  flex-direction: column;
+  gap: var(--na-space-3);
+  min-width: 0;
+}
+
+.root [data-part='unavailable-note'] {
+  color: var(--na-color-text-muted);
+}
+
+.root [role='group'] {
+  display: flex;
+  flex: 1 1 0;
+  flex-direction: column;
+  align-items: center;
+  justify-content: center;
+  gap: var(--na-space-1);
+  min-height: 4rem;
+  border: var(--na-border-width) dashed var(--na-color-border-control);
+  border-radius: var(--na-radius-1);
+  background: var(--na-color-surface-inset);
+}
+
+.root [data-part='pane-state'] {
+  color: var(--na-color-text-muted);
+}
diff --git a/src/renderer/features/visualizer/visualizer-view.tsx b/src/renderer/features/visualizer/visualizer-view.tsx
new file mode 100644
index 0000000..eb1cd56
--- /dev/null
+++ b/src/renderer/features/visualizer/visualizer-view.tsx
@@ -0,0 +1,28 @@
+import { STRINGS } from '@renderer/app/strings/en';
+import { RegionFrame } from '@renderer/components/region-frame';
+import type { VisualizerPane } from './use-visualizer';
+import styles from './visualizer-view.module.css';
+
+export interface VisualizerViewProps {
+  readonly panes: readonly VisualizerPane[];
+}
+
+export function VisualizerView({ panes }: VisualizerViewProps) {
+  return (
+    <RegionFrame
+      id="visualization"
+      titleId="visualization-heading"
+      heading={STRINGS.regions.visualization}
+    >
+      <div className={styles.root}>
+        <p data-part="unavailable-note">{STRINGS.visualizer.unavailable}</p>
+        {panes.map((pane) => (
+          <div key={pane.id} role="group" aria-label={pane.label} data-part={pane.id}>
+            <span data-part="pane-label">{pane.label}</span>
+            <span data-part="pane-state">{STRINGS.notAvailable}</span>
+          </div>
+        ))}
+      </div>
+    </RegionFrame>
+  );
+}
diff --git a/src/renderer/index.html b/src/renderer/index.html
new file mode 100644
index 0000000..ca31c34
--- /dev/null
+++ b/src/renderer/index.html
@@ -0,0 +1,12 @@
+<!doctype html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <title>NecroAmp</title>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="./main.tsx"></script>
+  </body>
+</html>
diff --git a/src/renderer/main.tsx b/src/renderer/main.tsx
new file mode 100644
index 0000000..52fae18
--- /dev/null
+++ b/src/renderer/main.tsx
@@ -0,0 +1,21 @@
+import { StrictMode } from 'react';
+import { createRoot } from 'react-dom/client';
+import { AppShell } from '@renderer/app/app-shell';
+import { createNecroampClient } from '@renderer/app/bridge/necroamp-client';
+import { createAppInfoStore } from '@renderer/stores/app-info-store';
+import '@renderer/app/styles/tokens.css';
+import '@renderer/app/styles/global.css';
+
+const container = document.getElementById('root');
+if (container === null) {
+  throw new Error('Missing #root element.');
+}
+
+// The store is created here and injected, never a module-level singleton (R10.1).
+const appInfoStore = createAppInfoStore(createNecroampClient(window));
+
+createRoot(container).render(
+  <StrictMode>
+    <AppShell appInfoStore={appInfoStore} />
+  </StrictMode>,
+);
diff --git a/src/renderer/stores/app-info-store.test.ts b/src/renderer/stores/app-info-store.test.ts
new file mode 100644
index 0000000..1c2a77b
--- /dev/null
+++ b/src/renderer/stores/app-info-store.test.ts
@@ -0,0 +1,68 @@
+import { describe, expect, it } from 'vitest';
+import { createAppInfoStore, type AppInfoClient, type AppInfoClientResult } from './app-info-store';
+
+const INFO = { name: 'NecroAmp', version: '1.2.3', platform: 'linux' } as const;
+
+function clientReturning(result: AppInfoClientResult): AppInfoClient & { calls: number } {
+  const client = {
+    calls: 0,
+    getAppInfo: () => {
+      client.calls += 1;
+      return Promise.resolve(result);
+    },
+  };
+  return client;
+}
+
+describe('createAppInfoStore', () => {
+  it('starts idle', () => {
+    const state = createAppInfoStore(clientReturning({ ok: true, data: INFO })).getState();
+    expect(state.status).toBe('idle');
+    expect(state.data).toBeUndefined();
+  });
+
+  it('is loading while the client call is pending, then loaded', async () => {
+    let resolve: (value: AppInfoClientResult) => void = () => undefined;
+    const store = createAppInfoStore({
+      getAppInfo: () => new Promise<AppInfoClientResult>((r) => (resolve = r)),
+    });
+    const pending = store.getState().load();
+    expect(store.getState().status).toBe('loading');
+    resolve({ ok: true, data: INFO });
+    await pending;
+    expect(store.getState()).toMatchObject({ status: 'loaded', data: INFO });
+  });
+
+  it('enters unavailable when the bridge is missing', async () => {
+    const store = createAppInfoStore(clientReturning({ ok: false, reason: 'unavailable' }));
+    await store.getState().load();
+    expect(store.getState()).toMatchObject({ status: 'unavailable', failure: 'unavailable' });
+  });
+
+  it.each(['rejected', 'invalid-response', 'ipc-error'] as const)(
+    'enters failed for %s',
+    async (reason) => {
+      const store = createAppInfoStore(clientReturning({ ok: false, reason }));
+      await store.getState().load();
+      expect(store.getState()).toMatchObject({
+        status: 'failed',
+        failure: reason,
+        data: undefined,
+      });
+    },
+  );
+
+  it('ignores a second load while one is in flight', async () => {
+    const client = clientReturning({ ok: true, data: INFO });
+    const store = createAppInfoStore(client);
+    await Promise.all([store.getState().load(), store.getState().load()]);
+    expect(client.calls).toBe(1);
+  });
+
+  it('keeps instances independent', async () => {
+    const a = createAppInfoStore(clientReturning({ ok: true, data: INFO }));
+    const b = createAppInfoStore(clientReturning({ ok: false, reason: 'rejected' }));
+    await a.getState().load();
+    expect(b.getState().status).toBe('idle');
+  });
+});
diff --git a/src/renderer/stores/app-info-store.ts b/src/renderer/stores/app-info-store.ts
new file mode 100644
index 0000000..6bff851
--- /dev/null
+++ b/src/renderer/stores/app-info-store.ts
@@ -0,0 +1,54 @@
+import { createStore, type StoreApi } from 'zustand';
+import type { AppInfo, IpcErrorCode } from '@shared/ipc';
+
+export type AppInfoFailureReason =
+  | 'unavailable' // window.necroamp is missing (R8.10)
+  | 'rejected' // the bridge call threw or rejected
+  | 'invalid-response' // the value did not match the shared schema
+  | 'ipc-error'; // main answered with { ok: false }
+
+export type AppInfoClientResult =
+  | { readonly ok: true; readonly data: AppInfo }
+  | {
+      readonly ok: false;
+      readonly reason: AppInfoFailureReason;
+      readonly code?: IpcErrorCode;
+    };
+
+/** What the store needs from the bridge adapter. Tests pass a fake. */
+export interface AppInfoClient {
+  readonly getAppInfo: () => Promise<AppInfoClientResult>;
+}
+
+export type AppInfoStatus = 'idle' | 'loading' | 'loaded' | 'failed' | 'unavailable';
+
+export interface AppInfoState {
+  readonly status: AppInfoStatus;
+  readonly data: AppInfo | undefined;
+  readonly failure: AppInfoFailureReason | undefined;
+  readonly load: () => Promise<void>;
+}
+
+export type AppInfoStore = StoreApi<AppInfoState>;
+
+export function createAppInfoStore(client: AppInfoClient): AppInfoStore {
+  return createStore<AppInfoState>()((set, get) => ({
+    status: 'idle',
+    data: undefined,
+    failure: undefined,
+    load: async () => {
+      if (get().status === 'loading') {
+        return;
+      }
+      set({ status: 'loading', data: undefined, failure: undefined });
+      const result = await client.getAppInfo();
+      if (result.ok) {
+        set({ status: 'loaded', data: result.data, failure: undefined });
+      } else if (result.reason === 'unavailable') {
+        set({ status: 'unavailable', data: undefined, failure: result.reason });
+      } else {
+        set({ status: 'failed', data: undefined, failure: result.reason });
+      }
+    },
+  }));
+}
diff --git a/src/shared/ipc/app-info.test.ts b/src/shared/ipc/app-info.test.ts
new file mode 100644
index 0000000..579b38f
--- /dev/null
+++ b/src/shared/ipc/app-info.test.ts
@@ -0,0 +1,73 @@
+import { describe, expect, it } from 'vitest';
+import {
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  appInfoSchema,
+  platformSchema,
+} from './app-info';
+import { createIpcError } from './result';
+
+const valid = { name: 'NecroAmp', version: '0.1.0', platform: 'win32' } as const;
+
+describe('platformSchema', () => {
+  it('allows only win32, darwin and linux', () => {
+    for (const p of ['win32', 'darwin', 'linux'])
+      expect(platformSchema.safeParse(p).success).toBe(true);
+    for (const p of ['freebsd', 'WIN32', '', 1, null])
+      expect(platformSchema.safeParse(p).success).toBe(false);
+  });
+});
+
+describe('appInfoRequestSchema', () => {
+  it('accepts no arguments only', () => {
+    expect(appInfoRequestSchema.safeParse([]).success).toBe(true);
+    expect(appInfoRequestSchema.safeParse([1]).success).toBe(false);
+    expect(appInfoRequestSchema.safeParse([undefined]).success).toBe(false);
+    expect(appInfoRequestSchema.safeParse({}).success).toBe(false);
+    expect(appInfoRequestSchema.safeParse(undefined).success).toBe(false);
+  });
+});
+
+describe('appInfoSchema', () => {
+  it('accepts a valid value and bounds at 64 characters', () => {
+    expect(appInfoSchema.safeParse(valid).success).toBe(true);
+    expect(appInfoSchema.safeParse({ ...valid, name: 'a'.repeat(64) }).success).toBe(true);
+  });
+
+  it.each([
+    { ...valid, name: '' },
+    { ...valid, name: 'a'.repeat(65) },
+    { ...valid, version: '' },
+    { ...valid, version: 'v'.repeat(65) },
+    { ...valid, platform: 'sunos' },
+    { ...valid, extra: true },
+    { name: 'NecroAmp', version: '1' },
+    null,
+    'text',
+    [],
+  ])('rejects %j', (input) => {
+    expect(appInfoSchema.safeParse(input).success).toBe(false);
+  });
+});
+
+describe('appInfoResponseSchema', () => {
+  it('accepts success and controlled error results', () => {
+    expect(appInfoResponseSchema.safeParse({ ok: true, data: valid }).success).toBe(true);
+    expect(
+      appInfoResponseSchema.safeParse({ ok: false, error: createIpcError('INVALID_SENDER') })
+        .success,
+    ).toBe(true);
+  });
+
+  it('rejects a success result with bad data and an error with extra keys', () => {
+    expect(
+      appInfoResponseSchema.safeParse({ ok: true, data: { ...valid, platform: 'x' } }).success,
+    ).toBe(false);
+    expect(
+      appInfoResponseSchema.safeParse({
+        ok: false,
+        error: { code: 'INTERNAL', message: 'm', cause: 'c' },
+      }).success,
+    ).toBe(false);
+  });
+});
diff --git a/src/shared/ipc/app-info.ts b/src/shared/ipc/app-info.ts
new file mode 100644
index 0000000..e64893d
--- /dev/null
+++ b/src/shared/ipc/app-info.ts
@@ -0,0 +1,19 @@
+import { z } from 'zod';
+import { ipcResultSchema } from './result';
+
+export const platformSchema = z.enum(['win32', 'darwin', 'linux']);
+export type Platform = z.infer<typeof platformSchema>;
+
+/** `app:get-info` takes no arguments. Any extra invoke argument fails parsing. */
+export const appInfoRequestSchema = z.tuple([]);
+export type AppInfoRequest = z.infer<typeof appInfoRequestSchema>;
+
+export const appInfoSchema = z.strictObject({
+  name: z.string().min(1).max(64),
+  version: z.string().min(1).max(64),
+  platform: platformSchema,
+});
+export type AppInfo = z.infer<typeof appInfoSchema>;
+
+export const appInfoResponseSchema = ipcResultSchema(appInfoSchema);
+export type AppInfoResponse = z.infer<typeof appInfoResponseSchema>;
diff --git a/src/shared/ipc/channels.test.ts b/src/shared/ipc/channels.test.ts
new file mode 100644
index 0000000..7171bd7
--- /dev/null
+++ b/src/shared/ipc/channels.test.ts
@@ -0,0 +1,14 @@
+import { describe, expect, it } from 'vitest';
+import { IPC_CHANNELS } from './channels';
+
+describe('IPC_CHANNELS', () => {
+  it('defines only app:get-info', () => {
+    expect(IPC_CHANNELS).toEqual({ appGetInfo: 'app:get-info' });
+  });
+
+  it('uses domain:action names', () => {
+    for (const name of Object.values(IPC_CHANNELS)) {
+      expect(name).toMatch(/^[a-z]+:[a-z-]+$/);
+    }
+  });
+});
diff --git a/src/shared/ipc/channels.ts b/src/shared/ipc/channels.ts
new file mode 100644
index 0000000..f092f4e
--- /dev/null
+++ b/src/shared/ipc/channels.ts
@@ -0,0 +1,5 @@
+export const IPC_CHANNELS = {
+  appGetInfo: 'app:get-info',
+} as const;
+
+export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
diff --git a/src/shared/ipc/index.test.ts b/src/shared/ipc/index.test.ts
new file mode 100644
index 0000000..6237a9e
--- /dev/null
+++ b/src/shared/ipc/index.test.ts
@@ -0,0 +1,21 @@
+import { describe, expect, it } from 'vitest';
+import * as contract from './index';
+
+describe('shared IPC public surface', () => {
+  it('exports the contract and no generic sender or Electron names', () => {
+    expect(Object.keys(contract).sort()).toEqual(
+      [
+        'IPC_CHANNELS',
+        'IPC_ERROR_MESSAGES',
+        'appInfoRequestSchema',
+        'appInfoResponseSchema',
+        'appInfoSchema',
+        'createIpcError',
+        'ipcErrorCodeSchema',
+        'ipcErrorSchema',
+        'ipcResultSchema',
+        'platformSchema',
+      ].sort(),
+    );
+  });
+});
diff --git a/src/shared/ipc/index.ts b/src/shared/ipc/index.ts
new file mode 100644
index 0000000..8c98006
--- /dev/null
+++ b/src/shared/ipc/index.ts
@@ -0,0 +1,22 @@
+export { IPC_CHANNELS, type IpcChannel } from './channels';
+export {
+  IPC_ERROR_MESSAGES,
+  createIpcError,
+  ipcErrorCodeSchema,
+  ipcErrorSchema,
+  ipcResultSchema,
+  type IpcError,
+  type IpcErrorCode,
+  type IpcResult,
+} from './result';
+export {
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  appInfoSchema,
+  platformSchema,
+  type AppInfo,
+  type AppInfoRequest,
+  type AppInfoResponse,
+  type Platform,
+} from './app-info';
+export type { NecroampApi } from './necroamp-api';
diff --git a/src/shared/ipc/ipc-contract.property.test.ts b/src/shared/ipc/ipc-contract.property.test.ts
new file mode 100644
index 0000000..26076a3
--- /dev/null
+++ b/src/shared/ipc/ipc-contract.property.test.ts
@@ -0,0 +1,134 @@
+import fc from 'fast-check';
+import { describe, expect, it } from 'vitest';
+import {
+  IPC_ERROR_MESSAGES,
+  appInfoRequestSchema,
+  appInfoResponseSchema,
+  appInfoSchema,
+  createIpcError,
+  ipcErrorCodeSchema,
+  ipcErrorSchema,
+  ipcResultSchema,
+} from './index';
+import { z } from 'zod';
+
+// R4: malformed input never throws out of safeParse and never yields a widened value.
+const validInfo = fc.record({
+  name: fc.string({ minLength: 1, maxLength: 64 }),
+  version: fc.string({ minLength: 1, maxLength: 64 }),
+  platform: fc.constantFrom('win32', 'darwin', 'linux'),
+});
+
+describe('IPC contract properties', () => {
+  it('safeParse never throws for arbitrary values', () => {
+    fc.assert(
+      fc.property(fc.anything(), (value) => {
+        expect(() => appInfoSchema.safeParse(value)).not.toThrow();
+        expect(() => appInfoResponseSchema.safeParse(value)).not.toThrow();
+        expect(() => appInfoRequestSchema.safeParse(value)).not.toThrow();
+        expect(() => ipcErrorSchema.safeParse(value)).not.toThrow();
+      }),
+    );
+  });
+
+  it('safeParse survives hostile prototype-pollution keys without polluting', () => {
+    const payload: unknown = JSON.parse(
+      '{"ok":true,"data":{"name":"a","version":"1","platform":"linux","__proto__":{"x":1}}}',
+    );
+    expect(appInfoResponseSchema.safeParse(payload).success).toBe(false);
+    expect(({} as Record<string, unknown>)['x']).toBeUndefined();
+  });
+
+  it('accepts valid AppInfo and round-trips it unchanged', () => {
+    fc.assert(
+      fc.property(validInfo, (info) => {
+        const parsed = appInfoSchema.parse(info);
+        expect(parsed).toEqual(info);
+        expect(appInfoResponseSchema.parse({ ok: true, data: info })).toEqual({
+          ok: true,
+          data: info,
+        });
+      }),
+    );
+  });
+
+  it('rejects any extra field on AppInfo and on the response envelope', () => {
+    fc.assert(
+      fc.property(
+        validInfo,
+        fc.string({ minLength: 1 }).filter((k) => !['name', 'version', 'platform'].includes(k)),
+        fc.anything(),
+        (info, key, value) => {
+          const extra = Object.defineProperty({ ...info }, key, { value, enumerable: true });
+          expect(appInfoSchema.safeParse(extra).success).toBe(false);
+          expect(
+            appInfoResponseSchema.safeParse({ ok: true, data: info, [key]: value }).success,
+          ).toBe(false);
+        },
+      ),
+    );
+  });
+
+  it('rejects out-of-bound names, versions and unknown platforms', () => {
+    fc.assert(
+      fc.property(
+        fc.oneof(fc.constant(''), fc.string({ minLength: 65, maxLength: 200 })),
+        fc.string().filter((p) => !['win32', 'darwin', 'linux'].includes(p)),
+        (badText, badPlatform) => {
+          expect(
+            appInfoSchema.safeParse({ name: badText, version: '1', platform: 'linux' }).success,
+          ).toBe(false);
+          expect(
+            appInfoSchema.safeParse({ name: 'a', version: badText, platform: 'linux' }).success,
+          ).toBe(false);
+          expect(
+            appInfoSchema.safeParse({ name: 'a', version: '1', platform: badPlatform }).success,
+          ).toBe(false);
+        },
+      ),
+    );
+  });
+
+  it('the request tuple accepts only the empty argument list', () => {
+    fc.assert(
+      fc.property(fc.array(fc.anything(), { minLength: 1, maxLength: 5 }), (args) => {
+        expect(appInfoRequestSchema.safeParse(args).success).toBe(false);
+      }),
+    );
+    expect(appInfoRequestSchema.safeParse([]).success).toBe(true);
+  });
+
+  it('error codes outside the enum never parse; known codes always carry the fixed message', () => {
+    fc.assert(
+      fc.property(
+        fc.string().filter((c) => !ipcErrorCodeSchema.options.includes(c as never)),
+        (code) => {
+          expect(ipcErrorSchema.safeParse({ code, message: 'x' }).success).toBe(false);
+        },
+      ),
+    );
+    for (const code of ipcErrorCodeSchema.options) {
+      expect(createIpcError(code).message).toBe(IPC_ERROR_MESSAGES[code]);
+      expect(ipcErrorSchema.safeParse(createIpcError(code)).success).toBe(true);
+    }
+  });
+
+  it('the result envelope is discriminated: ok true with error, or ok false with data, never parses', () => {
+    const schema = ipcResultSchema(z.number());
+    fc.assert(
+      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (n) => {
+        expect(schema.safeParse({ ok: true, error: createIpcError('INTERNAL') }).success).toBe(
+          false,
+        );
+        expect(schema.safeParse({ ok: false, data: n }).success).toBe(false);
+        expect(schema.safeParse({ ok: true, data: n }).success).toBe(true);
+      }),
+    );
+  });
+
+  it('no error message in the contract carries a path or stack marker', () => {
+    for (const message of Object.values(IPC_ERROR_MESSAGES)) {
+      expect(message).not.toMatch(/[\\/]|\bat\s|Error:|ghp_/);
+    }
+  });
+});
diff --git a/src/shared/ipc/necroamp-api.ts b/src/shared/ipc/necroamp-api.ts
new file mode 100644
index 0000000..37a2929
--- /dev/null
+++ b/src/shared/ipc/necroamp-api.ts
@@ -0,0 +1,10 @@
+/**
+ * Renderer-facing bridge shape implemented by the preload (`window.necroamp`).
+ * Methods return `Promise<unknown>`: the renderer adapter parses with the shared
+ * response schemas. No raw IPC, generic invoke, filesystem or Electron objects.
+ */
+export interface NecroampApi {
+  readonly app: {
+    readonly getInfo: () => Promise<unknown>;
+  };
+}
diff --git a/src/shared/ipc/result.test.ts b/src/shared/ipc/result.test.ts
new file mode 100644
index 0000000..848675e
--- /dev/null
+++ b/src/shared/ipc/result.test.ts
@@ -0,0 +1,61 @@
+import { describe, expect, it } from 'vitest';
+import { z } from 'zod';
+import {
+  IPC_ERROR_MESSAGES,
+  createIpcError,
+  ipcErrorCodeSchema,
+  ipcErrorSchema,
+  ipcResultSchema,
+} from './result';
+
+describe('ipcErrorSchema', () => {
+  it('accepts every code with its fixed message', () => {
+    for (const code of ipcErrorCodeSchema.options) {
+      expect(ipcErrorSchema.safeParse(createIpcError(code)).success).toBe(true);
+    }
+  });
+
+  it('rejects unknown codes, extra keys and long messages', () => {
+    expect(ipcErrorSchema.safeParse({ code: 'NOPE', message: 'x' }).success).toBe(false);
+    expect(ipcErrorSchema.safeParse({ code: 'INTERNAL', message: 'x', stack: 's' }).success).toBe(
+      false,
+    );
+    expect(ipcErrorSchema.safeParse({ code: 'INTERNAL', message: 'x'.repeat(121) }).success).toBe(
+      false,
+    );
+  });
+
+  it('keeps fixed messages within bounds and free of path separators', () => {
+    for (const message of Object.values(IPC_ERROR_MESSAGES)) {
+      expect(message.length).toBeLessThanOrEqual(120);
+      expect(message).not.toMatch(/[\\/]/);
+    }
+  });
+});
+
+describe('ipcResultSchema', () => {
+  const schema = ipcResultSchema(z.strictObject({ n: z.number() }));
+
+  it('accepts ok and error results', () => {
+    expect(schema.safeParse({ ok: true, data: { n: 1 } }).success).toBe(true);
+    expect(schema.safeParse({ ok: false, error: createIpcError('INTERNAL') }).success).toBe(true);
+  });
+
+  it.each([
+    null,
+    undefined,
+    'str',
+    42,
+    [],
+    {},
+    { ok: true },
+    { ok: true, data: { n: 'x' } },
+    { ok: true, data: { n: 1 }, extra: 1 },
+    { ok: false },
+    { ok: false, error: { code: 'INTERNAL' } },
+    { ok: false, error: createIpcError('INTERNAL'), data: { n: 1 } },
+    { ok: 'true', data: { n: 1 } },
+  ])('rejects malformed result %j', (input) => {
+    expect(schema.safeParse(input).success).toBe(false);
+  });
+});
diff --git a/src/shared/ipc/result.ts b/src/shared/ipc/result.ts
new file mode 100644
index 0000000..146c0d8
--- /dev/null
+++ b/src/shared/ipc/result.ts
@@ -0,0 +1,32 @@
+import { z } from 'zod';
+
+export const ipcErrorCodeSchema = z.enum(['INVALID_SENDER', 'INVALID_PAYLOAD', 'INTERNAL']);
+export type IpcErrorCode = z.infer<typeof ipcErrorCodeSchema>;
+
+export const ipcErrorSchema = z.strictObject({
+  code: ipcErrorCodeSchema,
+  message: z.string().max(120),
+});
+export type IpcError = z.infer<typeof ipcErrorSchema>;
+
+/** Fixed, user-safe messages. Never derived from an exception, path or payload. */
+export const IPC_ERROR_MESSAGES: Readonly<Record<IpcErrorCode, string>> = Object.freeze({
+  INVALID_SENDER: 'The request came from an untrusted sender.',
+  INVALID_PAYLOAD: 'The request payload is invalid.',
+  INTERNAL: 'An internal error occurred.',
+});
+
+export function createIpcError(code: IpcErrorCode): IpcError {
+  return { code, message: IPC_ERROR_MESSAGES[code] };
+}
+
+/** Builds the result union for a channel: `{ ok: true, data }` or `{ ok: false, error }`. */
+export function ipcResultSchema<T extends z.ZodType>(dataSchema: T) {
+  return z.discriminatedUnion('ok', [
+    z.strictObject({ ok: z.literal(true), data: dataSchema }),
+    z.strictObject({ ok: z.literal(false), error: ipcErrorSchema }),
+  ]);
+}
+
+export type IpcResult<T> =
+  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: IpcError };
diff --git a/tests/a11y/requirements-conformance.test.tsx b/tests/a11y/requirements-conformance.test.tsx
new file mode 100644
index 0000000..da4a32d
--- /dev/null
+++ b/tests/a11y/requirements-conformance.test.tsx
@@ -0,0 +1,77 @@
+import { render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { describe, expect, it } from 'vitest';
+import { AppShell } from '@renderer/app/app-shell';
+import { createAppInfoStore } from '@renderer/stores/app-info-store';
+
+// R8 conformance of the visible shell against .kiro/specs/desktop-foundation/requirements.md.
+// Defects 0002-0004 (docs/testing/defects/) are fixed, so these are normal tests. A test for a known
+// open defect uses `it.fails` and must be switched to `it` in the same change as the fix.
+async function shell() {
+  const store = createAppInfoStore({
+    getAppInfo: () =>
+      Promise.resolve({
+        ok: true as const,
+        data: { name: 'NecroAmp', version: '1.0.0', platform: 'linux' as const },
+      }),
+  });
+  render(<AppShell appInfoStore={store} />);
+  await store.getState().load();
+  return store;
+}
+
+describe('R8 placeholders', () => {
+  it('R8.4: Previous, Play, Pause, Stop and Next exist, make no change and show a not-implemented note', async () => {
+    const user = userEvent.setup();
+    await shell();
+    const player = within(screen.getByTestId('player'));
+    for (const name of ['Previous', 'Play', 'Pause', 'Stop', 'Next']) {
+      const button = player.getByRole('button', { name });
+      await user.click(button);
+      expect(button).toHaveAttribute('aria-disabled', 'true');
+    }
+    expect(player.getAllByText(/not implemented in this phase/i).length).toBeGreaterThan(0);
+    expect(player.getByText('No track loaded')).toBeInTheDocument();
+  });
+
+  it('R8.6: ten inert band placeholders labelled Band 1 to Band 10', async () => {
+    await shell();
+    const eq = within(screen.getByTestId('equalizer'));
+    for (let i = 1; i <= 10; i += 1)
+      expect(eq.getByRole('group', { name: `Band ${i}` })).toBeInTheDocument();
+    expect(eq.queryAllByRole('slider')).toHaveLength(0);
+  });
+
+  it('R8.9 (partial): the GitHub region states that the integration is optional and has an inert sign-in', async () => {
+    await shell();
+    const github = within(screen.getByTestId('github'));
+    expect(github.getByText(/features are optional/i)).toBeInTheDocument();
+    expect(github.getByRole('button', { name: /sign in/i })).toHaveAttribute(
+      'aria-disabled',
+      'true',
+    );
+  });
+
+  // Defect 0002: R8.5, the playlist has no list element for future items.
+  it('R8.5: the playlist region contains a heading, an empty-state message and a list element', async () => {
+    await shell();
+    const playlist = within(screen.getByTestId('playlist'));
+    expect(playlist.getByRole('heading')).toBeInTheDocument();
+    expect(playlist.getByText(/empty/i)).toBeInTheDocument();
+    expect(playlist.getByRole('list')).toBeInTheDocument();
+  });
+
+  // Defect 0003: R8.8, there is no "Foundation default" entry.
+  it('R8.8: the skin region shows a single non-functional "Foundation default" entry', async () => {
+    await shell();
+    expect(
+      within(screen.getByTestId('skin-selector')).getByText('Foundation default'),
+    ).toBeInTheDocument();
+  });
+
+  // Defect 0004: R8.9, the text never says that the user is not signed in.
+  it('R8.9: the GitHub region says the integration is optional and not signed in', async () => {
+    await shell();
+    expect(within(screen.getByTestId('github')).getByText(/not signed in/i)).toBeInTheDocument();
+  });
+});
diff --git a/tests/a11y/shell-a11y.test.tsx b/tests/a11y/shell-a11y.test.tsx
new file mode 100644
index 0000000..0da19c5
--- /dev/null
+++ b/tests/a11y/shell-a11y.test.tsx
@@ -0,0 +1,212 @@
+import { readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { describe, expect, it } from 'vitest';
+import { AppShell } from '@renderer/app/app-shell';
+import { REGION_IDS } from '@renderer/app/shell-layout';
+import { STRINGS } from '@renderer/app/strings/en';
+import { contrastRatio, parseHexColor, readCustomProperties } from '@renderer/app/theme/contrast';
+import { createAppInfoStore, type AppInfoClientResult } from '@renderer/stores/app-info-store';
+
+// T6.4 (R9): names, roles, one h1, lang, focus order, aria-disabled placeholders, focus indicator contrast.
+// These complement the axe scan in the E2E suite; jsdom has no layout, so contrast is read from tokens.
+const LOADED: AppInfoClientResult = {
+  ok: true,
+  data: { name: 'NecroAmp', version: '1.2.3', platform: 'linux' },
+};
+
+async function renderShell(result: AppInfoClientResult = LOADED) {
+  const store = createAppInfoStore({ getAppInfo: () => Promise.resolve(result) });
+  const view = render(<AppShell appInfoStore={store} />);
+  await screen.findAllByRole('status');
+  await store.getState().load();
+  return view;
+}
+
+describe('accessible names and structure (R9.1, R9.2)', () => {
+  it('gives every button, group and region a non-empty accessible name', async () => {
+    await renderShell();
+    for (const button of screen.getAllByRole('button')) {
+      expect(button, button.outerHTML).toHaveAccessibleName();
+    }
+    for (const group of screen.getAllByRole('group')) {
+      expect(group, group.outerHTML).toHaveAccessibleName();
+    }
+    for (const id of REGION_IDS) {
+      expect(screen.getByRole('region', { name: STRINGS.regions[id] })).toBeInTheDocument();
+    }
+  });
+
+  it('has unique ids and every aria reference resolves to an existing element', async () => {
+    const { container } = await renderShell();
+    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id);
+    expect(new Set(ids).size).toBe(ids.length);
+    for (const attr of ['aria-labelledby', 'aria-describedby'] as const) {
+      for (const el of container.querySelectorAll(`[${attr}]`)) {
+        for (const ref of (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)) {
+          expect(container.querySelector(`#${CSS.escape(ref)}`), `${attr}=${ref}`).not.toBeNull();
+        }
+      }
+    }
+  });
+
+  it('keeps heading levels sequential below the single h1', async () => {
+    await renderShell();
+    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
+    expect(levels.filter((l) => l === 1)).toHaveLength(1);
+    expect(levels[0]).toBe(1);
+    for (let i = 1; i < levels.length; i += 1) {
+      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
+    }
+  });
+
+  it('uses no positive tabindex and no focusable non-interactive element', async () => {
+    const { container } = await renderShell();
+    for (const el of container.querySelectorAll('[tabindex]')) {
+      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
+    }
+  });
+
+  it('declares the document language in the HTML entry', () => {
+    const html = readFileSync(join(process.cwd(), 'src', 'renderer', 'index.html'), 'utf8');
+    expect(html).toMatch(/<html[^>]*\blang="en"/);
+  });
+});
+
+describe('keyboard navigation (R9.2, R9.5)', () => {
+  it('reaches every control with Tab in DOM order, with no trap and no dead end', async () => {
+    const user = userEvent.setup();
+    const { container } = await renderShell();
+    const expected = [
+      ...container.querySelectorAll<HTMLElement>(
+        'button, [href], input, select, textarea, [tabindex="0"]',
+      ),
+    ];
+    expect(expected.length).toBeGreaterThan(0);
+    const visited: HTMLElement[] = [];
+    for (let i = 0; i < expected.length; i += 1) {
+      await user.tab();
+      visited.push(document.activeElement as HTMLElement);
+    }
+    expect(visited).toEqual(expected);
+    // One more Tab leaves the document content (focus returns to body in jsdom).
+    await user.tab();
+    expect(expected).not.toContain(document.activeElement);
+  });
+
+  it('moves backwards with Shift+Tab symmetrically', async () => {
+    const user = userEvent.setup();
+    const { container } = await renderShell();
+    const expected = [...container.querySelectorAll<HTMLElement>('button')];
+    for (let i = 0; i < expected.length; i += 1) await user.tab();
+    for (let i = expected.length - 1; i >= 0; i -= 1) {
+      expect(document.activeElement).toBe(expected[i]);
+      await user.tab({ shift: true });
+    }
+  });
+
+  it('keeps focus order equal to region order (player controls before playlist controls)', async () => {
+    await renderShell();
+    const regionsInDom = screen.getAllByRole('region').map((r) => r.getAttribute('data-region'));
+    expect(regionsInDom).toEqual([...REGION_IDS]);
+    const buttonRegions = screen
+      .getAllByRole('button')
+      .map((b) => b.closest('[data-region]')?.getAttribute('data-region'));
+    const firstSeen = [...new Set(buttonRegions)];
+    const order = firstSeen.map((id) => REGION_IDS.indexOf(id as (typeof REGION_IDS)[number]));
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+  });
+});
+
+describe('unavailable placeholder controls (R9.4, R9.6)', () => {
+  it('are focusable, aria-disabled, never natively disabled, and explain themselves', async () => {
+    await renderShell();
+    const buttons = screen.getAllByRole('button');
+    expect(buttons.length).toBeGreaterThanOrEqual(5);
+    for (const button of buttons) {
+      expect(button).not.toBeDisabled();
+      expect(button).toHaveAttribute('aria-disabled', 'true');
+      button.focus();
+      expect(button).toHaveFocus();
+      const describedBy = button.getAttribute('aria-describedby');
+      if (describedBy !== null) {
+        expect(document.getElementById(describedBy)?.textContent?.trim()).not.toBe('');
+      }
+    }
+  });
+
+  it.each(['click', 'Enter', 'Space'] as const)(
+    'activation by %s does nothing destructive and keeps focus',
+    async (how) => {
+      const user = userEvent.setup();
+      await renderShell();
+      const play = within(screen.getByTestId('player')).getByRole('button', {
+        name: STRINGS.player.controls.play,
+      });
+      play.focus();
+      if (how === 'click') await user.click(play);
+      else await user.keyboard(how === 'Enter' ? '{Enter}' : ' ');
+      expect(play).toBeInTheDocument();
+      expect(play).toHaveFocus();
+      expect(play).toHaveAttribute('aria-disabled', 'true');
+    },
+  );
+
+  it('shows a visible text reason for each unavailable region, not only color', async () => {
+    await renderShell();
+    expect(
+      within(screen.getByTestId('equalizer')).getByText(STRINGS.equalizer.unavailable),
+    ).toBeVisible();
+    expect(
+      within(screen.getByTestId('visualization')).getByText(STRINGS.visualizer.unavailable),
+    ).toBeVisible();
+    expect(within(screen.getByTestId('skin-selector')).getByText(STRINGS.skins.none)).toBeVisible();
+    expect(within(screen.getByTestId('playlist')).getByText(STRINGS.playlist.empty)).toBeVisible();
+  });
+});
+
+describe('status announcements (R9.7)', () => {
+  it('announces the bridge failure through a status region without raw error data', async () => {
+    await renderShell({ ok: false, reason: 'invalid-response' });
+    const status = screen.getAllByRole('status')[0]!;
+    expect(status).toHaveTextContent(STRINGS.bridgeFailure['invalid-response']);
+  });
+});
+
+describe('focus indicator and text contrast from tokens (R9.3)', () => {
+  const root = join(process.cwd(), 'src', 'renderer', 'app', 'styles');
+  const tokens = readCustomProperties(readFileSync(join(root, 'tokens.css'), 'utf8'));
+  const rgb = (name: string) => {
+    const value = parseHexColor(tokens.get(name) ?? '');
+    if (value === undefined) throw new Error(`${name} is not a hex color`);
+    return value;
+  };
+
+  it.each([
+    '--na-color-app-bg',
+    '--na-color-surface',
+    '--na-color-surface-raised',
+    '--na-color-surface-inset',
+  ])('focus color has at least 3:1 contrast against %s (WCAG 1.4.11)', (surface) => {
+    expect(contrastRatio(rgb('--na-color-focus'), rgb(surface))).toBeGreaterThanOrEqual(3);
+  });
+
+  it.each(['--na-color-surface', '--na-color-surface-raised', '--na-color-surface-inset'])(
+    'text and muted text have at least 4.5:1 contrast against %s (WCAG 1.4.3)',
+    (surface) => {
+      for (const text of ['--na-color-text', '--na-color-text-muted']) {
+        expect(
+          contrastRatio(rgb(text), rgb(surface)),
+          `${text} on ${surface}`,
+        ).toBeGreaterThanOrEqual(4.5);
+      }
+    },
+  );
+
+  it('control borders have at least 3:1 contrast against the surface', () => {
+    expect(
+      contrastRatio(rgb('--na-color-border-control'), rgb('--na-color-surface')),
+    ).toBeGreaterThanOrEqual(3);
+  });
+});
diff --git a/tests/config/alias-consistency.test.ts b/tests/config/alias-consistency.test.ts
new file mode 100644
index 0000000..13d1d7f
--- /dev/null
+++ b/tests/config/alias-consistency.test.ts
@@ -0,0 +1,74 @@
+import { readFileSync } from 'node:fs';
+import { fileURLToPath } from 'node:url';
+import path from 'node:path';
+import { describe, expect, it } from 'vitest';
+import electronViteConfig from '../../electron.vite.config';
+import { alias as vitestAlias } from '../../vitest.config';
+
+const root = fileURLToPath(new URL('../..', import.meta.url));
+
+interface TsConfig {
+  compilerOptions?: { paths?: Record<string, string[]> };
+}
+
+function readTsPaths(file: string): Record<string, string> {
+  const parsed = JSON.parse(readFileSync(path.join(root, file), 'utf8')) as TsConfig;
+  const paths = parsed.compilerOptions?.paths ?? {};
+  const out: Record<string, string> = {};
+  for (const [key, targets] of Object.entries(paths)) {
+    const target = targets[0];
+    if (target === undefined) continue;
+    // "@shared/*" -> "@shared", "./src/shared/*" -> absolute src/shared
+    out[key.replace(/\/\*$/, '')] = path.resolve(root, target.replace(/\/\*$/, ''));
+  }
+  return out;
+}
+
+function normalize(table: Record<string, string>): Record<string, string> {
+  const out: Record<string, string> = {};
+  for (const key of Object.keys(table).sort()) {
+    out[key] = path.resolve(table[key] as string);
+  }
+  return out;
+}
+
+function viteAliasOf(target: 'main' | 'preload' | 'renderer'): Record<string, string> {
+  const section = (electronViteConfig as Record<string, unknown>)[target] as {
+    resolve?: { alias?: Record<string, string> };
+  };
+  return section.resolve?.alias ?? {};
+}
+
+describe('alias tables (R2.2)', () => {
+  const reference = normalize(vitestAlias);
+
+  it('defines exactly the three approved aliases', () => {
+    expect(Object.keys(reference)).toEqual(['@main', '@renderer', '@shared']);
+  });
+
+  it.each(['main', 'preload', 'renderer'] as const)(
+    'electron-vite %s alias equals the Vitest alias',
+    (target) => {
+      expect(normalize(viteAliasOf(target))).toEqual(reference);
+    },
+  );
+
+  // Project tsconfigs expose only the aliases their boundary may import
+  // (renderer has no @main, preload only @shared). Each entry must still map
+  // to the reference path, and the tests project carries the full table.
+  const expectedKeys: Record<string, string[]> = {
+    'tsconfig.shared.json': ['@shared'],
+    'tsconfig.preload.json': ['@shared'],
+    'tsconfig.main.json': ['@main', '@shared'],
+    'tsconfig.renderer.json': ['@renderer', '@shared'],
+    'tsconfig.tests.json': ['@main', '@renderer', '@shared'],
+  };
+
+  it.each(Object.entries(expectedKeys))('%s paths map to the reference table', (file, keys) => {
+    const paths = normalize(readTsPaths(file));
+    expect(Object.keys(paths).sort()).toEqual(keys);
+    for (const key of keys) {
+      expect(paths[key]).toBe(reference[key]);
+    }
+  });
+});
diff --git a/tests/e2e/a11y.spec.ts b/tests/e2e/a11y.spec.ts
new file mode 100644
index 0000000..2202960
--- /dev/null
+++ b/tests/e2e/a11y.spec.ts
@@ -0,0 +1,31 @@
+import AxeBuilder from '@axe-core/playwright';
+import { expect, test } from './fixtures/launch';
+
+// T7.4 (R9.6, V10): automated accessibility scan of the real page. Imports of axe stay in tests/e2e (E1).
+test.describe('accessibility scan', () => {
+  test('has no serious or critical axe violations in the initial window', async ({ page }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    await expect(page.getByText('Connected')).toBeVisible();
+    const results = await new AxeBuilder({ page })
+      // Electron cannot create the extra page that cross-frame mode needs (Target.createTarget is unsupported).
+      // The shell has no iframe, so single-frame legacy mode scans the whole document.
+      .setLegacyMode(true)
+      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
+      .analyze();
+    const blocking = results.violations
+      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
+      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }));
+    expect(blocking).toEqual([]);
+    // Recorded for the report: minor and moderate findings and checks that need review.
+    test.info().annotations.push({
+      type: 'axe',
+      description: JSON.stringify({
+        passes: results.passes.length,
+        nonBlocking: results.violations
+          .filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
+          .map((v) => `${v.id}:${v.impact}`),
+        incomplete: results.incomplete.map((v) => v.id),
+      }),
+    });
+  });
+});
diff --git a/tests/e2e/fixtures/launch.ts b/tests/e2e/fixtures/launch.ts
new file mode 100644
index 0000000..e91043e
--- /dev/null
+++ b/tests/e2e/fixtures/launch.ts
@@ -0,0 +1,108 @@
+import type { ChildProcess } from 'node:child_process';
+import { mkdtempSync, rmSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import {
+  _electron as electron,
+  test as base,
+  type ElectronApplication,
+  type Page,
+} from '@playwright/test';
+
+// T7.1: launch fixture. Every test gets its own temporary user-data directory and a bounded teardown that also runs on failure.
+export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
+const E2E_USER_DATA_ENV = 'NECROAMP_E2E_USER_DATA';
+
+export interface LaunchedApp {
+  readonly app: ElectronApplication;
+  readonly userData: string;
+  /** Captured at launch: app.process() is unusable once Playwright has disposed the app handle. */
+  readonly child: ChildProcess;
+  /** Lines the main process wrote to stdout and stderr (the app logger uses console). */
+  readonly logs: string[];
+  readonly env: NodeJS.ProcessEnv;
+}
+
+export function launchEnv(userData: string): NodeJS.ProcessEnv {
+  const env: NodeJS.ProcessEnv = { ...process.env, [E2E_USER_DATA_ENV]: userData };
+  // The production build must never use a dev server or run as plain Node.
+  delete env['ELECTRON_RENDERER_URL'];
+  delete env['ELECTRON_RUN_AS_NODE'];
+  return env;
+}
+
+export function makeUserData(): string {
+  // path.normalize keeps the value identical to what main's override check expects on every platform.
+  return path.normalize(mkdtempSync(path.join(tmpdir(), 'necroamp-e2e-')));
+}
+
+export async function launchApp(userData = makeUserData()): Promise<LaunchedApp> {
+  const env = launchEnv(userData);
+  // The app path is the repository root, so main finds package.json and out/renderer.
+  const cleanEnv = Object.fromEntries(
+    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
+  );
+  const app = await electron.launch({ args: [REPO_ROOT], cwd: REPO_ROOT, env: cleanEnv });
+  const logs: string[] = [];
+  const collect = (chunk: Buffer | string): void => {
+    for (const line of chunk.toString().split(/\r?\n/)) if (line !== '') logs.push(line);
+  };
+  const child = app.process();
+  child.stdout?.on('data', collect);
+  child.stderr?.on('data', collect);
+  return { app, userData, child, logs, env };
+}
+
+function hasExited(child: ChildProcess): boolean {
+  return child.exitCode !== null || child.signalCode !== null;
+}
+
+/** Closes the app within a bound and kills it if it does not exit. Safe to call twice. */
+export async function shutdownApp(launched: LaunchedApp): Promise<void> {
+  const { app, child } = launched;
+  if (!hasExited(child)) {
+    const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
+    await Promise.race([
+      app.close().catch(() => undefined),
+      new Promise<void>((resolve) => setTimeout(resolve, 8_000)),
+    ]);
+    if (!hasExited(child)) {
+      child.kill('SIGKILL');
+      await exited;
+    }
+  }
+  rmSync(launched.userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
+}
+
+export async function firstWindow(app: ElectronApplication): Promise<Page> {
+  const page = await app.firstWindow();
+  await page.waitForLoadState('domcontentloaded');
+  return page;
+}
+
+interface Fixtures {
+  launched: LaunchedApp;
+  app: ElectronApplication;
+  page: Page;
+}
+
+export const test = base.extend<Fixtures>({
+  // Playwright reads the fixture dependencies from the first parameter, so it must be a destructuring pattern.
+  // eslint-disable-next-line no-empty-pattern
+  launched: async ({}, use) => {
+    const launched = await launchApp();
+    try {
+      await use(launched);
+    } finally {
+      await shutdownApp(launched);
+    }
+  },
+  app: async ({ launched }, use) => {
+    await use(launched.app);
+  },
+  page: async ({ app }, use) => {
+    await use(await firstWindow(app));
+  },
+});
+
+export { expect } from '@playwright/test';
diff --git a/tests/e2e/global-setup.ts b/tests/e2e/global-setup.ts
new file mode 100644
index 0000000..1d9ba1b
--- /dev/null
+++ b/tests/e2e/global-setup.ts
@@ -0,0 +1,31 @@
+import { existsSync, readdirSync, statSync } from 'node:fs';
+import path from 'node:path';
+
+// T7.1: fail fast when the production build is missing or older than the sources it was built from.
+const root = path.resolve(__dirname, '..', '..');
+const REQUIRED = ['out/main/index.js', 'out/preload/index.js', 'out/renderer/index.html'];
+
+function newestSourceMtime(dir: string): number {
+  let newest = 0;
+  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
+    if (!entry.isFile() || /\.(test|d)\.tsx?$/.test(entry.name)) continue;
+    newest = Math.max(newest, statSync(path.join(entry.parentPath, entry.name)).mtimeMs);
+  }
+  return newest;
+}
+
+export default function globalSetup(): void {
+  const missing = REQUIRED.filter((file) => !existsSync(path.join(root, file)));
+  if (missing.length > 0) {
+    throw new Error(`Missing build output (${missing.join(', ')}). Run "pnpm build" first.`);
+  }
+  const oldestBuild = Math.min(...REQUIRED.map((f) => statSync(path.join(root, f)).mtimeMs));
+  const sources = ['src', 'electron.vite.config.ts'].map((p) => path.join(root, p));
+  const newestSource = Math.max(
+    newestSourceMtime(sources[0] as string),
+    statSync(sources[1] as string).mtimeMs,
+  );
+  if (newestSource > oldestBuild) {
+    throw new Error('The build in out/ is older than the sources. Run "pnpm build" first.');
+  }
+}
diff --git a/tests/e2e/lifecycle.spec.ts b/tests/e2e/lifecycle.spec.ts
new file mode 100644
index 0000000..6f41ad8
--- /dev/null
+++ b/tests/e2e/lifecycle.spec.ts
@@ -0,0 +1,198 @@
+import { spawn } from 'node:child_process';
+import type { ChildProcess } from 'node:child_process';
+import { launchApp, launchEnv, REPO_ROOT, shutdownApp, test, expect } from './fixtures/launch';
+
+// T7.3 (R7, R8.11, R9.2): lifecycle, layout and keyboard E2E against the production build.
+const EXIT_BOUND_MS = 5_000;
+
+function exitOf(child: ChildProcess): Promise<number | null> {
+  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
+  return new Promise((resolve) => child.once('exit', (code) => resolve(code)));
+}
+
+async function exitsWithin(child: ChildProcess, ms: number): Promise<number | null | 'timeout'> {
+  return Promise.race([
+    exitOf(child),
+    new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms)),
+  ]);
+}
+
+test.describe('single instance', () => {
+  test('a second process with the same profile exits and leaves one window', async ({
+    app,
+    page,
+    launched,
+  }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const exe = await app.evaluate(() => process.execPath);
+    const second = spawn(exe, [REPO_ROOT], {
+      cwd: REPO_ROOT,
+      env: launchEnv(launched.userData),
+      stdio: 'ignore',
+    });
+    try {
+      expect(await exitsWithin(second, 15_000)).toBe(0);
+    } finally {
+      if (second.exitCode === null) second.kill('SIGKILL');
+    }
+    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
+    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
+  });
+});
+
+test.describe('shutdown', () => {
+  test('closing the last window follows the platform policy', async ({ app, page, launched }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close());
+    if (process.platform === 'darwin') {
+      // macOS keeps the app alive with no window (R7.3).
+      expect(await exitsWithin(launched.child, 1_500)).toBe('timeout');
+    } else {
+      expect(await exitsWithin(launched.child, EXIT_BOUND_MS)).toBe(0);
+    }
+  });
+
+  test('app.quit() exits with code 0 within five seconds', async ({ app, page, launched }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    await app.evaluate(({ app: electronApp }) => electronApp.quit()).catch(() => undefined);
+    expect(await exitsWithin(launched.child, EXIT_BOUND_MS)).toBe(0);
+  });
+});
+
+test.describe('renderer crash policy (R7.4)', () => {
+  test('reloads after the first crash and quits cleanly after the second', async ({
+    app,
+    page,
+    launched,
+  }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const crash = () =>
+      app.evaluate(({ BrowserWindow }) =>
+        BrowserWindow.getAllWindows()[0]?.webContents.forcefullyCrashRenderer(),
+      );
+    await crash();
+    // The crashed Playwright page handle is dead. The reloaded renderer is observed from main.
+    const probe = () =>
+      app.evaluate(async ({ BrowserWindow }) => {
+        const wc = BrowserWindow.getAllWindows()[0]?.webContents;
+        if (wc === undefined || wc.isCrashed() || wc.isLoading()) return null;
+        return (await wc.executeJavaScript('window.necroamp.app.getInfo()')) as unknown;
+      });
+    await expect.poll(probe).toMatchObject({ ok: true, data: { name: 'NecroAmp' } });
+    expect(launched.child.exitCode).toBeNull();
+    await crash();
+    expect(await exitsWithin(launched.child, 10_000)).toBe(0);
+    // The log carries event names and codes only, never paths or stacks.
+    const log = launched.logs.join('\n');
+    expect(log).toMatch(/render-process-gone|renderer\.gone|renderer/i);
+    expect(log).not.toMatch(/[A-Za-z]:\\|\.js:\d+|\bat\s+\S+\s+\(/);
+  });
+});
+
+test.describe('fresh profile per launch', () => {
+  test('two sequential launches use separate user-data directories and both quit', async () => {
+    const first = await launchApp();
+    await shutdownApp(first);
+    const second = await launchApp();
+    expect(second.userData).not.toBe(first.userData);
+    await shutdownApp(second);
+    expect(second.child.exitCode ?? second.child.signalCode).not.toBeNull();
+  });
+});
+
+test.describe('layout and keyboard', () => {
+  test('keeps the minimum window size', async ({ app, page }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const min = await app.evaluate(({ BrowserWindow }) =>
+      BrowserWindow.getAllWindows()[0]?.getMinimumSize(),
+    );
+    expect(min).toEqual([800, 600]);
+  });
+
+  for (const [width, height] of [
+    [800, 600],
+    [1920, 1080],
+  ] as const) {
+    test(`lays out six non-overlapping regions without horizontal overflow at ${width}x${height}`, async ({
+      app,
+      page,
+    }) => {
+      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+      await app.evaluate(
+        ({ BrowserWindow }, size) => {
+          BrowserWindow.getAllWindows()[0]?.setContentSize(size.width, size.height);
+        },
+        { width, height },
+      );
+      await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(width);
+      const metrics = await page.evaluate(() => ({
+        scrollWidth: document.documentElement.scrollWidth,
+        clientWidth: document.documentElement.clientWidth,
+        boxes: [...document.querySelectorAll('section[data-region]')].map((el) => {
+          const r = el.getBoundingClientRect();
+          return { id: el.getAttribute('data-region'), x: r.x, y: r.y, w: r.width, h: r.height };
+        }),
+      }));
+      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
+      expect(metrics.boxes).toHaveLength(6);
+      for (const b of metrics.boxes) {
+        expect(b.w, b.id ?? '').toBeGreaterThan(40);
+        expect(b.h, b.id ?? '').toBeGreaterThan(20);
+        expect(b.x).toBeGreaterThanOrEqual(0);
+        expect(b.x + b.w).toBeLessThanOrEqual(width + 0.5);
+      }
+      for (const [i, a] of metrics.boxes.entries()) {
+        for (const b of metrics.boxes.slice(i + 1)) {
+          const apart =
+            a.x + a.w <= b.x + 0.5 ||
+            b.x + b.w <= a.x + 0.5 ||
+            a.y + a.h <= b.y + 0.5 ||
+            b.y + b.h <= a.y + 0.5;
+          expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
+        }
+      }
+    });
+  }
+
+  test('Tab visits every button in DOM order with a visible focus ring and no trap', async ({
+    page,
+  }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const names = await page
+      .getByRole('button')
+      .evaluateAll((els) => els.map((e) => e.textContent));
+    expect(names.length).toBeGreaterThanOrEqual(5);
+    const seen: (string | null)[] = [];
+    for (let i = 0; i < names.length; i += 1) {
+      await page.keyboard.press('Tab');
+      seen.push(await page.evaluate(() => document.activeElement?.textContent ?? null));
+      const ring = await page.evaluate(() => {
+        const style = getComputedStyle(document.activeElement as Element);
+        return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
+      });
+      expect(ring.style).toBe('solid');
+      expect(ring.width).toBe('2px');
+      expect(ring.color).toBe('rgb(127, 180, 255)');
+    }
+    expect(seen).toEqual(names);
+    // An Electron window has no browser chrome, so Tab after the last control wraps to the first.
+    // Wrapping, and Shift+Tab walking back, proves there is no trap.
+    await page.keyboard.press('Tab');
+    expect(await page.evaluate(() => document.activeElement?.textContent ?? null)).toBe(names[0]);
+    await page.keyboard.press('Shift+Tab');
+    expect(await page.evaluate(() => document.activeElement?.textContent ?? null)).toBe(
+      names[names.length - 1],
+    );
+  });
+
+  test('an unavailable control stays focusable, keeps aria-disabled and reports itself', async ({
+    page,
+  }) => {
+    const play = page.getByTestId('player').getByRole('button', { name: 'Play', exact: true });
+    await play.focus();
+    await expect(play).toBeFocused();
+    await expect(play).toHaveAttribute('aria-disabled', 'true');
+    await play.press('Enter');
+    await expect(play).toBeFocused();
+  });
+});
diff --git a/tests/e2e/negative-sender.spec.ts b/tests/e2e/negative-sender.spec.ts
new file mode 100644
index 0000000..d2fcaf1
--- /dev/null
+++ b/tests/e2e/negative-sender.spec.ts
@@ -0,0 +1,146 @@
+import { createServer, type Server } from 'node:http';
+import type { AddressInfo } from 'node:net';
+import path from 'node:path';
+import type { ElectronApplication, Page } from '@playwright/test';
+import { expect, REPO_ROOT, test } from './fixtures/launch';
+
+// T7.2 (R4.4, CF-1, CF-2): real-Electron negative tests for IPC sender validation.
+// The app window is the only registered sender. Every probe window below carries the real preload
+// but is NOT registered, so main must answer INVALID_SENDER (never data) whatever frame asks.
+const PRELOAD = path.join(REPO_ROOT, 'out', 'preload', 'index.js');
+
+let server: Server;
+let origin: string;
+
+test.beforeAll(async () => {
+  server = createServer((req, res) => {
+    res.setHeader('content-type', 'text/html');
+    if (req.url === '/frame') {
+      res.end('<!doctype html><title>frame</title><p>frame</p>');
+    } else if (req.url === '/with-frame') {
+      res.end('<!doctype html><title>top</title><iframe id="f" src="/frame"></iframe>');
+    } else {
+      res.end('<!doctype html><title>foreign</title><p>foreign</p>');
+    }
+  });
+  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
+  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
+});
+
+test.afterAll(async () => {
+  await new Promise<void>((resolve) => server.close(() => resolve()));
+});
+
+async function openProbeWindow(
+  app: ElectronApplication,
+  url: string,
+  subFrames: boolean,
+): Promise<Page> {
+  const opened = app.waitForEvent('window');
+  await app.evaluate(
+    ({ BrowserWindow }, args) => {
+      const win = new BrowserWindow({
+        show: false,
+        webPreferences: {
+          preload: args.preload,
+          sandbox: true,
+          contextIsolation: true,
+          nodeIntegration: false,
+          nodeIntegrationInSubFrames: args.subFrames,
+        },
+      });
+      void win.loadURL(args.url);
+    },
+    { url, preload: PRELOAD, subFrames },
+  );
+  const page = await opened;
+  await page.waitForLoadState('domcontentloaded');
+  return page;
+}
+
+function expectInvalidSender(result: unknown): void {
+  expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
+  expect(result).not.toHaveProperty('data');
+  // No application data and no path or stack may leak through the refusal.
+  expect(JSON.stringify(result)).not.toMatch(/NecroAmp|version|platform|[A-Za-z]:\\|\.js:\d+/);
+}
+
+test.describe('IPC sender validation against the real main process', () => {
+  test('control: the registered app window is accepted', async ({ page }) => {
+    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({
+      ok: true,
+      data: { name: 'NecroAmp' },
+    });
+  });
+
+  test('rejects a foreign-origin top frame that has the bridge', async ({ app, page }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const probe = await openProbeWindow(app, `${origin}/`, false);
+    expect(await probe.evaluate(() => typeof window.necroamp?.app?.getInfo)).toBe('function');
+    expectInvalidSender(await probe.evaluate(() => window.necroamp.app.getInfo()));
+  });
+
+  test('blocks a foreign sub-frame navigation and gives a script-created sub-frame no usable bridge', async ({
+    app,
+    page,
+    launched,
+  }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    await openProbeWindow(app, `${origin}/with-frame`, true);
+    // Layer 1: the navigation guard stops the sub-frame from ever loading a foreign page.
+    await expect
+      .poll(() => launched.logs.filter((l) => l.includes('navigation.blocked')).length)
+      .toBeGreaterThan(0);
+    // Layer 2: a sub-frame the guard cannot see (script-created about:blank) still gets the preload
+    // because this probe window sets nodeIntegrationInSubFrames. Main must refuse it. Frames are
+    // read in main (WebFrameMain), the same objects main validates against.
+    await openProbeWindow(app, `${origin}/`, true);
+    const ask = (src: string) =>
+      app.evaluate(
+        async ({ BrowserWindow }, args) => {
+          const probe = BrowserWindow.getAllWindows().find(
+            (w) => w.webContents.getURL() === args.url,
+          );
+          const contents = probe?.webContents;
+          if (contents === undefined) return null;
+          if (contents.mainFrame.frames.length === 0) {
+            await contents.executeJavaScript(
+              'void document.body.appendChild(document.createElement("iframe"))',
+            );
+          }
+          const frame = contents.mainFrame.frames[0];
+          if (frame === undefined) return null;
+          return { url: frame.url, value: (await frame.executeJavaScript(args.code)) as unknown };
+        },
+        { code: src, url: `${origin}/` },
+      );
+    await expect
+      .poll(async () => (await ask('typeof window.necroamp'))?.url)
+      .toMatch(/^(about:blank)?$/);
+    // Observed on Electron 45.5.0: the preload does not run in the initial about:blank document of a
+    // script-created frame, so no bridge exists there and no IPC can originate from it. If a future
+    // Electron runs the preload there, the sender check must answer INVALID_SENDER (unit-tested).
+    const typeofBridge = (await ask('typeof window.necroamp'))?.value;
+    if (typeofBridge === 'undefined') {
+      expect(typeofBridge).toBe('undefined');
+    } else {
+      expectInvalidSender((await ask('window.necroamp.app.getInfo()'))?.value);
+    }
+    expect(launched.child.exitCode).toBeNull();
+  });
+  test('rejects a trusted-origin page in an unregistered web contents and shows a plain failure', async ({
+    app,
+    page,
+  }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const probe = await openProbeWindow(app, 'app://renderer/index.html', false);
+    expectInvalidSender(await probe.evaluate(() => window.necroamp.app.getInfo()));
+    await expect(probe.getByText('The application refused the request.')).toBeVisible();
+    await expect(probe.getByRole('region')).toHaveCount(6);
+  });
+
+  test('the app window still works after refusing the probes', async ({ app, page }) => {
+    await openProbeWindow(app, `${origin}/`, false);
+    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
+  });
+});
diff --git a/tests/e2e/smoke-security.spec.ts b/tests/e2e/smoke-security.spec.ts
new file mode 100644
index 0000000..120586a
--- /dev/null
+++ b/tests/e2e/smoke-security.spec.ts
@@ -0,0 +1,360 @@
+import { readFileSync } from 'node:fs';
+import path from 'node:path';
+import { expect, REPO_ROOT, test } from './fixtures/launch';
+
+// T7.2: smoke and security E2E against the production build (R3, R4, R5, R6, R8, R9, R15).
+const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
+  version: string;
+};
+const PLATFORM_LABEL: Record<string, string> = {
+  win32: 'Windows',
+  darwin: 'macOS',
+  linux: 'Linux',
+};
+// Independent oracle: the frozen production policy written out, not imported from source.
+const PRODUCTION_CSP = [
+  "default-src 'none'",
+  "script-src 'self'",
+  "style-src 'self'",
+  "img-src 'self'",
+  "font-src 'self'",
+  "connect-src 'none'",
+  "object-src 'none'",
+  "base-uri 'none'",
+  "form-action 'none'",
+  "frame-ancestors 'none'",
+  "frame-src 'none'",
+  "worker-src 'none'",
+  "media-src 'none'",
+  "manifest-src 'none'",
+].join('; ');
+const REGIONS = ['Player', 'Playlist', 'Equalizer', 'Visualizer', 'Skins', 'GitHub (optional)'];
+
+test.describe('startup and visible regions', () => {
+  test('opens exactly one visible window on app://renderer with the product title', async ({
+    app,
+    page,
+  }) => {
+    expect(app.windows()).toHaveLength(1);
+    expect(page.url()).toBe('app://renderer/index.html');
+    await expect(page).toHaveTitle('NecroAmp');
+    const state = await app.evaluate(({ BrowserWindow }) => {
+      const [win] = BrowserWindow.getAllWindows();
+      return { count: BrowserWindow.getAllWindows().length, visible: win?.isVisible() ?? false };
+    });
+    expect(state).toEqual({ count: 1, visible: true });
+  });
+
+  test('renders the heading, tagline and six labelled regions', async ({ page }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toHaveText('NecroAmp');
+    await expect(page.getByText('Code. Listen. Repeat.')).toBeVisible();
+    for (const name of REGIONS) {
+      await expect(page.getByRole('region', { name })).toBeVisible();
+    }
+    await expect(page.getByRole('region')).toHaveCount(6);
+    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
+  });
+
+  test('shows the version and platform reported by main over real IPC', async ({ page }) => {
+    await expect(page.getByText(pkg.version, { exact: true })).toBeVisible();
+    await expect(
+      page.getByText(PLATFORM_LABEL[process.platform] ?? '?', { exact: true }),
+    ).toBeVisible();
+    await expect(page.getByText('Connected')).toBeVisible();
+  });
+
+  test('has no uncaught page error and no console error on startup', async ({ app }) => {
+    const errors: string[] = [];
+    const page = await app.firstWindow();
+    page.on('pageerror', (e) => errors.push(e.name));
+    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
+    await page.reload();
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    expect(errors).toEqual([]);
+  });
+});
+
+test.describe('app:get-info IPC round trip', () => {
+  test('returns the validated payload through the preload bridge', async ({ page }) => {
+    const result = await page.evaluate(() => window.necroamp.app.getInfo());
+    expect(result).toEqual({
+      ok: true,
+      data: { name: 'NecroAmp', version: pkg.version, platform: process.platform },
+    });
+  });
+});
+
+test.describe('sandboxed preload and live web preferences', () => {
+  test('keeps every mandatory web preference on the live window', async ({ app, page }) => {
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    const prefs = await app.evaluate(({ BrowserWindow }) => {
+      const win = BrowserWindow.getAllWindows()[0];
+      return (
+        (
+          win?.webContents as unknown as { getLastWebPreferences(): unknown } | undefined
+        )?.getLastWebPreferences() ?? null
+      );
+    });
+    expect(prefs).toMatchObject({
+      contextIsolation: true,
+      sandbox: true,
+      nodeIntegration: false,
+      webSecurity: true,
+      webviewTag: false,
+      allowRunningInsecureContent: false,
+      nodeIntegrationInSubFrames: false,
+      nodeIntegrationInWorker: false,
+    });
+  });
+
+  test('exposes no Node or Electron global to the renderer', async ({ page }) => {
+    const types = await page.evaluate(() => ({
+      require: typeof (globalThis as { require?: unknown }).require,
+      process: typeof (globalThis as { process?: unknown }).process,
+      Buffer: typeof (globalThis as { Buffer?: unknown }).Buffer,
+      ipcRenderer: typeof (globalThis as { ipcRenderer?: unknown }).ipcRenderer,
+      electron: typeof (globalThis as { electron?: unknown }).electron,
+      module: typeof (globalThis as { module?: unknown }).module,
+    }));
+    expect(types).toEqual({
+      require: 'undefined',
+      process: 'undefined',
+      Buffer: 'undefined',
+      ipcRenderer: 'undefined',
+      electron: 'undefined',
+      module: 'undefined',
+    });
+  });
+
+  test('exposes exactly a frozen necroamp.app.getInfo and nothing else', async ({ page }) => {
+    const shape = await page.evaluate(() => {
+      const bridge = window.necroamp as unknown as Record<string, unknown>;
+      const app = bridge['app'] as Record<string, unknown>;
+      return {
+        keys: Object.keys(bridge),
+        appKeys: Object.keys(app),
+        frozen: Object.isFrozen(bridge) && Object.isFrozen(app),
+        getInfoType: typeof app['getInfo'],
+        rawIpc: Object.keys(window).filter((k) => /ipc|invoke|send/i.test(k)),
+      };
+    });
+    expect(shape).toEqual({
+      keys: ['app'],
+      appKeys: ['getInfo'],
+      frozen: true,
+      getInfoType: 'function',
+      rawIpc: [],
+    });
+  });
+
+  test('cannot overwrite the bridge from the renderer', async ({ page }) => {
+    const result = await page.evaluate(async () => {
+      try {
+        (window.necroamp.app as unknown as { getInfo: unknown }).getInfo = () => 'pwned';
+      } catch {
+        /* strict mode may throw; both outcomes are fine */
+      }
+      return window.necroamp.app.getInfo();
+    });
+    expect(result).toMatchObject({ ok: true });
+  });
+});
+
+test.describe('production CSP and app:// loading', () => {
+  test('serves index.html with the frozen production CSP header and nosniff', async ({ app }) => {
+    const headers = await app.evaluate(async ({ net }) => {
+      const res = await net.fetch('app://renderer/index.html');
+      return {
+        status: res.status,
+        type: res.headers.get('content-type'),
+        csp: res.headers.get('content-security-policy'),
+        nosniff: res.headers.get('x-content-type-options'),
+      };
+    });
+    expect(headers.status).toBe(200);
+    expect(headers.type).toMatch(/^text\/html/);
+    expect(headers.csp).toBe(PRODUCTION_CSP);
+    expect(headers.nosniff).toBe('nosniff');
+  });
+
+  test('has a meta CSP without frame-ancestors, no unsafe-* and no inline script in the DOM source', async ({
+    page,
+  }) => {
+    const meta = await page
+      .locator('meta[http-equiv="Content-Security-Policy"]')
+      .getAttribute('content');
+    expect(meta).toBe(PRODUCTION_CSP.replace("; frame-ancestors 'none'", ''));
+    expect(meta).not.toMatch(/unsafe-(inline|eval)/);
+    const scripts = await page.evaluate(() =>
+      [...document.scripts].map((s) => ({
+        src: s.getAttribute('src'),
+        inline: s.textContent?.trim(),
+      })),
+    );
+    expect(scripts).toHaveLength(1);
+    expect(scripts[0]?.src).toMatch(/^\.\/assets\/index-.+\.js$/);
+    expect(scripts[0]?.inline).toBe('');
+  });
+
+  test('blocks inline script, string eval and any renderer network request', async ({ page }) => {
+    // Playwright's evaluate bypasses the eval restriction, so eval is probed with a string timer,
+    // which the page's own CSP enforces. The violation event is the observable state.
+    const outcome = await page.evaluate(async () => {
+      const violations: string[] = [];
+      const seen = new Promise<void>((resolve) => {
+        document.addEventListener('securitypolicyviolation', (e) => {
+          violations.push(`${e.violatedDirective}|${e.blockedURI}`);
+          if (
+            violations.some((v) => v.startsWith('script-src|eval')) &&
+            violations.some((v) => v.startsWith('connect-src'))
+          ) {
+            resolve();
+          }
+        });
+      });
+      const script = document.createElement('script');
+      script.textContent = 'window.__inlineRan = true;';
+      document.head.appendChild(script);
+      window.setTimeout('window.__evalRan = true', 0);
+      let fetchBlocked = false;
+      try {
+        await fetch('https://example.com/');
+      } catch {
+        fetchBlocked = true;
+      }
+      await Promise.race([seen, new Promise((resolve) => setTimeout(resolve, 3_000))]);
+      const flags = window as { __inlineRan?: boolean; __evalRan?: boolean };
+      return {
+        inlineRan: flags.__inlineRan === true,
+        evalRan: flags.__evalRan === true,
+        fetchBlocked,
+        violations,
+      };
+    });
+    expect(outcome.inlineRan).toBe(false);
+    expect(outcome.evalRan).toBe(false);
+    expect(outcome.fetchBlocked).toBe(true);
+    const directives = outcome.violations.map((v) => v.split('|')[0]);
+    expect(directives).toEqual(
+      expect.arrayContaining(['script-src-elem', 'script-src', 'connect-src']),
+    );
+  });
+  test('loads every resource from app://renderer and nothing else', async ({ page }) => {
+    const urls: string[] = [];
+    page.on('request', (r) => urls.push(r.url()));
+    await page.reload();
+    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
+    expect(urls.length).toBeGreaterThan(2);
+    for (const url of urls) expect(url.startsWith('app://renderer/'), url).toBe(true);
+  });
+
+  test('protocol returns 404 for traversal, foreign hosts, missing files and NUL bytes', async ({
+    app,
+  }) => {
+    const targets = [
+      'app://renderer/missing.js',
+      'app://renderer/%2e%2e/package.json',
+      'app://renderer/..%2fpackage.json',
+      'app://renderer/..%5cpackage.json',
+      'app://renderer/assets/..%2f..%2f..%2fpackage.json',
+      'app://evil/index.html',
+      'app://renderer/index.html%00.png',
+    ];
+    const statuses = await app.evaluate(async ({ net }, urls) => {
+      const out: Record<string, number | string> = {};
+      for (const url of urls) {
+        try {
+          out[url] = (await net.fetch(url)).status;
+        } catch {
+          out[url] = 'error';
+        }
+      }
+      return out;
+    }, targets);
+    for (const url of targets) expect(['error', 404], url).toContain(statuses[url]);
+  });
+});
+
+test.describe('navigation, new windows and permissions', () => {
+  test('blocks and logs renderer navigation to https and http', async ({ page, launched }) => {
+    const urls = ['https://example.com/', 'http://example.com/'];
+    for (const [index, url] of urls.entries()) {
+      void page.evaluate((u) => void (window.location.href = u), url).catch(() => undefined);
+      await expect
+        .poll(() => launched.logs.filter((l) => l.includes('navigation.blocked')).length)
+        .toBeGreaterThan(index);
+      expect(page.url()).toBe('app://renderer/index.html');
+    }
+  });
+
+  test('keeps the app URL for file:, data: and javascript: navigations', async ({ app, page }) => {
+    for (const url of [
+      'file:///C:/Windows/win.ini',
+      'data:text/html,<h1>x</h1>',
+      'javascript:window.__js = 1',
+    ]) {
+      await page.evaluate((u) => void (window.location.href = u), url);
+    }
+    // IPC from the same renderer is ordered after the navigation requests above, so a completed round
+    // trip means every attempt has been processed. No sleep is needed.
+    expect(await page.evaluate(() => window.necroamp.app.getInfo())).toMatchObject({ ok: true });
+    expect(page.url()).toBe('app://renderer/index.html');
+    expect(await page.evaluate(() => (window as { __js?: number }).__js)).toBeUndefined();
+    const main = await app.evaluate(({ BrowserWindow }) => ({
+      url: BrowserWindow.getAllWindows()[0]?.webContents.getURL(),
+      count: BrowserWindow.getAllWindows().length,
+    }));
+    expect(main).toEqual({ url: 'app://renderer/index.html', count: 1 });
+  });
+  test('window.open returns null and opens no window', async ({ app, page }) => {
+    const opened = await page.evaluate(() => window.open('https://example.com/') === null);
+    expect(opened).toBe(true);
+    const count = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
+    expect(count).toBe(1);
+    expect(app.windows()).toHaveLength(1);
+  });
+
+  test('denies media and geolocation permission requests', async ({ page }) => {
+    const result = await page.evaluate(async () => {
+      let media = 'resolved';
+      try {
+        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
+        stream.getTracks().forEach((t) => t.stop());
+      } catch (e) {
+        media = (e as DOMException).name;
+      }
+      const geo = await new Promise<number>((resolve) =>
+        navigator.geolocation.getCurrentPosition(
+          () => resolve(0),
+          (err) => resolve(err.code),
+        ),
+      );
+      return { media, geo };
+    });
+    expect(result.media).toBe('NotAllowedError');
+    expect(result.geo).toBe(1);
+  });
+
+  test('cannot create an iframe that loads content or reaches the bridge', async ({ page }) => {
+    const violations = await page.evaluate(
+      () =>
+        new Promise<string[]>((resolve) => {
+          const seen: string[] = [];
+          document.addEventListener('securitypolicyviolation', (e) => {
+            seen.push(e.violatedDirective);
+            resolve(seen);
+          });
+          const frame = document.createElement('iframe');
+          frame.src = 'app://renderer/index.html';
+          document.body.appendChild(frame);
+          setTimeout(() => resolve(seen), 3_000);
+        }),
+    );
+    expect(violations).toContain('frame-src');
+    const subframes = page.frames().filter((f) => f !== page.mainFrame());
+    for (const frame of subframes) {
+      expect(frame.url()).not.toBe('app://renderer/index.html');
+    }
+    await expect(page.getByRole('region')).toHaveCount(6);
+  });
+});
diff --git a/tests/e2e/window.d.ts b/tests/e2e/window.d.ts
new file mode 100644
index 0000000..c7153c4
--- /dev/null
+++ b/tests/e2e/window.d.ts
@@ -0,0 +1,9 @@
+import type { NecroampApi } from '@shared/ipc';
+
+// The E2E callbacks run in the renderer. This mirrors src/preload/necroamp-window.d.ts for the tests project.
+declare global {
+  interface Window {
+    readonly necroamp: NecroampApi;
+  }
+}
+export {};
diff --git a/tests/integration/app-path-defense.integration.test.ts b/tests/integration/app-path-defense.integration.test.ts
new file mode 100644
index 0000000..4189cf8
--- /dev/null
+++ b/tests/integration/app-path-defense.integration.test.ts
@@ -0,0 +1,40 @@
+import path from 'node:path';
+import { describe, expect, it } from 'vitest';
+import { resolveAppPath, type PathApi } from '@main/protocol/resolve-app-path';
+
+// T6.1/T6.3: defense in depth of resolveAppPath. The injected path API is the only seam, so a
+// misbehaving implementation (absolute join result, resolve outside the root) must still be refused.
+const URL_OK = 'app://renderer/assets/app.js';
+
+describe('resolveAppPath defense in depth with a misbehaving path API', () => {
+  it('refuses a join result that is absolute', () => {
+    const api: PathApi = { ...path.posix, join: () => '/etc/passwd' };
+    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
+  });
+
+  it('refuses a resolve result outside the root', () => {
+    const api: PathApi = {
+      ...path.posix,
+      resolve: (...parts: string[]) => (parts.length === 1 ? '/opt/app' : '/opt/other/app.js'),
+    };
+    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
+  });
+
+  it('refuses a resolve result that is a sibling sharing the root name prefix', () => {
+    const api: PathApi = {
+      ...path.posix,
+      resolve: (...parts: string[]) => (parts.length === 1 ? '/opt/app' : '/opt/app-evil/app.js'),
+    };
+    expect(resolveAppPath(URL_OK, api, '/opt/app')).toEqual({ ok: false, code: 'TRAVERSAL' });
+  });
+
+  it.each([
+    ['posix', path.posix, '/'],
+    ['win32', path.win32, 'C:\\'],
+  ] as const)(
+    'accepts a file under a root that already ends with the separator (%s)',
+    (_n, api, root) => {
+      expect(resolveAppPath('app://renderer/index.html', api, root)).toMatchObject({ ok: true });
+    },
+  );
+});
diff --git a/tests/integration/app-protocol.integration.test.ts b/tests/integration/app-protocol.integration.test.ts
new file mode 100644
index 0000000..7dfc854
--- /dev/null
+++ b/tests/integration/app-protocol.integration.test.ts
@@ -0,0 +1,110 @@
+import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
+import { promises as fsp } from 'node:fs';
+import os from 'node:os';
+import path from 'node:path';
+import { afterAll, beforeAll, describe, expect, it } from 'vitest';
+import { buildCsp } from '@main/security/csp';
+import {
+  MAX_ASSET_BYTES,
+  createAppProtocolHandler,
+  registerAppScheme,
+} from '@main/protocol/app-protocol';
+
+// T6.3: protocol handler against a real temporary directory (never inside src/).
+const log = { info: () => undefined, warn: () => undefined, error: () => undefined };
+let base: string;
+let root: string;
+let symlinkWorks = true;
+
+beforeAll(() => {
+  base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'necroamp-proto-')));
+  root = path.join(base, 'renderer');
+  mkdirSync(path.join(root, 'assets'), { recursive: true });
+  writeFileSync(path.join(root, 'index.html'), '<!doctype html>');
+  writeFileSync(path.join(root, 'assets', 'main.js'), 'export {}');
+  writeFileSync(path.join(root, 'assets', 'logo.png'), 'x');
+  writeFileSync(path.join(base, 'secret.json'), '{"secret":true}');
+  writeFileSync(path.join(root, 'big.js'), Buffer.alloc(MAX_ASSET_BYTES + 1));
+  try {
+    symlinkSync(path.join(base, 'secret.json'), path.join(root, 'link.json'));
+  } catch {
+    symlinkWorks = false;
+  }
+});
+afterAll(() => rmSync(base, { recursive: true, force: true }));
+
+const handler = () =>
+  createAppProtocolHandler({
+    fs: {
+      realpath: (p) => fsp.realpath(p),
+      stat: (p) => fsp.stat(p),
+      readFile: (p) => fsp.readFile(p),
+    },
+    pathApi: path,
+    rendererRoot: root,
+    csp: buildCsp({ mode: 'production' }),
+    log,
+  });
+const get = (url: string, method = 'GET') => handler()(new Request(url, { method }));
+
+describe('app:// protocol against a real directory', () => {
+  it('serves the entry with security headers and the production CSP', async () => {
+    const res = await get('app://renderer/');
+    expect(res.status).toBe(200);
+    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
+    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
+    expect(res.headers.get('content-security-policy')).toBe(buildCsp({ mode: 'production' }));
+    expect(res.headers.get('cache-control')).toBe('no-store');
+  });
+
+  it('serves a nested allowed asset', async () => {
+    expect((await get('app://renderer/assets/main.js')).status).toBe(200);
+  });
+
+  it.each([
+    'app://renderer/../secret.json',
+    'app://renderer/%2e%2e/secret.json',
+    'app://renderer/assets/..%2f..%2fsecret.json',
+    'app://renderer/assets/..%5c..%5csecret.json',
+    'app://renderer/assets/logo.png',
+    'app://renderer/missing.js',
+    'app://renderer/.env',
+    'app://evil/index.html',
+    'file:///etc/passwd',
+  ])('answers 404 for %s', async (url) => {
+    const res = await get(url);
+    expect(res.status).toBe(404);
+    expect(await res.text()).toBe('');
+  });
+
+  it('answers 404 for a file above the size limit', async () => {
+    expect((await get('app://renderer/big.js')).status).toBe(404);
+  });
+
+  it('answers 405 with Allow for non GET/HEAD methods and never reads the file', async () => {
+    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
+      const res = await get('app://renderer/index.html', method);
+      expect(res.status).toBe(405);
+      expect(res.headers.get('allow')).toBe('GET, HEAD');
+    }
+  });
+
+  it('HEAD returns headers and an empty body', async () => {
+    const res = await get('app://renderer/index.html', 'HEAD');
+    expect(res.status).toBe(200);
+    expect(await res.text()).toBe('');
+  });
+
+  it('refuses a symlink that leaves the root (skipped when symlinks are not permitted)', async (ctx) => {
+    if (!symlinkWorks) ctx.skip();
+    expect((await get('app://renderer/link.json')).status).toBe(404);
+  });
+
+  it('registers only standard, secure and supportFetchAPI privileges', () => {
+    const calls: unknown[] = [];
+    registerAppScheme({ registerSchemesAsPrivileged: (s) => void calls.push(...s) });
+    expect(calls).toEqual([
+      { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
+    ]);
+  });
+});
diff --git a/tests/integration/contrast-first-declaration.integration.test.ts b/tests/integration/contrast-first-declaration.integration.test.ts
new file mode 100644
index 0000000..fc8fbf5
--- /dev/null
+++ b/tests/integration/contrast-first-declaration.integration.test.ts
@@ -0,0 +1,13 @@
+import { describe, expect, it } from 'vitest';
+import { readCustomProperties } from '@renderer/app/theme/contrast';
+
+// Deterministic coverage of the duplicate-declaration branch in readCustomProperties.
+// The property test in src/renderer/app/theme reaches it only when its random generator emits a
+// repeated name, which made global branch coverage vary by one between runs (see docs/testing).
+describe('readCustomProperties duplicate declarations', () => {
+  it('keeps the first declaration of a repeated name', () => {
+    const map = readCustomProperties('--a: #111111; --a: #222222; --b: var(--a);');
+    expect(map.get('--a')).toBe('#111111');
+    expect(map.get('--b')).toBe('#111111');
+  });
+});
diff --git a/tests/integration/ipc-round-trip.integration.test.ts b/tests/integration/ipc-round-trip.integration.test.ts
new file mode 100644
index 0000000..4817dd4
--- /dev/null
+++ b/tests/integration/ipc-round-trip.integration.test.ts
@@ -0,0 +1,76 @@
+import { describe, expect, it } from 'vitest';
+import { appInfoResponseSchema } from '@shared/ipc';
+import { installIpcHandlers } from '@main/ipc/install-ipc';
+import type { SenderEventLike } from '@main/security/sender-validation';
+import { createNecroampApi } from '../../src/preload/create-necroamp-api';
+
+// T6.3: preload API + installIpcHandlers (registerHandler, sender validation) with fakes at the edge.
+type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
+
+const TRUSTED_SENDER: { id: string; mainFrame?: SenderEventLike['senderFrame'] } = {
+  id: 'registered',
+};
+const log = { info: () => undefined, warn: () => undefined, error: () => undefined };
+
+function wire(senderFrame: SenderEventLike['senderFrame'], sender: unknown, platform = 'linux') {
+  // A real WebContents always has a mainFrame; the trusted sender's main frame is the frame under test.
+  if (sender === TRUSTED_SENDER) TRUSTED_SENDER.mainFrame = senderFrame;
+  const listeners = new Map<string, Listener>();
+  const removed: string[] = [];
+  const dispose = installIpcHandlers({
+    ipcMain: {
+      handle: (channel, l) => void listeners.set(channel, l),
+      removeHandler: (channel) => void removed.push(channel),
+    },
+    app: { getName: () => 'NecroAmp', getVersion: () => '0.1.0' },
+    platform,
+    trusted: ['app://renderer'],
+    isRegisteredSender: (s) => s === TRUSTED_SENDER,
+    log,
+  });
+  const api = createNecroampApi((channel) => {
+    const listener = listeners.get(channel);
+    if (listener === undefined) return Promise.reject(new Error('no handler'));
+    return listener({ senderFrame, sender });
+  });
+  return { api, listeners, removed, dispose };
+}
+
+describe('preload <-> main IPC round trip', () => {
+  it('returns app info from a trusted renderer', async () => {
+    const { api } = wire({ url: 'app://renderer/index.html', parent: null }, TRUSTED_SENDER);
+    const result = appInfoResponseSchema.parse(await api.app.getInfo());
+    expect(result).toEqual({
+      ok: true,
+      data: { name: 'NecroAmp', version: '0.1.0', platform: 'linux' },
+    });
+  });
+
+  it.each([
+    ['sub-frame', { url: 'app://renderer/', parent: {} }, TRUSTED_SENDER],
+    ['foreign origin', { url: 'https://evil.example/', parent: null }, TRUSTED_SENDER],
+    ['destroyed frame', null, TRUSTED_SENDER],
+    ['unregistered sender', { url: 'app://renderer/', parent: null }, { id: 'other' }],
+  ] as const)('maps an untrusted sender (%s) to INVALID_SENDER', async (_n, frame, sender) => {
+    const { api } = wire(frame, sender);
+    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
+  });
+
+  it('rejects a top-level frame that is not the sender main frame (CF-1)', async () => {
+    const { api } = wire({ url: 'app://renderer/index.html', parent: null }, TRUSTED_SENDER);
+    TRUSTED_SENDER.mainFrame = { url: 'app://renderer/index.html', parent: null };
+    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INVALID_SENDER' } });
+  });
+
+  it('maps an unsupported platform to INTERNAL end to end', async () => {
+    const { api } = wire({ url: 'app://renderer/', parent: null }, TRUSTED_SENDER, 'freebsd');
+    expect(await api.app.getInfo()).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
+  });
+
+  it('registers exactly one channel and the disposer removes it', () => {
+    const { listeners, removed, dispose } = wire(null, null);
+    expect([...listeners.keys()]).toEqual(['app:get-info']);
+    dispose();
+    expect(removed).toEqual(['app:get-info']);
+  });
+});
diff --git a/tests/integration/navigation-wiring.integration.test.ts b/tests/integration/navigation-wiring.integration.test.ts
new file mode 100644
index 0000000..81e15df
--- /dev/null
+++ b/tests/integration/navigation-wiring.integration.test.ts
@@ -0,0 +1,115 @@
+import type { WebContents } from 'electron';
+import { describe, expect, it, vi } from 'vitest';
+import type { Logger } from '@main/logging/logger';
+import {
+  adaptWebContents,
+  installNavigationGuards,
+  type WebContentsCreatedSource,
+} from '@main/window/navigation-guards';
+
+// T6.2/T6.3: the Electron adapter around the pure navigation guard (R6.1 to R6.3), with a fake
+// WebContents and a fake `app`. Covers will-navigate, will-redirect, will-frame-navigate, webview and window.open.
+type Listener = (details: { url: string; preventDefault(): void }) => void;
+
+function fakeWebContents() {
+  const listeners = new Map<string, Listener[]>();
+  let openHandler: (() => { action: string }) | undefined;
+  const contents = {
+    on: (event: string, listener: Listener) => {
+      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
+    },
+    setWindowOpenHandler: (handler: () => { action: string }) => {
+      openHandler = handler;
+    },
+  };
+  return {
+    contents: contents as unknown as WebContents,
+    emit: (event: string, url = 'app://renderer/index.html') => {
+      const preventDefault = vi.fn();
+      for (const l of listeners.get(event) ?? []) l({ url, preventDefault });
+      return preventDefault.mock.calls.length > 0;
+    },
+    events: () => [...listeners.keys()].sort(),
+    openWindow: () => openHandler?.(),
+  };
+}
+const log = (): Logger => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
+
+describe('navigation guard Electron adapter', () => {
+  it('listens to every navigation event Electron offers, including sub-frames', () => {
+    const fake = fakeWebContents();
+    installNavigationGuards(
+      { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
+      ['app://renderer'],
+      log(),
+    );
+    expect(fake.events()).toEqual([
+      'will-attach-webview',
+      'will-frame-navigate',
+      'will-navigate',
+      'will-redirect',
+    ]);
+  });
+
+  it.each(['will-navigate', 'will-redirect', 'will-frame-navigate'])(
+    '%s to a foreign URL is prevented and logged without the URL',
+    (event) => {
+      const fake = fakeWebContents();
+      const logger = log();
+      installNavigationGuards(
+        { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
+        ['app://renderer'],
+        logger,
+      );
+      expect(fake.emit(event, 'https://evil.example/?token=secret')).toBe(true);
+      expect(logger.warn).toHaveBeenCalledWith('navigation.blocked');
+      expect(JSON.stringify((logger.warn as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
+        'secret',
+      );
+    },
+  );
+
+  it.each(['will-navigate', 'will-redirect', 'will-frame-navigate'])(
+    '%s inside the trusted origin is allowed',
+    (event) => {
+      const fake = fakeWebContents();
+      installNavigationGuards(
+        { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
+        ['app://renderer'],
+        log(),
+      );
+      expect(fake.emit(event, 'app://renderer/index.html')).toBe(false);
+    },
+  );
+
+  it('denies every window.open and every webview attachment', () => {
+    const fake = fakeWebContents();
+    const logger = log();
+    adaptWebContents(fake.contents).denyWindowOpen();
+    expect(fake.openWindow()).toEqual({ action: 'deny' });
+    installNavigationGuards(
+      { on: (_e, listener) => listener({}, fake.contents) } as WebContentsCreatedSource,
+      ['app://renderer'],
+      logger,
+    );
+    expect(fake.emit('will-attach-webview')).toBe(true);
+    expect(logger.warn).toHaveBeenCalledWith('webview.blocked');
+  });
+
+  it('guards every web contents the app creates, not only the first', () => {
+    const first = fakeWebContents();
+    const second = fakeWebContents();
+    const handlers: ((e: unknown, c: WebContents) => void)[] = [];
+    installNavigationGuards(
+      { on: (_e, listener) => void handlers.push(listener) } as WebContentsCreatedSource,
+      ['app://renderer'],
+      log(),
+    );
+    handlers.forEach((h) => {
+      h({}, first.contents);
+      h({}, second.contents);
+    });
+    expect(first.emit('will-navigate', 'http://x.test/')).toBe(true);
+    expect(second.emit('will-navigate', 'http://x.test/')).toBe(true);
+  });
+});
diff --git a/tests/integration/shell-bridge.integration.test.tsx b/tests/integration/shell-bridge.integration.test.tsx
new file mode 100644
index 0000000..6f1ba29
--- /dev/null
+++ b/tests/integration/shell-bridge.integration.test.tsx
@@ -0,0 +1,83 @@
+import { render, screen } from '@testing-library/react';
+import { describe, expect, it } from 'vitest';
+import { installIpcHandlers } from '@main/ipc/install-ipc';
+import type { SenderEventLike } from '@main/security/sender-validation';
+import { AppShell } from '@renderer/app/app-shell';
+import { createNecroampClient } from '@renderer/app/bridge/necroamp-client';
+import { STRINGS } from '@renderer/app/strings/en';
+import { createAppInfoStore } from '@renderer/stores/app-info-store';
+import { createNecroampApi } from '../../src/preload/create-necroamp-api';
+
+// T6.3: renderer shell -> adapter -> preload API -> installIpcHandlers (registerHandler, sender check).
+// Only Electron itself is faked. Covers R4, R8, R10 across all three layers without a real window.
+type Listener = (event: SenderEventLike, ...args: unknown[]) => Promise<unknown>;
+
+const log = { info: () => undefined, warn: () => undefined, error: () => undefined };
+
+function mount(options: {
+  platform?: string;
+  frameUrl?: string;
+  parent?: unknown;
+  registered?: boolean;
+}) {
+  const frame = {
+    url: options.frameUrl ?? 'app://renderer/index.html',
+    parent: options.parent ?? null,
+  };
+  const sender = { id: 'wc', mainFrame: frame };
+  const listeners = new Map<string, Listener>();
+  installIpcHandlers({
+    ipcMain: { handle: (c, l) => void listeners.set(c, l), removeHandler: () => undefined },
+    app: { getName: () => 'NecroAmp', getVersion: () => '4.5.6' },
+    platform: options.platform ?? 'darwin',
+    trusted: ['app://renderer'],
+    isRegisteredSender: (s) => options.registered !== false && s === sender,
+    log,
+  });
+  const api = createNecroampApi((channel) => {
+    const listener = listeners.get(channel);
+    if (listener === undefined) return Promise.reject(new Error('no handler'));
+    return listener({ senderFrame: frame, sender });
+  });
+  const store = createAppInfoStore(createNecroampClient({ necroamp: api }));
+  render(<AppShell appInfoStore={store} />);
+  return store;
+}
+
+describe('shell + bridge + main handlers', () => {
+  it('shows version and platform that main reported, through every layer', async () => {
+    const store = mount({ platform: 'darwin' });
+    expect(await screen.findByText('4.5.6')).toBeInTheDocument();
+    expect(screen.getByText('macOS')).toBeInTheDocument();
+    expect(store.getState().status).toBe('loaded');
+  });
+
+  it.each([
+    ['sub-frame', { parent: {} }],
+    ['foreign origin', { frameUrl: 'https://evil.example/' }],
+    ['unregistered sender', { registered: false }],
+  ] as const)('a %s is refused by main and the shell stays usable', async (_n, options) => {
+    const store = mount(options);
+    const text = `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure['ipc-error']}`;
+    expect(await screen.findByText(text)).toBeInTheDocument();
+    expect(store.getState()).toMatchObject({
+      status: 'failed',
+      failure: 'ipc-error',
+      data: undefined,
+    });
+    expect(screen.getAllByRole('region')).toHaveLength(6);
+  });
+
+  it('an unsupported platform becomes a plain failure, not a crash', async () => {
+    mount({ platform: 'freebsd' });
+    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
+    expect(screen.getByRole('main')).toBeInTheDocument();
+  });
+
+  it('without a bridge the shell reports "unavailable" and still renders every region', async () => {
+    const store = createAppInfoStore(createNecroampClient({}));
+    render(<AppShell appInfoStore={store} />);
+    expect(await screen.findByText(STRINGS.bridgeStatus.unavailable)).toBeInTheDocument();
+    expect(screen.getAllByRole('region')).toHaveLength(6);
+  });
+});
diff --git a/tests/lint-rules/boundary-rules.test.ts b/tests/lint-rules/boundary-rules.test.ts
new file mode 100644
index 0000000..41b5cd7
--- /dev/null
+++ b/tests/lint-rules/boundary-rules.test.ts
@@ -0,0 +1,306 @@
+import { Linter } from 'eslint';
+import { describe, expect, it } from 'vitest';
+// @ts-expect-error The flat config is a plain .mjs module without type declarations.
+import config from '../../eslint.config.mjs';
+
+// T6.2: every boundary rule in eslint.config.mjs must fail on a fixture (R2, R4.1, R6.5, R15.1).
+// Fixtures are in-memory strings, so nothing touches the filesystem.
+const linter = new Linter({ configType: 'flat', cwd: process.cwd() });
+
+function rulesFor(code: string, filename: string): string[] {
+  const messages = linter.verify(code, config as Linter.Config[], { filename });
+  return messages.filter((m) => m.ruleId !== null).map((m) => m.ruleId as string);
+}
+function fatal(code: string, filename: string): string[] {
+  return linter
+    .verify(code, config as Linter.Config[], { filename })
+    .filter((m) => m.fatal)
+    .map((m) => m.message);
+}
+
+const RESTRICTED_IMPORT = 'no-restricted-imports';
+const RESTRICTED_SYNTAX = 'no-restricted-syntax';
+const RESTRICTED_GLOBALS = 'no-restricted-globals';
+
+describe('eslint boundary rules reject violating fixtures', () => {
+  it.each([
+    [
+      'renderer imports main',
+      'src/renderer/a.ts',
+      "import { x } from '@main/ipc/install-ipc';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'renderer imports electron',
+      'src/renderer/a.ts',
+      "import { ipcRenderer } from 'electron';\nexport const y = ipcRenderer;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'renderer imports a node built-in',
+      'src/renderer/a.ts',
+      "import fs from 'node:fs';\nexport const y = fs;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'renderer imports a network module',
+      'src/renderer/a.ts',
+      "import http from 'https';\nexport const y = http;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'renderer uses a deep relative import',
+      'src/renderer/a.ts',
+      "import { x } from '../../../shared/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'feature imports another feature',
+      'src/renderer/features/player/a.ts',
+      "import { x } from '@renderer/features/playlist';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'feature reaches across folders',
+      'src/renderer/features/player/a.ts',
+      "import { x } from '../../playlist/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'shared imports main',
+      'src/shared/a.ts',
+      "import { x } from '@main/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'shared imports electron',
+      'src/shared/a.ts',
+      "import { app } from 'electron';\nexport const y = app;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'shared imports a node built-in',
+      'src/shared/a.ts',
+      "import path from 'path';\nexport const y = path;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'shared imports react',
+      'src/shared/a.ts',
+      "import { useState } from 'react';\nexport const y = useState;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'main imports renderer',
+      'src/main/a.ts',
+      "import { x } from '@renderer/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'main imports crashReporter',
+      'src/main/a.ts',
+      "import { crashReporter } from 'electron';\nexport const y = crashReporter;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'main imports autoUpdater',
+      'src/main/a.ts',
+      "import { autoUpdater } from 'electron';\nexport const y = autoUpdater;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'main imports electron net',
+      'src/main/a.ts',
+      "import { net } from 'electron';\nexport const y = net;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'main imports node:https',
+      'src/main/a.ts',
+      "import https from 'node:https';\nexport const y = https;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'preload imports main',
+      'src/preload/a.ts',
+      "import { x } from '@main/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'preload imports renderer',
+      'src/preload/a.ts',
+      "import { x } from '@renderer/x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'preload imports electron-updater',
+      'src/preload/a.ts',
+      "import u from 'electron-updater';\nexport const y = u;\n",
+      RESTRICTED_IMPORT,
+    ],
+    [
+      'any file uses a deep relative import',
+      'src/main/a.ts',
+      "import { x } from '../../../x';\nexport const y = x;\n",
+      RESTRICTED_IMPORT,
+    ],
+  ] as const)('%s', (_label, filename, code, rule) => {
+    expect(rulesFor(code, filename)).toContain(rule);
+  });
+
+  it.each([
+    [
+      'renderer opens an external link',
+      'src/renderer/a.ts',
+      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'renderer creates a window',
+      'src/renderer/a.ts',
+      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'renderer uses a literal IPC channel',
+      'src/renderer/a.ts',
+      "declare const r: { invoke(c: string): void };\nr.invoke('app:get-info');\n",
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'renderer uses AudioContext',
+      'src/renderer/a.ts',
+      'declare const AudioContext: new () => object;\nexport const c = new AudioContext();\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'renderer uses requestAnimationFrame',
+      'src/renderer/a.ts',
+      'requestAnimationFrame(() => undefined);\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'main opens an external link',
+      'src/main/a.ts',
+      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'main creates a window outside create-main-window',
+      'src/main/a.ts',
+      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'main registers a literal channel',
+      'src/main/a.ts',
+      "declare const ipcMain: { handle(c: string, f: () => void): void };\nipcMain.handle('library:scan', () => undefined);\n",
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'shared uses a literal channel',
+      'src/shared/a.ts',
+      "declare const x: { handle(c: string): void };\nx.handle('app:get-info');\n",
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'preload creates a window',
+      'src/preload/a.ts',
+      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'preload invokes a literal channel',
+      'src/preload/a.ts',
+      "declare const r: { invoke(c: string): void };\nr.invoke('app:get-info');\n",
+      RESTRICTED_SYNTAX,
+    ],
+    [
+      'create-main-window opens an external link',
+      'src/main/window/create-main-window.ts',
+      'declare const shell: { openExternal(u: string): void };\nshell.openExternal("https://x.test");\n',
+      RESTRICTED_SYNTAX,
+    ],
+  ] as const)('%s', (_label, filename, code, rule) => {
+    expect(rulesFor(code, filename)).toContain(rule);
+  });
+
+  it.each([
+    ['renderer calls fetch', 'src/renderer/a.ts', 'void fetch("https://x.test");\n'],
+    [
+      'renderer uses XMLHttpRequest',
+      'src/renderer/a.ts',
+      'export const x = new XMLHttpRequest();\n',
+    ],
+    [
+      'renderer uses WebSocket',
+      'src/renderer/a.ts',
+      'export const x = new WebSocket("wss://x.test");\n',
+    ],
+    ['preload calls fetch', 'src/preload/a.ts', 'void fetch("https://x.test");\n'],
+    ['shared touches window', 'src/shared/a.ts', 'export const w = window;\n'],
+    ['shared touches process', 'src/shared/a.ts', 'export const p = process;\n'],
+  ] as const)('%s', (_label, filename, code) => {
+    expect(rulesFor(code, filename)).toContain(RESTRICTED_GLOBALS);
+  });
+
+  it('renderer rejects the inline style prop', () => {
+    const code = 'export const A = () => <div style={{ color: "red" }} />;\n';
+    expect(rulesFor(code, 'src/renderer/a.tsx')).toContain('react/forbid-dom-props');
+  });
+
+  it('renderer enforces jsx-a11y rules', () => {
+    const code = 'export const A = () => <img src="x.png" />;\n';
+    expect(rulesFor(code, 'src/renderer/a.tsx')).toContain('jsx-a11y/alt-text');
+  });
+
+  it('rejects any and unconsumed type imports project-wide', () => {
+    expect(rulesFor('export const x: any = 1;\n', 'src/main/a.ts')).toContain(
+      '@typescript-eslint/no-explicit-any',
+    );
+    expect(
+      rulesFor("import { Linter } from 'eslint';\nexport type T = Linter;\n", 'src/main/a.ts'),
+    ).toContain('@typescript-eslint/consistent-type-imports');
+  });
+});
+
+describe('eslint boundary rules accept compliant fixtures (no false positives)', () => {
+  it.each([
+    [
+      'renderer imports shared via alias',
+      'src/renderer/a.ts',
+      "import type { Platform } from '@shared/ipc';\nexport type P = Platform;\n",
+    ],
+    [
+      'feature imports the shared components barrel',
+      'src/renderer/features/player/a.ts',
+      "import { RegionFrame } from '@renderer/components/region-frame';\nexport const R = RegionFrame;\n",
+    ],
+    [
+      'main imports shared and a sibling',
+      'src/main/a.ts',
+      "import { IPC_CHANNELS } from '@shared/ipc';\nexport const c = IPC_CHANNELS;\n",
+    ],
+    [
+      'preload imports electron and shared',
+      'src/preload/a.ts',
+      "import { contextBridge } from 'electron';\nimport { IPC_CHANNELS } from '@shared/ipc';\nexport const x = [contextBridge, IPC_CHANNELS];\n",
+    ],
+    [
+      'create-main-window may construct a window',
+      'src/main/window/create-main-window.ts',
+      'declare class BrowserWindow {}\nexport const w = new BrowserWindow();\n',
+    ],
+    [
+      'channels.ts may hold literal channel names',
+      'src/shared/ipc/channels.ts',
+      "declare const x: { handle(c: string): void };\nx.handle('app:get-info');\n",
+    ],
+  ] as const)('%s', (_label, filename, code) => {
+    const found = rulesFor(code, filename).filter(
+      (r) => r.startsWith('no-restricted') || r.startsWith('@typescript-eslint/consistent'),
+    );
+    expect(found).toEqual([]);
+    expect(fatal(code, filename)).toEqual([]);
+  });
+});
diff --git a/tests/setup/node.setup.ts b/tests/setup/node.setup.ts
new file mode 100644
index 0000000..2b9729c
--- /dev/null
+++ b/tests/setup/node.setup.ts
@@ -0,0 +1 @@
+import './offline';
diff --git a/tests/setup/offline.ts b/tests/setup/offline.ts
new file mode 100644
index 0000000..d281f44
--- /dev/null
+++ b/tests/setup/offline.ts
@@ -0,0 +1,20 @@
+import fc from 'fast-check';
+import { vi } from 'vitest';
+
+// Shared determinism setup (R12.3). Any accidental network use fails the test.
+const NETWORK_BLOCKED = 'Network access is blocked in tests. Inject a fake client instead.';
+
+function blocked(): never {
+  throw new Error(NETWORK_BLOCKED);
+}
+
+export function installOfflineGuards(): void {
+  vi.stubGlobal('fetch', blocked);
+  vi.stubGlobal('XMLHttpRequest', blocked);
+  vi.stubGlobal('WebSocket', blocked);
+  vi.stubGlobal('EventSource', blocked);
+}
+
+// Property tests run at least 100 times and print the seed on failure.
+fc.configureGlobal({ numRuns: 100, verbose: 1 });
+installOfflineGuards();
diff --git a/tests/setup/renderer.setup.ts b/tests/setup/renderer.setup.ts
new file mode 100644
index 0000000..51291d1
--- /dev/null
+++ b/tests/setup/renderer.setup.ts
@@ -0,0 +1,8 @@
+import '@testing-library/jest-dom/vitest';
+import { cleanup } from '@testing-library/react';
+import { afterEach } from 'vitest';
+import './offline';
+
+afterEach(() => {
+  cleanup();
+});
diff --git a/tests/static/main-preload-policy.test.ts b/tests/static/main-preload-policy.test.ts
new file mode 100644
index 0000000..c8a1fd0
--- /dev/null
+++ b/tests/static/main-preload-policy.test.ts
@@ -0,0 +1,88 @@
+import { readdirSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { describe, expect, it } from 'vitest';
+
+// Subset of T6.2 for M2/M3 source: static policy checks over non-test source.
+const root = fileURLToPath(new URL('../..', import.meta.url));
+
+function sourceFiles(dir: string): string[] {
+  return readdirSync(path.join(root, dir), { withFileTypes: true, recursive: true })
+    .filter((e) => e.isFile() && /\.ts$/.test(e.name) && !/\.(test|d)\.ts$/.test(e.name))
+    .map((e) => path.join(e.parentPath, e.name));
+}
+const read = (file: string) => readFileSync(file, 'utf8');
+const stripComments = (s: string) =>
+  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
+
+const mainFiles = sourceFiles('src/main');
+const preloadFiles = sourceFiles('src/preload');
+const sharedFiles = sourceFiles('src/shared');
+
+describe('main/preload/shared source policy', () => {
+  it('constructs a BrowserWindow only in create-main-window.ts', () => {
+    const offenders = [...mainFiles, ...preloadFiles, ...sharedFiles].filter((f) =>
+      /new\s+BrowserWindow\s*\(/.test(stripComments(read(f))),
+    );
+    expect(offenders.map((f) => path.basename(f))).toEqual(['create-main-window.ts']);
+  });
+
+  it('never references forbidden capabilities in main, preload or shared', () => {
+    const forbidden =
+      /\b(openExternal|crashReporter|autoUpdater|AudioContext|requestAnimationFrame|fetch\s*\(|XMLHttpRequest|WebSocket|dangerouslySetInnerHTML)\b/;
+    const importsNet = /from\s+['"](node:)?(net|http|https|undici|electron-updater)['"]/;
+    for (const file of [...mainFiles, ...preloadFiles, ...sharedFiles]) {
+      const code = stripComments(read(file));
+      expect(forbidden.test(code), path.basename(file)).toBe(false);
+      expect(importsNet.test(code), path.basename(file)).toBe(false);
+    }
+  });
+
+  it('has no literal channel names outside src/shared/ipc/channels.ts', () => {
+    const literal = /['"`]app:get-info['"`]/;
+    for (const file of [...mainFiles, ...preloadFiles, ...sharedFiles]) {
+      if (file.endsWith(path.join('ipc', 'channels.ts'))) continue;
+      expect(literal.test(stripComments(read(file))), path.basename(file)).toBe(false);
+    }
+  });
+
+  it('never sets a mandatory web preference to its insecure value', () => {
+    const insecure =
+      /(contextIsolation\s*:\s*false|sandbox\s*:\s*false|nodeIntegration\s*:\s*true|webSecurity\s*:\s*false|allowRunningInsecureContent\s*:\s*true|webviewTag\s*:\s*true)/;
+    for (const file of mainFiles) {
+      expect(insecure.test(stripComments(read(file))), path.basename(file)).toBe(false);
+    }
+  });
+
+  it('shared code imports no Electron, DOM-only or Node built-in module', () => {
+    for (const file of sharedFiles) {
+      const code = stripComments(read(file));
+      expect(
+        /from\s+['"](electron|node:[^'"]+|fs|path|os|child_process)['"]/.test(code),
+        path.basename(file),
+      ).toBe(false);
+    }
+  });
+
+  it('the preload never exposes ipcRenderer or a generic sender through contextBridge', () => {
+    const index = stripComments(read(path.join(root, 'src/preload/index.ts')));
+    expect(index.match(/exposeInMainWorld\(/g)).toHaveLength(1);
+    expect(index).toMatch(/exposeInMainWorld\('necroamp',\s*api\)/);
+    const factory = stripComments(read(path.join(root, 'src/preload/create-necroamp-api.ts')));
+    expect(factory).not.toMatch(/ipcRenderer|require\(|process\b|from\s+['"]electron['"]/);
+  });
+
+  it('ipcMain.handle is called only from register-handler.ts', () => {
+    const callers = mainFiles.filter((f) =>
+      /ipcMain\.(handle|on|once)\s*\(/.test(stripComments(read(f))),
+    );
+    expect(callers.map((f) => path.basename(f))).toEqual(['register-handler.ts']);
+  });
+
+  it('the production CSP is built from a path that never reads the environment', () => {
+    for (const name of ['csp.ts', 'trusted-origins.ts']) {
+      const code = stripComments(read(path.join(root, 'src/main/security', name)));
+      expect(code).not.toMatch(/process\.env|ELECTRON_RENDERER_URL|NODE_ENV/);
+    }
+  });
+});
diff --git a/tests/static/renderer-policy.test.ts b/tests/static/renderer-policy.test.ts
new file mode 100644
index 0000000..e991818
--- /dev/null
+++ b/tests/static/renderer-policy.test.ts
@@ -0,0 +1,143 @@
+import { readdirSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { describe, expect, it } from 'vitest';
+
+// T6.2 (renderer part): static policy over renderer source, CSS and the HTML entry.
+// Traceability: R8.4, R8.7 (no audio or animation yet), R9 (focus), R15.1 (no network), CSP (no inline style).
+const root = fileURLToPath(new URL('../..', import.meta.url));
+const rendererDir = path.join(root, 'src', 'renderer');
+
+function files(dir: string, test: (name: string) => boolean): string[] {
+  return readdirSync(dir, { withFileTypes: true, recursive: true })
+    .filter((e) => e.isFile() && test(e.name))
+    .map((e) => path.join(e.parentPath, e.name));
+}
+const read = (file: string): string => readFileSync(file, 'utf8');
+const stripComments = (s: string): string =>
+  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
+const name = (file: string): string => path.relative(root, file).split(path.sep).join('/');
+
+const sources = files(rendererDir, (n) => /\.tsx?$/.test(n) && !/\.(test|d)\.tsx?$/.test(n));
+const stylesheets = files(rendererDir, (n) => n.endsWith('.css'));
+
+describe('renderer source policy', () => {
+  it('finds the source files it is supposed to police', () => {
+    expect(sources.length).toBeGreaterThan(20);
+    expect(stylesheets.length).toBeGreaterThan(5);
+  });
+
+  it.each([
+    [
+      'AudioContext or analyser',
+      /\b(AudioContext|webkitAudioContext|OfflineAudioContext|AnalyserNode)\b/,
+    ],
+    ['requestAnimationFrame', /\brequestAnimationFrame\b/],
+    ['crashReporter or autoUpdater', /\b(crashReporter|autoUpdater)\b/],
+    ['openExternal', /\bopenExternal\b/],
+    ['network globals', /\b(fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)\b/],
+    ['HTML injection', /\b(dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|outerHTML)\b/],
+    ['dynamic code', /\b(eval\s*\(|new\s+Function\s*\()/],
+    ['direct bridge access', /\bipcRenderer\b/],
+  ] as const)('contains no %s', (_label, pattern) => {
+    const offenders = sources.filter((f) => pattern.test(stripComments(read(f)))).map(name);
+    expect(offenders).toEqual([]);
+  });
+
+  it('reads window.necroamp only in the bridge adapter (R4.9)', () => {
+    const offenders = sources
+      .filter((f) => /\.necroamp\b|\bnecroamp\s*:/.test(stripComments(read(f))))
+      .map(name)
+      .sort();
+    expect(offenders).toEqual(['src/renderer/app/bridge/necroamp-client.ts']);
+  });
+
+  it('never passes a style prop (strict CSP, no inline style)', () => {
+    const offenders = sources
+      .filter((f) => /\bstyle\s*=\s*\{/.test(stripComments(read(f))))
+      .map(name);
+    expect(offenders).toEqual([]);
+  });
+
+  it('imports no main, electron, Node built-in or network module', () => {
+    const bad =
+      /from\s+['"](@main\/[^'"]*|electron|node:[^'"]+|fs|path|os|child_process|http|https|net)['"]/;
+    const offenders = sources.filter((f) => bad.test(stripComments(read(f)))).map(name);
+    expect(offenders).toEqual([]);
+  });
+
+  it('keeps features from importing each other', () => {
+    const featureFiles = sources.filter((f) => name(f).startsWith('src/renderer/features/'));
+    const offenders: string[] = [];
+    for (const f of featureFiles) {
+      const own = name(f).split('/')[3];
+      for (const m of stripComments(read(f)).matchAll(
+        /from\s+['"]@renderer\/features\/([^/'"]+)/g,
+      )) {
+        if (m[1] !== own) offenders.push(`${name(f)} -> ${m[1] ?? ''}`);
+      }
+    }
+    expect(offenders).toEqual([]);
+  });
+});
+
+describe('renderer stylesheet policy', () => {
+  it.each([
+    ['remote url()', /url\(\s*['"]?\s*(https?:|\/\/|data:text|javascript:)/i],
+    ['@import', /@import\b/i],
+    [
+      'animation, transition or @keyframes (R9.7)',
+      /(@keyframes|\banimation(-[a-z]+)?\s*:|\btransition(-[a-z]+)?\s*:)/i,
+    ],
+    ['expression() or behavior', /\b(expression\s*\(|behavior\s*:)/i],
+    ['external @font-face source', /@font-face[^}]*url\(\s*['"]?https?:/i],
+  ] as const)('contains no %s', (_label, pattern) => {
+    const offenders = stylesheets.filter((f) => pattern.test(stripComments(read(f)))).map(name);
+    expect(offenders).toEqual([]);
+  });
+
+  it('never removes the focus indicator without replacing it', () => {
+    for (const f of stylesheets) {
+      const css = stripComments(read(f));
+      for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
+        const selector = rule[1] ?? '';
+        const body = rule[2] ?? '';
+        if (/:focus/.test(selector) && /outline\s*:\s*(none|0)\b/.test(body)) {
+          expect(body, `${name(f)} ${selector.trim()}`).toMatch(/box-shadow|border|outline-offset/);
+        }
+      }
+    }
+  });
+
+  it('defines a visible :focus-visible style that uses the focus token', () => {
+    const all = stylesheets.map((f) => stripComments(read(f))).join('\n');
+    const rule = /:focus-visible[^{]*\{([^}]*)\}/.exec(all);
+    expect(rule, 'a :focus-visible rule must exist').not.toBeNull();
+    expect(rule?.[1]).toMatch(/--na-color-focus/);
+    expect(rule?.[1]).toMatch(/--na-focus-ring-width/);
+  });
+});
+
+describe('renderer HTML entry', () => {
+  const html = read(path.join(rendererDir, 'index.html'));
+
+  it('declares lang, a title and exactly one external module script', () => {
+    expect(html).toMatch(/<html[^>]*\blang="en"/);
+    expect(html).toMatch(/<title>NecroAmp<\/title>/);
+    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
+    expect(scripts).toHaveLength(1);
+    expect(scripts[0]?.[1]).toMatch(/type="module"/);
+    expect(scripts[0]?.[1]).toMatch(/\bsrc=/);
+    expect(scripts[0]?.[2]?.trim()).toBe('');
+  });
+
+  it('has no inline event handler, inline style or remote reference in source', () => {
+    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
+    expect(html).not.toMatch(/\sstyle\s*=/i);
+    expect(html).not.toMatch(/(src|href)\s*=\s*["']?(https?:)?\/\//i);
+  });
+
+  it('leaves the CSP meta tag to the build plugin (single source of truth)', () => {
+    expect(html).not.toMatch(/http-equiv\s*=\s*["']Content-Security-Policy/i);
+  });
+});
diff --git a/tsconfig.json b/tsconfig.json
new file mode 100644
index 0000000..399cc78
--- /dev/null
+++ b/tsconfig.json
@@ -0,0 +1,10 @@
+{
+  "files": [],
+  "references": [
+    { "path": "./tsconfig.shared.json" },
+    { "path": "./tsconfig.main.json" },
+    { "path": "./tsconfig.preload.json" },
+    { "path": "./tsconfig.renderer.json" },
+    { "path": "./tsconfig.tests.json" }
+  ]
+}
diff --git a/tsconfig.main.json b/tsconfig.main.json
new file mode 100644
index 0000000..b767a57
--- /dev/null
+++ b/tsconfig.main.json
@@ -0,0 +1,28 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "emitDeclarationOnly": true,
+    "outDir": "./node_modules/.cache/tsc/main",
+    "tsBuildInfoFile": "./node_modules/.cache/tsc/main/tsconfig.tsbuildinfo",
+    "target": "ES2023",
+    "lib": ["ES2023"],
+    "types": ["node"],
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "noImplicitOverride": true,
+    "noFallthroughCasesInSwitch": true,
+    "verbatimModuleSyntax": true,
+    "isolatedModules": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "paths": {
+      "@shared/*": ["./src/shared/*"],
+      "@main/*": ["./src/main/*"]
+    }
+  },
+  "include": ["src/main/**/*"],
+  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"],
+  "references": [{ "path": "./tsconfig.shared.json" }]
+}
diff --git a/tsconfig.preload.json b/tsconfig.preload.json
new file mode 100644
index 0000000..5da5043
--- /dev/null
+++ b/tsconfig.preload.json
@@ -0,0 +1,27 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "emitDeclarationOnly": true,
+    "outDir": "./node_modules/.cache/tsc/preload",
+    "tsBuildInfoFile": "./node_modules/.cache/tsc/preload/tsconfig.tsbuildinfo",
+    "target": "ES2023",
+    "lib": ["ES2023"],
+    "types": ["node"],
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "noImplicitOverride": true,
+    "noFallthroughCasesInSwitch": true,
+    "verbatimModuleSyntax": true,
+    "isolatedModules": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "paths": {
+      "@shared/*": ["./src/shared/*"]
+    }
+  },
+  "include": ["src/preload/**/*"],
+  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"],
+  "references": [{ "path": "./tsconfig.shared.json" }]
+}
diff --git a/tsconfig.renderer.json b/tsconfig.renderer.json
new file mode 100644
index 0000000..57059a2
--- /dev/null
+++ b/tsconfig.renderer.json
@@ -0,0 +1,29 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "emitDeclarationOnly": true,
+    "outDir": "./node_modules/.cache/tsc/renderer",
+    "tsBuildInfoFile": "./node_modules/.cache/tsc/renderer/tsconfig.tsbuildinfo",
+    "target": "ES2023",
+    "lib": ["ES2023", "DOM", "DOM.Iterable"],
+    "types": [],
+    "jsx": "react-jsx",
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "noImplicitOverride": true,
+    "noFallthroughCasesInSwitch": true,
+    "verbatimModuleSyntax": true,
+    "isolatedModules": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "paths": {
+      "@shared/*": ["./src/shared/*"],
+      "@renderer/*": ["./src/renderer/*"]
+    }
+  },
+  "include": ["src/renderer/**/*", "src/preload/necroamp-window.d.ts"],
+  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"],
+  "references": [{ "path": "./tsconfig.shared.json" }]
+}
diff --git a/tsconfig.shared.json b/tsconfig.shared.json
new file mode 100644
index 0000000..c40115e
--- /dev/null
+++ b/tsconfig.shared.json
@@ -0,0 +1,26 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "emitDeclarationOnly": true,
+    "outDir": "./node_modules/.cache/tsc/shared",
+    "tsBuildInfoFile": "./node_modules/.cache/tsc/shared/tsconfig.tsbuildinfo",
+    "target": "ES2023",
+    "lib": ["ES2023"],
+    "types": [],
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "noImplicitOverride": true,
+    "noFallthroughCasesInSwitch": true,
+    "verbatimModuleSyntax": true,
+    "isolatedModules": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "paths": {
+      "@shared/*": ["./src/shared/*"]
+    }
+  },
+  "include": ["src/shared/**/*"],
+  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
+}
diff --git a/tsconfig.tests.json b/tsconfig.tests.json
new file mode 100644
index 0000000..3992c56
--- /dev/null
+++ b/tsconfig.tests.json
@@ -0,0 +1,41 @@
+{
+  "compilerOptions": {
+    "composite": true,
+    "emitDeclarationOnly": true,
+    "outDir": "./node_modules/.cache/tsc/tests",
+    "tsBuildInfoFile": "./node_modules/.cache/tsc/tests/tsconfig.tsbuildinfo",
+    "target": "ES2023",
+    "lib": ["ES2023", "DOM", "DOM.Iterable"],
+    "types": ["node"],
+    "jsx": "react-jsx",
+    "module": "ESNext",
+    "moduleResolution": "bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "noImplicitOverride": true,
+    "noFallthroughCasesInSwitch": true,
+    "verbatimModuleSyntax": true,
+    "isolatedModules": true,
+    "skipLibCheck": true,
+    "forceConsistentCasingInFileNames": true,
+    "paths": {
+      "@shared/*": ["./src/shared/*"],
+      "@main/*": ["./src/main/*"],
+      "@renderer/*": ["./src/renderer/*"]
+    }
+  },
+  "include": [
+    "tests/**/*",
+    "src/**/*.test.ts",
+    "src/**/*.test.tsx",
+    "electron.vite.config.ts",
+    "vitest.config.ts",
+    "playwright.config.ts"
+  ],
+  "references": [
+    { "path": "./tsconfig.shared.json" },
+    { "path": "./tsconfig.main.json" },
+    { "path": "./tsconfig.preload.json" },
+    { "path": "./tsconfig.renderer.json" }
+  ]
+}
diff --git a/vitest.config.ts b/vitest.config.ts
new file mode 100644
index 0000000..4cd3888
--- /dev/null
+++ b/vitest.config.ts
@@ -0,0 +1,75 @@
+import { fileURLToPath } from 'node:url';
+import { defineConfig } from 'vitest/config';
+
+// Alias table. Must equal the tables in electron.vite.config.ts and tsconfig `paths` (R2.2).
+// tests/config/alias-consistency.test.ts enforces this.
+export const alias = {
+  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
+  '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
+  '@renderer': fileURLToPath(new URL('./src/renderer', import.meta.url)),
+};
+
+export default defineConfig({
+  resolve: { alias },
+  test: {
+    globals: false,
+    passWithNoTests: false,
+    coverage: {
+      provider: 'v8',
+      include: ['src/**/*.{ts,tsx}'],
+      exclude: [
+        'src/main/index.ts',
+        'src/renderer/main.tsx',
+        '**/*.d.ts',
+        '**/*.test.*',
+        '**/*.module.css',
+      ],
+      reporter: ['text-summary', 'html'],
+      reportsDirectory: 'coverage',
+      thresholds: {
+        statements: 80,
+        lines: 80,
+        functions: 80,
+        branches: 75,
+        // Security-critical IPC validation modules (design section 10, N5).
+        'src/shared/ipc/**': { lines: 95, branches: 95 },
+        'src/main/ipc/register-handler.ts': { lines: 95, branches: 95 },
+        'src/main/security/sender-validation.ts': { lines: 95, branches: 95 },
+        'src/main/security/trusted-origins.ts': { lines: 95, branches: 95 },
+        'src/main/protocol/resolve-app-path.ts': { lines: 95, branches: 95 },
+        'src/main/security/csp.ts': { lines: 95, branches: 95 },
+      },
+    },
+    projects: [
+      {
+        extends: true,
+        test: {
+          name: 'node',
+          environment: 'node',
+          include: [
+            'src/main/**/*.test.ts',
+            'src/shared/**/*.test.ts',
+            'src/preload/**/*.test.ts',
+            'tests/**/*.test.ts',
+          ],
+          exclude: ['tests/e2e/**', 'tests/fixtures/**', 'tests/setup/**'],
+          setupFiles: ['tests/setup/node.setup.ts'],
+        },
+      },
+      {
+        extends: true,
+        test: {
+          name: 'renderer',
+          environment: 'jsdom',
+          include: [
+            'src/renderer/**/*.test.ts',
+            'src/renderer/**/*.test.tsx',
+            'tests/a11y/**/*.test.tsx',
+            'tests/integration/**/*.integration.test.tsx',
+          ],
+          setupFiles: ['tests/setup/renderer.setup.ts'],
+        },
+      },
+    ],
+  },
+});
~~~~
