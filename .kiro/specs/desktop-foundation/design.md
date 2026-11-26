# Design: desktop-foundation (Phase 05)

Status: conditionally approved by the human; amended with the N4 license exception (E1), the dependency lifecycle policy (9.3), executable validation tasks (section 15), host prerequisites (section 16) and Appendix A. `tasks.md` implements the plan. Final human approval of this amended design and of `tasks.md` is pending.
Inputs: `requirements.md` (R1 to R17), `preflight.md`, steering (`product`, `tech`, `structure`, `kiroween`), `electron-security` skill and references, `testing-strategy` skill, `docs/engineering/package-script-policy.md`, `docs/engineering/shared-ownership-policy.md`, ADR 0001, and the human-approved decisions D1 to D14.

## 0. Overview, evidence labels and honesty notes

The foundation is a single-package Electron app. The main process is the only privileged code. It serves the production renderer from a minimal-privilege `app://renderer` protocol, delivers a strict CSP, denies navigation, new windows, webviews and all permissions, and exposes exactly one IPC channel, `app:get-info`, through a preload bridge. The renderer is a neutral React shell with six placeholder regions. Behavior (hooks and stores), state (Zustand) and presentation (CSS Modules over CSS custom properties) are separate, so a later Skin Engine can replace presentation and layout without rewriting behavior. No playback, equalizer, skin or GitHub logic exists.

Evidence labels: **VERIFIED** (read in this repo during this run), **DOCUMENTED** (stable Electron or tool behavior I am relying on from prior knowledge of the official docs, not re-fetched in this run), **UNVERIFIED** (must be checked before use).

**Dependency research (this run).** Section 9 versions were resolved from the public npm registry JSON and official Electron sources using read-only PowerShell 7 web requests (no `web_fetch` tool was available). Nothing was installed. Residual UNVERIFIED items are marked in 9.4. Electron API names in sections 3 to 6 are DOCUMENTED from long-stable APIs and carry an "UNVERIFIED for the pinned Electron" mark where the exact name or behavior is version-sensitive (requirements A7, R17.2). The first implementation task must check each against the Electron docs for the resolved version and cite the page in the implementation note.

## 1. Project structure

Single package (D1). Only directories used in this phase are created. `*` marks files no agent can write (written by the orchestrator under D13).

```
necroamp/
├─ .kiro/specs/desktop-foundation/{requirements,preflight,design}.md   (tasks.md later)
├─ docs/adr/0002..0005-*.md                       (architect, see section 11)
├─ src/
│  ├─ main/
│  │  ├─ index.ts                  composition root (only file with startup side effects)
│  │  ├─ constants.ts              APP_NAME, APP_SCHEME, APP_HOST, PRELOAD/RENDERER path segments
│  │  ├─ logging/logger.ts         local console logger, scrubs payloads and paths
│  │  ├─ lifecycle/
│  │  │  ├─ platform-policy.ts     PURE: quit-on-all-closed, recreate-on-activate (platform string)
│  │  │  ├─ app-menu.ts            PURE template builder + thin Menu adapter
│  │  │  ├─ single-instance.ts     lock + second-instance handler (Electron injected)
│  │  │  └─ crash-handlers.ts      uncaughtException, unhandledRejection, render-process-gone
│  │  ├─ window/
│  │  │  ├─ create-main-window.ts  THE only BrowserWindow call site (R3.1)
│  │  │  ├─ window-options.ts      PURE: web preferences + chrome profile -> options
│  │  │  ├─ chrome-profile.ts      ChromeProfile type, "native" profile only (D5)
│  │  │  ├─ navigation-guards.ts   web-contents-created guards (navigate, redirect, open, webview)
│  │  │  └─ permissions.ts         deny-all permission/check/device handlers
│  │  ├─ security/
│  │  │  ├─ csp.ts                 PURE: buildCsp({mode, devOrigin?})
│  │  │  ├─ trusted-origins.ts     PURE: resolveTrustedOrigins, isTrustedUrl
│  │  │  └─ sender-validation.ts   PURE: isTrustedSender(frameLike, trusted)
│  │  ├─ protocol/
│  │  │  ├─ app-protocol.ts        registerSchemes() and handler install (fs + Response)
│  │  │  ├─ resolve-app-path.ts    PURE: URL -> confined relative path or typed rejection
│  │  │  └─ mime-types.ts          extension allow-list
│  │  └─ ipc/
│  │     ├─ register-handler.ts    the one registration helper (sender check + parse + map)
│  │     └─ app-handlers.ts        handler for app:get-info
│  ├─ preload/index.ts             contextBridge, one namespaced frozen object
│  ├─ renderer/
│  │  ├─ index.html, main.tsx, env.d.ts          (frontend-engineer; top-level files)
│  │  ├─ app/
│  │  │  ├─ app-shell.tsx, shell-layout.ts       layout descriptor, region ids
│  │  │  ├─ bridge/necroamp-client.ts            THE adapter around window.necroamp (R4.9)
│  │  │  ├─ strings/en.ts                        all user-facing strings (D14)
│  │  │  ├─ styles/{tokens.css,global.css}       CSS custom properties (R8.13)
│  │  │  └─ theme/contrast.ts                    PURE contrast ratio functions
│  │  ├─ features/{player,playlist,equalizer,visualization,skin-selector,github}/
│  │  │     index.ts (public), <name>-region.tsx (container), <name>-view.tsx (presentational),
│  │  │     use-<name>.ts (headless behavior), <name>-view.module.css
│  │  ├─ stores/app-info-store.ts                Zustand, injected client
│  │  └─ components/{control-button,region-frame,status-text}/  presentational, props only
│  └─ shared/ipc/
│     ├─ channels.ts               IPC_CHANNELS constants (R4.1)
│     ├─ result.ts                 ipcResultSchema factory, ipcErrorSchema, error codes
│     ├─ app-info.ts               appInfoRequestSchema, appInfoResponseSchema, platformSchema
│     └─ index.ts
├─ tests/{e2e,fixtures}/           qa-engineer
├─ package.json, .nvmrc, tsconfig.json + 5 project tsconfigs, electron.vite.config.ts   (desktop-engineer)
├─ vitest.config.ts, playwright.config.ts                                            (qa-engineer)
├─ eslint.config.mjs*, prettier.config.mjs*, .prettierignore*, .editorconfig*, .gitattributes*,
│  .npmrc*, pnpm-workspace.yaml*, .gitignore additions*, pnpm-lock.yaml*, README command section*
```

Decisions behind the layout:

- No new `src/shared` subdirectory. Origin, CSP and path logic are main-only, so they live in `src/main/security` and `src/main/protocol`. The contrast function lives in `src/renderer/app/theme` because only the renderer and tests use it. This avoids the unassigned-`shared` ownership gap (`shared-ownership-policy.md` section 2) and needs no ADR for a new shared directory.
- `src/renderer/styles`, `src/renderer/strings` and similar top-level renderer subdirectories would be writable by no agent (preflight section B), so styles, strings, adapter and theme sit under `src/renderer/app/`, which frontend-engineer owns.
- Path aliases `@shared/*`, `@main/*`, `@renderer/*` (R2.2) are declared once per consumer: each project tsconfig `paths`, `electron.vite.config.ts` `resolve.alias` per target, and `vitest.config.ts` `resolve.alias`. All three read the same three mappings. A unit test in `tests/` loads the three configs' alias tables and asserts equality. `@preload/*` is not created because nothing imports preload.
- **Module format.** `package.json` does not set `"type": "module"`. Source is ES modules. electron-vite bundles main and preload to CommonJS. Reason: a sandboxed preload (`sandbox: true`) must be a single CommonJS script, and an ESM preload requires `sandbox: false` (DOCUMENTED Electron behavior; electron-vite emits `.mjs` for `type: module` projects, UNVERIFIED for the pinned version). Config files that need ESM use the explicit `.mjs` extension (`eslint.config.mjs`, `prettier.config.mjs`). The E2E test that asserts the bridge is present proves the preload loaded under the sandbox.
- Dependency direction (R2.3) is enforced with ESLint core `no-restricted-imports` in per-glob flat-config blocks, so no import-plugin dependency is added:
  - `src/renderer/**` forbids `@main/*`, `electron`, `node:*` and Node built-in names.
  - `src/shared/**` forbids `electron`, `react`, `node:*` and Node built-ins, plus `no-restricted-globals` for `window`, `document`, `navigator`, `process`, `Buffer`. `tsconfig.shared.json` also sets `lib: ["ES2023"]` and `types: []`, so DOM and Node types do not exist there (R2.4).
  - `src/renderer/features/**` forbids `@renderer/features/*/*` (deep imports of another feature). A feature imports only another feature's `index.ts`, and the rule set also forbids feature-to-feature imports altogether in this phase.
  - `src/preload/**` and `src/main/**` forbid `@renderer/*`.
  - Three or more `../` segments are forbidden with a `no-restricted-imports` pattern `../../../*`.
  - Each rule has a fixture test in `tests/lint-rules/` that runs ESLint's `Linter` API on a string and expects the violation (R2.3 "fixture or rule test"). No network, no files written.
- Static checks that R3.1, R4.1, R6.5, R8.4, R8.7, R15.1 require (single `new BrowserWindow`, no literal channel names, no `shell.openExternal`, no `AudioContext`, `requestAnimationFrame`, `crashReporter`, `autoUpdater`, `net`, `fetch`) are `no-restricted-syntax`/`no-restricted-globals`/`no-restricted-properties` rules plus a source-scan test in `tests/static/source-policy.test.ts` that reads `src/**` with `node:fs` and applies regexes. Both fail `pnpm lint` or `pnpm test`.

## 2. Electron process architecture

Three processes (`tech.md`). No fourth window, utility process or worker exists in this phase.

- **Main** (`src/main/index.ts`): composition root. Startup order is fixed, because Electron requires some calls before `ready`:
  1. `app.setName('NecroAmp')` (R7.7; sets the user-data directory).
  2. Test-only user-data override (section 6).
  3. `app.requestSingleInstanceLock()`. If it returns false, `app.quit()` and return before any other work (D11).
  4. `protocol.registerSchemesAsPrivileged([...])` (must run before `ready`, DOCUMENTED).
  5. Register `process` crash handlers.
  6. Register `app.on('web-contents-created', ...)` navigation guards, `window-all-closed`, `activate`, `second-instance`, `before-quit`/`will-quit`.
  7. `await app.whenReady()`, then: install permission handlers on `session.defaultSession`, install the `app://` handler, install the dev CSP header hook (dev only), register IPC handlers, set the application menu, create the main window.
- **Preload** (`src/preload/index.ts`): imports only `@shared/ipc` constants. Builds one frozen object and calls `contextBridge.exposeInMainWorld('necroamp', api)`. Contains no logic beyond `ipcRenderer.invoke(IPC_CHANNELS.appGetInfo)`.
- **Renderer** (`src/renderer`): React 19 app built by Vite. It reaches the bridge only via `app/bridge/necroamp-client.ts`.

Alternatives considered and rejected:

| Question | Chosen | Rejected | Reason |
|---|---|---|---|
| Production renderer URL | `app://renderer/` (D4) | `file://`, local HTTP server | Stable origin for sender checks and CSP; no open port (`product.md`). |
| Serving files from the handler | `fs` read into `new Response(...)` | `net.fetch(pathToFileURL(...))` | R15.1 forbids `net` in `src`. An `fs` read also lets the handler enforce realpath confinement itself. |
| Where Electron objects enter | Injected parameters into small factories | Importing `electron` in every module | Required for unit tests without Electron (R12.4). Only `index.ts` and thin adapters import `electron`. |
| Where guards are installed | `app.on('web-contents-created')` | Only inside the window factory | Covers every web contents ever created, including ones not made by the factory. The factory remains the sole `BrowserWindow` creator (R3.1). |
| IPC style | `ipcMain.handle` / `ipcRenderer.invoke` | `send`/`on` | Request-response with a typed result; no event channels exist now. |

