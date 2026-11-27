# Audio Engine dependency review: wasm-media-encoders 0.7.0

Reviewer role: desktop-engineer. Branch `feature/audio-engine`, HEAD `69e6e70`. Host: Windows, PowerShell.
Policies checked: `.kiro/steering/tech.md`, `docs/engineering/package-script-policy.md`, `pnpm-workspace.yaml` (`strictDepBuilds: true`, `onlyBuiltDependencies: [esbuild@0.28.2]`).

## Verdict

Compliant. No change to `package.json` or `pnpm-lock.yaml` was needed. The package is a dev-only fixture generator and is not shipped.

## 1. Policy conformance

| Check | Evidence | Result |
|---|---|---|
| Exact pin | `package.json` devDependencies: `"wasm-media-encoders": "0.7.0"`. Lockfile importer `specifier: 0.7.0`, `version: 0.7.0`, integrity `sha512-Sp4wUasg...` | Pass, same style as all other entries (no `^` or `~`) |
| Dev only | `pnpm why wasm-media-encoders` shows `necroamp@0.0.0 (devDependencies)`. `pnpm why wasm-media-encoders --prod` shows no path | Pass |
| No install script | Package `scripts` contains only `test` and `prepack` (publisher-side, never run on install). No `install`, `preinstall` or `postinstall`. Not listed in `onlyBuiltDependencies`; `strictDepBuilds: true` did not trip | Pass |
| Transitive deps | One runtime dependency, `@swc/helpers` 0.5.24 (Apache-2.0), also dev-only. No build script | Pass |
| Engines | Package `node >= 10`; project `>=24.15.0 <25` | Pass |
| Package scripts | No script was added for it. `scripts` in `package.json` are unchanged (`dev build typecheck lint format format:check test test:coverage test:e2e`). The fixture is generated at test time by `tests/fixtures/audio/generate-vorbis.ts`. No pnpm config change | Pass |
| Network or credentials | Pure WASM computation, no network code | Pass |

## 2. Licensing

Read from `node_modules/wasm-media-encoders`:

- `package.json`: `"license": "MIT"`. `LICENSE`: MIT, "Copyright (c) 2020-2024 arseneyr".
- `README.md` "License": "licensed under the terms of the **MIT** license". The README states the package compiles the reference LAME MP3 and Ogg Vorbis encoders to WebAssembly. It carries no separate LGPL or BSD notice.
- `pnpm licenses list --dev`: `wasm-media-encoders (dev)  MIT`, `@swc/helpers (dev)  Apache-2.0`.
- Files shipped: `dist/**` (JS wrappers) plus `wasm/mp3.wasm` (about 133 KB, LAME) and `wasm/ogg.wasm` (about 451 KB, libvorbis and libogg).

Real license picture:

| Component | License | Where |
|---|---|---|
| Package wrapper code | MIT (declared) | `dist/` |
| libvorbis, libogg | BSD-3-Clause (upstream Xiph license) | `ogg.wasm` |
| LAME | LGPL-2.0-or-later (upstream license) | `mp3.wasm` |

The package declares only MIT, so the LAME and Xiph notices are missing from the package itself. This project uses only `createOggEncoder`, so LAME code is not executed. Because the package never leaves the development and test environment, no LGPL or BSD redistribution obligation arises for NecroAmp. Fixture output (a 440 Hz sine we synthesize, encoded at test time) is not committed and is not a derivative of the encoder code.

If the package were ever shipped, it would need LGPL compliance for LAME (notice, relinkability) and attribution for Xiph, and it would conflict with a clean MIT distribution story. Do not move it to `dependencies`.

## 3. Not in production artifacts

Commands and results:

| Command | Result |
|---|---|
| `pnpm build` | exit 0. `out/` holds 22 files, 1,708,969 bytes |
| `Get-ChildItem out -Recurse -File` filtered to `.wasm` | none |
| Search of every file in `out/` for `wasm-media-encoders`, `createOggEncoder` and the WASM magic prefix `AGFzbQ` (base64 `\0asm`) | no matches |
| Search of `out/` for `lame` or `vorbis` | matches only in `out/main/` music-metadata bundles (`VorbisTagMapper`, `vorbisTagMap`, parser chunks). These are tag parsers, not encoders |
| `pnpm why wasm-media-encoders --prod` | no dependents in the production tree |
| `pnpm licenses list --prod`, filtered for `wasm`, `swc`, `GPL` | no matches |
| `electron-builder.yml` | does not exist yet, so there is no `files` glob to inspect. **Action for release-engineer:** when it is created, keep `node_modules` excluded by the default production-only collection, exclude `tests/**`, and do not add `wasm-media-encoders` |
| Search of `src/**` for `wasm-media` or `tests/fixtures` | no matches |
| Importers of `wasm-media-encoders` (excluding `node_modules`, `.worktrees`, lockfile) | only `tests/fixtures/audio/generate-vorbis.ts`. That generator is imported only by `tests/e2e/audio-decode.spec.ts` and `tests/e2e/playback.spec.ts` |

Conclusion: the encoder and its WASM are not bundled, not in `out/`, and not reachable from `src/`.

## Residual notes

- `.worktrees/` was not touched. No git state was changed by this review.
- Pre-existing uncommitted files in `tests/integration/` belong to other roles and were not edited here.
