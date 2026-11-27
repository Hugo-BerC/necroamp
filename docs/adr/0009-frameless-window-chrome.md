# ADR 0009: Frameless window chrome and window controls bridge
- Status: Accepted provisionally under the user's autonomous engineering authorization, subject to human review of the PR. No human approval has been given. Resolves open decision 16 (window chrome, single window) pending human confirmation: **needs human decision** for final closure. Implements the `frameless` profile anticipated in `src/main/window/chrome-profile.ts`.
- Related: ADR 0005, ADR 0007, `tech.md` "Electron architecture and security", `product.md` "Skin engine".

## Context
Skins must control window decoration. Electron fixes `frame` at window creation. Recreating the window on a skin switch would destroy the renderer and the Audio Engine, which the milestone forbids. The native menu bar is not shown on a frameless window on Windows and Linux, but `File > Open` must stay reachable.

## Options
| Option | Correctness | Simplicity | Reversibility | Notes |
|---|---|---|---|---|
| A. Always frameless. The renderer draws a title bar (a trusted component styled by the skin) with minimize, maximize and close, plus an in-app menu bar on Windows and Linux. macOS keeps native traffic lights. | Lets every skin own its decoration, no window recreation | Medium | High (profile switch in one function) | Loses Windows 11 snap-layout flyout. |
| B. Native frame always, skins decorate the client area only | Simple, robust | Simple | High | Two skins share the OS title bar, weak identity. |
| C. `titleBarStyle: 'hidden'` plus `titleBarOverlay` | Keeps native buttons and snap layouts | Simple | High | Buttons are only color-adjustable, not artistic. |
| D. Recreate the window per skin | Per-skin frame | Complex | Low | Destroys audio state. Rejected. |

## Decision
1. **Option A.** One `BrowserWindow`, all skins, including Foundation. Windows and Linux: `frame: false`. macOS: `titleBarStyle: 'hidden'` with the native traffic lights kept (the skin reserves a fixed inset and hides its own window buttons). `buildWebPreferences()` is untouched: `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webSecurity` stay as today.
2. **Trusted title bar.** `WindowChrome` (renderer, not skin code) renders the drag region (`-webkit-app-region: drag`; every interactive child is `no-drag`), the title text (kept in the accessibility tree even when visually hidden), the window buttons and, on Windows and Linux, a `role="menubar"` with File and View. Its look comes from `window.titleBar` and the named button style. It exists even if skin loading fails (Foundation values).
3. **Menu continuity.** The native application menu stays installed (accelerators `CommandOrControl+O` and others, and macOS menu bar). Its View menu always exists and gains a `Skin` submenu of radio items plus `Skins…`. The in-app menu bar offers the same commands with the same renderer handlers, so File menu behavior is available without a visible native bar. Accelerator delivery on a frameless window is verified by E2E (assumption); if it fails, the renderer registers equivalent key handlers (task fallback).
4. **Window controls IPC.** Channels `window:minimize`, `window:toggle-maximize`, `window:close` (no arguments, response `{ applied: true }`), `window:get-state`, and push event `window:state-changed` (`{ maximized, fullScreen, focused }`). Handlers use `registerHandler` (sender validation, Zod) and act only on the main window found from the validated sender, never on an id from the payload. No position or size arguments cross the bridge. Dragging and resizing are native (CSS drag region and the OS resize border).
5. **Per-skin window constraints.** Main applies `window.minSize` (clamped to 560 by 360 up to 1000 by 700) with `setMinimumSize` on every skin change. If the window is neither maximized nor full screen, it is enlarged to the skin's minimum when smaller. `preferredSize` is applied only as the initial size at startup. Foundation keeps the existing 800 by 600 minimum (Foundation R8.11). The skin cannot request size or position by itself, only the validated range through its manifest.
6. **Security.** The bridge exposes four actions and one subscription, no `BrowserWindow` object, no arbitrary options. Navigation guards, `window.open` denial and permission handlers are unchanged.

## Consequences
- Every skin can have its own decoration and Foundation stays reliable (trusted title bar, no skin assets needed).
- Windows 11 snap layouts on hover over the maximize button are lost. Win+Arrow snapping and edge snapping still work with a resizable frameless window. Accepted trade-off.
- Linux and macOS behavior of frameless windows is not verified on this Windows host. Recorded as a limitation.
- A change to the native frame later is a one-function profile change (`buildWindowOptions`).
