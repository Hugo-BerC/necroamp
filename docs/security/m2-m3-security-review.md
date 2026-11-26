# Security review: M2 (main process) and M3 (shared IPC contracts, preload)

Reviewer: security-reviewer (independent, read-only). One pass. Branch `feature/desktop-foundation`.

## Verdict: APPROVED

No blockers. Two non-blocking findings (Medium and Low) should be fixed by the owner before M4. Evidence labels: VERIFIED (read in source), ASSUMED (not exercised at runtime).

## Scope and method

- Read `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `electron.vite.config.ts`, ADR 0003, `tech.md`, and the electron-security skill checklists.
- I have no shell, so I could not run `git status` or `git diff`. I reviewed the current working-tree files directly. Tests were read only where they affected a conclusion. I did not execute any test.
- Not reviewed: renderer code (none exists), packaged runtime, Electron Fuses and ASAR layout (packaging phase), macOS and Linux behavior, credential storage (no code yet), skin loader (not in scope).

## Checks against the requested criteria

| Criterion | Result | Evidence |
|---|---|---|
| contextIsolation, sandbox, nodeIntegration, webSecurity never disabled | PASS (VERIFIED) | `window-options.ts` `buildWebPreferences` is a literal object with no mode parameter. It also sets `webviewTag`, `allowRunningInsecureContent`, worker and sub-frame node flags to false. `create-main-window.ts` is the only `new BrowserWindow`. |
| Production CSP has no dev allowance | PASS (VERIFIED) | `csp.ts`: `PRODUCTION_DIRECTIVES` is a frozen constant. `buildCsp` takes the dev path only for `mode: 'development'`. `index.ts` and `meta-csp-tag.ts` pass `{ mode: 'production' }` as a literal to the protocol header and the meta tag. Matches ADR 0003 item 5 exactly. |
| Dev CSP limits (ADR 0003 item 6 a to h) | PASS with one open duty | `unsafe-inline` only in `script-src` and `style-src`. `connect-src` is the parsed loopback origin plus `ws://host`. No `unsafe-eval`, no remote source. `dev-csp.ts` applies it only to responses from the exact dev origin. `load-target.ts` and `parseDevOrigin` honor `ELECTRON_RENDERER_URL` only when unpackaged, `http:`, loopback, with a port, no credentials, and an empty path. Condition (h) (remove unneeded allowances after runtime validation, T7.6) is still open. See F-4. |
| `app://` traversal, symlink, encoding | PASS (VERIFIED, not run) | `resolve-app-path.ts` rejects raw `%2e`, `%2f`, `%5c`, `%00`, dot segments, backslash, whitespace and controls, decoded `: * ? " < > \|`, dotfiles, trailing dot or space, host, port, credentials, over-long input, and extensions outside the allow-list. It decodes once only, so `%252e` stays a literal name. `app-protocol.ts` then applies `realpath` to the file and a root resolved once, requires a regular file of at most 5 MiB, and answers 404 for every rejection. GET and HEAD only. Headers: CSP, nosniff, no-store, CORP. Privileges: `standard`, `secure`, `supportFetchAPI` only. |
| Navigation, new window, permissions, webview | PASS (VERIFIED) | `navigation-guards.ts` guards `will-navigate`, `will-redirect` and `will-frame-navigate` for every web contents through `web-contents-created`. It prevents webview attach and denies `setWindowOpenHandler`. `permissions.ts` denies the request, check and device handlers. No `shell.openExternal` exists. |
| Sender validation on every privileged handler | PASS (VERIFIED) | `register-handler.ts` is the only `ipcMain.handle` caller and checks the sender before touching the payload. A throw during the check denies. `sender-validation.ts` requires a non-null `senderFrame`, `parent === null`, a trusted origin, and `event.sender` equal to the registered window contents. |
| Zod validation of requests and responses | PASS (VERIFIED) | Request `safeParse(args)` with `z.tuple([])`. Response `safeParse` in main and again in preload. Schemas are `strictObject`. |
| Preload surface | PASS (VERIFIED) | `index.ts` exposes one frozen object `necroamp.app.getInfo`. `ipcRenderer` is used only inside a closure bound to an allow-listed channel with no renderer-supplied argument. No generic invoke, send, on, fs, or `process`. |
| No paths or stacks to the renderer | PASS (VERIFIED) | `IPC_ERROR_MESSAGES` are fixed strings. Handler throws and response drift map to `INTERNAL`. The logger takes allow-listed fields and redacts unsafe values. `errorNameOf` returns only the name. Transport errors in preload are dropped. |
| Single-instance and shutdown | PASS with F-1 | Lock is requested before other work. `second-instance` args are never read. Disposers run on `will-quit`. Unknown platforms quit. |

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| F-1 | Medium | `src/main/index.ts` (the `acquireSingleInstance(app, () => focusOrCreateWindow(mainWindow, openMainWindow))` call, near L77 to L79) and `src/main/lifecycle/single-instance.ts` `focusOrCreateWindow` | The `second-instance` listener is registered before `ready`. If it fires before the first window exists (`mainWindow === null`), `focusOrCreateWindow` calls `openMainWindow`, which constructs a `BrowserWindow` before `app.whenReady()` resolves. Electron forbids that and throws. `installProcessCrashHandlers` then runs `app.exit(1)` and the first instance dies (availability, not confidentiality). ASSUMED: the pre-ready timing is not exercised, and the docs do not guarantee it cannot happen. A second `whenReady().then(openMainWindow)` would also create a duplicate window if it fires in the gap. | In the `second-instance` callback, do nothing if `!app.isReady()` (the initial `whenReady` path already opens the window). Add a unit test for the not-ready case. | desktop-engineer |
| F-2 | Low | `src/main/protocol/resolve-app-path.ts` segment loop (reserved names) | Windows legacy device names (`con.js`, `nul.css`, `aux.html`) pass the lexical checks. `realpath` should resolve them outside the root, so the confinement check returns 404, but this is not tested. ASSUMED. | Reject segments whose stem (before the first dot) matches `CON, PRN, AUX, NUL, COM1-9, LPT1-9` case-insensitively, and add a case to the property test. | desktop-engineer, then qa-engineer |
| F-3 | Low | `src/main/protocol/app-protocol.ts` L98 to L113 | `realpath`, `stat` and `readFile` are separate calls on a path, so a local process that can write inside the app's own output directory could swap a file between them. Requires write access to the install directory, so it sits outside the renderer threat model. | Accept and document. Optionally open the file once and `fstat` the handle. | desktop-engineer (optional) |
| F-4 | Info | `src/main/security/csp.ts` `developmentDirectives` | ADR 0003 condition (h): `unsafe-inline` for scripts and styles is justified by design, not by a dev run. No dev run exists yet. | During T7.6, remove `unsafe-inline` from whichever directive the pinned Vite and React plugin does not need, and record the result. | desktop-engineer, necro-architect |
| F-5 | Info | `src/main/security/sender-validation.ts` | Deviation from the design: it checks `parent === null` plus registered `event.sender` instead of `senderFrame === mainFrame`. Both reject sub-frames and foreign contents, and the check fails closed on any throw. I accept the deviation. | None. Record it in the design or an ADR note. | necro-architect |
| F-6 | Info | `src/main/index.ts` (env reads) | `ELECTRON_RENDERER_URL` and `NECROAMP_E2E_USER_DATA` are honored only when `!app.isPackaged`, and validated. A local user who controls the environment of an unpackaged build is out of scope. | None. | none |
| F-7 | Info | Packaging phase | Fuses (`RunAsNode` off, ASAR integrity), the `realpath` check against the asar layout, and `devTools` in production builds are not part of M2/M3. Dev menu roles are already gated by `isDevRun`. | Cover them in the packaging review. | release-engineer |
| F-8 | Info | `electron.vite.config.ts`, `app-protocol.ts` | Unverified at runtime: `'self'` matching `app://renderer`, module scripts without `corsEnabled` (ADR 0003 item 3 fallback), the sandboxed preload with Zod bundled, and the meta CSP in built HTML. The fallback needs no other privileges and no new ADR beyond an amendment. | Verify in T7.0 and E2E. | desktop-engineer, qa-engineer |

## Required before M4

F-1 (Medium). F-2 is recommended. Everything else is informational.

No source modified.
