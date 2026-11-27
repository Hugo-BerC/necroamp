# NecroAmp Engineering Backlog

## Phase 03: non-blocking skill review findings

Source: `docs/engineering/reviews/review-gate-final.json`, a preserved copy of the workflow artifact `.agents/tasks/engineering-skills/review-gate-final.json` (verdict APPROVED, 16 non-blocking entries; F5 and A5 are one combined entry). Detailed reports: `docs/security/skills-review-final.md`, `docs/testing/skills-qa-review-final.md`. None blocks Phase 03.

| ID | Severity | Owner | Area | Finding | Status |
|---|---|---|---|---|---|
| F1 | Medium | desktop-engineer, qa-engineer | electron-security credential storage | Linux `safeStorage` can report encryption available while the backend is `basic_text`. | Decided in ADR 0001 (fail closed). Skill text updated. Implementation and tests are open. |
| A1 | Medium | human | agent skill mapping | Not shown that each agent loads only its mapped skills. Run the manual activation test in `docs/engineering/skill-catalog.md` and record the results in the journal. | Open. Runtime test not performed. |
| F2 | Low | release-engineer | YAML validation | The security review ran no YAML parser. QA ran PyYAML on 7 skills and 9 agents and it passed. | Largely closed. Add a YAML lint to CI once CI exists. |
| F3 | Low | orchestrator | staging copies | Staging copies could drift from `.kiro/skills`. | Resolved. Removed after a SHA-256 equivalence check (`docs/engineering/skills-staging-inventory.md`). |
| F4 | Low | audio-engineer | audio-processing | Preamp placement is unspecified and may add a node beyond the `tech.md` graph. | Open. |
| F5/A5 | Low | necro-architect | github-integration cross-skill link | The credential-notes link only works when both skills are present. | Partly resolved. The reference now names the `electron-security` dependency explicitly, with both workspace and relative paths. Portability when the skill is copied alone remains a limitation. |
| F6 | Info | desktop-engineer, github-engineer, frontend-engineer | wf-coder-authored skills | `electron-security`, `github-integration` and `typescript-standards` were written by wf-coder. The owner agents should read them once. | Open. |
| A2 | Low | necro-architect | qa-engineer and security-reviewer agent prompts | "Do not invent Skills..." could be read as a reason to ignore the new skills. | Open. Needs a prompt wording change, which is out of Phase 03 scope. |
| A3 | Low | necro-architect | github-integration, typescript-standards | The skills name other skills that their agents are not mapped to (name references only). | Open, accepted. |
| A4 | Low | necro-architect | audio-engineer mapping | `audio-engineer` is not mapped to `electron-security`. Acceptable because the skill delegates. | Accepted. |
| A7 | Low | desktop-engineer | electron-security | No guidance on privileged custom-scheme registration flags. | Open. Address when the protocol is implemented. |
| A8 | Low | audio-engineer, qa-engineer | audio-processing equalizer notes | Invariant 7 fails when Nyquist is below 20 Hz. Restrict property-test sample rates (for example 8000 to 192000). | Open. |
| A9 | Low | release-engineer | cross-platform-packaging CI | A macOS x64 cross-build on Apple silicon is not proven to produce a launchable binary. | Open. Verify on a native x64 runner or with an architecture check plus a launch smoke test. |
| A10 | Info | none | typescript-standards | The broadest description, so it may activate on most TypeScript edits. | Watch during the activation test. |
| A11 | Info | none | skin-development | Stricter than `tech.md` and consistent with it. | No action. |
| GAP-1 | Info | qa-engineer, security-reviewer | review coverage | 21 reference files were not all read line by line. `testing-strategy` was reviewed by security only. | Open. Cover in the next review touching these files. |

The QA advisories A2 to A9 in the QA report map to the IDs above. A6 does not appear in the gate file.

## Desktop Foundation M2/M3: accepted temporary risks and downstream validation

Source: `docs/security/m2-m3-security-review.md` (canonical combined review, findings F-1 to F-8). Human decision: implementation acceptance of M2 and M3, not runtime acceptance.

### F-3: filesystem TOCTOU in the `app://` handler (Low, accepted temporarily)

Status: **accepted temporarily for Desktop Foundation. Not resolved.** Mandatory reassessment before the first public release (owner: desktop-engineer with security-reviewer; decision recorded in an ADR or a security note). The protocol code is unchanged by this decision.

