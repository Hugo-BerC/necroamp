# M0 dependency validation (registry metadata)

Task T0.2. Read-only `npm.cmd view <pkg>@<exact> --json` lookups against the public npm registry (PowerShell 7.6.10, Node v24.22.3, npm.cmd 11.19.1, pnpm.cmd 10.34.9). Nothing installed, no dependency script run. Candidates: `design.md` 9.1.

Result: all 32 candidates (31 packages plus the pnpm packageManager pin) exist at the exact version with the license stated in design 9.1. None declares `preinstall`, `install` or `postinstall`. `prepare` exists on globals, jsdom and @axe-core/playwright and is not run for registry installs. One difference: D1.

Licenses: Apache-2.0 for typescript and @playwright/test; MPL-2.0 for @axe-core/playwright (approved exception E1, dev only); MIT for all others.

Engines vs host Node v24.22.3: jsdom `^24.15.0`, vitest `^24.0.0`, jest-dom `>=22`, @axe-core/playwright `>=22.12.0`, electron `>=22.12.0`. All satisfied.

## Findings
- D1. eslint 9.39.5 is deprecated ("This version is no longer supported", eslint.org/version-support). Every 9.x release carries the notice; `latest` is 10.15.0, `maintenance` is 9.39.5. Design 9.2 holds 9.x because eslint-plugin-react 7.37.5 and eslint-plugin-jsx-a11y 6.10.2 peer at most `eslint ^9`. pnpm prints a WARN only. T0.2 stops on any difference: human decision needed (accept for this phase, or ADR for ESLint 10 with other plugins).
- Only exact pins were validated; design dist-tag claims were not re-checked except eslint.

## Commands
32 per-package `npm.cmd view` calls, exit 0 each; `npm.cmd view eslint dist-tags --json` and `npm.cmd view eslint@9 version deprecated --json`, exit 0. TLS verification succeeded; no setting changed.

## Human decision
D1 resolved: eslint 9.39.5 accepted temporarily; see m0-resolution-report.md addendum.

