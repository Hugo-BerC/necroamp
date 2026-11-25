# Agent definitions: independent review (Stage 4)

Reviewer did not author the files. Scope: `.kiro/agents/*.md` (nine files). Nothing was installed, run or edited. The Stage 1 format spec was the baseline. No author verification record exists in the repo, so the review is from reading the files.

## Verdict (current, after Stage 1 second pass): B1 RESOLVED as policy plus pattern rules, with documented residual risks. See "Stage 1 second pass" at the end. The sections below are the history of earlier passes.

## Historical verdict: CHANGES_REQUESTED (one blocker)

## Checks that pass
- **Syntax:** All nine files have a `---` front matter block followed by a Markdown body. Descriptions contain no `: ` sequences, and glob lists are quoted. No YAML linter or Kiro validator is available, so this is a visual check. Manual confirmation in the agent picker (Stage 5) remains needed.
- **Format and version:** Current Markdown format for IDE 1.5.11. Fields used: `name`, `description`, `tools`, `includeMcpJson`, `includePowers`, `resources`, `permissions.rules`. No CLI 2.x fields (`toolsSettings`, `allowedTools`, `toolAliases`, `keyboardShortcut`), no `model`, no `hooks`, no `*` or `@builtin`.
- **Names and discovery:** Filename stem equals `name` for all nine, in kebab-case. No `.json` twins. No collision with bundled `wf-*` or `semantic_reviewer` names.
- **Steering:** Every agent has `resources: file://.kiro/steering/**/*.md`, which is 4 files, well under the 32-file and 100k-character limits. Bodies cite steering sections and do not copy them.
- **MCP and Powers:** `includeMcpJson: false`, `includePowers: false`, no `mcpServers`, explicit `deny` for `mcp`, `power` and `subagent` in each agent.
- **Secrets and credentials:** No secret values. Every agent denies reads of `.env*`, key and cert files, `id_rsa*`, `.git/**` and `credentials*`, and denies writes to the same set plus `.kiro/**`, `LICENSE` and `.gitignore`. `web_search` is denied everywhere. `web_fetch` is denied, or allow-listed to documentation hosts for security-reviewer, github-engineer and release-engineer.
- **security-reviewer:** Tools are `read`, `write` and `web`, and it has no shell. Writes are allowed only for `docs/security/**`. Explicit denies cover `src`, `skins`, `tests`, `.github`, `resources`, `package.json` and config files. Deny overrides allow, and the body states the read-only rule. This meets "read-only for production source code".
- **Write-scope separation:** Allowed write paths do not overlap between agents, except `resources/**` for release-engineer and `resources/icons/**` for art-director. release-engineer explicitly denies `resources/icons/**`, and deny wins. The `src/main/github/**` area is allowed for github-engineer and denied for desktop-engineer. Property and integration tests are owned by qa-engineer only. qa-engineer cannot edit source and reports defects.
- **art-director:** The body says skins transform backgrounds, control shapes, materials, typography and layout, and that a palette swap is a failure. It prioritizes Morgul Revenant and Analog 1984, and requires original or licensed assets with a license record. It bans Winamp assets and names, bans executable content, and defers AI-asset provenance to the user (open decision 14).
- **Skills:** No `skill://` resources. The only mentions of Skills are the "do not invent" instructions.
- **Required sections:** All nine bodies have responsibilities, scope, restrictions, required context, deliverables and definition of done. The `tools` and `permissions` sections are in the front matter. Security-reviewer's restrictions are under "Read-only mode".

## Blocker

### B1. release-engineer can silently publish with ambient credentials
- **File:** `.kiro/agents/release-engineer.md`, shell rules. The allow rule is `match: ["pnpm build*", "pnpm package*", "pnpm exec electron-builder*", ...]`, and the deny list has no publish pattern.
- **Evidence:** `pnpm exec electron-builder --publish always` matches `pnpm exec electron-builder*`. The deny list covers `gh *`, `git push*` and `curl *`, but not electron-builder's publish flag. Shell globs only support `*`, so the allow rule covers any arguments.
- **Consequence:** If `GH_TOKEN` is set in the user's environment, a prompt or mistake could upload a release to GitHub with no confirmation. This contradicts the description ("Never tags or publishes") and the "no personal credentials / external repositories" constraint.
- **Fix:** Add a `deny` shell rule such as `match: ["*--publish*", "*-p always*", "*-p onTag*", "*GH_TOKEN*"]`. Alternatively, narrow the allow rule to `pnpm exec electron-builder --dir*` and `pnpm exec electron-builder --publish never*`. Deny wins over allow, so the first option is a one-rule change.

