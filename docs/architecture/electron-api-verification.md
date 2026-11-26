# Electron API verification (T2.0)

Status: source and documentation check only. It makes no runtime claim (R17.2). No Electron process, build or E2E run exists for these APIs.
Scope: `.kiro/specs/desktop-foundation/design.md` sections 3 to 6.
Pinned versions: Electron 45.5.0 (`node_modules/electron/package.json`, and the first line of `electron.d.ts`: "Type definitions for Electron 45.5.0") and electron-vite 6.0.0 (`node_modules/electron-vite/package.json`). Vite is 7.3.8 per `package.json`.

## 1. Method, evidence levels and limits

Each API below is reported on five separate levels. They are never merged.

| Level | Meaning | Source |
|---|---|---|
| Availability | The API exists in 45.5.0 and is not removed. | `node_modules/electron/electron.d.ts` |
| Type-level | Member name, optionality and type. | Same file, line numbers from a targeted search (exact where a line is given, otherwise approximate). |
| Documented behavior | What the 45.5.0 documentation says. | D1: JSDoc inside `electron.d.ts`. D2: the documentation Markdown source at the tag `v45.5.0` of the Electron repository, fetched with `web_fetch` from `raw.githubusercontent.com/electron/electron/v45.5.0/docs/api/...` (pages: `structures/ipc-main-invoke-event`, `web-frame-main`, `web-contents`, `protocol`, `session`). |
| Actual runtime behavior | Observed in a running Electron. | **Not exercised for every API.** |
| Deferred integration validation | The task that will observe it. | `tasks.md` T4.2, T6.3, T7.x. |

Limits:

- **electronjs.org pages.** `https://www.electronjs.org/docs/latest/api/structures/ipc-main-invoke-event` was fetched with `web_fetch`. It returned only the page title and footer (the content is rendered by script), and `latest` is not pinned to 45.5.0. The rendered site is therefore not used as evidence. D2 above is the version-pinned substitute.
- **Pages not fetched in D2:** `web-contents` sections for `will-attach-webview`, `setWindowOpenHandler` and `will-redirect`; `session` sections for `setPermissionCheckHandler` and `setPermissionRequestHandler`; `structures/custom-scheme` and `structures/privileges`; `app`. Behavior for those exists at D1 or type level only, and is labeled so.
- **Line numbers.** The search tool does not index `node_modules` (earlier steps), so some numbers were found by reading ranges. Lines marked "exact" were confirmed with a text search in this step. Others carry "≈".
- **No build output.** `out/` does not exist in the workspace (checked). Preload and main output names below are derived from configuration and tool source, not from a build.
- **Validation commands.** The typecheck exit 0 recorded in `docs/engineering/m2-m3-acceptance-report.md` supports that the project code compiles against these typings. It is not a runtime result. This step ran no command.

## 2. Per-API verification

### 2.1 `will-frame-navigate` (design 3.3)

- **Availability.** Declared on `WebContents` in 45.5.0 (`on` at exact line 18629, with `off`, `once`, `addListener`, `removeListener` after it). `will-navigate` and `will-redirect` are declared alongside. `WebviewTag` has a separate DOM-style `will-frame-navigate` (exact line 21011), which is a different API.
- **Type-level.** `on(event: 'will-frame-navigate', listener: (details: Event<WebContentsWillFrameNavigateEventParams>) => void): this`. The params interface has `url: string`, `isSameDocument: boolean`, `isMainFrame: boolean`, `frame: WebFrameMain | null`, `initiator?: WebFrameMain | null` (≈25686). `src/main/window/navigation-guards.ts` registers the three events and reads only `details.url` and `details.preventDefault()`.
- **Documented behavior (D1, D2).** D2 (`web-contents.md`): the event fires "when the main frame or any of its subframes attempts to navigate" and `isMainFrame` is true for the main frame. It does not fire for navigation started with `webContents.loadURL` or `webContents.back`, and not for in-page navigation (fragment, `history` API). "Calling `event.preventDefault()` will prevent the navigation." The `frame` member "may be `null` if accessed after the frame has either navigated or been destroyed". Event order for a document navigation: `did-start-navigation`, `will-frame-navigate`, `will-navigate` (main frame only), `will-redirect` (only on redirect). **Trap.** The `<webview>` variants say `preventDefault()` has no effect. That text belongs to the DOM tag, not to `WebContents`, which the guards use.
- **Actual runtime behavior.** Not exercised. Whether `preventDefault` stops a real `location.href = 'https://…'` or an iframe navigation in the sandboxed window is unproven.
- **Deferred validation.** T7.2 (navigation to `https:`, `http:`, `file:`, `data:`, `javascript:` stays on the app URL), after T7.0.
- **Consequence for design.** The guard does not see the app's own `loadURL` or fragment changes. That matches design 3.3 (renderer-initiated navigation only).

