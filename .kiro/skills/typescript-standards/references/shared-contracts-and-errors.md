# Shared contracts and error conventions

Sources: `.kiro/steering/structure.md` (`src/shared/` purpose and dependency direction), `tech.md` (Zod at boundaries, IPC validation) and `docs/engineering/shared-ownership-policy.md`. This note links them to coding steps. The policy stays the source of truth for ownership, ADR and change-note rules. Do not copy its tables into code comments.

## Where things live

| Kind | Path | Owner |
|---|---|---|
| Channel constants, IPC payload schemas | `src/shared/ipc/**` | desktop-engineer |
| Settings schema | `src/shared/settings/**` | desktop-engineer |
| Audio types | `src/shared/audio/**` | audio-engineer |
| Skin manifest schema | `src/shared/skins/**` | frontend-engineer |
| GitHub schemas and types | `src/shared/github/**` | github-engineer |
| Everything else in `src/shared/` | necro-architect designs. No agent can currently write it (needs human decision, see the policy) | necro-architect |

`src/shared/` imports no Electron, DOM or Node-only API. A runtime dependency used from `src/shared/` needs an ADR.

## Defining a contract

1. Write the Zod schema first. Export `fooSchema` and `type Foo`.
2. Be strict: unknown keys rejected for inputs that cross a trust boundary (IPC, skins). Bound lengths, counts and numeric ranges.
3. Version what persists or ships: skin manifests carry `schemaVersion`. Settings need a migration path when the shape changes.
4. Prefer additive changes (new optional field, new channel). They need no change note but belong in the hand-off.
5. Document each field's meaning and unit in the schema description or a nearby comment. Units in names: `durationMs`, `gainDb`.

## Classifying a change

| Change | Class | Action |
|---|---|---|
| Resolves or alters an open decision, adds a process boundary, new top-level `shared` directory, changes IPC security model, adds a runtime dependency used from `shared` | ADR | necro-architect writes `docs/adr/NNNN-title.md` before implementation |
| Removed or renamed export, narrowed schema, changed channel or payload, bumped `schemaVersion`, changed field semantics | Contract change note | Hand-off lists the details. necro-architect appends to `docs/architecture/contract-changes.md` |
| New optional field, new channel with no change to existing ones | Additive | List in the hand-off |

Consult before editing, as the policy table lists (for example art-director and security-reviewer for skin schema fields that reference paths, URLs, fonts or limits).

## Error conventions

### Expected failures: values
```
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```
(A project-local helper type. It is a design suggestion, not a library API.)

- Error type is a discriminated union with a stable `code` string, for example `not-found`, `invalid-input`, `rate-limited`, `offline`, `unavailable`.
- Messages are short English text with no paths, tokens, stack traces or user data.
- Codes are part of the contract. Adding a code is additive. Removing or renaming one is a change note.

### Unexpected failures: exceptions
- Thrown only for programmer errors and truly unexpected states.
- Caught at boundaries: IPC wrapper (main), error boundary (renderer), top-level handler. They log with redaction and return a generic `unexpected` error.
- Never serialize an `Error` object across IPC. Map to the union.

### Validation errors
- Zod parse failure is an expected failure at a boundary. Return `invalid-input` and do not echo the rejected payload.
- In pure modules, a parse function returns a `Result`. It never throws for arbitrary input. This is the property that qa-engineer tests (`tech.md` "Testing": skin manifest validation, metadata normalization).

### Presenting errors
- One mapping module in the renderer turns error codes into user-facing text and an action (retry, dismiss, open settings).
- Do not show raw codes to users. Do not hide errors.

## Pure utility conventions

- Time formatting, playlist operations, metadata normalization, equalizer mapping: pure, total functions. Define behavior for empty, `NaN`, negative and huge input.
- Playlist operations return new arrays. Invariants (no element lost or duplicated by reorder, indexes in range) are written down in the function comment and covered by a property test request.
- Inject time and randomness as parameters.

## Review prompts

1. Who owns each path in the diff?
2. Which class is the change: ADR, change note, additive?
3. Does the receiving process validate again?
4. Can an arbitrary input throw out of a parse function?
5. Does any error text include a path, token or payload?
