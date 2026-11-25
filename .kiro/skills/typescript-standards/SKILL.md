---
name: typescript-standards
description: "Use when writing or reviewing NecroAmp TypeScript and React code in any process: strict-mode typing, React component design, Zustand stores, module boundaries and dependency direction, shared contracts and Zod schemas, error handling, accessibility, rendering performance and maintainability."
license: MIT
metadata:
  owner: frontend-engineer
  schema: "1"
---

# TypeScript standards

## Scope

Coding procedures that apply `.kiro/steering/tech.md` ("Language and code rules"), `structure.md` ("Dependency direction", "Naming conventions") and `docs/engineering/shared-ownership-policy.md`. Those files are authoritative. This skill tells the author how to apply them and how to check the result.

Covered: strict typing, boundary validation, React component design, Zustand stores, module boundaries, shared contracts, error handling, accessibility, performance, maintainability.

Non-goals:
- Styling approach (open decision 8) and lint and formatter tool (open decision 9). Both need a human decision and an ADR. Follow whatever the repository has configured once decided. Do not choose here.
- Electron security details (electron-security), audio internals (audio-processing), test design (testing-strategy), GitHub logic (github-integration).
- Skin visual design (skin-development). This skill covers the code that consumes a skin.

Evidence labels: VERIFIED (read in this repository), DOCUMENTED (in fetched official docs), ASSUMED (neither). React, Zustand and Zod API behavior not named in steering is ASSUMED until checked in each library's own documentation. Do not pin versions.

## Procedures

### 1. Type at the boundary, trust inside
1. `strict: true`. No `any` without a comment that says why. Prefer `unknown`, then narrow.
2. Everything that enters from outside (IPC payloads, files, settings, skin manifests, GitHub responses, `JSON.parse`) is `unknown` until a Zod schema parses it.
3. Name schemas `fooSchema` and infer the type: `type Foo = z.infer<typeof fooSchema>`. Keep one source of truth, never a hand-written twin type.
4. Use discriminated unions for states and results. Handle all cases with an exhaustive check (a function taking `never`).
5. Use `readonly` and `as const` for constants and tables. Constants are `UPPER_SNAKE_CASE`.
6. Avoid type assertions (`as`). If one is unavoidable, comment the invariant that makes it safe.

### 2. Module boundaries
1. Follow the dependency direction in `structure.md`: renderer, preload and main import from `shared`. The renderer never imports main. `shared` imports nothing from Electron, DOM or Node-only APIs.
2. Feature folders under `renderer/features/` import from other features only through their public `index.ts`, or share through `stores/` and `shared`.
3. Put pure domain logic (playlist operations, equalizer mapping, metadata normalization, time formatting) in modules with no React, Electron or DOM imports. These are the units that need property tests.
4. Use the path aliases (`@shared/*`, `@main/*`, `@renderer/*`) once configured. No `../../../` chains.
5. Named exports. Default exports only where a tool requires them. Files in `kebab-case`, components in `PascalCase`.

### 3. Shared contracts
Follow `references/shared-contracts-and-errors.md`.
1. Check the owner of the `src/shared/` path before editing (`shared-ownership-policy.md` section 1). Edit only paths you own. Send changes for other paths to the owner.
2. Classify the change: ADR required, contract change note required, or additive. State the class in the hand-off.
3. Validation at the receiving process is still required when a schema is shared.
4. The skin manifest schema lives in `src/shared/skins/**` (frontend-engineer). It has an explicit `schemaVersion` and rejects unknown fields (`tech.md`). Consult art-director and security-reviewer on field changes.

### 4. React components
Follow `references/react-zustand-patterns.md`.
1. Components are small and presentational where possible. Data and side effects come from hooks or stores, not from inside layout code.
2. Props are typed explicitly, minimal and serializable where practical. Prefer composition (children, slots) over boolean flag explosions.
3. Effects: every subscription, timer, listener and `requestAnimationFrame` loop has cleanup. Prefer deriving values during render over effect-and-state.
4. Do not couple audio timing to React rendering (`tech.md`). Components display audio state and send commands. They do not drive timing.
5. Skin-dependent visuals read CSS custom properties or tokens, not skin files. Components must stay usable with any valid skin.
6. Error boundaries around feature roots so one failing feature does not blank the shell.

### 5. Zustand stores
1. One store per domain concern under `renderer/stores/` (player, playlist, equalizer, skin, github). No single global store.
2. Store state is plain serializable data plus actions. Derived values are selectors or pure functions, not stored copies.
3. Components subscribe through narrow selectors. Do not subscribe to the whole store.
4. Side effects (IPC calls, audio commands) live in actions or in a small service module, not in components.
5. High-frequency values (playback position, analyser data) do not go through React state. Read them from the audio layer on animation frames, or use a transient subscription pattern from Zustand's documentation (ASSUMED, confirm).
6. Reset functions exist for tests. Tests create fresh store instances or reset between cases.

### 6. Error handling
1. Expected failures (invalid file, rejected IPC call, offline) are values: a result union or a typed error with a `code`. Unexpected failures throw and are caught at boundaries (error boundary, IPC wrapper).
2. IPC results are typed unions from `src/shared`. The renderer maps them to user-facing text in one place.
3. Never swallow errors. Either handle with a user-visible state, rethrow, or log through the project logger with redaction.
4. Messages shown to users are plain English, contain no paths, tokens or stack traces.
5. Async code: every promise is awaited or explicitly handled. Cancellable work takes an `AbortSignal` or equivalent.