### 2.2 `session.setDevicePermissionHandler` and the other permission handlers (design 3.3)

- **Availability.** Declared on `Session` (exact line 14309). Not deprecated, so the design's "skip only if removed" fallback does not apply. `setPermissionCheckHandler` (≈14347) and `setPermissionRequestHandler` (≈14365) are declared.
- **Type-level.** `setDevicePermissionHandler(handler: ((details: DevicePermissionHandlerHandlerDetails) => boolean) | (null)): void`. `src/main/window/permissions.ts` passes handlers that deny; a `() => false` is assignable to each boolean-returning handler.
- **Documented behavior (D2, `session.md`).** "Returning `true` will allow the device to be permitted and `false` will reject it." The handler gives default permissioning for `hid`, `serial` and `usb` devices without a prior request. Without it, permissions granted through device selection apply. `deviceType` is `hid`, `serial` or `usb`. For `setPermissionCheckHandler` and `setPermissionRequestHandler`, only D1 text was read (`setPermissionCheckHandler` says to also implement the request handler).
- **Actual runtime behavior.** Not exercised. Which permission types route to which handler is documented only in part. Whether the main window uses the default session is true by construction when no `session` or `partition` is set (the `protocol.md` page states a window with a custom partition uses a different session).
- **Deferred validation.** T7.2 (denial seen from the renderer, for example `navigator.geolocation`, `navigator.hid.requestDevice`). Handler wiring is unit tested with fakes (T2.4). S-7 (`setDisplayMediaRequestHandler` unset) needs an E2E check. D2 shows `setDisplayMediaRequestHandler(null)` resets to the default, and no handler is installed today.

### 2.3 `protocol.registerSchemesAsPrivileged` (design 4)

- **Availability.** Declared on `Protocol` (exact line 12440).
- **Type-level.** `registerSchemesAsPrivileged(customSchemes: CustomScheme[]): void`. `CustomScheme` has `scheme: string` and `privileges?: Privileges` (≈7982). `Privileges` has optional booleans `standard`, `secure`, `bypassCSP`, `allowServiceWorkers`, `supportFetchAPI`, `corsEnabled`, `stream`, `codeCache`, `allowExtensions` (≈24482). `src/main/protocol/app-protocol.ts` requests only `standard`, `secure` and `supportFetchAPI`.
- **Documented behavior (D2, `protocol.md`).** "This method can only be used before the `ready` event of the `app` module gets emitted and can be called only once." A standard scheme follows generic URI syntax and resolves relative URLs. Web storage APIs are disabled for non-standard schemes. `stream: true` is for streaming media. The page's own example for a bundle scheme uses exactly `standard`, `secure`, `supportFetchAPI`. Consequence: the composition root makes one call with all schemes (design 2 step 4).
- **Actual runtime behavior.** Not exercised. Not verified: that `'self'` in a CSP matches `app://renderer` for a standard scheme, and that `supportFetchAPI` alone is enough for module scripts (the `corsEnabled: true` fallback in ADR 0003 stays pre-approved).
- **Deferred validation.** T7.0, T7.2. If module scripts fail, apply the fallback and record it in ADR 0003.

