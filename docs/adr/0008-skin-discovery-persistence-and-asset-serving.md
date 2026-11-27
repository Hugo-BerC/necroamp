# ADR 0008: Skin discovery, preference persistence and asset serving
- Status: Accepted provisionally under the user's autonomous engineering authorization, subject to human review of the PR. No human approval has been given. Amends ADR 0003 and ADR 0006 (CSP `img-src` and `font-src`, a third `media://` host). Resolves backlog finding AE-04 for the Skin Engine.
- Related: ADR 0005 (IPC), ADR 0006, ADR 0007, `tech.md` "Skin engine rules", `.agents/tasks/skin-engine/contract.md`.

## Context
The renderer is untrusted and may not read the filesystem. Skin assets (SVG, PNG, WebP, WOFF2) must reach CSS `url()` and `FontFace` without paths, without weakening the production CSP, and without a new network surface. The selected skin must survive restarts. AE-04: `media://` is registered on the default session, so no untrusted web content may share that session.

## Options
| Option | Notes |
|---|---|
| A. New host `media://skin/<token>` on the existing scheme, token-gated by a main-side registry | Reuses the audited handler, token model and CORS rules. One CSP delta. |
| B. Serve from `app://renderer/skins/...` after copying skins into the renderer build | Renderer bundle must include all skins, cannot add user skins later, bypasses runtime validation. |
| C. `data:` or `blob:` URLs made by the renderer from bytes sent over IPC | Needs `data:`/`blob:` in CSP, large IPC payloads. Rejected by ADR 0006 item 7. |
| D. New scheme `skin://` | Second privileged scheme, more surface, no gain. |

Persistence options: a generic `settings.json` (needs a settings subsystem) versus a single-purpose `skin-preference.json` mirroring `playlist.json`.

## Decision
1. **Option A.** Hosts become `track | art | skin`. Skin URL form: `media://skin/<lower-case uuid>` (same regular expression shape as the other hosts). The token is minted by main, never derived from a path or from the asset key.
2. **Discovery (main, `src/main/skins/`).** Roots are explicit and typed: `builtin` (`<appPath>/skins` in development, `process.resourcesPath/skins` when packaged) is the only enabled root. Each child directory whose name matches the skin id pattern is scanned: `lstat` (no symlinks at any level), `realpath` containment inside the root, manifest size cap, `JSON.parse`, Zod parse, `manifest.id === directory name`, semantic validation, then every declared asset (size cap, magic bytes match the declared type, raster dimensions, SVG safety per ADR 0010, total size and count). Result per skin: `ok`, `invalid` or `incompatible` (`schemaVersion` unknown) with a bounded list of error codes. No absolute path appears in any error, log field or IPC payload.
3. **Registry and tokens.** Only `ok` skins are registered. `skins:get-active` and `skins:set-active` mint (idempotently per skin and asset for the session) tokens and return `ResolvedSkin = { manifest, assetUrls }`. Token store capacity is bounded (at most 8 skins by 96 assets). Tokens are cleared on main window close with the others.
4. **Serving.** The handler re-checks at serve time (TOCTOU): `lstat`, `realpath` inside the skin root, size cap, magic bytes, and for SVG the ADR 0010 validator on the bytes actually returned. `Content-Type` comes from the declared type, never the extension. `GET` and `HEAD` only, no `Range`, `nosniff`, `no-store`, same CORS echo of the exact trusted origin. SVG responses add `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`. If `Sec-Fetch-Dest` is present it must be `image`, `font` or `empty`; `document`, `iframe`, `frame`, `embed` and `object` get 404. All failures are 404 with no rule name. Skin and art and track tokens are separate namespaces.
5. **CSP.** Production gains `media://skin` in `img-src` and `font-src` only: `img-src 'self' media://art media://skin`, `font-src 'self' media://skin`. No `data:`, `blob:`, `unsafe-inline` or `unsafe-eval`. Development inherits the same deltas. Skin values are applied through CSSOM (`style.setProperty`, `FontFace`), never through `<style>` or `style=""` attributes in markup.
6. **AE-04.** Skins are data rendered by the trusted renderer. They are never loaded as a document, frame or window, so no untrusted web content enters the default session. Navigation guards and permission handlers are unchanged. A future third-party skin root keeps this rule.
7. **Preference.** `userData/skin-preference.json`: `{ "schemaVersion": 1, "skinId": "<id>" }`, `strictObject`, written atomically (temp file plus rename, serialized writes), read at startup before the window is created. Missing, corrupt, unknown version or unknown id means Foundation, with a `fallbackReason`. A fallback never rewrites the file, so a repaired skin returns on the next start. Only `skins:set-active` writes it.
8. **IPC.** `skins:list`, `skins:get-active`, `skins:set-active` (request/response through `registerHandler`, sender validated, Zod in main) and the push event `skins:changed`. Native View menu choices are handled in main (same service as `skins:set-active`), which then pushes `skins:changed`. One authority, two entry points.

## Consequences
- Adding third-party skins later needs only a new root with stricter limits and an install flow. The serving, validation and token model stay unchanged.
- One extra handler branch and two CSP source entries widen the surface slightly. Mitigations: token gate, double validation (scan and serve), type by declaration plus magic bytes, no document loads, unit and property tests.
- Window-close clears tokens, so a reopened window must call `skins:get-active` again (it does at bootstrap).
- Packaged builds need `skins/` copied to `resources` (`extraResources`). Until then a packaged build falls back to Foundation. Recorded as a deferred packaging item.
- Not verified until E2E: whether Chromium sends `Sec-Fetch-Dest` to custom-scheme handlers. The rule is "if present", so absence is tolerated.
