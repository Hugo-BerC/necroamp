# 0002: Playlist region has no list element (R8.5)

- Owner: desktop-engineer
- Severity: Low (spec conformance, no security impact)
- Criterion: R8.5 "a heading, an empty-state message and a list element for future items"
- Found: Block B, fresh run

## Evidence

`src/renderer/features/playlist/playlist-view.tsx` renders a heading (from `RegionFrame`), an empty-state
paragraph and a button group. It contains no `ul`, `ol` or `role="list"` element.

## Reproduction

`pnpm.cmd exec vitest run tests/a11y/requirements-conformance.test.tsx`

The test `R8.5: the playlist region contains a heading, an empty-state message and a list element` is
marked `it.fails` and passes only while the defect exists. After the fix it fails: change it to a plain `it`.

## Expected

An empty `ul` (or `role="list"`) inside the playlist region, with an accessible name.

## Resolution
Status: FIXED (frontend-engineer). playlist-view.tsx renders an empty `<ul aria-label="Playlist items">`. The R8.5 test is a plain `it` and passes.
Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
