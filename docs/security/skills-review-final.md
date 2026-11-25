# NecroAmp Phase 03: final independent review of engineering skills

Reviewer: security-reviewer (independent of all seven authors). One pass.
Supersedes the stale reports `docs/security/skills-review.md`, `docs/engineering/reviews/skills-qa-review.md` and `.agents/tasks/engineering-skills/review-gate.json`. Their blocking findings were all missing-file findings, and the files now exist (VERIFIED).

Evidence classes: VERIFIED (I read it in this repository during this pass), DOCUMENTED (official docs), ASSUMED (neither). My `web_fetch` to electronjs.org was denied by the agent profile in this session, so no new DOCUMENTED evidence was gathered. DOCUMENTED items below are inherited from `docs/architecture/skill-copy-evidence.md` section 4 (kiro.dev/docs/skills) and are marked "inherited".

## Verdict

**Approved: true. Blocking findings: none.**

No skill is invalid, undiscoverable, unsafe or contradictory to steering. Six non-blocking findings are listed below. The largest is F1 (Linux `safeStorage` weak-backend detection).

## Scope and method

Read in full (VERIFIED): all seven `SKILL.md` files, `electron-security/references/credential-storage-notes.md`, `skin-development/references/skin-validation-and-security.md`, `docs/architecture/skill-integration-report.md`, `docs/architecture/skill-copy-evidence.md`, front matter of `security-reviewer.md` and `github-engineer.md`. Grepped all nine agent files for `skill://`. Listed every `references/` directory. Grepped `.kiro/skills/**` for secret patterns (token prefixes, private key headers, `password=`, `api_key=`): no matches.

Not read line by line (listed as unreviewed in depth): the other 19 reference files. Only their existence was checked. Steering was taken from the session rules, which match what the skills cite.

## Per-skill results

| Skill | Author (independence) | Front matter | References exist | Steering consistent | Result |
|---|---|---|---|---|---|
| electron-security | wf-coder, reviewer independent | `name` equals dir, `license`, `metadata` only. Valid (VERIFIED) | 3 of 3 | Yes. Four mandatory web preferences, deny-by-default, `safeStorage`, `https:` allow-list match `tech.md` | Pass, see F1 |
| audio-processing | audio-engineer | Valid | 3 of 3 | Yes. Graph order, rAF pause, no allocation in `process()`, decision 4 left open | Pass, see F4 |
| skin-development | art-director | Valid, folded `>-` scalar | 3 of 3 | Yes. Principles 5 and 6, no `@import`, no remote `url()`, traversal and symlink rejection | Pass |
| github-integration | wf-coder | Valid | 3 of 3 | Yes. Main-process only, read-only, opt-in, decisions 2, 3, 13, 15 flagged | Pass |
| typescript-standards | wf-coder | Valid | 3 of 3 | Yes. Dependency direction, Zod at boundaries, decisions 8 and 9 left open | Pass |
| testing-strategy | qa-engineer, reviewed by me, not its author | Valid | 3 of 3 | Yes. Required fast-check areas, offline and deterministic, no real token | Pass |
| cross-platform-packaging | release-engineer | Valid, folded `>-` scalar | 3 of 3 | Yes. SHA pins, least privilege, `--publish never`, decisions 10, 11, 12 left open | Pass |

All seven contain the required sections: Scope, Procedures, Recommended patterns, Anti-patterns, Security considerations, Acceptance criteria, Validation checklist, References (VERIFIED by reading). No executable scripts, no pinned application dependency versions, no secret values (VERIFIED, grep).

## Agent resource edits

