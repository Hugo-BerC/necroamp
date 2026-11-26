# Contract changes

Log of shared contract changes under `src/shared/`, newest first. Format and triggers follow `docs/engineering/shared-ownership-policy.md` section 3.3. Additive changes need no entry. Owner of the log: necro-architect. Closes finding C-2 of the T3.4 addendum in `docs/adr/0005-ipc-security-model-and-main-process-lifecycle.md`.

## 2026-11 (Desktop Foundation M3): initial `app:get-info` contract baseline

- **Type of entry.** Baseline, not a breaking change. Every later change to the items below is measured against this entry.
- **Contract paths.** `src/shared/ipc/channels.ts`, `result.ts`, `app-info.ts`, `necroamp-api.ts`, `index.ts`.
- **Architectural owner.** necro-architect. **Implementation owner.** desktop-engineer (`src/shared/ipc/**`).
- **Reviewers.** necro-architect (T3.4, ADR 0005 addendum, verdict ACCEPT), security-reviewer (`docs/security/m2-m3-security-review.md`).

### Baseline surface

| Item | Value |
|---|---|
| Channel constant | `IPC_CHANNELS.appGetInfo = 'app:get-info'`. It is the only channel. Literals appear only in `channels.ts`. |
| Request | `appInfoRequestSchema = z.tuple([])`. The call takes no arguments, and any extra argument fails parsing in main. |
| Success data | `appInfoSchema = z.strictObject({ name: string 1..64, version: string 1..64, platform: 'win32' \| 'darwin' \| 'linux' })`. Unknown keys are rejected. |
| Result envelope | `ipcResultSchema(data)`: `{ ok: true, data }` or `{ ok: false, error }`. Both are strict objects. |
| Error | `ipcErrorSchema = { code, message }`. `code` is one of `INVALID_SENDER`, `INVALID_PAYLOAD`, `INTERNAL`. `message` is at most 120 characters and comes from the fixed `IPC_ERROR_MESSAGES` map, never from an exception, path or payload. |
| Response schema | `appInfoResponseSchema = ipcResultSchema(appInfoSchema)`. |
| Bridge shape | `NecroampApi = { readonly app: { readonly getInfo: () => Promise<unknown> } }`, exposed as `window.necroamp`. It returns `unknown` on purpose. The renderer adapter parses the value with `appInfoResponseSchema`. |

### Compatibility rules for later changes

- Adding a channel or an optional field is additive and needs no entry. It still goes in the owner's hand-off.
- Removing or renaming an export, narrowing a schema, changing a channel name or payload, or changing `ok`/`error` semantics needs a new entry here, newest first.
- Any change to sender validation, the validation strategy or the preload surface needs an ADR (policy 3.2), not only an entry.
- `NecroampApi` must never gain a generic invoke, `ipcRenderer`, a filesystem path parameter or an Electron object.

### Affected consumers

| Consumer | Owner | Use |
|---|---|---|
| `src/main/ipc/**` | desktop-engineer | Parses the request, builds and validates the response. |
| `src/preload/**` | desktop-engineer | Uses `IPC_CHANNELS` only. |
| `src/renderer/app/bridge/necroamp-client.ts` (M4, T4.2) | frontend-engineer | Parses the bridge value with `appInfoResponseSchema`. |

### Sanctioned dependency: Zod in `src/shared/`

- **Decision.** Zod is the sanctioned runtime dependency for contract validation in `src/shared/`. Authority: `tech.md` ("Runtime validation: Zod", "Prefer `unknown` plus Zod parsing at boundaries") and ADR 0005 decision item 2. This closes finding C-3 of the T3.4 addendum. No new ADR is needed because steering already fixes the choice.
- **Boundary.** `shared` may import `zod` and nothing else outside itself. It may not import Electron, React, DOM or Node APIs (`structure.md`, R2.4). `tsconfig.shared.json` keeps `lib: ["ES2023"]` and `types: []`.
- **Consequence for bundles.** Zod is bundled into main and renderer. The sandboxed preload must not import any schema. It imports `IPC_CHANNELS` only, which keeps the preload single-file CommonJS and small (E-ESM-1).
- **Version.** The exact pinned version is recorded in `package.json` and `docs/architecture/dependency-versions.md`. This note does not repeat it.
- **Receiver rule.** A schema in `shared` does not replace validation. Main parses requests. The renderer adapter parses responses.

### Tests that guard the baseline

`src/shared/ipc/*.test.ts`, `ipc-contract.property.test.ts`, `src/preload/create-necroamp-api*.test.ts`. A future contract change updates these in the same task (owner: qa-engineer for property tests).
