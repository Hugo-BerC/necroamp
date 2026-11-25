# NecroAmp Phase 03: final independent skills review (QA)

Reviewer: qa-engineer. One pass. Report only; no skill, agent or steering file was changed.
Scope: electron-security, audio-processing, skin-development, github-integration, typescript-standards, cross-platform-packaging, plus the `skill://` mappings in `.kiro/agents/*.md`. testing-strategy is excluded (authored by this reviewer).
Supersedes `docs/engineering/reviews/skills-qa-review.md` for the files above. Its missing-file findings no longer apply.

Evidence classes: VERIFIED (read or run in this review), DOCUMENTED (stated on an official page I fetched), ASSUMED (neither). I fetched no external page, so nothing here is DOCUMENTED.

## Verdict

**Approved: true. Blocking findings: none.**
The advisory findings below are non-blocking. Finding A1 should be closed by the manual activation test before the submission video.

## 1. Checks and results

| Check | Result | Evidence |
|---|---|---|
| Seven `.kiro/skills/<name>/SKILL.md` exist, each with 3 reference files (28 files total) | Pass | VERIFIED (directory listing) |
| Front matter parses with a real YAML parser (PyYAML via `python`) for all 7 skills and all 9 agents | Pass | VERIFIED (this review). The earlier evidence only ran a structural regex. |
| Skill front matter keys are `name`, `description`, `license`, `metadata` only. `metadata` is a string map (`owner`, `schema: "1"`). `name` equals the directory. | Pass | VERIFIED |
| Description length (limit 1024 under the Agent Skills spec) | Pass: 386, 439, 386, 354, 374, 292 chars | VERIFIED (parsed). The 1024 limit itself is ASSUMED from memory of agentskills.io. |
| Descriptions state trigger conditions ("Use when ...") and name concrete topics | Pass | VERIFIED |
| Required sections (Scope, Procedures, Recommended patterns, Anti-patterns, Security considerations, Acceptance criteria, Validation checklist, References) in all six | Pass | VERIFIED |
| `SKILL.md` size: 113 to 164 lines | Pass (well below 500) | VERIFIED |
| Reference files named in each `SKILL.md` exist | Pass | VERIFIED |
| Repo paths cited in skills that do not exist (`docs/adr/`, `docs/assets.md`, `docs/audio/format-support.md`, `docs/design/skin-engine-requirements.md`, `docs/architecture/contract-changes.md`, `docs/testing/platform-matrix.md`, `docs/testing/defects/`) | Expected. These are outputs the skills tell agents to create. | VERIFIED (absent) |
| Policy section cites resolve: `shared-ownership-policy.md` sections 1, 3 and 3.4; `package-script-policy.md` sections 4.1 and 4.2 | Pass | VERIFIED (heading list) |
| 33 `skill://` lines match section 3 of `skill-integration-report.md` (7+3+2+3+1+3+4+7+3) per agent | Pass | VERIFIED (parsed `resources` lists; counts and targets read) |
| Every `skill://` target exists; `tools`, `includeMcpJson`, `includePowers`, `permissions.rules` unchanged | Pass | VERIFIED for targets and tool lists. "Unchanged" is VERIFIED from the orchestrator's `git diff` record in `skill-copy-evidence.md`, which I read but did not re-run. |
| No permission widened | Pass | VERIFIED (tool lists read; add-only diff per the record above) |
| Mapping fits each agent's role and write scope | Pass, see A4 | VERIFIED (fs_write scopes read) |
| Agent skill paths agree with write scopes the skills assign (art-director: `skins/**`, `docs/design/**`, `docs/assets.md`; audio-engineer: `docs/audio/**`; release-engineer: `docs/release/**`, workflows, `electron-builder.yml`; frontend-engineer: `src/shared/skins/**`; github-engineer: `src/main/github/**`, `src/shared/github/**`) | Pass | VERIFIED |
| Skills do not contradict `tech.md`, `product.md`, `structure.md` | Pass | VERIFIED (read against steering text) |
| Open decisions (2, 3, 4, 6 to 16) cited, not decided | Pass | VERIFIED |
| `skill://` is a supported agent resource form and Kiro IDE 1.5.11 loads these skills | Not established by me | ASSUMED. The orchestrator record says all seven skills appear in its catalog (VERIFIED by them, not by me). |
| An agent sees only its mapped skills | Not tested | ASSUMED (see A1) |

