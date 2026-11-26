# Requirements: desktop-foundation (Phase 05)

Status: DRAFT, awaiting human approval. Design and tasks are not written.

> **Location note.** Intended path: `.kiro/specs/desktop-foundation/requirements.md`. The writing agent (necro-architect) cannot write `.kiro/**` (see `preflight.md`, W2), so this file is staged under `docs/requirements/desktop-foundation/`. Move or copy it, with `preflight.md`, to the Spec folder.

## 1. Purpose and scope

Establish the first functional, secure, cross-platform Electron foundation for NecroAmp: toolchain, process separation, hardened window, narrow typed IPC, strict CSP, application lifecycle, test and lint foundations, and an initial window with placeholder areas for later features. The result is a foundation, not final art.

Out of scope are listed in section 15. The audio engine, skin engine and GitHub integration are not implemented.

## 2. Authority and sources

Binding: `.kiro/steering/product.md`, `tech.md`, `structure.md`, `kiroween.md`. Procedures: `electron-security` and `typescript-standards` and `testing-strategy` skills. Policies: `docs/engineering/package-script-policy.md`, `docs/engineering/shared-ownership-policy.md`. Decision record: `docs/adr/0001-linux-credential-storage-fail-closed.md` (not exercised in this phase; no token storage here). This document cites those sources and does not restate them.

Notation: EARS patterns (ubiquitous "The system shall", event "When", state "While", unwanted "If ... then", optional "Where"). Requirements are numbered `R<n>`, criteria `R<n>.<m>`. Each criterion states how it is verified: **U** unit test, **P** property test (fast-check), **E** Playwright Electron test, **C** command run, **S** static check (lint rule, grep-style test), **R** review (named reviewer). "Dev" means the unpackaged development run.

## 3. Glossary

- **App origin**: the origin from which the renderer document is loaded in production (see D4). In dev, the dev-server origin is additionally trusted (R3.5).
- **Bridge**: the object exposed to the renderer through `contextBridge` by the preload script.
- **Placeholder**: a UI element that is rendered, labelled and focusable but performs no feature behavior.

## 4. Assumptions

State these before approval. Each is an assumption, not a decision, and can be overturned.

- A1. The development host is Windows with PowerShell (`tech.md`, Environment notes). Node.js and pnpm may be absent and must be verified (R1.1). macOS and Linux behavior may be unverifiable in this phase and must then be reported as NOT VERIFIED (R16.3).
- A2. A single `app:get-info` channel is enough to prove the IPC path end to end. No other channel is created in this phase (R4.7).
- A3. English-only UI (`structure.md` open decision 17, assumed there).
- A4. No bundled binary assets (images, fonts, sounds) are added. System fonts and inline or text glyphs are used, so `docs/assets.md` needs no new entry (R8.12).
- A5. Windows, macOS and Linux CI is a later task. This phase verifies locally; the commands must be CI-ready (frozen lockfile, non-interactive, non-watch).
- A6. Electron, electron-vite, Vite, React, TypeScript, Zustand, Zod, Vitest, fast-check, Playwright and the lint tools are all current stable releases resolved at scaffold time from official documentation or the package registry (R1.3). No version is written in this document.
- A7. Playwright's Electron support, the safeStorage API and Electron's session and protocol APIs may differ by Electron release. Any API name not confirmed against the documentation for the resolved version is ASSUMED and must be checked in the design.
- A8. The Spec will be maintained by the human or IDE session; agents cannot write `.kiro/**`.

## 5. Requirements: toolchain and reproducible installs

**R1. User story:** As a maintainer, I want the toolchain pinned and installs reproducible, so that any contributor on any platform gets the same build.

