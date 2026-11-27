# Security review: Audio Engine (feature/audio-engine, Blocks A, B, C)

Reviewer: security-reviewer (read-only). Authority: `tech.md` (Electron architecture and security), `product.md` principles 1 to 6.

## Method and limits

- I have no shell, so I could not run `git diff main...HEAD`. I read the current source files on the branch directly. Evidence below is file based. Conclusions are marked VERIFIED (read in code), DOCUMENTED (stated in a comment or ADR only) or ASSUMED.
- `.worktrees/` was not touched.
- Not run: tests, the app, `pnpm audit`. Not reviewed: electron-builder fuses and packaging (out of scope for this branch), the renderer's React tree beyond media and artwork use, ADR 0006 text.

## Result summary

No Critical, High or Medium findings. Four Low or Informational findings. The required boundaries hold.

## Findings

| ID | Severity | Location | Evidence | Fix | Owner |
|---|---|---|---|---|---|
| AE-01 | Low | `src/main/library/metadata.ts` (call `parseFile(filePath, { duration: true, skipCovers: false })`), `src/main/ipc/playlist-handlers.ts`, `src/main/ipc/library-handlers.ts` | Untrusted files are parsed in the privileged main process with no timeout, no file size limit and no concurrency bound. `duration: true` can force a full scan of MP3 files without a length header. `skipCovers: false` makes the parser read the whole embedded picture into memory before the 2 MiB check in `metadata.ts` runs. `playlist:load` and `library:open-files` parse up to 5000 files one after another, and the IPC reply waits for all of them. A hostile or very large file can stall the handler and spike main-process memory (availability only, no code execution path seen). | Add a per-file timeout (for example `Promise.race` with abort) and a maximum file size for duration scanning. Prefer `skipCovers: true` plus a bounded second pass, or accept the cost and document it. Return tracks in batches or cap parallel work. | desktop-engineer |
| AE-02 | Low | `src/main/ipc/playlist-handlers.ts` (load handler), `src/main/library/track-info.ts` (`fromPath`), `src/main/library/playlist-persistence.ts` | `playlist:load` re-authorizes every path in `userData/playlist.json` that has an audio extension. The check is extension plus `stat().isFile()`. There is no check that the path was ever chosen through the dialog. A local attacker who can write `playlist.json` can make the app issue tokens for any `.mp3/.wav/.flac/.ogg/.oga` file readable by the user. On Windows a UNC path (`\\host\share\x.mp3`) in that file makes `fs.stat` and the metadata parser contact an external host at startup (credential-leak vector). The attacker needs write access to the user's profile, which already gives most of that access, so impact is low. | Reject UNC and non-absolute paths on load (Windows: paths starting with `\\`). Optionally store a keyed hash or only paths that were registered earlier. Record the accepted residual risk in the threat model. | desktop-engineer |
| AE-03 | Low | `src/main/protocol/media-handler.ts` (`realpath`, `stat`, `openRange`), `src/main/index.ts` (`createReadStream(p, { start, end })`) | `size` comes from `stat`, then the stream is opened afterwards. A file that changes between those calls gives a `Content-Length` that does not match the body. The path is a main-side token path and the realpath keeps the audio-extension check, so this is robustness, not an escape. Symlink handling is correct: the registered path and the resolved target must both have an audio extension. A symlink swapped after the dialog can still point to another audio-extension file the user can read. | Open the file handle once and use `fh.stat()` and a stream from the same handle. Optionally stop following symlinks for registered paths. | desktop-engineer |
| AE-04 | Info | `src/main/protocol/media-handler.ts`, `src/main/library/media-registry.ts`, `src/main/index.ts` | `media://` is handled for the whole default session, not only the main window. Any page in that session that knows a token UUID can read the file. Tokens are random UUIDs, never derived from renderer input, and only the trusted app origin loads (navigation guards exist). Tokens live until the window closes and are not revoked when a track leaves the playlist. `Cross-Origin-Resource-Policy: cross-origin` is set, while `Access-Control-Allow-Origin` is echoed only for exact trusted origins. The Skin Engine must not load untrusted web content in this session. | Note this constraint in the Skin Engine design. Optionally revoke a token on playlist removal. | necro-architect |
| AE-05 | Info | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | New runtime dependency `music-metadata` 13.0.1, pinned exactly, lockfile has integrity. Transitive: `@borewit/text-codec`, `@tokenizer/token`, `content-type`, `debug`, `media-typer`, `strtok3`, `token-types`, `win-guid`. `onlyBuiltDependencies` allows only `esbuild@0.28.2`, so no install script from these packages runs (VERIFIED in `pnpm-workspace.yaml`). The license and advisory status of `win-guid` and the others were not checked (ASSUMED acceptable). | Orchestrator to record licenses in the PR description (`tech.md`, dependencies rule). Run `pnpm audit` and check NVD before release. | orchestrator |

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
