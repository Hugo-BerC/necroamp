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
