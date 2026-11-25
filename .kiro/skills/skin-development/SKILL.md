---
name: skin-development
description: >-
  Use when designing, building, validating or reviewing a NecroAmp skin: the declarative manifest, original art direction, Morgul Revenant and Analog 1984 identities, backgrounds, textures, graphical controls, typography, layout and geometry, readability and contrast, asset licensing, and skin validation and security. Skins are complete visual experiences, not color themes.
license: MIT
metadata:
  owner: art-director
  schema: "1"
---

# Skin development

Procedures for producing NecroAmp skins as data. Rules live in steering and are cited here, not restated: `product.md` (principles 5 and 6, the two bundled skins), `tech.md` ("Skin engine rules"), `structure.md` (skin identifiers, open decisions 6, 7, 8, 14, 16).

## Scope

In scope: art bible, skin manifest content, static assets (SVG preferred), layout and geometry specs, contrast report, asset register, requirements handed to the engine owner, and the checks a skin must pass.

Non-goals:
- The manifest schema and loader code. They belong to frontend-engineer. State needs in `docs/design/skin-engine-requirements.md`.
- Choosing skin format, packaging, styling approach, artwork production method or window chrome model (open decisions 6, 7, 8, 14, 16). Needs human decision. Write the design so it survives either answer where possible.
- Winamp `.wsz` import or any third-party skin material.
- Application code or scripts.

## Procedures

1. **Read context.** Steering, the skin-format ADR if one exists in `docs/adr/`, and existing `docs/design/*.md`. If the schema is not settled, list the assumptions the manifest relies on.
2. **Write the art bible first** at `docs/design/<skin-id>.md`. State per skin: concept, mood (in words, never copied from a product), materials and textures, color roles with hex values, type system, geometry per control, window geometry, layout variants, motion rules, and how it differs from the other bundled skin. The skin id is lowercase kebab-case and equals the directory name.
3. **Run the completeness gate** in `references/skin-completeness-checklist.md` on the art bible before drawing. A skin that fails is a color theme and is rejected.
4. **Define the control inventory.** For each control (transport buttons, seek bar, volume, EQ band sliders, preamp, playlist rows and scrollbar, track display, visualizer frame, toggles, window buttons) record shape, states (normal, hover, pressed, focus, disabled, active), size, hit area and asset.
5. **Author assets** under `skins/<skin-id>/`. Prefer hand-written SVG. Use relative paths inside the skin directory only.
6. **Write `skin.json` as data only.** Include the `schemaVersion` the engine requires, identity fields, design tokens that map to CSS custom properties, asset references, layout regions and typography references. No expressions, code or URLs.
7. **Check readability and contrast** and record results in a contrast report under `docs/design/`, including focus indicators and disabled states.
8. **Register every asset** in `skins/<skin-id>/LICENSE-ASSETS.md` and `docs/assets.md`. See `references/asset-licensing.md`.
9. **Validate** with `references/skin-validation-and-security.md`. Art-director cannot run commands, so inspect by reading and list what qa-engineer must automate.
10. **Hand off.** List engine needs for frontend-engineer, test needs for qa-engineer, and any change to files outside your write scope, each with its owner.

## Recommended patterns

- **Transform, do not recolor.** Change background composition, control silhouettes, materials, type and layout together. Color is the last layer.
- **Two distinct identities** (summarized from `product.md`; details belong in each art bible):
  - *Morgul Revenant:* carved stone, wrought iron, spectral green glow, gothic architecture (arches, buttresses, tracery), blackletter-influenced display type for titles and a plain legible face for dense data, vertical and asymmetric composition, controls as iron fittings and runes, soft bleeding light.
  - *Analog 1984:* brushed metal faceplate, rotary knobs, rocker and slide switches, VU meters with needles, LED or segment displays, horizontal modular rack layout, silkscreen-style labels, light as discrete LEDs.
