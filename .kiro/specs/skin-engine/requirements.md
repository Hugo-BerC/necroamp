# Skin Engine: Requirements

Canonical source for `.kiro/specs/skin-engine/requirements.md` (the orchestrator copies it verbatim; the architect cannot write `.kiro/**`). Authority: `product.md`, `tech.md`, `structure.md`, `kiroween.md`, ADR 0003, 0005, 0006, 0007, 0008, 0009, 0010. Exact names and limits: `docs/architecture/skin-engine-contract.md` (copied to `.agents/tasks/skin-engine/contract.md`). Assumes Desktop Foundation (PR #5) and Audio Engine (PR #7) are merged. "Auto" = automated test. "Human" = human check, never claimed by an agent.

## Block A: Skin Engine architecture
- R1. A skin is a directory with `skin.json` and declared assets. The manifest is parsed with `skinManifestSchema` (`schemaVersion: 1`, strict, unknown fields rejected). Auto: unit tests per section of the schema; property test that arbitrary JSON never throws.
- R2. The manifest carries `id`, `name`, `version`, `author`, `description`, `license`. Text fields reject control characters and `<`, `>`, and are rendered as text only. `id` equals the directory name and is not `foundation`. Auto.
- R3. A manifest with a numeric `schemaVersion` other than 1 is `incompatible`. Unparseable JSON or a schema failure is `invalid`. Both appear in `skins:list` with error codes and cannot be activated. Auto.
- R4. Semantic validation (`validateSkinSemantics`) rejects missing asset or style references, wrong asset kinds, non-rectangular or incomplete grid areas, missing mandatory regions, layouts that do not fit the declared minimum size, wrong slider orientation, and the contrast failures listed in the contract section 6. Auto: one test per issue code; property test for the rectangle check against a brute-force oracle.
- R5. Asset paths pass `isSafeAssetPath`: relative, under `assets/`, lower case, allowed extension. Traversal, absolute, drive, UNC, backslash, percent-encoded and device-name paths are rejected. Auto: unit and property tests.
- R6. The scanner rejects symlinks anywhere in the path, files resolving outside the skin root, files over the size limits, a total over 8 MiB, more than 96 assets, magic bytes that do not match the declared type, and rasters over the dimension limits. Auto: in-memory fs tests for each code.
- R7. SVG assets pass `validateSvg` (ADR 0010) at scan time and at serve time. Scripts, `foreignObject`, `style`, `image`, animation elements, event handlers, `style` attributes, external or `data:` references, DOCTYPE and entities are rejected. Auto: unit tests per construct; property test never throws and never accepts a forbidden name.
- R8. Tokens map to the documented `--na-*` custom properties only, and the mapping output cannot contain a `url()` other than `url("media://skin/<uuid>")` or the characters `;`, `{`, `}`, `\`. Auto: unit and property tests.
- R9. Foundation is an embedded manifest constant that passes the schema and semantic validation, needs no asset and no I/O, and equals today's tier 2 token values. Auto.
- R10. Discovery lists Foundation first, then bundled skins by name, with status and error codes. No filesystem path appears in any payload or log field. Auto: handler test inspecting payload strings.
- R11. The active skin preference persists in `userData/skin-preference.json` (strict, `schemaVersion`, atomic write). Missing, corrupt, unknown version or unknown id resolves to Foundation with a `fallbackReason`, without rewriting the file. Auto.
- R12. Switching skins changes presentation only: CSS variables, layout variant, `data-*` attributes, fonts and mounted presentational components. `AudioEngine`, `AudioProcessing` and all stores are created once and are not recreated, reconnected or disposed by a switch. Auto: unit test counting engine construction and graph disposal; ESLint import zones (contract section 10).
- R13. If applying a skin throws during render, the app re-renders with Foundation and shows a `role="alert"` message. Audio keeps playing. Auto: component test with a forced error.

## Block B: Graphical components and shell
- R14. Trusted primitives exist for button (shapes, states normal, hover, pressed, disabled, checked), horizontal and vertical slider, rotary knob, switch, display (text and seven-segment), surface (layers and nine-slice frame) and icon. They are pure and keyboard operable with the ARIA roles in the contract section 9. Auto: component tests per primitive with keyboard events.
- R15. Transport uses graphical buttons (icon plus accessible name). No textual playback buttons remain. Auto: test that each transport button has an `aria-label` and an icon and no visible text label.
- R16. The ten EQ bands and preamp work through slider or knob with the same keyboard steps; bypass is a `role="switch"`; preset selection works. Values reach `EqStore` and the existing clamps. Auto.
- R17. Seek, volume and mute work through slider or knob with the documented steps. Auto.
- R18. Track info, artwork, playlist, spectrum and waveform render in every variant the bundled skins use. The playlist is the only scrolling region; no other region shows a scrollbar at 1100 by 720 or at the skin minimum size. Auto: E2E measuring `scrollHeight <= clientHeight` per region. Human: visual review of screenshots.
- R19. Layout variants switch by shell width; text and controls do not overlap at the minimum size, at 1100 by 720 and at 1400 by 900. Auto: E2E bounding-box overlap check on slot elements. Human: screenshot review.
- R20. Frameless chrome: the title bar provides drag, minimize, maximize or restore, close, and on Windows and Linux an in-app menu bar with File (Open Files, Open Folder, Clear Playlist, Quit) and View (skins). All are keyboard reachable with visible focus. Window controls use the `window:*` channels with sender validation and no arguments. Auto: handler tests, E2E clicking each button and invoking each File item.
- R21. The native application menu remains, including its accelerators and a View menu with a `Skin` radio submenu and `Skins…`. Auto: menu template tests; E2E accelerator `CommandOrControl+O` opens the dialog hook.
- R22. Keyboard: Tab order follows the visual reading order of the active layout variant; focus indicators use the token focus color and width and are never hidden by a skin. Auto: E2E tab walk with screenshot per skin; semantic contrast rule for focus.

## Block C: Morgul Revenant
- R23. `skins/morgul-revenant` is `ok` through the real scanner, uses only original SVG assets with entries in `docs/assets.md`, and fills every slot with the variants listed in the contract section 9. Auto: `bundled-skins` test. Human: art direction review.
- R24. The palette is based on #080D0A, #18251E, #354C3D, #6A9250, #B6E88A, #DEE8D4 and passes the contrast rules. Auto.

## Block D: Analog 1984
- R25. `skins/analog-1984` is `ok`, original assets with records, knob volume and preamp, vertical EQ faders, VU needle visualization, seven-segment time, and a layout distinct from Morgul Revenant (different `areas` in every variant). Auto: `bundled-skins` test asserts the variant differences and distinct areas. Human: art direction review.
- R26. All Analog 1984 controls drive the same stores as every other skin. Auto: E2E operates volume knob, one EQ band, bypass and seek in this skin and checks store-visible effects.

## Block E: Skin management
- R27. Skins are selectable from the native View menu, the in-app menu bar and the Skin picker dialog. The picker is a modal dialog with a radio group, preview or swatches, name, version, author, description and status; invalid skins are disabled with their error codes. Auto: component tests; E2E.
- R28. A switch during playback keeps the same track, position (still advancing), volume, mute, EQ values, bypass, preset, playlist order and selection. Auto: E2E continuity test.
- R29. The selection persists across restarts. A missing or invalid stored skin starts Foundation with a visible status message. Auto: E2E with separate `userData`.
- R30. A switch is announced through `aria-live="polite"`, and no animation runs under `prefers-reduced-motion`. Auto.

## Security
- S1. `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webSecurity` unchanged. Auto: existing `window-options` tests stay green.
- S2. Skin assets are served only as `media://skin/<uuid>` for tokens minted by main for registered `ok` skins, with re-validation at serve time, `nosniff`, `no-store`, SVG sandbox CSP header and the `Sec-Fetch-Dest` rule. Forged, unknown, cross-namespace and malformed URLs return 404. Auto: handler and property tests.
- S3. Production CSP changes only `img-src` and `font-src` by adding `media://skin`. No `data:`, `blob:`, `unsafe-inline` or `unsafe-eval`. Auto: CSP snapshot test.
- S4. No skin content is loaded as a document, frame or window (AE-04). Navigation guards unchanged. Auto: existing guard tests; review item.
- S5. All new channels are constants, use `registerHandler`, strict Zod request and response, and sender validation; the preload validates push payloads. Auto: bridge key-set test, sender tests.
- S6. No network access, telemetry or remote assets. Auto: CSP `connect-src 'none'` test; scanner rejects any non-local reference.

## Out of scope
Contract section 13.
