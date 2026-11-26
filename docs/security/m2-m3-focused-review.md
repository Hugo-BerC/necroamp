# Focused security review: M2 (main process) and M3 (shared IPC, preload), second pass

Reviewer: security-reviewer (independent, read-only). One pass. Branch `feature/desktop-foundation`. Skill loaded: `electron-security`. Builds on `docs/security/m2-m3-security-review.md` (first pass, F-1 to F-8). Findings here use IDs `S-n`.

## Verdict: APPROVED (no confirmed defects)

No Critical, High or Medium findings. Two Low and several Info items are NOTEs that need no code fix before M2/M3 acceptance. Runtime behavior is not verified (see "Not verified").

## Evidence labels and limits of this review

- VERIFIED: read in this repository (production code and tests).
- DOCUMENTED: stated in the official Electron documentation for 45.5.0. **I could not fetch any Electron documentation.** `web_fetch` was denied by the agent profile permission rule (`deny web_fetch matching "*"`), and `node_modules/electron/electron.d.ts` (28,659 lines) cannot be searched or parsed with the tools I have. Every Electron behavior claim below is therefore labeled ASSUMED (recalled from the Electron API docs, not re-checked against 45.5.0). The first pass records that the 45.5.0 typings declare `will-navigate`, `will-redirect`, `will-frame-navigate`, `will-attach-webview` and the three permission setters (code comments in `navigation-guards.ts` and `permissions.ts`, task T2.0). I did not re-verify that.
- ASSUMED: not exercised and not re-checked.
- I have no shell. I executed nothing and ran no tests. The "542 passed, 2 skipped" figure is taken from the brief.

## 1. IPC sender validation: decision

Code (VERIFIED): `src/main/security/sender-validation.ts` `isTrustedSender` returns true only if, in order inside one `try`: `event.senderFrame` is not null or undefined; `frame.parent === null` (strict, so `undefined` fails); `isTrustedUrl(frame.url, trusted)`; `isRegisteredSender(event.sender)`. Any throw returns false. `src/main/index.ts` supplies `isRegisteredSender = sender => mainWindow !== null && sender === mainWindow.webContents`. `register-handler.ts` calls the check first, synchronously at the top of the `ipcMain.handle` listener, wraps it in a second `try/catch`, and is the only `ipcMain.handle` caller (grep over `src/**` found no `ipcMain.on`, `once`, `handleOnce`).

### Decision: ACCEPT the `parent === null` plus registered-sender design. It is equivalent in effect to `senderFrame === sender.mainFrame` for this threat model. No correction required. One optional hardening is listed (S-1).

| Required guarantee | Control | Result |
|---|---|---|
| Sender belongs to the registered, authorized WebContents | `sender === mainWindow.webContents` (identity). A foreign, unregistered or `undefined` sender fails. After close, `mainWindow` is null so every call fails. | HELD (VERIFIED code and tests `rejects an unregistered sender`) |
| Sender is the intended top-level application frame | `parent === null` and trusted origin on a registered contents. Within one registered contents the only frames with `parent === null` are top frames of a frame tree. | HELD, with the S-1 caveat (ASSUMED Electron semantics) |
| Subframes cannot invoke privileged handlers | `parent !== null` returns false, even on the trusted origin (test `rejects a sub-frame even on a trusted origin`). Independently, CSP `frame-src 'none'` and `will-frame-navigate` block creating a non-trusted subframe. | HELD |
| Unexpected or destroyed WebContents rejected | Identity check against the current `mainWindow.webContents`. Reading `webContents` on a destroyed window throws and is caught. | HELD (ASSUMED that the getter throws on a destroyed object; the result is false either way) |
| Untrusted origins rejected | `originOf` builds `protocol//host` with the WHATWG parser and compares exact membership in `trusted`. Credentials, empty host, `blob:`, `about:`, `file:`, `data:`, port-bearing hosts (`renderer:80`) and lookalike hosts all fail (VERIFIED by reading `trusted-origins.ts`; test table covers lookalikes). Production trusts only `app://renderer`. | HELD |
| Navigation cannot invalidate the trust assumptions | See below. | HELD |
| Missing, detached or inaccessible frames fail closed | `null`/`undefined` frame, missing `parent`, throwing getters, throwing registration check all return false (tests present). | HELD |

