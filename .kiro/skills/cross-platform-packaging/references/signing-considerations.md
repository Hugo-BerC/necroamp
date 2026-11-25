# Code signing and notarization considerations

Read with `SKILL.md` procedure P6. Signing availability is open decision 11 in `structure.md`. This file states facts to confirm and questions to ask. It does not decide anything.

## 1. Unsigned behavior (default until decision 11)

| OS | Effect on users | Document in release notes |
|---|---|---|
| Windows | SmartScreen may warn on download and first run. Reputation builds over time and is faster with a code signing certificate. | Warning text and how to verify the SHA-256 checksum |
| macOS | Gatekeeper blocks apps that are not notarized from a normal double-click open. The user must explicitly allow the app. | Exact steps for the macOS versions supported, confirmed at release time |
| Linux | No OS-level signature check for AppImage or a locally installed DEB. | Checksum verification steps |

Unsigned builds are acceptable for the hackathon if the user decides so. The release notes must say so plainly.

## 2. What signing would require

| OS | Needs | Typical secret names (placeholders) |
|---|---|---|
| Windows | A code signing certificate (OV or EV), or a cloud signing service. A cloud service conflicts with "nothing beyond GitHub" and needs a decision. EV keys are often hardware-bound and may not work on hosted runners. | `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` |
| macOS | An Apple Developer Program membership, a Developer ID Application certificate, hardened runtime, and notarization credentials (Apple ID with app-specific password, or an App Store Connect API key) | `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` (or API key equivalents) |
| Linux | Optional: GPG signature over `SHA256SUMS` by the maintainer, done manually outside CI | None in CI |

Confirm the environment variable names Electron Builder reads for the resolved version on electron.build before using them. The names above are placeholders for planning.

## 3. Secret handling rules

- Store signing secrets only as GitHub encrypted secrets, ideally in a protected environment (for example `release`) that requires reviewer approval. The human creates and owns them.
- Expose them only to the release workflow's signing steps through `env:`, never at workflow level.
- No signing on `pull_request`. Fork PRs never receive secrets.
- Write decoded certificate material only to the runner temp directory and remove it in an `if: always()` step. Never write it into the workspace or artifacts.
- In builds that are meant to be unsigned, disable certificate auto-discovery on macOS so a runner keychain identity is never picked up by accident. Confirm the documented variable (commonly `CSC_IDENTITY_AUTO_DISCOVERY=false`).
- Never echo, `cat` or base64-print a secret. Keep log masking intact by not transforming secrets into new strings in shell.

## 4. Questions for the human (decision 11)

1. Will Windows builds be signed? If yes: certificate type, issuer, and whether the key can be used on a GitHub-hosted runner.
2. Is an Apple Developer account available for Developer ID signing and notarization? Which credential type?
3. Which GitHub environment and reviewers protect the release secrets?
4. Is a maintainer GPG signature over checksums wanted for Linux?
5. Until signing exists, is "unsigned with published checksums" acceptable for the Kiroween submission?

Record the answers as an ADR (architect) and in `docs/release/` (release-engineer).

## 5. Verification once signed

- Windows: `Get-AuthenticodeSignature` reports `Valid` with the expected subject. The timestamp is present.
- macOS: `codesign --verify --deep --strict` passes, `spctl --assess --type execute` accepts the app, and `xcrun stapler validate` confirms the notarization ticket on the app and the DMG.
- The checksums in `SHA256SUMS` are computed after signing, because signing changes the file.