| Check | Result | Class |
|---|---|---|
| 33 `skill://` lines in 9 agent files | Counted per file: necro-architect 7, qa-engineer 7, security-reviewer 4, desktop-engineer 3, frontend-engineer 3, github-engineer 3, release-engineer 3, audio-engineer 2, art-director 1. Total 33 | VERIFIED |
| Mapping equals section 3 of `skill-integration-report.md` | Matches for all nine agents | VERIFIED |
| Entries are explicit paths, no glob, placed after the steering item | Yes | VERIFIED |
| Every target `.kiro/skills/<name>/SKILL.md` exists | Yes, all seven directories present | VERIFIED |
| Tool permissions not widened | `security-reviewer.md` still has `tools: ["read","write","web"]`, shell denied, `fs_write` limited to `docs/security/**`, web allow-list unchanged. Orchestrator evidence reports 33 insertions and 0 deletions | VERIFIED (security-reviewer, github-engineer permission blocks read); DOCUMENTED-by-orchestrator for the git diff |
| Mapping is least privilege per responsibility | Reasonable. art-director gets only skin-development. audio-engineer lacks electron-security, which fits its scope | VERIFIED |
| `github-integration` web sources match `github-engineer` allow-list | `docs.github.com` and `octokit.github.io` are both allowed | VERIFIED |
| Kiro supports `skill://` in `resources` and path or glob forms | Inherited from kiro.dev/docs/skills | DOCUMENTED (inherited) |
| The `resources:` YAML key with `skill://` strings behaves the same in `.md` agent files | Not tested | ASSUMED |
| Custom agents do not inherit workspace skills, so the explicit list controls visibility | Not tested | ASSUMED |
| Behavior on Kiro IDE 1.5.11 | Not tested | ASSUMED |

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| F1 | Medium, non-blocking | `.kiro/skills/electron-security/SKILL.md` procedure 6 step 2; `references/credential-storage-notes.md` "Availability check" and "Linux" rows | The skill says to refuse storage when encryption is "not available". The reference lists "how to detect a weak backend" only as an item to confirm (VERIFIED). On Linux, Electron can report encryption as available while using a weak plaintext-style backend when no keyring exists. This is my recollection of the Electron `safeStorage` docs and I could not fetch the page (ASSUMED). A literal implementation of the availability check alone could write a weakly protected token, which `tech.md` forbids ("OS credential store") | Add one sentence to the skill and the reference: on Linux, also query which storage backend was selected and treat the plaintext-style backend as unavailable. Confirm the method name in the Electron safeStorage docs and record it in the ADR for open decision 3. Add a test with a fake provider reporting a weak backend | desktop-engineer (skill owner). Content change is a targeted edit, not required before approval |
| F2 | Low | `.kiro/agents/*.md` and `.kiro/skills/*/SKILL.md` | A full YAML parse was never run (`skill-copy-evidence.md` section 3, "Not run"). I also have no shell, so I could not run one. My read-through found no syntax problem in the seven skill headers (quoted strings contain no unescaped quotes, folded scalars are indented) and no tab or indentation anomaly in the two agent headers I read (VERIFIED by reading, not by parser) | Run a YAML parser or open each agent in Kiro IDE 1.5.11 before relying on it. Part of the manual activation test | Human or release-engineer |
| F3 | Low | `docs/*/skills-staging/**` and `docs/engineering/skills-staging/**` against `.kiro/skills/**` | Staging copies remain next to the live copies. They were byte-identical at copy time (orchestrator evidence, DOCUMENTED-by-orchestrator). Future edits to one copy will drift | Declare `.kiro/skills/` the single source and delete or mark the staging copies after approval. Deletion needs human approval | necro-architect or human |
| F4 | Low | `.kiro/skills/audio-processing/SKILL.md` procedures 2 and 6 | Procedure 2 repeats the `tech.md` graph (one gain after the EQ). Procedure 6 step 5 says a preamp is "its own gain stage". Position is not stated. A preamp before the EQ adds a node not in the `tech.md` graph | State the preamp position and record it in the `docs/audio/` diagram, or fold it into the single master gain. Raise it as a clarification, not a steering change | audio-engineer |
| F5 | Low | `.kiro/skills/github-integration/SKILL.md` "Security considerations" | The token-handling rule is a relative cross-skill path to `electron-security/references/credential-storage-notes.md`. It resolves only if that skill is readable. All seven agents that hold `github-integration` also hold `electron-security` (VERIFIED by the mapping), so it works today. A future agent given only `github-integration` would lose the link | When mapping `github-integration` to a new agent, also map `electron-security`. Add this rule to `docs/engineering/skill-catalog.md` | necro-architect |
| F6 | Info | All seven skills | Authors label unconfirmed Electron, Octokit, GitHub REST and Web Audio details as ASSUMED. Three skills (electron-security, github-integration, typescript-standards) were written by wf-coder, not by their owner agents, and the owners have not read them | No change needed. Owners should read their skill once and raise corrections through the owning agent | desktop-engineer, github-engineer, frontend-engineer |

## Consistency with steering (VERIFIED)

- No skill restates steering at length. Each cites `tech.md`, `product.md` or `structure.md` and adds procedure.
- No skill resolves an open decision. Decisions 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 are cited as "needs human decision" where they arise.
- Principles 1 to 6 of `product.md` are respected: no mandatory cloud, no telemetry, skins are data, GitHub optional and opt-in. The packaging skill's release job creates a draft GitHub Release only and is design-only until human approval, consistent with `tech.md` ("no deployment targets beyond GitHub Releases") and the "do not publish" restriction.
- No skill widens agent permissions or asks an agent to act outside its write scope. Each ends with the "list changes for the owning agent" rule.

## Unreviewed areas

- 19 reference files not read line by line (existence verified only).
- Runtime behavior in Kiro IDE 1.5.11: skill discovery, `skill://` in `.md` agent files, no inheritance of unlisted skills.
- Official Electron, Octokit and electron-builder API accuracy. The skills avoid concrete API names where unconfirmed, which limits the risk.
- Whether the staged and live copies are still byte-identical today (relied on the orchestrator's hash check).

## Manual checks recommended before merge (not blocking)

1. Run a YAML parser over `.kiro/agents/*.md` front matter and the seven `SKILL.md` headers.
2. In Kiro IDE 1.5.11, select each agent and ask which skills it sees. Expect exactly its mapped list. Record the result as VERIFIED.
3. Apply F1 before any token-storage implementation starts.

No source modified.
