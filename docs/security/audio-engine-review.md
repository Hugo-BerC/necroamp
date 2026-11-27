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
| AE-02 (status: RESOLVED, see "AE-02 fix verification" at the end; original text kept) | Low | `src/main/ipc/playlist-handlers.ts` (load handler), `src/main/library/track-info.ts` (`fromPath`), `src/main/library/playlist-persistence.ts` | `playlist:load` re-authorizes every path in `userData/playlist.json` that has an audio extension. The check is extension plus `stat().isFile()`. There is no check that the path was ever chosen through the dialog. A local attacker who can write `playlist.json` can make the app issue tokens for any `.mp3/.wav/.flac/.ogg/.oga` file readable by the user. On Windows a UNC path (`\\host\share\x.mp3`) in that file makes `fs.stat` and the metadata parser contact an external host at startup (credential-leak vector). The attacker needs write access to the user's profile, which already gives most of that access, so impact is low. | Reject UNC and non-absolute paths on load (Windows: paths starting with `\\`). Optionally store a keyed hash or only paths that were registered earlier. Record the accepted residual risk in the threat model. | desktop-engineer |
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

## Update: native menu, Open Folder and menu IPC (PR #7, third pass)

Verdict: **APPROVED**. No Critical, High or Medium findings. No change is required before merge review.

Method: I have no shell, so I could not run `git status` or `git diff`. I read the new and changed files directly (VERIFIED in code): `src/shared/ipc/menu.ts`, `library.ts`, `channels.ts`, `src/main/ipc/folder-handlers.ts`, `menu-handlers.ts`, `install-ipc.ts`, `src/main/library/folder-scan.ts`, `src/main/lifecycle/app-menu.ts`, `src/main/index.ts` (menu wiring), `src/preload/index.ts`, `create-necroamp-api.ts`, `src/main/security/csp.ts`, `window-options.ts` and the scheme registration. Tests were not run by me. `.worktrees/` was not touched. Not reviewed: the renderer menu subscription in `src/renderer` beyond a grep, the `folder-handlers` and `folder-scan` tests, and the behavior of a Windows junction at run time (see AE-10).

### Checklist

| Item | Result |
|---|---|
| `library:open-folder` sender and Zod checks | Registered through `registerHandler` with `isTrustedSender` (via `senderCheck`), a strict empty-tuple request schema and `openFolderResponseSchema` on the response. PASS |
| `menu:report-state` sender and Zod checks | Same `registerHandler` path. Request is `z.tuple([z.strictObject({ hasTracks: z.boolean() })])`. The only effect is to enable or disable one menu item. PASS |
| `menu:command` (main to renderer) | Payload is `{ command }` with an enum of three names. Preload re-validates with `menuCommandSchema` and drops invalid payloads, then hands the listener a fresh object. PASS |
| No raw `ipcRenderer` or generic sender | `ipcRenderer` stays inside `src/preload/index.ts`. `invoke` is allow-listed to `IPC_CHANNELS`. `subscribe` is allow-listed to `IPC_EVENT_CHANNELS` and drops the Electron event, so the listener cannot reach `sender`. Bridge is `Object.freeze` at every level, including `menu`. PASS |
| Folder scan: depth bound | `maxDepth` 8 and `maxEntries` 50,000 in `FOLDER_SCAN_LIMITS`. Exceeding either sets `truncated`. PASS |
| Folder scan: count bound | `maxFiles` is `MAX_TRACKS_PER_REQUEST`. The response schema also has `.max(MAX_TRACKS_PER_REQUEST)`. A full media registry sets `truncated`. `truncated` is set only when one more file exists. PASS |
| Symlink and junction escape | Entries where `isSymbolicLink()` is true are skipped, and each sub-directory's `realpath` must stay inside the real root. Node reports Windows junctions as links, so they are skipped (DOCUMENTED in the code comment, see AE-10). PASS with note |
| Extension allow-list | `audioTypeFor(extname)` from the media handler, the same list the protocol serves. Playback is re-checked on `realpath` at serve time. PASS |
| No paths to the renderer | The handler returns `TrackInfo` (token URL, file name, metadata) and two booleans. Absolute paths stay in `scan.files`. PASS |
| Error handling | Dialog and scan failures log fixed keys (`library.dialog_failed`, `library.folder_scan_failed`) and return `createIpcError('INTERNAL')`. The caught error is dropped. The preload also replaces transport errors with fixed codes. Unreadable sub-directories are skipped silently. PASS |
| Menu actions | Main only forwards a command name. `Open Files` and `Open Folder` run the existing dialog handlers, so no new privileged action exists. `Clear Playlist` is a renderer-side state change followed by `playlist:save`. View menu (reload, DevTools) exists only when `isDevRun`. PASS |
| `contextIsolation`, `sandbox`, `webSecurity`, `nodeIntegration` | `buildWebPreferences` is unchanged: true, true, true, false, plus `webviewTag: false`. PASS |
| CSP | Production directives unchanged: `default-src 'none'`, `script-src 'self'`, `connect-src 'none'`, `img-src 'self' media://art`, `media-src media://track`, `worker-src 'none'`. The `unsafe-inline` entries are in the dev-only builder. PASS |
| Scheme privileges | `app`: `standard`, `secure`, `supportFetchAPI`. `media`: adds `stream` and `corsEnabled`. No `bypassCSP`. One registration call. Unchanged since the second pass (AE-08). PASS |

