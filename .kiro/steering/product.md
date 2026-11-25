---
inclusion: always
---

# NecroAmp: Product Overview

NecroAmp is an open-source, cross-platform desktop music player for software developers. It resurrects the customizable desktop player experience of Winamp-era software and adds developer workflows (GitHub browsing and CI monitoring).

Tagline: **Code. Listen. Repeat.**

Status: pre-implementation (steering foundation only). Update this file when scope changes.

## Target users

Software developers who listen to local music files while working and want a fast, skinnable, offline-capable player that also surfaces repository and CI information.

## Product principles

These are binding constraints. Do not propose designs that violate them.

1. **Local-first.** Playback, playlists, equalizer, visualizations and skins work with no Internet access and no account.
2. **GitHub is optional.** Every GitHub feature is opt-in. The app must be fully usable if the user never signs in.
3. **No mandatory cloud services.** No backend operated by the project.
4. **No telemetry, analytics, crash reporting or advertising.** Not even opt-out versions.
5. **Skins are data, not code.** A skin must never execute arbitrary code.
6. **Original or licensed assets only.** Every bundled image, font, sound and icon needs a recorded license. No Winamp or other third-party skin assets, names or trademarks.
7. **Open source under MIT.**
8. **English** for all source code, comments, commit messages and documentation.

## Feature scope

### Core player (must have)
- Local playback of MP3, WAV, FLAC and OGG.
- Playlist management (create, reorder, save, load) and media metadata (tags, duration, embedded artwork).
- Ten-band graphic equalizer.
- Real-time audio visualizations (spectrum and waveform at minimum).

### Skin engine (must have)
- Declarative skins controlling backgrounds, controls, textures, typography and layouts.
- Two bundled skins:
  - **Morgul Revenant**: original dark fantasy artwork inspired by a haunted gothic fortress with spectral green illumination.
  - **Analog 1984**: vintage Hi-Fi inspired.

### GitHub integration (optional, opt-in)
- GitHub authentication.
- Repository and directory explorer.
- Source code and README viewing with syntax highlighting.
- GitHub Actions run monitoring.
- Optional audio notifications for development events (for example a workflow run finishing).

### Distribution
- Native installers for Windows, macOS and Linux.

## Non-goals

- Streaming services, podcasts, online radio or music stores.
- Cloud sync, user accounts, or any server owned by the project.
- A code editor or Git client. The explorer is read-only.
- Executing skin-supplied scripts.
- Mobile or web builds.

## Quality attributes (in priority order)

1. Security (Electron hardening, token handling, skin sandboxing).
2. Audio correctness and glitch-free playback.
3. Offline reliability.
4. Visual identity and skin flexibility.
5. Cross-platform parity.
6. Startup time and memory footprint.

## Hackathon context

NecroAmp is a Kiroween 2026 entry in the Resurrection category. See `kiroween.md`.
