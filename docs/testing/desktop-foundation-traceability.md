# Desktop Foundation: requirements traceability (T6.6)

Scope: acceptance criteria R2 to R16 that tests can observe. R1, R11 (scripts), R14, R15.2, R15.5, R17 are
process or review criteria and are listed under "No automated test". Kinds: U unit, P property
(fast-check), I integration (Vitest, fakes at the Electron edge), S static, E Playwright against the
production build, A jsdom accessibility. Authority: `.kiro/steering/tech.md` "Testing".

Paths are relative to the repository root. `[c]` = co-located test written by the implementer.
"QA" files are in the QA write scope.

| Requirement | Tests |
|---|---|
| R2.2 aliases agree | `tests/config/alias-consistency.test.ts` |
| R2.3 boundary rules fail on a fixture | `tests/lint-rules/boundary-rules.test.ts` (47 cases, ESLint `Linter` API) |
| R2.4 shared is environment-neutral | `tests/static/main-preload-policy.test.ts`, lint-rules (shared imports and globals) |
| R2.5 strict, no `any` | lint-rules (`no-explicit-any`), `pnpm typecheck` |
| R2.6 pure logic is framework-free | `src/main/**/*.test.ts` [c], `src/shared/ipc/*.test.ts` [c] |
| R3.1 one window factory | `tests/static/main-preload-policy.test.ts`; `create-main-window.test.ts` [c]; E: one window |
| R3.2, R3.3 web preferences | `window-options.test.ts` [c], `lifecycle.property.test.ts` [c] (every preload path); `tests/static/main-preload-policy.test.ts` (no insecure value); E `smoke-security` "keeps every mandatory web preference on the live window" |
| R3.5 only own bundle; dev origin only in dev | `load-target.test.ts`, `trusted-origins.test.ts` [c]; `lifecycle.property.test.ts` [c]; E: all requests are `app://renderer/` |
| R3.6 no Node globals | E `smoke-security` "exposes no Node or Electron global" |
| R4.1 channel constants only | `channels.test.ts` [c]; static (no literal channel); lint-rules (`ipcLiteral`) |
| R4.2, R4.3 schemas and typed errors | `app-info.test.ts`, `result.test.ts`, `ipc-contract.property.test.ts` [c]; `register-handler.test.ts`, `register-handler.property.test.ts` [c] |
| R4.4 sender validation | `sender-validation.test.ts` [c]; `tests/integration/ipc-round-trip.integration.test.ts` (sub-frame, foreign origin, destroyed frame, unregistered sender, frame that is not the main frame); `tests/integration/shell-bridge.integration.test.tsx`; E `negative-sender.spec.ts` (foreign top frame, trusted-origin unregistered contents, sub-frame layers) |
| R4.5 one registration helper | `install-ipc.ts` via `app-handlers.test.ts` [c]; static |
| R4.6 narrow bridge | `create-necroamp-api.test.ts`, `create-necroamp-api.property.test.ts`, `index.test.ts` [c]; E "exposes exactly a frozen necroamp.app.getInfo" |
| R4.7 `app:get-info` | `app-handlers.test.ts` [c]; I round trip; E real IPC round trip |
| R4.8 unregistered channel | `create-necroamp-api.test.ts` [c] (channel allow list). E gap: no real call to an unknown channel because the bridge exposes no generic invoke (nothing to call) |
| R4.9 single adapter | `necroamp-client.test.ts` [c]; `src/renderer/app/bridge/necroamp-client.property.test.ts` (P: any bridge value, any response); `tests/static/renderer-policy.test.ts` ("reads window.necroamp only in the bridge adapter") |
| R5.1 CSP on every load | `csp.test.ts`, `app-protocol.test.ts` [c]; `tests/integration/app-protocol.integration.test.ts`; E header equals the frozen policy |
| R5.2, R5.3 production policy | `csp.test.ts`, `csp.property.test.ts` [c]; E meta and header literal |
| R5.5 dev allowance never in production | `csp.property.test.ts`, `dev-csp.test.ts` [c]; E meta and header have no `unsafe-*` |
| R5.6, R8.14 no foreign request | E "loads every resource from app://renderer and nothing else" |
| R5.7 inline script and remote fetch blocked | E "blocks inline script, string eval and any renderer network request" (asserts the violation events) |
| R6.1 navigation blocked | `navigation-guards.test.ts` [c]; `tests/integration/navigation-wiring.integration.test.ts` (will-navigate, will-redirect, will-frame-navigate on a fake WebContents); E https, http (logged) and file, data, javascript (URL unchanged) |
| R6.2 `window.open` denied | wiring test; E "window.open returns null and opens no window" |
| R6.3 webview blocked | navigation-guards [c], wiring test |
| R6.4 permissions denied | `permissions.test.ts` [c]; E media and geolocation denied |
| R6.5 no `openExternal` | static, lint-rules |
| R7.1 one window, title | `create-main-window.test.ts` [c]; E smoke |
| R7.2 single instance | `single-instance.test.ts` [c]; E second process exits, one window remains |
| R7.3 platform policy | `platform-policy.test.ts`, `lifecycle.property.test.ts` [c]; E last window closed (host platform) |
| R7.4 crash policy | `crash-handlers.test.ts`, `lifecycle.property.test.ts` [c]; E first crash reloads, second quits with code 0 |
| R7.5 no crash reporter | static, lint-rules; `crash-handlers.test.ts` [c] |
| R7.6 quit within 5 s | E `app.quit()` exits 0 within 5 s |
| R7.7 app name | E ("fresh profile" uses an isolated directory); name via `app-info` |
| R8.1, R8.2, R8.3 heading, tagline, regions | `app-shell.test.tsx` [c]; E smoke; `tests/a11y/shell-a11y.test.tsx` |
| R8.4 transport placeholders | `tests/a11y/requirements-conformance.test.tsx`; `components.test.tsx` [c] |
| R8.5 playlist list element | `requirements-conformance.test.tsx` `it.fails`, defect 0002 |
| R8.6 ten band placeholders | `app-shell.test.tsx` [c], `requirements-conformance.test.tsx` |
| R8.7 no analyser, no rAF | `tests/static/renderer-policy.test.ts`; lint-rules |
| R8.8 "Foundation default" | `requirements-conformance.test.tsx` `it.fails`, defect 0003 |
| R8.9 GitHub text | optional: tested; "not signed in": `it.fails`, defect 0004 |
| R8.10 failure states | `app-info-store.test.ts`, `app-shell.test.tsx` [c]; `tests/integration/shell-bridge.integration.test.tsx` (real adapter, preload API and handlers) |
| R8.11 layout | E 800x600 and 1920x1080 (bounding boxes, overflow), minimum size |
| R8.12, R8.13 no assets, tokens | `contrast.test.ts` [c] (no literal colors, no `url(`); `tests/static/renderer-policy.test.ts` (no remote `url()`, no `@import`) |
| R9.1 lang, one `h1` | `shell-a11y.test.tsx`; static (`index.html`); E smoke |
| R9.2 names, Tab order, no trap | `shell-a11y.test.tsx` (Tab and Shift+Tab); E Tab in DOM order with wrap |
| R9.3 focus indicator | `renderer-policy.test.ts` (`:focus-visible` uses the focus token); `shell-a11y.test.tsx` (3:1); `contrast.property.test.ts`; E computed outline 2 px solid `rgb(127, 180, 255)` |
| R9.4 text contrast | `contrast.test.ts` [c], `contrast.property.test.ts`, `shell-a11y.test.tsx` |
| R9.5 placeholders exposed | `shell-a11y.test.tsx` (`aria-disabled`, `aria-describedby` resolves, focusable); E |
| R9.6 axe scan | E `a11y.spec.ts`: 31 rules passed, 0 violations of any impact, 0 incomplete |
| R9.7 no animation | static (no `animation`, `transition`, `@keyframes`, no rAF) |
| R10.1 to R10.3 store, no audio state | `app-info-store.test.ts` [c]; static |
| R12.2 property tests present | origin check, CSP builder, IPC parser, platform policy, contrast: all present (`trusted-origins.test.ts` is example-based, the origin check is exercised by `lifecycle.property.test.ts` and `register-handler.property.test.ts`) |
| R12.3 deterministic, offline | `tests/setup/offline.ts` stubs `fetch`, XHR, WebSocket, EventSource; seeds printed by fast-check; two consecutive runs recorded in `desktop-foundation-coverage-and-gaps.md` |
| R13.1 to R13.5, R13.8 E2E foundation | `playwright.config.ts`, `tests/e2e/**` (one worker, no retries, isolated user data, teardown on failure, no fixed sleeps in assertions) |
| R15.3 log hygiene | `logger.test.ts` [c]; E crash test checks the log has no path or stack; navigation log has no URL (wiring test) |
| R16.1 platform branches | `platform-policy.test.ts`, `app-menu.test.ts` [c] |
| R16.2 platform path APIs | `resolve-app-path.test.ts` [c] (posix and win32); `resolve-app-path.property.test.ts` [c] |

## No automated test (process or review)

R1.x (toolchain, lockfile), R11.x (script policy, README), R14.x (lint config exists; behavior covered by lint-rules),
R15.2, R15.5, R15.6, R16.3, R16.4, R16.5 to R16.7, R17.x. R4.8 is partial (see above). N3 from the design
(R4.8 partial) stands.

## Defects found this block

0001 coverage gate on `resolve-app-path.ts`; 0002 R8.5; 0003 R8.8; 0004 R8.9. Reports are in `docs/testing/defects/`.
