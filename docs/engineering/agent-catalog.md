# NecroAmp Custom Agent Catalog

Phase 02 deliverable of the "NecroAmp - Engineering Team Setup" workflow. All statements about agent files were checked against `.kiro/agents/*.md`. Statements about Kiro behavior come from the Stage 1 documentation review.

## 1. Agent inventory

Nine agents live in `.kiro/agents/`. Each file name equals its `name:` value.

| Agent | Role | `tools` | Write scope (allow) |
|---|---|---|---|
| `necro-architect` | Principal architect. Requirements, ADRs, module boundaries. Architectural owner of unassigned `src/shared/**`. No production code. | read, write | `docs/adr/**`, `docs/architecture/**`, `docs/requirements/**` |
| `desktop-engineer` | Electron main process, preload, IPC contracts, local storage, build config. | read, write, shell | `src/main/**`, `src/preload/**`, `src/shared/ipc/**`, `src/shared/settings/**`, `package.json`, `tsconfig*.json`, `electron.vite.config.ts`, `.nvmrc` |
| `audio-engineer` | Web Audio graph, AudioWorklet, equalizer math, analysis. | read, write, shell | `src/renderer/audio/**`, `src/shared/audio/**`, `docs/audio/**` |
| `frontend-engineer` | React UI, Zustand stores, components, skin loader code. | read, write, shell | `src/renderer/app|features|stores|components/**`, top-level `src/renderer/*` files, `src/shared/skins/**` |
| `art-director` | Skin art and art bibles for Morgul Revenant and Analog 1984. | read, write | `skins/**`, `resources/icons/**`, `docs/design/**`, `docs/assets.md` |
| `github-engineer` | Optional GitHub features (auth, explorer, Actions monitor), main process only. | read, write, shell, web | `src/main/github/**`, `src/main/ipc/github*`, `src/shared/github/**` |
| `security-reviewer` | Independent, read-only security review. | read, write, web | `docs/security/**` only |
| `qa-engineer` | Test infrastructure, property, integration, e2e, visual, accessibility and audio-regression tests. Reports defects, never patches source. | read, write, shell | `tests/**`, `**/*.property.test.ts`, `**/*.integration.test.ts`, `vitest.config.ts`, `playwright.config.ts`, `docs/testing/**` |
| `release-engineer` | CI, packaging, signing policy, SBOM, release process. Tag creation requires explicit human approval; never publishes. | read, write, shell, web | `.github/workflows/**`, `electron-builder.yml`, `resources/**` (not `resources/icons/**`), `docs/release/**`, `CHANGELOG.md` |

## 2. Responsibilities

Each agent body states responsibilities, scope, restrictions, required context, deliverables and definition of done. Bodies cite steering sections and do not copy them.

- **necro-architect:** requirements with testable criteria, ADRs, process-boundary design, settling ownership disputes, steering conformance checks.
- **desktop-engineer:** secure IPC (Zod validation, sender checks), window and navigation guards, app lifecycle, local storage, platform integration.
- **audio-engineer:** signal graph per `tech.md`, ten-band equalizer, FFT and waveform analysis, latency and gain handling. Owns audio pure logic but not property tests.
- **frontend-engineer:** feature UI, stores, accessibility, performance, skin manifest schema and loader.
- **art-director:** art bible per skin, manifests as data, SVG assets, contrast reports, asset register, skin engine requirements. Skins must transform materials, geometry, typography and layout, not only colors.
- **github-engineer:** OAuth device flow (pending open decision 2), Octokit calls in main, rate limits, read-only explorer data, Actions monitoring.
- **security-reviewer:** threat models by trust boundary, Electron hardening, token storage, skin loader, supply chain, CI permissions. Findings go to the owning agent.
- **qa-engineer:** owns the property-based tests required by `tech.md`, e2e smoke tests, fixtures and defect reports.
- **release-engineer:** CI matrix, release workflow to GitHub Releases only, installers (NSIS/MSI, DMG, DEB, AppImage), SBOM, SHA-pinned Actions.

### Shared module ownership (src/shared/)

| Path | Owner |
|---|---|
| `src/shared/ipc/**`, `src/shared/settings/**` | desktop-engineer |
| `src/shared/audio/**` | audio-engineer |
| `src/shared/skins/**` | frontend-engineer |
| `src/shared/github/**` | github-engineer |
| All other `src/shared/**` | necro-architect (architectural owner, cannot write `src/**`) |

