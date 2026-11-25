# Electron Builder configuration principles

Read with `SKILL.md` procedure P2. Key names below are the ones Electron Builder commonly documents. Confirm each one on electron.build for the version recorded in `package.json` before use. Where a key is uncertain, the text says so.

## 1. Target table

| OS | Target | Arch | Runner OS | Status |
|---|---|---|---|---|
| Windows | `nsis` | x64 | Windows | Product scope. MSI is an alternative; choose one by ADR before adding a second. |
| macOS | `dmg` | arm64 | macOS (Apple silicon) | Product scope. |
| macOS | `dmg` | x64 | macOS (Intel runner or a verified x64 build on Apple silicon) | Product scope. Verify the binary architecture (see the verification reference). |
| Linux | `deb` | x64 | Linux | Phase 03 user input. Open decision 12, pending an ADR. |
| Linux | `AppImage` | x64 | Linux | Phase 03 user input. Open decision 12, pending an ADR. |

A universal macOS binary is an option that needs a decision, because it doubles the download size. Do not add it silently. Linux arm64 and Windows arm64 are out of scope until product scope says otherwise.

## 2. Top-level structure

Group the configuration in this order so reviews stay mechanical:

1. Identity: `appId`, `productName`, copyright. The maintainer confirms the `appId` (reverse-DNS) once. Changing it later breaks upgrades and macOS identity.
2. Directories: output directory (for example `dist/` or `release/`; keep it in `.gitignore`, which the human owns) and build resources (`resources/`).
3. Files: an explicit allow-list of electron-vite output. Exclude `src/`, `tests/`, `docs/`, `.kiro/`, `.github/`, maps unless decided otherwise, and dev-only files.
4. Extra resources: bundled skins (`skins/**`) if the skin engine loads them from disk. Coordinate with art-director and frontend-engineer on the path the app expects.
5. ASAR: keep it on. Unpack only native modules that require it, and list why.
6. Per-OS blocks: `win`, `nsis`, `mac`, `dmg`, `linux`, `deb`, `appImage`.
7. Artifact name template: product, version, OS and arch, for example `${productName}-${version}-${os}-${arch}.${ext}`. Confirm the macro names in the docs.
8. Publish: absent or explicitly disabled (section 4).

## 3. Per-OS notes

### Windows (NSIS)
- Use x64 only. Decide per-user versus per-machine installation and record it in `docs/release/`. Per-user avoids UAC prompts.
- Installer resources (header or sidebar images, license page) go in `resources/` (not `resources/icons/`, which the icon owner controls). Every image needs a `docs/assets.md` entry.
- The installer must not download anything at install time.
- Uninstall should leave user data in place unless the user opts in. Document the behavior.

### macOS (DMG)
- Produce separate arm64 and x64 artifacts with distinct names.
- Hardened runtime and entitlements are needed for notarization. Keep entitlements minimal. Do not add JIT, unsigned executable memory or library validation exceptions unless an ADR justifies them.
- The DMG background is an installer resource that needs a license record.

### Linux (DEB, AppImage)
- DEB metadata needs a maintainer and package description. Use a project contact, never personal data. Declare runtime dependencies only if the docs require them for the resolved Electron version.
- Desktop entry: category (for example `Audio` or `AudioVideo`; confirm valid values in the freedesktop list) and MIME types for MP3, WAV, FLAC and OGG if file association is wanted (decision for the architect).
- AppImage has no built-in signing in this plan. Checksums are the integrity signal.
- Sandbox note: Electron on some Linux distributions needs the setuid sandbox helper or user namespaces. Verify that the packaged app launches with the sandbox enabled. Never ship a `--no-sandbox` launcher.

## 4. Publication separation

- No active `publish` provider in `electron-builder.yml`. If the docs allow disabling it explicitly (for example `publish: null`; confirm the form), prefer the explicit form so nothing is inferred from the git remote.
- Every packaging command passes `--publish never`. This includes `pnpm package` and any `pnpm exec electron-builder` call. An `ask` prompt applies to the latter.
- Electron Builder can infer a GitHub publish target from repository metadata and an ambient token. Build jobs therefore get no token with write scope. Do not rely only on the config file.
- Draft GitHub Releases are created by the release job, not by Electron Builder in a build job.

## 5. Must never appear

- Certificate files, passwords, Apple IDs, team IDs or tokens. Use secret names in workflows only.
- An update provider or feed URL (open decision 10).
- `afterPack`, `afterSign`, `beforeBuild` or other hook scripts that use the network, credentials or `node -e`. Any hook file is reviewed under `package-script-policy.md` 4.1 item 3.
- Targets outside the table in section 1.
- Paths outside the repository or absolute paths from a developer machine.

## 6. Fuses and integrity (with desktop-engineer)

`tech.md` requires production Fuses. Typical intent: disable `RunAsNode`, disable `NODE_OPTIONS` and inspect arguments, enable embedded ASAR integrity validation where supported, and only load the app from ASAR. Recent Electron Builder versions may offer a config option for Fuses. Otherwise the documented route is the `@electron/fuses` package in an `afterPack` hook. Confirm which applies to the resolved versions on electronjs.org and electron.build. Do not write the option names from memory. Adding the package is a dependency change: ask for approval and record the license.
