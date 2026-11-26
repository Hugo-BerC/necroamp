# Renderer architecture note (Desktop Foundation M4 and M5)

Status: addendum to `.kiro/specs/desktop-foundation/design.md` sections 1, 7 and 8. It fixes details for implementers and changes no accepted decision. If this note and the design disagree, the design wins and this note is corrected. Authorities: `tech.md`, `structure.md`, `product.md`, ADR 0002 (E-ESM-1), ADR 0003 (CSP), ADR 0005 (IPC), `docs/architecture/contract-changes.md`. Owner of the code: frontend-engineer (`src/renderer/**`). The architect owns this note. Scope: placeholders only. No playback, audio, skin loading or GitHub logic.

## 1. Fixed constraints

- **Module format (E-ESM-1).** All TypeScript source is ESM. Renderer output stays ESM. Main and the sandboxed preload outputs may be CommonJS. Config files that are ESM use `.mjs`. `package.json` has no `"type": "module"`. Nothing in the renderer work changes this.
- **Security flags.** `sandbox`, `contextIsolation` and `webSecurity` are never disabled, in any mode, to make the renderer easier to build or test.
- **CSP.** Production CSP is `style-src 'self'; script-src 'self'` with no inline anything (ADR 0003, design 3.4). Therefore: no `style` prop, no inline `<style>`, no `@import`, no `data:` URLs, no remote URL. Dynamic values are written with `element.style.setProperty('--na-*', value)` from a hook.
- **Process boundary.** The renderer imports `@shared/*` and `@renderer/*` only. No `electron`, no Node built-ins, no `@main/*`. Only `app/bridge/necroamp-client.ts` reads `window.necroamp`.

## 2. Entry and shell

| File | Rule |
|---|---|
| `src/renderer/index.html` | `lang="en"`, `<title>NecroAmp</title>`, `<div id="root">`, one module script. No meta CSP in source (the build plugin injects it). |
| `src/renderer/main.tsx` | Creates the client, creates the store, mounts `AppShell`. Imports `global.css` once, after T5.2 exists. |
| `src/renderer/env.d.ts` | Types `window.necroamp` as `NecroampApi | undefined` (undefined supports the "bridge missing" state, R8.10). |
| `app/app-shell.tsx` | Header (one `h1` "NecroAmp", tagline `Code. Listen. Repeat.`, app-info and status indicators), `main` with one `RegionFrame` per layout entry. Maps `RegionId` to its region container through a `Record<RegionId, ComponentType>`. No plug-in registry (YAGNI). |
| `app/shell-layout.ts` | `REGION_IDS`, `FOUNDATION_LAYOUT` (section 6). Pure data, no React. |

## 3. Regions

The six region ids in design section 7 are the stable contract and do not change in M4. The requested UI areas map to them as follows. No new region id is added.

| UI area | Where it lives | Notes |
|---|---|---|
| Now Playing | `player` region, `data-part="now-playing"` | Placeholder title, artist and time text from `strings/en.ts`. |
| Transport controls | `player` region, `data-part="transport"` | `ControlButton` list from `usePlayerControls()`: previous, play, pause, stop, next. `aria-disabled`, focusable, visible "Not implemented in this phase" text. Activation only updates `StatusText`. |
| Playlist | `playlist` region | Placeholder list and empty state. |
| Ten-band Equalizer | `equalizer` region | Ten `role="group"` bands "Band 1" to "Band 10", non-interactive placeholders, `data-part="eq-band"`. |
| Spectrum / Waveform visualizer | `visualization` region | Two labelled placeholder panes, `data-part="spectrum"` and `data-part="waveform"`. No canvas loop, no `requestAnimationFrame`, no `AudioContext` (R8.4, R8.7). |
| Skin selection | `skin-selector` region | Placeholder only. No skin is listed or loaded. |
| GitHub | `github` region | Placeholder, labelled optional. Required by the existing six-region design. |
| App info | Shell header, `data-part="app-info"` | Name, version and platform from the app-info store. |
| Status indicators | Shell header or footer, `StatusText` with `role="status"` | Bridge state (`loading`, `loaded`, `failed`, `unavailable`) and placeholder-activation messages. |

## 4. Bridge adapter and store

