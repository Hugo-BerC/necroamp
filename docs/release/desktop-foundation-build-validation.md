# Desktop Foundation build validation (T7.5)

Scope: consolidation of evidence that exists in this repository, plus the build facts re-checked on this tree. Host: Windows x64, PowerShell 7, Node 24.22.3, pnpm 10.34.9, Electron 45.5.0, electron-vite (Vite 7.3.8). Branch `feature/desktop-foundation`. No installer, packaging or electron-builder step was run (none exists). macOS and Linux are NOT VERIFIED.

## Commands and results

| Command | Exit | Result |
|---|---|---|
| `pnpm.cmd build` | 0 | Run twice in Block C (once before and once after the bounded `pnpm dev` run, which overwrites `out/main` and `out/preload` with development builds). |
| `pnpm.cmd test:e2e` | 0 | 35 passed (about 1.9 min, 1 worker), run against the rebuilt `out/`. |
| `pnpm.cmd typecheck`, `lint`, `format:check`, `test`, `test:coverage` | 0 | 768 passed, 2 skipped. Coverage 99.44 / 98.23 / 100 / 99.78. |

## Output layout (`out/`, git-ignored)

| File | Bytes |
|---|---|
| `out/main/index.js` | 24407 |
| `out/preload/index.js` | 175282 |
| `out/renderer/index.html` | 799 |
| `out/renderer/assets/index-DEsaqZMb.css` | 10780 |
| `out/renderer/assets/index-Dsw4fJRS.js` | 838685 |

## Checks required by T7.5

- **Preload is one CommonJS file.** `out/preload/index.js` starts with `"use strict"; const electron = require("electron");` and has no `import` or `export` lines. Zod is bundled (`externalizeDeps: false`). The sandboxed preload loads at runtime: the E2E suite reads the bridge status "Connected".
- **Meta CSP in built HTML.** `out/renderer/index.html` carries `<meta http-equiv="Content-Security-Policy">` with `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'`. No `unsafe-inline` and no `unsafe-eval`.
- **No inline script.** The only script is `<script type="module" crossorigin src="./assets/index-Dsw4fJRS.js">`. Module script loading under `app://renderer` is proven by the E2E run (F-8 runtime item closed on Windows).
- **No source maps.** 0 `.map` files under `out/`.
- **No axe text in `out/`.** 0 matches for `axe-core` in all files under `out/` (E1).
- **esbuild works in the real build** (T7.5 validation note): the build exits 0 and produces the three outputs.

## Runtime evidence

- Electron 45.5.0 launched the built app from `out/main/index.js` in 35 Playwright tests: title, tagline, six regions, live web preferences, `require`, `process`, `Buffer` and `ipcRenderer` undefined in the renderer, effective CSP, blocked inline script and remote fetch, navigation and `window.open` blocking, permission denial, second-instance and quit behavior, layout at 800x600 and 1920x1080, tab order, and an axe scan with zero serious or critical violations.
- `electron-vite preview` on the production build opened a `NecroAmp` window in Blocks A and B.
- Screenshot: `docs/engineering/screenshots/m7-preview-production-shell.png` (SHA-256 `C1EFE7C772A168F077C6EF3B2CFC4B1F60FC08AAD5176C1FDC8FF93DC0A9A2A6`). It shows the shell with header, six regions, "Application bridge Connected", Platform Windows, Version 0.0.0. It was captured during the Block B preview run (file time 2026-11-26 14:38). The capture command is not recorded and this document does not claim one.

## Limitations

- Windows x64 only. macOS and Linux builds and runs are NOT VERIFIED (R16.3).
- Two real-symlink containment tests are skipped on this host (no symlink privilege).
- Not covered here: Electron Fuses, ASAR integrity, `realpath` against an ASAR layout, installers and signing (finding F-7, deferred with packaging). `out/main/index.js` includes the application menu role `toggleDevTools`; whether it is reachable in a packaged build was not assessed.
- No CI workflow exists in the repository, so no CI build result exists.
