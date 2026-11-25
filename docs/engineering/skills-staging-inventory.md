# Skills staging inventory

Purpose: decide whether the five `skills-staging` directories can be removed without losing content. Nothing was deleted or changed by this inventory.

Method (VERIFIED): for every file under each staging directory, SHA-256 (PowerShell `Get-FileHash`) was compared with the file at the same relative path under `.kiro/skills/`. One differing file was compared line by line with `Compare-Object`. Files in `.kiro/skills/` with no staging counterpart were not looked for (the question is about staging content).

## Results

| Staging directory | Skill | Files | Identical | Differs | Staging-only | Unique content if deleted |
|---|---|---|---|---|---|---|
| `docs/engineering/skills-staging` | electron-security | 4 | 4 | 0 | 0 | No |
| `docs/engineering/skills-staging` | github-integration | 4 | 3 | 1 (`SKILL.md`) | 0 | No (see below) |
| `docs/engineering/skills-staging` | typescript-standards | 4 | 4 | 0 | 0 | No |
| `docs/design/skills-staging` | skin-development | 4 | 4 | 0 | 0 | No |
| `docs/audio/skills-staging` | audio-processing | 4 | 4 | 0 | 0 | No |
| `docs/testing/skills-staging` | testing-strategy | 4 | 4 | 0 | 0 | No |
| `docs/release/skills-staging` | cross-platform-packaging | 4 | 4 | 0 | 0 | No |

Total: 28 staging files, 27 identical, 1 differs, 0 staging-only.

## The one difference

`docs/engineering/skills-staging/github-integration/SKILL.md` (SHA-256 prefix `C584A155BEFC`) differs from `.kiro/skills/github-integration/SKILL.md` (`5F423E2D2CBF`) in one line. Staging has the original wording: "Handling rules are in electron-security (`references/credential-storage-notes.md`)". The live file has the corrected cross-skill reference to `.kiro/skills/electron-security/references/credential-storage-notes.md`. This is the expected staleness recorded in `docs/architecture/skill-final-integration-check.md`. The staging line is the older, ambiguous version, so it holds no content the live file lacks (VERIFIED, line diff shows only that line).

## Per-directory verdict

| Directory | Verdict |
|---|---|
| `docs/engineering/skills-staging` | Deleting loses no unique skill content. It is the only copy of the pre-fix github-integration wording, which is superseded and recorded in `skill-final-integration-check.md`. |
| `docs/design/skills-staging` | Deleting loses nothing. All 4 files identical. |
| `docs/audio/skills-staging` | Deleting loses nothing. All 4 files identical. |
| `docs/testing/skills-staging` | Deleting loses nothing. All 4 files identical. |
| `docs/release/skills-staging` | Deleting loses nothing. All 4 files identical. |

## Caveats

- Git cannot recover them: all five directories are untracked (`git status --short` shows `?? docs/...`, VERIFIED). `.kiro/skills/` is also untracked. If either set is deleted before a commit, the remaining copy is the only one. Keep `.kiro/skills/` and commit it before removing staging.
- Other documents cite staging paths as evidence: `docs/architecture/skill-integration-report.md`, `skill-copy-evidence.md`, `skills-correction-report.md` and the stale `docs/security/skills-review.md`. Those citations would point at missing files after deletion. The evidence text itself is not in the staging files.
- Review finding F3 asks to remove the staging copies or mark them non-authoritative. Deletion needs human approval and is not done here.
- Identical hashes show the files match today. They do not show that the content is correct.

## Removal

After this inventory was verified, the top-level orchestrator removed all five staging directories, as the human authorized, along with the parent directories they left empty (docs/design, docs/audio, docs/release). The files were untracked. The live copies are in .kiro/skills/.
