# 0004: GitHub region never says "not signed in" (R8.9)

- Owner: desktop-engineer
- Severity: Low (spec conformance)
- Criterion: R8.9 "state that the integration is optional and not signed in"
- Found: Block B, fresh run

## Evidence

`STRINGS.github.optional` reads "GitHub features are optional. NecroAmp works fully without signing in."
The sign-in state is not stated. The optional part is satisfied and tested.

## Reproduction

`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`

The `R8.9: ... not signed in` test is `it.fails`.

## Expected

A visible status such as "Not signed in" in the GitHub region.

## Resolution
Status: FIXED (frontend-engineer). github-view.tsx shows 'Not signed in'. The R8.9 test is a plain `it` and passes.
Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
