# React and Zustand patterns

Rules: `.kiro/steering/tech.md` (React, Zustand, audio not coupled to render cycles) and `structure.md` (`renderer/stores/`, `renderer/features/`, naming). Library behavior beyond that is ASSUMED. Confirm in each library's own documentation, and do not pin versions here.

## Store layout

| Store | Holds | Does not hold |
|---|---|---|
| player | Transport state (stopped, playing, paused), current track ID, volume, repeat and shuffle mode | Playback position per frame, audio nodes |
| playlist | Ordered track IDs, selection, saved list metadata | File contents, decoded audio |
| equalizer | Band gains, preset name, enabled flag | Filter nodes |
| skin | Active skin ID, validated tokens, load status | Raw files |
| github | Signed-in state, display name, rate-limit state, cached view models | Tokens (never in the renderer) |

Each store lives in `renderer/stores/`, one file per domain, kebab-case names. A store module exports the hook and a reset helper for tests.

## Store shape

```
state:   plain data only (serializable)
actions: functions that call services, then set state
```

- Actions call a service (audio service, IPC client) and update state with the result. Components never call IPC directly.
- Derived values are selectors: pure functions of state, kept next to the store and unit tested.
- Persisted preferences (volume, equalizer, active skin) go through the settings IPC channel owned by desktop-engineer, not through renderer storage. Settings schema rules: `shared-ownership-policy.md`.

## Selectors and subscriptions

- Subscribe to the smallest slice a component renders.
- Selectors that return new objects or arrays each call cause re-renders. Return primitives, or use a shallow comparison helper from the library's documentation (ASSUMED, confirm the name).
- For values that change many times per second, do not put them in a store. Options: read from the audio layer inside an animation-frame loop that writes to a canvas or a DOM node by reference; or use a transient subscription that does not trigger React renders (confirm in the Zustand documentation).

## Components

- Container components connect stores and services. Presentational components take props and render. Presentational components are what skins style.
- Props: explicit types, no `any`, no spreading unknown props onto DOM nodes without a filter.
- Prefer composition: `children` and named slot props over a long list of flags.
- Lists: stable keys from IDs, never array indexes for reorderable lists (playlist reordering).
- Large playlists need windowing. Measure first. Choose a library only after a license check (decision recorded in the PR).
- Forms and sliders are controlled where the value matters to state, and keep local state while the user drags. Commit on the proper event.

## Effects

| Situation | Pattern |
|---|---|
| Subscribe to an IPC event | Effect subscribes, returns the unsubscribe function from the preload API |
| Animation loop | Start in an effect, cancel the frame request on cleanup, skip frames when the document is hidden |
| Timer | Clear on cleanup. Prefer an injected clock in services |
| Derived data | Compute during render or in a selector. No effect plus state copy |
| One-time init | Service init at app shell level, not in a leaf component |

Strict development re-mounts may run effects twice. Cleanup must make that harmless (ASSUMED behavior of the React development mode, confirm in the React documentation).

## Error boundaries and loading states

- One error boundary per feature root, with a fallback that offers retry or dismiss.
- Every async view has explicit states: idle, loading, ready, empty, error. Model them as a discriminated union.
- Offline GitHub views show stale data with a label, not a blank screen.

## Testing hooks

- Components are tested through roles and visible text (see testing-strategy).
- Stores are tested without React: call actions, assert state.
- Services are injected (clock, IPC client, audio service) so tests use fakes.

## Review prompts

1. Which component re-renders on each playback tick? It should be none except a leaf that draws.
2. Does any store hold a value that can be derived?
3. Does every effect clean up?
4. Can this component work with a different skin without code changes?
