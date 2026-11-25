# Asset licensing for skins

Source of truth: `product.md` principle 6 ("Original or licensed assets only") and `structure.md` ("Every bundled asset is listed in `docs/assets.md`"). Open decisions 14 (artwork production) and 15 (sound assets) need a human decision and are not made here.

## Allowed sources

1. Original work by a named human author, released under the project license (MIT) or a license the user chooses.
2. Third-party assets under a license that permits redistribution in an MIT project and bundling in installers, with attribution preserved. Examples to evaluate, not assume: public-domain dedications, permissive font and art licenses. Check the actual license text.
3. Generated assets, only after the user records a decision on tool, terms and provenance (open decision 14).

## Banned

- Any Winamp or other third-party skin asset, layout, screenshot, name or trademark.
- Names, slogans or iconography that imply affiliation with another product.
- Assets of unknown origin, scraped images, screenshots of other software.
- Fonts or images with licenses that forbid redistribution, embedding or modification, or that require a paid seat for distribution.
- Anything fetched from the web by an agent. Agents do not download assets.

## Register fields

Each file gets one row in `skins/<skin-id>/LICENSE-ASSETS.md` and one in `docs/assets.md`:

| Field | Content |
|---|---|
| Path | Relative to the repository root |
| Type | image, font, icon, sound |
| Author | Named creator, or the agent role plus the approving human for authored-in-session work |
| Source | Where it came from (authored in this repository, or the original upstream location) |
| License | SPDX identifier or license name, with a link to the text for third-party items |
| Attribution | Required notice text, or "none" |
| Provenance | For generated assets: tool, date, prompt summary without personal data, and the reference to the user's decision |
| Modifications | What was changed from the upstream asset |

## Procedure

1. Before creating or adding a file, decide its source category above.
2. For third-party or generated sources, stop and ask for the user's decision if none is recorded.
3. Add both register rows in the same change as the file.
4. Copy required attribution text into `LICENSE-ASSETS.md`.
5. At review, diff the file list against the register. A file without a row fails.

## Hand-authored SVG

SVG written by an agent in this repository is original work. Record the author as the authoring agent role with the approving human, source as "authored in this repository", and the license as the project license unless the user states otherwise. Confirm that wording with the user if the project has no recorded policy.

## Fonts

Choosing a font family is a licensing decision (open decision 14). Propose candidates with license names, and wait for the user's choice. Never name a commercial font as the primary face. Always declare a generic-family fallback so the skin remains usable if a font file is absent.
