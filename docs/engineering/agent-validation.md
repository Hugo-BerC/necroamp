# Agent configuration validation (Phase 02, Stage 2)

Scope: `.kiro/agents/*.md` (nine files), read in full. Steering was read and not modified. Nothing was installed, committed or published. No credentials were read.

Classes:
- **VERIFIED**: parsed, executed or read directly in this session.
- **DOCUMENTED**: stated on kiro.dev (fetched this session: `/docs/custom-agents/`, `/docs/custom-agents/configuration-reference/`, `/docs/custom-agents/creating/`, `/docs/permissions/`).
- **ASSUMED**: neither verified nor documented.

## Environment (VERIFIED)
- Kiro IDE: `kiro --version` returned **1.5.11**.
- YAML parser: Python 3.14 with PyYAML 6.0.3 was already installed (`yaml.safe_load`). Node, pnpm and npm are not on PATH.
- `kiro-cli` 3.5.0 is installed and has `kiro-cli agent validate --path <file>`. It fails with `error: You are not logged in, please log in with kiro-cli login`. I did not log in (credential access). The official validator was therefore not run.
- `package.json` and `electron-builder.yml` do not exist.

## Result summary
Configuration errors found: **0**. Files edited under `.kiro/agents/`: **0**. Findings F1 to F6 below are recommendations or accepted residual risks, not configuration errors.

## 1. YAML front matter (VERIFIED)
Each file was split at the `---` delimiters and parsed with `yaml.safe_load`. All nine parse without error. Files are UTF-8, no BOM, LF line endings.

`github-engineer.md` re-checked for real: its `description` is `Senior integration engineer for the optional GitHub features (auth, repository browsing, Actions monitoring), all in the main process.` It has no `: ` sequence, and it parses to a string. The earlier invalid-YAML problem is gone.

All 9 files: top-level keys are exactly `name, description, tools, includeMcpJson, includePowers, resources, permissions`. Every rule has only `capability`, `effect` and optionally `match` and `exclude`. Every `effect` is `allow`, `ask` or `deny`. In `release-engineer.md` the double-quoted `".\\*"` parses to `.\*` and the backtick pattern parses intact.

## 2. Compatibility with Kiro IDE 1.5.11
- **DOCUMENTED:** the Markdown front matter format, `permissions.rules`, `includeMcpJson`, `includePowers` and tool category tags are documented as "IDE 1.0 / CLI V3" format. IDE 1.5.11 is newer than every version threshold on the pages (1.4.51 shell-parse blocking, 1.4.86 `file://` resource limits).
- **DOCUMENTED:** a workspace is untrusted until the user trusts it, and an untrusted workspace does not load custom agents. The agents will not appear in the picker until the workspace is trusted.
- **DOCUMENTED:** writes to `.kiro/agents` always prompt, so agents cannot silently edit agent files even if a rule allowed it.
- **NOT PERFORMED:** loading in the IDE picker (see "Unperformed validations").

## 3. Supported properties (DOCUMENTED, checked against the reference)
| Property | Used | Status |
|---|---|---|
| `name`, `description` | all | Documented. `name` is optional and derived from the filename. Here filename stem equals `name` in all nine. |
| `tools` | all | Documented. Category tags used: `read`, `write`, `shell`, `web`. |
| `includeMcpJson`, `includePowers` | all, `false` | Documented ("New in IDE 1.0 / CLI V3"). |
| `resources` | all | Documented. `file://.kiro/steering/**/*.md` has the same form as the docs example. |
| `permissions.rules` | all | Documented fields: `capability`, `match`, `effect`, `exclude`. |
| Not used | `model`, `mcpServers`, `hooks`, `welcomeMessage`, `excludedTools`, and every CLI 2.x legacy field (`toolsSettings`, `allowedTools`, `toolAliases`, `keyboardShortcut`) | Correct: legacy fields are ignored or skipped by V3. |

