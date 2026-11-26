# 0003: Skin region has no "Foundation default" entry (R8.8)

- Owner: desktop-engineer (UI strings), necro-architect if the requirement was intentionally changed
- Severity: Low (spec conformance)
- Criterion: R8.8 "a labelled placeholder control showing a single non-functional 'Foundation default' entry"
- Found: Block B, fresh run

## Evidence

`src/renderer/features/skins/skins-view.tsx` shows `STRINGS.skins.none` ("No skins are available. Skin
selection is not implemented in this phase.") and a "Choose skin" button. The text "Foundation default"
appears nowhere in `src/renderer`, `design.md` or `tasks.md`. No design note records a decision to drop it.

## Reproduction

`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`

The `R8.8` test is `it.fails`. After the fix (or after the requirement is formally amended) update the test.

## Expected

Either the entry exists, or R8.8 is amended with a recorded decision.

## Resolution
Status: FIXED (frontend-engineer). skins-view.tsx renders a labelled list with one non-interactive 'Foundation default' item. The R8.8 test is a plain `it` and passes.
Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