- R1.1 When a contributor prepares the workspace, the scaffold task shall verify `node --version` reports major version 24 and `pnpm --version` reports major version 10, and shall stop and report if either is missing or different. Verified by C.
- R1.2 The project shall declare Node 24 in `package.json` `engines` and in `.nvmrc`, and declare pnpm 10 through the `packageManager` field with an exact version. Verified by S.
- R1.3 Every dependency version shall be resolved at scaffold time from official documentation or the package registry and recorded in `package.json`. A version that cannot be confirmed shall be reported, not guessed. Verified by R (architect, security-reviewer).
- R1.4 The recorded Electron, electron-vite, Vite, React and TypeScript versions shall be mutually compatible according to the official documentation of electron-vite and Electron for the resolved versions, and the compatibility source shall be cited in the design. Verified by R.
- R1.5 When `pnpm install --frozen-lockfile` is run on a clean checkout with a committed `pnpm-lock.yaml`, it shall succeed on Windows, macOS and Linux, and shall fail when the lockfile is out of sync with `package.json`. Verified by C (host platform; others per R16.3).
- R1.6 If a dependency has an install or build script, then it shall run only when allowed by name in the pnpm build-script approval setting, with the reason recorded in an ADR. `dangerouslyAllowAllBuilds` shall not be set and `strictDepBuilds` shall stay at its default (`package-script-policy.md` 4.4). Verified by R (security-reviewer, architect ADR).
- R1.7 For each new runtime dependency, the license and purpose shall be recorded in the design, and only permissive licenses (MIT, Apache-2.0, BSD, ISC) shall be accepted without escalation to the user. Verified by R.
- R1.8 The repository shall use pnpm only: no `package-lock.json` or `yarn.lock`, and no `npm` or `yarn` in documented commands. Verified by S.

## 6. Requirements: architecture and structure

**R2. User story:** As an architect, I want strict process and module boundaries, so that the untrusted renderer cannot reach privileged code.

- R2.1 The project shall contain `src/main`, `src/preload`, `src/renderer` (with `app`, `features`, `stores`, `components` as needed) and `src/shared`, per `structure.md`, created only where this phase uses them. Verified by S.
- R2.2 The path aliases `@shared/*`, `@main/*` and `@renderer/*` shall resolve identically in the TypeScript, electron-vite and Vitest configurations, and no import shall use a relative chain of three or more `../` segments. Verified by C (typecheck, test) and S.
- R2.3 The dependency direction of `structure.md` shall be enforced automatically: a fixture or rule test shall show that each of these makes `pnpm lint` (or `pnpm test`) fail: renderer importing `src/main`; `src/shared` importing `electron`, a DOM global or a Node built-in; a feature folder importing another feature's non-public module. Verified by S.
- R2.4 Code under `src/shared` shall import nothing from Electron, the DOM or Node-only APIs. Verified by S and `pnpm typecheck` with a shared tsconfig that excludes DOM and Node types.
- R2.5 TypeScript shall run with `strict: true` in every tsconfig. `any` shall be rejected by lint unless an adjacent comment justifies it. Files shall be kebab-case, exports named (default exports only where a tool requires them). Verified by S.
- R2.6 Pure logic (origin check, CSP builder, payload parsing, platform lifecycle policy) shall be in modules with no React, Electron or DOM imports so it can be unit and property tested. Verified by S and U.

## 7. Requirements: Electron security

**R3. User story:** As a user, I want the window hardened by default, so that a compromised renderer cannot reach my system.