### New findings

| ID | Severity | Location | Evidence | Fix | Owner | Disposition |
|---|---|---|---|---|---|---|
| AE-09 | Info | `src/main/ipc/folder-handlers.ts` (loop over `scan.files`), `src/main/library/metadata.ts` | Open Folder makes AE-01 easier to reach. One click can queue up to 5000 files for sequential `parseFile` with `duration: true` and `skipCovers: false`, with no timeout or size cap, and the reply waits for all of them. The user chooses the folder, and the impact is availability only. | Same fix as AE-01: per-file timeout, size cap for duration scans, or batching. Consider a lower folder-scan cap than 5000 if scans feel slow. | desktop-engineer | Accepted. Folded into AE-01. |
| AE-10 | Info | `src/main/library/folder-scan.ts` | The `realpath` containment check runs once per sub-directory, before `readdir` of it. A directory swapped for a junction after the check and before the read is a small race. The files found are still audio-extension regular files, and serving re-resolves with `realpath`. The "junctions are reported as links" behavior rests on Node semantics and the code comment, and I could not run it. | If a Windows test with a real junction does not exist, add one (QA). Optionally also check the `realpath` of each file against the root. | qa-engineer | Accepted. Needs a Windows junction test for full VERIFIED status. |

AE-01 to AE-08 are unchanged and keep their earlier dispositions. AE-02 now also applies to a folder whose files are all re-authorized by `playlist:load`: no change in risk.

### Required changes

None.

No source modified.

## Pre-merge verification: selectedPath persistence (PR #7, HEAD d516392)

Date: not available to me (no shell or clock). The pass is identified by branch `feature/audio-engine` at HEAD d516392. Earlier sections are unchanged.

Verdict: **APPROVED_WITH_LIMITATIONS**. No Critical, High or Medium findings. AE-02 is **STILL OPEN** (Low). A small optional fix is given below. I read the code and tests directly (VERIFIED). I have no shell, so I did not run tests, the app or `pnpm audit`. `.worktrees/` was not touched.

Files read: `src/main/library/playlist-persistence.ts`, `src/main/ipc/playlist-handlers.ts`, `src/main/library/track-info.ts`, `src/shared/ipc/selected-track.ts`, `src/shared/ipc/playlist-store.ts`, `src/preload/create-necroamp-api.ts`, `src/renderer/stores/playlist-store.ts` and `src/renderer/app/bridge/necroamp-client.ts` (by search hits), and the tests `playlist-persistence.test.ts` and `playlist-handlers.test.ts`. I did not re-read `register-handler.ts` or `sender-validation.ts` in this pass.

### Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | Renderer sees only tokens | PASS | `playlistSaveRequestSchema` carries `trackId` (`z.uuid()`) and `selectedTrackId` (`z.uuid().nullable()`), both `z.strictObject`. The load response carries `TrackInfo` (token URL, file name) and a token `selectedTrackId`. The preload rebuilds the save payload from parsed values (`create-necroamp-api.ts`, `playlistSave`). Test `rejects a path as selectedTrackId` sends `C:\\x.mp3` and gets `INVALID_PAYLOAD`, and `persistence.save` is not called. The load test asserts the JSON reply does not contain the directory part. |
| 1b | Save-side path validation | PASS | Save never accepts a path. Tokens map through `registry.resolve`. Unknown tokens are dropped. The paths written are only those the registry issued from the dialog, folder scan or load. |
| 1c | Load-side validation of `items` and `selectedPath` | PARTIAL | Checked: string, length 1 to 4096 (strict Zod), audio extension (`audioTypeFor` in `fromPath`), file count cap. **Not checked anywhere:** relative paths, UNC (`\\\\host\\share`, `//host/share`), `\\\\?\\` and `\\\\.\\` device paths, traversal segments, NUL. No `isAbsolute`, UNC or NUL test exists in `src/main` or in the tests. |
| 1d | Per-case behavior of a planted entry with an audio extension | see table below | Derived from `fromPath`: extension check, then `fs.stat`, then (if it is a file) `metadata(filePath)`, then `registry.issue`. |
| 2 | UNC rejected on `playlist:load` | **No** | AE-02 STILL OPEN. |
| 3 | Stale selection | PASS | `savedSelection` is set only inside the loop over items that `fromPath` accepted and only when `filePath === selectedPath`. A `selectedPath` that is not in `items` never gets a token. `resolveSelectedTrackId` falls back to the first item, or to none for an empty list. Handler tests cover null, a removed file and a `.txt` selection (all resolve to the first track). The renderer re-resolves with `resolveSelectedTrackId` and falls back to the first available item (`playlist-store.ts` near line 427). On save, a selection token whose path is not in the saved items is written as null (`paths.includes(selectedPath)`). An unknown token also gives null (test `selectedTrackId: UNKNOWN`). |
| 4 | Backward compatibility and corruption | PASS | `selectedPath` is optional, so a version-1 file without it loads (test `loads an older file without a selection`). The schema is `z.strictObject` with a literal `schemaVersion`. Unknown fields, an empty `selectedPath`, bad JSON or a wrong version give an empty state, and only the code (`JSON`, `SCHEMA`, read errno) is logged. Writes are temp file then rename, serialized, with temp cleanup on failure. A null selection omits the key. Note: a corrupt file silently empties the playlist, and the next save overwrites it. That is an availability choice, not a security issue. |
| 5 | Sender and Zod validation of `playlist:save` | PASS (see note) | Both handlers go through `registerHandler` with `isTrustedSender`, request schema and response schema. Handler tests include a `trusted` switch. The preload parses the request before invoke and the response after. `selectedTrackId` is validated as a UUID or null at the preload and again in main. Note: sender logic itself was verified in the earlier pass and not re-read now. |

### What a planted playlist entry does today (check 1d)

Assume the attacker can write `userData/playlist.json` and the entry ends in `.mp3`.

| Entry | Result on startup |
|---|---|
| `\\\\host\\share\\x.mp3` or `//host/share/x.mp3` (Windows) | `fs.stat` runs on it. Windows opens an SMB connection to `host`, which can send NTLM credentials. If the share answers and the entry is a regular file, `parseFile` then reads it over the network. Either way a token is issued (`allowMissing: true`), so even an unreachable host gives a listed, unavailable item. Startup also waits on the network timeout, once per entry. **Network is touched.** |
| `\\\\?\\C:\\x.mp3`, `\\\\?\\UNC\\host\\share\\x.mp3` | Same as above for the UNC form. The local form reads a local file. |
| `\\\\.\\pipe\\x.mp3` or other `\\\\.\\` device paths | `fs.stat` opens a device or pipe name. I could not run it, so side effects are ASSUMED possible, not shown. |
| Relative path (`..\\..\\x.mp3`, `x.mp3`) | Resolved against the process working directory. Authorized if it is a regular audio file. |
| Traversal segments in an absolute path | Not blocked. They are not an escape on their own, because any absolute audio path is accepted anyway. |
| NUL inside the path | Node throws on `stat`, `available` becomes false, and `allowMissing` still issues a token for an unavailable item. The media handler would not serve it. Harmless, but it is junk in the list. |
| Non-audio extension | Rejected (`audioTypeFor`), no token, no `stat`. PASS |
| Over 4096 characters | Whole file rejected by the schema (empty playlist). PASS |

The planted `selectedPath` alone never issues a token or touches the filesystem. Only `items` are processed.

### AE-02 status: STILL OPEN

