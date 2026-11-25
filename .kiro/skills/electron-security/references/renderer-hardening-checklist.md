# Renderer hardening checklist

Source of the rules: `.kiro/steering/tech.md` ("Electron architecture and security"). Electron API names not listed in `tech.md` are ASSUMED. Confirm them in the Electron documentation for the version resolved at scaffolding before writing code.

## Window factory

- [ ] All windows are created by one factory so settings cannot drift.
- [ ] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
- [ ] No remote URL is loaded in a window with the preload attached.
- [ ] The preload path is fixed. It is never derived from input.
- [ ] Development mode keeps every setting above. Only the content origin may differ (dev server), and it is allow-listed for that mode only.
- [ ] Window chrome (frameless or native) and single or multiple windows are open decision 16. Needs human decision. Whatever is chosen, each window uses the factory.

## Content Security Policy

- [ ] Delivered from main (header or protocol response), not only a `<meta>` tag.
- [ ] `default-src` restrictive. `script-src` limited to the app origin. No `unsafe-eval`. No remote script hosts.
- [ ] `connect-src` denies remote hosts by default. GitHub calls happen in main (`tech.md`).
- [ ] `img-src`, `media-src` and `font-src` allow only the app origin and the app's own media protocol. Skin assets come through that protocol.
- [ ] `style-src` choice depends on the styling approach (open decision 8). If inline styles are needed for runtime theming, prefer CSS custom properties set through the CSSOM over `unsafe-inline`. ASSUMED: this works with the chosen approach, verify.
- [ ] `object-src 'none'`, `base-uri` restricted, `frame-ancestors` and `form-action` restricted.
- [ ] A test loads the built app and asserts the CSP header or meta value.

## Navigation and new windows

- [ ] Every navigation event is checked. Anything outside the app origin is prevented.
- [ ] New-window requests are denied. A valid `https:` URL on the allow-list is forwarded to the external-link wrapper instead.
- [ ] Webview tags are not enabled.
- [ ] Tests: attempt navigation to a remote URL, a `file:` URL and `window.open`. All blocked.

## Permissions

- [ ] A permission request handler and a permission check handler exist and deny by default.
- [ ] Any allowed permission is listed with the reason, the origin it applies to and a test.
- [ ] Device and capture permissions are not requested by local playback. ASSUMED: none is needed. Confirm during implementation.

## Custom protocol

- [ ] Registered before the app is ready if the Electron documentation requires it (ASSUMED, confirm).
- [ ] Handler decodes the URL, resolves the path against a fixed root, checks the result is inside the root, then serves. Anything else returns an error response.
- [ ] Rejects `..`, encoded separators, absolute paths, drive letters, symlinks that leave the root, and over-long paths.
- [ ] Sets the content type from an allow-list of extensions. No directory listing.
- [ ] Supports range requests for media if the audio pipeline needs them (open decision 4). Range parsing is bounded and tested.
- [ ] Skin assets are served from the skin root only. Skin rules live in skin-development.

## External links

- [ ] Single wrapper parses with a URL parser, requires `https:`, checks host allow-list, rejects embedded credentials, then calls `shell.openExternal`.
- [ ] Invalid input returns a typed error. It is never passed to the OS.

## Production build expectations

Configuration belongs to cross-platform-packaging. Runtime code must not depend on any of these being off:
- RunAsNode disabled, ASAR integrity where supported (`tech.md` "Enable Electron Fuses").
- No debugging flags or remote debugging port in production.

## Review questions

1. What can a script in the renderer do today? List it. It should be only the preload API.
2. What is the worst result of each preload method called with hostile arguments?
3. Which handler would you remove first if you had to shrink the surface?