- **Location.** `src/main/protocol/app-protocol.ts`, the sequence `realpath`, `stat`, `readFile` on a path (review cites about L98 to L113).
- **Preconditions.** A local process that can write inside the app's own output directory (the unpacked `out/renderer` tree, or the installed resources) must replace a file or directory component with a symlink or junction between the containment check and the read. No renderer-supplied input can create that condition.
- **Affected boundary.** Confinement of served files to the renderer root. A successful swap could return a file outside the root to the renderer through `app://renderer`.
- **Current mitigations.**
  - The URL path is validated lexically before any filesystem access (no traversal, encoded separators, backslashes, dotfiles, reserved device names, extension allow-list).
  - The root is resolved once. Each file's `realpath` must be inside the root. The file must be a regular file of at most 5 MiB.
  - Every rejection returns 404 without detail.
  - The renderer is sandboxed and has no filesystem or network access of its own. Only GET and HEAD are served.
  - An attacker with write access to the install directory can already replace the application's code, so the residual gain is small.
- **Residual risk.** A narrow race window remains between the checks and the read. The effect is limited to disclosure of a file readable by the user running the app, and only to that app's own renderer.
- **Proposed mitigation (not implemented).** Open the file once, `fstat` the handle, and read through the same handle. Compare the handle's identity (device and inode where available) and the resolved path of the opened file against the root.
- **Limitations of that mitigation.**
  - Windows semantics differ: there is no inode comparison in the POSIX sense, and resolving the final path of an open handle needs a platform-specific step. Behavior on NTFS junctions and reparse points must be tested on a real Windows host (the two real-symlink tests are skipped on this host).
  - Node has no atomic "open below this directory" primitive. Directory components can still be swapped before the open, so the approach narrows the race and does not remove it.
  - It adds cost: handle lifetime management, streaming or bounded reads through the handle, and more test fixtures. `protocol.registerSource` (experimental in Electron 45.5.0) moves containment into Electron and could be evaluated instead; adopting it needs an ADR (see `docs/architecture/electron-api-verification.md`, section 2.4).
- **Reassessment gate.** Before the first public release, decide among accept permanently, implement the handle-based read, or adopt a different serving mechanism. Until then F-3 stays open in this table.

### Downstream validation duties from the accepted findings

| ID | Finding | Required validation | Task |
|---|---|---|---|
| F-4 | Dev CSP allows `unsafe-inline` for scripts and styles on design grounds only. | Run `pnpm dev`, remove each allowance the pinned Vite and React plugin does not need, record the result. | T7.6 |
| F-7 | Fuses, ASAR integrity, `realpath` against the ASAR layout, and `devTools` in production builds are not part of M2/M3. | Cover in the packaging review. | M7, M8, release-engineer |
| F-8 | Not verified at runtime: `'self'` matching `app://renderer`; module scripts without `corsEnabled`; sandboxed preload with bundled Zod; meta CSP in built HTML. | Verify against the built app and E2E. If module scripts fail, apply the `corsEnabled` fallback (ADR 0003 item 3) and amend the ADR. | T7.0, T7.2, T7.5 |
| F-6 | Environment variables honored only when unpackaged. | No action. | none |

F-1 and F-2 are corrected in code with regression tests (accepted by the human). F-5 is accepted and recorded in ADR 0005.

