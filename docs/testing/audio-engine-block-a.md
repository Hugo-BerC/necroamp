# Audio Engine Block A: test report, defects and gaps

Owner: qa-engineer. Host: Windows (win32), Node 24.22.3, pnpm 10.34.9, Electron 45.5.0.
Scope: core playback (open, play, pause, stop, seek, time, volume, mute, error handling, media access, IPC).

## Automated playback verification versus human listening

The E2E suite proves that the production build loads a user-selected file through `media://track/<token>`,
that the media element reports a duration, that `currentTime` advances while playing, freezes while paused,
returns to 0 on stop and follows the seek slider, and that volume and mute reach the element.
It does **not** prove that sound is audible or correct. Human listening (tasks.md H.2) has not been done
by any agent and remains open.

## Tests added

| Area | File |
|---|---|
| Synthetic fixtures (generated at run time) | `tests/fixtures/audio/generate-audio.ts`, `tests/fixtures/audio/README.md` |
| Fixture structure and determinism | `tests/audio/fixtures.test.ts` |
| Time formatting properties (fast-check) | `src/shared/audio/time-format.property.test.ts` |
| Playback state invariants (fast-check) | `src/shared/audio/playback-state.property.test.ts` |
| Defect D-A4 pin (`it.fails`) | `src/shared/audio/playback-state.duration.property.test.ts` |
| Media access boundaries, real filesystem | `tests/integration/media-access.integration.test.ts` |
| IPC security for `library:open-files` | `tests/integration/library-ipc-security.integration.test.ts` |
| Resource cleanup, store and DOM engine | `tests/integration/player-cleanup.integration.test.tsx` |
| Playback E2E (WAV, FLAC, MP3, corrupt, unsupported, boundaries) | `tests/e2e/playback.spec.ts` |
| Scheme privilege regression guard | `tests/e2e/scheme-privileges.spec.ts` |

Foundation tests updated to the reviewed Block A contract, with no assertion removed:
`tests/integration/ipc-round-trip.integration.test.ts` and `shell-bridge.integration.test.tsx` (new required deps,
second channel), `tests/e2e/smoke-security.spec.ts` (frozen CSP oracle now `media-src media://track` and
`img-src 'self' media://art`; bridge keys `app`, `library`), `tests/e2e/lifecycle.spec.ts` (Tab order now
covers every enabled button and input, with the same 2px focus ring requirement). Coverage thresholds unchanged.

## Defects

### D-A1 (high) app:// loses its privileged-scheme registration. Owner: desktop-engineer
`src/main/index.ts` calls `registerAppScheme(protocol)` and then `registerMediaScheme(protocol)`. Each calls
`protocol.registerSchemesAsPrivileged`, which Electron allows once; the second call replaces the first.
Result in the live renderer: `window.isSecureContext === false` and `navigator.mediaDevices === undefined` on
`app://renderer`.
Reproduce: `pnpm build && pnpm exec playwright test tests/e2e/scheme-privileges.spec.ts` (fails), also
`smoke-security.spec.ts` "denies media and geolocation permission requests" (gets `TypeError` instead of
`NotAllowedError`). Fix direction: register both schemes in a single `registerSchemesAsPrivileged` call.

### D-A2 (medium) Serious axe violation and extra Tab stops after the player grew. Owner: frontend-engineer
`scrollable-region-focusable` (serious) on `section[aria-labelledby="equalizer-heading"] > div[data-part="body"]`.
Tab now also lands on two scrollable `div[data-part="body"]` elements. Main passed this test, so the larger
player region (seek and volume rows) causes other regions to overflow at the default size.
Reproduce: `pnpm exec playwright test tests/e2e/a11y.spec.ts`.

### D-A3 (medium) Range inputs have a 1px focus ring. Owner: frontend-engineer
`player-view.module.css` styles `input[type='range']:focus-visible` with `--na-border-width` (1px); every other
control uses the 2px focus ring the Foundation requires.
Reproduce: `pnpm exec playwright test tests/e2e/lifecycle.spec.ts -g "Tab visits"` (Expected "2px", Received "1px"
on `#player-volume`).

### D-A4 (low) A shorter duration does not re-clamp the position. Owner: audio-engineer
`reducePlayback` `loaded` updates `durationSec` but leaves `positionSec` above it (load, loaded null, play,
tick 50, loaded 10 gives position 50, duration 10). Pinned by `playback-state.duration.property.test.ts` with
`it.fails`; switch it to `it` when fixed.

### D-A5 (low) Store status is not reconciled with element pause/play events. Owner: audio-engineer
The engine does not forward the element's `pause`, `play` or `playing` events. When `play()` rejects with
anything other than `NotSupportedError` (for example `NotAllowedError`), or when the element pauses by itself,
the store stays `playing` while the element is paused, so the Pause control is offered and Play is not.
Reproduce: in `player-store.test.ts`, make `play` reject with `new DOMException('x', 'NotAllowedError')`, call
`open()`, and read `playback.status`: it is `playing`.

### D-A6 (low) CSP grants `img-src media://art` before anything serves it. Owner: desktop-engineer
Block A rejects every `media://art` request, so the allowance is unused. Narrow it to Block B, when artwork
is served, or record the decision in ADR 0006.

## Gaps

- OGG: no decodable Vorbis or Opus fixture (no offline encoder). OGG playback is unverified; only the
  rejection of a container-only `.ogg` is tested.
- MP3 fixture is silent: demux and decode are verified, signal content is not.
- Symlink escape tests (`media-access.integration.test.ts`) were skipped on this Windows host because
  creating symlinks needs a privilege. They must run on Linux and macOS CI.
- Only Windows was run. macOS and Linux E2E, and per-platform codec availability, are not verified.
- No visual snapshot was added for the live player (the UI will change with skins).
- Seeking into the middle of a long file over HTTP ranges is covered at the protocol level (206 bodies) and
  with a 3 s WAV in E2E, not with a large compressed file.
