# Automation Validation (Phase 04, Stage 5)

Branch: `chore/engineering-automation` (VERIFIED by `git branch --show-current`). Method: native file reads, one PowerShell call for git and JSON parsing. No recipe or hook was executed. No correction cycle was needed.

## Git state (VERIFIED)

`git status --short`:

```
?? .kiro/hooks/
?? .kiro/workflows/
?? docs/engineering/automation-design.md
?? docs/engineering/mcp-powers-evaluation.md
```

(After this step, `automation-catalog.md`, `automation-validation.md` and the journal edit are added. The journal is the only tracked file modified.)

`git diff --stat` was empty before the journal edit, so no tracked file had changed.

| Check | Result |
|---|---|
| `git diff --stat -- .kiro/steering .kiro/agents .kiro/skills skills` | empty. VERIFIED |
| `.kiro/steering` changes | none. VERIFIED |
| `.kiro/agents` changes (no permission widening) | none. VERIFIED |
| `.kiro/skills` changes | none. VERIFIED |
| Commits, pushes, PR | none made. VERIFIED |

## Checks

| # | Item | Label | Evidence |
|---|---|---|---|
| 1 | `mcp-powers-evaluation.md` exists | VERIFIED | File listing, 10927 bytes |
| 2 | All 5 config files parse as JSON | VERIFIED | `ConvertFrom-Json` returned OK for 3 workflows and 2 hooks |
| 3 | Hook schema (`version: v1`, `hooks[]` with name, trigger, action) | VERIFIED against the IDE 1.5.11 bundle as recorded in `automation-design.md` section 3. Not confirmed by official docs: ASSUMED |
| 4 | Hook triggers `PostTaskExec`, `PostFileSave` are in the accepted list | VERIFIED (design doc, IDE bundle) |
| 5 | Workflow recipe keys (`name`, `description`, `inputs`, `steps`, `type` step/parallel/repeat, `agent`, `prompt`, `artifacts`, `joinPolicy`, `maxIterations`, `onMaxIterations`, `stopWhen`) | ASSUMED. Design doc found no schema. Keys match the runtime plan node names the IDE exposes. Acceptance by `save_workflow_definition` is not evidenced here |
| 6 | Every `agent` value exists in `.kiro/agents` | VERIFIED. Used: necro-architect, audio-engineer, desktop-engineer, frontend-engineer, github-engineer, art-director, release-engineer, qa-engineer, security-reviewer. All nine files exist |
| 7 | No read-only agent assigned file writing | VERIFIED against the permission table in `automation-design.md` section 2: every written path is inside that agent's `fs_write` allow list (architect: docs/requirements, docs/architecture; security-reviewer: docs/security; qa: docs/testing; release-engineer: docs/release) |
| 8 | Agent permissions unchanged, recipes add none | VERIFIED (empty agents diff). Recipes reference agents only |
| 9 | No publish, push, merge, tag or credential access in recipes | VERIFIED by reading all three files. Each prompt that can run commands prohibits commit, push, tag, merge, `gh`, publish and token reads. `release-validation` runs `pnpm package` only after confirming `--publish never` |
| 10 | Human approval gates | feature-development (before implementation, final) and release-validation (final) use `send_message` warning. Mechanism ASSUMED to pause the run as documented in the workflow-step contract |
| 11 | Correction cycle limit | `repeat` with `maxIterations: 2` (one build plus one correction) and a correction prompt limited to blockers. VERIFIED by reading. Runtime behavior ASSUMED |
| 12 | Hooks non-recursive | VERIFIED by reading. Command hooks only run `pnpm run --if-present` scripts and write nothing. The agent hook is read-only by prompt and its matcher covers only `src/shared/ipc` and `src/preload` |
| 13 | Hooks skip gracefully without app code | VERIFIED by reading. `ipc-security-check` cannot match while those paths do not exist. `post-task-quality` fails silently without `package.json` (non-0/2 exit codes are ignored per IDE prompt text, DOCUMENTED only by the bundle) and is a no-op for a missing script. A dry run was not executed: ASSUMED |
| 14 | Hooks do not install, write to git or edit code | VERIFIED by reading |
| 15 | Model invocations minimized | VERIFIED by reading. 3 command hooks use zero model calls. 1 agent hook, one turn per matching save |
| 16 | `dependency-review` deferred, not created | VERIFIED. No file. Reasons in `automation-design.md` section 5 |
| 17 | MCP and Powers not installed | VERIFIED per the evaluation: no `.kiro/settings/mcp.json`, `~/.kiro/powers/` holds only `registries` |
| 18 | Official-docs confirmation | ASSUMED. No official Kiro page was fetched in this phase's evidence. Third-party tool facts in the evaluation are ASSUMED |
| 19 | Recipes tested against the IDE or run | Not done, by instruction (no application code) |

## Defects found

None requiring correction. Observations (not defects):

- `post-task-quality` runs `pnpm run --if-present test`. If the future `test` script starts a watch mode, the hook would hang. The package-script policy requires single-run test scripts; check this at scaffold time.
- Hook output is not shown to the agent for these triggers, so `post-task-quality` gives no visible result. CI and the QA review remain the authoritative gate.
- `feature-development` uses `send_message` in `necro-architect` steps. That agent's tool list was not checked for this tool, so gate pausing is ASSUMED.