Coordination rules, ADR and contract change note triggers are in `docs/engineering/shared-ownership-policy.md`.

Clarification: necro-architect owns architectural decisions and the shared contracts. Implementation may be delegated to the appropriate engineering agent through an approved task, and any shared contract change requires architectural review. No write permission was widened. Unassigned `src/shared/**` still has no agent that can write it, so the approved task for that area is carried out by the user or the main session until a permission change is separately approved.

Write scopes do not overlap, with one deliberate exception: `resources/icons/**` is allowed for art-director and explicitly denied for release-engineer (deny wins).

## 3. Permission model

- **Layers:** the `tools` list sets which tools an agent sees. `permissions.rules` set what it may do. Stage 1 could not verify which tools each category (`read`, `write`) contains, so the `fs_write` and `shell` deny rules are the real boundary, not the `tools` list.
- **Precedence:** deny overrides ask, and ask overrides allow, across all scopes. An agent's allow rule cannot override a deny from the user, workspace or Kiro scope. As a sub-agent, the parent session policy also applies and the stricter result wins.
- **Common to all nine agents:**
  - `includeMcpJson: false`, `includePowers: false`, no `mcpServers`.
  - `deny` for `mcp`, `power`, `subagent` and `web_search`.
  - `fs_read` allowed on the workspace, with denies for `.env*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.p8`, `id_rsa*`, `id_ed25519*`, `id_ecdsa*`, `.ssh/**`, `.npmrc`, `.netrc`, `*.token`, `.aws/**`, `.git/**` and `credentials*` (the SSH, npm, netrc, token and AWS patterns were added in the post-approval correction, see section 5, "Post-approval corrections"). These are path rules for Kiro file tools only. Shell access can bypass them (F1).
  - `fs_write` follows an allow-list, then a catch-all deny (`**` with `exclude` of the allowed paths), then an explicit deny for secrets, `.git/**`, `.kiro/**`, `LICENSE` and `.gitignore`.
  - `resources: file://.kiro/steering/**/*.md` (4 files, within the 32-file and 100,000-character limits).
- **Shell:** denied for necro-architect, art-director and security-reviewer. For the others, `pnpm typecheck|lint|test*` (plus `build*` for desktop-engineer, qa-engineer and release-engineer) is allowed. Installs (`pnpm install|add|remove|update|dlx`) ask. These are denied: `git commit|push|reset|checkout|clean|rebase`, `gh`, `curl`, `wget`, `iwr`, `rm`, `Remove-Item`, `del`, `npm`, `npx`, `yarn`, `sudo`, `wsl`, `bash`, `aws`.
- **Web:** `web_fetch` is denied except documentation allow-lists: security-reviewer (electronjs.org, docs.github.com, owasp.org, nvd.nist.gov), github-engineer (docs.github.com, octokit.github.io), release-engineer (electron.build, docs.github.com, electronjs.org).
- **security-reviewer read-only mode:** no shell. Writes only to `docs/security/**`, with explicit denies on `src`, `skins`, `tests`, `.github`, `resources`, `package.json` and configs.
- **release-engineer publishing guard:** `pnpm exec electron-builder*` asks. A deny rule on `*--publish*`, `*-p always*`, `*-p onTag*` and `*GH_TOKEN*` blocks publishing (see section 5).

## 4. Supported configuration format

Installed Kiro: IDE 1.5.11, which uses the current format "IDE 1.0 and CLI V3".

- Markdown with YAML front matter at `.kiro/agents/<name>.md` (workspace) or `~/.kiro/agents/` (global). The body is the system prompt.
- Properties used: `name`, `description`, `tools`, `includeMcpJson`, `includePowers`, `resources`, `permissions.rules` (`capability`, `match`, `exclude`, `effect`).
- Properties deliberately not used: `model` (default model used, avoids an unavailable model), `mcpServers`, `hooks`, `welcomeMessage`, and the CLI 2.x fields `toolsSettings`, `allowedTools`, `toolAliases`, `keyboardShortcut`.
- Tool selectors `*` and `@builtin` are not used because the docs say they defeat sub-agent restrictions.
- If `x.json` and `x.md` both exist, JSON wins and the `.md` is reported as a conflict. Use one extension.
- Do not reuse bundled workflow agent names (`wf-planner`, `wf-coder`, `wf-design`, `wf-design-reviewer`, `wf-review-aggregator`, `wf-pr-submitter`, `semantic_reviewer`).
- Glob rules: filesystem `*` stays in one path component, `**` crosses separators. Shell, web and MCP globs support only `*`.