Navigation and frame replacement (answers to the review questions):

- What `event.senderFrame` points to (ASSUMED, Electron `IpcMainInvokeEvent` docs): the frame that sent the message. It is `null` if the frame was destroyed or navigated away by the time it is read. A `null` is rejected.
- Is the URL re-checked at call time (VERIFIED): yes. `frame.url` is read inside `isTrustedSender` on every invoke. Nothing is cached.
- Is there an async gap (VERIFIED): no. The check runs synchronously at the start of the listener, before any `await`. The earlier `isRegisteredSender` also runs at call time against the current `mainWindow`.
- After `will-navigate`, `will-frame-navigate`, `will-redirect`: `navigation-guards.ts` calls `preventDefault()` on every URL whose origin is not trusted, for all web contents created by the app (`web-contents-created`). The top frame can therefore only move within `app://renderer` (or the dev origin in a dev run). A stale frame from before a navigation would still be on the trusted origin. Programmatic `loadURL` from main is not guarded by these events but main only loads `target.url` (`create-main-window.ts`).
- After reload or cross-process frame swap (ASSUMED): a frame object from the old document either reads as destroyed (null) or still reports a trusted URL. Both outcomes are safe, because the document is the same trusted origin.
- Disposed frame getters (ASSUMED): a detached frame reports an empty URL and a null parent in recalled Electron behavior. The empty URL fails `originOf`, so a null `parent` on a dead frame cannot pass. This is why the origin check and the parent check must stay together. Do not remove the origin check.

Why not an explicit `mainFrame` comparison: both approaches reject subframes and foreign contents. The explicit comparison is stricter only for other top-level frame trees inside the same registered contents (for example a prerender tree). Such a frame would have to be a same-origin `app://renderer` document, which already holds the same preload bridge and the same capabilities as the primary page. No privilege boundary is crossed, so the extra strictness adds no protection here. The explicit comparison also relies on JS object identity of `WebFrameMain` wrappers across frame swaps (ASSUMED), which can only produce false negatives (fail closed).

Conditions that keep this decision valid (record them in the design or an ADR note):
1. Any future window or WebContents that gets the preload must be added to `isRegisteredSender` explicitly.
2. The trusted origin set must never include a remote or user-controlled origin. Today it is `app://renderer`, plus the loopback dev origin only when `!app.isPackaged`.
3. No handler may be registered outside `registerHandler`.
4. The origin check must not be relaxed to a prefix or `startsWith` test.

## Findings

