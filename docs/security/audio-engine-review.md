# Security review: Audio Engine (feature/audio-engine, Blocks A, B, C)

Reviewer: security-reviewer (read-only). Authority: `tech.md` (Electron architecture and security), `product.md` principles 1 to 6.

## Method and limits

- I have no shell, so I could not run `git diff main...HEAD`. I read the current source files on the branch directly. Evidence below is file based. Conclusions are marked VERIFIED (read in code), DOCUMENTED (stated in a comment or ADR only) or ASSUMED.
- `.worktrees/` was not touched.
- Not run: tests, the app, `pnpm audit`. Not reviewed: electron-builder fuses and packaging (out of scope for this branch), the renderer's React tree beyond media and artwork use, ADR 0006 text.

## Result summary

First pass: no Critical, High or Medium findings. Three Low (AE-01 to AE-03) and two Info (AE-04, AE-05). The required boundaries hold. Final pass (below): verdict APPROVED_WITH_LIMITATIONS, AE-01 to AE-05 unchanged and accepted, three new Info findings (AE-06 to AE-08).

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| AE-01 | Low | `src/main/library/metadata.ts` (call `parseFile(filePath, { duration: true, skipCovers: false })`), `src/main/ipc/playlist-handlers.ts`, `src/main/ipc/library-handlers.ts` | Untrusted files are parsed in the privileged main process with no timeout, no file size limit and no concurrency bound. `duration: true` can force a full scan of MP3 files without a length header. `skipCovers: false` makes the parser read the whole embedded picture into memory before the 2 MiB check in `metadata.ts` runs. `playlist:load` and `library:open-files` parse up to 5000 files one after another, and the IPC reply waits for all of them. A hostile or very large file can stall the handler and spike main-process memory (availability only, no code execution path seen). | Add a per-file timeout (for example `Promise.race` with abort) and a maximum file size for duration scanning. Prefer `skipCovers: true` plus a bounded second pass, or accept the cost and document it. Return tracks in batches or cap parallel work. | desktop-engineer |
| AE-02 | Low | `src/main/ipc/playlist-handlers.ts` (load handler), `src/main/library/track-info.ts` (`fromPath`), `src/main/library/playlist-persistence.ts` | `playlist:load` re-authorizes every path in `userData/playlist.json` that has an audio extension. The check is extension plus `stat().isFile()`. There is no check that the path was ever chosen through the dialog. A local attacker who can write `playlist.json` can make the app issue tokens for any `.mp3/.wav/.flac/.ogg/.oga` file readable by the user. On Windows a UNC path (`\\host\share\x.mp3`) in that file makes `fs.stat` and the metadata parser contact an external host at startup (credential-leak vector). The attacker needs write access to the user's profile, which already gives most of that access, so impact is low. | Reject UNC and non-absolute paths on load (Windows: paths starting with `\\`). Optionally store a keyed hash or only paths that were registered earlier. Record the accepted residual risk in the threat model. | desktop-engineer |
| AE-03 | Low | `src/main/protocol/media-handler.ts` (`realpath`, `stat`, `openRange`), `src/main/index.ts` (`createReadStream(p, { start, end })`) | `size` comes from `stat`, then the stream is opened afterwards. A file that changes between those calls gives a `Content-Length` that does not match the body. The path is a main-side token path and the realpath keeps the audio-extension check, so this is robustness, not an escape. Symlink handling is correct: the registered path and the resolved target must both have an audio extension. A symlink swapped after the dialog can still point to another audio-extension file the user can read. | Open the file handle once and use `fh.stat()` and a stream from the same handle. Optionally stop following symlinks for registered paths. | desktop-engineer |
| AE-04 | Info | `src/main/protocol/media-handler.ts`, `src/main/library/media-registry.ts`, `src/main/index.ts` | `media://` is handled for the whole default session, not only the main window. Any page in that session that knows a token UUID can read the file. Tokens are random UUIDs, never derived from renderer input, and only the trusted app origin loads (navigation guards exist). Tokens live until the window closes and are not revoked when a track leaves the playlist. `Cross-Origin-Resource-Policy: cross-origin` is set, while `Access-Control-Allow-Origin` is echoed only for exact trusted origins. The Skin Engine must not load untrusted web content in this session. | Note this constraint in the Skin Engine design. Optionally revoke a token on playlist removal. | necro-architect |
| AE-05 | Info | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | New runtime dependency `music-metadata` 13.0.1, pinned exactly, lockfile has integrity. Transitive: `@borewit/text-codec`, `@tokenizer/token`, `content-type`, `debug`, `media-typer`, `strtok3`, `token-types`, `win-guid`. `onlyBuiltDependencies` allows only `esbuild@0.28.2`, so no install script from these packages runs (VERIFIED in `pnpm-workspace.yaml`). The license and advisory status of `win-guid` and the others were not checked (ASSUMED acceptable). | Orchestrator to record licenses in the PR description (`tech.md`, dependencies rule). Run `pnpm audit` and check NVD before release. | orchestrator |

