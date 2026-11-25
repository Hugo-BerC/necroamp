# NecroAmp Automation Design (Phase 04, Stage 1)

Branch `chore/engineering-automation`. Scope: workflows, hooks, MCP and Powers evaluation inputs. No application code exists yet.

## 1. Evidence labels and limits

- VERIFIED: observed in this repository or in the installed Kiro IDE files during this stage.
- DOCUMENTED: stated by official docs. **None obtained.** The authoring subagent had no `web_fetch` tool, and the brief forbids fetching docs by shell. Every format claim below is therefore VERIFIED from the installed IDE (1.5.11) bundle, or ASSUMED.
- ASSUMED: inferred, not observed.

**Action for the orchestrator before Stage 2:** fetch kiro.dev/docs pages for workflows, hooks, MCP and powers with `web_fetch` and reconcile against section 3. Items marked "confirm" are the only ones that may change.

## 2. Repository inspection (VERIFIED)

- Branch is `chore/engineering-automation`; `git status --short` printed nothing (clean tree).
- No `package.json`, no `src/`. `.kiro/hooks/` and `.kiro/workflows/` do not exist. `docs/engineering/` exists (agent catalog, validation, `package-script-policy.md`, `shared-ownership-policy.md`, `reviews/`, and others).
- `kiro --version` prints `1.5.11` (commit 41b7bc8a, x64).
- Nine agents in `.kiro/agents/*.md` (Markdown with YAML frontmatter). All nine set `includeMcpJson: false`, `includePowers: false`, and deny `mcp`, `power`, `subagent`, `web_search`. None may write `.kiro/**`, `.git/**` or `docs/engineering/**`.

### Agent permissions (VERIFIED from frontmatter; never widen)