- **Adapter** `app/bridge/necroamp-client.ts`: `createNecroampClient(win)` returns `{ getAppInfo(): Promise<ClientResult<AppInfo>> }`. It checks that `win.necroamp?.app?.getInfo` exists (otherwise returns `{ ok: false, reason: 'unavailable' }`), awaits the call inside `try/catch`, and parses the unknown value with `appInfoResponseSchema` from `@shared/ipc`. A rejection, a parse failure or `ok: false` becomes a typed failure. Messages shown to the user come from `strings/en.ts`. The adapter never logs payloads, never throws, never re-exports the raw bridge, and takes the window object as a parameter so tests use a fake.
- **Store** `stores/app-info-store.ts`: `createAppInfoStore(client)` returns a Zustand store with `{ status: 'idle' | 'loading' | 'loaded' | 'failed' | 'unavailable', data?: AppInfo }` and `load()`. `unavailable` is added to the design's four states to implement R8.10 without a second store. It imports `@shared/*` types only. No audio, playlist or skin state exists in this phase.
- **Hook** `useAppInfo` in `app/` binds the real client and calls `load()` once on mount. No global singleton store is created at module load, so tests inject a fake client.

## 5. Separation of concerns

| Layer | Files | May import | Must not |
|---|---|---|---|
| Behavior | `use-<name>.ts` | React, `@shared/*`, stores through selectors | JSX, CSS, `window.necroamp`, Electron |
| State | `stores/*.ts` | `zustand`, `@shared/*`, client type | React components, DOM |
| Privileged operations | Main only. Reached from the renderer through `necroamp-client.ts` | n/a | Any direct filesystem, network or shell access from the renderer |
| Container | `<name>-region.tsx` | Hook, store selectors, view | Styling decisions |
| Presentation | `<name>-view.tsx`, `*.module.css`, `components/*` | Props, `strings/en.ts`, own CSS Module | Stores, bridge, `style` prop, literal colors |

Feature folders import no other feature's internals. They share through `stores/`, `components/` or `@shared/*`. A feature exposes only `index.ts`.

## 6. RegionFrame and layout descriptors

- **`RegionFrame`** (`components/region-frame`): presentational. Props: `id: RegionId`, `titleId`, `heading`, `children`. Renders `<section aria-labelledby>` with an `h2`, `data-testid={id}`, `data-region={id}` and `data-part` slots `frame`, `heading`, `body`. It owns no layout position and no color. Every region view renders inside it, so a skin can later restyle or replace the frame in one place.
- **Layout descriptor** in `app/shell-layout.ts`, design level:

```ts
type RegionId = 'player' | 'playlist' | 'equalizer' | 'visualization' | 'skin-selector' | 'github';
interface LayoutDescriptor {
  readonly id: string;                       // layout id, kebab-case
  readonly order: readonly RegionId[];       // DOM and tab order
  readonly areas: Readonly<Record<RegionId, string>>; // CSS grid-area names
}
const FOUNDATION_LAYOUT: LayoutDescriptor;   // the only approved descriptor in this phase
```

  Rules. `order` is the DOM order and must equal the reading and tab order. Area names are written to CSS through the CSS Module, not through inline style. The descriptor holds no pixel values, no colors and no asset paths. Only `FOUNDATION_LAYOUT` is approved. Adding a second descriptor needs a design change. Region ids and `data-part` names are a public contract for the Skin Engine and are not renamed by M5 (T5 acceptance 3).

## 7. Styling

- **CSS Modules** for component rules. **Global CSS** (`global.css`) only for reset and base typography.
- **Tokens** in `app/styles/tokens.css` as CSS custom properties on `:root`, namespace `--na-`. Two tiers:
  1. *Semantic tokens* that components use: `--na-color-surface`, `--na-color-surface-raised`, `--na-color-text`, `--na-color-text-muted`, `--na-color-accent`, `--na-color-focus`, `--na-color-danger`, `--na-space-1..n`, `--na-font-family-ui`, `--na-font-size-*`, `--na-radius-*`, `--na-focus-ring`, `--na-border-width`.
  2. *Raw values* of the neutral foundation palette, referenced only by the semantic tokens.
  Component CSS references semantic tokens only, never raw values or literal colors. This is what lets a skin override the semantic layer at runtime.
- No Morgul Revenant palette value and no Analog 1984 look appears in foundation CSS (design 8).
- No animation in this phase. The first animation requires `prefers-reduced-motion` handling.
- Layout uses named grid areas, `min-width: 0`, `overflow-wrap: anywhere`, valid at 800x600 and 1920x1080.
- Contrast: `app/theme/contrast.ts` plus a test over token pairs (text 4.5:1, large text and focus 3:1).

## 8. Skin-engine compatibility

