# NecroAmp Engineering Skills: Stage 1 design

Phase 03, Stage 1 (skill architecture). Author: necro-architect.
Status: design for human approval. No skill, agent or steering file was created or changed.

**Location note.** The task asked for `.agents/tasks/engineering-skills/skill-design.md`. necro-architect's `fs_write` rules deny that path (`**` outside `docs/adr|architecture|requirements`), and a probe write was blocked. This file is the substitute. Copy it to the requested path if a later step needs it there.

Evidence classes (as in `docs/engineering/agent-validation.md`): **VERIFIED** read or observed in this repository. **DOCUMENTED** stated on a kiro.dev or agentskills.io page that was fetched. **ASSUMED** neither.

## 1. Kiro Agent Skills facts

necro-architect has no web tool (`web_fetch` and `web_search` are denied) and no shell. **None of the three URLs could be fetched in this stage.** Every statement about skills below is therefore ASSUMED, from prior knowledge of the Agent Skills standard and Kiro. No fact in this section is DOCUMENTED. Stage 2 or the human must confirm the items in section 1.3 before authoring starts.

### 1.1 What the repository confirms (VERIFIED)

- Kiro IDE is 1.5.11 (`agent-validation.md`, `kiro --version`).
- Agents are Markdown with YAML front matter at `.kiro/agents/<name>.md`. Keys in use: `name`, `description`, `tools`, `includeMcpJson`, `includePowers`, `resources`, `permissions.rules`. Every agent has `resources: [file://.kiro/steering/**/*.md]` and nothing else.
- No `.kiro/skills/` directory exists. No agent has a `skill://` resource. No agent has a `skill` permission rule (finding F5 in `agent-validation.md`).
- `permissions.rules` accepts the capability name `skill` (F5 names it as an unrestricted capability). Its match semantics are not verified.
- Every agent's `fs_write` rules deny `.kiro/**`. Writes under `.kiro/agents/` also always prompt (DOCUMENTED earlier, `agent-catalog.md` section 7).

### 1.2 Expected skill format (ASSUMED)

| Topic | Expectation | Source class |
|---|---|---|
| Workspace location | `.kiro/skills/<name>/SKILL.md`. Global location `~/.kiro/skills/`; the workspace copy wins on a name clash. | ASSUMED |
| Layout | `<name>/SKILL.md`, plus optional `references/`, `scripts/`, `assets/` loaded on demand. | ASSUMED (agentskills.io convention) |
| Required front matter | `name`, `description`. | ASSUMED |
| Optional front matter | `license`, `compatibility`, `metadata` (string map). The spec also lists an experimental `allowed-tools`. Whether Kiro honors it is unknown. | ASSUMED |
| `name` rules | 1 to 64 characters, lowercase letters, digits and hyphens, no leading, trailing or doubled hyphen, equal to the directory name. | ASSUMED (agentskills.io) |
| `description` | 1 to 1024 characters. It states what the skill does and when to use it. It is the only text loaded at startup, so it drives activation. | ASSUMED |
| Progressive disclosure | Startup loads name and description. The full `SKILL.md` loads when the task matches. Reference files load only when `SKILL.md` links them and the agent reads them. | ASSUMED |
| Custom agent reference | A resource entry such as `skill://.kiro/skills/<name>/SKILL.md` (glob form `skill://.kiro/skills/**/SKILL.md`). | ASSUMED |
| Inheritance | The default agent discovers workspace skills automatically. A custom agent probably gets only the skills listed in its `resources`. Agents here already inherit default steering (DOCUMENTED in `agent-validation.md`), so inheritance of skills must be tested, not assumed. | ASSUMED |
| Not supported or unknown | `skill://` is not documented for `includeMcpJson`/`includePowers`. Skill-level tool grants (`allowed-tools`) must not be relied on. Skills cannot change agent permissions. Executable `scripts/` are out of scope for this phase (task rule). Do not use any other front matter key. | ASSUMED |