- R3.1 The system shall create every `BrowserWindow` through one factory function, and no other call site shall construct a `BrowserWindow`. Verified by S.
- R3.2 The factory shall set `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` and `webviewTag: false`, and shall not allow insecure content. Verified by U (factory output) and E (read the live window's web preferences from the main process).
- R3.3 These settings shall be identical in dev, test and production. No flag, environment variable or argument shall weaken them. Verified by U and S (no `--no-sandbox`, `--disable-web-security`, `--remote-debugging-port` in any script, config or source file).
- R3.4 The preload script path shall be a fixed constant, never derived from input. Verified by S.
- R3.5 The window shall load only the application's own renderer bundle. In dev only, the dev-server origin shall also be accepted. Where the build is production, no dev origin shall be present in any allow-list. Verified by U and E.
- R3.6 The renderer shall have no access to `require`, `process`, `Buffer`, `ipcRenderer` or Node modules. Verified by E (evaluate `typeof` in the page for each name; expected `undefined`).

**R4. User story:** As a security reviewer, I want a narrow typed IPC bridge, so that the renderer can only call named, validated operations.

- R4.1 Every IPC channel name shall be a constant in `src/shared/ipc/channels.ts` in the form `domain:action`. No string literal channel name shall appear elsewhere in `src`. Verified by S.
- R4.2 Every channel shall have a request schema and a response schema in `src/shared/ipc/`, named `fooSchema` with inferred type `Foo`. Verified by S and R (architect contract review per `shared-ownership-policy.md` 3.1).
- R4.3 When a handler receives a payload, the receiving process shall parse it with the schema before use. If parsing fails, then the handler shall return a typed error result (a code and a short message) and shall not throw across the IPC boundary. The error shall contain no filesystem path, stack trace or payload content. Verified by U and P (arbitrary input never throws, and every non-conforming input yields the error result).
- R4.4 When a privileged handler is invoked, it shall validate the sender (`event.senderFrame` origin or URL) against the trusted origins and reject any other sender. Verified by U (wrong sender, missing frame, sub-frame) and P (arbitrary origin strings never accepted unless exactly trusted).
- R4.5 All handlers shall be registered through one helper that applies sender validation and schema parsing, so a handler cannot omit them. Verified by S and R.
- R4.6 The preload shall expose one namespaced object through `contextBridge` containing named functions. It shall not expose `ipcRenderer`, a generic `invoke`, `send`, `on` or any function accepting an arbitrary channel name. Verified by E (the exposed key set equals an allow-list in the test) and U.
- R4.7 This phase shall define exactly one channel, `app:get-info`, returning the application name, version string and a platform value limited to `win32`, `darwin`, `linux`. No file, token, navigation or `shell.openExternal` channel shall exist. Verified by S and E.
- R4.8 If the renderer invokes a channel that is not registered, then no handler shall execute and the call shall reject without privileged effect. Verified by E.
- R4.9 The renderer shall reach the bridge through one adapter module so components and stores can be tested with a fake. Verified by S and U.

**R5. User story:** As a security reviewer, I want a strict Content Security Policy, so that injected content cannot run scripts or call out.

- R5.1 The system shall deliver a CSP from the main process (response header or protocol response) for every renderer document load, in addition to any `<meta>` tag. Verified by E.
- R5.2 The production policy shall include `default-src`, `script-src 'self'`, `object-src 'none'`, `base-uri` and `frame-ancestors` restricted to none or self, `form-action` restricted, and a `connect-src` that permits no remote host. Verified by U (policy builder output) and E (effective policy).
- R5.3 The production policy shall contain no `unsafe-eval`, no `unsafe-inline` in `script-src`, and no `http:`, `https:`, `ws:`, `wss:` or wildcard source in any directive. Verified by P (for every builder option combination marked production) and E.
- R5.4 The `style-src` value shall follow decision D3. If D3 does not approve `unsafe-inline`, then no inline `style` attribute or inline `<style>` element shall be needed by the UI. Verified by E and S.
- R5.5 Where the run is dev, the policy may add the dev-server HTTP origin and its WebSocket origin only. The production build output shall contain neither. Verified by U and E on the built app.
- R5.6 When the app starts offline, the renderer shall issue no request to any origin other than the app origin. Verified by E (record all requests during launch and first render).
- R5.7 When a test injects an inline script and a remote `fetch`, both shall be blocked by the policy. Verified by E.

**R6. User story:** As a user, I want the app to refuse unexpected navigation, new windows and permissions.

- R6.1 When any navigation to a URL outside the app origin is attempted (`https:`, `http:`, `file:`, `data:`, `javascript:`), the main process shall prevent it. Verified by E for each scheme.
- R6.2 When `window.open` or a new-window request occurs, the system shall deny it. No external opener exists in this phase. Verified by E.
- R6.3 When a `<webview>` attach is attempted, the system shall block it. Verified by U.
- R6.4 The permission request handler and the permission check handler shall deny every permission. Verified by U and E.
- R6.5 The code shall not call `shell.openExternal` in this phase. If external opening is added later, then it shall go only through an allow-listed `https:` wrapper (`electron-security` skill, procedure 5). Verified by S.
- R6.6 The code shall not enable the remote module, `nodeIntegrationInWorker`, `allowRunningInsecureContent` or experimental web features. Verified by S.

## 8. Requirements: application lifecycle and cross-platform behavior

**R7. User story:** As a user on any OS, I want standard app behavior for launching, closing and relaunching.

- R7.1 When the app is ready, the system shall create exactly one main window, show it after its first paint, and set its title to `NecroAmp`. Verified by E (one window, visible, title matches) and U (factory call count).
- R7.2 When a second instance is launched, the second process shall exit and the first window shall be restored and focused (single-instance lock). Verified by E. This is assumption D11 pending confirmation.
- R7.3 When all windows are closed on `win32` or `linux`, the app shall quit. On `darwin` it shall stay running, and when it is activated with no window open it shall create the main window. The decision shall be a pure function of the platform string. Verified by U (all three platform values) and P (any other string selects quit) and E on the host platform.
- R7.4 If the main window's renderer process terminates unexpectedly, then the main process shall log the reason without any user data and shall either reload the window once or close it, never leave an invisible running app. Verified by U (mocked event).
- R7.5 If an uncaught exception or unhandled rejection occurs in the main process, then it shall be logged locally. The system shall not start the crash reporter or send data anywhere. Verified by S and U.
- R7.6 When the user quits through the OS, the main process shall remove its handlers and exit within 5 seconds of the last window closing. Verified by E.
- R7.7 The app name shall be set to `NecroAmp`, which determines the user-data directory. Verified by E.

**R16. User story:** As a maintainer, I want parity across Windows, macOS and Linux, so that no platform is broken silently.

- R16.1 Platform-dependent branches shall be isolated in small pure functions with unit tests covering `win32`, `darwin` and `linux`. Verified by U.
- R16.2 Path handling shall use platform path APIs, with no hard-coded separators or drive letters. Verified by S.
- R16.3 The final report shall state, per platform and per verification kind (install, build, test, e2e), one of PASSED, FAILED, or NOT VERIFIED with reason. NOT VERIFIED is acceptable only for platforms not available to the executor. Verified by R.
- R16.4 No script, config or documented command shall use POSIX-only syntax (`export`, `&&` chains that break in PowerShell 5, `VAR=value cmd`, `rm`). Commands shall work in PowerShell, bash and zsh. Verified by S and C on the host.
- R16.5 The app shall run with `sandbox: true` on Linux. Documentation shall describe the sandbox prerequisites for Linux development and CI, and shall not recommend `--no-sandbox`. Verified by S and R.
- R16.6 Where the platform is macOS, the application menu shall provide the standard application, edit and window roles (quit, copy, paste, close window). Menu visibility on Windows and Linux follows decision D6. Verified by U.
- R16.7 Line endings shall be normalized to LF in the repository so that Windows contributors do not produce CRLF diffs. Verified by S (a committed `.gitattributes` or `.editorconfig`; owner: human, see section 13).

## 9. Requirements: initial window

**R8. User story:** As a developer who listens to music, I want to see the NecroAmp window with its main areas, so that I understand the layout future features will fill.

- R8.1 The window shall show the text `NecroAmp` as a visible heading (the page's single `h1`) and the document title `NecroAmp`. Verified by E.
- R8.2 The window shall show the tagline exactly `Code. Listen. Repeat.` Verified by E (exact text match).
- R8.3 The window shall contain these six regions, each a landmark or labelled group with a stable `data-testid` and an accessible name: player controls (`player`), playlist (`playlist`), equalizer (`equalizer`), visualization (`visualization`), skin selection (`skin-selector`), GitHub integration (`github`). Verified by E.
- R8.4 The player region shall contain placeholder buttons Previous, Play, Pause, Stop and Next, each with a visible or accessible text name. When activated, a placeholder shall change nothing but may show a short "Not implemented in this phase" status. It shall create no `AudioContext`, call no IPC and make no network request. Verified by E and S (no `AudioContext` in the source).
- R8.5 The playlist region shall contain a heading, an empty-state message and a list element for future items. Verified by E.
- R8.6 The equalizer region shall contain ten inert band placeholders labelled "Band 1" to "Band 10". No frequency value, gain mapping or filter shall be defined here. Verified by E.
- R8.7 The visualization region shall contain a static placeholder with no `AnalyserNode`, canvas animation loop or `requestAnimationFrame` call. Verified by E and S.
- R8.8 The skin selection region shall contain a labelled placeholder control showing a single non-functional "Foundation default" entry. It shall load no skin, read no skin file and name no third-party skin. Verified by E and S.
- R8.9 The GitHub region shall state that the integration is optional and not signed in, and may contain an inert "Sign in" placeholder button. It shall make no network call and use no token. Verified by E and S.
- R8.10 When the renderer starts, it shall call `app:get-info` through the bridge and display the version and platform. If the call fails, then it shall display "unavailable" in that spot and the rest of the UI shall still render. Verified by E and U (store with fake bridge).
- R8.11 The layout shall show all six regions without overlap or horizontal scrolling at a window size of 800 by 600 and at 1920 by 1080. Verified by E (bounding boxes) at both sizes. The minimum window size shall be set to the 800 by 600 value or smaller.
- R8.12 The UI shall bundle no image, font or sound file. If any asset is added, then it shall be recorded in `docs/assets.md` with author, source and license first. Verified by S and R.
- R8.13 Colors, spacing and type sizes shall be defined as CSS custom properties, so that the later skin engine can replace them. The visual design is explicitly provisional. Verified by S.
- R8.14 The UI shall be fully rendered with no network access. Verified by E (same run as R5.6).

**R9. User story:** As a keyboard or screen-reader user, I want the foundation UI to be operable, so that accessibility is built in from the start.

- R9.1 The document shall set `lang="en"` and contain exactly one `h1`. Verified by E.
- R9.2 Every interactive element shall have an accessible name and be reachable by Tab in reading order, with no keyboard trap. Verified by E (Tab through all controls and check focus order).
- R9.3 Each focused element shall show a visible focus indicator with at least 3:1 contrast against its surroundings. Verified by U (token pair contrast function) and E (focus style present).
- R9.4 Body and label text in the default theme shall have at least 4.5:1 contrast against its background. Verified by P (contrast function over the theme tokens) and U.
- R9.5 Placeholder controls that do nothing shall expose that state to assistive technology (for example `aria-disabled` and a description), not rely on color alone. Verified by E.
- R9.6 Where an automated accessibility scanner is approved (D8), the initial window shall have zero serious or critical violations. Verified by E.
- R9.7 The UI shall contain no animation or auto-updating content in this phase. Verified by S.

**R10. User story:** As a frontend developer, I want a state layer in place, so that later features share one pattern.

- R10.1 The renderer shall contain at least one Zustand store under `src/renderer/stores`, holding the app-info loading state (idle, loading, loaded with data, failed). Verified by U (all transitions, including failure).
- R10.2 Stores shall not import feature internals, and no component shall access `window` bridge members directly (R4.9). Verified by S.
- R10.3 The renderer shall hold no audio state or timing logic in this phase. Verified by S.

## 10. Requirements: tooling and testing

**R11. User story:** As a contributor, I want a small set of reliable commands, so that I can build, check and test the same way everywhere.

- R11.1 `package.json` shall define `dev`, `build`, `typecheck`, `lint`, `test` and `test:e2e` (names from `tech.md`). A `package` script is not part of this phase (D10). Verified by S.
- R11.2 `pnpm build` shall exit 0 on a clean install and produce the main, preload and renderer outputs under the electron-vite output directory, with no network access after install. Verified by C.
- R11.3 `pnpm typecheck` shall check main, preload, renderer, shared and test code with strict settings, exit 0 on the clean tree, and exit non-zero on a type error. Verified by C (clean run, plus an intentional-error fixture test or documented one-off check).
- R11.4 `pnpm test` shall run the unit and property tests once and exit, without entering watch mode regardless of terminal or `CI` variable, so that automation hooks cannot hang. It shall exit non-zero on any failure. Verified by C and S (script body uses the single-run mode).
- R11.5 `pnpm lint` shall exit 0 on the clean tree and non-zero on a violation, covering `src`, `tests` and config files. Verified by C.
- R11.6 `pnpm dev` shall start the app with renderer hot reload, with all R3 settings in force. It is documented but not an automated gate. Verified by C (manual or smoke) and R.
- R11.7 `pnpm test:e2e` shall run Playwright against a fresh build of the app, and fail with a clear message if the build output is missing or stale. Verified by C.
- R11.8 Script bodies shall follow `package-script-policy.md` section 4.4: no publish, release, tag, push, `gh`, `curl` or credential reading, no `node -e`, no `pre*`/`post*` hook unless reviewed. Every script body and hook shall be listed in the hand-off for security-reviewer review. Verified by R (security-reviewer) and S.
- R11.9 The README (or a linked document) shall list prerequisites, the commands and the platform notes of R16.5. Verified by R. Owner: see section 13.

**R12. User story:** As a maintainer, I want the unit and property test foundation in place, so that pure logic is tested from the first commit.

- R12.1 Vitest shall be configured so that `*.test.ts(x)` and `*.property.test.ts` files discover and run, with a Node environment for main and shared code and a DOM environment for renderer component tests (the DOM implementation is D8). Verified by C.
- R12.2 fast-check shall be installed and each of these pure modules shall have at least one property test: the origin check (R4.4), the CSP builder (R5.3), the IPC payload parser (R4.3), the platform lifecycle policy (R7.3) and the contrast function (R9.4). Each property shall run at least 100 cases. Verified by C.
- R12.3 Tests shall be deterministic and offline: no real network, no real token, no dependence on wall-clock time. The fast-check seed shall be reported on failure. Verified by C (run with network disabled where the platform allows, otherwise by review) and R.
- R12.4 Main-process modules (window factory, lifecycle, handlers) shall take Electron objects as injected parameters so that they can be tested without launching Electron. Verified by U.
- R12.5 At least one renderer component test shall render the shell and assert R8.1 to R8.3 text and regions. Verified by C.
- R12.6 Where a coverage provider is approved (D12), a coverage report shall be available, and pure-logic modules shall reach the threshold set there. Verified by C.

**R13. User story:** As a QA engineer, I want an end-to-end Electron test foundation, so that security and lifecycle claims are tested against the real app.

- R13.1 Playwright shall be configured to launch the built Electron app. Verified by C.
- R13.2 A smoke test shall launch the app, assert one window, the title, the tagline, the six regions and the displayed platform equal to the host platform. Verified by E.
- R13.3 Security end-to-end tests shall cover R3.2, R3.6, R4.6, R4.8, R5.1 to R5.7, R6.1, R6.2 and R6.4. Verified by E.
- R13.4 Lifecycle tests shall cover R7.1, R7.2, R7.3 (host platform) and R7.6. Verified by E.
- R13.5 Tests shall not use fixed sleeps, shall run against an isolated user-data directory, and shall never touch the developer's real profile. Verified by R and S.
- R13.6 Test output directories (`test-results`, `playwright-report`) shall be git-ignored, and traces or screenshots shall be kept only on failure. Verified by S (owner: human for `.gitignore`).
- R13.7 On Linux, the e2e run shall work under a virtual display, documented in the README. CI wiring is out of scope. Verified by R.
- R13.8 The e2e suite shall pass with no network access. Verified by E.

**R14. User story:** As a contributor, I want automatic lint and format checks, so that style and boundaries are enforced mechanically.

- R14.1 A lint tool and a format tool (D2) shall be configured and committed, with rules for no explicit `any`, React hooks correctness, basic accessibility of JSX, the import restrictions of R2.3 and no default exports except where a tool needs them. Verified by C and S.
- R14.2 A command shall check formatting without writing, and `pnpm lint` shall fail on formatting violations or a separate documented check shall be provided. Verified by C.
- R14.3 Lint and format tools shall not access the network when run. Verified by R.

## 11. Requirements: cross-cutting security and privacy

**R15. User story:** As a privacy-minded developer, I want no hidden network or telemetry, and no leaked data.

- R15.1 The source shall contain no telemetry, analytics, crash reporting, advertising or update-check code, and the main process shall make no network request in this phase. Verified by S (no import or call of `crashReporter`, `autoUpdater`, `electron-updater`, `net`, `fetch`, HTTP clients in `src`) and E (R5.6).
- R15.2 The repository shall contain no secrets, tokens or personal data; `.env` files remain ignored. Verified by R (security-reviewer) and S.
- R15.3 Log output shall not include renderer-supplied payloads, filesystem paths or tokens. Verified by U (error mapper) and R.
- R15.4 The renderer shall have no filesystem access. The main process shall read the filesystem in this phase only to load its own application bundle. Where D4 selects a custom protocol for the renderer, the handler shall resolve each URL against the bundle root and reject `..`, encoded separators, absolute paths, drive letters and symlinks leaving the root. Verified by U and P (arbitrary URL strings never resolve outside the root).
- R15.5 A security-reviewer review of the IPC, window, CSP, scripts and dependency changes shall report zero open blockers before the Spec is considered done. Verified by R.
- R15.6 Electron Fuses (RunAsNode, ASAR integrity) apply to packaged builds (`tech.md`). They are deferred to the packaging phase; this phase's code shall not depend on those settings being off. Verified by R.

## 12. Requirements: documentation and record keeping

**R17. User story:** As a maintainer entering Kiroween, I want decisions and Kiro usage recorded.

- R17.1 Each decision in section 14 that is resolved by the human shall have an ADR in `docs/adr/` before the code that depends on it. Verified by R.
- R17.2 The design shall cite its sources for version compatibility and Electron API names (A7). Verified by R.
- R17.3 The hand-off shall list files this phase needs that no agent can write (section 13) and who writes them. Verified by R.

## 13. Hand-off: ownership of work items

Based on `preflight.md` section B. "Human" means the maintainer or the IDE main session.

| Work item | Owner |
|---|---|
| Manifest, scripts, `.nvmrc`, tsconfig, electron-vite config | desktop-engineer |
| `src/main`, `src/preload`, `src/shared/ipc` and their co-located unit tests | desktop-engineer |
| Renderer shell, placeholder UI, stores, adapter, co-located tests | frontend-engineer |
| `vitest.config.ts`, `playwright.config.ts`, `tests/**`, property and integration tests | qa-engineer |
| ESLint and Prettier or Biome config, `.editorconfig`, `.gitattributes`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions, README command section | Human (no agent can write them; or a scoped permission change per `shared-ownership-policy.md`, user approval needed) |
| Installs and `pnpm-lock.yaml` | Human (all agents are `ask`) |
| Unassigned `src/shared/**` (if any shared pure util is needed) | Architect designs, human implements |
| ADRs, design, architecture review, quality gate | necro-architect |
| Script, dependency, IPC, CSP review | security-reviewer |
| Spec files and task status in `.kiro/specs/**` | Human or IDE session |

## 14. Unresolved technical decisions (needs human decision)

None is resolved here. "Architect leaning" is a recommendation only, and the design will not rely on it until you confirm.

| ID | Decision (structure.md ref) | Options | Trade-offs | Architect leaning |
|---|---|---|---|---|
| D1 | Repository layout (#1) | (a) single package; (b) pnpm workspace monorepo | (a) simplest, matches `structure.md` target, fewer config files, easy to split later. (b) clean package boundaries enforced by the package manager, but more config, slower scaffold, three process builds across packages. | (a) |
| D2 | Lint and format tool (#9) | (a) ESLint + Prettier; (b) Biome | (a) mature plugins for React hooks, JSX accessibility and import-boundary rules (needed for R2.3, R14.1), more dependencies and config. (b) one tool, faster, but fewer rule plugins; boundary and a11y rules may need custom work. | (a) |
| D3 | Styling approach (#8) and CSP `style-src` | (a) CSS Modules + CSS custom properties; (b) plain global CSS + custom properties; (c) runtime CSS-in-JS | (a) scoped, no runtime, works with `style-src 'self'`. (b) simplest, collisions at scale. (c) usually needs `unsafe-inline`, which weakens R5. React inline `style` attributes also need `style-src-attr`, so dynamic values should be set through CSS variables via the CSSOM. | (a) |
| D4 | Production renderer origin | (a) `file://` URL; (b) custom privileged-minimal protocol (for example `app://`); (c) local HTTP server | (a) simplest, but origin is opaque, sender validation and CSP are weaker. (b) stable origin for sender checks and CSP, needs a path-confining handler (R15.4) and scheme registration before ready. (c) opens a network port, rejected by product principles. Backlog A7 notes scheme flags are not yet documented. | (b) |
| D5 | Window chrome and multi-window (#16) | (a) native frame, single window; (b) frameless custom chrome, single window; (c) multi-window (main, equalizer, playlist) | (a) cheapest, accessible and parity-safe, reversible. (b) needs drag regions, resize and window controls on three OSes. (c) matches Winamp but multiplies windows and the security surface. R3.1 requires a factory in all cases. | (a) for this phase |
| D6 | Application menu on Windows and Linux | (a) hide the menu bar; (b) minimal default menu; (c) full custom menu | Affects keyboard shortcuts such as copy and paste and platform parity. macOS needs a role menu regardless (R16.6). | (b) |
| D7 | Linux targets (#12), auto-update (#10), signing (#11) | Deferred to the packaging phase | This phase produces no installer. Listed to confirm they are intentionally out. | Defer |
| D8 | Renderer test environment and tools | DOM: jsdom or happy-dom; Testing Library; axe-based scanner (`@axe-core/playwright` or similar) | Each adds a dev dependency needing an ADR or architect note and security review (`package-script-policy.md` 4.2). Skipping the scanner leaves R9.6 inactive. | jsdom + Testing Library + scanner, subject to license check |
| D9 | Dependency build-script approvals | Which packages may run install scripts (Electron's binary download is the expected one) and the setting name for the pinned pnpm | Policy requires a named allow-list and an ADR. Files `.npmrc` or `pnpm-workspace.yaml` have no agent writer. | Allow Electron only, by name |
| D10 | `package` script and Electron Fuses | (a) include a `package` script now; (b) defer to the packaging phase | (a) adds electron-builder and its publish risk to this phase. (b) keeps scope to the listed commands. | (b) |
| D11 | Single-instance lock (R7.2) | (a) enforce; (b) allow multiple instances | (a) avoids two processes sharing one user-data directory. (b) is simpler but risks data corruption later. | (a) |
| D12 | Coverage provider and threshold (R12.6) | None; or v8 coverage with a threshold (for example 80 percent lines on pure logic) | A threshold gives a measurable gate but needs a dev dependency. | v8 coverage, threshold to be set by you |
| D13 | Who writes the files no agent can write (section 13) | (a) human writes them; (b) widen one agent's `fs_write` with security review | (a) no permission change. (b) faster, widens permissions (`shared-ownership-policy.md` option 2). | (a) |
| D14 | Internationalization (#17) | English only, assumed | Assumed in A3. Confirm. | Confirm |

Decisions not touched by this phase and left open in `structure.md`: #2, #3 (decided by ADR 0001, not exercised), #4, #5, #6, #7, #10 to #15 except as listed above.

## 15. Non-goals

- Audio engine: no `AudioContext`, decoding, equalizer filters, `AnalyserNode` or visualizer rendering.
- Skin engine: no manifest schema, loader, skin assets or skin switching.
- GitHub integration: no Octokit, authentication, token storage, explorer, Actions monitor or notifications.
- Library scanning, metadata, playlists logic, file dialogs, media protocol.
- Packaging, installers, signing, Electron Fuses, auto-update, release workflow, CI workflows.
- Final visual design, bundled artwork, fonts or sounds, localization, multi-window layout.
- Any telemetry, analytics, crash reporting, cloud service or AWS resource.
- Changes to steering, agents, skills, workflows or hooks.

## 16. Traceability summary

| Topic | Requirements | Primary verification |
|---|---|---|
| Toolchain, installs | R1, R11 | C, S |
| Structure and direction | R2, R10 | S, U |
| Window and bridge security | R3, R4, R5, R6, R15 | U, P, E, R |
| Lifecycle, platforms | R7, R16 | U, P, E |
| Initial window | R8, R9 | E, U |
| Tests and lint | R11, R12, R13, R14 | C |
| Records | R17 | R |

## 17. Approval

Please confirm: (1) the requirements as written; (2) a decision or an explicit "leave to design with the architect leaning" for D1 to D6, D8 to D14 (D7 is deferral); (3) how the files in section 13 will be written. Design starts after this approval.
