# NecroAmp engineering skill catalog

Phase 03 reference for the seven workspace skills in `.kiro/skills/`, who wrote them, which custom agent loads which skill, and how to test activation.

Evidence classes:
- **VERIFIED**: read or run in this repository by a Phase 03 step or by this document's author (file listing, SHA-256 comparison, `git status`, `grep`).
- **DOCUMENTED**: stated on an official page that an earlier Phase 03 step fetched (kiro.dev/docs/skills), or recorded by a named report. The source is given.
- **ASSUMED**: neither. Needs a manual check.

Sources: `docs/architecture/engineering-skills-design.md`, `skill-integration-report.md`, `skill-copy-evidence.md`, `skill-final-integration-check.md`, `skills-correction-report.md`, `docs/security/skills-review-final.md`, `docs/testing/skills-qa-review-final.md`, `.agents/tasks/engineering-skills/review-gate-final.json`, the seven `SKILL.md` files and the `skill://` lines in `.kiro/agents/*.md`. The earlier `docs/security/skills-review.md` and `review-gate.json` are stale (their blockers were missing files) and are not used as evidence.

## 1. Inventory

All seven skills exist in `.kiro/skills/<name>/SKILL.md` with three reference files each (28 files). VERIFIED (directory listing).

| Skill | Front matter `metadata.owner` | Actual author | References | Class |
|---|---|---|---|---|
| `audio-processing` | audio-engineer | audio-engineer | 3 | VERIFIED (owner), DOCUMENTED (author: `skill-integration-report.md`, `skill-copy-evidence.md`) |
| `skin-development` | art-director | art-director | 3 | same |
| `testing-strategy` | qa-engineer | qa-engineer | 3 | same |
| `cross-platform-packaging` | release-engineer | release-engineer | 3 | same |
| `electron-security` | desktop-engineer | **wf-coder** (run `wf_8f7b43c34040e187`) | 3 | VERIFIED (owner), DOCUMENTED (author) |
| `github-integration` | github-engineer | **wf-coder** | 3 | same |
| `typescript-standards` | frontend-engineer | **wf-coder** | 3 | same |

Authorship note. Every custom agent has an `fs_write` deny on `.kiro/**`, and the owner agents for the last three skills could not write files at all, so no agent authored them. The human accepted wf-coder as their actual author (Phase 03 closure brief, Prompt). The `metadata.owner` field names the agent that maintains the skill, not the author. The owner agents have not yet read the three wf-coder skills (finding F6, non-blocking).

## 2. Activation descriptions

Quoted from each `SKILL.md` front matter (VERIFIED). These are the text Kiro uses to decide when to load a skill. Two files use a YAML folded scalar (`>-`), so the quoted text is the joined form.

**audio-processing**
> Use when building or changing NecroAmp audio code: Web Audio graph, AudioContext lifecycle and autoplay resume, AudioWorklet processors, playback state, ten-band equalizer parameter mapping and clamping, AnalyserNode spectrum and waveform visualization, buffering, latency, gapless expectations, resource cleanup and audio performance. Also use when reviewing or testing audio behavior.

**cross-platform-packaging** (folded scalar)
> Use when configuring, changing or reviewing NecroAmp packaging and CI builds: electron-builder.yml, Windows x64 installers, macOS arm64 and x64 packages, Linux DEB and AppImage, GitHub Actions workflows on native runners, reproducible pnpm installs, artifact verification and checksums, code signing and notarization considerations, SBOM steps, and keeping build jobs separate from publication. These procedures never publish, tag or push.

**electron-security**
> Use when adding or changing Electron main-process, preload or renderer-boundary code in NecroAmp: process isolation, contextBridge APIs, IPC channels and Zod payload validation, sender checks, CSP and renderer hardening, filesystem and network boundaries, custom protocol handling, secure credential storage, navigation guards and permission requests. Also use when reviewing such code.

