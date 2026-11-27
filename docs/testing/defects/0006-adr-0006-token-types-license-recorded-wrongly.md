# 0006: ADR 0006 records `token-types` 6.2.0 as BSD-3-Clause, the installed package is MIT

- Owner: necro-architect (`docs/adr/0006-media-protocol-and-audio-pipeline.md`, item 6)
- Severity: low (documentation accuracy, no license conflict)
- Block: Audio Engine B, dependency record
- Found by: qa-engineer, gate B
- Status: open. Does not block the gate.

## Expected

The license record for `music-metadata` 13.0.1 and its runtime dependencies matches what is installed.

## Actual

ADR 0006 item 6 lists `token-types` 6.2.0 as BSD-3-Clause. The installed package says MIT in `package.json` (`"license": "MIT"`) and in `LICENSE.txt` ("The MIT License (MIT)", Copyright 2026 Borewit). `pnpm licenses list --prod` also reports MIT.

## Reproduction

```powershell
pnpm licenses list --prod | Select-String "token-types|music-metadata|win-guid"
```

All three report MIT.

## Verified as correct

`music-metadata` 13.0.1 MIT. `@borewit/text-codec` 0.2.3, `@tokenizer/token` 0.3.0, `content-type` 3.1.1, `debug` 4.4.3, `media-typer` 2.0.0, `strtok3` 10.8.0, `win-guid` 0.2.1 are all MIT as the ADR says. The package has no `install`, `preinstall` or `postinstall` script, so ADR 0004 needs no `onlyBuiltDependencies` entry.

## Related gap

`docs/assets.md` does not exist. `docs/requirements/audio-engine/tasks.md` D.3 plans to record dependencies and fixtures there. Until then the ADR is the only license record for `music-metadata`.