## Final review (second pass, working tree on feature/audio-engine at HEAD 69e6e70 plus uncommitted changes)

Verdict: **APPROVED_WITH_LIMITATIONS**. No Critical, High or Medium findings. Everything below was read in the current code (VERIFIED) unless marked otherwise. I cannot run code, so test results are not evidenced here.

### Status of prior findings

| ID | Severity | Status | Evidence in current code | Disposition |
|---|---|---|---|---|
| AE-01 | Low | Open, unchanged | `metadata.ts` line 62 still calls `parseFile(filePath, { duration: true, skipCovers: false })`. No timeout, file size cap or concurrency bound in `src/main`. Loops in `playlist-handlers.ts` and `library-handlers.ts` are sequential and capped at `MAX_TRACKS_PER_REQUEST`. | Accepted limitation. Files come from a user-chosen dialog or the user's own `playlist.json`. Impact is availability only (stall, memory spike). Recommended follow-up: per-file timeout and `skipCovers` handling. Owner desktop-engineer. |
| AE-02 | Low | Open, unchanged | `playlist-persistence.ts` validates only string length (1 to 4096). `track-info.ts` `fromPath` checks extension and `stat` only. No UNC or absolute-path check anywhere in `src/main`. | Accepted limitation, with a condition: the threat model must record that a planted `playlist.json` can trigger an SMB lookup on Windows. The attacker needs write access to the user profile. The open dialog also lets the user pick a UNC file legitimately, so a blanket UNC ban changes behavior. A cheap mitigation is to reject `\\` paths on load only. Owner desktop-engineer. |
| AE-03 | Low | Open, unchanged | `media-handler.ts`: `realpath`, then `stat`, then `openRange` on the path. Three separate path operations. | Accepted limitation. The race yields a wrong `Content-Length` or a read error, and the extension check on the realpath result stays in force. A swapped symlink can only reach another audio-extension file the user can already read. Fix is a single file handle. Owner desktop-engineer. |
| AE-04 | Info | Open | `media://` handler is installed on the whole default session (`index.ts`). Tokens are cleared on window close. | Accepted. Constraint carried to the Skin Engine design: no untrusted web content in the default session. Owner necro-architect. |
| AE-05 | Info | Open | Not re-checked: `pnpm audit`, NVD and licenses of transitive packages. Not changed by this pass. | Accepted until release. Owner orchestrator. |

### New findings

| ID | Severity | Location | Evidence | Fix | Owner | Disposition |
|---|---|---|---|---|---|---|
| AE-06 | Info | `src/main/library/text.ts` (`isControl`) | After the D-B1 fix the filter removes C0, DEL, C1, U+200B, U+200E/F, U+202A to U+202E, U+2066 to U+2069 and U+FEFF. It does not remove U+2028, U+2029, U+061C (Arabic letter mark), U+00AD, U+180E or the Unicode tag block U+E0000 to U+E007F. A lone surrogate also passes through. The renderer shows tags as text (no `innerHTML` found in `src/renderer`), so there is no injection. The remaining characters can only make a title look odd. | Add U+061C, U+2028, U+2029 and U+E0000 to U+E007F to `isControl` if the project wants full spoofing coverage. | desktop-engineer | Accepted limitation. Display cosmetics only. D-B1 itself is fixed: C1 and the main bidi controls are stripped, and `text.test.ts` covers every C1 code point and the bidi set. |
| AE-07 | Info | `src/main/protocol/register-schemes.ts`, header comment | The comment contains raw control characters (a bell character before "pp" and a carriage return before "eady"), which looks like an escape-sequence mistake when the file was written. It does not affect code. Control characters in source can hide content in diffs and reviews. | Replace the comment text with plain ASCII. | desktop-engineer | Open, trivial. Not a runtime issue. |
| AE-08 | Info | `media-handler.ts` `MEDIA_SCHEME_ENTRY` | Privileges: `standard`, `secure`, `supportFetchAPI`, `stream`, `corsEnabled`. No `bypassCSP`, no `allowServiceWorkers`, no `codeCache`. `corsEnabled` is needed so a media element fed into a `MediaElementAudioSourceNode` is not treated as opaque (silence). `Access-Control-Allow-Origin` is echoed only for origins in `trusted`. `supportFetchAPI` is not needed by the player but `connect-src 'none'` blocks renderer fetches anyway. | Optionally drop `supportFetchAPI` if no test needs it. | desktop-engineer | Accepted. CSP is the controlling layer. |

