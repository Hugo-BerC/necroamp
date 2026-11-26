# Preflight report: desktop-foundation

> **Location note.** This file is meant for `.kiro/specs/desktop-foundation/preflight.md`. The writing agent (necro-architect) is denied writes to `.kiro/**` and to everything outside `docs/adr|architecture|requirements/**` (finding W2 below), so it was staged here. Copy it, with `requirements.md`, to the Spec folder (human or IDE session). The same note applies to `requirements.md`.

Read-only review. Nothing existing was modified. Evidence labels follow `docs/engineering/package-script-policy.md`: VERIFIED (read in this repository during this run), DOCUMENTED (stated by an existing repo document, not re-exercised), ASSUMED (inferred).

Files read: the four steering files, `.kiro/agents/*.md` (full text of necro-architect, desktop-engineer, frontend-engineer, qa-engineer, security-reviewer, release-engineer, art-director; audio-engineer and github-engineer by listing only), `.kiro/workflows/feature-development.workflow.json`, `.kiro/hooks/*.json`, `.kiro/skills/electron-security/SKILL.md` and its hardening checklist, `docs/engineering/{package-script-policy,shared-ownership-policy,automation-validation,backlog}.md`, `docs/adr/0001-*`, `.gitignore`. The repository root holds only `.agents`, `.git`, `.kiro`, `docs`, `.gitignore`, `LICENSE`, `README.md` (VERIFIED). There is no `package.json`, `src/`, `tests/` or `.github/`.

## A. Workflow validation: `feature-development.workflow.json`

JSON structure is sound: every step has `type`, `id` and `prompt`; the parallel and repeat nodes have `steps`/`branches`; all nine `agent` values map to an existing `.kiro/agents/*.md` file; artifact paths fall inside each agent's write allow-list (VERIFIED). Runtime acceptance of the recipe by Kiro is ASSUMED (`automation-validation.md` check 5 says the same).

Defects and risks relevant to this feature:

| ID | Severity | Finding | Evidence | Consequence for desktop-foundation |
|---|---|---|---|---|
| W1 | High | The workflow writes requirements and architecture to `docs/requirements/{{run_label}}.md` and `docs/architecture/{{run_label}}.md`. It has no notion of a native Spec under `.kiro/specs/<name>/`. | Step `requirements-architecture` prompt and artifacts. | The workflow cannot produce or consume `requirements.md`/`design.md`/`tasks.md`. Using it as is would fork the requirements into a second location. |
| W2 | High | `necro-architect` cannot write `.kiro/**`. Its `fs_write` deny list contains `.kiro/**`, and its allow list is `docs/adr|architecture|requirements/**`. No agent can write `.kiro/**`. Confirmed at runtime: a write to `.kiro/specs/desktop-foundation/preflight.md` was blocked ("deny fs_write matching `**`", source agent-profile). | `necro-architect.md` permissions; same deny in all seven agents read; blocked write in this run. | Spec files under `.kiro/specs/` can be written only by the human or the IDE main session, not by any custom agent. The same applies to ticking tasks in `tasks.md`. |
| W3 | High | The workflow assigns exactly one domain agent per run ("If the feature spans several domains, recommend splitting"). This feature spans desktop, renderer, tests, lint config and unowned files. | Step 1 prompt; the `implement-*` branches skip unless `APPROVED DOMAIN AGENT` matches. | Phase 05 needs several sequential runs (section B). A single run cannot deliver it. |
| W4 | High | No agent can write several mandatory files (section B, "no agent"): ESLint config, Prettier config, `.npmrc`, `pnpm-workspace.yaml`, lockfile (install is `ask`), `.gitignore`, unassigned `src/shared/**`. | Agent permission lists. | The workflow would fail or silently skip these, leaving lint and reproducible-install requirements unmet. A human must write them. |
| W5 | Medium | No separate "requirements approved, now design" gate. Step 1 writes requirements and architecture together, then one approval. | Step order. | Does not match requirements-first Spec flow. Use the native Spec flow for requirements, design and tasks, and the workflow only for implementation, review and gate stages after approval. |
| W6 | Medium | `run_label` is an unconstrained string interpolated into file paths. | Inputs and artifacts. | A label containing `..` or separators could point writes elsewhere (per-agent write rules still limit impact to allowed trees). Use a fixed kebab-case label such as `desktop-foundation-1`. |
| W7 | Medium | Implementation prompts say "do not install dependencies without explicit human approval", and all agents have `pnpm install*` at `ask`. In an unattended run an `ask` may stall. | Branch prompts; agent shell rules. | Do the first install interactively, before any workflow run. |
| W8 | Medium | `qa-engineer` participates only as reviewer. It is the only agent that can write `tests/**`, `vitest.config.ts`, `playwright.config.ts` and `*.property.test.ts`; implementers are denied those. | Agent scopes. | Property tests and Playwright setup need a dedicated qa-engineer implementation run. |
| W9 | Low | `necro-architect` uses `send_message` for gates, but its `tools` list is `["read","write"]`. Availability is not stated. | `necro-architect.md`; `automation-validation.md` observation 3. | ASSUMED to work. Watch the first approval gate. |
| W10 | Low | Review independence ("Do not read the security review") is a prompt instruction only. | Prompts; agent read rules. | Advisory control only. |
| W11 | Low | `stopWhen` reads `quality-gate.output`, which does not exist on iteration one. | `build-review-gate`. | ASSUMED treated as not matching. Unverified. |
| W12 | Info | `onMaxIterations: continue` lets the run reach `final-approval` with a failed gate. The final prompt handles it. | Final step prompt. | Acceptable. |

