# Skin completeness checklist

Gate against palette-only skins. Answer every item with a concrete description or file reference. "Same as the other skin" fails the item. Compare the skin against the other bundled skin, not against a default look.

## 1. Background and materials

- [ ] Background is a composed scene or surface, not a flat fill or gradient. Name its layers (base, texture, ambient detail).
- [ ] The primary material is named (for example stone, brushed metal) and rendered by texture, not only by color.
- [ ] Surface treatment differs from the other skin in kind (relief, grain, wear), not only in tint.
- [ ] Light behavior is defined (glow, bleed, LED point, specular streak).

## 2. Control geometry

- [ ] Transport buttons have a different silhouette from the other skin.
- [ ] Sliders have a different track, thumb shape and travel feel (for example fader versus rune slider).
- [ ] At least one control is a different kind of widget (for example a rotary knob versus a lever) where the engine allows.
- [ ] Toggle and window buttons have a different shape and placement.
- [ ] Every control has all six states, distinguishable without color alone.
- [ ] Hit areas are at least 24 by 24 CSS pixels, or the exception is justified.

## 3. Typography

- [ ] Display, text and numeric faces are named, with generic-family fallbacks.
- [ ] Type style differs from the other skin in structure (blackletter-influenced versus silkscreen sans, for example), not only in weight or color.
- [ ] Minimum text size and line height are stated.
- [ ] Font license and provenance are recorded, and the user decision on fonts exists (open decision 14).

## 4. Layout and window geometry

- [ ] The arrangement of regions differs (for example vertical stacked versus horizontal rack).
- [ ] Window shape or frame differs, within what the chrome decision allows (open decision 16).
- [ ] Minimum size and behavior below it are stated.
- [ ] Hierarchy is stated: display, transport, seek and volume, EQ, playlist.

## 5. Visualization and display

- [ ] The visualizer frame, drawing style and colors fit the material (for example spectral wisps versus bar LEDs).
- [ ] The track display style differs (for example etched plaque versus segmented LED).

## 6. Accessibility

- [ ] Contrast report exists with ratios (text 4.5:1, large text 3:1, UI components and focus 3:1).
- [ ] Focus indicator is visible on every texture.
- [ ] Animated assets have static equivalents for reduced motion.

## 7. Diff statement

Write one paragraph per axis (background, control geometry, materials, typography, layout) explaining how this skin differs from the other bundled skin. If any axis can only be described as a color change, the skin fails.
