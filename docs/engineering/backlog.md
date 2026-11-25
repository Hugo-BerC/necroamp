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