Resource limits (DOCUMENTED, IDE 1.4.86+: 32 files, 100,000 characters in total, 50,000 per file). VERIFIED sizes: steering is 4 files and 19,029 characters in total (3,398 + 3,084 + 6,364 + 6,183). The limits are not reached. Custom agents also inherit default steering (DOCUMENTED), so steering is likely loaded twice, which only costs context.

## 4. Names and descriptions (VERIFIED)
Names are unique, kebab-case, and equal to filenames: `necro-architect`, `desktop-engineer`, `audio-engineer`, `frontend-engineer`, `art-director`, `github-engineer`, `security-reviewer`, `qa-engineer`, `release-engineer`. Descriptions are single-line strings of 107 to 180 characters. Each states the owned domain and, where relevant, the main limit (architect writes no code, security-reviewer is read-only, qa reports defects, release never tags or publishes). No Winamp names or trademarks appear.

## 5. Tool categories and capabilities
| Agent | `tools` | fs_write allow scope | shell | web_fetch |
|---|---|---|---|---|
| necro-architect | read, write | `docs/adr`, `docs/architecture`, `docs/requirements` | deny all | deny |
| desktop-engineer | read, write, shell | `src/main/**` (not github), `src/preload`, `src/shared/ipc`, `src/shared/settings`, `package.json`, `tsconfig*.json`, `electron.vite.config.ts`, `.nvmrc` | allow typecheck, lint, test, build, dev; ask installs | deny |
| audio-engineer | read, write, shell | `src/renderer/audio`, `src/shared/audio`, `docs/audio` | allow typecheck, lint, test; ask installs | deny |
| frontend-engineer | read, write, shell | renderer app, features, stores, components, top-level files, `src/shared/skins` | allow typecheck, lint, test; ask installs | deny |
| art-director | read, write | `skins`, `resources/icons`, `docs/design`, `docs/assets.md` | deny all | deny |
| github-engineer | read, write, shell, web | `src/main/github`, `src/main/ipc/github*`, `src/shared/github` | allow typecheck, lint, test; ask installs | docs.github.com, octokit.github.io only |
| security-reviewer | read, write, web | `docs/security` | deny all | electronjs.org, docs.github.com, owasp.org, nvd.nist.gov |
| qa-engineer | read, write, shell | `tests`, property and integration tests, vitest and playwright config, `docs/testing` | allow typecheck, lint, test, test:e2e, build; ask installs | deny |
| release-engineer | read, write, shell, web | `.github/workflows`, `electron-builder.yml`, `resources/**` (not icons), `docs/release`, `CHANGELOG.md` | allow build, package, read-only git; ask electron-builder, git tag, installs; many denies | electron.build, docs.github.com, electronjs.org |

VERIFIED by reading: the agents without shell (architect, art-director, security-reviewer) have both no `shell` tool and a `shell` deny rule, so the shell boundary is double-layered. All nine deny `mcp`, `power`, `subagent` and `web_search`.

DOCUMENTED: the `tools` field decides which tools are visible, `permissions` decides what they may do. The membership of the `write` category (for example whether it includes delete tools) is on the built-in tools page, which returned HTTP 404 under the URL I tried. **ASSUMED:** `write` only covers file modification tools. The `fs_write` path rules are the boundary that matters.

