---
name: electron-security
description: "Use when adding or changing Electron main-process, preload or renderer-boundary code in NecroAmp: process isolation, contextBridge APIs, IPC channels and Zod payload validation, sender checks, CSP and renderer hardening, filesystem and network boundaries, custom protocol handling, secure credential storage, navigation guards and permission requests. Also use when reviewing such code."
license: MIT
metadata:
  owner: desktop-engineer
  schema: "1"
---

# Electron security

## Scope

Procedures for implementing the mandatory "Electron architecture and security" section of `.kiro/steering/tech.md` and the security priority in `product.md`. This skill does not restate those rules. It tells the author what to do, in what order, and how to check it.

Covered: process isolation, `contextBridge` surface design, IPC channels with Zod validation and sender checks, CSP and renderer hardening, filesystem and network boundaries, custom protocol handling, credential storage through the OS credential store, navigation and permission handling.

Non-goals:
- GitHub API logic (github-integration). It calls the storage and IPC procedures defined here.
- Skin parsing and validation rules (skin-development).
- Electron Builder and Fuse configuration (cross-platform-packaging). This skill states only the runtime expectation.
- UI design and React code (typescript-standards).
- Resolving open decisions. Decision 3 (token storage on Linux without a keyring) is decided in `docs/adr/0001-linux-credential-storage-fail-closed.md`. Decision 16 (window chrome, multi-window) need a human decision and an ADR. Do not choose them here.

Evidence labels used below: VERIFIED (read in this repository), DOCUMENTED (stated in fetched official documentation), ASSUMED (neither). Electron API names that `tech.md` does not mention are ASSUMED until checked against the Electron documentation for the version resolved at scaffolding.

## Procedures

### 1. Add an IPC channel end to end
Follow `references/ipc-channel-checklist.md`. Summary:
1. Define the channel name as a constant in `src/shared/ipc/channels.ts`, form `domain:action`.
2. Define request and response Zod schemas in `src/shared/ipc/**`. Export the schema as `fooSchema` and the inferred type as `Foo`.
3. Register the handler in `src/main/ipc/<domain>*`. Validate the sender, then parse the payload with the schema, then act. Reject on any failure with a typed error that contains no paths, tokens or stack traces.
4. Add one narrow, named function to the preload API. It calls exactly one channel and returns the typed result.
5. Add tests: valid input, invalid input, wrong sender, error mapping.
6. If the change touches the filesystem, tokens, `shell.openExternal` or navigation, request a security-reviewer pass. Apply the consultation rules in `docs/engineering/shared-ownership-policy.md` section 3.

### 2. Design the preload surface
1. Expose a single object through `contextBridge` with named, typed methods per feature. Never expose `ipcRenderer`, a generic `invoke(channel, ...)` or an event emitter that forwards arbitrary channels.
2. Return plain, structured-cloneable data. Do not return functions that close over privileged objects.
3. For events from main to renderer, expose a subscribe function bound to one channel that returns an unsubscribe function. Do not forward the raw event object.
4. Keep the preload file free of business logic. It imports only from `src/shared`.

