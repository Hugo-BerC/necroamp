# Skin Engine: Tasks

Canonical source for `.kiro/specs/skin-engine/tasks.md`. Legend: `[ ]` not done, `[x]` done. Agents never tick a human gate. One quality gate per block (typecheck, lint, targeted tests). At most two remediation attempts per defect, then document and continue.

## Block 0: Contracts (orchestrator)
- [ ] 0.1 Copy the Spec sources to `.kiro/specs/skin-engine/` and the contract to `.agents/tasks/skin-engine/contract.md`.
- [ ] 0.2 Create `src/shared/skins/**` per contract sections 2 to 7, including `FOUNDATION_SKIN` and `validateSvg`. Move `contrastRatio`, renderer file re-exports. Tests: `asset-path`, `manifest`, `semantic`, `svg-safety`, `css-vars`, `foundation-skin` (R1 to R5, R7 to R9).
- [ ] 0.3 Add `src/shared/ipc/skins.ts`, `window.ts`, channel constants, `MENU_COMMANDS` entry, `NecroampApi` additions, index exports (contract section 8).
- [ ] 0.4 ESLint import zones for audio independence (contract section 10). Architect review.
- [ ] 0.5 Record the contract change notes from contract section 14 in `docs/architecture/contract-changes.md` (architect).
- [ ] 0.6 Gate 0.

## Block A: Core engine
- [ ] A.1 (desktop-engineer) `src/main/skins/` roots, scanner, asset-inspect, registry, preference, service with in-memory fs tests (R3, R6, R10, R11).
- [ ] A.2 (desktop-engineer) `media://skin` host, handler branch, CSP delta (S2, S3).
- [ ] A.3 (desktop-engineer) `skins:*` handlers, `skins:changed` push, preload bindings with push validation (S5).
- [ ] A.4 (frontend-engineer) `app/skin/` store, port, provider, apply-skin, Foundation fallback boundary, `tokens.css` defaults for new variables (R8, R9, R12, R13).
- [ ] A.5 (qa-engineer) Property tests for asset paths, manifest, semantic rectangle oracle, SVG validator, css-vars output.
- [ ] A.6 Gate A.

## Block B: Components and shell
- [ ] B.1 (desktop-engineer) Frameless profile, `window:*` handlers and push, skin size constraints, View menu with Skin radio items and `Skins…` (R20, R21).
- [ ] B.2 (frontend-engineer) Primitives: button, slider, knob, switch, display, surface, icon, with keyboard and ARIA tests (R14).
- [ ] B.3 (frontend-engineer) Split `PlayerRegion` into slots; equalizer, playlist, visualization and status slots; layout engine; compact Foundation layout; window chrome and in-app menu bar (R15 to R20, R22).
- [ ] B.4 (frontend-engineer) Visualizer presentation parameters including `needles` (no change in `renderer/audio`).
- [ ] B.5 (qa-engineer) Update E2E selectors for the region split; E2E for window buttons, File and View menu, scroll and overlap checks for Foundation.
- [ ] B.6 Gate B.

## Block C and D: Artistic skins (art-director, in parallel with B.2 onward)
- [ ] C.1 `docs/design/morgul-revenant.md` art bible, `skins/morgul-revenant/skin.json`, original SVG assets, `LICENSE-ASSETS.md`, `docs/assets.md` entries (R23, R24).
- [ ] D.1 `docs/design/analog-1984.md`, `skins/analog-1984/` likewise (R25).
- [ ] CD.2 (qa-engineer) `bundled-skins` test; screenshots of both skins at three sizes; visual defects filed to the owner (frontend for engine, art-director for art).
- [ ] CD.3 Gate C/D.

## Block E: Skin management
- [ ] E.1 (frontend-engineer) Skin picker dialog, View menu wiring, live announcements, status messages for fallback and persist failure (R27, R30).
- [ ] E.2 (qa-engineer) E2E continuity across switches, restart persistence, invalid preference fallback, Analog control wiring (R26, R28, R29).
- [ ] E.3 Gate E.

## Delivery
- [ ] F.1 (security-reviewer) Focused review: shared skins, scanner, handler, CSP diff, window IPC, preload, SVG validator. Writes `docs/security/skin-engine-review.md`.
- [ ] F.2 (necro-architect) Architecture review for steering conformance and the audio independence rules.
- [ ] F.3 Resolve mandatory findings.
- [ ] F.4 Full gates: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e`, `pnpm audit`. Report actual results.
- [ ] F.5 Docs: skin manifest reference and authoring guide (art-director, `docs/design/skin-authoring-guide.md`), backlog update, journal entry, validation report, delivery report.
- [ ] F.6 Commit and push on `feature/skin-engine`, open or update the PR, leave it open.

## Human gates (human only)
- [ ] H.1 Human review of ADR 0007 to 0010 and open decisions 6, 7, 8, 14, 16.
- [ ] H.2 Human visual acceptance of Foundation, Morgul Revenant and Analog 1984.
- [ ] H.3 Human check that a skin switch during playback is inaudible (no glitch).
- [ ] H.4 Human merge authorization naming the PR.
