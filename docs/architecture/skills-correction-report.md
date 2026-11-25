# Engineering skills: Phase 03 correction report (blocked)

Substitute for `.agents/tasks/engineering-skills/correction-report.md`. necro-architect may write only `docs/adr/**`, `docs/architecture/**` and `docs/requirements/**`. Writes to `.kiro/skills/**` were refused by the agent profile (`deny fs_write "**"`). A probe write of `.kiro/skills/electron-security/SKILL.md` and its three references failed. No shell tool is available, so nothing could be copied.

Gate: `.agents/tasks/engineering-skills/review-gate.json`, verdict CHANGES_REQUESTED. Evidence: VERIFIED (observed this session), DOCUMENTED, ASSUMED.

| ID | Status | Change made | Evidence |
|---|---|---|---|
| S-1 | Partly fixed upstream, not by this step | `github-integration` now exists in `docs/engineering/skills-staging/github-integration/` (SKILL.md plus 3 references). `typescript-standards` is still missing anywhere in the workspace. | VERIFIED (file search, directory listing) |
| S-2 | NOT FIXED. Blocked by permissions | None. `.kiro/skills/` does not exist. Staged skills: electron-security, github-integration (docs/engineering), audio-processing (docs/audio), skin-development (docs/design), testing-strategy (docs/testing), cross-platform-packaging (docs/release). | VERIFIED (`.kiro/` holds only `agents/` and `steering/`; write refused) |
| S-3 | NOT FIXED. Blocked by permissions | None. Exact lines per agent are in `docs/architecture/skill-integration-report.md` section 3. | VERIFIED (write scope) |
| S-4 | Fixed by confirmation | `docs/architecture/engineering-skills-design.md` is the substitute for `skill-design.md`. `docs/architecture/skill-integration-report.md` is the substitute for `integration-report.md`. Skill location per the design: `.kiro/skills/<name>/SKILL.md`. | VERIFIED (both files exist and were read) |
| Q-MISSING | NOT FIXED. Out of this step's scope | QA review not run. | VERIFIED (no qa-review file found) |
| S-JSON-MISSING | NOT FIXED. Out of this step's scope | `security-review.json` not written. Content is in section 6 of `docs/security/skills-review.md`. | ASSUMED (not re-read) |

## Needed from the user or an unrestricted session

1. Author `typescript-standards` (owner frontend-engineer; sections and references per design section 4.5). Stage it or write it directly.
2. Copy the six staged skill directories, including `references/`, unchanged to `.kiro/skills/<name>/`.
3. Append the `skill://` lines from `skill-integration-report.md` section 3 to each `resources` list. Change no tool or permission field.
4. Write `qa-review.json`, `docs/engineering/reviews/skills-qa-review.md` and `security-review.json`.
5. Do not start a second review cycle until 1 to 3 exist.

Skill wording and the `skill://` form remain ASSUMED. No file under `.kiro/` or steering was changed.