| Agent | tools | fs_write allow | shell | web_fetch |
|---|---|---|---|---|
| necro-architect | read, write | `docs/adr/**`, `docs/architecture/**`, `docs/requirements/**` | denied | denied |
| art-director | read, write | `skins/**`, `resources/icons/**`, `docs/design/**`, `docs/assets.md` | denied | denied |
| audio-engineer | read, write, shell | `src/renderer/audio/**`, `src/shared/audio/**`, `docs/audio/**` | allow `pnpm typecheck/lint/test*`; ask install family; deny git writes, `gh`, `curl`, `npm`, `npx`, `rm` | denied |
| desktop-engineer | read, write, shell | `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `src/shared/settings/**`, `package.json`, `tsconfig*.json`, `electron.vite.config.ts`, `.nvmrc` (deny `src/main/github/**`) | allow `pnpm typecheck/lint/test/build/dev*`; ask install family; same denies | denied |
| frontend-engineer | read, write, shell | `src/renderer/{app,features,stores,components}/**`, `src/renderer/*.{html,css,ts,tsx}`, `src/shared/skins/**` | allow `pnpm typecheck/lint/test*`; ask install family | denied |
| github-engineer | read, write, shell, web | `src/main/github/**`, `src/main/ipc/github*`, `src/shared/github/**` | allow `pnpm typecheck/lint/test*` | docs.github.com, octokit.github.io only |
| qa-engineer | read, write, shell | `tests/**`, `**/*.property.test.ts`, `**/*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts`, `docs/testing/**` | allow `pnpm typecheck/lint/test/test:e2e/build*`; ask install family | denied |
| release-engineer | read, write, shell, web | `.github/workflows/**`, `electron-builder.yml`, `resources/**` (not icons), `docs/release/**`, `CHANGELOG.md` | allow `pnpm build*`, `pnpm package*`, `git status/diff/log/describe*`; ask `electron-builder`, `git tag`, install family; deny pipes, `;`, `&&`, `--publish`, `-p`, token/env access, `gh *`, `node *`, `pwsh*` | electron.build, docs.github.com, electronjs.org |
| security-reviewer | read, write, web | `docs/security/**` only | denied | electronjs.org, docs.github.com, owasp.org, nvd.nist.gov |

Consequences:

1. Nobody except the orchestrator can write `.kiro/workflows/**`, `.kiro/hooks/**`, `docs/engineering/**` or `docs/kiroween/**`.
2. Only `release-engineer` can run `git diff`. Every agent is denied reading `.git/**`.
3. No custom agent can call MCP or Powers. MCP and Powers are used only by the orchestrator or the human.
4. Only `security-reviewer` (no shell) and `necro-architect` (no shell) cannot run anything; they review by reading files.

## 3. Kiro format facts

### Hooks (VERIFIED in IDE 1.5.11 `dist/extension.js`, built-in hook prompt)

- Location: `.kiro/hooks/<id>.json`. The IDE instructs agents to create hooks with the `createHook` tool and not to write them by hand with `fs_write`. Orchestrator: use `createHook` if available; otherwise hand-write and record that fallback.
- Schema:
  ```json
  { "version": "v1", "hooks": [ { "name": "...", "trigger": "<Trigger>", "matcher": "<optional regex>", "action": { "type": "command", "command": "..." } } ] }
  ```
  Agent action form: `{ "type": "agent", "prompt": "..." }` (appends a static prompt to model context).
- Triggers accepted by the IDE validator: `PostFileCreate, PostFileSave, PostFileDelete, PreToolUse, PermissionRequest, PostToolUse, UserPromptSubmit, SessionStart, Stop, PreCompact, PostCompact, PreTaskExec, PostTaskExec, Manual`.
- **Correction to the brief:** the trigger is `PostTaskExec`, not `PostTaskExecution`; the file trigger is `PostFileSave`, not `FileSave`. The longer lowercase names (`postTaskExecution`, `fileEdited`) are internal enum values and a legacy `when`/`then` schema (`fileEdited`, `userTriggered`; `alert`, `askAgent`) in `extension-resources/hook.json`. Use the `v1` form.
- `matcher` is a regex tested against the tool name (PreToolUse/PostToolUse) or the file path (PostFileCreate/Save/Delete). Ignored for other triggers. The path form (absolute vs relative) is not stated: write matchers that accept both.
- Command actions receive session JSON on stdin. Exit 0 = success; exit 2 blocks only PreToolUse, UserPromptSubmit, PreTaskExec; any other code is a silent failure. Stdout is forwarded only for SessionStart, UserPromptSubmit, PreToolUse. So a PostTaskExec or PostFileSave command hook cannot show output to the agent (VERIFIED from prompt text). 
- ASSUMED: `PostFileSave` fires on user saves ("When a user saves a code file") and not on agent `fs_write` calls. Confirm.

### Workflows (VERIFIED from the IDE's workflow-launch tool description; schema keys ASSUMED)

- Recipe files: `.kiro/workflows/<name>.workflow.json`, `.workflow.yaml` or `.workflow.yml` (workspace root), also `~/.kiro/workflows/` and cloud-cache roots. Names must end with one of those suffixes.
- A step has an `agent` field whose value must be one of the registered agents (`AVAILABLE AGENTS` list). A recipe can accept inputs; a launch can pass `runLabel`.
- `agent://<name>` launches one agent as a one-step workflow with a `prompt` input and optional `report_path`. Top-level sessions only; launches nested inside workflow steps are refused.
- There is no inline definition form: a definition must be written to `.kiro/workflows/<name>.workflow.json` and launched by absolute path. The IDE also exposes `save_workflow_definition`, `inspect_workflow` and `update_workflow` tools to the orchestrator.
- **Not found** (searched the IDE bundle; no bundled recipe file, no JSON schema): the exact keys for step prompts, ordering, human approval gates, loops, parallel branches and inputs. Runtime plan nodes show `type, agentName, steps, branches, maxIterations, stopCondition, stopWhen, onMaxIterations, joinPolicy`, but those describe a running plan, not the recipe file. Do not copy them into recipes.
- Rule for Stage 2: the orchestrator must create each recipe with `save_workflow_definition` (or validate the file with it) so that the IDE rejects unknown keys. No recipe key may be invented. If a needed construct (approval gate, bounded correction loop) has no supported key, express it as a prose instruction in a step prompt plus an explicit "stop and report" step, and record that limitation in the catalog.

### MCP and Powers (ASSUMED, not verified here)

- Workspace MCP config at `.kiro/settings/mcp.json`, user config at `~/.kiro/settings/mcp.json`. `~/.kiro/settings/` exists on this machine (VERIFIED); `mcp.json` itself was not inspected, per the no-credentials rule.
- `~/.kiro/powers/` exists (VERIFIED, contents not inspected). Power packaging format (a `POWER.md` plus optional MCP config) is ASSUMED.
- All nine agents have `includeMcpJson: false`, `includePowers: false`, so installing an MCP server or Power cannot widen any agent. Keep it that way.

## 4. Workflow recipes (Stage 2 specification)

Location: `.kiro/workflows/<name>.workflow.json` (JSON chosen: no YAML dependency, and the IDE saves JSON from `save_workflow_definition`). Names: `feature-development`, `quality-review`, `release-validation`. Display name for the setup workflow itself is separate.

Shared rules for all three:

- Every step passes a report path and the next step reads that persisted file, never chat output. Run folder: `docs/engineering/reviews/<run-label>/`, written by the orchestrator (no agent can write there). Agents write only to their own allowed paths; the orchestrator copies or links them into the run folder summary.
- No step may run `git commit`, `git push`, `git tag`, `gh`, `pnpm publish`, `electron-builder --publish`, merge a PR, or read credential variables. Steps state this in their prompts. Agent permissions already deny these; the recipes add no shell permission.
- `agent` values come only from the nine registered agents. No recipe uses MCP or Powers.
- Human approval steps stop and wait for the human; they do not proceed on a timer.

### 4.1 feature-development

| # | Step | Agent | Writes (deliverable path) |
|---|---|---|---|
| 1 | Requirements and architecture | necro-architect | `docs/requirements/<feature>.md`, `docs/architecture/<feature>.md`, ADR in `docs/adr/` if a decision changes |
| 2 | Human approval gate (before implementation) | human | none |
| 3 | Implementation | domain agent (table below) | the agent's own allowed paths only |
| 4a | Independent QA review | qa-engineer | `docs/testing/<feature>-review.md`; may add tests under `tests/**` |
| 4b | Independent security review | security-reviewer | `docs/security/review-<feature>.md` |
| 5 | Consolidated quality gate | orchestrator | `docs/engineering/reviews/<run>/gate.md` (PASS, FAIL with findings) |
| 6 | One targeted correction (only if gate FAIL; blockers only) | the step-3 agent | its own paths; then repeat 4a, 4b, 5 once |
| 7 | Final human approval | human | none |

- Domain agent mapping: Web Audio, equalizer, analysis -> `audio-engineer`. main, preload, IPC contracts, build config -> `desktop-engineer`. renderer UI, stores, skin loader -> `frontend-engineer`. GitHub features -> `github-engineer`. Skin art, icons -> `art-director`. Packaging, CI -> `release-engineer`.
- Steps 4a and 4b are independent: neither reads the other's report before finishing. QA uses `pnpm typecheck/lint/test`. Security reads source only.
- Correction limit: step 6 happens at most once per run. A second FAIL goes to step 7 with the findings listed, not another loop.
- Problem: an agent step's `agent` is a registered name, and the recipe cannot know the domain in advance. Decision: the recipe takes the implementation agent as a launch input if the IDE's recipe validation accepts an input in the `agent` position (confirm via `save_workflow_definition`). Fallback if it does not: the recipe ends at step 2; the orchestrator launches step 3 with `agent://<domain-agent>`, then launches a second recipe `feature-development-review` covering 4a to 7. If the fallback is needed, record it in the catalog. Only the fallback adds a fourth recipe file.
- Constraint: `qa-engineer`, `security-reviewer` and the implementer must not be the same session context. Step 4 never uses the step-3 agent.

### 4.2 quality-review

| # | Step | Agent | Writes |
|---|---|---|---|
| 1 | Git diff and scope inspection | orchestrator (runs `git status`, `git diff --stat`, `git diff`); `release-engineer` is the only agent with git read access but cannot write to `docs/engineering/` | `docs/engineering/reviews/<run>/diff-scope.md` |
| 2 | Architecture review | necro-architect | `docs/architecture/review-<run>.md` |
| 3 | Security review | security-reviewer | `docs/security/review-<run>.md` |
| 4 | QA review | qa-engineer | `docs/testing/review-<run>.md` |
| 5 | Consolidated findings and verdict | orchestrator | `docs/engineering/reviews/<run>/verdict.md` (APPROVE, APPROVE WITH FIXES, REJECT) |

- Steps 2 to 4 read only `diff-scope.md` and the repository, because agents cannot read `.git/**`. They do not modify source. The verdict lists findings by severity and cites each reviewer file. No correction loop; remediation is a separate feature-development run.

### 4.3 release-validation

| # | Step | Agent | Writes |
|---|---|---|---|
| 1 | Build verification (`pnpm build`) | release-engineer | `docs/release/validation-<run>-build.md` |
| 2 | Automated test results (`pnpm typecheck`, `lint`, `test`, `test:e2e`) | qa-engineer | `docs/testing/release-<run>.md` |
| 3 | Dependency and license review | security-reviewer (reads `package.json`, lockfile, `docs/assets.md`; cannot run `pnpm audit`) | `docs/security/release-deps-<run>.md` |
| 4 | Cross-platform packaging validation | release-engineer (reads `electron-builder.yml`, `.github/workflows/**`; checks `--publish never`, `contents: read`, action SHA pins, native runners) | `docs/release/validation-<run>-packaging.md` |
| 5 | Artifact verification (names, sizes, checksums, SBOM presence) | release-engineer | `docs/release/validation-<run>-artifacts.md` |
| 6 | Human approval | human | `docs/engineering/reviews/<run>/release-decision.md` by orchestrator |

- Packaging commands run only if `package.json` and `electron-builder.yml` exist; otherwise each step records SKIPPED with the reason. `pnpm package` is the only packaging entry point and its script must carry `--publish never` (agent shell rules deny `--publish` and `-p`). Checksum computation is not in any agent's shell allow-list; step 5 inspects files and CI output and marks hashing ASSUMED/unavailable unless the human approves a shell prompt.
- The recipe has no tag, release or upload step. Tag creation stays a human action outside the workflow.

## 5. Hooks (Stage 3 specification)

Common rules: `version: "v1"`; no hook runs `pnpm install/add/update/dlx`, `git` write commands, or edits files; commands exit 0; each hook first tests for `package.json` or `src` and exits 0 silently if absent. Recursion is avoided because no hook writes a file or invokes the agent to write. Each hook declares one trigger and a narrow `matcher`.

### post-task-quality (CREATE)

- File: `.kiro/hooks/post-task-quality.json`, one hook, trigger `PostTaskExec` (fires after a spec task is marked completed), action `command`, no matcher.
- Command (PowerShell-safe, no Bash syntax): if `package.json` is missing, exit 0. Otherwise read the `scripts` keys and run only `pnpm typecheck`, `pnpm lint`, `pnpm test` that exist, in order, with `--if-present` semantics. No install, no build, no `--fix`.
- Zero model calls. Limit (VERIFIED from IDE prompt): exit codes other than 0 and 2 are silent and stdout is not forwarded for PostTaskExec, so failures are not shown. The hook is therefore a best-effort gate; the authoritative gate is the workflow's QA step and CI. If Stage 5 testing shows the IDE surfaces no result at all, mark this hook deferred instead of shipping it.
- Note: PostTaskExec fires for spec tasks only. Workflow steps and ad hoc agent work do not trigger it (ASSUMED).

### ipc-security-check (CREATE)

- File: `.kiro/hooks/ipc-security-check.json`, trigger `PostFileSave`, matcher `(^|[\\/])src[\\/](shared[\\/]ipc|preload)[\\/]`, action `agent` with a static prompt.
- Prompt content: read-only review of the saved file against `electron-security` rules (no `ipcRenderer` exposure, channel constants from `src/shared/ipc/channels.ts`, Zod validation on every payload, sender validation on privileged handlers, `contextIsolation`/`sandbox` not disabled). Report findings in chat. Do not edit, write, install or run git.
- Why an agent action: a command hook cannot show output on PostFileSave (see section 3), and a static grep cannot judge schema validation.
- Cost control: fires only on saves of files under those two paths, which do not exist yet, so it does nothing until the scaffold lands. One model turn per save. ASSUMED limit: it does not fire on agent `fs_write`; the quality-review and feature-development security steps cover that path.

### dependency-review (DEFER)

Not created. Reasons: (1) no `package.json` or lockfile exists, so the hook could not run or be tested; (2) `PostFileSave` fires on user saves, while the only agent allowed to write `package.json` is `desktop-engineer`, so the hook would miss most real changes; (3) `package-script-policy.md` section 4 already requires `security-reviewer` review of `package.json`, lockfile and pnpm config changes, and `release-validation` step 3 repeats it. Revisit at scaffold time with matcher `(^|[\\/])(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc)$` and an `agent` prompt that only reads and reports.

### Deferred

- **dependency-review**: no hook file created. Reasons are in the section above: no `package.json` or lockfile exists to run or test against, `PostFileSave` is assumed not to fire on agent edits (the main writer of `package.json` is `desktop-engineer`), and the `security-reviewer` step in `package-script-policy.md` section 4 and `release-validation` step 3 already cover it. Revisit at scaffold time with the matcher and read-only agent prompt given above.

### Created in Stage 3 (as implemented)

- `.kiro/hooks/post-task-quality.json`: three `PostTaskExec` command hooks (`pnpm run --if-present typecheck`, `lint`, `test`). One command each, with no `&&` chaining, so they behave the same in PowerShell, cmd and sh. Without `package.json`, pnpm exits non-zero and the failure is silent (non-0/2 exit codes are ignored). Without a script, `--if-present` makes it a no-op. They never install, build, fix or write.
- `.kiro/hooks/ipc-security-check.json`: one `PostFileSave` agent hook with a read-only prompt, matcher on `src/shared/ipc` and `src/preload`.
- Both files were hand-written because `createHook` is not available to the authoring subagent. They are not yet validated by the IDE.

## 6. MCP and Powers inputs for Stage 4 (design constraints only)

- Evaluation only; no install, no `mcp.json` edit, no Power activation without explicit human approval.
- Any MCP server or Power would be usable only by the orchestrator or human, because all nine agents deny `mcp` and `power` and set `includeMcpJson/includePowers: false`. Do not change that.
- Credentials: GitHub MCP needs a token. Do not read, store or request one in this phase. Recommend at most two immediate integrations, chosen in Stage 4; with no application code yet, a documentation MCP (for Electron, Zod, Web Audio references) and nothing token-bearing is the likely lowest-risk pick (ASSUMED, to be justified in the catalog).
- Cloud Session compatibility must be stated per integration from official docs, not from this design.

## 7. Write-ownership summary

| Path | Writer |
|---|---|
| `.kiro/workflows/*.workflow.json`, `.kiro/hooks/*.json` | orchestrator only (all agents deny `.kiro/**`) |
| `docs/engineering/**`, `docs/kiroween/**` | orchestrator only (no agent allows these) |
| `docs/requirements/**`, `docs/architecture/**`, `docs/adr/**` | necro-architect |
| `docs/security/**` | security-reviewer |
| `docs/testing/**`, `tests/**` | qa-engineer |
| `docs/release/**`, `.github/workflows/**`, `electron-builder.yml` | release-engineer |
| `docs/audio/**` / `docs/design/**`, `skins/**` | audio-engineer / art-director |
| `src/**`, `package.json` | the owning domain agent per section 2 |

Steering, agents and skills are not modified by this phase.

## 8. Open items for the orchestrator (before Stage 2)

1. Fetch the official docs and reconcile the "confirm" items: recipe step keys, approval-gate and loop support, `agent` input binding, `PostFileSave` firing on agent edits, hook output visibility.
2. Create hooks with `createHook`; create recipes with `save_workflow_definition`, and keep whatever the IDE accepts.
3. Do not run the recipes against nonexistent application code. Validate by schema acceptance and by a no-app dry run of `post-task-quality` (must exit 0 silently).
