---
name: audio-processing
description: "Use when building or changing NecroAmp audio code: Web Audio graph, AudioContext lifecycle and autoplay resume, AudioWorklet processors, playback state, ten-band equalizer parameter mapping and clamping, AnalyserNode spectrum and waveform visualization, buffering, latency, gapless expectations, resource cleanup and audio performance. Also use when reviewing or testing audio behavior."
license: MIT
metadata:
  owner: audio-engineer
  schema: "1"
---

# Audio processing

Procedures for the NecroAmp audio engine. Mandatory rules live in `.kiro/steering/tech.md` ("Audio engineering rules", "Testing") and `product.md` (formats, quality attributes). This skill adds how to apply them and does not restate them.

## Scope

In scope: one `AudioContext`, the node graph, ten-band equalizer, gain staging, analyser feed, waveform data, AudioWorklet processors, playback state machine, cleanup, latency and performance checks, per-platform format verification.

Non-goals:
- Decode versus streaming and gapless policy: open decision 4 in `structure.md`. It needs a human decision and an ADR. This skill lists trade-offs and keeps the engine source-agnostic until then.
- React components and stores, file scanning, metadata, IPC (other owners).
- `*.property.test.ts` files (qa-engineer).

Code paths: `src/renderer/audio/**`, `src/shared/audio/**`, notes in `docs/audio/**`. Expose the engine through `src/renderer/audio/index.ts`.

## Procedures

### 1. Layer the code
1. Pure DSP and mapping in `src/shared/audio/**`: no DOM, React, Electron, filesystem or IPC imports. Plain numbers and typed arrays only.
2. Engine wrapper in `src/renderer/audio/**`: owns Web Audio nodes, exposes a small typed command API and a state subscription.
3. Worklet processor in its own module, emitted by the build as a same-origin URL. Confirm the electron-vite approach in its documentation before wiring.

### 2. Build the graph in the `tech.md` order
source -> ten-band chain (low shelf, eight peaking, high shelf) -> gain -> `AnalyserNode` -> destination. Create and connect nodes once at engine init. Track or EQ changes alter parameters or the source, never the topology. When a worklet node is added, record its position in the diagram in `docs/audio/`.

### 3. AudioContext lifecycle
1. Create lazily on a user gesture, or call `resume()` from a gesture handler. Do not assume it starts `running`.
2. Treat `state` as `suspended`, `running` or `closed`; listen to `statechange` and mirror it in engine state.
3. One context per engine. `close()` is terminal; build a new engine afterwards.
4. Re-check `state` on `statechange` and when the window becomes visible (sleep, device change). Record observed per-platform behavior before documenting it as fact.

### 4. Playback state machine
States: `idle`, `loading`, `ready`, `playing`, `paused`, `ended`, `error`. Implement as a pure reducer `(state, event) => state` in `src/shared/audio/` (transition table in the lifecycle reference).
- Only the engine mutates state. The UI sends commands and subscribes; it never drives timing.
- Position derives from the audio clock (`AudioContext.currentTime` or the media element time), never a UI timer or render count.
- Each async step (load, decode, resume) carries a token. Results from a superseded load are discarded.
- `error` carries a typed reason without file paths. Errors do not throw into the UI.

### 5. Source strategy (pending decision 4)
Hide the choice behind a `PlaybackSource` interface. Trade-offs, not a decision:
- Decoded `AudioBuffer`: precise seek and gapless scheduling; memory grows with duration (large FLAC is costly); decode delay before start.
- `HTMLMediaElement` + media element source node: streaming, low memory, fast start; one source node per element; gapless needs a preload design that must be tested.
- Either way, media reaches the renderer through the controlled custom protocol from main, never raw paths (`tech.md`, Electron section).

### 6. Ten-band equalizer
1. Keep the band table (center, type, default Q) as a frozen constant in `src/shared/audio/`. Types: first `lowshelf`, last `highshelf`, others `peaking`. Center frequencies are an ASSUMPTION until the owner confirms (see the DSP reference).
2. Pure `clampBandGain` that never returns a non-finite value and clamps to the documented range. The default -12 to +12 dB is an ASSUMPTION; confirm, document, enforce in one place.
3. Clamp frequency below Nyquist for the context sample rate and Q to a documented positive range.
4. Change each filter's `gain` `AudioParam` with short smoothing (for example `setTargetAtTime`); the time constant is a named constant.
5. Presets are data: ten numbers validated by the pure mapper. A preamp is its own gain stage, not an eleventh band.
6. Bypass by setting band gains to 0 dB, not by rewiring.

### 7. Gain staging
- One master `GainNode` after the EQ. A pure `volumeToGain` with a documented curve, clamped, smoothed.
- Maximum boost on all bands can clip. Document the headroom policy; add a limiter only after measurement.
- Mute is gain 0 with the previous value kept, not a disconnect.

### 8. AudioWorklet
1. Register with `audioContext.audioWorklet.addModule(url)` using a same-origin URL the CSP allows. Blob or data URLs only if the CSP review accepts them.
2. Implement `process(inputs, outputs, parameters)`; return `true` to stay alive. Render quanta are 128 frames; do not hard-code other sizes.
3. In `process()`: no allocation, no logging, no per-call closures or fresh objects. Preallocate typed arrays in the constructor.
4. Talk to the main thread through `MessagePort` with a small typed protocol (constant `type` strings, validated on receipt). `SharedArrayBuffer` only if cross-origin isolation is configured; it is not decided.
5. Expose audio-rate tunables as `parameterDescriptors`, not messages.
6. Keep the numeric core pure in `src/shared/audio/` and call it from `process()` so tests need no worklet scope.