**Window chrome extensibility (D5).** `chrome-profile.ts` defines `type ChromeProfile = { kind: 'native' }` as a discriminated union, with only `native` implemented. `window-options.ts` is a pure function `(profile, platform) -> BrowserWindowConstructorOptions` subset that sets `frame: true`, `autoHideMenuBar: false`, `minWidth: 800`, `minHeight: 600` (R8.11), `width: 1100`, `height: 720`, `show: false`, `title: 'NecroAmp'`. A future `frameless` member adds `frame: false`, `titleBarStyle`/`titleBarOverlay` per platform with no change to security preferences, which are built by a separate function `buildWebPreferences()` that takes no profile argument. Window-control channels (`window:minimize`, etc.) are not created now. Draggable regions will be CSS (`-webkit-app-region`) in skin-owned layout; the foundation CSS reserves a `data-part="titlebar"` hook in `app-shell.tsx` only if frontend-engineer needs it, otherwise nothing.

## 3. Security boundaries

### 3.1 Window factory (R3.1 to R3.5)

`create-main-window.ts` exports `createMainWindow(deps)` where `deps` includes a `BrowserWindow` constructor, the trusted-origin set, the load target and the `preloadPath` constant. It is the only file with `new BrowserWindow` (S rule).

`buildWebPreferences()` returns the same literal object in every mode:

```
{ contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
  webviewTag: false, allowRunningInsecureContent: false, nodeIntegrationInWorker: false,
  nodeIntegrationInSubFrames: false, experimentalFeatures: false, spellcheck: false,
  preload: <absolute path built from __dirname + 'index.js' constant> }
```

`preload` path is `path.join(__dirname, '../preload/index.js')` (UNVERIFIED output layout of electron-vite; the E2E bridge assertion catches a mismatch). No input, env var or argument alters it. Tests assert the object by deep equality (U) and read `webContents.getLastWebPreferences()` on the live window (E).

Load target: if `resolveLoadTarget(env, isPackaged)` returns a dev URL, the window calls `loadURL(devUrl)`; otherwise `loadURL('app://renderer/index.html')`. `resolveLoadTarget` is pure:

- Dev requires `isPackaged === false` AND `ELECTRON_RENDERER_URL` set (electron-vite dev sets it, UNVERIFIED name for the pinned version) AND the value parses as `http:` with hostname exactly `localhost` or `127.0.0.1`, a port, no credentials, empty path or `/`. Anything else is ignored and production mode is used.
- The built-app E2E run (`electron out/main/index.js`) has the variable unset, so it exercises the production `app://` path even though `isPackaged` is false. The test harness explicitly deletes `ELECTRON_RENDERER_URL` from the child environment.

### 3.2 Trusted origins and sender validation (R4.4, R3.5)

`trusted-origins.ts`: `resolveTrustedOrigins(mode)` returns `['app://renderer']` in production, plus the dev server origin in dev only. It never reads the environment itself; `index.ts` passes the parsed dev origin. `isTrustedUrl(url, trusted)` parses with `new URL`, compares `url.origin` to the set by exact string equality, and returns false for `null`/`'null'` origins, parse errors and non-string input.

`sender-validation.ts`: `isTrustedSender(event, trusted, mainFrameOf)` returns true only if all hold: `event.senderFrame` is non-null, it is the top frame of the registered main window's web contents (`senderFrame === webContents.mainFrame`, UNVERIFIED property names, DOCUMENTED in Electron `WebFrameMain`), and `isTrustedUrl(senderFrame.url, trusted)`. Sub-frames, missing frames and destroyed frames are rejected. The function takes a plain structural type (`{ senderFrame: { url: string; parent: unknown } | null }`) so it is unit and property testable. Note that Electron may return a null `senderFrame` after the frame is destroyed (DOCUMENTED).

### 3.3 Navigation, new windows, webviews, permissions (R6)

`navigation-guards.ts` exports `installNavigationGuards(app, trusted)`. For each created `webContents`:

- `will-navigate`, `will-redirect` and `will-frame-navigate` (UNVERIFIED availability of the last name for the pinned Electron; DOCUMENTED since v25): `event.preventDefault()` unless `isTrustedUrl(url, trusted)`. In-app same-origin navigation is allowed because a single-page app does not navigate; the guard therefore also blocks any URL that is not exactly the app entry or dev entry. Decision: allow only same-origin URLs; reload of the entry URL works.
- `setWindowOpenHandler(() => ({ action: 'deny' }))`. No external opener exists in this phase (R6.2, R6.5).
- `will-attach-webview` calls `preventDefault()` (R6.3), in addition to `webviewTag: false`.

`permissions.ts` installs on `session.defaultSession`: `setPermissionRequestHandler((_, __, cb) => cb(false))`, `setPermissionCheckHandler(() => false)`, `setDevicePermissionHandler(() => false)` (UNVERIFIED name for the pinned Electron; skip only if the docs show it removed, and then record why). Deny-all is the whole policy (R6.4).

### 3.4 Content Security Policy (R5)

`csp.ts` exports `buildCsp(options: { mode: 'production' } | { mode: 'development'; devOrigin: string }): string` and `buildMetaCsp(options)` (the same policy minus directives that `<meta>` ignores: `frame-ancestors`, `report-uri`, `sandbox`).

Production policy (exact):

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'
```

- No `unsafe-eval`, no `unsafe-inline`, no `data:`, no `http:`/`https:`/`ws:`/`wss:` or `*` anywhere (R5.3). `media-src` and `worker-src` are opened to `'self'` by the Audio Engine phase through a design change, not now.
- `'self'` is expected to match `app://renderer` because the scheme is registered `standard` (DOCUMENTED Chromium behavior for standard schemes; UNVERIFIED for the pinned build, E2E R5.7 and the CSP-effective test catch a mismatch).
- Style: D3 is CSS Modules. Vite emits a linked stylesheet in production, so `style-src 'self'` suffices and no inline `<style>` or `style` attribute is used. React's `style` prop is banned by lint (`react/forbid-dom-props` for `style`) and by the source-scan test. Dynamic values are written to CSS custom properties with `element.style.setProperty(...)`. Script-driven CSSOM changes are not blocked by `style-src` (CSP3 DOCUMENTED); the E2E test sets one property and checks that no CSP violation is reported.
- Delivery (R5.1): the `app://` handler sets `Content-Security-Policy` on every response (not only HTML). A `<meta http-equiv>` copy is injected into `index.html` at build time by a small inline Vite plugin in `electron.vite.config.ts` (`apply: 'build'`, `transformIndexHtml`) that calls `buildMetaCsp({ mode: 'production' })`, so there is one source of truth. The source `index.html` contains no meta CSP, because it would block the dev server. A unit test builds the meta string and compares it to the header string minus the ignored directives.
- Development: the header is added by `session.webRequest.onHeadersReceived`, filtered to URLs whose origin equals the dev origin. The dev policy is the production policy plus `connect-src <devOrigin> ws://<dev host:port>` and `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`. The two `unsafe-inline` allowances exist only because Vite's React Fast Refresh preamble and CSS hot update inject inline script and style in dev (UNVERIFIED for the pinned plugin versions; if they are not needed, remove them). **This is a deviation from R5.5, which allowed only the two dev origins.** It is dev-only, produced by one option of the builder, covered by a test that the production output never contains it, and listed in section 13 for human acceptance. E2E never runs in dev mode.

### 3.5 Filesystem, network, secrets (R15)

- The renderer has no filesystem access. Main reads files only through the `app://` handler (section 4).
- Main makes no network request: no `net`, `fetch`, `autoUpdater`, `crashReporter` (S rule, R15.1).
- No secrets, tokens or personal data exist in this phase. Logs go through `logger.ts`, which accepts only a fixed event code plus an optional small object of allow-listed scalar fields (reason, exit code, platform). It never accepts a raw `Error` message, payload or path (R15.3).
- `shell.openExternal` is not called anywhere (R6.5).

### 3.6 Invariant ownership

| Invariant | Enforced in | Why there |
|---|---|---|
| Web preferences are hardened and identical in all modes | `buildWebPreferences()` plus single factory | One function, no parameters, so no caller can weaken it. |
| Only trusted senders reach handlers | `register-handler.ts` | Every handler goes through it; a handler cannot omit the check. |
| Payload shape and bounds | Zod schemas in `shared/ipc`, parsed in `register-handler.ts` (main) and `necroamp-client.ts` (renderer, for responses) | Receiver validates its own input; sharing the schema does not replace parsing. |
| No path escape from the app root | `resolve-app-path.ts` (lexical) plus `app-protocol.ts` (realpath) | Lexical rules are pure and property testable; symlink checks need the filesystem. |
| No remote origin ever runs | CSP builder plus navigation guards plus protocol scheme privileges | Defense in depth: three independent layers. |
| Production has no dev allowance | `buildCsp`, `resolveLoadTarget`, `resolveTrustedOrigins` | Each takes an explicit mode and is tested for the production output. |

## 4. Custom protocol design (`app://`)

Scheme registration (`app-protocol.ts`, `registerAppScheme()`, called at module top-level before `ready`):

```
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
])
```

