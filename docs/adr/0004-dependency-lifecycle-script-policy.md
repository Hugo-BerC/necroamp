# ADR 0004: Dependency lifecycle script policy
- Status: Accepted (human decision D9, amendments E2 and E5, exception E1)
- Related: `.kiro/specs/desktop-foundation/design.md` sections 9.3 and 14, `docs/engineering/package-script-policy.md` section 4.4, `docs/security/m0-closure-validation.md`
## Context
Dependency install scripts run arbitrary code at install time. pnpm 10 blocks them by default, and the policy must name each exception. The selected tree contains `esbuild` (a `postinstall`), `fsevents` (an `install` that compiles native code, macOS only) and `electron`, whose binary is downloaded outside any lifecycle script.
## Decision
1. **Settings** live in `pnpm-workspace.yaml`, which has no `packages:` list, so the project is not a monorepo:

```yaml
onlyBuiltDependencies:
  - esbuild@0.28.2
ignoredBuiltDependencies:
  - fsevents
strictDepBuilds: true
```

2. **`esbuild@0.28.2` is the only package allowed to run a lifecycle script.** The entry is version-qualified, so a version bump fails the install until it is reviewed.
3. **`fsevents` is denied.** macOS file watching is not verified. Revisit only by human decision.
4. **`electron@45.5.0` is not allowlisted.** It declares no lifecycle script. Its binary is fetched on demand by the official `install-electron` command (through `@electron/get`, with release checksums), run by the human. Nothing is installed globally. No mirror, proxy or `ELECTRON_*` variable is set. If a later Electron version adds an install script, the human must review it before `electron` is added to the list.
5. **`strictDepBuilds: true` (E5).** This deviates deliberately from requirement R1.6, which relied on pnpm's default of `false`. An unreviewed script now fails the install instead of being skipped with a warning. Deny-by-default is kept and tightened.
6. **Never set** `dangerouslyAllowAllBuilds`. Never approve "all". Never disable TLS validation or add proxy, certificate or registry overrides to the repository. `.npmrc` holds only `engine-strict=true`.
7. **Fallback.** If a future pnpm ignores the preferred keys, move the same allow and deny set to `allowBuilds`. The set stays identical.
8. **Exception E1 (license, not lifecycle).** `@axe-core/playwright` and `axe-core` are MPL-2.0. They are allowed only as `devDependencies`, used only from `tests/e2e`, excluded from production bundles and installers, with notices preserved. NecroAmp stays MIT. No other MPL-2.0 package is covered. Vite 7.3.8 was chosen over Vite 8 partly to avoid the MPL-2.0 `lightningcss` dependency.
## Evidence (M0 closure, read-only, no reinstall)
- `pnpm config get` returns `strict-dep-builds` true, `only-built-dependencies` `esbuild@0.28.2`, `ignored-built-dependencies` `fsevents`, and nothing for `dangerously-allow-all-builds`.
- `pnpm ignored-builds` reports none. `.modules.yaml` has empty `ignoredBuilds` and `pendingBuilds`.
- A scan of every installed `package.json` found one install-phase script: `esbuild@0.28.2`. `electron` has none.
- `pnpm audit` reports no known vulnerabilities. Installed licenses are all in the accepted set, with MPL-2.0 only on the two E1 packages.
## Consequences and limits
- Not demonstrated: the failure branch of `strictDepBuilds` (a non-zero exit on an unlisted script). Proving it needs a violating install, which is prohibited. The documented pnpm 10 behavior is relied on, and the final state is the same either way.
- Not observable: whether the esbuild `postinstall` actually executed. The operator's console output was not captured.
- **Accepted by the human on 2026-11-26 (S1 limitations).** Neither limit will be closed by reinstalling or by running an unauthorized script. esbuild functionality is validated during the real application build (T7.0, T7.5). The security policy and exact pins are unchanged.
- The lockfile does not record `requiresBuild`, so the installed-tree scan is the check to repeat after any dependency change.
- Every dependency change repeats the scan and returns to the human gate if a new script, a new license class or a new dependency appears.
## Alternatives rejected
- Allow all builds. Contradicts the policy.
- Allowlist `electron`. It has no lifecycle script, and an entry would invite one.
- `--ignore-scripts` globally. It also stops project scripts and hides esbuild's missing binary.
- `allowBuilds` first. It is the pnpm 10.26 replacement, kept only as a fallback because the older keys are the documented, tested ones for this version.