### 2.4 `protocol.handle` and `protocol.unhandle` (design 4)

- **Availability.** `handle` at exact line 12299, `unhandle` at exact line 12496, on `Protocol`. The older `registerXxxProtocol` and `interceptXxxProtocol` families are marked `@deprecated` in the typings (D1), so `handle` is the right choice for this version.
- **Type-level.** `handle(scheme: string, handler: (request: GlobalRequest) => (GlobalResponse) | (Promise<GlobalResponse>)): void`. `unhandle(scheme: string): void`.
- **Documented behavior (D2).** A handler may return a `Response` or a `Promise<Response>`. `request.initiatorOrigin` is set to the issuing origin when web content made the request. It is not controlled by the page, unlike `referrer`, and the docs say to prefer it when deciding whether to serve a request. The current code does not use it (recommendation only, not a decision). `unhandle` removes a handler or a source. A protocol is registered per session (default session unless a window sets a `partition` or `session`).
- **Experimental alternative, not adopted.** `registerSource(scheme, source)` (exact line 12462, "Experimental") serves directories without a JavaScript handler and confines the path to the route's `root`. Adopting it would change where containment is enforced and needs an ADR. The F-3 reassessment in `docs/engineering/backlog.md` may evaluate it.
- **Actual runtime behavior.** Not exercised. Not verified: how headers set on the `Response` (`Content-Security-Policy`, `Cross-Origin-Resource-Policy`) are applied by Chromium, and the streaming and `HEAD` assumptions.
- **Deferred validation.** T6.3 (integration, fake `fs` and a temp directory, already present), then T7.0 and T7.2 (headers on real responses).

### 2.5 `WebFrameMain` properties: `parent`, `url`, `origin`, `detached` (design 3.2)

- **Availability.** `WebFrameMain` and `WebContents.mainFrame` exist (`mainFrame` at exact line 19796).
- **Type-level.** `readonly parent: (WebFrameMain) | (null)` (exact line 20300), `readonly detached: boolean` (exact line 20222), `readonly url: string` (≈20325), `readonly origin: string` (≈20288), `readonly top: (WebFrameMain) | (null)` (≈20318). Project use: `src/main/security/sender-validation.ts` reads only `parent` and `url`, through a structural `FrameLike`. `origin`, `detached`, `top` and `mainFrame` are not read in `src`.
- **Documented behavior (D2, `web-frame-main.md`).** `frame.parent`: "the property would be `null` if `frame` is the top frame in the frame hierarchy." `frame.url`: "the current URL of the frame." `frame.origin`: serialized per RFC 6454 and "may be different from the URL"; for a child window on `about:blank`, `origin` is the parent's origin while `url` is the empty string; pages without a scheme/host/port origin give `"null"`. `frame.top`: the top frame of the hierarchy, or null. Also: "In most cases, only the main frame of a WebContents can send or receive IPC messages. However, if the `nodeIntegrationInSubFrames` option is enabled, it is possible for child frames to send and receive IPC messages also." The project sets the sub-frame node flags to false. For `detached` the only source read is D1 (typings JSDoc).
- **Actual runtime behavior.** Not exercised. Not verified: `parent === null` for the top frame of a sandboxed window loaded from a standard custom scheme (the documentation implies it); whether `url` is updated before or after commit for a sender that runs during navigation; whether a destroyed frame throws on property access (the code fails closed with `try/catch`, which is not proof).
- **Deferred validation.** T7.2 (the `app:get-info` round trip returns `ok` from the real top frame). No task exists for a sub-frame or foreign-origin negative E2E (see section 4).

### 2.6 `IpcMainInvokeEvent.senderFrame` nullability (design 3.2, 5)