Privileges explained (DOCUMENTED Electron `protocol` API; UNVERIFIED against the pinned version's page, to be cited in the implementation note):

| Privilege | Value | Reason |
|---|---|---|
| `standard` | true | Gives a real host and origin (`app://renderer`), enables relative URL resolution and the `'self'` CSP source. |
| `secure` | true | Treats the origin as a secure context (needed later for AudioWorklet and `crypto.subtle`). |
| `supportFetchAPI` | true | Needed for module script and asset loading by Chromium for this scheme. |
| `corsEnabled` | omitted | Same-origin only. **Pre-approved fallback:** if the E2E smoke run shows module scripts blocked because the scheme is not CORS-enabled, add `corsEnabled: true` (still same-origin only) and record it in ADR 0003. The implementer must not add any other privilege. |
| `bypassCSP` | omitted (never) | The CSP must apply. |
| `stream` | omitted | No media streaming in this phase; the Audio phase decides. |
| `allowServiceWorkers`, `codeCache` | omitted | Not needed. |

**Origin.** `app://renderer`. The host is a fixed constant. Because the scheme is `standard`, the host is lowercased by the URL parser. Any request whose host is not exactly `renderer` is rejected.

**Handler** (`protocol.handle('app', handler)`, installed after `ready`, DOCUMENTED since Electron 25; removed with `protocol.unhandle('app')` on quit):

1. Method must be `GET` or `HEAD`, otherwise respond `405` with `Allow: GET, HEAD`.
2. Call `resolveAppPath(request.url)` (pure). On rejection respond `404` for any rejection (do not leak which rule failed; the reason code is logged locally as an allow-listed code only).
3. Join with `RENDERER_ROOT = path.join(app.getAppPath(), 'out', 'renderer')` (UNVERIFIED; electron-vite default output, and asar behavior is a packaging-phase check).
4. `fs.promises.realpath(file)` and require `realpathRoot + path.sep` as a prefix of the result (platform path API, case-insensitive compare on `win32`). Resolve `realpathRoot` once at startup. A failure or escape yields `404`.
5. `fs.promises.stat`; require a regular file; require size at most 5 MiB (bound; rejection yields `404`).
6. Read the file and return `new Response(body, { status: 200, headers })` with `Content-Type` from `mime-types.ts`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Cross-Origin-Resource-Policy: same-origin`. `HEAD` returns the headers with a null body.

**`resolveAppPath(urlString)` pure rules** (R15.4), taking the platform path module as an injected parameter so tests run it against both `path.posix` and `path.win32`:

1. Reject strings longer than 2048 characters, non-strings, and strings that fail `new URL`.
2. Require `protocol === 'app:'`, `hostname === 'renderer'`, empty `username` and `password`, empty `port`.
3. Take the raw `pathname`. Reject if it contains, case-insensitively, `%2f`, `%5c`, `%00`, `%2e%2e`, or any percent-encoded form of `.` as the only content of a segment. Reject a backslash, a NUL, or a `:` anywhere (drive letters, alternate data streams).
4. Percent-decode once. If decoding throws, reject. Reject if the decoded value differs in a way that introduced `/`, `\`, NUL or `:` (double-decoding is not performed; a `%25` stays literal and fails the extension or existence check).
5. Split on `/`. Reject empty segments except one trailing slash, and reject segments `.` and `..`. Reject any segment starting with `.` (dotfiles) and longer than 255 characters.
6. Map `/` to `index.html`. Require the final segment's extension in the mime allow-list (`.html`, `.js`, `.css`, `.json`). A segment without extension is rejected (single-page app serves one entry; no client routing in this phase).
7. Return `{ ok: true, relativePath }`, with the segments joined by the injected path module, then verify with the injected module that `resolve(root, relativePath)` starts with `resolve(root) + sep`. The result is typed `{ ok: false, code: 'BAD_URL' | 'BAD_HOST' | 'FORBIDDEN_CHARS' | 'TRAVERSAL' | 'BAD_EXTENSION' | 'TOO_LONG' }`.

Property tests (qa-engineer, `*.property.test.ts`): for arbitrary strings, `resolveAppPath` never throws; for every `ok` result, the resolved path stays inside the root under both path modules; strings built from traversal fragments (`..`, `%2e%2e`, `%2f`, `\`, `C:`, `//`, NUL) are never `ok`. Unit tests: fixtures for each rule. The realpath step is tested with a fake `fs` for the escape case and, once, with a real temp directory and a symlink where the platform permits (skipped on Windows without privilege, reported as such).

Dev mode does not use the protocol for the renderer. The scheme is still registered so that behavior is identical.

## 5. Typed IPC contracts

One channel (R4.7). Names: `src/shared/ipc/channels.ts`:

```ts
export const IPC_CHANNELS = { appGetInfo: 'app:get-info' } as const;
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
```

Schemas (`src/shared/ipc/`), all `z.strictObject`, bounded:

- `platformSchema = z.enum(['win32', 'darwin', 'linux'])`; type `Platform`.
- `appInfoRequestSchema = z.tuple([])`. The handler receives the invoke arguments as an array; any extra argument fails parsing.
- `appInfoSchema = z.strictObject({ name: z.string().min(1).max(64), version: z.string().min(1).max(64), platform: platformSchema })`; type `AppInfo`.
- `ipcErrorCodeSchema = z.enum(['INVALID_SENDER', 'INVALID_PAYLOAD', 'INTERNAL'])`.
- `ipcErrorSchema = z.strictObject({ code: ipcErrorCodeSchema, message: z.string().max(120) })`. Messages come from a fixed map by code, never from an exception.
- `ipcResultSchema(dataSchema)` returns `z.discriminatedUnion('ok', [{ ok: true, data }, { ok: false, error }])`; `appInfoResponseSchema = ipcResultSchema(appInfoSchema)`.

`register-handler.ts` exports `registerHandler({ ipcMain, channel, requestSchema, responseSchema, handler, isTrustedSender })` and returns a disposer. It is the only caller of `ipcMain.handle`. Behavior, in order:

1. `isTrustedSender(event)`: false returns `{ ok: false, error: INVALID_SENDER }`. The payload is not read.
2. `requestSchema.safeParse(args)`: failure returns `INVALID_PAYLOAD`. No issue text, path or payload content is returned or logged.
3. `await handler(parsed)` inside `try/catch`: a throw returns `INTERNAL` and logs `ipc.handler_failed` with the channel constant only.
4. The result is always checked with `responseSchema.safeParse` before returning (cheap, and it prevents shape drift). A mismatch returns `INTERNAL` and logs.
5. The function never throws across IPC. Logging level: `warn` for invalid sender (channel name only), `warn` for invalid payload, `error` for internal.

`app-handlers.ts` handler for `app:get-info`: returns `{ name: app.getName(), version: app.getVersion(), platform }` where platform is parsed with `platformSchema` from `process.platform` (an unsupported platform value returns `INTERNAL`). Electron objects are injected.

Preload (`src/preload/index.ts`):

```ts
const api = Object.freeze({
  app: Object.freeze({ getInfo: (): Promise<unknown> => ipcRenderer.invoke(IPC_CHANNELS.appGetInfo) }),
});
contextBridge.exposeInMainWorld('necroamp', api);
```

It returns `unknown`; the renderer adapter parses. The exposed key set is `necroamp.app.getInfo` only (R4.6). Renderer adapter `necroamp-client.ts` exports `createNecroampClient(bridge)`, which calls `bridge.app.getInfo()`, parses with `appInfoResponseSchema`, and maps any rejection or parse failure to `{ ok: false, error: { code: 'INTERNAL', ... } }`. `window.necroamp` is read in exactly one function, `getBridge()`, which returns `undefined` if absent (R8.10: the UI shows "unavailable").

Validation rules summary:

| Input | Required | Type and limits | On failure |
|---|---|---|---|
| `app:get-info` arguments | yes (empty array) | `z.tuple([])` | `INVALID_PAYLOAD` result |
| IPC sender | yes | trusted top frame URL | `INVALID_SENDER` result |
| Response in renderer | yes | `appInfoResponseSchema` | client maps to `INTERNAL`, UI shows "unavailable" |
| `ELECTRON_RENDERER_URL` | optional | loopback http URL, see 3.1 | ignored, production mode |
| `NECROAMP_E2E_USER_DATA` | optional | absolute path, only when `!app.isPackaged`, max 260 chars, must exist and be a directory | ignored with a warn log |

Unregistered channels (R4.8): the renderer has no generic invoke, so it cannot call one. Verified by U (registration helper registers only `IPC_CHANNELS` values; an `ipcMain` fake records calls) and by E (the bridge key set). A direct E2E call of an unknown channel is not possible without adding a generic bridge, which R4.6 forbids. This partial coverage is item N3 in section 13.

Per `shared-ownership-policy.md` 3.1, desktop-engineer writes the contract; necro-architect reviews it; security-reviewer reviews because it concerns sender validation. Because it changes the IPC security model, an ADR (0005) records it (`shared-ownership-policy.md` 3.2).

## 6. Application lifecycle

Pure policy (`platform-policy.ts`, R7.3, R16.1):

```ts
export type SupportedPlatform = 'win32' | 'darwin' | 'linux';
export const shouldQuitOnAllWindowsClosed = (p: string): boolean => p !== 'darwin';
export const shouldCreateWindowOnActivate = (p: string, openWindows: number): boolean => p === 'darwin' && openWindows === 0;
```

Any unknown platform string quits (R7.3 property). Behavior per OS:

| Event | Windows | Linux | macOS |
|---|---|---|---|
| Launch | one window, shown on `ready-to-show` | same | same |
| Last window closed | `app.quit()` | `app.quit()` | app stays running; menu bar remains |
| `activate` (dock click) | n/a | n/a | creates the window if none exists |
| Second instance launched | second process exits; first window restored and focused | same | same (lock works on macOS; Finder normally prevents a second launch) |
| Menu | minimal menu bar visible (D6) | same | full role-based menu in the system bar |
| `Ctrl/Cmd+Q`, OS quit | `before-quit` -> dispose handlers -> exit | same | same |

Window creation: `show: false`, then `once('ready-to-show', () => win.show())` (R7.1). Title `NecroAmp`. The renderer's `<title>` is also `NecroAmp`, so `page-title-updated` cannot change it unexpectedly.

Single instance (D11, R7.2): `single-instance.ts` exports `acquireSingleInstance(app, onSecond)`. `requestSingleInstanceLock()` false means `app.quit()` before `ready` (the second process exits quickly). The first process handles `second-instance` by restoring (`isMinimized()` then `restore()`), `show()` and `focus()` on the main window if it exists, otherwise by creating it. The handler ignores argv and working directory, so no command-line input is trusted (and none is parsed). The lock is keyed by the user-data directory in Electron (DOCUMENTED), so E2E tests with distinct user-data directories do not collide, and the second-instance test launches two processes with the same directory.

**Test user-data isolation (R13.5).** Playwright passes `NECROAMP_E2E_USER_DATA=<temp dir>` in the child environment. `index.ts` calls `app.setPath('userData', value)` before the lock, only when `!app.isPackaged` and the validation in section 5 passes. Rationale: it does not weaken any web preference, does not use a Chromium flag, and is inert in packaged builds. An alternative, the Chromium `--user-data-dir` argument, is rejected because its effect on `app.getPath('userData')` and the lock is UNVERIFIED. Playwright suites that launch Electron run with `workers: 1`.

Crash handling (R7.4, R7.5; `crash-handlers.ts`, Electron injected):

- `webContents.on('render-process-gone', (_, details))`: log `{ reason: details.reason, exitCode: details.exitCode }`. First occurrence per window: `reload()` once. Second: `destroy` the window (`close()`), which leads to quit via the platform policy on win32 and linux. On macOS the app stays alive with the menu and `activate` recreates a window; this is not an invisible running app because the dock icon and menu bar are present. Decision: on macOS also quit when the renderer crashed twice, to keep behavior simple and avoid a zombie. (`app.quit()` after the second crash on all platforms.)
- `process.on('uncaughtException')`: log the error `name` only in production (stack and message in dev), then `app.exit(1)`. Node documents that continuing after an uncaught exception is unsafe.
- `process.on('unhandledRejection')`: log the reason's `name` only, no exit.
- `crashReporter` is never started (S rule).
- Quit (R7.6): on `will-quit` the disposers returned by `registerHandler`, `protocol.unhandle('app')`, and the navigation/permission handlers are released. There is no async work, so exit completes well within 5 seconds.

Menu (D6, R16.6): `app-menu.ts` exports `buildMenuTemplate({ platform, isDevRun })`, a pure function returning plain descriptors (`role`, `label`, `submenu`) typed locally, converted by a thin adapter with `Menu.buildFromTemplate`. macOS: `appMenu`, `fileMenu`, `editMenu`, `windowMenu` roles. Windows and Linux: File (`quit`), Edit (`undo`, `redo`, separator, `cut`, `copy`, `paste`, `selectAll`), Window (`minimize`, `close`). View (`reload`, `toggleDevTools`) appears only when `isDevRun`. Roles supply localized labels, so no menu string enters the strings file. Unit tests cover all three platforms and the dev-only View.

## 7. Renderer component architecture

Layers per feature, enforced by lint and review:

1. **Headless behavior** `use-<name>.ts`: React hooks returning plain props and handlers (for example `usePlayerControls()` returns a list of `{ id, labelKey, onActivate, disabled }`). No JSX, no CSS.
2. **Container** `<name>-region.tsx`: calls the hook, reads stores through selectors, renders the view. It is the only layer aware of stores.
3. **View** `<name>-view.tsx`: stateless, props in, JSX out, emits `data-part` attributes for stable styling and skin targeting. Imports its own `*.module.css` and shared components.
4. **Shared components** `components/`: `ControlButton`, `RegionFrame` (labelled `section` with heading), `StatusText` (`role="status"`). Props only, no store, no bridge.

State: `stores/app-info-store.ts` exports `createAppInfoStore(client)` returning a Zustand store with state `{ status: 'idle' | 'loading' | 'loaded' | 'failed', data?: AppInfo }` and action `load()`. A hook `useAppInfo` in `app/` binds the real client. Tests pass a fake client (R10.1, R12.4). Stores import only `@shared/*` and types. No audio state exists (R10.3).

Shell and layout: `app/shell-layout.ts` exports `REGION_IDS` (`player`, `playlist`, `equalizer`, `visualization`, `skin-selector`, `github`) and `FOUNDATION_LAYOUT`, a typed constant describing region order and the grid area names. `app-shell.tsx` maps the layout to region containers using a `Record<RegionId, ComponentType>` and gives each region its `data-testid` equal to the id (R8.3). Region ids are the stable contract that a future Skin Engine layout will reference. The registry is a plain constant now; no registry or plug-in mechanism is built (YAGNI).

Landmarks and accessibility: header with the single `h1` "NecroAmp" and the tagline; `main` containing six `section` elements, each labelled by its own `h2` through `aria-labelledby`. Placeholder buttons use `aria-disabled="true"` and `aria-describedby` pointing to a visible "Not implemented in this phase" text, are focusable (not `disabled` attribute, so they stay in the tab order), and activation only updates a `StatusText` message. Tab order equals DOM order, which equals reading order. The equalizer shows ten `<div role="group">` bands labelled "Band 1" to "Band 10" containing a non-interactive `<meter>`-free placeholder (a `span` with text), so they are not form controls and need no value semantics. No animation, no `requestAnimationFrame`, no `AudioContext` anywhere (R8.4, R8.7, R9.7).

User-facing strings (D14): all text lives in `app/strings/en.ts` as a typed `as const` object keyed by id (`STRINGS.player.play`). Components receive text through props or import the constant. No i18n library. Keys are stable ids, so a later framework can replace the file with a lookup without touching components. Tests assert the exact tagline `Code. Listen. Repeat.` against the constant and the DOM.

`index.html`: `lang="en"`, `<title>NecroAmp</title>`, `<div id="root">`, `<script type="module" src="./main.tsx">`. No meta CSP in source (3.4).

Layout checks at 800x600 and 1920x1080 (R8.11): CSS grid with named areas, `min-width: 0`, no fixed widths above 800 minus padding, `overflow-wrap: anywhere` on text. E2E compares bounding boxes for overlap and `scrollWidth <= clientWidth`.

## 8. Styling and future Skin Engine compatibility

Foundation (D3, R8.13): CSS Modules for component rules, global CSS only for tokens and reset. Tokens in `app/styles/tokens.css` under `:root` as custom properties: color roles (`--na-color-surface`, `--na-color-text`, `--na-color-focus`, ...), spacing scale, type sizes, radii, a focus ring token. Components reference only tokens, never literal colors. The foundation palette is a neutral dark gray and off-white pair chosen to satisfy contrast (R9.3, R9.4) with no resemblance to either bundled skin. Contrast ratios (WCAG relative luminance) are computed by `theme/contrast.ts` and tested on the token pairs read from the CSS file by a test.

Why this does not block the artistic direction. Skins are complete visual experiences, not color themes (Morgul Revenant: obsidian black, weathered stone and metal textures, spectral green glow, mist, angular gothic architecture, ornate frames, custom controls, diamond equalizer sliders, gothic type, localized glow; Analog 1984: brushed aluminium, knobs and switches, VU meters, mechanical controls, warm light, realistic textures; substantially different compositions). The foundation keeps the following seams open and builds none of them:

| Skin need | Foundation seam | Not built now |
|---|---|---|
| Backgrounds, textures, decorative frames | Region views render inside `RegionFrame` with `data-part` hooks; no component hardcodes a surface; tokens for surfaces | Image assets, 9-slice frames |
| Custom graphical controls (diamond sliders, knobs, switches) | Behavior hooks return plain props, views are replaceable; control semantics stay in the hook (value, min, max, onChange) | Alternative control views, skin-supplied renderers |
| Skin typography | Font family and size are tokens | Font loading, `@font-face` from skins |
| Component geometry and skin-dependent layouts | Region ids and `FOUNDATION_LAYOUT` descriptor separate "what regions exist" from "where they go"; grid areas are named from the descriptor | Declarative layout schema, absolute-region model |
| Custom window chrome, draggable regions | `ChromeProfile` union in main; shell exposes an optional titlebar hook; no window-control channels yet | Frameless windows, window-control IPC |
| Visual effects, animations | Presentation is CSS only, so effects can be added per skin; foundation has none (R9.7) | Effects, reduced-motion handling (becomes mandatory with the first animation) |
| Declarative assets, no executable skin code | CSP forbids inline script and remote origins; styling is data (CSS variables) | Skin manifest, loader, skin protocol and CSP additions (`img-src`, `font-src` for the skin root) |

Constraints future designs must respect, recorded here as design constraints: a skin supplies data only; every skin asset is served through a confined protocol root with its own license record in `docs/assets.md`; no third-party copyrighted art; provenance recorded; a human-approved Morgul concept image goes to art-director in the Skin Engine phase. The six Morgul palette values (#080D0A, #18251E, #354C3D, #6A9250, #B6E88A, #DEE8D4) are a reference only and are not used in foundation CSS. The foundation's CSP will need `img-src`/`font-src` additions for skin assets, which is a future design change, not a loosened policy now.

## 9. Dependency inventory and version selection

**Verification status.** Versions below were resolved in this run from the public npm registry (`https://registry.npmjs.org/<pkg>/<version>` JSON: `version`, `license`, `engines`, `peerDependencies`, `dependencies`, `scripts`) and from official sources named in the evidence table. Nothing was installed. Versions are pinned exactly in `package.json` (no `^`, no `~`) and the lockfile is committed. The registry moves, so the implementation task re-runs the same lookups and stops on any difference before it installs (R1.3). Registry publish dates in the metadata fall in 2026; they were not used to judge stability beyond the dist-tags noted below.

### 9.1 Selected matrix (implementation candidates)

The versions are candidates, resolved from registry metadata. Compatibility is accepted only by the executed validation tasks V1 to V11 in section 15.

| Package | Exact version | License | Selection rationale |
|---|---|---|---|
| Node.js (tooling) | 24 LTS, `engines.node` `>=24.15.0 <25` | n/a | Steering fixes Node 24. The floor 24.15.0 comes from `jsdom@31.0.1` (`^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`). Vitest 5.1.2 accepts `^24.0.0`; Electron 45.5.0 needs `>= 22.12.0`. |
| pnpm | 10.34.9 (`packageManager: pnpm@10.34.9`) | MIT | Registry dist-tag `latest-10`. No install scripts. Steering fixes pnpm 10; dist-tag `latest` is 12.23.0 and is rejected. |
| electron | 45.5.0 | MIT | Dist-tag `latest` and `45-x-y`. Its `DEPS` file at tag `v45.5.0` sets `node_version` to v24.22.3, so the app runs the same Node major as the tooling. No `scripts` in its metadata (see 9.3). |
| electron-vite | 6.0.0 | MIT | Peer `vite ^6 \|\| ^7 \|\| ^8`; `@swc/core` peer is optional. Depends on `rolldown ~1.2.10`. Engines `^20.19.0 \|\| >=22.12.0`. |
| vite | 7.3.8 | MIT | Newest 7.x. Accepted by electron-vite 6.0.0 and by vitest 5.1.2 (`^6.4.0 \|\| ^7 \|\| ^8`). Chosen over 8.3.8 for a license reason, see 9.2. |
| @vitejs/plugin-react | 5.2.0 | MIT | Newest 5.x. Peer `vite` includes `^7`. The 6.x line peers `vite ^8` only. |
| react, react-dom | 19.3.1 | MIT | Latest. `react-dom` peers `react ^19.3.1`, so both are the same exact version. |
| @types/react | 19.3.3 | MIT | Latest 19.x. |
| @types/react-dom | 19.3.0 | MIT | Latest. Peers `@types/react ^19.3.0`. |
| zustand | 5.1.0 | MIT | Latest. Peers `react >=18`; `immer`, `@types/react`, `use-sync-external-store` are optional peers and are not installed. |
| zod | 4.6.7 | MIT | Latest. Runtime dependency of `src/shared` (policy 3.2). |
| typescript | 6.0.3 | Apache-2.0 | Newest 6.0.x. `typescript-eslint@8.74.0` requires `typescript >=4.8.4 <6.1.0`, so 7.0.2 (`latest`) is held back. |
| @types/node | 24.19.4 | MIT | Newest 24.x, matching the Node 24 line. Electron 45.5.0 itself depends on `@types/node ^24.9.0`. Vitest and Vite accept it. |
| eslint | 9.39.5 | MIT | Dist-tag `maintenance`. `latest` is 10.15.0, but `eslint-plugin-react@7.37.5` peers `eslint ^9.7` at most and `eslint-plugin-jsx-a11y@6.10.2` peers `^9` at most. |
| @eslint/js | 9.39.5 | MIT | Must match ESLint (`10.0.1` peers `eslint ^10`). |
| typescript-eslint | 8.74.0 | MIT | Peers `eslint ^8.57 \|\| ^9 \|\| ^10`, `typescript >=4.8.4 <6.1.0`. |
| eslint-plugin-react | 7.37.5 | MIT | Peers `eslint ... ^9.7`. |
| eslint-plugin-react-hooks | 7.1.1 | MIT | Peers include `eslint ^9.0.0`. |
| eslint-plugin-jsx-a11y | 6.10.2 | MIT | Peers `eslint ... ^9`. |
| globals | 17.14.0 | MIT | Latest. |
| prettier | 3.10.1 | MIT | Latest. |
| eslint-config-prettier | 10.1.8 | MIT | Peers `eslint >=7`. |
| vitest | 5.1.2 | MIT | Engines `^22.12.0 \|\| ^24.0.0 \|\| >=26`. Peers `vite ^6.4 \|\| ^7 \|\| ^8`. Optional peers `jsdom`, `@vitest/coverage-v8` must be exactly 5.1.2. |
| @vitest/coverage-v8 | 5.1.2 | MIT | Peers `vitest 5.1.2` exactly. |
| fast-check | 4.11.0 | MIT | Latest. No peers, no scripts. |
| jsdom | 31.0.1 | MIT | Engines require Node `^24.15.0` on the 24 line (hence the Node floor). Optional peer `@napi-rs/canvas` is not installed. |
| @testing-library/react | 16.3.3 | MIT | Peers `react ^18 \|\| ^19`, `@testing-library/dom ^10`. |
| @testing-library/dom | 10.4.2 | MIT | Satisfies `^10`. |
| @testing-library/user-event | 14.6.13 | MIT | Peers `@testing-library/dom >=7.21.4`. |
| @testing-library/jest-dom | 8.0.0 | MIT | Peers `vitest >=5 <6`, `@testing-library/dom >=10 <11`. Satisfied. |
| @playwright/test | 1.65.1 | Apache-2.0 | Latest. Depends on `playwright`, which depends on `playwright-core@1.65.1` (engines `node >=20`). No install scripts. |
| @axe-core/playwright | 4.14.1 | **MPL-2.0** | Peers `playwright-core >=1.0.0`; engines `node >=22.12.0`. Depends on `axe-core` (MPL-2.0). **Approved exception E1 (N4):** development and accessibility testing only, `devDependencies`, never in production bundles or installers. |

### 9.2 Key selection decisions

**Vite 7.3.8 instead of 8.3.8.** Vite 8.3.8 lists `lightningcss@1.33.0` (MPL-2.0) in its regular `dependencies`. R1.7 permits only permissive licenses, so Vite 8 would add a second MPL-2.0 package that is not optional. Vite 7.3.8 has `esbuild` (MIT, `postinstall: node install.js`) instead, and `lightningcss` only as an optional peer that is not installed. Both Vite lines satisfy every peer range above. The cost is one extra build-script approval (esbuild, 9.3). Rejected alternative: Vite 8 with a recorded MPL-2.0 approval. Revisit when the human accepts MPL-2.0 for dev tooling.

**ESLint 9.39.5 and TypeScript 6.0.3.** Both are held back one major because the lint plugin peers (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`) and `typescript-eslint` (`typescript <6.1.0`) do not cover the newest majors. Overriding peers in pnpm was rejected because it hides real incompatibilities in a security-relevant tool. A later upgrade is a separate change.

**Electron 45.5.0.** It is the newest stable line (`latest` equals `45-x-y`). Its bundled Node v24.22.3 matches the Node 24 tooling major.

**pnpm 10.34.9 rather than the registry `latest` (12.23.0).** Steering fixes pnpm 10.

### 9.3 Dependency lifecycle policy (D9, amended)

**Source.** `https://pnpm.io/10.x/settings` (the pnpm 10.x documentation line, fetched during this amendment). It is not a per-patch page, so behavior for exactly `pnpm@10.34.9` is confirmed by tasks V1 and V2 (section 15) on the first install.

Settings relevant to dependency scripts, as documented for pnpm 10.x:

| Setting | Documented behavior | Decision |
|---|---|---|
| `onlyBuiltDependencies` | List of packages allowed to run `preinstall`, `install` and `postinstall`. Default with no list: all dependency scripts are blocked. Entries may be version-qualified (`esbuild@0.28.0`, `a@1 \|\| 2`) since v10.19.0. | **Use.** Version-qualified entry for each approved package. |
| `ignoredBuiltDependencies` | Added in v10.1.0. Packages whose scripts never run and that raise no warning. | **Use** for `fsevents`. |
| `strictDepBuilds` | Added in v10.3.0. **Default `false`.** When `true`, install exits non-zero if any dependency has an unreviewed build script. | **Set `true`.** This corrects the earlier text of this design, which assumed a true default. |
| `allowBuilds` | Added in v10.26.0. A map that replaces and deprecates `onlyBuiltDependencies` and `ignoredBuiltDependencies`. | Not used first. **Fallback:** if pnpm 10.34.9 ignores, rejects or warns about the two preferred settings, move the same content to `allowBuilds` (one-file change, same allow and deny set). |
| `neverBuiltDependencies` | Deny list. Without `onlyBuiltDependencies` it implies all other packages are allowed. | Not used. |
| `dangerouslyAllowAllBuilds` | Runs every dependency script. | **Never set.** |
| `ignoreScripts`, `ignoreDepScripts` | Global switches. | Not set. `ignoreScripts` would also stop project scripts. |

Target content of `pnpm-workspace.yaml` (written by the orchestrator in M0; the version in the esbuild entry is replaced by the exact version found in the lockfile, and the entry is added only after task V2 confirms esbuild's script is the expected one):

```yaml
onlyBuiltDependencies:
  - esbuild@<exact resolved version>
ignoredBuiltDependencies:
  - fsevents
strictDepBuilds: true
```

If pnpm 10.34.9 rejects a workspace file without a `packages:` list, the same three keys go under `"pnpm"` in `package.json` (desktop-engineer writes that file). Whether `ignoredBuiltDependencies` counts as "reviewed" under `strictDepBuilds` is checked by V2.

Registry metadata for the selected set (from 9.1) shows these install-time scripts:

| Package | Script | Decision |
|---|---|---|
| esbuild (dependency of vite 7.3.8; range `^0.27.0 \|\| ^0.28.0`; 0.28.0 shows `postinstall: node install.js`, MIT) | `postinstall` | **Approved in principle**, subject to the exact resolved version and verification of the script body (V2). |
| fsevents 2.3.3 (optional dependency of vite 7.3.8, macOS only, MIT) | `install: node-gyp rebuild` | **Denied** (`ignoredBuiltDependencies`). No compiler toolchain is needed on macOS CI. macOS file watching is NOT VERIFIED. |
| electron 45.5.0 | none in registry metadata | **Official binary download approved in principle.** Mechanism below. No lifecycle script is allowed for `electron` unless V3 shows the package does have one. |
| every other package | none in the inspected set | **Denied** unless explicitly approved by the human (section 14). |

**Electron on-demand binary installation (documented mechanism).** The `electron` npm package at 45.5.0 declares no install script. Per the official installation page, the platform binary is downloaded the first time Electron runs in development mode, and can be fetched earlier on demand with `install-electron` (documented there as `npx install-electron --no`; in this repository the equivalent is `pnpm exec install-electron --no`, exact flag semantics UNVERIFIED and confirmed in V3). Facts for the operator:

- The download comes from the official Electron GitHub release assets through `@electron/get`, which checks the file against the release checksums. This is a development-time tool download. It is not a runtime network call of the application and it does not conflict with the no-telemetry rule.
- The binary is cached outside the repository (Windows: under `%LOCALAPPDATA%\electron\Cache`, DOCUMENTED, UNVERIFIED). Nothing is written into `src`.
- Network is required once per version on each host and in CI (CI may cache the directory in a later phase).
- No mirror, proxy or `ELECTRON_*` override environment variable is set by the project.
- Fallback if V3 finds an `install`/`postinstall` script on the `electron` package: add `electron@45.5.0` (version-qualified) to `onlyBuiltDependencies` after the human confirms the script body is the official downloader. This is the only case in which `electron` is added.

Transitive packages not inspected here (for example `@babel/*`, `postcss`, `@electron-internal/extract-zip`, `undici`) are checked after resolution: the orchestrator lists lockfile entries with `requiresBuild: true` (V2). Every entry that is not in the table above stops the install for human approval.

No unrestricted lifecycle scripts are enabled. No step in this design or in `tasks.md` bypasses the Windows PowerShell execution policy or any other security control (section 16).

### 9.4 Compatibility evidence

| Pair or claim | Evidence | Status |
|---|---|---|
| Node 24 with the toolchain | Registry `engines`: vitest 5.1.2 `^24.0.0`, jsdom 31.0.1 `^24.15.0`, vite 7.3.8 and electron-vite 6.0.0 `^20.19.0 \|\| >=22.12.0`, eslint 9.39.5 `>=21.1.0`, @axe-core/playwright `>=22.12.0`, @playwright/test `>=20` | VERIFIED (metadata). Host Node is not installed on this machine (`node` and `pnpm` not on PATH), so nothing ran. |
| electron-vite 6.0.0 with vite 7.3.8 | electron-vite `peerDependencies.vite` `^6 \|\| ^7 \|\| ^8` | VERIFIED (metadata). Behavior UNVERIFIED until first build. |
| electron-vite 6.0.0 with Electron 45.5.0 | electron-vite declares no `electron` peer | UNVERIFIED. First `pnpm build` and `pnpm dev` are the proof. |
| plugin-react 5.2.0 with vite 7.3.8 | plugin `peerDependencies.vite` includes `^7` | VERIFIED (metadata). |
| vitest 5.1.2 with vite 7.3.8, coverage-v8 5.1.2, jsdom 31.0.1 | vitest peers `vite ^7`, `@vitest/coverage-v8 5.1.2`, `jsdom *`; coverage-v8 peers `vitest 5.1.2` | VERIFIED (metadata). |
| typescript-eslint 8.74.0 with TypeScript 6.0.3 and ESLint 9.39.5 | peers `typescript >=4.8.4 <6.1.0`, `eslint ^9` | VERIFIED (metadata). |
| React plugins with ESLint 9.39.5 | peers of react 7.37.5, react-hooks 7.1.1, jsx-a11y 6.10.2 | VERIFIED (metadata). Whether `eslint-plugin-react-hooks` 7.1.1 exposes a flat-config preset is UNVERIFIED. |
| Testing Library with React 19.3.1 | `@testing-library/react@16.3.3` peers `react ^19`, dom `^10` | VERIFIED (metadata). |
| Playwright 1.65.1 launching Electron 45.5.0 | No official support statement was found in this run (the docs path I tried returned 404). The Electron API is documented by Playwright as experimental. | UNVERIFIED. A smoke test is the proof (R-c). |
| Electron bundled Node | `electron/electron` `DEPS` at `v45.5.0`: `node_version` v24.22.3 | VERIFIED. |

Every row marked VERIFIED (metadata) is a statement about declared ranges only. No row proves runtime compatibility. The executable proofs are V1 to V11 in section 15, all PENDING.

Sources: `https://pnpm.io/10.x/settings` (pnpm 10 build settings, used in 9.3); `https://registry.npmjs.org/<package>/<version>` for each row; `https://raw.githubusercontent.com/electron/electron/v45.5.0/DEPS`; `https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/installation.md` (binary download step); `https://raw.githubusercontent.com/pnpm/pnpm.io/main/docs/settings/build.md` (pnpm 12 build settings, not authoritative for pnpm 10).

### 9.5 Licenses

All selected packages are MIT or Apache-2.0 except `@axe-core/playwright` and `axe-core` (MPL-2.0). These two are covered by the narrow, approved exception E1 (N4) recorded in the decision record addendum: development and accessibility testing only, excluded from production bundles and installers, license notices preserved, NecroAmp stays MIT, and no other MPL-2.0 dependency is covered. `requirements.md` is unchanged. Resolved transitive licenses are checked by V11 (section 15). Known transitive permissive-license exceptions are not audited here: the orchestrator runs a license listing after install and any non-permissive hit is reported to the human. Vite 7.3.8 avoids `lightningcss` (MPL-2.0).

Deliberately not added: `vitest-axe`/`jest-axe` (duplicate axe-core in jsdom, which has no layout or computed color, so the key rules cannot run; the Playwright scan covers R9.6), an import-boundary ESLint plugin (core `no-restricted-imports` suffices), `eslint-plugin-boundaries`, CSS tooling beyond Vite (CSS Modules are built in), `electron-builder` and `electron-updater` (D7, D10), `@electron-toolkit/*` helpers, `dotenv`, any logger or HTTP library, any i18n library (D14), and Shiki, Octokit, music-metadata (out of phase).

Package scripts (desktop-engineer authors; security-reviewer reads each body, R11.8). No `pre*`/`post*` entries, no `prepare`, no publish script, no `node -e`:

| Script | Body |
|---|---|
| `dev` | `electron-vite dev` |
| `build` | `electron-vite build` |
| `typecheck` | `tsc -b` (solution `tsconfig.json` referencing `tsconfig.shared.json`, `.main.json`, `.preload.json`, `.renderer.json`, `.tests.json`; each `strict: true`, `composite`, `emitDeclarationOnly`, output under `node_modules/.cache/tsc`) |
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `test` | `vitest run` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` (global setup fails with a clear message if `out/main/index.js` is missing or older than the newest file under `src`; run `pnpm build` first) |

`test`, `test:coverage` and `test:e2e` are single-run and exit (R11.4). `format`, `format:check` and `test:coverage` are additions beyond the names in `tech.md`, justified by R14.2 and R12.6. No `package` script (D10). CI order (later phase): `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e` (Linux under a virtual display). Windows `tsc -b` shell compatibility holds because every script is a single command.

`package.json` also declares `engines.node` as `>=24.15.0 <25`, `packageManager` as `pnpm@<exact>`, and `"private": true`. `.nvmrc` holds `24`. `.npmrc*` sets `engine-strict=true`. pnpm build-script approval lives in `pnpm-workspace.yaml*` (no `packages:` list, so it is not a monorepo; whether pnpm accepts a settings-only workspace file is UNVERIFIED, and the fallback is `pnpm.onlyBuiltDependencies` in `package.json`, which desktop-engineer can write). `minimumReleaseAge` is not set, because it would block freshly published pins; `blockExoticSubdeps` stays at its default (policy 4.4). `strictDepBuilds` is set to `true` explicitly, because its pnpm 10 default is `false` (9.3). `.npmrc` contains only `engine-strict=true`: agents cannot read `.npmrc` (deny rule `**/.npmrc` in every agent), so lifecycle policy lives in `pnpm-workspace.yaml`, which security-reviewer can read.

## 10. Testing and accessibility strategy

Levels (testing pyramid, `testing-strategy` skill):

| Level | Tool | Scope |
|---|---|---|
| Unit, node environment | Vitest | `src/main/**`, `src/shared/**`, `src/preload/**`, `tests/static`, `tests/lint-rules`, config alias test. Electron objects are fakes. |
| Unit and component, jsdom | Vitest, jsdom, Testing Library | `src/renderer/**`. Store with fake client; shell renders six regions, tagline, h1 (R12.5); placeholder button behavior. |
| Property | fast-check, files `*.property.test.ts`, at least 100 runs | origin check, CSP builder, IPC payload parser and `registerHandler`, platform policy, `resolveAppPath`, contrast function, `resolveLoadTarget`, menu builder (no unknown roles). |
| E2E | Playwright `_electron` against the built app | security, lifecycle, layout, a11y. |

Vitest config (`vitest.config.ts`, qa-engineer): `test.projects` with `node` (include `src/main|shared|preload/**` and `tests/**` except e2e) and `renderer` (`environment: 'jsdom'`, include `src/renderer/**`, setup file registering jest-dom matchers and `afterEach(cleanup)`). Both share the alias table. Test files `*.test.ts(x)` and `*.property.test.ts`. `test.globals` false (explicit imports). `fast-check` global config sets `numRuns >= 100` in property files and reports the seed (default behavior; the config also sets `verbose: 1`).

Determinism and offline (R12.3): no clock use (injected), no network, temp dirs only, a Vitest setup file stubs `fetch` and `net` access to throw so an accidental call fails the test.

Coverage (D12): provider `v8`, `include: ['src/**/*.{ts,tsx}']`, `exclude: ['src/main/index.ts', 'src/renderer/main.tsx', '**/*.d.ts', '**/*.test.*', '**/*.module.css']`, global thresholds `statements 80, lines 80, functions 80, branches 75`. Per-glob thresholds of `lines 95, branches 95` for the security-critical IPC validation modules: `src/shared/ipc/**`, `src/main/ipc/register-handler.ts`, `src/main/security/sender-validation.ts`, `src/main/security/trusted-origins.ts`. I add `src/main/protocol/resolve-app-path.ts` and `src/main/security/csp.ts` to the 95 percent group because they guard the same boundary; the human may remove them (N5). `pnpm test:coverage` is the gate command; `pnpm test` stays fast and coverage-free.

Playwright (`playwright.config.ts`, qa-engineer): `testDir: tests/e2e`, `workers: 1`, `fullyParallel: false`, `retries: 0` (flaky tests are quarantined, not retried), `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, output dirs `test-results` and `playwright-report` (ignored via `.gitignore`, R13.6). A fixture launches `_electron.launch({ args: [<out/main/index.js>], env: { ...safeEnv, NECROAMP_E2E_USER_DATA: tempDir } })` with `ELECTRON_RENDERER_URL` removed, waits on observable state (`firstWindow()`, `waitForSelector`), and closes the app in teardown even on failure. No fixed sleeps.

E2E coverage map (R13.2 to R13.4): smoke (one window, title, tagline, six regions, platform equals host); web preferences read through `electronApp.evaluate` from the live window; `typeof require/process/Buffer/ipcRenderer` all `undefined`; bridge key set equals `['app']` and `app` keys equal `['getInfo']`; effective CSP via the response header (`page.on('response')`) and via the meta element; injected inline script and remote `fetch` blocked (listen for CSP violation events and failed requests); recorded requests during launch all have the `app://renderer` origin; navigation attempts to `https:`, `http:`, `file:`, `data:` and `javascript:` URLs stay on the app URL (`page.evaluate` sets `location.href`, then the URL is re-read); `window.open` returns null and no second window appears; permission request resolves denied; second-instance launch exits and focuses the first window; host-platform last-window-close behavior; quit within 5 seconds; layout bounding boxes at two sizes; keyboard Tab order across all controls; axe scan with zero serious or critical violations. Focus indicator check: contrast is covered by the unit-level token test and E2E asserts a non-`none` focus outline on a focused element.

Accessibility strategy (D8, R9): static `eslint-plugin-jsx-a11y` at lint time; jsdom tests for names, roles, `h1` count and `lang`; token contrast property tests; Playwright axe scan on the real renderer (jsdom cannot evaluate layout or color contrast). `@axe-core/playwright` working against an Electron `Page` (no `newContext`) is UNVERIFIED; the fallback, decided now, is to inject the `axe-core` script through `page.evaluate` and call `axe.run`, which uses the same MPL-2.0 package.

Platform matrix and reporting (R16.3): the host is Windows. macOS and Linux install, build, test and E2E are NOT VERIFIED in this phase unless run on those hosts; the final report states PASSED, FAILED or NOT VERIFIED per platform and per kind. Platform branches are pure and unit tested for all three values. Linux notes for the README: virtual display for E2E, and the user-namespace or `chrome-sandbox` prerequisites for `sandbox: true` (UNVERIFIED specifics per distribution); `--no-sandbox` is never recommended.

## 11. Implementation ownership and run sequencing

Writer per work item (from `preflight.md` section B; "Orch" is the authorized top-level orchestrator under D13, with human approval gates; agent permissions are not widened):

| Work item | Writer |
|---|---|
| Node/pnpm verification (R1.1), registry verification commands (section 14) | Human (shell) or Orch |
| `eslint.config.mjs`, `prettier.config.mjs`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions, README command and platform section | Orch (D13; `.editorconfig`, `.gitattributes`, `README.md` are cross-cutting files outside the D13 list wording and need human confirmation, N6) |
| `pnpm install`, `pnpm-lock.yaml` | Orch, only after the human approval gate (section 14) |
| `package.json`, `.nvmrc`, `tsconfig*.json`, `electron.vite.config.ts` | desktop-engineer |
| `src/main/**`, `src/preload/**`, `src/shared/ipc/**` and co-located `*.test.ts` | desktop-engineer |
| `src/renderer/**` (`index.html`, `main.tsx`, `env.d.ts`, `app`, `features`, `stores`, `components`) and co-located `*.test.tsx` | frontend-engineer |
| `vitest.config.ts`, `playwright.config.ts`, `tests/**`, every `*.property.test.ts`, `docs/testing/**` | qa-engineer |
| ADRs 0002 to 0005, `docs/architecture/dependency-versions.md`, architecture and quality-gate reviews | necro-architect |
| Review of script bodies, dependencies, IPC, window, CSP, protocol | security-reviewer (`docs/security/**`) |
| `.kiro/specs/desktop-foundation/**` including `tasks.md` and status | Orch or human |
| Unassigned `src/shared/**` | none needed in this design |

Run sequence. Small, well-defined tasks run as direct single-agent runs, not through `feature-development.workflow.json`, which preflight W1, W3 and W5 found unfit for a multi-domain phase. Hooks stay disabled throughout.

| Run | Owner | Content | Gate before next |
|---|---|---|---|
| 0 | Human or Orch | Verify Node 24 and pnpm 10; run the registry verification command; fill the version table | H0 passes (section 16). Human approves versions as candidates, the install-script allowlist (9.3, 14) and the lifecycle settings. The MPL-2.0 axe exception is already approved (E1). |
| 1 | necro-architect | ADR 0002 (single package, ESLint+Prettier, test stack, coverage), ADR 0003 (`app://` scheme, privileges, CSP), ADR 0004 (build-script allowlist), ADR 0005 (IPC security model, window chrome, lifecycle, menu, single instance); dependency-versions note | none (R17.1: ADRs precede dependent code) |
| 2 | Orch | Write lint, format, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `.gitattributes` | security-reviewer reads `.npmrc` and `pnpm-workspace.yaml` |
| 3 | desktop-engineer | `package.json`, `.nvmrc`, tsconfigs, `electron.vite.config.ts` (no install) | security-reviewer reviews script bodies (policy 4.2) |
| 4 | Orch | `pnpm install` with the approved allowlist, generate lockfile, then `pnpm install --frozen-lockfile` check | Human approval already given in run 0; Orch halts on any unapproved build script |
| 5 | qa-engineer | `vitest.config.ts`, setup files, alias test. Needed before run 6 so co-located tests can run | `pnpm test` runs (zero tests allowed via `--passWithNoTests` only in this run, not in the script) |
| 6 | desktop-engineer | `src/shared/ipc`, `src/main`, `src/preload`, co-located tests | `pnpm typecheck`, `pnpm lint`, `pnpm test` pass; security-reviewer reviews IPC, window, CSP, protocol |
| 7 | frontend-engineer | Renderer shell, regions, store, adapter, strings, tokens, co-located tests | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` (build is run by Orch or qa-engineer because frontend-engineer lacks `pnpm build*`) |
| 8 | qa-engineer | Property tests, `playwright.config.ts`, E2E, axe, coverage thresholds, traceability file `docs/testing/desktop-foundation-traceability.md` | `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e` pass |
| 9 | necro-architect, security-reviewer | Gate review, zero open blockers (R15.5) | Human final approval |

`pnpm dev` is run only interactively by the human, because it never exits (preflight B).

## 12. Requirements traceability

| Requirement | Design sections |
|---|---|
| R1 toolchain and installs | 0, 9, 14, 15, 16, Appendix A (versions, `engines`, `packageManager`, lockfile, build-script allowlist, license list) |
| R2 architecture and structure | 1, 2, 7 (layout, aliases, boundaries via lint, strict tsconfigs, pure modules) |
| R3 Electron security | 3.1, 3.2, 3.6 |
| R4 IPC | 5, 3.2 |
| R5 CSP | 3.4, 4 (header in protocol response), 10 |
| R6 navigation and permissions | 3.3 |
| R7 lifecycle | 6, 2 |
| R8 initial window | 7, 8 |
| R9 accessibility | 7, 8, 10 |
| R10 state | 7 |
| R11 commands | 9 (scripts), 10 |
| R12 unit and property tests | 10, 1 (static rule tests) |
| R13 E2E | 10, 6 (user-data isolation) |
| R14 lint and format | 1 (rules), 9 (tools, `format:check`) |
| R15 privacy and security | 3.5, 4, 3.6, 11 (reviews) |
| R16 cross-platform | 6, 10 (platform matrix, pure branches), 1 (`.gitattributes`) |
| R17 records | 11 (ADRs 0002 to 0005, ownership hand-off), 0 and 9 (cited sources and UNVERIFIED marks) |

Per-criterion deviations or partial coverage are in section 13 (N1 to N7).

## 13. Known risks and unresolved decisions

Numbered N for items needing human attention; R for risks.

- **N1. Dependency matrix: candidates.** Section 9 pins exact versions resolved from the registry as implementation candidates. Accepted only through V1 to V11 (section 15). Human approves the list as candidates, the Vite 7 choice over Vite 8 (avoids MPL-2.0 `lightningcss`), the `esbuild` approval in principle, and the denial of `fsevents`.
- **N8. Host has no Node or pnpm on PATH.** BLOCKING gate H0 (section 16). Human installs with Appendix A (Node >=24.15.0, pnpm 10.34.9). Behavior of the matrix is untested until V1 to V11 run.
- **N9. RESOLVED (documentation level).** pnpm 10.x documents `onlyBuiltDependencies`, `ignoredBuiltDependencies` and `strictDepBuilds` (default `false`, so it is set explicitly). Behavior on exactly 10.34.9 is confirmed by V2. Fallback `allowBuilds` (9.3).
- **N10. `.npmrc` is unreadable by agents.** Every agent has a read deny on `**/.npmrc`, including security-reviewer, which D13 and policy 4.2 expect to review it. Mitigation in this design: `.npmrc` holds only `engine-strict=true`, and the orchestrator quotes its content in the review request. Human confirms.
- **N2. Dev CSP deviates from R5.5.** Dev allows `'unsafe-inline'` for script and style, only if the pinned Vite and React plugin require it. Accept or require another approach (for example a hash or nonce plugin).
- **N3. R4.8 is not fully testable by E2E.** The renderer cannot call an unregistered channel without a generic bridge, which R4.6 forbids. Coverage is unit-level on the registration helper plus the bridge key-set assertion. Accept.
- **N4. RESOLVED by exception E1.** `@axe-core/playwright` and `axe-core` are MPL-2.0, outside R1.7's permissive list. The human approved a narrow exception (decision record addendum): development and accessibility testing only, excluded from production bundles and installers, notices preserved, NecroAmp stays MIT, not generalized. Verified by V10 and V11.
- **N5. Extra 95 percent coverage targets** for `resolve-app-path.ts` and `csp.ts` go beyond D12's wording.
- **N6. Cross-cutting files outside the explicit D13 list** (`.editorconfig`, `.gitattributes`, README section, `.prettierignore`) assigned to Orch. Confirm.
- **N7. Test user-data override env var** `NECROAMP_E2E_USER_DATA` is a new input, inert in packaged builds. Alternative is none that is verified. Confirm.
- R-a. Scheme privileges may need `corsEnabled` (pre-approved fallback, section 4). `'self'` matching of `app://renderer` is unverified.
- R-b. electron-vite output layout and CJS preload filename, `ELECTRON_RENDERER_URL` name, and `will-frame-navigate` and `setDevicePermissionHandler` availability are UNVERIFIED for the pinned versions. Each has a test that fails visibly if wrong.
- R-c. Playwright's Electron API is marked experimental; compatibility with Electron 45 is unverified.
- R-d. TypeScript 7.0.2, ESLint 10.15.0 and Vite 8.3.8 are available but held back (section 9.2); later upgrades are separate changes.
- R-e. `pnpm-workspace.yaml` without `packages` may be rejected by the pinned pnpm; fallback in section 9.
- R-f. Packaged-app concerns deferred to the packaging phase: asar and `realpath`, Fuses, Linux targets (D7), signing and notarization, auto-update (D10), `package` script.
- R-g. Hooks `post-task-quality` and `ipc-security-check` must remain disabled (preflight C). `ipc-security-check` would fire on the first save under `src/shared/ipc`. The enabled state cannot be read from files; the human confirms in the Kiro hooks panel.
- R-h. macOS and Linux behavior cannot be verified from a Windows host; reported NOT VERIFIED.
- R-i. Open decisions from `structure.md` not touched by this phase remain open: #2, #4, #5, #6, #7, #10 to #15 except where D1 to D14 above decide them.

## 14. Dependency installation approval requirements

**Nothing is installed by this design.** No agent installs anything (all agents are `ask`; D13 keeps permissions unchanged). Installation is performed by the orchestrator only after the human completes this gate.

Steps:

1. **Install the host tools (gate H0, section 16).** Node >=24.15.0 and pnpm 10.34.9 are not on PATH on this machine. The human follows Appendix A.
2. **Re-check the matrix.** The implementation re-reads registry metadata for the section 9.1 versions (the optional read-only block below) and stops on any difference. It records the result in `docs/architecture/dependency-versions.md`.
3. Human reviews and approves: the exact version list in 9.1 as candidates; the install-script allowlist below. The MPL-2.0 decision for axe-core is already given (E1, N4) and is not asked again.
4. security-reviewer reviews `.npmrc`, `pnpm-workspace.yaml`, `package.json` scripts and dependency list (policy 4.2).
5. Orchestrator runs `pnpm install` (not `--frozen-lockfile` the first time) in the repository root, with `strictDepBuilds` at default so an unapproved build script fails the install. It then runs `pnpm install --frozen-lockfile` to confirm the lockfile is in sync (R1.5).
6. If the install fails on an unlisted build script, stop. The package goes back to step 3 for human approval. Never set `dangerouslyAllowAllBuilds` and never approve "all".
7. Orchestrator records the install result (versions installed, scripts that ran) in the run notes for the Kiro write-up.

Install-script allowlist (D9, amended; policy and settings in 9.3):

| Package | Script | Status |
|---|---|---|
| `esbuild` | `postinstall` (dependency of Vite 7.3.8) | **Approved in principle.** Becomes active only after V2 confirms the exact resolved version and the script body. Entry is version-qualified in `onlyBuiltDependencies`. |
| `electron` | none in registry metadata | **Official binary download approved in principle** through the on-demand mechanism in 9.3. No lifecycle script allowed unless V3 finds one and the human confirms it. |
| `fsevents` | `install` (macOS only) | **Denied** through `ignoredBuiltDependencies`. Revisit only if macOS file watching fails, with a human decision. |
| `@playwright/test`, `playwright`, `playwright-core` | none in registry metadata | No approval. Browser binaries are not downloaded by install and must never be fetched; Electron mode uses the project's Electron. |
| every other package | none in the inspected set | **Denied unless explicitly approved by the human.** Any `requiresBuild: true` lockfile entry not listed here becomes a new row that needs approval. |

Settings: `onlyBuiltDependencies`, `ignoredBuiltDependencies` and `strictDepBuilds: true` (all documented for pnpm 10.x, see 9.3). `dangerouslyAllowAllBuilds` is never set. The `allowBuilds` fallback is described in 9.3.

Optional read-only command for step 2 (PowerShell). It queries `/latest`; replace `/latest` with `/<exact version>` from section 9.1 to compare the pinned versions. Add the remaining packages from 9.1 as needed:

```powershell
$pkgs = 'electron','electron-vite','vite','@vitejs/plugin-react','react','react-dom','zustand','zod','typescript','eslint','typescript-eslint','eslint-plugin-react','eslint-plugin-react-hooks','eslint-plugin-jsx-a11y','prettier','eslint-config-prettier','vitest','@vitest/coverage-v8','fast-check','jsdom','@testing-library/react','@testing-library/dom','@testing-library/user-event','@testing-library/jest-dom','@playwright/test','@axe-core/playwright','axe-core'
foreach ($p in $pkgs) {
  $u = 'https://registry.npmjs.org/' + $p.Replace('/', '%2F') + '/latest'
  $m = Invoke-RestMethod -Uri $u
  [pscustomobject]@{
    name = $m.name; version = $m.version; license = $m.license
    node = $m.engines.node
    preinstall = $m.scripts.preinstall; install = $m.scripts.install; postinstall = $m.scripts.postinstall
    peers = ($m.peerDependencies | ConvertTo-Json -Compress)
  }
} | Format-List
```

For a specific version, replace `/latest` with `/<version>` in the URL (for example to check `typescript-eslint` against `typescript` 6.0.x). Also run `node --version` and `pnpm --version` (R1.1), and in the browser or with `Invoke-RestMethod https://registry.npmjs.org/pnpm/latest` find the pnpm 10 exact version (`packageManager` needs an exact pin; select the latest 10.x with `(Invoke-RestMethod https://registry.npmjs.org/pnpm).'dist-tags'`).

Transitive dependencies with install scripts are only visible after resolution. The orchestrator can list them without running scripts by inspecting `pnpm-lock.yaml` entries marked `requiresBuild: true` after a `pnpm install --ignore-scripts` dry resolution (approval of that single command is part of step 3).

## 15. Executable validation tasks for the dependency matrix

Every version in 9.1 is an **implementation candidate**. Registry metadata (`engines`, `peerDependencies`, `scripts`, `license`) shows declared intent. It does not show that the tools run together on this host. A candidate becomes **accepted** only when its validation task below passes on the Windows x64 host and the result is recorded in `docs/architecture/dependency-versions.md` (necro-architect writes the note from the runner's output). Nothing in this phase is claimed for macOS or Linux.

Rules for a failing task:

1. Stop, record the exact command, exit code and first error lines, and report to the orchestrator. Do not retry an identical failing command.
2. Propose the **smallest necessary adjustment**: one package (or one tightly coupled pair), the nearest version that fixes the failure, the rationale, and the evidence (registry metadata plus the failure output).
3. Never upgrade or downgrade an unrelated package. The human approves the adjustment; then the affected tasks rerun once.
4. A change that adds a non-permissive license, a new lifecycle script or a new dependency returns to the human gate in section 14.

| ID | Claim to prove | Command and evidence | Pass criteria | Runner (milestone) | Smallest adjustment if it fails |
|---|---|---|---|---|---|
| V1 | Host Node.js and pnpm match the pins | `node --version`, `node -p "process.arch"`, `pnpm --version`, `where.exe node`, `where.exe pnpm` (Appendix A.5) | Node `>=24.15.0 <25`, arch `x64`, pnpm `10.34.9`, both resolved from the expected install location | Human, verified by Orch (M0) | If 10.34.9 cannot be installed, pin the newest installable `latest-10` version and update `packageManager`. If Node 24.15 is unavailable, lower the Node floor only after jsdom 31.0.1 passes V8 on the actual 24.x, or move jsdom (nothing else). |
| V2 | Only approved dependency scripts run | `pnpm install` with `strictDepBuilds: true`, then `Select-String -Path pnpm-lock.yaml -Pattern 'requiresBuild: true' -Context 3,0` and read the esbuild script body in `node_modules/.pnpm/esbuild@*/node_modules/esbuild/package.json` | Install exits 0. The only package that ran a script is `esbuild` at the version in the allowlist. Every other `requiresBuild` entry is denied or listed. `fsevents` did not run. | Orch (M0) | Unlisted script: stop and ask the human. If pnpm 10.34.9 does not honor the preferred settings, use `allowBuilds` (9.3). If a workspace file without `packages` is rejected, move the keys to `package.json`. |
| V3 | Electron binary acquisition works and is checksummed | `pnpm exec install-electron --no` (flag confirmed against the 45.5.0 installation page), then `pnpm exec electron --version` | Prints `v45.5.0`. Binary is in the Electron cache directory, not in the repository. No lifecycle script ran for `electron`. | Orch with human approval for the network download (M0) | Download blocked: human decides on proxy or mirror (never set by the project). If 45.5.0 assets are missing, propose the nearest 45.x patch. |
| V4 | Electron launches, and the embedded Node is the expected runtime | Human runs `pnpm dev` (interactive) once; embedded runtime via `$env:ELECTRON_RUN_AS_NODE='1'; pnpm exec electron -p "process.versions.node"; Remove-Item Env:ELECTRON_RUN_AS_NODE` (Appendix A.7) | A window titled `NecroAmp` appears and closes cleanly. Embedded Node major is 24 (DEPS lists v24.22.3). It may differ from the host Node patch version, which is expected. | Human (M2 for the first window; A.7 any time after V3) | Launch failure caused by the build layout: fix config in M1 or M2. Failure of Electron itself: nearest 45.x patch, with rationale. |
| V5 | electron-vite 6.0.0 builds with Vite 7.3.8 | `pnpm build` (production) and `pnpm dev` (development, interactive, human) | `pnpm build` exits 0. `out/main/index.js`, `out/preload/index.js` (single CommonJS file) and `out/renderer/index.html` exist. The built renderer has the meta CSP. `pnpm dev` starts, shows the shell and loads with no CSP violation beyond the accepted dev allowance (N2). | Orch or qa-engineer for build, human for dev (M4, rechecked M7) | Peer or runtime break between electron-vite and Vite: adjust only electron-vite (nearest line that accepts Vite 7), or only Vite within 7.x. Vite 8 is not an option without a human decision on `lightningcss` (MPL-2.0, 9.2). |
| V6 | TypeScript 6.0.3 compiles all five projects strictly | `pnpm typecheck` | Exit 0 with `strict: true` in every project; `src/shared` has no DOM or Node types (R2.4 test) | desktop-engineer, frontend-engineer, qa-engineer (M3 for shared, main, preload; M4 for renderer; M6 for tests) | typescript-eslint or a tool rejects TS 6: pin the newest 5.x line that every tool accepts (a single-package change, rationale recorded). |
| V7 | ESLint 9.39.5 and the React plugins load and run | `pnpm lint`, `pnpm format:check`, and the `tests/lint-rules` fixtures through `pnpm test` | Exit 0 on the real tree. Each boundary rule fixture fails as expected. `eslint-plugin-react-hooks@7.1.1` flat preset exists or the rules are enabled by name. No peer crash. | Orch (M1), then every milestone | A plugin throws under flat config: adjust that plugin's version only. Never override peers with pnpm overrides. |
| V8 | Vitest 5.1.2, jsdom 31.0.1, Testing Library and coverage work together | `pnpm test` and `pnpm test:coverage` | Both Vitest projects (node and jsdom) run. Coverage report is produced with the v8 provider and thresholds from section 10 are enforced. Tests are offline. | qa-engineer (M1 smoke, M6 full) | jsdom or `@testing-library/*` incompatibility: adjust only the failing package. A V8 provider fault with Node 24: nearest Vitest 5.x patch (coverage-v8 stays equal to vitest). |
| V9 | Playwright 1.65.1 launches Electron 45.5.0 and a smoke test passes | `pnpm test:e2e` after `pnpm build` | `_electron.launch` returns the first window, the test reads the title and the six regions, the app closes in teardown. No browser binary download occurred. | qa-engineer (M7) | Playwright cannot attach to Electron 45: propose the nearest Playwright release that can, or Electron 44.x as an alternative, as a human decision (it changes the runtime). |
| V10 | The accessibility scan runs against the Electron renderer | `pnpm test:e2e` axe spec | `AxeBuilder` (or the fallback: inject `axe-core` and call `axe.run`) completes. Zero serious or critical violations. The result is recorded, including incomplete checks. | qa-engineer (M7) | Constructor incompatible with Electron `Page`: use the documented fallback (same MPL-2.0 package). If axe 4.14.1 fails on Chromium of Electron 45: nearest `axe-core` and `@axe-core/playwright` pair. |
| V11 | Licenses of the resolved tree, including transitive packages | `pnpm licenses list --prod --json` and `pnpm licenses list --dev --json` (flags confirmed with `pnpm licenses list --help`), plus `Select-String -Path out -Pattern 'axe-core' -Recurse` | The production dependency graph contains only permissive licenses. The only non-permissive packages in the development graph are `axe-core` and `@axe-core/playwright` (N4 exception) and nothing under `out/` mentions axe. Any other copyleft or unknown license is reported and stops the gate. | Orch (M0 after install, M7 after build, M8 final) | Replace or drop the offending package only. No generalization of the N4 exception. |

Status of every row at the time of this design: **PENDING**. No row has run, because the host has no Node or pnpm (section 16).

## 16. Host environment prerequisites (blocking gate H0)

`node` and `pnpm` were reported unavailable on PATH (N8). **H0 blocks every implementation task from M0 onward, except the documentation tasks in M0 that need no host tools.** Nothing in M1 to M8 starts until H0 passes.

**Shell.** PowerShell 7 (`pwsh`) is the working shell. It passed the Kiro shell smoke test. Commands in this design are PowerShell 7 syntax.

**Who does what.**

| Action | Actor |
|---|---|
| Install Node.js, install or enable pnpm, change PATH, change corepack state, change the PowerShell execution policy, accept UAC prompts | **Human operator only.** |
| Read-only verification (`node --version`, `pnpm --version`, `where.exe`, `Get-Command`, registry `GET` requests) | Human, or the orchestrator in the Kiro shell. |
| `pnpm install` in the repository | Orchestrator, after the section 14 approvals. |
| Any global install, system-wide environment change, or execution-policy change | **Forbidden for agents** without explicit human approval in the session. |

**Not allowed anywhere in this project:** bypassing the execution policy (for example `-ExecutionPolicy Bypass`, `Unblock-File` on tool shims, running downloaded scripts through `iex`), disabling antivirus or SmartScreen, `npm install -g` by an agent, or setting `NODE_OPTIONS` or `NODE_TLS_REJECT_UNAUTHORIZED`. If PowerShell blocks `pnpm.ps1`, the human chooses between calling `pnpm.cmd`, or changing the policy for the `CurrentUser` scope on their own authority. Appendix A.5 shows how to detect this.

**Two Node.js runtimes.** They are separate, can differ in patch version, and are verified separately.

| | Host Node.js | Node.js embedded in Electron |
|---|---|---|
| What it is | The Node installed on the machine. Runs pnpm scripts, electron-vite, Vite, ESLint, Prettier, Vitest, `tsc`, Playwright's runner. | The Node inside the Electron binary (`process.versions.node` of the Electron main process; Electron 45.5.0 bundles v24.22.3 per its `DEPS`). Runs `src/main` and `src/preload`. |
| Pinned by | `engines.node` `>=24.15.0 <25`, `.nvmrc` `24`, `packageManager` | The exact `electron` version `45.5.0` |
| Verified by | V1 (`node --version`) | V4 (`ELECTRON_RUN_AS_NODE=1 electron -p "process.versions.node"`, and later a Playwright `evaluate`) |
| Consequence | Tooling and unit tests run on it. Main-process code is unit tested here with Electron faked. | Real behavior of `src/main` is proven only by the E2E tests in M7. A passing unit test under host Node does not prove it. |

Main-process source must not use APIs that exist only in the host Node, and tests must not assume the two versions are equal.

**Gate H0 checklist (all must hold, recorded in the run notes).**

1. `pwsh` is version 7 or newer.
2. `node --version` returns `v24.x` with `x >= 15` and `process.arch` is `x64` (V1).
3. `pnpm --version` returns `10.34.9` (V1), or the human has approved a different 10.x pin.
4. `pnpm` runs from PowerShell 7 without an execution-policy error, or `pnpm.cmd` is the human-approved alternative and scripts below use it consistently.
5. `https://registry.npmjs.org/` is reachable from the shell (Appendix A.6).
6. The human has recorded the approvals in section 14 (versions, N4 exception, lifecycle allowlist).

The exact commands are in **Appendix A: Host setup commands** at the end of this file. Milestone M0 in `tasks.md` references it.

## Decision record (D1 to D14)

| ID | Approved outcome | Where applied |
|---|---|---|
| D1 | Single package, no monorepo | 1, 9 |
| D2 | ESLint (flat config) and Prettier; lint and `format:check` as separate commands | 1, 9 |
| D3 | CSS Modules plus CSS custom properties; `style-src 'self'`, no inline styles; compatible with a future declarative Skin Engine | 3.4, 7, 8 |
| D4 | Secure custom `app://renderer` protocol in production; privileges `standard`, `secure`, `supportFetchAPI`; CSP in header and meta; lexical plus realpath path confinement | 3, 4 |
| D5 | Native frame, single window; `ChromeProfile` union and layout descriptor keep frameless, custom controls, drag regions and skin layouts possible | 2, 7, 8 |
| D6 | Minimal native menu on Windows and Linux; full role menu on macOS | 6 |
| D7 | Linux targets, signing, auto-update deferred to packaging phase | 13 (R-f) |
| D8 | jsdom, Testing Library, axe via Playwright; license and compatibility verification pending (MPL-2.0 flagged) | 9, 10, 13 (N4) |
| D9 | Explicit build-script allowlist. Registry shows Electron 45.5.0 has no install script (lazy binary download), so the approval is unused; `esbuild` needs approval; `fsevents` refused | 9.3, 14 |
| D10 | `package` script and installer config deferred | 9, 13 |
| D11 | Single-instance lock enforced | 6 |
| D12 | V8 coverage 80/80/80 and 75 branches; 95 line and branch for security-critical IPC validation modules | 10 |
| D13 | Orchestrator integrates approved config and cross-cutting files; lockfile via pnpm; human approval before install; no permission widening | 11, 14 |
| D14 | English UI; strings in a typed constants file; no i18n framework | 7 |

### Decision record addendum (conditional approval amendments)

D1 to D14 above are unchanged. The following decisions were taken by the human in the conditional design approval and are recorded here. They do not modify `requirements.md`.

| ID | Approved outcome | Where applied |
|---|---|---|
| E1 (N4) | **Narrow exception to R1.7** for `@axe-core/playwright` and `axe-core` (MPL-2.0). Conditions: (1) development and accessibility testing only, both packages are `devDependencies` and are imported only from `tests/e2e`; (2) excluded from production application bundles and installers (V11 greps `out/` for axe, and the packaging phase must exclude them from the packaged files); (3) the MPL-2.0 license text and notices of both packages stay intact in `node_modules` and are listed in the dependency inventory and `docs/architecture/dependency-versions.md`, and no source file of either package is copied or modified in the repository; (4) NecroAmp stays MIT; (5) the exception is **not** generalized: any other MPL-2.0 or non-permissive dependency still violates R1.7 and needs its own human decision (example: `lightningcss` stays excluded, 9.2). | 9.1, 9.5, 10, 13 (N4), 15 (V10, V11) |
| E2 | pnpm 10 retained (10.34.9). Lifecycle policy: `onlyBuiltDependencies` and `ignoredBuiltDependencies` with `strictDepBuilds: true`; esbuild approved in principle (exact version and script verified by V2); electron official binary download approved in principle with an on-demand mechanism; `fsevents` denied; all other dependency scripts denied unless explicitly approved; `dangerouslyAllowAllBuilds` never set; no execution-policy bypass. | 9.3, 14 |
| E3 | Section 9.1 versions are implementation candidates. Compatibility is accepted only by executed validation tasks V1 to V11, with smallest-change fallbacks. | 9, 15 |
| E4 | Host Node.js and pnpm are a blocking prerequisite (H0). The human installs; agents do not install global software or change system configuration. Host Node and Electron-embedded Node are distinguished. | 16, Appendix A |

## Responses to review

No review of this design exists yet, so none are recorded.

## Appendix A: Host setup commands (human operator, PowerShell 7)

Referenced from M0 in `tasks.md`. Run in an ordinary (non-elevated) PowerShell 7 window unless a step says otherwise. **The human runs the install steps (A.3, A.4).** Agents run only the read-only checks (A.1, A.2, A.5, A.6, A.7). Do not use `-ExecutionPolicy Bypass`. Versions below match section 9.1 (`>=24.15.0 <25`, pnpm `10.34.9`); if `winget` lists a different 24.x, any 24.x with x >= 15 satisfies the pin.

**A.1 Confirm the shell**

```powershell
$PSVersionTable.PSVersion
```

Expected: major version 7 or higher.

**A.2 See what exists**

```powershell
Get-Command node, pnpm, corepack, winget -ErrorAction SilentlyContinue | Format-Table Name, Source, Version -AutoSize
```

**A.3 Install Node.js 24 (choose one option)**

Option 1, winget (UAC prompt expected):

```powershell
winget search --id OpenJS.NodeJS --exact
winget show --id OpenJS.NodeJS --versions
winget install --id OpenJS.NodeJS --exact --version 24.15.0
```

Use a 24.x version that the `show --versions` list offers (24.15.0 or newer, below 25). Then open a **new** PowerShell 7 window so PATH refreshes.

Option 2, official installer: download the Windows x64 MSI for Node.js 24 LTS from `https://nodejs.org/en/download`, compare its SHA-256 with the value in the `SHASUMS256.txt` published beside it, then run it:

```powershell
Get-FileHash .\node-v24.15.0-x64.msi -Algorithm SHA256
```

Replace the file name with the file you downloaded.

**A.4 Install pnpm 10.34.9 (choose one option)**

Option 1, corepack (ships with Node 24; the `enable` step writes shims into the Node install directory and can need an elevated window):

```powershell
corepack --version
corepack enable pnpm
corepack prepare pnpm@10.34.9 --activate
```

Option 2, npm global install into your user profile (no elevation; `%APPDATA%\npm` must be on PATH):

```powershell
npm install --global pnpm@10.34.9
```

Either option is acceptable. The repository later pins `packageManager: pnpm@10.34.9`, and pnpm 10 downloads and runs that exact version automatically when `managePackageManagerVersions` is at its default (`true`).

**A.5 Verify the host (this is gate H0)**

```powershell
node --version
node -p "process.arch + ' ' + process.platform"
pnpm --version
where.exe node
where.exe pnpm
pnpm config get registry
Get-ExecutionPolicy -List
```

Expected: `v24.<15 or higher>.<n>`; `x64 win32`; `10.34.9`; the paths you expect; `https://registry.npmjs.org/`. If PowerShell reports "running scripts is disabled" for `pnpm.ps1`, stop and tell the orchestrator. Do not bypass it. The human either runs `pnpm.cmd` instead, or changes the policy for the `CurrentUser` scope on their own authority.

**A.6 Verify registry access and the pnpm 10 pin (read-only)**

```powershell
(Invoke-RestMethod https://registry.npmjs.org/pnpm).'dist-tags'
(Invoke-RestMethod https://registry.npmjs.org/pnpm/10.34.9).version
(Invoke-RestMethod https://registry.npmjs.org/electron/45.5.0).version
```

Expected: `latest-10` listed; `10.34.9`; `45.5.0`. The optional metadata loop for all candidates is in section 14.

**A.7 Verify the Electron embedded Node (only after M0 install and V3)**

```powershell
pnpm exec electron --version
$env:ELECTRON_RUN_AS_NODE = '1'
pnpm exec electron -p "process.versions.node"
Remove-Item Env:ELECTRON_RUN_AS_NODE
```

Expected: `v45.5.0`, then a `24.x.y` version (v24.22.3 per Electron's `DEPS`). This value is the embedded runtime. It is independent of the host value from A.5.

**A.8 Report back**

Paste the outputs of A.1, A.5 and A.6 into the session and state "H0 ready". The orchestrator records them in the run notes and starts M0 task T0.2.