### 3. Harden windows
Apply `references/renderer-hardening-checklist.md` for every `BrowserWindow`:
1. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`. Never override them, not even in development or tests.
2. Load the renderer from the app's own origin or protocol only.
3. Deny `window.open` and every navigation away from the app origin. Send valid external links to the allow-listed opener (procedure 5).
4. Deny all permission requests by default. Allow a named permission only after a documented need (for example none is expected for local playback).
5. Set a strict CSP (no `unsafe-eval`, no remote scripts, no remote `connect-src` by default).

### 4. Mediate filesystem access
1. Only main touches the filesystem. The renderer asks through a typed channel.
2. Paths that come from the renderer are untrusted. Resolve them against an allowed root, compare the resolved path to the root, and reject on escape, including via symlinks. Prefer opaque identifiers (library item IDs) over paths in IPC payloads.
3. Files the user picks through a main-process dialog are the only way a user path enters the system. Store the grant in main, give the renderer an ID or a protocol URL.
4. A custom protocol serves media and skin assets. The handler maps a URL to a file inside a known root, checks the resolved path, sets a restrictive content type, and refuses everything else.

### 5. Open external links
1. One wrapper in main. It parses the URL with the platform URL parser, requires the `https:` scheme and checks an allow-list of hosts, then calls `shell.openExternal`.
2. Reject `file:`, `javascript:`, `data:`, custom schemes and URLs with credentials.
3. The renderer requests the open through a typed channel. It never calls `shell.openExternal` itself.

### 6. Store credentials
Follow `references/credential-storage-notes.md`.
1. Tokens are encrypted with `safeStorage` and stored in a file inside the app's user-data directory, written by main only.
2. Check that encryption is available before storing. On Linux, also treat `safeStorage.getSelectedStorageBackend()` returning `basic_text` or `unknown` as unavailable (ADR 0001). If storage is unavailable, refuse to store and tell the user the session is memory-only. Do not write plaintext. Do not add a fallback; ADR 0001 rejects it.
3. Tokens never cross IPC to the renderer, never go to logs, error messages, crash text or test snapshots.
4. Sign-out deletes the stored blob and clears in-memory copies.

### 7. Network boundary
1. The renderer has no network access by default. CSP denies it.
2. Network calls (GitHub) happen in main, only after a user-initiated action or an explicit opt-in feature (`tech.md`, `product.md`).
3. No telemetry, update checks or analytics calls (open decision 10 covers auto-update and needs a human decision).

## Recommended patterns

- One handler file per domain, each handler a small function: validate sender, parse payload, call a pure or injected service, map errors.
- Wrap handler registration in one helper that applies sender validation and schema parsing, so a handler cannot skip them. Do not hide the schema from the reader.
- Treat schemas in `src/shared` as the contract and validate again in the receiving process. Sharing a schema does not replace validation (`shared-ownership-policy.md` 3.4).
- Errors cross IPC as a small discriminated union (`code`, short message), never as raw `Error` objects.
- Pure helpers for path confinement and URL allow-listing, so they can be property tested.
- Fail closed: an unknown channel, sender, permission, URL scheme or path root is denied.

## Anti-patterns

- Exposing `ipcRenderer`, `require`, `process`, `fs` or a generic channel sender to the renderer.
- Trusting a renderer-supplied path, URL, channel name or user ID.
- Validating only in the renderer or only in the preload.
- Disabling `sandbox`, `contextIsolation` or `webSecurity` to fix a bug or a test.
- `unsafe-eval`, `unsafe-inline` for scripts, remote script origins, wildcard `connect-src`.
- `shell.openExternal` on unvalidated input.
- Plaintext token files, tokens in `localStorage`, URL query strings, logs or error text.
- Loading remote content in a window that has the preload attached.
- Broad permission handlers that return "allow" for convenience.
- Returning error messages that contain absolute paths or stack traces to the renderer.

## Security considerations

- The renderer is untrusted. A compromise there (via Markdown, a skin or a dependency) must not reach the filesystem, token or network.
- Sender validation uses the sender frame information of the IPC event (`event.senderFrame`, named in `tech.md`). Compare its origin or URL to the app's own. The exact property names beyond `senderFrame` are ASSUMED until checked in the Electron documentation.
- Zod `parse` failures are expected input. Handle them without throwing across the IPC boundary and without logging the payload (it may hold secrets).
- Skin and GitHub content is inert data. Sanitization of rendered Markdown is covered by `tech.md`. This skill requires that sanitized output never gains access to the preload API through a window that is not hardened.
- Keep the attack surface list current: every channel, protocol and permission handler appears in the PR description with its validation.

## Acceptance criteria

- Every window created by the app has the four mandatory web preferences, asserted by a test or a reviewed single factory function.
- The preload exposes only named methods. A test or review confirms no `ipcRenderer`, generic sender or Node API is reachable from the renderer.
- Every channel has a constant in `src/shared/ipc/channels.ts`, a Zod schema, a receiver-side parse, a sender check and tests for invalid input and wrong sender.
- Navigation away from the app origin and `window.open` are blocked. External links open only for allow-listed `https:` URLs.
- Permission requests are denied unless an allow-list entry exists and is documented.
- Path-escape inputs (`..`, absolute paths, symlinks, encoded separators) are rejected by the protocol handler and file channels.
- No token appears in IPC payloads, logs, renderer-visible values or test output. Without encryption support the app does not write a token to disk.
- The CSP contains no `unsafe-eval` and no remote script source.

## Validation checklist

- [ ] New channel has constant, schemas, handler validation, sender check, narrow preload binding and tests.
- [ ] Preload exposes no generic channel access and no privileged object.
- [ ] Web preferences unchanged and mandatory values present for every window.
- [ ] CSP reviewed against `references/renderer-hardening-checklist.md`.
- [ ] Navigation, `window.open` and permission handlers are deny-by-default.
- [ ] Paths from the renderer are confined and tested with hostile inputs.
- [ ] `shell.openExternal` is reachable only through the allow-listed wrapper.
- [ ] Credentials stored only through `safeStorage`; unavailable-encryption case handled without plaintext.
- [ ] Error messages and logs checked for tokens and absolute paths.
- [ ] Open decisions touched (3, 10, 16) are flagged "needs human decision", not resolved.
- [ ] Changes outside the author's write scope are listed for the owning agent.

## References

- `references/ipc-channel-checklist.md`: read when adding or reviewing an IPC channel.
- `references/renderer-hardening-checklist.md`: read when creating a window, editing CSP, protocol, navigation or permission handlers.
- `references/credential-storage-notes.md`: read when storing, reading or deleting a token, or reviewing token handling.

Changes needed outside your write scope are listed for the owning agent, not made here.