| ID | Severity | Class | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|---|
| S-1 | Low | NOTE | `src/main/security/sender-validation.ts`, `src/main/index.ts` L113 | The check does not prove the frame is the primary main frame. `parent === null` also holds for a top frame of a separate frame tree in the same contents (prerender-like). That frame must still be same-origin `app://renderer` on the registered contents, so no escalation is possible (reasoning above, Electron semantics ASSUMED). | Optional defense in depth, not required: extend the injected `isRegisteredSender` or the event shape so the check also requires `frame === sender.mainFrame`, and add a test with a frame that has `parent: null` but is not `mainFrame` (expect false). Not needed for acceptance. | desktop-engineer |
| S-2 | Low | NOTE | `src/main/protocol/app-protocol.ts` L98 to L113 | The MIME type and the extension allow-list come from the requested path (`resolved.relativePath`), not from the `realpath` target. A symlink inside the renderer root named `x.js` that points to another file inside the root (of any extension) is served with the `.js` type. Containment is still enforced on the real path, so no escape. Build output contains no symlinks (ASSUMED). | None required. Optionally also require `isAllowedExtension` on the extension of `real`. | desktop-engineer |
| S-3 | Info | NOTE | `src/main/security/csp.ts` L19 to L32 | Production CSP is correct for the shell (`default-src 'none'`, `script-src 'self'`, `connect-src 'none'`, `frame-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`, no `unsafe-*`). It also sets `media-src 'none'`, `worker-src 'none'`, and `img-src`, `font-src` to `'self'` only. Audio (M later: `blob:`/protocol media URLs, AudioWorklet module loading), skins and Shiki will need deliberate, reviewed changes. | Change only through a design change and security review. Do not loosen now. | desktop-engineer, security-reviewer |
| S-4 | Info | NOTE | `src/main/protocol/mime-types.ts` | Allow-list is `.html .js .css .json`. Fonts, images, `.wasm` and source maps are refused with 404. This is safe and fail closed. It will need extending when the renderer ships such assets. | Extend through a reviewed design change. | desktop-engineer |
| S-5 | Info | NOTE | `src/main/protocol/app-protocol.ts` L65 to L69 | `realRoot()` caches a failed `realpath(rendererRoot)` as `null` for the process lifetime, so every request returns 404. Availability only. Fail closed. | None. | none |
| S-6 | Info | NOTE | `src/main/protocol/app-protocol.ts` L98 to L113 | `realpath`, `stat`, `readFile` are separate calls (TOCTOU, first-pass F-3). `readFile` uses the realpath result, so a link swapped later is not followed again from the lexical path. Needs write access to the install directory. Accepted. | None. | none |
| S-7 | Info | NOTE | `src/main/window/permissions.ts` | Request, check and device handlers deny everything on `session.defaultSession`, installed before the window is created. `setDisplayMediaRequestHandler` is not set. Recalled Electron behavior without a handler is denial, but this is ASSUMED. No renderer code can request it under the current CSP. | When a renderer exists, add a runtime assertion in E2E that `getDisplayMedia` and `Notification` are denied. Optionally set a deny handler. | qa-engineer |
| S-8 | Info | NOTE | `src/main/window/navigation-guards.ts` | Guards attach to every web contents, including a DevTools contents in a dev run, where they may block DevTools-internal navigation. Dev-only usability, not a security gap. | Observe in the dev run (T7.6). | desktop-engineer |
| S-9 | Info | NOTE | `src/main/protocol/app-protocol.ts` `securityHeaders` | Headers set: CSP, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `Cross-Origin-Resource-Policy: same-origin`. No `Referrer-Policy` or `Permissions-Policy`. The renderer has no external links or network, so there is no practical effect. | Optional: add `Referrer-Policy: no-referrer`. | desktop-engineer |
| S-10 | Info | NOTE | `src/renderer/` | No renderer source or `index.html` exists in the tree (`file_search` found none outside `node_modules`). The production entry `app://renderer/index.html` cannot be loaded, and the meta-CSP plugin and CSP-on-document behavior cannot be exercised. This is expected for M2/M3. | Verify when the renderer lands (M4) and in E2E. | desktop-engineer, qa-engineer |
| S-11 | Info | NOTE | `src/main/protocol/resolve-app-path.test.ts` and companions | Two real-symlink tests are skipped on Windows. Accepted by the user. The symlink containment logic is covered by `realpath` plus `isPathInsideRoot` with injected `fs` in the remaining tests. | Keep as is. | none |

## 2. Custom protocol `app://renderer` (VERIFIED by code reading, not executed)