Tool note: every shell call ended with "Exit Code: -1" while returning correct output. I treated that as a tool display artifact, not as a failed command, and continued. I did not stop on it.

## 2. Findings

No BLOCKING findings.

| ID | Severity | Skill or file | Finding | Evidence | Owner |
|---|---|---|---|---|---|
| A1 | Medium, non-blocking | `.kiro/agents/*.md` | Nobody has shown that custom agents load only their mapped skills. If Kiro exposes all workspace skills to every agent, the explicit mapping only documents intent. The 33 lines are valid YAML but their effect in a custom-agent session is unproven. Run the manual test (Section 4) and record the result. | ASSUMED | necro-architect or human |
| A2 | Low | `.kiro/agents/qa-engineer.md`, `security-reviewer.md` | Both agent bodies still say "Do not invent Skills, Hooks, Specs or MCP servers." The seven skills now exist, so an agent could read that line as a reason to ignore them. The integration report (B-3) chose to read it as "do not fabricate". No change is required if that reading is accepted. | VERIFIED (text present) | necro-architect |
| A3 | Low | github-integration | The skill points to testing-strategy ("see testing-strategy") for fakes, but github-engineer is not mapped to testing-strategy. The skill works without it. Same pattern: typescript-standards names audio-processing and github-integration, which frontend-engineer is not mapped to. These are name references only. | VERIFIED | necro-architect (optional) |
| A4 | Low | `.kiro/agents/audio-engineer.md` | audio-processing tells the engineer to raise CSP and custom-protocol needs with the Electron security owner and hands data over via the protocol, but audio-engineer is not mapped to electron-security. Acceptable, because the skill delegates rather than implements. | VERIFIED | necro-architect (optional) |
| A5 | Low | github-integration, section "Security considerations" | The cross-skill link uses both a repo path and a relative path (`../electron-security/references/credential-storage-notes.md`). The relative form breaks if a skill is copied alone to another Agent Skills client (portability goal). The skill stays usable without it, because the rules it needs are summarized. | VERIFIED | wf-coder |
| A6 | Low | electron-security `credential-storage-notes.md` | The availability check relies on "encryption available". On Linux, `safeStorage` may report available while using a weak backend. The note already lists "how to detect a weak backend" as a fact to confirm. Make sure the ADR for open decision 3 closes it. | ASSUMED (Electron behavior recalled from memory, not fetched) | desktop-engineer |
| A7 | Low | electron-security | The skill covers navigation, `window.open`, permissions, CSP and webview (checklist item "Webview tags are not enabled"). It does not mention privileged custom-scheme registration (`registerSchemesAsPrivileged` flags such as `secure`, `bypassCSP`, `corsEnabled`), which affects the media and skin protocol. Add a line when the protocol is implemented. | VERIFIED (grep of references found no match); API name is ASSUMED | desktop-engineer |
| A8 | Low | audio-processing `equalizer-and-dsp-notes.md` | Invariant 7 ("`clampFrequency(hz, sr)` is below Nyquist and at least the minimum") cannot hold when Nyquist is below the 20 Hz minimum (sample rate under 40 Hz). Property tests should restrict `sr` to a realistic range (for example 8000 to 192000) or the invariant should say so. Band centers (31.25 to 16000 Hz) and the plus or minus 12 dB range are labeled ASSUMPTION and are not promises. | VERIFIED | audio-engineer, qa-engineer |
| A9 | Low | cross-platform-packaging `ci-matrix-and-verification.md` | The CI table lists `macos-latest` for the `ci` job. The packaging table handles the macOS x64 runner problem ("Intel runner if still offered, otherwise x64 build on Apple silicon with verified architecture"), which is honest. The risk is that AC5 requires a macOS x64 DMG, but the cross-build route is not proven to produce a launchable binary. Verify on a native x64 runner or by an architecture check plus a launch smoke before promising x64. | VERIFIED (text); runner availability ASSUMED | release-engineer |
| A10 | Informational | typescript-standards | The description says "in any process", so it may activate on nearly every TypeScript edit. It is the broadest description of the six, and 292 characters long. Not a defect, but it may reduce how well Kiro can pick between skills. | VERIFIED | none |
| A11 | Informational | skin-development | Prefers SVG and requires no scripts, `foreignObject`, remote `url()` or `@import` in assets. This is stricter than `tech.md` and consistent with it. It correctly leaves skin format, packaging, styling, window chrome and artwork production (decisions 6, 7, 8, 14, 16) open. The 4.5:1 and 3:1 contrast targets follow WCAG 2.x as stated; the standard itself is ASSUMED from memory. | VERIFIED | none |