Rule: a skin is declarative data and never executable (`product.md` principle 5, `tech.md` skin rules). The foundation builds no skin code. It keeps these seams so a later skin can supply each item as data.

| Skin capability | Seam kept now | Delivered later by |
|---|---|---|
| Custom backgrounds, textures, frames | Semantic surface tokens, `RegionFrame` `data-part` slots, no hardcoded surfaces | Skin manifest assets served through a confined skin protocol root, with CSP `img-src` extended by a design change |
| Typography | `--na-font-family-*` and size tokens | Skin fonts through `@font-face` from the skin root, with `font-src` extended by a design change |
| Graphical controls (knobs, diamond sliders, switches) | Behavior hooks return plain props (value, min, max, onChange). Views are replaceable | Skin-selected control views chosen from a fixed, app-shipped set. A skin selects and parameterizes, it does not supply code |
| Control geometry and component positioning | `data-part` hooks, region ids, descriptor-based areas | A declarative layout schema in `src/shared/skins/**` (frontend-engineer, architect review) |
| Skin-dependent layouts | `LayoutDescriptor` separates which regions exist from where they go | Additional descriptors validated by Zod, `schemaVersion` required |
| Effects and animations | Presentation is CSS only, no per-frame JS in React | Declarative effect parameters mapped to CSS custom properties, with reduced-motion support |
| Custom window chrome | Main-side `ChromeProfile` union with only `native` now. The shell reserves an optional `data-part="titlebar"` | Frameless profile and window-control IPC through a new contract and ADR. Draggable regions come from CSS |

Constraints that stay in force: no skin script, no remote `url()`, no `@import`, path-traversal rejection, size and count limits, a license record per asset in `docs/assets.md`. None of this is built in M4 or M5.

## 9. Test and review hooks

- Component tests (co-located `*.test.tsx`) cover six regions, tagline, one `h1`, store states including `unavailable`, and placeholder activation updating `StatusText`. The adapter has unit tests with a fake window for: bridge missing, rejection, malformed value, `ok: false`, success. Property tests for the adapter parse (arbitrary unknown never throws) go to qa-engineer.
- Lint and source scan forbid: `style` prop, `window.necroamp` outside the adapter, `AudioContext`, `requestAnimationFrame`, literal channel names, imports across features.

## 10. Carry-forward items

These are recorded decisions with owners. None changes M4 or M5 scope.

| ID | Item | Owner | When |
|---|---|---|---|
| CF-1 | Add explicit main-frame identity validation to sender validation as defense in depth (S-1 of the focused review): require `frame === sender.mainFrame` in addition to the current checks. The current fail-closed sequence stays: non-null frame, `parent === null`, exact trusted origin, registered sender, any throw returns false. The new check is added to that sequence and never replaces an existing check. `WebContents.mainFrame` exists in Electron 45.5.0 typings (`docs/architecture/electron-api-verification.md` section 2.5), so it is compatible at type level. It is a code change to `src/main/security/sender-validation.ts` and the registration in `src/main/index.ts`, plus a unit test with `parent: null` but not `mainFrame` (expect false). Runtime behavior of `mainFrame` identity across reload and frame swap is not verified. It must pass under E2E before the check is called done, and if it rejects the legitimate main frame in any lifecycle case, stop and report instead of removing the check. | desktop-engineer, reviewed by security-reviewer. Contract note not required (no shared change). The ADR 0005 F-5 addendum is updated by necro-architect when done | Schedule before M7 so E2E covers it. Not part of M4 or M5. Needs human approval to schedule because it touches accepted M2/M3 code |
| CF-2 | Negative E2E tests for IPC from untrusted contexts: a sub-frame and a foreign-origin page must get no bridge result or `INVALID_SENDER`, and must never reach a handler. Because `frame-src 'none'` and the navigation guards block most constructions, the test drives what the app allows and records any construction that cannot be built as "blocked by CSP or guard". | qa-engineer (M7, T7.x), with desktop-engineer for any test hook. A test hook must not weaken production code | M7 |
| CF-3 | Keep backlog item F-3 (filesystem TOCTOU in the `app://` handler, Low, accepted temporarily) open in `docs/engineering/backlog.md`. Reassessment before the first public release is mandatory: accept permanently, implement a handle-based read, or adopt another serving mechanism (such as `protocol.registerSource`, which needs an ADR). The decision is recorded in an ADR or a security note. | desktop-engineer with security-reviewer. necro-architect writes the ADR if the serving mechanism changes | Before the first public release. Not in M4 or M5 |