Order of operations in `resolveAppPath`, then the handler:
1. Type and length (`<= 2048`). Raw forbidden characters (controls, space, backslash) rejected before parsing, because the WHATWG parser would silently strip some of them.
2. `new URL`. Scheme must be `app:`, hostname exactly `renderer`, no username, password or port.
3. Raw (still encoded) path checks: any `%2e`, any raw `.` or `..` segment, `%2f`, `%5c`, `%00` rejected.
4. One `decodeURIComponent` of `url.pathname`. A malformed escape is rejected. `%252e` decodes to the literal text `%2e` and is not decoded again, so double encoding cannot become a dot or separator. No later step decodes or normalizes again.
5. Per-segment checks on decoded text: empty, `.`, `..`, length, `\ / : * ? " < > |` and controls, leading dot, trailing dot or space, Windows device names (`con`, `nul`, `com1` and so on, with or without extension) on every platform.
6. Extension allow-list on the last segment.
7. `pathApi.join`, reject absolute, lexical containment check against `resolve(root)` (case-insensitive when `sep` is `\`).
8. Handler: `realpath` of the joined path, `isPathInsideRoot` against the once-resolved real root, `stat` must be a regular file of at most 5 MiB, then `readFile(real)`. Every failure maps to 404 with a fixed code in the log only.

Result: containment is checked last on the real path, and the file read uses that real path. No decode or normalize step follows the containment check, so an earlier check cannot be invalidated. Windows specifics covered: reserved names, alternate data streams (`:` rejected), trailing dot or space, case-insensitive compare, `\` rejected. POSIX: case-sensitive compare. Methods limited to GET and HEAD (405 otherwise). Scheme privileges are `standard`, `secure`, `supportFetchAPI` only (no `bypassCSP`, `corsEnabled`, `stream`). Whether Chromium canonicalizes `request.url` before the handler (collapsing `..`) is ASSUMED. The code is safe either way because it validates the string it receives.

Not verifiable without runtime: real `realpath` casing and short-name behavior on NTFS, symlink and junction behavior, `'self'` matching `app://renderer`, module-script fetch without `corsEnabled` (ADR 0003 fallback).

## 3. Electron invariants (VERIFIED in code)

- `buildWebPreferences` is a literal object: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, plus `webviewTag: false`, `allowRunningInsecureContent: false`, worker and subframe node integration false. It takes only the preload path. `create-main-window.ts` is the only `new BrowserWindow` (grep). No `loadFile`, `executeJavaScript`, `openExternal`, `session.fromPartition`, `WebContentsView` in production code.
- Navigation: `will-navigate`, `will-redirect`, `will-frame-navigate` denied unless the origin is trusted. `will-attach-webview` prevented. `setWindowOpenHandler(() => ({ action: 'deny' }))` on every contents. Registered before `ready` through `web-contents-created`.
- Permissions: deny-all request, check and device handlers, installed before the first window.
- CSP: production policy is a frozen constant used for the protocol header and the build-time meta tag, always called with `{ mode: 'production' }` literals. Development policy comes from a separate function, is delivered only by a header hook scoped to the exact loopback dev origin, and the hook is installed only when `target.kind === 'development'`, which requires `!app.isPackaged` and a validated loopback `http:` origin with a port. `unsafe-eval` and remote script sources appear nowhere.
- DevTools and reload menu items exist only when `isDevRun` is true.

## 4. IPC and preload (VERIFIED in code)

- Channels: one constant `app:get-info` in `src/shared/ipc/channels.ts`. Preload also checks membership in `Object.values(IPC_CHANNELS)` before invoking.
- Validation: main parses request args with `z.tuple([])` (extra args fail), parses the handler response, and returns a fixed-message `INTERNAL` on drift. Preload validates request and response again. Schemas use `strictObject`.
- Errors: only the codes `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL` with fixed messages. Handler exceptions, transport exceptions and schema issues are dropped. Logger accepts allow-listed scalar fields and redacts values that are not `[A-Za-z0-9_.:-]` (so paths cannot pass).
- Bridge: `contextBridge.exposeInMainWorld('necroamp', api)` with a frozen `{ app: { getInfo } }`. `ipcRenderer` is used only inside a closure that invokes one allow-listed channel with no renderer-supplied argument. No `send`, `on`, generic invoke, `process`, `fs` or Electron object is exposed.
- Sandboxed CJS compatibility: preload imports only `electron` and `@shared/ipc`. `electron.vite.config.ts` sets `externalizeDeps: false` and `format: 'cjs'` for the preload, so Zod is bundled into one file. Whether the bundle actually loads in a sandboxed preload (no unsupported `require`) is ASSUMED until the built output is executed.

## Not verified (needs the Electron runtime or tools I lack)

- All Electron semantics for 45.5.0: `senderFrame` after navigation or destruction, `WebFrameMain.parent` and `url` on a disposed frame, `webContents.mainFrame` identity across frame swaps, prerender frame trees. Labeled ASSUMED because the Electron docs and typings were not readable (see "Evidence labels").
- Sandboxed preload execution with the bundled Zod, contextBridge cloning of the frozen API, `app://renderer` loading, `'self'` CSP match, header CSP plus meta CSP interplay, `protocol.handle` behavior on 45.5.0, Chromium URL canonicalization before the handler.
- Real-symlink containment on Windows (platform-limited tests), NTFS realpath casing.
- Fuses, ASAR integrity, packaged `realpath` layout (packaging phase). macOS and Linux behavior. No E2E has run.

## Unreviewed areas

Renderer code (none exists), crash handlers and user-data override internals beyond what `index.ts` shows, test files other than `sender-validation.test.ts`, credential storage (no code), skin loader (not in scope), `.github/**`, `package.json` scripts.

## Required corrections

None. S-1 and S-2 are optional hardening.

No source modified.