### Block C status of the downstream duties (fresh run, Windows x64)
- F-3 stays open: mandatory reassessment before the first public release. No code change.
- F-8: runtime-verified by the 35 E2E tests and the preview run (module scripts and 'self' on pp://renderer, sandboxed preload with bundled Zod, meta CSP in built HTML). The corsEnabled fallback was not needed.
- F-4: still open until the human pnpm dev run (T7.6).
- F-7 and all packaging-specific checks (fuses, ASAR integrity, ealpath on the ASAR layout, production devTools, installers, signing, auto-update, Linux targets, macOS x64 cross-build): DEFERRED.
- No CI exists (.github/workflows is absent). Add the CI workflow (including YAML lint, F2) before release.
- Open items from the final delivery: T5.5 seam review, T7.5 build validation document, T8.1 to T8.4 reviews, manual skill activation test (A1).

## Desktop Foundation quality findings: unresolved items (post-merge reconciliation)
Source: `docs/architecture/review-desktop-foundation-final-dispositions.md`. Open items from the final quality review (V-IDs) and the architecture gate (A-IDs, `docs/architecture/desktop-foundation-architecture-gate.md`).
| ID | Owner | Item | Trigger |
|---|---|---|---|
| V-4 | release-engineer, security-reviewer | Fuses, ASAR integrity, `electron-builder.yml`, F-3 reassessment. | Before first packaging or public release. |
| V-5 | release-engineer | Add CI (matrix, SHA-pinned actions, least-privilege `permissions:`, `--frozen-lockfile`, YAML lint). Verify macOS and Linux install, build, unit and E2E. | Next phase. |
| V-6 | desktop-engineer | Navigation guards: allow only the entry URL, not any same-origin URL. | When routing or the Skin Engine adds origins. |
| V-8 | desktop-engineer, release-engineer | Add `package` script with `--publish never`. | When `electron-builder.yml` exists. |
| V-10 | desktop-engineer, frontend-engineer | Move the `window.necroamp` ambient declaration so renderer does not include preload. | Next renderer or preload change. |
| V-12 | qa-engineer | Run the two skipped real-symlink tests on Linux, macOS or Developer Mode Windows. | With CI. |
| V-13 | qa-engineer, art-director | Visual snapshot baselines per platform. | After art-director approval of a baseline. |
| V-15 | qa-engineer | Audio decode tests (MP3, WAV, FLAC, OGG) and property tests (equalizer, skin manifest, playlist, metadata, time formatting). | Mandatory when each feature lands. |
| V-16 | orchestrator, security-reviewer | Create `docs/assets.md` and list the screenshot. | Before any bundled asset is added. |
| V-2 | human | Confirm the tooling ownership assignment (`shared-ownership-policy.md` section 5). | Next human review. |
| T8.6 | human | No human confirmation of the Desktop Foundation final approval exists. Decide whether to give one. | Before relying on Desktop Foundation as accepted. |
| A-1, A-3, A-4 | necro-architect | Documentation drift items from the architecture gate (ADR 0005 F-5 addendum; steering open decisions 1, 8, 9 still marked open). | Next steering or ADR edit. |
| A1 | human | Manual agent-skill activation test (carried from Phase 03). | Open. |
## Audio Engine (PR #7): accepted limitations and follow-ups
Accepted by the maintainer for the current MVP when authorizing the merge of PR #7. Sources: docs/security/audio-engine-review.md, docs/engineering/audio-engine-pr-body.md, .kiro/specs/audio-engine/as-built.md.
| ID | Severity | Owner | Item | Status |
|---|---|---|---|---|
| AE-11 | Info | necro-architect | A mapped network drive letter (Windows) or a network mount (posix) looks local to the path check, so playlist:load can still touch the network for such an entry. Needs a drive-type check. Record in the threat model. | Accepted for MVP. Open. |
| AE-12 | Info | desktop-engineer | Reserved Windows device names with an audio extension (for example CON.mp3) are not rejected on restoration. They stay local and become unavailable items. | Accepted for MVP. Open. |
| AE-13 | Info | qa-engineer | The ealpath and open assertions in playlist-restore-security.test.ts cannot fail because the spied fs object is not used by romPath. Remove them or spy on a dependency the code uses. | Accepted for MVP. Open. |
| FLAKE-1 | Medium | qa-engineer | One E2E run of the final code had 1 failed test out of 89. The failing test was not recorded, the next runs passed 89 of 89, and the cause is unidentified. It is not attributed to the earlier "Render frame was disposed" error because no evidence links them. | Unresolved. Reproduce with repeated runs and trace capture and record the test name. |
| AE-01 | Low | desktop-engineer | Metadata parsing has no per-file timeout, size cap or concurrency bound. | Accepted. Open. |
| AE-03 | Low | desktop-engineer | The media handler uses stat then opens the stream (size mismatch if the file changes). Use one file handle. | Accepted. Open. |
| AE-04 | Info | necro-architect | media:// applies to the whole default session. The Skin Engine must not load untrusted web content in it. | Carry into the Skin Engine design. |
| AE-06 | Info | desktop-engineer | A few cosmetic characters (U+2028, U+2029, U+061C, the Unicode tag block) still pass tag cleaning. | Accepted. Open. |
| AE-08 | Info | desktop-engineer | supportFetchAPI on the media scheme is not needed by the player. | Optional. |
| AE-09, AE-10 | Info | desktop-engineer | Menu IPC and folder scan Info findings (see the review). | Accepted. Open. |
| AUD-1 | Medium | desktop-engineer, frontend-engineer | Equalizer settings are not persisted (spec task C.3, no settings IPC). | Deferred. Open. |
| AUD-2 | Low | qa-engineer | Only Windows x64 was tested. macOS, Linux and Ogg Opus are untested. No CI. | Open (see V-5). |
| AUD-3 | Low | qa-engineer | Eight symlink tests are skipped without privilege; junction and mocked-realpath equivalents run. | Open (see V-12). |
| AUD-4 | Low | orchestrator | docs/assets.md does not exist. The fixture license note is in 	ests/fixtures/audio/README.md. | Open (see V-16). |
| H-AUD-1 | human | human | H.1 ADR 0006 review is not confirmed. H.2 per-format listening and H.3 visual check of spectrum and waveform are not confirmed. Playlist behaviors other than automatic first-track loading (double-click plays, add keeps the current track, restart restores the selection, File menu parity, Open Folder) are not confirmed by a human. | Open. Not marked as passed. |
