# Package Script Security Policy

Phase 02, Stage 4. Applies to every agent and human contributor.

## 1. Location

This file lives in `docs/engineering/` because that directory already holds the agent catalog, review, validation and shared-ownership policy that this policy amends, and because the Stage 4 task limited writes to `.kiro/agents/`, `docs/engineering/` and `docs/kiroween/`. `docs/security/` is the security-reviewer's write path and `docs/release/` is the release-engineer's, so neither fits a policy that spans several agents. A later ADR may move or cite it.

## 2. Evidence base and classification

- **VERIFIED**: observed in this repository during this stage.
- **DOCUMENTED**: stated by official documentation or earlier validation reports. Not exercised here.
- **ASSUMED**: inferred, not observed or documented.

Verified facts:

- VERIFIED: the repository has no `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `electron-builder.yml` or `.github/` directory yet. Directory listing at the repository root shows only `.git`, `.kiro`, `docs`, `.gitignore`, `LICENSE`, `README.md`. There is no script content to review today.
- VERIFIED: `desktop-engineer` is the only agent whose `fs_write` allow-list contains `package.json`. No agent can write `.npmrc` or `pnpm-workspace.yaml` (the catch-all `fs_write` deny applies). `release-engineer` can write `electron-builder.yml` and `.github/workflows/**`.
- VERIFIED: `desktop-engineer`, `audio-engineer`, `frontend-engineer`, `github-engineer`, `qa-engineer` and `release-engineer` have `shell` allow patterns of the form `pnpm <name>*`. `pnpm install|add|remove|update|dlx*` is `ask` for all of them.

## 3. Risk review

| Mechanism | Risk | Classification |
|---|---|---|
| Project scripts in `package.json` (`scripts`) | `pnpm <name>` runs an arbitrary shell string. The body can call anything, including `gh`, `curl` or a publish command. | DOCUMENTED |
| `pre<name>` and `post<name>` hooks | Run implicitly around the named script, so `pnpm build` may also run `prebuild` and `postbuild`. pnpm runs these by default in current releases; confirm against the pinned pnpm version at scaffold time. | ASSUMED |
| Root lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`) | Run when the project is installed, so any approved `pnpm install` executes them. | DOCUMENTED |
| Dependency lifecycle scripts (`postinstall` and similar) | The main route for compromised packages. pnpm does not run dependency build scripts unless allowed in `allowBuilds`; with `strictDepBuilds` (default on) an install fails when an unapproved dependency has a build script. `dangerouslyAllowAllBuilds` re-enables all of them. Source: https://pnpm.io/supply-chain-security. Older pnpm 10 releases documented `onlyBuiltDependencies` for the same purpose, so the setting name depends on the pinned version. | DOCUMENTED |
| `pnpm dlx <pkg>` | Downloads and runs a package outside the lockfile. Unpinned code execution. | DOCUMENTED |
| `pnpm exec <bin>` | Runs a binary from the project (or PATH). With `node`, `pwsh` or similar it runs arbitrary code. | DOCUMENTED |
| Script indirection | A script calls another script, a `.js` or `.ps1` file, or `pnpm run` with a variable. A shell-pattern allow rule sees only the outer command. | DOCUMENTED (rule matching) / ASSUMED (compound handling, see agent-validation.md) |
| Config files that alter execution | `.npmrc`, `pnpm-workspace.yaml` (build-script approval, registries, `script-shell`) and `electron-builder.yml` (publish provider, `afterSign`/hook script paths) change what runs without touching `scripts`. | DOCUMENTED |
| Publishing commands | `pnpm publish`, `npm publish`, `electron-builder --publish`, `gh release`. Credentials come from ambient environment variables, so the command string need not contain a token. | DOCUMENTED |
| Script names | A name such as `lint` or `test` says nothing about the body. | VERIFIED by definition: the name is a free-text key. |

**Script names are not a security boundary.** An allow rule such as `pnpm test*` permits whatever `scripts.test` (and `pretest`, `posttest`, and any script starting with `test`, for example `test-and-deploy`) contains. A changed script body changes an agent's effective power without any change to its permission rules.

## 4. Policy

### 4.1 Changes that require review

A change to any of the following needs the review in 4.2 before it is accepted:

1. `package.json`: `scripts` (including every `pre*`, `post*`, `prepare`, `install`-family entry), `bin`, `files`, `publishConfig`, `packageManager`, `engines`, and any dependency added or changed.
2. `pnpm-workspace.yaml` and `.npmrc`: build-script approval (`allowBuilds`, `onlyBuiltDependencies`, `dangerouslyAllowAllBuilds`, `strictDepBuilds`), `minimumReleaseAge`, `trustPolicy*`, `blockExoticSubdeps`, registries, `script-shell`.
3. Build and packaging config: `electron-builder.yml` (especially `publish`, hooks, `afterSign`, `afterPack`), `electron.vite.config.ts`, any file referenced by a script (for example `scripts/*.mjs`).
4. `.github/workflows/**`: any `run:` step that invokes `pnpm`, `npm`, `gh`, `curl`, or a publish command, and any change to `permissions:` or triggers.
5. Any command or script that publishes, tags, pushes, creates a release, or reads a credential variable.

### 4.2 Review requirements

| Change | Required reviewers |
|---|---|
| `scripts` body or hook added or changed | `security-reviewer` reads the full resulting body (including `pre*`/`post*` and referenced files). `desktop-engineer` authors. |
| Script that packages, signs or publishes; `electron-builder.yml`; workflows | `release-engineer` reviews for publish separation (build jobs `contents: read`, `--publish never`); `security-reviewer` reviews credentials and permissions. |
| New dependency, build-script approval change, `pnpm-workspace.yaml`/`.npmrc` change | `security-reviewer` reviews; `necro-architect` records an ADR or architect note (already required by `desktop-engineer` for installs). |
| New build tool, new script category, new process boundary | `necro-architect` decides and records an ADR. |
| Any publish, tag, push or release step | Explicit human authorization, always. No agent approval substitutes. |

Reviewers read script bodies, not names. A review is recorded as a `docs/security/review-package-scripts-<n>.md` by `security-reviewer`, or as a note in the hand-off message when the change is small.

### 4.3 What stays allowed

Review gates changes, not use. These remain routine, subject to the existing agent permissions:

- Running existing, already-reviewed scripts for `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e` and `package` (names from `tech.md`).
- Adding a new script that only invokes a project-local tool (vitest, eslint, tsc, electron-vite, electron-builder with `--publish never`), after the 4.2 review.
- Installs approved at the existing `ask` prompt, with the `allowBuilds` list kept minimal.

### 4.4 Technical requirements for the future `package.json` and pnpm config

These apply when `desktop-engineer` scaffolds, and `security-reviewer` checks them:

- No `publish` or `release` script, and no `prepublishOnly`/`prepack`/`postpack` that does network or credential work. Publication happens only in the release workflow on a maintainer-pushed tag (see `release-engineer`).
- `package` script uses `--publish never`.
- No dependency build script is allowed by default. Allow-list individual packages (for example Electron's download step, if required) by name, and record why. Do not set `dangerouslyAllowAllBuilds`.
- Keep `strictDepBuilds` and `blockExoticSubdeps` at their defaults. Consider `minimumReleaseAge` and `trustPolicy: no-downgrade`. These names come from pnpm's documentation page above and must be re-checked against the pinned pnpm version.
- CI installs with `pnpm install --frozen-lockfile` (already in `tech.md`).
- Scripts avoid `node -e`, inline downloads, `curl | sh` patterns, and reading `GH_*`, `GITHUB_*`, `CSC_*`, `APPLE_*` or `*TOKEN*` variables except inside the release job.
- Use cross-platform scripts (PowerShell-compatible), per `tech.md`.

## 5. Enforcement matrix

| Control | State | Class |
|---|---|---|
| `release-engineer` shell deny rules for publish, `gh`, `curl`, env-var reads, compound separators, `node`/`pwsh` | Present in `release-engineer.md`. Pattern matching only. | VERIFIED present; DOCUMENTED as the enforcement mechanism; compound-command behavior ASSUMED |
| `pnpm install\|add\|remove\|update\|dlx*` is `ask` for script-capable agents | Present in all six shell-capable agents. | VERIFIED present; DOCUMENTED semantics |
| Only `desktop-engineer` can edit `package.json` | `fs_write` allow-list. | VERIFIED present; DOCUMENTED semantics |
| `security-reviewer` cannot edit `package.json` or configs | Explicit deny. | VERIFIED present |
| Agent body instructions to read scripts before running (`release-engineer`), and the review duty in this policy | Natural-language policy. The model follows it; nothing blocks a violation. | ADVISORY (ASSUMED followed) |
| Script bodies are inspected by any permission rule | Not possible. Rules match command strings only. | DOCUMENTED limitation |
| `pre*`/`post*` hooks are covered by the `pnpm <name>*` allow | Not covered. The hook runs inside the allowed command. | ASSUMED (pnpm default) |
| Review on human-authored commits, CODEOWNERS, branch protection, required CI check on script changes | Not present. No `.github/` directory exists. | VERIFIED absent |
| pnpm build-script approval (`allowBuilds`) | Cannot be tested: no pnpm config or lockfile, and no install permitted in this stage. | DOCUMENTED; not exercised |

Nothing in this policy is technically enforced beyond agent permission patterns. For humans the policy is advisory until a CI check or CODEOWNERS file exists.

## 6. Agent responsibilities (no permission changes)

Permissions in `.kiro/agents/*.md` were not changed. Only prompt text was extended.

- `desktop-engineer`: author of `package.json`. Must follow this policy, keep scripts free of publish or credential use, and list every script change in its hand-off for review.
- `release-engineer`: reviews packaging, signing and publish-related script and config changes; confirms `--publish never`.
- `security-reviewer`: reviews script bodies, hooks, dependency build-script approvals and pnpm config. Reports to the owner.
- `necro-architect`: records ADRs for new build tooling and dependency decisions, and settles disputes over script ownership.
- `qa-engineer`: may call existing scripts only. Reports to `desktop-engineer` if a test script needs a change, since it cannot write `package.json`.
- Other shell-capable agents (`audio-engineer`, `frontend-engineer`, `github-engineer`): run existing scripts only and request script changes from `desktop-engineer`.

## 7. Known gaps

- No script content exists, so no body-level review could be done. The first review happens at scaffold time.
- Whether the pinned pnpm runs `pre*`/`post*` hooks and which approval setting name it uses is not confirmed.
- Whether Kiro's shell matcher checks each part of a compound command is unverified (see `agent-validation.md`).
- Agents that can run `pnpm test*` could trigger any script whose name starts with `test`. Reviewers should reject script names that extend an allowed prefix with unrelated behavior.
- `.npmrc` and `pnpm-workspace.yaml` have no owner in any agent's write scope. A human, or a scoped permission change decided by the user, must edit them.
- `.github/CODEOWNERS` would help but falls in `release-engineer`'s scope only through `.github/workflows/**`, so it is not writable by any agent.

## 8. Steering recommendations

Steering was not modified. For the user to consider:

1. `tech.md`, "Language and code rules" or "CI/CD": add a rule that changes to `package.json` scripts, pnpm build-script approval settings and publishing commands need security review, and that `package` uses `--publish never`.
2. `tech.md`, "Commands": state that script names are not a security boundary and that `pre*`/`post*` hooks count as part of a script.
3. `structure.md`: add `.npmrc` and `pnpm-workspace.yaml` to the target layout, and add a decision on which agent or human owns them.
4. `structure.md`, "Open decisions": add "Dependency build-script policy" (which packages may run install scripts) to be settled by ADR.
5. `kiroween.md`: add a rule that no agent runs a publish or release command, to match the human-only publication rule already applied to `release-engineer`.
