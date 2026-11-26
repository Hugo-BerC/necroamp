# 0001: `resolve-app-path.ts` cannot reach its 95% branch coverage gate

- Owner: desktop-engineer
- Severity: Medium (blocks T6.5, the coverage gate; no runtime impact)
- Criterion: R12.6, T6.5, design section 10 N5 (`src/main/protocol/resolve-app-path.ts` branches at least 95)
- Found: Block B, fresh run

## Evidence

`pnpm.cmd test:coverage` exits 1 with:

```
ERROR: Coverage for branches (93.84%) does not meet "src/main/protocol/resolve-app-path.ts" threshold (95%)
```

All other thresholds pass (global 99.08 statements, 96.91 branches, 100 functions, 99.78 lines).
Before QA added `tests/integration/app-path-defense.integration.test.ts` the file was at 89.23%
(58 of 65 branches). That file now covers three more branches (lines 58, 117, 118). Four branches remain.

## Remaining uncovered branches (lcov BRDA, `src/main/protocol/resolve-app-path.ts`)

| Line | Code | Why QA cannot reach it |
|---|---|---|
| 96 | `if (!trimmed.startsWith('/')) return reject('BAD_URL');` | `URL.pathname` of a hierarchical `app://renderer/...` URL always starts with `/`, and the empty and `/` cases are replaced by `/index.html` first. |
| 99 | `if (segments.length === 0) return reject('BAD_URL');` | `trimmed` is never `/`, so `split` yields at least one element. |
| 109 | `(segment.split('.')[0] ?? '')` | `String.prototype.split` always returns at least one element. |
| 113 | `segments.at(-1) ?? ''` | `segments` is non-empty here. |

## Reproduction

```
pnpm.cmd test:coverage
pnpm.cmd exec vitest run --coverage --coverage.reporter=lcovonly
# then read BRDA lines ending in ",0" or ",-" for src\main\protocol\resolve-app-path.ts in coverage/lcov.info
```

## Suggested fix (owner decides)

Remove the dead branches (for example iterate with `for (const [index, segment] of segments.entries())`,
take `last` from the loop, and drop the two `?? ''` fallbacks), or mark the intentional defensive
lines with a justified `/* v8 ignore next */` comment. Do not lower the threshold.

## Resolution
Status: FIXED (desktop-engineer). pnpm.cmd test:coverage exits 0; branches of resolve-app-path.ts 57/57 (100%), threshold 95% unchanged. Three dead branches removed, one defensive branch excluded with a justified `/* v8 ignore next -- @preserve */`.
Verified by qa-engineer with a fresh full run (767 passed, 2 skipped).
