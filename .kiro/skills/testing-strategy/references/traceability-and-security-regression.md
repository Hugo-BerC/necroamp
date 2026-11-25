# Traceability and security regression

## Traceability format

Keep one file per feature in `docs/testing/traceability/<feature>.md`.

```markdown
| Req ID | Criterion (one testable sentence) | Source | Level | Test file and name | Status |
|---|---|---|---|---|---|
| REQ-EQ-01 | Band gain is clamped to the documented range | spec equalizer, tasks 2 | property | <path to property test> "clamps all inputs" | covered |
| REQ-SK-04 | Manifest path with `..` is rejected | tech.md Skin engine rules | property + integration | ... | covered |
| REQ-PL-09 | Playlist saves and loads | product.md Core player | e2e | ... | gap: needs file-open seam |
```

Rules:
- ID prefix by area (EQ, SK, PL, MD, TM, GH, IPC, AUD, E2E, SEC). IDs are stable and never reused.
- Source points to a spec, steering section or handover note by name. Never invent a source.
- Status values: `covered`, `partial` (say what is missing), `gap` (reason and owner), `blocked` (tool missing, for example Node or pnpm absent), `retired`.
- Put the Req ID in the test name or a comment so a text search finds the link both ways.
- Review the file when a spec changes. A criterion removed from a spec is marked `retired`, not deleted.
- End each file with counts of covered, partial, gap and blocked. These feed the coverage and gap note.

## Security regression list

Each row is a rule from `.kiro/steering/tech.md`. Keep at least one test per row once the feature exists. A test must fail if the rule is removed. Check this by reviewing that the assertion targets the guard itself. Never edit source in this repo to prove it.

| ID | Rule (source section) | Test idea | Level |
|---|---|---|---|
| SEC-01 | Renderer settings `contextIsolation`, `nodeIntegration`, `sandbox`, `webSecurity` (Electron architecture and security) | Read the window options from the factory with Electron mocked; assert exact values. In e2e assert `require` and `process` are undefined in the page | unit, e2e |
| SEC-02 | Narrow `contextBridge` API, no `ipcRenderer` exposure | In e2e list the keys on the exposed object; assert no generic send or invoke accepting arbitrary channel names | e2e |
| SEC-03 | Channel names are shared constants, `domain:action` form | Unit test over the constants: pattern holds, no duplicates; registered handlers equal the declared set | unit |
| SEC-04 | Every IPC payload validated with Zod in the receiver | For each handler call with arbitrary and invalid payloads; assert typed rejection, no side effect, no throw out of the handler | property, integration |
| SEC-05 | Sender validation for privileged handlers | Call handler with a fake event whose sender frame is foreign; assert rejection | integration |
| SEC-06 | Strict CSP, no `unsafe-eval`, no remote scripts | Parse the CSP string from the config or HTML; assert forbidden directives absent and required ones present | unit |
| SEC-07 | Navigation and `window.open` blocked | e2e: attempt navigation and open from the page; assert URL unchanged and no new window | e2e |
| SEC-08 | External links only through allow-listed `https:` wrapper | Property test over URL strings: only well-formed `https:` allowed; `http:`, `file:`, `javascript:`, `data:`, mixed case and whitespace tricks rejected | property |
| SEC-09 | Filesystem mediated by main, no raw paths from untrusted input | Protocol handler tests with traversal, encoded traversal, absolute paths, and a symlink inside a temp root pointing outside; assert denial | property, integration |
| SEC-10 | Tokens only in OS credential store, never in logs or renderer | Fake token string; run auth flow with mocked store; scan captured logs, IPC payloads and renderer-visible values for the string; assert absent | integration |
| SEC-11 | Network denied by default in renderer | e2e: attempt `fetch` to a non-app origin from the page; assert failure and that the smoke path made no external request | e2e |
| SEC-12 | GitHub content rendered inert, Markdown sanitized | Feed script tags, event attributes, `javascript:` links, SVG with script; assert sanitized output has none | property, unit |
| SEC-13 | Skins contain no executable code, reject traversal, remote `url()`, `@import`, unknown fields | See `property-test-catalog.md` section 2 plus malicious fixtures | property, integration |
| SEC-14 | Skin size and count limits | Boundary tests at the limit and one past it | unit |
| SEC-15 | Fuses for production builds | Inspect fuse state of the build artifact with the documented Electron Fuses tooling. Owned by release-engineer's artifact verification | release check |
| SEC-16 | No telemetry or unexpected network (product principle 4) | e2e smoke with request observation; assert zero external requests | e2e |

Notes:
- Several rows depend on features not yet implemented. Mark them `blocked: feature absent` in the traceability file instead of writing placeholder tests that pass vacuously.
- If a row cannot be tested without a test seam in source, report it to the owner. Do not weaken the rule.
- Security findings from tests go to `docs/testing/defects/` with severity and are relayed to security-reviewer through the orchestrator.
