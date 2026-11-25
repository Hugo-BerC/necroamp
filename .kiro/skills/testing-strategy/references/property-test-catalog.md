# Property test catalog

Required areas come from `.kiro/steering/tech.md` ("Testing"). Each section lists invariants to encode. Module names are targets in `src/shared` or other framework-free modules; adapt to the real exports. Do not rely on a function name before reading the module.

General rules: tests assert properties of the public function only; inputs include boundary and hostile values; a failing seed becomes a permanent example test.

## 1. Equalizer parameter mapping and clamping

Target: pure functions that map band gain (and any UI value) to filter parameters.
- Output gain is always finite and within the documented min and max for every input, including `NaN`, `Infinity`, `-Infinity`, very large and very small numbers.
- Clamp idempotence: `clamp(clamp(x)) == clamp(x)`.
- Inputs already inside the range are returned unchanged.
- Monotonic: for `a <= b` (both finite), mapped `a <= mapped b`, unless the mapping is documented as non-monotonic.
- Band table: exactly ten bands, strictly increasing center frequencies, first is low shelf and last is high shelf, middle eight are peaking (per `tech.md` signal graph).
- Preset to parameter round trip, if both directions exist, stays within clamp tolerance.
- The documented ranges come from audio-engineer. If none exist, report a gap instead of inventing numbers.

## 2. Skin manifest validation

Target: manifest parser and path validator (Zod based).
- Never throws for arbitrary JSON values (null, numbers, strings, arrays, deep nesting). Cyclic input is not JSON, so exclude it. The result is a typed success or failure.
- Never throws for arbitrary strings passed to the JSON entry point.
- Path escape: for any accepted manifest, every referenced path, after the loader's normalization and resolution against the skin root, stays inside the root. Generate paths from segments including `..`, `.`, empty, backslashes, drive letters, UNC prefixes, percent-encoded dots, NUL, very long names, mixed separators, leading slash.
- Absolute paths and drive-qualified paths are always rejected.
- Unknown fields are rejected at every object level (add a random extra key to a valid manifest; expect failure). Include `__proto__`, `constructor`, `prototype` keys.
- Missing or wrong `schemaVersion` is rejected.
- Remote URLs (`http:`, `https:`, `//host`, `file:`, and `data:` unless allowed) and `@import` in any string that may reach CSS are rejected.
- Limits: counts and sizes above the documented limits are rejected, values at the limit are accepted.
- Accepted manifests are stable: parse, serialize, parse yields an equal value.
- Symlink escape cannot be property-tested in pure code. Cover it with an integration test on a temp directory (skip with a recorded reason where the platform cannot create symlinks without privilege, for example some Windows setups).

## 3. Playlist operations

Target: pure reorder, insert, remove, shuffle and selection functions.
- Conservation: after reorder the multiset of item IDs and the length are unchanged.
- Insert: length grows by one, the item is at the clamped index, relative order of others is preserved.
- Remove: length shrinks by one when the ID exists, otherwise the list is unchanged; relative order of others is preserved.
- Reorder inverse: moving from `i` to `j` then `j` to `i` restores the list.
- Out-of-range and non-integer indexes do not throw and do not corrupt the list (clamp or reject, as documented).
- Operations do not mutate their input (compare a deep copy).
- Unique IDs stay unique. Duplicate-ID insert behavior is documented and tested.
- Current-track pointer: after any operation it is `null` or refers to an item still in the list; removing the current item yields the documented next state.
- Shuffle: result is a permutation, deterministic for a given injected seed or random source.
- Save then load (serialization) round trip is identity.

## 4. Metadata normalization

Target: function that turns raw tag values into the app's track metadata.
- Never throws for arbitrary input shapes (missing fields, wrong types, huge strings, control characters, lone surrogates).
- Output strings are trimmed, contain no control characters, and are within the documented length cap.
- Idempotent: `normalize(normalize(x))` equals `normalize(x)` when the output type is also an accepted input.
- Numeric fields (track number, year, duration) are finite, non-negative values or `undefined`. `NaN` and negatives never leak out.
- Missing title falls back to the documented value (for example file name without extension). A fallback input with path separators yields only the base name.
- Artwork descriptors are validated by type and size before use.
- Unicode normalization form is consistent for equal-looking inputs, if the module promises it.

## 5. Time formatting

Target: seconds to display string (and parse, if present).
- Never throws; for non-finite or negative input returns the documented placeholder.
- Output matches the documented pattern (`m:ss`, `h:mm:ss`) for all finite non-negative inputs.
- Seconds and minutes fields are in `0..59` where a larger unit exists.
- Monotonic: larger durations never format to a smaller total when parsed back.
- Parse after format returns the floored (or rounded, as documented) input.
- Very large values do not produce exponent notation or `NaN`.
- Fractional rounding matches the documented rule at `.5` and `.999` boundaries.

## 6. Additional candidates (add when the module exists)

- IPC payload schemas: arbitrary values never throw at validation, extra keys rejected.
- GitHub response normalizers: arbitrary bodies yield a typed failure, never an unhandled exception.
- Rate-limit and backoff calculation: delay is non-negative, bounded, non-decreasing with attempts, no overflow.