## Non-blocking observations (no action required)
- `pnpm build*`, `pnpm test*` and `pnpm package*` run package.json scripts. desktop-engineer can edit `package.json`, so it can in principle widen its own effective shell power. This is inherent to granting these commands. Security-reviewer should check `package.json` scripts when they exist.
- `git tag*` is `ask`, though release-engineer's description says it never tags. The human prompt is an acceptable guard.
- Nobody owns `src/shared/**` outside `ipc`, `settings`, `skins`, `audio` and `github` (for example playlist and metadata pure logic). The architect can assign this when those modules are designed.
- `fs_read` allow `**` is workspace-relative by the documented glob rules. I could not confirm that absolute paths outside the workspace are refused, so the Stage 5 manual validation should include a read outside the workspace.
- Tool-category membership (for example whether `write` includes delete tools) is unverified. The `fs_write` deny rules are the real boundary, as Stage 1 noted.

## Stage 1 re-review of B1 (independent, after orchestrator edit)
Reviewer did not author release-engineer.md. Files were read only; nothing was executed. `package.json` and `electron-builder.yml` do not exist yet (VERIFIED), so the `pnpm package` script and any publish provider could not be inspected. Kiro's matching of compound commands, case sensitivity and the default for unmatched shell commands are undocumented (ASSUMED).

### Verdict: B1 NOT RESOLVED (CHANGES_REQUESTED)
The edit closes the literal case `pnpm exec electron-builder --publish always` (now `ask` plus deny `*--publish*`, VERIFIED by reading the file). Other publication routes stay open, and each is fixable in the file. Gate file: `docs/engineering/b1-gate.json`.

### Per-mechanism evidence
| Mechanism | Status | Evidence |
|---|---|---|
| `--publish always/onTag` long flag | Closed | `*--publish*` deny; `electron-builder*` is `ask`. |
| Short alias `-p`, `-palways`, `-p=always` | Open (B1-b) | Only `-p always` and `-p onTag` literals are denied. |
| Config-file publish settings | Open (B1-d, B1-e) | `electron-builder.yml` absent. Agent writes it; body has no rule against an active provider. |
| `pnpm package` / `pnpm build` script indirection, lifecycle hooks | Open (B1-d) | Rules are prefix-only and cannot see script bodies. Script contents unverified. |
| GitHub CLI | Partly closed (B1-a, B1-c) | `gh *` is prefix-only. Chained, `gh.exe`, `& gh` and path forms are not matched. |
| npm/pnpm publish, `pnpm exec`, `dlx` | Partly closed | `npm *` denied, `pnpm dlx*` ask. `pnpm publish` and `pnpm exec node` not named. |
| Credentials in env | Open (B1-b) | Only `GH_TOKEN` denied. `GITHUB_TOKEN`, `CSC_*`, `APPLE_*` and `$env:` reads are not. |
| Shell composition (`;`, `&&`, `|`, `&`, backtick, `$(...)`) | Open (B1-a) | Allow `git status*` could prefix a chained publish; matcher behavior ASSUMED. |
| Interpreters and aliases (`node`, `pwsh`, `cmd`, `irm`, `iex`, `Start-Process`) | Open (B1-c) | Not in the deny list. |
| Build vs publication separation | Open (B1-e) | Separated by pattern only. The body has no human-authorization requirement for publication or for workflow changes that publish. |
| `git tag*` | Acceptable | `ask`; the tag is the release trigger, so the human prompt is the intended gate. |

### Findings (all fixable by editing release-engineer.md)
- **B1-a** Add chaining and substring denies: `*;*`, `*&&*`, `*|*`, `*&*`, backtick, `*$(*`, `*gh release*`, `*gh api*`, `*git push*`, `*npm publish*`, `*pnpm publish*`.
- **B1-b** Replace the four patterns with `* -p*`, `*--publish*`, `*TOKEN*`, `*GH_*`, `*GITHUB_*`, `*CSC_*`, `*APPLE_*`, `*$env:*`, `*env:*`, `*GetEnvironmentVariable*`, `*printenv*`.
- **B1-c** Deny `node *`, `pwsh*`, `powershell*`, `cmd*`, `& *`, `.\*`, `irm *`, `Invoke-RestMethod*`, `iex *`, `Invoke-Expression*`, `Start-Process*`, `curl.exe*`, `*gh.exe*`.
- **B1-d** Body rule: read package.json scripts and hooks before running any pnpm script, refuse if they publish, require `--publish never` in the package script. Or move `pnpm package*` and `pnpm build*` to `ask`.
- **B1-e** Body rule: publication is human-only. The release workflow publishes only on a maintainer-pushed tag, with `contents: write` only in that job, no schedule or pull_request publishing, and every publish step listed for explicit approval.

