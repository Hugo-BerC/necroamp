# Audio Engine Spec: as-built update (proposed patch)

Status: proposed. The canonical Spec is `.kiro/specs/audio-engine/`. The architect cannot write there (write scope is `docs/adr`, `docs/architecture`, `docs/requirements`), so the orchestrator or user must apply this patch. Evidence: `docs/testing/audio-engine-gate-a-review.md`, `audio-engine-gate-b-review.md`, `docs/security/audio-engine-review.md`, `docs/engineering/audio-engine-dependency-review.md`, ADR 0006.

## requirements.md edits
- **A2:** append "WAV, MP3, FLAC and a real Ogg Vorbis fixture are verified on Windows only."
- **B5:** replace the control-character clause with: "Tag strings are length-bounded by code point and stripped of C0, DEL and C1 controls, zero-width space, LRM, RLM, bidi embeddings, overrides and isolates, and the byte order mark. ZWNJ and ZWJ are kept." (as built in `src/main/library/text.ts`, defect D-B1 fixed).
- **B6:** "PNG, JPEG or WebP identified by magic bytes (the declared MIME type is ignored), at most 2 MiB each, at most 5000 entries and 64 MiB in total, identical images stored once."
- **C4:** append "**Deferred, not met in this delivery.** No `settings:*` channel exists; settings reset to Flat on restart. Task C.3."
- **S5:** append "As built the CSP builder derives the meta and development policies from one directive list."
- **Out of scope:** add Ogg Opus and drag-and-drop reordering (Up and Down buttons exist).

## design.md edits (as built differs from the design)
| Design says | As built |
|---|---|
| `shared/audio/playlist.ts` | `src/renderer/stores/playlist-ops.ts` (pure, no React) |
| `analyser-reader.ts` | `src/shared/audio/visualizer-data.ts` (pure), `src/renderer/audio/visual-loop.ts`, `audio-processing.ts` |
| Channels `settings:get-audio`, `settings:set-audio` | Not built (C4 deferred). Existing: `library:open-files`, `library:resolve-track`, `playlist:load`, `playlist:save` |
| `audio-settings.json` | Not built. `playlist.json` is written atomically by `playlist-persistence.ts` |
| Graph: master gain "volume, mute" | Master gain clamped to `[0, 1]`, smoothed. Before the graph exists (first play) volume and mute go to the element, afterwards the element is fixed at volume 1, unmuted (ADR 0006 item 8) |
| Graph created with the engine | Created lazily on the first play gesture (`ensureReady`) |

## tasks.md replacement status
Block A: A.1 to A.7 done (D-A4 fixed, regression test normal). Block B: B.1 to B.6 done (`music-metadata` 13.0.1; D-B1 fixed). Block C: C.1, C.2, C.4, C.5, C.6 done (real Ogg Vorbis fixture via dev-only `wasm-media-encoders` 0.7.0); **C.3 deferred** (no settings IPC). Delivery: D.1 done (APPROVED_WITH_LIMITATIONS), dependency review done; D.2 rerun only if code or config changed since the last recorded run; D.3 and D.4 open (D.3 ADR part done; `docs/assets.md` does not exist). Human gates H.1 to H.4 remain unchecked.

Test status text to add: expected failures none. Skipped four, all conditional on file-symlink privilege (three `it.skipIf(!SYMLINKS_PERMITTED)` in `tests/integration`, one runtime `context.skip()` in `src/main/protocol/app-protocol.test.ts`); unprivileged junction and fake-`realpath` equivalents run everywhere.
