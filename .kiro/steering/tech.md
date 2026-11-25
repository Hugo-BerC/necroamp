---
inclusion: always
---

# NecroAmp: Technology Stack and Engineering Rules

Only Node.js 24 LTS and pnpm 10 are fixed. Electron and every other library version are not yet chosen. Resolve the latest stable release when the project is scaffolded, record it in `package.json`, and never guess a version number from memory.

## Stack

| Concern | Choice |
|---|---|
| Shell | Electron |
| Build tooling | electron-vite |
| Language | TypeScript, `strict: true` |
| UI | React |
| State | Zustand |
| Audio | Web Audio API, AudioWorklet for custom DSP and analysis |
| GitHub API | Octokit |
| Runtime validation | Zod |
| Syntax highlighting | Shiki |
| Unit tests | Vitest |
| Property-based tests | fast-check |
| End-to-end tests | Playwright (Electron mode) |
| Packaging | Electron Builder |
| CI/CD | GitHub Actions |
| Node.js | 24 LTS (declare in `engines` and `.nvmrc`) |
| Package manager | pnpm 10 (declare via `packageManager`) |

## Language and code rules

- TypeScript strict mode, no `any` without a justifying comment. Prefer `unknown` plus Zod parsing at boundaries.
- ES modules everywhere. Named exports; avoid default exports except where a tool requires them.
- Pure logic (equalizer math, skin parsing, playlist operations, metadata normalization) lives in framework-free modules so it can be unit and property tested.
- English identifiers, comments and docs.
- Dependencies: add only when needed, prefer well-maintained and permissively licensed packages. Record any new runtime dependency and its license in the PR description.

## Electron architecture and security (mandatory)

- Three process boundaries: **main** (privileged, owns filesystem, dialogs, GitHub token, network), **preload** (minimal bridge), **renderer** (untrusted UI).
- Renderer settings: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`. Never disable them.
- IPC:
  - Expose a narrow, typed API via `contextBridge`. Never expose `ipcRenderer` or generic channel senders.
  - Channel names are constants defined in the shared package.
  - Every payload crossing IPC is validated with a Zod schema in the receiving process. Validate senders (`event.senderFrame`) for privileged handlers.
- Content Security Policy: strict, no `unsafe-eval`, no remote scripts. Network access from the renderer is denied by default; GitHub calls happen in main.
- Block unexpected navigation and `window.open`; open external links only through an allow-listed `shell.openExternal` wrapper limited to `https:`.
- Enable Electron Fuses appropriate for production builds (for example disable `RunAsNode`, enable ASAR integrity where supported).
- Filesystem access is mediated by main. The renderer receives file handles or URLs through a controlled custom protocol, never raw arbitrary paths from untrusted input.
- GitHub tokens are stored only in the OS credential store via Electron `safeStorage` (or equivalent), never in plain text, logs or renderer memory longer than needed.
- Render GitHub-sourced content (README, source) as inert content. Sanitize Markdown HTML; never inject remote HTML unsanitized.

## Audio engineering rules

- Signal graph: source -> 10 band `BiquadFilterNode` chain (peaking, with low and high shelf at the ends) -> gain -> `AnalyserNode` -> destination. Custom processing goes in an `AudioWorkletProcessor`.
- Never allocate or log inside `process()`. Exchange data with the main thread through `MessagePort` or `SharedArrayBuffer` only if cross-origin isolation is configured.
- Playback must survive UI stalls. Do not couple audio timing to React render cycles.
- Visualizations read from `AnalyserNode` or worklet output on `requestAnimationFrame`, and pause when the window is hidden.
- Target formats: MP3, WAV, FLAC, OGG. Verify decoding support per platform in tests before promising a format.

## Skin engine rules

- A skin is a directory or archive containing a **declarative manifest** (JSON, validated by a Zod schema with an explicit `schemaVersion`) plus static assets (images, fonts, optional sounds).
- Skins contain **no executable code**: no JS, no HTML with scripts, no arbitrary CSS `url()` to remote hosts, no `@import`. Loaders reject unknown fields and path traversal (`..`, absolute paths, symlinks leaving the skin root).
- Enforce size and count limits on skin assets.
- Skin tokens (colors, fonts, spacing) map to CSS custom properties; layouts are described declaratively.
- Bundled skins live in the repository with a license record per asset.

## Testing

- Vitest for unit and component tests; coverage on pure logic is expected.
- fast-check property tests are required for: equalizer parameter mapping and clamping, skin manifest validation (arbitrary input never throws unhandled and never allows path escape), playlist operations (reorder, insert, remove invariants), metadata normalization and time formatting.
- Playwright drives the packaged or built Electron app for smoke tests (launch, load file, play, change skin).
- GitHub calls are tested against recorded or mocked responses. Tests must never need a real token or network.
- Tests must be deterministic and runnable offline.

## CI/CD

- GitHub Actions on Windows, macOS and Linux runners: install with `pnpm install --frozen-lockfile`, typecheck, lint, test, build.
- Release workflow builds installers with Electron Builder on tagged commits.
- Pin third-party Actions by full commit SHA. Use least-privilege `permissions:` per workflow. No secrets in logs.
- No AWS or other cloud infrastructure. Do not introduce deployment targets beyond GitHub Releases.

## Commands (valid after scaffolding)

Use `pnpm` only. Do not use npm or yarn. Standard scripts to provide: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `package`.

## Environment notes

- Development host observed: Windows with PowerShell. Node.js and pnpm were not found on PATH during the genesis session. Install them before scaffolding. Do not assume POSIX shell syntax in documented commands; prefer cross-platform scripts.

## Unresolved decisions

Tracked in `structure.md` under "Open decisions". Do not silently decide these; raise them with the user.