**github-integration**
> Use when implementing or reviewing NecroAmp's optional GitHub features in the main process: Octokit client setup, authentication and authorization, token lifecycle and storage, repository and directory browsing, README and source viewing data, GitHub Actions run monitoring, notifications, pagination, rate limits, error handling and offline degradation.

**skin-development** (folded scalar)
> Use when designing, building, validating or reviewing a NecroAmp skin: the declarative manifest, original art direction, Morgul Revenant and Analog 1984 identities, backgrounds, textures, graphical controls, typography, layout and geometry, readability and contrast, asset licensing, and skin validation and security. Skins are complete visual experiences, not color themes.

**testing-strategy**
> Use when planning, writing or reviewing NecroAmp tests: Vitest unit and integration tests, fast-check property tests, Playwright Electron smoke and end-to-end tests, fixtures, mocking external APIs, security regression tests, audio and skin validation tests, and traceability from acceptance criteria to tests.

**typescript-standards**
> Use when writing or reviewing NecroAmp TypeScript and React code in any process: strict-mode typing, React component design, Zustand stores, module boundaries and dependency direction, shared contracts and Zod schemas, error handling, accessibility, rendering performance and maintainability.

Front matter of all seven: keys `name`, `description`, `license: MIT`, `metadata` (`owner`, `schema: "1"`). `name` equals the directory. VERIFIED. A real YAML parser (PyYAML) passed on all 7 skills and 9 agents (VERIFIED by the QA reviewer's run, `skills-qa-review-final.md`; not re-run here). All seven skills and descriptions appear in the Kiro IDE resource catalog of the orchestrator session (VERIFIED, `skill-final-integration-check.md`).

## 3. Agent-to-skill mapping

33 `skill://` lines across nine agent files, explicit paths, no globs, inserted after the steering resource line. Counts and targets VERIFIED (`grep` of `.kiro/agents/*.md` this document; also `skill-final-integration-check.md` git diff: 33 insertions, 0 deletions, `tools`, `permissions.rules`, `includeMcpJson` and `includePowers` unchanged).

| Agent | Lines | Skills |
|---|---|---|
| necro-architect | 7 | electron-security, audio-processing, skin-development, github-integration, typescript-standards, testing-strategy, cross-platform-packaging |
| qa-engineer | 7 | testing-strategy, electron-security, audio-processing, skin-development, github-integration, typescript-standards, cross-platform-packaging |
| security-reviewer | 4 | electron-security, skin-development, github-integration, cross-platform-packaging |
| desktop-engineer | 3 | electron-security, typescript-standards, cross-platform-packaging |
| frontend-engineer | 3 | typescript-standards, electron-security, skin-development |
| github-engineer | 3 | github-integration, electron-security, typescript-standards |
| release-engineer | 3 | cross-platform-packaging, electron-security, testing-strategy |
| audio-engineer | 2 | audio-processing, typescript-standards |
| art-director | 1 | skin-development |
| **Total** | **33** | |

Matrix (x = mapped):

| Skill | architect | desktop | audio | frontend | art | github | security | qa | release |
|---|---|---|---|---|---|---|---|---|---|
| electron-security | x | x | | x | | x | x | x | x |
| audio-processing | x | | x | | | | | x | |
| skin-development | x | | | x | x | | x | x | |
| github-integration | x | | | | | x | x | x | |
| typescript-standards | x | x | x | x | | x | | x | |
| testing-strategy | x | | | | | | | x | x |
| cross-platform-packaging | x | x | | | | | x | x | x |

Rule from review finding F5: whenever `github-integration` is mapped to an agent, map `electron-security` too (see section 5).

Whether an agent sees only its mapped skills: **ASSUMED**, not tested (finding A1). The `skill://` entry form is DOCUMENTED (kiro.dev/docs/skills, inherited via `skill-copy-evidence.md`), but the `resources:` key in Markdown agent files and the effect on Kiro IDE 1.5.11 are ASSUMED. If every agent turns out to see all workspace skills, the mapping only records intent, and this section must say so.

## 4. Reference files per skill

VERIFIED (directory listing). Paths relative to `.kiro/skills/<skill>/`.

| Skill | Reference files |
|---|---|
| audio-processing | `references/equalizer-and-dsp-notes.md`, `references/graph-and-lifecycle.md`, `references/visualization-and-performance.md` |
| cross-platform-packaging | `references/builder-config-principles.md`, `references/ci-matrix-and-verification.md`, `references/signing-considerations.md` |
| electron-security | `references/credential-storage-notes.md`, `references/ipc-channel-checklist.md`, `references/renderer-hardening-checklist.md` |
| github-integration | `references/actions-monitoring.md`, `references/auth-and-token-lifecycle.md`, `references/rate-limits-pagination-offline.md` |
| skin-development | `references/asset-licensing.md`, `references/skin-completeness-checklist.md`, `references/skin-validation-and-security.md` |
| testing-strategy | `references/electron-e2e-and-fixtures.md`, `references/property-test-catalog.md`, `references/traceability-and-security-regression.md` |
| typescript-standards | `references/accessibility-checklist.md`, `references/react-zustand-patterns.md`, `references/shared-contracts-and-errors.md` |

Each `SKILL.md` names its references and all resolve (VERIFIED, `skill-final-integration-check.md`). References load only when `SKILL.md` directs it (DOCUMENTED, kiro.dev/docs/skills).

## 5. Cross-skill dependency

`github-integration/SKILL.md` depends on `electron-security/references/credential-storage-notes.md` for token storage rules. The original text pointed to `references/credential-storage-notes.md`, which exists only in the other skill. The orchestrator corrected it to the explicit path `.kiro/skills/electron-security/references/credential-storage-notes.md` (relative form `../electron-security/references/credential-storage-notes.md`). The target exists (VERIFIED, `skill-final-integration-check.md`).

Limits (VERIFIED by the reviews, findings F5 and A5):
- The link resolves only if the agent can read `electron-security`. All four agents holding `github-integration` (necro-architect, github-engineer, security-reviewer, qa-engineer) also hold `electron-security` today (VERIFIED from the matrix in section 3).
- The relative path breaks if `github-integration` is copied alone into another Agent Skills client. The skill still works without it because the needed rules are summarized in its own text.
- Rule: never map `github-integration` to an agent without `electron-security`.

## 6. Usage examples

The prompts below are illustrative examples written for this catalog (ASSUMED to trigger the skill; the trigger behavior is not yet tested). Each matches terms in the skill's description.

| Skill | Example task prompt | Intended agent |
|---|---|---|
| audio-processing | "Design the AudioContext lifecycle so playback resumes after the first user gesture, and map the ten equalizer sliders to biquad filter parameters with clamping." | audio-engineer |
| skin-development | "Define the Morgul Revenant skin: manifest layout, background and texture plan, control states and contrast targets." | art-director |
| testing-strategy | "Write the property-test plan for equalizer parameter clamping and a Playwright smoke test that loads a file and plays it." | qa-engineer |
| cross-platform-packaging | "Review the draft electron-builder.yml and CI matrix for Windows x64, macOS arm64 and x64, and Linux DEB and AppImage." | release-engineer |
| electron-security | "Add an IPC channel for library scanning with Zod validation and a sender check." | desktop-engineer |
| github-integration | "Plan a main-process Octokit wrapper for listing repository directories with pagination and rate-limit handling, working offline from cache." | github-engineer |
| typescript-standards | "Create a Zustand store for the playlist and a typed shared contract for it, with an accessible list component." | frontend-engineer |

## 7. Manual activation test

Purpose: close QA finding A1 and the ASSUMED rows in section 3. Not yet run. Results go into `docs/kiroween/kiro-journal.md` as VERIFIED once observed.

Preconditions: Kiro IDE (1.5.11 was the installed version recorded in Phase 02), workspace trusted, no uncommitted edits to `.kiro/`.

Part A: skill visibility per agent.
1. Open the custom agent picker and select `art-director`. Ask: "Which skills can you see?" Expect exactly `skin-development`.
2. Repeat for each agent and compare with the table in section 3:
   - `audio-engineer`: audio-processing, typescript-standards
   - `desktop-engineer`: electron-security, typescript-standards, cross-platform-packaging
   - `frontend-engineer`: typescript-standards, electron-security, skin-development
   - `github-engineer`: github-integration, electron-security, typescript-standards
   - `release-engineer`: cross-platform-packaging, electron-security, testing-strategy
   - `security-reviewer`: electron-security, skin-development, github-integration, cross-platform-packaging
   - `necro-architect` and `qa-engineer`: all seven
3. If an agent lists skills outside its mapping, custom agents inherit workspace skills. Record that fact and edit section 3 of this catalog to say the mapping documents intent only.

Part B: description-driven activation. In a session with an agent mapped to the skill, send the matching prompt from section 6 and confirm the skill loads (the agent reports reading `SKILL.md`). Also check one negative case: a prompt unrelated to any description should not load the skill.

Part C: reference loading. Ask for something covered only by a reference file (for example the Linux `safeStorage` handling in `credential-storage-notes.md`) and confirm the agent opens it.

Record for each check: agent, prompt, observed result, date, Kiro version. Mark as VERIFIED only what was observed.

## 8. Fact classification summary

| Fact | Class |
|---|---|
| Seven skills with 28 files exist under `.kiro/skills/` | VERIFIED |
| Front matter keys and `name` equals directory for all seven | VERIFIED |
| YAML parser pass on 7 skills and 9 agents | VERIFIED by QA reviewer (not re-run here) |
| 33 `skill://` lines, per-agent counts and targets | VERIFIED |
| Mapping equals section 3 of `skill-integration-report.md` | VERIFIED (orchestrator check, security and QA reviews) |
| No tool or permission field changed (git diff: 33 insertions, 0 deletions) | VERIFIED by orchestrator `git diff`; reviewers did not re-run it |
| All seven skills listed in the Kiro IDE resource catalog (orchestrator session) | VERIFIED |
| `skill://` form with specific paths is supported in `resources` | DOCUMENTED (kiro.dev/docs/skills and configuration reference, via `skill-final-integration-check.md`) |
| Workspace skills live in `.kiro/skills/`, name must match folder, description max 1024 | DOCUMENTED (kiro.dev/docs/skills) |
| Authorship: four by their owner agents, three by wf-coder, accepted by the human | DOCUMENTED (`skill-copy-evidence.md`, closure brief) |
| Final reviews approved, gate APPROVED | VERIFIED (`review-gate-final.json`, both review files) |
| An agent sees only its mapped skills | ASSUMED (A1) |
| `resources:` with `skill://` in Markdown agent files behaves like the JSON form | ASSUMED |
| Behavior on Kiro IDE 1.5.11 per agent | ASSUMED |
| Technical claims inside the skills about Electron, Octokit, GitHub REST, Electron Builder, Web Audio | ASSUMED (labeled in the skills; not fetched by reviewers) |

## 9. Open non-blocking findings

From `review-gate-final.json` (VERIFIED). None blocks approval.

F1 (Medium, Linux `safeStorage` weak backend; decided in `docs/adr/0001-linux-credential-storage-fail-closed.md`, implementation open), A1 (Medium, per-agent visibility untested), F2, F3 (staging copies, resolved: removed after the equivalence check in `docs/engineering/skills-staging-inventory.md`), F4, F5/A5, F6, A2, A3, A4, A7, A8, A9, A10, A11, GAP-1.

Not read line by line by either reviewer: most of the 21 reference files (GAP-1).
