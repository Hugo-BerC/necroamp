# Phase 03 Stage 4: independent security review of engineering skills

Reviewer: security-reviewer. Not an author of any reviewed file. Evidence classes: VERIFIED (I read the file or searched the repository), DOCUMENTED (official docs), ASSUMED.

Web access: the three spec URLs (kiro.dev, agentskills.io) are outside my allow-list (electronjs.org, docs.github.com, owasp.org, nvd.nist.gov) and I have no shell. No standard claim below is DOCUMENTED. I could not run PyYAML.

## 1. State of the deliverables (VERIFIED)

| Expected | Found |
|---|---|
| `.agents/tasks/engineering-skills/skill-design.md` | Absent. The design is `docs/architecture/engineering-skills-design.md`, which records that the requested path was write-denied. |
| `.agents/tasks/engineering-skills/integration-report.md` | Absent. |
| Skills at the confirmed location | No `.kiro/skills/` directory. Skills exist only under `docs/*/skills-staging/<name>/`. |
| Seven skills | Five staged: electron-security, audio-processing, skin-development, testing-strategy, cross-platform-packaging. `github-integration` and `typescript-standards`: no file found. |
| Agent edits in `.kiro/agents` | None. A search for `skill://` in `.kiro/**` returned no match. Agent bodies are unchanged. |

## 2. Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| S-1 | BLOCKING | github-integration, typescript-standards | VERIFIED: no SKILL.md with these names anywhere in the repository. Task requires seven skills. | Author both skills (staging is acceptable per B-1 of the design) and re-submit. | github-engineer, frontend-engineer (via main session) |
| S-2 | BLOCKING | `.kiro/skills/` | VERIFIED: directory missing. Staged skills under `docs/` are not discovered by Kiro (location is ASSUMED to be `.kiro/skills/<name>/SKILL.md`, design section 1.2). | Main session or human copies the skills, with `references/`, to the confirmed skill location. | necro-architect (spec), main session (write) |
| S-3 | BLOCKING | `.kiro/agents/*.md`, `integration-report.md` | VERIFIED: no `skill://` resource in any agent; no integration report. Stage 3 not performed or not recorded, so mapping cannot be reviewed. | Apply the design section 6 edits (append only, no tool or permission change) and write the report. | necro-architect, main session |
| S-4 | BLOCKING | Review inputs | VERIFIED: `skill-design.md` and `integration-report.md` absent at the paths given in the request. | Provide them, or confirm the `docs/architecture/` substitute. | workflow owner |
| S-5 | NON-BLOCKING | Design section 1 | VERIFIED: every Kiro skill fact (location, `skill://` syntax, name limits, inheritance) is ASSUMED. The authoring agents had no web access. | Human confirms against kiro.dev/docs/skills and the configuration reference before Stage 3 edits. | necro-architect |
| S-6 | NON-BLOCKING | Agent bodies | VERIFIED: qa-engineer.md line 54 says "Do not invent Skills". Design B-3 reads it as "do not fabricate". | Record the reading in the skill catalog. Do not edit prompts. | necro-architect |

## 3. Review of the five staged skills

| Check | testing-strategy | skin-development | cross-platform-packaging | audio-processing | electron-security |
|---|---|---|---|---|---|
| Front matter keys limited to name, description, license, metadata | VERIFIED | VERIFIED (name, description seen; rest not read) | VERIFIED | VERIFIED (name, description, license) | VERIFIED (same) |
| `name` equals directory | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| Description under 1024 chars, "Use when" form, quoted or block scalar (YAML colon risk avoided) | VERIFIED by reading | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| YAML parsed by a parser | ASSUMED (no shell). Quoting is correct by inspection. | ASSUMED | ASSUMED | ASSUMED | ASSUMED |
| No `allowed-tools`, scripts, version numbers, tokens, absolute paths, pinned SHAs | VERIFIED by search over `docs/**/skills-staging/**` | same | same | same | same |
| Required sections present | VERIFIED (all nine headings) | NOT READ in full | NOT READ in full (Scope read) | NOT READ in full | NOT READ in full |

Full body review was done only for testing-strategy (full read, with its three reference files listed but not read line by line) and the first 40 lines of cross-platform-packaging. The rest are listed under unreviewed areas.

testing-strategy detail:
- Consistent with `tech.md` "Testing": offline, no real token, required property areas, Playwright smoke scope (VERIFIED).
- Write scope statement matches the qa-engineer agent role as described in the design (ASSUMED for exact globs; I did not diff against `qa-engineer.md` front matter).
- No tool or permission instructions. It tells the author to report out-of-scope changes. No widening (VERIFIED).
- Security: fake tokens only, temp directories for traversal tests, sanitized recordings. Acceptable.
- Non-blocking suggestion T-1: add an explicit statement that e2e launch must not set `ELECTRON_RUN_AS_NODE` or disable sandbox flags, and that test builds must not enable debug ports. Owner: qa-engineer.
- Non-blocking suggestion T-2: Procedure 6 says to compare against "rendered output" without naming the owner exposing offline rendering. Fine as written.

## 4. Unreviewed areas

- Bodies and references of electron-security, audio-processing, skin-development, cross-platform-packaging (beyond front matter).
- Reference files of testing-strategy.
- github-integration and typescript-standards (do not exist).
- Agent mappings and `resources` edits (do not exist).
- Actual Kiro discovery and activation (needs the manual test in the design, section 1.3 item 4).

## 5. Verdict

Not approved. Four blocking findings (S-1 to S-4): two skills missing, no skill at a discoverable location, no agent integration, and the named input artifacts absent. Where reviewed, the staged skills show no security-boundary problem. A correction cycle should create the missing skills, place them, apply the agent edits, and then re-review.

## 6. Verdict file

Writing `.agents/tasks/engineering-skills/security-review.json` was denied by my agent profile (fs_write limited to `docs/security/**`). The intended content is:

```json
{"approved": false, "findings": ["S-1 BLOCKING github-integration and typescript-standards skills missing", "S-2 BLOCKING no .kiro/skills; staged skills undiscoverable", "S-3 BLOCKING no skill:// resources in agents, no integration report", "S-4 BLOCKING skill-design.md and integration-report.md absent at requested paths", "S-5 NON-BLOCKING Kiro skill facts all ASSUMED", "S-6 NON-BLOCKING 'Do not invent Skills' wording", "T-1 NON-BLOCKING testing-strategy: forbid RunAsNode, sandbox-off and debug ports in e2e"], "reviewDoc": "c:/Users/hberm/Desktop/necroamp/docs/security/skills-review.md"}
```

The main session should copy this to the requested path.

No source modified.
