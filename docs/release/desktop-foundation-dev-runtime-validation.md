# Desktop Foundation: development runtime validation (T7.6)

Status: automated validation PASSED on Windows x64. T7.6 stays PENDING because the Spec requires a human-run `pnpm dev`. See "Pending confirmation".

## Environment

- Windows x64, Node v24.22.3, Electron 45.5.0 (CDP reports `Chrome/156.0.8078.109`), electron-vite 6.0.0, Vite 7.3.8.
- Base HEAD for the runs: 10dfc3f (HMR run on 11ce900, no source change in between).
- Command: `pnpm.cmd dev --remoteDebuggingPort 9333`, driven by `@playwright/test` 1.65.1 `chromium.connectOverCDP` from an inline `node -` script. No browser was downloaded and no script file was added to the repository.
- Each run had a hard timeout and ended with `taskkill /PID <pnpm pid> /T /F`.

## Startup and renderer

- Dev log: main built (`out/main/index.js`), preload built (`out/preload/index.js`), dev server on `http://localhost:5173/`, Electron started, DevTools listening on 9333.
- Page: title `NecroAmp`, tagline `Code. Listen. Repeat.`, `[data-part="app-version"]` = `0.0.0`, `window.necroamp` is an object (preload bridge present).
- Page errors: none in any run (including the HMR run).
- A first run logged `window.load_failed` because the harness reloaded the page while the first `loadURL` was pending. The second run waited for the first load and logged nothing. This is a harness effect.

## Console output (after reload)

| type | text |
|---|---|
| debug | `[vite] connecting...` |
| debug | `[vite] connected.` |
| info | React DevTools download hint |

An error-level line appeared only when the probe in "style-src decision" added a stricter policy on purpose.

## Effective dev CSP

`default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src http://localhost:5173 ws://localhost:5173; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'`

## CSP violations

One report after reload: `script-src blocked=eval` from `node_modules/.vite/deps/zod.js` (zod's eval capability check). zod catches the block and falls back. No page error followed. The policy has no `unsafe-eval` and keeps none.

## script-src decision: keep `'unsafe-inline'` in dev

The served dev `index.html` contains an inline module script (the React refresh preamble: `import { injectIntoGlobalHook } from "/@react-refresh"; ...`). No safer working alternative was found, so the allowance stays.

## style-src decision: keep `'unsafe-inline'` in dev

In dev, Vite injects CSS as `<style>` elements (twelve observed). A probe called Vite's `updateStyle()`: under the dev policy the rule applied (`outlineStyle` = `dashed`). After adding a `style-src 'self'` meta policy the same call was blocked (`outlineStyle` = `none`, `style-src-elem` violation). The allowance is demonstrably required, so nothing was removed. Vite's `html.cspNonce` is a possible alternative that was not tested.

## Production CSP

`pnpm.cmd build` after the dev runs exited 0 (main 24.41 kB, preload 175.28 kB, renderer js 838.69 kB, css 10.78 kB). The meta CSP in `out/renderer/index.html` has no `unsafe-inline` (0 matches) and `connect-src 'none'`. No CSP or source code was changed.

## HMR (reversible probe, PASSED)

Procedure: wait for `[data-part="shell"]` and the first load, set `window.__hmrMarker = 'alive'`, edit, observe, restore both files byte for byte.

| Step | Result |
|---|---|
| Baseline | tagline `Code. Listen. Repeat.`, shell `paddingTop` `8px` |
| Edit `src/renderer/app/strings/en.ts` tagline to `HMR-TEMP-PROBE` | tagline became `HMR-TEMP-PROBE`, marker still `alive` (no full reload) |
| Edit `src/renderer/app/app-shell.module.css` first `.shell` padding to `37px` | `paddingTop` became `37px`, marker still `alive` |
| Restore both files | tagline `Code. Listen. Repeat.`, `paddingTop` `8px`, marker `alive` |
| Page errors | none |

After the run, `git status --short` was empty and `git diff --quiet -- src/renderer` exited 0, so the probe left no residue.

## Process cleanup

After the HMR run (checked again after 25 s, because the process tree takes a few seconds to exit): 0 `node` or `electron` processes, 0 listeners on ports 5173 and 9333. `pnpm dev` rewrites `out/main` and `out/preload`, so `pnpm.cmd build` was run afterwards (exit 0).

## Commands

- Run: `pnpm.cmd dev --remoteDebuggingPort 9333` (twice for the HMR run, as the first run's output was lost), `pnpm.cmd build` (exit 0).
- Reused: no code or configuration changed, so the Block C results stand (typecheck, lint, format:check, test 768 passed and 2 skipped, test:coverage, test:e2e 35 passed, licenses).

## Limitations

- Windows x64 only. macOS and Linux NOT VERIFIED.
- No human observed the window or its visual state. Window presence is inferred from CDP (title, DOM, bridge).
- Console messages from the very first load, before the harness attached, were not captured. Coverage starts at the reload.

## Pending confirmation

The T7.6 task text says a human runs `pnpm dev`, confirms the window appears, and closes it. One confirmation closes T7.6 and then T7.7: the human runs `pnpm.cmd dev`, sees the NecroAmp window, and closes it, or explicitly accepts this automated run in place of that step.
