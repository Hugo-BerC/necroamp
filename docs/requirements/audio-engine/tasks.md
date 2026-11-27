# Audio Engine: Tasks

Legend: `[ ]` not done, `[x]` done. Agents never tick a human gate.

## Block A: Core playback
- [ ] A.1 (desktop-engineer) Register `media` scheme privileges, token registry, `media-protocol` pure parser with Range, handler, CSP builder change (ADR 0006). Tests: S1, S2, S5.
- [ ] A.2 (desktop-engineer) `library:open-files` handler with dialog, schemas in `src/shared/ipc`, preload binding, sender tests (S3, S4).
- [ ] A.3 (audio-engineer) `shared/audio/playback-state.ts`, `time-format.ts` and property tests (A3, A5, A6).
- [ ] A.4 (audio-engineer) `renderer/audio/audio-engine.ts` with volume graph, plus `player-store`.
- [ ] A.5 (frontend-engineer) Wire existing controls, progress, time, volume, mute, error display.
- [ ] A.6 (qa-engineer) Synthetic tone fixtures (script-generated, license note) and E2E: play, pause, stop, seek, unsupported and corrupt file.
- [ ] A.7 Targeted validation: typecheck, lint, unit, coverage thresholds, E2E.

## Block B: Playlist and metadata
- [ ] B.1 (orchestrator) Add `music-metadata`: resolve latest stable from the registry, check license, record it, check build-script policy (ADR 0004).
- [ ] B.2 (audio-engineer) `shared/audio/playlist.ts` with shuffle, repeat, previous and next rules, property tests (B2 to B4).
- [ ] B.3 (desktop-engineer) `metadata.ts`, `artwork.ts`, `media://art` serving, playlist persistence, `playlist:*` channels (B5 to B7).
- [ ] B.4 (frontend-engineer) Playlist view: multi-add, select, reorder, remove, shuffle and repeat controls, artwork and metadata display.
- [ ] B.5 (qa-engineer) Metadata fixtures, persistence corruption tests, E2E playlist progression.
- [ ] B.6 Targeted validation.

## Block C: DSP and visualization
- [ ] C.1 (audio-engineer) `shared/audio/eq.ts`: bands, clamp, presets, schema, property tests (C1 to C3).
- [ ] C.2 (audio-engineer) Graph with biquad chain, preamp, bypass, analyser, lifecycle and dispose (C5, C7). No worklet (C8).
- [ ] C.3 (desktop-engineer) `settings:*` channels and persistence (C4).
- [ ] C.4 (frontend-engineer) Equalizer panel, spectrum and waveform canvases, rAF loop with visibility pause (C6).
- [ ] C.5 (qa-engineer) Graph unit tests with fake context, E2E analyser non-zero on tone, cleanup test.
- [ ] C.6 Targeted validation.

## Delivery
- [ ] D.1 (security-reviewer) Focused review: protocol, tokens, CSP diff, IPC senders, no path leak.
- [ ] D.2 Full validation suite; coverage thresholds unchanged.
- [ ] D.3 Update `docs/kiroween/kiro-journal.md`, `docs/assets.md` for fixtures and dependencies, ADR 0006 status.
- [ ] D.4 Open or update the PR and leave it open.

## Human gates (not done, human only)
- [ ] H.1 Human review confirming ADR 0006 (open decisions 4 and 5). The ADR is accepted provisionally only.
- [ ] H.2 Human listening confirmation that audio is audible and correct in each format.
- [ ] H.3 Human visual check of spectrum, waveform and EQ.
- [ ] H.4 Human review and approval of the PR. Merge only with explicit authorization naming this PR.
