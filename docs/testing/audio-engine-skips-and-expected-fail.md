# Audio Engine: expected failure and skipped tests

Run on Windows, branch `feature/audio-engine`, `vitest run --reporter=verbose`: 1423 passed, 1 expected fail, 4 skipped. Authority: `.kiro/steering/tech.md` (Testing), `.kiro/specs/audio-engine/requirements.md` B5.

## Expected failure (1)

| Test | File | Verdict |
|---|---|---|
| `D-B1: strips C1 control characters as well` (`it.fails`) | `src/main/library/metadata.property.test.ts` | Mandatory requirement failure. Open. |

Requirement B5 says tag strings have "control characters stripped". Unicode category Cc includes the C1 range U+0080 to U+009F. `cleanText` removes only U+0000 to U+001F and U+007F. Defect record: `docs/testing/defects/0005-clean-text-keeps-c1-and-format-characters.md`.

Required change (owner: desktop-engineer; not applied here because it is production source). File `src/main/library/text.ts`, function `isControl`:

```diff
 function isControl(char: string): boolean {
   const code = char.charCodeAt(0);
-  return code < 0x20 || code === 0x7f;
+  return code < 0x20 || (code >= 0x7f && code <= 0x9f);
 }
```

Then delete the `it.fails` marker: change `it.fails('D-B1: ...` to `it('D-B1: ...` in `metadata.property.test.ts` (Vitest fails the run once the fix lands while the marker remains). `src/main/library/text.ts` has a 95% coverage threshold; the added range check lives on an already covered line, and a unit test for U+0085 should accompany it.

Not required by B5, recommended hardening (risk: low, React renders the text inert): also strip bidi overrides and isolates U+202A to U+202E and U+2066 to U+2069, plus U+2028 and U+2029, from file names and tags so a title cannot visually reorder. Decide separately; it needs no spec change to B5 but should be recorded in the spec.

## Skipped tests (4)

All four need creation of a file symlink, which on Windows requires Developer Mode or elevation. None is a requirement failure. Each is skipped only when the host cannot create a symlink.

| Test | File | Skip mechanism |
|---|---|---|
| refuses a file symlink that leaves the root | `tests/integration/app-protocol.integration.test.ts` | `it.skipIf(!SYMLINKS_PERMITTED)` (converted from a blanket runtime skip) |
| does not follow a symlink swapped to a non-audio target after authorisation | `tests/integration/media-access.integration.test.ts` | `it.skipIf(!SYMLINKS_PERMITTED)` (converted) |
| rechecks the extension after realpath: symlink to non-audio target | `tests/integration/media-access.integration.test.ts` | `it.skipIf(!SYMLINKS_PERMITTED)` (converted) |
| rejects a real symlink that points outside the root | `src/main/protocol/app-protocol.test.ts` | runtime `context.skip()` after a failed link creation. Implementer-owned file, left unchanged. |

`SYMLINKS_PERMITTED` comes from `tests/integration/support/fs-capabilities.ts`, a synchronous probe in a private temp directory. The skip reason is printed in the test name. On macOS, Linux and Windows with Developer Mode the four tests run.

### Unprivileged equivalents that run everywhere (added)

- `tests/integration/app-protocol.integration.test.ts`: "refuses a directory junction that leaves the root". A real junction (no privilege on Windows) points out of the renderer root; the handler must answer 404 with an empty body. Passes on this host.
- `tests/integration/media-symlink-boundary.integration.test.ts`: a fake `realpath` resolves an audio-named registered path to `.txt`, `.pem`, no extension and `.wav.exe`. The handler must answer 404 and must never call `stat` or `openRange`. A control case confirms an audio target is still served.
- Already present: `src/main/protocol/app-protocol.test.ts` lines 130 to 141 (mocked `realpath` escape, including the `${ROOT}-evil` prefix sibling) and `src/main/protocol/resolve-app-path` property tests for traversal.

## Accepted limitations

- On a Windows host without symlink privilege, real file-symlink behaviour of `fs.realpath` is not exercised. The handler logic is covered by the mocked and junction tests. macOS and Linux CI runners execute the real-symlink tests; this is the cross-platform gap to confirm on the first CI run.
- No assertion or coverage threshold was weakened.
- D-B1 stays an expected failure until desktop-engineer applies the change above. It does not affect security boundaries (display text only) but does violate B5, so delivery should wait for it or record an explicit waiver from a human.
