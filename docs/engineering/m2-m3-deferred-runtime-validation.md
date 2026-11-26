# M2/M3 deferred runtime validation

Nothing below has been executed. No Electron runtime, packaged build or E2E run exists for M2/M3. These items are not claimed as passed.

| Item | Needs | Task |
|---|---|---|
| Electron 45.5.0 runtime semantics (`senderFrame` after navigation or destruction, `WebFrameMain.parent` and `url` on disposed frames, `mainFrame` identity, `will-frame-navigate`, `protocol.handle`). The docs and typings check is done (T2.0, `docs/architecture/electron-api-verification.md`). | Electron runtime | T7.x |
| Startup order of `src/main/index.ts` in a real app | Whole-application build with renderer entry | T2.6, T7.0 |
| Packaged production CSP (header plus meta tag, `'self'` match for `app://renderer`, tag present in `out/renderer/index.html`) | Whole-application build | T2.7, T7.0 |
| Sandboxed preload execution with bundled Zod (`out/preload/index.js`), `contextBridge` cloning of the frozen API | Built output run under Electron | T3.3, T7.x |
| Real wrong-sender and subframe rejection, `setDisplayMediaRequestHandler` denial (S-7) | E2E (Playwright Electron) | T3.2, T7.x |
| Real-symlink containment and NTFS realpath (two tests skipped on Windows, accepted) | POSIX host or privileged Windows | T7.x |
| Fuses, ASAR integrity, packaged realpath layout, macOS and Linux behavior | Packaging phase | M7, M8 |
| Renderer shell, `index.html`, extension allow-list for fonts, images, wasm (S-3, S-4, S-10) | M4/M5 work, reviewed CSP change | M4, M5 |

## Preserved deferred requirements

- M6 (unit, integration, property-based and accessibility testing) and M7 (Electron smoke tests and production build validation) remain as written in `.kiro/specs/desktop-foundation/tasks.md`. No M6 or M7 requirement was dropped or weakened.
- M4 and M5 were not started.

## Related open items

- F-3 filesystem race: accepted temporarily, reassessment before the first public release (docs/engineering/backlog.md).
- F-4, F-7, F-8 downstream validation: table in docs/engineering/backlog.md.
- Optional S-1 hardening (rame === sender.mainFrame) and a sub-frame or foreign-origin negative E2E for the sender check: no task exists today. Human decision.
- Status: M2 and M3 are IMPLEMENTED - INTEGRATION PENDING.

## Update after Block B (fresh evidence: pnpm test:e2e 35 passed, build exit 0, test 768 passed and 2 skipped)
- RUNTIME VERIFIED: startup order and real app launch (T2.6, T7.0); built meta CSP and CSP header, no unsafe-* (T2.7); sandboxed preload with bundled Zod and frozen `app.getInfo` bridge (T3.3); real wrong-sender and subframe rejection (negative-sender e2e); renderer shell and shell extension checks (M4, M5); S-1 hardening (`frame === sender.mainFrame`) implemented with negative E2E.
- DEFERRED: real-symlink containment (2 tests skipped on Windows without privilege); fuses, ASAR integrity, packaging (packaging phase); macOS and Linux behavior NOT VERIFIED.
- Status: M2 and M3 COMPLETE on Windows x64, with the deferrals above.
