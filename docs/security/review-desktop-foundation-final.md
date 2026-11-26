# Security review: desktop-foundation-final

- Run: desktop-foundation-final. Range `66f9f7f...10dfc3f` on `feature/desktop-foundation`.
- Reviewer: security-reviewer (read-only, no shell). Authority: `tech.md` (Electron architecture and security, CI/CD) and `product.md` principles 1 to 6.
- Evidence labels: VERIFIED (read in this run), DOCUMENTED (stated in repo docs, not re-run), ASSUMED.
- Inputs read: `docs/release/review-desktop-foundation-final-diff-scope.md`, `package.json`, `pnpm-workspace.yaml`, the `.npmrc` diff hunk, `electron.vite.config.ts`, `src/main/index.ts`, `window/*`, `security/*`, `protocol/*`, `ipc/*`, `lifecycle/single-instance.ts`, `lifecycle/user-data-override.ts`, `src/preload/*`, `src/renderer/index.html`, and a source-wide grep. The tests, the lockfile body and the renderer components were not read line by line.

## Verdict

No blockers. 0 blocker, 0 major, 5 minor. The foundation meets the mandatory `tech.md` Electron rules for the code in scope. Packaging, fuses and CI do not exist yet, so those checks are deferred, not passed.

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| FN-1 | minor | `src/main/security/csp.ts` (`developmentDirectives`) | Dev policy adds `'unsafe-inline'` to `script-src` and `style-src`, and `connect-src` allows the dev origin and `ws://host`. VERIFIED in code. Applied only by `dev-csp.ts` to responses from the exact loopback dev origin, and `load-target.ts` enables it only when `!app.isPackaged`. Production policy is a frozen constant with no inline allowance. The comment says to remove allowances that T7.6 shows are unneeded. | Keep until T7.6 evidence exists. Then drop `style-src 'unsafe-inline'` if HMR works without it. Keep the script allowance only if the React refresh preamble needs it. Do not touch the production list. | desktop-engineer |
| FN-2 | minor | Repo root (no `electron-builder.yml`, no fuse config) | `tech.md` requires production Fuses (RunAsNode off, ASAR integrity). No packaging config exists in the range. VERIFIED absent. | Deferred packaging gate. When packaging is added, set fuses and re-review. Preserve F-3 as the pre-public-release reassessment. | release-engineer |
| FN-3 | minor | `.github/workflows/` (absent) | `tech.md` CI/CD rules (SHA-pinned actions, least-privilege `permissions:`, `--frozen-lockfile`) cannot be checked. No workflow, no publish step, no tag trigger. VERIFIED absent. CI is absent, not passing. | When CI is added: pin actions by full SHA, set `permissions: contents: read` by default, keep build and publish jobs separate. | release-engineer |
| FN-4 | minor | `.kiro/steering/tech.md` (3 changed lines), `eslint.config.mjs`, `prettier.config.mjs`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc` | Steering is authoritative and is in no agent's write scope (diff-scope report). The tech.md change adds exception E-ESM-1 and restates that `sandbox`, `contextIsolation` and `webSecurity` are never disabled, so it does not weaken a security rule. VERIFIED from the diff. Authorship of the change is not recorded in git. | Human confirms the steering edit was approved (ADR 0002 section 6 is the cited basis). Assign an owner to the unowned tooling files. | orchestrator (human) |
| FN-5 | minor | `src/main/window/navigation-guards.ts` | `will-navigate`, `will-redirect` and `will-frame-navigate` allow any URL on a trusted origin, not only the entry URL. Same-origin app paths cannot reach the network or Node, and the protocol handler restricts paths and extensions, so the impact is nil today. | Optional. Restrict to the entry URL if routing stays absent. Revisit when the Skin Engine adds origins. | desktop-engineer |

## Checks that passed (VERIFIED in code unless noted)

- **Window hardening.** `buildWebPreferences` (`window-options.ts`) returns literals: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`, no insecure content, no node in workers or subframes. It takes no mode, so callers cannot weaken it. `createMainWindow` is the only `new BrowserWindow` site (grep for `BrowserWindow` construction elsewhere not run; the composition root passes the class only).
- **IPC.** One channel (`app:get-info`). `register-handler.ts` runs sender check, then Zod request parse, then handler, then Zod response parse. Errors return fixed codes with no payload or exception text. Logs carry only the channel name.
- **Sender validation.** `sender-validation.ts` requires a non-null frame, `parent === null`, identity with `sender.mainFrame`, a trusted origin and a registered web contents. Any exception fails closed. The deviation noted in design 3.2 is now stricter than the original, and the file states runtime verification on Electron 45.5.0.
- **contextBridge.** One frozen `necroamp.app.getInfo`. `ipcRenderer` is not exposed. The preload invokes a channel only when it is in `IPC_CHANNELS`, takes no arguments, validates input and output, and drops exception text.
- **CSP.** Production: `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `connect-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, no `unsafe-eval`, no `data:`, no remote origins. Delivered as a header on every `app://` response and as a build-time meta tag injected only into the built HTML (`electron.vite.config.ts`, `apply: 'build'`). The source `index.html` has no inline script or style.
- **Protocol and filesystem.** `app://renderer` is `standard`, `secure`, `supportFetchAPI` only. `resolve-app-path.ts` rejects encoded dots and separators, NUL, backslashes, drive and stream characters, dotfiles, trailing dots and spaces, Windows device names, bad extensions and over-long input. `app-protocol.ts` then confirms the realpath is inside the realpath of the renderer root, requires a regular file at most 5 MiB, allows GET and HEAD only, and sets `nosniff`, `no-store` and CORP `same-origin`. No arbitrary filesystem access is exposed to the renderer.
- **Navigation and permissions.** Guards attach to every `web-contents-created`. They block navigation to untrusted origins, deny `window.open`, and block `<webview>`. Permission request, check and device handlers deny everything. No `shell.openExternal` call exists.
- **Network.** The source grep (excluding tests) found no `fetch(`, `XMLHttpRequest`, `openExternal`, `eval(`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML`, `localStorage` or React `style={}`. Dev server use requires `!isPackaged` and a loopback `http` origin with a port.
- **Tokens and skins.** No GitHub, token or skin code exists in the range (diff-scope report: no github-engineer change). The data-not-code and `safeStorage` rules are not yet testable and remain open for their phases.
- **Test hooks.** `NECROAMP_E2E_USER_DATA` is ignored when `app.isPackaged`, and must be an absolute, normalized, existing directory. It is not a privilege escalation in a packaged build.
- **Single instance.** `second-instance` argv and cwd are never read.
- **Package scripts and dependencies.** `package.json` scripts (`dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `test:e2e`) have no `pre*`, `post*`, `install` or `prepare` hooks, no publish command and no network fetch. All dependency versions are exact pins. `pnpm-workspace.yaml` sets `strictDepBuilds: true`, allows only `esbuild@0.28.2` and ignores `fsevents`. The `.npmrc` diff hunk contains only `engine-strict=true` (VERIFIED). DOCUMENTED in `docs/security/m0-closure-validation.md`: only `esbuild` has an install script, `pnpm audit` reported no known vulnerabilities, and the Electron binary is fetched by `install-electron` with `@electron/get` checksums. I did not re-run audit or read `pnpm-lock.yaml` in full. `eslint@9.39.5` is deprecated (dev only, accepted earlier).
- **CI and publish.** No workflow, no `electron-builder.yml`, no publish provider and no secret reference exist. Nothing can publish from this range.

## Not reviewed or deferred

- macOS and Linux behavior (unverified, as recorded).
- Packaged-app checks: fuses, ASAR integrity, installer signing, `app://` behavior when packaged. Deferred to the packaging phase with F-3.
- Live runtime and dev-server behavior (T7.6). FN-1 depends on it. I cannot run code.
- Test sources, renderer components and `pnpm-lock.yaml` beyond the evidence cited above.
- Auto-update (open decision 10), code signing (open decision 11), `safeStorage` fallback (open decision 3): no code in range.

No source modified.
