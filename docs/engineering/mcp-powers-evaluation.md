# NecroAmp MCP and Powers Evaluation (Phase 04, Stage 4)

Branch `chore/engineering-automation`. Evaluation only. Nothing was installed or activated. No MCP config was created or edited. No credentials were read.

## 1. Evidence limits (read first)

The authoring subagent for this stage had no `web_fetch` tool, and the brief forbids fetching docs through the shell. **No official documentation was retrieved, so no claim in this document is DOCUMENTED.** Claims are either VERIFIED (observed in this repository or on this machine) or ASSUMED (from prior knowledge of the projects, not re-checked). Every ASSUMED item must be confirmed against the official source listed in section 4 before any install decision.

- VERIFIED: `.kiro/settings/mcp.json` does not exist in the workspace.
- VERIFIED: `~/.kiro/settings/mcp.json` does not exist (existence check only, no contents read).
- VERIFIED: `~/.kiro/powers/` contains only a `registries` entry. No Power is installed.
- VERIFIED (from `automation-design.md` section 2): all nine custom agents set `includeMcpJson: false` and `includePowers: false` and deny `mcp` and `power`. Any integration is therefore usable only by the orchestrator or the human, and installing one cannot widen any agent.
- VERIFIED: no `package.json` or `src/` exists, so no integration has application code to act on yet.

## 2. Summary of recommendation

| Integration | Immediate install? |
|---|---|
| Context7 (documentation MCP) | **Yes, conditional on explicit human approval** |
| GitHub MCP | No. Defer until PR or Actions work begins |
| Playwright MCP | No. Not needed for Electron tests |
| Kiro Powers | No. Browse the Powers panel at scaffold time |

Recommended immediate integrations: **one** (Context7). The limit is two. A second pick is not justified.

## 3. Common constraints applied to every integration

- Principles: local-first, no telemetry, no hosted infrastructure operated by the project (`product.md`). Dev-time tools that never ship in the app and are not enabled in the app's runtime do not violate these, but any tool that sends prompts or repository data to a third party is flagged.
- No agent may use MCP or Powers (VERIFIED). Orchestrator or human only.
- No secrets in `.kiro/` or in the repo. An MCP config that needs a token must read it from an environment variable or the user-level config, never from a committed file.
- Install only after explicit human approval. Workspace-level config would be committed under `.kiro/`; user-level config would not. Prefer user-level config for anything token-bearing.

## 4. Per-integration evaluation

### 4.1 Context7 (documentation MCP)

- **NecroAmp use case (ASSUMED):** version-specific docs lookup for Electron, electron-vite, Zod, Zustand, Octokit, Shiki, Vitest, fast-check and Playwright while writing the scaffold. `tech.md` forbids guessing library versions and APIs from memory, which is the problem this solves.
- **Official source (ASSUMED):** GitHub repository `upstash/context7` and the `@upstash/context7-mcp` npm package. Confirm on github.com/upstash/context7 and context7.com.
- **Authentication (ASSUMED):** works without an API key at rate-limited use. An optional API key raises limits. The recommendation is to run it without a key.
- **Security implications (ASSUMED):** it launches through `npx`, so it runs third-party code from npm on the developer machine. Pin an exact version, do not use `@latest`. Library queries are sent to a hosted service operated by Upstash. That is a third-party service, not project infrastructure, and it carries no repository content unless the model puts some in a query. It is development-only. It adds no network call to the shipped app.
- **Required permissions (ASSUMED):** outbound HTTPS to the Context7 service. No filesystem write access. No token.
- **Local and Cloud Session compatibility (ASSUMED, unconfirmed):** a stdio server started by `npx` needs a local process, so it works in Local sessions. Cloud Session support for user-configured local stdio servers is unknown. A remote (HTTP) endpoint variant may exist. Check Kiro's MCP docs for Cloud Session behavior.
- **Immediate install justified?** Yes, conditionally. It is read-only and keyless, and it is useful from the first scaffold step. Conditions: exact version pin, no API key, user-level config, human approval, and a note in the journal recording the third-party query flow.
- **Fallback if the human rejects the third-party query flow:** use agent-level `web_fetch` against allow-listed official doc sites. Note that most agents deny `web_fetch` (VERIFIED), so this means the orchestrator does the fetching.

### 4.2 GitHub MCP

