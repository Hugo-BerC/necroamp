# ADR 0005: IPC security model, window chrome, lifecycle, menu and single instance
- Status: Accepted (human decisions D5, D6, D11, D14). Implemented for M2 and M3 (`src/main`, `src/preload`, `src/shared/ipc`); integration pending (see `docs/engineering/m2-m3-acceptance-report.md`). No Electron runtime check has run.
- Resolves: open decision 16 in `structure.md` for this phase (window chrome, single window). Related to `tech.md` "Electron architecture and security" and `shared-ownership-policy.md` 3.2.
- Related: `.kiro/specs/desktop-foundation/design.md` sections 2, 3, 5 and 6, ADR 0003
## Context
The renderer is untrusted. Every message that crosses the boundary needs a typed contract, a sender check and bounds. The foundation also has to fix platform behavior (quit, menu, second launch) so later phases do not change it silently.
## Decision
### IPC
1. **One channel**, `app:get-info`, defined in `src/shared/ipc/channels.ts` as `IPC_CHANNELS`. No literal channel string appears elsewhere.
2. **Contract.** Zod `strictObject` schemas in `src/shared/ipc`: an empty-tuple request, an `AppInfo` response (`name`, `version`, `platform` in `win32 | darwin | linux`) and a result union `{ ok: true, data } | { ok: false, error }`. Error codes are `INVALID_SENDER`, `INVALID_PAYLOAD` and `INTERNAL`, with fixed messages never taken from an exception.
3. **One registration helper**, `registerHandler`, is the only caller of `ipcMain.handle`. In order: check the sender (trusted top frame whose URL origin is in the trusted set), parse the request, run the handler in `try/catch`, parse the response, never throw across IPC. Logs contain the channel constant and a code only.
4. **Preload.** One frozen object, `necroamp.app.getInfo`, exposed with `contextBridge`. It returns `unknown`. No `ipcRenderer`, no generic invoke or send. The renderer adapter `necroamp-client.ts` is the only reader of `window.necroamp` and parses responses again.
5. **Web preferences** come from one parameterless function and are identical in every mode: `contextIsolation`, `sandbox` and `webSecurity` on, `nodeIntegration` and `webviewTag` off, no insecure content. Only `create-main-window.ts` calls `new BrowserWindow`.
6. **Navigation and permissions.** Guards on every created web contents block navigation, redirects and frame navigation to untrusted URLs, deny `window.open`, and block `webview` attachment. Permission request, check and device handlers deny everything. `shell.openExternal` is not called in this phase.
### Window chrome (D5)
7. Native frame, single window, minimum 800 by 600, default 1100 by 720, hidden until `ready-to-show`. `ChromeProfile` is a union with only `native` implemented, so frameless chrome can be added later without touching security preferences. No window-control channels exist.
### Lifecycle (D11)
8. **Quit policy.** Windows and Linux quit when the last window closes. macOS stays running and recreates a window on `activate`. An unknown platform string quits.
9. **Single instance.** `requestSingleInstanceLock()` runs before `ready`. A second process exits. The first restores and focuses its window and ignores argv and working directory.
10. **Crashes.** A renderer crash reloads once, and a second crash quits the app on every platform. `uncaughtException` logs the error name and exits with code 1. `unhandledRejection` logs the name only. `crashReporter` is never started.
11. **Test isolation.** `NECROAMP_E2E_USER_DATA` sets `userData` only when the app is not packaged and the value is a short absolute path to an existing directory.
### Menu (D6)
12. Minimal menu on Windows and Linux: File (quit), Edit, Window, and View (reload, dev tools) only in a development run. macOS gets a role-based menu. The template builder is pure. Roles supply the labels, so no menu text enters the strings file.
### Strings (D14)
13. English only. All UI text is in a typed constants file, with no i18n library.
## Consequences
- Sender validation, payload parsing and error mapping cannot be skipped by a new handler, because they live in the only registration helper.
- R4.8 (an unregistered channel is rejected) is covered at unit level and by the bridge key-set check. A direct end-to-end call is impossible without a generic bridge, which is forbidden (design N3).
- Adding a channel changes the IPC security surface and needs a contract change note and a security review.
- Verification by the final code is task T8.4. The sender-frame and `will-frame-navigate` property names are version-sensitive and are checked in T2.0.
- Linux sandbox prerequisites and macOS and Linux behavior are NOT VERIFIED from the Windows host.
## Alternatives rejected
- Frameless custom chrome or multi-window now (D5 b and c). More cost and a larger security surface, with no phase need.
- Hidden menu bar (D6 a). Loses standard copy and paste shortcuts.
- Several instances (D11 b). Two processes would share one user-data directory.
- `send`/`on` events or a generic bridge. No typed request and response.
- Chromium `--user-data-dir` for tests. Its effect on `userData` and the instance lock is unverified.