### Checklist from the request

| Item | Result |
|---|---|
| URL grammar | `^media://(track\|art)/<lowercase uuid>$` on the raw string, max 128 characters. Credentials, port, query, fragment, encoded separators and upper case are rejected. PASS |
| Tokens | `randomUUID`, main-issued only. Track and art namespaces are separate maps. Unknown token gives 404. PASS |
| Methods | Only GET and HEAD. Others give 404. PASS |
| Range | One range, up to 15 digits, clamped, 416 when unsatisfiable, full body on malformed or multi-range input. `end` is inclusive and `length` is computed from the clamped values. PASS |
| Symlinks and junctions | Registered path and `realpath` result must both have an audio extension and be a regular file. A symlink or junction to another audio file is followed (see AE-03). No containment root exists by design, because the user can pick files anywhere. PASS with limitation |
| TOCTOU | AE-03, open, accepted. |
| `bypassCSP` | Not granted (AE-08). PASS |
| Artwork serving | Magic bytes for PNG, JPEG and WebP only, no SVG. The tag's MIME type is ignored. At most 2 MiB each, 64 MiB and 5000 entries in total, SHA-256 dedupe. Response sets `Content-Type` from the sniffed type and `X-Content-Type-Options: nosniff`. Metadata reader also pre-filters the picture. PASS |
| Production CSP | `img-src 'self' media://art`, `media-src media://track`, `default-src 'none'`, `connect-src 'none'`, `worker-src 'none'`, `script-src 'self'`, `style-src 'self'`. No `unsafe-eval`, no `unsafe-inline`. Dev policy built by a separate function. The artwork allowance matches ADR 0006 item 7 as described in the code comments (I did not re-read the ADR text). PASS |
| IPC | `library:open-files`, `library:resolve-track`, `playlist:load`, `playlist:save` use `registerHandler` with sender check, strict Zod request and response schemas. Responses carry `TrackInfo` with `media://` URLs and a file name, never a full path. `playlist:save` maps tokens to paths in main and drops unknown tokens. `library:resolve-track` returns a flag only. PASS |
| Preload | `ipcRenderer` is imported but never exposed. The bridge receives a closed function limited to `IPC_CHANNELS` values. Exposed as one frozen `necroamp` object. PASS |
| AE-02 load re-authorization | Extension and `stat` only. Open (see table). |
| Metadata bounds | AE-01, open, accepted. Picture size check and magic-byte check happen after parsing. |
| Tag sanitization | AE-06. D-B1 fixed. |
| Renderer audio | In `src/renderer`, `AudioContext` is created only in `audio/audio-processing.ts` and `requestAnimationFrame` only in `audio/visual-loop.ts`. No `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `new Function`, `importScripts`, `addModule`, `innerHTML`, `dangerouslySetInnerHTML` or hardcoded `http(s)://` URL found by regex in non-test renderer code. `AudioWorklet` appears only in a comment. PASS (regex search, not a full read) |
| webPreferences | `window-options.ts` `buildWebPreferences`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`, `allowRunningInsecureContent: false`, workers and subframes without Node. It takes only the preload path. Unchanged. PASS |

### Required changes

None. Medium or higher findings: none.

### Not reviewed in this pass

Packaged-build fuses and ASAR integrity, runtime behavior of the dev CSP hook, `music-metadata` fuzzing, dependency advisories and the new encoder dependency named in the delivery request (`wasm-media-encoders`, test-only per the brief; I did not verify that it is absent from production bundles, which belongs to the desktop-engineer package review). Test results and coverage were not run by me.

## Verified controls (no finding)

- **Media protocol path handling.** `parseMediaUrl` matches the raw string against `^media://(track|art)/<lowercase uuid>$` (`media-protocol.ts`). Traversal, encoded separators, query, fragment, userinfo, port and upper case are rejected before URL normalization. The renderer never supplies a path. VERIFIED.
- **Authorization.** Track tokens map to main-side paths issued only by the open dialog or by `playlist:load` from main-owned persistence. Art tokens use a separate namespace (`ArtworkStore`, no paths). Unknown tokens give 404 with no distinguishing detail. Only GET and HEAD are served. VERIFIED.
- **Extension allow list.** Checked on the registered path and again on the `realpath` result. A symlink to a non-audio file is refused. Both `stat().isFile()` and a 5000-entry registry cap apply. VERIFIED.
- **Range handling.** `parseRange` accepts one range, digits limited to 15, clamps `end` to `size - 1`, returns 416 with `Content-Range: bytes */size` for unsatisfiable ranges, and full body for malformed or multi-range. `size === 0` gives an empty 200. VERIFIED.
- **Scheme privileges.** `media` has no `bypassCSP`. Both schemes register in one `registerSchemesAsPrivileged` call. VERIFIED.
- **CSP.** Production policy is a frozen constant: `default-src 'none'`, `script-src 'self'`, `connect-src 'none'`, `img-src 'self' media://art`, `media-src media://track`, `worker-src 'none'`, no `unsafe-eval`, no `unsafe-inline` in production. The artwork extension is limited to the `art` host. A track token cannot be used as an image source by policy. The dev policy is built by a separate path. VERIFIED (`csp.ts`).
- **Worklet/DSP.** No `AudioWorklet`, `blob:` or `Worker` in the renderer. The graph uses native nodes (`audio/graph.ts`), consistent with `worker-src 'none'`. VERIFIED.
- **Artwork.** Type is decided by magic bytes (PNG, JPEG, WebP only, no SVG), size is at most 2 MiB each and 64 MiB total, content is deduplicated by SHA-256, and responses carry `nosniff`. Declared tag MIME types are ignored. VERIFIED.
- **Tags.** Text goes through `cleanText` with length caps. The renderer renders it as text (no `dangerouslySetInnerHTML` or `innerHTML` in `src`). The parser's error message and paths are not logged. VERIFIED.
- **IPC.** Three new channels (`library:open-files`, `library:resolve-track`, `playlist:load`, `playlist:save` in `IPC_CHANNELS`) all go through `registerHandler`: sender check (top frame, main-frame identity, trusted origin, registered web contents), Zod request parse (`z.strictObject` tuples), handler, Zod response parse, no payload in logs. Requests carry tokens or a boolean only, never paths. VERIFIED.
- **Preload.** Exposes a frozen `{ app, library, playlist }`. `ipcRenderer` is not exposed. The invoke function is limited to channels in `IPC_CHANNELS`. Requests are validated and rebuilt from parsed values, responses are validated, and errors are replaced by fixed codes. No filesystem API. VERIFIED.
- **Window hardening.** `buildWebPreferences` keeps `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `webviewTag: false`, `allowRunningInsecureContent: false`. It takes no options, so callers cannot weaken it. VERIFIED.
- **Playlist persistence.** The file holds paths in `userData/playlist.json`. It is validated with a strict Zod schema and a size cap, and an unknown version or corrupt file gives an empty list. Writes are serialized and atomic (temp file, rename). The renderer sends tokens only, and unknown tokens are dropped. The file holds no secrets. See AE-02 for the load-side trust issue. VERIFIED.
- **Privacy rules.** No new network calls or telemetry were found in the reviewed files (`product.md` principle 4). VERIFIED for the files read.

## Unreviewed areas

- Packaged-build behavior: Electron fuses, ASAR integrity, installer settings.
- Dev-server CSP hook behavior at runtime and the E2E dialog substitution path.
- Full renderer tree and test code, other than the grep checks above.
- Runtime fuzzing of `music-metadata` with malformed files.

No source modified.
