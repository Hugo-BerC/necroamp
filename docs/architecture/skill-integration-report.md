# NecroAmp Engineering Skills: Stage 3 integration record

Phase 03, Stage 3 (agent integration). Author: necro-architect.
Status: **Specification only. necro-architect changed no file under `.kiro/`.** Human decision received: an unrestricted wf-coder run (`wf_8f7b43c34040e187`) executes Stage 3. It authors the three missing skills, copies all seven to `.kiro/skills/`, and applies section 3 of this report. Its evidence, including the after-state of the tool-related fields, is recorded in `docs/architecture/skill-copy-evidence.md`. The blockers in section 1 describe the state before that run.

**Location note.** The task asked for `.agents/tasks/engineering-skills/integration-report.md`. necro-architect may write only `docs/adr/**`, `docs/architecture/**` and `docs/requirements/**` (VERIFIED, `.kiro/agents/necro-architect.md` `permissions.rules`). This file is the substitute. The design input was also read from its substitute path, `docs/architecture/engineering-skills-design.md`, because `.agents/tasks/engineering-skills/skill-design.md` does not exist (VERIFIED, path not found).

Evidence classes: **VERIFIED** read in this repository during this step. **DOCUMENTED** stated on a fetched kiro.dev or agentskills.io page. **ASSUMED** neither. necro-architect has `web_fetch` denied, so https://kiro.dev/docs/custom-agents/configuration-reference/ could not be read. No statement here is DOCUMENTED.

## 1. Blockers

| ID | Finding | Evidence | Effect |
|---|---|---|---|
| S3-1 | `.kiro/skills/` does not exist. The skills were staged in agent doc scopes instead. | VERIFIED (`.kiro/` contains only `agents/` and `steering/`) | A `skill://.kiro/skills/...` entry would point at a missing file. Agent bodies say "Reference only files that exist", so no entry can be added yet. |
| S3-2 | Only four of seven skills exist, all in staging: `docs/audio/skills-staging/audio-processing/SKILL.md`, `docs/design/skills-staging/skin-development/SKILL.md`, `docs/testing/skills-staging/testing-strategy/SKILL.md`, `docs/release/skills-staging/cross-platform-packaging/SKILL.md`. **electron-security, github-integration and typescript-standards are missing** (no file with these names anywhere in the workspace). | VERIFIED (file search) | Stage 2 is incomplete for desktop-engineer, github-engineer and frontend-engineer. |
| S3-3 | necro-architect cannot write `.kiro/**` (explicit `fs_write` deny) and its role forbids config edits. | VERIFIED (agent rules) | Design finding B-2 holds. The main session or the human must apply section 3. |
| S3-4 | The `skill://` resource form and custom-agent skill inheritance could not be checked against kiro.dev. | ASSUMED | Section 3 uses the form from the design (section 1.2). Confirm before applying. |

Recommended resolution (option A from the design, B-1): the main session (1) re-runs or completes Stage 2 for the three missing skills, (2) copies all seven staged skill directories unchanged to `.kiro/skills/<name>/`, (3) confirms the `skill://` form on kiro.dev, (4) applies section 3 exactly. Staging under `docs/` is not discoverable by Kiro as skills (ASSUMED: Kiro scans `.kiro/skills/` and `~/.kiro/skills/`). `.kiro/skills/` is committed with `.kiro/`, which keeps the skills portable to Cloud Sessions and other Agent Skills clients (ASSUMED).

Staged front matter check (VERIFIED by reading): all four staged skills use only `name`, `description`, `license: MIT`, `metadata` (`owner`, `schema: "1"`). Each `name` equals its directory name. No unsupported key is present.

## 2. Before state of tool-related fields (VERIFIED, all nine agents)

Every agent file has the same structure at lines 2 to 8: `name`, `description`, `tools`, `includeMcpJson: false`, `includePowers: false`, `resources:` with the single item `- file://.kiro/steering/**/*.md`, then `permissions:`. No agent has `allowedTools`, `toolsSettings`, a `skill://` resource or a `skill` permission rule.

| Agent file | `tools` | `includeMcpJson` | `includePowers` | `resources` | `allowedTools` / `toolsSettings` |
|---|---|---|---|---|---|
| `necro-architect.md` | `["read", "write"]` | false | false | steering only | absent |
| `desktop-engineer.md` | `["read", "write", "shell"]` | false | false | steering only | absent |
| `audio-engineer.md` | `["read", "write", "shell"]` | false | false | steering only | absent |
| `frontend-engineer.md` | `["read", "write", "shell"]` | false | false | steering only | absent |
| `art-director.md` | `["read", "write"]` | false | false | steering only | absent |
| `github-engineer.md` | `["read", "write", "shell", "web"]` | false | false | steering only | absent |
| `security-reviewer.md` | `["read", "write", "web"]` | false | false | steering only | absent |
| `qa-engineer.md` | `["read", "write", "shell"]` | false | false | steering only | absent |
| `release-engineer.md` | `["read", "write", "shell", "web"]` | false | false | steering only | absent |