### Residual risks after the fixes (documented, not blocking)
- Pattern rules are not a sandbox. Script bodies in package.json cannot be inspected by the matcher; the Stage 4 script-review policy covers this.
- The `ask` prompt is the only barrier for `pnpm install` lifecycle scripts.
- Ambient credentials in the user's shell are reachable by any child process. Keeping publish tokens out of the shell environment is the real mitigation (ASSUMED user practice).
- Matcher semantics need a manual test with harmless synthetic commands (Stage 2).

## Stage 1 second pass: B1 re-review of the revised release-engineer.md
Reviewer did not author the file. The file was read in full. Nothing was executed, no credentials were read, and `release-engineer.md` was not edited. `package.json` and `electron-builder.yml` still do not exist (VERIFIED by earlier pass; not re-listed), so script bodies and config publish settings cannot be inspected.

### Verdict: B1 RESOLVED (APPROVED), with residual risks that are documented and not fixable by editing the file
Evidence classes: VERIFIED = read in the file. DOCUMENTED = stated in the file body as policy the agent follows, not enforced. ASSUMED = depends on Kiro matcher behavior that is not documented or tested.

| Prior finding | Class | Evidence in release-engineer.md |
|---|---|---|
| B1-a chaining and substring denies | VERIFIED rules, ASSUMED matching | Deny rule lists `*;*`, `*&&*`, `*\|\|*`, `*\|*`, `*&*`, backtick, `*$(*`, `*gh release*`, `*gh api*`, `*gh auth*`, `*gh.exe*`, `*git push*`, `*npm publish*`, `*pnpm publish*`. Substring form defeats prefix allow rules if the matcher treats `*` as matching any characters and deny beats allow. |
| B1-b `-p` aliases and credentials | VERIFIED rules, ASSUMED case handling | `* -p*` covers `-p always`, `-palways`, `-p=always`. `*--publish*` covers long form. Credential patterns cover TOKEN, GH_, GITHUB_, CSC_, APPLE_, `$env:`, `env:`, GetEnvironmentVariable, printenv, plus lowercase variants. Mixed case (for example `Token`, `GH release`) is not matched. |
| B1-c interpreters and aliases | VERIFIED | `node *`, `pwsh*`, `powershell*`, `cmd*`, `& *`, `.\*`, `irm`, `Invoke-RestMethod`, `iex`, `Invoke-Expression`, `Start-Process`, `curl.exe`, `pnpm exec node*`, `pnpm node*` denied. `gh *`, `npm *`, `npx *`, `curl *`, `bash*`, `wsl*` denied. |
| B1-d script indirection | DOCUMENTED | Restrictions require reading `package.json` scripts including `pre*` and `post*` before any pnpm script, refusing on publish, push, tag, `gh`, `curl` or token reads, and `--publish never` in the `package` script. Not enforced; the matcher cannot see script bodies. |
| B1-e human authorization | DOCUMENTED (plus VERIFIED ask rules) | Body: publication is human-only; build jobs use `contents: read` and `--publish never`; release workflow only on maintainer-pushed tag, `contents: write` only in the release job, no `schedule`, `workflow_dispatch` or `pull_request` publishing; `electron-builder.yml` may not set an active provider for local runs; every new or changed publish step is listed for explicit approval. `pnpm exec electron-builder*`, `git tag*`, install and `dlx` are `ask` (VERIFIED). `git push*`, `gh *` are deny (VERIFIED). |
| Build vs publication separation | VERIFIED rules, DOCUMENTED workflow policy | Allow list is build, package, read-only git. Publication routes are deny or ask. Workflow permission split is policy text only. |
| Honest limits | DOCUMENTED | The body states the rules are pattern matches, not a sandbox, and that compound matching is unverified. |

### Residual risks (not blockers; documented, not fixable in the agent file)
- Matcher semantics (substring `*`, deny precedence over allow, `ask` vs deny precedence, case sensitivity, default for unmatched commands such as `pnpm run <script>` or `pnpm -r publish`) are ASSUMED. Validate with harmless synthetic commands in Stage 2 manual smoke tests.
- Script bodies and `electron-builder.yml` publish config cannot be inspected until they exist. The Stage 4 package-script review policy and a security-reviewer pass on first creation are the control.
- `pnpm build*` and `pnpm package*` are prefix allows. A script name that publishes would pass the matcher and relies on the DOCUMENTED script-reading rule.
- Config-level overrides such as `-c.publish...` are not pattern-denied. `pnpm exec electron-builder*` is `ask`, so a human sees the command first.
- Ambient credentials in the user's shell remain reachable by child processes. Keeping publish tokens out of the shell environment is the real mitigation (ASSUMED user practice).
- The `* -p*` and `*TOKEN*` denies may over-block benign commands (for example `git log -p`). This is a usability cost, not a security flaw.