## Addendum: sender-frame validation (F-5)

Status: accepted after the focused review (`docs/security/m2-m3-focused-review.md`). No code change.

Decision. `src/main/security/sender-validation.ts` accepts an invoke when the sender is the registered main window `webContents`, `event.senderFrame` is non-null, `senderFrame.parent === null`, and the frame URL origin exactly matches the trusted set (`app://renderer`, plus the dev origin in development). It does not compare `senderFrame` with `sender.mainFrame`. For this threat model the two are equivalent in effect: subframes have a non-null parent and are also blocked by `frame-src 'none'` and the `will-frame-navigate` guard, and any other top-level frame tree in the same contents would still have to be a same-origin `app://renderer` document with the same capabilities.

Rationale. Unregistered or destroyed contents fail the identity check. A null, disposed or throwing frame fails closed. The origin check stays because a disposed frame may report a null parent with an empty URL.

Conditions that keep the decision valid: register any future window explicitly; never put a remote origin in the trusted set; register every handler through `registerHandler`; keep the origin comparison an exact match.

Optional hardening (low, S-1): add `frame === sender.mainFrame`.

Limit. The member names, types and documentation statements below are checked against Electron 45.5.0 (see the next subsection). The behavior of `senderFrame` and `WebFrameMain.parent` after reload, frame swap, navigation or destruction has not run. Runtime confirmation is deferred to E2E (T7.x); see `docs/engineering/m2-m3-deferred-runtime-validation.md`.

### Technical rationale against the pinned Electron 45.5.0 API

Sources. TYPE-LEVEL: `node_modules/electron/electron.d.ts` ("Type definitions for Electron 45.5.0"). DOCUMENTED: the documentation source at the tag `v45.5.0` of the Electron repository (`docs/api/structures/ipc-main-invoke-event.md`, `docs/api/web-frame-main.md`), also quoted in the typings. NOT VERIFIED AT RUNTIME: no Electron process has run. Details: `docs/architecture/electron-api-verification.md`.

