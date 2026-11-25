# IPC channel checklist

Use for every new or changed channel. Rules come from `.kiro/steering/tech.md` ("Electron architecture and security") and `structure.md` (naming). Ownership and review triggers come from `docs/engineering/shared-ownership-policy.md`.

## Steps

| # | Step | Where | Done when |
|---|---|---|---|
| 1 | Name the channel `domain:action`, for example `library:scan`. | `src/shared/ipc/channels.ts` | Constant exists. No string literal of the channel appears elsewhere. |
| 2 | Write the request schema and the response schema. | `src/shared/ipc/**` | `fooRequestSchema`, `fooResponseSchema`, inferred types exported. Schemas are strict: unknown keys rejected. |
| 3 | Bound every field. | schema | Strings have a max length, arrays a max count, numbers a range, enums are closed. |
| 4 | Prefer IDs to paths. | schema | A path or URL field exists only when no ID can do the job, and the handler confines it. |
| 5 | Register the handler. | `src/main/ipc/<domain>*` | The handler validates the sender, parses the payload, calls a service, maps errors. |
| 6 | Define the error shape. | schema | A discriminated union with a `code` and a short message. No paths, tokens or stack traces. |
| 7 | Add the preload binding. | `src/preload` | One named function, one channel, typed return. No generic forwarding. |
| 8 | Add tests. | co-located `*.test.ts` | Valid payload, each invalid class, wrong sender, error mapping, no secret in the response. |
| 9 | Request property tests. | qa-engineer | Parse never throws unhandled for arbitrary input (`tech.md` "Testing"). |
| 10 | Record the channel. | PR description or hand-off | Name, direction, payload summary, validation, reviewers consulted. |

## Handler review table

| Question | Expected answer |
|---|---|
| Is the sender checked before the payload is read? | Yes. |
| Is validation done in the receiving process, even though the schema is shared? | Yes. |
| What happens on parse failure? | Typed error returned. Payload not logged. |
| Can the response contain a secret or a raw path? | No. |
| Can the handler be called while the feature is opted out (GitHub signed out)? | It returns a typed "not signed in" error and does no network call. |
| Does the handler block the main process for long work? | No. Long work is async and cancellable. |
| Is the channel needed by the renderer at all? | Yes, and the renderer cannot get the same result another way. |

## Event channels (main to renderer)

- Name them like request channels. Define a payload schema and validate before sending.
- The preload exposes a subscribe function for one channel that returns an unsubscribe function.
- Unsubscribe on component unmount. A leaked listener is a defect.

## Review triggers

security-reviewer reviews any channel that touches the filesystem, tokens, `shell.openExternal` or navigation. necro-architect reviews a change that crosses a process boundary in a new way, or changes sender validation, validation strategy or preload surface (that one also needs an ADR).
