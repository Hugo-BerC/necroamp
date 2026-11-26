# ADR 0005: IPC security model, window chrome, lifecycle, menu and single instance
- Status: Accepted (human decisions D5, D6, D11, D14). Implementation exists for M1 only. IPC, window and lifecycle code are later milestones.
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