### 7. Accessibility
Follow `references/accessibility-checklist.md`.
1. Use native elements (`button`, `input`, `label`) before custom ones. Custom controls need a role, an accessible name, state attributes and keyboard handling.
2. Every control is reachable and operable by keyboard with a visible focus indicator that remains visible in every skin.
3. Sliders (volume, seek, equalizer bands) expose value, range and a text value.
4. Status changes (track change, errors, sign-in state) are announced through a polite live region.
5. Respect the user's reduced-motion setting for visualizations and animation.
6. Skins must not remove focus indicators or drop contrast below the readable minimum. The check is in the checklist.

### 8. Performance
1. Measure before optimizing. Use the browser performance tools and record the finding in the PR.
2. Keep render work off the hot path: narrow selectors, stable props, list virtualization for large playlists (ASSUMED: a virtualization approach will be needed above some size, decide with measurement and name the library only after evaluating its license).
3. Memoize only where a measurement shows benefit.
4. Visualizations use `requestAnimationFrame` and pause when the window is hidden (`tech.md`). No allocation in per-frame code where avoidable.
5. Lazy-load rarely used features (GitHub explorer, syntax highlighting) so startup stays small.

### 9. Maintainability
1. One responsibility per module. Split a file when it needs a section comment to be read.
2. Name things by domain meaning. Comments explain why, not what.
3. Delete dead code. No commented-out blocks.
4. New runtime dependency: justify it, check its license and record it in the PR description (`tech.md`). Do not add one to avoid ten lines of code.
5. Keep functions small enough to test without mocks. Inject clocks, random sources and IO.

## Recommended patterns

- Result type for expected failures: `{ ok: true, value } | { ok: false, error }`.
- Schema first: write the Zod schema, infer the type, write the pure function, then the UI.
- Container and presentational split for feature views.
- Command and state split for audio: UI sends commands to a service, UI reads state from a store.
- Custom hooks that wrap a store selector plus an action for one use case.
- Co-located tests: `*.test.ts(x)` next to the code. Property tests (`*.property.test.ts`) are written by qa-engineer.
- Small public `index.ts` per feature exporting only what others may use.

## Anti-patterns

- `any`, unchecked `as` casts, `// @ts-ignore` without a reason.
- Trusting IPC, file or network data without a schema parse.
- Hand-written types that duplicate a Zod schema.
- Importing another feature's internal files, or main-process code from the renderer.
- Electron, DOM or Node imports in `src/shared`.
- Whole-store subscriptions, derived data stored as state, global mutable singletons.
- High-frequency audio data in React state.
- Effects without cleanup, effects that only copy props to state.
- Swallowed errors, `catch {}` with no handling, errors shown with raw messages.
- `div` with click handlers instead of buttons. Removing focus outlines.
- Premature memoization, unmeasured optimization.
- Deep relative imports and default exports without a tool requirement.
- Rendering GitHub or skin supplied HTML with `dangerouslySetInnerHTML` without the sanitization required by `tech.md`.

## Security considerations

- The renderer is untrusted. Never put secrets, tokens or privileged paths in renderer state.
- Avoid `dangerouslySetInnerHTML`. When rendering sanitized Markdown is required, pass only the output of the project's sanitizer and test it with hostile input (`tech.md`).
- Do not build URLs, file paths or CSS from untrusted strings by concatenation. Use typed parsers and validated tokens. Skin values reach CSS custom properties only after manifest validation.
- No `eval`, `new Function` or dynamic script loading (CSP forbids it).
- Do not log payloads that may contain tokens or paths.
- Dependencies: prefer well-maintained and permissively licensed packages. Record each new one.

## Acceptance criteria

- `pnpm typecheck` passes with `strict: true` and no new unjustified `any` or `@ts-ignore`.
- Every external input in the change passes through a Zod schema before use.
- No import violates the dependency direction. Features import each other only through public `index.ts`.
- Pure logic added or changed has unit tests, and property tests are requested from qa-engineer for the areas listed in `tech.md` "Testing".
- Each new component is operable by keyboard, has accessible names, and a visible focus state.
- Stores use narrow selectors. Playback position and analyser data do not flow through React state.
- Every effect with a subscription or loop has cleanup.
- Expected failures are typed values and produce a user-visible, plain-English state.
- Contract changes carry the correct class (ADR, change note, additive) in the hand-off.

## Validation checklist

- [ ] `strict` typing, no unexplained `any`, assertions justified.
- [ ] External data parsed from `unknown` with Zod.
- [ ] Dependency direction and feature boundaries respected. Aliases used.
- [ ] `src/shared` edits only in owned paths. Change class recorded.
- [ ] Components small, typed, composable. Effects cleaned up.
- [ ] Stores sliced by concern. Narrow selectors. No derived state stored.
- [ ] Errors modeled as values, shown without sensitive data.
- [ ] Accessibility checklist applied, including a skin contrast and focus check.
- [ ] Performance claims backed by a measurement.
- [ ] New dependencies justified, license recorded.
- [ ] Open decisions 8 and 9 not decided here. "Needs human decision" noted if encountered.
- [ ] Changes outside your write scope are listed for the owning agent.

## References

- `references/react-zustand-patterns.md`: read when designing components, stores, effects or reviewing re-render behavior.
- `references/accessibility-checklist.md`: read when building controls, sliders, lists or reviewing a skin's effect on usability.
- `references/shared-contracts-and-errors.md`: read when touching `src/shared/`, adding an IPC type, or defining an error shape.

Changes needed outside your write scope are listed for the owning agent, not made here.
