# Shared module ownership and contract coordination policy
Phase 02, Stage 3. Sources: `.kiro/steering/structure.md` (dependency direction, `src/shared/` purpose), `tech.md` (IPC rules, Zod at boundaries) and the write scopes in `.kiro/agents/*.md`.
`src/shared/` holds IPC contracts, Zod schemas, types and pure utilities. It is importable by main, preload and renderer, so a change there can affect every process.
## 1. Ownership table
Domain-specific owners are unchanged. Only the last row is new.
| Path | Owner (may write) | Source |
|---|---|---|
| `src/shared/ipc/**` (channel constants, IPC payload schemas) | desktop-engineer | existing write scope |
| `src/shared/settings/**` | desktop-engineer | existing write scope |
| `src/shared/audio/**` | audio-engineer | existing write scope |
| `src/shared/skins/**` (skin manifest schema) | frontend-engineer | existing write scope |
| `src/shared/github/**` (GitHub payload schemas and types) | github-engineer | existing write scope |
| Every other path under `src/shared/` (root files, shared types, pure utilities such as playlist operations, metadata normalization, time formatting, and any new subdirectory) | **necro-architect** (architectural owner) | this policy |
## 2. What "architectural ownership" means
The architect owns the design, the contract definition and the review of the unassigned area. It decides module boundaries and what belongs in `src/shared/`, and it settles disputes about where code lives.
Clarification (post-approval): necro-architect owns architectural decisions and the shared contracts. Implementation may be delegated to the appropriate engineering agent through an approved task, and every shared contract change requires architectural review before it is considered done. For domain-owned paths in section 1, the domain agent implements. For unassigned paths, no agent can write them yet, so the approved task is carried out as described below.

Ownership does not widen any permission. necro-architect's write scope stays `docs/adr/**`, `docs/architecture/**` and `docs/requirements/**`, and it has no shell. It cannot edit `src/**`. No other agent's write scope was changed either.
**Consequence (implementation gap, needs human decision).** No agent can currently write to the unassigned part of `src/shared/`. Until the user decides otherwise, the architect writes the design (types and signatures in `docs/architecture/**`, acceptance criteria in `docs/requirements/**`) and the user, or a main-session coding step outside these agents, implements it. Options for the user:
1. Implement unassigned shared code manually or in a main session. No permission change.
2. Add a narrowly scoped write path (for example `src/shared/playlist/**`) to one existing agent's `fs_write` allow and deny lists. This is a permission widening and requires explicit user approval and a security-reviewer pass.
Neither option has been applied.
## 3. Coordination policy for shared interfaces and contracts
A "shared contract change" is any change under `src/shared/` that alters an exported name, type, Zod schema, channel constant or documented behavior that code in another process or domain imports.
### 3.1 Who is consulted or must review
| Change | Owner makes it | Must consult or be reviewed by |
|---|---|---|
| New or changed IPC channel or payload schema in `src/shared/ipc/**` | desktop-engineer | The requesting domain agent (consulted before). security-reviewer reviews any channel that touches filesystem, tokens, `shell.openExternal` or navigation. necro-architect reviews if the change crosses a process boundary in a new way. |
| GitHub schema or type in `src/shared/github/**` | github-engineer | desktop-engineer (channel and handler side). security-reviewer if it carries token, auth or sanitized content types. |
| Skin manifest schema in `src/shared/skins/**` | frontend-engineer | art-director (consumer of the format). security-reviewer for any field that references paths, URLs, fonts or limits. qa-engineer updates property tests. |
| Audio types in `src/shared/audio/**` | audio-engineer | frontend-engineer if UI-visible. qa-engineer updates property tests. |
| Settings schema in `src/shared/settings/**` | desktop-engineer | frontend-engineer if UI-visible. security-reviewer if it stores paths or credentials-adjacent values. |
| Unassigned `src/shared/**` | per section 2 | necro-architect designs and reviews. Consumers listed in the design are consulted. |
| Ownership dispute or a new `src/shared/` subdirectory | none | necro-architect decides and records it in an ADR or architecture note. |
Consult means the owner states the planned change to the affected agents (or the user) before editing and lists the affected files in its hand-off. Review means the reviewer reads the diff before the work is called done.
### 3.2 When an ADR is required (`docs/adr/NNNN-title.md`)
An ADR, written by necro-architect, is required before implementation when a change:
- resolves or alters any item in the `structure.md` "Open decisions" list (these also need a human decision);
- adds or changes a process boundary, or alters the dependency direction in `structure.md`;
- adds a new top-level `src/shared/` subdirectory or moves ownership of one;
- changes the IPC security model (sender validation, validation strategy, preload surface);
- adds a runtime dependency used from `src/shared/`, because `shared` may not import Electron, DOM or Node-only APIs.
### 3.3 When a contract change note is required
A contract change note is required for a shared contract change that does not meet the ADR criteria but is breaking or visible to another domain: a removed or renamed export, a narrowed schema, a changed channel name or payload, a bumped `schemaVersion`, or changed semantics of an existing field.
- Location: `docs/architecture/contract-changes.md`, appended newest first, written by necro-architect from the owner's hand-off. If the owner cannot write there, it puts the note in its final message and the architect or user records it.
- Content: date, contract path, what changed, why, affected consumers and owners, migration needed, tests to update, reviewers consulted.
- Additive, backward-compatible changes (a new optional field, a new channel with no change to existing ones) need no note, but the owner still lists them in its hand-off.
### 3.4 Rules for every agent
- Do not edit a `src/shared/` path you do not own. Send the requested change and its owner in the final message.
- Do not add Electron, DOM, Node-only or renderer/main imports to `src/shared/` (`structure.md`).
- Validate every payload that crosses IPC with a Zod schema in the receiving process. A schema that lives in `shared` does not replace validation at the receiver.
- Contract changes that need tests go to qa-engineer, which owns property tests. qa-engineer reports defects and does not patch source.
## 4. What is and is not enforced
- **VERIFIED:** the table in section 1 matches the `fs_write` allow and deny lists in the agent files. The existing five `src/shared/` scopes are disjoint, and none covers the unassigned paths. One exception: qa-engineer's `**/*.property.test.ts` and `**/*.integration.test.ts` patterns also match files under the unassigned `src/shared/` paths. It may write those test files only, not source. Plain `*.test.ts` files next to shared code have no agent owner.
- **DOCUMENTED (Kiro):** deny rules override allow rules. Each agent ends with a `**` write deny outside its scope, so no agent can write unassigned `src/shared/` source files.
- **ASSUMED:** consultation, review, ADR and note requirements are instructions in agent prompts. Kiro does not enforce them. Human review of the diff is the actual control.
