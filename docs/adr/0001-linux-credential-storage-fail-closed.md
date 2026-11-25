# ADR 0001: Fail-closed GitHub token storage on Linux

- Status: Accepted (human decision, Phase 03 closure)
- Resolves: open decision 3 in `.kiro/steering/structure.md` (token storage, Linux without a keyring)
- Related: backlog item F1 in `docs/engineering/backlog.md`. Skills: `electron-security` (`references/credential-storage-notes.md`) and `github-integration`.

## Context

`tech.md` requires GitHub tokens to be stored only in the OS credential store, never in plain text. On Linux, Electron `safeStorage` depends on a secret store. When none is available, the synchronous API encrypts with a hardcoded plaintext password, and `safeStorage.getSelectedStorageBackend()` returns `basic_text`. The Electron safeStorage API docs state this (DOCUMENTED, https://www.electronjs.org/docs/latest/api/safe-storage). Encryption can therefore look available while giving no real protection, which is review finding F1.

The same docs mark the synchronous API as deprecated, to be removed in Electron 46. The asynchronous API uses a "fallback provider" on Linux when no secret service exists (DOCUMENTED). How to detect that fallback through the async API is not yet confirmed (ASSUMED, to verify when the Electron version is resolved).

## Decision

Token persistence fails closed on Linux.

1. A token is persisted only when encryption is available **and** a real secret store backs it. Today that means `getSelectedStorageBackend()` returns a value other than `basic_text` or `unknown`, or the async-API equivalent once verified.
2. If either check fails, the token is never written to disk in any form. No plaintext file, no `setUsePlainTextEncryption(true)`, no opt-in weak fallback.
3. The session continues memory-only. The token lives in the main process for the current run and is discarded on quit. The user signs in again on the next launch.
4. The UI states the reason once, in plain language, and links to setting up a keyring. It never blocks local-first playback features.
5. A detection error, or a backend that is unknown at check time (for example before `ready`), counts as "not available".

## Consequences

- No credential is ever stored without OS-backed protection. This matches `tech.md` and product principle 1 (local-first, GitHub optional).
- Linux users without a keyring re-authenticate every launch. This is an accepted cost.
- Implementation needs a backend check and tests for the `basic_text`, `unknown`, unavailable and available cases. Owners: desktop-engineer and qa-engineer.
- `structure.md` still lists decision 3 as open. Steering was not modified during this phase. Update it in a later, explicitly approved steering change.

## Alternatives rejected

- User-approved plaintext or `basic_text` fallback with a warning. It conflicts with the "never in plain text" rule.
- Disabling GitHub sign-in on such systems. It is stricter than needed, because memory-only sessions keep the feature usable without storing anything.