- **Availability.** `IpcMainInvokeEvent` declares `senderFrame` (exact line 9557). `IpcMainEvent` declares it too (exact line 9529).
- **Type-level.** `readonly senderFrame: (WebFrameMain) | (null)`. The `null` in the type is why `SenderEventLike` accepts `FrameLike | null | undefined` and fails closed.
- **Documented behavior (D2, `structures/ipc-main-invoke-event.md`).** "The frame that sent this message. May be `null` if accessed after the frame has either navigated or been destroyed." The structure also has `processId`, `frameId` and `sender` (the `webContents` that sent the message).
- **Design correction.** Design 3.2 says null happens "after the frame is destroyed". The documentation says "navigated or destroyed". Behavior of the code is unchanged because it fails closed on null. Per the code comments and the focused review, `registerHandler` runs the sender check synchronously at the top of the `ipcMain.handle` listener, before any `await`.
- **Actual runtime behavior.** Not exercised. Not verified: how long after dispatch the value stays valid and whether property access on a destroyed frame throws.
- **Deferred validation.** T7.2 after T4.2 (client adapter) and T3.3 (preload).

### 2.7 `ELECTRON_RENDERER_URL` (design 3.1)

- **Availability.** It is an electron-vite environment variable, not an Electron API.
- **Type-level.** Not applicable. `src/main/window/load-target.ts` types it as `readonly ELECTRON_RENDERER_URL?: string | undefined`.
- **Documented behavior (tool source, S).** In `node_modules/electron-vite/dist/chunks/lib-CLhLGLN3.js` line 66, after the renderer dev server listens: `process.env.ELECTRON_RENDERER_URL = \`${protocol}//${host}:${port}\``. Per the earlier source read, `protocol` is `https:` for an HTTPS server and otherwise `http:`, and `host` is the configured host, or `localhost` for a wildcard or non-string host. `electron.vite.config.ts` has no `server` block (checked by search for the keys used), so the default host is `localhost` (inference). `resolveLoadTarget` accepts only `http:` with `localhost` or `127.0.0.1`, so an HTTPS, IPv6 or custom host falls back to production and fails closed.
- **Actual runtime behavior.** Not exercised. `pnpm dev` was not run. Not verified: the port when Vite moves to a free port, and whether `preview` sets the variable (the E2E harness removes it).
- **Deferred validation.** T7.6 (interactive `pnpm dev`, dev CSP allowances measured), T7.1 and T7.2 (variable removed, production `app://`).

### 2.8 Preload output name through electron-vite (design 1, 3.1)

- **Availability.** electron-vite 6.0.0 builds the preload with its own factory and preset.
- **Type-level.** Not applicable (build tool). Project config typechecks (acceptance report, exit 0).
- **Documented behavior (config and tool source, S).** `electron.vite.config.ts` preload block: `outDir: 'out/preload'` (line 39), `externalizeDeps: false` (line 41), `output: { format: 'cjs', entryFileNames: '[name].js' }` (line 45), with input key `index`. `lib-DoUt4oMD.js` line 1670 carries `rollupOptions` into `rolldownOptions` (`??=`). The static derivation is `out/preload/index.js`, which matches the `'..', 'preload', 'index.js'` segments used from the main bundle directory (`out/main`). `externalizeDeps: false` is meant to bundle dependencies such as Zod into one file, which a sandboxed preload requires.
- **Actual runtime behavior.** Not exercised. `out/` does not exist and `pnpm build` was not run. Not verified: that Vite 7.3.8 honors the carried options, that the emitted file is a single file with no chunk imports, that Zod is bundled, and that the file loads under `sandbox: true`.
- **Deferred validation.** T7.0 (outputs exist), T7.5 (preload is one CommonJS file), T7.2 (the `window.necroamp` key set proves the preload ran under the sandbox).

## 3. Other version-sensitive items noticed

