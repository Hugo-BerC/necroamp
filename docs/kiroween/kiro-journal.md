# NecroAmp Kiro journal

Engineering journal for the Kiroween 2026 write-up. Each entry names its evidence source. Nothing here is a claim of a test that was not run.

Evidence labels:
- **Repo**: read from a file or from read-only git output in this repository.
- **Prompt**: stated by the user or workflow hand-off for this run, with no file in the repo that confirms it.
- **Unknown / not recorded**: no evidence found. Do not treat as done.

Status at the time of writing: **Phase 02 is not approved.** Installed Kiro IDE is **1.5.11** (Prompt; `docs/engineering/agent-validation.md` also records `kiro --version` returned 1.5.11).

## Timeline

| # | Entry | Date | Evidence |
|---|---|---|---|
| 1 | Project Genesis | 2026-11-25 | Repo: `git log` |
| 2 | Initial steering generation | 2026-11-25 | Repo: commit 80e5674, `.kiro/steering/*` |
| 3 | First Pull Request and merge | 2026-11-25 | Repo: `git log` |
| 4 | Custom Engineering Agents workflow | not recorded | Prompt, partly Repo |
| 5 | Independent review | not recorded | Repo: `agent-review.md` |
| 6 | B1 security finding | not recorded | Repo: `agent-review.md`, `b1-gate.json` |
| 7 | Remediation and validation results | not recorded | Repo: `docs/engineering/*` |
| 8 | Outstanding manual smoke tests | open | Repo: `agent-validation.md` |

## 1. Project Genesis

- Commits `8d1b75a` "Initial commit" and `9348e27` "Enhance README with project details and features", both 2026-11-25 10:10 (+0100), author Hugobc. Evidence: `git log --all`.
- The repo then held `README.md`, `LICENSE` and `.gitignore` (`structure.md`, "The repository currently contains only...").
- `tech.md` records that Node.js and pnpm were not found on PATH during the genesis session. `agent-validation.md` records they are still not on PATH. No application code, `package.json` or `electron-builder.yml` exists (`agent-validation.md`, `package-script-policy.md`).
- The genesis session transcript and its Kiro usage: not recorded in the repo.

## 2. Initial steering generation

- Four steering files: `.kiro/steering/kiroween.md`, `product.md`, `structure.md`, `tech.md`, 323 lines in total. Evidence: `git show --stat 80e5674`.
- Content: hackathon rules and Kiro-usage plan, product principles and scope, target layout and 17 open decisions, stack and security rules. Evidence: the files.
- The prompts used to generate them: not recorded.

## 3. First Pull Request and merge

- Commit `80e5674` "chore: initialize Kiro project steering (#1)", 2026-11-25 12:22 (+0100), author Hugobc. It is the tip of `main` and `origin/main`. Evidence: `git log --all --graph`.
- The `(#1)` suffix indicates a merge of pull request 1. Merge method (squash or other), reviewers and PR discussion: not recorded. PR page not inspected (no network or GitHub access used).

## 4. Custom Engineering Agents workflow

- Workflow id `wf_ebf8f4d795d75ed8`, with a loop of 3 passes. Source: Prompt. No workflow definition or run log exists in the repo (`.kiro/` has no `workflows/` directory; listing of `.kiro/` shows only `agents/` and `steering/`).
- Step names and per-step results: **unknown / not recorded**. The only step-like labels in the repo are "Stage 1", "Stage 2", "Stage 3", "Stage 4" and "Stage 5" in the review and validation documents, and those labels come from different runs. Do not read them as steps of this workflow.
- Output: nine agent files in `.kiro/agents/`: necro-architect, desktop-engineer, audio-engineer, frontend-engineer, art-director, github-engineer, security-reviewer, qa-engineer, release-engineer. Evidence: directory listing. They are untracked in git (`git status` shows `?? .kiro/agents/` and `?? docs/`). Nothing was committed.
- Catalog: `docs/engineering/agent-catalog.md` exists. Its content was not re-audited for this journal.
- Process incidents (Prompt, not confirmable from the repo):
  - `github-engineer.md` previously had invalid YAML. Current state: `agent-validation.md` records it parses with PyYAML 6.0.3 and that the `description` has no `: ` sequence.
  - A fix-loop author step once recreated files from scratch instead of applying the review's fixes. Which files and which pass: not recorded.
  - After the CHANGES_REQUESTED verdict, the orchestrator hand-edited `release-engineer.md` itself instead of having the author step do it. `agent-review.md` calls it "the orchestrator edit" and states the Stage 1 re-review was independent of the editor.

