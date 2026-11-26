# necroamp

NecroAmp — The developer's music player. Resurrecting classic desktop music players for modern developers. Built with Kiro for Kiroween 2026.

> Code. Listen. Repeat.

![Kiroween](https://img.shields.io/badge/Kiroween-2026-7CFF7A)
![Category](https://img.shields.io/badge/Category-Resurrection-8A2BE2)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Built with](https://img.shields.io/badge/Built%20with-Kiro-purple)

## About

NecroAmp is an open-source, cross-platform desktop music player
designed for modern software developers.

Inspired by the golden age of desktop music players, NecroAmp
resurrects the classic experience of applications such as Winamp
and combines it with modern software engineering workflows.

## Kiroween 2026

This project is being developed for the Resurrection category
of the Kiroween 2026 Hackathon.

- Hackathon: Kiroween 2026
- Category: Resurrection
- Development period: November - December 2026
- Development methodology: Agentic and Spec-Driven Development
- Primary development tool: Kiro
- Official website: https://kiroween.devpost.com/
- Official rules: https://kiroween.devpost.com/rules

## Product Vision

Bring back the golden age of customizable desktop music players
and reimagine it for today's software developers.

No subscriptions. No advertising. No mandatory cloud services.

## Planned Features

- Local audio playback
- Playlist management
- Graphic equalizer
- Real-time audio visualizations
- Advanced graphical skin engine
- Original artistic themes
- GitHub authentication
- GitHub repository explorer
- Source code visualization
- GitHub Actions monitoring
- Optional audio notifications for development events

## Target Platforms

- Windows
- macOS
- Linux

## Proposed Technology Stack

- Electron
- TypeScript
- React
- Web Audio API
- Octokit
- GitHub Actions
- Electron Builder

## Kiro Engineering

NecroAmp is designed using Kiro's agentic development ecosystem.

The project intends to leverage:

- Steering
- Specs
- Custom Agents
- Agent Sessions
- Subagents
- Agent Skills
- Agent Hooks
- Workflows
- MCP Servers
- Kiro Powers
- Property-Based Testing
- Kiro CLI and Headless Mode

Project-specific Kiro configuration is maintained in the
`.kiro/` directory.

## Development Status

Project initialization.

Application implementation, installers and documentation
will be added during the development process.

## License

MIT License.

## Development

Requires Node.js 24 LTS and pnpm 10. On Windows PowerShell use `pnpm.cmd` if script execution is restricted.

| Command                             | Purpose                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`    | Install pinned dependencies. Lifecycle scripts are deny-by-default.                  |
| `pnpm dev`                          | Start electron-vite in development mode. Not available until the entry points exist. |
| `pnpm build`                        | Build main, preload and renderer. Not available until the entry points exist.        |
| `pnpm typecheck`                    | Run `tsc -b` over all projects.                                                      |
| `pnpm lint`                         | Run ESLint.                                                                          |
| `pnpm format` / `pnpm format:check` | Write or check Prettier formatting.                                                  |
| `pnpm test`                         | Run Vitest once.                                                                     |
| `pnpm test:coverage`                | Run Vitest with coverage thresholds.                                                 |
| `pnpm test:e2e`                     | Run Playwright against the built app.                                                |

Platform status: Windows x64 is the only validated platform. macOS and Linux are not verified.