| Item | Type-level fact | Status |
|---|---|---|
| `will-attach-webview` | `on(event: 'will-attach-webview', …)` is declared on `WebContents`. | Declared. Behavior not verified. T7.2. |
| `setWindowOpenHandler` | Used by `navigation-guards.ts`. Typings line not recorded in this check. | Not checked. Record at the next evidence update. |
| `protocol` module vs `session.protocol` | `Session` has a `protocol` member. D2 says a protocol is registered per session. | The design uses the module-level `protocol` on the default session. Module export line not located. |
| `registerSource` | Present, "Experimental" (exact line 12462). | Not used. Optional future evaluation by ADR. |

## 4. Summary by evidence level

Legend: Y done, - not done or not applicable, N/F not fetched.

| API | Availability and type-level | D1 typings JSDoc | D2 docs at tag v45.5.0 | Tool source | Runtime |
|---|---|---|---|---|---|
| `will-frame-navigate` (and `will-navigate`, `will-redirect`) | Y | Y | Y (`web-contents`) | - | not exercised |
| `setDevicePermissionHandler` | Y | Y | Y (`session`) | - | not exercised |
| `setPermissionCheckHandler`, `setPermissionRequestHandler` | Y | Y | N/F | - | not exercised |
| `registerSchemesAsPrivileged`, `CustomScheme`, `Privileges` | Y | Y | Y (`protocol`; structure pages N/F) | - | not exercised |
| `protocol.handle`, `unhandle` | Y | Y | Y (`protocol`) | - | not exercised |
| `WebFrameMain.parent`, `url`, `origin`, `top` | Y | Y | Y (`web-frame-main`) | - | not exercised |
| `WebFrameMain.detached` | Y | Y | N/F | - | not exercised |
| `IpcMainInvokeEvent.senderFrame` | Y | Y | Y (`ipc-main-invoke-event`) | - | not exercised |
| `ELECTRON_RENDERER_URL` | project type only | - | - | Y | not exercised |
| Preload output name | - | - | - | Y (static derivation) | not exercised |

The electronjs.org rendered pages are not used (section 1).

## 5. T2.0 criteria against the evidence

| # | Criterion (tasks.md T2.0, M2 acceptance criterion 7) | Result | Reason |
|---|---|---|---|
| 1 | List each version-sensitive API of design 3 to 6. | Met | Section 2 covers the seven named items (eight rows, with the `WebFrameMain` and permission handler groups), plus section 3. |
| 2 | Check the Electron 45.5.0 docs. | Met for the APIs marked Y in column D2, partly for the rest | Version-pinned documentation source was read for five pages. Items marked N/F rely on typings JSDoc only. |
| 3 | Check the electron-vite 6.0.0 output. | Partly met | Tool source and project config read, names derived statically. No build output exists. |
| 4 | Report page and result in the desktop-engineer final message. | Not verifiable here | The desktop-engineer hand-off is not in the repository. This file names the pages (section 1) and records the results. |
| 5 | necro-architect records them in `docs/architecture/electron-api-verification.md`. | Met | This file. Content was produced by necro-architect and re-checked against the typings, the documentation source and the repository in a documentation closure step. |
| 6 | A documented source check, not a runtime claim. | Met | Every API carries "not exercised" for runtime. |
| 7 | M2 criterion 7: each UNVERIFIED API name has a documented outcome. | Met at type and documentation level | Behavioral outcomes depend on T7.x. |

## 6. Findings to carry forward

- `senderFrame` may be `null` after navigation as well as after destruction. Read it synchronously, as the code does.
- `registerSchemesAsPrivileged` can be called only once and before `ready`.
- `protocol.registerSource` is an experimental alternative. It is not adopted.
- `request.initiatorOrigin` is available to `protocol.handle` and is not used. Possible later hardening, recommendation only.
- No sub-frame or foreign-origin E2E exists in T7.x for the sender check. This is a gap, not a defect. Whether to add one is a human decision.
