# ADR 0007: Skin manifest format, layout model and component variants
- Status: Accepted provisionally under the user's autonomous engineering authorization, subject to human review of the PR. No human approval has been given. Resolves open decisions 6 (skin format), 7 (skin packaging), 8 (styling approach, confirms the existing CSS Modules plus CSS custom properties) and 14 (artwork production) pending human confirmation: these stay **needs human decision** for final closure.
- Related: `tech.md` "Skin engine rules", `product.md` principles 5 and 6, ADR 0008 (discovery and assets), ADR 0009 (window chrome), ADR 0010 (SVG safety), `.kiro/specs/skin-engine/`, `.agents/tasks/skin-engine/contract.md` (exact schema).

## Context
A skin must change materials, geometry, layout, window decoration, controls, typography and visualization, never only colors, and it must be data, not code. One player implementation must serve every skin, and the Audio Engine must not know skins exist.

## Options
| Option | Correctness | Simplicity | Reversibility | Security |
|---|---|---|---|---|
| A. Declarative manifest. Trusted components implement a closed set of variants. The manifest selects variants, sets parameters, supplies tokens, assets, grid layouts and decoration. | High: schema-checkable, testable | Medium: variants must be implemented once | High: `schemaVersion` | Strong: no skin code or CSS |
| B. Skins ship CSS files | Flexible | Simple | Medium | Weak: needs a CSS sanitizer (`url()`, `@import`, `expression`, `-webkit-` fetches) |
| C. Skins ship JS or HTML templates | Most flexible | Complex | Low | Violates `product.md` principle 5 |
| D. Winamp `.wsz` import | Familiar | Sprite-sheet parser | Low | Legal risk, third-party assets (`product.md` principle 6) |

Layout model options: absolute pixel regions (Winamp style: pixel exact, poor resizing, no reflow) versus constraint-based named grid with width breakpoints (reflows, keeps text and controls from overlapping).

## Decision
1. **Option A.** Skin = directory with `skin.json` (Zod `strictObject`, `schemaVersion: 1`, unknown fields rejected) plus declared static assets (SVG, PNG, WebP, optionally WOFF2). No CSS, JS, HTML or archives. Option D stays out of scope.
2. **Layout model: constraint-based grid.** A layout variant is a CSS grid of named regions (column and row tracks of `fr`, `px`, `minmax(px, fr)` or `auto`, rectangular `areas`, gap, padding). Up to 4 variants are chosen by shell width (largest `minWidth` not exceeding the width). Mandatory regions (`transport`, `seek`, `track-info`, `volume`, `playlist`) appear in every variant. Decorative layers (`decor`) are absolutely positioned, non-interactive images anchored to the app or to a region.
3. **Component variants.** Each semantic slot (transport, seek, volume, track info, artwork, equalizer, playlist, visualization, status, window title bar) has a closed enum of variants and numeric parameters, implemented once in trusted React and CSS Modules. Control looks (buttons, sliders, knobs, switches, displays) are named styles in `controls`, referenced by slots. Shapes are enums (`circle`, `diamond`, `hexagon`, `arch`, ...) implemented by trusted CSS.
4. **Tokens.** Semantic tokens map one-to-one to the existing tier 2 `--na-*` custom properties (new ones: `glow`, `display-*`, `row-*`, `font-family-display`, durations). Colors are `#rrggbb[aa]` only. Contrast floors are enforced at validation (text 4.5:1, focus 3:1), so a skin cannot ship unreadable text or hide focus. A skin cannot remove or restyle the focus indicator beyond token color, width and offset.
5. **Assets by key.** Everything visual is referenced by an `assetKey` declared in `assets`. The manifest never contains a URL. Trusted code sets `--na-asset-<key>: url("media://skin/<token>")` from main-minted URLs only (ADR 0008).
6. **Foundation is not a file.** It is an embedded, asset-free manifest constant that passes the same schema, so it cannot fail on I/O or validation and is the permanent fallback.
7. **Packaging (open decision 7).** Directory only. Archives and third-party installation are deferred. The schema, scanner roots and trust levels already allow a future `userData/skins` root with extra limits.
8. **Artwork production (open decision 14).** Bundled skins use original, hand-authored SVG (including procedural SVG filters for textures) written in this repository under MIT, with a per-asset record in `docs/assets.md`. No image generator, scraped, or third-party material. No bundled font files in this milestone (system font stacks); the schema supports WOFF2 for later, with a license record required.
9. **Styling (open decision 8).** CSS Modules stay. Skin values reach them only through CSS custom properties and `data-*` variant attributes set through CSSOM (compatible with `style-src 'self'`).

## Consequences
- Two skins look and behave like different players with one code path. New skins need no code, only variants that already exist. A genuinely new control shape needs an engine change (a new enum member and `schemaVersion` bump if breaking).
- The variant set is a ceiling on creativity. Mitigation: decor layers, nine-slice frames, per-state faces, procedural SVG filters.
- The loader must do semantic validation (cross references, grid rectangles, fit at minimum size, contrast) on top of Zod. All of it is pure and property-testable.
- Width-only breakpoints keep resizing predictable. Height adaptation comes from `fr` and `minmax` rows.
