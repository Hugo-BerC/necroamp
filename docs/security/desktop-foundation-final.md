# Desktop Foundation final security review (M8)

Reviewer: security-reviewer (read-only). Branch `feature/desktop-foundation`, HEAD `40bf76e` per the Block C report.
Skill loaded: `electron-security` (only skill loaded). Authority: `tech.md` (Electron architecture and security, Skin engine, CI/CD), `product.md` principles 1 to 6.
Evidence labels: VERIFIED (code read in this review), DOCUMENTED (stated in repository reports, not re-run), ASSUMED.

## Verdict

**APPROVED.** No High or Medium finding is confirmed. Four Low or Informational items are listed for follow-up. F-3 remains open with its mandatory pre-release reassessment.

I have no shell. Test, build and E2E results (768 passed, 2 skipped, 35 E2E, coverage 99.44 / 98.23 / 100 / 99.78) are DOCUMENTED from the Block C report, not re-run by me. macOS and Linux are NOT VERIFIED.

## Scope and trust boundaries

Covered: main (`src/main/index.ts`, window, ipc, security, protocol, lifecycle), preload (`src/preload/*`), shared IPC contract use, renderer (static search), CSP, dependency policy. Not reviewed: packaging, Electron Fuses, installers, CI (no `.github/workflows` exists), macOS and Linux behavior, GitHub, token storage and skin loader (none implemented), the full `src/shared/ipc` schemas beyond their use sites, the renderer React components line by line.

## Checks