## 5. Independent review

- Document: `docs/engineering/agent-review.md`, machine-readable result `docs/engineering/agent-review.json`. The reviewer states it did not author the files, read them only, and installed or ran nothing. Evidence: file header.
- First verdict: CHANGES_REQUESTED, one blocker (B1). Checks that passed per the reviewer (reading only, no linter): front matter shape, field set for IDE 1.5.11, name equals filename, steering resource, MCP and Powers off, secret-path denies, write-scope separation, security-reviewer has no shell.
- Non-blocking observations recorded: `pnpm build*`-style rules run package scripts; `git tag*` is `ask`; nobody owned unassigned `src/shared/**`; reads outside the workspace unconfirmed; `write` category membership unverified.
- Review passes recorded in the document: (a) initial review, CHANGES_REQUESTED; (b) re-review after the orchestrator edit, "B1 NOT RESOLVED (CHANGES_REQUESTED)"; (c) second pass, "B1 RESOLVED (APPROVED)". Whether these three correspond one-to-one to the 3 loop passes in entry 4: not recorded.
- `docs/engineering/agent-review.json` says `"verdict": "APPROVED"`, and `b1-gate.json` says `"verdict": "APPROVED"` with no findings. Both are the output of the review step, not of this journal step.

## 6. B1 security finding

