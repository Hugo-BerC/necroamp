# Auth and token lifecycle

Rules: `.kiro/steering/tech.md` (tokens only in the OS credential store, never in renderer, logs or plain text), `product.md` (GitHub is optional and opt-in). Open decisions 2 (auth method) and 3 (Linux storage) need a human decision. This note assumes **OAuth device flow** because `structure.md` and the `github-engineer` agent state it as the working assumption. ASSUMED.

## Open decision map

| Decision | State | What this layer does until decided |
|---|---|---|
| 2. Device flow, PKCE or personal access token | Open. Device flow assumed. | Keep auth behind an interface (`start`, `cancel`, `signOut`, `getState`) so the method can change without touching browsing code. |
| 3. Token storage without a keyring on Linux | Decided: ADR 0001 (fail closed) | Use the storage interface from electron-security. If it reports unavailable, including a `basic_text` backend, the session is memory-only. |
| 13. Enterprise Server, scopes | Open | Base URL is a parameter. Scopes are minimal and read-only. |
| Registering an OAuth app or GitHub App | Maintainer action | No client ID, secret or app ID is committed. The client ID comes from configuration supplied at build or run time. ASSUMED: a device-flow public client ID is not a secret, but confirm before committing any value. |

## Device-flow states (main process)

```
idle -> requesting-code -> waiting-for-user -> polling -> signed-in
                |                 |               |
                v                 v               v
              failed           cancelled        failed / expired
signed-in -> signed-out (user action, revocation, 401)
```

Rules:
- Only a user action leaves `idle`.
- The renderer receives: state name, user code, verification URL, expiry time. Nothing else.
- Polling obeys the interval the provider returns, and slows down when told to. Confirm exact response fields in the GitHub docs. Do not hard-code names from memory.
- Cancel stops polling and discards the device code.
- Expiry returns to `idle` with a typed error.
- The verification URL opens through the allow-listed `https:` wrapper.

## Token lifecycle

| Event | Action |
|---|---|
| Sign-in success | Store through the storage interface. Create the client. Emit state `signed-in`. |
| App start | If opted in and a stored token exists, load it in main, create the client lazily. No network call until a feature needs one. |
| 401 from API | Clear stored token and client. State `signed-out` with reason `token-invalid`. |
| User sign-out | Cancel polling and in-flight calls, clear cache, delete stored token, destroy client. |
| Token revocation by user on GitHub | Appears as 401. Same handling. The app cannot detect it earlier. |
| Token expiry (if the method issues expiring tokens) | ASSUMED: depends on the app type chosen in decision 2. Design the interface with a refresh hook but do not implement refresh until the decision is made. |
| App quit | Nothing to do beyond normal cleanup. Memory is released. |

## Scopes

- List each scope with the feature that needs it in a table in `src/main/github/README` or the PR description.
- Start from the smallest set. Add a scope only with a named feature and a note in the hand-off.
- Read-only. A request for a write scope is a design change that needs an ADR and a human decision.
- Scope names and what they grant: confirm on `https://docs.github.com/`. Not stated here to avoid error.

## Tests (all offline)

- Fake provider returns a code, then pending, then success. Assert state sequence.
- Pending, slow-down, expired, denied and network failure paths.
- Cancel during polling stops further requests (fake clock).
- 401 clears the token and client.
- Sign-out deletes the stored value and clears the cache.
- The token string and device code never appear in logs, IPC payloads or error messages (search the captured output).
- Opt-out user: no auth network call occurs at startup.

## Review questions

1. What is the first network call a never-signed-in user triggers? Answer: none.
2. Where does the token live at each step, and who can read it?
3. What does the user see when the token is revoked?