## 5. Validation results

### Independent review (Stage 4)

Source: `docs/engineering/agent-review.md` and `agent-review.json`. The reviewer did not author the files and worked by reading them.

- **Recorded verdict: `CHANGES_REQUESTED`**, one blocker, B1.
- **B1:** `release-engineer` allowed `pnpm exec electron-builder*`, which would have matched `--publish always` with no deny. With an ambient `GH_TOKEN`, a release could upload without confirmation.
- **Passed:** front matter syntax (visual), current format and version compatibility, names equal file stems, no collisions with bundled names, steering loaded and cited, MCP and Powers disabled, no secrets, security-reviewer read-only, non-overlapping write scopes, no Skill references, all required sections present.

### Status of B1 at catalog time

`release-engineer.md` now contains a `shell` deny rule with `match: ["*--publish*", "*-p always*", "*-p onTag*", "*GH_TOKEN*"]`, which is the review's recommended fix. The `electron-builder*` rule is `ask`. **No re-review has been recorded.** `agent-review.json` still says `CHANGES_REQUESTED`, so the verdict is not formally cleared until a reviewer confirms the fix.

### Non-blocking review observations

- `pnpm build|test|package*` run `package.json` scripts, and desktop-engineer can edit `package.json`, so its effective shell power can grow. Security-reviewer should inspect scripts once they exist. Addressed by policy (not by permission change) in `docs/engineering/package-script-policy.md`, Phase 02 Stage 4: script, build-config and publish-command changes need review, with desktop-engineer as author, security-reviewer and release-engineer as reviewers, and necro-architect for ADRs.
- RESOLVED (F6): `git tag*` is `ask`, and the release-engineer description and prompt now say tag creation requires explicit human approval.
- RESOLVED in Phase 02 Stage 3: `src/shared/**` outside `ipc`, `settings`, `skins`, `audio` and `github` is assigned to necro-architect as architectural owner (design, contracts, review). No write permission was widened, so implementation of that code still needs a human decision. See `docs/engineering/shared-ownership-policy.md`.
- It is unconfirmed whether `fs_read` `**` refuses absolute paths outside the workspace.
- Tool category membership (for example whether `write` includes delete tools) is unverified.

### Accuracy check in this stage

All nine files were confirmed present. I read necro-architect, security-reviewer, art-director and release-engineer in full. For desktop-engineer, audio-engineer, frontend-engineer, github-engineer and qa-engineer, I read only the `description`, `tools` and `match:` lines, not their bodies. The catalog's tool lists, write scopes and shell and web rules match what those lines show. I did not re-verify every deny pattern in those five files. The YAML has not been machine-parsed.

### Post-approval corrections (Phase 02 conditional approval)

Applied directly, without a workflow, after the conditional approval. Earlier statements in this catalog that say the B1 fix was not re-reviewed are superseded: the Phase 02 re-review recorded APPROVED in `agent-review.json` (see `phase-02-final-report.md`). That verdict is evidence about the rule text, not about enforcement.

| Item | Change | Status |
|---|---|---|
| F2 | Added `**/id_ed25519*`, `**/id_ecdsa*`, `**/.ssh/**`, `**/.npmrc`, `**/.netrc`, `**/*.token`, `**/.aws/**` to the existing `fs_read` and `fs_write` deny lists in all nine agents. `.env` and `.env.*` were already denied. | Rule text VERIFIED present and YAML re-parsed with PyYAML. Enforcement not tested. |
| F6 | release-engineer description and prompt now say tag creation requires explicit human approval. `git tag*` stays `ask`. | Text VERIFIED. The `ask` behavior is DOCUMENTED, not tested. |
| Shared ownership | Clarified (see "Shared module ownership"). | Policy text only. |

Classification used throughout: VERIFIED means observed or parsed in this repository. DOCUMENTED means taken from Kiro documentation. ASSUMED means neither. Nothing here proves enforcement, so the permission rules are not a verified security sandbox.

## 6. Smoke test and manual validation

**Smoke test: not run.** The Stage 5 session had no tool to invoke custom agents. It also could not tell whether Kiro had loaded the new files. Discoverability is verified on disk only. Loading by Kiro is unverified.

Manual validation (human):

