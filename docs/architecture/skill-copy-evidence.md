# Skill authoring, copy and integration evidence

Phase 03, unrestricted-agent step. Nothing was committed, pushed or installed. No steering file, tool permission or other agent field was changed.

Evidence classes: **VERIFIED** observed in this repository or by a command in this step. **DOCUMENTED** stated on a page fetched in this step. **ASSUMED** neither.

## 1. Files created

Authored skills (staging, then copied):

| Path | Notes |
|---|---|
| `docs/engineering/skills-staging/electron-security/SKILL.md` | New |
| `docs/engineering/skills-staging/electron-security/references/ipc-channel-checklist.md` | New |
| `docs/engineering/skills-staging/electron-security/references/renderer-hardening-checklist.md` | New |
| `docs/engineering/skills-staging/electron-security/references/credential-storage-notes.md` | New |
| `docs/engineering/skills-staging/github-integration/SKILL.md` | New |
| `docs/engineering/skills-staging/github-integration/references/auth-and-token-lifecycle.md` | New |
| `docs/engineering/skills-staging/github-integration/references/rate-limits-pagination-offline.md` | New |
| `docs/engineering/skills-staging/github-integration/references/actions-monitoring.md` | New |
| `docs/engineering/skills-staging/typescript-standards/SKILL.md` | New |
| `docs/engineering/skills-staging/typescript-standards/references/react-zustand-patterns.md` | New |
| `docs/engineering/skills-staging/typescript-standards/references/accessibility-checklist.md` | New |
| `docs/engineering/skills-staging/typescript-standards/references/shared-contracts-and-errors.md` | New |

Copies, byte-identical to staging, 4 files per skill (28 files):
`.kiro/skills/{electron-security,github-integration,typescript-standards,skin-development,cross-platform-packaging,audio-processing,testing-strategy}/SKILL.md` and each `references/*.md`.

This file: `docs/architecture/skill-copy-evidence.md`.

## 2. Files edited

Nine agent files, additive `resources` lines only, inserted directly after `  - file://.kiro/steering/**/*.md`, using each file's own line endings. Form: `  - skill://.kiro/skills/<name>/SKILL.md`, explicit, no glob. Mapping is `skill-integration-report.md` section 3.

| Agent | Lines added | Skills |
|---|---|---|
| necro-architect | 7 | all seven |
| desktop-engineer | 3 | electron-security, typescript-standards, cross-platform-packaging |
| audio-engineer | 2 | audio-processing, typescript-standards |
| frontend-engineer | 3 | typescript-standards, electron-security, skin-development |
| art-director | 1 | skin-development |
| github-engineer | 3 | github-integration, electron-security, typescript-standards |
| security-reviewer | 4 | electron-security, skin-development, github-integration, cross-platform-packaging |
| qa-engineer | 7 | all seven |
| release-engineer | 3 | cross-platform-packaging, electron-security, testing-strategy |

Format note: the agents are Markdown files with YAML front matter, not JSON. `ConvertFrom-Json` does not apply to them.

## 3. Validation results

| Check | Result | Class |
|---|---|---|
| `git diff --numstat .kiro/agents`: 33 insertions, 0 deletions, matches the report (7+3+2+3+1+3+4+7+3) | Pass | VERIFIED |
| Every `skill://` path in every agent resolves to an existing file | Pass (0 missing) | VERIFIED |
| Each SKILL.md opens with `---`, closes with `---`, `name` equals directory name, keys limited to `name`, `description`, `license`, `metadata` | Pass, 7 of 7 | VERIFIED |
| Quoted descriptions: lengths 386, 386, 354, 310, 292 (all under 1024). Two staged skills use `>-` block scalars | Pass | VERIFIED |
| Required headings present in all seven (Scope, Procedures, Recommended patterns, Anti-patterns, Security considerations, Acceptance criteria, Validation checklist, References) | Pass | VERIFIED |
| SHA-256 of each file in `.kiro/skills/` equals its staging source | Pass, no differences | VERIFIED |
| Agent front matter closing `---` still found after edit (line 39 to 62) | Pass | VERIFIED |
| Full YAML parse with a YAML library | **Not run.** No Python on PATH, and no YAML module checked. Structural checks above stand in. Run a real parser (or open the agents in Kiro) before relying on it | VERIFIED (gap) |

## 4. Fact classification

| Fact | Class | Source |
|---|---|---|
| Workspace skills live in `.kiro/skills/`, global in `~/.kiro/skills/`, workspace wins on name clash | DOCUMENTED | https://kiro.dev/docs/skills/ fetched this step |
| Custom agents load skills through `skill://` entries in `resources`. Specific paths and globs are supported | DOCUMENTED | same page (example `skill://.kiro/skills/*/SKILL.md`) and its troubleshooting row "Add skill:// URIs to the agent's resources field" |
| Front matter fields: `name` (must match folder, lowercase letters, digits, hyphens, max 64), `description` (max 1024), optional `license`, `compatibility`, `metadata` | DOCUMENTED | same page |
| `references/` files load only when SKILL.md directs it | DOCUMENTED | same page |
| Kiro IDE 1.5.11 supports these features | ASSUMED | The page states IDE support. It names 1.4.178 and 1.4.236 for other features. Not tested on 1.5.11 |
| Custom agents do not inherit workspace skills unless listed | ASSUMED | Docs say custom agent "missing skills" is fixed by adding `skill://`. Inheritance not tested. Run the manual activation test |
| The custom agent configuration reference page was not fetched | VERIFIED (gap) | The CLI reference URL returned no `skill://` match. The agents here are `.md` files, so the JSON examples on the skills page are only an analogy. The `resources:` YAML key with `skill://` strings is ASSUMED to behave the same |
| All agents have `resources: [steering]` only before the edit | VERIFIED | `skill-integration-report.md` section 2, and the diff |
| Agent prompt line "Do not invent Skills" is read as "do not fabricate" | ASSUMED | Design finding B-3. Prompts unchanged |
| Contents of the three new skills about Electron, Octokit, GitHub REST, Zustand, React and WCAG behavior | ASSUMED | Each is labeled ASSUMED inside the skills where no steering text or fetched page backs it. No library API names were invented, no versions pinned, no scripts added |
| Steering rules cited by the skills | VERIFIED | Read from `.kiro/steering/*.md` (supplied in session rules) |
| Open decisions 2, 3, 4, 8, 9, 10, 13, 15, 16 left unresolved and flagged "needs human decision" in the new skills | VERIFIED | Text of the new skills |

## 5. Open items for the human

1. Run a real YAML parser on the nine agent files and seven SKILL.md files.
2. Manual activation test in Kiro IDE 1.5.11: select each agent and ask "Which skills can you see?". Expect exactly the mapped skills. Record the result as VERIFIED.
3. The new skills received no independent review yet (Stage 4).
4. Untracked folders such as `.agents/`, `docs/security/` existed before this step and were not touched.