Verdict: structurally valid, not fit to run all of Phase 05 as one run. Usable per slice (B), after Spec approval, with a fixed `run_label`, and with the W2/W4 items done by a human. It was not launched.

## B. Agent permissions and safe task assignment

All seven agents read in full deny: mcp, power, subagent; `fs_read` of secret-like paths and `.git/**`; and `fs_write` of `.kiro/**`, `.npmrc`, `.gitignore`, `LICENSE`, `.git/**`, secrets (VERIFIED). `security-reviewer`, `necro-architect` and `art-director` have no shell (VERIFIED). `desktop-engineer`, `frontend-engineer`, `qa-engineer` allow `pnpm typecheck|lint|test*`, set `pnpm install|add|remove|update|dlx*` to `ask`, and deny `git commit|push|reset|checkout|clean|rebase`, `gh`, `curl`, `npm`, `npx`, `yarn`, `rm`, `aws` (VERIFIED). Shell matching is pattern based and cannot see script bodies (DOCUMENTED, `package-script-policy.md` section 3). Compound-command matching is unverified.

Gaps in shell patterns:
- `desktop-engineer` allows `pnpm dev*`. `pnpm dev` starts a long-running Electron process and can hang a non-interactive run. Use it interactively only.
- `frontend-engineer` allows `pnpm typecheck|lint|test*` but not `pnpm build*`. `pnpm test*` also matches `pnpm test:e2e` for desktop-engineer and frontend-engineer.
- `qa-engineer` is the only agent explicitly allowed `pnpm test:e2e*` and `pnpm build*`.

### Ownership for expected Phase 05 files

