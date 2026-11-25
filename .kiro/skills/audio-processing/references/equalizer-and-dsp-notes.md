# Equalizer and DSP notes

## Band table (ASSUMPTION until the owner confirms)

| # | Center (Hz) | Type |
|---|---|---|
| 1 | 31.25 | lowshelf |
| 2 | 62.5 | peaking |
| 3 | 125 | peaking |
| 4 | 250 | peaking |
| 5 | 500 | peaking |
| 6 | 1000 | peaking |
| 7 | 2000 | peaking |
| 8 | 4000 | peaking |
| 9 | 8000 | peaking |
| 10 | 16000 | highshelf |

Types are `BiquadFilterNode` type names. `gain` is in dB; `Q` matters for peaking bands. Choose the Q for adjacent-band overlap by measuring the combined response, then store it as a constant.

## Ranges (documented defaults, ASSUMPTION)

| Quantity | Range | Outside range |
|---|---|---|
| Band gain | -12 to +12 dB | clamp |
| Band count | exactly 10 | reject preset |
| Frequency | 20 Hz up to a documented fraction below Nyquist | clamp |
| Q | documented positive min and max | clamp |
| Volume | 0 to 1 | clamp |
| `NaN`, `Infinity` | not accepted | neutral value, documented |

Keep them in one exported constants module used by the mapper, the UI bounds and tests.

## Pure functions (`src/shared/audio/`, names are suggestions)
- `clampBandGain(value)`
- `mapPreset(values)`: length 10, each clamped
- `volumeToGain(value)`
- `clampFrequency(hz, sampleRate)`
- `playbackReducer(state, event)`
- `spectrumBars(bins, barCount, options, out)`: writes into a caller-supplied array
- `waveformPeaks(samples, columns)`

## Invariants for qa-engineer property tests
1. `clampBandGain(x)` is finite and in range for every double, including `NaN`, `+-Infinity`, `-0`.
2. Idempotent: `f(f(x)) = f(x)`.
3. Identity for in-range input.
4. Monotonic non-decreasing on finite input.
5. `mapPreset` returns length 10 with in-range elements for valid input and a validation failure otherwise.
6. `volumeToGain` stays in `[0, 1]`, is monotonic, and maps 0 to 0 and 1 to 1 (or the documented ceiling).
7. `clampFrequency(hz, sr)` is below Nyquist and at least the minimum for any positive `sr`.
8. `playbackReducer` never leaves the state set, never throws on any event sequence, and ignores stale tokens.
9. `spectrumBars` outputs are within 0..1 with length `barCount`; constant minimum-dB input gives zeros.
10. `waveformPeaks` has `min <= max` per column, values within the input range, length `columns` for non-empty input.

## Headroom
Maximum boost on all bands can exceed full scale. Options for the architect: preamp reduction equal to the largest positive band gain, a measured soft limiter, or none with the risk documented.

## Format notes (`docs/audio/format-support.md`)
Columns: format, platform, API tested, fixture id, result, evidence class. Fill from tests only; until then every cell is ASSUMED and nothing is promised.
