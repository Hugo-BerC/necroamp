# Foundation styling spec (M5)

Status: design input for T5.1 to T5.4. Owner of the spec: art-director. Owner of the code: frontend-engineer (`src/renderer/**`). Authorities: `docs/architecture/renderer-architecture.md` sections 3, 6, 7, 8 (cited, not repeated), `tech.md` skin rules, `product.md` principle 5 and 6.

This is a neutral foundation theme. It is not Morgul Revenant and not Analog 1984. It carries no bundled art, no font file and no remote resource, so it adds no asset-register entry. Fonts are system stacks only (open decision 14 is not triggered).

## 1. Design intent

A compact desktop player: a dense, fixed-feeling deck where the Now Playing display dominates, transport is second, and playlist, equalizer and visualizer fill the rest. Panels read as hardware modules (inset wells, thin bevel lines), not as web cards. No gradients that imply a skin identity, no animation.

## 2. Tokens (`app/styles/tokens.css`, namespace `--na-`)

Tier 1, raw values (referenced only by tier 2):

| Raw | Value |
|---|---|
| `--na-raw-ink-0` | `#0d1012` |
| `--na-raw-ink-1` | `#121417` |
| `--na-raw-ink-2` | `#1a1d21` |
| `--na-raw-ink-3` | `#232830` |
| `--na-raw-line-1` | `#2c323b` |
| `--na-raw-line-2` | `#6b7482` |
| `--na-raw-fog-1` | `#e6e9ee` |
| `--na-raw-fog-2` | `#9aa3ae` |
| `--na-raw-fog-3` | `#7a8391` |
| `--na-raw-teal` | `#5cc8c0` |
| `--na-raw-blue` | `#7fb4ff` |
| `--na-raw-red` | `#ff8a80` |

Tier 2, semantic (the only tokens components may use):

| Semantic token | Raw | Use |
|---|---|---|
| `--na-color-app-bg` | ink-1 | window background |
| `--na-color-surface` | ink-2 | region body, well |
| `--na-color-surface-raised` | ink-3 | buttons, headings strip |
| `--na-color-surface-inset` | ink-0 | display, visualizer, EQ track |
| `--na-color-border-subtle` | line-1 | decorative dividers only |
| `--na-color-border-control` | line-2 | boundary of any interactive or meaningful control |
| `--na-color-text` | fog-1 | primary text |
| `--na-color-text-muted` | fog-2 | secondary text |
| `--na-color-text-disabled` | fog-3 | disabled text (always paired with a non-color cue) |
| `--na-color-accent` | teal | active state, EQ fill, display value |
| `--na-color-on-accent` | ink-0 | text on accent fill |
| `--na-color-focus` | blue | focus ring |
| `--na-color-danger` | red | failed state text |

Scales: `--na-space-1..6` = 2, 4, 8, 12, 16, 24 px. `--na-radius-1..2` = 2, 4 px. `--na-border-width` = 1px. `--na-focus-ring-width` = 2px, `--na-focus-ring-offset` = 2px. `--na-control-size` = 36px (transport hit area, min 32px), `--na-font-size-1..4` = 11, 12, 14, 20 px (display). Family tokens: `--na-font-family-ui` = `system-ui, "Segoe UI", Roboto, sans-serif`; `--na-font-family-mono` = `ui-monospace, "Cascadia Mono", Consolas, monospace` (time and values, tabular numerals). Minimum text size is 11px, used only for uppercase labels; body is 12px or more.

Rules: no literal color, no raw token and no pixel color in any `*.module.css`. A skin later overrides tier 2 only.

## 3. Composition

Window minimum 800x600 (design 8). `FOUNDATION_LAYOUT` areas are named in the CSS Module; the descriptor carries no pixels.

```
"player        player        player"
"playlist      visualization equalizer"
"playlist      visualization equalizer"
"skin-selector skin-selector github"
```

Columns `minmax(0,1.3fr) minmax(0,1.2fr) minmax(0,1fr)`; rows `auto 1fr 1fr auto`; gap `--na-space-3`; app padding `--na-space-3`. The `player` row is the visual top deck: Now Playing display on the left (inset well, mono time at `--na-font-size-4`), transport row to the right, then a placeholder seek line. `skin-selector` and `github` are shrunk to a compact footer row. At widths under 900px the grid collapses to two columns with `player` full width; DOM order stays equal to tab order. Every region scrolls inside its own body (`overflow: auto`, `min-width: 0`), never the page.

Shell header: a slim strip with the wordmark text "NecroAmp" (`h1`, text only, no logo asset), the tagline muted, app info and status right aligned. Reserve an empty `data-part="titlebar"` hook; no drag region now.

## 4. RegionFrame and part contract

`RegionFrame` keeps `data-part` slots `frame`, `heading`, `body`. Styling rules:

- `frame`: `surface` background, 1px `border-subtle`, 2px radius, plus a 1px top highlight line using `border-subtle` to read as a module.
- `heading`: `surface-raised` strip, uppercase 11px, letter-spacing 0.08em, `text-muted`. This is a 4.5:1 text pair (section 7).
- `body`: padding `--na-space-3`.