1. Trust the workspace, then restart Kiro or reload the window.
2. Open the agent picker and confirm all nine names appear. If one is missing, check the Kiro log for a parse error on that file.
3. Select **necro-architect** and send: "Read-only: summarize the module boundaries and dependency direction from `.kiro/steering/structure.md`. Change no files." Expect: renderer, preload and main import only `shared`, and renderer reaches main only through preload and IPC.
4. Select **security-reviewer** and send: "Read-only: list the Electron hardening requirements from `.kiro/steering/tech.md`. Change no files." Expect: the four renderer flags, Zod IPC validation, strict CSP, navigation blocking, `https:`-only `shell.openExternal`, Fuses and `safeStorage`.
5. Run `git status` and confirm neither test changed a file.
6. Ask any agent to read a file outside the workspace, and ask release-engineer to run `pnpm exec electron-builder --publish always`. Both should be refused.

## 7. Known limitations

- **Permissions are not a verified sandbox.** The following permission behavior is unverified (ASSUMED or DOCUMENTED only, never tested): glob matching of the deny patterns, case sensitivity, Windows backslash paths, the default for unmatched commands, compound-command splitting, whether shell commands bypass `fs_read` and `fs_write` path rules (F1), whether `write` includes delete tools, reads outside the workspace, whether Kiro loads all nine agents, and whether `ask` prompts appear as described. Ambient credentials in the user's shell are reachable by child processes. The added F2 patterns do not cover other credential locations and do not stop shell reads.

- B1 fix not re-reviewed (section 5). Smoke test not run. YAML not machine-validated. No agent linter exists.
- Tool category membership is undocumented in what was reachable, so `tools` lists are visibility hints. Deny rules are the boundary.
- Writes under `.kiro/agents/` always prompt for approval. Writes to `.kiro/settings/` are always denied.
- Whether a running session discovers agents created mid-session is unknown.
- The `resources` limits (32 files, 100,000 characters in total, 50,000 per file) apply. Adding steering files raises the count.
- `chat.disableInheritingDefaultResources` is a CLI setting. Whether it applies in the IDE is unconfirmed, so default resources may still be inherited.
- Agents with `pnpm` script access can run whatever `package.json` scripts define. Script names are not a security boundary. Phase 02 Stage 4 added `docs/engineering/package-script-policy.md`: changes to scripts (including `pre*`/`post*`), pnpm build-script approvals, build config and publishing commands need review by security-reviewer, release-engineer (packaging and publish) and necro-architect (ADRs). The policy is advisory. Only agent permission patterns are enforced, and no permissions were changed. No `package.json` exists yet, so no script body has been reviewed.
- Unassigned `src/shared/**` has an architectural owner (necro-architect) but no agent can write it. Implementation needs a human decision (`docs/engineering/shared-ownership-policy.md`, section 2).
- Open decisions in `structure.md` are not resolved by any agent. They are marked "needs human decision".
- The Stage 1 `execute_pwsh` tool returned exit code -1 with echoed command text although output was correct. This is an environment quirk and not an agent defect.

## 8. Future Skill integrations (not created)

No Skill exists and no agent references one. Candidates once the project needs them:

- "add IPC channel": channel constant, Zod schema, handler, preload binding, test (desktop-engineer, security-reviewer).
- "create skin": manifest, assets, license record, validation (art-director, frontend-engineer).
- "write ADR": template and numbering (necro-architect).
- "add property test": fast-check scaffolding for the required areas in `tech.md` (qa-engineer).
- "security review checklist": Electron hardening and token-storage checks (security-reviewer).
- "release checklist": pinned-SHA workflow and SBOM steps (release-engineer).

When created, add `skill://` entries to the relevant agents deliberately and re-run the review.

## 9. Recommendations for reusable engineering workflows

- **Feature pipeline:** necro-architect (requirements, design, tasks) then the owning implementer, then qa-engineer (tests), then security-reviewer (review), then a human gate. This matches the spec-driven order in `kiroween.md`.
- **Never run two implementers on the same files in parallel.** The write scopes make a safe split possible.
- **Use an independent reviewer step with a fix and re-review loop.** Stage 4 shows why: the blocker was found only by a reviewer who did not write the file. Add a re-review step after fixes.
- **Hand-offs:** each agent lists requested changes to files it does not own, with the owner. A workflow step should surface them to the next step.
- **Treat the human prompt as the gate** for installs, `git tag` and writes to `.kiro/`.
- **Workflow step agents** are referenced by name in the `agent` field. Kiro checks the name when it creates the run.
- Possible pipelines: skin creation (art-director, frontend-engineer, security-reviewer), GitHub feature (architect, github-engineer, qa, security), release (release-engineer, security-reviewer, human).