YAML caution: a `description` containing `: ` broke `github-engineer.md` earlier (`agent-validation.md`, section 1). Write every description as a double-quoted or `>-` block scalar and parse each file with PyYAML before accepting it.

### 1.3 Confirmation checklist before Stage 2 (human or any agent with web access)

1. kiro.dev/docs/skills: directory, front matter keys, name rule, size guidance, whether reference files load on demand.
2. kiro.dev/docs/custom-agents/configuration-reference: exact `skill://` syntax, whether custom agents inherit workspace skills, whether `permissions.rules` `skill` can scope by skill name.
3. agentskills.io/specification: limits on `name`, `description`, `compatibility`, `metadata`.
4. After one skill exists: select the bound agent and ask "Which skills can you see?" as a manual activation test.

If an item differs from section 1.2, this design changes only in the front matter and the `resources` line format. Content, mappings and boundaries stand.

## 2. Blocking findings for Stages 2 and 3

**B-1. No bound author can write `.kiro/skills/**`.** All nine agents carry an explicit `fs_write` deny on `.kiro/**`, and deny beats allow (VERIFIED rule text, DOCUMENTED precedence). The Stage 2 steps bound to desktop-engineer, audio-engineer, art-director, github-engineer, frontend-engineer, qa-engineer and release-engineer would be refused, so they cannot create `.kiro/skills/<name>/SKILL.md`. Some authors also have no other writable place (desktop-engineer has no `docs/` scope).

Options, compared on correctness, simplicity, reversibility and consistency with "do not widen permissions":

| Option | Result | Verdict |
|---|---|---|
| A. Bound agents author the content and return each file as a structured final output or a report under their own write scope. The main session (not an agent-profile session) writes the files into `.kiro/skills/`. | Keeps authorship by the named agents. No permission change. Needs a copy step. Authors without a doc scope (desktop-engineer) can only return text. | **Recommended.** Fits the Phase 02 lesson that results must be captured in structured outputs. |
| B. Edit each author's deny so it allows `.kiro/skills/<name>/**`. | Direct writes. Widens permissions and changes agent files, which conflicts with Stage 3's rule and with the "always prompt" behavior of `.kiro/agents`. | Reject. |
| C. The main session or the human writes every skill, and agents only review. | Simple. Loses the explicit agent binding the workflow asked for. | Fallback. |

Needs human decision: A or C.

**B-2. Stage 3 cannot be performed by necro-architect.** The same `.kiro/**` deny and the "no edits to configs" restriction apply to this agent. Stage 3 edits to `.kiro/agents/*.md` must be applied by the main session or the human, following section 6. This design is the specification they apply.

**B-3. Agent bodies say "Do not invent Skills".** All nine agent bodies contain a variant of this line, and necro-architect's says "Do not create ... Skills". Reading: do not fabricate skills that do not exist. Existing, user-requested skills in `.kiro/skills/` are not inventions. Recommendation: leave the bodies unchanged (Stage 3 must not edit prompts) and record this reading in `skill-catalog.md`. Needs human decision only if the user reads the line as a ban.

## 3. Principles for all seven skills

1. **Cite, do not copy.** Steering (`tech.md`, `structure.md`, `product.md`), agent bodies and the three policies (`shared-ownership-policy.md`, `package-script-policy.md`, `agent-catalog.md`) stay the source of truth. A skill adds procedures and checklists, and links to the steering section by name. A skill never restates a steering rule as new text.
2. **Short `SKILL.md`, long references.** Target 120 to 200 lines per `SKILL.md` and under 300 lines per reference file. `SKILL.md` ends with the links to its references and says when to read each one.
3. **Open decisions stay open.** A skill states "needs human decision" and the `structure.md` number where one applies, and does not choose. Affected: 2, 3, 13 (github-integration, electron-security), 4 (audio-processing), 6, 7, 8, 14 (skin-development), 9 (typescript-standards), 10 to 12 (cross-platform-packaging), 16 (skin-development, electron-security).
4. **No invented APIs.** Skills name an API only when steering names it or the owner confirms it in the library's own documentation (the allow-listed domains for web access are in `agent-catalog.md` section 3). Otherwise they describe the behavior and tell the author to check the docs. Specifically for Octokit, Electron `safeStorage`, `contextBridge`, Web Audio nodes and Electron Builder keys.
5. **No pinned versions.** Skills never state a dependency version, as `tech.md` requires.
6. **No scripts.** No `scripts/` directory in this phase. Procedures are prose and checklists.
7. **Portability.** Skills are plain Markdown with standard front matter only, no Kiro-only keys, no absolute paths, no reference to the user's machine, so other Agent Skills clients and Kiro Cloud Sessions can read them (ASSUMED).
8. **Skills do not widen anything.** They contain no permission instructions and cannot override an agent's write scope. Each skill ends by telling the author to list changes to files outside their scope for the owner.

