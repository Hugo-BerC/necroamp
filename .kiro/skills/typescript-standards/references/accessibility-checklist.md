# Accessibility checklist

NecroAmp is skinnable, so a skin can break accessibility even when the code is correct. The checks below apply to components and to the skin-to-UI contract. Contrast ratios and ARIA behavior are taken from the WCAG and WAI-ARIA specifications. Confirm exact thresholds and patterns there before writing tests (ASSUMED here: 4.5:1 for normal text, 3:1 for large text and UI components, per WCAG 2.x AA).

## Keyboard

- [ ] Every control is reachable with Tab and operable with Enter or Space as appropriate.
- [ ] Tab order follows visual order. A skin layout cannot reorder focus order in a confusing way. If layout geometry differs per skin, the DOM order stays logical.
- [ ] No keyboard trap. Dialogs return focus to the trigger on close.
- [ ] Transport shortcuts (play, pause, next, volume) are documented, do not clash with browser or OS shortcuts, and do not fire while typing in a text field.
- [ ] Sliders support arrow keys, Home and End, and larger steps where sensible.
- [ ] Playlist rows: arrow-key navigation, Enter to play, a keyboard way to reorder. Drag and drop is never the only way.

## Names, roles and values

- [ ] Native elements first. Custom controls have a role, name and state.
- [ ] Icon-only buttons have a text name (visually hidden if needed).
- [ ] Toggle buttons expose pressed state. Play and pause is a single button whose name or state changes.
- [ ] Sliders expose min, max, current value and a human text value (for example "-3 dB", "01:25").
- [ ] Equalizer bands are labeled with frequency and current gain.
- [ ] Canvas visualizations are decorative: hidden from assistive technology, with a text alternative only if they carry information.

## Announcements

- [ ] Track changes and errors are announced through a polite live region. Not announced every second.
- [ ] Offline, rate-limited and signed-out states are text, not only color or icon.
- [ ] GitHub Actions results are text plus an icon, not color alone.

## Focus and contrast with skins

- [ ] A visible focus indicator exists in every skin. Skin tokens include a required focus color and width.
- [ ] Text and essential controls meet the contrast thresholds on their actual skin backgrounds, including textured backgrounds.
- [ ] State is not conveyed by color alone (muted, active, error).
- [ ] The skin loader or a skin test fails a skin that lacks focus or readable text tokens. Skin rules live in skin-development and the manifest schema in `src/shared/skins/**`.

## Motion

- [ ] Animation and visualizations respect the reduced-motion preference: reduce or stop motion, keep information.
- [ ] No flashing content above the thresholds in the WCAG flash guidance.
- [ ] Visualizations pause when the window is hidden (also a performance rule).

## Text and zoom

- [ ] Text sizes use scalable units where the layout allows. Layout does not clip at the OS text scaling setting. Fixed-geometry skin regions have an overflow strategy (truncate with tooltip, scroll).
- [ ] Long track titles and metadata do not break layout and are available in full to assistive technology.
- [ ] Right-to-left and non-Latin text render correctly (UI is English only at first, decision 17, but metadata is not).

## Testing

- Component tests query by role and name. If a test cannot find the control by role, the control has an accessibility defect.
- An opt-in automated accessibility check spec may be added by qa-engineer (see testing-strategy). It does not replace the manual keyboard pass.
- Manual pass before release: keyboard only, then a screen reader of the platform, for play, pause, seek, volume, equalizer, playlist, skin switch.

## Report format

For each defect: control, skin, platform, expected, actual, WCAG criterion if known. Send to frontend-engineer for components and to art-director for skin assets.