| Area | Result | Evidence |
|---|---|---|
| BrowserWindow preferences | PASS, VERIFIED | `window-options.ts:16-28`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, plus `webviewTag: false`, `allowRunningInsecureContent: false`, worker and subframe node integration false. The function takes only the preload path. `create-main-window.ts` is the only window constructor and spreads these preferences last. |
| IPC allowlist | PASS, VERIFIED | One channel (`app:get-info`). Handlers register only through `registerHandler` (`install-ipc.ts`, `register-handler.ts:36`). |
| Zod validation | PASS, VERIFIED | Request parse of `args` (`register-handler.ts:48`) and response parse (`:57`) in main. Preload parses request and response again (`create-necroamp-api.ts`). Errors are fixed codes with no payload, path or exception text. |
| Sender validation | PASS, VERIFIED, fail-closed | `sender-validation.ts:41-54`: null frame, non-null `parent` (subframe), frame not identical to `sender.mainFrame`, untrusted origin, unregistered sender, or any exception all return false. Trusted origin compared as `protocol//host`; credentials rejected (`trusted-origins.ts originOf`). Subframe and foreign-origin negative cases are covered by tests (DOCUMENTED). |
| Preload exposure | PASS, VERIFIED | `preload/index.ts`: `ipcRenderer` is closed over, never exposed. Bridge is `Object.freeze({ app: { getInfo } })`. `invoke` takes a typed channel and forwards no arguments. No FS, no generic invoke, no event forwarding. |
| `app://` containment | PASS, VERIFIED | Layers: raw checks (`%2e`, dot segments, encoded separators, NUL, control chars, backslash), decoded checks (separators, `:`, reserved chars, dotfiles, trailing dot or space, Windows device names), extension allow-list, lexical `isInside` (case-insensitive on `\`), then `realpath` plus root re-check in `app-protocol.ts`, 5 MiB cap, GET and HEAD only, `nosniff`, `no-store`, CORP `same-origin`, CSP header. |
| Defect 0001 change | PASS, VERIFIED | The only change is one `/* v8 ignore next -- @preserve */` at `resolve-app-path.ts:97`, covering the single statement `if (!trimmed.startsWith('/')) return reject('BAD_URL')`. The branch is unreachable: `url.pathname` of an authority URL starts with `/` or is empty, and an empty or `/` value is replaced by `/index.html` at line 96. `decoded` cannot lose the leading `/` because encoded separators are rejected earlier (line 85). No check was removed or reordered, and the later segment, extension and `isInside` checks are unchanged. `vitest.config.ts` keeps the 95% per-file gate for this file and excludes only `src/main/index.ts`, `src/renderer/main.tsx` and similar entry files (VERIFIED for those two). |
| Renderer isolation | PASS, VERIFIED (static) | No `fetch`, XHR, WebSocket, `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `window.open`, `localStorage` or remote URL in `src/renderer`, `src/preload`, `src/shared`. The only script tag is the module entry in `index.html`. |
| Production CSP | PASS, VERIFIED | `csp.ts` frozen directives: `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `img-src` and `font-src 'self'`, `connect-src 'none'`, `object-src`, `frame-src`, `worker-src`, `media-src`, `base-uri`, `form-action`, `frame-ancestors 'none'`. No `unsafe-*`, no remote origin. Dev allowances live in a separate function, wired only when `target.kind === 'development'` (`index.ts:81`). The Block C report states the built HTML has the meta CSP and no inline script (DOCUMENTED). |
| Network | PASS, VERIFIED | No network code in main beyond the dev-server load. `connect-src 'none'`. No telemetry, update check or crash reporter (`crash-handlers.ts` logs only error name and code). |
| Navigation, new window, webview | PASS, VERIFIED | `installNavigationGuards` attaches to every `web-contents-created`. `will-navigate`, `will-redirect` and `will-frame-navigate` are blocked unless the origin is trusted. `will-attach-webview` is prevented. `setWindowOpenHandler` returns deny. |
| Permissions | PASS, VERIFIED | `permissions.ts`: request, check and device handlers deny everything, installed on `session.defaultSession` before the window opens. |
| Dev-only trust | PASS, VERIFIED | The dev origin is used only when `!app.isPackaged` and `ELECTRON_RENDERER_URL` parses as `http://localhost` or `127.0.0.1` with a port (`load-target.ts`, `trusted-origins.ts parseDevOrigin`). |
| User-data override | PASS with note | `user-data-override.ts`: inert when packaged, requires an absolute, already-normalized, existing directory of at most 260 chars, no NUL. See L-2. |
| Crash handlers | PASS | `uncaughtException` logs the error name and calls `app.exit(1)`. `unhandledRejection` logs the name. Renderer crash reloads once, then quits. No reporter, no messages or stacks logged. |
| Credentials | PASS | No token, safeStorage or GitHub code exists. No secret found in the files read. |
| Dependencies | PASS, VERIFIED and DOCUMENTED | `package.json`: all 4 runtime and 27 dev dependencies are exact versions, `packageManager` pinned `pnpm@10.34.9`. `pnpm-workspace.yaml`: `strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]` (version-qualified), `ignoredBuiltDependencies: [fsevents]`. No `.npmrc` content and no lifecycle scripts (`pre*`, `post*`, `install`, `prepare`) in `package.json`. `pnpm-lock.yaml` has integrity hashes. Accepted exceptions (`dependency-versions.md`): MPL-2.0 axe-core (dev only, not in `out/` per the Block C report), `eslint@9.39.5` deprecated (temporary human acceptance, no known vulnerabilities per `pnpm audit`, DOCUMENTED), permissive dev-graph licenses. Production licenses are MIT only (DOCUMENTED). |
| F-3 TOCTOU | OPEN as required | `backlog.md` F-3 (Low, accepted temporarily), reassessment mandatory before the first public release. `app-protocol.ts` still does `realpath` then `stat` then `readFile` as separate calls, so the race exists and the backlog describes it correctly. |

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| FR-1 | Low (carry-over F-3) | `src/main/protocol/app-protocol.ts:98-103` | `realpath`, `stat` and `readFile` run separately on a path. A local attacker who can write inside the app resources directory could swap a file between calls. The directory is not writable by the renderer, and the handler serves only the bundled renderer today. | Before first public release: accept permanently, read through an opened handle, or evaluate `protocol.registerSource`; record in an ADR. Must be reassessed as soon as skins or user media are served through a protocol (higher exposure). | desktop-engineer with security-reviewer |
| FR-2 | Low | `src/main/lifecycle/user-data-override.ts`, `src/main/index.ts:39-44` | Any environment that can set `NECROAMP_E2E_USER_DATA` in an unpackaged run can redirect user data to any existing absolute directory. Packaged builds ignore it (VERIFIED, `isPackaged` check). Impact is limited to developer and test runs. | None required. Optionally require the path to sit under the OS temp directory. Confirm with a packaged-build test during packaging (F-7). | desktop-engineer |
| FR-3 | Informational | `src/main/security/csp.ts:55-62` (dev policy) | Dev CSP allows `unsafe-inline` for script and style. It is unreachable in production code paths. F-4 (human `pnpm dev` run, T7.6) will decide whether it can be removed. | Remove the allowances the T7.6 run shows are unneeded. | desktop-engineer |
| FR-4 | Informational | `src/main/index.ts` | There is no `session.on('will-download')` handler and no `webRequest` block for non-`app:` schemes. Today navigation guards plus `default-src 'none'` and `connect-src 'none'` already deny these paths, so this is defense in depth only. | Consider a deny-all download handler when file features arrive. Re-review at packaging for Fuses, ASAR integrity and `RunAsNode` (tech.md Fuses rule), which are not reviewed here. | desktop-engineer |

## Residual and deferred items

- Packaging-specific checks (Fuses, ASAR integrity, installers, signing) stay deferred (backlog F-7).
- No CI workflow exists. The `tech.md` CI rules (action pinning by SHA, least-privilege `permissions:`) cannot be checked until `.github/workflows` is created. Owner: release-engineer.
- Electron downloads its binary at install time in a way that is not covered by `onlyBuiltDependencies`. How Electron 45.5.0 obtains the binary under `strictDepBuilds` is ASSUMED (the documented V2 scan found only esbuild with a build script, and E2E runs prove the binary is present).
- Re-review is required when any of these arrive: file, token, skin or GitHub IPC; `shell.openExternal`; a second window; media served by protocol.

No source modified.