### Required `SKILL.md` sections (all seven)

Each skill uses the same headings so reviewers can check them mechanically:

1. Front matter (`name`, `description`, and optionally `license: MIT` and `metadata` with `owner` and `schema: 1`; nothing else).
2. `## Scope` with non-goals.
3. `## Procedures` (numbered, actionable).
4. `## Recommended patterns`.
5. `## Anti-patterns`.
6. `## Security considerations`.
7. `## Acceptance criteria` (testable statements).
8. `## Validation checklist` (checkbox list).
9. `## References` (links, each with a "read when" note).

## 4. Skill inventory

Skill directories use the final name: `.kiro/skills/<name>/SKILL.md`.

### 4.1 electron-security

- **Author agent:** desktop-engineer.
- **Activation description (draft):** "Use when adding or changing Electron main-process, preload or renderer-boundary code in NecroAmp: process isolation, contextBridge APIs, IPC channels and Zod payload validation, sender checks, CSP and renderer hardening, filesystem and network boundaries, custom protocol handling, secure credential storage, navigation guards and permission requests. Also use when reviewing such code."
- **Scope:** procedures to implement the mandatory section "Electron architecture and security" of `tech.md`: add an IPC channel end to end (constant, Zod schema, handler with sender validation, narrow preload binding, test), harden windows and navigation, handle permission requests deny-by-default, mediate file access through main, store secrets with the OS credential store.
- **Non-goals:** GitHub API logic (github-integration), skin parsing (skin-development), packaging and Fuses configuration (cross-platform-packaging; this skill only states the runtime expectations), UI design.
- **Procedure content:** channel checklist (name in `src/shared/ipc/channels.ts`, schema, receiving-process validation, sender frame check, error shape that leaks no paths); preload surface review (no `ipcRenderer`, no generic send); CSP review; protocol handler path confinement; `shell.openExternal` allow-list wrapper; permission request and navigation handlers; `safeStorage` flow with the Linux no-keyring case flagged as open decision 3 (needs human decision) and no plaintext fallback proposed without an ADR.
- **Reference files (on demand):**
  - `references/ipc-channel-checklist.md`: the end-to-end steps and a review table. Reason: it is the "add IPC channel" skill planned in `agent-catalog.md` section 8, used by three agents.
  - `references/renderer-hardening-checklist.md`: window options, CSP, navigation and permission handlers, protocol confinement. Reason: a review checklist that security-reviewer reuses.
  - `references/credential-storage-notes.md`: per-platform `safeStorage` behavior to confirm, lifetime of a token in memory, what is never logged. Reason: carries the platform differences and open decision 3, without making it.
- **Agents (explicit `skill://` reference):** desktop-engineer (author, primary), security-reviewer, github-engineer, frontend-engineer, qa-engineer, release-engineer, necro-architect.

### 4.2 audio-processing

