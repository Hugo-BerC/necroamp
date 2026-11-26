# Coverage branch-count variation (QA finding)

- Symptom: `pnpm.cmd test:coverage` reported branches 279/284 (98.23%) in some runs and 278/284 (97.88%) in others, with identical test results.
- Method: 6 runs with the lcov reporter, branch hit flags (taken > 0) compared per file and branch.
- Cause: one branch, `src/renderer/app/theme/contrast.ts` line 46 (`!raw.has(name)` in `readCustomProperties`, the repeated-name case). Only the fast-check property test in `contrast.property.test.ts` reaches it, and only when the random generator emits a duplicate custom-property name. `tests/setup/offline.ts` sets numRuns 100 and no fixed seed, so reachability differs per run. Observed 278 in runs 1, 4, 6 and 279 in runs 2, 3, 5. No other branch varied.
- Gate impact: none. The global branches threshold is 75 and contrast.ts has no per-file threshold. All per-file gates (shared/ipc, register-handler, sender-validation, trusted-origins, resolve-app-path, csp) were identical in every run.
- Fix: `tests/integration/contrast-first-declaration.integration.test.ts` covers the case deterministically. Six runs after the fix all gave 279/284. The property test seed was not pinned, since a fixed seed would hide generator variety.