`permissions.rules` blocks were not changed and must not be changed. Required after-state: every column above is byte-identical except `resources`, which gains only the lines in section 3.

## 3. Exact lines to add (pending, apply after S3-1 to S3-4 are cleared)

Insert directly after the line `  - file://.kiro/steering/**/*.md` in each file. Two-space indent, matching the existing item. Explicit per-skill entries, no glob, per design section 6 step 2. Mapping from design section 5.

**necro-architect.md** (7)
```yaml
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/audio-processing/SKILL.md
  - skill://.kiro/skills/skin-development/SKILL.md
  - skill://.kiro/skills/github-integration/SKILL.md
  - skill://.kiro/skills/typescript-standards/SKILL.md
  - skill://.kiro/skills/testing-strategy/SKILL.md
  - skill://.kiro/skills/cross-platform-packaging/SKILL.md
```

**desktop-engineer.md** (3)
```yaml
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/typescript-standards/SKILL.md
  - skill://.kiro/skills/cross-platform-packaging/SKILL.md
```

**audio-engineer.md** (2)
```yaml
  - skill://.kiro/skills/audio-processing/SKILL.md
  - skill://.kiro/skills/typescript-standards/SKILL.md
```

**frontend-engineer.md** (3)
```yaml
  - skill://.kiro/skills/typescript-standards/SKILL.md
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/skin-development/SKILL.md
```

**art-director.md** (1)
```yaml
  - skill://.kiro/skills/skin-development/SKILL.md
```

**github-engineer.md** (3)
```yaml
  - skill://.kiro/skills/github-integration/SKILL.md
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/typescript-standards/SKILL.md
```

**security-reviewer.md** (4)
```yaml
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/skin-development/SKILL.md
  - skill://.kiro/skills/github-integration/SKILL.md
  - skill://.kiro/skills/cross-platform-packaging/SKILL.md
```

**qa-engineer.md** (7)
```yaml
  - skill://.kiro/skills/testing-strategy/SKILL.md
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/audio-processing/SKILL.md
  - skill://.kiro/skills/skin-development/SKILL.md
  - skill://.kiro/skills/github-integration/SKILL.md
  - skill://.kiro/skills/typescript-standards/SKILL.md
  - skill://.kiro/skills/cross-platform-packaging/SKILL.md
```

**release-engineer.md** (3)
```yaml
  - skill://.kiro/skills/cross-platform-packaging/SKILL.md
  - skill://.kiro/skills/electron-security/SKILL.md
  - skill://.kiro/skills/testing-strategy/SKILL.md
```

Partial option, if the human wants integration before the three missing skills exist: apply only the lines for `audio-processing`, `skin-development`, `testing-strategy` and `cross-platform-packaging`, after those four are copied to `.kiro/skills/`. Then add the rest when Stage 2 completes. Needs human decision.

## 4. Left unchanged, and why

| Item | Reason |
|---|---|
| `tools`, `permissions.rules`, `includeMcpJson`, `includePowers` | Task forbids widening permissions. Skill loading needs no tool grant (ASSUMED). No `skill` allow rule: it grants nothing that a missing deny does not already allow, and adds review surface. |
| `allowedTools`, `toolsSettings` | Not present before. Not added. |
| `name`, `description`, prompt bodies | Not required for skill integration. The "Do not invent Skills" line is read as "do not fabricate", per design B-3. |
| Existing steering resource | Kept as the first `resources` item. |
| Skill content | Out of scope for Stage 3. |
| Glob `skill://.kiro/skills/**/SKILL.md` | Rejected. It would give every future skill to every agent and hide the mapping. |

## 5. Post-apply verification (for whoever applies section 3)

1. Parse each agent front matter with a YAML parser before and after. The only difference is the appended `resources` items.
2. Diff each file. Only the added lines appear. No other byte changes.
3. Every `skill://` target path exists under `.kiro/skills/`.
4. Resource count per agent stays under the 32-file limit (max 7 skills plus 4 steering files).
5. Manual activation test: select each agent in Kiro IDE 1.5.11 and ask "Which skills can you see?". Expect exactly its mapped skills. If an agent sees unmapped skills, custom agents inherit workspace skills, and the explicit list only documents intent. Record the result as VERIFIED.
6. Rollback: delete the added lines.

## 6. Hand-off

| Work item | Owner |
|---|---|
| Author electron-security | desktop-engineer (content), main session writes it to `.kiro/skills/` |
| Author github-integration | github-engineer (content), main session writes it |
| Author typescript-standards | frontend-engineer (content), main session writes it |
| Copy the four staged skills unchanged to `.kiro/skills/<name>/` | Main session or human |
| Confirm `skill://` syntax and inheritance on kiro.dev | Human or an agent with web access |
| Apply section 3 and run section 5 | Main session or human |
| Copy this report to `.agents/tasks/engineering-skills/integration-report.md` if required | Main session or human |