- **Author agent:** audio-engineer.
- **Activation description (draft):** "Use when building or changing NecroAmp audio code: Web Audio graph, AudioContext lifecycle and autoplay resume, AudioWorklet processors, playback state, ten-band equalizer parameter mapping, AnalyserNode spectrum and waveform visualization, buffering, latency, gapless expectations, resource cleanup and audio performance. Also use when reviewing or testing audio behavior."
- **Scope:** procedures that implement the signal graph and audio rules in `tech.md`: create and own one `AudioContext`, build the filter chain, map band gain to filter parameters with clamping in pure code, drive visualizations from `requestAnimationFrame` with hidden-window pause, tear down nodes and listeners, keep timing independent of React.
- **Non-goals:** decoding-strategy decision (open decision 4, needs human decision; the skill lists the trade-offs and requires an ADR), React component design (typescript-standards), file scanning and metadata (desktop-engineer), tests (testing-strategy owns structure; audio-engineer writes only co-located unit tests).
- **Procedure content:** context creation and resume after user gesture; state machine for play, pause, seek, end, error; EQ band table and clamp rules; worklet registration, message-port protocol, "no allocation or logging in `process()`"; analyser sizing and smoothing guidance without fixed magic numbers; cleanup on track change and window close; format verification per platform before promising a format (`tech.md`).
- **Reference files:**
  - `references/graph-and-lifecycle.md`: graph diagram (Mermaid), lifecycle states, cleanup list. Reason: the diagram is long and used for review.
  - `references/equalizer-and-dsp-notes.md`: parameter mapping, clamping invariants, which pure functions need property tests. Reason: ties to the required fast-check areas.
  - `references/visualization-and-performance.md`: frame scheduling, visibility pause, allocation rules, measurement approach. Reason: performance details are only needed for visualizer work.
- **Agents:** audio-engineer (author, primary), qa-engineer, necro-architect.

### 4.3 skin-development

- **Author agent:** art-director.
- **Activation description (draft):** "Use when designing, building, validating or reviewing a NecroAmp skin: the declarative manifest, original art direction, Morgul Revenant and Analog 1984 identities, backgrounds, textures, graphical controls, typography, layout and geometry, readability and contrast, asset licensing, and skin validation and security. Skins are complete visual experiences, not color themes."
- **Scope:** how to produce a skin as data (manifest plus static assets) that meets `tech.md` "Skin engine rules" and `product.md` principles 5 and 6; a completeness test that rejects palette-only skins; contrast and readability checks; the asset register and license record procedure; the hand-off to frontend-engineer for schema and loader needs.
- **Non-goals:** the manifest schema and loader code (frontend-engineer, `src/shared/skins/**`), format and packaging choices (open decisions 6 and 7, needs human decision), Winamp `.wsz` import (out of scope per `structure.md`), artwork production method and license (open decision 14, needs human decision), window chrome and multi-window choice (open decision 16, needs human decision).
- **Procedure content:** art bible first (`docs/design/**`); what a skin must transform (materials, geometry, typography, layout, control shapes, textures); each skin's identity summarized from `product.md` and its art bible, not restated; declarative layout authoring; contrast report; `docs/assets.md` entry per asset with author, source, license; limits and rejection rules for validation (path traversal, remote `url()`, `@import`, unknown fields, size and count caps) as tests the skin must pass.
- **Reference files:**
  - `references/skin-completeness-checklist.md`: the "not a color theme" gate with measurable items (distinct control geometry, texture layers, type system, layout variant). Reason: the key quality bar for this skill and reusable in review.
  - `references/skin-validation-and-security.md`: rules a manifest and asset set must satisfy, mapped to the loader's rejection behavior. Reason: shared by art-director, frontend-engineer, qa-engineer and security-reviewer.
  - `references/asset-licensing.md`: register fields, provenance for generated assets, banned sources (Winamp or other third-party skins, names and trademarks). Reason: legal and submission-critical.
- **Agents:** art-director (author, primary), frontend-engineer, qa-engineer, security-reviewer, necro-architect.

### 4.4 github-integration