Location: `src/main/ipc/playlist-handlers.ts`, load handler (loop calling `tracks.fromPath(filePath, { allowMissing: true })`) and `src/main/library/track-info.ts` `fromPath`. `playlist-persistence.ts` validates length only. The selectedPath work added no path-shape check, so nothing in this change resolves or worsens AE-02. Severity stays Low: the attacker needs write access to the user profile.

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| AE-02 | Low | `playlist-handlers.ts` load loop; `track-info.ts` `fromPath` | See table above. A planted UNC item makes `stat` (and possibly metadata parsing) contact a remote host at startup. | Minimal change below. | desktop-engineer |

### Minimal fix for desktop-engineer (optional before merge, recommended)

- File: `src/main/ipc/playlist-handlers.ts`, `playlist:load` handler. Optionally also filter inside `createPlaylistPersistence.loadState`.
- Behavior: before calling `tracks.fromPath` for a persisted path, skip the entry (no `stat`, no token) when any of these is true: it contains a NUL (`\\0`); it is not absolute for the platform (`path.isAbsolute` is false); on Windows, it starts with two path separators (`/^[\\\\/]{2}/`), which covers `\\\\host`, `//host`, `\\\\?\\` and `\\\\.\\`. Put the check in one pure helper (for example `isSafePersistedPath(path)` in `src/main/library/`), so it can have a property test.
- Do not put the check in `fromPath`: the open dialog and folder scan share it, and a user may legitimately pick a file on a network share. Consequence to document: a track from a network share chosen in the dialog is not restored after restart.
- Tests: handler test with `\\\\host\\share\\a.mp3`, `//host/share/a.mp3`, `\\\\?\\C:\\a.mp3`, `\\\\.\\pipe\\a.mp3`, a relative path and a NUL path. Assert `fs.stat` and `metadata` are never called for them and the response has no item for them.
- If the team prefers to accept the risk instead, record it in `docs/security/threat-model.md` as the earlier second-pass note already requires.

### Other items from the request that I can only record

- `pnpm audit`: **not run by me** (no shell). No result is claimed. AE-05 stays open until someone runs it and attaches the output.
- Intermittent E2E failure: recorded as an **unresolved flaky test, cause unidentified**. I have no evidence linking it to the earlier Electron frame disposal issue, and I do not claim that link.
- Human confirmation that audio is audible and the equalizer works: recorded as reported by the user. Not verified by me.
- Acceptance of the latest playlist behavior (auto-select first track, no autoplay, double-click play, restore selection): **pending manual testing**. Not accepted here.

### Merge readiness of this change

APPROVED_WITH_LIMITATIONS. The selectedPath persistence adds no new privilege: it cannot grant access to a path outside the saved item list, the renderer handles tokens only, and old files load. The remaining limitation is AE-02 (unchanged, Low). Merging into `main` still needs explicit human authorization for PR #7.

No source modified.

## AE-02 fix verification (PR #7, uncommitted fix on top of HEAD 5ff0c34)

Date: not available to me (no shell or clock). I have no shell, so I ran no git command and no tests. I read the code and tests directly (VERIFIED in code). Test results are not evidenced by me. `.worktrees/` was not touched.

Files read: `src/main/library/local-path.ts`, `local-path.test.ts`, `track-info.ts`, `playlist-persistence.ts`, `src/main/ipc/playlist-handlers.ts`, `src/main/ipc/playlist-restore-security.test.ts`, plus a search of all `fromPath`, `loadState` and `load()` callers in `src`.

Verdict: **APPROVED_WITH_LIMITATIONS**. AE-02 is **RESOLVED** for the stated MVP scope (persisted playlist restoration accepts only local absolute paths). Residual risks are listed below. No Critical, High or Medium findings.

### Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Validation before any fs, realpath, open, metadata or token | PASS | `isLocalAbsolutePath` is pure (regex and string tests only). In `fromPath`, the `localOnly` check comes right after the `typeof` test and before `extname`, `fs.stat`, `registry.issue` and `metadata`. In `playlist:load`, `selectedPath` is checked once with the same helper and is then used only in a string comparison with item paths, never for fs access or token issue. The only I/O before validation is `persistence.loadState()`, which reads `playlist.json` in userData. Items and `selectedPath` are both covered. A rejected `selectedPath` gives no token and the selection falls back to the first item. |
| 2 | Rejected classes | PASS | win32: `/` is normalized to a backslash, then the path must match a drive letter, colon, backslash prefix. This rejects UNC with backslashes or slashes, mixed separators, the `\\?\` namespace (including its UNC and drive forms), `\\.\` devices, the `//?/` and `//./` spellings, relative paths, drive-relative (`C:a.mp3`, `C:`), root-relative (a leading single backslash or slash) and URLs. After the drive prefix the characters `< > : " \| ? *` are rejected, which covers alternate data streams (`C:` path plus `:stream`) and wildcards. NUL, C0, DEL and C1 controls are rejected on all platforms. Length is 1 to 4096. posix (linux, darwin and any non-win32 value): the path must start with `/` and not `//`. `local-path.test.ts` asserts each class for both rule sets. A trailing dot or space on the file name cannot pass the audio extension check that follows. |
| 3 | Valid, missing and old files | PASS | Valid local paths behave as before. `allowMissing: true` still yields `available: false` for a valid missing file (test `keeps allowMissing behavior`, which also asserts metadata runs only for existing files). Version-1 files without `selectedPath` still load (`playlist-persistence.test.ts` and the compatibility block of the new test). The persistence schema is unchanged, so rejection happens in the handler and an old file with a UNC `selectedPath` still loads its other items. |
| 4 | Interactive flows and other restore paths | PASS | `localOnly` is passed only by `playlist:load`. `library:open-files` and `library:open-folder` call `fromPath(path)` with no options, so dialog and folder results are unrestricted (test `fromPath without localOnly still accepts a UNC path`). `library:resolve-track` calls `fromPath` only with a path that `registry.resolve(token)` returned, so that path was already issued by a dialog or by a validated restore. The persistence is constructed only in `src/main/index.ts`, and the only production reader is the `playlist:load` handler (`loadState`). `load()` is used by tests only. `playlist:save` writes registry paths only, so a dialog-chosen UNC file can still be saved and is dropped at the next start. The renderer cannot send a path (token-only schemas). |
| 5 | Tests are not vacuous | PASS with note | `playlist-restore-security.test.ts` runs the win32 and linux rules with spies on `stat`, `metadata` and `registry.issue`. For every rejected item and every rejected `selectedPath` it asserts those spies were not called and that no item or selection results. If the `localOnly` check were removed, `stat` would be called for these entries (all end in `.mp3`) and the tests would fail. The valid-path tests assert the exact `stat` call list, which shows the spies work. Note: the `realpath` and `open` spies sit on an fs object that `fromPath` never uses, so those two assertions cannot fail today (AE-13). Mixed-separator, ADS and device cases are covered in `local-path.test.ts` only, not in the handler test. |

### Residual risks and limitations

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| AE-11 | Info | `src/main/library/local-path.ts` | The check is syntactic. A mapped network drive letter on Windows (a letter bound to an SMB share) or a network mount on posix (NFS, SMB, autofs such as `/net/host`) looks local and is still restored, so `stat` and metadata parsing can touch the network for such an entry. Closing this needs a drive-type check, which is outside the MVP. The attacker model is unchanged: write access to the user profile. | Record in the threat model. Optional later: drive-type lookup. | necro-architect |
| AE-12 | Info | `local-path.ts`, `track-info.ts` | Reserved Windows device names with an audio extension (for example `CON.mp3`, `NUL.flac` in a local folder) are not rejected. They are local, `stat` does not report a regular file, and the entry becomes an unavailable item. No network access. | Optional: reject reserved names. | desktop-engineer |
| AE-13 | Info | `playlist-restore-security.test.ts` | The `realpath` and `open` assertions are unreachable (check 5). | Optional: remove them or spy on a dependency that the code uses. | qa-engineer |

Expected behavior: a track on a UNC share that the user picked earlier is dropped on the next start. Rejected entries leave `playlist.json` the next time the renderer saves. Network-hosted library support is outside the MVP. AE-01 and AE-03 to AE-10 are unchanged.

### AE-02 status

RESOLVED. The minimal fix recommended in the earlier pass was implemented as specified: the check applies only on the `playlist:load` path through the `localOnly` option, and the dialog flows are untouched. The threat-model note now concerns AE-11 only.

Not verified by me: that the touched tests pass, typecheck, lint and format results, and `pnpm audit` (AE-05 stays open).

Merging into `main` still needs explicit human authorization for PR #7.

No source modified.