### 9. Spectrum and waveform
1. One `AnalyserNode` after the gain. `fftSize` (power of two) and `smoothingTimeConstant` (0 to 1) come from named constants chosen by measurement.
2. Allocate read buffers once, sized from `frequencyBinCount` or `fftSize`; reuse each frame.
3. Read in a `requestAnimationFrame` loop owned by the visualizer. Cancel it when the document is hidden or on unmount; restart on visible.
4. Pure mappers: bins to bars (log grouping, dB to 0..1) and samples to min/max columns.
5. Whole-track waveform: compute once from decoded data off the render loop, cache by track id.
6. Visualization never feeds back into playback. If slow, drop frames, not audio.

### 10. Buffering and latency
- `baseLatency` and `outputLatency` may be missing or zero on some platforms; treat as optional and use for visual sync only.
- Set `latencyHint` only with a measured reason and document it.
- Streaming: preload threshold and underrun response are named constants.
- On seek or track change, stop and disconnect the previous source first.

### 11. Cleanup
On track change, dispose and window close: stop and disconnect sources; remove listeners (`statechange`, media events, `visibilitychange`); cancel animation frames; clear worklet port handlers and close ports; release object URLs; drop large `AudioBuffer` references; `close()` the context on dispose. `dispose()` is idempotent. Verify with fakes that count live listeners and nodes.

### 12. Format verification
Before promising MP3, WAV, FLAC or OGG on a platform, decode or play a small license-clean fixture (fixtures are owned by qa-engineer; request them). Record results per platform in `docs/audio/format-support.md` with VERIFIED, DOCUMENTED or ASSUMED. Do not assume identical codec support across operating systems.

## Recommended patterns
- Pure core, thin shell: pure math and reducer; a small Web Audio wrapper that tests replace with a fake.
- Command in, event out: UI calls `engine.play()` and subscribes to state; bridge to React via a store subscription outside render.
- Named constants with units for every tunable.
- One source of truth for ranges, imported by mapper, UI bounds and tests.
- Typed error codes, no raw `DOMException` text in the UI.

## Anti-patterns
- Allocating or calling `console.*` inside `process()`.
- Rebuilding or reconnecting the graph on track or EQ change.
- Timing from `setInterval` or React state.
- New arrays per analyser read.
- A second `AudioContext`; calling `createMediaElementSource` twice on one element.
- Writing `AudioParam.value` for audible changes without smoothing.
- Unclamped gain, volume or frequency from user input or saved presets.
- Running the visualizer while the window is hidden.
- Choosing decode versus streaming inside feature code.
- Promising a format never tested on that platform.
- Importing React, Electron, DOM globals or IPC in `src/shared/audio/**`.

## Security considerations
- Audio and preset files are untrusted. Validate preset and saved state with Zod at the boundary; the schema lives with its owner under `src/shared/` (follow `docs/engineering/shared-ownership-policy.md`).
- The engine accepts only custom-protocol URLs from main, not arbitrary paths or remote URLs.
- Worklets load from the app origin under the strict CSP. Never ask for `unsafe-eval` or looser `script-src` for audio; raise CSP needs with the Electron security owner.
- Logs and errors outside `process()` carry no file paths or user data.
- Bound resources: analyser size, decoded duration or size, worklet message rate.
- Audio code makes no network calls.

## Acceptance criteria
- AC1: The graph order equals the `tech.md` signal graph and nodes persist across track changes.
- AC2: Band gain, volume, frequency and Q mappers return finite in-range values for any number, including `NaN` and infinities.
- AC3: The reducer has no undefined transitions, never throws, and ignores stale-token results.
- AC4: `process()` contains no allocation or logging (review plus unit test of the extracted pure core).
- AC5: The visualizer requests no frames while the document is hidden and resumes when visible.
- AC6: After `dispose()`, fakes show zero listeners, no connected nodes and a closed context; a second call is harmless.
- AC7: Playback continues through a simulated UI stall.
- AC8: Each promised format has a recorded per-platform result; otherwise it is marked ASSUMED and not promised.
- AC9: Ranges, constants, latency and format assumptions are written in `docs/audio/`.

## Validation checklist
- [ ] Code only in the three allowed paths; `index.ts` exports the engine API.
- [ ] Pure modules have no React, Electron, DOM or IPC imports.
- [ ] Graph matches `tech.md`; diagram in `docs/audio/` current.
- [ ] Context created or resumed from a gesture; `statechange` handled.
- [ ] Band table, gain, Q, frequency, volume ranges and smoothing documented and enforced in one place.
- [ ] `process()` reviewed for allocation, logging, closures.
- [ ] Analyser buffers allocated once; visualizer paused when hidden.
- [ ] `dispose()` complete and idempotent.
- [ ] Source choice behind `PlaybackSource`; decision 4 flagged.
- [ ] `*.test.ts` cover mappers, reducer, bin and waveform mapping.
- [ ] Property-test targets handed to qa-engineer.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` run, or the reason stated.
- [ ] Changes needed outside the write scope listed with their owner.

## References
- `references/graph-and-lifecycle.md`: read when wiring the graph, context lifecycle, state machine or cleanup.
- `references/equalizer-and-dsp-notes.md`: read when implementing mapping and clamping or preparing property-test targets.
- `references/visualization-and-performance.md`: read when building analyser feeds, waveform data, or tuning performance and latency.
