# ADR 0003: `app://renderer` protocol, scheme privileges and Content Security Policy
- Status: Accepted (human decision D4; development CSP deviation accepted with conditions on 2026-11-26). Runtime behavior is not yet verified (see Consequences).
- Resolves: production renderer origin (D4). Related to `tech.md` "Content Security Policy" and "Filesystem access is mediated by main".
- Related: `.kiro/specs/desktop-foundation/design.md` sections 3.4 and 4, ADR 0005
## Context
`file://` gives an opaque origin, which weakens sender validation and CSP. A local HTTP server opens a network port, which `product.md` rules out. A custom scheme gives a stable origin, but its handler must confine file access and its privileges must stay minimal.
## Decision
1. **Origin.** The production renderer loads from `app://renderer/`. The host is a fixed constant. Any request with another host is rejected.
2. **Scheme privileges.** Registered before `ready` with `protocol.registerSchemesAsPrivileged`:

| Privilege | Value | Reason |
|---|---|---|
| `standard` | true | Real host and origin, relative URL resolution, `'self'` in CSP. |
| `secure` | true | Secure context, needed later for AudioWorklet. |
| `supportFetchAPI` | true | Module scripts and assets load through fetch. |
| `corsEnabled` | omitted | Same-origin only. |
| `bypassCSP`, `stream`, `allowServiceWorkers`, `codeCache` | omitted | Not needed. `bypassCSP` is never allowed. |

3. **`corsEnabled` fallback (pre-approved).** If the E2E smoke run shows module scripts blocked because the scheme is not CORS-enabled, add `corsEnabled: true` and record it as an amendment to this ADR. No other privilege may be added without a new ADR. Status: not exercised.
4. **Handler.** `protocol.handle('app', ...)` is installed after `ready`. It accepts `GET` and `HEAD` only (`405` otherwise) and reads files with `fs`, not `net.fetch`, so `net` stays forbidden in `src`. It resolves the URL with the pure `resolveAppPath` (rejects over-long input, wrong scheme or host, credentials, encoded separators, `..`, dotfiles, `:`, backslash, NUL, and extensions outside `.html .js .css .json`). It then checks the real path against the real renderer root, requires a regular file of at most 5 MiB, and answers `404` for every rejection without naming the rule. Responses carry `Content-Type`, the CSP header, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` and `Cross-Origin-Resource-Policy: same-origin`.
5. **Production CSP.** Sent as a header on every `app://` response and copied into a `<meta>` tag at build time by one builder function:

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; manifest-src 'none'
```

   No `unsafe-eval`, no `unsafe-inline`, no `data:`, no remote scheme and no wildcard. `media-src` and `worker-src` open in the audio phase through a design change.
6. **Development CSP.** The header is added only for the dev server origin. It adds `connect-src` for that origin and its websocket, and `'unsafe-inline'` for `script-src` and `style-src`, only if the pinned Vite and React plugin need it. This deviates from requirement R5.5 (design N2). **Accepted by the human with conditions on 2026-11-26.** Conditions: (a) `unsafe-inline` only where demonstrated necessary for Vite HMR or React Fast Refresh; (b) development connections restricted to the exact trusted local development origin; (c) never `unsafe-eval`; (d) never remote scripts; (e) the production CSP contains no development exception; (f) all Electron security invariants are preserved; (g) tests prove the production CSP cannot inherit development-only allowances (tasks T2.2, T6.1); (h) validation duty: if runtime validation (T7.6) shows an allowance is not required, remove it. The builder takes an explicit mode, and a test asserts the production output never contains a development allowance.
7. **Dev loading.** `ELECTRON_RENDERER_URL` is honored only when the app is not packaged and the value is an `http:` loopback URL (`localhost` or `127.0.0.1`) with a port, no credentials and an empty path.
## Consequences
- Navigation guards, sender validation and the CSP share one trusted-origin set, so three independent layers keep remote code out (ADR 0005).
- Skin assets will need `img-src` and `font-src` additions and a confined skin root later. That is a design change, not a loosened policy.
- Packaged builds need a check of `realpath` against the asar layout. That is deferred to the packaging phase.
- Unverified until the build and E2E tasks run: `'self'` matching `app://renderer`, the electron-vite output layout, and whether `corsEnabled` is needed. Each has a test that fails visibly.
## Alternatives rejected
- `file://` for production. Opaque origin, weaker checks.
- Local HTTP server. Opens a port.
- `net.fetch(pathToFileURL(...))` in the handler. It needs `net`, and it removes the handler's own confinement check.
- `bypassCSP` or `corsEnabled` by default. Wider privileges without evidence of need.