What the API provides.
- `IpcMainInvokeEvent` declares `sender: WebContents` and `readonly senderFrame: WebFrameMain | null` (typings line 9557). DOCUMENTED: "The frame that sent this message. May be `null` if accessed after the frame has either navigated or been destroyed." This is why the code rejects a null or undefined frame first.
- `WebFrameMain.parent` is `WebFrameMain | null` (typings line 20300). DOCUMENTED: the property "would be `null` if `frame` is the top frame in the frame hierarchy". Strict `=== null` therefore means top frame, and an `undefined` read from a bad object fails.
- `WebFrameMain.url` is "the current URL of the frame". `origin` is a separate member and "may be different from the URL" (an `about:blank` child reports the parent's origin and an empty `url`). The code reads `url` and parses its origin itself.
- DOCUMENTED: "In most cases, only the main frame of a WebContents can send or receive IPC messages", unless `nodeIntegrationInSubFrames` is enabled. The web preferences factory keeps the sub-frame node flags off (first-pass review, criterion 1), so sub-frames have no preload and no IPC path by default. `parent === null` is a second layer.

Why the three controls together give the intended boundary.
1. Registered `WebContents` identity. `event.sender` must be the contents of the registered main window, so a foreign, unexpected or closed contents fails before any frame property is trusted. This is an identity comparison and does not depend on frame semantics.
2. `senderFrame.parent === null`. A non-null parent is a sub-frame and is rejected even on the trusted origin. A null frame fails. `parent` and `url` are read inside one `try`, so a throw from a disposed frame fails closed.
3. Exact trusted origin from `senderFrame.url`, evaluated at call time, with no cache and no `await` before the check. A disposed frame may report an empty URL, and an empty URL fails the origin parse, so a disposed frame cannot pass on `parent === null` alone. The two checks must stay together. The empty-URL behavior of a disposed frame is recalled, not documented, and stays NOT VERIFIED AT RUNTIME.

Why this equals `senderFrame === sender.mainFrame` for this threat model. Within one registered contents, the frames with `parent === null` are the roots of its frame trees. The explicit comparison is stricter only for a root that is not the primary `mainFrame`. Such a frame would still need the preload bridge and the exact origin `app://renderer` (or the dev loopback origin in a dev run), so it would hold the same capabilities as the primary page. Navigation guards (Decision item 6 above) deny other origins, and CSP `frame-src 'none'` blocks creating sub-frames.

S-1 (Low, optional hardening). `parent === null` does not prove the frame is the primary `mainFrame`. A separate top frame tree in the same contents would also report a null parent. The effect is limited to a same-origin frame with equal capabilities. If defense in depth is wanted, add `frame === sender.mainFrame` through the injected registration check and a unit test with a frame that has `parent: null` but is not `mainFrame` (expect false). A mismatch on a `WebFrameMain` wrapper identity can only produce a false negative, so it fails closed. Owner: desktop-engineer. This is a human decision and is not part of this closure.

What is and is not verified.
- VERIFIED by reading and unit tests: the code paths for sub-frame, null frame, throwing getter, untrusted origin and unregistered sender.
- TYPE-LEVEL and DOCUMENTED: the members and statements quoted above.
- NOT VERIFIED AT RUNTIME: what `senderFrame` returns after reload, cross-process frame swap, navigation or destruction; `parent` and `url` on a disposed frame; whether `mainFrame` identity is stable across swaps; whether a separate top frame tree can exist in this app. T7.x (and T4.2) have not run, so the decision rests on code reading, typings and documentation, and its status changes only after those tests pass.

This subsection does not change the Decision or the four conditions above.

## Addendum: T3.4 contract review of `src/shared/ipc/**`

Reviewer: necro-architect. Evidence: VERIFIED means read in this repository. Nothing was executed. The security conclusions belong to `docs/security/m2-m3-security-review.md` and are not repeated here.

Scope. Files `channels.ts`, `result.ts`, `app-info.ts`, `necroamp-api.ts` and `index.ts`. Their co-located tests exist (`channels`, `result`, `app-info`, `index`, `ipc-contract.property`); this review did not assess their assertions. Consumers checked by search: `src/main/ipc/app-handlers.ts`, `src/preload/create-necroamp-api.ts`, `src/preload/index.ts`. Out of scope: renderer adapter code (M4).

| Check | Result | Evidence |
|---|---|---|
| Decision item 1: one channel `app:get-info` as `IPC_CHANNELS`, no literal elsewhere | Pass | `channels.ts` defines it in `domain:action` form. In non-test `src/**` the string appears only there. |
| Decision item 2: Zod `strictObject` schemas, empty-tuple request, `AppInfo`, result union | Pass | `appInfoRequestSchema = z.tuple([])`, `appInfoSchema` strict with bounded `name` and `version` and a `platform` limited to `win32`, `darwin`, `linux`; `ipcResultSchema` is a discriminated union on `ok`. |
| Decision item 2: error codes `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL` with fixed messages | Pass | `IPC_ERROR_MESSAGES` is a frozen record; `createIpcError` takes only a code; no contract function accepts an exception, path or payload. |
| Decision item 4: bridge shape returns `unknown`, no raw IPC | Pass | `NecroampApi` is `{ app: { getInfo: () => Promise<unknown> } }`. |
| Ownership policy 3.4: `shared` imports no Electron, DOM, Node-only or renderer/main code | Pass | The only external import is `zod`. |
| Ownership policy 3.4: a shared schema does not replace receiver validation | Pass by reading | `app-handlers.ts` and the preload each parse with the shared schemas. |
| Naming (`structure.md`) | Pass | kebab-case files, `fooSchema` with inferred types, `domain:action` channel. |

Findings.

| ID | Severity | Finding | Action |
|---|---|---|---|
| C-1 | Low (documentation) | `design.md` section 3.2 describes `isTrustedSender(event, trusted, mainFrameOf)` with `senderFrame === webContents.mainFrame`. The code uses `parent === null` plus an injected registration check (finding F-5, accepted above). | Closed in the documentation closure step: a pointer to the F-5 addendum was added to design 3.2. |
| C-2 | Low (process) | The Consequences section of this ADR requires a contract change note when a channel is added. Policy 3.3 requires one for breaking or cross-domain changes and exempts additive ones. M3 created the first channel, so nothing was broken, and `docs/architecture/contract-changes.md` does not exist. | Treat M3 as the baseline. When that file is first created, record one entry "initial `app:get-info` contract". Later channel or schema changes follow this ADR. Owner: necro-architect with desktop-engineer. |
| C-3 | Info | Policy 3.2 lists a runtime dependency used from `shared` as an ADR trigger. No ADR names Zod for `shared`. `tech.md` fixes Zod as the validator and Decision item 2 above relies on it. | Steering is sufficient authority. A one-line ADR note is optional and is a human decision. |
| C-4 | Info | `IpcResult<T>` is a hand-written generic type next to a schema factory. A generic factory output cannot be inferred as a reusable generic alias, so a single source of truth is not possible here. | Accept. Revisit if the union grows beyond `ok`, `data`, `error`. |
| C-5 | Info | The `index.ts` barrel exports only public names. | None. |

No finding concerns a missing schema, an exported Electron or DOM type, a literal channel string outside `channels.ts`, or a payload or error that can carry a path, token or stack trace.

Verdict: ACCEPT. The contract matches Decision items 1, 2 and 4 and the dependency direction. No blockers. Not covered: renderer adapter code, test assertions, runtime behavior (T4.2, T7.x). The named file `docs/security/desktop-foundation-m3-review.md` is replaced by the canonical review `docs/security/m2-m3-security-review.md` (human decision).