## 3. Per-skill assessment

| Skill | Technical accuracy | Security | Activation | Steering consistency |
|---|---|---|---|---|
| electron-security | Sound. Sender check, Zod parse, narrow preload, fail-closed, path confinement incl. symlinks, https allow-list wrapper. API names beyond `senderFrame` are marked ASSUMED. | Strong. No token to the renderer or logs, no plaintext fallback. | Clear trigger and review use | Consistent with `tech.md` Electron and IPC rules. Decisions 3, 10, 16 not decided. |
| audio-processing | Graph order matches `tech.md`. Worklet rules (no allocation or logging in `process()`, 128-frame quanta, `MessagePort`) are correct. Decision 4 handled behind `PlaybackSource`. | Presets validated with Zod, protocol URLs only, no `unsafe-eval`. | Clear | Consistent. See A8. |
| skin-development | Declarative and data-only. Control table, art bible and completeness gate make skins more than recolors. Two identities are described without third-party names. | Rejects scripts, `..`, remote URLs, unknown fields. Defers loader to frontend-engineer. | Clear | Consistent with `product.md` principles 5 and 6 and `tech.md` skin rules. |
| github-integration | Read-only, opt-in, main-process. Bounded pagination, rate-limit state, typed error union, backoff with jitter, offline stale cache. Octokit and REST details are labeled ASSUMED and must be checked in docs. | Token only through the storage interface. Inert data. No writes. Web access limited as the agent definition allows. | Clear | Consistent. Auth method (decision 2) labeled ASSUMED. See A3 and A5. |
| typescript-standards | Matches `tech.md` and `structure.md` rules. High-frequency data kept out of React state. Library APIs labeled ASSUMED where not in steering. | Avoids `dangerouslySetInnerHTML`, no secrets in renderer state. | Broad (A10) | Consistent. Decisions 8 and 9 left open. |
| cross-platform-packaging | Native runners per OS, frozen install, SHA-pinned Actions, `--publish never`, build and publication separated, unsigned-first policy. Builder keys marked "confirm on electron.build". | Least-privilege permissions, no `pull_request_target`, secrets only in the release job, no hooks that use the network. | Clear, states it never publishes | Consistent with `tech.md` CI/CD. Decisions 10, 11, 12 cited. See A9. |

## 4. Manual activation test (closes A1)

1. In Kiro IDE 1.5.11, select the `art-director` agent. Ask: "Which skills can you see?" Expect only `skin-development`.
2. Repeat for `github-engineer`. Expect `github-integration`, `electron-security`, `typescript-standards`.
3. Repeat for `necro-architect` and `qa-engineer`. Expect all seven.
4. If an agent lists skills outside its mapping, record that custom agents inherit workspace skills. The mapping then only documents intent. Update `docs/engineering/skill-catalog.md` to say so.
5. Ask `desktop-engineer`: "I need to add an IPC channel." Expect electron-security to activate.
6. Record each result as VERIFIED in `docs/kiroween/kiro-journal.md`.

## 5. Gaps in this review

- I read all six `SKILL.md` files in full. I read five reference files in full (builder config, signing, credential notes, auth lifecycle, DSP notes) and searched the rest (CI matrix, renderer hardening, rate limits) by keyword. The remaining reference files were not read line by line.
- No external documentation was fetched. Claims about Electron, Octokit, GitHub REST, Electron Builder and Kiro configuration are ASSUMED, as the skills themselves say.
- I did not re-run the orchestrator's `git diff` checks.
- No application code exists yet, so no test could exercise the skills' acceptance criteria.

## 6. Evidence reused from earlier reports

Reused: the "no skill needs a tool grant" reasoning and the add-only diff record from `skill-integration-report.md` and `skill-copy-evidence.md` (documented there, not re-run). Dropped: every missing-file finding from `skills-qa-review.md`, `skills-review.md` and `review-gate.json`, which no longer holds.