- **NecroAmp use case (ASSUMED):** read PRs, issues, and Actions run status during development. The Phase 05 onward work (CI authoring by `release-engineer`, GitHub feature work by `github-engineer`) would benefit from reading real run logs. It is not needed for the player core.
- **Official source (ASSUMED):** GitHub repository `github/github-mcp-server`, distributed as a Docker image and as a GitHub-hosted remote endpoint. Confirm on github.com/github/github-mcp-server.
- **Authentication (ASSUMED):** a GitHub token is required (personal access token, or OAuth for the remote endpoint).
- **Security implications (ASSUMED):** a token-bearing server can write (create issues, comment, push files, merge) if the token and toolset allow it. That conflicts with the phase rules "no push, no merge, no publishing credentials". Mitigations if ever adopted: fine-grained token limited to this repository with read-only scopes, read-only mode and a restricted toolset (the server documents options for this, ASSUMED), token held in user-level config or an environment variable.
- **Required permissions (ASSUMED):** repository metadata, pull requests, issues, and Actions read access. Docker for the local variant, or outbound HTTPS for the remote variant.
- **Local and Cloud Session compatibility (ASSUMED, unconfirmed):** the Docker variant is local only. The remote variant may suit Cloud Sessions but needs credentials there, which this phase must not provide.
- **Immediate install justified?** No. It needs a credential this phase cannot touch, there is no CI or PR yet, and the `gh` CLI (denied to agents, usable by the human) covers the occasional need. Revisit when the first workflow files and PRs exist.

### 4.3 Playwright MCP

- **NecroAmp use case (ASSUMED):** let an agent drive a browser to inspect pages. NecroAmp is an Electron app, tested with the Playwright library's Electron mode (`tech.md`). A browser-oriented MCP server does not drive the packaged Electron window in the same way. The renderer could be opened in a plain browser during `electron-vite dev`, but it would lack the preload API, so it would not represent the app.
- **Official source (ASSUMED):** GitHub repository `microsoft/playwright-mcp`, npm package `@playwright/mcp`. Confirm on github.com/microsoft/playwright-mcp.
- **Authentication (ASSUMED):** none.
- **Security implications (ASSUMED):** runs `npx` third-party code, downloads and launches browser binaries, and can navigate to arbitrary URLs and execute page scripts, which widens the attack surface of a session that reads untrusted content (for example GitHub README content later). No telemetry is known to be sent (ASSUMED, check).
- **Required permissions (ASSUMED):** local process launch, browser download, outbound network, local screenshots and trace files.
- **Local and Cloud Session compatibility (ASSUMED, unconfirmed):** Local only in practice (needs a local browser).
- **Immediate install justified?** No. No app exists, and the project's own test strategy uses the Playwright test runner with Electron, which the `qa-engineer` agent already runs through `pnpm test:e2e`. Revisit only if interactive visual debugging of the renderer becomes a recurring need.

### 4.4 Kiro Powers (desktop, frontend design, testing)

- **NecroAmp use case:** Powers bundle documentation, steering and optional MCP servers for a tool. Relevant domains: Electron or desktop development, frontend design, and testing.
- **Official source (ASSUMED):** the Powers panel in the Kiro IDE and the Kiro docs at kiro.dev. Third-party Powers may come from Git repositories. The installed registry folder at `~/.kiro/powers/registries` exists (VERIFIED), its contents were not inspected.
- **Existence of a fitting Power (ASSUMED, unconfirmed):** the author knows of no official Power specific to Electron, Web Audio, or Zustand. Powers known to the author (such as ones for Figma design-to-code, or testing and API tools) are tied to external services and accounts. Treat any listing as unreviewed until the panel is opened by the human.
- **Authentication (ASSUMED):** varies per Power. Many wrap a hosted service and need an account or key.
- **Security implications (ASSUMED):** a Power can add MCP servers and steering text to the context. Steering is an instruction channel, so an untrusted Power is a prompt-injection path and a supply-chain path. Read its `POWER.md` and any MCP config before activating. Also, a Power that injects steering conflicts with the rule that steering files are controlled by the project (`structure.md`).
- **Required permissions (ASSUMED):** those of any MCP server it bundles.
- **Local and Cloud Session compatibility (ASSUMED, unconfirmed):** unknown. Check Kiro docs.
- **Immediate install justified?** No. No Power was found installed, no fitting Power is known, and the seven project skills already cover Electron security, audio, skins, testing, TypeScript, GitHub and packaging. Revisit at scaffold time by having the human browse the Powers panel for frontend or testing Powers, and evaluate each by the checklist in section 5.

## 5. Approval checklist (use before any future install)

1. Confirm the official source URL and the pinned version or commit.
2. Read the server or Power source and its config. List every network destination.
3. Confirm no telemetry, or document it and decide.
4. Decide scope: user-level config (default for anything with a token) versus workspace `.kiro/`.
5. Confirm read-only operation, or restrict tools to read-only.
6. Confirm Local versus Cloud Session behavior from Kiro docs.
7. Record the decision in `docs/kiroween/kiro-journal.md`.
8. Verify no agent frontmatter changed (`includeMcpJson` and `includePowers` stay `false`).

## 6. Known limitations of this evaluation

- No `web_fetch`, so no DOCUMENTED claims. All third-party facts are ASSUMED and must be confirmed before installation.
- Cloud Session compatibility is unconfirmed for every integration.
- Contents of `~/.kiro/powers/registries` and any user-level MCP config were deliberately not inspected.
- Proposed config snippets are intentionally omitted so that nothing in this file can be copied into `mcp.json` without a fresh, verified look at the official docs.