Part names are a Skin Engine contract and are not renamed.

## 5. Control specs

All controls are CSS-only shapes (no image, no inline SVG with style attributes). Behavior stays in hooks so a skin can later swap views.

| Control | Shape and size | Normal | Hover | Pressed | Focus | Disabled or unimplemented | Active |
|---|---|---|---|---|---|---|---|
| Transport button (previous, play, pause, stop, next) | Rounded square, 36x36 hit area, 20px glyph drawn with CSS borders or an accessible text glyph. Play is 44x36 and visually dominant. | `surface-raised`, 1px `border-control` | border and glyph shift to `text` plus `surface` lightened via an inset line | inset 1px shadow-free: swap to `surface-inset`, glyph moves 1px down | 2px `focus` ring, 2px offset, never removed | `aria-disabled`, `text-disabled`, dashed border (shape cue, not color only), remains focusable | `accent` bottom bar 3px plus `aria-pressed` |
| Now Playing display | Inset well, 2px radius, mono time 20px | `surface-inset`, `accent` time digits, `text` title, `text-muted` artist | none | none | not focusable | placeholder text states "No track loaded" | n/a |
| Seek placeholder | 6px track, 12px non-interactive thumb | `border-control` outline track | none | none | none (non-interactive, `aria-hidden` or labelled static) | always inert | n/a |
| EQ band (10) | Vertical track 6x96px, 14x8 thumb, label below, "Band n" group | `surface-inset` track, `border-control` outline, thumb `text-muted` | none | none | `focus` ring if made focusable later | inert placeholder, label `text-muted` | fill `accent` |
| Playlist row | 28px row, index, title, duration (mono, right) | `surface` | `surface-raised` | n/a | 2px inset `focus` ring | n/a | selected: `accent` left bar 3px plus bold title |
| Visualizer pane | Inset frame, 1px `border-control`, centered caption | `surface-inset` | n/a | n/a | n/a | caption "Not implemented in this phase" | n/a |
| Status text | `role="status"`, 12px | `text-muted` | n/a | n/a | n/a | failed: `danger` text plus "Error:" prefix | n/a |

State differences never rely on color alone: disabled uses dashed border, pressed uses inset plus offset, active uses a bar, failed uses a text prefix.

## 6. Skin seams that M5 must preserve

Checked against `renderer-architecture.md` section 8. Backgrounds, textures and frames: surfaces only via tier 2 tokens, so a later `--na-texture-*` or `background-image` token can be added to `frame` without edits to components. Typography: family and size tokens. Graphical controls: views only consume props. Geometry and positioning: grid area names plus `--na-control-size`, `--na-space-*`, `--na-radius-*`. Layouts: descriptors. Effects and animations: none now; any later animation must honor `prefers-reduced-motion: reduce`. Window chrome: `titlebar` hook reserved. Nothing here sets `style`, `@import`, `url()` or `data:`.

## 7. Contrast report (WCAG 2.x)

Method: relative luminance L per WCAG 2.x from sRGB hex, ratio = (L1 + 0.05) / (L2 + 0.05). Computed by hand, rounded to one decimal; qa-engineer must automate the same pairs in `app/theme/contrast.ts` tests and treat a mismatch as a bug in this table.

| Pair (foreground on background) | Ratio | Threshold | Result |
|---|---|---|---|
| `text` on `app-bg` | 15.2 | 4.5 | pass |
| `text` on `surface` | 13.9 | 4.5 | pass |
| `text` on `surface-raised` | 12.2 | 4.5 | pass |
| `text-muted` on `app-bg` | 7.2 | 4.5 | pass |
| `text-muted` on `surface` | 6.6 | 4.5 | pass |
| `text-muted` on `surface-raised` | 5.8 | 4.5 | pass |
| `text-disabled` on `surface-raised` | 3.9 | none (disabled exempt) | informational |
| `accent` on `surface` | 8.4 | 4.5 | pass |
| `accent` on `surface-inset` | about 9.5 | 4.5 | pass |
| `on-accent` on `accent` | 9.5 | 4.5 | pass |
| `danger` on `surface` | 7.4 | 4.5 | pass |
| `border-control` on `surface-raised` | 3.1 | 3 (component boundary) | pass, thin margin |
| `border-control` on `surface` | 3.6 | 3 | pass |
| `focus` on `app-bg` | 8.7 | 3 (focus indicator) | pass |
| `focus` on `surface-raised` | 7.0 | 3 | pass |

`border-subtle` is decorative and is never the only boundary of a control. If the `border-control` margin on `surface-raised` is lost to a change, raise `line-2` rather than lower the threshold. Forced-colors mode: add `@media (forced-colors: active)` rules that keep borders and focus rings using system colors (`CanvasText`, `Highlight`).

## 8. Out-of-scope requests (owners)

- All `src/renderer/**` CSS, tokens, components and tests: frontend-engineer. I cannot write there or run commands, so this spec is the hand-off.
- `app/theme/contrast.ts` and its test: frontend-engineer (code), qa-engineer (property or table tests).
- Visual check by screenshot at 800x600 and 1920x1080: qa-engineer or orchestrator, after build.