- **Author agent:** github-engineer.
- **Activation description (draft):** "Use when implementing or reviewing NecroAmp's optional GitHub features in the main process: Octokit client setup, authentication and authorization, token lifecycle and storage, repository and directory browsing, README and source viewing data, GitHub Actions run monitoring, notifications, pagination, rate limits, error handling and offline degradation."
- **Scope:** procedures for a read-only, opt-in, main-process GitHub layer: client factory, auth flow behind an ADR, minimal read-only scopes, typed and Zod-validated results, pagination and rate-limit handling with caching, mapped error types, offline behavior, polling for Actions with backoff, notification triggers.
- **Non-goals:** the auth method decision (open decision 2, needs human decision; the skill states the device-flow assumption already used in `github-engineer.md` until an ADR says otherwise), the Linux token-storage fallback (open decision 3), GitHub Enterprise Server and caching policy (open decision 13), Markdown and code rendering in the renderer (frontend-engineer, with sanitization rules from `tech.md`), notification sounds (open decision 15), any write operation against GitHub.
- **Procedure content:** one client per signed-in session; how to read rate-limit state and back off; how to page without unbounded loops; `unknown` plus Zod at the Octokit boundary; error taxonomy (unauthenticated, forbidden, not found, rate-limited, network, unexpected) and what the renderer sees; offline: cached data marked stale, no retry storm, app fully usable when signed out; Actions polling cadence is a parameter, not a magic number; token never reaches the renderer or logs.
- **Reference files:**
  - `references/auth-and-token-lifecycle.md`: flow states, sign-out and revocation, storage by calling electron-security. Reason: highest-risk area, plus the open-decision map.
  - `references/rate-limits-pagination-offline.md`: algorithms and test cases. Reason: reused by qa-engineer for mock design.
  - `references/actions-monitoring.md`: run and job status model, polling and notification rules. Reason: only needed for the monitor feature.
- **Agents:** github-engineer (author, primary), security-reviewer, qa-engineer, desktop-engineer (IPC channels and token storage are shared), necro-architect.

### 4.5 typescript-standards

- **Author agent:** frontend-engineer.
- **Activation description (draft):** "Use when writing or reviewing NecroAmp TypeScript and React code in any process: strict-mode typing, React component design, Zustand stores, module boundaries and dependency direction, shared contracts and Zod schemas, error handling, accessibility, rendering performance and maintainability."
- **Scope:** coding procedures that apply `tech.md` "Language and code rules" and `structure.md` "Dependency direction" and naming: typing at boundaries (`unknown` plus Zod), result and error modeling, store slicing and selectors, feature public `index.ts`, component props and composition, keyboard and screen-reader basics, memoization only with evidence, pure-logic extraction.
- **Non-goals:** styling approach (open decision 8), lint and formatter tool choice (open decision 9), Electron security details (electron-security), audio internals (audio-processing), test design (testing-strategy). Both open decisions need human decision.
- **Reference files:**
  - `references/react-zustand-patterns.md`: store layout, selectors, side-effect placement, anti-patterns. Reason: the most repeated review topic.
  - `references/accessibility-checklist.md`: keyboard, focus, labels, contrast, reduced motion for a skinnable UI. Reason: skins can break accessibility, so a checklist is needed.
  - `references/shared-contracts-and-errors.md`: where schemas live, change-note triggers from `shared-ownership-policy.md`, error type conventions. Reason: it links the ownership policy to coding steps without duplicating it.
- **Agents:** frontend-engineer (author, primary), desktop-engineer, audio-engineer, github-engineer, qa-engineer, necro-architect.

### 4.6 testing-strategy

- **Author agent:** qa-engineer.
- **Activation description (draft):** "Use when planning, writing or reviewing NecroAmp tests: Vitest unit and integration tests, fast-check property tests, Playwright Electron smoke and end-to-end tests, fixtures, mocking external APIs, security regression tests, audio and skin validation tests, and traceability from acceptance criteria to tests."
- **Scope:** how to turn acceptance criteria into tests; which areas require property tests (list in `tech.md`, cited); fixture rules (small, license-clean, offline, deterministic); mocking of GitHub with recorded or mocked responses and no real token; Electron e2e launch and cleanup; regression tests for each security rule; audio decode checks per platform; skin rejection tests.
- **Non-goals:** writing production code or patching defects (report to the owner, per `qa-engineer.md`), CI workflow files (release-engineer), choosing new test tools.
- **Reference files:**
  - `references/property-test-catalog.md`: each required area with its invariants. Reason: a checklist that stays out of `SKILL.md`.
  - `references/electron-e2e-and-fixtures.md`: launch, isolation of user data, fixture registry and license record link. Reason: the fixtures and e2e setup are only needed for those tasks.
  - `references/traceability-and-security-regression.md`: requirement ID to test mapping format, and the list of security regressions to keep. Reason: it supports the "acceptance criteria traceability" requirement.