- **B1**: release-engineer could publish a release with ambient credentials. Example: `pnpm exec electron-builder --publish always` matched the allow pattern `pnpm exec electron-builder*`, and no deny rule covered the publish flag. Evidence: `agent-review.md`, section "B1".
- Re-review after the first edit found the literal case closed (`*--publish*` deny, electron-builder `ask`) and listed open routes B1-a to B1-e: command chaining, `-p` aliases and credential variables, interpreters and aliases, package-script indirection, and missing human-authorization policy. Evidence: `agent-review.md`, "Stage 1 re-review of B1".
- Second-pass status (reviewer's words): **resolved as policy plus pattern rules, with documented residual risk**. Per sub-finding: B1-a and B1-b rules VERIFIED present, matching and case handling ASSUMED; B1-c VERIFIED; B1-d and B1-e DOCUMENTED (body text, not enforced), plus VERIFIED ask and deny rules. Evidence: `agent-review.json`.
- Caveat for the write-up: "resolved" rests on file reading. The matcher was never exercised (see entry 8), and `package.json` and `electron-builder.yml` do not exist, so script bodies and publish config were never inspected. The Phase 02 request says B1 must not be marked resolved without sufficient evidence. Whether that bar is met is for the final review and the user to decide: **unknown**.

## 7. Remediation and validation results (this run)

Source files: `docs/engineering/agent-validation.md`, `shared-ownership-policy.md`, `package-script-policy.md`. All are untracked.

### Agent configuration validation (`agent-validation.md`)
- Result as reported: 0 configuration errors, 0 files edited under `.kiro/agents/`, findings F1 to F6 are recommendations or accepted risks.
- VERIFIED by the reporter: Kiro IDE 1.5.11; all nine files parse with Python 3.14 and PyYAML 6.0.3 `yaml.safe_load`; keys are exactly `name, description, tools, includeMcpJson, includePowers, resources, permissions`; names are unique and equal to filenames; no overlapping write scopes after deny rules.
- DOCUMENTED (kiro.dev pages the reporter fetched): front matter format and `permissions.rules`, deny > ask > allow precedence, compound shell commands split and evaluated per part, unmatched commands default to `ask`, untrusted workspaces do not load custom agents.
- Findings: F1 shell can bypass path rules; F2 secret-path deny list omits `.npmrc`, `.netrc`, `*.token`, `.aws/**` (not changed); F3 allowed pnpm commands run package scripts; F4 loose prefix allows; F5 `skill`, `context`, `diagnostics` not denied; F6 `git tag*` is `ask` although the description says never tags.
- Not performed (reported by the document itself): `kiro-cli agent validate` (kiro-cli 3.5.0, "not logged in", no login attempted); loading in the IDE picker; invoking agents; synthetic permission-matcher tests; reads outside the workspace; Windows backslash path matching; shell case sensitivity; `write` category membership; script and publish-config inspection; shell bypass of fs rules.

### Shared module ownership (`shared-ownership-policy.md`)
- Policy: necro-architect is architectural owner of every `src/shared/` path not already owned (ipc and settings: desktop-engineer; audio: audio-engineer; skins: frontend-engineer; github: github-engineer). Includes consult and review table, ADR criteria, and a contract-change-note rule.
- Gap stated by the document: ownership does not widen permissions. necro-architect cannot write `src/**`, so no agent can write unassigned shared source. Options are left to the user and **neither was applied**.
- Enforcement: table matches agent `fs_write` lists (VERIFIED by reading); consultation and review rules are prompt text only (ASSUMED not enforced).
- Whether the agent files and `agent-catalog.md` were updated to cite this policy: not verified for this journal. Use `agent-catalog.md` directly to confirm.

### Package script policy (`package-script-policy.md`)
- Defines review of changes to `package.json` scripts, build scripts and publishing commands, and states that script names are not a security boundary. Sections 1 to 3 were read for this journal; section 4 onward (the review process itself) was not read in full here.
- VERIFIED in the document: no `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `electron-builder.yml` or `.github/` exists, so there is no script content to review today.
- Nothing from the policy has been exercised against a real script.

### Tests and checks actually run
- YAML parse of nine files (PyYAML), `kiro --version`, `kiro-cli agent validate` (failed, not logged in). Evidence: `agent-validation.md`. Run by an earlier step, not re-run for this journal.
- Application tests, type checks, lint, build, e2e: none exist or were run. No code exists.

## 8. Outstanding manual smoke tests

When this section was written, agents had **not been invoked**. A partial runtime binding test was run later (see section 10). All items below are still **not run**:

1. Trust the workspace in Kiro IDE 1.5.11 and confirm all nine agents appear in the picker without parse errors.
2. Run `kiro-cli agent validate --path <file>` per file after a manual `kiro-cli login`.
3. Matcher tests with harmless inputs only: a shell `echo`, `git status`, `pnpm test ; echo x`, a write to a synthetic `docs/zz-fixture.txt` as an agent that does not own `docs/`, a read of a synthetic `fixtures/sample.env`.
4. Read outside the workspace (absolute path and `..`) under `fs_read` `**`.
5. Windows backslash paths against the `/` patterns.
6. Shell pattern case sensitivity, including release-engineer's credential and publish denies.
7. Whether `write` includes delete tools.
8. Per-agent behavior: each agent stays inside its write scope and refuses out-of-scope requests.

Source: `agent-validation.md`, "Unperformed validations".

## 9. Conditional approval and post-approval corrections

- Human decision: Phase 02 conditionally approved as a documented engineering configuration deliverable. Evidence: user instruction in the session. No commit, push or new workflow.
- Applied directly in the main session (no workflow, no independent review of these edits):
  - F2: added `id_ed25519*`, `id_ecdsa*`, `.ssh/**`, `.npmrc`, `.netrc`, `*.token` and `.aws/**` to the `fs_read` and `fs_write` deny lists of all nine agents. Check run: PyYAML parsed all nine front matters, exit result "yaml ok". Enforcement was not tested.
  - F6: release-engineer description and prompt now say tag creation needs explicit human approval. `git tag*` stays `ask`.
  - Shared ownership clarified: necro-architect owns architectural decisions and shared contracts, implementation delegated through an approved task, contract changes need architectural review.
  - Catalog, final report and this journal updated.
- Still unverified: all permission enforcement behavior (see the catalog, section 7). Nothing here is a verified security sandbox.
- Process note: in the first workflow (`wf_ebf8f4d795d75ed8`) the fix-loop author regenerated the files instead of applying review fixes, so the B1 fix for `release-engineer.md` was made by hand. The second workflow (`wf_43fb771cb4823e45`) re-reviewed it as APPROVED.

## 10. Custom agent runtime smoke test (workflow `wf_0bea48b1877910f8`)
Run by the orchestrator after section 9. It supersedes the statement in section 8 that custom agents could not be invoked. It is a partial test, accepted by the human as sufficient for Phase 02 closure. It was not rerun.

| Step | Bound agent | Outcome |
|---|---|---|
| `architect-check` | `necro-architect` | Completed. The runtime node tree shows the step bound to this agent. |
| `security-check` | `security-reviewer` | Completed. The runtime node tree shows the step bound to this agent. |

- VERIFIED (workflow node tree): both steps ran under the named workspace custom agents. No fallback to built-in agents (`wf-coder`, `wf-code-reviewer`).
- As reported by the agents, not independently checked: both ran read-only and modified no files. `necro-architect` said it cannot verify its own runtime binding.
- Partial read: `necro-architect` read only the first 80 lines of `structure.md`, so its summary may be incomplete.
- Incomplete output capture: the agents posted their reports as inline chat messages. The workflow captured an empty output for `architect-check` and a pointer sentence for `security-check`. The reported tool lists, publication restrictions and unverified boundaries were therefore not preserved.
- UNVERIFIED: runtime permission enforcement. No denied action was attempted, so the deny and `ask` rules in section 8 remain untested.
- Manual smoke tests 3 to 8 in section 8 are still not run.

### Lesson learned
Future workflows must capture meaningful agent results through structured final outputs or persistent artifacts (for example a report file under a known path or a JSON verdict). Inline chat messages are not captured by the workflow and are lost.

## Open items

- Phase 02: conditionally approved by the human (section 9). Manual smoke tests (section 8) are still not run.
- Phase 02 files are committed on branch `chore/custom-engineering-agents` with a pull request to `main` (see the PR). The PR is not merged. Human approval is required before merging.
- Kiro feature usage still to document for the write-up (steering, agents, workflow): session logs and prompts not recorded. Hooks, specs and MCP: none exist.
## 11. Phase 03: engineering skills (workflow `wf_3289f58996624e25`)
Sources: `docs/architecture/*` (design, integration report, copy evidence, final check, correction report), `docs/security/skills-review-final.md`, `docs/testing/skills-qa-review-final.md`, `.agents/tasks/engineering-skills/review-gate-final.json`, `docs/engineering/skill-catalog.md`, `docs/engineering/skills-staging-inventory.md`. Dates: not recorded. Nothing was committed.
### Workflow
- Native workflow "NecroAmp - Engineering Skills Setup", id `wf_3289f58996624e25` (Prompt; no workflow definition or run log in the repo). Its stages, as named in the repo documents: Stage 1 skill design (necro-architect, `engineering-skills-design.md`), Stage 2 skill authoring by owner agents, Stage 3 agent integration (`skill-integration-report.md`), Stage 4 independent review, Stage 5 catalog and journal. The exact step names in the workflow definition: **not recorded**.
- Result: seven skills in `.kiro/skills/` (audio-processing, skin-development, testing-strategy, cross-platform-packaging, electron-security, github-integration, typescript-standards), 28 files. Evidence: directory listing.
### Permission-related integration failure
- Every custom agent has an `fs_write` deny on `.kiro/**`, and deny wins over allow. No agent could write `.kiro/skills/` or edit `.kiro/agents/`. The design flagged this as B-1 and B-2 before Stage 2. Evidence: `engineering-skills-design.md`, `skills-correction-report.md`.
- Most `docs/` paths were also outside each agent's write scope. Authors staged skills under their own scopes (`docs/audio/`, `docs/design/`, `docs/testing/`, `docs/release/`) or returned text inline. Four skills were staged by their owners. electron-security, github-integration and typescript-standards could not be written by desktop-engineer, github-engineer or frontend-engineer.
- necro-architect had no shell, and its correction step could not copy or edit anything. `skills-correction-report.md` records the blocked state: S-1 (two skills missing), S-2 (no `.kiro/skills/`), S-3 (no agent edits).
- The first review pass ran in this state. Its security report (`skills-review.md`) and gate (`review-gate.json`) returned CHANGES_REQUESTED. Every blocker was a missing file (S-1 to S-4, Q-MISSING, S-JSON-MISSING). Both are stale and superseded.
### Authorized orchestrator recovery
- The human authorized limited configuration integration by an unrestricted run. Agent permissions and deny rules were not widened (Prompt).
- wf-coder run `wf_8f7b43c34040e187` authored electron-security, github-integration and typescript-standards, copied all seven skills to `.kiro/skills/` and added the 33 `skill://` lines to the nine agent files. Evidence: `skill-copy-evidence.md`. The human accepted wf-coder as the actual author of those three skills.
- Orchestrator final check (`skill-final-integration-check.md`), VERIFIED by `git diff`: the 33 lines equal section 3 of the integration report per agent (7+3+2+3+1+3+4+7+3); 0 lines removed, so `tools`, `permissions.rules`, `includeMcpJson` and `includePowers` are unchanged; every target exists.
- Cross-skill reference fix: `github-integration/SKILL.md` pointed to `references/credential-storage-notes.md`, which lives in electron-security. It now names `.kiro/skills/electron-security/references/credential-storage-notes.md` explicitly.
- Result of the `skill://` form: DOCUMENTED on kiro.dev (explicit paths supported in `resources`). Not tested per agent.
### Independent review
- Final reviews, one pass each. Neither reviewer approved its own deliverable: security-reviewer reviewed all seven, including testing-strategy (authored by qa-engineer); qa-engineer reviewed six and excluded testing-strategy.
- Security: approved, no blocking findings, 6 non-blocking findings (F1 to F6). Evidence: `skills-review-final.md`.
- QA: approved, no blocking findings, advisory findings A1 to A9 plus informational A10 and A11. QA also ran PyYAML on all 7 skills and 9 agents, which passed. Evidence: `skills-qa-review-final.md`.
- Gate: **APPROVED**, `findings: []`. Evidence: `review-gate-final.json`.
- Non-blocking IDs in the gate file: F1, A1, F2, F3, F4, F5/A5, F6, A2, A3, A4, A7, A8, A9, A10, A11, GAP-1. (A6 duplicates F1 and A5 duplicates F5, so the gate file merges them.)
- Notable ones: F1 Linux `safeStorage` may report encryption available while using a weak backend (Medium, needs the ADR for open decision 3); A1 per-agent skill visibility untested (Medium); F3 staging copies can drift; A8 EQ invariant 7 fails below 40 Hz sample rate; A9 macOS x64 cross-build unproven.
- GAP-1: neither reviewer read most of the 21 reference files line by line.
### IDE discovery
- VERIFIED: all seven skills and their descriptions appear in the Kiro IDE resource catalog of the orchestrator session. Evidence: `skill-final-integration-check.md`.
- Staging comparison (`skills-staging-inventory.md`): 28 staging files, 27 byte-identical to `.kiro/skills/`, 1 differs (the pre-fix github-integration wording), none staging-only. No staging directory has unique content. None was deleted.
### Remaining limitations
- UNVERIFIED: that each custom agent sees only its mapped skills (A1). The manual activation test in `docs/engineering/skill-catalog.md` section 7 has not been run, so no per-agent result is recorded. If agents inherit all workspace skills, the 33 lines only document intent.
- UNVERIFIED: `skill://` entries in Markdown agent files on Kiro IDE 1.5.11 per agent.
- Open non-blocking findings stay open, including F1 (Linux `safeStorage` weak-backend check) and F6 (the three wf-coder skills have not been read by their owner agents).
- `.kiro/skills/`, the nine edited agent files and the staging directories are uncommitted.
### Lesson learned
Skill workflows need a planned staging path from the start. Agent write scopes block `.kiro/**` and most `docs/` paths, so each author needs a writable staging location, and a named orchestrator step with the needed permission must copy the result and edit the agent files. Otherwise authors stage ad hoc or return inline text, reviews run on missing files and the loop stalls. Capture results in structured outputs or files, as in section 10.

### Closure (human-approved, top-level orchestrator)
- Phase 03 approved by the human, subject to completing the documentation. No new workflow was launched and no review was repeated.
- Staging copies: removed after the equivalence check. This supersedes "None was deleted" above. The only differing file was the superseded pre-fix github-integration wording, recorded in `docs/architecture/skill-final-integration-check.md`. No unique evidence was lost.
- Cross-skill reference: github-integration now names the electron-security dependency explicitly (`.kiro/skills/electron-security/references/credential-storage-notes.md`).
- Linux credential storage: decided fail closed in `docs/adr/0001-linux-credential-storage-fail-closed.md`. `basic_text` and `unknown` backends count as unavailable, and the session is memory-only with no plaintext fallback (DOCUMENTED against the Electron safeStorage API docs). The text in electron-security and github-integration now points to the ADR. structure.md still lists decision 3 as open because steering was not modified.
- Backlog: all 16 non-blocking gate entries are recorded in `docs/engineering/backlog.md`.
- Preserved: 7 skills, 33 `skill://` bindings, unchanged agent tools and permissions, unchanged steering (VERIFIED by git diff).
- Not performed: the manual activation test (A1) and any runtime test. No test result is claimed.

### Skill activation smoke tests (default Kiro agent, orchestrator session)
- electron-security: explicit activation through `skill::electron-security` succeeded. The agent loaded `SKILL.md` and then only `references/ipc-channel-checklist.md` to explain secure IPC channels with Zod validation (VERIFIED).
- audio-processing: contextual selection succeeded. The agent chose `skill::audio-processing` from its activation description for a ten-band equalizer design task and loaded it, then only `references/equalizer-and-dsp-notes.md` and `references/graph-and-lifecycle.md` (VERIFIED).
- Selective reference loading worked in both tests. Unrelated reference files were not loaded.
- Both tests were read-only and ran without workflows.
- Limitations: both tests ran in the same session, so context isolation and IDE-driven automatic activation (without the agent's own selection) are UNVERIFIED. Agent-specific skill inheritance (backlog A1) is still open. The default agent's runtime catalog listed all seven workspace skills, with none explicitly assigned. No custom agent was tested.

### Workflow artifact preservation
- `.agents/` held only two workflow scratch files: `tasks/engineering-skills/review-gate.json` (stale initial gate) and `review-gate-final.json`. Both were copied, hash-identical, to `docs/engineering/reviews/review-gate-initial-stale.json` and `docs/engineering/reviews/review-gate-final.json`. Earlier documents that cite the `.agents/` paths refer to these copies.
- `/.agents/` was added to `.gitignore`. `.kiro/` is not ignored.

## 12. Phase 04: engineering automation (workflow `wf_6e76f1dad667f878`, branch `chore/engineering-automation`)

### What was done
- Stage 1: compatibility inspection and `docs/engineering/automation-design.md`. Hook format was read from the installed IDE 1.5.11 bundle (VERIFIED). No official doc page was fetched by the design author, so DOCUMENTED claims are absent there.
- Stage 2: three reusable workflow recipes in `.kiro/workflows/`: `feature-development`, `quality-review`, `release-validation`. They use only the nine existing agents, with step prompts that forbid commit, push, tag, merge, publish and credential access.
- Stage 3: two hook files in `.kiro/hooks/`: `post-task-quality` (three `PostTaskExec` command hooks, no model calls) and `ipc-security-check` (one `PostFileSave` agent hook, read-only prompt). `dependency-review` was deferred with reasons.
- Stage 4: `docs/engineering/mcp-powers-evaluation.md`. Recommendation: Context7 only, pending explicit approval. GitHub MCP, Playwright MCP and Powers deferred. Nothing installed.
- Stage 5: `automation-validation.md` and `automation-catalog.md`.

### Kiro features used
Workflows (recipes, parallel branches, bounded repeat, human approval via `send_message`), Agent Hooks, custom agents (as step assignees), Skills (referenced, not changed), MCP and Powers (evaluated only), steering (read only).

### What it changed
Added 5 config files and 4 docs. Agents, skills and steering are unchanged (empty git diff). No recipe was run, because no application code exists. No hook has fired in the IDE.

### Limitations
Recipe and hook syntax is VERIFIED only as valid JSON and against IDE-bundle evidence. IDE acceptance of the recipes was not tested in this step. `post-task-quality` fails silently without `package.json`. See `docs/engineering/automation-validation.md`.

## 13. Phase 05: renderer and styling, Block A (M4, M5; branch `feature/desktop-foundation`)

### What was done
Implemented the renderer shell, stores, bridge adapter, six placeholder regions (M4) and the token-based, accessible CSS Modules styling with a pure WCAG contrast function (M5). First integration launch: `electron-vite preview` on the fresh build opened a `NecroAmp` BrowserWindow.

### Agents and skills actually invoked
- `git-reconcile` wf-coder: reconciled repository state before Block A.
- `necro-architect`: renderer architecture and contract notes (`docs/architecture/renderer-architecture.md`, `contract-changes.md`).
- `frontend-engineer`: renderer implementation (`src/renderer/`).
- `art-director`: styling and skin-seam notes (`docs/design/foundation-styling.md`).
- `wf-code-reviewer`: reviewed Block A; findings were resolved.

### Result
Fresh validation: typecheck, lint, format:check and build exit 0. Vitest 625 passed, 2 skipped (symlink privilege, same two as before), 42 files. T4.1 to T4.8 and T5.1 to T5.4 ticked; T5.5 stays open (no `desktop-foundation-skin-seams.md`).

## 14. Phase 06: tests, defect fixes and E2E, Block B (M6, M7; branch `feature/desktop-foundation`)
### Agents and skills actually invoked
- `qa-engineer` (with the `testing-strategy` skill): property, static, integration, jsdom a11y and Playwright Electron tests, axe scan, defects 0001 to 0004, coverage notes.
- `desktop-engineer`: resolve-app-path coverage fix (0001) and stricter sender validation.
- `frontend-engineer`: renderer fixes for defects 0002 to 0004.
- Block B reviewer (verdict `APPROVED`, no findings).
### Result
Fresh: typecheck, lint, format:check, build exit 0; vitest 52 files, 768 passed, 2 skipped; coverage statements 99.44, branches 98.23, functions 100, lines 99.78 (thresholds unchanged); test:e2e 35 passed. M6 complete; M7 partly open (T7.5 to T7.7).

## 15. Phase 07: final delivery preparation, Block C (M8 preparation; branch `feature/desktop-foundation`)
### What was done
Acceptance reconciliation of M0 to M8 against tasks.md, fresh full validation, README, ADR 0003 and 0005 runtime notes, backlog update and the single delivery report (`docs/engineering/desktop-foundation-delivery-report.md`). No final review JSON existed at that time, so no repair work was done. The final security report was later renamed to `docs/security/desktop-foundation-final.md` (T8.3); the JSON kept its name.
### Agents and skills actually invoked
None. The orchestrator did this work directly. The `quality-review` workflow was not run.
### Result
Fresh on Windows x64: typecheck, lint, format:check, test, test:coverage, build, test:e2e and pnpm licenses exit 0. Vitest 52 files, 768 passed, 2 skipped. E2E 35 passed. M7 and M8 stay INTEGRATION PENDING (T7.5, T7.6, T8.1 to T8.4, T8.6).

### Block C closing step
T7.5 build-validation document written. Bounded `pnpm dev` run: startup and clean shutdown confirmed, T7.6 remains pending (needs human console/HMR observation). base_ref origin/main = 66f9f7f. Fresh run after the dev run: build exit 0, test:e2e 35 passed. Final commit hashes, PR and merge status are in the delivery report section 8.

### Block D milestone reconciliation
T8.1 (base 66f9f7f, HEAD 10dfc3f), T8.2 (quality-review run desktop-foundation-final, APPROVE WITH FIXES, 0 blockers), T8.3 (APPROVED) and T8.4 (architecture gate APPROVED) are COMPLETE. T7.6 stays PENDING (HMR untested, human launch unconfirmed), so T7.7 stays PENDING. T8.5 awaits hook confirmation, T8.6 awaits human approval plus V-1 and V-2. T5.5 DEFERRED (optional). F-3 and packaging checks DEFERRED, CI ABSENT, macOS and Linux NOT VERIFIED. Changes are uncommitted until the integration commit.
