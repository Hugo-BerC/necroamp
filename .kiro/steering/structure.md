---
inclusion: always
---

# NecroAmp: Project Structure and Conventions

The repository currently contains only `README.md`, `LICENSE` and `.gitignore`. The layout below is the **target** layout. Create directories only when a task needs them.

## Target layout (single package)

```
necroamp/
├─ .kiro/                  # Kiro configuration. Must stay committed. Never gitignore.
│  ├─ steering/            # product.md, tech.md, structure.md, kiroween.md
│  └─ specs/ hooks/ agents/ workflows/   # added later, on request
├─ .github/workflows/      # CI and release
├─ docs/                   # adr/ architecture/ design/ engineering/ kiroween/ release/ security/ testing/; asset license register (assets.md) not yet created
├─ resources/              # build resources: icons, installer assets
├─ skins/                  # bundled skins, one directory per skin
│  ├─ morgul-revenant/     # skin.json + assets + LICENSE-ASSETS.md
│  └─ analog-1984/
├─ src/
│  ├─ main/                # Electron main process (privileged)
│  │  ├─ ipc/              # handlers, one file per domain
│  │  ├─ github/           # Octokit client, auth, token storage
│  │  ├─ library/          # file scanning, metadata
│  │  └─ window/           # windows, protocol, navigation guards
│  ├─ preload/             # contextBridge API only
│  ├─ renderer/            # React UI (untrusted)
│  │  ├─ app/              # shell, routing between views
│  │  ├─ features/         # player, playlist, equalizer, visualizer, skins, github
│  │  ├─ audio/            # audio engine wrappers, worklets
│  │  ├─ stores/           # Zustand stores
│  │  └─ components/       # shared presentational components
│  └─ shared/              # code importable by all processes: IPC contracts, Zod schemas, types, pure utils
├─ tests/
│  ├─ e2e/                 # Playwright
│  └─ fixtures/            # small, license-clean audio and skin fixtures
├─ electron.vite.config.ts
├─ electron-builder.yml
├─ tsconfig*.json
├─ package.json            # pnpm 10, Node 24 LTS
├─ README.md  LICENSE  CONTRIBUTING.md  SECURITY.md
```

Unit tests sit next to the code as `*.test.ts(x)`. Property tests use `*.property.test.ts`.

## Dependency direction

```
renderer -> shared
preload  -> shared
main     -> shared
renderer -/-> main      (communicate only through preload + IPC)
shared   -/-> anything else  (no Electron, no DOM, no Node-only APIs)
```

- Feature folders under `renderer/features/` do not import each other's internals. Share through `stores/`, `shared/` or a feature's public `index.ts`.
- Pure domain logic goes in modules with no React, Electron or DOM imports.
- Use path aliases (`@shared/*`, `@main/*`, `@renderer/*`) once configured. No deep relative chains like `../../../`.

## Naming conventions

- Directories and files: `kebab-case` (`equalizer-band.tsx`, `skin-manifest.ts`). React component files are also kebab-case, the exported component is `PascalCase`.
- Types and components: `PascalCase`. Functions and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- Zod schemas: `fooSchema`, inferred type `Foo`.
- IPC channels: `domain:action` strings defined as constants in `src/shared/ipc/channels.ts` (for example `library:scan`, `github:list-repos`).
- Skin identifiers: lowercase kebab-case, matching the directory name.

## Documentation and commit conventions

- All docs in English, Markdown.
- Architectural decisions are recorded as short ADRs in `docs/adr/NNNN-title.md`.
- Every bundled asset is listed in `docs/assets.md` with author, source and license.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `refactor:`). Small, focused commits.
- Agents must not commit, push or open PRs unless the user explicitly asks.

## Kiro configuration conventions

- `.kiro/` is part of the public submission. Never add it or any subfolder to `.gitignore`.
- Steering files stay focused, one domain per file. Add new ones as `inclusion: fileMatch` or `auto` when they apply to specific areas, to keep always-on context small.
- Custom agents, when added, must load steering explicitly with `"resources": ["file://.kiro/steering/**/*.md"]`.
- Never put secrets, tokens or personal data in `.kiro/`.

## Open decisions

Each needs a human decision and, ideally, an ADR before implementation.

1. **Repository layout**: single package (assumed above) versus pnpm workspace monorepo.
2. **GitHub authentication method**: OAuth device flow (no client secret in a desktop app, assumed) versus authorization code with PKCE versus personal access token. Requires registering a GitHub OAuth App or GitHub App owned by the maintainer.
3. **Token storage**: `safeStorage` behavior on Linux without a keyring needs a fallback policy.
4. **Audio pipeline**: `AudioBuffer` decode versus `HTMLMediaElement` + `MediaElementAudioSourceNode` (streaming, lower memory for large FLAC). Gapless playback expectation.
5. **Metadata library**: for example `music-metadata` in main process. Evaluate license and bundle size.
6. **Skin format**: manifest schema, layout model (absolute regions versus constraint-based), whether to support Winamp `.wsz` import (legal and complexity risk, assumed out of scope).
7. **Skin packaging**: directory only or zipped archive with safe extraction.
8. **Styling approach**: CSS Modules versus other. Must support runtime theming via CSS variables.
9. **Lint and format tooling**: ESLint + Prettier versus Biome.
10. **Auto-update**: electron-updater against GitHub Releases is convenient but contacts the network. Decide whether it is opt-in or omitted, to stay consistent with the no-telemetry principle.
11. **Code signing and notarization**: Windows signing, macOS notarization and Apple Developer account availability. Unsigned builds trigger OS warnings.
12. **Linux targets**: AppImage, deb, rpm, snap, flatpak.
13. **GitHub scope**: github.com only, or GitHub Enterprise Server too. Rate-limit and caching strategy. Minimal OAuth scopes (read-only).
14. **Artwork production**: how the original Morgul Revenant and Analog 1984 assets are created and licensed (AI-generated assets need a clear license and provenance record).
15. **Audio notification assets**: sound sources and licensing.
16. **Visual identity**: window chrome (frameless custom versus native), multi-window (main, equalizer, playlist like Winamp) versus single window.
17. **Internationalization**: English only for UI initially (assumed).
