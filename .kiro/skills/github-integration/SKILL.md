---
name: github-integration
description: "Use when implementing or reviewing NecroAmp's optional GitHub features in the main process: Octokit client setup, authentication and authorization, token lifecycle and storage, repository and directory browsing, README and source viewing data, GitHub Actions run monitoring, notifications, pagination, rate limits, error handling and offline degradation."
license: MIT
metadata:
  owner: github-engineer
  schema: "1"
---

# GitHub integration

## Scope

Procedures for a read-only, opt-in, main-process GitHub layer. Rules come from `.kiro/steering/tech.md` (GitHub API, Octokit, Zod, sanitization, no renderer network), `product.md` (principles 1 to 4, GitHub scope) and `structure.md` (open decisions 2, 3, 13, 15). This skill does not restate them.

Covered: Octokit client setup, authentication flow, token lifecycle, repository and directory browsing data, README and source data delivery, Actions run monitoring, notification triggers, pagination, rate limits, error mapping, caching, offline degradation.

Non-goals:
- Choosing the auth method (open decision 2), the Linux token fallback (3), Enterprise Server support and caching policy (13), notification sounds (15). Each needs a human decision and an ADR. Until an ADR exists, assume OAuth device flow with minimal read-only scopes (the assumption already stated in the `github-engineer` agent definition) and label it ASSUMED in code comments and hand-offs.
- Token encryption and IPC mechanics. Use the procedures in electron-security.
- Rendering Markdown and highlighted code in the UI (frontend work). This layer delivers inert data.
- Any write operation against GitHub: no commits, issues, comments, workflow dispatch, re-runs.
- Audio playback of notification sounds (audio-processing).

Evidence labels: VERIFIED (read in this repository), DOCUMENTED (in fetched official docs), ASSUMED (neither). Octokit and GitHub REST specifics below are ASSUMED until confirmed in `https://docs.github.com/` and `https://octokit.github.io/` (the only web sources the github-engineer agent may fetch). Do not guess method or option names.

## Procedures

### 1. Client factory
1. One module in `src/main/github/` creates the Octokit instance from a token supplied by the token store. The factory takes the token as an argument. It does not read storage itself, so tests can inject a fake.
2. Set a descriptive user agent and the API base URL as parameters. The base URL default is github.com. Enterprise support is open decision 13.
3. Attach request hooks (via the Octokit hook or plugin mechanism, confirm in docs) for rate-limit capture, logging with redaction and error mapping.
4. Create the client only after sign-in. Destroy it on sign-out. No client exists while the user is signed out.

### 2. Authentication and authorization
Follow `references/auth-and-token-lifecycle.md`.
1. Sign-in starts only from an explicit user action in the UI. Nothing happens at app start unless a stored token exists and the user previously opted in.
2. The device-flow state machine lives in main: idle, requesting code, waiting for user, polling, signed in, failed, cancelled. The renderer receives the user code and verification URL for display and nothing else.
3. Request the minimum read-only scopes that cover repository content and Actions reading. Document each scope with the feature that needs it. Public-only use may need fewer scopes. ASSUMED, confirm in docs.
4. Store the token through the storage interface from electron-security. Never in the renderer, logs or tests.
5. Open the verification URL through the allow-listed external-link wrapper.

### 3. Repository and directory browsing
1. Define Zod schemas in `src/shared/github/` for each response the app uses: repository summary, tree entry, file content, README. Parse the Octokit result as `unknown` first. Keep only fields the UI needs.
2. Expose list operations that take an owner, repository and path as validated strings with length and character limits. Reject path traversal style input before the call, even though GitHub resolves paths itself.
3. Directory listings and trees can be large. Page them or cap them, and tell the UI when a result is truncated.
4. File content arrives encoded. Decode in main, enforce a size cap, detect binary content, and return a typed "too large" or "binary" result instead of a huge string.
5. Return content as plain strings plus metadata (path, size, language hint). Do not return HTML. Sanitization and rendering happen in the renderer under the rules in `tech.md`.

### 4. Pagination
Follow `references/rate-limits-pagination-offline.md`.
1. Every list call has a page size parameter, a maximum page count and a cancellation signal.
2. Stop on an empty page, on a page smaller than the page size, or at the cap. Never loop on "has next" without a bound.
3. Return a cursor or page number so the UI can load more on demand instead of fetching everything.

### 5. Rate limits and caching
1. Record the remaining quota and reset time from each response and expose them as state (visible limit state, per the agent definition).
2. Use conditional requests (entity tags) where the API supports them, and treat a "not modified" reply as a cache hit. ASSUMED: not-modified replies may not count against the limit for authenticated calls. Confirm in docs.
3. When the limit is hit or remaining is near zero, stop issuing calls until the reset. Return a "rate-limited" error with the reset time.
4. Cache policy (size, lifetime, persistence) is open decision 13. Implement an in-memory cache behind an interface with the lifetime as a parameter. Do not persist to disk until decided.

### 6. Actions monitoring
Follow `references/actions-monitoring.md`.
1. Poll workflow runs for repositories the user chose to watch. Polling interval is a parameter with a floor, and it backs off when runs are idle or limits are low.
2. Polling pauses when the user signs out, the app is offline, or monitoring is turned off.
3. Emit a typed event on a run state transition (queued, in progress, completed with conclusion). Do not emit for unchanged state.
4. Notification triggers are events consumed by a separate notifier. Sound assets and licensing are open decision 15.

