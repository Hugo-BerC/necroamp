# Skin validation and security rules

Source of truth: `tech.md` "Skin engine rules" and `product.md` principle 5. This file turns them into checks for authors, qa-engineer and security-reviewer. Exact limits and field names come from the manifest schema owned by frontend-engineer. Where a number is not yet defined, it is ASSUMED and must be proposed in `docs/design/skin-engine-requirements.md`.

## Manifest rules

| Rule | Check |
|---|---|
| Data only | `skin.json` is JSON with no expressions, templates or code strings. |
| Explicit version | `schemaVersion` is present. |
| No unknown fields | Every field exists in the schema. The loader rejects extras, so authors must not add any. |
| Identity | Skin id is lowercase kebab-case and equals the directory name. |
| Tokens | Colors, fonts and spacing are tokens that map to CSS custom properties. |
| Paths | Every path is relative, uses forward slashes, has no `..`, no drive letter, no leading `/` or `\`, no URL scheme, no empty segment. |
| Existence | Every referenced file exists and has an allowed extension. |
| Unreferenced files | Every file in the skin directory is referenced or is `LICENSE-ASSETS.md`. |
| Layout | Regions are declared with sizes and anchors. No script hooks or event bindings. |

## Asset rules

| Type | Rule |
|---|---|
| SVG | No `<script>`, no event attributes (`on...`), no `<foreignObject>` with HTML, no `<iframe>`, `<embed>`, `<object>`, no external `href` or `xlink:href`, no `url()` outside internal fragment references (`#id`), no `@import`, no embedded fonts or data URLs of executable types. |
| CSS-like text | If a skin carries CSS, it has no `@import` and no `url()` to remote or absolute locations. Prefer tokens in the manifest instead. |
| Raster | Only formats the engine allows. Dimensions and byte size within the budget. |
| Fonts | Only formats the engine allows. License recorded. Never loaded from a remote URL. |
| Sounds | Optional. Format, duration and byte size within the budget. License recorded (open decision 15). |
| Metadata | No usernames, machine paths, emails or tool paths in comments, `<metadata>` or EXIF. |
| Symlinks | None inside a skin directory. |

## Limits (ASSUMED until the schema defines them)

Propose in the engine requirements: maximum file count, maximum bytes per file, maximum total bytes, maximum image dimensions, maximum manifest size, maximum path length and depth. Authors keep every bundled skin well inside the proposal.

## Tests qa-engineer should have

Property tests (`tech.md` "Testing"): arbitrary input to manifest validation never throws an unhandled error and never accepts a path that escapes the skin root. Example-based tests:

- Path cases: `..`, `../x`, `a/../../x`, absolute POSIX path, Windows drive path, UNC path, backslashes, URL scheme, empty string, very long path.
- Unknown field rejected at top level and nested.
- Missing `schemaVersion`, wrong version type, future version.
- SVG with script, event attribute, external href or foreignObject rejected.
- Over-limit file count and size rejected.
- Both bundled skins load offline and produce the expected tokens.

## Review procedure

1. List every file under the skin directory.
2. Open each text file and look for the forbidden constructs above.
3. Compare manifest paths to the file list in both directions.
4. Confirm license entries exist for every listed file.
5. Record findings with evidence class VERIFIED (read in the repository), DOCUMENTED (stated in fetched docs) or ASSUMED.
