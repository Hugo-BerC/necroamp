# NecroAmp Automation Catalog

Phase 04, branch `chore/engineering-automation`. Design: `automation-design.md`. Evidence: `automation-validation.md`. Integrations: `mcp-powers-evaluation.md`.

## Workflows (`.kiro/workflows/`)

All three use only the nine registered agents, write only inside each agent's allowed paths, and never commit, push, tag, merge, publish or read credentials. Use a new `run_label` per run. None has been run.

| Recipe | Inputs | Steps |
|---|---|---|
| `feature-development.workflow.json` | `feature`, `run_label` | necro-architect writes requirements and architecture and names the domain agent. Human approval. Repeat (max 2 iterations): the approved domain agent implements (the other five implementation branches reply SKIPPED), then qa-engineer and security-reviewer review independently, then necro-architect writes a `GATE: PASS` or `GATE: FAIL` file. A second iteration is the single correction pass, limited to blockers. Final human approval |
| `quality-review.workflow.json` | `run_label`, `base_ref` | release-engineer inspects git diff and scope. Parallel architecture, security and QA reviews. necro-architect writes the verdict (APPROVE, APPROVE WITH FIXES, REJECT) |
| `release-validation.workflow.json` | `run_label` | Build, tests, dependency and license review, packaging validation, artifact verification, human approval. Steps record SKIPPED when `package.json` or `electron-builder.yml` is missing |

Report locations: `docs/requirements`, `docs/architecture`, `docs/security`, `docs/testing`, `docs/release`, each named with the run label.

## Hooks (`.kiro/hooks/`)

| Hook file | Trigger | Action | Notes |
|---|---|---|---|
| `post-task-quality.json` | `PostTaskExec` | Three commands: `pnpm run --if-present` for `typecheck`, `lint`, `test` | No model calls. No install, build, fix or write |
| `ipc-security-check.json` | `PostFileSave`, matcher on `src/shared/ipc` and `src/preload` | Agent prompt, read-only security review of the saved file | One model turn per matching save. Inert until those paths exist |

Deferred: `dependency-review`. No `package.json` or lockfile exists to build or test it against, and `PostFileSave` is not expected to fire on agent edits. Dependency changes are already covered by the security-reviewer step in `release-validation` and by `package-script-policy.md`. Revisit at scaffold time with matcher `(^|[\\/])(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc)$` and a read-only agent prompt.

## MCP and Powers

Nothing is installed. All nine agents keep `includeMcpJson: false` and `includePowers: false`.

| Integration | Recommendation |
|---|---|
| Context7 | Install only with explicit human approval. Keyless, read-only, exact version pin, user-level config. Sends library queries to a third-party host |
| GitHub MCP | Defer. Needs a token and can write to the repository |
| Playwright MCP | Defer. NecroAmp tests Electron with the Playwright test library, and no app exists yet |
| Kiro Powers | Defer. None installed. Browse the Powers panel at scaffold time |

Third-party facts in the evaluation are ASSUMED, and Cloud Session compatibility is unconfirmed.

## How to use

- Launch a recipe from the Kiro workflow panel or ask the orchestrator to launch it by path, supplying the inputs. Do this only once application code exists, and answer each approval prompt.
- Hooks run automatically after the matching event. To disable one, remove its file or entry.
- To adopt Context7, approve it explicitly, then add it to `~/.kiro/settings/mcp.json` with a pinned version and no key.

## Known limitations

- Recipe keys are ASSUMED. No schema was found, and IDE acceptance has not been tested.
- Official Kiro docs were not fetched, so no format claim is DOCUMENTED.
- Approval gates depend on `send_message` pausing the step. Not tested.
- `post-task-quality` shows no visible result and fails silently without `package.json`. It would hang if a `test` script ran in watch mode.
- `PostTaskExec` fires for spec tasks only (ASSUMED), so workflow steps do not trigger it.
- `feature-development` handles one domain slice per run.
- Hashing in `release-validation` is not available to any agent shell, so checksums are reported as not computed.
- All of these files are uncommitted.