### 7. Error handling
1. Map every failure to a small union: `unauthenticated`, `forbidden`, `not-found`, `rate-limited`, `network`, `validation` (response did not match schema), `unexpected`.
2. A 401 clears the stored token and moves state to signed out. A 403 needs a second check to distinguish rate limiting from missing permission. ASSUMED: response headers or message tell them apart. Confirm in docs.
3. Return mapped errors to the renderer through IPC. Never return the raw Octokit error, request headers or the token.
4. Validation errors on responses are logged without the payload and surfaced as `validation`.

### 8. Offline degradation
1. Detect offline through failed requests of type `network`, not through a polling probe to a third party. No extra network calls.
2. When offline, return cached data labeled stale with its fetch time, or a clear "offline" state. Do not retry in a tight loop. Use bounded exponential backoff with jitter and a ceiling.
3. All non-GitHub features keep working with no sign-in and no network (`product.md` principles 1 and 2). A test runs the app flow with the GitHub module disabled.

### 9. IPC hand-off
This agent owns `src/main/github/**`, `src/main/ipc/github*` and `src/shared/github/**`. Channel constants belong to desktop-engineer. List the channels needed, with request and response schemas, for desktop-engineer. Follow `shared-ownership-policy.md` for consultation.

## Recommended patterns

- A thin service per concern (`auth`, `repos`, `contents`, `actions`) over one client factory. Services take the client as a parameter.
- Pure functions for mapping, pagination stop logic, backoff calculation and cache key creation, so they can be property tested.
- Inject clock, random source (for jitter) and fetch implementation. Tests use fakes (see testing-strategy).
- Results as discriminated unions (`ok` or typed error) so callers handle failures explicitly.
- Cancellation signals through every async call, tied to sign-out and window close.
- Cache keys include owner, repository, path and reference, never the token.

## Anti-patterns

- Calling GitHub from the renderer or preload.
- Sending the token, device code or authorization header to the renderer or logs.
- Asking for broad scopes "for later".
- Unbounded pagination loops or fetching a whole tree on every view.
- Polling at a fixed fast rate regardless of rate-limit state.
- Retrying 4xx errors, or retrying without backoff.
- Returning raw Octokit errors or untyped objects across IPC.
- Treating any response as trusted without a Zod parse.
- Returning unsanitized HTML from GitHub, or rendering Markdown in main as HTML for injection.
- Auto sign-in prompts or network calls at startup for users who never opted in.
- Persisting caches of private repository content to disk without a decision and a user-visible control.
- Writing to a repository, even "just a status update".

## Security considerations

- The token is the highest-value asset. Handling rules are owned by the separate `electron-security` skill (cross-skill dependency): `.kiro/skills/electron-security/references/credential-storage-notes.md`, relative path `../electron-security/references/credential-storage-notes.md`. This layer passes it only to the client factory.
- Repository content, README text and file names are attacker-controlled. They are inert data: strings validated for length and type, never HTML, never executed, never used to build file paths on disk.
- Owner, repository and path parameters are validated before use. Do not interpolate them into URLs by hand. Use the client's parameterized methods (confirm names in docs).
- Device-flow codes are short-lived secrets. Do not log them.
- Do not follow redirects or URLs from responses to hosts other than the configured API host. Links in content are opened only through the allow-listed external-link wrapper.
- Fixtures and recordings contain no real tokens, user names or e-mail addresses.
- Web access for research is limited to `https://docs.github.com/*` and `https://octokit.github.io/*`.

## Acceptance criteria

- With no sign-in, the app starts and plays music with zero GitHub network calls.
- Sign-in, sign-out and token deletion work against a mocked provider in tests. No test needs a token or the network.
- Every response used by the UI has a Zod schema and a test for a malformed body.
- Pagination stops by the stated conditions and by the cap, with tests for empty, short, exact and over-cap pages.
- At or below the rate-limit threshold no further requests are sent until reset, and the UI receives the limit state.
- Each error class in the union has a test and maps to the expected IPC error.
- Offline: cached data is returned with a stale label, or an offline state. No request storm (backoff test with a fake clock).
- Actions monitoring emits one event per state transition and stops on sign-out.
- Requested scopes are listed with the feature that needs each. All are read-only.
- No token, code or secret appears in logs, IPC payloads or snapshots.

## Validation checklist

- [ ] All GitHub calls run in main. No renderer or preload network code.
- [ ] Auth method labeled ASSUMED with open decision 2 referenced. No ADR choices made here.
- [ ] Scopes minimal, read-only and documented.
- [ ] Token passes only through the storage interface and the client factory.
- [ ] Responses parsed as `unknown` then Zod. Content returned as inert data.
- [ ] Pagination bounded and cancellable.
- [ ] Rate-limit state tracked, conditional requests used where documented, no calls while limited.
- [ ] Error union complete. No raw errors cross IPC.
- [ ] Offline path tested with fake clock and fake network failures.
- [ ] Polling interval is a parameter with a floor and backoff.
- [ ] Needed IPC channels listed for desktop-engineer.
- [ ] Open decisions 2, 3, 13 and 15 flagged "needs human decision".
- [ ] No library API or version stated without a documentation check.

## References

- `references/auth-and-token-lifecycle.md`: read when implementing sign-in, sign-out, revocation or reviewing token handling.
- `references/rate-limits-pagination-offline.md`: read when writing list calls, caching, backoff or the mocks for them.
- `references/actions-monitoring.md`: read when building the Actions monitor or notification triggers.

Changes needed outside your write scope are listed for the owning agent, not made here.
