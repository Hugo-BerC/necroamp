# Audio engine: DSP and visualization notes (Block C)

Authority: `.kiro/steering/tech.md` (Audio engineering rules), `.kiro/specs/audio-engine/`, ADR 0006.

## Graph

```
HTMLAudioElement (crossOrigin=anonymous, media://track/<token>)
  -> MediaElementAudioSourceNode
  -> BiquadFilter x10   (31 lowshelf, 62..8k peaking, 16k highshelf)
  -> preamp GainNode    (dB -> linear, +-12 dB)
  -> master GainNode    (volume and mute, 0..1, never boosts)
  -> AnalyserNode       (fftSize 2048, smoothing 0.8, -90..-10 dB)
  -> destination
```

- Built once per element on the first `play()` call (a user gesture) by `AudioProcessing.ensureReady()`. Track changes, EQ changes, bypass and volume change `AudioParam`s only; the topology never changes.
- No `AudioWorklet` and no custom DSP (spec C8): native nodes cover every requirement. `worker-src` stays `'none'`.
- Once `createMediaElementSource` has run, the element's sound exists only through the graph. If `resume()` fails the graph is kept and `ensureReady()` retries on the next gesture.
- If `AudioContext` is unavailable, playback continues through the element (no EQ, no analysis); `ensureReady()` resolves `false`.

## Ranges (single source: `src/shared/audio/eq.ts`)

| Item | Range | Notes |
|---|---|---|
| Band gain | -12 to +12 dB | `clampGainDb`; NaN becomes 0, infinities saturate |
| Preamp | -12 to +12 dB | `clampPreampDb`; its own gain stage, not an eleventh band |
| Peaking Q | 0.1 to 18, default 1.4142 (about 1 octave) | shelves ignore Q |
| Filter frequency | 10 Hz to 0.45 x sampleRate | `clampFrequencyHz`; sample rate clamped to 8000..192000 |
| Master gain | 0 to 1 linear | volume curve is linear, same as the Block A element volume |
| Smoothing | `setTargetAtTime`, tau 15 ms | `EQ_SMOOTHING_TIME_CONSTANT_S` |

Headroom: all bands at +12 dB plus preamp +12 dB can clip. No limiter is added (no measurement yet); the preamp lets users cut instead. Revisit with a measured `DynamicsCompressorNode` only on evidence.

Bypass: `effectiveGains(settings)` returns ten zeros and a 0 dB preamp. Stored settings are untouched, so un-bypass restores them. Presets (Flat, Rock, Pop, Jazz, Classical, Bass Boost, Treble Boost, Vocal) are frozen data. `editBand` sets the preset to `Custom`; `setPreamp` does not. `sanitizeEqSettings(unknown)` turns any stored value into valid settings or Flat.

## Visualization

- `AudioProcessing.getFrequencyData()` and `getWaveformData()` fill preallocated `Uint8Array`s (1024 and 2048 entries) and return the same array each call. They return `null` before the graph exists.
- `src/shared/audio/visualizer-data.ts` shapes data without allocation: `computeBarEdges` (once per layout, log axis 31 Hz to 16 kHz), `bytesToBars` (peak per bar, 0..1), `bytesToWaveformColumns` (min/max per column, -1..1), `bytesPeakLevel`.
- `createVisualLoop({ onFrame })` owns one `requestAnimationFrame` loop. It runs only while `setPlaying(true)` and `document.hidden` is false, restarts on `visibilitychange`, and `dispose()` cancels the pending frame.
- Slow drawing drops frames; it never feeds back into playback.

## Lifecycle

- One `AudioContext` per engine (`latencyHint: 'playback'`, favors glitch-free output; no input monitoring needs low latency). Created lazily; `resume()` runs inside the play gesture.
- `statechange` is mirrored through `subscribeContextStatus`; a suspended context is resumed when the document becomes visible while the element is playing.
- `dispose()` (idempotent, also called on `pagehide`): disconnects every node, removes the `statechange` and `visibilitychange` listeners, closes the context, clears the element source and removes the element.

## Latency and assumptions

- Latency is browser/OS-defined with `latencyHint: 'playback'` (typically 10 to 40 ms or more). `baseLatency` and `outputLatency` are not read; visual sync offset is not applied. ASSUMED; not measured.
- Element playback keeps media timing independent of React renders (spec S6). A UI stall cannot interrupt the audio thread; not verified by an automated stall test.
- Analyser values with silence: byte frequency data is 0, byte time-domain data is 128.
- Format support per platform is tracked in `docs/audio/format-support.md` (not part of Block C). Gapless is out of scope (spec).

## Invariants for qa-engineer property tests (`*.property.test.ts`)

1. `clampGainDb`, `clampPreampDb`, `clampQ`, `clampFrequencyHz`, `dbToLinear` return finite numbers inside their ranges for any `number`, including NaN and +-Infinity.
2. `clampFrequencyHz(f, sr) < sr / 2` for `sr` in 8000..192000 and for any other input.
3. `normalizeGains(x)` always has length 10 and every value in [-12, 12], for arbitrary arrays, sparse arrays and non-number entries.
4. `sanitizeEqSettings(anything)` never throws, returns 10 finite in-range bands, preamp in range, boolean bypass, and idempotent: `sanitize(sanitize(x))` equals `sanitize(x)`.
5. `editBand` keeps all other bands unchanged, sets `preset` to `Custom` for valid indexes, and returns the same object for invalid indexes.
6. `effectiveGains` with `bypass: true` is all zeros and preamp 0 for any settings; with `bypass: false` it equals the normalized stored values. Stored settings are not mutated.
7. `applyPreset` followed by `effectiveGains` equals `EQ_PRESETS[name]`; unknown names return the same object.
8. `computeBarEdges(n, bins, sr)` is non-decreasing, within `[0, bins]`, length `clamp(n)+1`, for any numeric input.
9. `bytesToBars` output is within [0, 1] for any byte array; an all-zero input gives all zeros.
10. `bytesToWaveformColumns` gives `min <= max`, both within [-1, 1]; a constant-128 input gives all zeros.
11. Visual loop: with a fake scheduler, the number of pending frames is never above 1, and is 0 when not playing, when hidden, and after `dispose()`.

## Requested changes outside the audio write scope

| File | Owner | Change |
|---|---|---|
| `eslint.config.mjs` | orchestrator | Add a block after the `src/renderer/**` block: `files: ['src/renderer/audio/**/*.ts']`, `no-restricted-syntax: ['error', openExternal, browserWindow, ipcLiteral]` (drops `audioSyntax` only there). |
| `tests/static/renderer-policy.test.ts` | qa-engineer / orchestrator | Exempt `src/renderer/audio/` from the `AudioContext or analyser` and `requestAnimationFrame` patterns; keep the ban elsewhere. Currently two cases fail because of `graph.ts`, `audio-processing.ts`, `visual-loop.ts`. |
| `tests/lint-rules/boundary-rules.test.ts` | qa-engineer | Add: feature and store files still reject `AudioContext` and `requestAnimationFrame`; `src/renderer/audio/a.ts` accepts them but still rejects `openExternal`. |
| `src/shared/ipc/settings.ts` (C1/C3) | orchestrator / desktop-engineer | `audioSettingsSchema.eq` should match `EqSettings` (`bands[10]` in [-12, 12], `preampDb`, `bypass`, `preset` in the eight names or `Custom`) and the store should pass loaded values through `sanitizeEqSettings`. |
| `src/renderer/stores/eq-store.ts`, `features/equalizer`, `features/visualizer` | frontend-engineer | Use the API below. |