- **Agents:** qa-engineer (author, primary), necro-architect (requirements traceability), release-engineer (CI test steps), security-reviewer is not mapped (it reviews tests through the shared references of electron-security and skin-development).

### 4.7 cross-platform-packaging

- **Author agent:** release-engineer.
- **Activation description (draft):** "Use when configuring or reviewing NecroAmp packaging and CI builds: Electron Builder configuration, Windows x64 installers, macOS arm64 and x64 packages, Linux DEB and AppImage, GitHub Actions native runners, reproducible installs with pnpm, artifact verification, code signing considerations, and keeping build separate from publication. Nothing is ever published by these procedures."
- **Scope:** configuration principles (targets, per-OS settings, resources, ASAR and Fuses expectations from `tech.md`), CI matrix on native runners with `pnpm install --frozen-lockfile`, SHA-pinned Actions and least-privilege `permissions:`, artifact checks (names, architectures, checksums, installer launch smoke where possible), signing as an input policy, build job with no publish permission.
- **Non-goals:** deciding auto-update (open decision 10), signing and notarization availability (11), Linux target set (12, the task names DEB and AppImage; recorded as user input pending an ADR), tag creation (human approval only), creating a release, adding secrets, editing `package.json` (desktop-engineer) or application code.
- **Reference files:**
  - `references/builder-config-principles.md`: per-OS target table, `--publish never`, what must not appear in config. Reason: one place to check against `package-script-policy.md`.
  - `references/ci-matrix-and-verification.md`: runner matrix, job permissions, artifact verification list. Reason: used when writing workflows.
  - `references/signing-considerations.md`: unsigned build behavior, what to ask the human, secret handling rules. Reason: depends on open decision 11, so the facts must be kept apart from the procedures.
- **Agents:** release-engineer (author, primary), desktop-engineer, security-reviewer, necro-architect, qa-engineer.

## 5. Agent-to-skill mapping

Each cell is one explicit `skill://.kiro/skills/<name>/SKILL.md` entry. Skills cost only metadata at startup (ASSUMED), so the matrix is chosen by relevance, not by token budget.

| Agent | electron-security | audio-processing | skin-development | github-integration | typescript-standards | testing-strategy | cross-platform-packaging | Count |
|---|---|---|---|---|---|---|---|---|
| necro-architect | x | x | x | x | x | x | x | 7 |
| desktop-engineer | **author** | | | | x | | x | 3 |
| audio-engineer | | **author** | | | x | | | 2 |
| frontend-engineer | x | | x | | **author** | | | 3 |
| art-director | | | **author** | | | | | 1 |
| github-engineer | x | | | **author** | x | | | 3 |
| security-reviewer | x | | x | x | | | x | 4 |
| qa-engineer | x | x | x | x | x | **author** | x | 7 |
| release-engineer | x | | | | | x | **author** | 3 |

Rationale:

- necro-architect reviews designs across all areas and owns the open decisions behind every skill. It writes no code, so the extra metadata is the only cost.
- security-reviewer gets the four skills with a trust boundary. It does not get audio-processing, typescript-standards or testing-strategy; their security aspects appear in electron-security references.
- qa-engineer tests every area and needs the pass criteria of each. It gets all seven. Authors of the other skills do not write tests, because only qa-engineer may write `*.property.test.ts` and `*.integration.test.ts`.
- release-engineer gets electron-security for Fuses and hardening expectations and testing-strategy for the CI test step. It gets no GitHub skill: it handles Actions workflow files, not the app's GitHub feature.
- art-director gets only skin-development, matching its write scope (`skins/**`, `docs/design/**`, `docs/assets.md`).
- audio-engineer gets typescript-standards for shared code rules and avoids the renderer-feature skills.