## 6. Permission rules and match patterns
- **DOCUMENTED:** evaluation is deny-overrides (deny > ask > allow) across all scopes, so rule order does not matter. Every agent's pattern "allow scope, deny `**` except scope, deny sensitive paths" is therefore correct regardless of ordering.
- **DOCUMENTED:** `exclude` is valid, filesystem globs support `**`, shell and web patterns support only `*` (no `**`, `?`, classes). VERIFIED: the shell and web patterns in all files use only `*`. Filesystem patterns use `**` and `*`, valid for `fs_*`.
- **DOCUMENTED:** compound shell commands (`;`, `&&`, `||`, `|`) are split and each part is evaluated separately. Therefore `pnpm test*` cannot cover `pnpm test ; curl ...`. This replaces the earlier ASSUMED status for compound matching. The substring denies in release-engineer (`*;*`, `*&&*`, etc.) are redundant with that behavior but harmless.
- **DOCUMENTED:** Kiro blocks PowerShell commands it cannot parse well enough to check (IDE 1.4.51+). Commands matching no rule fall to `ask` by default.
- **ASSUMED:** shell pattern case sensitivity. release-engineer lists upper and lower case variants of credential names, which covers the common cases either way.
- **ASSUMED:** whether `fs_read` `**` allow can match absolute paths outside the workspace, and whether Windows backslash paths are normalized to the `/` patterns used here.
- Over-blocking (usability, not security): `* -p*`, `*token*`, `cmd*` and `*env:*` in release-engineer also block benign commands such as `git log -p`.
- **Synthetic matcher test: NOT PERFORMED.** Kiro's matcher cannot be called offline. A matcher I wrote myself would test my code, not Kiro's, so I did not run one.

## 7. Consistency with steering (VERIFIED by reading)
- Every agent loads steering and cites it rather than copying it. No agent asks for AWS, telemetry or cloud services. Descriptions and bodies keep GitHub opt-in, local-first, skins as data and original assets.
- `pnpm` only, PowerShell-compatible commands: shell allow lists use `pnpm` and deny `npm`, `npx`, `yarn`, `bash`, `wsl`.
- "Do not commit, push or open PRs" matches `kiroween.md` rule 3 and is also enforced by deny rules for `git commit*` and `git push*` (everywhere with shell).
- `.kiro/` is not gitignored by these files. Agents deny writes to `.kiro/**`, which is consistent with keeping Kiro config human-controlled.
- Steering says "do not create Specs, Custom Agents, Hooks or Workflows until the user asks". The agents exist because the user asked (workflow request). Bodies forbid inventing Skills, Hooks, Specs or MCP servers.
- Tension, not conflict: `kiroween.md` rule 8 (no secrets) is carried by body text only plus path denies; see F2.

## 8. Least-privilege boundaries
Holds (DOCUMENTED rules, VERIFIED present in the files): path-scoped writes, secret-path read and write denies, web limited to allow-listed documentation hosts or denied, MCP, Powers, sub-agents and web search denied, no commit or push, installs and `pnpm dlx` ask. security-reviewer has no shell and no write path to source.

Findings (none is a configuration error):
- **F1 Shell can bypass path rules (DOCUMENTED default, ASSUMED outcome).** desktop, audio, frontend, github, qa and release have shell. `fs_write` and `fs_read` rules govern the file tools. A shell command such as `Set-Content`, `Out-File`, a redirection or a read of a secret file is not matched by those rules. Unlisted commands default to `ask` (DOCUMENTED), so a human sees them, but the default policy also silently allows some read-only commands (git queries, system info). Whether the silent set includes file-reading commands such as `Get-Content` is unknown (ASSUMED). The `.env` and key denies are therefore not a guaranteed barrier for agents with shell. Mitigation: keep `ask` as the fallback and review shell prompts.
- **F2 Secret-path deny list is not exhaustive (VERIFIED).** The list covers `.env*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.p8`, `id_rsa*`, `.git/**`, `credentials*`. It omits `.npmrc`, `.netrc`, `*.token`, `.aws/**`. No such files exist in the repo yet. Recommendation for Stage 4 or a later pass: add `**/.npmrc` and `**/.netrc` to every `fs_read` deny. Not edited, because it is a hardening change rather than a cited error.
- **F3 Allowed shell commands run package scripts (DOCUMENTED).** `pnpm test*`, `pnpm build*`, `pnpm dev*` and `pnpm package*` execute `package.json` script bodies the matcher cannot see. desktop-engineer can edit `package.json` and run those commands, so it can in principle widen its own effective shell power. This is the subject of Stage 4 (script review policy). The rules are not a security boundary for this case.
- **F4 Prefix allows are loose (VERIFIED).** `pnpm test*` also matches `pnpm testfoo`; `pnpm lint*` and `pnpm typecheck*` likewise. Practical risk is low, since any such command needs a matching script.
- **F5 Unrestricted capabilities (VERIFIED).** `skill`, `context` and `diagnostics` are not denied in any agent. No skill resources are configured, so impact is low. Consider an explicit `skill` deny if skills are added later.
- **F6 release-engineer `git tag*` is `ask`, while the description says it never tags (VERIFIED).** The prompt is the human gate and the body says "Do not ... tag". Accepted in the earlier review, noted here for consistency.

