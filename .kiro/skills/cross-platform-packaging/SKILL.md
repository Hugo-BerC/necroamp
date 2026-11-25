---
name: cross-platform-packaging
description: >-
  Use when configuring, changing or reviewing NecroAmp packaging and CI builds:
  electron-builder.yml, Windows x64 installers, macOS arm64 and x64 packages,
  Linux DEB and AppImage, GitHub Actions workflows on native runners,
  reproducible pnpm installs, artifact verification and checksums, code signing
  and notarization considerations, SBOM steps, and keeping build jobs separate
  from publication. These procedures never publish, tag or push.
license: MIT
metadata:
  owner: release-engineer
  schema: "1"
---

# Cross-platform packaging

Rules live in steering and policy. This skill adds the procedures for applying them.
- `tech.md` "CI/CD", "Electron architecture and security" (Fuses, ASAR) and "Commands".
- `structure.md` target layout (`.github/workflows/`, `resources/`, `electron-builder.yml`) and open decisions 10, 11 and 12.
- `docs/engineering/package-script-policy.md` (review gates, `--publish never`, script bodies).
- The release-engineer agent definition (write scope, publication rules).

## Scope

In scope:
- `electron-builder.yml` structure and per-OS targets.
- CI and release workflows on GitHub-hosted native runners.
- Frozen, reproducible installs.
- Artifact naming, checksums and verification.
- Signing inputs as policy and secret names. No secret values.
- SBOM step definition.
- Separating build from publication.

Non-goals (needs human decision, or owned by someone else):
- Auto-update (open decision 10). Do not add an update provider or the updater dependency.
- Signing and notarization availability (open decision 11). Plan for unsigned builds until it is decided.
- The final Linux target set (open decision 12). DEB and AppImage are user input from Phase 03, pending an ADR.
- Creating tags, releases or secrets. These are human actions.
- Editing `package.json` (owned by desktop-engineer) and application code.

## Procedures

### P1. Before touching any packaging file
1. Read `package.json` `scripts`, including every `pre*` and `post*` hook and every file they reference. Stop and report if any script publishes, pushes, tags, calls `gh` or `curl`, or reads tokens.
2. Confirm that the `package` script passes `--publish never`.
3. Check every Electron Builder key you plan to use against the electron.build docs for the version resolved in `package.json`. Do not write keys from memory.

### P2. Configure `electron-builder.yml`
Follow `references/builder-config-principles.md`. Summary:
1. Set the `appId`, `productName` and output directory once. Fill in values only after the maintainer confirms them (the `appId` is an identity decision).
2. Declare targets per OS: Windows `nsis` x64, macOS `dmg` arm64 and x64, Linux `deb` and `AppImage` x64.
3. Include only build output and required resources. Exclude sources, tests, fixtures, `.kiro/` and docs from the app archive.
4. Keep ASAR enabled. Configure Electron Fuses as `tech.md` requires, using the mechanism the resolved Electron Builder version documents.
5. Set no active publish provider. Publication config, if any, belongs only to the tag-triggered release job (P5).

### P3. Write the CI workflow
Follow `references/ci-matrix-and-verification.md`. Summary:
1. Trigger on `pull_request` and `push` to the default branch. Grant `permissions: contents: read` at workflow level.
2. Use a matrix of Windows, macOS and Linux native runners. Build each OS on its own runner. Do not cross-compile installers.
3. Steps: checkout, set up pnpm and Node from `packageManager` and `.nvmrc`, `pnpm install --frozen-lockfile`, then `typecheck`, `lint`, `test` and `build`.
4. Pin every third-party Action by full 40-character commit SHA, with the release tag in a trailing comment.

### P4. Package and verify (no publication)
1. Run `pnpm package` locally or in a packaging job with `contents: read`. The script must pass `--publish never`.
2. Upload installers as workflow artifacts with a short retention period.
3. Run the checks in `references/ci-matrix-and-verification.md` section 4: expected file names, architecture, SHA-256 checksums, signature status and a launch smoke where possible.
4. Generate the SBOM from the lockfile in the same job and upload it with the artifacts. The tool choice is recorded in `docs/release/`.

### P5. Release workflow (design only; activation requires human approval)
1. Trigger only on `push` of a version tag pushed by a maintainer. Never on `schedule`, `workflow_dispatch` or `pull_request`.
2. Build jobs repeat P3 and P4 with `contents: read` and `--publish never`.
3. A single, final release job downloads the verified artifacts and checksums and creates a draft GitHub Release. Only this job gets `contents: write`.
4. List every new or changed publish step in your hand-off for explicit user approval. Do not run it.

### P6. Signing
Follow `references/signing-considerations.md`. Until open decision 11 is resolved, builds are unsigned and documented as such. Signing steps reference secret names only and run only in the release workflow.