| Work item | Path (target) | Writer | Notes |
|---|---|---|---|
| Package manifest, scripts, engines, packageManager | `package.json` | desktop-engineer only | Script bodies need security-reviewer review (policy 4.2). No `publish` script. |
| `.nvmrc`, `tsconfig*.json`, `electron.vite.config.ts` | root | desktop-engineer | |
| Main process, window factory, lifecycle, CSP, navigation guards | `src/main/**` (not `github/**`) | desktop-engineer | |
| Preload bridge | `src/preload/**` | desktop-engineer | |
| IPC channels and Zod schemas | `src/shared/ipc/**` | desktop-engineer | Architect reviews the contract (shared-ownership-policy 3.1). |
| Renderer shell, placeholder features, Zustand stores, components | `src/renderer/app|features|stores|components/**` | frontend-engineer | |
| `index.html`, entry `main.tsx`, top-level CSS, env typings | `src/renderer/*.html|css|ts|tsx` | frontend-engineer | Other renderer subdirectories (for example `src/renderer/styles/`) are writable by no one. |
| Co-located unit tests `*.test.ts(x)` | next to code | implementing agent | |
| Property and integration tests | `*.property.test.ts`, `*.integration.test.ts` | qa-engineer only | Implementers are denied. |
| `vitest.config.ts`, `playwright.config.ts`, `tests/**` | root, `tests/` | qa-engineer only | |
| Install and lockfile | `pnpm install`, `pnpm-lock.yaml` | human | All agents `ask`; lockfile has no writer. |
| ESLint config, Prettier or Biome config, `.editorconfig` | root | **no agent** | Human writes. Blocked on decision D2. |
| `.npmrc`, `pnpm-workspace.yaml` | root | **no agent** | Human writes after an architect ADR and security review. |
| `.gitignore` additions (`test-results/`, `playwright-report/`) | root | **no agent** | Currently ignores `node_modules`, `out`, `dist`, `coverage`, not the Playwright folders (VERIFIED). |
| Unassigned `src/shared/**` (for example shared types) | `src/shared/` | **no agent** | Architect owns design; human or main session implements (shared-ownership-policy section 2). |
| Spec files and task tick-off | `.kiro/specs/**` | **no agent** | Human or IDE main session. |
| CI workflow | `.github/workflows/**` | release-engineer | Out of scope for this phase. |

### Recommended slices (each its own run or interactive session)

1. Human: confirm Node 24 and pnpm 10; resolve D1 to D5, D9; write lint/format config, `.npmrc`/`pnpm-workspace.yaml`, `.gitignore` additions; approve installs.
2. desktop-engineer: manifest and config, `src/main`, `src/preload`, `src/shared/ipc`, co-located tests. Then security-reviewer reviews scripts and dependencies, then IPC and window code.
3. frontend-engineer: renderer shell and placeholder UI (needs the typed preload API from slice 2).
4. qa-engineer: `vitest.config.ts`, `playwright.config.ts`, property tests, Playwright smoke test, accessibility checks.
5. Architect gate review, human final approval.

Never assign implementation to security-reviewer or necro-architect (read-only by design), nor to art-director, audio-engineer, github-engineer or release-engineer (outside scope for this feature).

## C. Hooks

| File | Hook | Trigger | Action | Enabled state |
|---|---|---|---|---|
| `.kiro/hooks/post-task-quality.json` | `post-task-quality-typecheck`, `-lint`, `-test` | `PostTaskExec` | `pnpm run --if-present typecheck|lint|test` | Not determinable from the file |
| `.kiro/hooks/ipc-security-check.json` | `ipc-security-check` | `PostFileSave`, matcher `src/shared/ipc` or `src/preload` | read-only agent prompt, no edits or shell | Not determinable from the file |

Findings:
- The JSON files contain no `enabled` field (VERIFIED). The enabled state lives in the IDE, which this run cannot read. Confirm in the Kiro hooks panel that both are disabled before implementation.
- `automation-validation.md` check 13 says no dry run was executed. Both hooks are unvalidated.
- `ipc-security-check` was inert because `src/preload` and `src/shared/ipc` do not exist. Phase 05 creates them, so it would fire on the first save. Keep disabled until validated on a throwaway file.
- `post-task-quality` runs project-defined scripts via `pnpm`. A watch-mode `test` script would hang it. R11.4 requires a non-watch `test`. The script bodies fall under the script-review policy.
- Both hooks only run commands or a read-only prompt. Neither writes, installs or uses git (VERIFIED by reading).

## D. Environment note

`tech.md` records that Node.js and pnpm were not on PATH at genesis. This run has no shell and cannot check the host. Prerequisite verification is therefore requirement R1.1 and the first human step.

## E. Items for the human

1. Decide D1 to D14 (`requirements.md` section 14), at least D1, D2, D3, D4 and D5, before design.
2. Move or copy the staged Spec files to `.kiro/specs/desktop-foundation/` (W2). Only you or the IDE session can maintain `tasks.md` status.
3. Provide the unowned files (lint config, `.npmrc`, `pnpm-workspace.yaml`, `.gitignore` additions), or approve a scoped permission change per `shared-ownership-policy.md` option 2.
4. Confirm hooks are disabled.

No existing steering, agent, skill, workflow or hook file was modified.