B1 status is not re-decided here. The release-engineer rules and body were read and match what `agent-review.md` records. Matcher behavior is now DOCUMENTED for compound commands, deny precedence and the ask default, and still ASSUMED for case sensitivity.

## 9. Conflicting or unowned responsibilities
No overlapping write allow scope remains after deny rules (VERIFIED by comparing the allow lists):
- `src/main/github/**` and `src/main/ipc/github*`: allowed for github-engineer, explicitly denied for desktop-engineer.
- `resources/**`: release-engineer, with `resources/icons/**` denied to it and allowed to art-director.
- `**/*.property.test.ts`, `**/*.integration.test.ts`: allowed for qa-engineer, denied for all other writers.

Cross-ownership points that need a hand-off, not an edit:
- `package.json` is desktop-engineer only. release-engineer requires the `package` script to use `--publish never` and cannot edit it. release-engineer must request that change from desktop-engineer.
- The skin schema and loader (`src/shared/skins/**`, frontend-engineer) versus skin files (`skins/**`, art-director). Hand-off through `docs/design/skin-engine-requirements.md` is documented in both bodies.
- Asset license entries are art-director's (`docs/assets.md`), including entries for qa audio fixtures. Documented in qa-engineer.

Unowned paths (no agent can write them; the human or a future owner must): `src/shared/**` outside `ipc`, `settings`, `skins`, `audio`, `github` (Stage 3 assigns it to necro-architect); `README.md`, `CONTRIBUTING.md`, `SECURITY.md`; `.github/` outside `workflows/`; ESLint and Prettier or Biome config files; `docs/` folders other than those named above; `.gitignore` and `LICENSE` (denied to all by design).

## Unperformed validations
1. **Official validator.** `kiro-cli agent validate --path <file>` exists (kiro-cli 3.5.0) but returned `You are not logged in`. Not run, because logging in means credential access. Re-run after a manual `kiro-cli login`, one file at a time.
2. **Agent loading in IDE 1.5.11.** The picker, trust prompt and parse errors in the IDE were not observed. This session cannot open the IDE UI.
3. **Smoke test by invoking agents.** The session cannot invoke custom agents. Also, the workspace must be trusted for agents to load (DOCUMENTED).
4. **Permission matcher tests with synthetic commands.** No offline entry point to Kiro's matcher. The cases to run manually, with harmless inputs only: a shell `echo`, `git status`, `pnpm test ; echo x`, a write to a synthetic `docs/zz-fixture.txt` as an agent that does not own `docs/`, and a read of a synthetic `fixtures/sample.env`.
5. **Read outside the workspace** (absolute path or `..`) under `fs_read` `**`.
6. **Windows backslash paths** against the `/` patterns.
7. **Shell case sensitivity** of patterns.
8. **`write` category membership** (built-in tools page returned 404 at the tried URL).
9. **Script bodies and electron-builder publish config.** `package.json` and `electron-builder.yml` do not exist.
10. **Shell bypass of fs rules (F1)** was not exercised.

## Files edited by this stage
Created: `docs/engineering/agent-validation.md`. No file under `.kiro/` was changed.