### P7. Hand-off
Report the following:
- Changed files.
- Every publish-related step.
- Commands that ran locally, or why they could not run.
- Changes needed outside your scope, with their owner (for example, `package.json` scripts go to desktop-engineer).
- Review requests to security-reviewer per `package-script-policy.md` 4.2.

## Recommended patterns
- One `electron-builder.yml` for all platforms, with per-OS blocks. Use CLI flags only for `--publish never` and the platform or architecture selection.
- Write the artifact name template with product, version, OS and architecture so every file name is unique and predictable.
- Set `fail-fast: false` on the matrix so one OS failure does not hide others.
- Generate checksums next to the artifacts (`SHA256SUMS` per OS) in the job that built them.
- Use `concurrency` on CI to cancel superseded runs on the same ref.
- Use workflow-level `permissions: contents: read`, and raise permissions only in the one job that needs it.
- Use explicit, documented runner labels. Revisit them when GitHub retires an image.

## Anti-patterns
- A `publish:` provider active in `electron-builder.yml`, or `electron-builder` run without `--publish never` outside the release job.
- `contents: write`, `id-token: write` or `packages: write` on a build, test or packaging job.
- Actions referenced by tag or branch (`@v4`, `@main`), or a `curl | sh` installer step.
- `pnpm install` without `--frozen-lockfile` in CI, `pnpm dlx` in workflows, or `dangerouslyAllowAllBuilds`.
- Building macOS x64 and arm64 on one runner without verifying each binary's architecture. Building Windows installers on Linux under Wine.
- Echoing secrets, writing certificates to the workspace without cleanup, or decoding signing material in a `pull_request` job.
- Setting an auto-update feed, an `rpm`, `snap` or `flatpak` target, or a signing identity before its open decision is settled.
- Installer hooks or `afterPack` or `afterSign` scripts that contact the network.

## Security considerations
- Pull requests from forks run untrusted code. CI for `pull_request` gets read-only permissions and no secrets. Do not use `pull_request_target` to build untrusted code.
- Artifacts are build output, not releases. Treat their checksums as the identity a human verifies before approving a release.
- Packaging must not weaken runtime hardening. Fuses and ASAR integrity settings come from `tech.md`. Coordinate with desktop-engineer and the electron-security skill.
- Secrets appear only as `${{ secrets.NAME }}` in the release job. Never print them, write them into `electron-builder.yml`, or pass them to steps that do not need them.
- The pipeline uses GitHub only. No external artifact store, cloud signing service or AWS.

## Acceptance criteria
- AC1: Every workflow parses as YAML, sets explicit `permissions:`, and pins every third-party Action by full commit SHA.
- AC2: No job except the tag-triggered release job has `contents: write`. No workflow publishes on `schedule`, `workflow_dispatch` or `pull_request`.
- AC3: `electron-builder.yml` has no active publish provider. `pnpm package` passes `--publish never`.
- AC4: The CI matrix covers Windows, macOS and Linux native runners with a frozen install, typecheck, lint, test and build.
- AC5: Packaging produces Windows x64 NSIS, macOS arm64 and x64 DMG, and Linux x64 DEB and AppImage, each with a SHA-256 checksum. An SBOM step is defined.
- AC6: Signing needs are documented by secret name only. Unsigned behavior is stated per OS.
- AC7: Open decisions 10, 11 and 12 are cited, not decided.

## Validation checklist
- [ ] Read `package.json` scripts and hooks. Nothing publishes, pushes, tags, calls `gh` or `curl`, or reads tokens.
- [ ] Each Electron Builder key was checked against electron.build for the resolved version.
- [ ] Workflows parse as YAML. Every `uses:` is pinned by full SHA with a version comment.
- [ ] Workflow-level permissions are `contents: read`. Any job-level raise is justified and limited to the release job.
- [ ] Triggers were reviewed: no publication on `schedule`, `workflow_dispatch` or `pull_request`.
- [ ] Installs use `--frozen-lockfile`. No `pnpm dlx` or unpinned downloads.
- [ ] Artifact names, architectures and checksums were verified per OS (reference section 4).
- [ ] An SBOM is produced from the lockfile and uploaded with the artifacts.
- [ ] No secret values, certificates or personal data are in the repository or logs.
- [ ] `pnpm build` and `pnpm package` ran locally, or the reason they could not run is stated.
- [ ] The hand-off lists publish steps, changes outside scope with owners, and review requests.

## References
- `references/builder-config-principles.md`: read when you create or edit `electron-builder.yml`.
- `references/ci-matrix-and-verification.md`: read when you write workflows or verify artifacts.
- `references/signing-considerations.md`: read when signing, notarization or certificate secrets come up.
