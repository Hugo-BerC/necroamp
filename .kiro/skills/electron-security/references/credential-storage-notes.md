# Credential storage notes

Rules: `.kiro/steering/tech.md` ("GitHub tokens are stored only in the OS credential store via Electron `safeStorage` (or equivalent)"). This note collects the facts to confirm and the procedure. It does not decide open decision 3.

## Facts to confirm in the Electron documentation (all ASSUMED until checked)

| Topic | Expectation | Confirm |
|---|---|---|
| Availability check | `safeStorage` exposes a way to ask whether encryption is available. | Exact method name and whether it can be called before the app is ready. |
| Windows | Encryption tied to the user account. | Behavior across user profiles. |
| macOS | Encryption key held in the Keychain. | Prompts on first use, behavior when the app is unsigned. |
| Linux | Depends on a secret store (keyring) being present. Without one, the documented behavior may be a weak or unavailable backend. | Which backends exist, how to detect a weak backend, what the API reports. |
| Output | Encryption returns bytes the app stores itself. | Where to store (user-data directory), file permissions. |

Record each confirmed fact as DOCUMENTED with the page and date in the ADR for open decision 3.

## Procedure

1. A small storage interface in main: `save(secret)`, `load()`, `clear()`, `isAvailable()`. The signatures here are design suggestions for this project, not library APIs. github-integration and any other feature use only this interface.
2. `save` checks availability first. If unavailable, it returns a typed result "unavailable" and does not write anything.
3. The encrypted bytes go to one file in the user-data directory. Write to a temporary file, then rename, so a crash cannot leave a truncated blob.
4. `load` returns the secret to main-process code only. A failed decryption is treated as "signed out", the blob is removed, and the user signs in again.
5. `clear` deletes the file and overwrites the in-memory reference. It is called on sign-out, on revocation (401 from the provider) and on a failed decryption.
6. The renderer can ask only for state: signed in or out, and a display name that the service chose to expose. Never the token.

## Linux without a keyring (decided: ADR 0001, fail closed)

Decision: `docs/adr/0001-linux-credential-storage-fail-closed.md`. Persist only when encryption is available and a real secret store backs it. On the sync API, `safeStorage.getSelectedStorageBackend()` must not return `basic_text` or `unknown` (DOCUMENTED, Electron safeStorage docs). Otherwise the session is memory-only: no disk write, no `setUsePlainTextEncryption(true)`, no opt-in fallback. Detection errors count as unavailable. The equivalent check on the async API is still to be verified (ASSUMED).

## Lifetime in memory

- Hold the token only in main. Do not store it in a long-lived module-level object that other modules can import freely. Pass it to the API client factory.
- Do not place it in state that is serialized (settings, crash text, logs).
- Do not send it to the renderer, even for display. Mask any display value.

## Never log

Tokens, authorization headers, device codes, user codes after use, client secrets, decrypted blobs, full request objects of authenticated calls. Redact at the logger, not only at call sites.

## Tests

- Unavailable encryption: nothing is written.
- Save then load round trip with a fake encryption provider. Never use a real token. Use an obvious fake string.
- Corrupt blob: treated as signed out, file removed.
- Search test output and logs for the fake token string. It must not appear.
- Property test (via qa-engineer): arbitrary strings through the redaction function never leak the token substring.