- **Layered backgrounds:** base material, surface texture, wear or ambient detail, then control wells. Keep texture contrast low under text.
- **Control geometry as a table** (shape, size, hit area, travel direction, states) so requirements and tests derive from it.
- **Vector first.** Small named sets of shapes and gradients, tileable textures for large areas, small files.
- **Hierarchy:** the track display dominates, then transport, then seek and volume, then EQ and playlist. Size, contrast and position express this order in both skins.
- **Type system:** at most a display face, a text face and a numeric face, each with a minimum size and a generic-family fallback. Font files are assets and need a license record and a user decision (open decision 14).
- **Layout as declared regions** with sizes and anchors, a minimum window size, and defined behavior below it. Add layout variants (for example compact and full) if the engine supports them.
- **State clarity:** hover, pressed, focus and disabled must differ without relying on color alone.
- **Reduced motion:** every animated asset has a static equivalent, stated in the art bible.

## Anti-patterns

- A second skin made by changing hex values or swapping a background image.
- The same control shapes in both skins.
- Text over busy texture without a plate or overlay.
- Meaning carried only by color.
- Imitating a named third-party skin, or a name that implies affiliation with another product.
- Text baked into raster images.
- Large raster assets with no size justification.
- SVG with `<script>`, event handler attributes, HTML in `<foreignObject>`, external references, or `@import`.
- Inventing manifest fields the schema does not define.
- Editing the loader or schema yourself.
- Choosing an AI generator, font or stock source without the user's recorded decision.

## Security considerations

Skins are untrusted data (`product.md` principle 5; `tech.md` "Skin engine rules").

- No executable content in any file: no JS, no scripted HTML, no script-bearing SVG.
- No `@import`, remote `url()`, absolute path, `..`, symlink leaving the skin root, or unknown manifest field.
- Every manifest path resolves inside the skin directory to an existing file of an allowed type.
- Respect size and count limits. If limits are not yet defined, propose a budget in the engine requirements and mark it ASSUMED.
- No secrets, personal data, usernames or machine paths in assets, metadata or SVG comments. Strip editor metadata.
- Do not embed fonts in SVG. Fonts and sounds get the same scrutiny as images.
- Do not fetch images or fonts from the web.

## Acceptance criteria

1. `skins/<id>/skin.json` exists, is data only, carries `schemaVersion`, and every referenced file exists inside the directory.
2. `docs/design/<id>.md` exists and names concrete differences from the other bundled skin in background, control geometry, materials, typography and layout.
3. The completeness checklist passes with every item answered.
4. The contrast report meets WCAG 2.x: at least 4.5:1 for normal text, 3:1 for large text, 3:1 for meaningful UI component boundaries, states and focus indicators. Pairs, ratios and the calculation method are listed.
5. Every asset appears in `skins/<id>/LICENSE-ASSETS.md` and `docs/assets.md` with author, source and license. Generated assets also record tool, date and the user's decision.
6. No Winamp or other third-party names, trademarks or assets appear anywhere.
7. Every rule in `references/skin-validation-and-security.md` passes.
8. Engine features the skin needs are in `docs/design/skin-engine-requirements.md`.
9. The skin loads fully offline.

## Validation checklist

- [ ] Skin id is kebab-case and equals the directory name
- [ ] `skin.json` has `schemaVersion` and only schema-defined fields
- [ ] All manifest paths are relative, free of `..`, and exist
- [ ] No script, event attribute, `foreignObject`, remote `url()`, `@import` or external `href` in any asset
- [ ] Completeness checklist passed
- [ ] Control table covers every control and state
- [ ] Contrast report has ratios for text, UI components and focus
- [ ] No information conveyed by color alone
- [ ] Minimum window size and layout behavior stated
- [ ] Reduced-motion equivalents stated
- [ ] License entries complete for every file, including fonts and sounds
- [ ] AI-generated assets and fonts have a recorded user decision (open decision 14)
- [ ] No Winamp or third-party names or assets
- [ ] No metadata, secrets or personal data in files
- [ ] Engine requirements and out-of-scope requests handed to their owners

## References

- `references/skin-completeness-checklist.md`: read before and after drafting an art bible, and when judging whether a skin is only a color theme.
- `references/skin-validation-and-security.md`: read when writing a manifest, exporting SVGs, or reviewing or testing skin loading.
- `references/asset-licensing.md`: read before adding any image, font, icon or sound, and when filling the asset register.
