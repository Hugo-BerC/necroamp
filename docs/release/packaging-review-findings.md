# Packaging and workflow review findings

Scope: `.github/workflows/**`, `electron-builder.yml`, `package.json` scripts (including `pre*` and `post*` hooks), per `docs/engineering/package-script-policy.md` and "CI/CD" in `tech.md`.
Reviewer: release/DevOps role. No commit, push, PR edit or merge was done. No `pnpm` script was run.

## Evidence (read-only inspection of the working tree)

| Item | State |
|---|---|
| `.github/workflows/` | Does not exist. No CI or release workflow is present. |
| `electron-builder.yml` | Does not exist. |
| `electron-builder` dependency | Not in `package.json`. |
| `package` script | Not defined. |
| `pre*` / `post*` hooks | None defined. |

## package.json script review

Scripts: `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:coverage`, `test:e2e`.
None publishes, pushes, tags, calls `gh` or `curl`, or reads tokens. No lifecycle hooks exist. Bodies are plain tool invocations (`electron-vite`, `tsc -b`, `eslint`, `prettier`, `vitest`, `playwright`). `format` writes files and is not used by CI.

## Publication check

- No workflow exists, so nothing publishes or releases on any trigger. A merge to `main` cannot start a release.
- The condition "no publish without a maintainer-pushed tag" holds trivially. It must be enforced when a release workflow is added later.

## Gaps against the CI/CD requirement in `tech.md`

1. No CI workflow on Windows, macOS and Linux (frozen install, typecheck, lint, test, build).
2. No release workflow for tags.
3. No `electron-builder.yml`, no `package` script (it must use `--publish never`), no `electron-builder` dependency.
4. Packaging, signing, SBOM and the per-platform artifact table are not documented. Open decisions 10 to 12 (auto-update, signing, Linux targets) remain undecided.

These are outside the Desktop Foundation scope stated for this delivery (M0 to M8 GitHub part), so they are backlog items, not blockers for merging. The delivery report must not claim packaged installers or CI coverage for them.

## Notes for the committing agent

- Required CI checks: none can exist from workflows in this repo. When running `gh pr checks`, an empty result means "no checks present". Report it as absent, not as passing. If branch protection requires checks, they are unsatisfied by definition.
- `engines.node` is `>=24.15.0 <25`. Any future workflow should pin Node 24 and pnpm 10.34.9 via `packageManager`.

## Requests for other owners

- desktop-engineer: add `electron-builder` and a `package` script with `--publish never` when packaging starts.
- security-reviewer: review future packaging, signing and publish steps per the package-script policy.
- architect and user: decide open decisions 10 to 12.
