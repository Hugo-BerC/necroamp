---
inclusion: always
---

# NecroAmp: Kiroween 2026 Context

NecroAmp is an entry in **Kiroween 2026**, category **Resurrection** ("bring your favorite dead technology back to life"). Official rules: https://kiroween.devpost.com/rules (last reviewed during project genesis; re-check before submission).

## Submission requirements that affect daily work

- The project must be a working application built with Kiro. Insufficient use of Kiro leads to disqualification.
- The GitHub repository must be **public**, contain all source, assets and instructions needed to run, and carry a detectable **open source license** (MIT, already present).
- The repo must contain the **`/.kiro` directory at the root**. Never add `.kiro` or its subfolders to `.gitignore`.
- A public **YouTube demo video** showing the project working end to end.
- A **write-up of how Kiro was used**: judges assess depth and variety of Kiro feature use, strategy and experimentation.
- Software must install and run consistently on its intended platforms and behave as shown in the video and text.
- Project must be newly created during the submission period.
- Bonus prizes exist for a public blog post and a social post (hashtag `#KiroweenHackathon26`, post must start with it). Not required.

## Kiro usage evidence to preserve

Judges look for deliberate, varied use of Kiro. Keep project-specific Kiro configuration committed and meaningful:

| Kiro capability | Planned use in NecroAmp |
|---|---|
| Steering | These four foundation files, plus focused files added later (for example Electron security, skin format, testing) |
| Specs | One spec per major feature: player core, equalizer, visualizer, skin engine, GitHub auth, explorer, Actions monitor |
| Agent sessions | Keep a log of notable sessions and decisions in `docs/kiroween/kiro-journal.md` |
| Custom agents | Role-based agents such as security reviewer, audio DSP reviewer, skin artist |
| Skills | Reusable procedures such as "add IPC channel" or "create skin" |
| Hooks | Automations such as typecheck or asset license check on save |
| Workflows | Multi-step feature pipelines with review |
| MCP | Integrations such as a GitHub MCP server for development tasks |
| Powers | Evaluate relevant Powers and document what was used |

These are plans, not current state. Do not create Specs, Custom Agents, Hooks or Workflows until the user asks.

## Agent behavior rules for this project

1. Treat `product.md`, `tech.md`, `structure.md` and this file as authoritative. If a request conflicts with them, say so and ask before proceeding.
2. Prefer spec-driven development: requirements, design, tasks, then implementation.
3. Do not publish unless explicitly authorized (rule 13). Commits and pushes follow rule 9.
4. Do not introduce AWS or any hosted infrastructure.
5. Do not add telemetry, analytics or network calls not required by a user-initiated GitHub feature.
6. Record meaningful Kiro usage (what was done, which feature, what it changed) so it can feed the write-up and video.
7. State assumptions explicitly and surface unresolved decisions (see `structure.md`, "Open decisions") instead of silently choosing.
8. Never include secrets, tokens or personal data in the repository.
9. Autonomous implementation, testing, dependency installation, commits, pushes and PR creation are authorized.
10. Merging into `main` requires explicit human authorization naming the specific PR. Opening or updating a PR does not imply it.
11. Agents never grant themselves human acceptance. A human gate (approval, confirmation, acceptance) is closed only by a human message, and docs must not claim one that was not given.
12. A previous conditional authorization never overrides a later restriction. When instructions conflict, the later and stricter one applies.
13. Publishing a release (tag, GitHub Release, package publication) requires explicit human authorization.
See `docs/engineering/incident-pr5-merge-authorization.md`.

## Timeline note

The README states a development period of November to December 2026. Confirm exact submission deadline on the Devpost page before planning milestones. This file does not hardcode dates.
