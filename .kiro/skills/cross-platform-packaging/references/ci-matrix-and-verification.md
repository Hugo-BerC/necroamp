# CI matrix, reproducibility and artifact verification

Read with `SKILL.md` procedures P3 to P5. Confirm runner labels and Action behavior on docs.github.com before use. Images are retired over time.

## 1. Runner matrix

| Job role | Runner | Produces |
|---|---|---|
| ci (all OS) | `windows-latest`, `macos-latest`, `ubuntu-latest` | Typecheck, lint, test and build results |
| package-win | Windows x64 runner | NSIS x64 |
| package-mac-arm64 | Apple silicon macOS runner | DMG arm64 |
| package-mac-x64 | Intel macOS runner if one is still offered, otherwise an x64 build on Apple silicon with verified architecture | DMG x64 |
| package-linux | Ubuntu x64 runner | DEB and AppImage x64 |

`-latest` labels move. For release jobs, prefer a specific documented label and record it in `docs/release/`, so a label change is a reviewed diff.

## 2. Workflow skeleton rules

### Permissions

| Workflow or job | `permissions:` |
|---|---|
| CI workflow (top level) | `contents: read` |
| Packaging jobs (CI or release) | `contents: read` |
| Release job (tag push only) | `contents: write`. Add `id-token: write` and `attestations: write` only if artifact attestation is adopted, and only in that job. Confirm the permission names on docs.github.com. |

### Triggers
- CI: `pull_request`, and `push` to the default branch.
- Release: `push` with `tags:` limited to a version pattern (for example `v*.*.*`). No `workflow_dispatch`, `schedule` or `pull_request` path reaches a publishing step.

### Step order (each OS)
1. Checkout with `persist-credentials: false` (confirm the input name for the pinned checkout version).
2. Set up pnpm from the `packageManager` field and Node from `.nvmrc`. Enable the pnpm store cache keyed on `pnpm-lock.yaml`.
3. `pnpm install --frozen-lockfile`.
4. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
5. Packaging jobs: `pnpm package` (with `--publish never` inside the script), then verification (section 4), SBOM (section 5) and artifact upload.

### Pinning
- Every `uses:` is `owner/repo@<40-char SHA> # vX.Y.Z`. Resolve the SHA from the Action's release tag at authoring time. Never copy a SHA from memory or from another project.
- Prefer first-party `actions/*` Actions. Each additional third-party Action needs a stated reason in the hand-off.
- Keep pins current through reviewed PRs (Dependabot for `github-actions` is a GitHub-native option. Adding it is a separate decision).

### Hygiene
- Set `timeout-minutes` on every job.
- Use `concurrency` with cancel-in-progress for CI, and none for the release workflow.
- Do not interpolate `${{ github.event.* }}` text (PR titles, branch names) directly into `run:` scripts. Pass it through `env:` and quote it.
- Use PowerShell-compatible commands, or set `shell:` explicitly per step. `tech.md` says not to assume POSIX.

## 3. Reproducibility notes

Goal: the same commit and lockfile produce functionally identical artifacts. Bit-for-bit reproducibility is not claimed. Document known sources of difference instead.

- Pin the toolchain: Node from `.nvmrc`, pnpm from `packageManager`, the Electron and Electron Builder versions from the lockfile.
- Use frozen installs only. A lockfile change is a reviewed diff.
- Dependency build scripts follow the allow-list in `package-script-policy.md` 4.4.
- Known sources of difference to document: timestamps in archives and installers, signing timestamps, runner image updates, and Electron binary downloads (checksum-verified by the Electron downloader; confirm). `SOURCE_DATE_EPOCH` set from the commit time can reduce timestamp drift where tools honor it. Verify, do not assume.
- Record runner image version (shown in job logs), Node, pnpm and Electron versions in the release notes draft.

## 4. Artifact verification

Run in the job that built the artifact, before upload. A failed check fails the job.

| Check | Windows | macOS | Linux |
|---|---|---|---|
| Expected files exist, names match the template | `Get-ChildItem` on the output directory | `ls` | `ls` |
| SHA-256 checksum file | `Get-FileHash -Algorithm SHA256` | `shasum -a 256` | `sha256sum` |
| Architecture | Inspect the PE header of the unpacked app executable (document the method chosen) | `lipo -archs` or `file` on the app binary inside the `.app` | `dpkg-deb --info` (Architecture field), `file` on the AppImage |
| Package metadata | Installer version resource | `Info.plist` version and bundle identifier | `dpkg-deb --info` and `--contents` (no files outside expected paths) |
| Signature status | `Get-AuthenticodeSignature` (expected `NotSigned` until decision 11) | `codesign --verify --deep --strict` and `spctl --assess` (expected to fail until signed and notarized) | Not applicable. Checksum only |
| Content audit | The unpacked app contains no `src/`, tests, `.kiro/`, `.env` or source maps unless decided | Same | Same |
| Launch smoke (optional, best effort) | Start the unpacked app with a fixed timeout via the Playwright smoke owned by qa-engineer | Same | Same (headless display needed) |

Record expected results for unsigned builds so a reviewer can see the difference between "unsigned by plan" and "broken".

## 5. SBOM

- Generate one SBOM per release from `pnpm-lock.yaml`, in a standard format (CycloneDX or SPDX JSON). The generator tool is not yet chosen. Record the choice, its license and its pinned version in `docs/release/`. Adding it is a dependency or Action decision that needs approval.
- Upload the SBOM with the artifacts. The release job attaches it to the draft release next to `SHA256SUMS`.
- Optional: GitHub artifact attestations for build provenance, limited to the release job (see the permissions table). This is a decision for the user.

## 6. Upload and retention

- Use the official artifact upload Action, pinned by SHA. Give each OS and arch a unique artifact name to avoid collisions.
- Use short retention for CI artifacts. The release workflow keeps artifacts until the human approves or discards the draft release.