## 6. Stage 3: editing `.kiro/agents` safely

Preconditions: skills exist and parse (Stage 2 output, section 2 B-1), and the section 1.3 confirmation says `skill://` is the right form. Whoever applies the edits needs permission to write `.kiro/agents/` (main session or human, B-2).

1. **Append only.** In each agent's front matter, add `skill://` lines under the existing `resources:` list after the `file://.kiro/steering/**/*.md` line. Keep the steering line unchanged. Example shape:

   ```yaml
   resources:
     - file://.kiro/steering/**/*.md
     - skill://.kiro/skills/electron-security/SKILL.md
   ```

2. **Explicit, not glob.** Use one entry per mapped skill (section 5), not `skill://.kiro/skills/**/SKILL.md`. This keeps each agent's skill set reviewable and prevents a future skill from reaching an agent that was not mapped. Revisit if the section 1.3 check shows custom agents inherit workspace skills anyway (then the explicit list only documents intent and the mapping must be tested).
3. **Do not touch** `tools`, `permissions`, `includeMcpJson`, `includePowers`, the body, `name` or `description`. Do not add a `skill` allow rule: allow rules never override deny, and an allow adds nothing needed. Optional later hardening (an explicit `skill` rule limited to the mapped names) is a separate, human-approved change, and only if the matcher semantics are confirmed.
4. **No regeneration.** Use targeted string edits to the `resources` block. Never rewrite a whole agent file (the Phase 02 fix loop showed the failure mode, `kiro-journal.md` section 9).
5. **Check each file after editing:** parse the front matter with PyYAML (Python is available, `agent-validation.md`); compare the parsed result to the pre-edit parse and confirm the only difference is the added `resources` items; confirm the file is otherwise byte-identical apart from those lines; confirm `name` still equals the file stem; check each `skill://` path exists.
6. **Record** each edit as a line in `docs/engineering/skill-catalog.md` and the journal.
7. **Resource limits:** each agent adds at most 6 entries on top of the 4 steering files, far below the 32-file limit (DOCUMENTED, `agent-validation.md` section 3).
8. **Rollback:** the edit is additive. Removing the added lines restores Phase 02 behavior. Nothing else is touched.

## 7. Risks and assumptions

- All Kiro skill facts are ASSUMED (section 1). The most likely failure modes: the `skill://` form differs, custom agents inherit or do not inherit workspace skills, `name` or `description` limits are stricter than assumed. Each affects front matter or the `resources` line only.
- B-1 blocks Stage 2 as the workflow is written. B-2 blocks necro-architect from Stage 3.
- Descriptions are drafts. Stage 2 authors may tighten them but must keep them under 1024 characters, one paragraph, in "Use when..." form with concrete trigger terms, and must not name other skills.
- Overlap to manage: IPC and token storage (electron-security with github-integration), shared contracts (typescript-standards with `shared-ownership-policy.md`), skin loader (skin-development with typescript-standards). In each case one skill owns the procedure and the other links to it. The owner is the author of the first-named skill in this list.
- Open decisions (`structure.md`) are untouched. Items marked "needs human decision" above: 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16; and B-1, B-3 of this document.

## 8. Hand-off

| Work item | Owner |
|---|---|
| Confirm section 1.3 against kiro.dev and agentskills.io | Human or any agent with web access (necro-architect cannot) |
| Decide B-1 option A or C | Human |
| Copy this design to `.agents/tasks/engineering-skills/skill-design.md` if required | Main session or human |
| Author the seven skills | Bound agents per section 4, files written by the main session (option A) |
| Apply section 6 edits to `.kiro/agents/*.md` | Main session or human |
| Review skills for conformance and security | security-reviewer and qa-engineer, each independent of the author of the skill reviewed |
| `docs/engineering/skill-catalog.md`, journal update | Stage 5 owner. No current agent has `docs/engineering/**` write scope: main session |
