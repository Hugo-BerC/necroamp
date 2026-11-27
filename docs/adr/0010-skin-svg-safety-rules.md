# ADR 0010: SVG safety rules for skin assets
- Status: Accepted provisionally under the user's autonomous engineering authorization, subject to human review of the PR. No human approval has been given.
- Related: `tech.md` "Skin engine rules", `product.md` principle 5, ADR 0007, ADR 0008.

## Context
SVG is the main art format for the bundled skins (vector art, procedural textures through filters). SVG can carry scripts, event handlers, `foreignObject` HTML, external references, entities and animations that fetch resources.

## Options
| Option | Notes |
|---|---|
| A. Allowlist validator in pure TypeScript (tokenizer, element and attribute allowlists), plus render-only-as-image | No dependency, testable, deterministic. |
| B. Sanitize with a library (DOMPurify and a DOM) | New dependency, needs a DOM in main or `shared`, breaks `shared` rules. |
| C. Rasterize SVG to PNG at build time | Safe but loses scalability and adds tooling. |
| D. Denylist only | Unsafe by construction. |

## Decision
Option A, with defense in depth. The validator lives in `src/shared/skins/svg-safety.ts` (pure, no DOM, never throws) and runs at scan time and again on the bytes at serve time.
1. **Render-only-as-image.** SVG is used only through CSS `url()` and `<img>`, where Chromium runs it in secure static mode (no scripts, no subresource loads, no interaction). It is never inlined into the DOM, never `dangerouslySetInnerHTML`, never navigated to.
2. **Well-formed XML only.** One root `svg` element in the SVG namespace. Reject `DOCTYPE`, `ENTITY`, CDATA, comments containing `<`, processing instructions other than a leading `<?xml ...?>`, more than one root, text outside text elements, or invalid UTF-8.
3. **Element allowlist.** `svg g defs title desc path rect circle ellipse line polyline polygon text tspan symbol use linearGradient radialGradient stop pattern clipPath mask marker filter feBlend feColorMatrix feComponentTransfer feFuncR feFuncG feFuncB feFuncA feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight fePointLight feSpotLight feDropShadow feFlood feGaussianBlur feMerge feMergeNode feMorphology feOffset feSpecularLighting feTile feTurbulence`. Everything else is rejected, notably `script`, `style`, `foreignObject`, `image`, `feImage`, `a`, `iframe`, `object`, `embed`, `animate`, `animateMotion`, `animateTransform`, `set`, `switch`, `view`, `cursor`, `font`.
4. **Attribute allowlist** of geometry and presentation attributes (`id x y cx cy r rx ry x1 y1 x2 y2 width height viewBox preserveAspectRatio d points transform fill fill-opacity fill-rule stroke stroke-* opacity stop-color stop-opacity offset gradientUnits gradientTransform spreadMethod patternUnits patternContentUnits patternTransform clip-path clip-rule mask filter filterUnits primitiveUnits flood-color flood-opacity in in2 result mode type values tableValues slope intercept amplitude exponent k1 k2 k3 k4 operator order kernelMatrix divisor bias targetX targetY edgeMode stdDeviation dx dy baseFrequency numOctaves seed stitchTiles scale xChannelSelector yChannelSelector surfaceScale diffuseConstant specularConstant specularExponent lighting-color azimuth elevation z pointsAtX pointsAtY pointsAtZ limitingConeAngle radius font-family font-size font-weight letter-spacing text-anchor dominant-baseline href xmlns xml:space`). The full list is `SVG_ALLOWED_ATTRIBUTES` in the contract. Any `on*`, `style`, `class`, `src`, `xlink:*` other than a fragment `href`, and `data-*` is rejected.
5. **References.** `href` and `url()` values must be a same-document fragment (`#id`) that exists in the file. Any `url(` elsewhere, any scheme (`http:`, `data:`, `javascript:`, `file:`), `//`, or `@import` is rejected.
6. **Limits.** At most 256 KiB, 5000 elements, nesting depth 32, 40 filter primitives per file, `feTurbulence` `numOctaves` at most 6, `stdDeviation` at most 64, and `use` chains at most depth 3 (no cycles). These cap CPU cost as well as size.
7. **Serving.** `Content-Type: image/svg+xml`, `nosniff`, a sandboxing CSP header, and the `Sec-Fetch-Dest` rule from ADR 0008.

## Consequences
- SVG authors write presentation attributes only (no CSS `<style>`). Gradients, patterns and filters cover the needed materials.
- A small hand-written tokenizer is security-critical code. It gets fast-check property tests (any input never throws; any forbidden construct is rejected; every accepted file contains only allowlisted names).
- SMIL animation is unavailable. Motion comes from trusted CSS animations on `decor` layers (enum, reduced-motion aware).
- Heavy filters can hurt paint time. The limits above and a QA check of frame time on the bundled skins mitigate it.
